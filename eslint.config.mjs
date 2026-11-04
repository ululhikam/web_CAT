// Flat config ESLint 9.
//
// Cakupan sengaja dipersempit ke TypeScript/JavaScript. Berkas `.svelte`
// diperiksa oleh `svelte-check` (bagian dari `pnpm typecheck`), sehingga
// tidak perlu memasang parser Svelte tambahan di sini.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.svelte-kit/**',
      '**/.vercel/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/prisma/generated/**',
      'packages/mocks/fixtures/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.ts', '**/*.mjs', '**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      // Identifier berawalan `_` dipakai sengaja untuk parameter yang tidak dipakai.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Tipe `any` masih dipakai pada batas integrasi (payload gateway, error).
      '@typescript-eslint/no-explicit-any': 'off',
      // Non-null assertion lazim pada hasil `find` yang sudah dicek.
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': 'off',
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
    },
  },

  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  {
    // Skrip Node memakai console untuk laporan CLI.
    files: ['**/scripts/**/*.ts', '**/*.config.ts', '**/*.config.mjs'],
    rules: {
      'no-console': 'off',
    },
  },
);
