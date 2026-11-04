import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { ALLOW_UNVERIFIED_KEY } from './decorators/allow-unverified.decorator';
import type { AuthPrincipal } from './auth.types';

/**
 * Email wajib terverifikasi untuk route non-publik, kecuali ditandai
 * @AllowUnverifiedEmail().
 */
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];

    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;
    if (this.reflector.getAllAndOverride<boolean>(ALLOW_UNVERIFIED_KEY, targets)) return true;

    const req = context.switchToHttp().getRequest<Request & { user?: AuthPrincipal }>();
    if (req.user && !req.user.emailVerified) {
      throw new ForbiddenException({
        code: 'AUTH_EMAIL_NOT_VERIFIED',
        message: 'Verifikasi email Anda terlebih dahulu',
      });
    }
    return true;
  }
}
