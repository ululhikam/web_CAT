import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { AccessPolicyPort, QuestionPoolPort } from '@webcat/contracts';
import type { PrismaService } from '../src/core/prisma/prisma.service';
import type { ExamConfigService } from '../src/modules/exams/exam-config.service';
import type { ExamFinalizerService } from '../src/modules/exams/exam-finalizer.service';
import type { ExamQuestionProjection } from '../src/modules/exams/exam-question-projection';
import type { ExamQuestionSource } from '../src/modules/exams/exam-question-source';
import { ExamSessionService } from '../src/modules/exams/exam-session.service';
import type { SessionConfigSnapshot } from '../src/modules/exams/types';

/**
 * F1-05 — pemetaan error `P2002` pada `startSession`.
 *
 * Sebelum perbaikan B1, SEMUA `P2002` dipetakan menjadi 409
 * `EXAM_SESSION_ALREADY_TODAY`. Akibatnya bug unique index
 * `(session_id, order_index)` menyamar sebagai "kuota harian habis", sehingga
 * akar masalahnya tidak terlihat. Test ini mengunci perilaku yang benar:
 *
 *   - `(user_id, exam_date)` → 409 `EXAM_SESSION_ALREADY_TODAY`
 *   - constraint lain        → error asli diteruskan (bukan 409 palsu)
 */

const SNAPSHOT: SessionConfigSnapshot = {
  capturedAt: new Date('2026-01-02T08:00:00.000Z').toISOString(),
  timezone: 'Asia/Jakarta',
  totalPassingScore: 60,
  maxSessionsPerDay: 3,
  gracePeriodShortMs: 3000,
  gracePeriodLongMs: 8000,
  subtestTransition: 'on_open',
  violationPolicy: { events: {}, warningTemplate: '{type} {count}/{limit}' } as never,
  stages: [],
};

function duplicateKey(target: string[]): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta: { target },
  });
}

/**
 * Satu tes yang bank soalnya siap.
 *
 * F5-17: tanpa tes yang siap, `getEligibility` selalu menambahkan
 * `EXAM_POOL_INSUFFICIENT` sehingga `startSession` berhenti sebelum membuat
 * baris sesi — sebagian besar test di bawah justru ingin menguji jalur
 * pembuatan sesi, jadi default-nya harus tes yang tersedia.
 */
const AVAILABLE_STAGES = [
  {
    code: 'PSIKOLOGI',
    subtests: [{ code: 'KECERDASAN', questionCount: 100 }],
  },
];

function buildService(options: {
  createError?: Prisma.PrismaClientKnownRequestError;
  pool?: Partial<QuestionPoolPort>;
  stages?: Array<{ code: string; subtests: Array<{ code: string; questionCount: number }> }>;
  /** F4-09: menguji bahwa alasan selain bank soal tetap memakai jalur generik. */
  access?: { allowed: boolean; code: string };
}) {
  const tx = {
    $executeRaw: vi.fn(async () => 1),
    examSession: {
      count: vi.fn(async () => 0),
      create: vi.fn(async () => {
        throw options.createError;
      }),
    },
    examSessionStage: { create: vi.fn(async () => ({ id: 'stage-1' })) },
    examSessionSubtest: { create: vi.fn(async () => ({ id: 'subtest-1' })) },
  };

  const prisma = {
    examSession: {
      findFirst: vi.fn(async () => null),
      count: vi.fn(async () => 0),
      findUnique: vi.fn(async () => null),
    },
    $transaction: vi.fn(async (fn: (client: typeof tx) => unknown) => fn(tx)),
  } as unknown as PrismaService;

  const config = {
    getSettings: vi.fn(async () => ({
      timezone: 'Asia/Jakarta',
      maxSessionsPerDay: 3,
      totalPassingScore: 60,
      gracePeriodShortMs: 3000,
      gracePeriodLongMs: 8000,
      subtestTransition: 'on_open',
      violationPolicy: {},
    })),
    getSessionStages: vi.fn(async () => options.stages ?? AVAILABLE_STAGES),
    requireSessionSnapshot: vi.fn(async () => SNAPSHOT),
  } as unknown as ExamConfigService;

  const accessPolicy = {
    check: vi.fn(async () => options.access ?? { allowed: true }),
    assertCanStartExam: vi.fn(async () => undefined),
  } as unknown as AccessPolicyPort;

  const questionPool = {
    validate: vi.fn(
      async () => ({ ready: true, available: 1, required: 1, missingSubtestCodes: [], problems: [] }),
    ),
    ...options.pool,
  } as unknown as QuestionPoolPort;

  const service = new ExamSessionService(
    prisma,
    config,
    {} as ExamFinalizerService,
    {} as ExamQuestionSource,
    {} as ExamQuestionProjection,
    accessPolicy,
    questionPool,
  );

  return { service, tx };
}

