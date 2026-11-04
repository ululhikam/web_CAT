import { Global, Module } from '@nestjs/common';
import { PasswordService } from './password.service';

/**
 * Layanan kriptografi identity. Di-global agar modul users/auth/import
 * tidak perlu impor berulang.
 */
@Global()
@Module({
  providers: [PasswordService],
  exports: [PasswordService],
})
export class SecurityModule {}
