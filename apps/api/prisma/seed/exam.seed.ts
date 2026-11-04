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
 * TPA & TPK masing-masing dimodelkan sebagai SATU subtes teknis agar
 * `exam_session_questions` selalu terikat ke `subtest_session_id`.
 * Jumlah soal TPA/TPK masih sementara (dapat diubah admin).
 */
const STAGES: StageSeed[] = [
  {
    code: 'PSIKOLOGI',
    name: 'Tes Psikologi',
    description:
      'Empat subtes psikologi: Kecerdasan, Kepribadian, Kecermatan, dan Pass Hand.',
    orderIndex: 1,
    weight: 50,
    passingScore: 60,
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
        scoringStrategy: 'LIKERT_PROFILE',
        scoringConfig: { scale: 5, dimensions: ['KEPEMIMPINAN', 'KERJASAMA', 'STABILITAS'] },
        eliminationEnabled: true,
      },
      {
        code: 'KECERMATAN',
        name: 'Tes Kecermatan',
        orderIndex: 3,
        questionCount: 500,
        durationMinutes: 10,
        weight: 20,
        passingScore: 60,
        scoringStrategy: 'KEYED_CORRECT',
        eliminationEnabled: true,
      },
      {
        code: 'PASS_HAND',
        name: 'Pass Hand',
        orderIndex: 4,
        questionCount: 150,
        durationMinutes: 18,
        weight: 20,
        passingScore: 60,
        scoringStrategy: 'COLUMN_MATCH',
        scoringConfig: { columns: 150, perColumnSeconds: 7 },
        eliminationEnabled: true,
      },
    ],
  },
  {
    code: 'TPA',
    name: 'Tes Potensi Akademik',
    description: 'Verbal, numerik, dan penalaran logis.',
    orderIndex: 2,
    weight: 30,
    passingScore: 60,
    subtests: [
      {
        code: 'TPA',
        name: 'Tes Potensi Akademik',
        orderIndex: 1,
        questionCount: 100,
        durationMinutes: 90,
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
        eliminationEnabled: true,
      },
    ],
  },
];

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
        eliminationEnabled: true,
        isActive: true,
      },
      create: {
        code: stage.code,
        name: stage.name,
        description: stage.description,
        orderIndex: stage.orderIndex,
        weight: stage.weight,
        passingScore: stage.passingScore,
        eliminationEnabled: true,
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
    update: {},
    create: {
      id: 'singleton',
      timezone: 'Asia/Jakarta',
      totalPassingScore: 60,
      maxSessionsPerDay: 1,
      gracePeriodShortMs: 3000,
      gracePeriodLongMs: 8000,
      violationPolicy: {
        tab_blur: { warn: 1, lockSubtest: 3, eliminate: 5 },
        copy_paste: { warn: 1, lockSubtest: 2, eliminate: 4 },
        devtools: { warn: 0, lockSubtest: 1, eliminate: 3 },
      },
    },
  });
}
