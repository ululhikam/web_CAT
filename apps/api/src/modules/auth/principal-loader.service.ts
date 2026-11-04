import { Injectable } from '@nestjs/common';
import type { PrincipalLoader } from '../../core/auth/principal-loader';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { AuthService } from './auth.service';

/**
 * Satu-satunya implementasi PrincipalLoader.
 *
 * Biaya per request terautentikasi: 1 query (session join user+role+permissions).
 * Tidak di-cache di memori karena instance serverless dipakai bergantian
 * oleh banyak user; `tokenVersion` sudah menjamin validasi tetap murah.
 */
@Injectable()
export class PrincipalLoaderService implements PrincipalLoader {
  constructor(private readonly auth: AuthService) {}

  async load(input: { sub: string; sid: string; ver: number }): Promise<AuthPrincipal | null> {
    const result = await this.auth.loadPrincipal(input);
    if (!result) return null;

    const { user, sessionId } = result;
    return {
      id: user.id,
      sessionId,
      role: user.role,
      permissions: user.permissions as AuthPrincipal['permissions'],
      emailVerified: user.emailVerified,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
