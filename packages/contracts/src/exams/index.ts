/** Kode tes (stage) — dibekukan sejak Phase 0. */
export const STAGE_CODES = ['PSIKOLOGI', 'TPA', 'TPK'] as const;
export type StageCode = (typeof STAGE_CODES)[number];

/** Kode subtes. TPA & TPK memakai satu subtes teknis agar satu jalur kode. */
export const SUBTEST_CODES = [
  'KECERDASAN',
  'KEPRIBADIAN',
  'KECERMATAN',
  'PASS_HAND',
  'TPA',
  'TPK',
] as const;
export type SubtestCode = (typeof SUBTEST_CODES)[number];

export const SESSION_STATUSES = [
  'CREATED',
  'IN_PROGRESS',
  'COMPLETED',
  'ELIMINATED',
  'EXPIRED',
  'ABANDONED',
  'VOIDED',
] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const SUBTEST_STATUSES = [
  'LOCKED',
  'READY',
  'ACTIVE',
  'COMPLETED',
  'EXPIRED',
  'ELIMINATED',
] as const;
export type SubtestStatus = (typeof SUBTEST_STATUSES)[number];

export const LOCK_REASONS = [
  'TIME_EXPIRED',
  'ELIMINATED',
  'VIOLATION',
  'MANUAL_SUPER_ADMIN',
  'PREVIOUS_FAILED',
] as const;
export type LockReason = (typeof LOCK_REASONS)[number];

export interface ExamEligibility {
  canStart: boolean;
  reasons: string[];
  activeSubscription: { endsAt: string; remainingDays: number } | null;
  sessionsToday: number;
  nextAvailableAt: string | null;
}

export interface SubtestPlan {
  code: SubtestCode;
  name: string;
  questionCount: number;
  durationMinutes: number;
  passingScore: number;
  weight: number;
  eliminationEnabled: boolean;
  scoringStrategy: string;
}
