import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { JobQueueService } from '../jobs/job-queue.service';
import { OutboxService } from '../jobs/outbox.service';
import { LoggerService } from '../logger/logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { CronAuthGuard } from './cron-auth.guard';

interface CronRunResult {
  job: string;
  processed: number;
  details?: Record<string, unknown>;
}

/**
 * Endpoint cron (dipanggil Vercel Cron tiap menit). Semua idempoten:
 * aman dipanggil dua kali bersamaan karena klaim memakai SKIP LOCKED.
 *
 * B3/B4 mengisi logika domain di service masing-masing; Phase 0 hanya
 * menyediakan kerangka + housekeeping yang sudah final.
 */
@ApiExcludeController()
@Public()
@UseGuards(CronAuthGuard)
@Controller('internal/cron')
export class CronController {
  constructor(
    private readonly jobs: JobQueueService,
    private readonly outbox: OutboxService,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  @Post('finalize-subtests')
  async finalizeSubtests(): Promise<CronRunResult> {
    // B3: subtes ACTIVE yang ends_at < now() → EXPIRED + tulis subtest_locks.
    return { job: 'finalize-subtests', processed: 0, details: { owner: 'B3' } };
  }

  @Post('process-jobs')
  async processJobs(): Promise<CronRunResult> {
    const stale = await this.jobs.releaseStale(10);
    const claimed = await this.jobs.claim(20);

    for (const job of claimed) {
      // Phase 0 belum ada handler domain; job ditandai selesai agar antrean
      // tidak menumpuk. B2/B3/B4 mendaftarkan handler lewat JobRegistry.
      await this.jobs.complete(job.id);
    }

    const outboxRows = await this.outbox.claimPending(20);
    for (const row of outboxRows) {
      this.logger.info('Outbox event diproses', { topic: row.topic, id: row.id });
      await this.outbox.markProcessed(row.id);
    }

    return {
      job: 'process-jobs',
      processed: claimed.length + outboxRows.length,
      details: { staleReleased: stale, jobs: claimed.length, outbox: outboxRows.length },
    };
  }

  @Post('expire-subscriptions')
  async expireSubscriptions(): Promise<CronRunResult> {
    const result = await this.prisma.subscription.updateMany({
      where: { status: 'ACTIVE', endsAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });
    return { job: 'expire-subscriptions', processed: result.count };
  }

  @Post('cleanup')
  async cleanup(): Promise<CronRunResult> {
    const now = new Date();
    const expiredTokens = await this.prisma.verificationToken.deleteMany({
      where: { expiresAt: { lt: new Date(now.getTime() - 7 * 24 * 3600 * 1000) } },
    });
    const oldRateLimits = await this.prisma.rateLimitHit.deleteMany({
      where: { windowStart: { lt: new Date(now.getTime() - 24 * 3600 * 1000) } },
    });
    const oldSessions = await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date(now.getTime() - 30 * 24 * 3600 * 1000) } },
    });

    return {
      job: 'cleanup',
      processed: expiredTokens.count + oldRateLimits.count + oldSessions.count,
      details: {
        verificationTokens: expiredTokens.count,
        rateLimitHits: oldRateLimits.count,
        sessions: oldSessions.count,
      },
    };
  }
}
