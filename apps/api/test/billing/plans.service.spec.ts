import { describe, expect, it, vi } from 'vitest';
import type { LoggerService } from '../../src/core/logger/logger.service';
import type { PrismaService } from '../../src/core/prisma/prisma.service';
import type { AuditService } from '../../src/modules/audit/audit.service';
import { PlansService } from '../../src/modules/billing/plans.service';

const NOW = new Date('2026-11-05T00:00:00.000Z');
const ACTOR = { id: 'admin-1', ip: '127.0.0.1', userAgent: 'vitest' };

function planRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'plan-1',
    code: 'BULANAN',
    name: 'Paket Bulanan',
    tagline: 'Akses 30 hari',
    priceIdr: 149000,
    compareAtPriceIdr: 199000,
    durationDays: 30,
    features: [{ label: 'Semua tes', included: true }],
    badge: null,
    isPopular: true,
    isPublic: true,
    sortOrder: 1,
    status: 'ACTIVE',
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    ...overrides,
  };
}

function createHarness() {
  const prisma = {
    subscriptionPlan: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      count: vi.fn(),
    },
  };
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
  const audit = { record: vi.fn().mockResolvedValue(undefined) };
  const service = new PlansService(
    prisma as unknown as PrismaService,
    logger as unknown as LoggerService,
    audit as unknown as AuditService,
  );
  return { prisma, logger, audit, service };
}

describe('PlansService — publik', () => {
  it('memetakan paket publik beserta harga per hari', async () => {
    const { prisma, service } = createHarness();
    prisma.subscriptionPlan.findMany.mockResolvedValue([planRow()]);

    const plans = await service.listPublic();

    expect(prisma.subscriptionPlan.findMany).toHaveBeenCalledWith({
      where: { status: 'ACTIVE', isPublic: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { priceIdr: 'asc' }],
    });
    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({
      code: 'BULANAN',
      priceIdr: 149000,
      pricePerDayIdr: 4967,
      features: [{ label: 'Semua tes', included: true }],
    });
  });

  it('memakai paket default bila tabel benar-benar kosong', async () => {
    const { prisma, logger, service } = createHarness();
    prisma.subscriptionPlan.findMany.mockResolvedValue([]);
    prisma.subscriptionPlan.count.mockResolvedValue(0);

    const plans = await service.listPublic();

    expect(plans.length).toBeGreaterThan(0);
    expect(logger.warn).toHaveBeenCalledWith(
      'subscription_plans kosong — memakai paket default',
    );
  });

  /**
   * Regresi F5-02: admin yang menghapus semua paket harus melihat halaman
   * pricing kosong, bukan harga default yang "hidup kembali".
   */
  it('tidak menghidupkan paket default saat semua paket dihapus admin', async () => {
    const { prisma, logger, service } = createHarness();
    prisma.subscriptionPlan.findMany.mockResolvedValue([]);
    prisma.subscriptionPlan.count.mockResolvedValue(6);

    const plans = await service.listPublic();

    expect(plans).toEqual([]);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('menolak paket yang tidak ada, terhapus, atau belum aktif', async () => {
    const { prisma, service } = createHarness();
    prisma.subscriptionPlan.findUnique.mockResolvedValueOnce(null);

    await expect(service.requirePurchasable('TIDAK_ADA')).rejects.toMatchObject({
      code: 'BILLING_PLAN_NOT_FOUND',
      status: 404,
    });

    prisma.subscriptionPlan.findUnique.mockResolvedValueOnce(
      planRow({ deletedAt: NOW }),
    );
    await expect(service.requirePurchasable('BULANAN')).rejects.toMatchObject({
      code: 'BILLING_PLAN_NOT_FOUND',
      status: 404,
    });

    prisma.subscriptionPlan.findUnique.mockResolvedValueOnce(planRow({ status: 'DRAFT' }));
    await expect(service.requirePurchasable('BULANAN')).rejects.toMatchObject({
      code: 'BILLING_PLAN_NOT_PURCHASABLE',
      status: 409,
    });
  });
});

describe('PlansService — admin', () => {
  it('menolak kode paket ganda', async () => {
    const { prisma, service } = createHarness();
    prisma.subscriptionPlan.findUnique.mockResolvedValue({ id: 'plan-lama' });

    await expect(
      service.create(
        {
          code: 'BULANAN',
          name: 'Paket Bulanan',
          priceIdr: 149000,
          durationDays: 30,
          features: [],
          isPopular: false,
          isPublic: true,
          sortOrder: 0,
          status: 'ACTIVE',
        },
        ACTOR,
      ),
    ).rejects.toMatchObject({ code: 'BILLING_PLAN_CODE_EXISTS', status: 409 });
    expect(prisma.subscriptionPlan.create).not.toHaveBeenCalled();
  });

  it('membuat paket dan menulis audit', async () => {
    const { prisma, audit, service } = createHarness();
    prisma.subscriptionPlan.findUnique.mockResolvedValue(null);
    prisma.subscriptionPlan.create.mockResolvedValue(planRow());

    const plan = await service.create(
      {
        code: 'BULANAN',
        name: 'Paket Bulanan',
        tagline: null,
        priceIdr: 149000,
        compareAtPriceIdr: null,
        durationDays: 30,
        features: [{ label: 'Semua tes', included: true }],
        badge: null,
        isPopular: true,
        isPublic: true,
        sortOrder: 1,
        status: 'ACTIVE',
      },
      ACTOR,
    );

    expect(plan.code).toBe('BULANAN');
    expect(prisma.subscriptionPlan.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ code: 'BULANAN', priceIdr: 149000 }),
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'plan.create',
        entityType: 'subscription_plan',
        entityId: 'plan-1',
      }),
    );
  });

  it('menolak update paket yang tidak ditemukan', async () => {
    const { prisma, service } = createHarness();
    prisma.subscriptionPlan.findUnique.mockResolvedValue(null);

    await expect(
      service.update('plan-x', { priceIdr: 129000 }, ACTOR),
    ).rejects.toMatchObject({ code: 'BILLING_PLAN_NOT_FOUND', status: 404 });
    expect(prisma.subscriptionPlan.update).not.toHaveBeenCalled();
  });

  it('menolak update paket yang sudah dihapus', async () => {
    const { prisma, service } = createHarness();
    prisma.subscriptionPlan.findUnique.mockResolvedValue(planRow({ deletedAt: NOW }));

    await expect(
      service.update('plan-1', { priceIdr: 129000 }, ACTOR),
    ).rejects.toMatchObject({ code: 'BILLING_PLAN_ARCHIVED', status: 409 });
    expect(prisma.subscriptionPlan.update).not.toHaveBeenCalled();
  });

  it('menyembunyikan paket terhapus dari daftar admin secara default', async () => {
    const { prisma, service } = createHarness();
    prisma.subscriptionPlan.findMany.mockResolvedValue([]);

    await service.listAll();

    expect(prisma.subscriptionPlan.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { priceIdr: 'asc' }],
    });
  });
});

