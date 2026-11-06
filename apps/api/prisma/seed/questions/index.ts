import { createHash } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import { computeDedupeHash } from '../../../src/modules/questions/dedupe';
import { buildChoices, buildMultiChoices } from './builder';
import {
  countDistractors,
  directionDistractors,
  FIGURAL_KECERDASAN,
  FIGURAL_TKK,
  figuralTextAnswer,
  figureAssetCode,
  layoutFor,
  type FiguralSeed,
} from './figural';
import { figureAltText, STEM_VARIANT, type FigureSpec } from '../media/figural';
import { buildOptions, createRng, OPTION_LABELS } from './rng';
import { KECERDASAN_QUESTIONS, MULTI_KECERDASAN } from './kecerdasan';
import { KECERMATAN_QUESTIONS } from './kecermatan';
import { KEPRIBADIAN_QUESTIONS } from './kepribadian';
import { PASS_HAND_QUESTIONS } from './pass-hand';
import { TKK_MULTI_CHOICE, TKK_QUESTIONS } from './tkk';
import { TPK_QUESTIONS } from './tpk';
import type { SeedDifficulty, SeedQuestionMedia } from './types';

/**
 * Seed bank soal realistis (bukan fixture).
 *
 * Cakupan:
 *   PSIKOLOGI — Kecerdasan 100 + 3 multi-jawaban + 44 figural,
 *               Kepribadian 140, Kecermatan 500, Pass Hand 150
 *   TKK       — 87 pilihan tunggal + 3 multi-jawaban + 15 figural
 *               (perangkat keras 20, perangkat lunak 18, jaringan 18,
 *                keamanan 17, penalaran 14)
 *   TPK       — 100 soal (10 kelompok materi × 10)
 *
 * Semua soal berstatus PUBLISHED. `exam-question-source.ts` baru memakai bank
 * soal database bila jumlah PUBLISHED per subtes ≥ `questionCount` subtes,
 * sehingga kuota setiap subtes harus terpenuhi penuh.
 *
 * Idempotent: soal dikenali lewat `publicCode` unik (id deterministik dari
 * kode), opsi & tag ditulis ulang agar perubahan data ikut tersinkron.
 */

/* ---------------------------------------------------------------- kategori */

interface CategorySeed {
  path: string;
  name: string;
  parentPath?: string;
  sortOrder: number;
}

