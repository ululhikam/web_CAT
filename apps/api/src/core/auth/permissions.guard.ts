import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Permission, Role } from '@webcat/contracts';
import { PERMISSIONS_KEY } from './decorators/permissions.decorator';
import { ROLES_KEY } from './decorators/roles.decorator';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import type { AuthPrincipal } from './auth.types';

/**
 * Permission-based, bukan role-based: SUPER_ADMIN otomatis lolos karena
 * memiliki semua permission. Pemeriksaan hanya di backend — UI hanya
 * menyembunyikan tombol.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length && !roles?.length) return true;

    const req = context.switchToHttp().getRequest<Request & { user?: AuthPrincipal }>();
    const user = req.user;
    if (!user) {
      throw new ForbiddenException({
        code: 'COMMON_FORBIDDEN',
        message: 'Akses ditolak',
      });
    }

    // SUPER_ADMIN otomatis lolos untuk semua operasi CRUD dan administrasi
    if (user.role === 'SUPER_ADMIN') return true;

    if (roles?.length && !roles.includes(user.role)) {
      throw new ForbiddenException({
        code: 'COMMON_FORBIDDEN',
        message: 'Role Anda tidak memiliki akses ke fitur ini',
      });
    }

    if (required?.length) {
      const missing = required.filter((permission) => !user.permissions.includes(permission));
      if (missing.length > 0) {
        throw new ForbiddenException({
          code: 'COMMON_FORBIDDEN',
          message: 'Anda tidak memiliki izin untuk aksi ini',
          details: { missing },
        });
      }
    }

    return true;
  }
}
