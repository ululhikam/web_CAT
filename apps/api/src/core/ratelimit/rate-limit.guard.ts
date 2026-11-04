import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
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

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly service: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rule = this.reflector.getAllAndOverride<RateLimitRule>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!rule) return true;

    const req = context.switchToHttp().getRequest<Request & { user?: { id: string } }>();
    const scope = rule.scope ?? 'ip';
    const subject = scope === 'user' ? (req.user?.id ?? 'anonymous') : this.clientIp(req);
    const bucket = `${context.getClass().name}.${context.getHandler().name}:${scope}:${subject}`;

    const result = await this.service.consume({
      bucket,
      limit: rule.limit,
      windowSeconds: rule.windowSeconds,
    });

    if (!result.allowed) {
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
