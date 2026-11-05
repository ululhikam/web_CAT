import type { LockReason, SubtestStatus } from '@webcat/contracts';
import type { SubtestTimingState } from './types';

/**
 * Matematika timer & kunci (plan §7.2, §7.6). Semua fungsi MURNI: `now`
 * diterima eksplisit sehingga dapat diuji dengan fake clock tanpa memalsukan
 * jam sistem.
 *
 * Kebenaran waktu selalu `started_at + duration` yang disimpan sebagai
 * `ends_at` absolut di server. Klien hanya menampilkan sisa waktu hasil
 * hitungan server; mengubah nilai di klien tidak menambah waktu.
 */

/** Ambang subtes "pendek" (Kecermatan 10 menit) untuk grace period. */
export const SHORT_SUBTEST_MAX_MINUTES = 10;

export interface ClockState {
  serverTime: string;
  endsAt: string | null;
  remainingMs: number | null;
  status: SubtestStatus;
}

/** `ends_at = started_at + duration_minutes`. */
export function computeEndsAt(startedAt: Date, durationMinutes: number): Date {
  const minutes = Number.isFinite(durationMinutes) ? Math.max(1, durationMinutes) : 1;
  return new Date(startedAt.getTime() + minutes * 60_000);
}

/** Sisa waktu dalam ms; `null` bila subtes belum dimulai, `0` bila habis. */
export function remainingMs(endsAt: Date | null, now: Date): number | null {
  if (!endsAt) return null;
  return Math.max(0, endsAt.getTime() - now.getTime());
}

/**
 * Grace period transport: subtes ≤ 10 menit memakai grace pendek (3 dtk),
 * subtes panjang grace panjang (8 dtk).
 */
export function gracePeriodFor(durationMinutes: number, shortMs: number, longMs: number): number {
  const short = Number.isFinite(shortMs) ? Math.max(0, shortMs) : 3_000;
  const long = Number.isFinite(longMs) ? Math.max(0, longMs) : 8_000;
  return durationMinutes <= SHORT_SUBTEST_MAX_MINUTES ? short : long;
}

/**
 * Batas akhir penerimaan tulisan = `ends_at + grace`.
 *
 * Grace HANYA toleransi transport: bila klien mengirim tepat setelah
 * `ends_at`, server tetap memotong nilai jawaban di `ends_at`. Yang penting,
 * setelah `ends_at + grace` semua tulisan ditolak `409`.
 */
export function writeDeadline(
  endsAt: Date,
  durationMinutes: number,
  shortMs: number,
  longMs: number,
): Date {
  return new Date(endsAt.getTime() + gracePeriodFor(durationMinutes, shortMs, longMs));
}

/** True bila subtes sudah melewati `ends_at` (hard lock). */
export function isExpired(state: SubtestTimingState, now: Date): boolean {
  if (state.status !== 'ACTIVE' || !state.endsAt) return false;
  return now.getTime() >= state.endsAt.getTime();
}

/**
 * True bila tulisan masih diterima.
 *
 * Hard lock mengikuti DoD: begitu `now >= ends_at`, autosave ditolak `409`
 * meskipun cron belum berjalan. Grace period hanya dipakai untuk perhitungan
 * transport lain (lihat `writeDeadline`), bukan untuk memperpanjang waktu jawab.
 */
export function canWrite(
  state: SubtestTimingState,
  now: Date,
  _durationMinutes: number,
  _shortMs: number,
  _longMs: number,
): boolean {
  if (state.status !== 'ACTIVE' || !state.endsAt) return false;
  return now.getTime() < state.endsAt.getTime();
}

/** Alasan kunci untuk `subtest_locks.reason`. */
export function lockReasonFor(state: SubtestTimingState, now: Date): LockReason {
  if (state.endsAt && now.getTime() >= state.endsAt.getTime()) return 'TIME_EXPIRED';
  return 'MANUAL_SUPER_ADMIN';
}

/**
 * Awal timer subtes berikutnya.
 *
 * - `on_open`   : timer mulai saat peserta membuka subtes (`null` = belum).
 * - `immediate` : timer mulai tepat saat subtes sebelumnya berakhir.
 */
export function nextSubtestStartedAt(
  transition: 'on_open' | 'immediate',
  previousEndedAt: Date | null,
  _now: Date,
): Date | null {
  if (transition === 'immediate' && previousEndedAt) return previousEndedAt;
  return null;
}

/** Bangun payload jam standar untuk respons API. */
export function buildClock(state: SubtestTimingState, now: Date): ClockState {
  return {
    serverTime: now.toISOString(),
    endsAt: state.endsAt ? state.endsAt.toISOString() : null,
    remainingMs: remainingMs(state.endsAt, now),
    status: state.status,
  };
}

/** Alasan tampilan saat sesi gugur / subtes terkunci; `null` bila normal. */
export function lockedReasonFor(input: {
  sessionStatus: string;
  subtest: { status: SubtestStatus; lockReason?: LockReason | null } | null;
}): LockReason | null {
  if (input.sessionStatus === 'ELIMINATED') return 'ELIMINATED';
  if (!input.subtest) return null;
  if (input.subtest.status === 'ACTIVE') return null;
  if (
    input.subtest.status === 'COMPLETED' ||
    input.subtest.status === 'EXPIRED' ||
    input.subtest.status === 'ELIMINATED'
  ) {
    return input.subtest.lockReason ?? null;
  }
  return null;
}
