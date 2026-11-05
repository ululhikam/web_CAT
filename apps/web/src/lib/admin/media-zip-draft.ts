import {
  suggestMediaZipTarget,
  validateMediaZipMappings,
  type MediaZipFile,
  type MediaZipFileStatus,
  type MediaZipIssue,
  type MediaZipMappingRow,
  type MediaZipQuestionRef,
  type MediaZipSuggestion,
} from '@webcat/contracts';
import type { MediaRole } from '@webcat/contracts';

/**
 * Logika layar impor ZIP gambar (F5-14), dipisah dari komponen agar bisa diuji
 * tanpa DOM.
 *
 * Komponen hanya menyimpan `MediaZipDraftRow[]`; semua keputusan — baris mana
 * yang boleh dikirim, bagaimana saran nama berkas diterjemahkan menjadi target,
 * dan apa yang dilaporkan sebelum menekan "Terapkan" — hidup di sini. Validasi
 * di sini memakai fungsi murni yang sama dengan API sehingga pesan yang dilihat
 * admin identik dengan yang akan ditolak server.
 */

export interface MediaZipDraftRow {
  fileName: string;
  /** Path lengkap di dalam ZIP; kunci baris karena nama dasar bisa ganda. */
  archivePath: string;
  normalizedName: string;
  sizeBytes: number;
  status: MediaZipFileStatus;
  message: string | null;
  /** Saran dari nama berkas: `fig-016-stem.png` → slug `fig-016`, peran STEM. */
  suggestion: MediaZipSuggestion;
  questionId: string;
  publicCode: string;
  role: MediaRole;
  optionLabel: string;
  /** Label opsi yang benar-benar ada pada soal terpilih. */
  optionLabels: string[];
}

export interface MediaZipDraftSummary {
  total: number;
  importable: number;
  mapped: number;
  missingTarget: number;
  missingOptionLabel: number;
}

/** Baris hanya bisa dikirim bila berkas lolos pemindaian. */
export function isRowMappable(row: MediaZipDraftRow): boolean {
  return row.status === 'OK';
}

export function draftRow(file: MediaZipFile): MediaZipDraftRow {
  const suggestion = suggestMediaZipTarget(file.fileName);
  return {
    fileName: file.fileName,
    archivePath: file.archivePath,
    normalizedName: file.normalizedName,
    sizeBytes: file.sizeBytes,
    status: file.status,
    message: file.message,
    suggestion,
    questionId: '',
    publicCode: '',
    role: suggestion.role,
    optionLabel: suggestion.optionLabel ?? '',
    optionLabels: [],
  };
}

/**
 * Susun baris awal dari hasil pratinjau.
 *
 * Masalah tingkat arsip (`issues` tanpa `fileName`) tidak menjadi baris; UI
 * menampilkannya terpisah karena tidak ada berkas yang bisa diperbaiki.
 */
export function buildDraftRows(files: readonly MediaZipFile[]): MediaZipDraftRow[] {
  return files.map(draftRow);
}

/** Cocokkan slug saran dengan `publicCode` soal yang sudah dimuat. */
export function findQuestionBySlug(
  slug: string,
  questions: readonly MediaZipQuestionRef[],
): MediaZipQuestionRef | null {
  const needle = slug.trim().toLowerCase();
  if (!needle) return null;
  return (
    questions.find((question) => question.publicCode.toLowerCase() === needle) ??
    questions.find((question) => question.publicCode.toLowerCase().includes(needle)) ??
    null
  );
}

/** Pilih soal untuk satu baris; label opsi ikut disegarkan. */
export function selectQuestion(row: MediaZipDraftRow, question: MediaZipQuestionRef): MediaZipDraftRow {
  return {
    ...row,
    questionId: question.id,
    publicCode: question.publicCode,
    optionLabels: [...question.optionLabels],
    // Label opsi yang tidak ada pada soal baru dibuang agar tidak dikirim
    // sebagai pemetaan yang pasti ditolak.
    optionLabel:
      row.role === 'OPTION' && row.optionLabel && !question.optionLabels.includes(row.optionLabel)
        ? ''
        : row.optionLabel,
  };
}

export function clearQuestion(row: MediaZipDraftRow): MediaZipDraftRow {
  return { ...row, questionId: '', publicCode: '', optionLabels: [] };
}

/**
 * Gabungkan hasil pencarian ke daftar soal yang sudah dimuat.
 *
 * Tanpa ini, memilih soal manual akan menghapus kandidat sebelumnya sehingga
 * setiap baris harus dicari ulang. Urutan asli dipertahankan; soal baru
 * ditambahkan di belakang agar posisi pilihan tidak melompat saat admin
 * sedang memetakan.
 */
export function mergeQuestions(
  existing: readonly MediaZipQuestionRef[],
  incoming: readonly MediaZipQuestionRef[],
): MediaZipQuestionRef[] {
  const seen = new Set(existing.map((question) => question.id));
  const merged = [...existing];

  for (const question of incoming) {
    if (seen.has(question.id)) continue;
    seen.add(question.id);
    merged.push(question);
  }

  return merged;
}

