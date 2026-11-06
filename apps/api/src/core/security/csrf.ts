import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { CookieOptions } from 'express';
import { AppConfigService } from '../config/config.service';

/**
 * Proteksi CSRF dengan pola double-submit cookie.
 *
 * `webcat_rt` (refresh token) dikirim otomatis oleh browser sehingga endpoint
 * yang memakainya rawan CSRF. `webcat_csrf` sengaja **tidak** httpOnly agar
 * klien bisa membacanya dan mengirim ulang lewat header `x-csrf-token`.
 * Penyerang lintas-origin tidak bisa membaca cookie ini, jadi tidak bisa
 * memalsukan header.
 */
export const CSRF_COOKIE = 'webcat_csrf';
export const CSRF_HEADER = 'x-csrf-token';

export function generateCsrfToken(): string {
  return randomBytes(32).toString('base64url');
}

export function csrfCookieOptions(config: AppConfigService): CookieOptions {
  const isProd = config.isProduction;
  const cookieDomain = config.value.COOKIE_DOMAIN?.trim();
  const hasValidDomain =
    isProd &&
    cookieDomain &&
    cookieDomain !== 'localhost' &&
    !cookieDomain.startsWith('127.');

  return {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 3600 * 1000,
    ...(hasValidDomain ? { domain: cookieDomain } : {}),
  };
}

/** Perbandingan waktu-konstan; panjang berbeda langsung dianggap gagal. */
export function csrfTokenMatches(expected: string, received: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  return left.length === right.length && timingSafeEqual(left, right);
}
