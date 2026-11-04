import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import {
  buildTemplateWorkbook,
  imageBasename,
  parseSpreadsheet,
} from '../src/modules/imports/spreadsheet-parser';
import type { ImportSettings } from '../src/modules/imports/imports.types';

const settings: ImportSettings = {
  defaultType: 'SINGLE_CHOICE',
  defaultDifficulty: 'MEDIUM',
  dedupeMode: 'SKIP',
  autoDetect: true,
};

async function xlsxBuffer(rows: string[][]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('questions');
  rows.forEach((row) => sheet.addRow(row));
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

const HEADER = [
  'stage_code',
  'subtest_code',
  'type',
  'difficulty',
  'stem_text',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'correct_labels',
];

describe('parseSpreadsheet (CSV)', () => {
  it('membaca header, opsi, dan kunci', async () => {
    const csv = [
      HEADER.join(','),
      'PSIKOLOGI,KECERDASAN,SINGLE_CHOICE,EASY,"Ibu kota Indonesia adalah ...",Jakarta,Bandung,Surabaya,Medan,A',
    ].join('\n');

    const result = await parseSpreadsheet(Buffer.from(csv), 'text/csv', 'soal.csv', settings);

    expect(result.rows).toHaveLength(1);
    const row = result.rows[0]!;
    expect(row.payload?.stemText).toBe('Ibu kota Indonesia adalah ...');
    expect(row.payload?.difficulty).toBe('EASY');
    expect(row.payload?.options).toHaveLength(4);
    expect(row.payload?.correctLabels).toEqual(['A']);
    expect(row.issues).toEqual([]);
    expect(row.confidence).toBeGreaterThan(0.8);
  });

  it('mendukung alias header bahasa Indonesia', async () => {
    const csv = [
      'soal,subtes,tipe,kunci,opsi_a,opsi_b',
      'Pilih jawaban,KECERDASAN,SINGLE_CHOICE,A,Satu,Dua',
    ].join('\n');

    const result = await parseSpreadsheet(Buffer.from(csv), 'text/csv', 's.csv', settings);
    const row = result.rows[0]!;

    expect(row.payload?.stemText).toBe('Pilih jawaban');
    expect(row.payload?.stageCode).toBe('PSIKOLOGI');
    expect(row.payload?.subtestCode).toBe('KECERDASAN');
  });

  it('menandai baris tanpa kunci sebagai tidak lengkap', async () => {
    const csv = [HEADER.join(','), 'PSIKOLOGI,TPA,SINGLE_CHOICE,MEDIUM,"Soal tanpa kunci",A,B,C,D,'].join('\n');

    const result = await parseSpreadsheet(Buffer.from(csv), 'text/csv', 's.csv', settings);
    const row = result.rows[0]!;

    expect(row.warnings.join(' ')).toContain('Kunci jawaban kosong');
    expect(row.issues.length).toBeGreaterThan(0);
    expect(row.confidence).toBeLessThan(1);
  });

  it('menolak berkas tanpa kolom stem_text', async () => {
    await expect(
      parseSpreadsheet(Buffer.from('a,b\n1,2'), 'text/csv', 's.csv', settings),
    ).rejects.toThrow('stem_text');
  });

  it('mendeteksi Likert dari kolom dimensi', async () => {
    const csv = [
      'stem_text,likert_dimension,subtest_code',
      'Saya jujur kepada atasan,kejujuran:+,KEPRIBADIAN',
    ].join('\n');

    const result = await parseSpreadsheet(Buffer.from(csv), 'text/csv', 's.csv', settings);
    const row = result.rows[0]!;

    expect(row.payload?.type).toBe('LIKERT_STATEMENT');
    expect(row.payload?.options).toHaveLength(5);
    expect(row.payload?.options[0]?.dimensionMap).toEqual({ kejujuran: 2 });
  });

  it('mengabaikan path absolut pada nama file gambar', async () => {
    const csv = [
      'stem_text,image_stem_1',
      'Soal bergambar,C:\\Users\\admin\\gambar\\soal-1.png',
    ].join('\n');

    const result = await parseSpreadsheet(Buffer.from(csv), 'text/csv', 's.csv', settings);

    expect(imageBasename('C:\\Users\\admin\\gambar\\soal-1.png')).toBe('soal-1.png');
    expect(result.imageRequests[0]?.filenames).toEqual(['soal-1.png']);
  });
});

describe('parseSpreadsheet (XLSX)', () => {
  it('membaca workbook dengan tipe angka dan rich text', async () => {
    const buffer = await xlsxBuffer([
      HEADER,
      [
        'TPA',
        'TPA',
        'MULTI_CHOICE',
        'HARD',
        'Manakah bilangan prima?',
        '2',
        '3',
        '4',
        '6',
        'A,B',
      ],
    ]);

    const result = await parseSpreadsheet(
      buffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'soal.xlsx',
      settings,
    );

    const row = result.rows[0]!;
    expect(row.payload?.stageCode).toBe('TPA');
    expect(row.payload?.type).toBe('MULTI_CHOICE');
    expect(row.payload?.correctLabels).toEqual(['A', 'B']);
    expect(row.payload?.options.map((option) => option.contentText)).toEqual(['2', '3', '4', '6']);
  });
});

describe('buildTemplateWorkbook', () => {
  it('menghasilkan workbook yang dapat dibaca kembali', async () => {
    const buffer = await buildTemplateWorkbook();
    const parsed = await parseSpreadsheet(
      buffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'template.xlsx',
      settings,
    );

    expect(buffer.length).toBeGreaterThan(1000);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]?.payload?.stemText).toContain('Sinonim');
  });
});
