import { createHash } from 'node:crypto';
import { Injectable, Logger, Optional } from '@nestjs/common';
import type { ExamQuestionType, SubtestCode } from '@webcat/contracts';
import type { Prisma } from '@prisma/client';
import { AppConfigService } from '../../core/config/config.service';
import { AppError } from '../../core/http/app-error';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { QuestionSnapshot, SnapshotMedia, SnapshotOption } from '../scoring/scoring.types';

/**
 * Sumber soal untuk materialisasi subtes.
 *
 * Prioritas:
 *   1. Bank soal database (`questions` status PUBLISHED) — dipakai begitu B2
 *      mengisi pool (gate G2).
 *   2. Fixture deterministik B3 — hanya saat `QUESTION_POOL=dev`, dan SELALU
 *      dicatat di log (F4-08).
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

/**
 * Media opsional untuk soal fixture (F3-06).
 *
 * Fixture dipakai saat bank soal DB belum cukup (mis. TKK kosong di dev).
 * Dengan spec ini, test dan seed tetap bisa menghasilkan soal bergambar tanpa
 * bergantung pada `question_media`.
 */
export interface FixtureMediaSpec {
  /** Media stem; membuat soal tampil dengan gambar di atas pertanyaan. */
  stem?: SnapshotMedia[];
  /** Media per indeks opsi. Bila ada, tipe soal menjadi `IMAGE_CHOICE`. */
  options?: Record<number, SnapshotMedia[]>;
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

/**
 * Ambil `count` soal yang tersebar merata dari `rows` (stride sampling).
 *
 * Pola lama (`orderBy publicCode asc` + `take: count`) hanya mengambil blok
 * awal pool. Begitu pool lebih besar dari kuota subtes, soal yang kode
 * publiknya berurutan di belakang — mis. `PSI-KEC-FIG-*` — tidak pernah
 * terpilih sehingga soal bergambar tak pernah tampil di sesi.
 *
 * `offset` (diturunkan dari seed sesi) menggeser titik awal sehingga tiap sesi
 * mendapat irisan berbeda, sementara sesi yang sama tetap deterministik.
 */
export function spreadSelection<T>(rows: readonly T[], count: number, offset = 0): T[] {
  if (count <= 0 || rows.length === 0) return [];
  if (rows.length <= count) return [...rows];

  const stride = rows.length / count;
  const start = ((offset % rows.length) + rows.length) % rows.length;
  const picked: T[] = [];
  for (let index = 0; index < count; index += 1) {
    picked.push(rows[Math.floor(start + index * stride) % rows.length]!);
  }
  return picked;
}

/** Batas atas baris pool yang dimuat sekaligus (pengaman memori). */
const QUESTION_POOL_LIMIT = 2_000;

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
  'Numerik & Aritmetika',
  'Verbal & Analogi',
  'Figural & Pola Visual',
  'Peta & Denah Lokasi',
  'Kepribadian & Sikap Kerja',
] as const;

const TKK_TOPICS = [
  'Perangkat keras',
  'Perangkat lunak',
  'Jaringan',
  'Keamanan siber',
  'Aplikasi perkantoran',
] as const;
const TPK_TOPICS = [
  'Struktur organisasi Polri',
  'Hukum kepolisian',
  'Etika profesi',
  'Tugas pokok Polri',
] as const;

const KECERMATAN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.split('');

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
    media: [],
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
    media: [],
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