/** Kode soal unik yang disarankan nama berkas, dipakai untuk lookup massal. */
export function suggestedCodes(rows: readonly MediaZipDraftRow[]): string[] {
  const codes = new Set<string>();
  for (const row of rows) {
    if (!isRowMappable(row)) continue;
    const slug = row.suggestion.slug.trim().toUpperCase();
    if (slug) codes.add(slug);
  }
  return [...codes];
}

/**
 * Terapkan saran nama berkas ke baris: cari soal dengan slug yang sama, lalu
 * isi label opsi bila peran sarannya OPTION.
 */
export function applySuggestion(
  row: MediaZipDraftRow,
  questions: readonly MediaZipQuestionRef[],
): MediaZipDraftRow {
  const match = findQuestionBySlug(row.suggestion.slug, questions);
  if (!match) return row;

  const selected = selectQuestion(row, match);
  return selected;
}

/** Terapkan saran untuk semua baris sekaligus (tombol "Isi otomatis"). */
export function applySuggestions(
  rows: readonly MediaZipDraftRow[],
  questions: readonly MediaZipQuestionRef[],
): MediaZipDraftRow[] {
  return rows.map((row) => (isRowMappable(row) ? applySuggestion(row, questions) : row));
}

/**
 * Pemetaan yang siap dikirim.
 *
 * Baris tanpa target dan baris berkas bermasalah dilewati — bukan dikirim lalu
 * ditolak server, karena laporan sudah dibuat di sisi klien.
 */
export function mappingRowsFromDraft(rows: readonly MediaZipDraftRow[]): MediaZipMappingRow[] {
  return rows
    .filter((row) => isRowMappable(row))
    .filter((row) => row.questionId !== '' || row.publicCode.trim() !== '')
    .map((row) => ({
      fileName: row.fileName,
      ...(row.questionId ? { questionId: row.questionId } : { publicCode: row.publicCode }),
      role: row.role,
      ...(row.role === 'OPTION' && row.optionLabel ? { optionLabel: row.optionLabel } : {}),
    }));
}

/** Validasi lokal memakai aturan yang sama dengan API. */
export function draftIssues(
  rows: readonly MediaZipDraftRow[],
  files: readonly MediaZipFile[],
  questions: readonly MediaZipQuestionRef[],
): { errors: MediaZipIssue[]; warnings: string[] } {
  const result = validateMediaZipMappings({
    files,
    mappings: mappingRowsFromDraft(rows),
    questions,
  });
  return { errors: result.errors, warnings: result.warnings };
}

export function summarizeDraft(rows: readonly MediaZipDraftRow[]): MediaZipDraftSummary {
  const importable = rows.filter(isRowMappable);

  return {
    total: rows.length,
    importable: importable.length,
    mapped: importable.filter((row) => row.questionId !== '' || row.publicCode.trim() !== '')
      .length,
    missingTarget: importable.filter(
      (row) => row.questionId === '' && row.publicCode.trim() === '',
    ).length,
    missingOptionLabel: importable.filter((row) => row.role === 'OPTION' && !row.optionLabel)
      .length,
  };
}

/** Boleh menekan "Terapkan"? Minimal satu baris bertarget dan tidak ada error. */
export function canApply(
  rows: readonly MediaZipDraftRow[],
  files: readonly MediaZipFile[],
  questions: readonly MediaZipQuestionRef[],
): boolean {
  const summary = summarizeDraft(rows);
  if (summary.mapped === 0) return false;
  return draftIssues(rows, files, questions).errors.length === 0;
}

const STATUS_LABELS: Record<MediaZipFileStatus, string> = {
  OK: 'Siap',
  UNSUPPORTED: 'Format tidak didukung',
  TOO_LARGE: 'Terlalu besar',
  DUPLICATE: 'Nama ganda',
  UNSAFE_PATH: 'Path tidak wajar',
  EMPTY: 'Kosong',
};

export function statusLabel(status: MediaZipFileStatus): string {
  return STATUS_LABELS[status];
}

/** Kelas warna status untuk tabel pratinjau. */
export function statusTone(status: MediaZipFileStatus): 'success' | 'warning' | 'danger' {
  if (status === 'OK') return 'success';
  if (status === 'DUPLICATE' || status === 'EMPTY') return 'warning';
  return 'danger';
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/** Ringkasan hasil `apply` untuk ditampilkan setelah impor. */
export function applyResultLines(result: {
  mapped: number;
  imported: number;
  attached: number;
  skipped: number;
  questionsUpdated: number;
}): string[] {
  const lines = [
    `${result.attached} lampiran terpasang pada ${result.questionsUpdated} soal.`,
  ];
  if (result.imported !== result.attached) {
    lines.push(`${result.imported} gambar tersimpan sebagai media.`);
  }
  if (result.skipped > 0) {
    lines.push(`${result.skipped} target sudah punya gambar dan dilewati.`);
  }
  if (result.mapped > result.attached + result.skipped) {
    lines.push(`${result.mapped - result.attached - result.skipped} baris gagal dipasang.`);
  }
  return lines;
}
