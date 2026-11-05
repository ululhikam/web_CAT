import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { ExamQuestionType, SubtestCode } from '@webcat/contracts';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { QuestionSnapshot, SnapshotOption } from '../scoring/scoring.types';

/**
 * Sumber soal untuk materialisasi subtes.
 *
 * Prioritas:
 *   1. Bank soal database (`questions` status PUBLISHED) — dipakai begitu B2
 *      mengisi pool (gate G2).
 *   2. Fixture deterministik B3 — dipakai selama pool DB belum tersedia.
 *
 * Keduanya menghasilkan bentuk yang sama: snapshot server-only yang memuat
 * kunci jawaban. Snapshot inilah yang disimpan per sesi sehingga hasil tidak
 * berubah bila bank soal berubah.
 */

export interface MaterializedQuestionSeed {
  /** Kode publik soal dari pool. */
  externalId: string;
  /** `questions.id` bila soal berasal dari DB; null untuk fixture. */
  questionId: string | null;
  position: number;
  columnIndex: number | null;
  snapshot: QuestionSnapshot;
}

/* ------------------------------------------------------------------ random */

/** Hash 32-bit deterministik dari string. */
function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** PRNG mulberry32 — deterministik dan cukup cepat untuk 500 soal. */
function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function intBetween(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function shuffle<T>(rng: () => number, values: readonly T[]): T[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(rng() * (index + 1));
    [copy[index], copy[target]] = [copy[target]!, copy[index]!];
  }
  return copy;
}

