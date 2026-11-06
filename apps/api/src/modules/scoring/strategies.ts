import type {
  QuestionSnapshot,
  ScoringAnswer,
  ScoringContext,
  ScoringOutput,
  ScoringStrategyHandler,
} from './scoring.types';

/* ============================================================================
 * Delapan strategi penilaian (plan §7.9).
 *
 * Semua fungsi di file ini MURNI: tidak menyentuh database dan tidak membaca
 * jam sistem. Input sepenuhnya berasal dari snapshot yang dibekukan saat subtes
 * dibuka, sehingga hasil selalu deterministik dan dapat diuji tanpa I/O.
 * ========================================================================== */

/* ------------------------------------------------------------------ helpers */

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Pembulatan 2 desimal ROUND_HALF_UP. */
export function round2(value: number): number {
  const scaled = value * 100;
  const rounded = Math.sign(scaled) * Math.round(Math.abs(scaled) + 1e-9);
  return rounded / 100;
}

export function round4(value: number): number {
  const scaled = value * 10_000;
  const rounded = Math.sign(scaled) * Math.round(Math.abs(scaled) + 1e-9);
  return rounded / 10_000;
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function isBlank(answer: ScoringAnswer['answer']): boolean {
  if (!answer) return true;
  if (answer.optionIds && answer.optionIds.length > 0) return false;
  if (typeof answer.value === 'number') return false;
  if (typeof answer.text === 'string' && answer.text.trim().length > 0) return false;
  if (answer.values && answer.values.some((value) => value.trim().length > 0)) return false;
  return true;
}

export function chosenLabels(
  snapshot: QuestionSnapshot,
  answer: ScoringAnswer['answer'],
): string[] {
  if (!answer?.optionIds?.length) return [];
  const byId = new Map(snapshot.options.map((option) => [option.id, option.label]));
  return answer.optionIds
    .map((id) => byId.get(id))
    .filter((label): label is string => typeof label === 'string');
}

export function correctLabels(snapshot: QuestionSnapshot): string[] {
  return snapshot.options.filter((option) => option.isCorrect).map((option) => option.label);
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((label) => set.has(label));
}

/** Nilai Likert setelah arah skor dinormalisasi (item terbalik dibalik). */
export function normalizedLikert(
  snapshot: QuestionSnapshot,
  answer: ScoringAnswer['answer'],
): number | null {
  if (!answer || typeof answer.value !== 'number') return null;
  const scale = snapshot.scale ?? 5;
  if (answer.value < 1 || answer.value > scale) return null;
  return snapshot.isReverse ? scale + 1 - answer.value : answer.value;
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Simpangan baku populasi (pembagi n), cukup untuk metrik stabilitas. */
export function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/** Slope regresi linier y terhadap indeks 0..n-1. */
export function slope(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const avgX = (n - 1) / 2;
  const avgY = mean(values);
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < n; index += 1) {
    const dx = index - avgX;
    numerator += dx * (values[index]! - avgY);
    denominator += dx * dx;
  }
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Stabilitas Pass Hand: `100 × (1 − stdev/mean)`, dijepit 0..100.
 * Kurang dari dua kolom dianggap sempurna (tidak ada variasi yang bisa dinilai).
 */
export function stabilityOf(columnTimes: number[]): number {
  if (columnTimes.length < 2) return 100;
  const avg = mean(columnTimes);
  if (avg <= 0) return 100;
  return clamp(100 * (1 - stdev(columnTimes) / avg), 0, 100);
}

/** Kunci digit Pass Hand per pasangan: digit terakhir hasil penjumlahan. */
export function passHandKey(snapshot: QuestionSnapshot): string[] {
  const numbers = snapshot.columnNumbers ?? [];
  const pairs = Math.floor(numbers.length / 2);
  const key: string[] = [];
  for (let index = 0; index < pairs; index += 1) {
    const a = numbers[index * 2] ?? 0;
    const b = numbers[index * 2 + 1] ?? 0;
    key.push(String((a + b) % 10));
  }
  return key;
}

function sumWeights(answers: ScoringAnswer[]): number {
  return answers.reduce(
    (sum, item) => sum + (item.snapshot.weight > 0 ? item.snapshot.weight : 1),
    0,
  );
}

/* ------------------------------------------------------------------ 1. KEYED_CORRECT */

/**
 * Pilihan tunggal/ganda dengan kunci. Benar = seluruh opsi benar terpilih dan
 * tidak ada opsi salah; salah = dikurangi `penalty` (default 0) per soal.
 */
export const keyedCorrect: ScoringStrategyHandler = {
  code: 'KEYED_CORRECT',
  evaluate(context: ScoringContext): ScoringOutput {
    const penalty = num(context.config.penalty, 0);
    let raw = 0;
    let correct = 0;
    let wrong = 0;
    let blank = 0;

    for (const item of context.answers) {
      if (isBlank(item.answer)) {
        blank += 1;
        continue;
      }
      const weight = item.snapshot.weight > 0 ? item.snapshot.weight : 1;
      const picked = chosenLabels(item.snapshot, item.answer);
      const expected = correctLabels(item.snapshot);
      if (picked.length > 0 && sameSet(picked, expected)) {
        correct += 1;
        raw += weight;
      } else {
        wrong += 1;
        raw -= penalty * weight;
      }
    }

    const maxScore = Math.max(1, sumWeights(context.answers));
    return {
      rawScore: round4(clamp(raw, 0, maxScore)),
      maxScore: round4(maxScore),
      correct,
      wrong,
      blank,
      metrics: {
        accuracy: correct + wrong === 0 ? null : round4(correct / (correct + wrong)),
      },
    };
  },
};

/* ------------------------------------------------------------------ 2. MULTI_CORRECT_PARTIAL */

/**
 * Multi-jawaban dengan kredit parsial: `(hits − penalty × misses)/keySize`.
 * Kredit penuh bila seluruh kunci terpilih tanpa pilihan salah.
 */
export const multiCorrectPartial: ScoringStrategyHandler = {
  code: 'MULTI_CORRECT_PARTIAL',
  evaluate(context: ScoringContext): ScoringOutput {
    const penalty = num(context.config.wrongPenalty, 0.5);
    let raw = 0;
    let correct = 0;
    let wrong = 0;
    let blank = 0;

    for (const item of context.answers) {
      if (isBlank(item.answer)) {
        blank += 1;
        continue;
      }
      const weight = item.snapshot.weight > 0 ? item.snapshot.weight : 1;
      const picked = chosenLabels(item.snapshot, item.answer);
      const expected = correctLabels(item.snapshot);
      const keySize = Math.max(1, expected.length);
      const hits = picked.filter((label) => expected.includes(label)).length;
      const misses = picked.length - hits;
      const exact = hits === keySize && misses === 0;
      const ratio = exact ? 1 : clamp((hits - penalty * misses) / keySize, 0, 1);
      raw += ratio * weight;
      if (exact) correct += 1;
      else wrong += 1;
    }

    const maxScore = Math.max(1, sumWeights(context.answers));
    return {
      rawScore: round4(clamp(raw, 0, maxScore)),
      maxScore: round4(maxScore),
      correct,
      wrong,
      blank,
      metrics: {
        accuracy: correct + wrong === 0 ? null : round4(correct / (correct + wrong)),
      },
    };
  },
};

/* ------------------------------------------------------------------ 3. WEIGHTED_OPTIONS */

/**
 * Setiap opsi membawa `scoreValue`; nilai jawaban = jumlah skor opsi terpilih.
 * Berguna untuk format yang memberi nilai berbeda per pilihan.
 */
export const weightedOptions: ScoringStrategyHandler = {
  code: 'WEIGHTED_OPTIONS',
  evaluate(context: ScoringContext): ScoringOutput {
    let raw = 0;
    let maxScore = 0;
    let correct = 0;
    let wrong = 0;
    let blank = 0;

    for (const item of context.answers) {
      const weight = item.snapshot.weight > 0 ? item.snapshot.weight : 1;
      const best = Math.max(0, ...item.snapshot.options.map((option) => option.scoreValue));
      maxScore += best * weight;

      if (isBlank(item.answer)) {
        blank += 1;
        continue;
      }
      const picked = new Set(chosenLabels(item.snapshot, item.answer));
      const awarded =
        item.snapshot.options
          .filter((option) => picked.has(option.label))
          .reduce((sum, option) => sum + Math.max(0, option.scoreValue), 0) * weight;
      raw += clamp(awarded, 0, best * weight);
      if (best > 0 && awarded >= best * weight) correct += 1;
      else wrong += 1;
    }

    return {
      rawScore: round4(raw),
      maxScore: round4(Math.max(1, maxScore)),
      correct,
      wrong,
      blank,
      metrics: {
        accuracy: correct + wrong === 0 ? null : round4(correct / (correct + wrong)),
      },
    };
  },
};

/* ------------------------------------------------------------------ 4. DIMENSION_PROFILE */

/**
 * Profil dimensi Kepribadian.
 *
 * Setiap opsi Likert membawa vektor `dimensionMap` (bobot bertanda). Nilai
 * ternormalisasi dijumlahkan per dimensi menjadi posisi 0..100. Skor subtes =
 * 100 × (1 − Σ jarak terbobot terhadap `targetProfile` / Σ bobot dimensi).
 *
 * Tanpa `targetProfile`, skor = ketegasan jawaban terhadap titik tengah
 * (dipakai sebagai pembanding antar peserta).
 */
export const dimensionProfile: ScoringStrategyHandler = {
  code: 'DIMENSION_PROFILE',
  evaluate(context: ScoringContext): ScoringOutput {
    const target = asRecord(context.config.targetProfile);
    const dimensionWeights = asRecord(context.config.dimensionWeights);

    const totals = new Map<string, number>();
    const counts = new Map<string, number>();
    let answered = 0;
    let blank = 0;

    for (const item of context.answers) {
      const value = normalizedLikert(item.snapshot, item.answer);
      if (value === null) {
        blank += 1;
        continue;
      }
      answered += 1;

      const scale = item.snapshot.scale ?? 5;
      const position = scale <= 1 ? 0 : (value - 1) / (scale - 1);
      const optionIndex = clamp(
        Math.round(value) - 1,
        0,
        Math.max(0, item.snapshot.options.length - 1),
      );
      const option = item.snapshot.options[optionIndex];
      const map = asRecord(option?.dimensionMap);

      for (const [dimension, rawWeight] of Object.entries(map)) {
        if (!Number.isFinite(rawWeight)) continue;
        const weight = Math.abs(Number(rawWeight));
        if (weight === 0) continue;
        const direction = Number(rawWeight) < 0 ? 1 - position : position;
        totals.set(dimension, (totals.get(dimension) ?? 0) + direction * weight);
        counts.set(dimension, (counts.get(dimension) ?? 0) + weight);
      }
    }

    const profile: Record<string, number> = {};
    for (const [dimension, total] of totals) {
      const weight = counts.get(dimension) ?? 0;
      profile[dimension] = weight === 0 ? 50 : round4(clamp((total / weight) * 100, 0, 100));
    }

    const dimensions = Object.keys(profile);
    let distance = 0;
    let weightSum = 0;
    for (const dimension of dimensions) {
      const weight = Math.abs(num(dimensionWeights[dimension], 1));
      if (weight === 0) continue;
      const actual = profile[dimension] ?? 50;
      const expected = num(target[dimension], actual);
      distance += (Math.abs(actual - expected) / 100) * weight;
      weightSum += weight;
    }
    const score = weightSum === 0 ? 100 : clamp(100 * (1 - distance / weightSum), 0, 100);

    return {
      rawScore: round4(score),
      maxScore: 100,
      correct: answered,
      wrong: 0,
      blank,
      metrics: {
        accuracy: answered + blank === 0 ? null : round4(answered / (answered + blank)),
        dimensionProfile: profile,
      },
    };
  },
};

/* ------------------------------------------------------------------ 5. CONSISTENCY_INDEX */

/**
 * `100 × (1 − Σdelta / (4 × pairCount))` untuk tiap `pairGroup` berisi ≥2 item.
 * Di bawah `threshold` (default 70) hanya menjadi flag, kecuali subtes
 * dikonfigurasi menggugurkan pada metrik ini.
 */
export const consistencyIndex: ScoringStrategyHandler = {
  code: 'CONSISTENCY_INDEX',
  evaluate(context: ScoringContext): ScoringOutput {
    const threshold = num(context.config.threshold, 70);
    const groups = new Map<string, number[]>();

    for (const item of context.answers) {
      const group = item.snapshot.pairGroup;
      if (!group) continue;
      const value = normalizedLikert(item.snapshot, item.answer);
      if (value === null) continue;
      const current = groups.get(group) ?? [];
      current.push(value);
      groups.set(group, current);
    }

    let pairCount = 0;
    let deltaSum = 0;
    for (const values of groups.values()) {
      for (let index = 0; index + 1 < values.length; index += 2) {
        pairCount += 1;
        deltaSum += Math.abs(values[index]! - values[index + 1]!);
      }
    }

    const index = pairCount === 0 ? 100 : clamp(100 * (1 - deltaSum / (4 * pairCount)), 0, 100);
    const flagged = index < threshold;

    return {
      rawScore: round4(index),
      maxScore: 100,
      correct: pairCount,
      wrong: 0,
      blank: 0,
      metrics: {
        consistencyIndex: round4(index),
        consistencyFlagged: flagged,
      },
    };
  },
};

/* ------------------------------------------------------------------ 6. CORRECT_MINUS_PENALTY */

/**
 * Kecermatan: `raw = correct − penalty × wrong`, blank = 0, dijepit ≥ 0.
 * `maxScore` = jumlah soal sehingga persentase berada pada skala 0–100.
 */
export const correctMinusPenalty: ScoringStrategyHandler = {
  code: 'CORRECT_MINUS_PENALTY',
  evaluate(context: ScoringContext): ScoringOutput {
    const penalty = num(context.config.penalty, 0);
    let correct = 0;
    let wrong = 0;
    let blank = 0;

    const columnCorrect = new Array(10).fill(0);
    const columnAttempted = new Array(10).fill(0);

    for (let index = 0; index < context.answers.length; index += 1) {
      const item = context.answers[index]!;
      const col = item.snapshot.columnIndex ?? Math.floor(index / 50);
      const safeCol = Math.max(0, Math.min(9, col));

      if (isBlank(item.answer)) {
        blank += 1;
        continue;
      }
      columnAttempted[safeCol] += 1;
      const picked = chosenLabels(item.snapshot, item.answer);
      const expected = correctLabels(item.snapshot);
      const answeredText = (item.answer?.text ?? '').trim().toUpperCase();
      const textKey = (item.snapshot.missingElement?.answer ?? '').trim().toUpperCase();
      const textMatch = answeredText.length > 0 && textKey.length > 0 && answeredText === textKey;

      const chosenOptionIds = new Set(item.answer?.optionIds ?? []);
      const pickedOptions = item.snapshot.options.filter((opt) => chosenOptionIds.has(opt.id));
      const isOptionMarkedCorrect = pickedOptions.some((opt) => opt.isCorrect);
      const isCharMatch =
        textKey.length > 0 &&
        pickedOptions.some((opt) => (opt.text ?? '').trim().toUpperCase() === textKey);

      if (
        (picked.length > 0 && sameSet(picked, expected)) ||
        textMatch ||
        isOptionMarkedCorrect ||
        isCharMatch
      ) {
        correct += 1;
        columnCorrect[safeCol] += 1;
      } else {
        wrong += 1;
      }
    }

    const raw = Math.max(0, correct - penalty * wrong);
    const totalAnswered = correct + wrong;
    const elapsedMinutes = Math.max(1, context.durationMinutes);

    return {
      rawScore: round4(raw),
      maxScore: Math.max(1, context.questionCount),
      correct,
      wrong,
      blank,
      metrics: {
        accuracy: totalAnswered === 0 ? null : round4(correct / totalAnswered),
        throughput: round4(totalAnswered / elapsedMinutes),
        stability: round4(stabilityOf(columnCorrect)),
        trend: round4(slope(columnCorrect)),
        columnSeries: columnCorrect,
      },
    };
  },
};

/* ------------------------------------------------------------------ 7. PASS_HAND_METRIC */

/**
 * Pass Hand: akurasi + throughput + stabilitas.
 *
 * `stability = 100 × (1 − stdev(waktu kolom)/mean(waktu kolom))`
 * `raw = (w1×accuracy×100 + w2×throughputScore + w3×stability) / Σw`
 */
export const passHandMetric: ScoringStrategyHandler = {
  code: 'PASS_HAND_METRIC',
  evaluate(context: ScoringContext): ScoringOutput {
    const w1 = num(context.config.w1, 0.5);
    const w2 = num(context.config.w2, 0.25);
    const w3 = num(context.config.w3, 0.25);
    const maxPairsPerMinute = num(context.config.maxPairsPerMinute, 60);

    let totalPairs = 0;
    let correctPairs = 0;
    let completedColumns = 0;
    const columnTimes: number[] = [];

    for (const item of context.answers) {
      const key = passHandKey(item.snapshot);
      const given = item.answer?.values ?? [];
      const pairCount = key.length;
      const answered = Math.min(pairCount, given.filter((value) => value.trim().length > 0).length);

      let columnCorrect = 0;
      for (let index = 0; index < pairCount; index += 1) {
        const value = (given[index] ?? '').trim();
        if (value.length > 0 && value === key[index]) columnCorrect += 1;
      }

      totalPairs += answered;
      correctPairs += columnCorrect;
      if (pairCount > 0 && answered >= pairCount) completedColumns += 1;
      if (item.timeSpentMs > 0) columnTimes.push(item.timeSpentMs);
    }

    const accuracy = totalPairs === 0 ? 0 : correctPairs / totalPairs;
    const elapsedMinutes = Math.max(1, context.durationMinutes);
    const throughput = totalPairs / elapsedMinutes;
    const throughputScore =
      maxPairsPerMinute <= 0 ? 0 : clamp((throughput / maxPairsPerMinute) * 100, 0, 100);
    const stability = stabilityOf(columnTimes);
    const weightSum = Math.max(0.0001, w1 + w2 + w3);
    const raw = (w1 * accuracy * 100 + w2 * throughputScore + w3 * stability) / weightSum;

    return {
      rawScore: round4(clamp(raw, 0, 100)),
      maxScore: 100,
      correct: correctPairs,
      wrong: Math.max(0, totalPairs - correctPairs),
      blank: Math.max(0, context.questionCount - completedColumns),
      metrics: {
        accuracy: round4(accuracy),
        throughput: round4(throughput),
        stability: round4(stability),
        trend: round4(slope(columnTimes)),
        columnSeries: columnTimes,
      },
    };
  },
};

/* ------------------------------------------------------------------ 8. MANUAL_REVIEW */

/** Esai/pendapat: skor 0 + flag agar admin menilai manual. */
export const manualReview: ScoringStrategyHandler = {
  code: 'MANUAL_REVIEW',
  evaluate(context: ScoringContext): ScoringOutput {
    return {
      rawScore: 0,
      maxScore: 100,
      correct: 0,
      wrong: 0,
      blank: context.answers.length,
      metrics: { reviewFlagged: true },
    };
  },
};

/* ------------------------------------------------------------------ registry */

export const ALL_STRATEGIES: ScoringStrategyHandler[] = [
  keyedCorrect,
  multiCorrectPartial,
  weightedOptions,
  dimensionProfile,
  consistencyIndex,
  correctMinusPenalty,
  passHandMetric,
  manualReview,
];

const REGISTRY = new Map(ALL_STRATEGIES.map((strategy) => [strategy.code, strategy]));

/** Alias nilai seed/legacy → strategi final (aditif, tidak breaking). */
const ALIASES: Record<string, string> = {
  LIKERT_PROFILE: 'DIMENSION_PROFILE',
  COLUMN_MATCH: 'PASS_HAND_METRIC',
  PASS_HAND_COLUMN: 'PASS_HAND_METRIC',
};

export function resolveStrategy(code: string | null | undefined): ScoringStrategyHandler {
  const normalized = ALIASES[code ?? ''] ?? code ?? '';
  return REGISTRY.get(normalized) ?? keyedCorrect;
}

export function isKnownStrategy(code: string): boolean {
  return REGISTRY.has(ALIASES[code] ?? code);
}
