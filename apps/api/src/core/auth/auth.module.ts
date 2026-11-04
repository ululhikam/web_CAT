import { Global, Module } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { EmailVerifiedGuard } from './email-verified.guard';

/**
 * Komponen auth lintas-domain: JWT, guard. Global agar modul domain tidak
 * perlu mengimpor berulang.
 *
 * PRINCIPAL_LOADER TIDAK didaftarkan di sini — implementasinya ada di
 * AuthModule (modul domain) dan di-inject secara opsional oleh JwtAuthGuard.
 */
@Global()
@Module({
  providers: [JwtService, JwtAuthGuard, PermissionsGuard, EmailVerifiedGuard],
  exports: [JwtService, JwtAuthGuard, PermissionsGuard, EmailVerifiedGuard],
})
export class CoreAuthModule {}