export const QUESTION_CATEGORIES: readonly CategorySeed[] = [
  { path: 'psikologi', name: 'Psikologi', sortOrder: 1 },
  { path: 'psikologi/kecerdasan', name: 'Kecerdasan & Kepribadian', parentPath: 'psikologi', sortOrder: 1 },
  {
    path: 'psikologi/kecerdasan/verbal',
    name: 'Verbal',
    parentPath: 'psikologi/kecerdasan',
    sortOrder: 1,
  },
  {
    path: 'psikologi/kecerdasan/numerik',
    name: 'Numerik',
    parentPath: 'psikologi/kecerdasan',
    sortOrder: 2,
  },
  {
    path: 'psikologi/kecerdasan/figural',
    name: 'Figural',
    parentPath: 'psikologi/kecerdasan',
    sortOrder: 3,
  },
  {
    path: 'psikologi/kecerdasan/petadenah',
    name: 'Peta & Denah',
    parentPath: 'psikologi/kecerdasan',
    sortOrder: 4,
  },
  {
    path: 'psikologi/kecerdasan/kepribadian',
    name: 'Kepribadian & Sikap Kerja',
    parentPath: 'psikologi/kecerdasan',
    sortOrder: 5,
  },
  {
    path: 'psikologi/kecerdasan/logis',
    name: 'Logika',
    parentPath: 'psikologi/kecerdasan',
    sortOrder: 6,
  },
  { path: 'psikologi/kepribadian', name: 'Kepribadian', parentPath: 'psikologi', sortOrder: 2 },
  { path: 'psikologi/kecermatan', name: 'Kecermatan', parentPath: 'psikologi', sortOrder: 3 },
  {
    path: 'psikologi/kecermatan/huruf',
    name: 'Huruf',
    parentPath: 'psikologi/kecermatan',
    sortOrder: 1,
  },
  {
    path: 'psikologi/kecermatan/angka',
    name: 'Angka',
    parentPath: 'psikologi/kecermatan',
    sortOrder: 2,
  },
  {
    path: 'psikologi/kecermatan/simbol',
    name: 'Simbol',
    parentPath: 'psikologi/kecermatan',
    sortOrder: 3,
  },
  { path: 'psikologi/pass-hand', name: 'Pass Hand', parentPath: 'psikologi', sortOrder: 4 },
  { path: 'tpk', name: 'TPK', sortOrder: 3 },
  { path: 'tpk/pancasila', name: 'Pancasila & UUD 1945', parentPath: 'tpk', sortOrder: 1 },
  { path: 'tpk/uu-kepolisian', name: 'UU Kepolisian', parentPath: 'tpk', sortOrder: 2 },
  { path: 'tpk/wewenang', name: 'Wewenang Kepolisian', parentPath: 'tpk', sortOrder: 3 },
  { path: 'tpk/hukum-pidana', name: 'Hukum Pidana', parentPath: 'tpk', sortOrder: 4 },
  { path: 'tpk/kuhap', name: 'Hukum Acara Pidana', parentPath: 'tpk', sortOrder: 5 },
  { path: 'tpk/etika-ham', name: 'Etika, Disiplin & HAM', parentPath: 'tpk', sortOrder: 6 },
  { path: 'tpk/fungsi-teknis', name: 'Fungsi Teknis', parentPath: 'tpk', sortOrder: 7 },
  { path: 'tpk/manajemen', name: 'Manajemen & Kepemimpinan', parentPath: 'tpk', sortOrder: 8 },
  { path: 'tpk/situasi-tugas', name: 'Situasi Tugas', parentPath: 'tpk', sortOrder: 9 },
  { path: 'tpk/profesionalisme', name: 'Profesionalisme', parentPath: 'tpk', sortOrder: 10 },
  { path: 'tkk', name: 'TKK', sortOrder: 2 },
  {
    path: 'tkk/perangkat-keras',
    name: 'Perangkat Keras',
    parentPath: 'tkk',
    sortOrder: 1,
  },
  {
    path: 'tkk/perangkat-lunak',
    name: 'Perangkat Lunak',
    parentPath: 'tkk',
    sortOrder: 2,
  },
  { path: 'tkk/jaringan', name: 'Jaringan', parentPath: 'tkk', sortOrder: 3 },
  { path: 'tkk/keamanan', name: 'Keamanan', parentPath: 'tkk', sortOrder: 4 },
  { path: 'tkk/penalaran', name: 'Penalaran', parentPath: 'tkk', sortOrder: 5 },
  { path: 'tkk/figural', name: 'Figural', parentPath: 'tkk', sortOrder: 6 },
];

/* ------------------------------------------------------------------ payload */

type SeedStageCode = 'PSIKOLOGI' | 'TKK' | 'TPK';
type SeedSubtestCode = 'KECERDASAN' | 'KEPRIBADIAN' | 'KECERMATAN' | 'PASS_HAND' | 'TKK' | 'TPK';
type SeedQuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTI_CHOICE'
  | 'IMAGE_CHOICE'
  | 'LIKERT_STATEMENT'
  | 'MISSING_ELEMENT'
  | 'PASS_HAND_COLUMN';

interface SeedOption {
  label: string;
  /** `null` untuk opsi yang isinya hanya gambar (`IMAGE_CHOICE`). */
  contentText: string | null;
  isCorrect: boolean;
  scoreValue: number;
  dimensionMap: Record<string, number> | null;
}

export interface SeedQuestion {
  publicCode: string;
  stageCode: SeedStageCode;
  subtestCode: SeedSubtestCode;
  categoryPath: string;
  type: SeedQuestionType;
  difficulty: SeedDifficulty;
  stemText: string;
  explanation: string | null;
  scoringStrategy: string;
  scoringConfig: Record<string, unknown>;
  pairGroup: string | null;
  columnIndex: number | null;
  dedupeHash: string;
  /** `true` untuk soal bangkitan yang stem-nya identik dalam satu subtes. */
  dedupeOverride: boolean;
  options: SeedOption[];
  /** Media soal; `assetCode` diresolusi ke `media_assets.id` saat seed. */
  media: SeedQuestionMedia[];
  tags: string[];
}

const CHOICE_LABELS = ['A', 'B', 'C', 'D', 'E'] as const;

/** Skala Likert 1–5; `scoreValue` sama dengan nilai label. */
const LIKERT_SCALE: ReadonlyArray<{ label: string; contentText: string }> = [
  { label: '1', contentText: 'Sangat tidak setuju' },
  { label: '2', contentText: 'Tidak setuju' },
  { label: '3', contentText: 'Netral' },
  { label: '4', contentText: 'Setuju' },
  { label: '5', contentText: 'Sangat setuju' },
];

const PSIKOLOGI: SeedStageCode = 'PSIKOLOGI';

