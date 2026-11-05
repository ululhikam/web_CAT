import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PaymentEvent, PaymentProvider, SubscriptionSummary } from '@webcat/contracts';
import type { LoggerService } from '../../src/core/logger/logger.service';
import type { PrismaService } from '../../src/core/prisma/prisma.service';
import type { AuditService } from '../../src/modules/audit/audit.service';
import type { PlansService } from '../../src/modules/billing/plans.service';
import type { SubscriptionsService } from '../../src/modules/billing/subscriptions.service';
import { PaymentsService } from '../../src/modules/payments/payments.service';

const NOW = new Date('2026-11-05T00:00:00.000Z');
const PLAN = {
  id: 'plan-1',
  code: 'BULANAN',
  name: 'Paket Bulanan',
  priceIdr: 149000,
  durationDays: 30,
  status: 'ACTIVE',
  isPublic: true,
};

function transactionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'txn-1',
    orderId: 'WC-TEST-1',
    userId: 'user-1',
    planId: 'plan-1',
    subscriptionId: null,
    amountIdr: 149000,
    status: 'PENDING',
    provider: 'fake',
    providerRef: 'fake-WC-TEST-1',
    snapToken: 'snap-token-1',
    redirectUrl: 'https://pay.example/WC-TEST-1',
    invoiceNumber: 'INV/2026/11/0001',
    expiresAt: new Date('2026-11-06T00:00:00.000Z'),
    paidAt: null,
    refundedAt: null,
    refundReason: null,
    refundedById: null,
    rawPayload: null,
    createdAt: new Date('2026-11-05T00:00:00.000Z'),
    updatedAt: new Date('2026-11-05T00:00:00.000Z'),
    plan: { code: 'BULANAN', name: 'Paket Bulanan', durationDays: 30 },
    user: { id: 'user-1', email: 'user@example.com', fullName: 'User Satu' },
    ...overrides,
  };
}

const SUBSCRIPTION: SubscriptionSummary = {
  id: 'sub-1',
  userId: 'user-1',
  planCode: 'BULANAN',
  planName: 'Paket Bulanan',
  status: 'ACTIVE',
  source: 'PURCHASE',
  startsAt: NOW.toISOString(),
  endsAt: new Date(NOW.getTime() + 30 * 86_400_000).toISOString(),
  remainingDays: 30,
  grantedBy: null,
  grantNote: null,
  revokedAt: null,
  revokeReason: null,
  createdAt: NOW.toISOString(),
};

