import type {
  MediaRole,
  QuestionDifficulty,
  QuestionStatus,
  QuestionType,
  StageCode,
  SubtestCode,
} from '@webcat/contracts';

export interface OptionDraft {
  label: string;
  contentText: string;
  isCorrect: boolean;
  scoreValue: number;
}

export interface MediaDraft {
  mediaAssetId: string;
  role: MediaRole;
  optionLabel: string;
}

export interface QuestionDraft {
  publicCode: string;
  stageCode: StageCode;
  subtestCode: SubtestCode;
  categoryId: string;
  type: QuestionType;
  status: QuestionStatus;
  difficulty: QuestionDifficulty;
  stemText: string;
  stemFormat: 'MARKDOWN' | 'HTML';
  explanation: string;
  pairGroup: string;
  columnIndex: number | null;
  tags: string;
  options: OptionDraft[];
  media: MediaDraft[];
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

export function emptyDraft(): QuestionDraft {
  return {
    publicCode: '',
    stageCode: 'PSIKOLOGI',
    subtestCode: 'KECERDASAN',
    categoryId: '',
    type: 'SINGLE_CHOICE',
    status: 'DRAFT',
    difficulty: 'MEDIUM',
    stemText: '',
    stemFormat: 'MARKDOWN',
    explanation: '',
    pairGroup: '',
    columnIndex: null,
    tags: '',
    options: OPTION_LABELS.slice(0, 4).map((label) => ({
      label,
      contentText: '',
      isCorrect: false,
      scoreValue: 0,
    })),
    media: [],
  };
}

/** Tipe soal yang memakai opsi jawaban. */
export function usesOptions(type: QuestionType): boolean {
  return type !== 'PASS_HAND_COLUMN';
}

/** Hanya satu opsi benar untuk tipe pilihan tunggal/gambar/elemen hilang. */
export function singleCorrect(type: QuestionType): boolean {
  return (
    type === 'SINGLE_CHOICE' || type === 'IMAGE_CHOICE' || type === 'MISSING_ELEMENT'
  );
}

/** Ubah draft menjadi payload `questionCreateSchema`. */
export function toPayload(draft: QuestionDraft): Record<string, unknown> {
  const options = usesOptions(draft.type)
    ? draft.options
        .filter((option) => option.contentText.trim().length > 0)
        .map((option, index) => ({
          label: option.label,
          contentText: option.contentText.trim(),
          isCorrect: option.isCorrect,
          scoreValue: option.scoreValue,
          sortOrder: index,
        }))
    : [];

  return {
    publicCode: draft.publicCode.trim() || undefined,
    stageCode: draft.stageCode,
    subtestCode: draft.subtestCode,
    categoryId: draft.categoryId || null,
    type: draft.type,
    status: draft.status,
    difficulty: draft.difficulty,
    stemText: draft.stemText.trim(),
    stemFormat: draft.stemFormat,
    explanation: draft.explanation.trim() || null,
    pairGroup: draft.pairGroup.trim() || null,
    columnIndex: draft.type === 'PASS_HAND_COLUMN' ? draft.columnIndex : null,
    tags: draft.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    options,
    media: draft.media.map((media, index) => ({
      mediaAssetId: media.mediaAssetId,
      role: media.role,
      optionLabel: media.role === 'OPTION' ? media.optionLabel || undefined : undefined,
      sortOrder: index,
    })),
  };
}
