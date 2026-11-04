import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../src/core/prisma/prisma.service';
import type { AuditService } from '../../src/modules/audit/audit.service';
import type { PlansService } from '../../src/modules/billing/plans.service';
import { SubscriptionsService } from '../../src/modules/billing/subscriptions.service';

const DAY_MS = 86_400_000;
const NOW = new Date('2026-11-05T00:00:00.000Z');
const FUTURE_ENDS = new Date('2026-12-05T00:00:00.000Z');
const ACTOR = { id: 'admin-1', ip: '127.0.0.1', userAgent: 'vitest' };

function subscriptionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-1',
    userId: 'user-1',
    planId: 'plan-1',
    sourceTransactionId: null,
    status: 'ACTIVE',
    source: 'MANUAL_GRANT',
    startsAt: new Date('2026-11-01T00:00:00.000Z'),
    endsAt: FUTURE_ENDS,
    grantedById: 'admin-1',
    grantNote: 'hadiah lomba',
    revokedAt: null,
    revokeReason: null,
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
    plan: { code: 'BULANAN', name: 'Paket Bulanan' },
    ...overrides,
  };
}

function createHarness() {
  const prisma = {
    user: { findFirst: vi.fn() },
    subscription: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    subscriptionEvent: { create: vi.fn() },
  };

  const plans = { requireAnyByCode: vi.fn() };
  const audit = { record: vi.fn().mockResolvedValue(undefined) };

  const service = new SubscriptionsService(
    prisma as unknown as PrismaService,
    plans as unknown as PlansService,
    audit as unknown as AuditService,
  );

  return { prisma, plans, audit, service };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

describe('SubscriptionsService — grant manual', () => {
  it('menolak durasi 0 hari', async () => {
    const { prisma, service } = createHarness();
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1', email: 'user@example.com' });

    await expect(
      service.grant(
        { userId: 'user-1', durationDays: 0, mode: 'STACK', reason: 'kompensasi' },
        ACTOR,
      ),
    ).rejects.toMatchObject({ code: 'SUBSCRIPTION_DURATION_INVALID', status: 422 });
  });

  it('menolak durasi lebih dari 3650 hari', async () => {
    const { prisma, service } = createHarness();
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1', email: 'user@example.com' });

    await expect(
      service.grant(
        { userId: 'user-1', durationDays: 3651, mode: 'STACK', reason: 'kompensasi' },
        ACTOR,
      ),
    ).rejects.toMatchObject({ code: 'SUBSCRIPTION_DURATION_INVALID', status: 422 });
  });

  it('menolak user yang tidak ada', async () => {
    const { prisma, service } = createHarness();
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.grant(
        { userId: 'user-x', durationDays: 30, mode: 'STACK', reason: 'kompensasi' },
        ACTOR,
      ),
    ).rejects.toMatchObject({ code: 'USER_NOT_FOUND', status: 404 });
  });

  it('STACK menambahkan masa setelah langganan aktif terakhir', async () => {
    const { prisma, audit, service } = createHarness();
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1', email: 'user@example.com' });
    prisma.subscription.findFirst.mockResolvedValue({ endsAt: FUTURE_ENDS });
    prisma.subscription.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
      subscriptionRow({
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        status: data.status,
        plan: null,
        source: data.source,
        grantNote: data.grantNote,
      }),
    );

    const result = await service.grant(
      { userId: 'user-1', durationDays: 30, mode: 'STACK', reason: 'perpanjangan hadiah' },
      ACTOR,
    );

    const created = prisma.subscription.create.mock.calls[0]?.[0]?.data as Record<string, unknown>;
    expect(created.startsAt).toEqual(FUTURE_ENDS);
    expect(created.endsAt).toEqual(new Date(FUTURE_ENDS.getTime() + 30 * DAY_MS));
    // Mulai di masa depan: baris disimpan PENDING sampai cron mengaktifkannya.
    expect(created.status).toBe('PENDING');
    expect(created.source).toBe('MANUAL_GRANT');
    expect(result.planCode).toBeNull();

    expect(prisma.subscriptionEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'CREATED',
        note: 'perpanjangan hadiah',
        metadata: expect.objectContaining({ mode: 'STACK', durationDays: 30 }),
      }),
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'subscription.grant',
        entityId: 'sub-1',
        metadata: expect.objectContaining({ mode: 'STACK', reason: 'perpanjangan hadiah' }),
      }),
    );
  });

  it('REPLACE mencabut langganan aktif lalu mulai dari sekarang', async () => {
    const { prisma, service } = createHarness();
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1', email: 'user@example.com' });
    prisma.subscription.findMany.mockResolvedValue([
      subscriptionRow({ id: 'sub-lama', endsAt: FUTURE_ENDS }),
    ]);
    prisma.subscription.update.mockResolvedValue(
      subscriptionRow({ id: 'sub-lama', status: 'REVOKED' }),
    );
    prisma.subscription.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
      subscriptionRow({ startsAt: data.startsAt, endsAt: data.endsAt, plan: null }),
    );

    await service.grant(
      { userId: 'user-1', durationDays: 7, mode: 'REPLACE', reason: 'ganti paket' },
      ACTOR,
    );

    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-lama' },
      data: {
        status: 'REVOKED',
        revokedAt: NOW,
        revokeReason: 'ganti paket',
      },
    });
    expect(prisma.subscriptionEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subscriptionId: 'sub-lama',
        type: 'REVOKED',
        note: 'Diganti oleh grant baru: ganti paket',
      }),
    });

    const created = prisma.subscription.create.mock.calls[0]?.[0]?.data as Record<string, unknown>;
    expect(created.startsAt).toEqual(NOW);
    expect(created.endsAt).toEqual(new Date(NOW.getTime() + 7 * DAY_MS));
  });

  it('memakai durasi dan planId dari paket bila planCode dikirim', async () => {
    const { prisma, plans, service } = createHarness();
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1', email: 'user@example.com' });
    plans.requireAnyByCode.mockResolvedValue({
      id: 'plan-9',
      code: 'TAHUNAN',
      name: 'Paket Tahunan',
      durationDays: 365,
    });
    prisma.subscription.findFirst.mockResolvedValue(null);
    prisma.subscription.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
      subscriptionRow({ startsAt: data.startsAt, endsAt: data.endsAt, plan: null }),
    );

    await service.grant(
      { userId: 'user-1', planCode: 'tahunan', mode: 'STACK', reason: 'hadiah' },
      ACTOR,
    );

    expect(plans.requireAnyByCode).toHaveBeenCalledWith('tahunan');
    const created = prisma.subscription.create.mock.calls[0]?.[0]?.data as Record<string, unknown>;
    expect(created.planId).toBe('plan-9');
    expect(created.endsAt).toEqual(new Date(NOW.getTime() + 365 * DAY_MS));
  });
});

