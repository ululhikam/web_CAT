/**
 * Ekspor dokumen OpenAPI ke `docs/api/openapi.json`.
 *
 * Jalankan dari `apps/api`:
 *   pnpm docs:openapi        # build lalu tulis artefak
 *   pnpm docs:openapi:check  # gagal bila artefak tidak sama dengan kode
 *
 * Kenapa harus lewat hasil build? `tsx`/esbuild tidak meng-emit decorator
 * metadata, sehingga container Nest tidak bisa diinstansiasi. Jalankan
 * `node dist/scripts/openapi.js` (dibuat oleh `pnpm build`).
 *
 * Dokumen dibangun dari kode yang sama dengan yang menyajikan `/api/docs`,
 * jadi artefak ini tidak bisa "basi": request body/query diambil dari skema
 * Zod yang benar-benar dipakai `zodPipe`.
 *
 * Tidak butuh koneksi database: `NestFactory.create()` hanya menyiapkan
 * container, tidak menjalankan `onModuleInit`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { buildOpenApiDocument } from '../src/core/http/openapi';
import { createApp } from '../src/main';

const TARGET = resolve(process.cwd(), '../../docs/api/openapi.json');
const CHECK = process.argv.includes('--check');

/**
 * Nilai placeholder agar generator bisa jalan di CI tanpa `.env`.
 * Tidak dipakai untuk koneksi: `NestFactory.create()` tidak menjalankan
 * `onModuleInit`, jadi Prisma tidak pernah menghubungi database.
 */
function ensureGeneratorEnv(): void {
  const defaults: Record<string, string> = {
    DATABASE_URL: 'postgresql://generator:generator@localhost:5432/webcat',
    JWT_ACCESS_SECRET: 'generator-access-secret-minimal-32-karakter',
    JWT_REFRESH_SECRET: 'generator-refresh-secret-minimal-32-karakter',
    CRON_SECRET: 'generator-cron-secret',
  };
  for (const [key, value] of Object.entries(defaults)) {
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main(): Promise<void> {
  ensureGeneratorEnv();
  const app = await createApp();
  let serialized: string;

  try {
    const document = buildOpenApiDocument(app);
    serialized = `${JSON.stringify(document, null, 2)}\n`;
  } finally {
    await app.close();
  }

  if (CHECK) {
    let existing = '';
    try {
      existing = readFileSync(TARGET, 'utf8');
    } catch {
      console.error(`Artefak belum ada: ${TARGET}`);
      process.exitCode = 1;
      return;
    }
    // Bandingkan tanpa bergantung pada line ending: di Windows `core.autocrlf`
    // mengubah artefak menjadi CRLF saat checkout, sedangkan generator menulis
    // LF. Isi dokumen tetap sama.
    const normalize = (text: string): string => text.replace(/\r\n/g, '\n');
    if (normalize(existing) !== normalize(serialized)) {
      console.error('docs/api/openapi.json tidak sinkron dengan kode.');
      console.error('Jalankan `pnpm docs:openapi` lalu commit hasilnya.');
      process.exitCode = 1;
      return;
    }
    console.log('OpenAPI sinkron dengan kode.');
    return;
  }

  mkdirSync(dirname(TARGET), { recursive: true });
  writeFileSync(TARGET, serialized, 'utf8');

  const document = JSON.parse(serialized) as {
    paths?: Record<string, Record<string, unknown>>;
    components?: { schemas?: Record<string, unknown> };
  };
  const operations = Object.values(document.paths ?? {}).reduce(
    (total, item) => total + Object.keys(item).length,
    0,
  );
  console.log(`OpenAPI ditulis ke ${TARGET}`);
  console.log(`  path: ${Object.keys(document.paths ?? {}).length}`);
  console.log(`  operasi: ${operations}`);
  console.log(`  schema: ${Object.keys(document.components?.schemas ?? {}).length}`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
