import { createHash, randomBytes, randomInt } from 'node:crypto';

/**
 * Helper token murni (tanpa DI) agar mudah dipakai di service mana pun.
 *
 * - Token opaque: 32 byte acak base64url (refresh token, tautan reset, undangan).
 * - Kode OTP: numerik 6 digit, aman secara kriptografis (bukan Math.random).
 * - Semua token disimpan sebagai SHA-256; plaintext tidak pernah masuk DB.
 */
export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function generateNumericCode(digits = 6): string {
  return String(randomInt(0, 10 ** digits)).padStart(digits, '0');
}

export function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}
