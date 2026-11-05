import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import {
  IMPORT_MAX_ROWS,
  QUESTION_DIFFICULTIES,
  QUESTION_TYPES,
  SUBTEST_CODES,
  STAGE_CODES,
  type QuestionDifficulty,
  type QuestionType,
  type StageCode,
  type SubtestCode,
} from '@webcat/contracts';
import { buildPayload, parseCorrectLabels, scoreConfidence } from './draft';
import type { ImportSettings, ParsedFile, ParsedRow } from './imports.types';
import { SUBTEST_STAGE } from './imports.types';

export const SPREADSHEET_MIMES = [
  'text/csv',
  'application/csv',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

export const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'] as const;

/** Header yang diterima; kunci = nama kolom baku. */
const HEADER_ALIASES: Record<string, string> = {
  public_code: 'public_code',
  kode: 'public_code',
  kode_soal: 'public_code',
  stage_code: 'stage_code',
  stage: 'stage_code',
  subtest_code: 'subtest_code',
  subtest: 'subtest_code',
  subtes: 'subtest_code',
  category_path: 'category_path',
  kategori: 'category_path',
  type: 'type',
  tipe: 'type',
  tipe_soal: 'type',
  difficulty: 'difficulty',
  kesulitan: 'difficulty',
  stem_text: 'stem_text',
  stem: 'stem_text',
  soal: 'stem_text',
  teks_soal: 'stem_text',
  correct_labels: 'correct_labels',
  kunci: 'correct_labels',
  kunci_jawaban: 'correct_labels',
  jawaban: 'correct_labels',
  likert_dimension: 'likert_dimension',
  dimensi: 'likert_dimension',
  pair_group: 'pair_group',
  pasangan: 'pair_group',
  column_index: 'column_index',
  kolom: 'column_index',
  explanation: 'explanation',
  pembahasan: 'explanation',
  scoring_strategy: 'scoring_strategy',
  strategi_skor: 'scoring_strategy',
  weight: 'weight',
  bobot: 'weight',
  tags: 'tags',
  label: 'tags',
};

function normalizeHeader(raw: string): string {
  const key = raw
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  if (HEADER_ALIASES[key]) return HEADER_ALIASES[key];
  const imageMatch = /^image_(stem|opt)_?([a-e0-9]+)$/.exec(key);
  if (imageMatch) {
    const kind = imageMatch[1] === 'stem' ? 'image_stem' : 'image_opt';
    const suffix = imageMatch[2]?.toUpperCase() ?? '';
    return `${kind}_${suffix}`;
  }
  if (/^option_[a-e]$/.test(key)) return key;
  if (/^opsi_[a-e]$/.test(key)) return `option_${key.slice(5)}`;
  return key;
}

type RowRecord = Record<string, string>;

async function readSpreadsheet(
  buffer: Buffer,
  mime: string,
  filename: string,
): Promise<{ headers: string[]; rows: RowRecord[]; warnings: string[] }> {
  const isCsv = mime.includes('csv') || mime === 'text/plain' || filename.toLowerCase().endsWith('.csv');

  if (isCsv) {
    const text = decodeText(buffer);
    const result = Papa.parse<Record<string, string>>(text, {
      header: false,
      skipEmptyLines: 'greedy',
      transformHeader: normalizeHeader,
    });
    if (result.errors.length > 0) {
      const fatal = result.errors.filter((error) => error.type === 'Quotes' || error.type === 'Delimiter');
      if (fatal.length > 0) {
        throw new Error(`CSV tidak valid: ${fatal[0]?.message ?? 'struktur rusak'}`);
      }
    }
    const matrix = result.data as unknown as string[][];
    return matrixToRows(matrix, result.errors.map((error) => error.message));
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('Workbook tidak memiliki sheet');

  const matrix: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      values[colNumber - 1] = cellText(cell.value);
    });
    matrix.push(values);
  });

  return matrixToRows(matrix, []);
}

function matrixToRows(
  matrix: string[][],
  warnings: string[],
): { headers: string[]; rows: RowRecord[]; warnings: string[] } {
  const headerRow = matrix.find((row) => row.some((cell) => String(cell ?? '').trim().length > 0));
  if (!headerRow) return { headers: [], rows: [], warnings: [...warnings, 'Berkas kosong'] };

  const headers = headerRow.map((cell) => normalizeHeader(String(cell ?? '')));
  const rows: RowRecord[] = [];

  for (const row of matrix.slice(matrix.indexOf(headerRow) + 1)) {
    if (!row.some((cell) => String(cell ?? '').trim().length > 0)) continue;
    const record: RowRecord = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = String(row[index] ?? '').trim();
    });
    rows.push(record);
  }

  return { headers, rows, warnings };
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    if ('text' in value && typeof value.text === 'string') return value.text;
    if ('result' in value) return cellText((value as { result?: ExcelJS.CellValue }).result ?? '');
    if ('richText' in value) {
      return (value as ExcelJS.CellRichTextValue).richText.map((part) => part.text).join('');
    }
  }
  return String(value);
}