/** UUID deterministik dari string — dipakai sebagai id opsi snapshot. */
export function deterministicUuid(value: string): string {
  const hex = createHash('sha1').update(value).digest('hex').slice(0, 32);
  const variant = ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(18, 20)}-${hex.slice(20, 32)}`;
}

/* ------------------------------------------------------------------ fixtures */

const LIKERT_LABELS = ['1', '2', '3', '4', '5'] as const;
const LIKERT_DIMENSIONS = ['KEPEMIMPINAN', 'KERJASAMA', 'STABILITAS'] as const;
const LIKERT_STATEMENTS = [
  'Saya mengambil keputusan dengan tegas saat kelompok membutuhkan arahan.',
  'Saya mendengarkan pendapat orang lain sebelum menyimpulkan sesuatu.',
  'Saya tetap tenang ketika menghadapi tekanan waktu.',
  'Saya lebih suka bekerja sendiri daripada berdiskusi dengan tim.',
  'Saya memeriksa ulang pekerjaan yang akan diserahkan.',
  'Saya mudah tersinggung ketika dikritik di depan umum.',
  'Saya berani memikul tanggung jawab atas kesalahan tim.',
  'Saya menyesuaikan cara kerja dengan kebutuhan rekan satu tim.',
  'Saya dapat menahan emosi saat situasi tidak sesuai harapan.',
  'Saya cenderung menunda keputusan sulit hingga orang lain memutuskan.',
] as const;

const KECERDASAN_TOPICS = [
  'Deret angka',
  'Analogi verbal',
  'Silogisme',
  'Aritmetika',
  'Klasifikasi',
] as const;

const TPA_TOPICS = ['Verbal', 'Numerik', 'Penalaran logis'] as const;
const TPK_TOPICS = [
  'Struktur organisasi Polri',
  'Hukum kepolisian',
  'Etika profesi',
  'Tugas pokok Polri',
] as const;

const KECERMATAN_CHARS = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'.split('');

function optionId(seed: string, index: number): string {
  return deterministicUuid(`${seed}:option:${index}`);
}

function buildChoice(
  rng: () => number,
  sourceId: string,
  topic: string,
  stemPrefix: string,
): QuestionSnapshot {
  const a = intBetween(rng, 11, 89);
  const b = intBetween(rng, 11, 89);
  const answer = a + b;
  const distractors = shuffle(rng, [answer + 1, answer - 1, answer + 10, answer - 10, answer + 2])
    .filter((value, index, all) => value !== answer && all.indexOf(value) === index)
    .slice(0, 4);
  while (distractors.length < 4) {
    const candidate = answer + intBetween(rng, 11, 20);
    if (candidate !== answer && !distractors.includes(candidate)) distractors.push(candidate);
  }
  const values = shuffle(rng, [answer, ...distractors]);
  const labels = ['A', 'B', 'C', 'D', 'E'];
  const options: SnapshotOption[] = values.map((value, index) => ({
    id: optionId(sourceId, index),
    label: labels[index]!,
    text: String(value),
    isCorrect: value === answer,
    scoreValue: value === answer ? 1 : 0,
    dimensionMap: null,
  }));

  return {
    sourceId,
    type: 'SINGLE_CHOICE',
    stem: `${stemPrefix} ${topic}: berapakah hasil dari ${a} + ${b}?`,
    stemFormat: 'MARKDOWN',
    difficulty: ['EASY', 'MEDIUM', 'HARD'][intBetween(rng, 0, 2)] as QuestionSnapshot['difficulty'],
    weight: 1,
    scale: null,
    isReverse: false,
    pairGroup: null,
    columnIndex: null,
    columnNumbers: null,
    missingElement: null,
    options,
    media: [],
  };
}

function buildLikert(rng: () => number, sourceId: string, position: number): QuestionSnapshot {
  const statement = LIKERT_STATEMENTS[(position - 1) % LIKERT_STATEMENTS.length]!;
  const dimension = LIKERT_DIMENSIONS[(position - 1) % LIKERT_DIMENSIONS.length]!;
  const isReverse = position % 3 === 0;
  const pairGroup =
    position % 4 <= 2 ? `PAIR_${String(Math.ceil(position / 2)).padStart(3, '0')}` : null;

  const options: SnapshotOption[] = LIKERT_LABELS.map((label, index) => ({
    id: optionId(sourceId, index),
    label,
    text: null,
    isCorrect: false,
    scoreValue: Number(label),
    dimensionMap: { [dimension]: 1 },
  }));

  return {
    sourceId,
    type: 'LIKERT_STATEMENT',
    stem: statement,
    stemFormat: 'MARKDOWN',
    difficulty: 'MEDIUM',
    weight: 1,
    scale: 5,
    isReverse,
    pairGroup,
    columnIndex: null,
    columnNumbers: null,
    missingElement: null,
    options,
    media: [],
  };
}

function buildMissingElement(rng: () => number, sourceId: string): QuestionSnapshot {
  const length = intBetween(rng, 4, 7);
  const left = Array.from(
    { length },
    () => KECERMATAN_CHARS[intBetween(rng, 0, KECERMATAN_CHARS.length - 1)]!,
  ).join('');
  const missingIndex = intBetween(rng, 0, length - 1);
  const answer = left[missingIndex]!;
  const right = left.slice(0, missingIndex) + left.slice(missingIndex + 1);

  const candidates = new Set<string>([answer]);
  while (candidates.size < 5) {
    candidates.add(KECERMATAN_CHARS[intBetween(rng, 0, KECERMATAN_CHARS.length - 1)]!);
  }
  const values = shuffle(rng, [...candidates]);
  const labels = ['A', 'B', 'C', 'D', 'E'];
  const options: SnapshotOption[] = values.map((value, index) => ({
    id: optionId(sourceId, index),
    label: labels[index]!,
    text: value,
    isCorrect: value === answer,
    scoreValue: value === answer ? 1 : 0,
    dimensionMap: null,
  }));

  return {
    sourceId,
    type: 'MISSING_ELEMENT',
    stem: 'Lengkapi larik kedua dengan karakter yang hilang.',
    stemFormat: 'MARKDOWN',
    difficulty: 'MEDIUM',
    weight: 1,
    scale: null,
    isReverse: false,
    pairGroup: null,
    columnIndex: null,
    columnNumbers: null,
    missingElement: { left, right, answer },
    options,
    media: [],
  };
}

function buildPassHand(rng: () => number, sourceId: string, columnIndex: number): QuestionSnapshot {
  const rowCount = 20;
  const columnNumbers: number[] = [];
  for (let index = 0; index < rowCount * 2; index += 1) {
    columnNumbers.push(intBetween(rng, 0, 9));
  }

  return {
    sourceId,
    type: 'PASS_HAND_COLUMN',
    stem: 'Jumlahkan dua angka berdekatan, tuliskan digit terakhir hasilnya.',
    stemFormat: 'MARKDOWN',
    difficulty: 'MEDIUM',
    weight: 1,
    scale: null,
    isReverse: false,
    pairGroup: null,
    columnIndex,
    columnNumbers,
    missingElement: null,
    options: [],
    media: [],
  };
}

function buildFixture(code: SubtestCode, count: number, seed: string): MaterializedQuestionSeed[] {
  const rng = createRng(hashSeed(`${seed}:${code}`));
  const result: MaterializedQuestionSeed[] = [];

  for (let index = 0; index < count; index += 1) {
    const position = index + 1;
    const externalId = `DEV-${code}-${String(position).padStart(4, '0')}`;
    let snapshot: QuestionSnapshot;

    if (code === 'KEPRIBADIAN') {
      snapshot = buildLikert(rng, externalId, position);
    } else if (code === 'KECERMATAN') {
      snapshot = buildMissingElement(rng, externalId);
    } else if (code === 'PASS_HAND') {
      snapshot = buildPassHand(rng, externalId, index);
    } else {
      const topics = code === 'TPA' ? TPA_TOPICS : code === 'TPK' ? TPK_TOPICS : KECERDASAN_TOPICS;
      snapshot = buildChoice(
        rng,
        externalId,
        topics[index % topics.length]!,
        code === 'KECERDASAN' ? 'Tes Kecerdasan' : code === 'TPA' ? 'TPA' : 'TPK',
      );
    }

    result.push({
      externalId,
      questionId: null,
      position,
      columnIndex: snapshot.columnIndex,
      snapshot,
    });
  }

  return result;
}

/* ------------------------------------------------------------------ database */

interface QuestionRow {
  id: string;
  publicCode: string;
  type: ExamQuestionType;
  stemText: string;
  stemFormat: 'MARKDOWN' | 'HTML';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  weight: { toString(): string } | number;
  pairGroup: string | null;
  columnIndex: number | null;
  scoringConfig: unknown;
  options: Array<{
    id: string;
    label: string;
    contentText: string | null;
    isCorrect: boolean;
    scoreValue: { toString(): string } | number;
    dimensionMap: unknown;
  }>;
  media: Array<{
    role: 'STEM' | 'OPTION' | 'EXPLANATION';
    altText: string | null;
    mediaAsset: { storagePath: string };
  }>;
}

function numeric(value: { toString(): string } | number): number {
  const parsed = typeof value === 'number' ? value : Number(value.toString());
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapDbQuestion(row: QuestionRow, position: number): MaterializedQuestionSeed {
  const config =
    row.scoringConfig && typeof row.scoringConfig === 'object' && !Array.isArray(row.scoringConfig)
      ? (row.scoringConfig as Record<string, unknown>)
      : {};

  const columnNumbers = Array.isArray(config.columnNumbers)
    ? (config.columnNumbers as unknown[]).map((value) => Number(value)).filter(Number.isFinite)
    : null;
  const missing =
    config.missingElement && typeof config.missingElement === 'object'
      ? (config.missingElement as Record<string, unknown>)
      : null;

  const snapshot: QuestionSnapshot = {
    sourceId: row.publicCode,
    type: row.type,
    stem: row.stemText,
    stemFormat: row.stemFormat,
    difficulty: row.difficulty,
    weight: numeric(row.weight) > 0 ? numeric(row.weight) : 1,
    scale:
      typeof config.scale === 'number' ? config.scale : row.type === 'LIKERT_STATEMENT' ? 5 : null,
    isReverse: config.isReverse === true,
    pairGroup: row.pairGroup,
    columnIndex: row.columnIndex,
    columnNumbers: columnNumbers && columnNumbers.length >= 2 ? columnNumbers : null,
    missingElement:
      missing && typeof missing.left === 'string' && typeof missing.right === 'string'
        ? {
            left: missing.left,
            right: missing.right,
            answer: typeof missing.answer === 'string' ? missing.answer : '',
          }
        : null,
    options: row.options.map((option) => ({
      id: option.id,
      label: option.label,
      text: option.contentText,
      isCorrect: option.isCorrect,
      scoreValue: numeric(option.scoreValue),
      dimensionMap:
        option.dimensionMap &&
        typeof option.dimensionMap === 'object' &&
        !Array.isArray(option.dimensionMap)
          ? (option.dimensionMap as Record<string, number>)
          : null,
    })),
    media: row.media.map((media) => ({
      role: media.role,
      path: media.mediaAsset.storagePath,
      alt: media.altText,
    })),
  };

  return {
    externalId: row.publicCode,
    questionId: row.id,
    position,
    columnIndex: row.columnIndex,
    snapshot,
  };
}

/** Klien database yang boleh dipakai: root client atau klien transaksi. */
export type ExamDbClient = Prisma.TransactionClient | PrismaService;

/* ------------------------------------------------------------------ service */

@Injectable()
export class ExamQuestionSource {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Menyiapkan soal untuk satu subtes sesi. Deterministik terhadap
   * `subtestSessionId` + kode subtes sehingga materialisasi ulang menghasilkan
   * urutan yang sama (idempoten).
   *
   * `db` WAJIB diteruskan bila dipanggil dari dalam `$transaction`. Memakai
   * root client di dalam transaksi akan meminjam koneksi kedua dari pool
   * (`connection_limit=1`) sehingga transaksi saling menunggu dan timeout.
   */
  async prepare(
    input: {
      subtestSessionId: string;
      subtestCode: SubtestCode;
      count: number;
    },
    db: ExamDbClient = this.prisma,
  ): Promise<MaterializedQuestionSeed[]> {
    const dbQuestions = await this.loadFromDatabase(input.subtestCode, input.count, db);
    if (dbQuestions.length >= input.count) {
      const rng = createRng(hashSeed(input.subtestSessionId));
      return shuffle(rng, dbQuestions).map((row, index) => mapDbQuestion(row, index + 1));
    }
    return buildFixture(input.subtestCode, input.count, input.subtestSessionId);
  }

  private async loadFromDatabase(
    code: SubtestCode,
    count: number,
    db: ExamDbClient = this.prisma,
  ): Promise<QuestionRow[]> {
    try {
      const rows = await db.question.findMany({
        where: {
          subtestCode: code,
          status: 'PUBLISHED',
          deletedAt: null,
        },
        orderBy: { publicCode: 'asc' },
        take: Math.max(count, 1),
        include: {
          options: { orderBy: { sortOrder: 'asc' } },
          media: { include: { mediaAsset: true } },
        },
      });
      return rows as unknown as QuestionRow[];
    } catch {
      // Database belum tersedia / tabel belum dimigrasi → pakai fixture.
      return [];
    }
  }
}
