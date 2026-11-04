import { Injectable } from '@nestjs/common';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { AppConfigService } from '../config/config.service';
import type { AccessTokenPayload } from './auth.types';

/**
 * Access token: JWT HS256 berumur pendek (default 15 menit).
 * Refresh token BUKAN JWT — ia opaque dan disimpan sebagai hash di DB.
 */
@Injectable()
export class JwtService {
  constructor(private readonly config: AppConfigService) {}

  signAccessToken(payload: Omit<AccessTokenPayload, 'iat' | 'exp'>): string {
    const { JWT_ACCESS_SECRET, ACCESS_TOKEN_TTL } = this.config.value;
    return jwt.sign(payload, JWT_ACCESS_SECRET, {
      algorithm: 'HS256',
      expiresIn: ACCESS_TOKEN_TTL as SignOptions['expiresIn'],
      issuer: 'webcat',
      audience: 'webcat-web',
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const { JWT_ACCESS_SECRET } = this.config.value;
    return jwt.verify(token, JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
      issuer: 'webcat',
      audience: 'webcat-web',
    }) as AccessTokenPayload;
  }

  /** Token sekali pakai untuk verifikasi email / reset password / undangan. */
  signActionToken(payload: { sub: string; purpose: string }, ttl: string): string {
    const { JWT_REFRESH_SECRET } = this.config.value;
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      algorithm: 'HS256',
      expiresIn: ttl as SignOptions['expiresIn'],
      issuer: 'webcat',
      audience: 'webcat-action',
    });
  }

  verifyActionToken(token: string, purpose: string): { sub: string; purpose: string } {
    const { JWT_REFRESH_SECRET } = this.config.value;
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
      issuer: 'webcat',
      audience: 'webcat-action',
    }) as { sub: string; purpose: string };
    if (decoded.purpose !== purpose) {
      throw new Error('Token purpose tidak cocok');
    }
    return decoded;
  }
}