function choiceOptions(options: readonly string[], answerLabel: string): SeedOption[] {
  return options.map((contentText, index) => {
    const label = CHOICE_LABELS[index]!;
    const isCorrect = label === answerLabel;
    return {
      label,
      contentText,
      isCorrect,
      scoreValue: isCorrect ? 1 : 0,
      dimensionMap: null,
    };
  });
}

function hashOf(stem: string, options: readonly { contentText: string | null }[]): string {
  return computeDedupeHash(
    stem,
    options.map((option) => ({ contentText: option.contentText ?? '' })),
  );
}

/* --------------------------------------------------------------- psikologi */

function buildKecerdasan(): SeedQuestion[] {
  return KECERDASAN_QUESTIONS.map((row) => ({
    publicCode: row.code,
    stageCode: PSIKOLOGI,
    subtestCode: 'KECERDASAN',
    categoryPath: row.categoryPath,
    type: 'SINGLE_CHOICE',
    difficulty: row.difficulty,
    stemText: row.stem,
    explanation: row.explanation,
    scoringStrategy: 'KEYED_CORRECT',
    scoringConfig: {},
    pairGroup: null,
    columnIndex: null,
    dedupeHash: hashOf(
      row.stem,
      row.options.map((contentText) => ({ contentText })),
    ),
    dedupeOverride: false,
    options: choiceOptions(row.options, row.answer),
    media: [],
    tags: [...row.tags],
  }));
}

function buildKepribadian(): SeedQuestion[] {
  return KEPRIBADIAN_QUESTIONS.map((row, index) => {
    // Setiap item mengukur satu dimensi; arah item ditangani `isReverse`.
    const dimensionMap = { [row.dimension]: 1 };

    return {
      publicCode: `PSI-KEP-${String(index + 1).padStart(3, '0')}`,
      stageCode: PSIKOLOGI,
      subtestCode: 'KEPRIBADIAN',
      categoryPath: 'psikologi/kepribadian',
      type: 'LIKERT_STATEMENT',
      difficulty: row.difficulty ?? 'MEDIUM',
      stemText: row.statement,
      explanation: `Mengukur dimensi ${row.dimension} (item ${
        row.polarity === 'REVERSE' ? 'terbalik' : 'positif'
      }).`,
      scoringStrategy: 'DIMENSION_PROFILE',
      scoringConfig: {
        scale: 5,
        isReverse: row.polarity === 'REVERSE',
        dimensions: [row.dimension],
      },
      pairGroup: row.pairGroup ?? null,
      columnIndex: null,
      dedupeHash: hashOf(
        row.statement,
        LIKERT_SCALE.map((option) => ({ contentText: option.contentText })),
      ),
      dedupeOverride: false,
      options: LIKERT_SCALE.map((option) => ({
        label: option.label,
        contentText: option.contentText,
        isCorrect: false,
        scoreValue: Number(option.label),
        dimensionMap,
      })),
      media: [],
      tags: [...row.tags],
    };
  });
}

function buildKecermatan(): SeedQuestion[] {
  return KECERMATAN_QUESTIONS.map((row, index) => {
    // 5 huruf patokan kolom terpetakan langsung ke opsi A, B, C, D, E
    const leftChars = row.left.split('');
    const labels = ['A', 'B', 'C', 'D', 'E'];
    const options = leftChars.map((char, charIdx) => {
      const isCorrect = char === row.answer;
      return {
        label: labels[charIdx]!,
        contentText: char,
        isCorrect,
        scoreValue: isCorrect ? 1 : 0,
        dimensionMap: null,
      };
    });

    return {
      publicCode: row.code,
      stageCode: PSIKOLOGI,
      subtestCode: 'KECERMATAN',
      categoryPath: row.categoryPath,
      type: 'MISSING_ELEMENT',
      difficulty: row.difficulty,
      stemText: row.stem,
      explanation: `Karakter yang hilang adalah "${row.answer}".`,
      scoringStrategy: 'CORRECT_MINUS_PENALTY',
      scoringConfig: { missingElement: { left: row.left, right: row.right, answer: row.answer } },
      pairGroup: null,
      columnIndex: row.columnIndex ?? Math.floor(index / 50),
      dedupeHash: hashOf(
        row.stem,
        options.map((option) => ({ contentText: option.contentText })),
      ),
      // Stem sama untuk seluruh soal varian; keunikan dijaga oleh publicCode,
      // sehingga unique index dedupe sengaja dilewati.
      dedupeOverride: true,
      options,
      media: [],
      tags: [...row.tags],
    };
  });
}

