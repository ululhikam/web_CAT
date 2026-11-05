/**
 * Label & tone status untuk halaman detail peserta admin (F5-03).
 *
 * Dipisah dari komponen karena semua ini logika murni: mudah diuji tanpa
 * merender Svelte, dan mencegah tiga halaman berbeda menulis pemetaan status
 * yang saling bertentangan.
 */
import type { AdminUserOverview } from '@webcat/contracts';

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

export interface StatusMeta {
  label: string;
  tone: Tone;
}

const SESSION_STATUS: Record<string, StatusMeta> = {
  CREATED: { label: 'Belum mulai', tone: 'neutral' },
  IN_PROGRESS: { label: 'Sedang dikerjakan', tone: 'info' },
  COMPLETED: { label: 'Selesai', tone: 'success' },
  ELIMINATED: { label: 'Gugur', tone: 'danger' },
  EXPIRED: { label: 'Kedaluwarsa', tone: 'warning' },
  ABANDONED: { label: 'Ditinggal', tone: 'warning' },
  VOIDED: { label: 'Dibatalkan admin', tone: 'danger' },
};

const SUBSCRIPTION_STATUS: Record<string, StatusMeta> = {
  PENDING: { label: 'Menunggu', tone: 'warning' },
  ACTIVE: { label: 'Aktif', tone: 'success' },
  EXPIRED: { label: 'Berakhir', tone: 'neutral' },
  REVOKED: { label: 'Dicabut', tone: 'danger' },
};

const TRANSACTION_STATUS: Record<string, StatusMeta> = {
  PENDING: { label: 'Menunggu', tone: 'warning' },
  SUCCESS: { label: 'Berhasil', tone: 'success' },
  EXPIRED: { label: 'Kedaluwarsa', tone: 'neutral' },
  FAILED: { label: 'Gagal', tone: 'danger' },
  CANCELLED: { label: 'Dibatalkan', tone: 'neutral' },
  REFUNDED: { label: 'Dikembalikan', tone: 'info' },
};

const USER_STATUS: Record<string, StatusMeta> = {
  ACTIVE: { label: 'Aktif', tone: 'success' },
  SUSPENDED: { label: 'Ditangguhkan', tone: 'danger' },
  PENDING_INVITE: { label: 'Menunggu undangan', tone: 'warning' },
};

function lookup(map: Record<string, StatusMeta>, value: string | null | undefined): StatusMeta {
  if (!value) return { label: '—', tone: 'neutral' };
  return map[value] ?? { label: value, tone: 'neutral' };
}

export const sessionStatus = (value: string | null | undefined): StatusMeta =>
  lookup(SESSION_STATUS, value);

export const subscriptionStatus = (value: string | null | undefined): StatusMeta =>
  lookup(SUBSCRIPTION_STATUS, value);

export const transactionStatus = (value: string | null | undefined): StatusMeta =>
  lookup(TRANSACTION_STATUS, value);

export const userStatus = (value: string | null | undefined): StatusMeta =>
  lookup(USER_STATUS, value);

/** Skor `totalScore` adalah 0..1000 dengan 4 desimal; tampilkan tanpa nol ekor. */
export function formatScore(score: number | null): string {
  if (score === null || Number.isNaN(score)) return '—';
  return score.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Kalimat ringkas untuk pertanyaan "berapa kali ikut ujian dan skornya berapa".
 * Contoh: `3 sesi · 2 selesai · rata-rata 612,50 · terbaik 745`.
 */
export function examSummaryLine(exams: AdminUserOverview['exams']): string {
  if (exams.total === 0) return 'Belum pernah mengikuti ujian.';

  const parts = [`${exams.total} sesi`];
  if (exams.completed > 0) parts.push(`${exams.completed} selesai`);
  if (exams.passed > 0) parts.push(`${exams.passed} lulus`);
  if (exams.averageScore !== null) parts.push(`rata-rata ${formatScore(exams.averageScore)}`);
  if (exams.bestScore !== null) parts.push(`terbaik ${formatScore(exams.bestScore)}`);
  return parts.join(' · ');
}

/**
 * Kalimat ringkas untuk pertanyaan "berapa yang sudah dia bayar".
 * Nominal diformat pemanggil (agar locale tetap satu sumber di `format.ts`).
 */
export function paymentSummaryLine(
  payments: AdminUserOverview['payments'],
  formatIdr: (value: number) => string,
): string {
  if (payments.totalTransactions === 0) return 'Belum ada transaksi.';
  if (payments.paidTransactions === 0) {
    return `${payments.totalTransactions} transaksi, belum ada yang berhasil.`;
  }
  return `${payments.paidTransactions} pembayaran berhasil · total ${formatIdr(
    payments.totalPaidIdr,
  )}`;
}

/** Sisa hari langganan dalam bahasa manusia. */
export function remainingDaysLabel(days: number): string {
  if (days <= 0) return 'habis hari ini';
  if (days === 1) return 'tersisa 1 hari';
  return `tersisa ${days} hari`;
}
