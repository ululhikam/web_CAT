import type { ViolationPolicy } from '@webcat/contracts';

/**
 * Snapshot konfigurasi sesi.
 *
 * Dibekukan saat sesi dibuat (`exam_sessions.config_snapshot`) lalu disalin ke
 * setiap subtes saat dibuka (`exam_session_subtests.config_snapshot`). Semua
 * keputusan mesin ujian (timer, ambang gugur, bobot, strategi) membaca snapshot
 * ini sehingga perubahan admin tidak mengubah sesi yang sedang berjalan.
 */
export interface SubtestConfigSnapshot {
  subtestId: string;
  code: string;
  name: string;
  orderIndex: number;
  questionCount: number;
  durationMinutes: number;
  weight: number;
  passingScore: number;
  eliminationEnabled: boolean;
  scoringStrategy: string;
  scoringConfig: Record<string, unknown> | null;
}

export interface StageConfigSnapshot {
  stageId: string;
  code: string;
  name: string;
  description: string | null;
  orderIndex: number;
  weight: number;
  passingScore: number;
  eliminationEnabled: boolean;
  subtests: SubtestConfigSnapshot[];
}

export interface SessionConfigSnapshot {
  capturedAt: string;
  timezone: string;
  totalPassingScore: number;
  maxSessionsPerDay: number;
  gracePeriodShortMs: number;
  gracePeriodLongMs: number;
  subtestTransition: 'on_open' | 'immediate';
  violationPolicy: ViolationPolicy;
  stages: StageConfigSnapshot[];
}

/** Runtime state satu subtes sesi (baris `exam_session_subtests`). */
export interface SubtestTimingState {
  status: 'LOCKED' | 'READY' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'ELIMINATED';
  startedAt: Date | null;
  endsAt: Date | null;
}

export type SessionStatusValue =
  'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'ELIMINATED' | 'EXPIRED' | 'ABANDONED' | 'VOIDED';