function buildPassHand(): SeedQuestion[] {
  return PASS_HAND_QUESTIONS.map((row) => ({
    publicCode: row.code,
    stageCode: PSIKOLOGI,
    subtestCode: 'PASS_HAND',
    categoryPath: row.categoryPath,
    type: 'PASS_HAND_COLUMN',
    difficulty: row.difficulty,
    stemText: row.stem,
    explanation: null,
    scoringStrategy: 'PASS_HAND_METRIC',
    scoringConfig: { columnNumbers: [...row.numbers] },
    pairGroup: null,
    columnIndex: row.columnIndex,
    dedupeHash: hashOf(row.stem, []),
    // Tanpa opsi, seluruh kolom berbagi stem yang sama.
    dedupeOverride: true,
    options: [],
    media: [],
    tags: [...row.tags],
  }));
}

/* ---------------------------------------------------------------------- tpk */

function buildTpk(): SeedQuestion[] {
  return buildChoices('TPK', 'tpk', TPK_QUESTIONS).map((row) => ({
    publicCode: row.code,
    stageCode: 'TPK',
    subtestCode: 'TPK',
    categoryPath: row.categoryPath,
    type: 'SINGLE_CHOICE',
    difficulty: row.difficulty,
    stemText: row.stem,
    explanation: row.explanation,
    scoringStrategy: 'KEYED_CORRECT',
    scoringConfig: {},
    pairGroup: null,
    columnIndex: null,
    dedupeHash: hashOf(
      row.stem,
      row.options.map((contentText) => ({ contentText })),
    ),
    dedupeOverride: false,
    options: choiceOptions(row.options, row.answer),
    media: [],
    tags: [...row.tags],
  }));
}

/* --------------------------------------------------- multi choice (F4-05) */

/**
 * Soal `MULTI_CHOICE` Kecerdasan.
 *
 * Sengaja ditambahkan sebagai **soal ekstra** (bukan pengganti pilihan
 * tunggal): bank Kecerdasan sudah 144 soal untuk kuota 100, sehingga soal
 * banyak-jawaban tidak mengurangi pilihan pilihan tunggal pada sesi.
 */
function buildKecerdasanMulti(): SeedQuestion[] {
  return buildMultiChoices('PSI-KEC-M', 'psikologi/kecerdasan', MULTI_KECERDASAN).map((row) => ({
    publicCode: row.code,
    stageCode: PSIKOLOGI,
    subtestCode: 'KECERDASAN',
    categoryPath: row.categoryPath,
    type: 'MULTI_CHOICE',
    difficulty: row.difficulty,
    stemText: row.stem,
    explanation: row.explanation,
    scoringStrategy: 'MULTI_CORRECT_PARTIAL',
    scoringConfig: { wrongPenalty: 0.5 },
    pairGroup: null,
    columnIndex: null,
    dedupeHash: hashOf(
      row.stem,
      row.options.map((contentText) => ({ contentText })),
    ),
    dedupeOverride: false,
    options: row.options.map((contentText, index) => {
      const label = CHOICE_LABELS[index]!;
      const isCorrect = row.answers.includes(label);
      return {
        label,
        contentText,
        isCorrect,
        scoreValue: isCorrect ? 1 : 0,
        dimensionMap: null,
      };
    }),
    media: [],
    tags: [...row.tags],
  }));
}

/* ---------------------------------------------------------------------- tkk */

/**
 * Soal TKK tertulis (`SINGLE_CHOICE`).
 *
 * Subtes TKK dinilai `KEYED_CORRECT` di level subtes (lihat `exam.seed.ts`),
 * jadi skor dihitung per himpunan jawaban — tidak ada kredit parsial.
 */
function buildTkkChoices(): SeedQuestion[] {
  return buildChoices('TKK', 'tkk', TKK_QUESTIONS).map((row) => ({
    publicCode: row.code,
    stageCode: 'TKK',
    subtestCode: 'TKK',
    categoryPath: row.categoryPath,
    type: 'SINGLE_CHOICE',
    difficulty: row.difficulty,
    stemText: row.stem,
    explanation: row.explanation,
    scoringStrategy: 'KEYED_CORRECT',
    scoringConfig: {},
    pairGroup: null,
    columnIndex: null,
    dedupeHash: hashOf(
      row.stem,
      row.options.map((contentText) => ({ contentText })),
    ),
    dedupeOverride: false,
    options: choiceOptions(row.options, row.answer),
    media: [],
    tags: [...row.tags],
  }));
}

