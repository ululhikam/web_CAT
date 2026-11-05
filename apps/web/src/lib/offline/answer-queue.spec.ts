import { beforeEach, describe, expect, it } from 'vitest';
import type { AnswerPayload } from '@webcat/contracts';
import {
  __resetOfflineQueueForTests,
  assignClientSeq,
  clearSubtest,
  enqueueAnswer,
  listAnswers,
  nextClientSeq,
  removeAnswers,
} from './answer-queue';

/**
 * F5-10 — antrean jawaban offline.
 *
 * Di lingkungan Node `indexedDB` tidak ada, jadi modul memakai fallback memori.
 * Yang diuji adalah perilaku kontraknya (bukan IndexedDB itu sendiri):
 *  - satu soal hanya punya satu baris selama belum terkirim (jawaban terbaru
 *    tidak boleh hilang karena server memakai baris pertama dalam satu batch),
 *  - `clientSeq` monoton per subtes,
 *  - record yang sudah terkirim tidak ikut ditimpa saat jawaban berubah lagi.
 */

const subtestId = 'sub-1';

function payload(value: number): AnswerPayload {
  return { value } as AnswerPayload;
}

beforeEach(() => {
  __resetOfflineQueueForTests();
});

describe('enqueueAnswer', () => {
  it('menyimpan satu baris untuk satu jawaban', async () => {
    await enqueueAnswer({ subtestId, questionId: 'q1', payload: payload(1), timeSpentMs: 100 });
    const rows = await listAnswers(subtestId);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.payload).toEqual({ value: 1 });
    expect(rows[0]!.clientSeq).toBe(0);
  });

  it('menggabungkan jawaban berulang pada soal yang sama (belum terkirim)', async () => {
    await enqueueAnswer({ subtestId, questionId: 'q1', payload: payload(1), timeSpentMs: 100 });
    await enqueueAnswer({ subtestId, questionId: 'q1', payload: payload(2), timeSpentMs: 150 });
    const rows = await listAnswers(subtestId);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.payload).toEqual({ value: 2 });
    expect(rows[0]!.timeSpentMs).toBe(250);
  });

  it('tidak mencampur soal berbeda', async () => {
    await enqueueAnswer({ subtestId, questionId: 'q1', payload: payload(1) });
    await enqueueAnswer({ subtestId, questionId: 'q2', payload: payload(2) });
    await enqueueAnswer({ subtestId, questionId: 'q1', payload: payload(3) });
    const rows = await listAnswers(subtestId);
    expect(rows.map((row) => row.questionId)).toEqual(['q2', 'q1']);
    expect(rows[1]!.payload).toEqual({ value: 3 });
  });

  it('tidak mencampur subtes berbeda', async () => {
    await enqueueAnswer({ subtestId, questionId: 'q1', payload: payload(1) });
    await enqueueAnswer({ subtestId: 'sub-2', questionId: 'q1', payload: payload(2) });
    expect(await listAnswers(subtestId)).toHaveLength(1);
    expect(await listAnswers('sub-2')).toHaveLength(1);
  });

  it('tetap membuat baris baru bila jawaban sebelumnya sudah terkirim', async () => {
    const firstId = await enqueueAnswer({
      subtestId,
      questionId: 'q1',
      payload: payload(1),
      timeSpentMs: 100,
    });
    await assignClientSeq(await listAnswers(subtestId), 3);
    await enqueueAnswer({ subtestId, questionId: 'q1', payload: payload(2), timeSpentMs: 50 });

    const rows = await listAnswers(subtestId);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.id).toBe(firstId);
    expect(rows[0]!.clientSeq).toBe(3);
    expect(rows[1]!.clientSeq).toBe(0);
    expect(rows[1]!.payload).toEqual({ value: 2 });
  });
});

describe('clientSeq', () => {
  it('monoton per subtes', async () => {
    expect(await nextClientSeq(subtestId)).toBe(1);
    expect(await nextClientSeq(subtestId)).toBe(2);
    expect(await nextClientSeq('sub-2')).toBe(1);
  });

  it('hanya mengisi record yang belum punya clientSeq', async () => {
    await enqueueAnswer({ subtestId, questionId: 'q1', payload: payload(1) });
    await enqueueAnswer({ subtestId, questionId: 'q2', payload: payload(2) });
    const rows = await listAnswers(subtestId);
    await assignClientSeq(rows, 7);
    await assignClientSeq(await listAnswers(subtestId), 8);

    const after = await listAnswers(subtestId);
    expect(after.every((row) => row.clientSeq === 7)).toBe(true);
  });
});

describe('removeAnswers & clearSubtest', () => {
  it('menghapus record yang sudah ter-ACK', async () => {
    await enqueueAnswer({ subtestId, questionId: 'q1', payload: payload(1) });
    await enqueueAnswer({ subtestId, questionId: 'q2', payload: payload(2) });
    const rows = await listAnswers(subtestId);
    await removeAnswers([rows[0]!.id]);

    const after = await listAnswers(subtestId);
    expect(after.map((row) => row.questionId)).toEqual(['q2']);
  });

  it('clearSubtest mengosongkan satu subtes saja', async () => {
    await enqueueAnswer({ subtestId, questionId: 'q1', payload: payload(1) });
    await enqueueAnswer({ subtestId: 'sub-2', questionId: 'q1', payload: payload(2) });
    await clearSubtest(subtestId);

    expect(await listAnswers(subtestId)).toHaveLength(0);
    expect(await listAnswers('sub-2')).toHaveLength(1);
  });
});
