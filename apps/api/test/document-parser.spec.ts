import { describe, expect, it } from 'vitest';
import {
  detectType,
  parseDocBlocks,
  segmentLines,
  splitInlineOptions,
} from '../src/modules/imports/document-parser';
import { htmlToLines } from '../src/modules/imports/docx-extractor';
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
    expect(detectType({ stemText: 'x', options: [], settings, subtestCode: 'PASS_HAND' })).toBe(
      'PASS_HAND_COLUMN',
    );
  });

  it('memaksa Likert untuk subtes KEPRIBADIAN', () => {
    expect(detectType({ stemText: 'x', options: [], settings, subtestCode: 'KEPRIBADIAN' })).toBe(
      'LIKERT_STATEMENT',
    );
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

describe('splitInlineOptions', () => {
  it('memecah beberapa opsi pada satu baris', () => {
    expect(splitInlineOptions('A. 3   B. 4   C. 5   D. 6')).toEqual([
      'A. 3',
      'B. 4',
      'C. 5',
      'D. 6',
    ]);
  });

  it('mempertahankan stem di depan opsi', () => {
    expect(splitInlineOptions('1. Ibu kota? A. Bandung B. Jakarta')).toEqual([
      '1. Ibu kota?',
      'A. Bandung',
      'B. Jakarta',
    ]);
  });

  it('tidak memecah kalimat biasa', () => {
    const line = 'Jawaban yang benar adalah e. g. contoh berikut';
    expect(splitInlineOptions(line)).toEqual([line]);
  });
});

describe('segmentLines — daftar otomatis Word', () => {
  it('membedakan daftar soal dan daftar opsi', () => {
    const { blocks } = segmentLines([
      { text: 'KECERDASAN' },
      { text: '[[OL:1:1]]Manakah bilangan genap?' },
      { text: '[[OL:1:2]]7' },
      { text: '[[OL:1:3]]9' },
      { text: '[[OL:1:4]]8' },
      { text: '[[OL:1:5]]11' },
      { text: 'Jawaban: C' },
      { text: '[[OL:1:6]]Hasil dari 2 + 2?' },
      { text: 'A. 3' },
      { text: 'B. 4' },
      { text: 'Jawaban: B' },
    ]);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]?.lines).toEqual([
      'Manakah bilangan genap?',
      'A. 7',
      'B. 9',
      'C. 8',
      'D. 11',
      'Jawaban: C',
    ]);
    expect(blocks[1]?.lines[0]).toBe('Hasil dari 2 + 2?');
  });
});

describe('parseDocBlocks — dokumen asli', () => {
  it('menggabungkan kunci dari blok kunci di akhir dokumen', () => {
    const output = parseDocBlocks({
      sourceKind: 'PDF',
      pageCount: 1,
      settings,
      extractorWarnings: [],
      lines: [
        { text: 'KECERDASAN' },
        { text: '1. Berapakah 1 + 1?' },
        { text: 'A. 1' },
        { text: 'B. 2' },
        { text: '2. Berapakah 2 + 2?' },
        { text: 'A. 3' },
        { text: 'B. 4' },
        { text: 'KUNCI JAWABAN' },
        { text: '1. B   2. B' },
      ],
    });

    expect(output.rows.map((row) => row.payload?.correctLabels)).toEqual([['B'], ['B']]);
    expect(output.rows.every((row) => row.issues.length === 0)).toBe(true);
  });

  it('mengambil kunci dari opsi yang ditebalkan', () => {
    const output = parseDocBlocks({
      sourceKind: 'DOCX',
      pageCount: 1,
      settings,
      extractorWarnings: [],
      lines: [
        { text: 'KECERDASAN' },
        { text: '1. Hasil 9 - 4?' },
        { text: 'A. 3' },
        { text: 'B. 4' },
        { text: '**C. 5**' },
        { text: 'D. 6' },
      ],
    });

    expect(output.rows[0]?.payload?.correctLabels).toEqual(['C']);
    expect(output.rows[0]?.warnings).toContain(
      'Kunci diambil dari opsi tebal (bold); periksa kembali',
    );
  });

  it('menangani opsi yang dipisah koma dan titik pada satu baris', () => {
    const output = parseDocBlocks({
      sourceKind: 'PDF',
      pageCount: 1,
      settings,
      extractorWarnings: [],
      lines: [
        { text: 'KECERDASAN' },
        { text: '1. Ibu kota Indonesia?' },
        { text: 'A. Bandung   B. Jakarta   C. Surabaya' },
        { text: 'Jawaban: B' },
      ],
    });

    expect(output.rows[0]?.payload?.options.map((option) => option.label)).toEqual(['A', 'B', 'C']);
  });

  it('menempelkan opsi satu baris ke soal yang baru dimulai', () => {
    const output = parseDocBlocks({
      sourceKind: 'PDF',
      pageCount: 1,
      settings,
      extractorWarnings: [],
      lines: [
        { text: 'KECERDASAN' },
        { text: '1. 1 + 1? A. 1 B. 2' },
        { text: '2. 2 + 2? A. 3 B. 4' },
      ],
    });

    expect(output.rows).toHaveLength(2);
    expect(output.rows[0]?.payload?.stemText).toBe('1 + 1?');
    expect(output.rows[0]?.payload?.options.map((option) => option.contentText)).toEqual([
      '1',
      '2',
    ]);
    expect(output.rows[1]?.payload?.stemText).toBe('2 + 2?');
    expect(output.rows[1]?.payload?.options.map((option) => option.contentText)).toEqual([
      '3',
      '4',
    ]);
  });
});

describe('htmlToLines', () => {
  it('memberi penanda pada daftar berurutan', () => {
    const lines = htmlToLines('<ol><li>Satu</li><li>Dua</li></ol>').map((line) => line.text);
    expect(lines).toEqual(['[[OL:1:1]]Satu', '[[OL:1:2]]Dua']);
  });

  it('memberi penanda pada daftar berbutir', () => {
    const lines = htmlToLines('<ul><li>Satu</li></ul>').map((line) => line.text);
    expect(lines).toEqual(['[[BUL]]Satu']);
  });

  it('mempertahankan penebalan sebagai penanda kunci', () => {
    const lines = htmlToLines('<p>A. 3</p><p><strong>C. 5</strong></p>').map((line) => line.text);
    expect(lines).toEqual(['A. 3', '**C. 5**']);
  });

  it('memisahkan sel tabel berparagraf menjadi baris sendiri', () => {
    const lines = htmlToLines(
      '<table><tr><td><p>A. 3</p></td><td><p>B. 4</p></td></tr></table>',
    ).map((line) => line.text);
    expect(lines).toEqual(['A. 3', 'B. 4']);
  });
});
