import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { GrantSubscriptionInput, SubscriptionSummary } from '@webcat/contracts';
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

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plans: PlansService,
    private readonly audit: AuditService,
  ) {}

  private toSummary(row: {
    id: string;
    userId: string;
    status: string;
    source: string;
    startsAt: Date;
    endsAt: Date;
    grantedById: string | null;
    grantNote: string | null;
    plan: { code: string } | null;
  }): SubscriptionSummary {
    return {
      id: row.id,
      userId: row.userId,
      planCode: row.plan?.code ?? null,
      status: row.status as SubscriptionSummary['status'],
      source: row.source as SubscriptionSummary['source'],
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      remainingDays: Math.max(0, Math.ceil((row.endsAt.getTime() - Date.now()) / DAY_MS)),
      grantedBy: row.grantedById,
      grantNote: row.grantNote,
    };
  }

  async listForUser(userId: string): Promise<SubscriptionSummary[]> {
    const rows = await this.prisma.subscription.findMany({
      where: { userId },
      include: { plan: { select: { code: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toSummary(row));
  }

  /**
   * Pemberian langganan oleh admin (tanpa payment gateway).
   *
   * STACK  : mulai setelah langganan aktif terakhir berakhir (default).
   * REPLACE: mulai sekarang, langganan aktif lama di-REVOKE (audited).
   *
   * Durasi 1..3650 hari. Alasan wajib diisi. Semua tercatat di audit_logs.
   */
  async grant(input: GrantSubscriptionInput, actor: ActorContext): Promise<SubscriptionSummary> {
    if (!input.reason || input.reason.trim().length < 3) {
      throw new AppError({
        code: 'SUBSCRIPTION_REASON_REQUIRED',
        message: 'Alasan pemberian langganan wajib diisi',
        status: 422,
      });
    }

    const user = await this.prisma.user.findFirst({
      where: { id: input.userId, deletedAt: null },
      select: { id: true, email: true },
    });
    if (!user) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User tidak ditemukan' });
    }

    let durationDays = input.durationDays;
    let planId: string | null = null;

    if (input.planCode) {
      const plan = await this.plans.findByCode(input.planCode);
      if (!plan) {
        throw new NotFoundException({
          code: 'BILLING_PLAN_NOT_FOUND',
          message: 'Paket tidak ditemukan',
        });
      }
      durationDays = plan.durationDays;
      const row = await this.prisma.subscriptionPlan.findUnique({
        where: { code: plan.code },
        select: { id: true },
      });
      planId = row?.id ?? null;
    }

    if (!durationDays) {
      throw new AppError({
        code: 'SUBSCRIPTION_DURATION_INVALID',
        message: 'Tentukan planCode atau durationDays (1-3650)',
        status: 422,
      });
    }

    if (durationDays < 1 || durationDays > 3650) {
      throw new AppError({
        code: 'SUBSCRIPTION_DURATION_INVALID',
        message: 'Durasi harus antara 1 dan 3650 hari',
        status: 422,
      });
    }

    const now = new Date();
    const activeSubs = await this.prisma.subscription.findMany({
      where: { userId: user.id, status: 'ACTIVE', endsAt: { gt: now } },
      orderBy: { endsAt: 'desc' },
    });

    if (input.mode === 'REPLACE' && activeSubs.length > 0) {
      await this.prisma.subscription.updateMany({
        where: { id: { in: activeSubs.map((sub) => sub.id) } },
        data: { status: 'REVOKED', revokedAt: now, revokeReason: input.reason },
      });
    }

    const stackBase =
      input.mode === 'STACK' && activeSubs.length > 0
        ? new Date(Math.max(now.getTime(), activeSubs[0]!.endsAt.getTime()))
        : now;

    const startsAt = input.startsAt ?? stackBase;
    const endsAt =
      input.startsAt !== undefined
        ? new Date(input.startsAt.getTime() + durationDays * DAY_MS)
        : new Date(stackBase.getTime() + durationDays * DAY_MS);

    const created = await this.prisma.subscription.create({
      data: {
        userId: user.id,
        planId,
        source: 'MANUAL_GRANT',
        status: 'ACTIVE',
        startsAt,
        endsAt,
        grantedById: actor.id,
        grantNote: input.reason,
      },
      include: { plan: { select: { code: true } } },
    });

    await this.prisma.subscriptionEvent.create({
      data: {
        subscriptionId: created.id,
        actorUserId: actor.id,
        type: 'CREATED',
        startsAt,
        endsAt,
        note: input.reason,
        metadata: { mode: input.mode, durationDays },
      },
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'subscription.granted',
      entityType: 'subscription',
      entityId: created.id,
      metadata: {
        userId: user.id,
        email: user.email,
        durationDays,
        mode: input.mode,
        planCode: input.planCode ?? null,
        reason: input.reason,
      },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.toSummary(created);
  }

  async revoke(
    subscriptionId: string,
    input: { reason: string },
    actor: ActorContext,
  ): Promise<SubscriptionSummary> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: { select: { code: true } } },
    });
    if (!subscription) {
      throw new NotFoundException({
        code: 'SUBSCRIPTION_NOT_FOUND',
        message: 'Langganan tidak ditemukan',
      });
    }
    if (subscription.status === 'REVOKED') {
      throw new ConflictException({
        code: 'SUBSCRIPTION_ALREADY_REVOKED',
        message: 'Langganan sudah dicabut',
      });
    }
    if (!input.reason || input.reason.trim().length < 3) {
      throw new AppError({
        code: 'SUBSCRIPTION_REASON_REQUIRED',
        message: 'Alasan pencabutan wajib diisi',
        status: 422,
      });
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'REVOKED', revokedAt: new Date(), revokeReason: input.reason },
      include: { plan: { select: { code: true } } },
    });

    await this.prisma.subscriptionEvent.create({
      data: {
        subscriptionId,
        actorUserId: actor.id,
        type: 'REVOKED',
        startsAt: updated.startsAt,
        endsAt: updated.endsAt,
        note: input.reason,
      },
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'subscription.revoked',
      entityType: 'subscription',
      entityId: subscriptionId,
      metadata: { reason: input.reason, userId: subscription.userId },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.toSummary(updated);
  }

  /** Ringkasan langganan aktif untuk ditampilkan di dashboard user. */
  async activeForUser(userId: string): Promise<SubscriptionSummary | null> {
    const row = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE', endsAt: { gt: new Date() } },
      include: { plan: { select: { code: true } } },
      orderBy: { endsAt: 'desc' },
    });
    return row ? this.toSummary(row) : null;
  }
}
