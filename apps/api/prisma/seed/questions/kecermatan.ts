import { createRng, difficultyFor, intBetween, shuffle } from './rng';
import type { MissingElementSeed } from './types';

/**
 * Tes Kecermatan Huruf — 500 soal "huruf hilang".
 *
 * Sesuai spesifikasi CAT Polri:
 *   - 10 kolom, masing-masing 50 soal (total 500 soal).
 *   - Setiap kolom berdurasi 1 menit (total 10 menit).
 *   - Setiap kolom memiliki 5 huruf patokan acak unik.
 *   - Peserta memilih 1 huruf yang hilang dari kelompok patokan tersebut.
 */

const LETTER_POOL = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.split('');

export const KECERMATAN_QUESTIONS: MissingElementSeed[] = Array.from({ length: 500 }, (_, index) => {
  const columnIndex = Math.floor(index / 50); // Kolom 0-9 (10 kolom)
  const code = `PSI-KECM-${String(index + 1).padStart(3, '0')}`;
  const rng = createRng(`kecermatan:${code}`);
  const difficulty = difficultyFor(index % 50);

  // 5 huruf unik patokan per kolom
  const colRng = createRng(`kecermatan-col:${columnIndex}`);
  const colPool = shuffle(colRng, LETTER_POOL).slice(0, 5);

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
    categoryPath: 'psikologi/kecermatan/huruf',
    difficulty,
    stem: `Kolom ${columnIndex + 1} — Uji Kecepatan dan Ketelitian Visual: Amati 5 karakter patokan beserta label huruf A sampai E pada tabel di atas, kemudian identifikasi secara cepat dan tepat 1 karakter yang hilang dari 4 karakter soal di bawah ini.`,
    left: leftChars.join(''),
    right: rightChars.join(''),
    answer,
    distractors,
    columnIndex,
    tags: ['kecermatan', 'kecermatan-huruf', `kolom-${columnIndex + 1}`],
  };
});
