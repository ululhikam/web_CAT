import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { JobQueueService } from '../jobs/job-queue.service';
import { OutboxService } from '../jobs/outbox.service';
import { LoggerService } from '../logger/logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { BillingExpiryService } from '../../modules/billing/billing-expiry.service';
import { PaymentsService } from '../../modules/payments/payments.service';
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
 * Logika domain dijalankan lewat service masing-masing; controller hanya
 * mengorkestrasi urutan dan mengembalikan ringkasan.
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
    private readonly billing: BillingExpiryService,
    private readonly payments: PaymentsService,
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

  /**
   * Siklus hidup langganan & tagihan:
   *  1. Langganan PENDING yang mencapai `starts_at` → ACTIVE.
   *  2. Langganan ACTIVE yang lewat `ends_at` → EXPIRED (+ event + outbox).
   *  3. Tagihan PENDING yang lewat `expires_at` → EXPIRED.
   *  4. Tagihan PENDING tanpa `expires_at` yang lebih dari 24 jam → EXPIRED.
   *  5. Pengingat H-3 dan H-0 (maksimal sekali per jendela).
   */
  @Post('expire-subscriptions')
  async expireSubscriptions(): Promise<CronRunResult> {
    const now = new Date();
    const activated = await this.billing.activateDueSubscriptions(now);
    const subscriptions = await this.billing.expireDueSubscriptions(now);
    const overdue = await this.payments.expireOverdue(now);
    const stale = await this.payments.expireStale(now);
    const reminders = await this.billing.sendExpiryReminders(now);

    return {
      job: 'expire-subscriptions',
      processed: activated + subscriptions + overdue + stale,
      details: {
        subscriptionsActivated: activated,
        subscriptions,
        transactionsOverdue: overdue,
        transactionsStale: stale,
        remindersSent: reminders.sent,
        remindersSkipped: reminders.skipped,
      },
    };
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
