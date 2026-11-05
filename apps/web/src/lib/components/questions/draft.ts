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

/**
 * Opsi yang perlu dikirim ke server.
 *
 * Untuk `IMAGE_CHOICE` isi opsi adalah gambar, jadi `contentText` boleh kosong —
 * yang menentukan apakah opsi dipakai adalah ada/tidaknya media `OPTION`
 * dengan label tersebut. Tanpa pengecualian ini semua opsi soal bergambar
 * terbuang saat submit dan server menolaknya.
 */
export function draftOptionsFor(draft: QuestionDraft): OptionDraft[] {
  if (!usesOptions(draft.type)) return [];

  const hasOptionMedia = (label: string): boolean =>
    draft.media.some((media) => media.role === 'OPTION' && media.optionLabel === label);

  return draft.options.filter(
    (option) => option.contentText.trim().length > 0 || hasOptionMedia(option.label),
  );
}

export interface DraftMediaIssues {
  /** `true` bila soal bergambar belum punya satu pun media STEM. */
  stemMissing: boolean;
  /** Label opsi yang belum punya gambar. */
  labelsWithoutMedia: string[];
}

/**
 * Kelengkapan media soal bergambar (F3-29).
 *
 * Server tetap sumber kebenaran (`questionShapeIssues`), tetapi form perlu tahu
 * lebih awal: admin harus melihat opsi mana yang belum bergambar sebelum menekan
 * simpan, bukan setelah ditolak dengan pesan umum.
 */
export function draftMediaIssues(draft: QuestionDraft): DraftMediaIssues {
  if (draft.type !== 'IMAGE_CHOICE') {
    return { stemMissing: false, labelsWithoutMedia: [] };
  }

  const labelsWithMedia = new Set(
    draft.media
      .filter((media) => media.role === 'OPTION' && media.optionLabel)
      .map((media) => media.optionLabel),
  );

  return {
    stemMissing: !draft.media.some((media) => media.role === 'STEM'),
    labelsWithoutMedia: draft.options
      .map((option) => option.label)
      .filter((label) => !labelsWithMedia.has(label)),
  };
}

/** Ubah draft menjadi payload `questionCreateSchema`. */
export function toPayload(draft: QuestionDraft): Record<string, unknown> {
  const options = draftOptionsFor(draft).map((option, index) => ({
    label: option.label,
    // Opsi bergambar boleh tanpa teks; jangan kirim string kosong agar kontrak
    // memperlakukannya sebagai "tidak ada teks".
    ...(option.contentText.trim() ? { contentText: option.contentText.trim() } : {}),
    isCorrect: option.isCorrect,
    scoreValue: option.scoreValue,
    sortOrder: index,
  }));

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
