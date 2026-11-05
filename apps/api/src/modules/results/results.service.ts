import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  AdminSessionDetail,
  AdminSessionPage,
  AdminSessionQuery,
  AdminSessionRow,
  ExamDashboardStats,
  ExamHistoryItem,
  ExamResultView,
  ExamStatsView,
  HistoryQuery,
  LockReason,
  SessionStatus,
  StageCode,
  SubtestCode,
  SubtestMetrics,
  SubtestResultView,
} from '@webcat/contracts';
import { AppError } from '../../core/http/app-error';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { computeEndsAt } from '../exams/exam-clock';
import { ExamConfigService } from '../exams/exam-config.service';
import { ExamFinalizerService } from '../exams/exam-finalizer.service';
import { ExamSessionService } from '../exams/exam-session.service';
import {
  asSessionStatus,
  asSubtestStatus,
  decimalToNumber,
  parseSessionConfig,
  parseSubtestConfig,
} from '../exams/exam-snapshot';

const TERMINAL_SESSION: readonly SessionStatus[] = [
  'COMPLETED',
  'ELIMINATED',
  'EXPIRED',
  'ABANDONED',
];
const TERMINAL_SUBTEST = ['COMPLETED', 'EXPIRED', 'ELIMINATED'] as const;

export interface AdminActor {
  id: string;
  ip?: string | null;
  userAgent?: string | null;
}

type ResultSessionRow = Prisma.ExamSessionGetPayload<{
  include: {
    stages: { include: { subtests: { include: { lock: true } } } };
    violations: true;
  };
}>;

type AdminSessionRowWithRelations = Prisma.ExamSessionGetPayload<{
  include: {
    user: true;
    subtests: true;
    violations: true;
  };
}>;

