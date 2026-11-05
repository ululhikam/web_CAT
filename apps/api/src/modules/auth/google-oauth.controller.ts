import {
  Controller,
  Get,
  Logger,
  Query,
  Req,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ERROR_CODES } from '@webcat/contracts';
import { AppConfigService } from '../../core/config/config.service';
import { Public } from '../../core/auth/decorators/public.decorator';
import { AuthService } from './auth.service';
import { setRefreshCookie } from './cookie';
import { GoogleOAuthService } from './google-oauth.service';

const STATE_COOKIE = 'webcat_oauth_state';
const STATE_PATH = '/api/v1/auth/google';

@ApiTags('Auth')
@Controller('auth/google')
export class GoogleOAuthController {
  private readonly logger = new Logger(GoogleOAuthController.name);

  constructor(
    private readonly oauth: GoogleOAuthService,
    private readonly auth: AuthService,
    private readonly config: AppConfigService,
  ) {}

  @Public()
  @Get()
  start(@Res() res: Response): void {
    if (!this.oauth.isConfigured()) {
      throw new ServiceUnavailableException({
        code: ERROR_CODES.AUTH_OAUTH_NOT_CONFIGURED,
        message:
          'Login Google belum dikonfigurasi. Atur GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET.',
      });
    }

    const state = this.oauth.createState();
    res.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: 'lax',
      path: STATE_PATH,
      maxAge: 10 * 60 * 1000,
    });
    res.redirect(302, this.oauth.buildAuthUrl(state));
  }

  /**
   * Callback selalu mengembalikan redirect ke web (bukan JSON) agar pengguna
   * melihat pesan yang ramah. Kode error disampaikan lewat query `error`.
   */
  @Public()
  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const expected = (req.cookies as Record<string, string> | undefined)?.[STATE_COOKIE];
    res.clearCookie(STATE_COOKIE, { path: STATE_PATH });

    const fail = (errorCode: string) => {
      const target = new URL('/login', this.config.value.APP_URL);
      target.searchParams.set('error', errorCode);
      res.redirect(302, target.toString());
    };

    if (!code || !state || !expected || state !== expected || !this.oauth.verifyState(state)) {
      fail('oauth_state');
      return;
    }

    try {
      const identity = await this.oauth.fetchProfile(code);
      const tokens = await this.auth.loginWithGoogle(identity, {
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });

      setRefreshCookie(res, this.config, tokens.refreshToken);

      /**
       * Tujuan pasca-login mengikuti role, sama seperti login password:
       * peserta → /dashboard, ADMIN → /admin, SUPER_ADMIN → /super-admin.
       */
      const home =
        tokens.user.role === 'SUPER_ADMIN'
          ? '/super-admin'
          : tokens.user.role === 'ADMIN'
            ? '/admin'
            : '/dashboard';
      const target = new URL(home, this.config.value.APP_URL);
      target.searchParams.set('oauth', 'success');
      res.redirect(302, target.toString());
    } catch (error) {
      const code =
        (error as { response?: { code?: string } }).response?.code ?? ERROR_CODES.AUTH_OAUTH_FAILED;
      this.logger.warn('Login Google gagal', {
        code,
        message: error instanceof Error ? error.message : String(error),
      });
      fail(code);
    }
  }
}
