/**
 * Fixture soal deterministik untuk pengembangan tanpa database.
 *
 * Komposisi mengikuti struktur ujian final:
 *   KECERDASAN   100
 *   KEPRIBADIAN  140  (Likert 1–5)
 *   KECERMATAN   500
 *   PASS_HAND    150  (kolom)
 *   TPA          100
 *   TPK          100
 *   -----------------
 *   TOTAL       1090
 *
 * Catatan: `plan.md` menyebut "±760 soal" di beberapa tempat sebagai
 * perkiraan lama; angka yang mengikat adalah konfigurasi subtes di
 * `exam.seed.ts` (890 soal psikologi + 100 TPA + 100 TPK = 1090).
 */
import type { StageCode, SubtestCode } from '@webcat/contracts';
import { createRng, intBetween, pick, shuffle } from './rng';

export const FIXTURE_SEED = 20260101;

export type QuestionKind = 'MULTIPLE_CHOICE' | 'LIKERT' | 'COLUMN_MATCH';

export interface FixtureOption {
  key: string;
  text: string;
}

export interface BaseFixtureQuestion {
  id: string;
  subtestCode: SubtestCode;
  stageCode: StageCode;
  orderIndex: number;
  kind: QuestionKind;
  stem: string;
  difficulty: 1 | 2 | 3;
  topic: string;
}

export interface MultipleChoiceFixture extends BaseFixtureQuestion {
  kind: 'MULTIPLE_CHOICE';
  options: FixtureOption[];
  correctKey: string;
}

export interface LikertFixture extends BaseFixtureQuestion {
  kind: 'LIKERT';
  scale: 5;
  /** Dimensi kepribadian yang diukur. */
  dimension: string;
  /** Arah skor: 1 = langsung, -1 = terbalik. */
  polarity: 1 | -1;
}

export interface ColumnMatchFixture extends BaseFixtureQuestion {
  kind: 'COLUMN_MATCH';
  /** Deret simbol yang harus dicocokkan. */
  symbols: string[];
  /** Kunci jawaban per kolom. */
  answerKey: string[];
}

export type FixtureQuestion = MultipleChoiceFixture | LikertFixture | ColumnMatchFixture;

export interface SubtestSpec {
  subtestCode: SubtestCode;
  stageCode: StageCode;
  count: number;
  kind: QuestionKind;
}

export const SUBTEST_SPECS: readonly SubtestSpec[] = [
  { subtestCode: 'KECERDASAN', stageCode: 'PSIKOLOGI', count: 100, kind: 'MULTIPLE_CHOICE' },
  { subtestCode: 'KEPRIBADIAN', stageCode: 'PSIKOLOGI', count: 140, kind: 'LIKERT' },
  { subtestCode: 'KECERMATAN', stageCode: 'PSIKOLOGI', count: 500, kind: 'MULTIPLE_CHOICE' },
  { subtestCode: 'PASS_HAND', stageCode: 'PSIKOLOGI', count: 150, kind: 'COLUMN_MATCH' },
  { subtestCode: 'TPA', stageCode: 'TPA', count: 100, kind: 'MULTIPLE_CHOICE' },
  { subtestCode: 'TPK', stageCode: 'TPK', count: 100, kind: 'MULTIPLE_CHOICE' },
] as const;

export const TOTAL_FIXTURE_QUESTIONS = SUBTEST_SPECS.reduce((sum, spec) => sum + spec.count, 0);

const KECERDASAN_TOPICS = [
  'Deret Angka',
  'Analogi Verbal',
  'Silogisme',
  'Aritmetika',
  'Figural',
  'Klasifikasi',
] as const;

const KECERMATAN_TOPICS = ['Kode Angka', 'Kode Huruf', 'Simbol', 'Kombinasi'] as const;

const TPA_TOPICS = ['Verbal', 'Numerik', 'Penalaran Logis'] as const;

const TPK_TOPICS = [
  'Struktur Organisasi Polri',
  'Hukum Kepolisian',
  'Etika Profesi',
  'Tugas Pokok Polri',
  'Lalu Lintas',
] as const;

const DIMENSIONS = ['KEPEMIMPINAN', 'KERJASAMA', 'STABILITAS'] as const;

const SYMBOLS = ['◆', '●', '▲', '■', '★', '✚', '✖', '⬟'] as const;

const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

