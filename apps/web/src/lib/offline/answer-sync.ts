import type { AnswerPayload } from '@webcat/contracts';
import type { QueuedAnswer } from './answer-queue';

/**
 * ============================================================================
 * F5-10 — Penggabungan jawaban lokal & antrean offline
 * ----------------------------------------------------------------------------
 * Fungsi murni (tanpa IndexedDB, tanpa jaringan) agar bisa diuji langsung.
 * Dipakai `examRunner` untuk:
 *  1. memulihkan jawaban yang belum ter-ACK saat halaman dimuat ulang,
 *  2. menyusun batch terakhir saat tab ditutup (`keepalive`).
 * ============================================================================
 */

/** Satu jawaban yang masih menunggu ACK server. */
export interface PendingAnswer {
  questionId: string;
  payload: AnswerPayload;
  timeSpentMs: number;
  /** 0 = belum pernah dikirim; > 0 = sudah pernah dicoba (idempoten). */
  clientSeq: number;
}

/**
 * Gabungkan tiga sumber jawaban dengan prioritas:
 *
 *   server (paling lama) < antrean offline < state di memori (paling baru)
 *
 * Antrean offline menang atas server karena isinya jawaban yang belum sempat
 * terkirim; state memori menang atas antrean karena bisa berisi perubahan yang
 * belum selesai ditulis ke IndexedDB.
 */
export function mergePendingAnswers(
  serverAnswers: Record<string, AnswerPayload>,
  queued: QueuedAnswer[],
  localAnswers: Record<string, AnswerPayload> = {},
): Record<string, AnswerPayload> {
  const merged: Record<string, AnswerPayload> = { ...serverAnswers };
  const ordered = [...queued].sort((a, b) => a.id - b.id);
  for (const entry of ordered) {
    if (entry.payload.cleared) {
      delete merged[entry.questionId];
    } else {
      merged[entry.questionId] = entry.payload;
    }
  }
  for (const [questionId, payload] of Object.entries(localAnswers)) {
    if (payload.cleared) {
      delete merged[questionId];
    } else {
      merged[questionId] = payload;
    }
  }
  return merged;
}

/**
 * Susun batch `keepalive` terakhir dari cermin antrean di memori.
 *
 * Aturan:
 *  - Utamakan record yang sudah punya `clientSeq` (pernah dicoba) agar replay
 *    tetap idempoten di server — bukan menerbitkan `clientSeq` baru.
 *  - Bila semuanya belum punya `clientSeq`, pakai `nextSeq` untuk satu batch.
 *  - Maksimal `maxBatch` jawaban (batas kontrak `autosaveAnswersSchema`).
 */
export function buildKeepaliveBatch(
  pending: Iterable<PendingAnswer>,
  maxBatch: number,
  nextSeq: number,
): { clientSeq: number; answers: PendingAnswer[] } | null {
  const entries = [...pending];
  if (entries.length === 0 || maxBatch <= 0) return null;

  const withSeq = entries.filter((entry) => entry.clientSeq > 0);
  if (withSeq.length > 0) {
    const clientSeq = Math.min(...withSeq.map((entry) => entry.clientSeq));
    const answers = withSeq
      .filter((entry) => entry.clientSeq === clientSeq)
      .slice(0, maxBatch)
      .map((entry) => ({ ...entry }));
    return answers.length > 0 ? { clientSeq, answers } : null;
  }

  const answers = entries.slice(0, maxBatch).map((entry) => ({ ...entry, clientSeq: nextSeq }));
  return answers.length > 0 ? { clientSeq: nextSeq, answers } : null;
}
