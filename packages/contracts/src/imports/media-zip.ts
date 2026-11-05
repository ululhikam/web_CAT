import { z } from 'zod';
import { MEDIA_MAX_BYTES } from '../media/index';
import { MEDIA_ROLES, type MediaRole } from '../questions/index';

/**
 * F5-14 — impor ZIP gambar dengan pemetaan manual.
 *
 * Parser ZIP sudah ada untuk impor spreadsheet (kolom `image_stem_1`, dst.),
 * tetapi admin tidak punya jalan untuk mengunggah sekumpulan gambar lalu
 * menetapkan sendiri berkas mana milik soal/opsi mana. Modul ini adalah
 * satu-satunya tempat aturan pemetaan & validasi, dipakai UI (pratinjau
 * langsung) dan API (validasi otoritatif) agar keduanya tidak pernah berbeda.
 *
 * Semua fungsi di sini murni: tidak menyentuh filesystem, ZIP, DB, atau jam.
 */

/** Batas ukuran arsip ZIP gambar (bukan batas per gambar). */
export const MEDIA_ZIP_MAX_BYTES = 25 * 1024 * 1024;

/** Batas jumlah berkas dalam satu arsip agar pratinjau tetap responsif. */
export const MEDIA_ZIP_MAX_ENTRIES = 200;

export const MEDIA_ZIP_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'] as const;

export type MediaZipFileStatus =
  | 'OK'
  | 'UNSUPPORTED'
  | 'TOO_LARGE'
  | 'DUPLICATE'
  | 'UNSAFE_PATH'
  | 'EMPTY';

export type MediaZipIssueCode =
  | 'EMPTY_ARCHIVE'
  | 'TOO_MANY_ENTRIES'
  | 'UNSUPPORTED_EXTENSION'
  | 'FILE_TOO_LARGE'
  | 'DUPLICATE_NAME'
  | 'UNSAFE_PATH'
  | 'UNKNOWN_FILE'
  | 'FILE_NOT_IMPORTABLE'
  | 'UNKNOWN_TARGET'
  | 'DUPLICATE_MAPPING'
  | 'TARGET_CONFLICT'
  | 'OPTION_LABEL_REQUIRED'
  | 'OPTION_LABEL_INVALID'
  | 'MAPPING_EMPTY';

export interface MediaZipIssue {
  /** `null` untuk masalah tingkat arsip (mis. arsip kosong). */
  fileName: string | null;
  code: MediaZipIssueCode;
  message: string;
}

/** Entri mentah hasil pembacaan ZIP; dihasilkan lapisan API. */
export interface MediaZipArchiveEntry {
  /** Path di dalam arsip, sudah dinormalkan memakai `/`. */
  archivePath: string;
  sizeBytes: number;
}

export interface MediaZipFile {
  /** Nama dasar (basename) seperti tertulis di arsip. */
  fileName: string;
  /** Kunci pencocokan: basename huruf kecil. */
  normalizedName: string;
  archivePath: string;
  sizeBytes: number;
  status: MediaZipFileStatus;
  /** Alasan status non-OK, siap tampil di UI. */
  message: string | null;
}

export interface MediaZipScan {
  files: MediaZipFile[];
  issues: MediaZipIssue[];
  summary: {
    entries: number;
    importable: number;
    unsupported: number;
    tooLarge: number;
    duplicate: number;
    unsafe: number;
  };
}

/** Status berkas yang boleh dipetakan ke soal. */
export function isImportableMediaZipFile(file: MediaZipFile): boolean {
  return file.status === 'OK';
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function extensionOf(name: string): string {
  const index = name.lastIndexOf('.');
  return index < 0 ? '' : name.slice(index + 1).toLowerCase();
}

function baseNameOf(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] ?? path;
}

/**
 * Berkas metadata sistem operasi yang selalu ada di ZIP buatan Finder/Windows
 * dan tidak pernah relevan untuk impor.
 *
 * Dibuang diam-diam (bukan dilaporkan sebagai error) supaya laporan tidak
 * dipenuhi `__MACOSX/...` dan `.DS_Store`.
 */
