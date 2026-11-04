import type { MediaRole, QuestionType } from '@webcat/contracts';

/** Media siap tampil di renderer. */
export interface RenderMedia {
  id?: string;
  url: string;
  mime?: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
  role?: MediaRole;
}

export interface RenderOption {
  id?: string;
  label: string;
  contentText: string | null;
  isCorrect?: boolean;
  scoreValue?: number;
  dimensionMap?: Record<string, number> | null;
  media?: RenderMedia[];
}

export interface RenderQuestion {
  id?: string;
  publicCode?: string;
  type: QuestionType;
  stemText: string;
  stemFormat?: 'MARKDOWN' | 'HTML';
  columnIndex?: number | null;
  pairGroup?: string | null;
  options: RenderOption[];
  media?: RenderMedia[];
}

/**
 * Props bersama semua renderer soal.
 *
 * `showAnswerKey` hanya untuk pratinjau admin; runner ujian memakai default
 * `false` sehingga kunci jawaban tidak pernah sampai ke peserta.
 */
export interface QuestionRendererProps {
  question: RenderQuestion;
  showAnswerKey?: boolean;
  selected?: string[];
  onselect?: (labels: string[]) => void;
}

/** Label opsi baku. */
export const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'] as const;

/** Aset media yang bisa dipilih di form soal. */
export interface MediaPickerItem {
  id: string;
  url: string;
  altText?: string | null;
}

/** Penempatan media pada soal (stem/opsi/pembahasan). */
export interface MediaAssignment {
  mediaAssetId: string;
  role: MediaRole;
  optionLabel?: string;
  altText?: string;
  sortOrder: number;
}
