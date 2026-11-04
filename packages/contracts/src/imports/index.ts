import { z } from 'zod';
import {
  MEDIA_ROLES,
  QUESTION_DIFFICULTIES,
  QUESTION_TYPES,
} from '../questions/index';
import { STAGE_CODES, SUBTEST_CODES } from '../exams/index';

export const IMPORT_SOURCE_KINDS = ['SPREADSHEET', 'PDF', 'DOCX'] as const;
export type ImportSourceKind = (typeof IMPORT_SOURCE_KINDS)[number];

export const IMPORT_JOB_STATUSES = [
  'UPLOADED',
  'PARSING',
  'PARSED',
  'REVIEWING',
  'COMMITTING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
] as const;
export type ImportJobStatus = (typeof IMPORT_JOB_STATUSES)[number];

export const IMPORT_ITEM_STATUSES = [
  'VALID',
  'INVALID',
  'DUPLICATE',
  'IMPORTED',
  'SKIPPED',
] as const;
export type ImportItemStatus = (typeof IMPORT_ITEM_STATUSES)[number];

export const IMPORT_DEDUPE_MODES = ['SKIP', 'WARN', 'OVERRIDE'] as const;
export type ImportDedupeMode = (typeof IMPORT_DEDUPE_MODES)[number];

export const IMPORT_MAX_BYTES = 10 * 1024 * 1024;
export const IMPORT_MAX_ROWS = 5000;

/** Field non-file saat membuat job impor (multipart/form-data). */
export const importCreateSchema = z.object({
  targetStageCode: z.enum(STAGE_CODES).optional(),
  targetSubtestCode: z.enum(SUBTEST_CODES).optional(),
  categoryId: z.string().uuid().optional(),
  defaultType: z.enum(QUESTION_TYPES).default('SINGLE_CHOICE'),
  defaultDifficulty: z.enum(QUESTION_DIFFICULTIES).default('MEDIUM'),
  dedupeMode: z.enum(IMPORT_DEDUPE_MODES).default('SKIP'),
  autoDetect: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .default('true'),
});
export type ImportCreateInput = z.infer<typeof importCreateSchema>;

/** Bentuk satu baris hasil ekstraksi yang dapat diedit di review UI. */
export const importQuestionPayloadSchema = z.object({
  publicCode: z.string().trim().max(60).optional(),
  stageCode: z.enum(STAGE_CODES).optional(),
  subtestCode: z.enum(SUBTEST_CODES).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  categoryPath: z.string().trim().max(300).optional(),
  type: z.enum(QUESTION_TYPES).optional(),
  difficulty: z.enum(QUESTION_DIFFICULTIES).optional(),
  stemText: z.string().trim().min(1, 'Teks soal wajib ada').max(20000),
  stemFormat: z.enum(['MARKDOWN', 'HTML']).optional(),
  explanation: z.string().trim().max(20000).nullable().optional(),
  options: z
    .array(
      z.object({
        label: z.string().trim().regex(/^[A-J]$/),
        contentText: z.string().trim().max(5000).optional(),
        isCorrect: z.boolean().default(false),
        scoreValue: z.coerce.number().min(-100).max(100).default(0),
        dimensionMap: z.record(z.string(), z.coerce.number()).optional(),
        sortOrder: z.coerce.number().int().min(0).max(99).default(0),
      }),
    )
    .max(10)
    .default([]),
  correctLabels: z.array(z.string().trim().regex(/^[A-J]$/)).max(10).default([]),
  /** Dimensi Likert (mis. `honesty`), dipetakan ke skala +2..-2 per opsi. */
  likertDimension: z.string().trim().max(40).optional(),
  pairGroup: z.string().trim().max(40).nullable().optional(),
  columnIndex: z.coerce.number().int().min(0).max(999).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  scoringStrategy: z.string().trim().max(64).optional(),
  weight: z.coerce.number().min(0.001).max(1000).default(1),
  /** Aset media hasil resolusi gambar (ZIP atau gambar inline dokumen). */
  media: z
    .array(
      z.object({
        mediaAssetId: z.string().uuid(),
        role: z.enum(MEDIA_ROLES).default('STEM'),
        optionLabel: z
          .string()
          .trim()
          .regex(/^[A-J]$/)
          .optional(),
        altText: z.string().trim().max(300).optional(),
        sortOrder: z.coerce.number().int().min(0).max(999).default(0),
      }),
    )
    .max(10)
    .default([]),
  confidence: z.coerce.number().min(0).max(1).optional(),
  warnings: z.array(z.string().max(500)).max(50).default([]),
});
export type ImportQuestionPayload = z.infer<typeof importQuestionPayloadSchema>;

