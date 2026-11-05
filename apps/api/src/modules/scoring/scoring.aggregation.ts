import { round2 } from './strategies';

/**
 * Agregasi nilai (plan §7.9). Murni dan deterministik.
 *
 *   percentage_subtest = clamp(raw/max × 100, 0, 100)
 *   percentage_stage   = Σ(percentage_subtest × weight / Σweight_subtest)
 *   total              = Σ(percentage_stage × weight / Σweight_stage)
 *
 * Bobot dinormalisasi bila totalnya bukan 100 agar skala tetap 0–100.
 */

export interface WeightedScore {
  percentage: number | null;
  weight: number;
  passed?: boolean | null;
}

/** Persentase subtes, 2 desimal ROUND_HALF_UP. */
export function percentageOf(rawScore: number, maxScore: number): number {
  if (!Number.isFinite(rawScore) || !Number.isFinite(maxScore) || maxScore <= 0) return 0;
  return round2(Math.min(100, Math.max(0, (rawScore / maxScore) * 100)));
}

/** Nilai tes (stage) = rata-rata terbobot persentase subtes di dalamnya. */
export function stagePercentage(subtests: WeightedScore[]): number {
  const totalWeight = subtests.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  if (totalWeight <= 0) return 0;
  const value = subtests.reduce(
    (sum, item) => sum + (item.percentage ?? 0) * (Math.max(0, item.weight) / totalWeight),
    0,
  );
  return round2(Math.min(100, Math.max(0, value)));
}

/** Nilai total ujian = rata-rata terbobot persentase stage. */
export function totalPercentage(stages: WeightedScore[]): number {
  const totalWeight = stages.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  if (totalWeight <= 0) return 0;
  const value = stages.reduce(
    (sum, item) => sum + (item.percentage ?? 0) * (Math.max(0, item.weight) / totalWeight),
    0,
  );
  return round2(Math.min(100, Math.max(0, value)));
}

/** Lulus total: tidak gugur, nilai ≥ ambang, dan semua stage lulus bila diaktifkan. */
export function hasPassed(input: {
  eliminated: boolean;
  totalScore: number;
  totalPassingScore: number;
  stagePassed: Array<boolean | null | undefined>;
  requireStagePass: boolean;
}): boolean {
  if (input.eliminated) return false;
  if (input.totalScore < input.totalPassingScore) return false;
  if (!input.requireStagePass) return true;
  return input.stagePassed.every((passed) => passed !== false);
}
