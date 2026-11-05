import { z } from 'zod';
import { STAGE_CODES, SUBTEST_CODES, type StageCode, type SubtestCode } from '../exams/index';

export const QUESTION_TYPES = [
  'SINGLE_CHOICE',
  'MULTI_CHOICE',
  'IMAGE_CHOICE',
  'LIKERT_STATEMENT',
  'MISSING_ELEMENT',
  'PASS_HAND_COLUMN',
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_STATUSES = ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export const QUESTION_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;
export type QuestionDifficulty = (typeof QUESTION_DIFFICULTIES)[number];

export const STEM_FORMATS = ['MARKDOWN', 'HTML'] as const;
export type StemFormat = (typeof STEM_FORMATS)[number];

export const MEDIA_ROLES = ['STEM', 'OPTION', 'EXPLANATION'] as const;
export type MediaRole = (typeof MEDIA_ROLES)[number];

/** Subtes yang sah untuk setiap stage. Dipakai validasi API + form admin. */
export const STAGE_SUBTESTS: Record<StageCode, readonly SubtestCode[]> = {
  PSIKOLOGI: ['KECERDASAN', 'KEPRIBADIAN', 'KECERMATAN', 'PASS_HAND'],
  TPA: ['TPA'],
  TPK: ['TPK'],
};

export function isValidStageSubtest(stage: StageCode, subtest: SubtestCode): boolean {
  return STAGE_SUBTESTS[stage].includes(subtest);
}

/* ------------------------------------------------------------------ options */

export const questionOptionInputSchema = z.object({
  label: z
    .string()
    .trim()
    .regex(/^[A-J]$/, 'Label opsi harus satu huruf A–J'),
  contentText: z.string().trim().max(5000).optional(),
  isCorrect: z.boolean().default(false),
  scoreValue: z.coerce.number().min(-100).max(100).default(0),
  dimensionMap: z.record(z.string(), z.coerce.number().min(-10).max(10)).optional(),
  sortOrder: z.coerce.number().int().min(0).max(99).default(0),
});
export type QuestionOptionInput = z.infer<typeof questionOptionInputSchema>;

export const questionMediaInputSchema = z.object({
  mediaAssetId: z.string().uuid(),
  role: z.enum(MEDIA_ROLES).default('STEM'),
  optionLabel: z
    .string()
    .trim()
    .regex(/^[A-J]$/)
    .optional(),
  altText: z.string().trim().max(300).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});
export type QuestionMediaInput = z.infer<typeof questionMediaInputSchema>;

/* ------------------------------------------------------------------ question */

const baseQuestionObject = z.object({
  publicCode: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[A-Za-z0-9._-]+$/, 'Kode soal hanya huruf, angka, titik, garis bawah, dan hubung')
    .optional(),
  stageCode: z.enum(STAGE_CODES),
  subtestCode: z.enum(SUBTEST_CODES),
  categoryId: z.string().uuid().nullable().optional(),
  type: z.enum(QUESTION_TYPES),
  status: z.enum(QUESTION_STATUSES).default('DRAFT'),
  difficulty: z.enum(QUESTION_DIFFICULTIES).default('MEDIUM'),
  stemText: z.string().trim().min(1, 'Teks soal wajib diisi').max(20000),
  stemFormat: z.enum(STEM_FORMATS).default('MARKDOWN'),
  explanation: z.string().trim().max(20000).nullable().optional(),
  scoringStrategy: z.string().trim().min(2).max(64).optional(),
  scoringConfig: z.record(z.string(), z.unknown()).nullable().optional(),
  weight: z.coerce.number().min(0.001).max(1000).default(1),
  pairGroup: z.string().trim().max(40).nullable().optional(),
  columnIndex: z.coerce.number().int().min(0).max(999).nullable().optional(),
  dedupeOverride: z.boolean().default(false),
  options: z.array(questionOptionInputSchema).max(10).default([]),
  media: z.array(questionMediaInputSchema).max(10).default([]),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export type QuestionShapeInput = z.infer<typeof baseQuestionObject>;

/** Kesalahan bentuk soal yang dipakai bersama API, form, dan test. */
export function questionShapeIssues(input: QuestionShapeInput): string[] {
  const issues: string[] = [];

  if (!isValidStageSubtest(input.stageCode, input.subtestCode)) {
    issues.push(`Subtes ${input.subtestCode} tidak berada di stage ${input.stageCode}`);
  }

  const labels = input.options.map((option) => option.label);
  if (new Set(labels).size !== labels.length) {
    issues.push('Label opsi tidak boleh duplikat');
  }

  const correct = input.options.filter((option) => option.isCorrect).length;

  switch (input.type) {
    case 'PASS_HAND_COLUMN':
      if (input.options.length > 0) issues.push('Soal Pass Hand tidak memakai opsi jawaban');
      if (input.columnIndex === null || input.columnIndex === undefined) {
        issues.push('Kolom Pass Hand wajib memiliki columnIndex');
      }
      break;

    case 'LIKERT_STATEMENT':
      if (input.options.length < 2 || input.options.length > 5) {
        issues.push('Soal Likert membutuhkan 2–5 opsi');
      }
      if (input.columnIndex !== null && input.columnIndex !== undefined) {
        issues.push('columnIndex hanya untuk soal Pass Hand');
      }
      break;

    case 'MULTI_CHOICE':
      if (input.options.length < 2 || input.options.length > 5) {
        issues.push('Soal pilihan ganda membutuhkan 2–5 opsi');
      }
      if (correct < 1) issues.push('Minimal satu opsi harus ditandai benar');
      break;

    case 'SINGLE_CHOICE':
    case 'IMAGE_CHOICE':
    case 'MISSING_ELEMENT':
      if (input.options.length < 2 || input.options.length > 5) {
        issues.push('Soal pilihan tunggal membutuhkan 2–5 opsi');
      }
      if (correct !== 1) issues.push('Tepat satu opsi harus ditandai benar');
      break;
  }

  for (const media of input.media) {
    if (media.role === 'OPTION' && !media.optionLabel) {
      issues.push('Media opsi wajib menyebut label opsi');
    }
    if (media.role !== 'OPTION' && media.optionLabel) {
      issues.push('optionLabel hanya untuk media ber-role OPTION');
    }
  }

  /**
   * Soal bergambar (F3-27).
   *
   * Tanpa ini, admin bisa menyimpan `IMAGE_CHOICE` tanpa satu gambar pun dan
   * peserta melihat deretan tile kosong. Aturannya:
   *   - wajib ada minimal satu media `STEM`;
   *   - SETIAP opsi wajib punya media `OPTION` (bukan hanya sebagian).
   */
  if (input.type === 'IMAGE_CHOICE') {
    if (!input.media.some((media) => media.role === 'STEM')) {
      issues.push('Soal bergambar wajib memiliki minimal satu gambar pada stem');
    }

    const labelsWithMedia = new Set(
      input.media
        .filter((media) => media.role === 'OPTION')
        .map((media) => media.optionLabel)
        .filter((label): label is string => Boolean(label)),
    );
    const labelsWithoutMedia = input.options
      .map((option) => option.label)
      .filter((label) => !labelsWithMedia.has(label));

    if (labelsWithoutMedia.length > 0) {
      issues.push(`Opsi ${labelsWithoutMedia.join(', ')} belum memiliki gambar`);
    }
  }

  return issues;
}

export const questionCreateSchema = baseQuestionObject.superRefine((value, ctx) => {
  for (const message of questionShapeIssues(value)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message });
  }
});
export type QuestionCreateInput = z.infer<typeof questionCreateSchema>;

