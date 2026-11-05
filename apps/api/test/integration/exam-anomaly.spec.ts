import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import type { AnswerPayload } from '@webcat/contracts';
import { createTestPrisma, ensureMasterData, integrationEnabled, resetTestData } from './setup';
import { createExamEngine, createExamUser, findSubtest } from './factory';
import type { ExamEngine } from './factory';

/**
 * F5-13 — anomali waktu jawab tercatat sebagai sinyal proctoring.
 *
 * Yang dibuktikan terhadap Postgres sungguhan:
 *   - `time_spent_ms` disimpan per event (bukan hanya akumulatif per soal);
 *   - soal bergambar yang dijawab < 300 ms menulis satu baris
 *     `proctoring_events` berjenis `ANSWER_TOO_FAST_IMAGE`;
 *   - deret lima soal cepat khusus `KECERMATAN` menulis
 *     `ANSWER_TOO_FAST_STREAK`;
 *   - autosave ulang tidak menggandakan sinyal;
 *   - **tidak** ada baris `exam_violations` dan status sesi tidak berubah,
 *     karena anomali hanya catatan, bukan pelanggaran.
 */

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

  if (type === 'MISSING_ELEMENT') {
    const missing = snapshot.missingElement as { answer?: string } | null | undefined;
    return { text: missing?.answer ?? '0' };
  }

  const options = Array.isArray(snapshot.options)
    ? (snapshot.options as Array<{ id: string; isCorrect?: boolean }>)
    : [];
  return { optionIds: options.filter((option) => option.isCorrect === true).map((o) => o.id) };
}

