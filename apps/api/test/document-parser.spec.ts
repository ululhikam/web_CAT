import { describe, expect, it } from 'vitest';
import { detectType, parseDocBlocks, segmentLines } from '../src/modules/imports/document-parser';
import type { ImportSettings } from '../src/modules/imports/imports.types';

const settings: ImportSettings = {
  defaultType: 'SINGLE_CHOICE',
  defaultDifficulty: 'MEDIUM',
  dedupeMode: 'SKIP',
  autoDetect: true,
};

describe('segmentLines', () => {
  it('memecah soal bernomor dan opsi', () => {
    const { blocks, warnings } = segmentLines([
      { text: '1. Ibu kota Indonesia adalah ...' },
      { text: 'A. Jakarta' },
      { text: 'B. Bandung' },
      { text: 'Jawaban: A' },
      { text: '2. 2 + 2 = ...' },
      { text: 'A. 3' },
      { text: 'B. 4' },
      { text: 'Jawaban: B' },
    ]);

    expect(warnings).toEqual([]);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]?.number).toBe(1);
    expect(blocks[1]?.number).toBe(2);
    expect(blocks[0]?.lines).toContain('A. Jakarta');
  });

  it('mengabaikan tahun dan nomor halaman palsu', () => {
    const { blocks } = segmentLines([
      { text: '1. Soal pertama' },
      { text: '2024. Bukan soal ini' },
      { text: '2. Soal kedua' },
    ]);

    expect(blocks.map((block) => block.number)).toEqual([1, 2]);
  });

  it('mengenali heading subtes', () => {
    const { blocks } = segmentLines([
      { text: 'SUB TES: KECERDASAN' },
      { text: '1. Soal kecerdasan' },
    ]);

    expect(blocks[0]?.heading).toBe('KECERDASAN');
  });

  it('mengambil blok kunci jawaban di akhir dokumen', () => {
    const { blocks, keyEntries } = segmentLines([
      { text: '1. Soal satu' },
      { text: 'A. Satu' },
      { text: '2. Soal dua' },
      { text: 'A. Dua' },
      { text: 'Kunci Jawaban:' },
      { text: '1. B' },
      { text: '2. C' },
    ]);

    expect(keyEntries).toEqual([
      { number: 1, labels: ['B'] },
      { number: 2, labels: ['C'] },
    ]);
    expect(blocks).toHaveLength(2);
  });

  it('menempelkan token gambar ke stem atau opsi terakhir', () => {
    const { blocks } = segmentLines([
      { text: '1. Perhatikan gambar [[IMG:0]]' },
      { text: 'A. Opsi A' },
      { text: '[[IMG:1]]' },
    ]);

    expect(blocks[0]?.images).toEqual([
      { index: 0, role: 'STEM' },
      { index: 1, role: 'OPTION', optionLabel: 'A' },
    ]);
  });
});

describe('parseDocBlocks', () => {
  it('menghasilkan payload soal lengkap dengan kunci', () => {
    const output = parseDocBlocks({
      sourceKind: 'PDF',
      pageCount: 1,
      settings,
      extractorWarnings: [],
      lines: [
        { text: 'SUB TES: KECERDASAN', page: 1, y: 700 },
        { text: '1. Sinonim kata abadi adalah ...', page: 1, y: 680 },
        { text: 'A. Kekal', page: 1, y: 660 },
        { text: 'B. Sementara', page: 1, y: 640 },
        { text: 'C. Berubah', page: 1, y: 620 },
        { text: 'Jawaban: A', page: 1, y: 600 },
      ],
    });

    expect(output.rows).toHaveLength(1);
    expect(output.detectedSubtestCode).toBe('KECERDASAN');
    const row = output.rows[0]!;
    expect(row.payload?.subtestCode).toBe('KECERDASAN');
    expect(row.payload?.stageCode).toBe('PSIKOLOGI');
    expect(row.payload?.options).toHaveLength(3);
    expect(row.payload?.correctLabels).toEqual(['A']);
    expect(row.issues).toEqual([]);
  });

  it('menerapkan kunci dari blok kunci di akhir', () => {
    const output = parseDocBlocks({
      sourceKind: 'DOCX',
      pageCount: 1,
      settings,
      extractorWarnings: [],
      lines: [
        { text: '1. Soal pertama' },
        { text: 'A. Salah' },
        { text: 'B. Benar' },
        { text: '2. Soal kedua' },
        { text: 'A. Benar' },
        { text: 'B. Salah' },
        { text: 'Kunci Jawaban' },
        { text: '1. B' },
        { text: '2. A' },
      ],
    });

    expect(output.rows[0]?.payload?.correctLabels).toEqual(['B']);
    expect(output.rows[1]?.payload?.correctLabels).toEqual(['A']);
  });

  it('menandai dokumen tanpa soal bernomor', () => {
    const output = parseDocBlocks({
      sourceKind: 'PDF',
      pageCount: 1,
      settings,
      extractorWarnings: [],
      lines: [{ text: 'Hanya pengantar tanpa soal' }],
    });

    expect(output.rows).toEqual([]);
    expect(output.warnings.join(' ')).toContain('Tidak ada blok soal bernomor');
  });
});

describe('detectType', () => {
  it('memaksa Pass Hand untuk subtes PASS_HAND', () => {
    expect(
      detectType({ stemText: 'x', options: [], settings, subtestCode: 'PASS_HAND' }),
    ).toBe('PASS_HAND_COLUMN');
  });

  it('memaksa Likert untuk subtes KEPRIBADIAN', () => {
    expect(
      detectType({ stemText: 'x', options: [], settings, subtestCode: 'KEPRIBADIAN' }),
    ).toBe('LIKERT_STATEMENT');
  });

  it('mengenali skala setuju/tidak setuju', () => {
    expect(
      detectType({
        stemText: 'Saya suka bekerja dalam tim',
        settings,
        options: [
          { label: 'A', contentText: 'Sangat setuju' },
          { label: 'B', contentText: 'Setuju' },
          { label: 'C', contentText: 'Netral' },
          { label: 'D', contentText: 'Tidak setuju' },
          { label: 'E', contentText: 'Sangat tidak setuju' },
        ],
      }),
    ).toBe('LIKERT_STATEMENT');
  });
});