function createHarness() {
  const tx = {
    transaction: {
      create: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    subscriptionEvent: { create: vi.fn() },
    outboxEvent: { create: vi.fn() },
  };

  const prisma = {
    user: { findFirst: vi.fn() },
    transaction: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    paymentWebhookEvent: {
      create: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation(async (callback: (client: typeof tx) => unknown) =>
    callback(tx),
  );

  const plans = { requirePurchasable: vi.fn(), requireAnyByCode: vi.fn() };
  const subscriptions = { activateFromPayment: vi.fn(), revoke: vi.fn() };
  const audit = { record: vi.fn().mockResolvedValue(undefined) };
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
  const provider = {
    name: 'fake',
    createCharge: vi.fn(),
    verifyWebhook: vi.fn(),
    parseEvent: vi.fn(),
    refund: vi.fn(),
    sign: vi.fn(),
  };

  const service = new PaymentsService(
    prisma as unknown as PrismaService,
    plans as unknown as PlansService,
    subscriptions as unknown as SubscriptionsService,
    audit as unknown as AuditService,
    logger as unknown as LoggerService,
    provider as unknown as PaymentProvider,
  );

  return { prisma, tx, plans, subscriptions, audit, logger, provider, service };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

function pendingEvent(overrides: Partial<PaymentEvent> = {}): PaymentEvent {
  return {
    providerEventId: 'evt-1',
    orderId: 'WC-TEST-1',
    status: 'SUCCESS',
    amountIdr: 149000,
    paidAt: NOW,
    raw: { order_id: 'WC-TEST-1' },
    ...overrides,
  };
}

describe('PaymentsService — checkout', () => {
  it('memakai harga dari database, bukan nominal klien', async () => {
    const { prisma, plans, provider, service } = createHarness();
    plans.requirePurchasable.mockResolvedValue(PLAN);
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      fullName: 'User Satu',
      status: 'ACTIVE',
    });
    prisma.transaction.findFirst.mockResolvedValue(null);
    prisma.transaction.count.mockResolvedValue(0);
    prisma.transaction.findUnique.mockResolvedValue(null);
    prisma.transaction.create.mockResolvedValue(
      transactionRow({ snapToken: null, redirectUrl: null, providerRef: null }),
    );
    provider.createCharge.mockResolvedValue({
      providerToken: 'snap-token-1',
      redirectUrl: 'https://pay.example/WC-TEST-1',
      expiresAt: new Date('2026-11-06T00:00:00.000Z'),
    });
    prisma.transaction.update.mockResolvedValue(transactionRow());

    const result = await service.checkout('user-1', 'bulanan');

    expect(prisma.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amountIdr: 149000,
        status: 'PENDING',
        planId: 'plan-1',
        userId: 'user-1',
      }),
    });
    expect(provider.createCharge).toHaveBeenCalledWith(
      expect.objectContaining({ amountIdr: 149000, planCode: 'BULANAN' }),
    );
    expect(result.transaction.amountIdr).toBe(149000);
    expect(result.snapToken).toBe('snap-token-1');
    expect(result.simulated).toBe(true);
    expect(result.subscription).toBeNull();
  });

  it('memakai ulang tagihan PENDING yang masih segar (anti klik ganda)', async () => {
    const { prisma, plans, provider, service } = createHarness();
    plans.requirePurchasable.mockResolvedValue(PLAN);
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      fullName: 'User Satu',
      status: 'ACTIVE',
    });
    prisma.transaction.findFirst.mockResolvedValue(transactionRow());

    const result = await service.checkout('user-1', 'BULANAN');

    expect(prisma.transaction.create).not.toHaveBeenCalled();
    expect(provider.createCharge).not.toHaveBeenCalled();
    expect(result.transaction.orderId).toBe('WC-TEST-1');
    expect(prisma.transaction.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ provider: 'fake', status: 'PENDING' }),
      }),
    );
  });

  it('paket gratis langsung SUCCESS tanpa gateway', async () => {
    const { prisma, tx, plans, subscriptions, provider, service } = createHarness();
    plans.requirePurchasable.mockResolvedValue({
      ...PLAN,
      code: 'GRATIS',
      priceIdr: 0,
      durationDays: 7,
    });
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      fullName: 'User Satu',
      status: 'ACTIVE',
    });
    tx.transaction.create.mockResolvedValue(
      transactionRow({ amountIdr: 0, status: 'SUCCESS', paidAt: NOW }),
    );
    subscriptions.activateFromPayment.mockResolvedValue(SUBSCRIPTION);
    tx.transaction.update.mockResolvedValue(
      transactionRow({ amountIdr: 0, status: 'SUCCESS', subscriptionId: 'sub-1' }),
    );

    const result = await service.checkout('user-1', 'GRATIS');

    expect(provider.createCharge).not.toHaveBeenCalled();
    expect(subscriptions.activateFromPayment).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ planCode: 'GRATIS', durationDays: 7, userId: 'user-1' }),
    );
    expect(result.subscription?.id).toBe('sub-1');
    expect(result.transaction.status).toBe('SUCCESS');
  });

  it('menolak user yang ditangguhkan', async () => {
    const { prisma, plans, service } = createHarness();
    plans.requirePurchasable.mockResolvedValue(PLAN);
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      fullName: 'User Satu',
      status: 'SUSPENDED',
    });

    await expect(service.checkout('user-1', 'BULANAN')).rejects.toMatchObject({
      code: 'USER_SUSPENDED',
      status: 403,
    });
  });

  it('meneruskan error paket yang tidak bisa dibeli', async () => {
    const { plans, service } = createHarness();
    plans.requirePurchasable.mockRejectedValue(
      Object.assign(new Error('tidak tersedia'), {
        code: 'BILLING_PLAN_NOT_PURCHASABLE',
        status: 409,
      }),
    );

    await expect(service.checkout('user-1', 'ARSIP')).rejects.toMatchObject({
      code: 'BILLING_PLAN_NOT_PURCHASABLE',
      status: 409,
    });
  });

  it('menandai tagihan FAILED bila gateway menolak charge', async () => {
    const { prisma, plans, provider, logger, service } = createHarness();
    plans.requirePurchasable.mockResolvedValue(PLAN);
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      fullName: 'User Satu',
      status: 'ACTIVE',
    });
    prisma.transaction.findFirst.mockResolvedValue(null);
    prisma.transaction.count.mockResolvedValue(0);
    prisma.transaction.findUnique.mockResolvedValue(null);
    prisma.transaction.create.mockResolvedValue(transactionRow());
    prisma.transaction.updateMany.mockResolvedValue({ count: 1 });
    provider.createCharge.mockRejectedValue(new Error('gateway down'));

    await expect(service.checkout('user-1', 'BULANAN')).rejects.toMatchObject({
      code: 'PAYMENT_PROVIDER_ERROR',
      status: 502,
    });
    expect(prisma.transaction.updateMany).toHaveBeenCalledWith({
      where: { id: 'txn-1', status: 'PENDING' },
      data: { status: 'FAILED' },
    });
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('PaymentsService — webhook', () => {
  function primeSuccessfulWebhook(harness: ReturnType<typeof createHarness>) {
    const { prisma, tx, subscriptions } = harness;
    prisma.paymentWebhookEvent.create.mockResolvedValue({});
    prisma.paymentWebhookEvent.updateMany.mockResolvedValue({ count: 1 });
    prisma.transaction.findUnique.mockResolvedValue(transactionRow());
    subscriptions.activateFromPayment.mockResolvedValue(SUBSCRIPTION);
    tx.transaction.update.mockResolvedValue(
      transactionRow({ status: 'SUCCESS', paidAt: NOW, subscriptionId: 'sub-1' }),
    );
  }

  it('replay 3× hanya mengaktifkan langganan sekali', async () => {
    const harness = createHarness();
    primeSuccessfulWebhook(harness);
    let calls = 0;
    harness.prisma.paymentWebhookEvent.create.mockImplementation(async () => {
      calls += 1;
      if (calls === 1) return {};
      throw { code: 'P2002' };
    });

    const event = pendingEvent();
    const first = await harness.service.applyWebhookEvent('fake', event);
    const second = await harness.service.applyWebhookEvent('fake', event);
    const third = await harness.service.applyWebhookEvent('fake', event);

    expect(first).toEqual({ received: true, duplicate: false, status: 'SUCCESS' });
    expect(second).toEqual({ received: true, duplicate: true, status: null });
    expect(third).toEqual({ received: true, duplicate: true, status: null });
    expect(harness.subscriptions.activateFromPayment).toHaveBeenCalledTimes(1);
    expect(harness.tx.transaction.update).toHaveBeenCalledTimes(1);
    expect(harness.audit.record).toHaveBeenCalledTimes(1);
  });

  it('webhook bersamaan tetap hanya menghasilkan satu aktivasi', async () => {
    const harness = createHarness();
    primeSuccessfulWebhook(harness);
    let calls = 0;
    harness.prisma.paymentWebhookEvent.create.mockImplementation(async () => {
      calls += 1;
      if (calls === 1) return {};
      throw { code: 'P2002' };
    });

    const event = pendingEvent();
    const results = await Promise.all([
      harness.service.applyWebhookEvent('fake', event),
      harness.service.applyWebhookEvent('fake', event),
    ]);

    expect(results.filter((row) => row.duplicate)).toHaveLength(1);
    expect(results.filter((row) => !row.duplicate)).toHaveLength(1);
    expect(harness.subscriptions.activateFromPayment).toHaveBeenCalledTimes(1);
  });

  it('menolak nominal SUCCESS yang tidak sama dengan tagihan', async () => {
    const harness = createHarness();
    harness.prisma.paymentWebhookEvent.create.mockResolvedValue({});
    harness.prisma.paymentWebhookEvent.updateMany.mockResolvedValue({ count: 1 });
    harness.prisma.transaction.findUnique.mockResolvedValue(transactionRow());

    await expect(
      harness.service.applyWebhookEvent('fake', pendingEvent({ amountIdr: 1000 })),
    ).rejects.toMatchObject({ code: 'PAYMENT_AMOUNT_MISMATCH', status: 422 });

    expect(harness.prisma.$transaction).not.toHaveBeenCalled();
    expect(harness.subscriptions.activateFromPayment).not.toHaveBeenCalled();
    expect(harness.prisma.paymentWebhookEvent.updateMany).toHaveBeenCalledWith({
      where: { provider: 'fake', providerEventId: 'evt-1' },
      data: { error: expect.stringContaining('Nominal pembayaran') },
    });
  });

  it('transaksi final tidak diproses ulang walau nominal berbeda', async () => {
    const harness = createHarness();
    harness.prisma.paymentWebhookEvent.create.mockResolvedValue({});
    harness.prisma.paymentWebhookEvent.updateMany.mockResolvedValue({ count: 1 });
    harness.prisma.transaction.findUnique.mockResolvedValue(
      transactionRow({ status: 'SUCCESS', paidAt: NOW, subscriptionId: 'sub-1' }),
    );

    const ack = await harness.service.applyWebhookEvent(
      'fake',
      pendingEvent({ amountIdr: 1 }),
    );

    expect(ack).toEqual({ received: true, duplicate: false, status: 'SUCCESS' });
    expect(harness.prisma.$transaction).not.toHaveBeenCalled();
    expect(harness.subscriptions.activateFromPayment).not.toHaveBeenCalled();
  });

  it('melempar 404 bila order tidak dikenal', async () => {
    const harness = createHarness();
    harness.prisma.paymentWebhookEvent.create.mockResolvedValue({});
    harness.prisma.paymentWebhookEvent.updateMany.mockResolvedValue({ count: 1 });
    harness.prisma.transaction.findUnique.mockResolvedValue(null);

    await expect(
      harness.service.applyWebhookEvent('fake', pendingEvent()),
    ).rejects.toMatchObject({ code: 'PAYMENT_TRANSACTION_NOT_FOUND', status: 404 });
  });

  it('settleFake melewati verifikasi signature dan jalur webhook yang sama', async () => {
    const harness = createHarness();
    primeSuccessfulWebhook(harness);
    const event = pendingEvent();
    harness.provider.sign.mockReturnValue('signature-valid');
    harness.provider.verifyWebhook.mockReturnValue(true);
    harness.provider.parseEvent.mockReturnValue(event);

    const ack = await harness.service.settleFake('WC-TEST-1');

    expect(harness.provider.verifyWebhook).toHaveBeenCalledWith(
      { 'x-fake-signature': 'signature-valid' },
      expect.any(String),
    );
    expect(ack).toEqual({ received: true, duplicate: false, status: 'SUCCESS' });
    expect(harness.subscriptions.activateFromPayment).toHaveBeenCalledTimes(1);
  });

  it('retry setelah percobaan gagal diproses ulang, bukan dianggap replay', async () => {
    const harness = createHarness();
    primeSuccessfulWebhook(harness);

    let creates = 0;
    harness.prisma.paymentWebhookEvent.create.mockImplementation(async () => {
      creates += 1;
      if (creates === 1) return {};
      throw { code: 'P2002' };
    });
    harness.prisma.paymentWebhookEvent.findUnique.mockResolvedValue({
      processedAt: null,
      error: 'database sempat down',
    });

    let lookups = 0;
    harness.prisma.transaction.findUnique.mockImplementation(async () => {
      lookups += 1;
      if (lookups === 1) throw new Error('database sempat down');
      return transactionRow();
    });

    await expect(harness.service.applyWebhookEvent('fake', pendingEvent())).rejects.toThrow(
      'database sempat down',
    );
    expect(harness.subscriptions.activateFromPayment).not.toHaveBeenCalled();
    expect(harness.prisma.paymentWebhookEvent.updateMany).toHaveBeenCalledWith({
      where: { provider: 'fake', providerEventId: 'evt-1' },
      data: { error: 'database sempat down' },
    });

    const ack = await harness.service.applyWebhookEvent('fake', pendingEvent());

    expect(ack).toEqual({ received: true, duplicate: false, status: 'SUCCESS' });
    expect(harness.subscriptions.activateFromPayment).toHaveBeenCalledTimes(1);
    expect(harness.prisma.paymentWebhookEvent.updateMany).toHaveBeenLastCalledWith({
      where: { provider: 'fake', providerEventId: 'evt-1' },
      data: { processedAt: NOW, error: null },
    });
  });

  it('notifikasi REFUNDED mencabut langganan dan menulis riwayat', async () => {
    const harness = createHarness();
    harness.prisma.paymentWebhookEvent.create.mockResolvedValue({});
    harness.prisma.paymentWebhookEvent.updateMany.mockResolvedValue({ count: 1 });
    harness.prisma.transaction.findUnique.mockResolvedValue(
      transactionRow({ status: 'SUCCESS', paidAt: NOW, subscriptionId: 'sub-1' }),
    );
    harness.tx.subscription.findUnique.mockResolvedValue({
      id: 'sub-1',
      userId: 'user-1',
      status: 'ACTIVE',
      startsAt: NOW,
      endsAt: new Date(NOW.getTime() + 30 * 86_400_000),
    });
    harness.tx.subscription.update.mockResolvedValue({});
    harness.tx.transaction.update.mockResolvedValue(
      transactionRow({
        status: 'REFUNDED',
        paidAt: NOW,
        refundedAt: NOW,
        subscriptionId: 'sub-1',
      }),
    );

    const ack = await harness.service.applyWebhookEvent(
      'fake',
      pendingEvent({ providerEventId: 'evt-refund', status: 'REFUNDED' }),
    );

    expect(ack).toEqual({ received: true, duplicate: false, status: 'REFUNDED' });
    expect(harness.subscriptions.activateFromPayment).not.toHaveBeenCalled();
    expect(harness.tx.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: {
        status: 'REVOKED',
        revokedAt: NOW,
        revokeReason: 'Refund diterima dari gateway',
      },
    });
    expect(harness.tx.subscriptionEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subscriptionId: 'sub-1',
        transactionId: 'txn-1',
        type: 'REVOKED',
        note: 'Refund diterima dari gateway',
      }),
    });
    expect(harness.tx.outboxEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ topic: 'subscription.revoked' }),
    });
    expect(harness.tx.transaction.update).toHaveBeenCalledWith({
      where: { id: 'txn-1' },
      data: expect.objectContaining({
        status: 'REFUNDED',
        refundedAt: NOW,
        refundReason: 'Refund dari gateway',
      }),
      include: expect.any(Object),
    });
  });

  it('notifikasi EXPIRED/FAILED/CANCELLED yang terlambat diabaikan', async () => {
    const harness = createHarness();
    harness.prisma.paymentWebhookEvent.create.mockResolvedValue({});
    harness.prisma.paymentWebhookEvent.updateMany.mockResolvedValue({ count: 1 });
    harness.prisma.transaction.findUnique.mockResolvedValue(
      transactionRow({ status: 'EXPIRED' }),
    );

    const ack = await harness.service.applyWebhookEvent(
      'fake',
      pendingEvent({ providerEventId: 'evt-late', status: 'SUCCESS' }),
    );

    expect(ack).toEqual({ received: true, duplicate: false, status: 'EXPIRED' });
    expect(harness.prisma.$transaction).not.toHaveBeenCalled();
    expect(harness.subscriptions.activateFromPayment).not.toHaveBeenCalled();
  });
});

