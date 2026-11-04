import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthPrincipal } from '../auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthPrincipal | undefined => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthPrincipal }>();
    return req.user;
  },
);

/** Varian yang menolak request tanpa user; gunakan pada route terproteksi. */
export const AuthUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthPrincipal => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthPrincipal }>();
    if (!req.user) throw new Error('AuthUser dipakai pada route tanpa JwtAuthGuard');
    return req.user;
  },
);
