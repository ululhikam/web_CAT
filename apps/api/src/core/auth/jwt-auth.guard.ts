import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { JwtService } from './jwt.service';
import { PRINCIPAL_LOADER, type PrincipalLoader } from './principal-loader';
import type { AuthPrincipal } from './auth.types';

/**
 * 1. Verifikasi signature + exp access token.
 * 2. Muat principal (role + permission) lewat PrincipalLoader, yang sekaligus
 *    memastikan sesi masih aktif dan `token_version` masih cocok.
 *
 * Tanpa PrincipalLoader (mis. saat unit test), guard hanya memverifikasi JWT.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @Optional()
    @Inject(PRINCIPAL_LOADER)
    private readonly loader?: PrincipalLoader,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request & { user?: AuthPrincipal }>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        code: 'COMMON_UNAUTHORIZED',
        message: 'Access token tidak ditemukan',
      });
    }

    let payload;
    try {
      payload = this.jwt.verifyAccessToken(header.slice('Bearer '.length));
    } catch {
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_INVALID',
        message: 'Access token tidak valid atau kedaluwarsa',
      });
    }

    if (!this.loader) {
      req.user = {
        id: payload.sub,
        sessionId: payload.sid,
        role: payload.role,
        permissions: [],
        emailVerified: true,
        mustChangePassword: false,
      };
      return true;
    }

    const principal = await this.loader.load({
      sub: payload.sub,
      sid: payload.sid,
      ver: payload.ver,
    });

    if (!principal) {
      throw new UnauthorizedException({
        code: 'AUTH_SESSION_REVOKED',
        message: 'Sesi tidak valid atau sudah berakhir',
      });
    }

    req.user = principal;
    return true;
  }
}
