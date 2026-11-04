import type {
  ImportQuestionPayload,
  ImportSourceKind,
  QuestionDifficulty,
  QuestionType,
  StageCode,
  SubtestCode,
} from '@webcat/contracts';

export interface ImportSettings {
  targetStageCode?: StageCode;
  targetSubtestCode?: SubtestCode;
  defaultType: QuestionType;
  defaultDifficulty: QuestionDifficulty;
  dedupeMode: 'SKIP' | 'WARN' | 'OVERRIDE';
  autoDetect: boolean;
  categoryId?: string | null;
  /** Hanya untuk impor dokumen: subtes hasil deteksi heading. */
  detectedSubtestCode?: SubtestCode | null;
}

/** Satu baris hasil ekstraksi sebelum disimpan ke `import_job_items`. */
export interface ParsedRow {
  rowNumber: number;
  rawText: string | null;
  page?: number;
  payload: ImportQuestionPayload | null;
  issues: string[];
  warnings: string[];
  confidence: number;
  /** Rujukan gambar hasil ekstraksi dokumen; diisi saat penyimpanan. */
  imageRefs?: Array<{
    index: number;
    role: 'STEM' | 'OPTION';
    optionLabel?: string;
  }>;
}

export interface ParsedFile {
  sourceKind: ImportSourceKind;
  rows: ParsedRow[];
  warnings: string[];
  pageCount: number;
  detectedSubtestCode?: SubtestCode | null;
}

export interface ExtractedImageCandidate {
  index: number;
  page?: number;
  blockIndex?: number;
  role?: 'STEM' | 'OPTION';
  optionLabel?: string;
  data: Uint8Array;
  mime: string;
  width?: number;
  height?: number;
}

export const SUBTEST_STAGE: Record<SubtestCode, StageCode> = {
  KECERDASAN: 'PSIKOLOGI',
  KEPRIBADIAN: 'PSIKOLOGI',
  KECERMATAN: 'PSIKOLOGI',
  PASS_HAND: 'PSIKOLOGI',
  TPA: 'TPA',
  TPK: 'TPK',
};

export const DEFAULT_LIKERT_SCALE = [
  'Sangat Setuju',
  'Setuju',
  'Ragu-ragu',
  'Tidak Setuju',
  'Sangat Tidak Setuju',
];