import { describe, expect, it, vi } from 'vitest';
import { UsersService } from '../src/modules/users/users.service';

/**
 * F5-03 — detail peserta admin.
 *
 * Yang diuji di sini adalah keputusan yang tidak terlihat di UI: bagaimana
 * agregat dihitung, apa arti "langganan aktif", dan kapan sebuah angka harus
 * `null` (belum ada data) alih-alih `0` (nol sungguhan).
 */

const NOW = new Date('2026-11-05T10:00:00.000Z');

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'peserta@example.com',
    fullName: 'Peserta Uji',
    phone: '628123456789',
    avatarPath: null,
    status: 'ACTIVE',
    emailVerifiedAt: NOW,
    createdAt: NOW,
    createdById: null,
    role: { code: 'USER' },
    subscriptions: [],
    ...overrides,
  };
}

function subscriptionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-1',
    userId: 'user-1',
    planId: 'plan-1',
    source: 'PURCHASE',
    status: 'ACTIVE',
    startsAt: new Date('2026-11-01T00:00:00.000Z'),
    endsAt: new Date('2026-11-30T00:00:00.000Z'),
    revokedAt: null,
    revokeReason: null,
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
    plan: { code: 'MONTHLY', name: 'Paket Bulanan' },
    ...overrides,
  };
}

function examRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'session-1',
    examDate: new Date('2026-11-03T00:00:00.000Z'),
    status: 'COMPLETED',
    startedAt: new Date('2026-11-03T01:00:00.000Z'),
    finishedAt: new Date('2026-11-03T03:00:00.000Z'),
    totalScore: 612.5,
    passed: true,
    eliminatedSubtestCode: null,
    createdAt: new Date('2026-11-03T01:00:00.000Z'),
    ...overrides,
  };
}

function transactionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'trx-1',
    orderId: 'WC-2026-001',
    status: 'SUCCESS',
    amountIdr: 149000,
    paidAt: new Date('2026-11-01T02:00:00.000Z'),
    createdAt: new Date('2026-11-01T01:00:00.000Z'),
    plan: { code: 'MONTHLY', name: 'Paket Bulanan' },
    ...overrides,
  };
}

interface HarnessOptions {
  user?: unknown;
  subscriptions?: unknown[];
  examAggregate?: Record<string, unknown>;
  examTotal?: number;
  passedCount?: number;
  lastExam?: unknown;
  exams?: unknown[];
  transactionTotal?: number;
  paidAggregate?: Record<string, unknown>;
  lastPaid?: unknown;
  transactions?: unknown[];
}

function createHarness(options: HarnessOptions = {}) {
  const hasUser = 'user' in options;
  const prisma = {
    user: { findFirst: vi.fn(async () => (hasUser ? options.user : userRow())) },
    subscription: { findMany: vi.fn(async () => options.subscriptions ?? []) },
    examSession: {
      count: vi.fn(async ({ where }: { where: Record<string, unknown> }) =>
        'passed' in where ? (options.passedCount ?? 0) : (options.examTotal ?? 0),
      ),
      aggregate: vi.fn(
        async () =>
          options.examAggregate ?? {
            _count: { _all: 0 },
            _avg: { totalScore: null },
            _max: { totalScore: null },
          },
      ),
      findFirst: vi.fn(async () => options.lastExam ?? null),
      findMany: vi.fn(async () => options.exams ?? []),
    },
    transaction: {
      count: vi.fn(async () => options.transactionTotal ?? 0),
      aggregate: vi.fn(
        async () =>
          options.paidAggregate ?? { _count: { _all: 0 }, _sum: { amountIdr: null } },
      ),
      findFirst: vi.fn(async () => options.lastPaid ?? null),
      findMany: vi.fn(async () => options.transactions ?? []),
    },
  };

  const service = new UsersService(
    prisma as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  return { service, prisma };
}

describe('UsersService.overview — profil', () => {
  it('mengembalikan USER_NOT_FOUND untuk id yang tidak ada / sudah dihapus', async () => {
    const { service } = createHarness({ user: null });

    await expect(service.overview('user-x')).rejects.toMatchObject({
      response: { code: 'USER_NOT_FOUND' },
    });
  });

  it('memakai proyeksi yang sama dengan daftar user', async () => {
    const { service } = createHarness();
    const result = await service.overview('user-1');

    expect(result.profile).toMatchObject({
      id: 'user-1',
      email: 'peserta@example.com',
      role: 'USER',
      emailVerified: true,
    });
  });

  it('menyembunyikan akun berstatus DELETED sebagai SUSPENDED', async () => {
    const { service } = createHarness({ user: userRow({ status: 'DELETED' }) });
    const result = await service.overview('user-1');
    expect(result.profile.status).toBe('SUSPENDED');
  });
});

describe('UsersService.overview — langganan', () => {
  it('menandai langganan ACTIVE yang belum berakhir sebagai langganan aktif', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const { service } = createHarness({ subscriptions: [subscriptionRow()] });

    const result = await service.overview('user-1');

    expect(result.subscription).toMatchObject({ id: 'sub-1', planCode: 'MONTHLY' });
    expect(result.subscription?.remainingDays).toBe(25);
    vi.useRealTimers();
  });

  it('TIDAK menandai ACTIVE yang sudah lewat tanggal berakhir sebagai aktif', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const { service } = createHarness({
      subscriptions: [
        subscriptionRow({ endsAt: new Date('2026-11-01T00:00:00.000Z') }),
      ],
    });

    const result = await service.overview('user-1');

    expect(result.subscription).toBeNull();
    // Barisnya tetap ada di riwayat supaya admin bisa melihat jejaknya.
    expect(result.subscriptionHistory).toHaveLength(1);
    vi.useRealTimers();
  });

  it('mengosongkan langganan aktif bila hanya ada langganan dicabut', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const { service } = createHarness({
      subscriptions: [
        subscriptionRow({
          status: 'REVOKED',
          revokedAt: NOW,
          revokeReason: 'Salah transfer',
        }),
      ],
    });

    const result = await service.overview('user-1');

    expect(result.subscription).toBeNull();
    expect(result.subscriptionHistory[0]).toMatchObject({
      status: 'REVOKED',
      revokeReason: 'Salah transfer',
    });
    vi.useRealTimers();
  });
});

