import { z } from 'zod';
import type { PoolShortage } from '../ports/index';

/**
 * ============================================================================
 * Kontrak domain ujian (B3)
 * ----------------------------------------------------------------------------
 * File ini adalah sumber kebenaran untuk:
 *  - kode stage/subtes & status (dibekukan sejak Phase 0)
 *  - strategi scoring (8 strategi, plan §7.9)
 *  - DTO respons (dipakai API & SvelteKit)
 *  - skema Zod untuk request (divalidasi server lewat ZodValidationPipe)
 *
 * Aturan keras: tipe soal yang dikirim ke peserta TIDAK PERNAH memuat
 * `isCorrect`, `dimensionMap`, `pairGroup`, atau kunci jawaban apa pun.
 * ============================================================================
 */

export * from './answer-anomaly';

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

/**
 * Nama tampilan subtes — dipakai pada pesan yang dibaca manusia (mis. kekurangan
 * bank soal) supaya tidak menampilkan kode mentah seperti `PASS_HAND`.
 */
export const SUBTEST_LABELS: Record<SubtestCode, string> = {
  KECERDASAN: 'Kecerdasan',
  KEPRIBADIAN: 'Kepribadian',
  KECERMATAN: 'Kecermatan',
  PASS_HAND: 'Pass Hand',
  TPA: 'TPA',
  TPK: 'TPK',
};

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

/** Subtes terminal: tidak ada lagi operasi tulis yang diterima. */
export const TERMINAL_SUBTEST_STATUSES: readonly SubtestStatus[] = [
  'COMPLETED',
  'EXPIRED',
  'ELIMINATED',
];

/** 8 strategi penilaian (plan §7.9). */
export const SCORING_STRATEGIES = [
  'KEYED_CORRECT',
  'MULTI_CORRECT_PARTIAL',
  'WEIGHTED_OPTIONS',
  'DIMENSION_PROFILE',
  'CONSISTENCY_INDEX',
  'CORRECT_MINUS_PENALTY',
  'PASS_HAND_METRIC',
  'MANUAL_REVIEW',
] as const;
export type ScoringStrategy = (typeof SCORING_STRATEGIES)[number];

/** Nama strategi lama di seed; dipetakan ke strategi final. */
export const SCORING_STRATEGY_ALIASES: Record<string, ScoringStrategy> = {
  LIKERT_PROFILE: 'DIMENSION_PROFILE',
  COLUMN_MATCH: 'PASS_HAND_METRIC',
  PASS_HAND_COLUMN: 'PASS_HAND_METRIC',
};

export const EXAM_QUESTION_TYPES = [
  'SINGLE_CHOICE',
  'MULTI_CHOICE',
  'IMAGE_CHOICE',
  'LIKERT_STATEMENT',
  'MISSING_ELEMENT',
  'PASS_HAND_COLUMN',
] as const;
export type ExamQuestionType = (typeof EXAM_QUESTION_TYPES)[number];

/** Kebijakan kapan timer subtes berikutnya mulai. */
export const SUBTEST_TRANSITIONS = ['on_open', 'immediate'] as const;
export type SubtestTransition = (typeof SUBTEST_TRANSITIONS)[number];

export const VIOLATION_ACTIONS = ['WARN', 'LOCK_SUBTEST', 'ELIMINATE', 'LOCK_ACCOUNT'] as const;
export type ViolationAction = (typeof VIOLATION_ACTIONS)[number];

export const VIOLATION_SEVERITIES = ['low', 'medium', 'high'] as const;
export type ViolationSeverity = (typeof VIOLATION_SEVERITIES)[number];

/* ------------------------------------------------------------------ konfigurasi */

export interface SubtestPlan {
  id: string;
  code: SubtestCode;
  name: string;
  orderIndex: number;
  questionCount: number;
  durationMinutes: number;
  weight: number;
  passingScore: number;
  eliminationEnabled: boolean;
  scoringStrategy: string;
  scoringConfig: Record<string, unknown> | null;
  isActive: boolean;
}

export interface StagePlan {
  id: string;
  code: StageCode;
  name: string;
  description: string | null;
  orderIndex: number;
  weight: number;
  passingScore: number;
  eliminationEnabled: boolean;
  isActive: boolean;
  subtests: SubtestPlan[];
}

export interface ViolationRule {
  severity: ViolationSeverity;
  actions: Array<{ at: number; action: ViolationAction }>;
}

