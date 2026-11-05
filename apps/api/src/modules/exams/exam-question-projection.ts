import { Inject, Injectable } from '@nestjs/common';
import type {
  AnswerPayload,
  ExamMediaRef,
  ExamQuestion,
  ExamQuestionOption,
} from '@webcat/contracts';
import { answerPayloadSchema } from '@webcat/contracts';
import { STORAGE } from '../../core/ports/ports.module';
import type { StoragePort } from '@webcat/contracts';
import { buildMediaUrl } from '../media/media-signature';
import type { QuestionSnapshot, SnapshotMedia, SnapshotOption } from '../scoring/scoring.types';
import { parseQuestionSnapshot } from './exam-snapshot';

/**
 * Proyeksi soal untuk peserta.
 *
 * Ini adalah SATU-SATUNYA jalur yang boleh mengubah snapshot server menjadi
 * DTO soal. Allowlist eksplisit: `isCorrect`, `dimensionMap`, `pairGroup`,
 * `missingElement.answer`, dan field kunci lain tidak pernah disalin.
 *
 * Media (F3-08):
 *   - bila snapshot menyimpan `assetId`, URL dibuat dari `/api/v1/media/:id/content`
 *     bertanda tangan HMAC (byte-nya memang ada di database);
 *   - bila tidak (snapshot lama), jatuh ke `resolve(path)` milik `StoragePort`.
 *
 * Hanya media `STEM` dan media per opsi yang dikirim; `EXPLANATION` (pembahasan)
 * sengaja dibuang karena itu materi admin, bukan materi ujian (F3-09).
 */

export interface ProjectionRow {
  id: string;
  position: number;
  snapshot: unknown;
  /** Jawaban tersimpan peserta (bukan kunci jawaban). */
  answer?: unknown;
}

export type MediaUrlResolver = (path: string) => string;

/** TTL URL media ujian: 2 jam, lebih panjang dari subtes terpanjang (120 menit). */
export const EXAM_MEDIA_TTL_SECONDS = 7_200;

function mediaView(
  entry: SnapshotMedia,
  resolve: MediaUrlResolver,
  secret: string,
): ExamMediaRef {
  return {
    role: entry.role,
    url: entry.assetId
      ? buildMediaUrl(entry.assetId, secret, EXAM_MEDIA_TTL_SECONDS)
      : resolve(entry.path),
    alt: entry.alt,
  };
}

function optionView(
  option: SnapshotOption,
  resolve: MediaUrlResolver,
  secret: string,
): ExamQuestionOption {
  return {
    id: option.id,
    label: option.label,
    text: option.text,
    media: option.media.map((entry) => mediaView(entry, resolve, secret)),
  };
}

function mediaViews(
  snapshot: QuestionSnapshot,
  resolve: MediaUrlResolver,
  secret: string,
): ExamMediaRef[] {
  // Peserta hanya perlu media stem; EXPLANATION tidak boleh bocor.
  return snapshot.media
    .filter((entry) => entry.role === 'STEM')
    .map((entry) => mediaView(entry, resolve, secret));
}

/**
 * Fungsi murni proyeksi. `resolve` membuat URL media; pada unit test cukup
 * identitas. Tidak pernah menyentuh database.
 *
 * `secret` dipakai untuk menandatangani URL `/media/:id/content`. Default
 * string kosong agar unit test lama tetap jalan tanpa menyiapkan env.
 */
export function projectQuestion(
  row: ProjectionRow,
  resolve: MediaUrlResolver = (path) => path,
  secret = '',
): ExamQuestion {
  const snapshot = parseQuestionSnapshot(row.snapshot);
  const columnNumbers = snapshot.columnNumbers ?? [];
  const rowCount =
    snapshot.type === 'PASS_HAND_COLUMN' && columnNumbers.length >= 2
      ? Math.floor(columnNumbers.length / 2)
      : null;
  const rows =
    rowCount === null
      ? null
      : [
          columnNumbers.filter((_value, index) => index % 2 === 0),
          columnNumbers.filter((_value, index) => index % 2 === 1),
        ];
  const parsedAnswer = answerPayloadSchema.safeParse(row.answer ?? null);
  const answer: AnswerPayload | null = parsedAnswer.success ? parsedAnswer.data : null;

  return {
    id: row.id,
    position: row.position,
    type: snapshot.type,
    stem: snapshot.stem,
    stemFormat: snapshot.stemFormat,
    difficulty: snapshot.difficulty,
    weight: snapshot.weight,
    columnIndex: snapshot.columnIndex,
    rowCount,
    rows,
    // Hanya left/right; `answer` sengaja tidak diproyeksikan.
    missingElement: snapshot.missingElement
      ? { left: snapshot.missingElement.left, right: snapshot.missingElement.right }
      : null,
    scale: snapshot.scale,
    answer,
    options: snapshot.options.map((option) => optionView(option, resolve, secret)),
    media: mediaViews(snapshot, resolve, secret),
  };
}

/** Kumpulkan semua path media yang perlu di-resolve (stem + opsi). */
function collectPaths(rows: ProjectionRow[]): Set<string> {
  const paths = new Set<string>();
  for (const row of rows) {
    const snapshot = parseQuestionSnapshot(row.snapshot);
    for (const media of snapshot.media) {
      // Yang punya `assetId` tidak butuh signed URL storage.
      if (!media.assetId) paths.add(media.path);
    }
    for (const option of snapshot.options) {
      for (const media of option.media) {
        if (!media.assetId) paths.add(media.path);
      }
    }
  }
  return paths;
}

@Injectable()
export class ExamQuestionProjection {
  constructor(@Inject(STORAGE) private readonly storage: StoragePort) {}

  /**
   * Memproyeksikan banyak soal sekaligus. URL media di-cache per path agar
   * satu berkas tidak membuat banyak signed URL — termasuk media per opsi
   * (F3-10).
   *
   * `secret` diambil dari env JWT_ACCESS_SECRET (kunci yang sama dipakai
   * `MediaService` untuk memverifikasi tanda tangan).
   */
  async projectMany(
    rows: ProjectionRow[],
    secret = process.env.JWT_ACCESS_SECRET ?? '',
  ): Promise<ExamQuestion[]> {
    const resolved = new Map<string, string>();
    await Promise.all(
      [...collectPaths(rows)].map(async (path) => {
        try {
          resolved.set(path, await this.storage.createSignedUrl(path, EXAM_MEDIA_TTL_SECONDS));
        } catch {
          resolved.set(path, path);
        }
      }),
    );

    return rows.map((row) => projectQuestion(row, (path) => resolved.get(path) ?? path, secret));
  }
}
