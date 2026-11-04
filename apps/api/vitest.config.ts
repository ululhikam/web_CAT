import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts', 'src/**/*.spec.ts'],
    passWithNoTests: false,
    pool: 'threads',
  },
  resolve: {
    alias: {
      '@webcat/contracts': resolve(__dirname, '../../packages/contracts/src'),
    },
  },
});
