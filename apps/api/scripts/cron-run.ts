/**
 * `pnpm cron:run <job>` — menjalankan endpoint cron secara lokal.
 *
 * Berguna saat mengembangkan tanpa menunggu jadwal Vercel Cron (± 1 menit)
 * dan tanpa membuka endpoint internal ke publik.
 *
 * Pemakaian:
 *   pnpm cron:run                       # semua job
 *   pnpm cron:run process-jobs          # satu job
 *   pnpm cron:run finalize-subtests expire-subscriptions
 *
 * Env:
 *   API_URL      (default http://localhost:3000)
 *   CRON_SECRET  (wajib, sama dengan yang dipakai server)
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const JOBS = [
  'finalize-subtests',
  'process-jobs',
  'expire-subscriptions',
  'cleanup',
] as const;

type Job = (typeof JOBS)[number];

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

function resolveTargets(): Job[] {
  const requested = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
  if (requested.length === 0) return [...JOBS];

  return requested.map((name) => {
    if (!(JOBS as readonly string[]).includes(name)) {
      console.error(`Job tidak dikenal: ${name}`);
      console.error(`Pilihan: ${JOBS.join(', ')}`);
      process.exit(1);
    }
    return name as Job;
  });
}

async function run(): Promise<void> {
  loadDotEnv(resolve(__dirname, '../../..', '.env'));
  loadDotEnv(resolve(__dirname, '..', '.env'));

  const apiUrl = (process.env.API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error('CRON_SECRET belum diisi — tidak bisa memanggil endpoint cron.');
    process.exit(1);
  }

  let failures = 0;

  for (const job of resolveTargets()) {
    const started = Date.now();
    const url = `${apiUrl}/api/v1/internal/cron/${job}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${secret}`,
          'content-type': 'application/json',
        },
      });

      const text = await response.text();
      const duration = Date.now() - started;

      if (!response.ok) {
        failures += 1;
        console.error(`x ${job} — HTTP ${response.status} (${duration} ms)`);
        console.error(`  ${text.slice(0, 500)}`);
        continue;
      }

      console.log(`+ ${job} — HTTP ${response.status} (${duration} ms)`);
      if (text) console.log(`  ${text.slice(0, 500)}`);
    } catch (error) {
      failures += 1;
      console.error(`x ${job} — gagal: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} job gagal.`);
    process.exit(1);
  }

  console.log('\nSemua job selesai.');
}

void run();
