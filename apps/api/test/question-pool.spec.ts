import { describe, expect, it, vi } from 'vitest';
import { MockQuestionPool } from '../src/core/ports/impl/mock-question-pool';
import { PrismaQuestionPool } from '../src/core/ports/impl/prisma-question-pool';
import type { PrismaService } from '../src/core/prisma/prisma.service';

describe('MockQuestionPool', () => {
  const pool = new MockQuestionPool();

  it('selalu menyatakan pool siap sejumlah yang diminta', async () => {
    const status = await pool.validate('KECERDASAN', 100);

    expect(status).toEqual({
      ready: true,
      available: 100,
      required: 100,
      missingSubtestCodes: [],
      problems: [],
    });
  });

  it('menghasilkan soal sintetis sesuai jumlah yang diminta', async () => {
    const rows = await pool.sample('KECERDASAN', 3);

    expect(rows).toHaveLength(3);
    expect(rows[0]?.publicCode).toBe('MOCK-KECERDASAN-0001');
    expect(rows.every((row) => row.options.length === 5)).toBe(true);
  });

  it('menandai tepat satu opsi benar per soal', async () => {
    const rows = await pool.sample('TKK', 2);

    for (const row of rows) {
      expect(row.options.filter((option) => option.isCorrect)).toHaveLength(1);
      expect(row.stageCode).toBe('TKK');
    }
  });

  it('memetakan stage dari kode subtes', async () => {
    const [psikologi] = await pool.sample('PASS_HAND', 1);
    const [tpk] = await pool.sample('TPK', 1);

    expect(psikologi?.stageCode).toBe('PSIKOLOGI');
    expect(tpk?.stageCode).toBe('TPK');
  });

  it('tidak membocorkan kunci lewat field penjelasan', async () => {
    const [row] = await pool.sample('KECERDASAN', 1);

    expect(row?.explanation).toBeNull();
  });
});

describe('PrismaQuestionPool', () => {
  it('hanya menghitung dan mengambil soal PUBLISHED yang belum dihapus', async () => {
    const countMock = vi.fn().mockResolvedValue(10);
    const findManyMock = vi.fn().mockResolvedValue([
      {
        id: 'q-1',
        publicCode: 'Q-001',
        stageCode: 'PSIKOLOGI',
        subtestCode: 'KECERDASAN',
        type: 'SINGLE_CHOICE',
        difficulty: 'EASY',
        stemText: 'Stem soal 1',
        stemFormat: 'MARKDOWN',
        explanation: 'Penjelasan',
        scoringStrategy: 'KEYED_CORRECT',
        scoringConfig: null,
        weight: '1',
        pairGroup: null,
        columnIndex: null,
        options: [
          {
            id: 'opt-1',
            label: 'A',
            contentText: 'Opsi A',
            isCorrect: true,
            scoreValue: '1',
            dimensionMap: null,
            sortOrder: 0,
          },
        ],
        media: [],
      },
    ]);

    const fakePrisma = {
      question: {
        count: countMock,
        findMany: findManyMock,
      },
    } as unknown as PrismaService;

    const prismaPool = new PrismaQuestionPool(fakePrisma);

    const status = await prismaPool.validate('KECERDASAN', 10);
    expect(status.ready).toBe(true);
    expect(status.available).toBe(10);
    expect(countMock).toHaveBeenCalledWith({
      where: {
        subtestCode: 'KECERDASAN',
        status: 'PUBLISHED',
        deletedAt: null,
      },
    });

    const samples = await prismaPool.sample('KECERDASAN', 1);
    expect(samples).toHaveLength(1);
    expect(samples[0]?.publicCode).toBe('Q-001');
    expect(samples[0]?.weight).toBe(1);
    expect(samples[0]?.options[0]?.isCorrect).toBe(true);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          subtestCode: 'KECERDASAN',
          status: 'PUBLISHED',
          deletedAt: null,
        },
      }),
    );
  });

  it('melaporkan missingSubtestCodes saat soal kurang dari kebutuhan', async () => {
    const fakePrisma = {
      question: {
        count: vi.fn().mockResolvedValue(40),
      },
    } as unknown as PrismaService;

    const prismaPool = new PrismaQuestionPool(fakePrisma);
    const status = await prismaPool.validate('KECERDASAN', 100);

    expect(status.ready).toBe(false);
    expect(status.available).toBe(40);
    expect(status.required).toBe(100);
    expect(status.missingSubtestCodes).toEqual(['KECERDASAN']);
  });

  /* ------------------------------------------------------------- F4-09 */

  it('F4-09: status siap tidak membawa problems', async () => {
    const fakePrisma = {
      question: { count: vi.fn().mockResolvedValue(500) },
    } as unknown as PrismaService;

    const status = await new PrismaQuestionPool(fakePrisma).validate('KECERMATAN', 500);

    expect(status.ready).toBe(true);
    expect(status.problems).toEqual([]);
  });

  it('F4-09: kekurangan membawa subtes, angka, dan pesan yang bisa dibaca', async () => {
    const fakePrisma = {
      question: { count: vi.fn().mockResolvedValue(412) },
    } as unknown as PrismaService;

    const status = await new PrismaQuestionPool(fakePrisma).validate('KECERMATAN', 500);

    expect(status.problems).toEqual([
      {
        subtestCode: 'KECERMATAN',
        required: 500,
        available: 412,
        missing: 88,
        message: 'Subtes Kecermatan: tersedia 412 soal, dibutuhkan 500 (kurang 88 soal).',
      },
    ]);
    // `missingSubtestCodes` tetap sinkron untuk konsumen lama.
    expect(status.missingSubtestCodes).toEqual(status.problems.map((entry) => entry.subtestCode));
  });

  it('F4-09: kode subtes tak dikenal tetap ditampilkan apa adanya', async () => {
    const fakePrisma = {
      question: { count: vi.fn().mockResolvedValue(0) },
    } as unknown as PrismaService;

    const status = await new PrismaQuestionPool(fakePrisma).validate('SUBTES_BARU', 10);

    expect(status.problems[0]?.message).toContain('SUBTES_BARU');
    expect(status.problems[0]?.missing).toBe(10);
  });
});
