import { describe, expect, it } from 'vitest';
import {
  FIXTURE_SEED,
  SUBTEST_SPECS,
  TOTAL_FIXTURE_QUESTIONS,
  buildFixtures,
  buildFixturesBySubtest,
  toClientQuestion,
} from '../src/fixtures';
import { createRng } from '../src/rng';

describe('fixture soal', () => {
  it('menghasilkan jumlah soal sesuai konfigurasi subtes', () => {
    expect(TOTAL_FIXTURE_QUESTIONS).toBe(1090);
    expect(buildFixtures()).toHaveLength(1090);
  });

  it('deterministik untuk seed yang sama', () => {
    const a = JSON.stringify(buildFixtures());
    const b = JSON.stringify(buildFixtures());
    expect(a).toBe(b);
  });

  it('menghasilkan distribusi per subtes yang benar', () => {
    const grouped = buildFixturesBySubtest();

    for (const spec of SUBTEST_SPECS) {
      expect(grouped[spec.subtestCode]).toHaveLength(spec.count);
    }
  });

  it('tidak pernah mengirim kunci jawaban ke klien', () => {
    const questions = buildFixtures().slice(0, 200);
    for (const question of questions) {
      const client = toClientQuestion(question);
      expect(client).not.toHaveProperty('correctKey');
      expect(client).not.toHaveProperty('answerKey');
    }
  });

  it('PRNG deterministik dan berada di rentang [0, 1)', () => {
    const rng = createRng(FIXTURE_SEED);
    for (let i = 0; i < 1000; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }

    const again = createRng(FIXTURE_SEED);
    expect(again()).toBe(createRng(FIXTURE_SEED)());
  });
});