describe('PaymentsService — admin', () => {
  it('markPaid mengaktifkan langganan dan menulis audit', async () => {
    const harness = createHarness();
    harness.prisma.transaction.findUnique.mockResolvedValue(transactionRow());
    harness.subscriptions.activateFromPayment.mockResolvedValue(SUBSCRIPTION);
    harness.tx.transaction.update.mockResolvedValue(
      transactionRow({ status: 'SUCCESS', paidAt: NOW, subscriptionId: 'sub-1' }),
    );

    const result = await harness.service.markPaid(
      'txn-1',
      { reason: 'transfer manual', paidAt: NOW },
      { id: 'admin-1' },
    );

    expect(result.status).toBe('SUCCESS');
    expect(harness.tx.transaction.update).toHaveBeenCalledWith({
      where: { id: 'txn-1' },
      data: expect.objectContaining({
        status: 'SUCCESS',
        paidAt: NOW,
        subscriptionId: 'sub-1',
      }),
      include: expect.any(Object),
    });
    expect(harness.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'transaction.mark_paid',
        metadata: expect.objectContaining({ reason: 'transfer manual' }),
      }),
    );
  });

  it('markPaid menolak transaksi yang sudah SUCCESS/REFUNDED', async () => {
    const harness = createHarness();
    harness.prisma.transaction.findUnique.mockResolvedValue(
      transactionRow({ status: 'SUCCESS' }),
    );

    await expect(
      harness.service.markPaid('txn-1', { reason: 'dobel' }, { id: 'admin-1' }),
    ).rejects.toMatchObject({ code: 'PAYMENT_STATUS_INVALID', status: 409 });
    expect(harness.prisma.$transaction).not.toHaveBeenCalled();
  });

  it('refund mencatat alasan dan mencabut langganan terkait', async () => {
    const harness = createHarness();
    harness.prisma.transaction.findUnique.mockResolvedValue(
      transactionRow({ status: 'SUCCESS', paidAt: NOW, subscriptionId: 'sub-1' }),
    );
    harness.provider.refund.mockResolvedValue({ providerRef: 'refund-1', raw: {} });
    harness.prisma.transaction.update.mockResolvedValue(
      transactionRow({
        status: 'REFUNDED',
        paidAt: NOW,
        refundedAt: NOW,
        refundReason: 'salah beli',
        subscriptionId: 'sub-1',
      }),
    );
    harness.subscriptions.revoke.mockResolvedValue(SUBSCRIPTION);

    const result = await harness.service.refund(
      'txn-1',
      { reason: 'salah beli', revokeSubscription: true },
      { id: 'admin-1' },
    );

    expect(result.status).toBe('REFUNDED');
    expect(harness.provider.refund).toHaveBeenCalledWith({
      orderId: 'WC-TEST-1',
      amountIdr: 149000,
      reason: 'salah beli',
    });
    expect(harness.prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: 'txn-1' },
      data: expect.objectContaining({
        status: 'REFUNDED',
        refundReason: 'salah beli',
        refundedById: 'admin-1',
      }),
      include: expect.any(Object),
    });
    expect(harness.subscriptions.revoke).toHaveBeenCalledWith(
      'sub-1',
      expect.stringContaining('salah beli'),
      { id: 'admin-1' },
    );
    expect(harness.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'transaction.refund' }),
    );
  });

  it('refund menolak transaksi yang belum SUCCESS', async () => {
    const harness = createHarness();
    harness.prisma.transaction.findUnique.mockResolvedValue(transactionRow());

    await expect(
      harness.service.refund(
        'txn-1',
        { reason: 'salah beli', revokeSubscription: true },
        { id: 'admin-1' },
      ),
    ).rejects.toMatchObject({ code: 'PAYMENT_REFUND_NOT_ALLOWED', status: 409 });
    expect(harness.provider.refund).not.toHaveBeenCalled();
  });

  it('kegagalan refund gateway tidak mengunci admin (tetap dicatat)', async () => {
    const harness = createHarness();
    harness.prisma.transaction.findUnique.mockResolvedValue(
      transactionRow({ status: 'SUCCESS', paidAt: NOW, subscriptionId: 'sub-1' }),
    );
    harness.provider.refund.mockRejectedValue(new Error('gateway timeout'));
    harness.prisma.transaction.update.mockResolvedValue(
      transactionRow({ status: 'REFUNDED', paidAt: NOW, subscriptionId: 'sub-1' }),
    );
    harness.subscriptions.revoke.mockResolvedValue(SUBSCRIPTION);

    const result = await harness.service.refund(
      'txn-1',
      { reason: 'salah beli', revokeSubscription: true },
      { id: 'admin-1' },
    );

    expect(result.status).toBe('REFUNDED');
    expect(harness.logger.warn).toHaveBeenCalledWith(
      'Refund gateway gagal; dicatat untuk rekonsiliasi manual',
      expect.objectContaining({ orderId: 'WC-TEST-1' }),
    );
  });
});

