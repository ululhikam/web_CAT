import { createRng, shuffle, OPTION_LABELS } from './rng';
import type { ChoiceQuestionData, WrittenQuestion } from './types';

/**
 * Mengubah soal tertulis menjadi data siap-seed.
 *
 * Dua hal dikerjakan:
 *   1. Memberi kode publik berurutan `<prefix>-001`, `<prefix>-002`, ...
 *   2. Mengacak urutan opsi secara deterministik (seed = kode soal) agar
 *      distribusi kunci A–E merata, tanpa mengubah teks pembahasan.
 *
 * Karena opsi diacak, label kunci final dapat berbeda dari label pada data
 * sumber. Pembahasan tetap valid karena hanya merujuk isi jawaban.
 */
export function buildChoices(
  prefix: string,
  categoryPrefix: string,
  rows: readonly WrittenQuestion[],
): ChoiceQuestionData[] {
  return rows.map((row, index) => {
    const code = `${prefix}-${String(index + 1).padStart(3, '0')}`;
    const keyIndex = OPTION_LABELS.indexOf(row.answer);
    const keyText = row.options[keyIndex];

    if (keyText === undefined) {
      throw new Error(`${code}: label kunci ${row.answer} tidak ada pada opsi`);
    }
    if (new Set(row.options).size !== row.options.length) {
      throw new Error(`${code}: opsi duplikat`);
    }

    const shuffled = shuffle(createRng(`choices:${code}`), row.options);
    const answerIndex = shuffled.indexOf(keyText);
    if (answerIndex < 0) {
      throw new Error(`${code}: kunci hilang setelah pengacakan`);
    }

    return {
      code,
      categoryPath: `${categoryPrefix}/${row.topic}`,
      difficulty: row.difficulty,
      stem: row.stem,
      options: shuffled as [string, string, string, string, string],
      answer: OPTION_LABELS[answerIndex]!,
      explanation: row.explanation,
      tags: row.tags,
    };
  });
}
