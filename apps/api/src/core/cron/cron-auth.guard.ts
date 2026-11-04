import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { AppConfigService } from '../config/config.service';

/**
 * Vercel Cron mengirim header `Authorization: Bearer $CRON_SECRET`.
 * Perbandingan memakai timingSafeEqual agar tidak bisa di-brute-force timing.
 */
@Injectable()
export class CronAuthGuard implements CanActivate {
  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
    const expected = this.config.value.CRON_SECRET;

    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    const ok = a.length === b.length && timingSafeEqual(a, b);

    if (!ok) {
      throw new UnauthorizedException({
        code: 'COMMON_UNAUTHORIZED',
        message: 'Cron secret tidak valid',
      });
    }
    return true;
  }
}
