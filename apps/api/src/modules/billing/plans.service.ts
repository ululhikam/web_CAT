import { Injectable } from '@nestjs/common';
import type { SubscriptionPlan } from '@prisma/client';
import type {
  AdminPlan,
  CreatePlanInput,
  Plan,
  PlanDeleteResult,
  PlanFeature,
  UpdatePlanInput,
} from '@webcat/contracts';
import { DEFAULT_PLANS } from '@webcat/contracts';
import { AppError } from '../../core/http/app-error';
import { LoggerService } from '../../core/logger/logger.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { ActorContext } from './subscriptions.service';

/**
 * Sumber tunggal harga & paket.
 *
 * Harga TIDAK pernah di-hardcode di klien: halaman pricing membaca endpoint
 * publik, dan checkout membaca ulang baris database sebelum membuat tagihan.
 */
@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly audit: AuditService,
  ) {}

  private features(value: unknown): PlanFeature[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item): PlanFeature[] => {
      if (typeof item !== 'object' || item === null) return [];
      const row = item as Partial<PlanFeature>;
      if (typeof row.label !== 'string' || typeof row.included !== 'boolean') return [];
      return [{ label: row.label, included: row.included }];
    });
  }

  private mapPlan(row: SubscriptionPlan): Plan {
    const pricePerDayIdr =
      row.durationDays > 0 && row.priceIdr > 0
        ? Math.round(row.priceIdr / row.durationDays)
        : 0;

    return {
      id: row.id,
      code: row.code,
      name: row.name,
      tagline: row.tagline,
      priceIdr: row.priceIdr,
      compareAtPriceIdr: row.compareAtPriceIdr,
      durationDays: row.durationDays,
      pricePerDayIdr,
      features: this.features(row.features),
      isPublic: row.isPublic,
      sortOrder: row.sortOrder,
      badge: row.badge,
      isPopular: row.isPopular,
    };
  }

  private mapAdmin(row: SubscriptionPlan): AdminPlan {
    return {
      ...this.mapPlan(row),
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    };
  }

  /* ---------------------------------------------------------------- publik */

  /**
   * Paket publik untuk halaman pricing (fallback ke seed bila tabel belum
   * pernah diisi).
   *
   * Penting: fallback hanya dipakai ketika tabel BENAR-BENAR kosong. Kalau
   * admin menghapus semua paket (soft delete), halaman pricing harus kosong —
   * bukan menampilkan lagi harga default yang sudah "dihapus".
   */
  async listPublic(): Promise<Plan[]> {
    try {
      const rows = await this.prisma.subscriptionPlan.findMany({
        where: { status: 'ACTIVE', isPublic: true, deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { priceIdr: 'asc' }],
      });
      if (rows.length > 0) return rows.map((row) => this.mapPlan(row));

      const total = await this.prisma.subscriptionPlan.count();
      if (total === 0) {
        this.logger.warn('subscription_plans kosong — memakai paket default');
        return [...DEFAULT_PLANS];
      }
      return [];
    } catch (error) {
      this.logger.warn('Gagal membaca subscription_plans — memakai paket default', {
        message: error instanceof Error ? error.message : String(error),
      });
      return [...DEFAULT_PLANS];
    }
  }

  /** Detail paket untuk halaman checkout (hanya yang aktif, publik, & hidup). */
  async findPublicByCode(code: string): Promise<Plan | null> {
    const row = await this.prisma.subscriptionPlan.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        status: 'ACTIVE',
        isPublic: true,
        deletedAt: null,
      },
    });
    return row ? this.mapPlan(row) : null;
  }

  /* ---------------------------------------------------------------- internal */

  /**
   * Baris mentah untuk checkout & aktivasi pembayaran. Harga yang dipakai
   * selalu dari baris ini, bukan dari request.
   */
  async requirePurchasable(code: string): Promise<SubscriptionPlan> {
    const row = await this.prisma.subscriptionPlan.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!row) {
      throw new AppError({
        code: 'BILLING_PLAN_NOT_FOUND',
        status: 404,
        message: 'Paket tidak ditemukan',
      });
    }
    if (row.deletedAt) {
      throw new AppError({
        code: 'BILLING_PLAN_NOT_FOUND',
        status: 404,
        message: 'Paket tidak ditemukan',
      });
    }
    if (row.status !== 'ACTIVE' || !row.isPublic) {
      throw new AppError({
        code: 'BILLING_PLAN_NOT_PURCHASABLE',
        status: 409,
        message: 'Paket ini sedang tidak tersedia untuk dibeli',
      });
    }

    return row;
  }

  /**
   * Grant manual boleh memakai paket non-publik (mis. paket khusus kerja
   * sama), tetapi tetap harus ada di database.
   */
  async requireAnyByCode(code: string): Promise<SubscriptionPlan> {
    const row = await this.prisma.subscriptionPlan.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!row || row.deletedAt) {
      throw new AppError({
        code: 'BILLING_PLAN_NOT_FOUND',
        status: 404,
        message: 'Paket tidak ditemukan',
      });
    }
    return row;
  }

  /* ---------------------------------------------------------------- admin */

  async findById(id: string): Promise<AdminPlan> {
    const row = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!row) {
      throw new AppError({
        code: 'BILLING_PLAN_NOT_FOUND',
        status: 404,
        message: 'Paket tidak ditemukan',
      });
    }
    return this.mapAdmin(row);
  }

  /**
   * Semua paket untuk panel admin.
   *
   * Default hanya paket hidup; `includeDeleted` dipakai tab "Arsip" agar
   * admin masih bisa me-restore. Paket terhapus tidak pernah ikut ke pricing.
   */
  async listAll(includeDeleted = false): Promise<AdminPlan[]> {
    const rows = await this.prisma.subscriptionPlan.findMany({
      where: includeDeleted ? {} : { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { priceIdr: 'asc' }],
    });
    return rows.map((row) => this.mapAdmin(row));
  }

  async create(input: CreatePlanInput, actor: ActorContext): Promise<AdminPlan> {
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { code: input.code },
      select: { id: true, deletedAt: true },
    });
    if (existing) {
      throw new AppError({
        code: 'BILLING_PLAN_CODE_EXISTS',
        status: 409,
        message: existing.deletedAt
          ? `Kode paket ${input.code} dipakai paket terarsip — pulihkan paket itu alih-alih membuat baru`
          : `Kode paket ${input.code} sudah dipakai`,
      });
    }

    const row = await this.prisma.subscriptionPlan.create({
      data: {
        code: input.code,
        name: input.name,
        tagline: input.tagline ?? null,
        priceIdr: input.priceIdr,
        compareAtPriceIdr: input.compareAtPriceIdr ?? null,
        durationDays: input.durationDays,
        features: input.features as never,
        badge: input.badge ?? null,
        isPopular: input.isPopular,
        isPublic: input.isPublic,
        sortOrder: input.sortOrder,
        status: input.status,
      },
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'plan.create',
      entityType: 'subscription_plan',
      entityId: row.id,
      metadata: { code: row.code, priceIdr: row.priceIdr, status: row.status },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.mapAdmin(row);
  }

  async update(id: string, input: UpdatePlanInput, actor: ActorContext): Promise<AdminPlan> {
    const current = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!current) {
      throw new AppError({
        code: 'BILLING_PLAN_NOT_FOUND',
        status: 404,
        message: 'Paket tidak ditemukan',
      });
    }
    if (current.deletedAt) {
      throw new AppError({
        code: 'BILLING_PLAN_ARCHIVED',
        status: 409,
        message: 'Paket sudah dihapus — pulihkan dulu sebelum diubah',
      });
    }

    const nextPrice = input.priceIdr ?? current.priceIdr;
    const nextCompare =
      input.compareAtPriceIdr === undefined ? current.compareAtPriceIdr : input.compareAtPriceIdr;
    if (nextCompare !== null && nextCompare <= nextPrice) {
      throw new AppError({
        code: 'BILLING_PLAN_INACTIVE',
        status: 409,
        message: 'Harga coret harus lebih besar dari harga jual',
      });
    }

    const row = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: input.name,
        tagline: input.tagline === undefined ? undefined : input.tagline,
        priceIdr: input.priceIdr,
        compareAtPriceIdr:
          input.compareAtPriceIdr === undefined ? undefined : input.compareAtPriceIdr,
        durationDays: input.durationDays,
        features: input.features === undefined ? undefined : (input.features as never),
        badge: input.badge === undefined ? undefined : input.badge,
        isPopular: input.isPopular,
        isPublic: input.isPublic,
        sortOrder: input.sortOrder,
        status: input.status,
      },
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'plan.update',
      entityType: 'subscription_plan',
      entityId: row.id,
      metadata: {
        code: row.code,
        changes: input as Record<string, unknown>,
        previous: {
          priceIdr: current.priceIdr,
          durationDays: current.durationDays,
          status: current.status,
        },
      },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.mapAdmin(row);
  }

  /**
   * Soft delete paket (F5-02).
   *
   * Tidak pernah menghapus baris: `transactions.plan_id` dan
   * `subscriptions.plan_id` memakai ON DELETE SET NULL, jadi hapus fisik akan
   * menghilangkan jejak paket pada riwayat pembayaran.
   *
   * Paket yang masih dipakai langganan aktif ditolak — pembeli akan melihat
   * harga yang tidak bisa diperpanjang. Kegagalan itu sengaja eksplisit.
   */
  async remove(id: string, reason: string, actor: ActorContext): Promise<PlanDeleteResult> {
    const current = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!current) {
      throw new AppError({
        code: 'BILLING_PLAN_NOT_FOUND',
        status: 404,
        message: 'Paket tidak ditemukan',
      });
    }
    if (current.deletedAt) {
      // Idempoten: menghapus dua kali bukan error bagi pemanggil.
      return {
        id: current.id,
        code: current.code,
        deleted: true,
        deletedAt: current.deletedAt.toISOString(),
      };
    }

    const activeSubscriptions = await this.prisma.subscription.count({
      where: { planId: id, status: 'ACTIVE' },
    });
    if (activeSubscriptions > 0) {
      throw new AppError({
        code: 'BILLING_PLAN_IN_USE',
        status: 409,
        message: `Paket masih dipakai ${activeSubscriptions} langganan aktif`,
      });
    }

    const deletedAt = new Date();
    const row = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: { deletedAt },
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'plan.delete',
      entityType: 'subscription_plan',
      entityId: row.id,
      metadata: {
        code: row.code,
        reason,
        // Soft delete selalu disertai status non-publik agar paket tidak
        // "hidup kembali" bila suatu saat `deletedAt` diabaikan query lain.
        wasPublic: current.isPublic,
        wasStatus: current.status,
      },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return {
      id: row.id,
      code: row.code,
      deleted: true,
      deletedAt: deletedAt.toISOString(),
    };
  }

  /** Batalkan soft delete (F5-02). Paket kembali ke status & publikasi semula. */
  async restore(id: string, reason: string, actor: ActorContext): Promise<AdminPlan> {
    const current = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!current) {
      throw new AppError({
        code: 'BILLING_PLAN_NOT_FOUND',
        status: 404,
        message: 'Paket tidak ditemukan',
      });
    }
    if (!current.deletedAt) {
      throw new AppError({
        code: 'BILLING_PLAN_NOT_ARCHIVED',
        status: 409,
        message: 'Paket ini belum dihapus',
      });
    }

    const row = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: { deletedAt: null },
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'plan.restore',
      entityType: 'subscription_plan',
      entityId: row.id,
      metadata: { code: row.code, reason, status: row.status, isPublic: row.isPublic },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.mapAdmin(row);
  }
}
