import { createHash } from 'node:crypto';
import type {
  PrismaClient,
  QuestionType,
  StageCode,
  SubtestCode,
} from '@prisma/client';
import type { QuestionDifficulty } from '@webcat/contracts';

/**
 * Seed bank soal B2: taksonomi kategori + satu contoh untuk setiap tipe soal.
 *
 * Semua soal contoh disimpan sebagai DRAFT supaya coverage publikasi tidak
 * terisi otomatis — admin tetap harus review lalu publish manual.
 *
 * Idempoten: kategori memakai `path` unik, soal memakai `publicCode` unik.
 */

interface CategorySeed {
  path: string;
  name: string;
  parentPath?: string;
  sortOrder: number;
}

const CATEGORIES: CategorySeed[] = [
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
  { path: 'psikologi/kepribadian', name: 'Kepribadian', parentPath: 'psikologi', sortOrder: 2 },
  { path: 'psikologi/kecermatan', name: 'Kecermatan', parentPath: 'psikologi', sortOrder: 3 },
  { path: 'psikologi/pass-hand', name: 'Pass Hand', parentPath: 'psikologi', sortOrder: 4 },
  { path: 'tpa', name: 'TPA', sortOrder: 2 },
  { path: 'tpa/verbal', name: 'Verbal', parentPath: 'tpa', sortOrder: 1 },
  { path: 'tpa/numerik', name: 'Numerik', parentPath: 'tpa', sortOrder: 2 },
  { path: 'tpk', name: 'TPK', sortOrder: 3 },
  { path: 'tpk/hukum', name: 'Hukum Kepolisian', parentPath: 'tpk', sortOrder: 1 },
];

interface QuestionSeed {
  publicCode: string;
  stageCode: StageCode;
  subtestCode: SubtestCode;
  categoryPath: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  stemText: string;
  explanation?: string;
  pairGroup?: string;
  columnIndex?: number;
  tags?: string[];
  options?: Array<{
    label: string;
    contentText: string;
    isCorrect?: boolean;
    dimensionMap?: Record<string, number>;
  }>;
}

const QUESTIONS: QuestionSeed[] = [
  {
    publicCode: 'DEMO-KEC-VERBAL-001',
    stageCode: 'PSIKOLOGI',
    subtestCode: 'KECERDASAN',
    categoryPath: 'psikologi/kecerdasan/verbal',
    type: 'SINGLE_CHOICE',
    difficulty: 'EASY',
    stemText: 'Sinonim dari kata "abadi" adalah ...',
    explanation: 'Abadi berarti kekal atau tidak berubah selamanya.',
    tags: ['verbal', 'sinonim'],
    options: [
      { label: 'A', contentText: 'Kekal', isCorrect: true },
      { label: 'B', contentText: 'Sementara' },
      { label: 'C', contentText: 'Berubah' },
      { label: 'D', contentText: 'Baru' },
      { label: 'E', contentText: 'Rusak' },
    ],
  },
  {
    publicCode: 'DEMO-TPA-NUM-001',
    stageCode: 'TPA',
    subtestCode: 'TPA',
    categoryPath: 'tpa/numerik',
    type: 'MULTI_CHOICE',
    difficulty: 'MEDIUM',
    stemText: 'Manakah di antara bilangan berikut yang termasuk bilangan prima?',
    explanation: 'Bilangan prima hanya habis dibagi 1 dan dirinya sendiri: 2 dan 3.',
    tags: ['numerik', 'prima'],
    options: [
      { label: 'A', contentText: '2', isCorrect: true },
      { label: 'B', contentText: '3', isCorrect: true },
      { label: 'C', contentText: '4' },
      { label: 'D', contentText: '6' },
      { label: 'E', contentText: '9' },
    ],
  },
  {
    publicCode: 'DEMO-TPA-IMG-001',
    stageCode: 'TPA',
    subtestCode: 'TPA',
    categoryPath: 'tpa/verbal',
    type: 'IMAGE_CHOICE',
    difficulty: 'MEDIUM',
    stemText: 'Pilih gambar yang merupakan cerminan dari gambar di atas.',
    tags: ['figural', 'pencerminan'],
    options: [
      { label: 'A', contentText: 'Opsi A', isCorrect: true },
      { label: 'B', contentText: 'Opsi B' },
      { label: 'C', contentText: 'Opsi C' },
      { label: 'D', contentText: 'Opsi D' },
    ],
  },
  {
    publicCode: 'DEMO-KEP-LIKERT-001',
    stageCode: 'PSIKOLOGI',
    subtestCode: 'KEPRIBADIAN',
    categoryPath: 'psikologi/kepribadian',
    type: 'LIKERT_STATEMENT',
    difficulty: 'MEDIUM',
    stemText: 'Saya bersedia mengakui kesalahan saya di depan rekan kerja.',
    pairGroup: 'PAIR-HONESTY-01',
    tags: ['likert', 'kejujuran'],
    options: [
      { label: 'A', contentText: 'Sangat Setuju', dimensionMap: { kejujuran: 2 } },
      { label: 'B', contentText: 'Setuju', dimensionMap: { kejujuran: 1 } },
      { label: 'C', contentText: 'Ragu-ragu', dimensionMap: { kejujuran: 0 } },
      { label: 'D', contentText: 'Tidak Setuju', dimensionMap: { kejujuran: -1 } },
      { label: 'E', contentText: 'Sangat Tidak Setuju', dimensionMap: { kejujuran: -2 } },
    ],
  },
  {
    publicCode: 'DEMO-KEC-TITIK-001',
    stageCode: 'PSIKOLOGI',
    subtestCode: 'KECERMATAN',
    categoryPath: 'psikologi/kecermatan',
    type: 'MISSING_ELEMENT',
    difficulty: 'EASY',
    stemText: 'Lengkapi bagian yang hilang pada deret: 2, 4, 8, ..., 32',
    explanation: 'Pola deret dikali 2, sehingga bagian yang hilang adalah 16.',
    tags: ['deret', 'kecermatan'],
    options: [
      { label: 'A', contentText: '12' },
      { label: 'B', contentText: '14' },
      { label: 'C', contentText: '16', isCorrect: true },
      { label: 'D', contentText: '18' },
    ],
  },
  {
    publicCode: 'DEMO-PASSHAND-001',
    stageCode: 'PSIKOLOGI',
    subtestCode: 'PASS_HAND',
    categoryPath: 'psikologi/pass-hand',
    type: 'PASS_HAND_COLUMN',
    difficulty: 'EASY',
    stemText: 'Hitung jumlah pasangan angka yang sama pada kolom ini: 4 7 4 9 7 4',
    columnIndex: 1,
    tags: ['pass-hand', 'kecepatan'],
    options: [],
  },
];

