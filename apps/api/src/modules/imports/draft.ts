import {
  isValidStageSubtest,
  questionShapeIssues,
  type ImportQuestionPayload,
  type QuestionDifficulty,
  type QuestionType,
  type StageCode,
  type SubtestCode,
} from '@webcat/contracts';
import { DEFAULT_LIKERT_SCALE, SUBTEST_STAGE, type ImportSettings } from './imports.types';

/** Bentuk netral yang dipakai parser spreadsheet maupun dokumen. */
export interface QuestionDraft {
  rowNumber: number;
  rawText: string | null;
  page?: number;
  publicCode?: string;
  stageCode?: StageCode;
  subtestCode?: SubtestCode;
  categoryPath?: string;
  type?: QuestionType;
  difficulty?: QuestionDifficulty;
  stemText: string;
  explanation?: string | null;
  pairGroup?: string | null;
  columnIndex?: number | null;
  weight?: number;
  scoringStrategy?: string;
  tags?: string[];
  likertDimension?: string;
  options: Array<{ label: string; contentText?: string; isCorrect?: boolean }>;
  correctLabels: string[];
  warnings: string[];
  confidence: number;
  imageRefs?: Array<{ index: number; role: 'STEM' | 'OPTION'; optionLabel?: string }>;
}

export interface BuiltPayload {
  payload: ImportQuestionPayload;
  issues: string[];
  warnings: string[];
}

/**
 * Ubah draft hasil parser menjadi payload impor final + daftar masalah.
 *
 * Aturan bentuk soal memakai `questionShapeIssues` dari kontrak agar hasil
 * impor tidak pernah lebih longgar daripada input manual.
 */
export function buildPayload(draft: QuestionDraft, settings: ImportSettings): BuiltPayload {
  const warnings = [...draft.warnings];
  const issues: string[] = [];

  const subtestCode = draft.subtestCode ?? settings.targetSubtestCode ?? settings.detectedSubtestCode;
  const stageCode = draft.stageCode ?? settings.targetStageCode ??
    (subtestCode ? SUBTEST_STAGE[subtestCode] : undefined);

  if (!subtestCode) issues.push('Subtes belum ditentukan');
  if (!stageCode) issues.push('Stage belum ditentukan');

  const type = draft.type ?? settings.defaultType;
  const difficulty = draft.difficulty ?? settings.defaultDifficulty;

  let options = draft.options.map((option, index) => ({
    label: option.label,
    contentText: option.contentText?.trim() || undefined,
    isCorrect: option.isCorrect ?? draft.correctLabels.includes(option.label),
    scoreValue: 0,
    sortOrder: index,
  }));

  if (type === 'LIKERT_STATEMENT' && options.length === 0) {
    const dimension = draft.likertDimension ?? 'dimensi';
    const direction = draft.likertDimension?.includes(':')
      ? draft.likertDimension.split(':')[1]?.trim().startsWith('-')
        ? -1
        : 1
      : 1;
    options = DEFAULT_LIKERT_SCALE.map((text, index) => ({
      label: String.fromCharCode(65 + index),
      contentText: text,
      isCorrect: false,
      scoreValue: 0,
      sortOrder: index,
      dimensionMap: { [dimension.split(':')[0] ?? dimension]: (2 - index) * direction },
    })) as typeof options;
  }

  const correctLabels = draft.correctLabels.length
    ? draft.correctLabels
    : options.filter((option) => option.isCorrect).map((option) => option.label);

  if (correctLabels.length > 0) {
    options = options.map((option) => ({
      ...option,
      isCorrect: correctLabels.includes(option.label),
    }));
  }

  const columnIndex =
    type === 'PASS_HAND_COLUMN' ? (draft.columnIndex ?? draft.rowNumber - 1) : null;

  const payload: ImportQuestionPayload = {
    publicCode: draft.publicCode,
    stageCode: stageCode as StageCode,
    subtestCode: subtestCode as SubtestCode,
    categoryId: settings.categoryId ?? null,
    categoryPath: draft.categoryPath,
    type,
    difficulty,
    stemText: draft.stemText.trim(),
    stemFormat: 'MARKDOWN',
    explanation: draft.explanation ?? null,
    options,
    correctLabels,
    likertDimension: draft.likertDimension,
    pairGroup: draft.pairGroup ?? null,
    columnIndex,
    tags: draft.tags ?? [],
    scoringStrategy: draft.scoringStrategy,
    weight: draft.weight ?? 1,
    media: [],
    confidence: draft.confidence,
    warnings,
  };

  if (!payload.stemText) issues.push('Teks soal kosong');

  if (stageCode && subtestCode && !isValidStageSubtest(stageCode, subtestCode)) {
    issues.push(`Subtes ${subtestCode} tidak berada di stage ${stageCode}`);
  }

  for (const label of correctLabels) {
    if (!payload.options.some((option) => option.label === label)) {
      issues.push(`Kunci ${label} tidak memiliki opsi`);
    }
  }

  if (stageCode && subtestCode) {
    const shapeIssues = questionShapeIssues({
      publicCode: payload.publicCode,
      stageCode,
      subtestCode,
      categoryId: null,
      type,
      status: 'DRAFT',
      difficulty,
      stemText: payload.stemText,
      stemFormat: 'MARKDOWN',
      explanation: payload.explanation ?? null,
      scoringStrategy: payload.scoringStrategy,
      scoringConfig: null,
      weight: payload.weight,
      pairGroup: payload.pairGroup,
      columnIndex: payload.columnIndex,
      dedupeOverride: false,
      options: payload.options.map((option) => ({
        label: option.label,
        contentText: option.contentText,
        isCorrect: option.isCorrect,
        scoreValue: option.scoreValue,
        dimensionMap: option.dimensionMap,
        sortOrder: option.sortOrder,
      })),
      media: [],
      tags: payload.tags,
    });
    issues.push(...shapeIssues);
  }

  if (type === 'LIKERT_STATEMENT' && !draft.pairGroup) {
    warnings.push('pair_group kosong; pasangan jebakan tidak dapat diukur');
  }

  return { payload, issues: [...new Set(issues)], warnings: [...new Set(warnings)] };
}

/** Normalisasi label kunci: "a, c" → ["A", "C"]. */
export function parseCorrectLabels(value: string | undefined): string[] {
  if (!value) return [];
  return [
    ...new Set(
      value
        .toUpperCase()
        .split(/[^A-J]+/)
        .map((part) => part.trim())
        .filter((part) => /^[A-J]$/.test(part)),
    ),
  ];
}

/**
 * Confidence heuristik sesuai §10.4C:
 * nomor (0,2) + opsi (0,25) + kunci valid (0,3) + subtes konsisten (0,15) +
 * tanpa peringatan (0,1).
 */
export function scoreConfidence(input: {
  numbered: boolean;
  optionCount: number;
  keyValid: boolean;
  subtestKnown: boolean;
  warnings: string[];
}): number {
  let score = 0;
  if (input.numbered) score += 0.2;
  if (input.optionCount >= 2) score += 0.25;
  if (input.keyValid) score += 0.3;
  if (input.subtestKnown) score += 0.15;
  if (input.warnings.length === 0) score += 0.1;
  return Math.round(Math.min(1, score) * 10000) / 10000;
}