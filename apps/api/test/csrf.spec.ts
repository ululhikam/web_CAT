import { ForbiddenException } from '@nestjs/common';
import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { AppConfigService } from '../src/core/config/config.service';
import {
  CSRF_COOKIE,
  CSRF_HEADER,
  csrfTokenMatches,
  generateCsrfToken,
} from '../src/core/security/csrf';
import { CsrfGuard } from '../src/core/security/csrf.guard';
import { clearRefreshCookie, REFRESH_COOKIE, setRefreshCookie } from '../src/modules/auth/cookie';

function makeContext(input: {
  method?: string;
  path?: string;
  authorization?: string;
  cookies?: Record<string, string>;
  csrfHeader?: string;
}) {
  const headers: Record<string, string | undefined> = {};
  if (input.authorization) headers.authorization = input.authorization;
  if (input.csrfHeader !== undefined) headers[CSRF_HEADER] = input.csrfHeader;

  const request = {
    method: input.method ?? 'POST',
    path: input.path ?? '/api/v1/auth/logout',
    headers,
    cookies: input.cookies ?? {},
  };

  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  };

  return context as never;
}

describe('CsrfGuard', () => {
  const guard = new CsrfGuard();

  it('meloloskan method aman tanpa token', () => {
    expect(guard.canActivate(makeContext({ method: 'GET' }))).toBe(true);
    expect(guard.canActivate(makeContext({ method: 'OPTIONS' }))).toBe(true);
  });

  it('meloloskan request Bearer karena tidak ada ambient credential', () => {
    const context = makeContext({
      authorization: 'Bearer access-token',
      cookies: { [REFRESH_COOKIE]: 'rt', [CSRF_COOKIE]: 'csrf-cookie' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('meloloskan request tanpa cookie sesi', () => {
    expect(guard.canActivate(makeContext({}))).toBe(true);
  });

  it('meloloskan request cookie dengan token yang cocok', () => {
    const token = generateCsrfToken();
    const context = makeContext({
      cookies: { [REFRESH_COOKIE]: 'rt', [CSRF_COOKIE]: token },
      csrfHeader: token,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('menolak 403 bila header CSRF tidak ada', () => {
    const context = makeContext({
      cookies: { [REFRESH_COOKIE]: 'rt', [CSRF_COOKIE]: 'csrf-cookie' },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('menolak 403 bila header CSRF tidak cocok', () => {
    const context = makeContext({
      cookies: { [REFRESH_COOKIE]: 'rt', [CSRF_COOKIE]: 'csrf-cookie' },
      csrfHeader: 'token-lain',
    });

    let error: unknown;
    try {
      guard.canActivate(context);
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(ForbiddenException);
    expect((error as ForbiddenException).getResponse()).toMatchObject({
      code: 'COMMON_CSRF_FAILED',
    });
  });

  it('mengizinkan refresh sesi lama yang belum punya cookie CSRF', () => {
    const context = makeContext({
      path: '/api/v1/auth/refresh',
      cookies: { [REFRESH_COOKIE]: 'rt' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('menolak endpoint lain pada sesi lama tanpa cookie CSRF', () => {
    const context = makeContext({
      path: '/api/v1/auth/logout',
      cookies: { [REFRESH_COOKIE]: 'rt' },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});

describe('csrfTokenMatches', () => {
  it('membandingkan token dengan benar', () => {
    const token = generateCsrfToken();
    expect(csrfTokenMatches(token, token)).toBe(true);
    expect(csrfTokenMatches(token, `${token}x`)).toBe(false);
    expect(csrfTokenMatches(token, '')).toBe(false);
  });
});

describe('cookie refresh + CSRF', () => {
  const config = { isProduction: false, value: {} } as unknown as AppConfigService;

  it('menulis kedua cookie berpasangan', () => {
    const res = { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as Response;
    const set = res.cookie as unknown as ReturnType<typeof vi.fn>;

    setRefreshCookie(res, config, 'refresh-token');

    expect(set).toHaveBeenCalledTimes(2);
    expect(set.mock.calls.map((call) => call[0])).toEqual([REFRESH_COOKIE, CSRF_COOKIE]);
    expect(set.mock.calls[1]?.[1]).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('membersihkan kedua cookie saat logout', () => {
    const res = { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as Response;
    const clear = res.clearCookie as unknown as ReturnType<typeof vi.fn>;

    clearRefreshCookie(res, config);

    expect(clear).toHaveBeenCalledTimes(2);
    expect(clear.mock.calls.map((call) => call[0])).toEqual([REFRESH_COOKIE, CSRF_COOKIE]);
  });
});
