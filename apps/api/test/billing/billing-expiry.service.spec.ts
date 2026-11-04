import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MailPort } from '@webcat/contracts';
import type { LoggerService } from '../../src/core/logger/logger.service';
import type { PrismaService } from '../../src/core/prisma/prisma.service';
import { BillingExpiryService } from '../../src/modules/billing/billing-expiry.service';

const DAY_MS = 86_400_000;
const NOW = new Date('2026-11-05T00:00:00.000Z');

function createHarness() {
  const prisma = {
    subscription: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    subscriptionEvent: { create: vi.fn() },
    outboxEvent: { create: vi.fn() },
  };
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
  const mail = { send: vi.fn() };

  const service = new BillingExpiryService(
    prisma as unknown as PrismaService,
    logger as unknown as LoggerService,
    mail as unknown as MailPort,
  );

  return { prisma, logger, mail, service };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

describe('BillingExpiryService — aktivasi tertunda', () => {
  it('mengaktifkan PENDING yang sudah mencapai startsAt dan belum berakhir', async () => {
    const { prisma, service } = createHarness();
    prisma.subscription.findMany.mockResolvedValue([
      {
        id: 'sub-1',
        userId: 'user-1',
        planId: 'plan-1',
        startsAt: new Date('2026-11-01T00:00:00.000Z'),
        endsAt: new Date('2026-12-01T00:00:00.000Z'),
      },
      {
        id: 'sub-2',
        userId: 'user-2',
        planId: null,
        startsAt: new Date('2026-11-01T00:00:00.000Z'),
        endsAt: new Date('2026-12-01T00:00:00.000Z'),
      },
    ]);
    prisma.subscription.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    const activated = await service.activateDueSubscriptions(NOW);

    expect(activated).toBe(1);
    expect(prisma.subscription.findMany).toHaveBeenCalledWith({
      where: {
        status: 'PENDING',
        startsAt: { lte: NOW },
        endsAt: { gt: NOW },
      },
      select: expect.any(Object),
      take: 500,
    });
    expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
      where: { id: 'sub-1', status: 'PENDING' },
      data: { status: 'ACTIVE' },
    });
    expect(prisma.subscriptionEvent.create).toHaveBeenCalledTimes(1);
    expect(prisma.subscriptionEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subscriptionId: 'sub-1',
        type: 'ACTIVATED',
        note: 'Masa aktif dimulai',
      }),
    });
    expect(prisma.outboxEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ topic: 'subscription.activated' }),
    });
  });
});

describe('BillingExpiryService — kedaluwarsa', () => {
  it('menandai ACTIVE/PENDING yang lewat endsAt sebagai EXPIRED + event + outbox', async () => {
    const { prisma, service } = createHarness();
    prisma.subscription.findMany.mockResolvedValue([
      {
        id: 'sub-1',
        userId: 'user-1',
        planId: 'plan-1',
        endsAt: new Date('2026-11-04T00:00:00.000Z'),
      },
    ]);
    prisma.subscription.updateMany.mockResolvedValue({ count: 1 });

    const expired = await service.expireDueSubscriptions(NOW);

    expect(expired).toBe(1);
    expect(prisma.subscription.findMany).toHaveBeenCalledWith({
      where: { status: { in: ['ACTIVE', 'PENDING'] }, endsAt: { lte: NOW } },
      select: expect.any(Object),
      take: 500,
    });
    expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
      where: { id: 'sub-1', status: { in: ['ACTIVE', 'PENDING'] } },
      data: { status: 'EXPIRED' },
    });
    expect(prisma.subscriptionEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'EXPIRED', note: 'Masa aktif berakhir' }),
    });
    expect(prisma.outboxEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ topic: 'subscription.expired' }),
    });
  });

  it('tidak menulis event bila baris sudah diubah proses lain', async () => {
    const { prisma, service } = createHarness();
    prisma.subscription.findMany.mockResolvedValue([
      {
        id: 'sub-1',
        userId: 'user-1',
        planId: null,
        endsAt: new Date('2026-11-04T00:00:00.000Z'),
      },
    ]);
    prisma.subscription.updateMany.mockResolvedValue({ count: 0 });

    const expired = await service.expireDueSubscriptions(NOW);

    expect(expired).toBe(0);
    expect(prisma.subscriptionEvent.create).not.toHaveBeenCalled();
    expect(prisma.outboxEvent.create).not.toHaveBeenCalled();
  });
});

describe('BillingExpiryService — pengingat', () => {
  it('mengirim pengingat dan menyimpan lastReminderAt hanya bila email sukses', async () => {
    const { prisma, mail, logger, service } = createHarness();
    prisma.subscription.findMany.mockResolvedValue([
      {
        id: 'sub-1',
        endsAt: new Date(NOW.getTime() + 2 * DAY_MS),
        user: { email: 'satu@example.com', fullName: 'User Satu' },
        plan: { name: 'Paket Bulanan' },
      },
      {
        id: 'sub-2',
        endsAt: new Date(NOW.getTime() + 3 * DAY_MS),
        user: { email: 'dua@example.com', fullName: 'User Dua' },
        plan: null,
      },
    ]);
    mail.send.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('smtp down'));
    prisma.subscription.update.mockResolvedValue({});

    const result = await service.sendExpiryReminders(NOW);

    expect(result).toEqual({ sent: 1, skipped: 1 });
    expect(mail.send).toHaveBeenCalledTimes(2);
    expect(mail.send.mock.calls[0]?.[0]).toMatchObject({
      to: 'satu@example.com',
      subject: expect.stringContaining('Paket Bulanan'),
    });
    expect(prisma.subscription.update).toHaveBeenCalledTimes(1);
    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { lastReminderAt: NOW },
    });
    expect(logger.warn).toHaveBeenCalledWith(
      'Gagal mengirim pengingat masa aktif',
      expect.objectContaining({ subscriptionId: 'sub-2', message: 'smtp down' }),
    );
  });

  it('mengembalikan nol bila tidak ada kandidat', async () => {
    const { prisma, mail, service } = createHarness();
    prisma.subscription.findMany.mockResolvedValue([]);

    await expect(service.sendExpiryReminders(NOW)).resolves.toEqual({ sent: 0, skipped: 0 });
    expect(mail.send).not.toHaveBeenCalled();
  });
});
