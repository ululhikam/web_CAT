import { describe, expect, it } from 'vitest';
import type { AnswerPayload } from '@webcat/contracts';
import { ScoringService, toPercentage } from '../src/modules/scoring/scoring.service';
import {
  hasPassed,
  percentageOf,
  stagePercentage,
  totalPercentage,
} from '../src/modules/scoring/scoring.aggregation';
import { resolveStrategy, round2 } from '../src/modules/scoring/strategies';
import type {
  QuestionSnapshot,
  ScoringAnswer,
  SnapshotOption,
} from '../src/modules/scoring/scoring.types';

/* ------------------------------------------------------------------ fixtures */

let optionCounter = 0;

function option(input: Partial<SnapshotOption> & { label: string }): SnapshotOption {
  optionCounter += 1;
  return {
    id: input.id ?? `00000000-0000-4000-8000-${String(optionCounter).padStart(12, '0')}`,
    label: input.label,
    text: input.text ?? null,
    isCorrect: input.isCorrect ?? false,
    scoreValue: input.scoreValue ?? 0,
    dimensionMap: input.dimensionMap ?? null,
  };
}

function snapshot(overrides: Partial<QuestionSnapshot> = {}): QuestionSnapshot {
  return {
    sourceId: 'DEV-TEST-0001',
    type: 'SINGLE_CHOICE',
    stem: 'Pertanyaan uji',
    stemFormat: 'MARKDOWN',
    difficulty: 'MEDIUM',
    weight: 1,
    scale: null,
    isReverse: false,
    pairGroup: null,
    columnIndex: null,
    columnNumbers: null,
    missingElement: null,
    options: [],
    media: [],
    ...overrides,
  };
}

function answer(
  itemSnapshot: QuestionSnapshot,
  payload: AnswerPayload | null,
  timeSpentMs = 0,
): ScoringAnswer {
  return {
    questionId: `q-${Math.random().toString(36).slice(2)}`,
    position: 1,
    columnIndex: itemSnapshot.columnIndex,
    snapshot: itemSnapshot,
    answer: payload,
    timeSpentMs,
  };
}

function choiceSnapshot(correct: string, labels = ['A', 'B', 'C', 'D']): QuestionSnapshot {
  return snapshot({
    options: labels.map((label) =>
      option({
        label,
        text: label,
        isCorrect: label === correct,
        scoreValue: label === correct ? 1 : 0,
      }),
    ),
  });
}

function payload(optionIds: string[]): AnswerPayload {
  return { optionIds };
}

function optionIdOf(itemSnapshot: QuestionSnapshot, label: string): string {
  const found = itemSnapshot.options.find((entry) => entry.label === label);
  if (!found) throw new Error(`Opsi ${label} tidak ada`);
  return found.id;
}

/* ------------------------------------------------------------------ service */

const service = new ScoringService();

describe('registry strategi', () => {
  it('mengenali 8 strategi final', () => {
    const codes = [
      'KEYED_CORRECT',
      'MULTI_CORRECT_PARTIAL',
      'WEIGHTED_OPTIONS',
      'DIMENSION_PROFILE',
      'CONSISTENCY_INDEX',
      'CORRECT_MINUS_PENALTY',
      'PASS_HAND_METRIC',
      'MANUAL_REVIEW',
    ];
    for (const code of codes) {
      expect(resolveStrategy(code).code).toBe(code);
    }
  });

  it('memetakan alias lama dan fallback aman', () => {
    expect(resolveStrategy('LIKERT_PROFILE').code).toBe('DIMENSION_PROFILE');
    expect(resolveStrategy('COLUMN_MATCH').code).toBe('PASS_HAND_METRIC');
    expect(resolveStrategy('PASS_HAND_COLUMN').code).toBe('PASS_HAND_METRIC');
    expect(resolveStrategy('TIDAK_DIKENAL').code).toBe('KEYED_CORRECT');
    expect(resolveStrategy(null).code).toBe('KEYED_CORRECT');
  });
});