/**
 * Soal TKK banyak-jawaban (`MULTI_CHOICE`, F4-05).
 *
 * `scoringStrategy` per soal = `MULTI_CORRECT_PARTIAL` (metadata untuk admin);
 * penilaian sesungguhnya tetap memakai strategi subtes `KEYED_CORRECT`, yang
 * mensyaratkan himpunan terpilih sama persis dengan kunci.
 */
function buildTkkMultiChoices(): SeedQuestion[] {
  return buildMultiChoices('TKK-MC', 'tkk', TKK_MULTI_CHOICE).map((row) => ({
    publicCode: row.code,
    stageCode: 'TKK',
    subtestCode: 'TKK',
    categoryPath: row.categoryPath,
    type: 'MULTI_CHOICE',
    difficulty: row.difficulty,
    stemText: row.stem,
    explanation: row.explanation,
    scoringStrategy: 'MULTI_CORRECT_PARTIAL',
    scoringConfig: { wrongPenalty: 0.5 },
    pairGroup: null,
    columnIndex: null,
    dedupeHash: hashOf(
      row.stem,
      row.options.map((contentText) => ({ contentText })),
    ),
    dedupeOverride: false,
    options: row.options.map((contentText, index) => {
      const label = CHOICE_LABELS[index]!;
      const isCorrect = row.answers.includes(label);
      return {
        label,
        contentText,
        isCorrect,
        scoreValue: isCorrect ? 1 : 0,
        dimensionMap: null,
      };
    }),
    media: [],
    tags: [...row.tags],
  }));
}

/* ---------------------------------------------------------------- figural */

/** Media STEM untuk soal bergambar (satu gambar soal). */
function stemMedia(spec: FigureSpec): SeedQuestionMedia {
  return {
    role: 'STEM',
    assetCode: figureAssetCode(spec, STEM_VARIANT),
    altText: figureAltText(spec, STEM_VARIANT),
    sortOrder: 0,
  };
}

/**
 * Soal pilihan gambar (`IMAGE_CHOICE`).
 *
 * Opsi tidak punya teks (`contentText: null`) — isinya gambar. Susunan varian
 * gambar per label diacak deterministik oleh `layoutFor()` agar kunci tidak
 * selalu di label A, dan media OPTION memakai kode aset varian yang sesuai
 * dengan labelnya.
 */
function buildFiguralImage(
  row: FiguralSeed,
  stageCode: SeedStageCode,
  subtestCode: SeedSubtestCode,
): SeedQuestion {
  const spec: FigureSpec = { family: row.family, seed: row.seed };
  const { variantByLabel, correctIndex } = layoutFor(row);

  const options: SeedOption[] = OPTION_LABELS.slice(0, 4).map((label, index) => ({
    label,
    contentText: null,
    isCorrect: index === correctIndex,
    scoreValue: index === correctIndex ? 1 : 0,
    dimensionMap: null,
  }));

  const media: SeedQuestionMedia[] = [
    stemMedia(spec),
    ...variantByLabel.map((variant, index) => ({
      role: 'OPTION' as const,
      assetCode: figureAssetCode(spec, variant),
      optionLabel: OPTION_LABELS[index]!,
      altText: figureAltText(spec, variant),
      sortOrder: index,
    })),
  ];

  return {
    publicCode: row.code,
    stageCode,
    subtestCode,
    categoryPath:
      subtestCode === 'TKK' ? 'tkk/figural' : 'psikologi/kecerdasan/figural',
    type: 'IMAGE_CHOICE',
    difficulty: row.difficulty,
    stemText: row.stem,
    explanation: row.explanation,
    scoringStrategy: 'KEYED_CORRECT',
    scoringConfig: {},
    pairGroup: null,
    columnIndex: null,
    // Dedupe memakai kunci opsi, bukan teks (teks opsi kosong).
    dedupeHash: computeDedupeHash(
      row.stem,
      options.map((option) => ({ contentText: option.isCorrect ? 'BENAR' : 'SALAH' })),
    ),
    dedupeOverride: false,
    options,
    media,
    tags: [...row.tags],
  };
}

