import { Injectable, Logger } from '@nestjs/common';
import { parseEnv, type Env } from './env.schema';

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);
  private readonly env: Env;

  constructor() {
    this.env = parseEnv(process.env);
    this.logger.log(`Environment dimuat (NODE_ENV=${this.env.NODE_ENV})`);
  }

  get value(): Env {
    return this.env;
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  get isDev(): boolean {
    return this.env.NODE_ENV === 'development';
  }

  /** Daftar env yang wajib ada untuk mode tertentu (dipakai env:check). */
  static requiredFor(env: NodeJS.ProcessEnv): string[] {
    const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'CRON_SECRET'];
    if (env.NODE_ENV === 'production') {
      required.push('SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY');
      if (env.MAIL === 'resend') required.push('RESEND_API_KEY');
      if (env.PAYMENT === 'midtrans') required.push('MIDTRANS_SERVER_KEY', 'MIDTRANS_CLIENT_KEY');
    }
    return required;
  }
}