describe('startSession — pemetaan P2002', () => {
  it('P2002 pada (session_id, order_index) TIDAK menjadi EXAM_SESSION_ALREADY_TODAY', async () => {
    const error = duplicateKey(['session_id', 'order_index']);
    const { service } = buildService({ createError: error });
    const loggerSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    try {
      await expect(service.startSession('user-1')).rejects.toBe(error);
      expect(loggerSpy).toHaveBeenCalled();
    } finally {
      loggerSpy.mockRestore();
    }
  });

  it('P2002 pada (user_id, exam_date) menjadi EXAM_SESSION_ALREADY_TODAY', async () => {
    const { service } = buildService({
      createError: duplicateKey(['user_id', 'exam_date']),
    });

    await expect(service.startSession('user-1')).rejects.toMatchObject({
      code: 'EXAM_SESSION_ALREADY_TODAY',
      status: 409,
    });
  });
});

/* --------------------------------------------------- F4-09: pesan kekurangan */

const SHORTAGE = {
  subtestCode: 'KECERMATAN',
  required: 500,
  available: 412,
  missing: 88,
  message: 'Subtes Kecermatan: tersedia 412 soal, dibutuhkan 500 (kurang 88 soal).',
};

const STAGES_WITH_KECERMATAN = [
  {
    code: 'PSIKOLOGI',
    subtests: [{ code: 'KECERMATAN', questionCount: 500 }],
  },
];

describe('startSession — bank soal kurang (F4-09)', () => {
  function buildWithShortage() {
    return buildService({
      stages: STAGES_WITH_KECERMATAN,
      pool: {
        validate: vi.fn(async () => ({
          ready: false,
          available: 412,
          required: 500,
          missingSubtestCodes: ['KECERMATAN'],
          problems: [SHORTAGE],
        })),
      },
    });
  }

  it('kelayakan membawa poolProblems berisi subtes & kekurangan', async () => {
    const { service } = buildWithShortage();

    const eligibility = await service.getEligibility('user-1');

    expect(eligibility.canStart).toBe(false);
    expect(eligibility.reasons).toEqual(['EXAM_POOL_INSUFFICIENT']);
    expect(eligibility.poolProblems).toEqual([SHORTAGE]);
  });

  it('startSession menolak dengan message spesifik, bukan EXAM_SESSION_LOCKED', async () => {
    const { service } = buildWithShortage();

    await expect(service.startSession('user-1')).rejects.toMatchObject({
      code: 'EXAM_POOL_INSUFFICIENT',
      status: 409,
      message: SHORTAGE.message,
      details: {
        subtestCode: 'KECERMATAN',
        required: 500,
        available: 412,
        missing: 88,
        problems: [SHORTAGE],
      },
    });
  });

  it('alasan selain bank soal tetap memakai EXAM_SESSION_LOCKED + detail', async () => {
    const { service } = buildService({
      access: { allowed: false, code: 'SUBSCRIPTION_REQUIRED' },
    });

    await expect(service.startSession('user-1')).rejects.toMatchObject({
      code: 'EXAM_SESSION_LOCKED',
      status: 409,
      details: { reasons: ['SUBSCRIPTION_REQUIRED'] },
    });
  });
});
