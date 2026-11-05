import type { AnswerPayload, ExamQuestionType, SubtestMetrics } from '@webcat/contracts';

/**
 * Tipe penilaian (plan §7.9).
 *
 * Semua strategi membaca `exam_session_questions.snapshot` yang dibekukan saat
 * subtes dibuka. Tidak ada pembacaan bank soal maupun konfigurasi terkini,
 * sehingga hasil deterministik dan perubahan admin tidak mengubah sesi berjalan.
 *
 * Snapshot memuat kunci jawaban → server-only, tidak pernah dikirim ke klien.
 */

export interface SnapshotOption {
  /** Id opsi milik snapshot (UUID deterministik, dipakai di payload jawaban). */
  id: string;
  label: string;
  text: string | null;
  isCorrect: boolean;
  scoreValue: number;
  /** Kepribadian: vektor dimensi untuk opsi ini (boleh negatif). */
  dimensionMap: Record<string, number> | null;
}

export interface SnapshotMedia {
  role: 'STEM' | 'OPTION' | 'EXPLANATION';
  /** Path storage; URL bertanda tangan dibuat saat proyeksi. */
  path: string;
  alt: string | null;
}

export interface MissingElementSnapshot {
  /** Larik lengkap, mis. "482917". */
  left: string;
  /** Larik kedua yang kehilangan satu karakter, mis. "48291". */
  right: string;
  /** Karakter hilang = kunci jawaban. */
  answer: string;
}

export interface QuestionSnapshot {
  /** Kode publik soal dari sumber pool — stabil untuk audit. */
  sourceId: string;
  type: ExamQuestionType;
  stem: string;
  stemFormat: 'MARKDOWN' | 'HTML';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  weight: number;
  /** Kepribadian: skala maksimum (default 5). */
  scale: number | null;
  /** Kepribadian: item terbalik. */
  isReverse: boolean;
  /** Konsistensi: pengelompokan pasangan setara. */
  pairGroup: string | null;
  /** Pass Hand: indeks kolom. */
  columnIndex: number | null;
  /** Pass Hand: angka tiap baris pada kolom ini. */
  columnNumbers: number[] | null;
  /** Kecermatan: dua larik + karakter hilang. */
  missingElement: MissingElementSnapshot | null;
  options: SnapshotOption[];
  media: SnapshotMedia[];
}

/** Satu baris `exam_session_questions` yang dinormalisasi untuk penilaian. */
export interface ScoringAnswer {
  /** `exam_session_questions.id`. */
  questionId: string;
  position: number;
  columnIndex: number | null;
  snapshot: QuestionSnapshot;
  answer: AnswerPayload | null;
  timeSpentMs: number;
}

export interface ScoringContext {
  /** Kode strategi yang sudah di-resolve (bukan alias). */
  strategy: string;
  config: Record<string, unknown>;
  /** Jumlah soal yang dimaterialisasi pada subtes ini. */
  questionCount: number;
  durationMinutes: number;
  answers: ScoringAnswer[];
}

export interface ScoringOutput {
  rawScore: number;
  maxScore: number;
  correct: number;
  wrong: number;
  blank: number;
  /** Metrik tambahan; dipetakan ke `SubtestMetrics`. */
  metrics: Partial<SubtestMetrics>;
}

export interface ScoringStrategyHandler {
  readonly code: string;
  evaluate(context: ScoringContext): ScoringOutput;
}