describe.skipIf(!integrationEnabled)('anomali waktu jawab (Postgres)', () => {
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

  async function anomalyRows(sessionId: string) {
    return prisma.proctoringEvent.findMany({
      where: { sessionId, type: { startsWith: 'ANSWER_' } },
      orderBy: { occurredAtServer: 'asc' },
    });
  }

  /**
   * Isi jawaban benar untuk seluruh soal satu subtes dalam satu query.
   *
   * Jalur uji, bukan jalur peserta: dipakai agar subtes sebelumnya lulus
   * (tidak menggugurkan sesi) tanpa 100 transaksi autosave.
   */
  async function fillCorrectAnswers(subtestSessionId: string): Promise<void> {
    const rows = await prisma.examSessionQuestion.findMany({
      where: { subtestSessionId },
      select: { id: true, snapshot: true },
    });
    if (rows.length === 0) return;

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
            time_spent_ms = q.time_spent_ms + 1000
        FROM (VALUES ${Prisma.join(values)}) AS v(id, payload)
        WHERE q.id = v.id
      `,
    );
    await prisma.examSessionSubtest.update({
      where: { id: subtestSessionId },
      data: { answeredCount: rows.length },
    });
  }

  it('menandai soal bergambar yang dijawab 120 ms tanpa menggugurkan peserta', async () => {
    const user = await createExamUser(prisma);
    const started = await engine.sessions.startSession(user.id);
    const sessionId = started.session!.id;
    const kecerdasan = findSubtest(started.session!, 'KECERDASAN');
    await engine.sessions.openSubtest(user.id, sessionId, kecerdasan.stageId, kecerdasan.id);

    const questions = await prisma.examSessionQuestion.findMany({
      where: { subtestSessionId: kecerdasan.id },
      orderBy: { position: 'asc' },
      take: 1,
      select: { id: true, snapshot: true },
    });
    const question = questions[0]!;

    // Fixture pool tidak membawa media; tambahkan satu gambar STEM agar aturan
    // "soal bergambar" punya bahan. Ini meniru snapshot soal figural.
    const snapshot = {
      ...(question.snapshot as Record<string, unknown>),
      media: [{ role: 'STEM', path: 'media/test/gambar.webp', alt: null }],
    };
    await prisma.examSessionQuestion.update({
      where: { id: question.id },
      data: { snapshot: snapshot as Prisma.InputJsonValue },
    });

    const payload = correctPayload(snapshot);
    const first = await engine.sessions.autosave(user.id, sessionId, kecerdasan.id, {
      clientSeq: 0,
      answers: [{ questionId: question.id, payload, timeSpentMs: 120 }],
    });
    expect(first.rejected).toEqual([]);

    const events = await prisma.examAnswerEvent.findMany({
      where: { sessionQuestionId: question.id },
      select: { clientSeq: true, timeSpentMs: true },
    });
    expect(events).toEqual([{ clientSeq: 0, timeSpentMs: 120 }]);

    const rows = await anomalyRows(sessionId);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      type: 'ANSWER_TOO_FAST_IMAGE',
      severity: 'low',
      clientEventId: `answer-anomaly:ANSWER_TOO_FAST_IMAGE:${question.id}`,
    });
    expect(rows[0]!.metadata).toMatchObject({
      timeSpentMs: 120,
      thresholdMs: 300,
      changes: 1,
    });

    // Replay batch yang sama: idempoten.
    await engine.sessions.autosave(user.id, sessionId, kecerdasan.id, {
      clientSeq: 0,
      answers: [{ questionId: question.id, payload, timeSpentMs: 120 }],
    });
    expect(await anomalyRows(sessionId)).toHaveLength(1);

    // Anomali bukan pelanggaran: tidak ada baris violation dan sesi tetap jalan.
    const violations = await prisma.examViolation.count({
      where: { sessionId, type: { startsWith: 'ANSWER_' } },
    });
    expect(violations).toBe(0);
    const session = await prisma.examSession.findUniqueOrThrow({ where: { id: sessionId } });
    expect(session.status).toBe('IN_PROGRESS');
    expect(session.eliminatedSubtestCode).toBeNull();
  });

  it('tidak menandai soal tanpa gambar walau dijawab sangat cepat', async () => {
    const user = await createExamUser(prisma);
    const started = await engine.sessions.startSession(user.id);
    const sessionId = started.session!.id;
    const kecerdasan = findSubtest(started.session!, 'KECERDASAN');
    await engine.sessions.openSubtest(user.id, sessionId, kecerdasan.stageId, kecerdasan.id);

    const question = await prisma.examSessionQuestion.findFirstOrThrow({
      where: { subtestSessionId: kecerdasan.id },
      orderBy: { position: 'asc' },
      select: { id: true, snapshot: true },
    });

    await engine.sessions.autosave(user.id, sessionId, kecerdasan.id, {
      clientSeq: 0,
      answers: [
        {
          questionId: question.id,
          payload: correctPayload(question.snapshot as Record<string, unknown>),
          timeSpentMs: 50,
        },
      ],
    });

    expect(await anomalyRows(sessionId)).toEqual([]);
  });

  it('menandai deret lima soal cepat hanya pada KECERMATAN', async () => {
    const user = await createExamUser(prisma);
    const started = await engine.sessions.startSession(user.id);
    const sessionId = started.session!.id;

    const kecerdasan = findSubtest(started.session!, 'KECERDASAN');
    await engine.sessions.openSubtest(user.id, sessionId, kecerdasan.stageId, kecerdasan.id);
    await fillCorrectAnswers(kecerdasan.id);
    await engine.sessions.finishSubtest(user.id, sessionId, kecerdasan.id);

    // KECERMATAN ada di urutan ketiga stage 1, jadi KEPRIBADIAN harus selesai
    // dulu (kalau tidak, `openSubtest` menolak dengan EXAM_STAGE_LOCKED).
    const setelahKecerdasan = await engine.sessions.getSession(user.id, sessionId);
    const kepribadian = findSubtest(setelahKecerdasan.session!, 'KEPRIBADIAN');
    await engine.sessions.openSubtest(
      user.id,
      sessionId,
      kepribadian.stageId,
      kepribadian.id,
    );
    await fillCorrectAnswers(kepribadian.id);
    await engine.sessions.finishSubtest(user.id, sessionId, kepribadian.id);

    const refreshed = await engine.sessions.getSession(user.id, sessionId);
    const kecermatan = findSubtest(refreshed.session!, 'KECERMATAN');
    await engine.sessions.openSubtest(
      user.id,
      sessionId,
      kecermatan.stageId,
      kecermatan.id,
    );

    const questions = await prisma.examSessionQuestion.findMany({
      where: { subtestSessionId: kecermatan.id },
      orderBy: { position: 'asc' },
      take: 5,
      select: { id: true, position: true, snapshot: true },
    });
    expect(questions).toHaveLength(5);

    const answers = questions.map((question) => ({
      questionId: question.id,
      payload: correctPayload(question.snapshot as Record<string, unknown>),
      timeSpentMs: 50,
    }));

    const saved = await engine.sessions.autosave(user.id, sessionId, kecermatan.id, {
      clientSeq: 0,
      answers,
    });
    expect(saved.rejected).toEqual([]);

    const rows = await anomalyRows(sessionId);
    const streak = rows.filter((row) => row.type === 'ANSWER_TOO_FAST_STREAK');
    expect(streak).toHaveLength(1);
    expect(streak[0]!.severity).toBe('medium');
    expect(streak[0]!.metadata).toMatchObject({
      positions: [1, 2, 3, 4, 5],
      thresholdMs: 150,
      length: 5,
    });

    // Deret dilaporkan sekali walau hanya lima soal: soal ke-6 yang lambat
    // tidak boleh menghapus temuan sebelumnya.
    const violations = await prisma.examViolation.count({
      where: { sessionId, type: { startsWith: 'ANSWER_' } },
    });
    expect(violations).toBe(0);
  });
});
