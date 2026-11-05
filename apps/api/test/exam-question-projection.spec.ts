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
      media: [],
    },
    {
      id: '00000000-0000-4000-8000-000000000002',
      label: 'B',
      text: '7',
      isCorrect: false,
      scoreValue: 0,
      dimensionMap: { KERJASAMA: -1 },
      media: [],
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

  /* ------------------------------------------------------------ media (F3) */

  it('mengirim media per opsi beserta URL-nya (F3-08)', () => {
    const bergambar: QuestionSnapshot = {
      ...snapshot,
      type: 'IMAGE_CHOICE',
      options: [
        {
          id: 'opt-a',
          label: 'A',
          text: null,
          isCorrect: false,
          scoreValue: 0,
          dimensionMap: null,
          media: [{ role: 'OPTION', path: 'fig/a.webp', alt: 'Pola A' }],
        },
        {
          id: 'opt-b',
          label: 'B',
          text: null,
          isCorrect: true,
          scoreValue: 1,
          dimensionMap: null,
          media: [{ role: 'OPTION', path: 'fig/b.webp', alt: 'Pola B' }],
        },
      ],
    };

    const projected = projectQuestion(
      { id: 'q6', position: 1, snapshot: bergambar },
      (path) => `https://media.test/${path}`,
    );

    expect(projected.options[0]?.media).toEqual([
      { role: 'OPTION', url: 'https://media.test/fig/a.webp', alt: 'Pola A' },
    ]);
    expect(projected.options[1]?.media[0]?.url).toBe('https://media.test/fig/b.webp');
    // Kunci jawaban tetap tidak ikut.
    expect(JSON.stringify(projected)).not.toContain('isCorrect');
  });

  it('memakai /media/:id/content bila snapshot punya assetId (F3-17)', () => {
    const denganAset: QuestionSnapshot = {
      ...snapshot,
      media: [
        { role: 'STEM', assetId: 'asset-1', path: 'fig/stem.webp', alt: 'Stem' },
        { role: 'EXPLANATION', assetId: 'asset-2', path: 'fig/bahas.webp', alt: 'Bahasan' },
      ],
      options: [
        {
          id: 'opt-a',
          label: 'A',
          text: null,
          isCorrect: true,
          scoreValue: 1,
          dimensionMap: null,
          media: [{ role: 'OPTION', assetId: 'asset-3', path: 'fig/a.webp', alt: 'Opsi A' }],
        },
      ],
    };

    const projected = projectQuestion(
      { id: 'q7', position: 1, snapshot: denganAset },
      () => 'https://storage.test/tidak-dipakai',
      'rahasia-uji',
    );

    // URL konten bertanda tangan, bukan signed URL storage.
    expect(projected.media[0]?.url).toMatch(/^\/api\/v1\/media\/asset-1\/content\?exp=\d+&sig=/);
    expect(projected.options[0]?.media[0]?.url).toMatch(
      /^\/api\/v1\/media\/asset-3\/content\?exp=\d+&sig=/,
    );
  });

  it('tidak pernah mengirim media EXPLANATION ke peserta (F3-09)', () => {
    const denganBahasan: QuestionSnapshot = {
      ...snapshot,
      media: [
        { role: 'STEM', path: 'fig/stem.webp', alt: 'Stem' },
        { role: 'EXPLANATION', path: 'fig/bahas.webp', alt: 'Bahasan' },
      ],
    };

    const projected = projectQuestion({ id: 'q8', position: 1, snapshot: denganBahasan });

    expect(projected.media).toHaveLength(1);
    expect(projected.media[0]?.role).toBe('STEM');
    expect(JSON.stringify(projected)).not.toContain('bahas.webp');
    expect(JSON.stringify(projected)).not.toContain('EXPLANATION');
  });
});
