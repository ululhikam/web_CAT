import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { createTestPrisma, ensureMasterData, integrationEnabled, resetTestData } from './setup';
import { createExamEngine, createExamUser } from './factory';
import type { ExamEngine } from './factory';

/**
 * F2-02 / F2-03 — `startSession` terhadap PostgreSQL nyata.
 *
 * Regresi yang dijaga:
 *
 *   B1 — unique index `(session_id, order_index)` pernah membuat
 *   `POST /exams/sessions` gagal untuk struktur 3 stage karena `order_index`
 *   dimulai ulang tiap stage (`[1,2,3,4,1,1]`). Kegagalan itu dulu disamarkan
 *   sebagai "kuota harian habis" (P2002 dipetakan ke 409
 *   `EXAM_SESSION_ALREADY_TODAY`), sehingga akar masalah tak terlihat.
 *
 *   Kuota harian — sesi kedua pada `exam_date` yang sama harus ditolak dengan
 *   kode yang benar, bukan error acak.
 */
describe.skipIf(!integrationEnabled)('startSession (Postgres)', () => {
  const prisma: PrismaClient = createTestPrisma();
  let engine: ExamEngine;

  beforeAll(async () => {
    await ensureMasterData(prisma);
    engine = createExamEngine(prisma);
  });

  beforeEach(async () => {
    // Hanya tabel transaksional; data master tetap ada dari `beforeAll`.
    await resetTestData(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function allSubtests(response: Awaited<ReturnType<ExamEngine['sessions']['startSession']>>) {
    return (
      response.session?.stages.flatMap((stage) =>
        stage.subtests.map((subtest) => ({
          stageId: stage.id,
          stageCode: stage.stageCode,
          id: subtest.id,
          code: subtest.subtestCode,
          orderIndex: subtest.orderIndex,
          status: subtest.status,
        })),
      ) ?? []
    );
  }

  it('F2-01: factory dapat membuat sesi lewat service (3 stage, 6 subtes, urutan benar)', async () => {
    const user = await createExamUser(prisma);

    const response = await engine.sessions.startSession(user.id);

    expect(response.session).not.toBeNull();
    expect(response.session!.status).toBe('IN_PROGRESS');

    const subtests = allSubtests(response);
    expect(subtests).toHaveLength(6);
    expect(subtests.map((subtest) => subtest.code)).toEqual([
      'KECERDASAN',
      'KEPRIBADIAN',
      'KECERMATAN',
      'PASS_HAND',
      'TKK',
      'TPK',
    ]);

    const stages = response.session!.stages;
    expect(stages).toHaveLength(3);
    expect(stages.map((stage) => stage.stageCode)).toEqual(['PSIKOLOGI', 'TKK', 'TPK']);

    // Subtes pertama READY, sisanya LOCKED.
    expect(subtests[0]!.status).toBe('READY');
    expect(subtests.slice(1).every((subtest) => subtest.status === 'LOCKED')).toBe(true);

    // Subtes pertama yang ditawarkan = KECERDASAN.
    expect(response.currentSubtest?.subtestCode).toBe('KECERDASAN');
    expect(response.currentStageCode).toBe('PSIKOLOGI');
  });

  it('F2-02: `order_index` boleh berulang antar-stage (regresi B1)', async () => {
    const user = await createExamUser(prisma);
    const response = await engine.sessions.startSession(user.id);

    // Nilai yang akan gagal bila unique `(session_id, order_index)` kembali.
    const orderIndexes = allSubtests(response).map((subtest) => subtest.orderIndex);
    expect(orderIndexes).toEqual([1, 2, 3, 4, 1, 1]);
    expect(new Set(orderIndexes).size).toBe(4);

    const rows = await prisma.examSessionSubtest.findMany({
      select: { subtestCode: true, orderIndex: true },
    });
    expect(rows).toHaveLength(6);
    // `subtest_code` tetap unik dalam satu sesi.
    expect(new Set(rows.map((row) => row.subtestCode)).size).toBe(6);
  });

  it('F2-03: sesi kedua ditolak selama sesi pertama masih aktif', async () => {
    const user = await createExamUser(prisma);
    await engine.sessions.startSession(user.id);

    await expect(engine.sessions.startSession(user.id)).rejects.toMatchObject({
      code: 'EXAM_SESSION_ACTIVE_EXISTS',
      status: 409,
    });
    expect(await prisma.examSession.count()).toBe(1);
  });

  it('F2-03: kuota harian habis menghasilkan EXAM_SESSION_ALREADY_TODAY', async () => {
    const user = await createExamUser(prisma);
    await engine.sessions.startSession(user.id);

    // Selesaikan 3 sesi berturut-turut untuk menghabiskan kuota harian (3 sesi).
    await prisma.examSession.updateMany({ data: { status: 'COMPLETED', finishedAt: new Date() } });
    await engine.sessions.startSession(user.id);
    await prisma.examSession.updateMany({ data: { status: 'COMPLETED', finishedAt: new Date() } });
    await engine.sessions.startSession(user.id);
    await prisma.examSession.updateMany({ data: { status: 'COMPLETED', finishedAt: new Date() } });

    await expect(engine.sessions.startSession(user.id)).rejects.toMatchObject({
      code: 'EXAM_SESSION_ALREADY_TODAY',
      status: 409,
    });
  });

  it('F2-03: sesi baru tetap boleh pada hari berikutnya', async () => {
    const user = await createExamUser(prisma);
    await engine.sessions.startSession(user.id);

    const yesterday = new Date(Date.now() - 86_400_000);
    await prisma.examSession.updateMany({
      data: { status: 'COMPLETED', finishedAt: new Date(), examDate: yesterday },
    });

    const fresh = await engine.sessions.startSession(user.id);
    expect(fresh.session?.status).toBe('IN_PROGRESS');
    expect(await prisma.examSession.count()).toBe(2);
  });
});