export interface ViolationPolicy {
  events: Record<string, ViolationRule>;
  warningTemplate: string;
}

/**
 * Snapshot konfigurasi yang disimpan per sesi. Perubahan admin setelah sesi
 * dibuat tidak boleh memengaruhi penilaian sesi berjalan.
 */
export interface ExamConfigSnapshot {
  capturedAt: string;
  timezone: string;
  totalPassingScore: number;
  subtestTransition: SubtestTransition;
  gracePeriodShortMs: number;
  gracePeriodLongMs: number;
  violationPolicy: ViolationPolicy;
  stages: StagePlan[];
}

export interface ExamSettingsView {
  timezone: string;
  totalPassingScore: number;
  maxSessionsPerDay: number;
  gracePeriodShortMs: number;
  gracePeriodLongMs: number;
  subtestTransition: SubtestTransition;
  violationPolicy: ViolationPolicy;
  updatedAt: string;
}

/* ------------------------------------------------------------------ eligibility */

export interface ExamEligibility {
  canStart: boolean;
  reasons: string[];
  /**
   * F4-09: subtes yang bank soalnya belum cukup, lengkap dengan angka
   * kebutuhan/ketersediaan supaya peserta (dan admin) tahu persis apa yang
   * kurang, bukan sekadar "bank soal belum mencukupi".
   */
  poolProblems: PoolShortage[];
  activeSubscription: { endsAt: string; remainingDays: number } | null;
  sessionsToday: number;
  nextAvailableAt: string | null;
  /** Sesi yang masih berjalan (bila ada) — klien wajib melanjutkan sesi ini. */
  activeSessionId: string | null;
}

export const startExamSessionSchema = z.object({
  /** Konfirmasi eksplisit: peserta sudah membaca aturan & siap memulai. */
  acknowledgeRules: z.literal(true),
});
export type StartExamSessionInput = z.infer<typeof startExamSessionSchema>;

/* ------------------------------------------------------------------ jam server */

export interface ClockState {
  serverTime: string;
  endsAt: string | null;
  remainingMs: number | null;
  status: SubtestStatus | SessionStatus;
}

export interface SessionSubtestSummary {
  id: string;
  subtestCode: SubtestCode;
  name: string;
  orderIndex: number;
  status: SubtestStatus;
  questionCount: number;
  answeredCount: number;
  startedAt: string | null;
  endsAt: string | null;
  finishedAt: string | null;
  remainingMs: number | null;
  percentage: number | null;
  passed: boolean | null;
  lockReason: LockReason | null;
  scoringStrategy: string;
}

export interface SessionStageSummary {
  id: string;
  stageCode: StageCode;
  name: string;
  orderIndex: number;
  weight: number;
  status: SessionStatus;
  percentage: number | null;
  passed: boolean | null;
  subtests: SessionSubtestSummary[];
}

export interface ExamSessionSummary {
  id: string;
  status: SessionStatus;
  examDate: string;
  startedAt: string | null;
  finishedAt: string | null;
  totalScore: number | null;
  passed: boolean | null;
  eliminatedSubtestCode: string | null;
  scoringVersion: number;
  stages: SessionStageSummary[];
}

export interface ActiveSessionResponse {
  session: ExamSessionSummary | null;
  currentStageCode: StageCode | null;
  currentSubtest: SessionSubtestSummary | null;
  nextSubtest: SessionSubtestSummary | null;
  clock: ClockState | null;
  lockedReason: LockReason | null;
}

/* ------------------------------------------------------------------ soal */

export interface ExamMediaRef {
  role: 'STEM' | 'OPTION' | 'EXPLANATION';
  url: string;
  alt: string | null;
}

export interface ExamQuestionOption {
  id: string;
  label: string;
  text: string | null;
  media: ExamMediaRef[];
}

/**
 * Kecermatan: dua larik yang ditampilkan. Peserta mengisi karakter yang hilang.
 * `left` selalu larik lengkap; `right` kehilangan satu karakter.
 */
export interface MissingElementView {
  left: string;
  right: string;
}

/**
 * Soal seperti yang dilihat peserta — TANPA kunci jawaban.
 * Field `isCorrect`, `dimensionMap`, `pairGroup`, dan `answerKey` tidak pernah
 * diproyeksikan ke tipe ini (lihat `question-projection.ts` di API).
 */
