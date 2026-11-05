import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts', 'src/**/*.spec.ts'],
    // Test integrasi butuh database; jalankan lewat `pnpm test:integration`.
    exclude: ['test/integration/**', '**/node_modules/**'],
    passWithNoTests: false,
    pool: 'threads',
    // Beberapa test merender WebP lewat `sharp` (CPU-bound). Saat seluruh suite
    // berjalan paralel, satu test bisa melewati batas default 5 detik bukan
    // karena lambat, melainkan karena berebut CPU.
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      '@webcat/contracts': resolve(__dirname, '../../packages/contracts/src'),
    },
  },
});