export function isIgnoredArchivePath(path: string): boolean {
  const normalized = path.replace(/\\/g, '/');
  const segments = normalized.split('/');
  const base = (segments[segments.length - 1] ?? '').toLowerCase();
  if (segments.some((segment) => segment === '__MACOSX')) return true;
  if (base === '.ds_store' || base === 'thumbs.db' || base === 'desktop.ini') return true;
  return segments.some((segment) => segment.startsWith('.'));
}

/** MIME yang dipakai saat menyimpan berkas ZIP ke media. */
export function mediaZipMimeOf(fileName: string): string {
  const extension = extensionOf(fileName);
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  return 'image/jpeg';
}

/** `true` bila berkas ini boleh dilewati tanpa dilaporkan sebagai error. */
export function isSupportedMediaZipExtension(fileName: string): boolean {
  return (MEDIA_ZIP_EXTENSIONS as readonly string[]).includes(extensionOf(fileName));
}

/**
 * Deteksi path yang mencurigakan.
 *
 * ZIP tidak pernah diekstrak ke disk, jadi ini bukan pertahanan zip-slip,
 * melainkan peringatan agar admin sadar berkasnya berada di luar struktur
 * folder yang wajar (`../`, path absolut, atau drive Windows).
 */
function isUnsafePath(path: string): boolean {
  const normalized = path.replace(/\\/g, '/');
  if (normalized.startsWith('/')) return true;
  if (/^[a-zA-Z]:/.test(normalized)) return true;
  return normalized.split('/').some((segment) => segment === '..');
}

/**
 * Pindai daftar entri ZIP menjadi berkas yang bisa/tidak bisa diimpor.
 *
 * Aturan:
 * - ekstensi selain PNG/JPEG/WebP ditolak;
 * - berkas > 5 MB ditolak (batas yang sama dengan unggah media tunggal);
 * - nama dasar ganda (tanpa peduli huruf besar/kecil) menandai SEMUA berkas
 *   senama sebagai `DUPLICATE` supaya admin memilih salah satu, bukan menebak
 *   berkas mana yang dipakai;
 * - arsip kosong atau melebihi jumlah maksimum ditolak seluruhnya.
 *
 * Entri direktori diabaikan oleh pemanggil.
 */
export function scanMediaZipEntries(entries: readonly MediaZipArchiveEntry[]): MediaZipScan {
  const summary = {
    entries: entries.length,
    importable: 0,
    unsupported: 0,
    tooLarge: 0,
    duplicate: 0,
    unsafe: 0,
  };
  const issues: MediaZipIssue[] = [];

  if (entries.length === 0) {
    issues.push({
      fileName: null,
      code: 'EMPTY_ARCHIVE',
      message: 'ZIP tidak berisi berkas gambar.',
    });
    return { files: [], issues, summary };
  }

  if (entries.length > MEDIA_ZIP_MAX_ENTRIES) {
    issues.push({
      fileName: null,
      code: 'TOO_MANY_ENTRIES',
      message: `Arsip berisi ${entries.length} berkas; maksimal ${MEDIA_ZIP_MAX_ENTRIES} per impor.`,
    });
    return {
      files: [],
      issues,
      summary: { ...summary, entries: entries.length },
    };
  }

  const baseCount = new Map<string, number>();
  for (const entry of entries) {
    const key = baseNameOf(entry.archivePath).toLowerCase();
    baseCount.set(key, (baseCount.get(key) ?? 0) + 1);
  }

  const files: MediaZipFile[] = entries.map((entry) => {
    const archivePath = entry.archivePath.replace(/\\/g, '/');
    const fileName = baseNameOf(archivePath);
    const normalizedName = fileName.toLowerCase();
    const extension = extensionOf(fileName);

    const base: MediaZipFile = {
      fileName,
      normalizedName,
      archivePath,
      sizeBytes: entry.sizeBytes,
      status: 'OK',
      message: null,
    };

    if (!fileName || extension === '') {
      summary.unsupported += 1;
      return {
        ...base,
        status: 'UNSUPPORTED',
        message: 'Berkas tanpa ekstensi gambar (PNG/JPEG/WebP).',
      };
    }

    if (isUnsafePath(archivePath)) {
      summary.unsafe += 1;
      return {
        ...base,
        status: 'UNSAFE_PATH',
        message: 'Path di dalam ZIP tidak wajar (absolut atau memakai "..").',
      };
    }

    if (!(MEDIA_ZIP_EXTENSIONS as readonly string[]).includes(extension)) {
      summary.unsupported += 1;
      return {
        ...base,
        status: 'UNSUPPORTED',
        message: `Ekstensi ".${extension}" tidak didukung; gunakan PNG, JPEG, atau WebP.`,
      };
    }

    if (entry.sizeBytes <= 0) {
      summary.unsupported += 1;
      return {
        ...base,
        status: 'EMPTY',
        message: 'Berkas kosong (0 byte).',
      };
    }

    if (entry.sizeBytes > MEDIA_MAX_BYTES) {
      summary.tooLarge += 1;
      return {
        ...base,
        status: 'TOO_LARGE',
        message: `Ukuran ${formatSize(entry.sizeBytes)} melebihi batas ${formatSize(MEDIA_MAX_BYTES)}.`,
      };
    }

    if ((baseCount.get(normalizedName) ?? 0) > 1) {
      summary.duplicate += 1;
      return {
        ...base,
        status: 'DUPLICATE',
        message: 'Nama berkas sama dengan berkas lain di ZIP; ganti salah satu nama.',
      };
    }

    summary.importable += 1;
    return base;
  });

  return { files, issues, summary };
}

