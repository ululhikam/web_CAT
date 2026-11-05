import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { createTestPrisma, ensureMasterData, integrationEnabled, resetTestData } from './setup';
import { createExamEngine, createExamUser, findSubtest } from './factory';
import type { ExamEngine } from './factory';

/**
 * F2-04 / F2-05 — `openSubtest` terhadap PostgreSQL nyata.
 *
 * Jaring pengaman utama untuk **B2**: `materializeQuestions` dulu memakai root
 * Prisma client di dalam `$transaction`, sehingga meminjam koneksi kedua dan
 * timeout (`connection_limit=1`). Test ini gagal bila pola itu kembali.
 *
 * Selain itu dikunci:
 *   - subtes pertama ACTIVE dengan `ends_at = started_at + durationMinutes`;
 *   - membuka ulang subtes yang sama idempoten (tidak menambah soal);
 *   - subtes berikutnya tidak bisa dibuka sebelum yang sebelumnya terminal.
 */
describe.skipIf(!integrationEnabled)('openSubtest (Postgres)', () => {
  let prisma: PrismaClient;
  let engine: ExamEngine;

  beforeAll(async () => {
    prisma = createTestPrisma();
    await ensureMasterData(prisma);
    engine = createExamEngine(prisma);
  });

  beforeEach(async () => {
    await resetTestData(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('membuka KECERDASAN: ACTIVE, 100 soal termaterialisasi, timer 120 menit', async () => {
    const user = await createExamUser(prisma);
    const started = await engine.sessions.startSession(user.id);
    const kecerdasan = findSubtest(started.session!, 'KECERDASAN');

    const opened = await engine.sessions.openSubtest(
      user.id,
      started.session!.id,
      kecerdasan.stageId,
      kecerdasan.id,
    );

    expect(opened.currentSubtest?.subtestCode).toBe('KECERDASAN');
    expect(opened.currentSubtest?.status).toBe('ACTIVE');
    expect(opened.clock?.remainingMs).toBeGreaterThan(0);

    const [count, row] = await Promise.all([
      prisma.examSessionQuestion.count({ where: { subtestSessionId: kecerdasan.id } }),
      prisma.examSessionSubtest.findUniqueOrThrow({ where: { id: kecerdasan.id } }),
    ]);
    expect(count).toBe(100);
    expect(row.status).toBe('ACTIVE');
    expect(row.endsAt).not.toBeNull();
    expect(row.startedAt).not.toBeNull();

    // 120 menit sesuai konfigurasi seed, bukan angka yang ditulis di test.
    const durationMs = row.endsAt!.getTime() - row.startedAt!.getTime();
    expect(durationMs).toBe(120 * 60_000);

    // Urutan soal 1..100 tanpa celah.
    const positions = await prisma.examSessionQuestion.findMany({
      where: { subtestSessionId: kecerdasan.id },
      orderBy: { position: 'asc' },
      select: { position: true, externalId: true },
    });
    expect(positions.map((entry) => entry.position)).toEqual(
      Array.from({ length: 100 }, (_, index) => index + 1),
    );
    expect(new Set(positions.map((entry) => entry.externalId)).size).toBe(100);
  });

  it('membuka ulang subtes yang sama idempoten (soal tidak bertambah)', async () => {
    const user = await createExamUser(prisma);
    const started = await engine.sessions.startSession(user.id);
    const kecerdasan = findSubtest(started.session!, 'KECERDASAN');

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await engine.sessions.openSubtest(
        user.id,
        started.session!.id,
        kecerdasan.stageId,
        kecerdasan.id,
      );
    }

    expect(
      await prisma.examSessionQuestion.count({ where: { subtestSessionId: kecerdasan.id } }),
    ).toBe(100);
    expect(await prisma.examSessionSubtest.count({ where: { status: 'ACTIVE' } })).toBe(1);
  });

  it('menolak membuka subtes berikutnya sebelum subtes sebelumnya terminal', async () => {
    const user = await createExamUser(prisma);
    const started = await engine.sessions.startSession(user.id);
    const kepribadian = findSubtest(started.session!, 'KEPRIBADIAN');

    await expect(
      engine.sessions.openSubtest(
        user.id,
        started.session!.id,
        kepribadian.stageId,
        kepribadian.id,
      ),
    ).rejects.toMatchObject({ code: 'EXAM_STAGE_LOCKED', status: 409 });
  });

  it('KECERMATAN 500 soal termaterialisasi di bawah 5 detik (regresi B2)', async () => {
    const user = await createExamUser(prisma);
    const started = await engine.sessions.startSession(user.id);
    const kecermatan = findSubtest(started.session!, 'KECERMATAN');

    // Prasyarat urutan: tandai dua subtes sebelumnya terminal agar KECERMATAN
    // boleh dibuka. Status diubah langsung supaya test fokus ke materialisasi.
    await prisma.examSessionSubtest.updateMany({
      where: { subtestCode: { in: ['KECERDASAN', 'KEPRIBADIAN'] } },
      data: { status: 'COMPLETED', finishedAt: new Date() },
    });

    const before = Date.now();
    await engine.sessions.openSubtest(
      user.id,
      started.session!.id,
      kecermatan.stageId,
      kecermatan.id,
    );
    const elapsed = Date.now() - before;

    expect(elapsed).toBeLessThan(5_000);
    expect(
      await prisma.examSessionQuestion.count({ where: { subtestSessionId: kecermatan.id } }),
    ).toBe(500);

    // Subtes lain tidak ikut terisi.
    expect(
      await prisma.examSessionQuestion.count({ where: { subtestSessionId: { not: kecermatan.id } } }),
    ).toBe(0);
  });
});
