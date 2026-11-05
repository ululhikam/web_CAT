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
// `NODE_ENV` tidak bisa diandalkan: shell pengguna bisa saja sudah menyetel
// `production` walau yang jalan `vite dev`. Argv selalu mencerminkan perintah
// yang benar-benar dieksekusi.
const isDev = process.argv.includes('dev');

/**
 * Content-Security-Policy.
 *
 * `mode: 'hash'` dipakai (bukan nonce) supaya header boleh di-cache bersama
 * HTML-nya — nonce akan kedaluwarsa saat HTML dilayani dari cache. SvelteKit
 * menambahkan hash untuk setiap script inline yang digenerate. `style-src`
 * tetap mengizinkan inline karena banyak komponen memakai atribut `style` dan
 * transisi Svelte membuat elemen `<style>`.
 */
const cspDirectives = {
  'default-src': ['self'],
  'script-src': ['self'],
  'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
  'img-src': ['self', 'data:', 'blob:', 'https://*.supabase.co'],
  'font-src': ['self', 'data:', 'https://fonts.gstatic.com'],
  // HMR Vite memakai WebSocket di dev; produksi cukup same-origin.
  'connect-src': isDev ? ['self', 'ws:'] : ['self'],
  'frame-ancestors': ['none'],
  'base-uri': ['self'],
  'form-action': ['self'],
  'object-src': ['none'],
};

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: onVercel
      ? vercel({ runtime: 'nodejs22.x', regions: ['sin1'] })
      : node({ out: 'build' }),
    csp: {
      // Hash (bukan nonce) agar header aman di-cache bersama HTML-nya.
      mode: 'hash',
      directives: cspDirectives,
    },
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
