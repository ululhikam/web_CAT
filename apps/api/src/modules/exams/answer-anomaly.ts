import {
  ANSWER_ANOMALY_SEVERITY,
  IMAGE_TOO_FAST_MS,
  SPEED_STREAK_LENGTH,
  SPEED_STREAK_MS,
  findFastStreak,
  isImageAnswerTooFast,
  isImageQuestion,
} from '@webcat/contracts';
import type { AnswerAnomalyType, AnomalySnapshotLike, QuestionTiming } from '@webcat/contracts';

/**
 * F5-13 — deteksi anomali waktu jawab (sisi server).
 *
 * Fungsi murni: seluruh data masuk sebagai argumen, tidak ada `Date.now()` dan
 * tidak ada akses database, sehingga bisa diuji tanpa Prisma.
 *
 * Aturan yang ada di sini:
 * 1. soal bergambar dijawab `< 300 ms`;
 * 2. lima soal berurutan dijawab `< 150 ms` (khusus `KECERMATAN`).
 *
 * Aturan "jawaban diubah berkali-kali dalam 2 detik" **tidak** dihitung di sini:
 * antrean offline menggabungkan beberapa perubahan pada satu soal menjadi satu
 * baris, jadi jumlah perubahan sebenarnya hanya terlihat di browser (lihat
 * `apps/web/src/lib/exams/answer-churn.ts`).
 */

export interface AnswerAnomalyEvent {
  sessionQuestionId: string;
  clientSeq: number;
  /** Waktu sejak soal tampil saat jawaban dikirim (ms). */
  timeSpentMs: number;
}

export interface AnswerAnomalyQuestion {
  id: string;
  /** `exam_session_questions.position`. */
  position: number;
  /** Snapshot mentah; hanya bagian media yang dibaca. */
  snapshot: AnomalySnapshotLike | null;
}

export interface DetectedAnswerAnomaly {
  type: AnswerAnomalyType;
  severity: 'low' | 'medium';
  sessionQuestionId: string;
  /** Event pemicu — bagian dari metadata untuk penelusuran. */
  clientSeq: number;
  metadata: Record<string, unknown>;
}

export interface DetectAnswerAnomaliesInput {
  subtestCode: string;
  questions: AnswerAnomalyQuestion[];
  events: AnswerAnomalyEvent[];
}

/** Satu soal setelah event-nya diurutkan. */
export interface QuestionEventGroup {
  sessionQuestionId: string;
  first: AnswerAnomalyEvent;
  last: AnswerAnomalyEvent;
  /** Jumlah event = berapa kali jawaban soal ini dikirim. */
  count: number;
}

/**
 * Kelompokkan event per soal, urut `clientSeq` (urutan kirim klien).
 *
 * `clientSeq` adalah urutan autosave yang naik monoton, jadi lebih andal
 * daripada jam server yang bisa sama untuk beberapa baris dalam satu batch.
 */
export function groupAnswerEvents(events: AnswerAnomalyEvent[]): QuestionEventGroup[] {
  const grouped = new Map<string, AnswerAnomalyEvent[]>();
  for (const event of events) {
    const list = grouped.get(event.sessionQuestionId);
    if (list) list.push(event);
    else grouped.set(event.sessionQuestionId, [event]);
  }

  const groups: QuestionEventGroup[] = [];
  for (const [sessionQuestionId, list] of grouped) {
    const ordered = [...list].sort((a, b) => a.clientSeq - b.clientSeq);
    groups.push({
      sessionQuestionId,
      first: ordered[0]!,
      last: ordered[ordered.length - 1]!,
      count: ordered.length,
    });
  }
  return groups;
}

/**
 * Idempotensi baris `proctoring_events` untuk anomali.
 *
 * Satu anomali per `(tipe, soal)`; autosave berikutnya tidak menambah baris
 * baru. `clientSeq` pemicu tetap disimpan di metadata.
 */
export function anomalyEventId(type: AnswerAnomalyType, sessionQuestionId: string): string {
  return `answer-anomaly:${type}:${sessionQuestionId}`;
}

export function detectAnswerAnomalies(
  input: DetectAnswerAnomaliesInput,
): DetectedAnswerAnomaly[] {
  const questionById = new Map(input.questions.map((question) => [question.id, question]));
  const groups = groupAnswerEvents(input.events);
  const findings: DetectedAnswerAnomaly[] = [];
  const timings: QuestionTiming[] = [];
  const timingGroup = new Map<string, QuestionEventGroup>();

  for (const group of groups) {
    const question = questionById.get(group.sessionQuestionId);
    if (!question) continue;

    // Aturan 1 memakai jawaban pertama: mengubah jawaban kemudian tidak
    // membatalkan fakta bahwa soal bergambar sempat dijawab dalam 120 ms.
    if (isImageQuestion(question.snapshot) && isImageAnswerTooFast(group.first.timeSpentMs)) {
      findings.push({
        type: 'ANSWER_TOO_FAST_IMAGE',
        severity: ANSWER_ANOMALY_SEVERITY.ANSWER_TOO_FAST_IMAGE,
        sessionQuestionId: group.sessionQuestionId,
        clientSeq: group.first.clientSeq,
        metadata: {
          position: question.position,
          timeSpentMs: group.first.timeSpentMs,
          thresholdMs: IMAGE_TOO_FAST_MS,
          changes: group.count,
        },
      });
    }

    timings.push({
      sessionQuestionId: group.sessionQuestionId,
      position: question.position,
      timeSpentMs: group.first.timeSpentMs,
    });
    timingGroup.set(group.sessionQuestionId, group);
  }

  if (input.subtestCode === 'KECERMATAN') {
    const streak = findFastStreak(timings);
    if (streak) {
      const group = timingGroup.get(streak.sessionQuestionId);
      findings.push({
        type: 'ANSWER_TOO_FAST_STREAK',
        severity: ANSWER_ANOMALY_SEVERITY.ANSWER_TOO_FAST_STREAK,
        sessionQuestionId: streak.sessionQuestionId,
        clientSeq: group?.first.clientSeq ?? 1,
        metadata: {
          positions: streak.positions,
          timeSpentMs: streak.timeSpentMs,
          thresholdMs: SPEED_STREAK_MS,
          length: SPEED_STREAK_LENGTH,
        },
      });
    }
  }

  return findings;
}
