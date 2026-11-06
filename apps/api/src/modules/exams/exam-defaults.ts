import type { ViolationPolicy } from '@webcat/contracts';
import type { StageConfigSnapshot } from './types';

/**
 * Konfigurasi default mesin ujian.
 *
 * Nilai ini mencerminkan `prisma/seed/exam.seed.ts` dan dipakai sebagai
 * fallback bila tabel `exam_stages`/`subtests`/`exam_settings` belum terisi
 * (mode dev tanpa database). Begitu seed berjalan, database selalu menang.
 */

export const DEFAULT_VIOLATION_POLICY: ViolationPolicy = {
  events: {
    TAB_BLUR: {
      severity: 'low',
      actions: [
        { at: 3, action: 'WARN' },
        { at: 6, action: 'LOCK_SUBTEST' },
      ],
    },
    COPY: {
      severity: 'medium',
      actions: [
        { at: 1, action: 'WARN' },
        { at: 3, action: 'ELIMINATE' },
      ],
    },
    PASTE: {
      severity: 'medium',
      actions: [
        { at: 1, action: 'WARN' },
        { at: 3, action: 'ELIMINATE' },
      ],
    },
    CUT: {
      severity: 'medium',
      actions: [
        { at: 1, action: 'WARN' },
        { at: 3, action: 'ELIMINATE' },
      ],
    },
    FULLSCREEN_EXIT: {
      severity: 'low',
      actions: [{ at: 4, action: 'WARN' }],
    },
    DEVTOOLS_OPEN: {
      severity: 'high',
      actions: [
        { at: 1, action: 'WARN' },
        { at: 3, action: 'ELIMINATE' },
      ],
    },
    HEARTBEAT_LOST: {
      severity: 'low',
      actions: [{ at: 5, action: 'WARN' }],
    },
  },
  warningTemplate: 'Pelanggaran {type} terdeteksi ({count}/{limit}).',
};

export const DEFAULT_TOTAL_PASSING_SCORE = 60;
export const DEFAULT_MAX_SESSIONS_PER_DAY = 1;
export const DEFAULT_GRACE_SHORT_MS = 3_000;
export const DEFAULT_GRACE_LONG_MS = 8_000;
export const DEFAULT_TIMEZONE = 'Asia/Jakarta';
export const DEFAULT_SUBTEST_TRANSITION = 'on_open' as const;

/**
 * Stage & subtes default. ID sengaja berupa kode stabil (bukan UUID) karena
 * struktur ini hanya dipakai saat tabel konfigurasi kosong; sesi yang dibuat
 * dari fallback tidak dapat dibuka (materialisasi butuh baris `subtests`).
 */
export const DEFAULT_STAGES: StageConfigSnapshot[] = [
  {
    stageId: 'default-psikologi',
    code: 'PSIKOLOGI',
    name: 'Tes Psikologi',
    description: 'Bagian 1: Kecerdasan & Kepribadian (100 soal, 120 menit). Bagian 2: Kecermatan Huruf (10 kolom x 50 soal, 10 menit).',
    orderIndex: 1,
    weight: 50,
    passingScore: 60,
    eliminationEnabled: false,
    subtests: [
      {
        subtestId: 'default-kecerdasan',
        code: 'KECERDASAN',
        name: 'Tes Kecerdasan & Kepribadian',
        orderIndex: 1,
        questionCount: 100,
        durationMinutes: 120,
        weight: 50,
        passingScore: 60,
        eliminationEnabled: false,
        scoringStrategy: 'KEYED_CORRECT',
        scoringConfig: null,
      },
      {
        subtestId: 'default-kecermatan',
        code: 'KECERMATAN',
        name: 'Tes Kecermatan (Huruf)',
        orderIndex: 2,
        questionCount: 500,
        durationMinutes: 10,
        weight: 50,
        passingScore: 55,
        eliminationEnabled: false,
        scoringStrategy: 'CORRECT_MINUS_PENALTY',
        scoringConfig: { penalty: 0 },
      },
    ],
  },
  {
    stageId: 'default-tkk',
    code: 'TKK',
    name: 'Tes Kemampuan Komputer',
    description: 'Perangkat keras, perangkat lunak, jaringan, keamanan, dan aplikasi perkantoran.',
    orderIndex: 2,
    weight: 30,
    passingScore: 60,
    eliminationEnabled: false,
    subtests: [
      {
        subtestId: 'default-tkk-subtest',
        code: 'TKK',
        name: 'Tes Kemampuan Komputer',
        orderIndex: 1,
        questionCount: 100,
        durationMinutes: 60,
        weight: 100,
        passingScore: 60,
        eliminationEnabled: false,
        scoringStrategy: 'KEYED_CORRECT',
        scoringConfig: null,
      },
    ],
  },
  {
    stageId: 'default-tpk',
    code: 'TPK',
    name: 'Tes Pengetahuan Kepolisian',
    description: 'Pengetahuan dasar kepolisian, hukum, dan tugas Polri.',
    orderIndex: 3,
    weight: 20,
    passingScore: 60,
    eliminationEnabled: false,
    subtests: [
      {
        subtestId: 'default-tpk-subtest',
        code: 'TPK',
        name: 'Tes Pengetahuan Kepolisian',
        orderIndex: 1,
        questionCount: 100,
        durationMinutes: 60,
        weight: 100,
        passingScore: 60,
        eliminationEnabled: false,
        scoringStrategy: 'KEYED_CORRECT',
        scoringConfig: null,
      },
    ],
  },
];
