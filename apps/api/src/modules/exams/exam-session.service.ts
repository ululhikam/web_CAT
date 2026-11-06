import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  AccessPolicyPort,
  AnswerItem,
  AnswerPayload,
  ActiveSessionResponse,
  ClockState,
  ExamEligibility,
  ExamQuestionPage,
  ExamStageOption,
  HeartbeatResponse,
  LockReason,
  PoolShortage,
  QuestionPoolPort,
  SessionStatus,
  SessionSubtestSummary,
  StageCode,
  SubtestCode,
  SubtestStatus,
} from '@webcat/contracts';
import { answerPayloadSchema } from '@webcat/contracts';
import { AppError } from '../../core/http/app-error';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ACCESS_POLICY, QUESTION_POOL } from '../../core/ports/ports.module';
import { ExamConfigService } from './exam-config.service';
import { ExamFinalizerService } from './exam-finalizer.service';
import { anomalyEventId, detectAnswerAnomalies } from './answer-anomaly';
import { ExamQuestionProjection } from './exam-question-projection';
import { ExamQuestionSource } from './exam-question-source';
import {
  asSessionStatus,
  asSubtestStatus,
  decimalToNumber,
  parseQuestionSnapshot,
  parseSessionConfig,
  parseSubtestConfig,
} from './exam-snapshot';
import type { SessionConfigSnapshot, SubtestConfigSnapshot } from './types';
import { buildClock, computeEndsAt, lockedReasonFor, remainingMs } from './exam-clock';

/* ------------------------------------------------------------------ tipe baris */

type SessionRow = Prisma.ExamSessionGetPayload<{
  include: {
    stages: { include: { subtests: { include: { lock: true } } } };
    subtests: { include: { lock: true } };
    violations: true;
  };
}>;

type SessionStageRow = SessionRow['stages'][number];
type SessionSubtestRow = SessionStageRow['subtests'][number];

const SESSION_INCLUDE = {
  stages: {
    orderBy: { stageOrder: 'asc' as const },
    include: {
      subtests: {
        orderBy: { orderIndex: 'asc' as const },
        include: { lock: true },
      },
    },
  },
  subtests: {
    orderBy: { orderIndex: 'asc' as const },
    include: { lock: true },
  },
  violations: true,
};

const TERMINAL_SUBTEST: readonly SubtestStatus[] = ['COMPLETED', 'EXPIRED', 'ELIMINATED'];
const TERMINAL_SESSION: readonly SessionStatus[] = [
  'COMPLETED',
  'ELIMINATED',
  'EXPIRED',
  'ABANDONED',
  'VOIDED',
];

const DAY_MS = 86_400_000;

/**
 * Konteks aktor untuk pembatasan akses.
 *
 * `privileged` dipakai ADMIN/SUPER_ADMIN: mereka boleh membuka semua tes tanpa
 * langganan aktif dan tanpa batas kuota harian. Pemeriksaan teknis (sesi aktif,
 * ketersediaan bank soal) tetap berlaku agar data sesi tidak rusak.
 */
export interface SessionActor {
  privileged?: boolean;
}

@Injectable()
export class ExamSessionService {
  private readonly logger = new Logger(ExamSessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ExamConfigService,
    private readonly finalizer: ExamFinalizerService,
    private readonly questionSource: ExamQuestionSource,
    private readonly projection: ExamQuestionProjection,
    @Inject(ACCESS_POLICY) private readonly accessPolicy: AccessPolicyPort,
    @Inject(QUESTION_POOL) private readonly questionPool: QuestionPoolPort,
  ) {}

  /* ------------------------------------------------------------------ eligibility */

  /**
   * Konteks aktor untuk pembatasan akses.
   *
   * `privileged` dipakai ADMIN/SUPER_ADMIN: mereka boleh membuka semua tes
   * tanpa langganan aktif dan tanpa batas kuota harian. Pemeriksaan teknis
   * (sesi aktif, ketersediaan bank soal) tetap berlaku agar data sesi tidak
   * rusak.
   */
  async getEligibility(userId: string, actor: SessionActor = {}): Promise<ExamEligibility> {
    const privileged = actor.privileged === true;
    const now = new Date();
    const settings = await this.config.getSettings();
    const access = await this.accessPolicy.check(userId);
    const examDate = examDateFor(now, settings.timezone);

    const active = await this.safeFindActive(userId);
    const sessionsToday = await this.safeCountSessions(userId, examDate);
    const reasons = new Set<string>();

    // Admin tidak dibatasi langganan maupun kuota harian.
    if (!privileged) {
      if (!access.allowed) reasons.add(access.code);
      if (sessionsToday >= settings.maxSessionsPerDay) reasons.add('DAILY_LIMIT_REACHED');
    }
    // Sesi aktif tetap dilaporkan agar klien melanjutkannya, bukan membuat
    // sesi kedua (unique index harian juga akan menolaknya).
    if (active) reasons.add('ACTIVE_SESSION_EXISTS');

    const stages = await this.config.getSessionStages();
    const poolProblems: PoolShortage[] = [];
    const stageOptions: ExamStageOption[] = [];

    for (const stage of stages) {
      const stageProblems: PoolShortage[] = [];
      for (const subtest of stage.subtests) {
        try {
          const pool = await this.questionPool.validate(subtest.code, subtest.questionCount);
          if (!pool.ready) {
            // F4-09: teruskan rincian yang sudah dirumuskan pool, bukan
            // sekadar kode alasan.
            stageProblems.push(...(pool.problems ?? []));
          }
        } catch {
          stageProblems.push({
            subtestCode: subtest.code as SubtestCode,
            required: subtest.questionCount,
            available: 0,
            missing: subtest.questionCount,
            message: `Bank soal ${subtest.name} belum dapat diperiksa.`,
          });
        }
      }

      poolProblems.push(...stageProblems);
      stageOptions.push({
        code: stage.code as StageCode,
        name: stage.name,
        description: stage.description ?? null,
        orderIndex: stage.orderIndex,
        questionCount: stage.subtests.reduce((sum, subtest) => sum + subtest.questionCount, 0),
        durationMinutes: stage.subtests.reduce((sum, subtest) => sum + subtest.durationMinutes, 0),
        available: stageProblems.length === 0,
        reasons: stageProblems.length === 0 ? [] : ['EXAM_POOL_INSUFFICIENT'],
      });
    }

    // Bank soal hanya memblokir bila TIDAK ADA satu pun tes yang siap. Tes
    // tertentu yang kosong tetap tampil sebagai kartu nonaktif.
    const anyStageAvailable = stageOptions.some((stage) => stage.available);
    if (!anyStageAvailable) reasons.add('EXAM_POOL_INSUFFICIENT');

    const nextAvailableAt =
      !privileged && sessionsToday >= settings.maxSessionsPerDay
        ? nextLocalMidnight(now, settings.timezone).toISOString()
        : null;

    return {
      canStart: reasons.size === 0,
      reasons: [...reasons],
      poolProblems,
      activeSubscription: access.endsAt
        ? {
            endsAt: access.endsAt.toISOString(),
            remainingDays: Math.max(0, access.remainingDays),
          }
        : null,
      sessionsToday,
      nextAvailableAt,
      activeSessionId: active?.id ?? null,
      stages: stageOptions,
    };
  }

