import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  jakartaDateKey,
  type RevenueDayRow,
  type RevenueKpi,
  type RevenuePlanRow,
  type RevenueQuery,
} from '@webcat/contracts';
import { PrismaService } from '../../core/prisma/prisma.service';

const DAY_MS = 86_400_000;
const EXPIRING_SOON_DAYS = 7;
const PAID_STATUSES = ['SUCCESS', 'REFUNDED'] as const;

/**
 * Metrik revenue dashboard admin.
 *
 * Hanya membaca; tidak pernah mengubah data domain. Nominal memakai snapshot
 * `transactions.amount_idr`, bukan harga paket saat ini, sehingga laporan
 * lama tidak berubah ketika admin menaikkan harga.
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async revenue(query: RevenueQuery): Promise<RevenueKpi> {
    const now = new Date();
    const to = query.to ?? now;
    const from = query.from ?? new Date(to.getTime() - query.days * DAY_MS);

    const rangeWhere: Prisma.TransactionWhereInput = { createdAt: { gte: from, lt: to } };
    const paidWhere: Prisma.TransactionWhereInput = {
      ...rangeWhere,
      status: { in: [...PAID_STATUSES] },
    };

    const [
      statusGroups,
      planGroups,
      dailyRows,
      activeSubscriptions,
      newSubscriptions,
      expiringCount,
    ] = await Promise.all([
      this.prisma.transaction.groupBy({
        by: ['status'],
        where: rangeWhere,
        _count: { _all: true },
        _sum: { amountIdr: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['planId'],
        where: paidWhere,
        _count: { _all: true },
        _sum: { amountIdr: true },
      }),
      this.dailyRevenue(from, to),
      this.prisma.subscription.count({ where: { status: 'ACTIVE', endsAt: { gt: now } } }),
      this.prisma.subscription.count({ where: { createdAt: { gte: from, lt: to } } }),
      this.prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          endsAt: {
            gt: now,
            lte: new Date(now.getTime() + EXPIRING_SOON_DAYS * DAY_MS),
          },
        },
      }),
    ]);

    let transactionCount = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let grossRevenueIdr = 0;
    let refundedIdr = 0;

    for (const group of statusGroups) {
      const count = group._count._all;
      const sum = group._sum.amountIdr ?? 0;
      transactionCount += count;

      if (group.status === 'PENDING') pendingCount += count;
      if (group.status === 'SUCCESS' || group.status === 'REFUNDED') {
        paidCount += count;
        grossRevenueIdr += sum;
      }
      if (group.status === 'REFUNDED') refundedIdr += sum;
    }

    const planIds = planGroups
      .map((group) => group.planId)
      .filter((id): id is string => Boolean(id));
    const plans = planIds.length
      ? await this.prisma.subscriptionPlan.findMany({
          where: { id: { in: planIds } },
          select: { id: true, code: true, name: true },
        })
      : [];
    const planById = new Map(plans.map((plan) => [plan.id, plan]));

    const byPlan: RevenuePlanRow[] = planGroups
      .map((group) => {
        const plan = group.planId ? planById.get(group.planId) : undefined;
        return {
          planCode: plan?.code ?? null,
          planName: plan?.name ?? 'Tanpa paket',
          transactionCount: group._count._all,
          paidCount: group._count._all,
          revenueIdr: group._sum.amountIdr ?? 0,
        };
      })
      .sort((a, b) => b.revenueIdr - a.revenueIdr);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      grossRevenueIdr,
      refundedIdr,
      netRevenueIdr: grossRevenueIdr - refundedIdr,
      transactionCount,
      paidCount,
      pendingCount,
      expiringCount,
      conversionRate:
        transactionCount === 0 ? 0 : Math.round((paidCount / transactionCount) * 1000) / 10,
      averageOrderValueIdr: paidCount === 0 ? 0 : Math.round(grossRevenueIdr / paidCount),
      activeSubscriptions,
      newSubscriptions,
      byPlan,
      daily: this.fillDays(dailyRows, from, to),
    };
  }

  /**
   * Agregasi harian pada zona Asia/Jakarta lewat view `v_daily_revenue`.
   *
   * View menyimpan satu baris per transaksi lunas/refund beserta tanggal
   * Jakarta-nya; agregasi tetap memakai rentang `created_at` presisi agar
   * `from`/`to` tidak dibulatkan ke batas hari.
   */
  private async dailyRevenue(from: Date, to: Date): Promise<RevenueDayRow[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{ date: string; revenue: bigint | number; paid_count: bigint | number }>
    >`
      SELECT "date",
             COALESCE(SUM("amount_idr"), 0) AS revenue,
             COUNT(*) AS paid_count
      FROM "v_daily_revenue"
      WHERE "created_at" >= ${from}
        AND "created_at" < ${to}
      GROUP BY "date"
      ORDER BY "date"
    `;

    return rows.map((row) => ({
      date: row.date,
      revenueIdr: Number(row.revenue),
      paidCount: Number(row.paid_count),
    }));
  }

  /** Isi hari tanpa transaksi dengan 0 agar grafik tidak bolong. */
  private fillDays(rows: RevenueDayRow[], from: Date, to: Date): RevenueDayRow[] {
    const byDate = new Map(rows.map((row) => [row.date, row]));
    const result: RevenueDayRow[] = [];

    const cursor = new Date(from.getTime());
    while (cursor.getTime() < to.getTime()) {
      const key = jakartaDateKey(cursor);
      result.push(byDate.get(key) ?? { date: key, revenueIdr: 0, paidCount: 0 });
      cursor.setTime(cursor.getTime() + DAY_MS);
    }

    return result;
  }
}
