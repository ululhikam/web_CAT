import { z } from 'zod';
import type { ClockState, SessionStatus, ViolationAction } from '../exams/index';

/**
 * ============================================================================
 * Kontrak proctoring (B3) — klien hanya mengirim sinyal, server yang memutuskan
 * ============================================================================
 */

export const PROCTORING_EVENT_TYPES = [
  'TAB_BLUR',
  'TAB_FOCUS',
  'COPY',
  'PASTE',
  'CUT',
  'CONTEXT_MENU',
  'FULLSCREEN_EXIT',
  'FULLSCREEN_ENTER',
  'DEVTOOLS_OPEN',
  'WINDOW_RESIZED',
  'BEFORE_UNLOAD',
  'HEARTBEAT_LOST',
  'SESSION_REPLACED',
  'ENVIRONMENT_CHANGED',
  'IDLE',
  /**
   * F5-13 — satu-satunya sinyal anomali yang dihitung klien: antrean offline
   * menggabungkan beberapa perubahan pada satu soal menjadi satu baris, jadi
   * jumlah perubahan per 2 detik hanya terlihat di browser.
   *
   * Dua sinyal lain (`ANSWER_TOO_FAST_IMAGE`, `ANSWER_TOO_FAST_STREAK`) ditulis
   * server dari `exam_answer_events` dan tidak diterima dari klien.
   */
  'ANSWER_CHANGE_BURST',
] as const;
export type ProctoringEventType = (typeof PROCTORING_EVENT_TYPES)[number];

export const proctoringEventSchema = z.object({
  /** Idempotensi: unik per sesi. */
  clientEventId: z.string().trim().min(1).max(120),
  type: z.enum(PROCTORING_EVENT_TYPES),
  occurredAt: z.coerce.date().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type ProctoringEventInput = z.infer<typeof proctoringEventSchema>;

export const proctoringBatchSchema = z.object({
  events: z.array(proctoringEventSchema).min(1).max(50),
});
export type ProctoringBatchInput = z.infer<typeof proctoringBatchSchema>;

export interface ProctoringWarning {
  type: string;
  count: number;
  limit: number;
  severity: string;
  message: string;
}

export interface ProctoringBatchResponse {
  accepted: number;
  duplicated: number;
  warnings: ProctoringWarning[];
  actionTaken: ViolationAction | null;
  sessionStatus: SessionStatus;
  clock: ClockState | null;
}
