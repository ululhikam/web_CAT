import { describe, expect, it } from 'vitest';
import type { PrismaService } from '../src/core/prisma/prisma.service';
import {
  applyFixtureMedia,
  ExamQuestionSource,
  type FixtureMediaSpec,
  spreadSelection,
} from '../src/modules/exams/exam-question-source';
import { parseQuestionSnapshot } from '../src/modules/exams/exam-snapshot';
import type { SnapshotMedia } from '../src/modules/scoring/scoring.types';

/**
 * F3-03 & F3-07 — media bergambar pada snapshot.
 *
 * Dua hal yang dijaga:
 *   1. Snapshot LAMA (tanpa `options[].media`, tanpa `assetId`) tetap ter-parse
 *      dan menghasilkan `media: []` — bukan `undefined`, bukan throw.
 *   2. Materialisasi dari bank soal memindahkan `question_media` ber-`role`
 *      `OPTION` ke opsi yang tepat, dan menyimpan `assetId` agar proyeksi bisa
 *      memakai `/media/:id/content` (bukan signed URL yang 404).
 */

const stemMedia: SnapshotMedia = {
  role: 'STEM',
  assetId: 'asset-stem',
  path: 'fig/stem.webp',
  alt: 'Pola',
};

function optionMedia(optionId: string, assetId: string): SnapshotMedia {
  return {
    role: 'OPTION',
    assetId,
    optionId,
    path: `fig/${assetId}.webp`,
    alt: `Opsi ${assetId}`,
  };
}

/* ------------------------------------------------------------ F3-03: parser */

describe('parseQuestionSnapshot — toleransi snapshot lama (F3-03)', () => {
  it('snapshot lama tanpa media opsi menghasilkan media: []', () => {
    const legacy = {
      sourceId: 'DEV-OLD-0001',
      type: 'SINGLE_CHOICE',
      stem: 'Soal lama',
      options: [
        { id: 'o1', label: 'A', text: '1', isCorrect: true, scoreValue: 1 },
        { id: 'o2', label: 'B', text: '2', isCorrect: false, scoreValue: 0 },
      ],
      media: [{ role: 'STEM', path: 'fig/lama.webp', alt: 'Lama' }],
    };

    const parsed = parseQuestionSnapshot(legacy);

    expect(parsed.options).toHaveLength(2);
    expect(parsed.options[0]?.media).toEqual([]);
    expect(parsed.options[1]?.media).toEqual([]);
    // Snapshot lama hanya punya `path` → `assetId` tidak diisi.
    expect(parsed.media[0]?.assetId).toBeUndefined();
    expect(parsed.media[0]?.path).toBe('fig/lama.webp');
  });

  it('snapshot baru membaca assetId, optionId, dan media per opsi', () => {
    const modern = {
      sourceId: 'PSI-KEC-FIG-001',
      type: 'IMAGE_CHOICE',
      stem: 'Pilih gambar yang melanjutkan pola.',
      options: [
        {
          id: 'o1',
          label: 'A',
          text: null,
          isCorrect: false,
          scoreValue: 0,
          media: [{ role: 'OPTION', assetId: 'asset-a', optionId: 'o1', path: 'fig/a.webp' }],
        },
        {
          id: 'o2',
          label: 'B',
          text: null,
          isCorrect: true,
          scoreValue: 1,
          media: [{ role: 'OPTION', assetId: 'asset-b', optionId: 'o2', path: 'fig/b.webp' }],
        },
      ],
      media: [{ role: 'STEM', assetId: 'asset-stem', path: 'fig/stem.webp', alt: 'Pola' }],
    };

    const parsed = parseQuestionSnapshot(modern);

    expect(parsed.type).toBe('IMAGE_CHOICE');
    expect(parsed.media[0]?.assetId).toBe('asset-stem');
    expect(parsed.options[0]?.media[0]).toMatchObject({
      role: 'OPTION',
      assetId: 'asset-a',
      optionId: 'o1',
    });
    expect(parsed.options[1]?.media[0]?.assetId).toBe('asset-b');
  });

  it('media tanpa path dibuang, media rusak tidak membuat parse gagal', () => {
    const rusak = {
      sourceId: 'X',
      options: [{ id: 'o1', label: 'A', media: [{ role: 'OPTION' }, null, 'bukan-objek'] }],
      media: [{ role: 'STEM' }, { role: 'STEM', path: 'ok.webp' }],
    };

    const parsed = parseQuestionSnapshot(rusak);

    expect(parsed.options[0]?.media).toEqual([]);
    expect(parsed.media).toHaveLength(1);
    expect(parsed.media[0]?.path).toBe('ok.webp');
  });
});

/* ------------------------------------------------- F3-07: materialisasi DB */

interface FakeDbOptions {
  questions: unknown[];
}

