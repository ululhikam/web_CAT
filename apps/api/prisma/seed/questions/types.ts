/**
 * Tipe data mentah bank soal realistis untuk seed.
 *
 * File data sengaja tidak mengimpor `@prisma/client` agar dapat diuji murni
 * (lihat `apps/api/test/question-seed.spec.ts`). Pemetaan ke model Prisma
 * dilakukan di `questions/index.ts`.
 */

export type SeedDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type ChoiceLabel = 'A' | 'B' | 'C' | 'D' | 'E';

/* -------------------------------------------------------------------- media */

export type SeedMediaRole = 'STEM' | 'OPTION';

/**
 * Referensi media pada data seed.
 *
 * Yang disimpan adalah **kode aset** (`FIG-SERIES-0-A`), bukan id database:
 * id baru diketahui setelah `seedMediaAssets()` berjalan di database target.
 */
export interface SeedQuestionMedia {
  role: SeedMediaRole;
  /** Kode aset dari `seed/questions/figural.ts` → `figureAssetCode()`. */
  assetCode: string;
  /** Wajib untuk `OPTION`; harus sama dengan label opsi yang bersangkutan. */
  optionLabel?: ChoiceLabel;
  altText?: string;
  sortOrder?: number;
}

/* --------------------------------------------------------------- pilihan ganda */

/** Soal pilihan ganda tertulis sebelum diberi kode & path kategori. */
export interface WrittenQuestion {
  /** Subkategori daun, mis. `verbal` → `<prefix>/verbal`. */
  topic: string;
  difficulty: SeedDifficulty;
  stem: string;
  /** Lima opsi berurutan; label dibentuk otomatis A–E. */
  options: readonly [string, string, string, string, string];
  /** Label opsi yang benar pada urutan `options` di atas. */
  answer: ChoiceLabel;
  explanation: string;
  tags: readonly string[];
}

/** Soal pilihan ganda yang sudah final (opsi sudah diacak). */
export interface ChoiceQuestionData {
  /** Kode publik unik, mis. `PSI-KEC-001`. */
  code: string;
  /** Path kategori, mis. `psikologi/kecerdasan/verbal`. */
  categoryPath: string;
  difficulty: SeedDifficulty;
  stem: string;
  options: readonly [string, string, string, string, string];
  answer: ChoiceLabel;
  explanation: string;
  tags: readonly string[];
}

/* ------------------------------------------------------------ pilihan ganda banyak */

/**
 * Soal pilihan ganda banyak jawaban (`MULTI_CHOICE`) sebelum diberi kode.
 *
 * Ditulis dengan **teks** opsi benar, bukan label, karena urutan opsi diacak
 * deterministik saat dibangun. Dengan begitu penulis soal tidak perlu tahu
 * label akhir kunci (sumber kesalahan yang sama seperti `WrittenQuestion`).
 */
export interface WrittenMultiChoice {
  /** Subkategori daun, mis. `penalaran` → `<prefix>/penalaran`. */
  topic: string;
  difficulty: SeedDifficulty;
  stem: string;
  /** Teks opsi yang benar; minimal 2 agar tidak sama dengan pilihan tunggal. */
  correct: readonly string[];
  /** Pengecoh; dilengkapi sampai lima opsi bila kurang. */
  distractors: readonly string[];
  explanation: string;
  tags: readonly string[];
}

/** Soal pilihan ganda banyak jawaban yang sudah final (opsi sudah diacak). */
export interface MultiChoiceQuestionData {
  code: string;
  categoryPath: string;
  difficulty: SeedDifficulty;
  stem: string;
  options: readonly [string, string, string, string, string];
  /** Label semua opsi benar pada urutan `options` di atas (≥ 2). */
  answers: readonly ChoiceLabel[];
  explanation: string;
  tags: readonly string[];
}
/* ---------------------------------------------------------------- kepribadian */

export type LikertPolarity = 'POSITIVE' | 'REVERSE';

/** Pernyataan Kepribadian sebelum diberi kode. */
export interface LikertSeedRow {
  statement: string;
  /** Dimensi yang diukur; sesuai `scoringConfig.dimensions` subtes. */
  dimension: string;
  /**
   * `POSITIVE` = makin setuju makin tinggi skor dimensi.
   * `REVERSE`  = item terbalik (makin setuju makin rendah skor dimensi).
   */
  polarity: LikertPolarity;
  /** Dua item dalam grup yang sama mengukur hal serupa (uji konsistensi). */
  pairGroup?: string;
  difficulty?: SeedDifficulty;
  tags: readonly string[];
}

/** Pernyataan Kepribadian yang sudah final. */
export interface LikertQuestionData {
  code: string;
  statement: string;
  dimension: string;
  polarity: LikertPolarity;
  pairGroup?: string;
  difficulty: SeedDifficulty;
  tags: readonly string[];
}

/* ----------------------------------------------------------------- kecermatan */

/**
 * Soal Kecermatan (elemen hilang).
 *
 * `left` adalah larik lengkap, `right` adalah larik yang satu elemennya
 * dihapus. Peserta memilih karakter yang hilang dari lima opsi.
 */
export interface MissingElementSeed {
  code: string;
  categoryPath: string;
  difficulty: SeedDifficulty;
  stem: string;
  left: string;
  right: string;
  answer: string;
  /** Empat pengecoh; tidak boleh memuat `answer`. */
  distractors: readonly string[];
  columnIndex?: number;
  tags: readonly string[];
}

/* ----------------------------------------------------------------- pass hand */

/**
 * Kolom Pass Hand: dua baris angka yang saling berhadapan.
 *
 * `numbers` disimpan selang-seling (atas, bawah, atas, bawah, ...) karena
 * `exam-question-projection.ts` memecahnya menjadi dua baris berdasarkan
 * indeks genap/ganjil.
 */
export interface PassHandSeed {
  code: string;
  categoryPath: string;
  difficulty: SeedDifficulty;
  stem: string;
  columnIndex: number;
  numbers: readonly number[];
  tags: readonly string[];
}
