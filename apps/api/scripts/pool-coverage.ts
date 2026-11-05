/**
 * Cakupan bank soal per subtes setelah seleksi pool (F3-31 pendukung).
 *
 * Menjawab satu pertanyaan: bila sesi ujian dimulai hari ini, apakah soal
 * bergambar (`PSI-*-FIG-*`) benar-benar ikut terpilih — bukan hanya tersimpan
 * di database?
 *
 * Skrip ini memanggil `ExamQuestionSource.prepare()` yang sama dengan yang
 * dipakai materialisasi sesi, lalu melaporkan:
 *   - jumlah soal per subtes vs kuota,
 *   - berapa yang berasal dari bank soal DB (bukan fixture),
 *   - berapa yang bergambar (`IMAGE_CHOICE`) beserta jumlah media opsinya,
 *   - apakah ada soal ber-media yang kuncinya kosong (data rusak).
 *
 * Pemakaian:
 *
 *   pnpm pool:coverage
 *   pnpm pool:coverage -- --test
 *
 * Hanya membaca (SELECT) — tidak mengubah data.
 */
import { PrismaClient } from '@prisma/client';
import type { SubtestCode } from '@webcat/contracts';
import { loadLocalEnv } from '../src/core/config/load-env';
import { DEFAULT_STAGES } from '../src/modules/exams/exam-defaults';
import { ExamQuestionSource } from '../src/modules/exams/exam-question-source';
import type { PrismaService } from '../src/core/prisma/prisma.service';

loadLocalEnv();

const useTestDb = process.argv.includes('--test');
const url = useTestDb ? process.env.DATABASE_URL_TEST : process.env.DATABASE_URL;

interface SubtestPlan {
  code: string;
  questionCount: number;
}

function plans(): SubtestPlan[] {
  const subtests = DEFAULT_STAGES.flatMap((stage) => stage.subtests ?? []);
  return subtests.map((subtest) => ({
    code: subtest.code,
    questionCount: subtest.questionCount,
  }));
}

async function main(): Promise<void> {
  if (!url) {
    console.error('DATABASE_URL belum diisi');
    process.exit(1);
  }

  const prisma = new PrismaClient({ datasources: { db: { url } }, log: ['error'] });
  const source = new ExamQuestionSource(prisma as unknown as PrismaService);

  try {
    console.log(`Database: ${url.replace(/:[^:@/]+@/, ':***@')}\n`);
    console.log(
      `${'SUBTES'.padEnd(14)}${'KUOTA'.padStart(6)}${'DAPAT'.padStart(7)}${'DB'.padStart(5)}${'GAMBAR'.padStart(8)}${'FIG'.padStart(6)}  sumber`,
    );

    let broken = 0;
    for (const plan of plans()) {
      const seeds = await source.prepare(
        {
          subtestSessionId: `coverage-${plan.code}`,
          subtestCode: plan.code as SubtestCode,
          count: plan.questionCount,
        },
        prisma as unknown as PrismaService,
      );

      const fromDb = seeds.filter((seed) => seed.questionId !== null).length;
      const imageQuestions = seeds.filter((seed) => seed.snapshot.type === 'IMAGE_CHOICE');
      const figural = seeds.filter((seed) => seed.snapshot.sourceId.includes('-FIG-')).length;

      for (const seed of seeds) {
        const hasMedia =
          seed.snapshot.media.length > 0 ||
          seed.snapshot.options.some((option) => option.media.length > 0);
        const hasKey =
          seed.snapshot.options.some((option) => option.isCorrect) ||
          Boolean(seed.snapshot.missingElement?.answer) ||
          (seed.snapshot.columnNumbers?.length ?? 0) > 0 ||
          (seed.snapshot.scale ?? 0) > 1;
        if (hasMedia && !hasKey) broken += 1;
      }

      const sourceLabel =
        fromDb === 0 ? 'fixture' : fromDb >= plan.questionCount ? 'bank soal' : 'campuran';
      console.log(
        `${plan.code.padEnd(14)}${String(plan.questionCount).padStart(6)}${String(seeds.length).padStart(7)}${String(fromDb).padStart(5)}${String(imageQuestions.length).padStart(8)}${String(figural).padStart(6)}  ${sourceLabel}`,
      );
    }

    console.log(
      broken === 0
        ? '\nSemua soal bergambar punya kunci jawaban.'
        : `\nPERINGATAN: ${broken} soal bergambar tanpa kunci jawaban.`,
    );
    if (broken > 0) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('pool:coverage gagal:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