/* ------------------------------------------------------------------ saran */

export interface MediaZipSuggestion {
  /** Nama soal tanpa akhiran peran, mis. `fig-016` dari `fig-016-stem.png`. */
  slug: string;
  role: MediaRole;
  /** Label opsi bila akhiran menunjukkan opsi (mis. `-opt-b`). */
  optionLabel?: string;
}

const OPTION_SUFFIX = /[-_](?:opt|opsi|option|pilihan)[-_]?([a-j])$/i;
const STEM_SUFFIX = /[-_](?:stem|soal|question|q)$/i;
const EXPLANATION_SUFFIX = /[-_](?:expl|explanation|pembahasan)$/i;

/**
 * Tebak peran & nama soal dari nama berkas.
 *
 * `fig-016-stem.png` → `{ slug: 'fig-016', role: 'STEM' }`;
 * `fig-016-opt-b.png` → `{ slug: 'fig-016', role: 'OPTION', optionLabel: 'B' }`.
 * Tanpa akhiran yang dikenali, seluruh nama dipakai sebagai slug dan peran
 * default STEM — admin tetap memutuskan target sebenarnya di UI.
 */
export function suggestMediaZipTarget(fileName: string): MediaZipSuggestion {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '');
  const normalized = withoutExtension.trim().replace(/_/g, '-');

  const option = OPTION_SUFFIX.exec(normalized);
  if (option) {
    return {
      slug: normalized.slice(0, option.index).replace(/[-_]+$/, ''),
      role: 'OPTION',
      optionLabel: option[1]!.toUpperCase(),
    };
  }

  if (EXPLANATION_SUFFIX.test(normalized)) {
    return {
      slug: normalized.replace(EXPLANATION_SUFFIX, ''),
      role: 'EXPLANATION',
    };
  }

  if (STEM_SUFFIX.test(normalized)) {
    return {
      slug: normalized.replace(STEM_SUFFIX, ''),
      role: 'STEM',
    };
  }

  return { slug: normalized, role: 'STEM' };
}

/* ------------------------------------------------------------------ pemetaan */

export interface MediaZipQuestionRef {
  id: string;
  publicCode: string;
  /** Label opsi yang benar-benar ada pada soal. */
  optionLabels: string[];
}

export interface MediaZipMappingRow {
  fileName: string;
  questionId?: string;
  publicCode?: string;
  role: MediaRole;
  optionLabel?: string;
}

export interface MediaZipValidatedMapping {
  fileName: string;
  normalizedName: string;
  questionId: string;
  publicCode: string;
  role: MediaRole;
  optionLabel?: string;
}

export interface MediaZipMappingResult {
  accepted: MediaZipValidatedMapping[];
  errors: MediaZipIssue[];
  warnings: string[];
}

/**
 * Validasi pemetaan berkas → soal/opsi.
 *
 * Mengembalikan hanya baris yang aman diimpor beserta daftar error per berkas
 * (bukan melempar exception) supaya UI bisa menampilkan laporan lengkap dan
 * admin memperbaiki tanpa mengulang unggahan.
 */
