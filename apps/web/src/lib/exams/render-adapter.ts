import type { ExamQuestion } from '@webcat/contracts';
import type { RenderQuestion } from '../components/questions/types';

/**
 * F3-15 — satu adapter data untuk soal figural.
 *
 * Soal bergambar tampil di dua layar:
 *   1. runner ujian memakai DTO peserta (`ExamQuestion` — field `alt`, `text`),
 *   2. pratinjau admin memakai `RenderQuestion` (field `altText`, `contentText`).
 *
 * Kalau keduanya membaca data dengan aturannya sendiri, aturan penting seperti
 * "media `EXPLANATION` tidak boleh tampil" atau "opsi tanpa gambar tetap tampil
 * sebagai placeholder" bisa berbeda di dua layar. Adapter ini menyatukan
 * pembacaan data; markup/CSS tetap milik masing-masing layar karena runner
 * butuh layout responsif yang berbeda dari form admin.
 */

/** Bentuk minimal yang bisa dibaca adapter (superset kedua tipe). */
export interface TileMediaLike {
  url: string;
  role?: string | null;
  /** DTO ujian. */
  alt?: string | null;
  /** Form admin. */
  altText?: string | null;
}

export interface TileOptionLike {
  id?: string | null;
  label: string;
  /** DTO ujian. */
  text?: string | null;
  /** Form admin. */
  contentText?: string | null;
  isCorrect?: boolean | null;
  media?: TileMediaLike[] | null;
}

export interface TileQuestionLike {
  type: string;
  media?: TileMediaLike[] | null;
  options: TileOptionLike[];
}

/** Media siap dirender; entri tanpa URL sudah dibuang. */
export interface TileMedia {
  url: string;
  alt: string;
}

export interface TileOption {
  /** `null` bila soal datang dari pratinjau yang belum punya id. */
  id: string | null;
  label: string;
  text: string | null;
  isCorrect: boolean;
  media: TileMedia[];
}

export interface ImageTileView {
  /** Media stem; `EXPLANATION` dibuang (F3-09). */
  stemMedia: TileMedia[];
  /** Semua opsi, termasuk yang belum bergambar (agar placeholder tampil). */
  options: TileOption[];
}

function mediaOf(entries: readonly TileMediaLike[] | null | undefined): TileMedia[] {
  if (!Array.isArray(entries)) return [];
  const result: TileMedia[] = [];
  for (const entry of entries) {
    if (!entry || typeof entry.url !== 'string' || entry.url.length === 0) continue;
    result.push({ url: entry.url, alt: entry.alt ?? entry.altText ?? '' });
  }
  return result;
}

/**
 * Media stem hanya `role === 'STEM'`.
 *
 * Media dari form admin yang baru dipilih belum punya `role`; entri tanpa role
 * dianggap media soal supaya pratinjau tidak kosong sebelum soal disimpan.
 */
function stemMediaOf(entries: readonly TileMediaLike[] | null | undefined): TileMedia[] {
  if (!Array.isArray(entries)) return [];
  return mediaOf(
    entries.filter(
      (entry) => entry && (entry.role === undefined || entry.role === null || entry.role === 'STEM'),
    ),
  );
}

function optionTextOf(option: TileOptionLike): string | null {
  const text = option.text ?? option.contentText ?? null;
  return typeof text === 'string' && text.trim().length > 0 ? text : null;
}

/** Normalisasi soal (runner atau pratinjau admin) menjadi view tile gambar. */
export function toImageTileView(question: TileQuestionLike): ImageTileView {
  return {
    stemMedia: stemMediaOf(question.media),
    options: question.options.map((option) => ({
      id: option.id ?? null,
      label: option.label,
      text: optionTextOf(option),
      isCorrect: option.isCorrect === true,
      media: mediaOf(option.media),
    })),
  };
}

/** Adapter untuk DTO peserta. */
export function examQuestionTileView(question: ExamQuestion): ImageTileView {
  return toImageTileView(question);
}

/** Adapter untuk soal pratinjau admin. */
export function renderQuestionTileView(question: RenderQuestion): ImageTileView {
  return toImageTileView({
    type: question.type,
    media: question.media ?? [],
    options: question.options.map((option) => ({
      id: option.id ?? null,
      label: option.label,
      contentText: option.contentText,
      isCorrect: option.isCorrect,
      media: option.media ?? [],
    })),
  });
}
