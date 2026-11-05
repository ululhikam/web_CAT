import { describe, expect, it } from 'vitest';
import type { AnswerPayload } from '@webcat/contracts';
import type { QueuedAnswer } from './answer-queue';
import { buildKeepaliveBatch, mergePendingAnswers, type PendingAnswer } from './answer-sync';

/**
 * F5-10 — bukti logika pemulihan jawaban offline.
 *
 * Kriteria runbook yang dijaga di sini:
 *  - "Refresh tab di tengah subtes → jawaban tetap ada": jawaban di antrean
 *    offline harus menang atas jawaban lama dari server.
 *  - Replay tetap idempoten: batch keepalive memakai `clientSeq` yang sudah
 *    pernah dipakai, bukan menerbitkan nomor baru.
 */

function queued(id: number, questionId: string, value: number, clientSeq = 0): QueuedAnswer {
  return {
    id,
    subtestId: 'sub-1',
    questionId,
    payload: { value } as AnswerPayload,
    timeSpentMs: 1000,
    clientSeq,
    createdAt: id,
  };
}

function pending(questionId: string, value: number, clientSeq = 0): PendingAnswer {
  return {
    questionId,
    payload: { value } as AnswerPayload,
    timeSpentMs: 500,
    clientSeq,
  };
}

describe('mergePendingAnswers', () => {
  it('memulihkan jawaban dari antrean saat server belum punya', () => {
    const merged = mergePendingAnswers({}, [queued(1, 'q1', 3)]);
    expect(merged.q1).toEqual({ value: 3 });
  });

  it('antrean offline menang atas jawaban lama server', () => {
    const merged = mergePendingAnswers({ q1: { value: 1 } as AnswerPayload }, [queued(1, 'q1', 4)]);
    expect(merged.q1).toEqual({ value: 4 });
  });

  it('state memori menang atas antrean (perubahan terbaru belum tertulis)', () => {
    const merged = mergePendingAnswers(
      { q1: { value: 1 } as AnswerPayload },
      [queued(1, 'q1', 4)],
      { q1: { value: 9 } as AnswerPayload },
    );
    expect(merged.q1).toEqual({ value: 9 });
  });

  it('record dengan id lebih besar menang bila soal yang sama muncul dua kali', () => {
    const merged = mergePendingAnswers({}, [queued(2, 'q1', 7), queued(1, 'q1', 2)]);
    expect(merged.q1).toEqual({ value: 7 });
  });

  it('tidak mengubah objek masukan', () => {
    const server = { q1: { value: 1 } as AnswerPayload };
    mergePendingAnswers(server, [queued(1, 'q1', 5)]);
    expect(server.q1).toEqual({ value: 1 });
  });
});

describe('buildKeepaliveBatch', () => {
  it('null bila antrean kosong', () => {
    expect(buildKeepaliveBatch([], 50, 1)).toBeNull();
  });

  it('memakai clientSeq baru bila semua record belum pernah dikirim', () => {
    const batch = buildKeepaliveBatch([pending('q1', 1), pending('q2', 2)], 50, 7);
    expect(batch).not.toBeNull();
    expect(batch!.clientSeq).toBe(7);
    expect(batch!.answers.map((entry) => entry.questionId)).toEqual(['q1', 'q2']);
    expect(batch!.answers.every((entry) => entry.clientSeq === 7)).toBe(true);
  });

  it('mengutamakan clientSeq yang sudah ada agar replay idempoten', () => {
    const batch = buildKeepaliveBatch(
      [pending('q1', 1, 3), pending('q2', 2, 3), pending('q3', 3)],
      50,
      9,
    );
    expect(batch!.clientSeq).toBe(3);
    expect(batch!.answers.map((entry) => entry.questionId)).toEqual(['q1', 'q2']);
  });

  it('memakai clientSeq terendah bila ada beberapa batch tertunda', () => {
    const batch = buildKeepaliveBatch([pending('q1', 1, 5), pending('q2', 2, 4)], 50, 9);
    expect(batch!.clientSeq).toBe(4);
    expect(batch!.answers.map((entry) => entry.questionId)).toEqual(['q2']);
  });

  it('membatasi jumlah jawaban sesuai maxBatch', () => {
    const entries = Array.from({ length: 60 }, (_, index) => pending(`q${index}`, index));
    const batch = buildKeepaliveBatch(entries, 50, 1);
    expect(batch!.answers).toHaveLength(50);
  });

  it('maxBatch 0 tidak mengirim apa pun', () => {
    expect(buildKeepaliveBatch([pending('q1', 1)], 0, 1)).toBeNull();
  });

  it('menyalin record sehingga pemanggil tidak ikut berubah', () => {
    const source = pending('q1', 1);
    const batch = buildKeepaliveBatch([source], 50, 2);
    expect(source.clientSeq).toBe(0);
    expect(batch!.answers[0]!.clientSeq).toBe(2);
  });
});