function decodeText(buffer: Buffer): string {
  // UTF-8 BOM dari Excel harus dibuang agar header pertama tidak rusak.
  const text = buffer.toString('utf8');
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function asStage(value: string | undefined): StageCode | undefined {
  const upper = value?.trim().toUpperCase();
  return STAGE_CODES.find((code) => code === upper);
}

function asSubtest(value: string | undefined): SubtestCode | undefined {
  const upper = value?.trim().toUpperCase().replace(/[\s-]+/g, '_');
  return SUBTEST_CODES.find((code) => code === upper);
}

function asType(value: string | undefined): QuestionType | undefined {
  const upper = value?.trim().toUpperCase().replace(/[\s-]+/g, '_');
  return QUESTION_TYPES.find((type) => type === upper);
}

function asDifficulty(value: string | undefined): QuestionDifficulty | undefined {
  const upper = value?.trim().toUpperCase();
  const map: Record<string, QuestionDifficulty> = {
    EASY: 'EASY',
    MUDAH: 'EASY',
    MEDIUM: 'MEDIUM',
    SEDANG: 'MEDIUM',
    HARD: 'HARD',
    SULIT: 'HARD',
  };
  const mapped = upper ? map[upper] : undefined;
  return QUESTION_DIFFICULTIES.find((difficulty) => difficulty === mapped);
}

/** Nama file gambar: pakai basename agar path absolut dari Excel diabaikan. */
export function imageBasename(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/\\/g, '/');
  return normalized.split('/').pop() ?? null;
}

export interface SpreadsheetParseResult extends ParsedFile {
  /** Rujukan gambar per baris: nama file + peran yang diminta. */
  imageRequests: Array<{
    rowNumber: number;
    filenames: string[];
    stemFiles: string[];
    optionFiles: Record<string, string>;
  }>;
}

export async function parseSpreadsheet(
  buffer: Buffer,
  mime: string,
  filename: string,
  settings: ImportSettings,
): Promise<SpreadsheetParseResult> {
  const { headers, rows, warnings } = await readSpreadsheet(buffer, mime, filename);

  if (!headers.includes('stem_text')) {
    throw new Error('Kolom wajib `stem_text` tidak ditemukan pada baris header');
  }

  const limited = rows.slice(0, IMPORT_MAX_ROWS);
  const overflow = rows.length > IMPORT_MAX_ROWS;

  const parsed: ParsedRow[] = [];
  const imageRequests: SpreadsheetParseResult['imageRequests'] = [];

  limited.forEach((row, index) => {
    const rowNumber = index + 2; // baris 1 = header
    const localWarnings: string[] = [];

    const options = OPTION_LABELS.map((label) => ({
      label,
      contentText: row[`option_${label.toLowerCase()}`]?.trim() || undefined,
    })).filter((option) => option.contentText);

    const correctLabels = parseCorrectLabels(row.correct_labels);
    const subtestCode = asSubtest(row.subtest_code);
    const stageCode = asStage(row.stage_code);
    const likertDimension = row.likert_dimension?.trim() || undefined;
    const explicitType = asType(row.type);

    let type = explicitType;
    if (!type && likertDimension?.includes(':')) type = 'LIKERT_STATEMENT';

    const stemText = row.stem_text?.trim() ?? '';
    if (!stemText) localWarnings.push('Teks soal kosong');
    if (correctLabels.length === 0 && type !== 'LIKERT_STATEMENT' && type !== 'PASS_HAND_COLUMN') {
      localWarnings.push('Kunci jawaban kosong');
    }

    const confidence = scoreConfidence({
      numbered: true,
      optionCount: options.length,
      keyValid: correctLabels.length > 0,
      subtestKnown: Boolean(subtestCode ?? settings.targetSubtestCode),
      warnings: localWarnings,
    });

    const { payload, issues, warnings: builtWarnings } = buildPayload(
      {
        rowNumber,
        rawText: null,
        publicCode: row.public_code?.trim() || undefined,
        stageCode,
        subtestCode,
        categoryPath: row.category_path?.trim() || undefined,
        type,
        difficulty: asDifficulty(row.difficulty),
        stemText,
        explanation: row.explanation?.trim() || null,
        pairGroup: row.pair_group?.trim() || null,
        columnIndex: row.column_index ? Number(row.column_index) : null,
        weight: row.weight ? Number(row.weight) : 1,
        scoringStrategy: row.scoring_strategy?.trim() || undefined,
        tags: row.tags ? row.tags.split(/[,;]/).map((tag) => tag.trim()).filter(Boolean) : [],
        likertDimension,
        options,
        correctLabels,
        warnings: [...localWarnings],
        confidence,
      },
      settings,
    );

    const stemFiles = ['1', '2', '3']
      .map((suffix) => imageBasename(row[`image_stem_${suffix}`]))
      .filter((name): name is string => Boolean(name));
    const optionFiles: Record<string, string> = {};
    for (const label of OPTION_LABELS) {
      const name = imageBasename(row[`image_opt_${label.toLowerCase()}`]);
      if (name) optionFiles[label] = name;
    }

    if (stemFiles.length > 0 || Object.keys(optionFiles).length > 0) {
      localWarnings.push('Gambar dirujuk dari kolom; unggah ZIP gambar agar dapat dipasang otomatis');
      imageRequests.push({
        rowNumber,
        filenames: [...stemFiles, ...Object.values(optionFiles)],
        stemFiles,
        optionFiles,
      });
    }

    parsed.push({
      rowNumber,
      rawText: null,
      payload,
      issues,
      warnings: [...new Set([...builtWarnings, ...localWarnings])],
      confidence,
    });
  });

  return {
    sourceKind: 'SPREADSHEET',
    rows: parsed,
    warnings: [
      ...warnings,
      ...(overflow ? [`Hanya ${IMPORT_MAX_ROWS} baris pertama diproses`] : []),
    ],
    pageCount: 0,
    imageRequests,
  };
}

