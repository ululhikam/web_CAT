import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

/**
 * Config khusus test integrasi. Dipisah supaya `pnpm test` tidak pernah
 * menyentuh database, dan test integrasi bisa punya timeout lebih longgar.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/integration/**/*.spec.ts'],
    passWithNoTests: false,
    // Satu fork agar koneksi DB tidak berebut `connection_limit=1`.
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
  resolve: {
    alias: {
      '@webcat/contracts': resolve(__dirname, '../../packages/contracts/src'),
    },
  },
});