  private async safeFindActive(userId: string): Promise<{ id: string } | null> {
    try {
      return await this.prisma.examSession.findFirst({
        where: {
          userId,
          voidedAt: null,
          status: { in: ['CREATED', 'IN_PROGRESS'] },
        },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      return null;
    }
  }

  private async safeCountSessions(userId: string, examDate: Date): Promise<number> {
    try {
      return await this.prisma.examSession.count({
        where: {
          userId,
          examDate,
          voidedAt: null,
          status: { not: 'VOIDED' },
        },
      });
    } catch {
      return 0;
    }
  }

  /* ------------------------------------------------------------------ start */

  /**
   * F4-09: satu bentuk error untuk semua jalur "bank soal kurang", supaya
   * klien menerima `message` yang bisa dibaca dan `details.problems` lengkap.
   */
  private poolInsufficientError(problems: PoolShortage[]): AppError {
    const first = problems[0];

    return new AppError({
      code: 'EXAM_POOL_INSUFFICIENT',
      status: 409,
      message:
        first?.message ??
        'Bank soal belum mencukupi untuk memulai ujian. Hubungi admin untuk melengkapi bank soal.',
      details: {
        subtestCode: first?.subtestCode ?? null,
        required: first?.required ?? null,
        available: first?.available ?? null,
        missing: first?.missing ?? null,
        problems,
      },
    });
  }

  async startSession(
    userId: string,
    options: { stageCode?: StageCode } = {},
    actor: SessionActor = {},
  ): Promise<ActiveSessionResponse> {
    const privileged = actor.privileged === true;
    const eligibility = await this.getEligibility(userId, actor);
    if (eligibility.activeSessionId) {
      throw new AppError({
        code: 'EXAM_SESSION_ACTIVE_EXISTS',
        status: 409,
        message: 'Masih ada sesi ujian yang berjalan',
        details: { sessionId: eligibility.activeSessionId },
      });
    }
    if (eligibility.reasons.includes('DAILY_LIMIT_REACHED')) {
      throw new AppError({
        code: 'EXAM_SESSION_ALREADY_TODAY',
        status: 409,
        message: 'Kuota sesi ujian hari ini sudah habis',
        details: { nextAvailableAt: eligibility.nextAvailableAt },
      });
    }

    // Bila peserta memilih satu tes, hanya ketersediaan tes itu yang relevan.
    const selected = options.stageCode
      ? eligibility.stages.find((stage) => stage.code === options.stageCode)
      : null;

    if (options.stageCode && !selected) {
      throw new AppError({
        code: 'EXAM_STAGE_NOT_AVAILABLE',
        status: 409,
        message: 'Tes yang dipilih tidak tersedia',
        details: { stageCode: options.stageCode },
      });
    }

    if (selected && !selected.available) {
      throw this.poolInsufficientError(eligibility.poolProblems);
    }

    if (!selected && !eligibility.canStart) {
      // F4-09: bila satu-satunya penghalang adalah bank soal, jawab dengan
      // rincian subtes & kekurangannya — bukan `EXAM_SESSION_LOCKED` generik.
      if (eligibility.reasons.every((reason) => reason === 'EXAM_POOL_INSUFFICIENT')) {
        throw this.poolInsufficientError(eligibility.poolProblems);
      }
      throw new AppError({
        code: 'EXAM_SESSION_LOCKED',
        status: 409,
        message: 'Anda belum dapat memulai sesi ujian',
        details: { reasons: eligibility.reasons, poolProblems: eligibility.poolProblems },
      });
    }

    if (!privileged) {
      await this.accessPolicy.assertCanStartExam(userId);
    }

    const now = new Date();
    const baseSnapshot = await this.config.requireSessionSnapshot(now);
    const snapshot = this.scopeSnapshot(baseSnapshot, options.stageCode);
    const examDate = examDateFor(now, snapshot.timezone);

    for (const stage of snapshot.stages) {
      for (const subtest of stage.subtests) {
        const pool = await this.questionPool.validate(subtest.code, subtest.questionCount);
        if (!pool.ready) {
          throw this.poolInsufficientError(pool.problems ?? []);
        }
      }
    }

    let sessionId: string;
    try {
      sessionId = await this.prisma.$transaction(async (tx) => {
        // Kuota harian ditegakkan di sini (setelah index unik harian dihapus
        // pada F5-17) agar peserta dapat memilih tes berbeda pada hari yang
        // sama bila `max_sessions_per_day` mengizinkan. Advisory lock per
        // peserta mencegah dua permintaan paralel menembus kuota.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`exam-session:${userId}:${examDate.toISOString()}`}))`;

        if (!privileged) {
          const sessionsToday = await tx.examSession.count({
            where: {
              userId,
              examDate,
              voidedAt: null,
              status: { not: 'VOIDED' },
            },
          });
          if (sessionsToday >= snapshot.maxSessionsPerDay) {
            throw new AppError({
              code: 'EXAM_SESSION_ALREADY_TODAY',
              status: 409,
              message: 'Kuota sesi ujian hari ini sudah habis',
            });
          }
        }

        const created = await tx.examSession.create({
          data: {
            userId,
            status: 'IN_PROGRESS',
            examDate,
            startedAt: now,
            configSnapshot: snapshot as unknown as Prisma.InputJsonValue,
          },
          select: { id: true },
        });

        for (const [stageIndex, stage] of snapshot.stages.entries()) {
          const stageRow = await tx.examSessionStage.create({
            data: {
              sessionId: created.id,
              stageId: stage.stageId,
              stageCode: stage.code as StageCode,
              stageOrder: stage.orderIndex,
              status: stageIndex === 0 ? 'IN_PROGRESS' : 'CREATED',
              startedAt: stageIndex === 0 ? now : null,
            },
            select: { id: true },
          });

          for (const [subtestIndex, subtest] of stage.subtests.entries()) {
            await tx.examSessionSubtest.create({
              data: {
                sessionId: created.id,
                sessionStageId: stageRow.id,
                subtestId: subtest.subtestId,
                subtestCode: subtest.code as SubtestCode,
                orderIndex: subtest.orderIndex,
                status: stageIndex === 0 && subtestIndex === 0 ? 'READY' : 'LOCKED',
                configSnapshot: subtest as unknown as Prisma.InputJsonValue,
              },
            });
          }
        }

        return created.id;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = Array.isArray(error.meta?.target) ? (error.meta.target as string[]) : [];
        const constraint = typeof error.meta?.constraint === 'string' ? error.meta.constraint : '';

        // Hanya unique index sesi harian yang berarti "kuota hari ini habis".
        // Constraint lain (mis. bug skema) tidak boleh disamarkan jadi 409 —
        // itulah yang dulu menyembunyikan B1 (`session_id`, `order_index`).
        const isDailySessionLimit =
          constraint === 'exam_sessions_user_exam_date_active_key' ||
          (target.includes('user_id') && target.includes('exam_date'));

        if (isDailySessionLimit) {
          throw new AppError({
            code: 'EXAM_SESSION_ALREADY_TODAY',
            status: 409,
            message: 'Sesi ujian hari ini sudah pernah dibuat',
          });
        }

        this.logger.error(
          `P2002 tak terduga saat membuat sesi ujian (target: ${target.join(', ') || constraint || 'tidak diketahui'})`,
          error.stack,
        );
      }
      throw error;
    }

    const row = await this.loadSessionRow(sessionId);
    if (!row) {
      throw new NotFoundException({
        code: 'EXAM_SESSION_NOT_FOUND',
        message: 'Sesi ujian tidak ditemukan',
      });
    }
    return this.buildActiveResponse(row, now);
  }

  /**
   * Persempit snapshot konfigurasi menjadi satu tes saja (bila peserta memilih
   * satu tes dari layar pemilihan). `orderIndex` dinormalkan agar urutan tes
   * pada sesi tunggal tetap mulai dari 1.
   */
  private scopeSnapshot(
    snapshot: SessionConfigSnapshot,
    stageCode?: StageCode,
  ): SessionConfigSnapshot {
    if (!stageCode) return snapshot;

    const stages = snapshot.stages
      .filter((stage) => stage.code === stageCode)
      .map((stage, index) => ({ ...stage, orderIndex: index + 1 }));

    if (stages.length === 0) {
      throw new AppError({
        code: 'EXAM_STAGE_NOT_AVAILABLE',
        status: 409,
        message: 'Tes yang dipilih tidak tersedia',
        details: { stageCode },
      });
    }

    return { ...snapshot, stages };
  }

  async getActiveSession(userId: string): Promise<ActiveSessionResponse> {
    const now = new Date();
    let row: SessionRow | null = null;
    try {
      row = await this.prisma.examSession.findFirst({
        where: {
          userId,
          voidedAt: null,
          status: { in: ['CREATED', 'IN_PROGRESS'] },
        },
        include: SESSION_INCLUDE,
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      row = null;
    }

    if (!row) return this.emptyActiveResponse();

    await this.finalizer.reconcileSession(row.id, now);
    const refreshed = await this.loadSessionRow(row.id);
    if (!refreshed) return this.emptyActiveResponse();
    return this.buildActiveResponse(refreshed, now);
  }

  async getSession(userId: string, sessionId: string): Promise<ActiveSessionResponse> {
    const row = await this.loadOwnedSession(userId, sessionId);
    return this.buildActiveResponse(row, new Date());
  }

  /** Ringkasan untuk admin monitoring (tanpa cek kepemilikan). */
  async getSessionForAdmin(sessionId: string): Promise<ActiveSessionResponse> {
    const existing = await this.loadSessionRow(sessionId);
    if (!existing) {
      throw new NotFoundException({
        code: 'EXAM_SESSION_NOT_FOUND',
        message: 'Sesi ujian tidak ditemukan',
      });
    }
    if (existing.status === 'IN_PROGRESS' || existing.status === 'CREATED') {
      await this.finalizer.reconcileSession(sessionId);
    }
    const row = await this.loadSessionRow(sessionId);
    if (!row) {
      throw new NotFoundException({
        code: 'EXAM_SESSION_NOT_FOUND',
        message: 'Sesi ujian tidak ditemukan',
      });
    }
    return this.buildActiveResponse(row, new Date());
  }

  private emptyActiveResponse(): ActiveSessionResponse {
    return {
      session: null,
      currentStageCode: null,
      currentSubtest: null,
      nextSubtest: null,
      clock: null,
      lockedReason: null,
    };
  }

  /* ------------------------------------------------------------------ buka subtes */

  async openSubtest(
    userId: string,
    sessionId: string,
    stageId: string,
    subtestId: string,
    actor: SessionActor = {},
  ): Promise<ActiveSessionResponse> {
    const privileged = actor.privileged === true;
    const now = new Date();
    const row = await this.loadOwnedSession(userId, sessionId);
    if (TERMINAL_SESSION.includes(asSessionStatus(row.status))) {
      throw new AppError({
        code: row.status === 'ELIMINATED' ? 'EXAM_SESSION_ELIMINATED' : 'EXAM_SESSION_LOCKED',
        status: 409,
        message:
          row.status === 'ELIMINATED'
            ? 'Sesi ujian sudah dinyatakan gugur'
            : 'Sesi ujian sudah selesai',
      });
    }

    const { stage, subtest } = this.findSubtest(row, stageId, subtestId);
    if (subtest.status === 'ACTIVE') {
      return this.buildActiveResponse(row, now);
    }
    if (TERMINAL_SUBTEST.includes(asSubtestStatus(subtest.status))) {
      throw new AppError({
        code: 'EXAM_SUBTEST_LOCKED',
        status: 409,
        message: 'Subtes sudah ditutup dan tidak dapat dibuka kembali',
        details: { lockReason: subtest.lock?.reason ?? null },
      });
    }
    if (subtest.lock && !subtest.lock.unlockedAt) {
      throw new AppError({
        code: 'EXAM_SUBTEST_LOCKED',
        status: 409,
        message: 'Subtes terkunci',
        details: { lockReason: subtest.lock.reason },
      });
    }

    // Admin/super admin dapat membuka tes mana pun tanpa harus menuntaskan
    // subtes sebelumnya (mis. verifikasi bank soal per tes).
    if (!privileged) {
      this.assertPreviousSubtestsTerminal(row, stage, subtest);
    }

    const config = parseSessionConfig(row.configSnapshot);
    const subtestConfig =
      parseSubtestConfig(subtest.configSnapshot) ??
      config.stages
        .flatMap((entry) => entry.subtests)
        .find((entry) => entry.code === subtest.subtestCode) ??
      null;
    if (!subtestConfig) {
      throw new AppError({
        code: 'COMMON_CONFLICT',
        status: 409,
        message: 'Konfigurasi subtes tidak ditemukan pada snapshot sesi',
      });
    }

    const previousEndedAt = this.previousSubtestEndedAt(row, stage, subtest);
    const startedAt =
      config.subtestTransition === 'immediate' && previousEndedAt ? previousEndedAt : now;
    const endsAt = computeEndsAt(startedAt, subtestConfig.durationMinutes);

    await this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${subtest.id}))`;

        const fresh = await tx.examSessionSubtest.findUnique({
          where: { id: subtest.id },
          include: { lock: true },
        });
        if (!fresh) {
          throw new NotFoundException({
            code: 'EXAM_SESSION_NOT_FOUND',
            message: 'Subtes sesi tidak ditemukan',
          });
        }
        if (
          fresh.status === 'ACTIVE' ||
          TERMINAL_SUBTEST.includes(asSubtestStatus(fresh.status))
        ) {
          return;
        }

        await this.materializeQuestions(tx, fresh.id, fresh.subtestCode, subtestConfig);

        await tx.examSessionSubtest.update({
          where: { id: fresh.id },
          data: {
            status: 'ACTIVE',
            startedAt,
            endsAt,
            configSnapshot: subtestConfig as unknown as Prisma.InputJsonValue,
          },
        });
        await tx.examSessionStage.update({
          where: { id: stage.id },
          data: {
            status: 'IN_PROGRESS',
            startedAt: stage.startedAt ?? now,
          },
        });
        await tx.examSession.update({
          where: { id: row.id },
          data: { status: 'IN_PROGRESS' },
        });
      },
      // Materialisasi 500 soal (KECERMATAN) butuh lebih dari batas default
      // Prisma (5 s). Ini batas pengaman, bukan penutup masalah B2 — akar
      // masalahnya adalah pemakaian klien transaksi di `materializeQuestions`.
      { timeout: 20_000, maxWait: 10_000 },
    );

    if (now.getTime() >= endsAt.getTime()) {
      await this.finalizer.finalizeSubtest(subtest.id, { reason: 'TIME_EXPIRED', now });
    }

    const refreshed = await this.loadSessionRow(row.id);
    if (!refreshed) {
      throw new NotFoundException({
        code: 'EXAM_SESSION_NOT_FOUND',
        message: 'Sesi ujian tidak ditemukan',
      });
    }
    return this.buildActiveResponse(refreshed, new Date());
  }

  private async materializeQuestions(
    tx: Prisma.TransactionClient,
    subtestSessionId: string,
    subtestCode: string,
    config: SubtestConfigSnapshot,
  ): Promise<void> {
    const existing = await tx.examSessionQuestion.count({
      where: { subtestSessionId },
    });
    if (existing >= config.questionCount) return;

    const seeds = await this.questionSource.prepare(
      {
        subtestSessionId,
        subtestCode: subtestCode as SubtestCode,
        count: config.questionCount,
      },
      // Wajib memakai `tx`: root client akan meminjam koneksi kedua dan
      // deadlock saat `connection_limit=1` (B2).
      tx,
    );

    await tx.examSessionQuestion.createMany({
      data: seeds.map((seed) => ({
        subtestSessionId,
        questionId: seed.questionId,
        externalId: seed.externalId,
        position: seed.position,
        columnIndex: seed.columnIndex,
        optionOrder: seed.snapshot.options.map(
          (option) => option.id,
        ) as unknown as Prisma.InputJsonValue,
        snapshot: seed.snapshot as unknown as Prisma.InputJsonValue,
      })),
      skipDuplicates: true,
    });
  }

  private assertPreviousSubtestsTerminal(
    row: SessionRow,
    targetStage: SessionStageRow,
    targetSubtest: SessionSubtestRow,
  ): void {
    const blocking = row.subtests.filter((subtest) => {
      const stage = row.stages.find((entry) => entry.id === subtest.sessionStageId);
      if (!stage) return false;
      if (stage.stageOrder < targetStage.stageOrder) return true;
      return (
        stage.stageOrder === targetStage.stageOrder && subtest.orderIndex < targetSubtest.orderIndex
      );
    });

    const unfinished = blocking.find(
      (subtest) => !TERMINAL_SUBTEST.includes(asSubtestStatus(subtest.status)),
    );
    if (unfinished) {
      throw new AppError({
        code: 'EXAM_STAGE_LOCKED',
        status: 409,
        message: 'Selesaikan subtes sebelumnya terlebih dahulu',
        details: { subtestCode: unfinished.subtestCode, status: unfinished.status },
      });
    }
  }

  private previousSubtestEndedAt(
    row: SessionRow,
    targetStage: SessionStageRow,
    targetSubtest: SessionSubtestRow,
  ): Date | null {
    const candidates = row.subtests
      .map((subtest) => {
        const stage = row.stages.find((entry) => entry.id === subtest.sessionStageId);
        return stage ? { subtest, stage } : null;
      })
      .filter(
        (entry): entry is { subtest: SessionSubtestRow; stage: SessionStageRow } =>
          entry !== null &&
          (entry.stage.stageOrder < targetStage.stageOrder ||
            (entry.stage.stageOrder === targetStage.stageOrder &&
              entry.subtest.orderIndex < targetSubtest.orderIndex)),
      )
      .sort(
        (a, b) =>
          a.stage.stageOrder - b.stage.stageOrder || a.subtest.orderIndex - b.subtest.orderIndex,
      );

    const last = candidates.at(-1)?.subtest;
    return last?.finishedAt ?? last?.endsAt ?? null;
  }

  /* ------------------------------------------------------------------ soal */

  async getQuestions(
    userId: string,
    sessionId: string,
    subtestId: string,
    query: { cursor?: number; limit: number },
  ): Promise<ExamQuestionPage> {
    const now = new Date();
    const row = await this.loadOwnedSession(userId, sessionId);
    const subtest = this.findSubtestById(row, subtestId);
    if (!subtest) {
      throw new NotFoundException({
        code: 'EXAM_SESSION_NOT_FOUND',
        message: 'Subtes sesi tidak ditemukan',
      });
    }

    if (subtest.status === 'LOCKED' || subtest.status === 'READY') {
      throw new AppError({
        code: 'EXAM_SUBTEST_NOT_ACTIVE',
        status: 409,
        message: 'Subtes belum dibuka',
      });
    }
    if (TERMINAL_SUBTEST.includes(asSubtestStatus(subtest.status))) {
      throw new AppError({
        code: 'EXAM_SUBTEST_LOCKED',
        status: 409,
        message: 'Subtes sudah ditutup',
        details: { lockReason: subtest.lock?.reason ?? null },
      });
    }
    if (subtest.endsAt && now.getTime() >= subtest.endsAt.getTime()) {
      await this.finalizer.finalizeSubtest(subtest.id, { reason: 'TIME_EXPIRED', now });
      throw new AppError({
        code: 'EXAM_SUBTEST_LOCKED',
        status: 409,
        message: 'Waktu subtes sudah habis',
        details: { lockReason: 'TIME_EXPIRED' },
      });
    }

    const cursor = query.cursor ?? 0;
    const limit = query.limit;
    const [rows, total] = await Promise.all([
      this.prisma.examSessionQuestion.findMany({
        where: { subtestSessionId: subtest.id, position: { gt: cursor } },
        orderBy: { position: 'asc' },
        take: limit,
        select: { id: true, position: true, snapshot: true, answerPayload: true },
      }),
      this.prisma.examSessionQuestion.count({ where: { subtestSessionId: subtest.id } }),
    ]);

    // F5-10: `ProjectionRow.answer` berasal dari kolom `answerPayload`. Tanpa
    // pemetaan ini jawaban peserta selalu kembali `null`, sehingga refresh tab
    // menampilkan soal kosong meski server sudah menyimpannya.
    const items = await this.projection.projectMany(
      rows.map((row) => ({
        id: row.id,
        position: row.position,
        snapshot: row.snapshot,
        answer: row.answerPayload,
      })),
    );
    const lastPosition = rows.at(-1)?.position ?? null;
    const hasMore = lastPosition !== null && lastPosition < total;

    return {
      items,
      nextCursor: hasMore ? String(lastPosition) : null,
      hasMore,
      total,
      clock: buildClock(
        {
          status: 'ACTIVE',
          startedAt: subtest.startedAt,
          endsAt: subtest.endsAt,
        },
        now,
      ),
    };
  }

  /* ------------------------------------------------------------------ autosave */

  async autosave(
    userId: string,
    sessionId: string,
    subtestId: string,
    input: { clientSeq: number; answers: AnswerItem[] },
  ): Promise<{
    saved: string[];
    rejected: Array<{ questionId: string; code: string }>;
    clock: ClockState;
    nextCursor: number | null;
  }> {
    const now = new Date();
    const row = await this.loadOwnedSession(userId, sessionId);
    const subtest = this.findSubtestById(row, subtestId);
    if (!subtest) {
      throw new NotFoundException({
        code: 'EXAM_SESSION_NOT_FOUND',
        message: 'Subtes sesi tidak ditemukan',
      });
    }

    if (subtest.status !== 'ACTIVE') {
      throw new AppError({
        code: TERMINAL_SUBTEST.includes(asSubtestStatus(subtest.status))
          ? 'EXAM_SUBTEST_LOCKED'
          : 'EXAM_SUBTEST_NOT_ACTIVE',
        status: 409,
        message: subtest.status === 'LOCKED' ? 'Subtes belum dibuka' : 'Subtes sudah ditutup',
        details: { lockReason: subtest.lock?.reason ?? null },
      });
    }
    if (!subtest.endsAt) {
      throw new AppError({
        code: 'EXAM_SUBTEST_NOT_ACTIVE',
        status: 409,
        message: 'Timer subtes belum berjalan',
      });
    }
    if (now.getTime() >= subtest.endsAt.getTime()) {
      await this.finalizer.finalizeSubtest(subtest.id, { reason: 'TIME_EXPIRED', now });
      throw new AppError({
        code: 'EXAM_SUBTEST_LOCKED',
        status: 409,
        message: 'Waktu subtes sudah habis; jawaban ditolak',
        details: {
          lockReason: 'TIME_EXPIRED',
          clock: buildClock(
            { status: 'EXPIRED', startedAt: subtest.startedAt, endsAt: subtest.endsAt },
            now,
          ),
        },
      });
    }

    const config = parseSubtestConfig(subtest.configSnapshot) ?? null;
    const durationMs = (config?.durationMinutes ?? 1) * 60_000;
    const ids = [...new Set(input.answers.map((answer) => answer.questionId))];
    const questions = await this.prisma.examSessionQuestion.findMany({
      where: { subtestSessionId: subtest.id, id: { in: ids } },
      select: { id: true, position: true, snapshot: true },
    });
    const byId = new Map(questions.map((question) => [question.id, question]));

    const saved: string[] = [];
    const rejected: Array<{ questionId: string; code: string }> = [];
    let createdCount = 0;
    const valid: Array<{
      questionId: string;
      position: number;
      payload: AnswerPayload;
      timeSpentMs: number;
    }> = [];

    for (const answer of input.answers) {
      const question = byId.get(answer.questionId);
      if (!question) {
        rejected.push({ questionId: answer.questionId, code: 'QUESTION_NOT_FOUND' });
        continue;
      }
      if (answer.timeSpentMs !== undefined && answer.timeSpentMs > durationMs) {
        rejected.push({ questionId: answer.questionId, code: 'COMMON_VALIDATION_FAILED' });
        continue;
      }

      const parsed = answerPayloadSchema.safeParse(answer.payload);
      if (!parsed.success) {
        rejected.push({ questionId: answer.questionId, code: 'COMMON_VALIDATION_FAILED' });
        continue;
      }

      const snapshot = parseQuestionSnapshot(question.snapshot);
      const validation = validateAnswerForSnapshot(snapshot, parsed.data);
      if (validation) {
        rejected.push({ questionId: answer.questionId, code: validation });
        continue;
      }

      valid.push({
        questionId: question.id,
        position: question.position,
        payload: parsed.data,
        timeSpentMs: answer.timeSpentMs ?? 0,
      });
    }

    await this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${subtest.id}))`;

        for (const item of valid) {
          const existing = await tx.examAnswerEvent.findUnique({
            where: {
              sessionQuestionId_clientSeq: {
                sessionQuestionId: item.questionId,
                clientSeq: input.clientSeq,
              },
            },
            select: { id: true },
          });
          if (existing) {
            saved.push(item.questionId);
            continue;
          }

          const isClearing = Boolean(item.payload.cleared);

          await tx.examSessionQuestion.update({
            where: { id: item.questionId },
            data: {
              answerPayload: isClearing
                ? Prisma.DbNull
                : (item.payload as unknown as Prisma.InputJsonValue),
              answeredAt: isClearing ? null : now,
              revision: { increment: 1 },
              timeSpentMs: { increment: item.timeSpentMs },
            },
          });

          await tx.examAnswerEvent.create({
            data: {
              sessionQuestionId: item.questionId,
              clientSeq: input.clientSeq,
              answerPayload: item.payload as unknown as Prisma.InputJsonValue,
              timeSpentMs: item.timeSpentMs,
              answeredAt: now,
            },
          });

          createdCount += 1;
          saved.push(item.questionId);
        }

        const allQuestions = await tx.examSessionQuestion.findMany({
          where: { subtestSessionId: subtest.id },
          select: { answerPayload: true },
        });
        const answeredCount = allQuestions.filter(
          (question) => question.answerPayload !== null,
        ).length;
        await tx.examSessionSubtest.update({
          where: { id: subtest.id },
          data: { answeredCount },
        });
      },
      // Satu batch maksimal 50 jawaban = ±100 query. Pada Supabase remote
      // (RTT ±100 ms) itu melewati batas default Prisma 5 s sehingga transaksi
      // ditutup paksa di tengah jalan. Batas ini memberi ruang, bukan menutupi
      // masalah: jumlah query tetap dijaga oleh `max(50)` di kontrak.
      { timeout: 30_000, maxWait: 10_000 },
    );

    // F5-13 — catat anomali waktu jawab. Dijalankan di luar transaksi autosave:
    // kegagalan pencatatan tidak boleh menggagalkan penyimpanan jawaban, dan
    // anomali tidak pernah mengubah status sesi.
    if (createdCount > 0) {
      await this.recordAnswerAnomalies(row.id, subtest.id, subtest.subtestCode).catch((cause) => {
        this.logger.warn(`Gagal mencatat anomali waktu jawab: ${String(cause)}`);
      });
    }

    const total = await this.prisma.examSessionQuestion.count({
      where: { subtestSessionId: subtest.id },
    });
    const maxPosition = valid.reduce((max, item) => Math.max(max, item.position), 0);
    const nextCursor = maxPosition > 0 && maxPosition < total ? maxPosition : null;

    return {
      saved,
      rejected,
      clock: buildClock(
        { status: 'ACTIVE', startedAt: subtest.startedAt, endsAt: subtest.endsAt },
        now,
      ),
      nextCursor,
    };
  }

  /* ------------------------------------------------------------------ anomali waktu jawab */

  /**
   * F5-13 — catat anomali waktu jawab sebagai sinyal proctoring.
   *
   * Hanya menulis `proctoring_events`; `exam_violations` tidak disentuh sehingga
   * tidak ada aksi otomatis (warn/lock/eliminate) yang menggugurkan peserta.
   *
   * Idempoten: `clientEventId` diturunkan dari `(tipe, soal)`, jadi autosave
   * berulang atas soal yang sama tidak menambah sinyal baru.
   */
  private async recordAnswerAnomalies(
    sessionId: string,
    subtestSessionId: string,
    subtestCode: string,
  ): Promise<void> {
    const questions = await this.prisma.examSessionQuestion.findMany({
      where: { subtestSessionId, answers: { some: {} } },
      select: {
        id: true,
        position: true,
        snapshot: true,
        answers: {
          orderBy: { clientSeq: 'asc' },
          select: { clientSeq: true, timeSpentMs: true },
        },
      },
    });
    if (questions.length === 0) return;

    const findings = detectAnswerAnomalies({
      subtestCode,
      questions: questions.map((question) => ({
        id: question.id,
        position: question.position,
        snapshot: parseQuestionSnapshot(question.snapshot),
      })),
      events: questions.flatMap((question) =>
        question.answers.map((answer) => ({
          sessionQuestionId: question.id,
          clientSeq: answer.clientSeq,
          timeSpentMs: answer.timeSpentMs,
        })),
      ),
    });
    if (findings.length === 0) return;

    const now = new Date();
    await this.prisma.proctoringEvent.createMany({
      data: findings.map((finding) => ({
        sessionId,
        clientEventId: anomalyEventId(finding.type, finding.sessionQuestionId),
        type: finding.type,
        severity: finding.severity,
        occurredAtServer: now,
        metadata: finding.metadata as Prisma.InputJsonValue,
      })),
      skipDuplicates: true,
    });
  }

  /* ------------------------------------------------------------------ selesai & heartbeat */

  async finishSubtest(
    userId: string,
    sessionId: string,
    subtestId: string,
  ): Promise<ActiveSessionResponse> {
    const now = new Date();
    const row = await this.loadOwnedSession(userId, sessionId);
    const subtest = this.findSubtestById(row, subtestId);
    if (!subtest) {
      throw new NotFoundException({
        code: 'EXAM_SESSION_NOT_FOUND',
        message: 'Subtes sesi tidak ditemukan',
      });
    }

    if (subtest.status === 'ACTIVE') {
      const expired = subtest.endsAt !== null && now.getTime() >= subtest.endsAt.getTime();
      await this.finalizer.finalizeSubtest(subtest.id, {
        reason: expired ? 'TIME_EXPIRED' : 'COMPLETED',
        now,
      });
    } else if (!TERMINAL_SUBTEST.includes(asSubtestStatus(subtest.status))) {
      throw new AppError({
        code: 'EXAM_SUBTEST_NOT_ACTIVE',
        status: 409,
        message: 'Subtes belum dibuka',
      });
    }

    const refreshed = await this.loadSessionRow(row.id);
    if (!refreshed) {
      throw new NotFoundException({
        code: 'EXAM_SESSION_NOT_FOUND',
        message: 'Sesi ujian tidak ditemukan',
      });
    }
    return this.buildActiveResponse(refreshed, new Date());
  }

  async heartbeat(userId: string, sessionId: string): Promise<HeartbeatResponse> {
    const now = new Date();
    const row = await this.loadOwnedSession(userId, sessionId);
    const current = this.currentSubtest(row);
    const subtest = current?.subtest ?? null;
    const warning = await this.latestWarning(row);

    return {
      clock: subtest
        ? buildClock(
            {
              status: asSubtestStatus(subtest.status),
              startedAt: subtest.startedAt,
              endsAt: subtest.endsAt,
            },
            now,
          )
        : {
            serverTime: now.toISOString(),
            endsAt: null,
            remainingMs: null,
            status: asSessionStatus(row.status),
          },
      sessionStatus: asSessionStatus(row.status),
      lockedReason: lockedReasonFor({
        sessionStatus: row.status,
        subtest: subtest
          ? {
              status: asSubtestStatus(subtest.status),
              lockReason: (subtest.lock?.reason as LockReason | undefined) ?? null,
            }
          : null,
      }),
      warning,
    };
  }

  private async latestWarning(row: SessionRow): Promise<HeartbeatResponse['warning']> {
    try {
      const violation = await this.prisma.examViolation.findFirst({
        where: { sessionId: row.id },
        orderBy: { lastAt: 'desc' },
      });
      if (!violation) return null;
      const config = parseSessionConfig(row.configSnapshot);
      const rule = config.violationPolicy.events[violation.type];
      if (!rule) return null;
      const warn = rule.actions.find((action) => action.action === 'WARN');
      const limit = warn?.at ?? Math.max(...rule.actions.map((action) => action.at));
      return {
        type: violation.type,
        count: violation.count,
        limit,
        message: config.violationPolicy.warningTemplate
          .replaceAll('{type}', violation.type)
          .replaceAll('{count}', String(violation.count))
          .replaceAll('{limit}', String(limit)),
      };
    } catch {
      return null;
    }
  }

  /* ------------------------------------------------------------------ helper baris */

  private async loadSessionRow(sessionId: string): Promise<SessionRow | null> {
    return this.prisma.examSession.findUnique({
      where: { id: sessionId },
      include: SESSION_INCLUDE,
    });
  }

  private async loadOwnedSession(userId: string, sessionId: string): Promise<SessionRow> {
    const row = await this.loadSessionRow(sessionId);
    if (!row || row.userId !== userId) {
      throw new NotFoundException({
        code: 'EXAM_SESSION_NOT_FOUND',
        message: 'Sesi ujian tidak ditemukan',
      });
    }

    if (row.status === 'IN_PROGRESS' || row.status === 'CREATED') {
      await this.finalizer.reconcileSession(row.id, new Date());
      const refreshed = await this.loadSessionRow(sessionId);
      if (!refreshed) {
        throw new NotFoundException({
          code: 'EXAM_SESSION_NOT_FOUND',
          message: 'Sesi ujian tidak ditemukan',
        });
      }
      return refreshed;
    }
    return row;
  }

  private findSubtest(
    row: SessionRow,
    stageId: string,
    subtestId: string,
  ): { stage: SessionStageRow; subtest: SessionSubtestRow } {
    const stage = row.stages.find((entry) => entry.id === stageId || entry.stageId === stageId);
    if (!stage) {
      throw new NotFoundException({
        code: 'EXAM_SESSION_NOT_FOUND',
        message: 'Stage sesi tidak ditemukan',
      });
    }
    const subtest = row.subtests.find(
      (entry) =>
        entry.sessionStageId === stage.id &&
        (entry.id === subtestId || entry.subtestId === subtestId),
    );
    if (!subtest) {
      throw new NotFoundException({
        code: 'EXAM_SESSION_NOT_FOUND',
        message: 'Subtes sesi tidak ditemukan',
      });
    }
    return { stage, subtest };
  }

  private findSubtestById(row: SessionRow, subtestId: string): SessionSubtestRow | null {
    return (
      row.subtests.find((entry) => entry.id === subtestId || entry.subtestId === subtestId) ?? null
    );
  }

  private currentSubtest(
    row: SessionRow,
  ): { stage: SessionStageRow; subtest: SessionSubtestRow } | null {
    const ordered = row.subtests
      .map((subtest) => {
        const stage = row.stages.find((entry) => entry.id === subtest.sessionStageId);
        return stage ? { stage, subtest } : null;
      })
      .filter(
        (entry): entry is { stage: SessionStageRow; subtest: SessionSubtestRow } => entry !== null,
      )
      .sort(
        (a, b) =>
          a.stage.stageOrder - b.stage.stageOrder || a.subtest.orderIndex - b.subtest.orderIndex,
      );

    return (
      ordered.find((entry) => entry.subtest.status === 'ACTIVE') ??
      ordered.find((entry) => entry.subtest.status === 'READY') ??
      null
    );
  }

  private buildActiveResponse(row: SessionRow, now: Date): ActiveSessionResponse {
    const config = parseSessionConfig(row.configSnapshot);
    const current = this.currentSubtest(row);
    const ordered = row.subtests
      .map((subtest) => {
        const stage = row.stages.find((entry) => entry.id === subtest.sessionStageId);
        return stage ? { stage, subtest } : null;
      })
      .filter(
        (entry): entry is { stage: SessionStageRow; subtest: SessionSubtestRow } => entry !== null,
      )
      .sort(
        (a, b) =>
          a.stage.stageOrder - b.stage.stageOrder || a.subtest.orderIndex - b.subtest.orderIndex,
      );

    const currentIndex = current
      ? ordered.findIndex((entry) => entry.subtest.id === current.subtest.id)
      : -1;
    const next =
      ordered.slice(currentIndex + 1).find((entry) => entry.subtest.status === 'READY')?.subtest ??
      null;

    return {
      session: this.toSessionSummary(row, config, now),
      currentStageCode: (current?.stage.stageCode as StageCode | undefined) ?? null,
      currentSubtest: current ? this.toSubtestSummary(current.subtest, config, now) : null,
      nextSubtest: next ? this.toSubtestSummary(next, config, now) : null,
      clock: current
        ? buildClock(
            {
              status: asSubtestStatus(current.subtest.status),
              startedAt: current.subtest.startedAt,
              endsAt: current.subtest.endsAt,
            },
            now,
          )
        : null,
      lockedReason: lockedReasonFor({
        sessionStatus: row.status,
        subtest: current
          ? {
              status: asSubtestStatus(current.subtest.status),
              lockReason: (current.subtest.lock?.reason as LockReason | undefined) ?? null,
            }
          : null,
      }),
    };
  }

  private toSessionSummary(row: SessionRow, config: SessionConfigSnapshot, now: Date) {
    const stages = row.stages
      .slice()
      .sort((a, b) => a.stageOrder - b.stageOrder)
      .map((stage) => {
        const stageConfig = config.stages.find(
          (entry) => entry.code === stage.stageCode || entry.stageId === stage.stageId,
        );
        return {
          id: stage.id,
          stageCode: stage.stageCode as StageCode,
          name: stageConfig?.name ?? stage.stageCode,
          orderIndex: stage.stageOrder,
          weight: stageConfig?.weight ?? 0,
          status: asSessionStatus(stage.status),
          percentage: decimalToNumber(stage.percentage),
          passed: stage.passed,
          subtests: row.subtests
            .filter((subtest) => subtest.sessionStageId === stage.id)
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((subtest) => this.toSubtestSummary(subtest, config, now)),
        };
      });

    return {
      id: row.id,
      status: asSessionStatus(row.status),
      examDate: row.examDate.toISOString().slice(0, 10),
      startedAt: row.startedAt?.toISOString() ?? null,
      finishedAt: row.finishedAt?.toISOString() ?? null,
      totalScore: decimalToNumber(row.totalScore),
      passed: row.passed,
      eliminatedSubtestCode: row.eliminatedSubtestCode,
      scoringVersion: row.scoringVersion,
      stages,
    };
  }

  private toSubtestSummary(
    row: SessionSubtestRow,
    config: SessionConfigSnapshot,
    now: Date,
  ): SessionSubtestSummary {
    const subtestConfig =
      parseSubtestConfig(row.configSnapshot) ??
      config.stages
        .flatMap((stage) => stage.subtests)
        .find((entry) => entry.code === row.subtestCode) ??
      null;
    const status = asSubtestStatus(row.status);
    const lockReason = row.lock && !row.lock.unlockedAt ? row.lock.reason : null;

    return {
      id: row.id,
      subtestCode: row.subtestCode as SubtestCode,
      name: subtestConfig?.name ?? row.subtestCode,
      orderIndex: row.orderIndex,
      status,
      questionCount: subtestConfig?.questionCount ?? 0,
      answeredCount: row.answeredCount,
      startedAt: row.startedAt?.toISOString() ?? null,
      endsAt: row.endsAt?.toISOString() ?? null,
      finishedAt: row.finishedAt?.toISOString() ?? null,
      remainingMs:
        row.endsAt && (status === 'ACTIVE' || status === 'READY')
          ? remainingMs(row.endsAt, now)
          : null,
      percentage: decimalToNumber(row.percentage),
      passed: row.passed,
      lockReason: (lockReason as LockReason | null) ?? null,
      scoringStrategy: subtestConfig?.scoringStrategy ?? 'KEYED_CORRECT',
    };
  }
}

/* ------------------------------------------------------------------ helper murni */

function validateAnswerForSnapshot(
  snapshot: ReturnType<typeof parseQuestionSnapshot>,
  payload: AnswerPayload,
): string | null {
  if (payload.cleared) {
    return null;
  }

  if (snapshot.type === 'LIKERT_STATEMENT') {
    const scale = snapshot.scale ?? 5;
    if (
      typeof payload.value !== 'number' ||
      !Number.isInteger(payload.value) ||
      payload.value < 1 ||
      payload.value > scale
    ) {
      return 'COMMON_VALIDATION_FAILED';
    }
    return null;
  }

  if (snapshot.type === 'PASS_HAND_COLUMN') {
    const pairs = Math.floor((snapshot.columnNumbers?.length ?? 0) / 2);
    if (!payload.values || payload.values.length > pairs) {
      return 'COMMON_VALIDATION_FAILED';
    }
    return null;
  }

  if (payload.optionIds && payload.optionIds.length > 0) {
    const allowed = new Set(snapshot.options.map((option) => option.id));
    if (payload.optionIds.some((id) => !allowed.has(id))) {
      return 'COMMON_VALIDATION_FAILED';
    }
    return null;
  }

  if (snapshot.type === 'MISSING_ELEMENT') {
    if (payload.text === undefined && payload.value === undefined) {
      return 'COMMON_VALIDATION_FAILED';
    }
    return null;
  }

  return 'COMMON_VALIDATION_FAILED';
}

export function dateKeyInTimeZone(date: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
    const month = parts.find((part) => part.type === 'month')?.value ?? '01';
    const day = parts.find((part) => part.type === 'day')?.value ?? '01';
    return `${year}-${month}-${day}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function examDateFor(date: Date, timeZone: string): Date {
  return new Date(`${dateKeyInTimeZone(date, timeZone)}T00:00:00.000Z`);
}

export function nextLocalMidnight(date: Date, timeZone: string): Date {
  const key = dateKeyInTimeZone(date, timeZone);
  const [year, month, day] = key.split('-').map((part) => Number(part));
  const utc = Date.UTC(year!, (month ?? 1) - 1, day ?? 1) + DAY_MS;
  return new Date(utc);
}