/**
 * Tiruan minimal `question.findMany` yang cukup untuk dua tahap seleksi:
 * tahap id (`select: { id: true }`) lalu tahap muat relasi (`where.id.in`).
 */
function fakeDb(options: FakeDbOptions, calls: unknown[] = []): PrismaService {
  return {
    question: {
      findMany: async (args: { select?: unknown; where?: { id?: { in?: string[] } } } = {}) => {
        calls.push(args);
        const all = options.questions as Array<{ id: string }>;
        const ids = args.where?.id?.in;
        const rows = ids ? all.filter((row) => ids.includes(row.id)) : all;
        if (args.select && !ids) return rows.map((row) => ({ id: row.id }));
        return rows;
      },
    },
  } as unknown as PrismaService;
}

const dbQuestion = {
  id: '11111111-1111-4111-8111-111111111111',
  publicCode: 'PSI-KEC-FIG-001',
  type: 'IMAGE_CHOICE',
  stemText: 'Pilih gambar yang melanjutkan pola.',
  stemFormat: 'MARKDOWN',
  difficulty: 'MEDIUM',
  weight: 1,
  pairGroup: null,
  columnIndex: null,
  scoringConfig: null,
  options: [
    {
      id: 'opt-a',
      label: 'A',
      contentText: null,
      isCorrect: false,
      scoreValue: 0,
      dimensionMap: null,
    },
    {
      id: 'opt-b',
      label: 'B',
      contentText: null,
      isCorrect: true,
      scoreValue: 1,
      dimensionMap: null,
    },
  ],
  media: [
    {
      role: 'STEM',
      optionId: null,
      altText: 'Pola',
      sortOrder: 0,
      mediaAsset: { id: 'asset-stem', storagePath: 'fig/stem.webp' },
    },
    {
      role: 'OPTION',
      optionId: 'opt-a',
      altText: 'Opsi A',
      sortOrder: 1,
      mediaAsset: { id: 'asset-a', storagePath: 'fig/a.webp' },
    },
    {
      role: 'OPTION',
      optionId: 'opt-b',
      altText: 'Opsi B',
      sortOrder: 2,
      mediaAsset: { id: 'asset-b', storagePath: 'fig/b.webp' },
    },
  ],
};

describe('ExamQuestionSource — media opsi (F3-07)', () => {
  it('media OPTION ditempel ke opsi yang tepat, STEM tetap di soal', async () => {
    const source = new ExamQuestionSource(fakeDb({ questions: [dbQuestion] }));

    const seeds = await source.prepare({
      subtestSessionId: 'sesi-1',
      subtestCode: 'KECERDASAN',
      count: 1,
    });

    expect(seeds).toHaveLength(1);
    const snapshot = seeds[0]!.snapshot;

    expect(snapshot.type).toBe('IMAGE_CHOICE');
    expect(snapshot.media).toHaveLength(1);
    expect(snapshot.media[0]).toMatchObject({
      role: 'STEM',
      assetId: 'asset-stem',
      path: 'fig/stem.webp',
      alt: 'Pola',
    });

    const byLabel = new Map(snapshot.options.map((option) => [option.label, option]));
    expect(byLabel.get('A')?.media).toHaveLength(1);
    expect(byLabel.get('A')?.media[0]).toMatchObject({
      role: 'OPTION',
      assetId: 'asset-a',
      optionId: 'opt-a',
    });
    expect(byLabel.get('B')?.media[0]?.assetId).toBe('asset-b');
  });

  it('media OPTION tanpa optionId tidak hilang (masuk media soal)', async () => {
    const tanpaOpsi = {
      ...dbQuestion,
      media: [
        ...dbQuestion.media,
        {
          role: 'OPTION',
          optionId: null,
          altText: 'Yatim',
          sortOrder: 9,
          mediaAsset: { id: 'asset-yatim', storagePath: 'fig/yatim.webp' },
        },
      ],
    };

    const source = new ExamQuestionSource(fakeDb({ questions: [tanpaOpsi] }));
    const seeds = await source.prepare({
      subtestSessionId: 'sesi-2',
      subtestCode: 'KECERDASAN',
      count: 1,
    });

    const snapshot = seeds[0]!.snapshot;
    expect(snapshot.media.map((entry) => entry.assetId)).toContain('asset-yatim');
  });

  it('bank soal kosong → fixture dipakai, tanpa media', async () => {
    const source = new ExamQuestionSource(fakeDb({ questions: [] }));

    const seeds = await source.prepare({
      subtestSessionId: 'sesi-3',
      subtestCode: 'KECERDASAN',
      count: 5,
    });

    expect(seeds).toHaveLength(5);
    for (const seed of seeds) {
      expect(seed.snapshot.media).toEqual([]);
      expect(seed.snapshot.options.every((option) => option.media.length === 0)).toBe(true);
    }
  });
});

