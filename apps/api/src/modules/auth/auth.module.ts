import { Global, Module } from '@nestjs/common';
import { PRINCIPAL_LOADER } from '../../core/auth/principal-loader';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleOAuthController } from './google-oauth.controller';
import { GoogleOAuthService } from './google-oauth.service';
import { PrincipalLoaderService } from './principal-loader.service';

/**
 * Global: AuthService dan PRINCIPAL_LOADER dibutuhkan guard global serta
 * modul users/billing. Jangan impor ulang di modul lain.
 */
@Global()
@Module({
  controllers: [AuthController, GoogleOAuthController],
  providers: [
    AuthService,
    GoogleOAuthService,
    PrincipalLoaderService,
    { provide: PRINCIPAL_LOADER, useExisting: PrincipalLoaderService },
  ],
  exports: [AuthService, PrincipalLoaderService, PRINCIPAL_LOADER],
})
export class AuthModule {}
