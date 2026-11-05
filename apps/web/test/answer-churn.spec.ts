import { describe, expect, it } from 'vitest';
import { createAnswerChurnTracker } from '../src/lib/exams/answer-churn';

/**
 * F5-13 aturan 3: "jawaban diubah lebih dari 5 kali dalam 2 detik".
 *
 * Ambangnya ada di `@webcat/contracts` (`CHURN_LIMIT`, `CHURN_WINDOW_MS`);
 * test ini memastikan modul klien memakai ambang tersebut, bukan angka sendiri.
 */

const Q1 = 'question-1';
const Q2 = 'question-2';
const T0 = 1_700_000_000_000;

/** Mencatat `count` perubahan berjarak `gapMs` mulai `T0`, mengembalikan hasil terakhir. */
function churn(
  tracker: ReturnType<typeof createAnswerChurnTracker>,
  questionId: string,
  count: number,
  gapMs = 100,
): number {
  let result = 0;
  for (let index = 0; index < count; index += 1) {
    result = tracker.record(questionId, T0 + index * gapMs);
  }
  return result;
}

describe('createAnswerChurnTracker (F5-13)', () => {
  it('tidak melaporkan 5 perubahan dalam 2 detik', () => {
    const tracker = createAnswerChurnTracker();
    expect(churn(tracker, Q1, 5, 100)).toBe(0);
  });

  it('melaporkan 6 perubahan dalam 2 detik', () => {
    const tracker = createAnswerChurnTracker();
    expect(churn(tracker, Q1, 6, 100)).toBe(6);
  });

  it('tidak melaporkan 6 perubahan yang tersebar lebih dari 2 detik', () => {
    const tracker = createAnswerChurnTracker();
    // 0, 1.000, 2.000, ... 5.000 ms: hanya 2 perubahan terakhir yang sekamar.
    expect(churn(tracker, Q1, 6, 1_000)).toBe(0);
  });

  it('memisahkan riwayat antar soal', () => {
    const tracker = createAnswerChurnTracker();
    expect(churn(tracker, Q2, 4, 100)).toBe(0);
    // Soal lain tidak ikut "menumpuk" pada Q1, jadi 5 total tidak dilaporkan.
    expect(churn(tracker, Q1, 5, 100)).toBe(0);
    // Baru perubahan keenam Q1 yang memicu.
    expect(tracker.record(Q1, T0 + 500)).toBe(6);
  });

  it('membuang waktu perubahan yang sudah lewat jendela', () => {
    const tracker = createAnswerChurnTracker();
    churn(tracker, Q1, 5, 100);
    // Jeda panjang: lima entri lama tidak boleh membuat ledakan baru.
    expect(tracker.record(Q1, T0 + 10_000)).toBe(0);
  });

  it('reset() membersihkan semua soal', () => {
    const tracker = createAnswerChurnTracker();
    churn(tracker, Q1, 6, 100);
    churn(tracker, Q2, 6, 100);

    tracker.reset();

    expect(tracker.record(Q1, T0 + 700)).toBe(0);
    expect(tracker.record(Q2, T0 + 700)).toBe(0);
  });

  it('reset(questionId) hanya membersihkan soal tersebut', () => {
    const tracker = createAnswerChurnTracker();
    churn(tracker, Q1, 6, 100);
    churn(tracker, Q2, 5, 100);

    tracker.reset(Q1);

    expect(tracker.record(Q1, T0 + 600)).toBe(0);
    // Q2 masih menyimpan lima perubahan → satu lagi memicu.
    expect(tracker.record(Q2, T0 + 600)).toBe(6);
  });
});
