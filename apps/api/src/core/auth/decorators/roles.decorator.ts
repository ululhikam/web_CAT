import { SetMetadata } from '@nestjs/common';
import type { Role } from '@webcat/contracts';

export const ROLES_KEY = 'webcat:roles';

/** Pembatas tambahan berbasis role; permission tetap jalur utama. */
export const RequireRoles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
