import { createHash } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import { computeDedupeHash } from '../../../src/modules/questions/dedupe';
import { buildChoices } from './builder';
import { buildOptions, createRng } from './rng';
import { KECERDASAN_QUESTIONS } from './kecerdasan';
import { KECERMATAN_QUESTIONS } from './kecermatan';
import { KEPRIBADIAN_QUESTIONS } from './kepribadian';
import { PASS_HAND_QUESTIONS } from './pass-hand';
import { TPK_QUESTIONS } from './tpk';
import type { SeedDifficulty } from './types';

/**
 * Seed bank soal realistis (bukan fixture).
 *
 * Cakupan:
 *   PSIKOLOGI — Kecerdasan 100, Kepribadian 140, Kecermatan 500, Pass Hand 150
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
  { path: 'psikologi/kecerdasan', name: 'Kecerdasan', parentPath: 'psikologi', sortOrder: 1 },
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
    path: 'psikologi/kecerdasan/logis',
    name: 'Logika',
    parentPath: 'psikologi/kecerdasan',
    sortOrder: 3,
  },
  { path: 'psikologi/kepribadian', name: 'Kepribadian', parentPath: 'psikologi', sortOrder: 2 },
  { path: 'psikologi/kecermatan', name: 'Kecermatan', parentPath: 'psikologi', sortOrder: 3 },
  {
    path: 'psikologi/kecermatan/angka',
    name: 'Angka',
    parentPath: 'psikologi/kecermatan',
    sortOrder: 1,
  },
  {
    path: 'psikologi/kecermatan/huruf',
    name: 'Huruf',
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
];

/* ------------------------------------------------------------------ payload */

type SeedStageCode = 'PSIKOLOGI' | 'TPK';
type SeedSubtestCode = 'KECERDASAN' | 'KEPRIBADIAN' | 'KECERMATAN' | 'PASS_HAND' | 'TPK';
type SeedQuestionType =
  'SINGLE_CHOICE' | 'LIKERT_STATEMENT' | 'MISSING_ELEMENT' | 'PASS_HAND_COLUMN';

interface SeedOption {
  label: string;
  contentText: string;
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

function hashOf(stem: string, options: readonly { contentText: string }[]): string {
  return computeDedupeHash(stem, options);
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
      tags: [...row.tags],
    };
  });
}

function buildKecermatan(): SeedQuestion[] {
  return KECERMATAN_QUESTIONS.map((row) => {
    // Urutan opsi diacak deterministik agar kunci tidak selalu pada label A.
    const built = buildOptions(
      createRng(`kecermatan-options:${row.code}`),
      row.answer,
      row.distractors,
    );

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
      columnIndex: null,
      dedupeHash: hashOf(
        row.stem,
        built.options.map((option) => ({ contentText: option.contentText })),
      ),
      // Stem sama untuk seluruh soal varian; keunikan dijaga oleh publicCode,
      // sehingga unique index dedupe sengaja dilewati.
      dedupeOverride: true,
      options: built.options.map((option) => ({
        label: option.label,
        contentText: option.contentText,
        isCorrect: option.isCorrect,
        scoreValue: option.isCorrect ? 1 : 0,
        dimensionMap: null,
      })),
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
    tags: [...row.tags],
  }));
}

/** Seluruh soal realistis yang akan di-seed (fungsi murni, mudah diuji). */
export function buildSeedQuestions(): SeedQuestion[] {
  return [
    ...buildKecerdasan(),
    ...buildKepribadian(),
    ...buildKecermatan(),
    ...buildPassHand(),
    ...buildTpk(),
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

export async function seedQuestionBank(prisma: PrismaClient): Promise<void> {
  const categoryIds = await seedCategories(prisma);
  const questions = buildSeedQuestions();

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

  // Soal DEMO lama tidak dipakai lagi; diarsipkan agar riwayat tetap ada.
  const archived = await prisma.question.updateMany({
    where: { publicCode: { startsWith: 'DEMO-' }, status: { not: 'ARCHIVED' } },
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
  if (archived.count > 0) {
    console.log(`  soal demo diarsipkan: ${archived.count}`);
  }
}