describe('KEYED_CORRECT', () => {
  it('menilai benar/salah/kosong dan menerapkan penalti', () => {
    const benar = choiceSnapshot('A');
    const salah = choiceSnapshot('B');
    const kosong = choiceSnapshot('C');

    const result = service.score({
      strategy: 'KEYED_CORRECT',
      config: { penalty: 0.25 },
      questionCount: 3,
      durationMinutes: 10,
      answers: [
        answer(benar, payload([optionIdOf(benar, 'A')])),
        answer(salah, payload([optionIdOf(salah, 'A')])),
        answer(kosong, null),
      ],
    });

    expect(result.correct).toBe(1);
    expect(result.wrong).toBe(1);
    expect(result.blank).toBe(1);
    expect(result.rawScore).toBe(0.75);
    expect(result.maxScore).toBe(3);
    expect(result.percentage).toBe(25);
    expect(result.metrics.accuracy).toBe(0.5);
  });

  it('menghitung jawaban ganda hanya bila set-nya sama', () => {
    const item = snapshot({
      type: 'MULTI_CHOICE',
      options: [
        option({ label: 'A', isCorrect: true }),
        option({ label: 'B', isCorrect: true }),
        option({ label: 'C', isCorrect: false }),
      ],
    });

    const tepat = service.score({
      strategy: 'KEYED_CORRECT',
      config: null,
      questionCount: 1,
      durationMinutes: 5,
      answers: [answer(item, payload([optionIdOf(item, 'A'), optionIdOf(item, 'B')]))],
    });
    const kurang = service.score({
      strategy: 'KEYED_CORRECT',
      config: null,
      questionCount: 1,
      durationMinutes: 5,
      answers: [answer(item, payload([optionIdOf(item, 'A')]))],
    });

    expect(tepat.correct).toBe(1);
    expect(kurang.wrong).toBe(1);
  });
});

describe('MULTI_CORRECT_PARTIAL', () => {
  it('memberi kredit parsial proporsional', () => {
    const item = snapshot({
      type: 'MULTI_CHOICE',
      options: [
        option({ label: 'A', isCorrect: true }),
        option({ label: 'B', isCorrect: true }),
        option({ label: 'C', isCorrect: false }),
      ],
    });

    const result = service.score({
      strategy: 'MULTI_CORRECT_PARTIAL',
      config: { wrongPenalty: 0.5 },
      questionCount: 1,
      durationMinutes: 5,
      answers: [answer(item, payload([optionIdOf(item, 'A'), optionIdOf(item, 'C')]))],
    });

    // hits=1, misses=1, keySize=2 -> (1 - 0.5) / 2 = 0.25
    expect(result.rawScore).toBe(0.25);
    expect(result.maxScore).toBe(1);
    expect(result.percentage).toBe(25);
  });
});

describe('WEIGHTED_OPTIONS', () => {
  it('memberi nilai opsi terpilih dan menjepit ke nilai terbaik', () => {
    const item = snapshot({
      options: [
        option({ label: 'A', scoreValue: 3 }),
        option({ label: 'B', scoreValue: 2 }),
        option({ label: 'C', scoreValue: 0 }),
      ],
    });

    const satu = service.score({
      strategy: 'WEIGHTED_OPTIONS',
      config: null,
      questionCount: 1,
      durationMinutes: 5,
      answers: [answer(item, payload([optionIdOf(item, 'A')]))],
    });
    const berlebih = service.score({
      strategy: 'WEIGHTED_OPTIONS',
      config: null,
      questionCount: 1,
      durationMinutes: 5,
      answers: [answer(item, payload([optionIdOf(item, 'A'), optionIdOf(item, 'B')]))],
    });

    expect(satu.rawScore).toBe(3);
    expect(satu.maxScore).toBe(3);
    expect(satu.percentage).toBe(100);
    expect(berlebih.rawScore).toBe(3);
  });
});

