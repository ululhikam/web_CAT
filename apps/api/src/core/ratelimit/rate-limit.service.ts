import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ConsumeOptions {
  /** Kunci bucket, mis. `login:ip:1.2.3.4`. */
  bucket: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Token bucket berbasis Postgres (tanpa Redis).
 *
 * Satu statement UPSERT atomik: aman untuk request paralel karena baris
 * `(bucket, window_start)` terkunci oleh Postgres.
 */
@Injectable()
export class RateLimitService {
  constructor(private readonly prisma: PrismaService) {}

  private windowStart(windowSeconds: number): Date {
    const size = windowSeconds * 1000;
    return new Date(Math.floor(Date.now() / size) * size);
  }

  async consume(options: ConsumeOptions): Promise<RateLimitResult> {
    const windowStart = this.windowStart(options.windowSeconds);
    const resetsAt = new Date(windowStart.getTime() + options.windowSeconds * 1000);

    const rows = await this.prisma.$queryRaw<Array<{ hits: number }>>`
      INSERT INTO rate_limit_hits ("bucket", "window_start", "hits")
      VALUES (${options.bucket}, ${windowStart}, 1)
      ON CONFLICT ("bucket", "window_start")
      DO UPDATE SET "hits" = rate_limit_hits."hits" + 1
      RETURNING "hits"
    `;

    const hits = Number(rows[0]?.hits ?? options.limit + 1);
    const remaining = Math.max(0, options.limit - hits);
    const retryAfterSeconds = Math.max(
      0,
      Math.ceil((resetsAt.getTime() - Date.now()) / 1000),
    );

    return { allowed: hits <= options.limit, remaining, retryAfterSeconds };
  }
}
