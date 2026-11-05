import type { PrismaClient, StageCode, SubtestCode } from '@prisma/client';

interface SubtestSeed {
  code: SubtestCode;
  name: string;
  orderIndex: number;
  questionCount: number;
  durationMinutes: number;
  weight: number;
  passingScore: number;
  scoringStrategy: string;
  scoringConfig?: Record<string, unknown>;
  eliminationEnabled: boolean;
}

interface StageSeed {
  code: StageCode;
  name: string;
  description: string;
  orderIndex: number;
  weight: number;
  passingScore: number;
  eliminationEnabled: boolean;
  subtests: SubtestSeed[];
}

/**
 * Struktur ujian final (3 tes).
 *
 * Psikologi = 4 subtes nyata, TOTAL 890 soal:
 *   Kecerdasan   100 soal / 120 menit
 *   Kepribadian  140 soal /  45 menit  (Likert 5)
 *   Kecermatan   500 soal /  10 menit
 *   Pass Hand    150 kolom / 18 menit
 *
 * TKK & TPK masing-masing dimodelkan sebagai SATU subtes teknis agar
 * `exam_session_questions` selalu terikat ke `subtest_session_id`.
 * Jumlah soal TKK/TPK masih sementara (dapat diubah admin).
 */
const STAGES: StageSeed[] = [
  {
    code: 'PSIKOLOGI',
    name: 'Tes Psikologi',
    description: 'Empat subtes psikologi: Kecerdasan, Kepribadian, Kecermatan, dan Pass Hand.',
    orderIndex: 1,
    weight: 50,
    passingScore: 60,
    eliminationEnabled: true,
    subtests: [
      {
        code: 'KECERDASAN',
        name: 'Tes Kecerdasan',
        orderIndex: 1,
        questionCount: 100,
        durationMinutes: 120,
        weight: 40,
        passingScore: 60,
        scoringStrategy: 'KEYED_CORRECT',
        eliminationEnabled: true,
      },
      {
        code: 'KEPRIBADIAN',
        name: 'Tes Kepribadian',
        orderIndex: 2,
        questionCount: 140,
        durationMinutes: 45,
        weight: 20,
        passingScore: 60,
        scoringStrategy: 'DIMENSION_PROFILE',
        scoringConfig: {
          scale: 5,
          dimensions: ['KEPEMIMPINAN', 'KERJASAMA', 'STABILITAS'],
        },
        eliminationEnabled: true,
      },
      {
        code: 'KECERMATAN',
        name: 'Tes Kecermatan',
        orderIndex: 3,
        questionCount: 500,
        durationMinutes: 10,
        weight: 20,
        passingScore: 55,
        scoringStrategy: 'CORRECT_MINUS_PENALTY',
        scoringConfig: { penalty: 1 },
        eliminationEnabled: true,
      },
      {
        code: 'PASS_HAND',
        name: 'Pass Hand',
        orderIndex: 4,
        questionCount: 150,
        durationMinutes: 18,
        weight: 20,
        passingScore: 50,
        scoringStrategy: 'PASS_HAND_METRIC',
        scoringConfig: {
          w1: 0.5,
          w2: 0.25,
          w3: 0.25,
          maxPairsPerMinute: 60,
        },
        eliminationEnabled: true,
      },
    ],
  },
  {
    code: 'TKK',
    name: 'Tes Kemampuan Komputer',
    description: 'Perangkat keras, perangkat lunak, jaringan, keamanan, dan aplikasi perkantoran.',
    orderIndex: 2,
    weight: 30,
    passingScore: 60,
    eliminationEnabled: true,
    subtests: [
      {
        code: 'TKK',
        name: 'Tes Kemampuan Komputer',
        orderIndex: 1,
        questionCount: 100,
        durationMinutes: 60,
        weight: 100,
        passingScore: 60,
        scoringStrategy: 'KEYED_CORRECT',
        eliminationEnabled: true,
      },
    ],
  },
  {
    code: 'TPK',
    name: 'Tes Pengetahuan Kepolisian',
    description: 'Pengetahuan dasar kepolisian, hukum, dan tugas Polri.',
    orderIndex: 3,
    weight: 20,
    passingScore: 60,
    eliminationEnabled: false,
    subtests: [
      {
        code: 'TPK',
        name: 'Tes Pengetahuan Kepolisian',
        orderIndex: 1,
        questionCount: 100,
        durationMinutes: 60,
        weight: 100,
        passingScore: 60,
        scoringStrategy: 'KEYED_CORRECT',
        eliminationEnabled: false,
      },
    ],
  },
];

