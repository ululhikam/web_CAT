import { describe, expect, it } from 'vitest';
import {
  buildPayload,
  parseCorrectLabels,
  scoreConfidence,
  type QuestionDraft,
} from '../src/modules/imports/draft';
import type { ImportSettings } from '../src/modules/imports/imports.types';

const settings: ImportSettings = {
  defaultType: 'SINGLE_CHOICE',
  defaultDifficulty: 'MEDIUM',
  dedupeMode: 'SKIP',
  autoDetect: true,
};

function draft(overrides: Partial<QuestionDraft> = {}): QuestionDraft {
  return {
    rowNumber: 2,
    rawText: null,
    stageCode: 'PSIKOLOGI',
    subtestCode: 'KECERDASAN',
    stemText: 'Sinonim kata abadi adalah ...',
    options: [
      { label: 'A', contentText: 'Kekal' },
      { label: 'B', contentText: 'Sementara' },
      { label: 'C', contentText: 'Berubah' },
      { label: 'D', contentText: 'Baru' },
      { label: 'E', contentText: 'Rusak' },
    ],
    correctLabels: ['A'],
    warnings: [],
    confidence: 1,
    ...overrides,
  };
}

describe('parseCorrectLabels', () => {
  it('menormalkan berbagai pemisah', () => {
    expect(parseCorrectLabels('a, c')).toEqual(['A', 'C']);
    expect(parseCorrectLabels('A/C')).toEqual(['A', 'C']);
    expect(parseCorrectLabels('AC')).toEqual([]);
  });

  it('membuang duplikat dan label tidak sah', () => {
    expect(parseCorrectLabels('A, A, Z, B')).toEqual(['A', 'B']);
    expect(parseCorrectLabels(undefined)).toEqual([]);
  });
});

describe('buildPayload', () => {
  it('memakai stage/subtes default bila tidak ada di berkas', () => {
    const result = buildPayload(
      draft({ stageCode: undefined, subtestCode: undefined }),
      { ...settings, targetStageCode: 'TKK', targetSubtestCode: 'TKK' },
    );

    expect(result.issues).toEqual([]);
    expect(result.payload.stageCode).toBe('TKK');
    expect(result.payload.subtestCode).toBe('TKK');
  });

  it('menurunkan stage dari subtes bila target tidak diberikan', () => {
    const result = buildPayload(
      draft({ stageCode: undefined, subtestCode: 'TPK' }),
      settings,
    );

    expect(result.payload.stageCode).toBe('TPK');
  });

  it('menandai kunci yang tidak punya opsi', () => {
    const result = buildPayload(draft({ correctLabels: ['A', 'F'] }), settings);

    expect(result.issues).toContain('Kunci F tidak memiliki opsi');
  });

  it('menolak kombinasi stage/subtes yang tidak sah', () => {
    const result = buildPayload(
      draft({ stageCode: 'TKK', subtestCode: 'KECERDASAN' }),
      settings,
    );

    expect(result.issues.join(' ')).toContain('tidak berada di stage');
  });

  it('membuat skala Likert default dengan peta dimensi', () => {
    const result = buildPayload(
      draft({
        subtestCode: 'KEPRIBADIAN',
        type: 'LIKERT_STATEMENT',
        options: [],
        correctLabels: [],
        likertDimension: 'kejujuran:+',
      }),
      settings,
    );

    expect(result.payload.options).toHaveLength(5);
    expect(result.payload.options[0]?.dimensionMap).toEqual({ kejujuran: 2 });
    expect(result.payload.options[4]?.dimensionMap).toEqual({ kejujuran: -2 });
  });

  it('mengisi columnIndex untuk soal Pass Hand', () => {
    const result = buildPayload(
      draft({
        subtestCode: 'PASS_HAND',
        type: 'PASS_HAND_COLUMN',
        options: [],
        correctLabels: [],
        rowNumber: 7,
      }),
      settings,
    );

    expect(result.payload.columnIndex).toBe(6);
  });
});

describe('scoreConfidence', () => {
  it('maksimal 1 untuk data lengkap', () => {
    expect(
      scoreConfidence({
        numbered: true,
        optionCount: 5,
        keyValid: true,
        subtestKnown: true,
        warnings: [],
      }),
    ).toBe(1);
  });

  it('turun sesuai komponen yang hilang', () => {
    const score = scoreConfidence({
      numbered: false,
      optionCount: 0,
      keyValid: false,
      subtestKnown: false,
      warnings: ['Opsi jawaban tidak terdeteksi'],
    });

    expect(score).toBe(0);
  });

  it('memberi 0.2 untuk nomor soal saja', () => {
    expect(
      scoreConfidence({
        numbered: true,
        optionCount: 0,
        keyValid: false,
        subtestKnown: false,
        warnings: ['x'],
      }),
    ).toBe(0.2);
  });
});
