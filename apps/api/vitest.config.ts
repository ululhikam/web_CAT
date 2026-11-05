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
  },
  resolve: {
    alias: {
      '@webcat/contracts': resolve(__dirname, '../../packages/contracts/src'),
    },
  },
});
