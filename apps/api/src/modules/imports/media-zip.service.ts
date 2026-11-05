import {
  BadRequestException,
  ConflictException,
  Injectable,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import JSZip from 'jszip';
import {
  MEDIA_MAX_BYTES,
  MEDIA_ZIP_MAX_BYTES,
  isIgnoredArchivePath,
  mediaZipMimeOf,
  scanMediaZipEntries,
  validateMediaZipMappings,
  type MediaZipApplyResult,
  type MediaZipArchiveEntry,
  type MediaZipFile,
  type MediaZipMappingRow,
  type MediaZipQuestionRef,
  type MediaZipReportError,
  type MediaZipScan,
} from '@webcat/contracts';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MediaService } from '../media/media.service';
import type { Role } from '@webcat/contracts';

interface Actor {
  id: string;
  role?: Role;
  ip?: string | null;
  userAgent?: string | null;
}

export interface MediaZipArchive {
  name: string;
  /** Entri gambar yang dibaca dari ZIP, sudah tanpa metadata OS. */
  files: MediaZipFile[];
  /** Byte per `normalizedName`; hanya berisi entri yang lolos pemindaian. */
  buffers: Map<string, Buffer>;
  scan: MediaZipScan;
}

/**
 * F5-14 — impor ZIP gambar dengan pemetaan manual.
 *
 * Alur: baca entri ZIP → klasifikasi (fungsi murni di contracts) → validasi
 * pemetaan terhadap soal nyata → simpan media → pasang ke soal/opsi.
 *
 * Pemisahan ini penting: pratinjau (`preview`) memakai langkah 1–2 saja tanpa
 * menulis apa pun, sehingga admin bisa melihat laporan error lengkap sebelum
 * memutuskan. Endpoint terapkan mengulang langkah yang sama lalu menulis.
 *
 * Tidak ada `ImportJob` yang dibuat: impor ini menambah lampiran media ke soal
 * yang sudah ada, bukan membuat soal baru, sehingga tidak perlu status REVIEW.
 */
