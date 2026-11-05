import { z } from 'zod';
import { MEDIA_ROLES } from '../questions/index';

export const MEDIA_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type MediaMime = (typeof MEDIA_MIME_TYPES)[number];

export const MEDIA_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Dimensi minimum gambar soal (F3-28).
 *
 * Soal figural menampilkan pola; gambar di bawah 200×200 px tidak terbaca saat
 * diperkecil di tile runner, jadi ditolak sejak upload dengan pesan yang jelas.
 */
export const MEDIA_MIN_DIMENSION = 200;

/**
 * Varian penyajian media (F5-15).
 *
 * - `full` — berkas asli; dipakai halaman ujian dan tampilan detail.
 * - `thumb` — turunan WebP dengan sisi terpanjang maksimum 400 px; dipakai grid
 *   media admin dan pemilih gambar pada formulir soal.
 *
 * Keduanya dilayani endpoint yang sama lewat query `variant`, jadi bentuk
 * tautan tetap satu dan cache HTTP tetap berlaku. Varian tidak ikut
 * ditandatangani karena hanya mengubah penyajian aset yang sama, bukan hak
 * aksesnya — tautan lama tanpa `variant` tetap sah.
 */
export const MEDIA_VARIANTS = ['full', 'thumb'] as const;
export type MediaVariant = (typeof MEDIA_VARIANTS)[number];

/** Sisi terpanjang maksimum thumbnail (px). */
export const MEDIA_THUMBNAIL_MAX_DIMENSION = 400;

/** Kualitas WebP thumbnail; lebih rendah dari aslinya karena hanya pratinjau. */
export const MEDIA_THUMBNAIL_QUALITY = 70;

/**
 * Normalisasi query `variant`.
 *
 * Nilai asing atau kosong jatuh ke `full` supaya tautan lama (tanpa `variant`)
 * dan salah ketik tetap menyajikan gambar, bukan 400/404.
 */
export function normalizeMediaVariant(value: unknown): MediaVariant {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return normalized === 'thumb' || normalized === 'thumbnail' ? 'thumb' : 'full';
}

/**
 * `true` bila gambar cukup besar sehingga thumbnail terpisah berguna.
 *
 * Gambar ≤ 400 px tidak perlu dikecilkan lagi: thumbnail memakai
 * `withoutEnlargement` sehingga hasilnya identik dengan aslinya dan tidak
 * disimpan.
 */
export function needsThumbnail(
  width: number | null | undefined,
  height: number | null | undefined,
): boolean {
  if (!width || !height) return false;
  return Math.max(width, height) > MEDIA_THUMBNAIL_MAX_DIMENSION;
}

/** Langkah 1 upload langsung: minta signed upload URL. */
export const mediaUploadUrlSchema = z.object({
  filename: z.string().trim().min(1).max(200),
  contentType: z.enum(MEDIA_MIME_TYPES, { message: 'Gunakan PNG, JPEG, atau WebP' }),
  sizeBytes: z.coerce
    .number()
    .int()
    .min(1, 'Berkas kosong')
    .max(MEDIA_MAX_BYTES, 'Maksimal 5 MB per gambar'),
});
export type MediaUploadUrlInput = z.infer<typeof mediaUploadUrlSchema>;

/** Langkah 2: verifikasi objek yang sudah diunggah lalu catat ke media_assets. */
export const mediaConfirmSchema = z.object({
  path: z.string().trim().min(3).max(500),
  checksum: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{64}$/i, 'Checksum SHA-256 tidak valid'),
  mime: z.enum(MEDIA_MIME_TYPES),
  sizeBytes: z.coerce.number().int().min(1).max(MEDIA_MAX_BYTES),
  width: z.coerce.number().int().min(1).max(20000).optional(),
  height: z.coerce.number().int().min(1).max(20000).optional(),
});
export type MediaConfirmInput = z.infer<typeof mediaConfirmSchema>;

export const mediaListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  cursor: z.string().trim().min(1).optional(),
  q: z.string().trim().max(120).optional(),
  mime: z.enum(MEDIA_MIME_TYPES).optional(),
  unusedOnly: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .default('false'),
});
export type MediaListQuery = z.infer<typeof mediaListQuerySchema>;

export const mediaAttachSchema = z.object({
  mediaAssetId: z.string().uuid(),
  role: z.enum(MEDIA_ROLES).default('STEM'),
  optionLabel: z
    .string()
    .trim()
    .regex(/^[A-J]$/, 'Label opsi harus satu huruf A–J')
    .optional(),
  altText: z.string().trim().max(300).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});
export type MediaAttachInput = z.infer<typeof mediaAttachSchema>;

export interface MediaAssetView {
  id: string;
  storagePath: string;
  url: string;
  /**
   * URL varian thumbnail (sisi terpanjang ≤ 400 px) — F5-15.
   *
   * Selalu bisa dipakai: bila turunan belum/tidak tersedia, endpoint menyajikan
   * berkas asli sehingga grid dan pemilih gambar tidak perlu penanganan khusus.
   */
  thumbUrl: string;
  mime: string;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  checksum: string;
  createdAt: string;
  usageCount: number;
}

export interface MediaUploadUrlResponse {
  path: string;
  token: string;
  signedUrl: string;
  expiresAt: string;
}

export interface MediaListResponse {
  rows: MediaAssetView[];
  nextCursor: string | null;
  hasMore: boolean;
}
