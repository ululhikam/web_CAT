import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { CronAuthGuard } from '../src/core/cron/cron-auth.guard';
import { CronController } from '../src/core/cron/cron.controller';
import { JobQueueService } from '../src/core/jobs/job-queue.service';

const BASE_STATS = {
  pending: 0,
  running: 0,
  failed: 0,
  oldestPendingAgeSeconds: null as number | null,
};

function makeLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
}

function makeController(stats = BASE_STATS, threshold = 100) {
  const jobs = {
    stats: vi.fn(async () => stats),
    releaseStale: vi.fn(async () => 0),
    claim: vi.fn(async () => []),
    complete: vi.fn(async () => undefined),
  };
  const outbox = {
    claimPending: vi.fn(async () => []),
    markProcessed: vi.fn(async () => undefined),
  };
  const logger = makeLogger();
  const config = { value: { JOB_BACKLOG_ALERT_THRESHOLD: threshold } };

  const controller = new CronController(
    jobs as never,
    outbox as never,
    {} as never,
    logger as never,
    {} as never,
    {} as never,
    config as never,
  );

  return { controller, jobs, outbox, logger };
}

describe('JobQueueService.stats', () => {
  it('menghitung status dan umur job PENDING tertua', async () => {
    const prisma = {
      jobQueue: {
        count: vi
          .fn()
          .mockResolvedValueOnce(3)
          .mockResolvedValueOnce(1)
          .mockResolvedValueOnce(2),
        findFirst: vi.fn(async () => ({ createdAt: new Date(Date.now() - 65_000) })),
      },
    };
    const service = new JobQueueService(prisma as never, makeLogger() as never);

    const stats = await service.stats();

    expect(stats).toMatchObject({ pending: 3, running: 1, failed: 2 });
    expect(stats.oldestPendingAgeSeconds).toBeGreaterThanOrEqual(64);
  });

  it('mengembalikan null bila antrean kosong', async () => {
    const prisma = {
      jobQueue: { count: vi.fn(async () => 0), findFirst: vi.fn(async () => null) },
    };
    const service = new JobQueueService(prisma as never, makeLogger() as never);

    const stats = await service.stats();

    expect(stats).toEqual({
      pending: 0,
      running: 0,
      failed: 0,
      oldestPendingAgeSeconds: null,
    });
  });
});

describe('CronController.backlog', () => {
  it('tidak memberi alert selama pending <= ambang', async () => {
    const { controller, logger } = makeController({ ...BASE_STATS, pending: 100 }, 100);

    const result = await controller.backlog();

    expect(result).toMatchObject({ pending: 100, threshold: 100, alert: false });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('memberi alert dan log saat pending melewati ambang', async () => {
    const { controller, logger } = makeController(
      { ...BASE_STATS, pending: 101, oldestPendingAgeSeconds: 90 },
      100,
    );

    const result = await controller.backlog();

    expect(result).toMatchObject({ pending: 101, threshold: 100, alert: true });
    expect(logger.warn).toHaveBeenCalledWith(
      'Backlog job melewati ambang',
      expect.objectContaining({ pending: 101, threshold: 100, oldestPendingAgeSeconds: 90 }),
    );
  });
});

describe('CronController.processJobs', () => {
  it('menyertakan metrik backlog pada hasil dan tidak alert bila aman', async () => {
    const { controller, logger } = makeController({ ...BASE_STATS, pending: 2 });

    const result = await controller.processJobs();

    expect(result.details).toMatchObject({
      backlog: { pending: 2 },
      backlogAlert: false,
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('mengirim peringatan bila backlog melewati ambang setelah pemrosesan', async () => {
    const { controller, logger } = makeController({ ...BASE_STATS, pending: 150 }, 100);

    const result = await controller.processJobs();

    expect(result.details).toMatchObject({ backlogAlert: true });
    expect(logger.warn).toHaveBeenCalledWith(
      'Backlog job melewati ambang',
      expect.objectContaining({ pending: 150 }),
    );
  });
});

describe('CronAuthGuard', () => {
  const guard = new CronAuthGuard({ value: { CRON_SECRET: 'cron-secret-123' } } as never);

  function context(authorization?: string) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: authorization ? { authorization } : {},
        }),
      }),
    } as never;
  }

  it('menerima Bearer yang cocok', () => {
    expect(guard.canActivate(context('Bearer cron-secret-123'))).toBe(true);
  });

  it('menolak secret salah, terlalu pendek, atau kosong', () => {
    expect(() => guard.canActivate(context('Bearer cron-secret-456'))).toThrow(
      UnauthorizedException,
    );
    expect(() => guard.canActivate(context('Bearer pendek'))).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context())).toThrow(UnauthorizedException);
  });
});
