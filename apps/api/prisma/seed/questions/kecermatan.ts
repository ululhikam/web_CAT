import { createRng, difficultyFor, intBetween, shuffle } from './rng';
import type { MissingElementSeed } from './types';

/**
 * Tes Kecermatan — 500 soal "karakter hilang" dalam 10 kolom (50 soal/kolom).
 *
 * Pembagian 10 Kolom sesuai spesifikasi terbaru:
 *   - Kolom 1–3 (columnIndex 0, 1, 2): Huruf Kapital (3 kolom pertama)
 *   - Kolom 4–6 (columnIndex 3, 4, 5): Angka (3 kolom kedua)
 *   - Kolom 7–9 (columnIndex 6, 7, 8): Simbol (3 kolom selanjutnya)
 *   - Kolom 10  (columnIndex 9)      : Campuran Angka, Simbol, dan Huruf (1 kolom terakhir)
 *
 * Setiap kolom berdurasi 1 menit (total 10 menit) dan memiliki 1 sampel
 * patokan berisi 5 karakter unik yang dipetakan ke opsi A, B, C, D, E.
 */

const LETTER_POOL = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.split('');
const NUMBER_POOL = '0123456789'.split('');
const SYMBOL_POOL = ['@', '#', '$', '%', '&', '*', '+', '?', '!', '=', '~', '^', '§', '∆', 'Ω', 'Ψ', 'Σ', 'Φ'];

function buildColumnPool(columnIndex: number): {
  pool: string[];
  categoryPath: string;
  typeLabel: string;
  tag: string;
} {
  const colRng = createRng(`kecermatan-col-v2:${columnIndex}`);

  if (columnIndex < 3) {
    return {
      pool: shuffle(colRng, LETTER_POOL).slice(0, 5),
      categoryPath: 'psikologi/kecermatan/huruf',
      typeLabel: 'Huruf',
      tag: 'kecermatan-huruf',
    };
  }

  if (columnIndex < 6) {
    return {
      pool: shuffle(colRng, NUMBER_POOL).slice(0, 5),
      categoryPath: 'psikologi/kecermatan/angka',
      typeLabel: 'Angka',
      tag: 'kecermatan-angka',
    };
  }

  if (columnIndex < 9) {
    return {
      pool: shuffle(colRng, SYMBOL_POOL).slice(0, 5),
      categoryPath: 'psikologi/kecermatan/simbol',
      typeLabel: 'Simbol',
      tag: 'kecermatan-simbol',
    };
  }

  // Kolom 10 (columnIndex === 9): Campuran Huruf, Angka, dan Simbol
  const letters = shuffle(colRng, LETTER_POOL).slice(0, 2);
  const numbers = shuffle(colRng, NUMBER_POOL).slice(0, 2);
  const symbols = shuffle(colRng, SYMBOL_POOL).slice(0, 1);
  return {
    pool: shuffle(colRng, [...letters, ...numbers, ...symbols]),
    categoryPath: 'psikologi/kecermatan/campuran',
    typeLabel: 'Campuran (Huruf, Angka & Simbol)',
    tag: 'kecermatan-campuran',
  };
}

export const KECERMATAN_QUESTIONS: MissingElementSeed[] = Array.from({ length: 500 }, (_, index) => {
  const columnIndex = Math.floor(index / 50); // Kolom 0-9 (10 kolom)
  const code = `PSI-KECM-${String(index + 1).padStart(3, '0')}`;
  const rng = createRng(`kecermatan-v2:${code}`);
  const difficulty = difficultyFor(index % 50);

  const { pool: colPool, categoryPath, typeLabel, tag } = buildColumnPool(columnIndex);

  const leftChars = [...colPool];
  const missingIndex = intBetween(rng, 0, leftChars.length - 1);
  const answer = leftChars[missingIndex]!;
  const rightChars = leftChars.filter((_, pos) => pos !== missingIndex);

  // 4 pengecoh dari kelompok kolom yang sama
  const distractors = shuffle(
    rng,
    colPool.filter((char) => char !== answer),
  );

  return {
    code,
    categoryPath,
    difficulty,
    stem: `Kolom ${columnIndex + 1} (${typeLabel}) — Uji Kecepatan dan Ketelitian Visual: Amati 5 karakter patokan beserta label huruf A sampai E pada tabel di atas, kemudian identifikasi secara cepat dan tepat 1 karakter yang hilang dari 4 karakter soal di bawah ini.`,
    left: leftChars.join(''),
    right: rightChars.join(''),
    answer,
    distractors,
    columnIndex,
    tags: ['kecermatan', tag, `kolom-${columnIndex + 1}`],
  };
});