/** Soal pilihan teks yang stem-nya bergambar (hitung & arah kompas). */
function buildFiguralText(
  row: FiguralSeed,
  stageCode: SeedStageCode,
  subtestCode: SeedSubtestCode,
): SeedQuestion {
  const spec: FigureSpec = { family: row.family, seed: row.seed };
  const answer = figuralTextAnswer(row);

  const distractors =
    row.family === 'count'
      ? countDistractors(Number(answer))
      : directionDistractors(answer as Parameters<typeof directionDistractors>[0]);

  const built = buildOptions(createRng(`figural-text:${row.code}`), answer, distractors);

  return {
    publicCode: row.code,
    stageCode,
    subtestCode,
    categoryPath:
      subtestCode === 'TKK' ? 'tkk/figural' : 'psikologi/kecerdasan/figural',
    type: 'SINGLE_CHOICE',
    difficulty: row.difficulty,
    stemText: row.stem,
    explanation: row.explanation,
    scoringStrategy: 'KEYED_CORRECT',
    scoringConfig: {},
    pairGroup: null,
    columnIndex: null,
    dedupeHash: computeDedupeHash(
      row.stem,
      built.options.map((option) => ({ contentText: option.contentText })),
    ),
    dedupeOverride: false,
    options: built.options.map((option) => ({
      label: option.label,
      contentText: option.contentText,
      isCorrect: option.isCorrect,
      scoreValue: option.isCorrect ? 1 : 0,
      dimensionMap: null,
    })),
    media: [stemMedia(spec)],
    tags: [...row.tags],
  };
}

function buildFigural(
  rows: readonly FiguralSeed[],
  stageCode: SeedStageCode,
  subtestCode: SeedSubtestCode,
): SeedQuestion[] {
  return rows.map((row) =>
    row.type === 'IMAGE_CHOICE'
      ? buildFiguralImage(row, stageCode, subtestCode)
      : buildFiguralText(row, stageCode, subtestCode),
  );
}

function buildFiguralKecerdasan(): SeedQuestion[] {
  return buildFigural(FIGURAL_KECERDASAN, PSIKOLOGI, 'KECERDASAN');
}

function buildFiguralTkk(): SeedQuestion[] {
  return buildFigural(FIGURAL_TKK, 'TKK', 'TKK');
}

/** Seluruh soal realistis yang akan di-seed (fungsi murni, mudah diuji). */
export function buildSeedQuestions(): SeedQuestion[] {
  return [
    ...buildKecerdasan(),
    ...buildKecerdasanMulti(),
    ...buildFiguralKecerdasan(),
    ...buildKepribadian(),
    ...buildKecermatan(),
    ...buildPassHand(),
    ...buildTpk(),
    ...buildTkkChoices(),
    ...buildTkkMultiChoices(),
  ];
}

/* ------------------------------------------------------------------ seeding */

const CHUNK_SIZE = 400;

