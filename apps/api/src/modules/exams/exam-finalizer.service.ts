import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  AnswerPayload,
  LockReason,
  SessionStatus,
  SubtestCode,
  SubtestStatus,
} from '@webcat/contracts';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ScoringService } from '../scoring/scoring.service';
import type { ScoringAnswer } from '../scoring/scoring.types';
import { hasPassed, stagePercentage, totalPercentage } from '../scoring/scoring.aggregation';
import { computeEndsAt } from './exam-clock';
import {
  asSessionStatus,
  asSubtestStatus,
  decimalToNumber,
  parseQuestionSnapshot,
  parseSessionConfig,
  parseSubtestConfig,
} from './exam-snapshot';
import type { SessionConfigSnapshot, StageConfigSnapshot, SubtestConfigSnapshot } from './types';

export type FinalizeReason =
  'COMPLETED' | 'TIME_EXPIRED' | 'VIOLATION' | 'MANUAL_SUPER_ADMIN' | 'ELIMINATED';

export interface FinalizeOptions {
  reason?: FinalizeReason;
  note?: string | null;
  now?: Date;
}

export interface RecomputeActor {
  id: string;
  ip?: string | null;
  userAgent?: string | null;
}

const TERMINAL_SUBTEST: readonly SubtestStatus[] = ['COMPLETED', 'EXPIRED', 'ELIMINATED'];
const TERMINAL_SESSION: readonly SessionStatus[] = [
  'COMPLETED',
  'ELIMINATED',
  'EXPIRED',
  'ABANDONED',
  'VOIDED',
];

const ABANDON_AFTER_MS = 30 * 60_000;

