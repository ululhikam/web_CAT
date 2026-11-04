/**
 * Memuat berkas `.env` untuk pengembangan lokal.
 *
 * Kenapa perlu: `AppConfigService` membaca `process.env` apa adanya (tanpa
 * `@nestjs/config`), sehingga tanpa langkah ini `pnpm dev` akan gagal dengan
 * "DATABASE_URL wajib diisi" meski `.env` sudah ada.
 *
 * Aturan:
 *  - Di produksi (Vercel/CI) fungsi ini TIDAK melakukan apa pun; variabel
 *    environment asli dari platform yang dipakai.
 *  - Nilai yang sudah ada tidak ditimpa (`override: false`), jadi
 *    `DATABASE_URL=... pnpm dev` tetap menang atas isi berkas.
 *  - Urutan pencarian: `apps/api/.env` lebih dulu, lalu `.env` di root repo
 *    sebagai cadangan untuk skrip yang dijalankan dari root.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as load } from 'dotenv';

export function loadLocalEnv(): void {
  if (process.env.NODE_ENV === 'production') return;
  if (process.env.WEBCAT_SKIP_DOTENV === '1') return;

  // Saat dijalankan dari `apps/api`, cwd = apps/api → `../../.env` = root repo.
  // Saat dijalankan dari root (mis. turbo), cwd = root → `.env` langsung ketemu.
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '.env.local'),
    resolve(process.cwd(), '../.env'),
    resolve(process.cwd(), '../../.env'),
  ];

  for (const file of candidates) {
    if (existsSync(file)) load({ path: file, override: false, quiet: true });
  }
}
