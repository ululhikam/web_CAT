import { describe, expect, it } from 'vitest';
import { projectQuestion } from '../src/modules/exams/exam-question-projection';
import type { QuestionSnapshot } from '../src/modules/scoring/scoring.types';

const snapshot: QuestionSnapshot = {
  sourceId: 'DEV-LEAK-0001',
  type: 'MISSING_ELEMENT',
  stem: 'Lengkapi larik',
  stemFormat: 'MARKDOWN',
  difficulty: 'MEDIUM',
  weight: 1,
  scale: null,
  isReverse: false,
  pairGroup: 'PAIR_RAHASIA',
  columnIndex: null,
  columnNumbers: null,
  missingElement: { left: '12345', right: '1235', answer: '4' },
  options: [
    {
      id: '00000000-0000-4000-8000-000000000001',
      label: 'A',
      text: '4',
      isCorrect: true,
      scoreValue: 1,
      dimensionMap: { KEPEMIMPINAN: 1 },
    },
    {
      id: '00000000-0000-4000-8000-000000000002',
      label: 'B',
      text: '7',
      isCorrect: false,
      scoreValue: 0,
      dimensionMap: { KERJASAMA: -1 },
    },
  ],
  media: [{ role: 'STEM', path: 'exams/leak.png', alt: 'Gambar' }],
};

describe('proyeksi soal ke peserta', () => {
  it('tidak pernah memuat kunci jawaban atau metadata penilaian', () => {
    const projected = projectQuestion({ id: 'q1', position: 1, snapshot });
    const serialized = JSON.stringify(projected);

    expect(serialized).not.toContain('isCorrect');
    expect(serialized).not.toContain('dimensionMap');
    expect(serialized).not.toContain('pairGroup');
    // `answer` boleh ada hanya sebagai jawaban peserta sendiri (null bila kosong),
    // tidak boleh memuat kunci `missingElement.answer`.
    expect(projected.answer).toBeNull();
    expect(projected.missingElement).toEqual({ left: '12345', right: '1235' });
    expect(serialized).not.toContain('"answer":"4"');
    expect(serialized).not.toContain('scoreValue');
    expect(serialized).not.toContain('PAIR_RAHASIA');
    expect(serialized).not.toContain('KEPEMIMPINAN');
  });

  it('memproyeksikan field yang dibutuhkan peserta', () => {
    const projected = projectQuestion(
      { id: 'q1', position: 3, snapshot },
      (path) => `https://media.test/${path}`,
    );

    expect(projected.id).toBe('q1');
    expect(projected.position).toBe(3);
    expect(projected.type).toBe('MISSING_ELEMENT');
    expect(projected.missingElement).toEqual({ left: '12345', right: '1235' });
    expect(projected.options).toHaveLength(2);
    expect(projected.options[0]).toEqual({
      id: '00000000-0000-4000-8000-000000000001',
      label: 'A',
      text: '4',
      media: [],
    });
    expect(projected.media).toEqual([
      { role: 'STEM', url: 'https://media.test/exams/leak.png', alt: 'Gambar' },
    ]);
  });

  it('menyusun baris Pass Hand dari columnNumbers', () => {
    const passHand: QuestionSnapshot = {
      ...snapshot,
      type: 'PASS_HAND_COLUMN',
      missingElement: null,
      columnNumbers: [1, 2, 3, 4],
      options: [],
    };
    const projected = projectQuestion({ id: 'q2', position: 1, snapshot: passHand });

    expect(projected.rowCount).toBe(2);
    expect(projected.rows).toEqual([
      [1, 3],
      [2, 4],
    ]);
  });

  it('mengembalikan jawaban peserta sendiri untuk resume', () => {
    const projected = projectQuestion({
      id: 'q4',
      position: 1,
      snapshot,
      answer: { optionIds: ['00000000-0000-4000-8000-000000000001'] },
    });

    expect(projected.answer).toEqual({
      optionIds: ['00000000-0000-4000-8000-000000000001'],
    });
    expect(projected.options[0]).not.toHaveProperty('isCorrect');
  });

  it('tahan terhadap snapshot rusak', () => {
    const projected = projectQuestion({ id: 'q3', position: 1, snapshot: null });

    expect(projected.type).toBe('SINGLE_CHOICE');
    expect(projected.options).toEqual([]);
    expect(projected.missingElement).toBeNull();
    expect(projected.rows).toBeNull();
  });
});
