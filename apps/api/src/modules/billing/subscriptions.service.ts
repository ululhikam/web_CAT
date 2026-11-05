import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  decodeCursor,
  encodeCursor,
  type AdminSubscriptionListQuery,
  type AdminSubscriptionSummary,
  type CursorPage,
  type GrantSubscriptionInput,
  type SubscriptionEventSummary,
  type SubscriptionHistoryItem,
  type SubscriptionSummary,
  type UpdateSubscriptionInput,
} from '@webcat/contracts';
import { AppError } from '../../core/http/app-error';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PlansService } from './plans.service';

export interface ActorContext {
  id: string;
  ip?: string | null;
  userAgent?: string | null;
}

const DAY_MS = 86_400_000;
const MAX_DAYS = 3650;

type SubscriptionRow = {
  id: string;
  userId: string;
  planId: string | null;
  sourceTransactionId: string | null;
  status: SubscriptionSummary['status'];
  source: SubscriptionSummary['source'];
  startsAt: Date;
  endsAt: Date;
  grantedById: string | null;
  grantNote: string | null;
  revokedAt: Date | null;
  revokeReason: string | null;
  createdAt: Date;
  plan: { code: string; name: string } | null;
};

/**
 * Semua operasi langganan (user & admin).
 *
 * Aturan permanen:
 *  - Riwayat tidak pernah dihapus; setiap perubahan menulis
 *    `subscription_events` dan `audit_logs`.
 *  - Pembelian saat masih aktif menumpuk (stacking), bukan menimpa sisa masa.
 *  - Grant/cabut manual wajib alasan.
 */
