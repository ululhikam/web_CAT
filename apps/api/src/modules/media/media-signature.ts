import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Signed URL media privat tanpa bucket publik. TTL pendek, HMAC-SHA256,
 * dan hanya berlaku untuk satu media id.
 */
export function signMedia(id: string, expiresAt: number, secret: string): string {
  return createHmac('sha256', secret).update(`${id}.${expiresAt}`).digest('base64url');
}

export function buildMediaUrl(id: string, secret: string, ttlSeconds = 1800): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const signature = signMedia(id, expiresAt, secret);
  return `/api/v1/media/${id}/content?exp=${expiresAt}&sig=${signature}`;
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
