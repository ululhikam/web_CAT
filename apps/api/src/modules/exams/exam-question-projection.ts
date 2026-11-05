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
import type { QuestionSnapshot, SnapshotOption } from '../scoring/scoring.types';
import { parseQuestionSnapshot } from './exam-snapshot';

/**
 * Proyeksi soal untuk peserta.
 *
 * Ini adalah SATU-SATUNYA jalur yang boleh mengubah snapshot server menjadi
 * DTO soal. Allowlist eksplisit: `isCorrect`, `dimensionMap`, `pairGroup`,
 * `missingElement.answer`, dan field kunci lain tidak pernah disalin.
 */

export interface ProjectionRow {
  id: string;
  position: number;
  snapshot: unknown;
  /** Jawaban tersimpan peserta (bukan kunci jawaban). */
  answer?: unknown;
}

export type MediaUrlResolver = (path: string) => string;

function optionView(option: SnapshotOption): ExamQuestionOption {
  return {
    id: option.id,
    label: option.label,
    text: option.text,
    media: [],
  };
}

function mediaViews(snapshot: QuestionSnapshot, resolve: MediaUrlResolver): ExamMediaRef[] {
  return snapshot.media.map((entry) => ({
    role: entry.role,
    url: resolve(entry.path),
    alt: entry.alt,
  }));
}

/**
 * Fungsi murni proyeksi. `resolve` membuat URL media; pada unit test cukup
 * identitas. Tidak pernah menyentuh database.
 */
export function projectQuestion(
  row: ProjectionRow,
  resolve: MediaUrlResolver = (path) => path,
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
    options: snapshot.options.map(optionView),
    media: mediaViews(snapshot, resolve),
  };
}

@Injectable()
export class ExamQuestionProjection {
  constructor(@Inject(STORAGE) private readonly storage: StoragePort) {}

  /**
   * Memproyeksikan banyak soal sekaligus. URL media di-cache per path agar
   * satu berkas tidak membuat banyak signed URL.
   */
  async projectMany(rows: ProjectionRow[]): Promise<ExamQuestion[]> {
    const paths = new Set<string>();
    for (const row of rows) {
      const snapshot = parseQuestionSnapshot(row.snapshot);
      for (const media of snapshot.media) paths.add(media.path);
    }

    const resolved = new Map<string, string>();
    await Promise.all(
      [...paths].map(async (path) => {
        try {
          resolved.set(path, await this.storage.createSignedUrl(path, 1_800));
        } catch {
          resolved.set(path, path);
        }
      }),
    );

    return rows.map((row) => projectQuestion(row, (path) => resolved.get(path) ?? path));
  }
}