@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plans: PlansService,
    private readonly audit: AuditService,
  ) {}

  /* ---------------------------------------------------------------- mapping */

  private toSummary(row: SubscriptionRow): SubscriptionSummary {
    return {
      id: row.id,
      userId: row.userId,
      planCode: row.plan?.code ?? null,
      planName: row.plan?.name ?? null,
      status: row.status,
      source: row.source,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      remainingDays: Math.max(0, Math.ceil((row.endsAt.getTime() - Date.now()) / DAY_MS)),
      grantedBy: row.grantedById,
      grantNote: row.grantNote,
      revokedAt: row.revokedAt?.toISOString() ?? null,
      revokeReason: row.revokeReason,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toEvent(row: {
    id: string;
    type: SubscriptionEventSummary['type'];
    startsAt: Date;
    endsAt: Date;
    note: string | null;
    actorUserId: string | null;
    createdAt: Date;
  }): SubscriptionEventSummary {
    return {
      id: row.id,
      type: row.type,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      note: row.note,
      actorUserId: row.actorUserId,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private readonly include = {
    plan: { select: { code: true, name: true } },
  } satisfies Prisma.SubscriptionInclude;

  /* ---------------------------------------------------------------- user */

  async listForUser(userId: string): Promise<SubscriptionSummary[]> {
    const rows = await this.prisma.subscription.findMany({
      where: { userId },
      include: this.include,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toSummary(row));
  }

  /** Langganan aktif terbaik (dipakai dashboard & entitlement). */
  async activeForUser(userId: string): Promise<SubscriptionSummary | null> {
    const row = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE', endsAt: { gt: new Date() } },
      include: this.include,
      orderBy: { endsAt: 'desc' },
    });
    return row ? this.toSummary(row) : null;
  }

  /** Riwayat langganan + jejak perubahan (halaman /subscription). */
  async historyForUser(userId: string): Promise<SubscriptionHistoryItem[]> {
    const rows = await this.prisma.subscription.findMany({
      where: { userId },
      include: {
        ...this.include,
        events: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return rows.map((row) => ({
      ...this.toSummary(row),
      events: row.events.map((event) => this.toEvent(event)),
    }));
  }

  async findById(id: string): Promise<SubscriptionSummary> {
    const row = await this.prisma.subscription.findUnique({
      where: { id },
      include: this.include,
    });
    if (!row) {
      throw new AppError({
        code: 'SUBSCRIPTION_NOT_FOUND',
        status: 404,
        message: 'Langganan tidak ditemukan',
      });
    }
    return this.toSummary(row);
  }

  /* ---------------------------------------------------------------- admin */

  async listAdmin(
    query: AdminSubscriptionListQuery,
  ): Promise<CursorPage<AdminSubscriptionSummary>> {
    const conditions: Prisma.SubscriptionWhereInput[] = [];

    if (query.status) conditions.push({ status: query.status });
    if (query.userId) conditions.push({ userId: query.userId });

    if (query.expiringDays !== undefined) {
      const now = new Date();
      conditions.push({
        status: 'ACTIVE',
        endsAt: { gte: now, lte: new Date(now.getTime() + query.expiringDays * DAY_MS) },
      });
    }

    if (query.q) {
      conditions.push({
        user: {
          OR: [
            { email: { contains: query.q, mode: 'insensitive' } },
            { fullName: { contains: query.q, mode: 'insensitive' } },
          ],
        },
      });
    }

    if (query.cursor) {
      let decoded: { createdAt?: string; id?: string };
      try {
        decoded = decodeCursor<{ createdAt?: string; id?: string }>(query.cursor);
      } catch {
        decoded = {};
      }
      const createdAt = decoded.createdAt ? new Date(decoded.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime()) || !decoded.id) {
        throw new AppError({
          code: 'COMMON_BAD_REQUEST',
          status: 400,
          message: 'Cursor tidak valid',
        });
      }
      conditions.push({
        OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: decoded.id } }],
      });
    }

    const rows = await this.prisma.subscription.findMany({
      where: conditions.length > 0 ? { AND: conditions } : {},
      include: {
        ...this.include,
        user: { select: { email: true, fullName: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
    });

    const page = rows.slice(0, query.limit);
    const last = page.at(-1);

    return {
      items: page.map((row) => ({
        ...this.toSummary(row),
        userEmail: row.user.email,
        userFullName: row.user.fullName,
        transactionId: row.sourceTransactionId,
      })),
      nextCursor:
        rows.length > query.limit && last
          ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
          : null,
      hasMore: rows.length > query.limit,
    };
  }

  /**
   * Grant manual oleh admin.
   *
   * `STACK` (default) menambahkan masa setelah langganan aktif terakhir;
   * `REPLACE` mencabut seluruh langganan aktif lalu memulai dari sekarang.
   * `startsAt` eksplisit selalu menang.
   */
  async grant(input: GrantSubscriptionInput, actor: ActorContext): Promise<SubscriptionSummary> {
    const now = new Date();

    const user = await this.prisma.user.findFirst({
      where: { id: input.userId, deletedAt: null },
      select: { id: true, email: true },
    });
    if (!user) {
      throw new AppError({ code: 'USER_NOT_FOUND', status: 404, message: 'User tidak ditemukan' });
    }

    let planId: string | null = null;
    let planCode: string | null = null;
    let durationDays = input.durationDays ?? 0;

    if (input.planCode) {
      const plan = await this.plans.requireAnyByCode(input.planCode);
      planId = plan.id;
      planCode = plan.code;
      durationDays = plan.durationDays;
    }

    if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > MAX_DAYS) {
      throw new AppError({
        code: 'SUBSCRIPTION_DURATION_INVALID',
        status: 422,
        message: 'Durasi langganan harus 1–3650 hari',
      });
    }

    if (input.mode === 'REPLACE') {
      const active = await this.prisma.subscription.findMany({
        where: { userId: user.id, status: 'ACTIVE', endsAt: { gt: now } },
      });
      for (const subscription of active) {
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'REVOKED', revokedAt: now, revokeReason: input.reason },
        });
        await this.prisma.subscriptionEvent.create({
          data: {
            subscriptionId: subscription.id,
            actorUserId: actor.id,
            type: 'REVOKED',
            startsAt: subscription.startsAt,
            endsAt: subscription.endsAt,
            note: `Diganti oleh grant baru: ${input.reason}`,
          },
        });
      }
    }

    let startsAt = input.startsAt ?? now;
    if (!input.startsAt && input.mode !== 'REPLACE') {
      const latest = await this.prisma.subscription.findFirst({
        where: { userId: user.id, status: 'ACTIVE', endsAt: { gt: now } },
        orderBy: { endsAt: 'desc' },
        select: { endsAt: true },
      });
      if (latest) startsAt = latest.endsAt;
    }

    const endsAt = new Date(startsAt.getTime() + durationDays * DAY_MS);
    const row = await this.prisma.subscription.create({
      data: {
        userId: user.id,
        planId,
        source: 'MANUAL_GRANT',
        status: startsAt.getTime() > now.getTime() ? 'PENDING' : 'ACTIVE',
        startsAt,
        endsAt,
        grantedById: actor.id,
        grantNote: input.reason,
      },
      include: this.include,
    });

    await this.prisma.subscriptionEvent.create({
      data: {
        subscriptionId: row.id,
        actorUserId: actor.id,
        type: 'CREATED',
        startsAt,
        endsAt,
        note: input.reason,
        metadata: { mode: input.mode, durationDays, planCode },
      },
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'subscription.grant',
      entityType: 'subscription',
      entityId: row.id,
      metadata: {
        userId: user.id,
        email: user.email,
        mode: input.mode,
        planCode,
        durationDays,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        reason: input.reason,
      },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.toSummary(row);
  }

  /**
   * Ubah masa aktif: `extendDays` menambah dari `max(now, endsAt)`,
   * `endsAt` menetapkan tanggal baru, `status=REVOKED` mencabut.
   */
  async update(
    id: string,
    input: UpdateSubscriptionInput,
    actor: ActorContext,
  ): Promise<SubscriptionSummary> {
    if (input.status === 'REVOKED') {
      return this.revoke(id, input.reason, actor);
    }

    const current = await this.prisma.subscription.findUnique({
      where: { id },
      include: this.include,
    });
    if (!current) {
      throw new AppError({
        code: 'SUBSCRIPTION_NOT_FOUND',
        status: 404,
        message: 'Langganan tidak ditemukan',
      });
    }
    if (current.status === 'REVOKED') {
      throw new AppError({
        code: 'SUBSCRIPTION_ALREADY_REVOKED',
        status: 409,
        message: 'Langganan yang sudah dicabut tidak bisa diubah',
      });
    }

    const now = new Date();
    let endsAt: Date;

    if (input.endsAt) {
      endsAt = input.endsAt;
    } else if (input.extendDays) {
      const base = current.endsAt.getTime() > now.getTime() ? current.endsAt : now;
      endsAt = new Date(base.getTime() + input.extendDays * DAY_MS);
    } else if (input.status === 'EXPIRED') {
      endsAt = now;
    } else {
      throw new AppError({
        code: 'COMMON_VALIDATION_FAILED',
        status: 422,
        message: 'Isi salah satu: extendDays, endsAt, atau status',
      });
    }

    if (endsAt.getTime() > now.getTime() + MAX_DAYS * DAY_MS) {
      throw new AppError({
        code: 'SUBSCRIPTION_DURATION_INVALID',
        status: 422,
        message: 'Masa aktif maksimal 10 tahun ke depan',
      });
    }

    const status =
      input.status === 'ACTIVE'
        ? 'ACTIVE'
        : endsAt.getTime() > now.getTime()
          ? 'ACTIVE'
          : 'EXPIRED';
    const type = endsAt.getTime() > current.endsAt.getTime() ? 'EXTENDED' : 'RENEWED';

    const row = await this.prisma.subscription.update({
      where: { id },
      data: { endsAt, status },
      include: this.include,
    });

    await this.prisma.subscriptionEvent.create({
      data: {
        subscriptionId: id,
        actorUserId: actor.id,
        type,
        startsAt: row.startsAt,
        endsAt,
        note: input.reason,
        metadata: {
          previousEndsAt: current.endsAt.toISOString(),
          extendDays: input.extendDays ?? null,
        },
      },
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'subscription.update',
      entityType: 'subscription',
      entityId: id,
      metadata: {
        userId: current.userId,
        previousEndsAt: current.endsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        status,
        reason: input.reason,
      },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.toSummary(row);
  }

  /** Cabut langganan (riwayat tetap tersimpan). Alasan wajib. */
  async revoke(id: string, reason: string, actor: ActorContext): Promise<SubscriptionSummary> {
    const current = await this.prisma.subscription.findUnique({
      where: { id },
      include: this.include,
    });
    if (!current) {
      throw new AppError({
        code: 'SUBSCRIPTION_NOT_FOUND',
        status: 404,
        message: 'Langganan tidak ditemukan',
      });
    }
    if (current.status === 'REVOKED') {
      throw new AppError({
        code: 'SUBSCRIPTION_ALREADY_REVOKED',
        status: 409,
        message: 'Langganan sudah dicabut',
      });
    }

    const now = new Date();
    const row = await this.prisma.subscription.update({
      where: { id },
      data: { status: 'REVOKED', revokedAt: now, revokeReason: reason },
      include: this.include,
    });

    await this.prisma.subscriptionEvent.create({
      data: {
        subscriptionId: id,
        actorUserId: actor.id,
        type: 'REVOKED',
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        note: reason,
      },
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'subscription.revoke',
      entityType: 'subscription',
      entityId: id,
      metadata: { userId: current.userId, reason },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.toSummary(row);
  }

  /* ---------------------------------------------------------------- pembayaran */

  /**
   * Aktivasi otomatis setelah transaksi SUCCESS. Dipanggil di dalam transaksi
   * database milik PaymentsService agar status transaksi dan langganan tidak
   * pernah terpisah.
   */
  async activateFromPayment(
    tx: Prisma.TransactionClient,
    input: {
      userId: string;
      planId: string | null;
      planCode: string | null;
      durationDays: number;
      transactionId: string;
      paidAt: Date;
    },
  ): Promise<SubscriptionSummary> {
    const existing = await tx.subscription.findFirst({
      where: { sourceTransactionId: input.transactionId },
      include: this.include,
    });
    if (existing) return this.toSummary(existing);

    const latest = await tx.subscription.findFirst({
      where: {
        userId: input.userId,
        status: 'ACTIVE',
        endsAt: { gt: input.paidAt },
      },
      orderBy: { endsAt: 'desc' },
      select: { endsAt: true },
    });

    const startsAt = latest?.endsAt ?? input.paidAt;
    const endsAt = new Date(startsAt.getTime() + input.durationDays * DAY_MS);

    const row = await tx.subscription.create({
      data: {
        userId: input.userId,
        planId: input.planId,
        sourceTransactionId: input.transactionId,
        source: 'PURCHASE',
        status: 'ACTIVE',
        startsAt,
        endsAt,
      },
      include: this.include,
    });

    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: row.id,
        transactionId: input.transactionId,
        type: latest ? 'RENEWED' : 'ACTIVATED',
        startsAt,
        endsAt,
        note: input.planCode ? `Pembelian ${input.planCode}` : 'Pembelian paket',
        metadata: { stacked: Boolean(latest), durationDays: input.durationDays },
      },
    });

    await tx.outboxEvent.create({
      data: {
        topic: 'subscription.activated',
        payload: {
          subscriptionId: row.id,
          userId: row.userId,
          planCode: input.planCode,
          endsAt: endsAt.toISOString(),
        },
      },
    });

    return this.toSummary(row);
  }
}
