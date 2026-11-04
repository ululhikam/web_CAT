import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../src/core/prisma/prisma.service';
import { BillingAccessPolicy } from '../../src/modules/entitlements/billing-access-policy';

const DAY_MS = 86_400_000;
const NOW = new Date('2026-11-05T00:00:00.000Z');

function createHarness() {
  const prisma = {
    user: { findFirst: vi.fn() },
    subscription: { findFirst: vi.fn() },
    examSession: { findFirst: vi.fn().mockResolvedValue(null) },
  };
  const policy = new BillingAccessPolicy(prisma as unknown as PrismaService);
  return { prisma, policy };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('BillingAccessPolicy — check', () => {
  it('mengizinkan langganan ACTIVE yang belum berakhir', async () => {
    const { prisma, policy } = createHarness();
    prisma.user.findFirst.mockResolvedValue({ status: 'ACTIVE' });
    prisma.subscription.findFirst.mockResolvedValue({
      endsAt: new Date(NOW.getTime() + 10 * DAY_MS),
    });

    const decision = await policy.check('user-1');

    expect(decision).toMatchObject({
      allowed: true,
      code: 'OK',
      remainingDays: 10,
    });
    expect(decision.endsAt?.toISOString()).toBe(
      new Date(NOW.getTime() + 10 * DAY_MS).toISOString(),
    );
  });

  it('menolak akun yang ditangguhkan tanpa membaca langganan', async () => {
    const { prisma, policy } = createHarness();
    prisma.user.findFirst.mockResolvedValue({ status: 'SUSPENDED' });

    const decision = await policy.check('user-1');

    expect(decision).toMatchObject({ allowed: false, code: 'USER_SUSPENDED' });
    expect(prisma.subscription.findFirst).not.toHaveBeenCalled();
  });

  it('membedakan langganan EXPIRED dari yang belum pernah ada', async () => {
    const { prisma, policy } = createHarness();
    prisma.user.findFirst.mockResolvedValue({ status: 'ACTIVE' });
    prisma.subscription.findFirst
      .mockResolvedValueOnce(null) // tidak ada yang aktif
      .mockResolvedValueOnce({ endsAt: new Date('2026-10-01T00:00:00.000Z') });

    const expired = await policy.check('user-1');
    expect(expired).toMatchObject({ allowed: false, code: 'SUBSCRIPTION_EXPIRED' });
    expect(expired.endsAt?.toISOString()).toBe('2026-10-01T00:00:00.000Z');

    prisma.subscription.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    const missing = await policy.check('user-1');
    expect(missing).toMatchObject({ allowed: false, code: 'SUBSCRIPTION_REQUIRED' });
  });

  it('menolak user yang tidak ditemukan', async () => {
    const { prisma, policy } = createHarness();
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(policy.check('user-x')).resolves.toMatchObject({
      allowed: false,
      code: 'SUBSCRIPTION_REQUIRED',
    });
  });
});

describe('BillingAccessPolicy — assert', () => {
  it('lolos bila langganan aktif', async () => {
    const { prisma, policy } = createHarness();
    prisma.user.findFirst.mockResolvedValue({ status: 'ACTIVE' });
    prisma.subscription.findFirst.mockResolvedValue({
      endsAt: new Date(NOW.getTime() + DAY_MS),
    });

    await expect(policy.assertCanStartExam('user-1')).resolves.toBeUndefined();
    await expect(policy.assertCanContinue('user-1')).resolves.toBeUndefined();
  });

  it('melempar 402 BILLING_SUBSCRIPTION_REQUIRED dengan kode akses', async () => {
    const { prisma, policy } = createHarness();
    prisma.user.findFirst.mockResolvedValue({ status: 'ACTIVE' });
    prisma.subscription.findFirst.mockResolvedValue(null);

    await expect(policy.assertCanStartExam('user-1')).rejects.toMatchObject({
      code: 'BILLING_SUBSCRIPTION_REQUIRED',
      status: 402,
      details: {
        accessCode: 'SUBSCRIPTION_REQUIRED',
        endsAt: null,
        remainingDays: 0,
      },
    });
  });

  it('melempar 403 USER_SUSPENDED untuk akun ditangguhkan', async () => {
    const { prisma, policy } = createHarness();
    prisma.user.findFirst.mockResolvedValue({ status: 'SUSPENDED' });

    await expect(policy.assertCanContinue('user-1')).rejects.toMatchObject({
      code: 'USER_SUSPENDED',
      status: 403,
    });
  });

  it('menolak sesi kedua pada hari yang sama tetapi mengizinkan lanjut', async () => {
    const { prisma, policy } = createHarness();
    prisma.user.findFirst.mockResolvedValue({ status: 'ACTIVE' });
    prisma.subscription.findFirst.mockResolvedValue({
      endsAt: new Date(NOW.getTime() + DAY_MS),
    });
    prisma.examSession.findFirst.mockResolvedValue({ id: 'session-1' });

    await expect(policy.assertCanStartExam('user-1')).rejects.toMatchObject({
      code: 'EXAM_SESSION_ALREADY_TODAY',
      status: 409,
      details: { sessionId: 'session-1' },
    });
    expect(prisma.examSession.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        examDate: new Date('2026-11-05T00:00:00.000Z'),
        voidedAt: null,
      },
      select: { id: true },
    });

    // Melanjutkan sesi yang sudah berjalan tidak terkena batas harian.
    await expect(policy.assertCanContinue('user-1')).resolves.toBeUndefined();
  });
});