export const importListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().trim().min(1).optional(),
  status: z.enum(IMPORT_JOB_STATUSES).optional(),
  sourceKind: z.enum(IMPORT_SOURCE_KINDS).optional(),
});
export type ImportListQuery = z.infer<typeof importListQuerySchema>;

export const importPreviewQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.coerce.number().int().min(1).optional(),
  status: z.enum(IMPORT_ITEM_STATUSES).optional(),
});
export type ImportPreviewQuery = z.infer<typeof importPreviewQuerySchema>;

export const importItemUpdateSchema = z
  .object({
    payload: importQuestionPayloadSchema.optional(),
    skip: z.boolean().optional(),
  })
  .refine((value) => value.payload !== undefined || value.skip !== undefined, {
    message: 'Kirim payload atau skip',
  });
export type ImportItemUpdateInput = z.infer<typeof importItemUpdateSchema>;

export const importCommitSchema = z.object({
  itemIds: z.array(z.string().uuid()).max(5000).optional(),
  targetStatus: z.enum(['DRAFT', 'REVIEW']).default('DRAFT'),
  dedupeMode: z.enum(IMPORT_DEDUPE_MODES).optional(),
  categoryId: z.string().uuid().nullable().optional(),
});
export type ImportCommitInput = z.infer<typeof importCommitSchema>;

export interface ImportJobStats {
  total: number;
  valid: number;
  invalid: number;
  duplicate: number;
  imported: number;
  skipped: number;
}

export interface ImportJobView {
  id: string;
  sourceKind: ImportSourceKind;
  status: ImportJobStatus;
  originalName: string;
  mime: string;
  sizeBytes: number;
  totalRows: number;
  processedRows: number;
  stats: ImportJobStats;
  warnings: string[];
  createdAt: string;
  finishedAt: string | null;
}

export interface ImportItemView {
  id: string;
  rowNumber: number;
  status: ImportItemStatus;
  confidence: number | null;
  payload: ImportQuestionPayload | null;
  rawText: string | null;
  issues: string[];
  questionId: string | null;
}

export interface ImportJobListResponse {
  rows: ImportJobView[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ImportPreviewResponse {
  job: ImportJobView;
  rows: ImportItemView[];
  nextCursor: number | null;
  hasMore: boolean;
  summary: ImportJobStats;
}

export interface ImportCommitResult {
  job: ImportJobView;
  created: number;
  skipped: number;
  failed: number;
  errors: Array<{ rowNumber: number; code: string; message: string }>;
}

export interface ImportTemplateColumn {
  key: string;
  required: boolean;
  description: string;
}

export const IMPORT_TEMPLATE_COLUMNS: readonly ImportTemplateColumn[] = [
  { key: 'public_code', required: false, description: 'Kode unik soal (opsional)' },
  { key: 'stage_code', required: false, description: 'PSIKOLOGI | TPA | TPK' },
  { key: 'subtest_code', required: false, description: 'KECERDASAN | KEPRIBADIAN | KECERMATAN | PASS_HAND | TPA | TPK' },
  { key: 'category_path', required: false, description: 'contoh: psikologi/kecerdasan/verbal' },
  { key: 'type', required: false, description: 'SINGLE_CHOICE | MULTI_CHOICE | IMAGE_CHOICE | LIKERT_STATEMENT | MISSING_ELEMENT | PASS_HAND_COLUMN' },
  { key: 'difficulty', required: false, description: 'EASY | MEDIUM | HARD' },
  { key: 'stem_text', required: true, description: 'Teks soal' },
  { key: 'option_a', required: false, description: 'Teks opsi A' },
  { key: 'option_b', required: false, description: 'Teks opsi B' },
  { key: 'option_c', required: false, description: 'Teks opsi C' },
  { key: 'option_d', required: false, description: 'Teks opsi D' },
  { key: 'option_e', required: false, description: 'Teks opsi E' },
  { key: 'correct_labels', required: false, description: 'A atau A,C' },
  { key: 'likert_dimension', required: false, description: 'Dimensi untuk Likert, contoh: honesty:+2' },
  { key: 'pair_group', required: false, description: 'Kelompok pasangan jebakan' },
  { key: 'column_index', required: false, description: 'Kolom untuk tipe PASS_HAND_COLUMN' },
  { key: 'explanation', required: false, description: 'Pembahasan' },
  { key: 'scoring_strategy', required: false, description: 'Default KEYED_CORRECT' },
  { key: 'weight', required: false, description: 'Bobot soal, default 1' },
  { key: 'image_stem_1', required: false, description: 'Nama file gambar stem' },
  { key: 'image_opt_a', required: false, description: 'Nama file gambar opsi A' },
];