describe('SubscriptionsService — ubah & cabut', () => {
  it('extendDays menambah dari endsAt yang masih berlaku', async () => {
    const { prisma, audit, service } = createHarness();
    prisma.subscription.findUnique.mockResolvedValue(subscriptionRow());
    prisma.subscription.update.mockResolvedValue(
      subscriptionRow({ endsAt: new Date(FUTURE_ENDS.getTime() + 10 * DAY_MS) }),
    );

    await service.update('sub-1', { extendDays: 10, reason: 'perpanjangan manual' }, ACTOR);

    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: {
        endsAt: new Date(FUTURE_ENDS.getTime() + 10 * DAY_MS),
        status: 'ACTIVE',
      },
      include: expect.any(Object),
    });
    expect(prisma.subscriptionEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'EXTENDED',
        note: 'perpanjangan manual',
        metadata: expect.objectContaining({ extendDays: 10 }),
      }),
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'subscription.update' }),
    );
  });

  it('menolak update tanpa extendDays/endsAt/status', async () => {
    const { prisma, service } = createHarness();
    prisma.subscription.findUnique.mockResolvedValue(subscriptionRow());

    await expect(
      service.update('sub-1', { reason: 'tanpa perubahan' }, ACTOR),
    ).rejects.toMatchObject({ code: 'COMMON_VALIDATION_FAILED', status: 422 });
  });

  it('menolak masa aktif lebih dari 10 tahun ke depan', async () => {
    const { prisma, service } = createHarness();
    prisma.subscription.findUnique.mockResolvedValue(subscriptionRow());

    await expect(
      service.update(
        'sub-1',
        { endsAt: new Date(NOW.getTime() + 3651 * DAY_MS), reason: 'terlalu jauh' },
        ACTOR,
      ),
    ).rejects.toMatchObject({ code: 'SUBSCRIPTION_DURATION_INVALID', status: 422 });
  });

  it('revoke menyimpan alasan, event, dan audit', async () => {
    const { prisma, audit, service } = createHarness();
    prisma.subscription.findUnique.mockResolvedValue(subscriptionRow());
    prisma.subscription.update.mockResolvedValue(
      subscriptionRow({
        status: 'REVOKED',
        revokedAt: NOW,
        revokeReason: 'pelanggaran aturan',
      }),
    );

    const result = await service.revoke('sub-1', 'pelanggaran aturan', ACTOR);

    expect(result.status).toBe('REVOKED');
    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: {
        status: 'REVOKED',
        revokedAt: NOW,
        revokeReason: 'pelanggaran aturan',
      },
      include: expect.any(Object),
    });
    expect(prisma.subscriptionEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'REVOKED', note: 'pelanggaran aturan' }),
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'subscription.revoke',
        metadata: { userId: 'user-1', reason: 'pelanggaran aturan' },
      }),
    );
  });

  it('menolak pencabutan langganan yang sudah dicabut', async () => {
    const { prisma, service } = createHarness();
    prisma.subscription.findUnique.mockResolvedValue(subscriptionRow({ status: 'REVOKED' }));

    await expect(service.revoke('sub-1', 'dobel cabut', ACTOR)).rejects.toMatchObject({
      code: 'SUBSCRIPTION_ALREADY_REVOKED',
      status: 409,
    });
  });

  it('menolak cursor daftar admin yang rusak', async () => {
    const { prisma, service } = createHarness();

    await expect(
      service.listAdmin({ limit: 20, cursor: 'bukan-cursor' }),
    ).rejects.toMatchObject({ code: 'COMMON_BAD_REQUEST', status: 400 });
    expect(prisma.subscription.findMany).not.toHaveBeenCalled();
  });
});