/** Template XLSX dua sheet: kolom wajib + contoh baris. */
export async function buildTemplateWorkbook(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TES CAT';
  const sheet = workbook.addWorksheet('questions');
  const headers = [
    'public_code',
    'stage_code',
    'subtest_code',
    'category_path',
    'type',
    'difficulty',
    'stem_text',
    'option_a',
    'option_b',
    'option_c',
    'option_d',
    'option_e',
    'correct_labels',
    'likert_dimension',
    'pair_group',
    'column_index',
    'explanation',
    'scoring_strategy',
    'weight',
    'tags',
    'image_stem_1',
    'image_opt_a',
  ];
  sheet.addRow(headers);
  sheet.getRow(1).font = { bold: true };
  sheet.addRow([
    '',
    'PSIKOLOGI',
    'KECERDASAN',
    'psikologi/kecerdasan/verbal',
    'SINGLE_CHOICE',
    'MEDIUM',
    'Sinonim dari kata "abadi" adalah ...',
    'Kekal',
    'Sementara',
    'Berubah',
    'Baru',
    'Rusak',
    'A',
    '',
    '',
    '',
    'Abadi berarti kekal.',
    'KEYED_CORRECT',
    1,
    'verbal,sinonim',
    '',
    '',
  ]);
  sheet.columns.forEach((column) => {
    column.width = 18;
  });

  const help = workbook.addWorksheet('petunjuk');
  help.addRow(['Kolom', 'Wajib', 'Keterangan']);
  help.getRow(1).font = { bold: true };
  const rows: Array<[string, string, string]> = [
    ['stem_text', 'ya', 'Teks soal'],
    ['stage_code', 'tidak', 'PSIKOLOGI | TKK | TPK'],
    ['subtest_code', 'tidak', 'KECERDASAN | KEPRIBADIAN | KECERMATAN | PASS_HAND | TKK | TPK'],
    ['type', 'tidak', 'SINGLE_CHOICE | MULTI_CHOICE | IMAGE_CHOICE | LIKERT_STATEMENT | MISSING_ELEMENT | PASS_HAND_COLUMN'],
    ['difficulty', 'tidak', 'EASY | MEDIUM | HARD'],
    ['option_a..option_e', 'tidak', 'Teks opsi'],
    ['correct_labels', 'tidak', 'A atau A,C'],
    ['likert_dimension', 'tidak', 'contoh: honesty:+2'],
    ['pair_group', 'tidak', 'Kelompok pasangan jebakan'],
    ['column_index', 'tidak', 'Kolom untuk PASS_HAND_COLUMN'],
    ['image_stem_1', 'tidak', 'Nama file gambar stem di ZIP pendamping'],
    ['image_opt_a', 'tidak', 'Nama file gambar opsi A di ZIP pendamping'],
  ];
  rows.forEach((row) => help.addRow(row));
  help.columns.forEach((column) => {
    column.width = 34;
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export function stageForSubtest(subtestCode: SubtestCode): StageCode {
  return SUBTEST_STAGE[subtestCode];
}