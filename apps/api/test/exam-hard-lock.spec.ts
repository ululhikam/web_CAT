import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../src/core/prisma/prisma.service';
import { ExamSessionService } from '../src/modules/exams/exam-session.service';
import type { ExamFinalizerService } from '../src/modules/exams/exam-finalizer.service';
import type { ExamConfigService } from '../src/modules/exams/exam-config.service';
import type { ExamQuestionSource } from '../src/modules/exams/exam-question-source';
import type { ExamQuestionProjection } from '../src/modules/exams/exam-question-projection';

/**
 * DoD: hard lock setelah `ends_at` harus menolak autosave dengan 409 meski
 * cron tidak pernah berjalan. Test ini memakai Prisma palsu sehingga tidak
 * membutuhkan database.
 */

function buildService(options: { endsAt: Date; status?: string }) {
  const subtest = {
    id: 'sub-session-1',
    subtestId: 'subtest-real-1',
    status: options.status ?? 'ACTIVE',
    startedAt: new Date(options.endsAt.getTime() - 60_000),
    endsAt: options.endsAt,
    lock: null,
    configSnapshot: null,
  };
  const row = {
    id: 'session-1',
    userId: 'user-1',
    status: 'IN_PROGRESS',
    examDate: new Date('2026-01-02T00:00:00.000Z'),
    startedAt: new Date('2026-01-02T08:00:00.000Z'),
    finishedAt: null,
    totalScore: null,
    passed: null,
    eliminatedSubtestCode: null,
    scoringVersion: 1,
    stages: [],
    subtests: [subtest],
    violations: [],
  };

  const prisma = {
    examSession: {
      findUnique: vi.fn(async () => row),
    },
  } as unknown as PrismaService;

  const finalizer = {
    reconcileSession: vi.fn(async () => undefined),
    finalizeSubtest: vi.fn(async () => null),
  } as unknown as ExamFinalizerService;

  const service = new ExamSessionService(
    prisma,
    {} as ExamConfigService,
    finalizer,
    {} as ExamQuestionSource,
    {} as ExamQuestionProjection,
    { check: vi.fn(), assertCanStartExam: vi.fn(), assertCanContinue: vi.fn() },
    { validate: vi.fn(), sample: vi.fn() },
  );

  return { service, finalizer };
}

describe('hard lock sesi ujian', () => {
  it('autosave setelah ends_at ditolak 409 dan memicu finalisasi lazy', async () => {
    const { service, finalizer } = buildService({
      endsAt: new Date(Date.now() - 1_000),
    });

    await expect(
      service.autosave('user-1', 'session-1', 'sub-session-1', {
        clientSeq: 1,
        answers: [
          {
            questionId: '00000000-0000-4000-8000-000000000001',
            payload: { optionIds: ['A'] },
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: 'EXAM_SUBTEST_LOCKED',
      status: 409,
    });

    expect(finalizer.finalizeSubtest).toHaveBeenCalledWith(
      'sub-session-1',
      expect.objectContaining({ reason: 'TIME_EXPIRED' }),
    );
  });

  it('mengambil soal setelah ends_at juga ditolak 409', async () => {
    const { service, finalizer } = buildService({
      endsAt: new Date(Date.now() - 1_000),
    });

    await expect(
      service.getQuestions('user-1', 'session-1', 'sub-session-1', { limit: 50 }),
    ).rejects.toMatchObject({
      code: 'EXAM_SUBTEST_LOCKED',
      status: 409,
    });

    expect(finalizer.finalizeSubtest).toHaveBeenCalled();
  });

  it('selesai setelah ends_at dicatat sebagai TIME_EXPIRED, bukan COMPLETED', async () => {
    const { service, finalizer } = buildService({
      endsAt: new Date(Date.now() - 1_000),
    });

    await service.finishSubtest('user-1', 'session-1', 'sub-session-1');

    expect(finalizer.finalizeSubtest).toHaveBeenCalledWith(
      'sub-session-1',
      expect.objectContaining({ reason: 'TIME_EXPIRED' }),
    );
  });

  it('autosave sebelum ends_at diteruskan ke validasi jawaban', async () => {
    const { service, finalizer } = buildService({
      endsAt: new Date(Date.now() + 60_000),
    });

    // Subtes aktif dan belum kedaluwarsa: service lanjut membaca soal. Prisma
    // palsu tidak menyediakan `examSessionQuestion`, jadi kegagalan yang
    // diharapkan adalah TypeError, bukan penolakan hard lock.
    await expect(
      service.autosave('user-1', 'session-1', 'sub-session-1', {
        clientSeq: 1,
        answers: [
          {
            questionId: '00000000-0000-4000-8000-000000000001',
            payload: { optionIds: ['A'] },
          },
        ],
      }),
    ).rejects.toBeInstanceOf(TypeError);

    expect(finalizer.finalizeSubtest).not.toHaveBeenCalled();
  });
});