/** Update parsial; service menggabungkan dengan data lama lalu memvalidasi ulang. */
export const questionUpdateSchema = baseQuestionObject.partial();
export type QuestionUpdateInput = z.infer<typeof questionUpdateSchema>;

export const questionPreviewSchema = questionCreateSchema;
export type QuestionPreviewInput = QuestionCreateInput;

/* ------------------------------------------------------------------ queries */

export const questionListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().trim().min(1).optional(),
  q: z.string().trim().max(200).optional(),
  stageCode: z.enum(STAGE_CODES).optional(),
  subtestCode: z.enum(SUBTEST_CODES).optional(),
  type: z.enum(QUESTION_TYPES).optional(),
  status: z.enum(QUESTION_STATUSES).optional(),
  difficulty: z.enum(QUESTION_DIFFICULTIES).optional(),
  categoryId: z.string().uuid().optional(),
  tag: z.string().trim().max(40).optional(),
  /** Hanya soal yang lahir dari job impor tertentu. */
  sourceImportId: z.string().uuid().optional(),
  hasMedia: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});
export type QuestionListQuery = z.infer<typeof questionListQuerySchema>;

export const bulkQuestionActionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
  action: z.enum(['PUBLISH', 'ARCHIVE', 'DELETE', 'RESTORE']),
  reason: z.string().trim().max(500).optional(),
});
export type BulkQuestionActionInput = z.infer<typeof bulkQuestionActionSchema>;