export function validateMediaZipMappings(input: {
  files: readonly MediaZipFile[];
  mappings: readonly MediaZipMappingRow[];
  questions: readonly MediaZipQuestionRef[];
}): MediaZipMappingResult {
  const errors: MediaZipIssue[] = [];
  const warnings: string[] = [];
  const accepted: MediaZipValidatedMapping[] = [];

  if (input.mappings.length === 0) {
    errors.push({
      fileName: null,
      code: 'MAPPING_EMPTY',
      message: 'Belum ada pemetaan. Pilih target soal untuk minimal satu berkas.',
    });
    return { accepted, errors, warnings };
  }

  const filesByName = new Map<string, MediaZipFile>();
  for (const file of input.files) filesByName.set(file.normalizedName, file);
  for (const file of input.files) filesByName.set(file.fileName, file);

  const questionById = new Map<string, MediaZipQuestionRef>();
  const questionByCode = new Map<string, MediaZipQuestionRef>();
  for (const question of input.questions) {
    questionById.set(question.id, question);
    questionByCode.set(question.publicCode.toLowerCase(), question);
  }

  const usedFiles = new Set<string>();
  const usedTargets = new Set<string>();
  const mapped = new Set<string>();

  for (const row of input.mappings) {
    const key = row.fileName.trim();
    if (!key) {
      errors.push({
        fileName: row.fileName,
        code: 'UNKNOWN_FILE',
        message: 'Nama berkas pada pemetaan kosong.',
      });
      continue;
    }

    const file = filesByName.get(key) ?? filesByName.get(key.toLowerCase());
    if (!file) {
      errors.push({
        fileName: key,
        code: 'UNKNOWN_FILE',
        message: `Berkas "${key}" tidak ada di dalam ZIP.`,
      });
      continue;
    }

    if (usedFiles.has(file.normalizedName)) {
      errors.push({
        fileName: file.fileName,
        code: 'DUPLICATE_MAPPING',
        message: 'Berkas ini dipetakan lebih dari sekali; hapus salah satu baris.',
      });
      continue;
    }
    usedFiles.add(file.normalizedName);
    mapped.add(file.normalizedName);

    if (file.status !== 'OK') {
      errors.push({
        fileName: file.fileName,
        code: 'FILE_NOT_IMPORTABLE',
        message: file.message ?? 'Berkas tidak dapat diimpor.',
      });
      continue;
    }

    const question = row.questionId
      ? questionById.get(row.questionId)
      : row.publicCode
        ? questionByCode.get(row.publicCode.trim().toLowerCase())
        : undefined;

    if (!question) {
      errors.push({
        fileName: file.fileName,
        code: 'UNKNOWN_TARGET',
        message: row.questionId
          ? 'Soal tujuan tidak ditemukan (mungkin sudah dihapus).'
          : `Kode soal "${row.publicCode ?? ''}" tidak ditemukan.`,
      });
      continue;
    }

    if (row.role === 'OPTION') {
      const label = row.optionLabel?.trim().toUpperCase();
      if (!label) {
        errors.push({
          fileName: file.fileName,
          code: 'OPTION_LABEL_REQUIRED',
          message: `Pilih label opsi untuk "${file.fileName}".`,
        });
        continue;
      }
      if (!question.optionLabels.includes(label)) {
        errors.push({
          fileName: file.fileName,
          code: 'OPTION_LABEL_INVALID',
          message: `Soal ${question.publicCode} tidak punya opsi ${label}.`,
        });
        continue;
      }
      const targetKey = `${question.id}:OPTION:${label}`;
      if (usedTargets.has(targetKey)) {
        errors.push({
          fileName: file.fileName,
          code: 'TARGET_CONFLICT',
          message: `Opsi ${label} pada ${question.publicCode} sudah dipetakan berkas lain.`,
        });
        continue;
      }
      usedTargets.add(targetKey);
      accepted.push({
        fileName: file.fileName,
        normalizedName: file.normalizedName,
        questionId: question.id,
        publicCode: question.publicCode,
        role: 'OPTION',
        optionLabel: label,
      });
      continue;
    }

    if (row.optionLabel) {
      warnings.push(
        `Label opsi "${row.optionLabel}" diabaikan untuk ${file.fileName} karena peran ${row.role}.`,
      );
    }

    const targetKey = `${question.id}:${row.role}`;
    if (usedTargets.has(targetKey)) {
      errors.push({
        fileName: file.fileName,
        code: 'TARGET_CONFLICT',
        message: `Target ${row.role} pada ${question.publicCode} sudah dipetakan berkas lain.`,
      });
      continue;
    }
    usedTargets.add(targetKey);
    accepted.push({
      fileName: file.fileName,
      normalizedName: file.normalizedName,
      questionId: question.id,
      publicCode: question.publicCode,
      role: row.role,
    });
  }

  for (const file of input.files) {
    if (mapped.has(file.normalizedName)) continue;
    if (file.status !== 'OK') continue;
    warnings.push(`"${file.fileName}" tidak dipetakan dan akan dilewati.`);
  }

  return { accepted, errors, warnings };
}

