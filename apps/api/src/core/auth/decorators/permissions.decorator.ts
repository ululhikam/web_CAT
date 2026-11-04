import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@webcat/contracts';

export const PERMISSIONS_KEY = 'webcat:permissions';

/** Semua permission di daftar ini wajib dimiliki (AND). */
export const RequirePermissions = (
  ...permissions: Permission[]
): MethodDecorator & ClassDecorator => SetMetadata(PERMISSIONS_KEY, permissions);