/**
 * Kebijakan pelanggaran default (bentuk baru: `events` + `warningTemplate`).
 * Server mengeksekusi aksi hanya saat counter tepat mencapai `at`, sehingga
 * retry batch proctoring tidak menggugurkan sesi berkali-kali.
 */
const VIOLATION_POLICY = {
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
} as const;

export async function seedExamStructure(prisma: PrismaClient): Promise<void> {
  for (const stage of STAGES) {
    const stageRow = await prisma.examStage.upsert({
      where: { code: stage.code },
      update: {
        name: stage.name,
        description: stage.description,
        orderIndex: stage.orderIndex,
        weight: stage.weight,
        passingScore: stage.passingScore,
        eliminationEnabled: stage.eliminationEnabled,
        isActive: true,
      },
      create: {
        code: stage.code,
        name: stage.name,
        description: stage.description,
        orderIndex: stage.orderIndex,
        weight: stage.weight,
        passingScore: stage.passingScore,
        eliminationEnabled: stage.eliminationEnabled,
        isActive: true,
      },
    });

    for (const subtest of stage.subtests) {
      await prisma.subtest.upsert({
        where: { code: subtest.code },
        update: {
          stageId: stageRow.id,
          name: subtest.name,
          orderIndex: subtest.orderIndex,
          questionCount: subtest.questionCount,
          durationMinutes: subtest.durationMinutes,
          weight: subtest.weight,
          passingScore: subtest.passingScore,
          eliminationEnabled: subtest.eliminationEnabled,
          scoringStrategy: subtest.scoringStrategy,
          scoringConfig: (subtest.scoringConfig ?? null) as never,
          isActive: true,
        },
        create: {
          stageId: stageRow.id,
          code: subtest.code,
          name: subtest.name,
          orderIndex: subtest.orderIndex,
          questionCount: subtest.questionCount,
          durationMinutes: subtest.durationMinutes,
          weight: subtest.weight,
          passingScore: subtest.passingScore,
          eliminationEnabled: subtest.eliminationEnabled,
          scoringStrategy: subtest.scoringStrategy,
          scoringConfig: (subtest.scoringConfig ?? null) as never,
          isActive: true,
        },
      });
    }

    console.log(`  stage ${stage.code}: ${stage.subtests.length} subtes`);
  }

  const totalQuestions = STAGES.flatMap((stage) => stage.subtests).reduce(
    (sum, subtest) => sum + subtest.questionCount,
    0,
  );
  console.log(`  total soal terkunci konfigurasi: ${totalQuestions}`);

  await prisma.examSetting.upsert({
    where: { id: 'singleton' },
    update: {
      timezone: 'Asia/Jakarta',
      totalPassingScore: 60,
      maxSessionsPerDay: 1,
      gracePeriodShortMs: 3000,
      gracePeriodLongMs: 8000,
      subtestTransition: 'on_open',
      violationPolicy: VIOLATION_POLICY as never,
    },
    create: {
      id: 'singleton',
      timezone: 'Asia/Jakarta',
      totalPassingScore: 60,
      maxSessionsPerDay: 1,
      gracePeriodShortMs: 3000,
      gracePeriodLongMs: 8000,
      subtestTransition: 'on_open',
      violationPolicy: VIOLATION_POLICY as never,
    },
  });
}
