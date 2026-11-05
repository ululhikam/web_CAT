import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
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
    proxy: {
      '/api': {
        target: process.env.API_URL ?? 'http://localhost:3000',
        changeOrigin: false,
      },
    },
  },
  preview: { port: 4173 },
});
