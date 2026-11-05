import type { SeedDifficulty, WrittenQuestion } from './types';

/**
 * Menulis satu soal pilihan ganda dengan kunci pada posisi pertama.
 *
 * `buildChoices` mengacak urutan opsi secara deterministik, sehingga label
 * kunci pada bank soal tidak selalu A. Karena kunci selalu ditulis paling
 * depan, kesalahan label tidak mungkin terjadi saat data diedit.
 */
export function q(
  topic: string,
  difficulty: SeedDifficulty,
  stem: string,
  correct: string,
  distractors: readonly [string, string, string, string],
  explanation: string,
  tags: readonly string[],
): WrittenQuestion {
  const options: [string, string, string, string, string] = [correct, ...distractors];

  if (new Set(options).size !== options.length) {
    throw new Error(`Opsi duplikat pada soal: ${stem.slice(0, 60)}`);
  }

  return { topic, difficulty, stem, options, answer: 'A', explanation, tags };
}