@Injectable()
export class ResultsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: ExamSessionService,
    private readonly finalizer: ExamFinalizerService,
    private readonly audit: AuditService,
    private readonly config: ExamConfigService,
  ) {}

  /* ------------------------------------------------------------------ peserta */

  async getResult(userId: string, sessionId: string): Promise<ExamResultView> {
    // Lazy reconcile: hasil tetap tersedia meski cron mati dan timer baru saja
    // melewati `ends_at`.
    await this.finalizer.reconcileSession(sessionId);

    const row = await this.prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        stages: {
          orderBy: { stageOrder: 'asc' },
          include: {
            subtests: {
              orderBy: { orderIndex: 'asc' },
              include: { lock: true },
            },
          },
        },
        violations: true,
      },
    });

    if (!row || row.userId !== userId) {
      throw new NotFoundException({
        code: 'EXAM_SESSION_NOT_FOUND',
        message: 'Sesi ujian tidak ditemukan',
      });
    }
    if (!TERMINAL_SESSION.includes(asSessionStatus(row.status))) {
      throw new AppError({
        code: 'EXAM_SESSION_LOCKED',
        status: 409,
        message: 'Hasil belum tersedia selama sesi masih berjalan',
        details: { status: row.status },
      });
    }

    return this.toResultView(row);
  }

  private toResultView(row: ResultSessionRow): ExamResultView {
    const config = parseSessionConfig(row.configSnapshot);
    const stages = row.stages.map((stage) => {
      const stageConfig =
        config.stages.find(
          (entry) => entry.code === stage.stageCode || entry.stageId === stage.stageId,
        ) ?? null;
      return {
        id: stage.id,
        stageCode: stage.stageCode as StageCode,
        name: stageConfig?.name ?? stage.stageCode,
        orderIndex: stage.stageOrder,
        weight: stageConfig?.weight ?? 0,
        status: asSessionStatus(stage.status),
        percentage: decimalToNumber(stage.percentage),
        passed: stage.passed,
        subtests: stage.subtests.map((subtest) => {
          const subtestConfig =
            parseSubtestConfig(subtest.configSnapshot) ??
            stageConfig?.subtests.find((entry) => entry.code === subtest.subtestCode) ??
            null;
          return {
            id: subtest.id,
            subtestCode: subtest.subtestCode as SubtestCode,
            name: subtestConfig?.name ?? subtest.subtestCode,
            orderIndex: subtest.orderIndex,
            status: asSubtestStatus(subtest.status) as SubtestResultView['status'],
            scoringStrategy: subtestConfig?.scoringStrategy ?? 'KEYED_CORRECT',
            questionCount: subtestConfig?.questionCount ?? 0,
            rawScore: decimalToNumber(subtest.rawScore),
            maxScore: decimalToNumber(subtest.maxScore),
            percentage: decimalToNumber(subtest.percentage),
            weight: subtestConfig?.weight ?? 0,
            passed: subtest.passed,
            startedAt: subtest.startedAt?.toISOString() ?? null,
            finishedAt: subtest.finishedAt?.toISOString() ?? null,
            scoredAt: subtest.scoredAt?.toISOString() ?? null,
            lockReason:
              subtest.lock && !subtest.lock.unlockedAt
                ? ((subtest.lock.reason as LockReason | undefined) ?? null)
                : null,
            metrics: (subtest.resultProfile as unknown as SubtestMetrics | null) ?? null,
          };
        }),
      };
    });

    return {
      sessionId: row.id,
      status: asSessionStatus(row.status),
      examDate: row.examDate.toISOString().slice(0, 10),
      startedAt: row.startedAt?.toISOString() ?? null,
      finishedAt: row.finishedAt?.toISOString() ?? null,
      totalScore: decimalToNumber(row.totalScore),
      passed: row.passed,
      totalPassingScore: config.totalPassingScore,
      eliminatedSubtestCode: (row.eliminatedSubtestCode as SubtestCode | null) ?? null,
      eliminationReason: row.eliminationReason,
      scoringVersion: row.scoringVersion,
      stages,
      violations: row.violations.map((violation) => ({
        type: violation.type,
        count: violation.count,
        lastAt: violation.lastAt?.toISOString() ?? null,
      })),
    };
  }

  async history(
    userId: string,
    query: HistoryQuery,
  ): Promise<{
    items: ExamHistoryItem[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const cursor = query.cursor ? decodeCursor(query.cursor) : null;
    const rows = await this.prisma.examSession.findMany({
      where: {
        userId,
        voidedAt: null,
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: cursor.createdAt } },
                { createdAt: cursor.createdAt, id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      select: {
        id: true,
        examDate: true,
        status: true,
        totalScore: true,
        passed: true,
        startedAt: true,
        finishedAt: true,
        eliminatedSubtestCode: true,
        createdAt: true,
      },
    });

    const hasMore = rows.length > query.limit;
    const items = rows.slice(0, query.limit).map((row) => ({
      sessionId: row.id,
      examDate: row.examDate.toISOString().slice(0, 10),
      status: asSessionStatus(row.status),
      totalScore: decimalToNumber(row.totalScore),
      passed: row.passed,
      startedAt: row.startedAt?.toISOString() ?? null,
      finishedAt: row.finishedAt?.toISOString() ?? null,
      eliminatedSubtestCode: (row.eliminatedSubtestCode as SubtestCode | null) ?? null,
    }));
    const last = rows.at(query.limit - 1);

    return {
      items,
      nextCursor: hasMore && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null,
      hasMore,
    };
  }

  async stats(userId: string): Promise<ExamStatsView> {
    const [rows, settings] = await Promise.all([
      this.prisma.examSession.findMany({
        where: { userId, voidedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { subtests: true },
      }),
      this.config.getSettings(),
    ]);

    const completed = rows.filter((row) => row.status === 'COMPLETED');
    const eliminated = rows.filter((row) => row.status === 'ELIMINATED');
    const scored = rows.filter((row) => row.totalScore !== null);
    const totalScoreValues = scored
      .map((row) => decimalToNumber(row.totalScore))
      .filter((value): value is number => value !== null);
    const passedCount = completed.filter((row) => row.passed === true).length;

    const perSubtestMap = new Map<
      SubtestCode,
      { attempts: number; sum: number; best: number | null }
    >();
    for (const row of rows) {
      for (const subtest of row.subtests) {
        const percentage = decimalToNumber(subtest.percentage);
        if (percentage === null) continue;
        const code = subtest.subtestCode as SubtestCode;
        const current = perSubtestMap.get(code) ?? { attempts: 0, sum: 0, best: null };
        current.attempts += 1;
        current.sum += percentage;
        current.best = current.best === null ? percentage : Math.max(current.best, percentage);
        perSubtestMap.set(code, current);
      }
    }

    return {
      totalPassingScore: settings.totalPassingScore,
      totalSessions: rows.length,
      completedSessions: completed.length,
      eliminatedSessions: eliminated.length,
      passRate: completed.length === 0 ? 0 : round2((passedCount / completed.length) * 100),
      averageScore:
        totalScoreValues.length === 0
          ? null
          : round2(
              totalScoreValues.reduce((sum, value) => sum + value, 0) / totalScoreValues.length,
            ),
      bestScore: totalScoreValues.length === 0 ? null : Math.max(...totalScoreValues),
      lastScore: totalScoreValues[0] ?? null,
      trend: rows
        .slice(0, 10)
        .reverse()
        .map((row) => ({
          examDate: row.examDate.toISOString().slice(0, 10),
          totalScore: decimalToNumber(row.totalScore),
          passed: row.passed,
        })),
      perSubtest: [...perSubtestMap.entries()].map(([subtestCode, value]) => ({
        subtestCode,
        attempts: value.attempts,
        averagePercentage: round2(value.sum / value.attempts),
        bestPercentage: value.best,
      })),
    };
  }

  /* ------------------------------------------------------------------ admin monitoring */

  async adminList(query: AdminSessionQuery): Promise<AdminSessionPage> {
    const cursor = query.cursor ? decodeCursor(query.cursor) : null;
    const where: Prisma.ExamSessionWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.q
        ? {
            user: {
              OR: [
                { email: { contains: query.q, mode: 'insensitive' } },
                { fullName: { contains: query.q, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
      ...(cursor
        ? {
            OR: [
              { createdAt: { lt: cursor.createdAt } },
              { createdAt: cursor.createdAt, id: { lt: cursor.id } },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.examSession.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      include: {
        user: true,
        subtests: { orderBy: { orderIndex: 'asc' } },
        violations: true,
      },
    });

    const hasMore = rows.length > query.limit;
    const items = rows.slice(0, query.limit).map((row) => this.toAdminRow(row));
    const last = rows.at(query.limit - 1);

    return {
      items,
      nextCursor: hasMore && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null,
      hasMore,
    };
  }

  private toAdminRow(row: AdminSessionRowWithRelations): AdminSessionRow {
    const now = new Date();
    const current =
      row.subtests.find((subtest) => subtest.status === 'ACTIVE') ??
      row.subtests.find((subtest) => subtest.status === 'READY') ??
      null;
    return {
      id: row.id,
      userId: row.userId,
      userEmail: row.user.email,
      userFullName: row.user.fullName,
      examDate: row.examDate.toISOString().slice(0, 10),
      status: asSessionStatus(row.status),
      startedAt: row.startedAt?.toISOString() ?? null,
      finishedAt: row.finishedAt?.toISOString() ?? null,
      totalScore: decimalToNumber(row.totalScore),
      passed: row.passed,
      eliminatedSubtestCode: (row.eliminatedSubtestCode as SubtestCode | null) ?? null,
      currentSubtestCode: (current?.subtestCode as SubtestCode | undefined) ?? null,
      currentSubtestStatus: current ? asSubtestStatus(current.status) : null,
      remainingMs:
        current?.endsAt && current.status === 'ACTIVE'
          ? Math.max(0, current.endsAt.getTime() - now.getTime())
          : null,
      violationCount: row.violations.reduce((sum, violation) => sum + violation.count, 0),
    };
  }

  async adminDetail(sessionId: string): Promise<AdminSessionDetail> {
    const row = await this.prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        user: true,
        violations: { orderBy: { lastAt: 'desc' } },
        proctoring: { orderBy: { occurredAtServer: 'desc' }, take: 100 },
      },
    });
    if (!row) {
      throw new NotFoundException({
        code: 'EXAM_SESSION_NOT_FOUND',
        message: 'Sesi ujian tidak ditemukan',
      });
    }

    const active = await this.sessions.getSessionForAdmin(sessionId);
    if (!active.session) {
      throw new NotFoundException({
        code: 'EXAM_SESSION_NOT_FOUND',
        message: 'Sesi ujian tidak ditemukan',
      });
    }

    return {
      session: active.session,
      user: { id: row.user.id, email: row.user.email, fullName: row.user.fullName },
      violations: row.violations.map((violation) => ({
        type: violation.type,
        count: violation.count,
        actionTaken: violation.actionTaken,
        lastAt: violation.lastAt.toISOString(),
      })),
      proctoring: row.proctoring.map((event) => ({
        type: event.type,
        severity: event.severity,
        occurredAt: event.occurredAtServer.toISOString(),
        metadata: event.metadata,
      })),
    };
  }

  async adminDashboard(): Promise<ExamDashboardStats> {
    const rows = await this.prisma.examSession.findMany({
      where: { voidedAt: null },
      take: 500,
      orderBy: { createdAt: 'desc' },
      select: {
        status: true,
        passed: true,
        subtests: { select: { subtestCode: true, percentage: true, status: true } },
      },
    });

    const completed = rows.filter((row) => row.status === 'COMPLETED');
    const eliminated = rows.filter((row) => row.status === 'ELIMINATED');
    const inProgress = rows.filter(
      (row) => row.status === 'IN_PROGRESS' || row.status === 'CREATED',
    );

    const map = new Map<
      SubtestCode,
      { attempts: number; sum: number; passed: number; eliminationCount: number }
    >();
    for (const row of rows) {
      for (const subtest of row.subtests) {
        const code = subtest.subtestCode as SubtestCode;
        const current = map.get(code) ?? {
          attempts: 0,
          sum: 0,
          passed: 0,
          eliminationCount: 0,
        };
        const percentage = decimalToNumber(subtest.percentage);
        if (percentage !== null) {
          current.attempts += 1;
          current.sum += percentage;
          if (subtest.status === 'COMPLETED' && percentage >= 60) current.passed += 1;
        }
        if (subtest.status === 'ELIMINATED') current.eliminationCount += 1;
        map.set(code, current);
      }
    }

    return {
      totalSessions: rows.length,
      completed: completed.length,
      eliminated: eliminated.length,
      inProgress: inProgress.length,
      passRate:
        completed.length === 0
          ? 0
          : round2(
              (completed.filter((row) => row.passed === true).length / completed.length) * 100,
            ),
      perSubtest: [...map.entries()].map(([subtestCode, value]) => ({
        subtestCode,
        attempts: value.attempts,
        averagePercentage: value.attempts === 0 ? 0 : round2(value.sum / value.attempts),
        passRate: value.attempts === 0 ? 0 : round2((value.passed / value.attempts) * 100),
        eliminationCount: value.eliminationCount,
      })),
    };
  }

  /* ------------------------------------------------------------------ admin aksi */

  async voidSession(
    sessionId: string,
    reason: string,
    actor: AdminActor,
  ): Promise<{ sessionId: string; status: SessionStatus }> {
    const row = await this.prisma.examSession.findUnique({ where: { id: sessionId } });
    if (!row) {
      throw new NotFoundException({
        code: 'EXAM_SESSION_NOT_FOUND',
        message: 'Sesi ujian tidak ditemukan',
      });
    }

    const now = new Date();
    await this.prisma.examSession.update({
      where: { id: sessionId },
      data: { status: 'VOIDED', voidedAt: now, finishedAt: now },
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'exam.session.voided',
      entityType: 'exam_session',
      entityId: sessionId,
      metadata: { reason, previousStatus: row.status },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return { sessionId, status: 'VOIDED' };
  }

  async forceUnlock(
    sessionId: string,
    subtestId: string,
    reason: string,
    actor: AdminActor,
  ): Promise<{ sessionId: string; subtestId: string; status: 'ACTIVE'; endsAt: string }> {
    const row = await this.prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        stages: { orderBy: { stageOrder: 'asc' } },
        subtests: { orderBy: { orderIndex: 'asc' }, include: { lock: true } },
      },
    });
    if (!row) {
      throw new NotFoundException({
        code: 'EXAM_SESSION_NOT_FOUND',
        message: 'Sesi ujian tidak ditemukan',
      });
    }

    const subtest =
      row.subtests.find((entry) => entry.id === subtestId || entry.subtestId === subtestId) ?? null;
    if (!subtest) {
      throw new NotFoundException({
        code: 'EXAM_SESSION_NOT_FOUND',
        message: 'Subtes sesi tidak ditemukan',
      });
    }
    if (subtest.status === 'ACTIVE') {
      throw new AppError({
        code: 'COMMON_CONFLICT',
        status: 409,
        message: 'Subtes masih aktif',
      });
    }

    const config = parseSessionConfig(row.configSnapshot);
    const subtestConfig =
      parseSubtestConfig(subtest.configSnapshot) ??
      config.stages
        .flatMap((stage) => stage.subtests)
        .find((entry) => entry.code === subtest.subtestCode) ??
      null;
    if (!subtestConfig) {
      throw new AppError({
        code: 'COMMON_CONFLICT',
        status: 409,
        message: 'Konfigurasi subtes tidak ditemukan',
      });
    }

    const now = new Date();
    const endsAt = computeEndsAt(now, subtestConfig.durationMinutes);
    const stage = row.stages.find((entry) => entry.id === subtest.sessionStageId);

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${sessionId}))`;

      await tx.examSessionSubtest.update({
        where: { id: subtest.id },
        data: {
          status: 'ACTIVE',
          startedAt: now,
          endsAt,
          finishedAt: null,
          scoredAt: null,
          rawScore: null,
          maxScore: null,
          percentage: null,
          passed: null,
          consistencyIndex: null,
          resultProfile: Prisma.DbNull,
        },
      });

      if (subtest.lock) {
        await tx.subtestLock.update({
          where: { subtestSessionId: subtest.id },
          data: { unlockedAt: now, unlockedBy: actor.id, note: reason },
        });
      }

      await tx.examSession.update({
        where: { id: sessionId },
        data: {
          status: 'IN_PROGRESS',
          finishedAt: null,
          totalScore: null,
          passed: null,
          eliminatedSubtestCode: null,
          eliminationReason: null,
        },
      });

      if (stage) {
        await tx.examSessionStage.update({
          where: { id: stage.id },
          data: {
            status: 'IN_PROGRESS',
            finishedAt: null,
            percentage: null,
            passed: null,
          },
        });
      }

      const laterSubtests = row.subtests.filter(
        (entry) =>
          entry.id !== subtest.id &&
          (entry.sessionStageId !== subtest.sessionStageId ||
            entry.orderIndex > subtest.orderIndex),
      );
      if (laterSubtests.length > 0) {
        const laterIds = laterSubtests.map((entry) => entry.id);
        await tx.examSessionSubtest.updateMany({
          where: { id: { in: laterIds } },
          data: { status: 'LOCKED', startedAt: null, endsAt: null, finishedAt: null },
        });
        await tx.subtestLock.updateMany({
          where: { subtestSessionId: { in: laterIds } },
          data: { unlockedAt: now, unlockedBy: actor.id },
        });
        await tx.examSessionStage.updateMany({
          where: {
            sessionId,
            stageOrder: { gt: stage?.stageOrder ?? 0 },
          },
          data: { status: 'CREATED', startedAt: null, finishedAt: null },
        });
      }
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'exam.subtest.force_unlocked',
      entityType: 'exam_session_subtest',
      entityId: subtest.id,
      metadata: { sessionId, reason, subtestCode: subtest.subtestCode },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return {
      sessionId,
      subtestId: subtest.id,
      status: 'ACTIVE',
      endsAt: endsAt.toISOString(),
    };
  }

  async recompute(
    sessionId: string,
    actor: AdminActor,
  ): Promise<{ sessionId: string; scoringVersion: number }> {
    return this.finalizer.recomputeSession(sessionId, actor);
  }
}

/* ------------------------------------------------------------------ helper */

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function encodeCursor(value: { createdAt: Date; id: string }): string {
  return Buffer.from(`${value.createdAt.toISOString()}|${value.id}`, 'utf8').toString('base64url');
}

function decodeCursor(value: string): { createdAt: Date; id: string } | null {
  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8');
    const [datePart, id] = decoded.split('|');
    if (!datePart || !id) return null;
    const createdAt = new Date(datePart);
    if (Number.isNaN(createdAt.getTime())) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

export const terminalSubtestStatuses = TERMINAL_SUBTEST;
