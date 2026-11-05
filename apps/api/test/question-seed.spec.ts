import { describe, expect, it } from 'vitest';
import { questionShapeIssues, type QuestionShapeInput } from '@webcat/contracts';
import {
  buildSeedQuestions,
  QUESTION_CATEGORIES,
  type SeedQuestion,
} from '../prisma/seed/questions';

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
      contentText: option.contentText,
      isCorrect: option.isCorrect,
      scoreValue: option.scoreValue,
      sortOrder: index,
    })),
    media: [],
    tags: [...question.tags],
    columnIndex: question.columnIndex,
  };
}

describe('komposisi bank soal', () => {
  it('memenuhi kuota setiap subtes agar bank DB dipakai mesin ujian', () => {
    expect(only('KECERDASAN')).toHaveLength(100);
    expect(only('KEPRIBADIAN').length).toBeGreaterThanOrEqual(140);
    expect(only('KECERMATAN')).toHaveLength(500);
    expect(only('PASS_HAND')).toHaveLength(150);
    expect(only('TPK')).toHaveLength(100);
  });

  it('memakai kode publik unik', () => {
    const codes = questions.map((question) => question.publicCode);
    expect(new Set(codes).size).toBe(codes.length);
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

  it('kecerdasan memuat verbal, numerik, dan logika', () => {
    const topics = new Set(only('KECERDASAN').map((question) => question.categoryPath));
    expect(topics).toEqual(
      new Set([
        'psikologi/kecerdasan/verbal',
        'psikologi/kecerdasan/numerik',
        'psikologi/kecerdasan/logis',
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
    for (const question of only('KECERDASAN').concat(only('TPK'), only('KECERMATAN'))) {
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

  it('memakai tiga kategori varian karakter', () => {
    const paths = new Set(only('KECERMATAN').map((question) => question.categoryPath));
    expect(paths).toEqual(
      new Set([
        'psikologi/kecermatan/angka',
        'psikologi/kecermatan/huruf',
        'psikologi/kecermatan/simbol',
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
