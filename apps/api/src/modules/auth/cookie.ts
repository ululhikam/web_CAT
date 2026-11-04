import type { CookieOptions, Response } from 'express';
import { REFRESH_COOKIE_NAME } from '@webcat/contracts';
import { AppConfigService } from '../../core/config/config.service';

/**
 * Nama cookie sengaja tanpa prefiks `__Host-` karena API dan web berada di
 * domain berbeda saat dev/preview. Di produksi keduanya di bawah domain
 * yang sama sehingga `SameSite=Lax` cukup dan lebih aman.
 */
export const REFRESH_COOKIE = REFRESH_COOKIE_NAME;

export function refreshCookieOptions(config: AppConfigService): CookieOptions {
  const isProd = config.isProduction;
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'lax' : 'lax',
    path: '/',
    maxAge: 30 * 24 * 3600 * 1000,
    ...(isProd && config.value.COOKIE_DOMAIN ? { domain: config.value.COOKIE_DOMAIN } : {}),
  };
}

export function setRefreshCookie(res: Response, config: AppConfigService, token: string): void {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions(config));
}

export function clearRefreshCookie(res: Response, config: AppConfigService): void {
  const { maxAge, ...options } = refreshCookieOptions(config);
  void maxAge;
  res.clearCookie(REFRESH_COOKIE, options);
}
