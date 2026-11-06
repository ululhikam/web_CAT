import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

/**
 * Pengaman cache pre-bundle `@webcat/contracts`.
 *
 * Vite mem-pre-bundle paket kontrak (CommonJS) ke `node_modules/.vite/deps`,
 * dan cache itu **tidak** ikut tidak-valid ketika `packages/contracts/dist`
 * dibangun ulang — kuncinya hanya hash lockfile. Chunk lama lalu tidak memuat
 * ekspor baru dan halaman yang mengimpornya gagal dengan
 * `does not provide an export named ...`, yang tampil sebagai **500 Internal
 * Error** (pernah terjadi di `/exam/[sessionId]` setelah F5-13 menambah
 * `countChangesInWindow`).
 *
 * Solusinya: simpan sidik jari isi `dist` di `.vite/contracts-dist.hash`.
 * Bila berbeda, folder `deps` dibuang sebelum Vite memakainya.
 */
const webRoot = fileURLToPath(new URL('.', import.meta.url));
const contractsDist = resolve(webRoot, '../../packages/contracts/dist');
const viteCache = resolve(webRoot, 'node_modules/.vite');
const depsDir = join(viteCache, 'deps');
const stampFile = join(viteCache, 'contracts-dist.hash');

function hashContractsDist(): string | null {
  if (!existsSync(contractsDist)) return null;

  const hash = createHash('sha256');
  const walk = (directory: string): void => {
    const entries = readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    for (const entry of entries) {
      const full = join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else hash.update(entry.name).update(readFileSync(full));
    }
  };
  walk(contractsDist);
  return hash.digest('hex');
}

/** @returns `true` bila cache dibuang (artinya isi `dist` berubah). */
function dropStalePrebundle(): boolean {
  const current = hashContractsDist();
  if (!current) return false;

  const previous = existsSync(stampFile) ? readFileSync(stampFile, 'utf8').trim() : '';
  if (previous === current) return false;

  // Hanya folder `deps`; cache `vitest` dan metadata lain dibiarkan.
  try {
    rmSync(depsDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    // Di Windows, dev server lain atau antivirus bisa mengunci berkas cache.
    // Jangan matikan dev server hanya karena cache gagal dibuang; percobaan
    // berikutnya akan mengulang penghapusan karena stamp belum diperbarui.
    console.warn(
      `[webcat] gagal membuang cache pre-bundle kontrak (${code ?? 'unknown'}); ` +
        'kemungkinan ada dev server lain yang memakai cache ini.',
    );
    return false;
  }
  mkdirSync(viteCache, { recursive: true });
  writeFileSync(stampFile, current, 'utf8');
  console.info('[webcat] cache pre-bundle kontrak dibuang karena `dist` berubah');
  return true;
}

/** Jalur kedua: kontrak dibangun ulang saat dev server sedang hidup. */
function contractsPrebundleGuard(): Plugin {
  return {
    name: 'webcat:contracts-prebundle-guard',
    // Hanya relevan untuk dev server; `vite build`/vitest tidak memakai cache
    // pre-bundle ini.
    apply: 'serve',
    /**
     * Jalur utama: kontrak biasanya dibangun ulang ketika dev server mati.
     * Hook ini berjalan saat config dimuat, jadi cache basi dari build
     * kontrak sebelumnya dibuang sebelum Vite memakainya.
     */
    config(_config, env) {
      if (env.command === 'serve') dropStalePrebundle();
    },
    configureServer(server) {
      if (!existsSync(contractsDist)) return;

      let timer: ReturnType<typeof setTimeout> | null = null;
      let restarting = false;

      const schedule = (file: string): void => {
        if (!file.startsWith(contractsDist)) return;
        if (restarting) return;

        // Build menulis banyak berkas berurutan; tunggu sampai tenang dulu.
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          if (!dropStalePrebundle()) return;
          restarting = true;
          // `server.restart()` memuat ulang config, dan sidik jari sudah
          // diperbarui sehingga tidak terjadi restart berulang.
          server.restart();
        }, 900);
      };

      server.watcher.add(contractsDist);
      server.watcher.on('add', schedule);
      server.watcher.on('change', schedule);
      server.watcher.on('unlink', schedule);
    },
  };
}

export default defineConfig({
  plugins: [sveltekit(), contractsPrebundleGuard()],
  // Paket kontrak dibangun sebagai CommonJS (dipakai API). Vite SSR tidak
  // selalu mendeteksi named export CJS, jadi paksa diproses sebagai
  // dependency (bukan external) agar interop-nya benar.
  ssr: {
    noExternal: ['@webcat/contracts'],
  },
  optimizeDeps: {
    include: ['@webcat/contracts'],
  },
  build: {
    // Workspace package di-resolve ke `packages/contracts/dist` (di luar
    // node_modules), jadi plugin CommonJS default tidak menyentuhnya. Tanpa
    // ini, named export runtime seperti `STAGE_CODES` tidak terdeteksi.
    commonjsOptions: {
      include: [/node_modules/, /packages[\\/]contracts[\\/]dist/],
      transformMixedEsModules: true,
    },
  },
  server: {
    port: 5173,
    // Folder `build` adalah output adapter-node saat `pnpm build`. Di Windows
    // file-nya bisa terkunci sehingga watcher gagal `scandir` dan dev server
    // mati. Jangan pernah ikut memantau artefak build.
    watch: {
      ignored: ['**/build/**'],
    },
    proxy: {
      '/api': {
        target: process.env.API_URL ?? 'http://localhost:3000',
        changeOrigin: false,
      },
    },
  },
  preview: { port: 4173 },
});
