/**
 * Dev runner stabil untuk @webcat/api di Windows.
 *
 * Kenapa bukan `nest start --watch`?
 * Nest CLI membunuh child lama lewat `tree-kill` setiap recompile. Di Windows
 * kill itu sering gagal (PID sudah berubah / proses sudah mati), sehingga:
 *   1. child lama tetap memegang port 3000,
 *   2. child baru crash `EADDRINUSE`,
 *   3. Nest CLI crash saat membunuh PID yang sudah mati → watcher berhenti.
 * Efeknya dev server mati-loop dan proxy Vite memberi `ECONNREFUSED`.
 *
 * Kenapa bukan `node --watch dist/src/main.js`?
 * `node --watch` restart tiap kali file berubah. `tsc --watch` menulis banyak
 * file per kompilasi (dan bisa menulis ulang file yang sama), jadi restart
 * sering bertumpuk: proses baru `listen` sebelum proses lama benar-benar mati
 * → `EADDRINUSE` lagi.
 *
 * Runner ini menyinkronkan keduanya:
 *   1. `tsc --watch` mengompilasi.
 *   2. Proses API baru dijalankan HANYA setelah tsc melaporkan
 *      "Found 0 errors" — artinya semua file sudah selesai ditulis.
 *   3. Saat recompile sukses, proses lama dimatikan sampai benar-benar keluar
 *      (menunggu event `exit`) baru proses baru dijalankan.
 * Dengan begitu tidak ada dua proses yang berebut port 3000.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { resolve } from 'node:path';

const projectDir = resolve(import.meta.dirname, '..');
const entryFile = resolve(projectDir, 'dist/src/main.js');
const requireFromApi = createRequire(resolve(projectDir, 'package.json'));

/**
 * Cegah start kedua. Tanpa ini, instance baru hanya akan gagal `listen`
 * (EADDRINUSE) dan membanjiri terminal dengan error tanpa penjelasan.
 */
function checkPortFree(port) {
  return new Promise((resolveCheck) => {
    const probe = createServer();
    probe.once('error', () => resolveCheck(false));
    probe.once('listening', () => probe.close(() => resolveCheck(true)));
    // Tanpa host: Node memakai `::` (dual-stack), sama seperti `app.listen(port)`
    // di Nest. Dengan '0.0.0.0' probe bisa lolos padahal IPv6 masih dipakai.
    probe.listen(port);
  });
}

let tscPath;
try {
  tscPath = requireFromApi.resolve('typescript/bin/tsc');
} catch {
  console.error('[dev] TypeScript tidak ditemukan. Jalankan `pnpm install` dulu.');
  process.exit(1);
}

const isWindows = process.platform === 'win32';
const ANSI = /\u001b\[[0-9;]*m/g;
const PORT = Number(process.env.PORT ?? 3000);

function killTree(pid) {
  if (!pid) return;
  if (isWindows) {
    spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  try {
    process.kill(-pid, 'SIGTERM');
  } catch {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      /* sudah mati */
    }
  }
}

if (!(await checkPortFree(PORT))) {
  console.error(`[dev] Port ${PORT} sudah dipakai proses lain.`);
  console.error('[dev] Hentikan instance API yang lama dulu (mis. `Get-NetTCPConnection -LocalPort 3000`).');
  process.exit(1);
}

const tscWatch = spawn(
  process.execPath,
  [tscPath, '-p', 'tsconfig.build.json', '--watch', '--preserveWatchOutput'],
  { cwd: projectDir, stdio: ['ignore', 'pipe', 'inherit'] },
);

/** @type {import('node:child_process').ChildProcess | null} */
let app = null;
let appStarting = false;
let restartQueued = false;
let shuttingDown = false;
/** PID proses API yang sengaja dihentikan (restart), agar tidak dilaporkan sebagai crash. */
const stoppingPids = new Set();

function stopApp() {
  return new Promise((resolveStop) => {
    if (!app || app.exitCode !== null || app.signalCode !== null) {
      app = null;
      resolveStop();
      return;
    }

    const current = app;
    app = null;
    stoppingPids.add(current.pid);
    current.once('exit', () => resolveStop());
    killTree(current.pid);
  });
}

/** Tunggu port benar-benar bebas; socket Windows butuh sesaat setelah kill. */
async function waitForPortFree(timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await checkPortFree(PORT)) return true;
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

async function startApp() {
  if (shuttingDown || appStarting) return;
  appStarting = true;

  try {
    await stopApp();

    if (!existsSync(entryFile)) {
      console.error('[dev] dist/src/main.js belum ada. Menunggu kompilasi berikutnya...');
      return;
    }

    if (!(await waitForPortFree())) {
      console.error(`[dev] Port ${PORT} masih dipakai proses lain.`);
      console.error('[dev] Hentikan instance API lain dulu, lalu simpan file lagi untuk restart.');
      return;
    }

    const child = spawn(process.execPath, ['--enable-source-maps', 'dist/src/main.js'], {
      cwd: projectDir,
      stdio: 'inherit',
      env: process.env,
    });
    app = child;

    child.on('exit', (code, signal) => {
      if (shuttingDown || stoppingPids.delete(child.pid)) return;
      const reason = signal ? `sinyal ${signal}` : `kode ${code ?? 0}`;
      console.error(`[dev] API berhenti (${reason}). Menunggu perubahan file...`);
      if (app === child) app = null;
    });
  } finally {
    appStarting = false;
    if (restartQueued) {
      restartQueued = false;
      void startApp();
    }
  }
}

function requestRestart() {
  if (appStarting) {
    restartQueued = true;
    return;
  }
  void startApp();
}

let buffer = '';

tscWatch.stdout?.on('data', (chunk) => {
  const text = chunk.toString();
  process.stdout.write(text);

  buffer += text.replace(ANSI, '');
  const lines = buffer.split(/\r?\n/);
  buffer = lines.pop() ?? '';

  for (const line of lines) {
    if (/Found 0 errors/i.test(line)) {
      requestRestart();
    } else if (/Found \d+ errors?/i.test(line)) {
      console.error('[dev] Kompilasi gagal. API tetap memakai versi terakhir yang sukses.');
    }
  }
});

tscWatch.on('error', (error) => {
  console.error('[dev] Gagal menjalankan tsc:', error.message);
  shutdown(1);
});

tscWatch.on('exit', (code, signal) => {
  if (shuttingDown) return;
  const reason = signal ? `sinyal ${signal}` : `kode ${code ?? 0}`;
  console.error(`[dev] tsc berhenti (${reason}). Hentikan dev server.`);
  shutdown(code ?? 1);
});

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  killTree(app?.pid);
  killTree(tscWatch.pid);
  process.exit(code);
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => shutdown(0));
}