describe('DIMENSION_PROFILE', () => {
  function likert(
    value: number,
    dimensionMap: Record<string, number>,
    isReverse = false,
  ): ScoringAnswer {
    const item = snapshot({
      type: 'LIKERT_STATEMENT',
      scale: 5,
      isReverse,
      options: [1, 2, 3, 4, 5].map((scaleValue) =>
        option({ label: String(scaleValue), scoreValue: scaleValue }),
      ),
      stem: 'Pernyataan',
    });
    // Map dimensi hanya melekat pada opsi yang dipilih; fixture di bawah
    // meniru perilaku snapshot asli dengan menaruh map di semua opsi.
    item.options = item.options.map((entry) => ({ ...entry, dimensionMap }));
    return answer(item, { value });
  }

  it('menghitung profil dimensi dan kesesuaian target', () => {
    const answers = [
      likert(5, { KEPEMIMPINAN: 1 }),
      likert(1, { KEPEMIMPINAN: 1 }),
      likert(5, { KERJASAMA: 1 }),
      likert(5, { KERJASAMA: 1 }),
    ];

    const result = service.score({
      strategy: 'DIMENSION_PROFILE',
      config: { targetProfile: { KEPEMIMPINAN: 100, KERJASAMA: 100 } },
      questionCount: 4,
      durationMinutes: 10,
      answers,
    });

    expect(result.metrics.dimensionProfile).toEqual({
      KEPEMIMPINAN: 50,
      KERJASAMA: 100,
    });
    // Jarak 50/100 pada satu dari dua dimensi -> skor 75.
    expect(result.rawScore).toBe(75);
    expect(result.maxScore).toBe(100);
  });

  it('membalik item reverse sebelum menghitung dimensi', () => {
    const result = service.score({
      strategy: 'DIMENSION_PROFILE',
      config: null,
      questionCount: 1,
      durationMinutes: 5,
      answers: [likert(1, { STABILITAS: 1 }, true)],
    });

    expect(result.metrics.dimensionProfile).toEqual({ STABILITAS: 100 });
  });
});

describe('CONSISTENCY_INDEX', () => {
  function paired(value: number, pairGroup: string): ScoringAnswer {
    const item = snapshot({
      type: 'LIKERT_STATEMENT',
      scale: 5,
      pairGroup,
      options: [1, 2, 3, 4, 5].map((scaleValue) =>
        option({ label: String(scaleValue), scoreValue: scaleValue }),
      ),
    });
    return answer(item, { value });
  }

  it('100 untuk pasangan yang identik', () => {
    const result = service.score({
      strategy: 'CONSISTENCY_INDEX',
      config: { threshold: 70 },
      questionCount: 2,
      durationMinutes: 5,
      answers: [paired(4, 'P1'), paired(4, 'P1')],
    });

    expect(result.rawScore).toBe(100);
    expect(result.metrics.consistencyIndex).toBe(100);
    expect(result.metrics.consistencyFlagged).toBe(false);
  });

  it('memberi flag saat delta besar', () => {
    const result = service.score({
      strategy: 'CONSISTENCY_INDEX',
      config: { threshold: 70 },
      questionCount: 2,
      durationMinutes: 5,
      answers: [paired(1, 'P1'), paired(5, 'P1')],
    });

    // delta=4, pairCount=1 -> 100 * (1 - 4/4) = 0
    expect(result.rawScore).toBe(0);
    expect(result.metrics.consistencyFlagged).toBe(true);
  });
});

