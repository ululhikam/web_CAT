/**
 * `pnpm db:ping`
 *
 * Memastikan `.env` benar dan database Supabase bisa dijangkau SEBELUM
 * menjalankan migrasi. Hanya membaca; tidak mengubah apa pun.
 *
 * Yang diperiksa:
 *   1. `DATABASE_URL` (runtime) dan `DIRECT_URL` (migrasi) ada & valid.
 *   2. Keduanya benar-benar bisa dipakai konek + autentikasi.
 *   3. Versi Postgres, nama database, dan user yang dipakai.
 *   4. Jumlah tabel di schema `public` (0 = migrasi belum dijalankan).
 *
 * Password tidak pernah dicetak.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';

for (const file of [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../../.env'),
]) {
  if (existsSync(file)) loadEnv({ path: file, override: false, quiet: true });
}

interface Target {
  label: string;
  url: string | undefined;
  note: string;
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
    console.log(`  ${' '.repeat(12)}  pooler: ${url.searchParams.get('pgbouncer') === 'true' ? 'transaction' : 'session/direct'}`);
  } catch {
    console.log(`  ${label.padEnd(12)}: (URL tidak valid)`);
  }
}

async function probe(target: Target): Promise<boolean> {
  if (!target.url) {
    console.log(`\n[${target.label}] kosong — dilewati (${target.note})`);
    return false;
  }

  const prisma = new PrismaClient({ datasourceUrl: target.url, log: ['error'] });

  try {
    const [info] = await prisma.$queryRaw<
      Array<{ version: string; db: string; user: string; host: string | null }>
    >`
      SELECT
        version()               AS version,
        current_database()      AS db,
        current_user            AS "user",
        inet_server_addr()::text AS host
    `;

    console.log(`\n[${target.label}] terhubung — ${target.note}`);
    console.log(`  Database  : ${info.db}`);
    console.log(`  User      : ${info.user}`);
    console.log(`  Server    : ${info.host ?? '(tidak diketahui)'}`);
    console.log(`  Postgres  : ${info.version.split(',')[0]}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message.split('\n')[0] : String(error);
    console.log(`\n[${target.label}] GAGAL — ${target.note}`);
    console.log(`  ${message}`);
    return false;
  } finally {
    await prisma.$disconnect();
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

  const runtimeOk = await probe({
    label: 'DATABASE_URL',
    url: process.env.DATABASE_URL,
    note: 'dipakai aplikasi (Prisma Client)',
  });

  const migrateOk = await probe({
    label: 'DIRECT_URL',
    url: process.env.DIRECT_URL,
    note: 'dipakai prisma migrate & seed',
  });

  if (!runtimeOk || !migrateOk) {
    process.exitCode = 1;
    console.log('\nAda koneksi yang gagal. Periksa: project ref, password, region');
    console.log('pooler, URL-encode password, dan status project (jangan di-pause).');
    return;
  }

  const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL, log: ['error'] });

  try {
    const [counts] = await prisma.$queryRaw<Array<{ tables: bigint }>>`
      SELECT count(*)::bigint AS tables
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `;

    console.log(`\nTabel public: ${counts.tables}`);
    if (counts.tables === 0n) {
      console.log('Schema masih kosong. Jalankan `pnpm db:deploy` lalu `pnpm db:seed`.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main();
