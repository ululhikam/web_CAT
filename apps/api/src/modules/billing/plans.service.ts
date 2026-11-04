import { Injectable } from '@nestjs/common';
import type { Plan, PlanFeature } from '@webcat/contracts';
import { LoggerService } from '../../core/logger/logger.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { DEFAULT_PLANS } from './default-plans';

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Harga TIDAK pernah di-hardcode di klien. Klien hanya mengirim `planCode`;
   * server selalu membaca nominal dari database.
   */
  private mapRow(row: {
    id: string;
    code: string;
    name: string;
    tagline: string | null;
    priceIdr: number;
    compareAtPriceIdr: number | null;
    durationDays: number;
    features: unknown;
    badge: string | null;
    isPopular: boolean;
    isPublic: boolean;
    sortOrder: number;
  }): Plan {
    const features = Array.isArray(row.features) ? (row.features as PlanFeature[]) : [];
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      tagline: row.tagline,
      priceIdr: row.priceIdr,
      compareAtPriceIdr: row.compareAtPriceIdr,
      durationDays: row.durationDays,
      pricePerDayIdr:
        row.durationDays > 0 && row.priceIdr > 0
          ? Math.round(row.priceIdr / row.durationDays)
          : 0,
      features,
      isPublic: row.isPublic,
      sortOrder: row.sortOrder,
      badge: row.badge,
      isPopular: row.isPopular,
    };
  }

  /** Plan publik untuk halaman pricing. Fallback ke konstanta bila DB kosong. */
  async listPublic(): Promise<Plan[]> {
    try {
      const rows = await this.prisma.subscriptionPlan.findMany({
        where: { status: 'ACTIVE', isPublic: true },
        orderBy: [{ sortOrder: 'asc' }, { priceIdr: 'asc' }],
      });
      if (rows.length === 0) {
        this.logger.warn('subscription_plans kosong — memakai DEFAULT_PLANS');
        return DEFAULT_PLANS;
      }
      return rows.map((row) => this.mapRow(row));
    } catch (error) {
      this.logger.warn('Gagal membaca subscription_plans — memakai DEFAULT_PLANS', {
        message: error instanceof Error ? error.message : String(error),
      });
      return DEFAULT_PLANS;
    }
  }

  async findByCode(code: string): Promise<Plan | null> {
    try {
      const row = await this.prisma.subscriptionPlan.findUnique({ where: { code } });
      if (row) return this.mapRow(row);
    } catch (error) {
      this.logger.warn('Gagal membaca plan dari database', {
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return DEFAULT_PLANS.find((plan) => plan.code === code) ?? null;
  }

  async listAll(): Promise<Plan[]> {
    const rows = await this.prisma.subscriptionPlan.findMany({
      orderBy: [{ sortOrder: 'asc' }, { priceIdr: 'asc' }],
    });
    return rows.map((row) => this.mapRow(row));
  }
}
