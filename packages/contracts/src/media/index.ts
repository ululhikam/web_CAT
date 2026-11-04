import { z } from 'zod';
import { MEDIA_ROLES } from '../questions/index';

export const MEDIA_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type MediaMime = (typeof MEDIA_MIME_TYPES)[number];

export const MEDIA_MAX_BYTES = 5 * 1024 * 1024;

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