export interface ExamQuestion {
  id: string;
  position: number;
  type: ExamQuestionType;
  stem: string;
  stemFormat: 'MARKDOWN' | 'HTML';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  weight: number;
  /** Pass Hand: indeks kolom. */
  columnIndex: number | null;
  /** Pass Hand: jumlah pasangan per kolom (baris). */
  rowCount: number | null;
  /** Pass Hand: dua baris angka yang harus dijumlahkan per kolom. */
  rows: number[][] | null;
  /** Kecermatan: larik untuk dibandingkan. */
  missingElement: MissingElementView | null;
  /** Kepribadian: skala Likert (default 5). */
  scale: number | null;
  /** Jawaban tersimpan milik peserta (untuk resume); null bila belum dijawab. */
  answer: AnswerPayload | null;
  /**
   * Pilihan jawaban. `dimensionMap` sengaja tidak ada: pemetaan dimensi hanya
   * dipakai server saat menilai.
   */
  options: ExamQuestionOption[];
  media: ExamMediaRef[];
}

export interface ExamQuestionPage {
  items: ExamQuestion[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
  clock: ClockState;
}

export const examQuestionsQuerySchema = z.object({
  cursor: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type ExamQuestionsQuery = z.infer<typeof examQuestionsQuerySchema>;

/* ------------------------------------------------------------------ jawaban */

/**
 * Payload jawaban (server-side maupun klien):
 *  - pilihan tunggal/ganda : `{ optionIds: [...] }`
 *  - Likert                : `{ value: 1..5 }`
 *  - Kecermatan (teks)     : `{ text: "7" }`
 *  - Pass Hand per kolom   : `{ values: ["7","3", ...] }`
 */
export const answerPayloadSchema = z
  .object({
    optionIds: z.array(z.string().trim().min(1).max(64)).max(20).optional(),
    value: z.number().int().min(0).max(10).optional(),
    text: z.string().trim().max(200).optional(),
    values: z.array(z.string().trim().max(12)).max(200).optional(),
  })
  .refine(
    (payload) =>
      payload.optionIds !== undefined ||
      payload.value !== undefined ||
      payload.text !== undefined ||
      payload.values !== undefined,
    { message: 'Payload jawaban kosong' },
  );
export type AnswerPayload = z.infer<typeof answerPayloadSchema>;

export const answerItemSchema = z.object({
  /** `exam_session_questions.id` (bukan id bank soal). */
  questionId: z.string().uuid(),
  payload: answerPayloadSchema,
  timeSpentMs: z.number().int().min(0).max(86_400_000).optional(),
});
export type AnswerItem = z.infer<typeof answerItemSchema>;

export const autosaveAnswersSchema = z.object({
  /** Monotonik per subtes; dipakai server untuk idempotensi. */
  clientSeq: z.number().int().min(0),
  answers: z.array(answerItemSchema).min(1).max(50),
});
export type AutosaveAnswersInput = z.infer<typeof autosaveAnswersSchema>;

export interface RejectedAnswer {
  questionId: string;
  code: string;
}

export interface AutosaveResponse {
  saved: string[];
  rejected: RejectedAnswer[];
  clock: ClockState;
  nextCursor: number | null;
}

export const finishSubtestSchema = z.object({
  /** Best-effort: batch terakhir yang belum ter-ACK. */
  clientSeq: z.number().int().min(0).optional(),
});

export const heartbeatSchema = z.object({
  clientTime: z.coerce.date().optional(),
});
export type HeartbeatInput = z.infer<typeof heartbeatSchema>;

export interface HeartbeatResponse {
  clock: ClockState;
  sessionStatus: SessionStatus;
  lockedReason: LockReason | null;
  /** Peringatan pelanggaran terakhir (bila ada) — hanya teks dari server. */
  warning: { type: string; count: number; limit: number; message: string } | null;
}

/* ------------------------------------------------------------------ admin: konfigurasi */

export const updateExamStageSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    orderIndex: z.number().int().min(1).max(20).optional(),
    weight: z.number().min(0).max(100).optional(),
    passingScore: z.number().min(0).max(100).optional(),
    eliminationEnabled: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'Tidak ada perubahan' });
export type UpdateExamStageInput = z.infer<typeof updateExamStageSchema>;

export const createSubtestSchema = z.object({
  stageCode: z.enum(STAGE_CODES),
  code: z.enum(SUBTEST_CODES),
  name: z.string().trim().min(2).max(120),
  orderIndex: z.number().int().min(1).max(20),
  questionCount: z.number().int().min(1).max(1000),
  durationMinutes: z.number().int().min(1).max(240),
  weight: z.number().min(0).max(100),
  passingScore: z.number().min(0).max(100),
  eliminationEnabled: z.boolean().default(true),
  scoringStrategy: z.enum(SCORING_STRATEGIES).default('KEYED_CORRECT'),
  scoringConfig: z.record(z.unknown()).nullable().optional(),
  isActive: z.boolean().default(true),
});
export type CreateSubtestInput = z.infer<typeof createSubtestSchema>;

export const updateSubtestSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    orderIndex: z.number().int().min(1).max(20).optional(),
    questionCount: z.number().int().min(1).max(1000).optional(),
    durationMinutes: z.number().int().min(1).max(240).optional(),
    weight: z.number().min(0).max(100).optional(),
    passingScore: z.number().min(0).max(100).optional(),
    eliminationEnabled: z.boolean().optional(),
    scoringStrategy: z.enum(SCORING_STRATEGIES).optional(),
    scoringConfig: z.record(z.unknown()).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'Tidak ada perubahan' });
