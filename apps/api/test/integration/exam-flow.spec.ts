import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import type { AnswerItem, AnswerPayload } from '@webcat/contracts';
import { createTestPrisma, ensureMasterData, integrationEnabled, resetTestData } from './setup';
import { createExamEngine, createExamUser, findSubtest } from './factory';
import type { ExamEngine } from './factory';

/**
 * F2-06 / F2-07 — alur peserta penuh + autosave idempoten, terhadap Postgres.
 *
 * Urutan yang diuji mengikuti UI peserta:
 *   start → open → questions (2 halaman) → autosave → replay → heartbeat →
 *   events → finish → result → history.
 *
 * Kunci jawaban dibaca dari `exam_session_questions.snapshot` — kolom
 * server-only yang memang tidak pernah diproyeksikan ke peserta. Harness uji
 * boleh membacanya; API peserta tidak (dan itu juga diuji di sini).
 */
describe.skipIf(!integrationEnabled)('alur peserta (Postgres)', () => {
  const prisma: PrismaClient = createTestPrisma();
  let engine: ExamEngine;

  beforeAll(async () => {
    await ensureMasterData(prisma);
    engine = createExamEngine(prisma);
  });

  beforeEach(async () => {
    await resetTestData(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  /* ---------------------------------------------------------------- helper */

  /** Susun payload jawaban BENAR dari snapshot (khusus test). */
  function correctPayload(snapshot: Record<string, unknown>): AnswerPayload {
    const type = String(snapshot.type);

    if (type === 'LIKERT_STATEMENT') {
      const scale = typeof snapshot.scale === 'number' ? snapshot.scale : 5;
      return { value: Math.max(1, Math.round(scale / 2)) };
    }

    if (type === 'PASS_HAND_COLUMN') {
      const numbers = Array.isArray(snapshot.columnNumbers)
        ? (snapshot.columnNumbers as number[])
        : [];
      const values: string[] = [];
      for (let index = 0; index + 1 < numbers.length; index += 2) {
        values.push(String((numbers[index]! + numbers[index + 1]!) % 10));
      }
      return { values };
    }

    // Kecermatan: `text` dicocokkan dengan `missingElement.answer`.
    if (type === 'MISSING_ELEMENT') {
      const missing = snapshot.missingElement as { answer?: string } | null | undefined;
      return { text: missing?.answer ?? '0' };
    }

    const options = Array.isArray(snapshot.options)
      ? (snapshot.options as Array<{ id: string; isCorrect?: boolean }>)
      : [];
    const correct = options.filter((option) => option.isCorrect === true).map((option) => option.id);
    return { optionIds: correct };
  }

  /** Semua jawaban benar untuk satu subtes, sebagai item kontrak autosave. */
  async function buildAnswers(subtestSessionId: string): Promise<AnswerItem[]> {
    const rows = await prisma.examSessionQuestion.findMany({
      where: { subtestSessionId },
      orderBy: { position: 'asc' },
      select: { id: true, snapshot: true },
    });
    return rows.map((row) => ({
      questionId: row.id,
      payload: correctPayload(row.snapshot as Record<string, unknown>),
      timeSpentMs: 100,
    }));
  }

  /**
   * Tulis jawaban benar untuk SEMUA soal satu subtes dalam satu query.
   *
   * Ini jalur uji, bukan jalur peserta: dipakai agar test finalisasi + agregasi
   * tidak menghabiskan 22 transaksi autosave (jalur autosave sendiri sudah
   * diuji lewat `sessions.autosave` di atas dan di F2-07).
   */
  async function fillCorrectAnswers(subtestSessionId: string): Promise<number> {
    const rows = await prisma.examSessionQuestion.findMany({
      where: { subtestSessionId },
      select: { id: true, snapshot: true },
    });
    if (rows.length === 0) return 0;

    const values = rows.map((row) => {
      const payload = JSON.stringify(correctPayload(row.snapshot as Record<string, unknown>));
      return Prisma.sql`(${row.id}::uuid, ${payload}::jsonb)`;
    });

    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE exam_session_questions AS q
        SET answer_payload = v.payload,
            answered_at = now(),
            revision = q.revision + 1,
            time_spent_ms = q.time_spent_ms + 100
        FROM (VALUES ${Prisma.join(values)}) AS v(id, payload)
        WHERE q.id = v.id
      `,
    );

    return rows.length;
  }

  /* ---------------------------------------------------------------- F2-06 */

  it('F2-06: start → open → questions → autosave → heartbeat → events → finish → 6 subtes → result → history', async () => {
    const user = await createExamUser(prisma);

    // 1. start
    const started = await engine.sessions.startSession(user.id);
    const sessionId = started.session!.id;
    const kecerdasan = findSubtest(started.session!, 'KECERDASAN');

    // 2. open
    const opened = await engine.sessions.openSubtest(
      user.id,
      sessionId,
      kecerdasan.stageId,
      kecerdasan.id,
    );
    expect(opened.currentSubtest?.status).toBe('ACTIVE');
    expect(opened.clock?.remainingMs ?? 0).toBeGreaterThan(0);

    // 3. questions halaman pertama
    const page1 = await engine.sessions.getQuestions(user.id, sessionId, kecerdasan.id, {
      limit: 50,
    });
    expect(page1.items).toHaveLength(50);
    expect(page1.total).toBe(100);
    expect(page1.hasMore).toBe(true);
    expect(page1.nextCursor).toBeTruthy();
    expect(page1.clock.remainingMs).toBeGreaterThan(0);

    // Kunci jawaban tidak boleh bocor ke DTO peserta.
    const serialized = JSON.stringify(page1.items);
    expect(serialized).not.toContain('isCorrect');
    expect(serialized).not.toContain('dimensionMap');
    expect(serialized).not.toContain('pairGroup');
    expect(serialized).not.toContain('missingElement":{"left":"');
    expect(page1.items[0]?.answer ?? null).toBeNull();

    // 4. halaman kedua tanpa id duplikat
    const page2 = await engine.sessions.getQuestions(user.id, sessionId, kecerdasan.id, {
      limit: 50,
      cursor: Number(page1.nextCursor),
    });
    expect(page2.items).toHaveLength(50);
    expect(page2.hasMore).toBe(false);
    const ids = [...page1.items, ...page2.items].map((item) => item.id);
    expect(new Set(ids).size).toBe(100);

    // 5. autosave dua batch (batas kontrak 50 per kiriman)
    const answers = await buildAnswers(kecerdasan.id);
    expect(answers).toHaveLength(100);
    const saved1 = await engine.sessions.autosave(user.id, sessionId, kecerdasan.id, {
      clientSeq: 0,
      answers: answers.slice(0, 50),
    });
    const saved2 = await engine.sessions.autosave(user.id, sessionId, kecerdasan.id, {
      clientSeq: 1,
      answers: answers.slice(50),
    });
    expect(saved1.rejected).toEqual([]);
    expect(saved2.rejected).toEqual([]);
    expect(saved1.saved).toHaveLength(50);
    expect(saved2.saved).toHaveLength(50);

    // 6. heartbeat
    const heartbeat = await engine.sessions.heartbeat(user.id, sessionId);
    expect(heartbeat.sessionStatus).toBe('IN_PROGRESS');
    expect(heartbeat.clock?.remainingMs ?? 0).toBeGreaterThan(0);

    // 7. events (proctoring)
    const events = await engine.proctoring.recordEvents(
      user.id,
      sessionId,
      { events: [{ clientEventId: 'evt-1', type: 'TAB_BLUR' }] },
      { id: user.id },
    );
    expect(events.accepted).toBe(1);
    expect(events.actionTaken).toBeNull();

    // 8. finish subtes pertama
    const finished = await engine.sessions.finishSubtest(user.id, sessionId, kecerdasan.id);
    const finishedSubtest = finished.session?.stages
      .flatMap((stage) => stage.subtests)
      .find((subtest) => subtest.id === kecerdasan.id);
    expect(finishedSubtest?.status).toBe('COMPLETED');
    expect(finishedSubtest?.percentage).toBe(100);
    expect(finishedSubtest?.passed).toBe(true);

    // Result masih ditutup selama sesi berjalan.
    await expect(engine.results.getResult(user.id, sessionId)).rejects.toMatchObject({
      code: 'EXAM_SESSION_LOCKED',
      status: 409,
    });

    // 9. selesaikan 5 subtes sisanya dengan jawaban benar
    for (const code of ['KEPRIBADIAN', 'KECERMATAN', 'PASS_HAND', 'TPA', 'TPK']) {
      const target = findSubtest(finished.session!, code);
      await engine.sessions.openSubtest(user.id, sessionId, target.stageId, target.id);
      await fillCorrectAnswers(target.id);
      const after = await engine.sessions.finishSubtest(user.id, sessionId, target.id);
      const row = after.session?.stages
        .flatMap((stage) => stage.subtests)
        .find((subtest) => subtest.id === target.id);
      expect(row?.status).toBe('COMPLETED');
    }

    const sessionRow = await prisma.examSession.findUniqueOrThrow({ where: { id: sessionId } });
    expect(sessionRow.status).toBe('COMPLETED');
    expect(sessionRow.finishedAt).not.toBeNull();

    // 10. result
    const result = await engine.results.getResult(user.id, sessionId);
    expect(result.sessionId).toBe(sessionId);
    expect(result.status).toBe('COMPLETED');
    expect(result.totalScore).toBe(100);
    expect(result.passed).toBe(true);

    const resultSubtests = result.stages.flatMap((stage) => stage.subtests);
    expect(resultSubtests).toHaveLength(6);
    expect(resultSubtests.every((subtest) => subtest.status === 'COMPLETED')).toBe(true);
    expect(
      resultSubtests.find((subtest) => subtest.subtestCode === 'KECERDASAN')?.percentage,
    ).toBe(100);

    // 11. history memuat sesi ini
    const history = await engine.results.history(user.id, { limit: 20 });
    expect(history.items.map((item) => item.sessionId)).toContain(sessionId);
    expect(history.items.find((item) => item.sessionId === sessionId)?.status).toBe('COMPLETED');
  });

  /* ---------------------------------------------------------------- F2-07 */

  it('F2-07: replay `clientSeq` yang sama tidak menduplikasi jawaban', async () => {
    const user = await createExamUser(prisma);
    const started = await engine.sessions.startSession(user.id);
    const sessionId = started.session!.id;
    const kecerdasan = findSubtest(started.session!, 'KECERDASAN');

    await engine.sessions.openSubtest(user.id, sessionId, kecerdasan.stageId, kecerdasan.id);

    const answers = (await buildAnswers(kecerdasan.id)).slice(0, 10);
    const batch = { clientSeq: 7, answers };

    const first = await engine.sessions.autosave(user.id, sessionId, kecerdasan.id, batch);
    const second = await engine.sessions.autosave(user.id, sessionId, kecerdasan.id, batch);

    expect(first.rejected).toEqual([]);
    expect(first.saved).toHaveLength(10);
    expect(second.saved).toEqual(first.saved);

    // Satu baris event per (soal, clientSeq) — bukan 2×.
    expect(
      await prisma.examAnswerEvent.count({
        where: { sessionQuestionId: { in: first.saved } },
      }),
    ).toBe(10);

    // `clientSeq` berbeda = revisi jawaban: event bertambah, baris soal tetap.
    const third = await engine.sessions.autosave(user.id, sessionId, kecerdasan.id, {
      clientSeq: 8,
      answers,
    });
    expect(third.saved).toHaveLength(10);
    expect(
      await prisma.examAnswerEvent.count({
        where: { sessionQuestionId: { in: first.saved } },
      }),
    ).toBe(20);
    expect(
      await prisma.examSessionQuestion.count({ where: { subtestSessionId: kecerdasan.id } }),
    ).toBe(100);
  });

  it('F2-06: jawaban untuk soal di luar subtes ditolak, sisa batch tetap tersimpan', async () => {
    const user = await createExamUser(prisma);
    const started = await engine.sessions.startSession(user.id);
    const sessionId = started.session!.id;
    const kecerdasan = findSubtest(started.session!, 'KECERDASAN');

    await engine.sessions.openSubtest(user.id, sessionId, kecerdasan.stageId, kecerdasan.id);

    const valid = (await buildAnswers(kecerdasan.id)).slice(0, 2);
    const strangerQuestionId = '00000000-0000-0000-0000-000000000001';

    const result = await engine.sessions.autosave(user.id, sessionId, kecerdasan.id, {
      clientSeq: 1,
      answers: [
        ...valid,
        { questionId: strangerQuestionId, payload: { value: 3 }, timeSpentMs: 10 },
      ],
    });

    expect(result.saved).toHaveLength(2);
    expect(result.rejected).toEqual([
      { questionId: strangerQuestionId, code: 'QUESTION_NOT_FOUND' },
    ]);
  });
});
