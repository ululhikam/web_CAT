import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { ERROR_CODES } from '@webcat/contracts';
import { AppConfigService } from '../../core/config/config.service';
import type { GoogleIdentity } from './auth.service';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const STATE_TTL_MS = 10 * 60 * 1000;

interface TokenResponse {
  access_token?: string;
}

interface UserInfoResponse {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

/**
 * Alur Google OAuth 2.0 / OpenID Connect tanpa SDK.
 *
 * `state` ditandatangani HMAC dan juga disimpan di cookie httpOnly sehingga
 * penyerang tidak dapat memalsukan callback (login CSRF).
 */
@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);

  constructor(private readonly config: AppConfigService) {}

  isConfigured(): boolean {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = this.config.value;
    return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
  }

  private redirectUri(): string {
    return (
      this.config.value.GOOGLE_REDIRECT_URI ??
      `${this.config.value.APP_URL}/api/v1/auth/google/callback`
    );
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.config.value.JWT_ACCESS_SECRET)
      .update(payload)
      .digest('base64url');
  }

  createState(): string {
    const payload = Buffer.from(
      JSON.stringify({ nonce: randomUUID(), exp: Date.now() + STATE_TTL_MS }),
      'utf8',
    ).toString('base64url');

    return `${payload}.${this.sign(payload)}`;
  }

  verifyState(state: string): boolean {
    const [payload, signature] = state.split('.');
    if (!payload || !signature) return false;

    const expected = this.sign(payload);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

    try {
      const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
        exp?: number;
      };
      return typeof parsed.exp === 'number' && parsed.exp > Date.now();
    } catch {
      return false;
    }
  }

  buildAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.value.GOOGLE_CLIENT_ID ?? '',
      redirect_uri: this.redirectUri(),
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });

    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  async fetchProfile(code: string): Promise<GoogleIdentity> {
    this.assertConfigured();

    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.config.value.GOOGLE_CLIENT_ID ?? '',
        client_secret: this.config.value.GOOGLE_CLIENT_SECRET ?? '',
        redirect_uri: this.redirectUri(),
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!tokenResponse.ok) {
      const detail = await tokenResponse.text().catch(() => '');
      this.logger.error('Tukar authorization code Google gagal', {
        status: tokenResponse.status,
        detail: detail.slice(0, 300),
      });
      throw new BadGatewayException({
        code: ERROR_CODES.AUTH_OAUTH_FAILED,
        message: 'Gagal memverifikasi akun Google',
      });
    }

    const token = (await tokenResponse.json()) as TokenResponse;
    if (!token.access_token) {
      throw new BadGatewayException({
        code: ERROR_CODES.AUTH_OAUTH_FAILED,
        message: 'Google tidak mengembalikan access token',
      });
    }

    const infoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${token.access_token}` },
      signal: AbortSignal.timeout(10_000),
    });

    if (!infoResponse.ok) {
      throw new BadGatewayException({
        code: ERROR_CODES.AUTH_OAUTH_FAILED,
        message: 'Gagal mengambil profil Google',
      });
    }

    const info = (await infoResponse.json()) as UserInfoResponse;
    if (!info.sub || !info.email) {
      throw new BadGatewayException({
        code: ERROR_CODES.AUTH_OAUTH_FAILED,
        message: 'Profil Google tidak lengkap',
      });
    }

    return {
      sub: info.sub,
      email: info.email,
      emailVerified: info.email_verified === true,
      ...(info.name ? { name: info.name } : {}),
    };
  }

  private assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new BadGatewayException({
        code: ERROR_CODES.AUTH_OAUTH_NOT_CONFIGURED,
        message: 'Login Google belum dikonfigurasi',
      });
    }
  }
}