/* ------------------------------------------------------------------ views */

export interface QuestionMediaView {
  id: string;
  mediaAssetId: string;
  role: MediaRole;
  optionLabel: string | null;
  altText: string | null;
  sortOrder: number;
  url: string;
  mime: string;
  width: number | null;
  height: number | null;
}

export interface QuestionOptionView {
  id: string;
  label: string;
  contentText: string | null;
  isCorrect: boolean;
  scoreValue: number;
  dimensionMap: Record<string, number> | null;
  sortOrder: number;
  media: QuestionMediaView[];
}

export interface QuestionView {
  id: string;
  publicCode: string;
  stageCode: StageCode;
  subtestCode: SubtestCode;
  categoryId: string | null;
  categoryName: string | null;
  type: QuestionType;
  status: QuestionStatus;
  difficulty: QuestionDifficulty;
  stemText: string;
  stemFormat: StemFormat;
  explanation: string | null;
  scoringStrategy: string;
  scoringConfig: Record<string, unknown> | null;
  weight: number;
  pairGroup: string | null;
  columnIndex: number | null;
  dedupeHash: string;
  dedupeOverride: boolean;
  /** Job impor asal soal, bila soal dibuat lewat impor. */
  sourceImportId: string | null;
  createdAt: string;
  updatedAt: string;
  options: QuestionOptionView[];
  media: QuestionMediaView[];
  tags: string[];
}

export interface QuestionListItem {
  id: string;
  publicCode: string;
  stageCode: StageCode;
  subtestCode: SubtestCode;
  type: QuestionType;
  status: QuestionStatus;
  difficulty: QuestionDifficulty;
  stemPreview: string;
  categoryName: string | null;
  optionsCount: number;
  mediaCount: number;
  updatedAt: string;
}

export interface QuestionListResponse {
  rows: QuestionListItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface QuestionStatsItem {
  stageCode: StageCode;
  subtestCode: SubtestCode;
  subtestName: string;
  required: number;
  published: number;
  draft: number;
  review: number;
  archived: number;
  ready: boolean;
  shortage: number;
}

export interface QuestionStatsResponse {
  generatedAt: string;
  items: QuestionStatsItem[];
  totals: {
    required: number;
    published: number;
    readySubtests: number;
    totalSubtests: number;
  };
}

export interface BulkQuestionActionResult {
  affected: number;
  action: string;
}

export interface QuestionPublishResult {
  question: QuestionView;
}

export interface QuestionPreviewResult {
  valid: boolean;
  issues: string[];
  dedupeHash: string;
  duplicate: boolean;
  duplicateQuestionId: string | null;
}
