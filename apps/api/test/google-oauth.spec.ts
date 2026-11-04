import { describe, expect, it, vi, afterEach } from 'vitest';
import { GoogleOAuthService } from '../src/modules/auth/google-oauth.service';

const config = {
  value: {
    JWT_ACCESS_SECRET: 'x'.repeat(32),
    GOOGLE_CLIENT_ID: 'client-id.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: 'client-secret',
    GOOGLE_REDIRECT_URI: 'https://app.example.com/api/v1/auth/google/callback',
    APP_URL: 'https://app.example.com',
  },
  isProduction: true,
};

function makeService(overrides: Record<string, unknown> = {}) {
  return new GoogleOAuthService({
    ...config,
    value: { ...config.value, ...overrides },
  } as never);
}

describe('GoogleOAuthService', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('mendeteksi konfigurasi lengkap', () => {
    expect(makeService().isConfigured()).toBe(true);
    expect(makeService({ GOOGLE_CLIENT_ID: undefined }).isConfigured()).toBe(false);
    expect(makeService({ GOOGLE_CLIENT_SECRET: undefined }).isConfigured()).toBe(false);
  });

  it('state bertanda tangan valid dan menolak perubahan/kedaluwarsa', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    const service = makeService();
    const state = service.createState();

    expect(state).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(service.verifyState(state)).toBe(true);

    const tampered = `${state.slice(0, -1)}A`;
    expect(service.verifyState(tampered)).toBe(false);

    vi.setSystemTime(new Date('2026-01-01T00:11:00.000Z'));
    expect(service.verifyState(state)).toBe(false);
  });

  it('membangun URL consent dengan redirect dan scope yang benar', () => {
    const url = new URL(makeService().buildAuthUrl('state-123'));

    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.searchParams.get('client_id')).toBe(config.value.GOOGLE_CLIENT_ID);
    expect(url.searchParams.get('redirect_uri')).toBe(config.value.GOOGLE_REDIRECT_URI);
    expect(url.searchParams.get('state')).toBe('state-123');
    expect(url.searchParams.get('scope')).toBe('openid email profile');
  });

  it('menukar code menjadi profil Google', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'token-1' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            sub: 'google-123',
            email: 'User@Example.com',
            email_verified: true,
            name: 'User',
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const identity = await makeService().fetchProfile('code-1');

    expect(identity).toEqual({
      sub: 'google-123',
      email: 'User@Example.com',
      emailVerified: true,
      name: 'User',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const tokenCall = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(tokenCall[0]).toBe('https://oauth2.googleapis.com/token');
    const body = tokenCall[1].body as URLSearchParams;
    expect(body.get('code')).toBe('code-1');
    expect(body.get('client_secret')).toBe(config.value.GOOGLE_CLIENT_SECRET);
  });

  it('mengembalikan AUTH_OAUTH_FAILED saat Google menolak code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(new Response('invalid_grant', { status: 400 })),
    );

    await expect(makeService().fetchProfile('code-expired')).rejects.toMatchObject({
      response: { code: 'AUTH_OAUTH_FAILED' },
    });
  });
});
