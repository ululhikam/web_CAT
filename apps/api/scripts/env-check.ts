/**
 * `pnpm env:check`
 *
 * Memvalidasi environment sebelum dev/build. Exit code 1 bila ada masalah agar
 * bisa dipakai di CI/predeploy. Nilai secret TIDAK pernah dicetak.
 *
 * Urutan:
 *   1. Muat `.env` (root repo lalu apps/api) tanpa menimpa env yang sudah ada
 *   2. Jalankan skema Zod yang sama dengan runtime
 *   3. Cek env wajib per mode (AppConfigService.requiredFor)
 *   4. Peringatan untuk kombinasi yang mencurigakan (mis. PAYMENT=midtrans
 *      tetapi kunci kosong)
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from '../src/core/config/env.schema';
import { AppConfigService } from '../src/core/config/config.service';

function loadDotEnv(filePath: string): void {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq <= 0) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Env nyata menang atas .env (kondisi Vercel).
    if (process.env[key] === undefined || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}

function mask(value: string | undefined): string {
  if (!value) return '(kosong)';
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}***${value.slice(-2)}`;
}

function databaseHost(url: string | undefined): string {
  if (!url) return '(kosong)';
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}:${parsed.port || '5432'}${parsed.pathname}`;
  } catch {
    return '(URL tidak valid)';
  }
}

const root = resolve(__dirname, '../../..');
const apiRoot = resolve(__dirname, '..');

loadDotEnv(resolve(root, '.env'));
loadDotEnv(resolve(apiRoot, '.env'));
loadDotEnv(resolve(root, '.env.local'));

let exitCode = 0;

try {
  const env = parseEnv(process.env);
  const required = AppConfigService.requiredFor(process.env);
  const missing = required.filter((key) => !process.env[key]);

  console.log('Environment valid.');
  console.log(`  NODE_ENV   : ${env.NODE_ENV}`);
  console.log(`  APP_URL    : ${env.APP_URL}`);
  console.log(`  API_URL    : ${env.API_URL}`);
  console.log(`  Database   : ${databaseHost(env.DATABASE_URL)}`);
  console.log(`  Storage    : ${env.STORAGE}`);
  console.log(`  Mail       : ${env.MAIL}`);
  console.log(`  Payment    : ${env.PAYMENT}`);
  console.log(`  Access     : ${env.ACCESS_POLICY}`);
  console.log(`  JWT secret : ${mask(env.JWT_ACCESS_SECRET)}`);

  if (missing.length > 0) {
    exitCode = 1;
    console.error('\nEnv wajib yang belum diisi:');
    for (const key of missing) console.error(`  - ${key}`);
  }

  if (env.MAIL === 'resend' && !env.RESEND_API_KEY) {
    exitCode = 1;
    console.error('\nMAIL=resend tetapi RESEND_API_KEY kosong.');
  }

  if (env.PAYMENT === 'midtrans' && (!env.MIDTRANS_SERVER_KEY || !env.MIDTRANS_CLIENT_KEY)) {
    exitCode = 1;
    console.error('\nPAYMENT=midtrans tetapi MIDTRANS_SERVER_KEY/CLIENT_KEY kosong.');
  }

  if (env.NODE_ENV === 'production' && env.APP_URL.includes('localhost')) {
    console.warn('\n[PERINGATAN] NODE_ENV=production tetapi APP_URL masih localhost.');
  }

  if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
    console.warn('\n[PERINGATAN] JWT_ACCESS_SECRET dan JWT_REFRESH_SECRET sebaiknya berbeda.');
  }
} catch (error) {
  exitCode = 1;
  console.error(error instanceof Error ? error.message : String(error));
}

if (exitCode === 0) {
  console.log('\nSemua pemeriksaan lolos.');
} else {
  console.error('\nPerbaiki konfigurasi di atas sebelum menjalankan aplikasi.');
}

process.exit(exitCode);
