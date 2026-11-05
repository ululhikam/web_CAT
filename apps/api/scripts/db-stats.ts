/**
 * Ringkasan isi database: jumlah baris tabel kunci + duplikat yang menghalangi
 * migrasi (F0-08) + distribusi soal per subtes.
 *
 * Pemakaian:
 *
 *   pnpm db:stats                 # database dari DATABASE_URL
 *   pnpm db:stats --test          # database uji (DATABASE_URL_TEST)
 *
 * Hanya membaca (SELECT) — tidak pernah mengubah data.
 */
import { PrismaClient } from '@prisma/client';
import { loadLocalEnv } from '../src/core/config/load-env';

loadLocalEnv();

const useTestDb = process.argv.includes('--test');
const url = useTestDb ? process.env.DATABASE_URL_TEST : process.env.DATABASE_URL;

async function main(): Promise<void> {
  if (!url) {
    console.error('DATABASE_URL belum diisi');
    process.exit(1);
  }

  const prisma = new PrismaClient({ datasources: { db: { url } }, log: ['error'] });

  try {
    const tables = await prisma.$queryRaw<Array<{ t: string; n: bigint }>>`
      SELECT 'users' AS t, count(*) AS n FROM users
      UNION ALL SELECT 'questions', count(*) FROM questions
      UNION ALL SELECT 'questions_published', count(*) FROM questions WHERE status = 'PUBLISHED'
      UNION ALL SELECT 'subscription_plans', count(*) FROM subscription_plans
      UNION ALL SELECT 'exam_stages', count(*) FROM exam_stages
      UNION ALL SELECT 'subtests', count(*) FROM subtests
      UNION ALL SELECT 'exam_sessions', count(*) FROM exam_sessions
      UNION ALL SELECT 'exam_session_subtests', count(*) FROM exam_session_subtests
      UNION ALL SELECT 'media_assets', count(*) FROM media_assets
      UNION ALL SELECT 'question_media', count(*) FROM question_media
    `;

    console.log(`Database: ${url.replace(/:[^:@/]+@/, ':***@')}`);
    for (const row of tables) {
      console.log(`  ${row.t.padEnd(26)} ${row.n.toString()}`);
    }

    const dupes = await prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT count(*) AS n FROM (
        SELECT session_id, order_index
        FROM exam_session_subtests
        GROUP BY 1, 2
        HAVING count(*) > 1
      ) dup
    `;
    console.log(`\nDuplikat (session_id, order_index): ${dupes[0]?.n.toString() ?? '0'}`);

    const perSubtest = await prisma.$queryRaw<Array<{ code: string; status: string; n: bigint }>>`
      SELECT subtest_code::text AS code, status::text AS status, count(*) AS n
      FROM questions GROUP BY 1, 2 ORDER BY 1, 2
    `;
    console.log('\nSoal per subtes/status:');
    for (const row of perSubtest) {
      console.log(`  ${row.code.padEnd(14)} ${row.status.padEnd(10)} ${row.n.toString()}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
