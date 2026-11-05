import type { SeedDifficulty } from './types';

/** Hash 32-bit deterministik (FNV-1a) untuk menurunkan seed PRNG. */
export function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** PRNG mulberry32 — deterministik, cepat, dan cukup untuk 500 soal. */
export function createRng(seed: string | number): Rng {
  let state = (typeof seed === 'number' ? seed : hashSeed(seed)) >>> 0;
  return {
    next(): number {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    },
  };
}

export interface Rng {
  next(): number;
}

export function intBetween(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng.next() * (max - min + 1));
}

export function pick<T>(rng: Rng, values: readonly T[]): T {
  return values[intBetween(rng, 0, values.length - 1)]!;
}

export function shuffle<T>(rng: Rng, values: readonly T[]): T[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = intBetween(rng, 0, index);
    [copy[index], copy[target]] = [copy[target]!, copy[index]!];
  }
  return copy;
}

/* ------------------------------------------------------------------ opsi MCQ */

export const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'] as const;
export type OptionLabel = (typeof OPTION_LABELS)[number];

export interface BuiltOptions {
  options: Array<{ label: OptionLabel; contentText: string; isCorrect: boolean }>;
  answer: OptionLabel;
}

/**
 * Menyusun lima opsi (satu benar, empat pengecoh) dengan urutan acak
 * deterministik. Pengecoh dinormalkan: dibuang jika sama dengan kunci atau
 * duplikat, lalu dilengkapi dari daftar cadangan.
 */
export function buildOptions(
  rng: Rng,
  correct: string,
  distractors: readonly string[],
): BuiltOptions {
  const seen = new Set<string>([correct]);
  const unique: string[] = [];

  for (const value of distractors) {
    const text = String(value);
    if (seen.has(text)) continue;
    seen.add(text);
    unique.push(text);
    if (unique.length === 4) break;
  }

  // Pengecoh cadangan numerik/umum bila data kurang dari empat.
  let offset = 1;
  while (unique.length < 4) {
    const candidate = `Opsi ${unique.length + 1}`;
    if (!seen.has(candidate)) {
      seen.add(candidate);
      unique.push(candidate);
    }
    offset += 1;
    if (offset > 20) break;
  }

  const values = shuffle(rng, [correct, ...unique.slice(0, 4)]);
  const options = values.map((contentText, index) => ({
    label: OPTION_LABELS[index]!,
    contentText,
    isCorrect: contentText === correct,
  }));

  return {
    options,
    answer: options.find((option) => option.isCorrect)!.label,
  };
}

/** Pengecoh numerik di sekitar kunci. */
export function numericDistractors(
  answer: number,
  candidates: readonly number[] = [1, 2, 3, 5, 10],
): string[] {
  const values: string[] = [];
  const seen = new Set<string>([String(answer)]);

  for (const delta of candidates) {
    for (const value of [answer + delta, answer - delta]) {
      const text = String(value);
      if (value < 0 || seen.has(text)) continue;
      seen.add(text);
      values.push(text);
      if (values.length === 4) return values;
    }
  }
  return values;
}

export function difficultyFor(index: number): SeedDifficulty {
  const bucket = index % 10;
  if (bucket < 3) return 'EASY';
  if (bucket < 8) return 'MEDIUM';
  return 'HARD';
}
