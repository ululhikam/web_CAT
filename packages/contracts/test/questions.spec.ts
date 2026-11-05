import { describe, expect, it } from 'vitest';
import { questionShapeIssues, type QuestionShapeInput } from '../src/questions/index';

/**
 * F3-30 — aturan bentuk soal bergambar (`IMAGE_CHOICE`).
 *
 * Aturan ini dipakai bersama oleh API (`questionCreateSchema`), form admin, dan
 * seed, sehingga kesalahan isi tertangkap sebelum soal tersimpan:
 *   - wajib ada minimal satu gambar STEM;
 *   - SETIAP opsi wajib punya gambar OPTION.
 *
 * Tanpa aturan ini peserta melihat deretan tile kosong yang tidak bisa dijawab.
 */

const ASSET_A = '00000000-0000-4000-8000-00000000000a';
const ASSET_B = '00000000-0000-4000-8000-00000000000b';

function base(overrides: Partial<QuestionShapeInput> = {}): QuestionShapeInput {
  return {
    stageCode: 'PSIKOLOGI',
    subtestCode: 'KECERDASAN',
    type: 'IMAGE_CHOICE',
    status: 'PUBLISHED',
    difficulty: 'MEDIUM',
    stemText: 'Pilih gambar yang melanjutkan pola',
    stemFormat: 'MARKDOWN',
    weight: 1,
    dedupeOverride: false,
    options: [
      { label: 'A', isCorrect: true, scoreValue: 1, sortOrder: 0 },
      { label: 'B', isCorrect: false, scoreValue: 0, sortOrder: 1 },
    ],
    media: [],
    tags: [],
    ...overrides,
  };
}

function stemMedia() {
  return { mediaAssetId: ASSET_A, role: 'STEM' as const, sortOrder: 0 };
}

function optionMedia(label: 'A' | 'B') {
  return { mediaAssetId: ASSET_B, role: 'OPTION' as const, optionLabel: label, sortOrder: 0 };
}

describe('questionShapeIssues — IMAGE_CHOICE (F3-27)', () => {
  it('menerima soal bergambar dengan media stem dan semua opsi bergambar', () => {
    const issues = questionShapeIssues(
      base({ media: [stemMedia(), optionMedia('A'), optionMedia('B')] }),
    );

    expect(issues).toEqual([]);
  });

  it('menolak soal bergambar tanpa media stem', () => {
    const issues = questionShapeIssues(base({ media: [optionMedia('A'), optionMedia('B')] }));

    expect(issues).toContain('Soal bergambar wajib memiliki minimal satu gambar pada stem');
  });

  it('menolak soal bergambar bila ada opsi tanpa gambar', () => {
    const issues = questionShapeIssues(base({ media: [stemMedia(), optionMedia('A')] }));

    expect(issues).toContain('Opsi B belum memiliki gambar');
  });

  it('menyebut seluruh opsi yang belum bergambar sekaligus', () => {
    const issues = questionShapeIssues(
      base({
        options: [
          { label: 'A', isCorrect: true, scoreValue: 1, sortOrder: 0 },
          { label: 'B', isCorrect: false, scoreValue: 0, sortOrder: 1 },
          { label: 'C', isCorrect: false, scoreValue: 0, sortOrder: 2 },
        ],
        media: [stemMedia()],
      }),
    );

    expect(issues).toContain('Opsi A, B, C belum memiliki gambar');
  });

  it('tetap menolak bila media OPTION menunjuk label di luar opsi', () => {
    const issues = questionShapeIssues(
      base({ media: [stemMedia(), optionMedia('A'), optionMedia('B')], options: [
        { label: 'A', isCorrect: true, scoreValue: 1, sortOrder: 0 },
        { label: 'C', isCorrect: false, scoreValue: 0, sortOrder: 1 },
      ] }),
    );

    expect(issues).toContain('Opsi C belum memiliki gambar');
  });

  it('tidak menerapkan aturan gambar pada SINGLE_CHOICE', () => {
    const issues = questionShapeIssues(base({ type: 'SINGLE_CHOICE', media: [] }));

    expect(issues).toEqual([]);
  });
});
