import { Injectable } from '@nestjs/common';
import type {
  DifficultyMix,
  PoolQuestion,
  PoolStatus,
  QuestionPoolPort,
} from '@webcat/contracts';

/**
 * Pool dev: menganggap bank soal selalu cukup dan menghasilkan soal sintetis
 * agar alur sesi ujian dapat diuji tanpa seed soal.
 *
 * Produksi memakai `PrismaQuestionPool` saat `QUESTION_POOL=db`.
 */
@Injectable()
export class MockQuestionPool implements QuestionPoolPort {
  async validate(_subtestCode: string, count: number): Promise<PoolStatus> {
    return {
      ready: true,
      available: count,
      required: count,
      missingSubtestCodes: [],
    };
  }

  async sample(
    subtestCode: string,
    count: number,
    mix?: DifficultyMix,
  ): Promise<PoolQuestion[]> {
    void mix;

    return Array.from({ length: count }, (_, index) => ({
      id: `mock-${subtestCode}-${index + 1}`,
      publicCode: `MOCK-${subtestCode}-${String(index + 1).padStart(4, '0')}`,
      stageCode: stageOf(subtestCode),
      subtestCode,
      type: 'SINGLE_CHOICE',
      stemText: `Soal contoh ${index + 1} untuk subtes ${subtestCode}. Pilih jawaban yang benar.`,
      stemFormat: 'MARKDOWN',
      explanation: null,
      scoringStrategy: 'KEYED_CORRECT',
      scoringConfig: null,
      weight: 1,
      pairGroup: null,
      columnIndex: null,
      options: ['A', 'B', 'C', 'D', 'E'].map((label, optionIndex) => ({
        id: `mock-${subtestCode}-${index + 1}-${label}`,
        label,
        contentText: `Opsi ${label}`,
        isCorrect: optionIndex === 0,
        scoreValue: 0,
        dimensionMap: null,
        sortOrder: optionIndex,
      })),
      media: [],
    }));
  }
}

function stageOf(subtestCode: string): string {
  if (subtestCode === 'TPA') return 'TPA';
  if (subtestCode === 'TPK') return 'TPK';
  return 'PSIKOLOGI';
}
