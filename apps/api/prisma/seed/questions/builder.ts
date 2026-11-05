import { createRng, shuffle, OPTION_LABELS } from './rng';
import type {
  ChoiceQuestionData,
  MultiChoiceQuestionData,
  WrittenMultiChoice,
  WrittenQuestion,
} from './types';

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

/**
 * Mengubah soal banyak-jawaban tertulis menjadi data siap-seed.
 *
 * Sama seperti `buildChoices`, tetapi kunci berupa **himpunan** label. Aturan
 * yang dijaga:
 *   - tepat lima opsi unik (kunci + pengecoh, tidak ada teks ganda);
 *   - 2–4 opsi benar — satu kunci saja berarti soal itu `SINGLE_CHOICE`;
 *   - urutan opsi diacak deterministik dari kode soal, sehingga distribusi
 *     posisi kunci tidak selalu di awal dan penulis data cukup menulis teks.
 */
export function buildMultiChoices(
  prefix: string,
  categoryPrefix: string,
  rows: readonly WrittenMultiChoice[],
): MultiChoiceQuestionData[] {
  return rows.map((row, index) => {
    const code = `${prefix}-${String(index + 1).padStart(3, '0')}`;

    const correctTexts = [...new Set(row.correct.map((value) => value.trim()))];
    if (correctTexts.length < 2 || correctTexts.length > 4) {
      throw new Error(`${code}: MULTI_CHOICE butuh 2–4 opsi benar (ada ${correctTexts.length})`);
    }

    const seen = new Set(correctTexts);
    const distractorTexts: string[] = [];
    for (const value of row.distractors) {
      const text = String(value).trim();
      if (seen.has(text)) continue;
      seen.add(text);
      distractorTexts.push(text);
    }
    if (correctTexts.length + distractorTexts.length !== 5) {
      throw new Error(
        `${code}: opsi harus tepat 5 (kunci ${correctTexts.length} + pengecoh ${distractorTexts.length})`,
      );
    }

    const shuffled = shuffle(createRng(`multi:${code}`), [...correctTexts, ...distractorTexts]);
    const correctSet = new Set(correctTexts);
    const answers = shuffled
      .map((contentText, position) => ({ contentText, label: OPTION_LABELS[position]! }))
      .filter((option) => correctSet.has(option.contentText))
      .map((option) => option.label);

    return {
      code,
      categoryPath: `${categoryPrefix}/${row.topic}`,
      difficulty: row.difficulty,
      stem: row.stem,
      options: shuffled as [string, string, string, string, string],
      answers,
      explanation: row.explanation,
      tags: row.tags,
    };
  });
}