describe('CORRECT_MINUS_PENALTY', () => {
  function missing(answerChar: string): QuestionSnapshot {
    return snapshot({
      type: 'MISSING_ELEMENT',
      missingElement: { left: '1234', right: '124', answer: answerChar },
      options: [answerChar, 'X', 'Y'].map((label) =>
        option({
          label,
          isCorrect: label === answerChar,
          scoreValue: label === answerChar ? 1 : 0,
        }),
      ),
    });
  }

  it('correct - penalty * wrong dengan clamp 0', () => {
    const item = missing('3');
    const result = service.score({
      strategy: 'CORRECT_MINUS_PENALTY',
      config: { penalty: 1 },
      questionCount: 4,
      durationMinutes: 10,
      answers: [
        answer(item, { text: '3' }),
        answer(item, { text: 'X' }),
        answer(item, { text: 'Y' }),
        answer(item, null),
      ],
    });

    expect(result.correct).toBe(1);
    expect(result.wrong).toBe(2);
    expect(result.blank).toBe(1);
    expect(result.rawScore).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it('menerima jawaban opsi maupun teks', () => {
    const item = missing('7');
    const result = service.score({
      strategy: 'CORRECT_MINUS_PENALTY',
      config: { penalty: 1 },
      questionCount: 2,
      durationMinutes: 10,
      answers: [answer(item, { text: '7' }), answer(item, payload([optionIdOf(item, '7')]))],
    });

    expect(result.correct).toBe(2);
    expect(result.rawScore).toBe(2);
    expect(result.percentage).toBe(100);
  });
});

describe('PASS_HAND_METRIC', () => {
  function column(numbers: number[], timeSpentMs: number): ScoringAnswer {
    const item = snapshot({
      type: 'PASS_HAND_COLUMN',
      columnNumbers: numbers,
      columnIndex: 0,
    });
    return answer(
      item,
      {
        values: numbers.map((_, index) =>
          String((numbers[index * 2]! + numbers[index * 2 + 1]!) % 10),
        ),
      },
      timeSpentMs,
    );
  }

  it('menggabungkan akurasi, throughput, dan stabilitas', () => {
    const result = service.score({
      strategy: 'PASS_HAND_METRIC',
      config: { w1: 0.5, w2: 0.25, w3: 0.25, maxPairsPerMinute: 4 },
      questionCount: 2,
      durationMinutes: 1,
      answers: [column([1, 2, 3, 4], 20_000), column([5, 6, 7, 8], 20_000)],
    });

    expect(result.correct).toBe(4);
    expect(result.metrics.accuracy).toBe(1);
    expect(result.metrics.throughput).toBe(4);
    expect(result.metrics.stability).toBe(100);
    expect(result.metrics.columnSeries).toEqual([20_000, 20_000]);
    expect(result.percentage).toBe(100);
  });

  it('stability menurun saat waktu kolom tidak seragam', () => {
    const result = service.score({
      strategy: 'PASS_HAND_METRIC',
      config: { w1: 0, w2: 0, w3: 1 },
      questionCount: 2,
      durationMinutes: 1,
      answers: [column([1, 2], 10_000), column([3, 4], 30_000)],
    });

    expect(result.metrics.stability).toBe(50);
  });
});

describe('MANUAL_REVIEW', () => {
  it('selalu menandai review dan memberi skor 0', () => {
    const result = service.score({
      strategy: 'MANUAL_REVIEW',
      config: null,
      questionCount: 3,
      durationMinutes: 30,
      answers: [answer(choiceSnapshot('A'), payload(['x']))],
    });

    expect(result.rawScore).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.metrics.reviewFlagged).toBe(true);
  });
});

/* ------------------------------------------------------------------ agregasi */

describe('agregasi', () => {
  it('normalisasi bobot stage dan total', () => {
    expect(
      stagePercentage([
        { percentage: 80, weight: 40 },
        { percentage: 60, weight: 20 },
        { percentage: 100, weight: 20 },
        { percentage: 40, weight: 20 },
      ]),
    ).toBe(72);

    expect(
      totalPercentage([
        { percentage: 72, weight: 50 },
        { percentage: 90, weight: 30 },
        { percentage: 60, weight: 20 },
      ]),
    ).toBe(75);
  });

  it('mengembalikan 0 bila bobot nol', () => {
    expect(stagePercentage([{ percentage: 90, weight: 0 }])).toBe(0);
    expect(totalPercentage([])).toBe(0);
  });

  it('aturan lulus menghormati eliminasi dan ambang stage', () => {
    expect(
      hasPassed({
        eliminated: false,
        totalScore: 75,
        totalPassingScore: 60,
        stagePassed: [true, true],
        requireStagePass: true,
      }),
    ).toBe(true);

    expect(
      hasPassed({
        eliminated: false,
        totalScore: 75,
        totalPassingScore: 60,
        stagePassed: [true, false],
        requireStagePass: true,
      }),
    ).toBe(false);

    expect(
      hasPassed({
        eliminated: true,
        totalScore: 100,
        totalPassingScore: 60,
        stagePassed: [true],
        requireStagePass: false,
      }),
    ).toBe(false);
  });

  it('pembulatan 2 desimal ROUND_HALF_UP', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.675)).toBe(2.68);
    expect(percentageOf(1, 3)).toBe(33.33);
    expect(toPercentage(2, 3)).toBe(66.67);
    expect(toPercentage(5, 0)).toBe(0);
  });
});
