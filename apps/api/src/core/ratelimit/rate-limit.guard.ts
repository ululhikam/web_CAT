import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { AppConfigService } from '../config/config.service';
import { RateLimitService } from './rate-limit.service';

export interface RateLimitRule {
  limit: number;
  windowSeconds: number;
  /** Default: per IP. `user` menuntut JwtAuthGuard berjalan lebih dulu. */
  scope?: 'ip' | 'user';
}

export const RATE_LIMIT_KEY = 'webcat:rateLimit';

/** Contoh: @RateLimit({ limit: 5, windowSeconds: 900 }) */
export const RateLimit = (rule: RateLimitRule): MethodDecorator & ClassDecorator =>
  SetMetadata(RATE_LIMIT_KEY, rule);

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

/** Jendela default rate limit global. */
const GLOBAL_WINDOW_SECONDS = 60;

/**
 * Rate limit dua lapis:
 *
 * 1. **Global** (`RATE_LIMIT_GLOBAL_PER_MINUTE`, default 600/menit) untuk
 *    semua endpoint yang tidak punya `@RateLimit`. Kunci per pengguna login
 *    bila tersedia, selain itu per IP — supaya pengguna di balik NAT tidak
 *    saling memblokir.
 * 2. **Per-rute** lewat `@RateLimit`, menggantikan aturan global. Dipakai
 *    untuk endpoint sensitif seperti login dan checkout.
 *
 * Respons 429 menyertakan header `Retry-After` agar klien tahu kapan boleh
 * mencoba lagi.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly service: RateLimitService,
    private readonly config: AppConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const explicit = this.reflector.getAllAndOverride<RateLimitRule>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const rule = explicit ?? {
      limit: this.config.value.RATE_LIMIT_GLOBAL_PER_MINUTE,
      windowSeconds: GLOBAL_WINDOW_SECONDS,
    };

    // Aturan eksplisit tanpa `scope` tetap per IP (perilaku lama). Aturan
    // global memilih per pengguna bila request sudah terautentikasi.
    const scope = explicit?.scope ?? (req.user?.id ? 'user' : 'ip');
    const subject = scope === 'user' ? (req.user?.id ?? 'anonymous') : this.clientIp(req);
    const bucket = explicit
      ? `${context.getClass().name}.${context.getHandler().name}:${scope}:${subject}`
      : `global:${scope}:${subject}`;

    const result = await this.service.consume({
      bucket,
      limit: rule.limit,
      windowSeconds: rule.windowSeconds,
    });

    if (!result.allowed) {
      context
        .switchToHttp()
        .getResponse<Response>()
        .setHeader('Retry-After', String(result.retryAfterSeconds));
      throw new HttpException(
        {
          code: 'COMMON_RATE_LIMITED',
          message: 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
          details: { retryAfterSeconds: result.retryAfterSeconds },
        },
        429,
      );
    }

    return true;
  }

  private clientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0]?.trim() ?? 'unknown';
    }
    return req.ip ?? 'unknown';
  }
}
