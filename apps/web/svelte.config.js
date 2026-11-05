import { fileURLToPath } from 'node:url';
import vercel from '@sveltejs/adapter-vercel';
import node from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * Konfigurasi SvelteKit.
 *
 * Adapter dipilih dari environment:
 *  - Di Vercel (`VERCEL=1` diset otomatis) → `adapter-vercel`
 *  - Di lokal/CI                           → `adapter-node`
 *
 * Alasan: `adapter-vercel` membuat symlink ke `node_modules` di dalam
 * `.vercel/output`, dan operasi itu butuh hak symlink yang sering tidak
 * tersedia di Windows (EPERM). Artefak yang di-deploy tetap memakai adapter
 * Vercel; build lokal hanya perlu lolos kompilasi.
 *
 * @type {import('@sveltejs/kit').Config}
 */
const onVercel = Boolean(process.env.VERCEL);

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: onVercel
      ? vercel({ runtime: 'nodejs22.x', regions: ['sin1'] })
      : node({ out: 'build' }),
    alias: {
      // Paket komponen dipakai langsung dari source (tanpa build step).
      '@webcat/ui': '../../packages/ui/src',
      // `@webcat/contracts` dibangun sebagai CommonJS untuk API NestJS,
      // sedangkan SSR SvelteKit berjalan sebagai ESM. Arahkan ke sumber
      // TypeScript agar Vite tidak mengeksekusi `exports` CJS di runtime SSR.
      '@webcat/contracts': fileURLToPath(
        new URL('../../packages/contracts/src/index.ts', import.meta.url),
      ),
    },
  },
};

export default config;
