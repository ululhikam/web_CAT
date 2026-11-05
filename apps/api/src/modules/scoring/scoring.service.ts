import { Injectable } from '@nestjs/common';
import type { SubtestMetrics } from '@webcat/contracts';
import { resolveStrategy, round2, round4 } from './strategies';
import type { ScoringAnswer, ScoringOutput } from './scoring.types';

/**
 * Input penilaian satu subtes. Semua data berasal dari snapshot yang dibekukan
 * saat subtes dibuka — tidak ada pembacaan bank soal langsung.
 */
export interface ScoreSubtestInput {
  strategy: string;
  config: Record<string, unknown> | null;
  questionCount: number;
  durationMinutes: number;
  answers: ScoringAnswer[];
}

export interface SubtestScore {
  rawScore: number;
  maxScore: number;
  /** `clamp(raw/max × 100, 0, 100)` dibulatkan 2 desimal (ROUND_HALF_UP). */
  percentage: number;
  correct: number;
  wrong: number;
  blank: number;
  metrics: SubtestMetrics;
}

const EMPTY_METRICS: SubtestMetrics = {
  attempted: 0,
  correct: 0,
  wrong: 0,
  blank: 0,
  accuracy: null,
  throughput: null,
  consistencyIndex: null,
  consistencyFlagged: null,
  stability: null,
  trend: null,
  columnSeries: null,
  dimensionProfile: null,
  reviewFlagged: null,
};

/**
 * Facade registry strategi. Fungsi inti tetap murni di `strategies.ts`
 * sehingga dapat diuji tanpa database maupun jam sistem.
 */
@Injectable()
export class ScoringService {
  /** Menjalankan strategi subtes dan menormalkan hasilnya. */
  score(input: ScoreSubtestInput): SubtestScore {
    const handler = resolveStrategy(input.strategy);
    const output: ScoringOutput = handler.evaluate({
      strategy: handler.code,
      config: input.config ?? {},
      questionCount: Math.max(1, input.questionCount),
      durationMinutes: Math.max(1, input.durationMinutes),
      answers: input.answers,
    });

    const maxScore = output.maxScore > 0 ? output.maxScore : 1;
    const percentage = toPercentage(output.rawScore, maxScore);
    const answered = output.correct + output.wrong;

    const metrics: SubtestMetrics = {
      ...EMPTY_METRICS,
      ...output.metrics,
      attempted: output.metrics.attempted ?? answered,
      correct: output.correct,
      wrong: output.wrong,
      blank: output.blank,
      accuracy:
        output.metrics.accuracy === undefined
          ? answered === 0
            ? null
            : round4(output.correct / answered)
          : output.metrics.accuracy,
    };

    return {
      rawScore: round4(output.rawScore),
      maxScore,
      percentage,
      correct: output.correct,
      wrong: output.wrong,
      blank: output.blank,
      metrics,
    };
  }
}

/** Persentase subtes: `clamp(raw/max × 100, 0, 100)` dengan 2 desimal. */
export function toPercentage(rawScore: number, maxScore: number): number {
  if (!Number.isFinite(rawScore) || !Number.isFinite(maxScore) || maxScore <= 0) return 0;
  return round2(Math.min(100, Math.max(0, (rawScore / maxScore) * 100)));
}
