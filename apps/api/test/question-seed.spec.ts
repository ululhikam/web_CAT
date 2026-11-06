import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { questionShapeIssues, type QuestionShapeInput } from '@webcat/contracts';
import {
  buildSeedQuestions,
  QUESTION_CATEGORIES,
  type SeedQuestion,
} from '../prisma/seed/questions';
import { ScoringService } from '../src/modules/scoring/scoring.service';

/**
 * Uji bank soal realistis sebelum di-seed.
 *
 * Test ini tidak menyentuh database: seluruhnya memeriksa data yang dihasilkan
 * `buildSeedQuestions()` sehingga kesalahan isi (jumlah, kunci ganda, opsi
 * duplikat, dimensi salah) tertangkap sebelum `pnpm prisma:seed` dijalankan.
 */

const questions = buildSeedQuestions();

function only(code: SeedQuestion['subtestCode']): SeedQuestion[] {
  return questions.filter((question) => question.subtestCode === code);
}

/**
 * UUID v4 deterministik dari kode aset.
 *
 * Test bentuk soal tidak butuh database; id palsu yang stabil sudah cukup
 * untuk memenuhi `mediaAssetId: uuid` di kontrak.
 */
function mediaAssetId(assetCode: string): string {
  const hex = createHash('sha1').update(`asset:${assetCode}`).digest('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(
    17,
    20,
  )}-${hex.slice(20, 32)}`;
}

function shapeInput(question: SeedQuestion): QuestionShapeInput {
  return {
    publicCode: question.publicCode,
    stageCode: question.stageCode,
    subtestCode: question.subtestCode,
    type: question.type,
    status: 'PUBLISHED',
    difficulty: question.difficulty,
    stemText: question.stemText,
    stemFormat: 'MARKDOWN',
    weight: 1,
    dedupeOverride: question.dedupeOverride,
    options: question.options.map((option, index) => ({
      label: option.label,
      ...(option.contentText === null ? {} : { contentText: option.contentText }),
      isCorrect: option.isCorrect,
      scoreValue: option.scoreValue,
      sortOrder: index,
    })),
    // Media divalidasi dengan id aset deterministik dari kode aset: yang diuji
    // di sini adalah aturan bentuk (STEM/OPTION), bukan baris `media_assets`.
    media: question.media.map((entry, index) => ({
      mediaAssetId: mediaAssetId(entry.assetCode),
      role: entry.role,
      ...(entry.optionLabel ? { optionLabel: entry.optionLabel } : {}),
      sortOrder: entry.sortOrder ?? index,
    })),
    tags: [...question.tags],
    columnIndex: question.columnIndex,
  };
}

describe('komposisi bank soal', () => {
  it('memenuhi kuota setiap subtes agar bank DB dipakai mesin ujian', () => {
    // Kuota subtes (exam.seed.ts) harus terpenuhi; kelebihan diperbolehkan
    // karena pool dipilih acak per sesi.
    expect(only('KECERDASAN').length).toBeGreaterThanOrEqual(100);
    expect(only('KEPRIBADIAN').length).toBeGreaterThanOrEqual(140);
    expect(only('KECERMATAN')).toHaveLength(500);
    expect(only('PASS_HAND')).toHaveLength(150);
    expect(only('TPK')).toHaveLength(100);
    // F4-03/F4-04: TKK kini punya bank soal penuh, bukan hanya soal figural.
    expect(only('TKK').length).toBeGreaterThanOrEqual(100);
  });

  it('TKK terbagi ke perangkat keras, perangkat lunak, jaringan, keamanan, dan penalaran', () => {
    const tkk = only('TKK');
    const perCategory = new Map<string, number>();
    for (const question of tkk) {
      perCategory.set(question.categoryPath, (perCategory.get(question.categoryPath) ?? 0) + 1);
    }

    expect(perCategory.get('tkk/perangkat-keras')).toBeGreaterThanOrEqual(20);
    expect(perCategory.get('tkk/perangkat-lunak')).toBeGreaterThanOrEqual(18);
    expect(perCategory.get('tkk/jaringan')).toBeGreaterThanOrEqual(18);
    expect(perCategory.get('tkk/keamanan')).toBeGreaterThanOrEqual(17);
    expect(perCategory.get('tkk/penalaran')).toBeGreaterThanOrEqual(14);
  });

  it('memakai kode publik unik', () => {
    const codes = questions.map((question) => question.publicCode);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('pengecoh numerik sepadan besaran dengan kunci (bukan +1 pada angka ribuan)', () => {
    // Kunci ribuan (mis. harga Rp68.000) harus berpengecoh kelipatan 1.000;
    // `68.001` menandai kunci dan mustahil dipilih peserta.
    const numeric = only('TKK').filter(
      (question) => question.options.length === 5 && /^\d+$/.test(question.options.find((option) => option.isCorrect)?.contentText ?? ''),
    );

    expect(numeric.length).toBeGreaterThan(0);

    for (const question of numeric) {
      const key = Number(question.options.find((option) => option.isCorrect)?.contentText);
      if (key < 1_000 || key % 1_000 !== 0) continue;

      for (const option of question.options) {
        const value = Number(option.contentText);
        if (option.isCorrect) continue;
        expect(
          value % 1_000,
          `${question.publicCode}: pengecoh ${value} tidak sepadan dengan kunci ${key}`,
        ).toBe(0);
      }
    }
  });

  it('setiap path kategori soal tersedia pada taksonomi seed', () => {
    const known = new Set(QUESTION_CATEGORIES.map((category) => category.path));
    const missing = [
      ...new Set(
        questions.map((question) => question.categoryPath).filter((path) => !known.has(path)),
      ),
    ];
    expect(missing).toEqual([]);
  });

  it('TPK terbagi 10 soal untuk setiap 10 kelompok materi', () => {
    const perTopic = new Map<string, number>();
    for (const question of only('TPK')) {
      perTopic.set(question.categoryPath, (perTopic.get(question.categoryPath) ?? 0) + 1);
    }
    expect(perTopic.size).toBe(10);
    expect([...perTopic.values()]).toEqual(new Array(10).fill(10));
  });

  it('kecerdasan memuat verbal, numerik, logika, dan figural', () => {
    const topics = new Set(only('KECERDASAN').map((question) => question.categoryPath));
    expect(topics).toEqual(
      new Set([
        'psikologi/kecerdasan/verbal',
        'psikologi/kecerdasan/numerik',
        'psikologi/kecerdasan/logis',
        'psikologi/kecerdasan/figural',
        'psikologi/kecerdasan/petadenah',
        'psikologi/kecerdasan/kepribadian',
      ]),
    );
  });
});

describe('bentuk soal', () => {
  it('semua soal lolos validasi kontrak', () => {
    const issues = questions.flatMap((question) =>
      questionShapeIssues(shapeInput(question)).map((issue) => `${question.publicCode}: ${issue}`),
    );
    expect(issues).toEqual([]);
  });

  it('soal pilihan tunggal punya tepat satu kunci dan lima opsi unik', () => {
    const textChoice = only('KECERDASAN')
      .concat(only('TPK'), only('KECERMATAN'), only('TKK'))
      .filter((question) => question.type !== 'IMAGE_CHOICE' && question.type !== 'MULTI_CHOICE');

    for (const question of textChoice) {
      expect(question.options, question.publicCode).toHaveLength(5);
      expect(
        question.options.filter((option) => option.isCorrect),
        question.publicCode,
      ).toHaveLength(1);

      const labels = question.options.map((option) => option.label);
      expect(new Set(labels).size, question.publicCode).toBe(5);

      const texts = question.options.map((option) => option.contentText);
      expect(new Set(texts).size, question.publicCode).toBe(5);
    }
  });

  it('kunci pilihan ganda tersebar di lebih dari satu label', () => {
    const labels = new Set<string>();
    for (const question of only('KECERDASAN').concat(only('TPK'))) {
      const key = question.options.find((option) => option.isCorrect)?.label;
      expect(key).toBeDefined();
      labels.add(key!);
    }
    expect(labels.size).toBeGreaterThanOrEqual(4);
  });

  it('soal likert memakai lima opsi skala dan tidak punya kunci benar', () => {
    for (const question of only('KEPRIBADIAN')) {
      expect(question.options).toHaveLength(5);
      expect(question.options.map((option) => option.label)).toEqual(['1', '2', '3', '4', '5']);
      expect(question.options.some((option) => option.isCorrect)).toBe(false);
      expect(question.options.map((option) => option.scoreValue)).toEqual([1, 2, 3, 4, 5]);
      expect(question.columnIndex).toBeNull();
    }
  });
});

describe('kelengkapan media soal bergambar (F3-26)', () => {
  const imageChoice = questions.filter((question) => question.type === 'IMAGE_CHOICE');

  it('seed memuat soal bergambar untuk Kecerdasan', () => {
    expect(imageChoice.length).toBeGreaterThanOrEqual(20);
    expect(new Set(imageChoice.map((question) => question.subtestCode))).toEqual(
      new Set(['KECERDASAN']),
    );
  });

  it('setiap soal bergambar punya tepat satu media STEM', () => {
    for (const question of imageChoice) {
      const stem = question.media.filter((entry) => entry.role === 'STEM');
      expect(stem, question.publicCode).toHaveLength(1);
      expect(stem[0]!.assetCode, question.publicCode).toMatch(/^FIG-/);
      expect(stem[0]!.altText?.length ?? 0, question.publicCode).toBeGreaterThan(3);
    }
  });

  it('setiap opsi soal bergambar punya media OPTION sendiri', () => {
    for (const question of imageChoice) {
      const labels = question.options.map((option) => option.label);
      const withMedia = question.media
        .filter((entry) => entry.role === 'OPTION')
        .map((entry) => entry.optionLabel);

      expect(new Set(withMedia).size, question.publicCode).toBe(labels.length);
      expect([...withMedia].sort(), question.publicCode).toEqual([...labels].sort());
    }
  });

  it('media OPTION hanya dipakai soal bergambar dan selalu menyebut label', () => {
    for (const question of questions) {
      const optionMedia = question.media.filter((entry) => entry.role === 'OPTION');
      if (question.type !== 'IMAGE_CHOICE') {
        expect(optionMedia, question.publicCode).toEqual([]);
        continue;
      }
      for (const entry of optionMedia) {
        expect(entry.optionLabel, question.publicCode).toBeTruthy();
      }
    }
  });

  it('stem bergambar tanpa opsi gambar tetap punya satu media STEM', () => {
    const textWithStem = questions.filter(
      (question) => question.type === 'SINGLE_CHOICE' && question.media.length > 0,
    );

    expect(textWithStem.length).toBeGreaterThan(0);
    for (const question of textWithStem) {
      expect(question.media, question.publicCode).toHaveLength(1);
      expect(question.media[0]!.role, question.publicCode).toBe('STEM');
    }
  });

  it('opsi bergambar tidak menyimpan teks dan kuncinya tepat satu', () => {
    for (const question of imageChoice) {
      const correct = question.options.filter((option) => option.isCorrect);
      expect(correct, question.publicCode).toHaveLength(1);
      for (const option of question.options) {
        expect(option.contentText, `${question.publicCode}/${option.label}`).toBeNull();
      }
    }
  });
});

describe('pilihan ganda banyak jawaban (F4-05)', () => {
  const multi = questions.filter((question) => question.type === 'MULTI_CHOICE');

  it('minimal lima soal tersebar di Kecerdasan dan TKK', () => {
    expect(multi.length).toBeGreaterThanOrEqual(5);
    expect(new Set(multi.map((question) => question.subtestCode))).toEqual(
      new Set(['KECERDASAN', 'TKK']),
    );
  });

  it('punya 2–4 kunci dan tepat lima opsi unik', () => {
    for (const question of multi) {
      const correct = question.options.filter((option) => option.isCorrect);
      expect(correct.length, question.publicCode).toBeGreaterThanOrEqual(2);
      expect(correct.length, question.publicCode).toBeLessThanOrEqual(4);

      expect(question.options, question.publicCode).toHaveLength(5);
      const texts = question.options.map((option) => option.contentText);
      expect(new Set(texts).size, question.publicCode).toBe(5);
      expect(texts.some((text) => text === null), question.publicCode).toBe(false);
    }
  });

  it('memakai strategi MULTI_CORRECT_PARTIAL dan bobot kunci 1', () => {
    for (const question of multi) {
      expect(question.scoringStrategy, question.publicCode).toBe('MULTI_CORRECT_PARTIAL');
      expect(question.scoringConfig.wrongPenalty, question.publicCode).toBe(0.5);
      for (const option of question.options) {
        expect(option.scoreValue, `${question.publicCode}/${option.label}`).toBe(
          option.isCorrect ? 1 : 0,
        );
      }
    }
  });

  it('tidak menghasilkan skor benar bila hanya sebagian kunci dipilih', () => {
    // Kontrak skor subtes memakai KEYED_CORRECT: skor penuh hanya bila
    // himpunan terpilih sama dengan kunci, jadi memilih sebagian = salah.
    const sample = multi[0]!;
    const correct = sample.options.filter((option) => option.isCorrect);
    const chosen = correct.slice(0, correct.length - 1).map((option) => `${sample.publicCode}-${option.label}`);

    const score = new ScoringService().score({
      strategy: 'KEYED_CORRECT',
      config: {},
      questionCount: 1,
      durationMinutes: 10,
      answers: [
        {
          questionId: 'q-1',
          position: 1,
          columnIndex: null,
          snapshot: {
            sourceId: sample.publicCode,
            type: 'MULTI_CHOICE',
            stem: sample.stemText,
            stemFormat: 'MARKDOWN',
            difficulty: sample.difficulty,
            weight: 1,
            scale: null,
            isReverse: false,
            pairGroup: null,
            columnIndex: null,
            columnNumbers: null,
            missingElement: null,
            media: [],
            options: sample.options.map((option) => ({
              id: `${sample.publicCode}-${option.label}`,
              label: option.label,
              text: option.contentText,
              isCorrect: option.isCorrect,
              scoreValue: option.scoreValue,
              dimensionMap: null,
              media: [],
            })),
          },
          answer: { optionIds: chosen },
          timeSpentMs: 1000,
        },
      ],
    });

    expect(score.correct).toBe(0);
    expect(score.wrong).toBe(1);
    expect(score.percentage).toBe(0);
  });
});

describe('kecermatan', () => {
  it('menghapus tepat satu karakter dari larik kiri menghasilkan larik kanan', () => {
    const variantChars = new Set<string>();

    for (const question of only('KECERMATAN')) {
      const config = question.scoringConfig.missingElement as {
        left: string;
        right: string;
        answer: string;
      };

      expect(question.type).toBe('MISSING_ELEMENT');
      expect(config.right).toHaveLength(config.left.length - 1);

      // Hapus tepat satu kemunculan kunci (bisa jadi karakter itu muncul
      // lebih dari sekali pada larik).
      const removedAt = config.left
        .split('')
        .map((char, index) =>
          char === config.answer
            ? `${config.left.slice(0, index)}${config.left.slice(index + 1)}`
            : null,
        )
        .find((candidate) => candidate === config.right);
      expect(removedAt, question.publicCode).toBe(config.right);

      // Kunci harus muncul pada opsi dan hanya satu opsi yang benar.
      const correct = question.options.filter((option) => option.isCorrect);
      expect(correct).toHaveLength(1);
      expect(correct[0]!.contentText).toBe(config.answer);

      for (const char of config.left) variantChars.add(char);
    }

    expect(variantChars.size).toBeGreaterThan(20);
  });

  it('memakai varian karakter huruf', () => {
    const paths = new Set(only('KECERMATAN').map((question) => question.categoryPath));
    expect(paths).toEqual(
      new Set([
        'psikologi/kecermatan/huruf',
      ]),
    );
  });
});

describe('pass hand', () => {
  it('memiliki 150 kolom dengan columnIndex unik dan berurutan', () => {
    const columns = only('PASS_HAND');
    expect(columns).toHaveLength(150);
    expect(columns.map((question) => question.columnIndex)).toEqual(
      Array.from({ length: 150 }, (_value, index) => index),
    );
  });

  it('setiap kolom memuat dua baris berisi 20 digit 0–9', () => {
    for (const question of only('PASS_HAND')) {
      const numbers = question.scoringConfig.columnNumbers as number[];
      expect(numbers, question.publicCode).toHaveLength(40);
      for (const value of numbers) {
        expect(Number.isInteger(value), question.publicCode).toBe(true);
        expect(value, question.publicCode).toBeGreaterThanOrEqual(0);
        expect(value, question.publicCode).toBeLessThanOrEqual(9);
      }
      expect(question.options).toEqual([]);
      expect(question.type).toBe('PASS_HAND_COLUMN');
    }
  });
});

describe('kepribadian', () => {
  const likert = only('KEPRIBADIAN');

  it('hanya memakai dimensi yang dikonfigurasi subtes', () => {
    const allowed = new Set(['KEPEMIMPINAN', 'KERJASAMA', 'STABILITAS']);

    for (const question of likert) {
      const keys = Object.keys(question.options[0]!.dimensionMap ?? {});
      expect(keys, question.publicCode).toHaveLength(1);
      expect(allowed.has(keys[0]!), question.publicCode).toBe(true);
    }
  });

  it('menyimpan skala 5 dan penanda arah item pada scoringConfig', () => {
    for (const question of likert) {
      expect(question.scoringConfig.scale, question.publicCode).toBe(5);
      expect(typeof question.scoringConfig.isReverse, question.publicCode).toBe('boolean');
    }
  });

  it('pairGroup berisi tepat dua item dengan dimensi sama', () => {
    const groups = new Map<string, SeedQuestion[]>();

    for (const question of likert) {
      if (!question.pairGroup) continue;
      const members = groups.get(question.pairGroup) ?? [];
      members.push(question);
      groups.set(question.pairGroup, members);
    }

    expect(groups.size).toBeGreaterThan(0);
    for (const [group, members] of groups) {
      expect(members, group).toHaveLength(2);
      const dimensions = new Set(
        members.map((member) => Object.keys(member.options[0]!.dimensionMap ?? {})[0]),
      );
      expect(dimensions.size, group).toBe(1);

      // Satu item positif dan satu terbalik agar uji konsistensi bermakna.
      const reversed = members.map((member) => member.scoringConfig.isReverse);
      expect(new Set(reversed).size, group).toBe(2);
    }
  });

  it('F4-06: setiap pairGroup punya anggota genap dan minimal satu item terbalik', () => {
    const byPair = new Map<string, SeedQuestion[]>();
    for (const question of likert) {
      if (!question.pairGroup) continue;
      byPair.set(question.pairGroup, [...(byPair.get(question.pairGroup) ?? []), question]);
    }

    // Setiap pasangan harus memuat >= 1 item terbalik supaya skor dimensi
    // tidak bisa dinaikkan hanya dengan menjawab "sangat setuju" di semua item.
    for (const [pair, items] of byPair) {
      expect(items.length % 2, `pair ${pair} berjumlah ${items.length}`).toBe(0);
      const reversed = items.filter((item) => item.scoringConfig.isReverse === true);
      expect(reversed.length, `pair ${pair} tanpa item terbalik`).toBeGreaterThanOrEqual(1);
    }
  });

  it('F4-06: ketiga dimensi terwakili dan item terbalik tersebar', () => {
    const perDimension = new Map<string, { total: number; reversed: number }>();

    for (const question of likert) {
      const dimension = Object.keys(question.options[0]!.dimensionMap ?? {})[0]!;
      const entry = perDimension.get(dimension) ?? { total: 0, reversed: 0 };
      entry.total += 1;
      if (question.scoringConfig.isReverse === true) entry.reversed += 1;
      perDimension.set(dimension, entry);
    }

    expect([...perDimension.keys()].sort()).toEqual(['KEPEMIMPINAN', 'KERJASAMA', 'STABILITAS']);
    for (const [dimension, entry] of perDimension) {
      expect(entry.total, dimension).toBeGreaterThan(30);
      // Item terbalik harus ada, tetapi tidak mendominasi (30–50%).
      expect(entry.reversed / entry.total, dimension).toBeGreaterThan(0.2);
      expect(entry.reversed / entry.total, dimension).toBeLessThan(0.6);
    }
  });
});

describe('dedupe', () => {
  it('soal bertanda dedupeOverride=false tidak memiliki hash duplikat', () => {
    const seen = new Map<string, string[]>();

    for (const question of questions.filter((item) => !item.dedupeOverride)) {
      const key = `${question.stageCode}|${question.subtestCode}|${question.dedupeHash}`;
      seen.set(key, [...(seen.get(key) ?? []), question.publicCode]);
    }

    const duplicates = [...seen.entries()].filter(([, codes]) => codes.length > 1);
    expect(duplicates).toEqual([]);
  });

  it('soal bangkitan menandai dedupeOverride agar tidak bentrok unique index', () => {
    for (const question of only('KECERMATAN').concat(only('PASS_HAND'))) {
      expect(question.dedupeOverride, question.publicCode).toBe(true);
    }
    for (const question of only('KECERDASAN').concat(only('KEPRIBADIAN'), only('TPK'))) {
      expect(question.dedupeOverride, question.publicCode).toBe(false);
    }
  });

  it('menyimpan dedupeHash sha256 64 karakter heksadesimal', () => {
    for (const question of questions.slice(0, 25)) {
      expect(question.dedupeHash).toMatch(/^[0-9a-f]{64}$/);
    }
  });
});