/* ------------------------------------------------------------------ kontrak API */

export const mediaZipMappingRowSchema = z
  .object({
    fileName: z.string().trim().min(1, 'Nama berkas wajib ada').max(400),
    questionId: z.string().uuid().optional(),
    publicCode: z.string().trim().max(60).optional(),
    role: z.enum(MEDIA_ROLES).default('STEM'),
    optionLabel: z
      .string()
      .trim()
      .regex(/^[A-J]$/, 'Label opsi harus satu huruf A–J')
      .optional(),
  })
  .refine((value) => value.questionId !== undefined || value.publicCode !== undefined, {
    message: 'Sebutkan questionId atau publicCode',
  });
export type MediaZipMappingRowInput = z.infer<typeof mediaZipMappingRowSchema>;

export const mediaZipApplySchema = z.object({
  mappings: z
    .array(mediaZipMappingRowSchema)
    .min(1, 'Minimal satu pemetaan')
    .max(MEDIA_ZIP_MAX_ENTRIES),
});
export type MediaZipApplyInput = z.infer<typeof mediaZipApplySchema>;

/**
 * Body resolusi kode soal sekaligus.
 *
 * Saran nama berkas bisa menghasilkan puluhan kode (`fig-001`, `fig-002`, …).
 * Memintanya satu per satu berarti puluhan request sebelum admin bisa
 * memetakan apa pun, jadi pratinjau mengirim semuanya dalam satu permintaan.
 */
export const mediaZipResolveSchema = z.object({
  codes: z
    .array(z.string().trim().min(1).max(60))
    .min(1, 'Minimal satu kode soal')
    .max(MEDIA_ZIP_MAX_ENTRIES),
});
export type MediaZipResolveInput = z.infer<typeof mediaZipResolveSchema>;

/**
 * Body `multipart/form-data` endpoint terapkan: `mapping` dikirim sebagai JSON
 * string karena tidak ada bagian form yang bisa menampung array objek.
 */
export const mediaZipApplyBodySchema = z.object({
  mapping: z
    .string()
    .trim()
    .min(2, 'Mapping wajib diisi')
    .max(200_000)
    .transform((value, ctx) => {
      try {
        return JSON.parse(value) as unknown;
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Mapping bukan JSON yang valid',
        });
        return z.NEVER;
      }
    })
    .pipe(mediaZipApplySchema),
});
export type MediaZipApplyBody = z.infer<typeof mediaZipApplyBodySchema>;

export interface MediaZipPreviewResponse {
  archiveName: string;
  totalEntries: number;
  files: MediaZipFile[];
  issues: MediaZipIssue[];
  summary: MediaZipScan['summary'];
}

export interface MediaZipReportError {
  fileName: string | null;
  code: string;
  message: string;
}

export interface MediaZipApplyResult {
  archiveName: string;
  totalEntries: number;
  /** Berkas yang lolos pemindaian (status OK). */
  importable: number;
  /** Baris pemetaan yang lolos validasi. */
  mapped: number;
  /** Gambar yang benar-benar tersimpan sebagai media. */
  imported: number;
  /** Tautan media baru yang terpasang ke soal. */
  attached: number;
  /** Berkas yang dipetakan tetapi sudah terpasang sebelumnya. */
  skipped: number;
  /** Jumlah soal yang bertambah lampirannya. */
  questionsUpdated: number;
  errors: MediaZipReportError[];
  warnings: string[];
}