@Injectable()
export class MediaZipImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly media: MediaService,
  ) {}

  /** Baca ZIP + klasifikasi; tidak menyentuh DB. */
  async readArchive(file: Express.Multer.File | undefined): Promise<MediaZipArchive> {
    if (!file || file.size === 0) {
      throw new BadRequestException({
        code: 'COMMON_VALIDATION_FAILED',
        message: 'Berkas ZIP wajib diunggah',
      });
    }
    if (file.size > MEDIA_ZIP_MAX_BYTES) {
      throw new PayloadTooLargeException({
        code: 'COMMON_VALIDATION_FAILED',
        message: `Ukuran ZIP maksimal ${Math.round(MEDIA_ZIP_MAX_BYTES / (1024 * 1024))} MB`,
      });
    }
    if (!isZipFile(file)) {
      throw new UnsupportedMediaTypeException({
        code: 'COMMON_VALIDATION_FAILED',
        message: 'Berkas harus berupa ZIP (.zip)',
      });
    }

    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(file.buffer);
    } catch {
      throw new BadRequestException({
        code: 'COMMON_VALIDATION_FAILED',
        message: 'ZIP tidak dapat dibaca (rusak atau terenkripsi)',
      });
    }

    // Metadata Finder/Windows dibuang diam-diam; laporan error tidak boleh
    // dipenuhi `__MACOSX/...` dan `.DS_Store`.
    const candidates = Object.values(zip.files).filter(
      (entry) => !entry.dir && !isIgnoredArchivePath(entry.name) && hasImageExtension(entry.name),
    );

    // Tanpa `slice` di sini: pemindaian murni yang memutuskan arsip terlalu
    // besar. Kalau dipotong lebih dulu, admin tidak akan pernah tahu bahwa
    // berkas di atas batas diabaikan diam-diam.
    const rawEntries: MediaZipArchiveEntry[] = candidates.map((entry) => ({
      archivePath: entry.name.replace(/\\/g, '/'),
      sizeBytes: entryUncompressedSize(entry),
    }));

    const scan = scanMediaZipEntries(rawEntries);
    const buffers = new Map<string, Buffer>();
    const files = [...scan.files];

    // Baca byte hanya untuk entri yang lolos klasifikasi. Entri bermasalah
    // (terlalu besar, duplikat, ekstensi asing) tidak pernah didekompresi —
    // ini juga menahan ZIP bomb sederhana.
    const byPath = new Map(candidates.map((entry) => [entry.name.replace(/\\/g, '/'), entry]));
    for (const file of files) {
      if (file.status !== 'OK') continue;
      const entry = byPath.get(file.archivePath);
      if (!entry) continue;

      try {
        const buffer = await entry.async('nodebuffer');
        if (buffer.length === 0 || buffer.length > MEDIA_MAX_BYTES) {
          file.status = buffer.length === 0 ? 'EMPTY' : 'TOO_LARGE';
          file.message =
            buffer.length === 0
              ? 'Berkas kosong (0 byte).'
              : `Isi berkas melebihi batas ${Math.round(MEDIA_MAX_BYTES / (1024 * 1024))} MB.`;
          continue;
        }
        buffers.set(file.normalizedName, buffer);
      } catch {
        file.status = 'UNSUPPORTED';
        file.message = 'Isi berkas tidak dapat dibaca sebagai gambar.';
      }
    }

    return { name: file.originalname, files, buffers, scan: recount(files, scan) };
  }

  /** Pratinjau: daftar berkas + masalah tanpa menulis apa pun. */
  async preview(file: Express.Multer.File | undefined) {
    const archive = await this.readArchive(file);
    return {
      archiveName: archive.name,
      totalEntries: archive.scan.summary.entries,
      files: archive.files,
      issues: archive.scan.issues,
      summary: archive.scan.summary,
    };
  }

  /**
   * Terapkan pemetaan: simpan gambar sebagai media lalu pasang ke soal/opsi.
   *
   * Validasi memakai fungsi murni yang sama dengan UI; baris yang gagal
   * dilaporkan per berkas dan tidak menghentikan baris lain. Hasil selalu
   * memuat `errors` lengkap supaya admin bisa memperbaiki tanpa mengulang.
   */
  async apply(
    file: Express.Multer.File | undefined,
    mappings: readonly MediaZipMappingRow[],
    actor: Actor,
  ): Promise<MediaZipApplyResult> {
    const archive = await this.readArchive(file);
    const questions = await this.questionRefs(
      mappings.map((row) => row.publicCode).filter((code): code is string => Boolean(code)),
      mappings.map((row) => row.questionId).filter((id): id is string => Boolean(id)),
    );

    const validation = validateMediaZipMappings({
      files: archive.files,
      mappings,
      questions,
    });

    const errors: MediaZipReportError[] = validation.errors.map((issue) => ({
      fileName: issue.fileName,
      code: issue.code,
      message: issue.message,
    }));
    const warnings = [...validation.warnings];

    let imported = 0;
    let attached = 0;
    let skipped = 0;
    const updatedQuestions = new Set<string>();

    for (const accepted of validation.accepted) {
      const buffer = archive.buffers.get(accepted.normalizedName);
      if (!buffer) {
        errors.push({
          fileName: accepted.fileName,
          code: 'FILE_NOT_IMPORTABLE',
          message: 'Berkas tidak dapat dibaca dari ZIP.',
        });
        continue;
      }

      const option = accepted.optionLabel
        ? await this.prisma.questionOption.findFirst({
            where: { questionId: accepted.questionId, label: accepted.optionLabel },
            select: { id: true },
          })
        : null;

      if (accepted.role === 'OPTION' && !option) {
        errors.push({
          fileName: accepted.fileName,
          code: 'OPTION_LABEL_INVALID',
          message: `Soal ${accepted.publicCode} tidak punya opsi ${accepted.optionLabel}.`,
        });
        continue;
      }

      let assetId: string;
      try {
        const stored = await this.media.storeBuffer(
          buffer,
          mediaZipMimeOf(accepted.fileName),
          actor.id,
        );
        assetId = stored.id;
        imported += 1;
      } catch {
        errors.push({
          fileName: accepted.fileName,
          code: 'FILE_NOT_IMPORTABLE',
          message: 'Isi berkas bukan gambar yang valid (PNG/JPEG/WebP).',
        });
        continue;
      }

      // Idempoten per (soal, aset): menjalankan ulang ZIP yang sama tidak
      // menggandakan lampiran karena `storeBuffer` mengembalikan aset yang sama
      // (checksum). Gambar berbeda pada soal yang sama tetap boleh ditambahkan —
      // soal bisa memuat lebih dari satu gambar.
      const existing = await this.prisma.questionMedia.findFirst({
        where: { questionId: accepted.questionId, mediaAssetId: assetId },
        select: { id: true },
      });
      if (existing) {
        skipped += 1;
        warnings.push(`"${accepted.fileName}" sudah terpasang pada ${accepted.publicCode}.`);
        continue;
      }

      try {
        await this.prisma.questionMedia.create({
          data: {
            questionId: accepted.questionId,
            optionId: option?.id ?? null,
            mediaAssetId: assetId,
            role: accepted.role,
            sortOrder: 0,
            altText: accepted.fileName,
          },
        });
      } catch (cause) {
        errors.push({
          fileName: accepted.fileName,
          code: 'TARGET_CONFLICT',
          message:
            cause instanceof ConflictException
              ? cause.message
              : 'Lampiran bentrok dengan media lain pada target yang sama.',
        });
        continue;
      }

      attached += 1;
      updatedQuestions.add(accepted.questionId);
    }

    await this.audit.record({
      actorUserId: actor.id,
      action: 'import.media_zip_applied',
      // Tidak ada baris `import_jobs` untuk alur ini; jejak audit diberi tipe
      // sendiri supaya filter audit tidak menunjuk job yang tidak pernah ada.
      entityType: 'media_import',
      entityId: archive.name,
      metadata: {
        archive: archive.name,
        entries: archive.scan.summary.entries,
        mapped: validation.accepted.length,
        imported,
        attached,
        skipped,
        errors: errors.length,
      },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return {
      archiveName: archive.name,
      totalEntries: archive.scan.summary.entries,
      importable: archive.scan.summary.importable,
      mapped: validation.accepted.length,
      imported,
      attached,
      skipped,
      questionsUpdated: updatedQuestions.size,
      errors,
      warnings,
    };
  }

  /**
   * Cari soal untuk pemilih target di UI (kode soal atau potongan teks).
   *
   * Minimal dua karakter agar daftar tetap relevan dan query tetap murah;
   * `optionLabels` dipakai UI untuk menampilkan pilihan label opsi yang benar.
   */
  async searchQuestions(rawQuery: string): Promise<MediaZipQuestionRef[]> {
    const query = rawQuery.trim();
    if (query.length < 2) return [];

    const rows = await this.prisma.question.findMany({
      where: {
        deletedAt: null,
        OR: [
          { publicCode: { contains: query, mode: 'insensitive' } },
          { stemText: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        publicCode: true,
        options: { select: { label: true }, orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    return rows.map((row) => ({
      id: row.id,
      publicCode: row.publicCode,
      optionLabels: row.options.map((option) => option.label),
    }));
  }

  /**
   * Ambil referensi soal berdasarkan kode (bukan id).
   *
   * Dipakai UI saat pratinjau: nama berkas menghasilkan banyak kode sekaligus
   * (`fig-001`, `fig-002`, …), dan satu permintaan batch jauh lebih murah
   * daripada satu request per kode. Kode yang tidak ada cukup tidak muncul di
   * hasil — UI lalu membiarkan admin memilih target secara manual.
   */
  async resolveQuestions(codes: readonly string[]): Promise<MediaZipQuestionRef[]> {
    return this.questionRefs([...codes], []);
  }

  /**
   * Ambil referensi soal (id, kode, label opsi) untuk validasi.
   *
   * Satu query untuk semua kode + satu query untuk semua id; jumlahnya dibatasi
   * ukuran ZIP, jadi tidak perlu paginasi.
   */
  private async questionRefs(publicCodes: string[], ids: string[]): Promise<MediaZipQuestionRef[]> {
    const codes = [...new Set(publicCodes.map((code) => code.trim().toUpperCase()))].filter(Boolean);
    const uniqueIds = [...new Set(ids)];
    if (codes.length === 0 && uniqueIds.length === 0) return [];

    const rows = await this.prisma.question.findMany({
      where: {
        deletedAt: null,
        OR: [
          ...(codes.length ? [{ publicCode: { in: codes } }] : []),
          ...(uniqueIds.length ? [{ id: { in: uniqueIds } }] : []),
        ],
      },
      select: {
        id: true,
        publicCode: true,
        options: { select: { label: true }, orderBy: { sortOrder: 'asc' } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      publicCode: row.publicCode,
      optionLabels: row.options.map((option) => option.label),
    }));
  }
}

function isZipFile(file: Express.Multer.File): boolean {
  const extension = file.originalname.toLowerCase().split('.').pop() ?? '';
  if (extension === 'zip') return true;
  return ['application/zip', 'application/x-zip-compressed', 'multipart/x-zip'].includes(
    file.mimetype,
  );
}

function hasImageExtension(name: string): boolean {
  return /\.(png|jpe?g|webp)$/i.test(name);
}

/**
 * Ukuran asli entri menurut central directory.
 *
 * JSZip menyimpannya di `_data` (tidak diekspos di tipe publik). Nilai 0 berarti
 * tidak diketahui; entri seperti itu tetap diproses dan ukuran sebenarnya
 * dihitung saat byte dibaca.
 */
function entryUncompressedSize(entry: JSZip.JSZipObject): number {
  const internal = entry as unknown as { _data?: { uncompressedSize?: number } };
  return internal._data?.uncompressedSize ?? 0;
}

/**
 * Hitung ulang ringkasan setelah byte benar-benar dibaca.
 *
 * Ukuran yang dilaporkan header ZIP bisa menyesatkan (atau sengaja dipalsukan);
 * menghitung ulang membuat angka di UI sesuai isi nyata.
 */
function recount(files: MediaZipFile[], scan: MediaZipScan): MediaZipScan {
  const summary = {
    entries: files.length,
    importable: 0,
    unsupported: 0,
    tooLarge: 0,
    duplicate: 0,
    unsafe: 0,
  };

  for (const file of files) {
    if (file.status === 'OK') summary.importable += 1;
    else if (file.status === 'UNSUPPORTED' || file.status === 'EMPTY') summary.unsupported += 1;
    else if (file.status === 'TOO_LARGE') summary.tooLarge += 1;
    else if (file.status === 'DUPLICATE') summary.duplicate += 1;
    else if (file.status === 'UNSAFE_PATH') summary.unsafe += 1;
  }

  return { ...scan, files, summary };
}