function buildMissingElement(
  rng: () => number,
  sourceId: string,
  columnIndex: number | null = null,
): QuestionSnapshot {
  const col = columnIndex ?? 0;
  const colRng = createRng(hashSeed(`kecermatan-col:${col}`));
  const pool = shuffle(colRng, [...KECERMATAN_CHARS]).slice(0, 5);
  const missingIndex = intBetween(rng, 0, 4);
  const answer = pool[missingIndex]!;
  const right = shuffle(rng, pool.filter((_, i) => i !== missingIndex)).join('');
  const left = pool.join('');

  const labels = ['A', 'B', 'C', 'D', 'E'];
  const options: SnapshotOption[] = pool.map((value, index) => ({
    id: optionId(sourceId, index),
    label: labels[index]!,
    text: value,
    isCorrect: value === answer,
    scoreValue: value === answer ? 1 : 0,
    dimensionMap: null,
    media: [],
  }));

  return {
    sourceId,
    type: 'MISSING_ELEMENT',
    stem: `Kolom ${col + 1}: Tentukan huruf yang hilang dari kelompok huruf rujukan.`,
    stemFormat: 'MARKDOWN',
    difficulty: 'MEDIUM',
    weight: 1,
    scale: null,
    isReverse: false,
    pairGroup: null,
    columnIndex,
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

function buildFixture(
  code: SubtestCode,
  count: number,
  seed: string,
  media?: FixtureMediaResolver,
): MaterializedQuestionSeed[] {
  const rng = createRng(hashSeed(`${seed}:${code}`));
  const result: MaterializedQuestionSeed[] = [];

  for (let index = 0; index < count; index += 1) {
    const position = index + 1;
    const externalId = `DEV-${code}-${String(position).padStart(4, '0')}`;
    let snapshot: QuestionSnapshot;

    if (code === 'KEPRIBADIAN') {
      snapshot = buildLikert(rng, externalId, position);
    } else if (code === 'KECERMATAN') {
      snapshot = buildMissingElement(rng, externalId, Math.floor(index / 50));
    } else if (code === 'PASS_HAND') {
      snapshot = buildPassHand(rng, externalId, index);
    } else {
      const topics = code === 'TKK' ? TKK_TOPICS : code === 'TPK' ? TPK_TOPICS : KECERDASAN_TOPICS;
      snapshot = buildChoice(
        rng,
        externalId,
        topics[index % topics.length]!,
        code === 'KECERDASAN' ? 'Tes Kecerdasan' : code === 'TKK' ? 'TKK' : 'TPK',
      );
    }

    // Media fixture hanya dipasang bila pemanggil meminta (F3-06), sehingga
    // jalur produksi tanpa media tetap persis seperti sebelumnya.
    const fixtureMedia = media?.(position, snapshot);
    if (fixtureMedia) snapshot = applyFixtureMedia(snapshot, fixtureMedia);

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

/** Resolver media fixture: dipanggil per posisi, boleh mengembalikan null. */
export type FixtureMediaResolver = (
  position: number,
  snapshot: QuestionSnapshot,
) => FixtureMediaSpec | null;

/**
 * Tempelkan media fixture ke snapshot.
 *
 * Bila ada media opsi, tipe soal dipaksa menjadi `IMAGE_CHOICE` — itu inti
 * soal bergambar: peserta memilih gambar, bukan teks.
 */
export function applyFixtureMedia(
  snapshot: QuestionSnapshot,
  spec: FixtureMediaSpec,
): QuestionSnapshot {
  const hasOptionMedia = Object.keys(spec.options ?? {}).length > 0;

  return {
    ...snapshot,
    type: hasOptionMedia ? 'IMAGE_CHOICE' : snapshot.type,
    media: [...snapshot.media, ...(spec.stem ?? [])],
    options: snapshot.options.map((option, index) => ({
      ...option,
      media: spec.options?.[index] ?? option.media,
    })),
  };
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
    /** Diisi bila media menempel pada opsi tertentu (soal bergambar). */
    optionId: string | null;
    altText: string | null;
    sortOrder: number;
    mediaAsset: { id: string; storagePath: string };
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

  /**
   * Pisahkan media per opsi (F3-05).
   *
   * Media `OPTION` yang tidak punya `optionId` TIDAK dibuang — dimasukkan ke
   * media soal supaya tetap terlihat saat debugging (datanya rusak, bukan
   * hilang tanpa jejak).
   */
  const optionMedia = new Map<string, SnapshotMedia[]>();
  const questionMedia: SnapshotMedia[] = [];

  for (const media of row.media) {
    const entry: SnapshotMedia = {
      role: media.role,
      assetId: media.mediaAsset.id,
      optionId: media.optionId,
      path: media.mediaAsset.storagePath,
      alt: media.altText,
    };

    if (media.role === 'OPTION' && media.optionId) {
      const list = optionMedia.get(media.optionId) ?? [];
      list.push(entry);
      optionMedia.set(media.optionId, list);
    } else {
      questionMedia.push(entry);
    }
  }

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
      media: optionMedia.get(option.id) ?? [],
    })),
    media: questionMedia,
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

/**
 * Asal soal yang dipakai `prepare()`.
 *
 * Dipisahkan dari hasil agar pemanggil (dan log) bisa membedakan "bank soal
 * cukup" dari "fixture dipakai karena pool kurang" tanpa membaca isi snapshot.
 */
export type QuestionSourceKind = 'database' | 'fixture';

export interface PreparedQuestions {
  kind: QuestionSourceKind;
  seeds: MaterializedQuestionSeed[];
  /** Jumlah soal PUBLISHED yang tersedia; 0 bila query gagal/kosong. */
  available: number;
}

/* ------------------------------------------------------------------ service */

@Injectable()
export class ExamQuestionSource {
  private readonly logger = new Logger(ExamQuestionSource.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly config?: AppConfigService,
  ) {}

  /**
   * Menyiapkan soal untuk satu subtes sesi. Deterministik terhadap
   * `subtestSessionId` + kode subtes sehingga materialisasi ulang menghasilkan
   * urutan yang sama (idempoten).
   *
   * `db` WAJIB diteruskan bila dipanggil dari dalam `$transaction`. Memakai
   * root client di dalam transaksi akan meminjam koneksi kedua dari pool
   * (`connection_limit=1`) sehingga transaksi saling menunggu dan timeout.
   *
   * F4-08: fallback fixture tidak lagi senyap.
   *   - `QUESTION_POOL=db` + soal kurang → `503 EXAM_POOL_INSUFFICIENT`
   *     (lebih baik peserta ditolak di awal daripada mengerjakan soal karangan).
   *   - `QUESTION_POOL=dev` → fixture dipakai, tetapi SELALU dicatat di log
   *     sebagai peringatan yang menyebut subtes, kebutuhan, dan ketersediaan.
   */
  async prepare(
    input: {
      subtestSessionId: string;
      subtestCode: SubtestCode;
      count: number;
      /** Fixture bergambar (F3-06); diabaikan bila bank soal DB dipakai. */
      fixtureMedia?: FixtureMediaResolver;
    },
    db: ExamDbClient = this.prisma,
  ): Promise<MaterializedQuestionSeed[]> {
    const prepared = await this.resolve(input, db);
    return prepared.seeds;
  }

  /** Varian `prepare()` yang juga mengembalikan asal soal (untuk log/tes). */
  async resolve(
    input: {
      subtestSessionId: string;
      subtestCode: SubtestCode;
      count: number;
      fixtureMedia?: FixtureMediaResolver;
    },
    db: ExamDbClient = this.prisma,
  ): Promise<PreparedQuestions> {
    const dbQuestions = await this.loadFromDatabase(
      input.subtestCode,
      input.count,
      db,
      input.subtestSessionId,
    );

    if (dbQuestions.length >= input.count) {
      const rng = createRng(hashSeed(input.subtestSessionId));
      return {
        kind: 'database',
        available: dbQuestions.length,
        seeds: shuffle(rng, dbQuestions).map((row, index) => mapDbQuestion(row, index + 1)),
      };
    }

    const detail = `${input.subtestCode}: butuh ${input.count}, tersedia ${dbQuestions.length}`;
    if (this.isStrictPool()) {
      this.logger.error(`Bank soal kurang dan QUESTION_POOL=db — ${detail}`);
      throw new AppError({
        code: 'EXAM_POOL_INSUFFICIENT',
        status: 503,
        message: `Bank soal subtes ${input.subtestCode} belum memenuhi kuota`,
        details: {
          subtestCode: input.subtestCode,
          required: input.count,
          available: dbQuestions.length,
          missing: input.count - dbQuestions.length,
        },
      });
    }

    this.logger.warn(`Fallback fixture dipakai (QUESTION_POOL=dev) — ${detail}`);
    return {
      kind: 'fixture',
      available: dbQuestions.length,
      seeds: buildFixture(
        input.subtestCode,
        input.count,
        input.subtestSessionId,
        input.fixtureMedia,
      ),
    };
  }

  /**
   * Mode ketat ditentukan `QUESTION_POOL`. Bila konfigurasi tidak diinjeksi
   * (mis. skrip/tes), dibaca dari env agar perilakunya sama dengan runtime.
   */
  private isStrictPool(): boolean {
    if (this.config) return this.config.value.QUESTION_POOL === 'db';
    return process.env.QUESTION_POOL === 'db';
  }

  private async loadFromDatabase(
    code: SubtestCode,
    count: number,
    db: ExamDbClient = this.prisma,
    sessionSeed = '',
  ): Promise<QuestionRow[]> {
    const where = {
      subtestCode: code,
      status: 'PUBLISHED' as const,
      deletedAt: null,
    };
    try {
      // Tahap 1: id saja (murah) — cukup untuk memilih irisan pool yang merata.
      const candidates = await db.question.findMany({
        where,
        orderBy: [{ publicCode: 'asc' }, { id: 'asc' }],
        select: { id: true },
        take: QUESTION_POOL_LIMIT,
      });
      if (candidates.length === 0) return [];

      const picked = spreadSelection(
        candidates.map((row) => row.id),
        count,
        hashSeed(`${sessionSeed}:${code}`),
      );

      // Tahap 2: muat relasi hanya untuk soal terpilih.
      const rows = await db.question.findMany({
        where: { id: { in: picked } },
        orderBy: [{ publicCode: 'asc' }, { id: 'asc' }],
        include: {
          options: { orderBy: { sortOrder: 'asc' } },
          media: { include: { mediaAsset: true }, orderBy: { sortOrder: 'asc' } },
        },
      });
      return rows as unknown as QuestionRow[];
    } catch {
      // Database belum tersedia / tabel belum dimigrasi → pakai fixture.
      return [];
    }
  }
}
