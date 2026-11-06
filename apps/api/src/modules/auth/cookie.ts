import type { CookieOptions, Response } from 'express';
import { REFRESH_COOKIE_NAME } from '@webcat/contracts';
import { AppConfigService } from '../../core/config/config.service';
import { CSRF_COOKIE, csrfCookieOptions, generateCsrfToken } from '../../core/security/csrf';

/**
 * Nama cookie sengaja tanpa prefiks `__Host-` karena API dan web berada di
 * domain berbeda saat dev/preview. Di produksi keduanya di bawah domain
 * yang sama sehingga `SameSite=Lax` cukup dan lebih aman.
 */
export const REFRESH_COOKIE = REFRESH_COOKIE_NAME;

export function refreshCookieOptions(config: AppConfigService): CookieOptions {
  const isProd = config.isProduction;
  const cookieDomain = config.value.COOKIE_DOMAIN?.trim();
  const hasValidDomain =
    isProd &&
    cookieDomain &&
    cookieDomain !== 'localhost' &&
    !cookieDomain.startsWith('127.');

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'lax' : 'lax',
    path: '/',
    maxAge: 30 * 24 * 3600 * 1000,
    ...(hasValidDomain ? { domain: cookieDomain } : {}),
  };
}

/**
 * Menulis cookie refresh **dan** token CSRF. Keduanya selalu berpasangan:
 * setiap rotasi refresh token juga merotasi token CSRF.
 */
export function setRefreshCookie(res: Response, config: AppConfigService, token: string): void {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions(config));
  res.cookie(CSRF_COOKIE, generateCsrfToken(), csrfCookieOptions(config));
}

export function clearRefreshCookie(res: Response, config: AppConfigService): void {
  const { maxAge, ...options } = refreshCookieOptions(config);
  void maxAge;
  res.clearCookie(REFRESH_COOKIE, options);

  const { maxAge: csrfMaxAge, ...csrfOptions } = csrfCookieOptions(config);
  void csrfMaxAge;
  res.clearCookie(CSRF_COOKIE, csrfOptions);
}