@Injectable()
export class ExamFinalizerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: ScoringService,
    private readonly audit: AuditService,
  ) {}

  /* ------------------------------------------------------------------ finalisasi */

  async finalizeSubtest(
    subtestSessionId: string,
    options: FinalizeOptions = {},
  ): Promise<{ sessionId: string; subtestId: string; alreadyFinal: boolean } | null> {
    const now = options.now ?? new Date();

    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${subtestSessionId}))`;

        const subtest = await tx.examSessionSubtest.findUnique({
          where: { id: subtestSessionId },
          include: {
            session: true,
            sessionStage: true,
            questions: true,
            lock: true,
          },
        });
        if (!subtest) return null;

        if (TERMINAL_SUBTEST.includes(asSubtestStatus(subtest.status))) {
          return { sessionId: subtest.sessionId, subtestId: subtest.id, alreadyFinal: true };
        }
        if (subtest.session.status === 'VOIDED') {
          return { sessionId: subtest.sessionId, subtestId: subtest.id, alreadyFinal: true };
        }

        const sessionConfig = parseSessionConfig(subtest.session.configSnapshot);
        const subtestConfig =
          parseSubtestConfig(subtest.configSnapshot) ??
          this.findSubtestConfig(sessionConfig, subtest.subtestCode);
        if (!subtestConfig) {
          throw new NotFoundException({
            code: 'EXAM_SESSION_NOT_FOUND',
            message: 'Snapshot konfigurasi subtes tidak ditemukan',
          });
        }

        const reason: FinalizeReason =
          options.reason ??
          (subtest.endsAt && now.getTime() >= subtest.endsAt.getTime()
            ? 'TIME_EXPIRED'
            : 'COMPLETED');

        // Sesi yang sudah gugur tidak boleh menilai subtes berikutnya; cukup
        // kunci agar tidak ada operasi tulis yang lolos.
        if (subtest.session.status === 'ELIMINATED' && reason !== 'MANUAL_SUPER_ADMIN') {
          await tx.examSessionSubtest.update({
            where: { id: subtest.id },
            data: { status: 'ELIMINATED', finishedAt: now },
          });
          await this.upsertLock(tx, subtest.id, 'ELIMINATED', 'Sesi sudah gugur');
          return { sessionId: subtest.sessionId, subtestId: subtest.id, alreadyFinal: false };
        }

        const answers: ScoringAnswer[] = subtest.questions
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((question) => ({
            questionId: question.id,
            position: question.position,
            columnIndex: question.columnIndex,
            snapshot: parseQuestionSnapshot(question.snapshot),
            answer: (question.answerPayload as unknown as AnswerPayload | null) ?? null,
            timeSpentMs: question.timeSpentMs,
          }));

        const score = this.scoring.score({
          strategy: subtestConfig.scoringStrategy,
          config: subtestConfig.scoringConfig,
          questionCount: subtestConfig.questionCount,
          durationMinutes: subtestConfig.durationMinutes,
          answers,
        });
        const passed = score.percentage >= subtestConfig.passingScore;
        const status: SubtestStatus =
          reason === 'TIME_EXPIRED'
            ? 'EXPIRED'
            : reason === 'ELIMINATED'
              ? 'ELIMINATED'
              : 'COMPLETED';

        await tx.examSessionSubtest.update({
          where: { id: subtest.id },
          data: {
            status,
            rawScore: score.rawScore,
            maxScore: score.maxScore,
            percentage: score.percentage,
            passed,
            answeredCount: score.metrics.attempted,
            correctCount: score.correct,
            wrongCount: score.wrong,
            blankCount: score.blank,
            consistencyIndex: score.metrics.consistencyIndex,
            resultProfile: score.metrics as unknown as Prisma.InputJsonValue,
            finishedAt: now,
            scoredAt: now,
          },
        });

        const lockReason: LockReason | null =
          reason === 'COMPLETED'
            ? null
            : reason === 'ELIMINATED'
              ? 'ELIMINATED'
              : (reason as LockReason);
        if (lockReason) {
          await this.upsertLock(tx, subtest.id, lockReason, options.note ?? null);
        }

        const stageConfig =
          sessionConfig.stages.find(
            (stage) =>
              stage.code === subtest.sessionStage.stageCode ||
              stage.stageId === subtest.sessionStage.stageId,
          ) ?? null;

        const stageSubtests = await tx.examSessionSubtest.findMany({
          where: { sessionStageId: subtest.sessionStageId },
          orderBy: { orderIndex: 'asc' },
        });
        const scoredStageSubtests = stageSubtests.filter((entry) =>
          TERMINAL_SUBTEST.includes(asSubtestStatus(entry.status)),
        );
        const stagePct = stagePercentage(
          scoredStageSubtests.map((entry) => ({
            percentage: decimalToNumber(entry.percentage),
            weight: this.findSubtestConfig(sessionConfig, entry.subtestCode)?.weight ?? 1,
            passed: entry.passed,
          })),
        );
        const stageComplete = stageSubtests.every((entry) =>
          TERMINAL_SUBTEST.includes(asSubtestStatus(entry.status)),
        );
        const stagePassed =
          stageComplete && stageConfig ? stagePct >= stageConfig.passingScore : null;

        await tx.examSessionStage.update({
          where: { id: subtest.sessionStageId },
          data: {
            percentage: stagePct,
            passed: stagePassed,
            status: stageComplete ? 'COMPLETED' : 'IN_PROGRESS',
            finishedAt: stageComplete ? now : null,
          },
        });

        if (subtestConfig.eliminationEnabled && !passed) {
          await this.markEliminated(
            tx,
            subtest.sessionId,
            subtest.subtestCode,
            `Subtes ${subtest.subtestCode} di bawah ambang gugur (${score.percentage} < ${subtestConfig.passingScore})`,
            now,
          );
          return { sessionId: subtest.sessionId, subtestId: subtest.id, alreadyFinal: false };
        }

        if (stageComplete && stageConfig?.eliminationEnabled && stagePassed === false) {
          await this.markEliminated(
            tx,
            subtest.sessionId,
            subtest.subtestCode,
            `Stage ${stageConfig.code} di bawah ambang gugur (${stagePct} < ${stageConfig.passingScore})`,
            now,
          );
          return { sessionId: subtest.sessionId, subtestId: subtest.id, alreadyFinal: false };
        }

        if (!stageComplete || stagePassed !== false) {
          await this.prepareNextSubtest(tx, subtest.sessionId, subtest, sessionConfig, now);
        }

        await this.maybeCompleteSession(tx, subtest.sessionId, now);

        return { sessionId: subtest.sessionId, subtestId: subtest.id, alreadyFinal: false };
      },
      { timeout: 20_000 },
    );
  }

  /* ------------------------------------------------------------------ reconcile */

  async reconcileSession(sessionId: string, now = new Date()): Promise<void> {
    const session = await this.prisma.examSession.findUnique({
      where: { id: sessionId },
      include: { subtests: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!session || TERMINAL_SESSION.includes(asSessionStatus(session.status))) return;

    if (
      session.status === 'CREATED' &&
      now.getTime() - session.createdAt.getTime() > ABANDON_AFTER_MS
    ) {
      await this.prisma.examSession.update({
        where: { id: session.id },
        data: { status: 'ABANDONED', finishedAt: now },
      });
      return;
    }

    for (const subtest of session.subtests) {
      if (
        subtest.status === 'ACTIVE' &&
        subtest.endsAt &&
        now.getTime() >= subtest.endsAt.getTime()
      ) {
        await this.finalizeSubtest(subtest.id, { reason: 'TIME_EXPIRED', now });
      }
    }

    const refreshed = await this.prisma.examSession.findUnique({
      where: { id: sessionId },
      include: { subtests: true },
    });
    if (!refreshed || refreshed.status === 'ELIMINATED') return;

    const allTerminal = refreshed.subtests.every((subtest) =>
      TERMINAL_SUBTEST.includes(asSubtestStatus(subtest.status)),
    );
    if (allTerminal && refreshed.status !== 'COMPLETED') {
      await this.prisma.$transaction(async (tx) => {
        await this.maybeCompleteSession(tx, sessionId, now);
      });
    }
  }

  /* ------------------------------------------------------------------ cron */

  async finalizeExpiredBatch(limit = 100): Promise<{
    processed: number;
    expired: number;
    abandoned: number;
  }> {
    const now = new Date();
    const expired = await this.prisma.examSessionSubtest.findMany({
      where: { status: 'ACTIVE', endsAt: { lte: now } },
      orderBy: { endsAt: 'asc' },
      take: limit,
      select: { id: true },
    });

    let processed = 0;
    for (const row of expired) {
      const result = await this.finalizeSubtest(row.id, { reason: 'TIME_EXPIRED', now });
      if (result) processed += 1;
    }

    const abandoned = await this.prisma.examSession.updateMany({
      where: {
        status: 'CREATED',
        createdAt: { lt: new Date(now.getTime() - ABANDON_AFTER_MS) },
      },
      data: { status: 'ABANDONED', finishedAt: now },
    });

    return { processed, expired: processed, abandoned: abandoned.count };
  }

  /* ------------------------------------------------------------------ aksi proctoring */

  async lockSubtestForViolation(
    subtestSessionId: string,
    note: string,
    now = new Date(),
  ): Promise<void> {
    await this.finalizeSubtest(subtestSessionId, {
      reason: 'VIOLATION',
      note,
      now,
    });
  }

  async eliminateSession(
    sessionId: string,
    reason: string,
    subtestCode: string | null = null,
    now = new Date(),
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${sessionId}))`;
      const session = await tx.examSession.findUnique({ where: { id: sessionId } });
      if (!session || TERMINAL_SESSION.includes(asSessionStatus(session.status))) return;
      await this.markEliminated(
        tx,
        sessionId,
        (subtestCode as SubtestCode | null) ?? session.eliminatedSubtestCode,
        reason,
        now,
      );
    });
  }

  /* ------------------------------------------------------------------ recompute */

  async recomputeSession(
    sessionId: string,
    actor: RecomputeActor,
  ): Promise<{ sessionId: string; scoringVersion: number }> {
    const now = new Date();
    const result = await this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${sessionId}))`;
        const session = await tx.examSession.findUnique({
          where: { id: sessionId },
          include: {
            stages: { orderBy: { stageOrder: 'asc' } },
            subtests: { orderBy: { orderIndex: 'asc' }, include: { questions: true } },
          },
        });
        if (!session) {
          throw new NotFoundException({
            code: 'EXAM_SESSION_NOT_FOUND',
            message: 'Sesi ujian tidak ditemukan',
          });
        }
        if (session.status === 'VOIDED') {
          return { sessionId, scoringVersion: session.scoringVersion };
        }

        const config = parseSessionConfig(session.configSnapshot);

        for (const subtest of session.subtests) {
          if (
            !TERMINAL_SUBTEST.includes(asSubtestStatus(subtest.status)) ||
            subtest.status === 'ELIMINATED'
          ) {
            continue;
          }
          const subtestConfig =
            parseSubtestConfig(subtest.configSnapshot) ??
            this.findSubtestConfig(config, subtest.subtestCode);
          if (!subtestConfig) continue;

          const answers: ScoringAnswer[] = subtest.questions
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((question) => ({
              questionId: question.id,
              position: question.position,
              columnIndex: question.columnIndex,
              snapshot: parseQuestionSnapshot(question.snapshot),
              answer: (question.answerPayload as unknown as AnswerPayload | null) ?? null,
              timeSpentMs: question.timeSpentMs,
            }));
          const score = this.scoring.score({
            strategy: subtestConfig.scoringStrategy,
            config: subtestConfig.scoringConfig,
            questionCount: subtestConfig.questionCount,
            durationMinutes: subtestConfig.durationMinutes,
            answers,
          });

          await tx.examSessionSubtest.update({
            where: { id: subtest.id },
            data: {
              rawScore: score.rawScore,
              maxScore: score.maxScore,
              percentage: score.percentage,
              passed: score.percentage >= subtestConfig.passingScore,
              answeredCount: score.metrics.attempted,
              correctCount: score.correct,
              wrongCount: score.wrong,
              blankCount: score.blank,
              consistencyIndex: score.metrics.consistencyIndex,
              resultProfile: score.metrics as unknown as Prisma.InputJsonValue,
              scoredAt: now,
            },
          });
        }

        const refreshedSubtests = await tx.examSessionSubtest.findMany({
          where: { sessionId },
          orderBy: { orderIndex: 'asc' },
        });

        for (const stage of session.stages) {
          const stageConfig =
            config.stages.find(
              (entry) => entry.code === stage.stageCode || entry.stageId === stage.stageId,
            ) ?? null;
          const stageSubtests = refreshedSubtests.filter(
            (subtest) => subtest.sessionStageId === stage.id,
          );
          const scored = stageSubtests.filter((subtest) =>
            TERMINAL_SUBTEST.includes(asSubtestStatus(subtest.status)),
          );
          const pct = stagePercentage(
            scored.map((subtest) => ({
              percentage: decimalToNumber(subtest.percentage),
              weight: this.findSubtestConfig(config, subtest.subtestCode)?.weight ?? 1,
              passed: subtest.passed,
            })),
          );
          const complete = stageSubtests.every((subtest) =>
            TERMINAL_SUBTEST.includes(asSubtestStatus(subtest.status)),
          );
          await tx.examSessionStage.update({
            where: { id: stage.id },
            data: {
              percentage: pct,
              passed: complete && stageConfig ? pct >= stageConfig.passingScore : null,
              status: complete ? 'COMPLETED' : stage.status,
            },
          });
        }

        const allTerminal = refreshedSubtests.every((subtest) =>
          TERMINAL_SUBTEST.includes(asSubtestStatus(subtest.status)),
        );
        let totalScore = decimalToNumber(session.totalScore);
        let passed = session.passed;

        if (session.status !== 'ELIMINATED' && allTerminal) {
          const stages = await tx.examSessionStage.findMany({
            where: { sessionId },
            orderBy: { stageOrder: 'asc' },
          });
          totalScore = totalPercentage(
            stages.map((stage) => {
              const stageConfig =
                config.stages.find(
                  (entry) => entry.code === stage.stageCode || entry.stageId === stage.stageId,
                ) ?? null;
              return {
                percentage: decimalToNumber(stage.percentage),
                weight: stageConfig?.weight ?? 0,
                passed: stage.passed,
              };
            }),
          );
          passed = hasPassed({
            eliminated: false,
            totalScore,
            totalPassingScore: config.totalPassingScore,
            stagePassed: stages.map((stage) => stage.passed),
            requireStagePass: false,
          });
        }

        const updated = await tx.examSession.update({
          where: { id: sessionId },
          data: {
            totalScore,
            passed,
            status:
              session.status === 'ELIMINATED'
                ? 'ELIMINATED'
                : allTerminal
                  ? 'COMPLETED'
                  : session.status,
            scoringVersion: { increment: 1 },
          },
          select: { scoringVersion: true },
        });

        return { sessionId, scoringVersion: updated.scoringVersion };
      },
      { timeout: 20_000 },
    );

    await this.audit.record({
      actorUserId: actor.id,
      action: 'exam.session.recomputed',
      entityType: 'exam_session',
      entityId: sessionId,
      metadata: { scoringVersion: result.scoringVersion },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return result;
  }

  /* ------------------------------------------------------------------ internal */

  private findSubtestConfig(
    config: SessionConfigSnapshot,
    code: string,
  ): SubtestConfigSnapshot | null {
    for (const stage of config.stages) {
      const found = stage.subtests.find((subtest) => subtest.code === code);
      if (found) return found;
    }
    return null;
  }

  private async upsertLock(
    tx: Prisma.TransactionClient,
    subtestSessionId: string,
    reason: LockReason,
    note: string | null,
  ): Promise<void> {
    await tx.subtestLock.upsert({
      where: { subtestSessionId },
      create: { subtestSessionId, reason, note },
      update: { reason, note, unlockedAt: null, unlockedBy: null },
    });
  }

  private async markEliminated(
    tx: Prisma.TransactionClient,
    sessionId: string,
    subtestCode: SubtestCode | null,
    reason: string,
    now: Date,
  ): Promise<void> {
    await tx.examSession.update({
      where: { id: sessionId },
      data: {
        status: 'ELIMINATED',
        eliminatedSubtestCode: subtestCode,
        eliminationReason: reason,
        finishedAt: now,
      },
    });

    const remaining = await tx.examSessionSubtest.findMany({
      where: {
        sessionId,
        status: { in: ['LOCKED', 'READY'] },
      },
      select: { id: true },
    });
    if (remaining.length > 0) {
      await tx.examSessionSubtest.updateMany({
        where: { id: { in: remaining.map((row) => row.id) } },
        data: { status: 'LOCKED' },
      });
      await tx.subtestLock.createMany({
        data: remaining.map((row) => ({
          subtestSessionId: row.id,
          reason: 'ELIMINATED' as LockReason,
          note: 'Sesi gugur',
        })),
        skipDuplicates: true,
      });
    }

    await tx.examSessionStage.updateMany({
      where: { sessionId, status: { in: ['CREATED', 'IN_PROGRESS'] } },
      data: { status: 'ELIMINATED' },
    });
  }

  private async prepareNextSubtest(
    tx: Prisma.TransactionClient,
    sessionId: string,
    current: {
      id: string;
      sessionStageId: string;
      orderIndex: number;
      finishedAt: Date | null;
      endsAt: Date | null;
    },
    config: SessionConfigSnapshot,
    now: Date,
  ): Promise<void> {
    const stages = await tx.examSessionStage.findMany({
      where: { sessionId },
      orderBy: { stageOrder: 'asc' },
    });
    const currentStage = stages.find((stage) => stage.id === current.sessionStageId);
    if (!currentStage) return;

    const subtests = await tx.examSessionSubtest.findMany({
      where: { sessionId },
      orderBy: { orderIndex: 'asc' },
    });

    const nextInStage = subtests.find(
      (subtest) =>
        subtest.sessionStageId === current.sessionStageId &&
        subtest.orderIndex > current.orderIndex &&
        subtest.status === 'LOCKED',
    );

    const nextStage = stages.find((stage) => stage.stageOrder > currentStage.stageOrder);
    const nextInNextStage = nextStage
      ? subtests.find(
          (subtest) =>
            subtest.sessionStageId === nextStage.id &&
            subtest.status === 'LOCKED' &&
            subtest.orderIndex ===
              Math.min(
                ...subtests
                  .filter((entry) => entry.sessionStageId === nextStage.id)
                  .map((entry) => entry.orderIndex),
              ),
        )
      : undefined;

    const next = nextInStage ?? nextInNextStage;
    if (!next) return;

    const nextConfig =
      parseSubtestConfig(next.configSnapshot) ??
      this.findSubtestConfig(config, next.subtestCode) ??
      null;

    const immediate = config.subtestTransition === 'immediate';
    const startedAt = immediate ? (current.finishedAt ?? current.endsAt ?? now) : null;
    const endsAt =
      immediate && nextConfig ? computeEndsAt(startedAt ?? now, nextConfig.durationMinutes) : null;

    await tx.examSessionSubtest.update({
      where: { id: next.id },
      data: { status: 'READY', startedAt, endsAt },
    });

    if (nextInNextStage && nextStage && !nextInStage) {
      await tx.examSessionStage.update({
        where: { id: nextStage.id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: nextStage.startedAt ?? now,
          availableFrom: nextStage.availableFrom ?? now,
        },
      });
    }
  }

  private async maybeCompleteSession(
    tx: Prisma.TransactionClient,
    sessionId: string,
    now: Date,
  ): Promise<void> {
    const session = await tx.examSession.findUnique({
      where: { id: sessionId },
      include: {
        stages: { orderBy: { stageOrder: 'asc' } },
        subtests: { orderBy: { orderIndex: 'asc' } },
      },
    });
    if (!session || TERMINAL_SESSION.includes(asSessionStatus(session.status))) return;

    const allTerminal = session.subtests.every((subtest) =>
      TERMINAL_SUBTEST.includes(asSubtestStatus(subtest.status)),
    );
    if (!allTerminal) return;

    const config = parseSessionConfig(session.configSnapshot);
    const totalScore = totalPercentage(
      session.stages.map((stage) => {
        const stageConfig =
          config.stages.find(
            (entry) => entry.code === stage.stageCode || entry.stageId === stage.stageId,
          ) ?? null;
        return {
          percentage: decimalToNumber(stage.percentage),
          weight: stageConfig?.weight ?? 0,
          passed: stage.passed,
        };
      }),
    );
    const passed = hasPassed({
      eliminated: false,
      totalScore,
      totalPassingScore: config.totalPassingScore,
      stagePassed: session.stages.map((stage) => stage.passed),
      requireStagePass: false,
    });

    await tx.examSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        totalScore,
        passed,
        finishedAt: now,
      },
    });
  }
}

/* ------------------------------------------------------------------ helper ekspor */

export function stageOf(config: SessionConfigSnapshot, code: string): StageConfigSnapshot | null {
  return config.stages.find((stage) => stage.code === code) ?? null;
}