describe('SubscriptionsService — aktivasi pembayaran', () => {
  function createTx() {
    return {
      subscription: { findFirst: vi.fn(), create: vi.fn() },
      subscriptionEvent: { create: vi.fn() },
      outboxEvent: { create: vi.fn() },
    };
  }

  it('pembelian pertama membuat langganan ACTIVATED mulai paidAt', async () => {
    const { service } = createHarness();
    const tx = createTx();
    tx.subscription.findFirst.mockResolvedValue(null);
    tx.subscription.create.mockResolvedValue(
      subscriptionRow({ startsAt: NOW, endsAt: new Date(NOW.getTime() + 30 * DAY_MS) }),
    );

    const result = await service.activateFromPayment(
      tx as never,
      {
        userId: 'user-1',
        planId: 'plan-1',
        planCode: 'BULANAN',
        durationDays: 30,
        transactionId: 'txn-1',
        paidAt: NOW,
      },
    );

    expect(result.id).toBe('sub-1');
    expect(tx.subscription.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        startsAt: NOW,
        endsAt: new Date(NOW.getTime() + 30 * DAY_MS),
        source: 'PURCHASE',
        sourceTransactionId: 'txn-1',
      }),
      include: expect.any(Object),
    });
    expect(tx.subscriptionEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'ACTIVATED', transactionId: 'txn-1' }),
    });
    expect(tx.outboxEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ topic: 'subscription.activated' }),
    });
  });

  it('pembelian saat aktif menumpuk setelah endsAt (RENEWED)', async () => {
    const { service } = createHarness();
    const tx = createTx();
    tx.subscription.findFirst
      .mockResolvedValueOnce(null) // belum pernah aktivasi untuk transaksi ini
      .mockResolvedValueOnce({ endsAt: FUTURE_ENDS });
    tx.subscription.create.mockResolvedValue(
      subscriptionRow({ startsAt: FUTURE_ENDS, endsAt: new Date(FUTURE_ENDS.getTime() + 30 * DAY_MS) }),
    );

    await service.activateFromPayment(
      tx as never,
      {
        userId: 'user-1',
        planId: 'plan-1',
        planCode: 'BULANAN',
        durationDays: 30,
        transactionId: 'txn-2',
        paidAt: NOW,
      },
    );

    expect(tx.subscription.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        startsAt: FUTURE_ENDS,
        endsAt: new Date(FUTURE_ENDS.getTime() + 30 * DAY_MS),
      }),
      include: expect.any(Object),
    });
    expect(tx.subscriptionEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'RENEWED',
        metadata: expect.objectContaining({ stacked: true }),
      }),
    });
  });

  it('idempoten: transaksi yang sudah punya langganan tidak membuat baris baru', async () => {
    const { service } = createHarness();
    const tx = createTx();
    tx.subscription.findFirst.mockResolvedValue(subscriptionRow());

    const result = await service.activateFromPayment(
      tx as never,
      {
        userId: 'user-1',
        planId: 'plan-1',
        planCode: 'BULANAN',
        durationDays: 30,
        transactionId: 'txn-1',
        paidAt: NOW,
      },
    );

    expect(result.id).toBe('sub-1');
    expect(tx.subscription.create).not.toHaveBeenCalled();
    expect(tx.subscriptionEvent.create).not.toHaveBeenCalled();
    expect(tx.outboxEvent.create).not.toHaveBeenCalled();
  });
});