export type UpdateSubtestInput = z.infer<typeof updateSubtestSchema>;

export const violationRuleSchema = z.object({
  severity: z.enum(VIOLATION_SEVERITIES),
  actions: z
    .array(
      z.object({
        at: z.number().int().min(1).max(100),
        action: z.enum(VIOLATION_ACTIONS),
      }),
    )
    .max(10),
});

export const violationPolicySchema = z.object({
  events: z.record(violationRuleSchema),
  warningTemplate: z
    .string()
    .trim()
    .max(300)
    .default('Pelanggaran {type} terdeteksi ({count}/{limit}).'),
});
export type ViolationPolicyInput = z.infer<typeof violationPolicySchema>;

export const updateExamSettingsSchema = z
  .object({
    timezone: z.string().trim().min(1).max(64).optional(),
    totalPassingScore: z.number().min(0).max(100).optional(),
    maxSessionsPerDay: z.number().int().min(1).max(10).optional(),
    gracePeriodShortMs: z.number().int().min(0).max(60_000).optional(),
    gracePeriodLongMs: z.number().int().min(0).max(120_000).optional(),
    subtestTransition: z.enum(SUBTEST_TRANSITIONS).optional(),
    violationPolicy: violationPolicySchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'Tidak ada perubahan' });
export type UpdateExamSettingsInput = z.infer<typeof updateExamSettingsSchema>;

/* ------------------------------------------------------------------ admin: sesi */

export const adminSessionQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().trim().min(1).optional(),
  status: z.enum(SESSION_STATUSES).optional(),
  userId: z.string().uuid().optional(),
  q: z.string().trim().max(120).optional(),
});
export type AdminSessionQuery = z.infer<typeof adminSessionQuerySchema>;

export const voidSessionSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});
export type VoidSessionInput = z.infer<typeof voidSessionSchema>;

export const forceUnlockSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});
export type ForceUnlockInput = z.infer<typeof forceUnlockSchema>;

/** Ringkasan sesi untuk tabel monitoring admin. */
export interface AdminSessionRow {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  examDate: string;
  status: SessionStatus;
  startedAt: string | null;
  finishedAt: string | null;
  totalScore: number | null;
  passed: boolean | null;
  eliminatedSubtestCode: string | null;
  currentSubtestCode: SubtestCode | null;
  currentSubtestStatus: SubtestStatus | null;
  remainingMs: number | null;
  violationCount: number;
}

export interface AdminSessionDetail {
  session: ExamSessionSummary;
  user: { id: string; email: string; fullName: string };
  violations: Array<{ type: string; count: number; actionTaken: string | null; lastAt: string }>;
  proctoring: Array<{ type: string; severity: string; occurredAt: string; metadata: unknown }>;
}

export interface AdminSessionPage {
  items: AdminSessionRow[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ExamDashboardStats {
  totalSessions: number;
  completed: number;
  eliminated: number;
  inProgress: number;
  passRate: number;
  perSubtest: Array<{
    subtestCode: SubtestCode;
    attempts: number;
    averagePercentage: number;
    passRate: number;
    eliminationCount: number;
  }>;
}