describe('UsersService.overview — ujian', () => {
  it('membedakan "belum ada ujian" (null) dari "skor nol" (0)', async () => {
    const { service } = createHarness();
    const result = await service.overview('user-1');

    expect(result.exams).toMatchObject({
      total: 0,
      completed: 0,
      passed: 0,
      averageScore: null,
      bestScore: null,
      lastExamAt: null,
      recent: [],
    });
  });

  it('memakai agregat database untuk rata-rata & skor terbaik', async () => {
    const { service } = createHarness({
      examTotal: 3,
      passedCount: 1,
      examAggregate: {
        _count: { _all: 2 },
        _avg: { totalScore: 612.5 },
        _max: { totalScore: 745 },
      },
      lastExam: {
        createdAt: NOW,
        startedAt: new Date('2026-11-03T01:00:00.000Z'),
        finishedAt: new Date('2026-11-03T03:00:00.000Z'),
      },
      exams: [examRow()],
    });

    const result = await service.overview('user-1');

    expect(result.exams.total).toBe(3);
    expect(result.exams.completed).toBe(2);
    expect(result.exams.passed).toBe(1);
    expect(result.exams.averageScore).toBe(612.5);
    expect(result.exams.bestScore).toBe(745);
    // Waktu ujian terakhir memakai `finishedAt` bila ada.
    expect(result.exams.lastExamAt).toBe('2026-11-03T03:00:00.000Z');
    expect(result.exams.recent[0]).toMatchObject({ id: 'session-1', totalScore: 612.5 });
  });

  it('memakai `startedAt` bila sesi belum selesai, lalu `createdAt` sebagai cadangan', async () => {
    const { service } = createHarness({
      lastExam: {
        createdAt: NOW,
        startedAt: new Date('2026-11-04T01:00:00.000Z'),
        finishedAt: null,
      },
    });

    const result = await service.overview('user-1');
    expect(result.exams.lastExamAt).toBe('2026-11-04T01:00:00.000Z');
  });

  it('mengabaikan sesi yang di-void dari hitungan', async () => {
    const { service, prisma } = createHarness();
    await service.overview('user-1');

    for (const call of prisma.examSession.count.mock.calls) {
      const voidedAt = call[0].where.voidedAt;
      // Satu-satunya pengecualian disengaja: hitungan sesi yang dibatalkan admin
      // untuk kartu kuota harian.
      if (voidedAt && typeof voidedAt === 'object') continue;
      expect(voidedAt).toBeNull();
    }
    expect(prisma.examSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ voidedAt: null }) }),
    );
  });

  it('melaporkan pemakaian kuota harian', async () => {
    const { service, prisma } = createHarness();
    prisma.examSession.count.mockImplementation(
      async ({ where }: { where: Record<string, unknown> }) => {
        if (where.voidedAt && typeof where.voidedAt === 'object') return 0;
        return 1;
      },
    );

    const result = await service.overview('user-1');

    expect(result.quota).toMatchObject({
      dailyLimit: 3,
      usedToday: 1,
      voidedToday: 0,
      remainingToday: 2,
    });
    expect(result.quota.examDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('UsersService.overview — pembayaran', () => {
  it('menghitung total transaksi terpisah dari yang berhasil', async () => {
    const { service } = createHarness({
      transactionTotal: 3,
      paidAggregate: { _count: { _all: 2 }, _sum: { amountIdr: 298000 } },
      lastPaid: { paidAt: new Date('2026-11-01T02:00:00.000Z') },
      transactions: [transactionRow()],
    });

    const result = await service.overview('user-1');

    expect(result.payments).toMatchObject({
      totalTransactions: 3,
      paidTransactions: 2,
      totalPaidIdr: 298000,
      lastPaidAt: '2026-11-01T02:00:00.000Z',
    });
  });

  it('memakai 0 rupiah bila belum ada pembayaran berhasil', async () => {
    const { service } = createHarness();
    const result = await service.overview('user-1');
    expect(result.payments.totalPaidIdr).toBe(0);
    expect(result.payments.lastPaidAt).toBeNull();
  });

  it('hanya menjumlahkan transaksi SUCCESS', async () => {
    const { service, prisma } = createHarness();
    await service.overview('user-1');

    expect(prisma.transaction.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1', status: 'SUCCESS' } }),
    );
  });
});
