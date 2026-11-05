import { createRng, difficultyFor, intBetween } from './rng';
import type { PassHandSeed } from './types';

/**
 * Tes Pass Hand — 150 kolom.
 *
 * Setiap kolom berisi dua baris angka (atas dan bawah), masing-masing 20 digit.
 * Peserta menjumlahkan angka atas dan bawah per posisi lalu menuliskan digit
 * terakhir hasilnya.
 *
 * Angka disimpan selang-seling `[atas0, bawah0, atas1, bawah1, ...]` karena
 * `exam-question-projection.ts` memecah `columnNumbers` menjadi dua baris
 * berdasarkan indeks genap/ganjil, sedangkan `passHandKey` menjumlahkan
 * pasangan berurutan.
 */

const ROW_COUNT = 20;
const COLUMN_COUNT = 150;

const STEM = 'Jumlahkan angka baris atas dan baris bawah, lalu tuliskan digit terakhir hasilnya.';

export const PASS_HAND_QUESTIONS: PassHandSeed[] = Array.from(
  { length: COLUMN_COUNT },
  (_unused, index) => {
    const code = `PSI-PSH-${String(index + 1).padStart(3, '0')}`;
    const rng = createRng(`pass-hand:${code}`);

    const numbers: number[] = [];
    for (let position = 0; position < ROW_COUNT * 2; position += 1) {
      numbers.push(intBetween(rng, 0, 9));
    }

    return {
      code,
      categoryPath: 'psikologi/pass-hand',
      difficulty: difficultyFor(index),
      stem: STEM,
      columnIndex: index,
      numbers,
      tags: ['pass-hand', 'kecepatan-hitung'],
    };
  },
);
