/**
 * Ringkasan dashboard peserta (F5-08).
 *
 * Semua angka di dashboard berasal dari API (`/exams/stats`, `/exams/history`,
 * `/subscriptions/me`). Modul ini hanya mengubah bentuk data, tanpa menyentuh
 * Svelte, supaya bisa diuji sebagai fungsi murni.
 */
import {
  SUBTEST_LABELS,
  type ExamHistoryItem,
  type ExamStatsView,
  type SubtestCode,
} from '@webcat/contracts';

export type DashboardTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

export interface DashboardBadge {
  label: string;
  tone: DashboardTone;
}

export interface SubtestProgressRow {
  code: SubtestCode;
  label: string;
  attempts: number;
  averagePercentage: number | null;
  bestPercentage: number | null;
}

export interface SessionRow {
  sessionId: string;
  examDate: string;
  status: string;
  score: number | null;
  passed: boolean | null;
  eliminatedSubtestCode: SubtestCode | null;
}

export interface TrendPoint {
  x: number;
  y: number;
  score: number;
  examDate: string;
}

export interface DashboardSummary {
  hasSessions: boolean;
  totalPassingScore: number;
  totalSessions: number;
  completedSessions: number;
  eliminatedSessions: number;
  passRate: number;
  averageScore: number | null;
  bestScore: number | null;
  lastScore: number | null;
  /** Subtes terurut dari akurasi terendah — yang pertama = terlemah. */
  perSubtest: SubtestProgressRow[];
  weakestSubtest: SubtestProgressRow | null;
  trend: ExamStatsView['trend'];
  sessions: SessionRow[];
}

/** `612.5` → `612.5`; nol di belakang koma dibuang (konsisten dengan halaman lain). */
export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) return '—';
  return score.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Label status sesi untuk badge. `passed` hanya bermakna pada status
 * COMPLETED; status lain memakai label netralnya sendiri.
 */
export function sessionBadge(
  status: string,
  passed: boolean | null | undefined,
): DashboardBadge {
  if (status === 'COMPLETED') {
    return passed === true
      ? { label: 'Lulus (MS)', tone: 'success' }
      : { label: 'Belum MS', tone: 'warning' };
  }
  if (status === 'ELIMINATED') return { label: 'Gugur (TMS)', tone: 'danger' };
  if (status === 'EXPIRED') return { label: 'Kedaluwarsa', tone: 'warning' };
  if (status === 'ABANDONED') return { label: 'Ditinggal', tone: 'neutral' };
  if (status === 'IN_PROGRESS') return { label: 'Sedang dikerjakan', tone: 'info' };
  if (status === 'CREATED') return { label: 'Belum mulai', tone: 'neutral' };
  if (status === 'VOIDED') return { label: 'Dibatalkan admin', tone: 'danger' };
  return { label: status, tone: 'neutral' };
}

function progressRow(entry: ExamStatsView['perSubtest'][number]): SubtestProgressRow {
  return {
    code: entry.subtestCode,
    label: SUBTEST_LABELS[entry.subtestCode] ?? entry.subtestCode,
    attempts: entry.attempts,
    averagePercentage: entry.averagePercentage,
    bestPercentage: entry.bestPercentage,
  };
}

/**
 * Menggabungkan statistik + riwayat menjadi satu objek siap-render.
 *
 * `weakestSubtest` memilih `averagePercentage` terendah. Subtes tanpa nilai
 * (belum pernah dikerjakan) tidak boleh dianggap "terlemah" — itu akan
 * menyesatkan, jadi hanya entri dengan nilai yang dibandingkan.
 */
export function buildDashboardSummary(
  stats: ExamStatsView | null,
  history: ExamHistoryItem[],
): DashboardSummary {
  const perSubtest = (stats?.perSubtest ?? [])
    .map(progressRow)
    .sort((left, right) => {
      const leftValue = left.averagePercentage ?? Number.POSITIVE_INFINITY;
      const rightValue = right.averagePercentage ?? Number.POSITIVE_INFINITY;
      if (leftValue !== rightValue) return leftValue - rightValue;
      return left.label.localeCompare(right.label);
    });

  const weakestSubtest =
    perSubtest.find((entry) => entry.averagePercentage !== null) ?? null;

  return {
    hasSessions: (stats?.totalSessions ?? 0) > 0,
    totalPassingScore: stats?.totalPassingScore ?? 0,
    totalSessions: stats?.totalSessions ?? 0,
    completedSessions: stats?.completedSessions ?? 0,
    eliminatedSessions: stats?.eliminatedSessions ?? 0,
    passRate: stats?.passRate ?? 0,
    averageScore: stats?.averageScore ?? null,
    bestScore: stats?.bestScore ?? null,
    lastScore: stats?.lastScore ?? null,
    perSubtest,
    weakestSubtest,
    trend: stats?.trend ?? [],
    sessions: history.map((item) => ({
      sessionId: item.sessionId,
      examDate: item.examDate,
      status: item.status,
      score: item.totalScore,
      passed: item.passed,
      eliminatedSubtestCode: item.eliminatedSubtestCode,
    })),
  };
}

/**
 * Titik grafik tren. Skor `totalScore` adalah persentase 0..100, jadi langsung
 * dipetakan ke tinggi area grafik. Satu titik diletakkan di tengah.
 */
export function buildTrendPoints(
  trend: ExamStatsView['trend'],
  options: { left?: number; right?: number; top?: number; bottom?: number } = {},
): TrendPoint[] {
  const left = options.left ?? 60;
  const right = options.right ?? 580;
  const top = options.top ?? 40;
  const bottom = options.bottom ?? 250;
  const points = trend.filter(
    (entry): entry is { examDate: string; totalScore: number; passed: boolean | null } =>
      entry.totalScore !== null,
  );
  if (points.length === 0) return [];

  const span = right - left;
  const height = bottom - top;
  return points.map((entry, index) => {
    const ratio = points.length === 1 ? 0.5 : index / (points.length - 1);
    const clamped = Math.min(100, Math.max(0, entry.totalScore));
    return {
      x: left + ratio * span,
      y: bottom - (clamped / 100) * height,
      score: entry.totalScore,
      examDate: entry.examDate,
    };
  });
}

/** `"2026-11-04"` → `"04 Nov 2026"` (dipakai tabel & tooltip grafik). */
export function formatExamDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
