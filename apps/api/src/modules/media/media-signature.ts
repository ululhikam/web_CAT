import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Varian penyajian media (F5-15).
 *
 * `thumb` meminta turunan kecil; nilai lain — termasuk tidak ada — berarti
 * berkas asli.
 */
export type MediaUrlVariant = 'full' | 'thumb';

/**
 * Signed URL media privat tanpa bucket publik. TTL pendek, HMAC-SHA256, dan
 * hanya berlaku untuk satu media id.
 *
 * Varian sengaja TIDAK ikut ditandatangani: ia hanya mengubah penyajian aset
 * yang sama, bukan memberi akses ke aset lain. Konsekuensinya tautan lama tanpa
 * `variant` tetap valid, dan URL yang sama bisa diminta ulang sebagai thumbnail.
 */
export function signMedia(id: string, expiresAt: number, secret: string): string {
  return createHmac('sha256', secret).update(`${id}.${expiresAt}`).digest('base64url');
}

export function buildMediaUrl(
  id: string,
  secret: string,
  ttlSeconds = 1800,
  variant: MediaUrlVariant = 'full',
): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const signature = signMedia(id, expiresAt, secret);
  const suffix = variant === 'thumb' ? '&variant=thumb' : '';
  return `/api/v1/media/${id}/content?exp=${expiresAt}&sig=${signature}${suffix}`;
}

/**
 * URL pratinjau admin — dipakai saat byte tidak ada di database (Supabase).
 *
 * Tidak ditandatangani karena endpoint-nya di balik guard permission.
 */
export function buildAdminPreviewUrl(id: string, variant: MediaUrlVariant = 'full'): string {
  return `/api/v1/admin/media/${id}/preview${variant === 'thumb' ? '?variant=thumb' : ''}`;
}

export function verifyMediaSignature(
  id: string,
  expiresAt: number,
  signature: string,
  secret: string,
): boolean {
  if (!Number.isFinite(expiresAt) || expiresAt * 1000 < Date.now()) return false;

  const expected = signMedia(id, expiresAt, secret);
  const actual = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
}
