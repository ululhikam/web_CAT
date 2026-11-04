import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';

export interface EnqueueOptions {
  queue: string;
  payload: Record<string, unknown>;
  /** Tunda eksekusi (detik). */
  delaySeconds?: number;
  maxAttempts?: number;
}

export interface ClaimedJob {
  id: string;
  queue: string;
  payload: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
}

/**
 * Queue sederhana di Postgres, pengganti Redis/BullMQ.
 *
 * Klaim job memakai `FOR UPDATE SKIP LOCKED` sehingga beberapa consumer
 * (Vercel Cron invocation paralel) tidak memproses job yang sama.
 */
@Injectable()
export class JobQueueService {
  private readonly workerId = `worker-${randomUUID()}`;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async enqueue(options: EnqueueOptions): Promise<string> {
    const runAfter = new Date(Date.now() + (options.delaySeconds ?? 0) * 1000);
    const job = await this.prisma.jobQueue.create({
      data: {
        queue: options.queue,
        payload: options.payload as never,
        runAfter,
        maxAttempts: options.maxAttempts ?? 5,
      },
      select: { id: true },
    });
    return job.id;
  }

  /** Mengambil maksimal `batchSize` job dan menandainya RUNNING. */
  async claim(batchSize = 10): Promise<ClaimedJob[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        queue: string;
        payload: unknown;
        attempts: number;
        max_attempts: number;
      }>
    >`
      WITH picked AS (
        SELECT id
        FROM job_queue
        WHERE status = 'PENDING' AND run_after <= now()
        ORDER BY run_after
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE job_queue AS j
      SET status = 'RUNNING',
          attempts = j.attempts + 1,
          locked_at = now(),
          locked_by = ${this.workerId}
      FROM picked
      WHERE j.id = picked.id
      RETURNING j.id, j.queue, j.payload, j.attempts, j.max_attempts
    `;

    return rows.map((row) => ({
      id: row.id,
      queue: row.queue,
      payload: (row.payload ?? {}) as Record<string, unknown>,
      attempts: Number(row.attempts),
      maxAttempts: Number(row.max_attempts),
    }));
  }

  async complete(jobId: string): Promise<void> {
    await this.prisma.jobQueue.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', completedAt: new Date(), lastError: null },
    });
  }

  async fail(job: ClaimedJob, error: unknown, retryDelaySeconds = 30): Promise<'RETRY' | 'DEAD'> {
    const message = error instanceof Error ? error.message : String(error);
    const exhausted = job.attempts >= job.maxAttempts;
    this.logger.error('Job gagal', {
      jobId: job.id,
      queue: job.queue,
      attempts: job.attempts,
      exhausted,
      message,
    });

    await this.prisma.jobQueue.update({
      where: { id: job.id },
      data: exhausted
        ? { status: 'DEAD', lastError: message.slice(0, 1000), completedAt: new Date() }
        : {
            status: 'PENDING',
            lastError: message.slice(0, 1000),
            runAfter: new Date(Date.now() + retryDelaySeconds * 1000),
            lockedAt: null,
            lockedBy: null,
          },
    });

    return exhausted ? 'DEAD' : 'RETRY';
  }

  /** Melepas job yang macet (locked terlalu lama), dipanggil cron. */
  async releaseStale(olderThanMinutes = 10): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    const result = await this.prisma.jobQueue.updateMany({
      where: { status: 'RUNNING', lockedAt: { lt: cutoff } },
      data: { status: 'PENDING', lockedAt: null, lockedBy: null },
    });
    return result.count;
  }
}