function dedupeHash(stemText: string, options: Array<{ contentText: string }>): string {
  const normalize = (value: string) =>
    value
      .normalize('NFKC')
      .toLowerCase()
      .replace(/<[^>]*>/g, ' ')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const parts = options
    .map((option) => normalize(option.contentText))
    .filter(Boolean)
    .sort()
    .join('|');
  return createHash('sha256').update(`${normalize(stemText)}|${parts}`, 'utf8').digest('hex');
}

export async function seedQuestionBank(prisma: PrismaClient): Promise<void> {
  const categoryIdByPath = new Map<string, string>();

  for (const category of CATEGORIES) {
    const slug = category.path.split('/').pop()!;
    const parentId = category.parentPath
      ? (categoryIdByPath.get(category.parentPath) ?? null)
      : null;

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
    categoryIdByPath.set(category.path, row.id);
  }

  for (const question of QUESTIONS) {
    const options = question.options ?? [];
    const tagNames = question.tags ?? [];
    const categoryId = categoryIdByPath.get(question.categoryPath) ?? null;

    await prisma.question.upsert({
      where: { publicCode: question.publicCode },
      update: {
        stageCode: question.stageCode,
        subtestCode: question.subtestCode,
        categoryId,
        type: question.type,
        difficulty: question.difficulty,
        stemText: question.stemText,
        explanation: question.explanation ?? null,
        pairGroup: question.pairGroup ?? null,
        columnIndex: question.columnIndex ?? null,
        dedupeHash: dedupeHash(question.stemText, options),
        dedupeOverride: true,
      },
      create: {
        publicCode: question.publicCode,
        stageCode: question.stageCode,
        subtestCode: question.subtestCode,
        categoryId,
        type: question.type,
        status: 'DRAFT',
        difficulty: question.difficulty,
        stemText: question.stemText,
        explanation: question.explanation ?? null,
        pairGroup: question.pairGroup ?? null,
        columnIndex: question.columnIndex ?? null,
        dedupeHash: dedupeHash(question.stemText, options),
        // Seed demo boleh berada di luar aturan dedupe karena bukan hasil impor.
        dedupeOverride: true,
        options: options.length
          ? {
              create: options.map((option, index) => ({
                label: option.label,
                contentText: option.contentText,
                isCorrect: option.isCorrect ?? false,
                dimensionMap: (option.dimensionMap ?? null) as never,
                sortOrder: index,
              })),
            }
          : undefined,
        tags: {
          create: tagNames.map((name) => ({
            tag: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
      },
    });
  }

  console.log(`  kategori: ${CATEGORIES.length}, soal demo: ${QUESTIONS.length}`);
}