describe('PlansService — soft delete (F5-02)', () => {
  it('menandai deleted_at, tidak menghapus baris, dan menulis audit', async () => {
    const { prisma, audit, service } = createHarness();
    prisma.subscriptionPlan.findUnique.mockResolvedValue(planRow());
    prisma.subscription.count.mockResolvedValue(0);
    prisma.subscriptionPlan.update.mockResolvedValue(planRow({ deletedAt: NOW }));

    const result = await service.remove('plan-1', 'diganti promo baru', ACTOR);

    expect(prisma.subscriptionPlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: { deletedAt: expect.any(Date) },
    });
    // Tidak boleh ada operasi hapus fisik.
    expect(prisma.subscriptionPlan).not.toHaveProperty('delete');
    expect(result).toMatchObject({ id: 'plan-1', code: 'BULANAN', deleted: true });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'plan.delete',
        entityType: 'subscription_plan',
        entityId: 'plan-1',
        metadata: expect.objectContaining({ reason: 'diganti promo baru' }),
      }),
    );
  });

  it('menolak menghapus paket yang masih dipakai langganan aktif', async () => {
    const { prisma, service } = createHarness();
    prisma.subscriptionPlan.findUnique.mockResolvedValue(planRow());
    prisma.subscription.count.mockResolvedValue(3);

    await expect(
      service.remove('plan-1', 'alasan apa pun', ACTOR),
    ).rejects.toMatchObject({ code: 'BILLING_PLAN_IN_USE', status: 409 });
    expect(prisma.subscriptionPlan.update).not.toHaveBeenCalled();
  });

  it('idempoten: menghapus paket yang sudah terhapus tidak menulis audit lagi', async () => {
    const { prisma, audit, service } = createHarness();
    prisma.subscriptionPlan.findUnique.mockResolvedValue(planRow({ deletedAt: NOW }));

    const result = await service.remove('plan-1', 'ulang', ACTOR);

    expect(result.deleted).toBe(true);
    expect(result.deletedAt).toBe(NOW.toISOString());
    expect(prisma.subscriptionPlan.update).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('memulihkan paket dan menulis audit', async () => {
    const { prisma, audit, service } = createHarness();
    prisma.subscriptionPlan.findUnique.mockResolvedValue(planRow({ deletedAt: NOW }));
    prisma.subscriptionPlan.update.mockResolvedValue(planRow({ deletedAt: null }));

    const restored = await service.restore('plan-1', 'dipakai lagi', ACTOR);

    expect(prisma.subscriptionPlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: { deletedAt: null },
    });
    expect(restored.deletedAt).toBeNull();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'plan.restore', entityId: 'plan-1' }),
    );
  });

  it('menolak restore paket yang tidak sedang terhapus', async () => {
    const { prisma, service } = createHarness();
    prisma.subscriptionPlan.findUnique.mockResolvedValue(planRow());

    await expect(
      service.restore('plan-1', 'tidak perlu', ACTOR),
    ).rejects.toMatchObject({ code: 'BILLING_PLAN_NOT_ARCHIVED', status: 409 });
  });

  it('menolak membuat paket baru dengan kode milik paket terarsip', async () => {
    const { prisma, service } = createHarness();
    prisma.subscriptionPlan.findUnique.mockResolvedValue({
      id: 'plan-lama',
      deletedAt: NOW,
    });

    await expect(
      service.create(
        {
          code: 'BULANAN',
          name: 'Paket Bulanan',
          priceIdr: 149000,
          durationDays: 30,
          features: [],
          isPopular: false,
          isPublic: true,
          sortOrder: 0,
          status: 'ACTIVE',
        },
        ACTOR,
      ),
    ).rejects.toMatchObject({
      code: 'BILLING_PLAN_CODE_EXISTS',
      status: 409,
      message: expect.stringContaining('terarsip'),
    });
  });
});
