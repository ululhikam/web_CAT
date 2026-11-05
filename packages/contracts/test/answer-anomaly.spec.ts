import { describe, expect, it } from 'vitest';
import {
  ANSWER_ANOMALY_SEVERITY,
  ANSWER_ANOMALY_TYPES,
  CHURN_LIMIT,
  IMAGE_TOO_FAST_MS,
  SPEED_STREAK_LENGTH,
  SPEED_STREAK_MS,
  countChangesInWindow,
  findFastStreak,
  isImageAnswerTooFast,
  isImageQuestion,
} from '../src/exams/answer-anomaly';

/**
 * F5-13 — ambang anomali waktu jawab.
 *
 * Semua nilai jam adalah angka tetap supaya hasilnya deterministik: modul yang
 * diuji tidak memanggil `Date.now()`.
 */

const T0 = Date.UTC(2026, 10, 6, 9, 0, 0);

describe('isImageQuestion', () => {
  it('mengenali gambar pada stem dan pada opsi', () => {
    expect(isImageQuestion({ media: [{ role: 'STEM' }] })).toBe(true);
    expect(isImageQuestion({ options: [{ media: [{ role: 'IMAGE' }] }] })).toBe(true);
  });

  it('mengabaikan media pembahasan dan snapshot kosong', () => {
    expect(isImageQuestion({ media: [{ role: 'EXPLANATION' }] })).toBe(false);
    expect(isImageQuestion({ options: [{ media: [{ role: 'EXPLANATION' }] }] })).toBe(false);
    expect(isImageQuestion({ options: [{ media: [] }] })).toBe(false);
    expect(isImageQuestion(null)).toBe(false);
    expect(isImageQuestion(undefined)).toBe(false);
  });
});

describe('isImageAnswerTooFast', () => {
  it('mencatat 1 sampai 299 ms', () => {
    expect(isImageAnswerTooFast(1)).toBe(true);
    expect(isImageAnswerTooFast(IMAGE_TOO_FAST_MS - 1)).toBe(true);
  });

  it('tidak mencatat tepat di ambang, lebih lambat, atau nilai tidak dilaporkan', () => {
    expect(isImageAnswerTooFast(IMAGE_TOO_FAST_MS)).toBe(false);
    expect(isImageAnswerTooFast(5_000)).toBe(false);
    expect(isImageAnswerTooFast(0)).toBe(false);
    expect(isImageAnswerTooFast(Number.NaN)).toBe(false);
  });
});

describe('findFastStreak', () => {
  const fast = (position: number, timeSpentMs = SPEED_STREAK_MS - 50) => ({
    sessionQuestionId: `q-${position}`,
    position,
    timeSpentMs,
  });

  it('mencatat 5 soal berurutan di bawah 150 ms', () => {
    expect(findFastStreak([fast(1), fast(2), fast(3), fast(4), fast(5)])).toEqual({
      sessionQuestionId: 'q-5',
      positions: [1, 2, 3, 4, 5],
      timeSpentMs: [100, 100, 100, 100, 100],
    });
  });

  it('tidak mencatat jika ada satu soal lambat', () => {
    expect(
      findFastStreak([fast(1), fast(2), fast(3, SPEED_STREAK_MS), fast(4), fast(5)]),
    ).toBeNull();
  });

  it('tidak mencatat jika posisi melompat', () => {
    expect(findFastStreak([fast(1), fast(2), fast(3), fast(5), fast(6)])).toBeNull();
  });

  it('tidak mencatat bila kurang dari 5 soal', () => {
    expect(findFastStreak([1, 2, 3, 4].map((position) => fast(position)))).toBeNull();
  });

  it('mengabaikan waktu 0 yang tidak dilaporkan', () => {
    expect(findFastStreak([fast(1, 0), fast(2), fast(3), fast(4), fast(5)])).toBeNull();
  });

  it('tetap menemukan deret meski urutan masukan acak', () => {
    expect(findFastStreak([fast(5), fast(1), fast(3), fast(2), fast(4)])?.positions).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(SPEED_STREAK_LENGTH).toBe(5);
  });
});

describe('countChangesInWindow', () => {
  it('menghitung 6 perubahan dalam 2 detik', () => {
    expect(countChangesInWindow([T0, T0 + 100, T0 + 200, T0 + 300, T0 + 400, T0 + 500])).toBe(6);
  });

  it('tidak mencatat tepat 5 perubahan', () => {
    expect(countChangesInWindow([T0, T0 + 100, T0 + 200, T0 + 300, T0 + 400])).toBe(0);
  });

  it('hanya melihat jendela yang berakhir pada perubahan terakhir', () => {
    expect(
      countChangesInWindow([T0, T0 + 50, T0 + 100, T0 + 150, T0 + 200, T0 + 250, T0 + 10_000]),
    ).toBe(0);
  });

  it('menghitung tepat di batas jendela 2000 ms', () => {
    const timestamps = [T0, T0 + 400, T0 + 800, T0 + 1_200, T0 + 1_600, T0 + 2_000];
    expect(countChangesInWindow(timestamps)).toBe(6);
    expect(CHURN_LIMIT).toBe(5);
  });
});

describe('metadata tipe anomali', () => {
  it('setiap tipe punya label dan keparahan', () => {
    for (const type of ANSWER_ANOMALY_TYPES) {
      expect(ANSWER_ANOMALY_SEVERITY[type]).toMatch(/^(low|medium)$/);
    }
  });
});
