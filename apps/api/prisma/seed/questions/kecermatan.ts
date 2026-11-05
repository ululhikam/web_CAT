import { createRng, difficultyFor, intBetween, shuffle } from './rng';
import type { MissingElementSeed } from './types';

/**
 * Tes Kecermatan — 500 soal "elemen hilang".
 *
 * Soal dibangkitkan deterministik (PRNG ber-seed tetap) agar isi bank stabil
 * antar seed. Tiga varian dipakai supaya peserta tidak terbiasa dengan satu
 * jenis simbol:
 *
 *   angka  — 167 soal (0–9)
 *   huruf  — 167 soal (A–Z tanpa I dan O)
 *   simbol — 166 soal (bentuk geometris yang mudah dibedakan)
 *
 * Setiap soal: larik `left` sepanjang 5–7 karakter, satu karakter dihapus
 * menjadi `right`, peserta memilih karakter yang hilang dari lima opsi.
 */

interface Variant {
  key: 'angka' | 'huruf' | 'simbol';
  label: string;
  count: number;
  pool: readonly string[];
}

const VARIANTS: readonly Variant[] = [
  {
    key: 'angka',
    label: 'angka',
    count: 167,
    pool: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  },
  {
    key: 'huruf',
    label: 'huruf',
    count: 167,
    // I dan O dihilangkan agar tidak tertukar dengan 1 dan 0.
    pool: 'ABCDEFGHJKLMNPQRSTUVWXYZ'.split(''),
  },
  {
    key: 'simbol',
    label: 'simbol',
    count: 166,
    pool: ['◆', '●', '▲', '■', '★', '✦', '✚', '✖', '◐', '◑', '▣', '⬢'],
  },
];

function buildVariant(variant: Variant, startIndex: number): MissingElementSeed[] {
  const rows: MissingElementSeed[] = [];

  for (let offset = 0; offset < variant.count; offset += 1) {
    const ordinal = startIndex + offset;
    const code = `PSI-KECM-${String(ordinal + 1).padStart(3, '0')}`;
    const rng = createRng(`kecermatan:${code}`);

    const difficulty = difficultyFor(offset);
    // Makin sulit, makin panjang larik yang harus diingat.
    const length = difficulty === 'EASY' ? 5 : difficulty === 'MEDIUM' ? 6 : 7;

    const leftChars: string[] = [];
    for (let position = 0; position < length; position += 1) {
      leftChars.push(variant.pool[intBetween(rng, 0, variant.pool.length - 1)]!);
    }

    const missingIndex = intBetween(rng, 0, leftChars.length - 1);
    const answer = leftChars[missingIndex]!;
    const rightChars = leftChars.filter((_char, position) => position !== missingIndex);

    // Empat pengecoh dari pool yang sama, dijamin unik dan bukan kunci.
    const distractors = shuffle(
      rng,
      variant.pool.filter((char) => char !== answer),
    ).slice(0, 4);

    rows.push({
      code,
      categoryPath: `psikologi/kecermatan/${variant.key}`,
      difficulty,
      stem: `Lengkapi larik ${variant.label} kedua dengan karakter yang hilang.`,
      left: leftChars.join(''),
      right: rightChars.join(''),
      answer,
      distractors,
      tags: ['kecermatan', `kecermatan-${variant.key}`],
    });
  }

  return rows;
}

export const KECERMATAN_QUESTIONS: MissingElementSeed[] = VARIANTS.flatMap((variant, index) =>
  buildVariant(
    variant,
    VARIANTS.slice(0, index).reduce((total, item) => total + item.count, 0),
  ),
);
