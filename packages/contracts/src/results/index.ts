import { z } from 'zod';
import type { LockReason, SessionStatus, StageCode, SubtestCode } from '../exams/index';

/**
 * ============================================================================
 * Kontrak hasil ujian & riwayat (B3)
 * ----------------------------------------------------------------------------
 * Dipakai halaman `(app)/results` dan `(app)/history`.
 * Semua angka sudah dihitung server — klien tidak boleh menghitung ulang.
 * ============================================================================
 */

/** Metrik mentah per subtes (disimpan di `result_profile`). */
export interface SubtestMetrics {
  attempted: number;
  correct: number;
  wrong: number;
  blank: number;
  accuracy: number | null;
  throughput: number | null;
  consistencyIndex: number | null;
  consistencyFlagged: boolean | null;
  stability: number | null;
  trend: number | null;
  /** Pass Hand: waktu tiap kolom (ms) untuk grafik kurva kerja. */
  columnSeries: number[] | null;
  /** Kepribadian: profil dimensi hasil jawaban. */
  dimensionProfile: Record<string, number> | null;
  reviewFlagged: boolean | null;
}

export interface SubtestReviewOption {
  key: string;
  text: string;
  image?: string | null;
  isCorrect: boolean;
  scoreValue: number;
}

export interface SubtestReviewItem {
  id: string;
  position: number;
  type: string;
  stem: string;
  image?: string | null;
  options: SubtestReviewOption[];
  userKey: string | null;
  correctKey: string | null;
  isCorrect: boolean;
  earnedWeight: number | null;
  explanation: string | null;
}

export interface SubtestResultView {
  id: string;
  subtestCode: SubtestCode;
  name: string;
  orderIndex: number;
  status: 'COMPLETED' | 'EXPIRED' | 'ELIMINATED' | 'LOCKED' | 'READY' | 'ACTIVE';
  scoringStrategy: string;
  questionCount: number;
  rawScore: number | null;
  maxScore: number | null;
  percentage: number | null;
  weight: number;
  passed: boolean | null;
  startedAt: string | null;
  finishedAt: string | null;
  scoredAt: string | null;
  lockReason: LockReason | null;
  metrics: SubtestMetrics | null;
  reviewItems?: SubtestReviewItem[];
}

export interface StageResultView {
  id: string;
  stageCode: StageCode;
  name: string;
  orderIndex: number;
  weight: number;
  status: SessionStatus;
  percentage: number | null;
  passed: boolean | null;
  subtests: SubtestResultView[];
}

export interface ExamResultView {
  sessionId: string;
  status: SessionStatus;
  examDate: string;
  startedAt: string | null;
  finishedAt: string | null;
  totalScore: number | null;
  passed: boolean | null;
  totalPassingScore: number;
  eliminatedSubtestCode: SubtestCode | null;
  eliminationReason: string | null;
  scoringVersion: number;
  stages: StageResultView[];
  /** Catatan pelanggaran yang terekam (untuk transparansi peserta). */
  violations: Array<{ type: string; count: number; lastAt: string | null }>;
}

export interface ExamHistoryItem {
  sessionId: string;
  examDate: string;
  status: SessionStatus;
  totalScore: number | null;
  passed: boolean | null;
  startedAt: string | null;
  finishedAt: string | null;
  eliminatedSubtestCode: SubtestCode | null;
}

export const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().trim().min(1).optional(),
});
export type HistoryQuery = z.infer<typeof historyQuerySchema>;

export interface ExamStatsView {
  /** Ambang batas kelulusan total dari `exam_settings` (0–100). */
  totalPassingScore: number;
  totalSessions: number;
  completedSessions: number;
  eliminatedSessions: number;
  passRate: number;
  averageScore: number | null;
  bestScore: number | null;
  lastScore: number | null;
  /** Deret skor total terakhir (lama → baru) untuk grafik tren. */
  trend: Array<{ examDate: string; totalScore: number | null; passed: boolean | null }>;
  perSubtest: Array<{
    subtestCode: SubtestCode;
    attempts: number;
    averagePercentage: number | null;
    bestPercentage: number | null;
  }>;
}