/* --------------------------------------------- F3-06: fixture bergambar */

describe('applyFixtureMedia (F3-06)', () => {
  it('media opsi memaksa tipe IMAGE_CHOICE dan menempel per opsi', () => {
    const spec: FixtureMediaSpec = {
      stem: [stemMedia],
      options: {
        0: [optionMedia('o1', 'asset-a')],
        1: [optionMedia('o2', 'asset-b')],
      },
    };

    const base = parseQuestionSnapshot({
      sourceId: 'DEV-KECERDASAN-0001',
      type: 'SINGLE_CHOICE',
      stem: 'Pilih gambar',
      options: [
        { id: 'o1', label: 'A', text: '1', isCorrect: false, scoreValue: 0 },
        { id: 'o2', label: 'B', text: '2', isCorrect: true, scoreValue: 1 },
      ],
      media: [],
    });

    const withMedia = applyFixtureMedia(base, spec);

    expect(withMedia.type).toBe('IMAGE_CHOICE');
    expect(withMedia.media).toHaveLength(1);
    expect(withMedia.options[0]?.media[0]?.assetId).toBe('asset-a');
    expect(withMedia.options[1]?.media[0]?.assetId).toBe('asset-b');
  });

  it('media stem saja tidak mengubah tipe soal', () => {
    const base = parseQuestionSnapshot({
      sourceId: 'X',
      type: 'SINGLE_CHOICE',
      stem: 'Soal',
      options: [{ id: 'o1', label: 'A', text: '1' }],
      media: [],
    });

    const withMedia = applyFixtureMedia(base, { stem: [stemMedia] });

    expect(withMedia.type).toBe('SINGLE_CHOICE');
    expect(withMedia.media).toHaveLength(1);
    expect(withMedia.options[0]?.media).toEqual([]);
  });
});

/* ---------------------------------------- seleksi pool: penyebaran merata */

describe('spreadSelection — irisan pool yang merata', () => {
  const rows = Array.from({ length: 10 }, (_, index) => index);

  it('pool lebih kecil/sama dengan kuota → semuanya dipakai', () => {
    expect(spreadSelection(rows, 10)).toEqual(rows);
    expect(spreadSelection(rows, 25)).toEqual(rows);
  });

  it('kuota 0 atau pool kosong → tidak ada soal', () => {
    expect(spreadSelection(rows, 0)).toEqual([]);
    expect(spreadSelection([], 5)).toEqual([]);
  });

  it('mengambil tepat `count` baris unik dan deterministik', () => {
    const picked = spreadSelection(rows, 4, 0);

    expect(picked).toHaveLength(4);
    expect(new Set(picked).size).toBe(4);
    expect(spreadSelection(rows, 4, 0)).toEqual(picked);
  });

  it('offset menggeser irisan sehingga sesi berbeda dapat soal berbeda', () => {
    const first = spreadSelection(rows, 3, 0);
    const shifted = spreadSelection(rows, 3, 4);

    expect(shifted).toHaveLength(3);
    expect(shifted).not.toEqual(first);
  });
});

describe('ExamQuestionSource — soal di ujung pool tetap terpilih', () => {
  /** Pool 200 soal; 56 terakhir adalah figural (`PSI-*-FIG-*`). */
  const pool = Array.from({ length: 200 }, (_, index) => {
    const figural = index >= 144;
    return {
      ...dbQuestion,
      id: `id-${String(index).padStart(3, '0')}`,
      publicCode: figural
        ? `PSI-KEC-FIG-${String(index - 143).padStart(3, '0')}`
        : `PSI-KEC-${String(index + 1).padStart(3, '0')}`,
    };
  });

  it('kuota 100 dari pool 200 memuat soal figural (regresi `take: count`)', async () => {
    const source = new ExamQuestionSource(fakeDb({ questions: pool }));

    const seeds = await source.prepare({
      subtestSessionId: 'sesi-pool',
      subtestCode: 'KECERDASAN',
      count: 100,
    });

    expect(seeds).toHaveLength(100);
    const externalIds = seeds.map((seed) => seed.externalId);
    expect(externalIds.some((code) => code.includes('-FIG-'))).toBe(true);
    // Bukan blok awal pool saja.
    expect(externalIds).not.toEqual(pool.slice(0, 100).map((row) => row.publicCode));
  });

  it('materialisasi ulang sesi yang sama menghasilkan urutan identik', async () => {
    const source = new ExamQuestionSource(fakeDb({ questions: pool }));
    const input = { subtestSessionId: 'sesi-pool', subtestCode: 'KECERDASAN' as const, count: 100 };

    const first = await source.prepare(input);
    const second = await source.prepare(input);

    expect(second.map((seed) => seed.externalId)).toEqual(first.map((seed) => seed.externalId));
  });
});
