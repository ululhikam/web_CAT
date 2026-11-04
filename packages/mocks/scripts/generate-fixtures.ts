/**
 * Menulis fixture ke `packages/mocks/generated/questions.json`.
 *
 * File hasil generate TIDAK di-commit (lihat .gitignore) karena berukuran
 * besar dan selalu bisa dibuat ulang secara deterministik.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { SUBTEST_SPECS, TOTAL_FIXTURE_QUESTIONS, buildFixtures } from '../src/fixtures';

const target = resolve(__dirname, '..', 'generated', 'questions.json');
const questions = buildFixtures();

const bySubtest = Object.fromEntries(
  SUBTEST_SPECS.map((spec) => [spec.subtestCode, questions.filter((q) => q.subtestCode === spec.subtestCode).length]),
);

mkdirSync(dirname(target), { recursive: true });
writeFileSync(
  target,
  `${JSON.stringify(
    {
      seed: 20260101,
      total: questions.length,
      bySubtest,
      questions,
    },
    null,
    2,
  )}\n`,
  'utf8',
);

console.log(`Fixture ditulis ke ${target}`);
console.log(`Total soal: ${questions.length} (target ${TOTAL_FIXTURE_QUESTIONS})`);
console.table(bySubtest);

if (questions.length !== TOTAL_FIXTURE_QUESTIONS) {
  console.error('Jumlah fixture tidak sesuai konfigurasi subtes.');
  process.exit(1);
}
