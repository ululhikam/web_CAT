/**
 * `pnpm db:guard`
 *
 * Pengaman sebelum menjalankan perintah destruktif (`migrate reset`, `db push
 * --force-reset`, `seed` di produksi). Tujuan: mustahil tanpa sengaja
 * menghapus data Supabase produksi dari laptop developer.
 *
 * Aturan:
 *   - Host lokal (localhost/127.0.0.1) → boleh.
 *   - Host remote → butuh ALLOW_REMOTE_DB=true DAN konfirmasi nama database.
 *
 * Pemakaian:
 *   pnpm db:guard                     # cek saja
 *   pnpm db:guard -- reset            # cek + izin untuk reset
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadDotEnv(filePath: string): void {
  if (!existsSync(filePath)) return;
  for (const rawLine of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
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
    if (!process.env[key]) process.env[key] = value;
  }
}

const root = resolve(__dirname, '../../..');
loadDotEnv(resolve(root, '.env'));
loadDotEnv(resolve(__dirname, '../.env'));

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'host.docker.internal']);

const args = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
const action = args[0] ?? 'check';
const destructive = action === 'reset' || action === 'drop' || action === 'seed';

const url = process.env.DATABASE_URL;

if (!url) {
  console.error('DATABASE_URL belum diisi. Tidak ada yang bisa diperiksa.');
  process.exit(1);
}

let host = '';
let database = '';
let sslmode = '';

try {
  const parsed = new URL(url);
  host = parsed.hostname;
  database = parsed.pathname.replace(/^\//, '') || '(default)';
  sslmode = parsed.searchParams.get('sslmode') ?? '(default)';
} catch {
  console.error('DATABASE_URL bukan URL Postgres yang valid.');
  process.exit(1);
}

const isLocal = LOCAL_HOSTS.has(host);
const allowRemote = process.env.ALLOW_REMOTE_DB === 'true';

console.log('Target database:');
console.log(`  host     : ${host}`);
console.log(`  database : ${database}`);
console.log(`  sslmode  : ${sslmode}`);
console.log(`  lokal    : ${isLocal ? 'ya' : 'TIDAK'}`);
console.log(`  aksi     : ${action}${destructive ? ' (DESTRUKTIF)' : ''}`);

if (isLocal) {
  console.log('\nLokal — aman untuk reset/seed.');
  process.exit(0);
}

if (!destructive) {
  console.log('\nRemote, aksi non-destruktif — diizinkan.');
  process.exit(0);
}

if (!allowRemote) {
  console.error(
    '\nDITOLAK: aksi destruktif ke database remote. Set ALLOW_REMOTE_DB=true bila benar-benar yakin.',
  );
  process.exit(1);
}

// Lapisan kedua: harus menyebut nama database secara eksplisit.
const confirmation = process.env.CONFIRM_DATABASE;
if (confirmation !== database) {
  console.error(
    `\nDITOLAK: set CONFIRM_DATABASE="${database}" untuk mengonfirmasi target penghapusan.`,
  );
  process.exit(1);
}

console.log('\nRemote + ALLOW_REMOTE_DB=true + CONFIRM_DATABASE cocok — lanjutkan dengan hati-hati.');
process.exit(0);