function buildMultipleChoice(
  rng: () => number,
  subtestCode: SubtestCode,
  stageCode: StageCode,
  index: number,
  topics: readonly string[],
  label: string,
): MultipleChoiceFixture {
  const topic = pick(rng, topics);
  const base = intBetween(rng, 2, 19);
  const step = intBetween(rng, 2, 9);
  const sequence = Array.from({ length: 4 }, (_, i) => base + i * step);
  const correct = sequence[3] + step;

  const options = shuffle(rng, [
    correct,
    correct + intBetween(rng, 1, 3),
    correct - intBetween(rng, 1, 3),
    correct + intBetween(rng, 4, 7),
  ]).map((value, optionIndex) => ({
    key: LETTERS[optionIndex] as string,
    text: String(value),
  }));

  const correctKey =
    options.find((option) => option.text === String(correct))?.key ?? 'A';

  return {
    id: `${subtestCode}-${String(index + 1).padStart(4, '0')}`,
    subtestCode,
    stageCode,
    orderIndex: index + 1,
    kind: 'MULTIPLE_CHOICE',
    stem: `${label} #${index + 1} (${topic}) — lanjutkan deret: ${sequence.join(', ')}, ?`,
    difficulty: (intBetween(rng, 1, 3) as 1 | 2 | 3),
    topic,
    options,
    correctKey,
  };
}

function buildLikert(
  rng: () => number,
  index: number,
): LikertFixture {
  const dimension = pick(rng, DIMENSIONS);
  return {
    id: `KEPRIBADIAN-${String(index + 1).padStart(4, '0')}`,
    subtestCode: 'KEPRIBADIAN',
    stageCode: 'PSIKOLOGI',
    orderIndex: index + 1,
    kind: 'LIKERT',
    stem: `Pernyataan ${index + 1}: Saya ${pick(rng, [
      'mudah bekerja sama dengan rekan baru',
      'tetap tenang saat menghadapi tekanan',
      'berani mengambil keputusan sulit',
      'mendahulukan kepentingan tim',
      'cepat menyesuaikan diri di lingkungan baru',
    ])}.`,
    difficulty: 1,
    topic: dimension,
    scale: 5,
    dimension,
    polarity: rng() > 0.75 ? -1 : 1,
  };
}

function buildColumnMatch(rng: () => number, index: number): ColumnMatchFixture {
  const symbols = Array.from({ length: 5 }, () => pick(rng, SYMBOLS));
  const answerKey = symbols.map(() => pick(rng, LETTERS));
  return {
    id: `PASS_HAND-${String(index + 1).padStart(4, '0')}`,
    subtestCode: 'PASS_HAND',
    stageCode: 'PSIKOLOGI',
    orderIndex: index + 1,
    kind: 'COLUMN_MATCH',
    stem: `Kolom ${index + 1}: cocokkan simbol dengan kode huruf yang benar.`,
    difficulty: (intBetween(rng, 1, 2) as 1 | 2),
    topic: 'Pass Hand',
    symbols,
    answerKey,
  };
}

/** Membangun seluruh fixture. Deterministik untuk seed yang sama. */
export function buildFixtures(seed = FIXTURE_SEED): FixtureQuestion[] {
  const questions: FixtureQuestion[] = [];

  for (const spec of SUBTEST_SPECS) {
    // RNG terpisah per subtes: menambah soal di satu subtes tidak mengubah
    // isi subtes lain (snapshot lebih stabil).
    const rng = createRng(seed + spec.subtestCode.length * 7919 + spec.count);

    for (let index = 0; index < spec.count; index += 1) {
      if (spec.kind === 'LIKERT') {
        questions.push(buildLikert(rng, index));
        continue;
      }
      if (spec.kind === 'COLUMN_MATCH') {
        questions.push(buildColumnMatch(rng, index));
        continue;
      }

      const topics =
        spec.subtestCode === 'KECERMATAN'
          ? KECERMATAN_TOPICS
          : spec.subtestCode === 'TPA'
            ? TPA_TOPICS
            : spec.subtestCode === 'TPK'
              ? TPK_TOPICS
              : KECERDASAN_TOPICS;

      const label =
        spec.subtestCode === 'KECERMATAN'
          ? 'Kecermatan'
          : spec.subtestCode === 'TPA'
            ? 'TPA'
            : spec.subtestCode === 'TPK'
              ? 'TPK'
              : 'Kecerdasan';

      questions.push(
        buildMultipleChoice(rng, spec.subtestCode, spec.stageCode, index, topics, label),
      );
    }
  }

  return questions;
}

/** Fixture per subtes, dipakai MSW handler. */
export function buildFixturesBySubtest(seed = FIXTURE_SEED): Record<SubtestCode, FixtureQuestion[]> {
  const grouped = {
    KECERDASAN: [],
    KEPRIBADIAN: [],
    KECERMATAN: [],
    PASS_HAND: [],
    TPA: [],
    TPK: [],
  } as Record<SubtestCode, FixtureQuestion[]>;

  for (const question of buildFixtures(seed)) {
    grouped[question.subtestCode].push(question);
  }

  return grouped;
}

/**
 * Soal untuk sesi ujian: TANPA `correctKey`/`answerKey`.
 * Kunci jawaban tidak boleh pernah dikirim ke browser peserta.
 */
export function toClientQuestion(question: FixtureQuestion): Record<string, unknown> {
  const { correctKey: _correctKey, answerKey: _answerKey, ...safe } = question as FixtureQuestion & {
    correctKey?: string;
    answerKey?: string[];
  };
  void _correctKey;
  void _answerKey;
  return safe as unknown as Record<string, unknown>;
}
