import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../src/core/prisma/prisma.service';
import { AnalyticsService } from '../../src/modules/analytics/analytics.service';

function createHarness() {
  const prisma = {
    transaction: { groupBy: vi.fn() },
    subscription: { count: vi.fn() },
    subscriptionPlan: { findMany: vi.fn() },
    $queryRaw: vi.fn(),
  };
  const service = new AnalyticsService(prisma as unknown as PrismaService);
  return { prisma, service };
}

describe('AnalyticsService — revenue', () => {
  it('menghitung KPI, konversi, dan rincian per paket', async () => {
    const { prisma, service } = createHarness();
    const from = new Date('2026-11-01T00:00:00.000Z');
    const to = new Date('2026-11-03T00:00:00.000Z');

    prisma.transaction.groupBy.mockImplementation(
      async ({ by }: { by: string[] }) =>
        by[0] === 'status'
          ? [
              { status: 'SUCCESS', _count: { _all: 3 }, _sum: { amountIdr: 447000 } },
              { status: 'REFUNDED', _count: { _all: 1 }, _sum: { amountIdr: 149000 } },
              { status: 'PENDING', _count: { _all: 2 }, _sum: { amountIdr: 298000 } },
              { status: 'EXPIRED', _count: { _all: 2 }, _sum: { amountIdr: 298000 } },
            ]
          : [
              { planId: 'plan-1', _count: { _all: 3 }, _sum: { amountIdr: 447000 } },
              { planId: null, _count: { _all: 1 }, _sum: { amountIdr: 149000 } },
            ],
    );
    prisma.subscription.count.mockResolvedValueOnce(12).mockResolvedValueOnce(4).mockResolvedValueOnce(2);
    prisma.subscriptionPlan.findMany.mockResolvedValue([
      { id: 'plan-1', code: 'BULANAN', name: 'Paket Bulanan' },
    ]);
    prisma.$queryRaw.mockResolvedValue([
      { date: '2026-11-01', revenue: 298000n, paid_count: 2n },
      { date: '2026-11-02', revenue: 298000n, paid_count: 2n },
    ]);

    const kpi = await service.revenue({ from, to, days: 30 });

    expect(kpi).toMatchObject({
      grossRevenueIdr: 596000,
      refundedIdr: 149000,
      netRevenueIdr: 447000,
      transactionCount: 8,
      paidCount: 4,
      pendingCount: 2,
      conversionRate: 50,
      averageOrderValueIdr: 149000,
      activeSubscriptions: 12,
      newSubscriptions: 4,
      expiringCount: 2,
    });
    expect(kpi.byPlan).toEqual([
      {
        planCode: 'BULANAN',
        planName: 'Paket Bulanan',
        transactionCount: 3,
        paidCount: 3,
        revenueIdr: 447000,
      },
      {
        planCode: null,
        planName: 'Tanpa paket',
        transactionCount: 1,
        paidCount: 1,
        revenueIdr: 149000,
      },
    ]);
    expect(kpi.daily).toEqual([
      { date: '2026-11-01', revenueIdr: 298000, paidCount: 2 },
      { date: '2026-11-02', revenueIdr: 298000, paidCount: 2 },
    ]);
  });

  it('mengisi hari tanpa transaksi dengan nol', async () => {
    const { prisma, service } = createHarness();
    const from = new Date('2026-11-01T00:00:00.000Z');
    const to = new Date('2026-11-04T00:00:00.000Z');

    prisma.transaction.groupBy.mockResolvedValue([]);
    prisma.subscription.count.mockResolvedValue(0);
    prisma.subscriptionPlan.findMany.mockResolvedValue([]);
    prisma.$queryRaw.mockResolvedValue([]);

    const kpi = await service.revenue({ from, to, days: 30 });

    expect(kpi.transactionCount).toBe(0);
    expect(kpi.conversionRate).toBe(0);
    expect(kpi.daily).toEqual([
      { date: '2026-11-01', revenueIdr: 0, paidCount: 0 },
      { date: '2026-11-02', revenueIdr: 0, paidCount: 0 },
      { date: '2026-11-03', revenueIdr: 0, paidCount: 0 },
    ]);
  });
});
