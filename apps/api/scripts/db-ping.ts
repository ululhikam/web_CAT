/**
 * `pnpm db:ping`
 *
 * Memastikan `.env` benar dan database Supabase bisa dijangkau SEBELUM
 * menjalankan migrasi. Hanya membaca; tidak mengubah apa pun.
 *
 * Yang diperiksa:
 *   1. `DATABASE_URL` dan `DIRECT_URL` ada dan bisa di-parse.
 *   2. Koneksi ke database berhasil (lewat pooler).
 *   3. Versi Postgres, nama database, dan user yang dipakai.
 *   4. Jumlah tabel di schema `public` (0 = migrasi belum dijalankan).
 *
 * Catatan: `DIRECT_URL` hanya dipakai Prisma CLI (migrate/seed), jadi
 * skrip ini cukup menguji `DATABASE_URL`.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';

for (const file of [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../../.env'),
]) {
  if (existsSync(file)) loadEnv({ path: file, override: false });
}

function describe(label: string, raw: string | undefined): void {
  if (!raw) {
    console.log(`  ${label.padEnd(12)}: (kosong)`);
    return;
  }

  try {
    const url = new URL(raw);
    const db = url.pathname.replace(/^\//, '') || '(default)';
    console.log(`  ${label.padEnd(12)}: ${url.hostname}:${url.port || '5432'}/${db}`);
    console.log(`  ${' '.repeat(12)}  mode pooler: ${url.searchParams.get('pgbouncer') === 'true' ? 'ya' : 'tidak'}`);
  } catch {
    console.log(`  ${label.padEnd(12)}: (URL tidak valid)`);
  }
}

async function main(): Promise<void> {
  console.log('Memeriksa konfigurasi Supabase…');
  describe('DATABASE_URL', process.env.DATABASE_URL);
  describe('DIRECT_URL', process.env.DIRECT_URL);
  console.log(`  ${'SUPABASE_URL'.padEnd(12)}: ${process.env.SUPABASE_URL || '(kosong)'}`);
  console.log(
    `  ${'SERVICE_KEY'.padEnd(12)}: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'terisi' : '(kosong)'}`,
  );
  console.log('');

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL belum diisi. Lihat .env.example.');
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient({ log: ['error'] });

  try {
    const [info] = await prisma.$queryRaw<
      Array<{ version: string; db: string; user: string; host: string | null }>
    >`
      SELECT
        version()            AS version,
        current_database()   AS db,
        current_user         AS "user",
        inet_server_addr()::text AS host
    `;

    const [counts] = await prisma.$queryRaw<Array<{ tables: bigint }>>`
      SELECT count(*)::bigint AS tables
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `;

    console.log('Koneksi berhasil.');
    console.log(`  Database     : ${info.db}`);
    console.log(`  User         : ${info.user}`);
    console.log(`  Server       : ${info.host ?? '(tidak diketahui)'}`);
    console.log(`  Postgres     : ${info.version.split(',')[0]}`);
    console.log(`  Tabel public : ${counts.tables}`);

    if (counts.tables === 0n) {
      console.log('\nSchema masih kosong. Jalankan `pnpm db:deploy` lalu `pnpm db:seed`.');
    }
  } catch (error) {
    process.exitCode = 1;
    const message = error instanceof Error ? error.message : String(error);
    console.error('\nGagal terhubung ke database.');
    console.error(`  ${message.split('\n')[0]}`);
    console.error('\nPeriksa: project ref, password (URL-encode), region pooler,');
    console.error('dan apakah project Supabase sedang di-pause.');
  } finally {
    await prisma.$disconnect();
  }
}

void main();
