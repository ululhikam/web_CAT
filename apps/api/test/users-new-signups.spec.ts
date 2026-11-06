import { describe, expect, it, vi } from 'vitest';
import { UsersService } from '../src/modules/users/users.service';

/**
 * Notifikasi "pendaftar baru" untuk dashboard admin/superadmin.
 *
 * Yang penting diuji: badge lonceng memakai `count()` tersendiri sehingga
 * angkanya tidak mengecil saat daftar dipotong `limit`, dan filter
 * `registeredWithinDays` pada daftar pengguna memakai jendela waktu yang sama.
 */

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'baru@example.com',
    fullName: 'Peserta Baru',
    phone: null,
    avatarPath: null,
    status: 'ACTIVE',
    emailVerifiedAt: null,
    createdAt: new Date('2026-11-05T00:00:00.000Z'),
    createdById: null,
    role: { code: 'USER' },
    subscriptions: [],
    ...overrides,
  };
}

interface FindManyArgs {
  where: Record<string, unknown>;
  take?: number;
}

interface CountArgs {
  where: Record<string, unknown>;
}

function makeService(options: {
  rows?: unknown[];
  total?: number;
  unverified?: number;
} = {}) {
  const prisma = {
    user: {
      count: vi.fn(async ({ where }: CountArgs) =>
        'emailVerifiedAt' in where ? (options.unverified ?? 0) : (options.total ?? 0),
      ),
      findMany: vi.fn(async (_args: FindManyArgs) => options.rows ?? []),
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

function firstFindManyArgs(prisma: ReturnType<typeof makeService>['prisma']): FindManyArgs {
  return (prisma.user.findMany.mock.calls as unknown as Array<[FindManyArgs]>)[0][0];
}

function countWhere(
  prisma: ReturnType<typeof makeService>['prisma'],
  call: number,
): Record<string, unknown> {
  return (prisma.user.count.mock.calls as unknown as Array<[CountArgs]>)[call][0].where;
}

describe('UsersService.newSignups', () => {
  it('memisahkan total dari daftar yang dipotong limit', async () => {
    const { service } = makeService({ rows: [userRow()], total: 12, unverified: 4 });

    const result = await service.newSignups({ days: 7, limit: 5 });

    expect(result).toMatchObject({ days: 7, total: 12, unverified: 4 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ id: 'user-1', email: 'baru@example.com' });
  });

  it('memakai jendela waktu bergerak dan mengabaikan akun terhapus', async () => {
    const { service, prisma } = makeService();
    const before = Date.now();

    await service.newSignups({ days: 7, limit: 5 });

    const where = firstFindManyArgs(prisma).where as {
      deletedAt: unknown;
      createdAt: { gte: Date };
    };
    expect(where.deletedAt).toBeNull();

    const windowMs = 7 * 24 * 3600 * 1000;
    const since = where.createdAt.gte.getTime();
    expect(since).toBeGreaterThanOrEqual(before - windowMs - 1000);
    expect(since).toBeLessThanOrEqual(Date.now() - windowMs + 1000);
  });

  it('menghitung yang belum verifikasi dengan filter tambahan', async () => {
    const { service, prisma } = makeService({ total: 3, unverified: 2 });

    const result = await service.newSignups({ days: 30, limit: 5 });

    const unverifiedWhere = countWhere(prisma, 1);
    expect(unverifiedWhere.emailVerifiedAt).toBeNull();
    expect(result.total).toBe(3);
    expect(result.unverified).toBe(2);
  });
});

describe('UsersService.list dengan registeredWithinDays', () => {
  it('membatasi hasil ke akun yang baru dibuat', async () => {
    const { service, prisma } = makeService({ rows: [userRow(), userRow({ id: 'user-2' })] });

    const result = await service.list({ limit: 1, registeredWithinDays: 7 });

    const where = firstFindManyArgs(prisma).where as {
      createdAt?: { gte: Date };
    };
    expect(where.createdAt?.gte).toBeInstanceOf(Date);
    // `limit + 1` diambil untuk mengetahui apakah masih ada halaman berikutnya.
    expect(firstFindManyArgs(prisma).take).toBe(2);
    expect(result.items).toHaveLength(1);
    expect(result.hasMore).toBe(true);
  });

  it('tidak menambahkan filter waktu bila tidak diminta', async () => {
    const { service, prisma } = makeService();

    await service.list({ limit: 10 });

    const where = firstFindManyArgs(prisma).where as { createdAt?: unknown };
    expect(where.createdAt).toBeUndefined();
  });
});