/** UUID v4 deterministik dari kode soal, agar id stabil antar seed. */
function questionId(publicCode: string): string {
  const hex = createHash('sha1').update(`question:${publicCode}`).digest('hex').slice(0, 32);
  const variant = ((Number.parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80)
    .toString(16)
    .padStart(2, '0');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(
    18,
    20,
  )}-${hex.slice(20, 32)}`;
}

function chunks<T>(values: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

async function seedCategories(prisma: PrismaClient): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const category of QUESTION_CATEGORIES) {
    const slug = category.path.split('/').pop()!;
    const parentId = category.parentPath ? (ids.get(category.parentPath) ?? null) : null;

    const existing = await prisma.category.findFirst({ where: { path: category.path } });
    const row = existing
      ? await prisma.category.update({
          where: { id: existing.id },
          data: { name: category.name, slug, parentId, sortOrder: category.sortOrder },
        })
      : await prisma.category.create({
          data: {
            name: category.name,
            slug,
            path: category.path,
            parentId,
            sortOrder: category.sortOrder,
          },
        });

    ids.set(category.path, row.id);
  }

  return ids;
}

async function seedTags(
  prisma: PrismaClient,
  names: readonly string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(names)];

  await prisma.tag.createMany({
    data: unique.map((name) => ({ name })),
    skipDuplicates: true,
  });

  const rows = await prisma.tag.findMany({
    where: { name: { in: unique } },
    select: { id: true, name: true },
  });

  return new Map(rows.map((row) => [row.name, row.id]));
}

/** Isi soal tanpa kolom turunan; dipakai untuk membandingkan perubahan. */
function questionFields(question: SeedQuestion, categoryId: string | null) {
  return {
    stageCode: question.stageCode,
    subtestCode: question.subtestCode,
    categoryId,
    type: question.type,
    status: 'PUBLISHED' as const,
    difficulty: question.difficulty,
    stemText: question.stemText,
    stemFormat: 'MARKDOWN' as const,
    explanation: question.explanation,
    scoringStrategy: question.scoringStrategy,
    scoringConfig: question.scoringConfig as Prisma.InputJsonValue,
    pairGroup: question.pairGroup,
    columnIndex: question.columnIndex,
    dedupeHash: question.dedupeHash,
    dedupeOverride: question.dedupeOverride,
    deletedAt: null,
  };
}

export async function seedQuestionBank(
  prisma: PrismaClient,
  mediaIds: ReadonlyMap<string, string> = new Map(),
): Promise<void> {
  const categoryIds = await seedCategories(prisma);
  const questions = buildSeedQuestions();

  // Media soal hanya bisa ditulis bila asetnya sudah terdaftar. Gagal cepat di
  // sini lebih baik daripada seed "sukses" tetapi soal bergambar tanpa gambar.
  const missingAssets = [
    ...new Set(
      questions.flatMap((question) =>
        question.media.map((entry) => entry.assetCode).filter((code) => !mediaIds.has(code)),
      ),
    ),
  ];
  if (missingAssets.length > 0) {
    throw new Error(
      `Aset media belum terdaftar (jalankan seedMediaAssets lebih dulu): ${missingAssets
        .slice(0, 5)
        .join(', ')}`,
    );
  }

  // Hanya soal yang ikut aturan dedupe (dedupeOverride=false) yang wajib unik;
  // soal bangkitan memang berbagi stem sehingga hash-nya boleh sama.
  const duplicated = questions
    .filter((question) => !question.dedupeOverride)
    .map((question) => `${question.stageCode}|${question.subtestCode}|${question.dedupeHash}`)
    .filter((key, index, all) => all.indexOf(key) !== index);
  if (duplicated.length > 0) {
    throw new Error(
      `Dedupe hash duplikat pada data seed (perbaiki soal): ${duplicated.slice(0, 3).join(', ')}`,
    );
  }

  const tagIds = await seedTags(
    prisma,
    questions.flatMap((question) => question.tags),
  );

  const categoryOf = (question: SeedQuestion): string | null =>
    categoryIds.get(question.categoryPath) ?? null;

  // Soal DEMO & TPA lama tidak dipakai lagi. Keduanya dihapus-lunak
  // (`deletedAt`), bukan sekadar diarsipkan: unique index
  // `questions_active_dedupe_key` hanya mengabaikan baris yang `deleted_at`
  // terisi. Soal TPA figural berbagi `dedupe_hash` dengan soal TKK
  // penggantinya, sehingga tanpa hapus-lunak `createMany` akan melewatinya
  // (`skipDuplicates`) dan penulisan opsi/media gagal dengan pelanggaran
  // foreign key.
  const retired = await prisma.question.updateMany({
    where: {
      OR: [{ publicCode: { startsWith: 'DEMO-' } }, { publicCode: { startsWith: 'TPA-' } }],
      deletedAt: null,
    },
    data: { status: 'ARCHIVED', deletedAt: new Date() },
  });

  const existing = await prisma.question.findMany({
    where: { publicCode: { in: questions.map((question) => question.publicCode) } },
    select: { id: true, publicCode: true },
  });
  const existingCodes = new Set(existing.map((row) => row.publicCode));
  const idByCode = new Map(existing.map((row) => [row.publicCode, row.id]));

  // Id soal yang sudah ada dipertahankan agar relasi sesi lama tidak putus;
  // soal baru memakai id deterministik dari kode.
  const idFor = (question: SeedQuestion): string => {
    const known = idByCode.get(question.publicCode);
    if (known) return known;
    const created = questionId(question.publicCode);
    idByCode.set(question.publicCode, created);
    return created;
  };

  const toCreate = questions.filter((question) => !existingCodes.has(question.publicCode));
  const toUpdate = questions.filter((question) => existingCodes.has(question.publicCode));

  // Bebaskan unique index (stage_code, subtest_code, dedupe_hash) sementara pada soal yang akan diperbarui
  // agar pergeseran urutan/hash soal antar kode publik tidak saling bertabrakan
  for (const batch of chunks(toUpdate.map((q) => q.publicCode), 100)) {
    await prisma.question.updateMany({
      where: { publicCode: { in: batch } },
      data: { dedupeOverride: true },
    });
  }

  for (const batch of chunks(toCreate, CHUNK_SIZE)) {
    await prisma.question.createMany({
      data: batch.map((question) => ({
        ...questionFields(question, categoryOf(question)),
        id: idFor(question),
        publicCode: question.publicCode,
        weight: 1,
      })),
      skipDuplicates: true,
    });
  }

  for (const batch of chunks(toUpdate, 50)) {
    await prisma.$transaction(
      batch.map((question) =>
        prisma.question.update({
          where: { publicCode: question.publicCode },
          data: {
            ...questionFields(question, categoryOf(question)),
            weight: 1,
          },
        }),
      ),
    );
  }

  // Opsi & tag ditulis ulang hanya untuk soal yang baru/berubah.
  const touched = [...toCreate, ...toUpdate];
  const touchedIds = touched.map((question) => idFor(question));

  for (const batch of chunks(touchedIds, CHUNK_SIZE)) {
    await prisma.questionMedia.deleteMany({ where: { questionId: { in: batch } } });
    await prisma.questionOption.deleteMany({ where: { questionId: { in: batch } } });
    await prisma.questionTag.deleteMany({ where: { questionId: { in: batch } } });
  }

  for (const batch of chunks(touched, CHUNK_SIZE)) {
    const options = batch.flatMap((question) =>
      question.options.map((option, index) => ({
        questionId: idFor(question),
        label: option.label,
        contentText: option.contentText,
        isCorrect: option.isCorrect,
        scoreValue: option.scoreValue,
        dimensionMap: option.dimensionMap ?? Prisma.JsonNull,
        sortOrder: index,
      })),
    );

    if (options.length > 0) {
      await prisma.questionOption.createMany({ data: options });
    }
  }

  // Media soal (F3-25). Label opsi perlu id baris `question_options`, jadi
  // media ditulis setelah opsi tersimpan dan id-nya dibaca kembali.
  for (const batch of chunks(touched, CHUNK_SIZE)) {
    const withMedia = batch.filter((question) => question.media.length > 0);
    if (withMedia.length === 0) continue;

    const questionIds = withMedia.map((question) => idFor(question));
    const savedOptions = await prisma.questionOption.findMany({
      where: { questionId: { in: questionIds } },
      select: { id: true, questionId: true, label: true },
    });
    const optionId = new Map(
      savedOptions.map((option) => [`${option.questionId}|${option.label}`, option.id]),
    );

    const mediaRows = withMedia.flatMap((question) =>
      question.media.map((entry) => {
        const mediaAssetId = mediaIds.get(entry.assetCode);
        if (!mediaAssetId) {
          throw new Error(
            `${question.publicCode}: aset ${entry.assetCode} belum terdaftar di media_assets`,
          );
        }

        let optionRowId: string | null = null;
        if (entry.role === 'OPTION') {
          if (!entry.optionLabel) {
            throw new Error(`${question.publicCode}: media OPTION tanpa optionLabel`);
          }
          optionRowId = optionId.get(`${idFor(question)}|${entry.optionLabel}`) ?? null;
          if (!optionRowId) {
            throw new Error(
              `${question.publicCode}: opsi ${entry.optionLabel} tidak ditemukan untuk media`,
            );
          }
        }

        return {
          questionId: idFor(question),
          optionId: optionRowId,
          mediaAssetId,
          role: entry.role,
          altText: entry.altText ?? null,
          sortOrder: entry.sortOrder ?? 0,
        };
      }),
    );

    if (mediaRows.length > 0) {
      await prisma.questionMedia.createMany({ data: mediaRows });
    }
  }

  for (const batch of chunks(touched, CHUNK_SIZE)) {
    const links = batch.flatMap((question) =>
      [...new Set(question.tags)].map((name) => {
        const tagId = tagIds.get(name);
        if (!tagId) throw new Error(`Tag "${name}" belum tersedia`);
        return { questionId: idFor(question), tagId };
      }),
    );

    if (links.length > 0) {
      await prisma.questionTag.createMany({ data: links, skipDuplicates: true });
    }
  }

  // Soal DEMO & TPA lama sudah dihapus-lunak di awal seed; blok ini hanya
  // menjaga perilaku lama (arsip tanpa hapus-lunak) untuk baris yang lolos.
  await prisma.question.updateMany({
    where: { publicCode: { startsWith: 'DEMO-' }, status: { not: 'ARCHIVED' }, deletedAt: null },
    data: { status: 'ARCHIVED' },
  });

  const perSubtest = new Map<string, number>();
  for (const question of questions) {
    perSubtest.set(question.subtestCode, (perSubtest.get(question.subtestCode) ?? 0) + 1);
  }

  console.log(`  kategori soal: ${categoryIds.size}`);
  console.log(
    `  soal realistis: ${questions.length} (baru ${toCreate.length}, diperbarui ${
      toUpdate.length
    }) — ${[...perSubtest.entries()].map(([code, count]) => `${code} ${count}`).join(', ')}`,
  );
  if (retired.count > 0) {
    console.log(`  soal DEMO/TPA lama disembunyikan: ${retired.count}`);
  }
}
