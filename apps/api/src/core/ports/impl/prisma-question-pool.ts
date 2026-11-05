import { Injectable } from '@nestjs/common';
import type {
  DifficultyMix,
  PoolQuestion,
  PoolStatus,
  QuestionPoolPort,
} from '@webcat/contracts';
import { SUBTEST_LABELS, type SubtestCode } from '@webcat/contracts';
import { PrismaService } from '../../prisma/prisma.service';

/** Label subtes untuk pesan; kode tak dikenal tetap ditampilkan apa adanya. */
function subtestLabel(code: string): string {
  return SUBTEST_LABELS[code as SubtestCode] ?? code;
}

/**
 * Implementasi nyata `QuestionPoolPort` (gate G2).
 *
 * Hanya soal PUBLISHED yang boleh masuk sesi ujian. Sampling dilakukan di
 * database dengan `random()` agar tidak ada duplikat dan urutan stabil setelah
 * materialisasi (B3 menyimpan hasil sampling ke exam_session_questions).
 */
@Injectable()
export class PrismaQuestionPool implements QuestionPoolPort {
  constructor(private readonly prisma: PrismaService) {}

  async validate(subtestCode: string, count: number): Promise<PoolStatus> {
    const available = await this.prisma.question.count({
      where: {
        subtestCode: subtestCode as never,
        status: 'PUBLISHED',
        deletedAt: null,
      },
    });

    const ready = available >= count;
    const missing = ready ? 0 : count - available;

    return {
      ready,
      available,
      required: count,
      missingSubtestCodes: ready ? [] : [subtestCode],
      // F4-09: satu-satunya tempat pesan kekurangan dirumuskan, supaya
      // `/exams/eligibility` dan `startSession` memakai kalimat yang sama.
      problems: ready
        ? []
        : [
            {
              subtestCode,
              required: count,
              available,
              missing,
              message: `Subtes ${subtestLabel(subtestCode)}: tersedia ${available} soal, dibutuhkan ${count} (kurang ${missing} soal).`,
            },
          ],
    };
  }

  async sample(
    subtestCode: string,
    count: number,
    mix?: DifficultyMix,
  ): Promise<PoolQuestion[]> {
    const rows = await this.prisma.question.findMany({
      where: {
        subtestCode: subtestCode as never,
        status: 'PUBLISHED',
        deletedAt: null,
      },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
        media: { include: { mediaAsset: true, option: true } },
      },
    });

    const pool = mix ? this.applyMix(rows, count, mix) : rows;
    const selected = pool.length > count ? shuffle(pool).slice(0, count) : shuffle(pool);

    return selected.map((row) => ({
      id: row.id,
      publicCode: row.publicCode,
      stageCode: row.stageCode,
      subtestCode: row.subtestCode,
      type: row.type,
      stemText: row.stemText,
      stemFormat: row.stemFormat,
      explanation: row.explanation,
      scoringStrategy: row.scoringStrategy,
      scoringConfig: (row.scoringConfig ?? null) as Record<string, unknown> | null,
      weight: Number(row.weight),
      pairGroup: row.pairGroup,
      columnIndex: row.columnIndex,
      options: row.options.map((option) => ({
        id: option.id,
        label: option.label,
        contentText: option.contentText,
        isCorrect: option.isCorrect,
        scoreValue: Number(option.scoreValue),
        dimensionMap: (option.dimensionMap ?? null) as Record<string, number> | null,
        sortOrder: option.sortOrder,
      })),
      media: row.media.map((media) => ({
        id: media.id,
        storagePath: media.mediaAsset.storagePath,
        mime: media.mediaAsset.mime,
        role: media.role,
        optionLabel: media.option?.label ?? null,
        altText: media.altText,
        sortOrder: media.sortOrder,
      })),
    }));
  }

  private applyMix<T extends { difficulty: string }>(
    rows: T[],
    count: number,
    mix: DifficultyMix,
  ): T[] {
    const weights = Object.entries(mix).filter(([, value]) => Number(value) > 0);
    if (weights.length === 0) return rows;

    const total = weights.reduce((sum, [, value]) => sum + Number(value), 0);
    const picked: T[] = [];

    for (const [difficulty, weight] of weights) {
      const quota = Math.max(1, Math.round((Number(weight) / total) * count));
      const bucket = shuffle(rows.filter((row) => row.difficulty === difficulty)).slice(0, quota);
      picked.push(...bucket);
    }

    if (picked.length < count) {
      const used = new Set(picked);
      const rest = shuffle(rows.filter((row) => !used.has(row)));
      picked.push(...rest.slice(0, count - picked.length));
    }

    return picked.slice(0, count);
  }
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swap] as T;
    copy[swap] = current as T;
  }
  return copy;
}
