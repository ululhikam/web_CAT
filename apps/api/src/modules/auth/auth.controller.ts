import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import {
  activateInviteSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  type ActivateInviteInput,
  type ChangePasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
} from '@webcat/contracts';
import { AppConfigService } from '../../core/config/config.service';
import { AuthUser } from '../../core/auth/decorators/current-user.decorator';
import { AllowUnverifiedEmail } from '../../core/auth/decorators/allow-unverified.decorator';
import { Public } from '../../core/auth/decorators/public.decorator';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { zodPipe } from '../../core/http/validation.pipe';
import { RateLimit } from '../../core/ratelimit/rate-limit.guard';
import { AuthService } from './auth.service';
import { clearRefreshCookie, REFRESH_COOKIE, setRefreshCookie } from './cookie';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: AppConfigService,
  ) {}

  private meta(req: Request) {
    return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
  }

  private refreshTokenFrom(req: Request): string | undefined {
    return (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
  }

  @Public()
  @RateLimit({ limit: 5, windowSeconds: 3600 })
  @Post('register')
  @ApiOperation({ summary: 'Registrasi akun peserta dan kirim kode verifikasi email' })
  register(@Body(zodPipe(registerSchema)) body: RegisterInput) {
    return this.auth.register(body);
  }

  @Public()
  @RateLimit({ limit: 10, windowSeconds: 900 })
  @HttpCode(200)
  @Post('verify-email')
  @ApiOperation({ summary: 'Verifikasi email dengan kode 6 digit' })
  verifyEmail(@Body(zodPipe(verifyEmailSchema)) body: VerifyEmailInput) {
    return this.auth.verifyEmail(body);
  }

  @Public()
  @RateLimit({ limit: 3, windowSeconds: 900 })
  @HttpCode(200)
  @Post('resend-verification')
  @ApiOperation({ summary: 'Kirim ulang kode verifikasi email' })
  resendVerification(@Body(zodPipe(resendVerificationSchema)) body: { email: string }) {
    return this.auth.resendVerification(body.email);
  }

  @Public()
  @RateLimit({ limit: 10, windowSeconds: 900 })
  @HttpCode(200)
  @Post('login')
  @ApiOperation({ summary: 'Login email + password (set cookie refresh dan CSRF)' })
  async login(
    @Body(zodPipe(loginSchema)) body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(body, this.meta(req));
    setRefreshCookie(res, this.config, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @RateLimit({ limit: 60, windowSeconds: 900 })
  @HttpCode(200)
  @Post('refresh')
  @ApiOperation({ summary: 'Perbarui access token dari cookie refresh (rotasi token)' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.refresh(this.refreshTokenFrom(req), this.meta(req));
    setRefreshCookie(res, this.config, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @HttpCode(200)
  @Post('logout')
  @ApiOperation({ summary: 'Logout sesi saat ini dan hapus cookie' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(this.refreshTokenFrom(req));
    clearRefreshCookie(res, this.config);
    return { message: 'Berhasil keluar' };
  }

  @Public()
  @RateLimit({ limit: 3, windowSeconds: 900 })
  @HttpCode(200)
  @Post('forgot-password')
  @ApiOperation({ summary: 'Minta kode reset password' })
  forgotPassword(@Body(zodPipe(forgotPasswordSchema)) body: { email: string }) {
    return this.auth.forgotPassword(body.email);
  }

  @Public()
  @RateLimit({ limit: 5, windowSeconds: 900 })
  @HttpCode(200)
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password memakai kode verifikasi' })
  resetPassword(@Body(zodPipe(resetPasswordSchema)) body: ResetPasswordInput) {
    return this.auth.resetPassword(body);
  }

  @Public()
  @RateLimit({ limit: 5, windowSeconds: 900 })
  @HttpCode(200)
  @Post('activate-invite')
  @ApiOperation({ summary: 'Aktivasi akun undangan dari admin' })
  activateInvite(@Body(zodPipe(activateInviteSchema)) body: ActivateInviteInput) {
    return this.auth.activateInvite(body);
  }

  @ApiBearerAuth()
  @AllowUnverifiedEmail()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Profil singkat pengguna yang sedang login' })
  me(@AuthUser() user: AuthPrincipal) {
    return this.auth.me(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Post('change-password')
  @ApiOperation({ summary: 'Ubah password dengan verifikasi password lama' })
  changePassword(
    @AuthUser() user: AuthPrincipal,
    @Body(zodPipe(changePasswordSchema)) body: ChangePasswordInput,
  ) {
    return this.auth.changePassword(user.id, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Post('logout-all')
  @ApiOperation({ summary: 'Logout dari semua perangkat' })
  logoutAll(@AuthUser() user: AuthPrincipal) {
    return this.auth.logoutAll(user.id);
  }

  /** Daftar perangkat/sesi aktif milik user yang sedang login. */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ApiOperation({ summary: 'Daftar sesi login aktif' })
  sessions(@AuthUser() user: AuthPrincipal) {
    return this.auth.listSessions(user.id, user.sessionId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Cabut satu sesi login berdasarkan id' })
  revokeSession(@AuthUser() user: AuthPrincipal, @Param('id') id: string) {
    return this.auth.revokeSession(user.id, id);
  }
}
