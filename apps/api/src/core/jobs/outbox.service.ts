import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type OutboxTopic =
  | 'subscription.activated'
  | 'subscription.expired'
  | 'user.invited'
  | 'user.password_reset'
  | 'exam.eliminated'
  | 'audit.export_requested';

/**
 * Transactional outbox: baris ditulis di transaksi yang sama dengan perubahan
 * domain, lalu diproses cron. Mencegah event hilang saat proses mati.
 */
@Injectable()
export class OutboxService {
  constructor(private readonly prisma: PrismaService) {}

  async publish(topic: OutboxTopic, payload: Record<string, unknown>): Promise<string> {
    const event = await this.prisma.outboxEvent.create({
      data: { topic, payload: payload as never },
      select: { id: true },
    });
    return event.id;
  }

  async claimPending(batchSize = 20) {
    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; topic: string; payload: unknown; attempts: number }>
    >`
      WITH picked AS (
        SELECT id
        FROM outbox_events
        WHERE status = 'PENDING' AND available_at <= now()
        ORDER BY available_at
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE outbox_events AS e
      SET attempts = e.attempts + 1
      FROM picked
      WHERE e.id = picked.id
      RETURNING e.id, e.topic, e.payload, e.attempts
    `;

    return rows.map((row) => ({
      id: row.id,
      topic: row.topic,
      payload: (row.payload ?? {}) as Record<string, unknown>,
      attempts: Number(row.attempts),
    }));
  }

  async markProcessed(id: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: { status: 'PROCESSED', processedAt: new Date() },
    });
  }

  async markFailed(id: string, error: unknown): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);
    await this.prisma.outboxEvent.update({
      where: { id },
      data: { status: 'FAILED', lastError: message.slice(0, 1000) },
    });
  }
}
