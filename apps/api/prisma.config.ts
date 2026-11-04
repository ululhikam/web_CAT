/**
 * Konfigurasi Prisma CLI (Prisma >= 6.4).
 *
 * Sejak `prisma.config.ts` ada, Prisma TIDAK lagi memuat `.env` otomatis.
 * Karena itu file ini memuat `.env` sendiri, dengan urutan:
 *   1. `.env` di direktori kerja (biasanya `apps/api`)
 *   2. `.env` di root repo (tempat `.env` utama disimpan)
 *
 * `override: false` membuat nilai yang sudah ada tidak ditimpa, sehingga
 * variabel environment asli (mis. dari shell atau CI) selalu menang.
 */
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'prisma/config';

const candidates = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '../../.env'),
  resolve(process.cwd(), '../../.env.local'),
  resolve(process.cwd(), '../.env'),
];

for (const file of candidates) {
  if (existsSync(file)) loadEnv({ path: file, override: false, quiet: true });
}

export default defineConfig({
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed/index.ts',
  },
});
