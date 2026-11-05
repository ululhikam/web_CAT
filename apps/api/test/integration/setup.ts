/**
 * Helper test integrasi (F0-07).
 *
 * Test integrasi memakai database TERPISAH (`DATABASE_URL_TEST`) supaya data
 * demo di database pengembangan tidak pernah tersentuh. Karena helper ini
 * melakukan `TRUNCATE`, ada tiga lapis pengaman:
 *
 *   1. `DATABASE_URL_TEST` wajib diisi — tanpa itu semua spec di-skip.
 *   2. URL harus berbeda dari `DATABASE_URL`/`DIRECT_URL`.
 *   3. URL tidak boleh mengandung penanda produksi (`prod`, `production`).
 *
 * Pemakaian:
 *
 *   const prisma = createTestPrisma();
 *   beforeAll(() => ensureMasterData(prisma));
 *   beforeEach(() => resetTestData(prisma));
 *   afterAll(() => prisma.$disconnect());
 */
import { PrismaClient } from '@prisma/client';
import { loadLocalEnv } from '../../src/core/config/load-env';
import { seedExamStructure } from '../../prisma/seed/exam.seed';
import { seedPlans } from '../../prisma/seed/plans.seed';
import { seedRoles } from '../../prisma/seed/roles.seed';
import { seedPlatformSettings } from '../../prisma/seed/settings.seed';

// Vitest tidak memuat `.env` otomatis; pakai loader yang sama dengan aplikasi.
loadLocalEnv();

export const TEST_DB_URL = process.env.DATABASE_URL_TEST ?? '';

/** Test integrasi hanya berjalan bila DB uji tersedia. */
export const integrationEnabled = TEST_DB_URL.length > 0;

function databaseName(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\//, '');
  } catch {
    return '';
  }
}

/**
 * Pastikan URL benar-benar menunjuk database uji, bukan database aplikasi.
 * Dipanggil sebelum client dibuat supaya salah konfigurasi gagal cepat.
 */
export function assertSafeTestDatabase(url: string = TEST_DB_URL): void {
  if (!url) throw new Error('DATABASE_URL_TEST belum diisi');

  const target = databaseName(url).toLowerCase();
  if (!target) throw new Error(`DATABASE_URL_TEST tidak valid: ${url}`);

  const forbidden = [process.env.DATABASE_URL, process.env.DIRECT_URL]
    .filter((value): value is string => Boolean(value))
    .map((value) => databaseName(value).toLowerCase());

  if (forbidden.includes(target)) {
    throw new Error(
      `DATABASE_URL_TEST menunjuk database aplikasi ("${target}"). ` +
        'Gunakan database terpisah agar data demo tidak terhapus.',
    );
  }

  if (/(^|[^a-z])(prod|production)([^a-z]|$)/i.test(target)) {
    throw new Error(`DATABASE_URL_TEST menunjuk database produksi ("${target}")`);
  }
}

export function createTestPrisma(): PrismaClient {
  assertSafeTestDatabase();
  return new PrismaClient({
    datasources: { db: { url: TEST_DB_URL } },
    log: process.env.TEST_DB_LOG === '1' ? ['warn', 'error'] : ['error'],
  });
}

/**
 * Hapus data transaksional antar-test. Data master (role, stage, subtest,
 * plan, setting) sengaja TIDAK dihapus karena dipakai bersama dan diisi oleh
 * `ensureMasterData`.
 */
export async function resetTestData(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      exam_answer_events,
      exam_session_questions,
      subtest_locks,
      exam_session_subtests,
      exam_session_stages,
      exam_violations,
      exam_sessions,
      proctoring_events,
      question_media,
      question_tags,
      question_options,
      questions,
      media_assets,
      sessions,
      verification_tokens,
      audit_logs,
      outbox_events,
      job_queue,
      rate_limit_hits,
      payment_webhook_events,
      subscription_events,
      transactions,
      subscriptions,
      users
    RESTART IDENTITY CASCADE
  `);
}

/**
 * Isi data master yang dibutuhkan mesin ujian. Idempoten — aman dipanggil
 * berkali-kali (seed memakai `upsert`).
 */
export async function ensureMasterData(prisma: PrismaClient): Promise<void> {
  await seedRoles(prisma);
  await seedExamStructure(prisma);
  await seedPlans(prisma);
  await seedPlatformSettings(prisma);
}

/** Ambil role berdasarkan kode; dipakai saat membuat user uji. */
export async function roleIdFor(prisma: PrismaClient, code: string): Promise<string> {
  const role = await prisma.role.findUniqueOrThrow({ where: { code: code as never } });
  return role.id;
}
