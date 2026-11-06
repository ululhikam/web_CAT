import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { REFRESH_COOKIE_NAME } from '@webcat/contracts';
import { CSRF_COOKIE, CSRF_HEADER, csrfTokenMatches } from './csrf';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Guard CSRF global (lapis kedua setelah `SameSite=Lax`).
 *
 * Aturan:
 *  - Method aman (GET/HEAD/OPTIONS) selalu lolos.
 *  - Request dengan `Authorization: Bearer` lolos: token tidak dikirim
 *    otomatis oleh browser, jadi tidak ada ambient credential.
 *  - Tanpa cookie refresh → tidak ada sesi yang bisa disalahgunakan.
 *  - `POST /auth/refresh` tanpa cookie CSRF tetap lolos sekali agar sesi lama
 *    (sebelum fitur ini) tidak ter-logout; responsnya memasang token baru.
 *  - Selain itu wajib ada `x-csrf-token` yang sama dengan cookie `webcat_csrf`.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(req.method.toUpperCase())) return true;
    if (req.headers.authorization?.startsWith('Bearer ')) return true;

    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    if (!cookies[REFRESH_COOKIE_NAME]) return true;

    const expected = cookies[CSRF_COOKIE];
    if (!expected) {
      // Izinkan refresh sesi lama/transisi yang belum memiliki cookie CSRF
      if (/\/auth\/refresh$/.test(req.path ?? req.url ?? '')) return true;

      throw new ForbiddenException({
        code: 'COMMON_CSRF_FAILED',
        message: 'Token CSRF tidak ada. Muat ulang halaman lalu coba lagi.',
      });
    }

    const received = req.headers[CSRF_HEADER];
    if (typeof received === 'string' && csrfTokenMatches(expected, received)) return true;

    throw new ForbiddenException({
      code: 'COMMON_CSRF_FAILED',
      message: 'Token CSRF tidak valid. Muat ulang halaman lalu coba lagi.',
    });
  }
}