describe('PaymentsService — riwayat & expiry', () => {
  it('menolak cursor yang rusak', async () => {
    const { prisma, service } = createHarness();

    await expect(
      service.listForUser('user-1', { limit: 20, cursor: 'bukan-cursor' }),
    ).rejects.toMatchObject({ code: 'COMMON_BAD_REQUEST', status: 400 });
    expect(prisma.transaction.findMany).not.toHaveBeenCalled();
  });

  it('mengembalikan cursor halaman berikutnya', async () => {
    const { prisma, service } = createHarness();
    prisma.transaction.findMany.mockResolvedValue([
      transactionRow({ id: 'txn-3', createdAt: new Date('2026-11-03T00:00:00.000Z') }),
      transactionRow({ id: 'txn-2', createdAt: new Date('2026-11-02T00:00:00.000Z') }),
      transactionRow({ id: 'txn-1', createdAt: new Date('2026-11-01T00:00:00.000Z') }),
    ]);

    const page = await service.listForUser('user-1', { limit: 2 });

    expect(page.items).toHaveLength(2);
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toEqual(expect.any(String));
  });

  it('expireOverdue dan expireStale hanya menyentuh PENDING', async () => {
    const { prisma, service } = createHarness();
    prisma.transaction.updateMany.mockResolvedValue({ count: 2 });

    await expect(service.expireOverdue(NOW)).resolves.toBe(2);
    expect(prisma.transaction.updateMany).toHaveBeenCalledWith({
      where: { status: 'PENDING', expiresAt: { lt: NOW } },
      data: { status: 'EXPIRED' },
    });

    await service.expireStale(NOW);
    expect(prisma.transaction.updateMany).toHaveBeenLastCalledWith({
      where: {
        status: 'PENDING',
        expiresAt: null,
        createdAt: { lt: new Date(NOW.getTime() - 86_400_000) },
      },
      data: { status: 'EXPIRED' },
    });
  });
});
