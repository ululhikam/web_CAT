import { afterEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from '../src/modules/users/users.service';

function makeService(sessions: Array<{ id: string }>, userExists = true) {
  const findFirst = vi.fn(async () => (userExists ? { id: 'user-1' } : null));
  const findMany = vi.fn(async () => sessions);
  const updateMany = vi.fn(async () => ({ count: sessions.length }));
  const auditRecord = vi.fn(async () => undefined);

  const prisma = {
    user: { findFirst },
    examSession: { findMany, updateMany },
  };

  const service = new UsersService(
    prisma as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { record: auditRecord } as never,
    {} as never,
  );

  return { service, findMany, updateMany, auditRecord };
}

const actor = { id: 'admin-1', role: 'ADMIN' as const, ip: '127.0.0.1', userAgent: 'vitest' };

describe('UsersService.resetQuota', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('meng-void sesi hari itu dan mencatat audit dengan alasan', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T17:30:00.000Z')); // 2 Jan 00:30 WIB

    const { service, findMany, updateMany, auditRecord } = makeService([{ id: 's-1' }, { id: 's-2' }]);

    const result = await service.resetQuota('user-1', 'Peserta gagal koneksi internet', actor);

    expect(findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        examDate: new Date('2026-01-02T00:00:00.000Z'),
        voidedAt: null,
      },
      select: { id: true },
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['s-1', 's-2'] } },
      data: { status: 'VOIDED', voidedAt: expect.any(Date) },
    });
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-1',
        action: 'user.quota_reset',
        metadata: expect.objectContaining({
          reason: 'Peserta gagal koneksi internet',
          examDate: '2026-01-02',
          voidedSessions: 2,
        }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({ userId: 'user-1', examDate: '2026-01-02', voidedSessions: 2 }),
    );
  });

  it('tidak memanggil updateMany bila tidak ada sesi hari ini', async () => {
    const { service, updateMany } = makeService([]);

    const result = await service.resetQuota('user-1', 'Peserta belum pernah mulai ujian', actor);

    expect(updateMany).not.toHaveBeenCalled();
    expect(result.voidedSessions).toBe(0);
  });

  it('menolak user yang tidak ada', async () => {
    const { service } = makeService([], false);

    await expect(
      service.resetQuota('user-x', 'Peserta tidak ditemukan sama sekali', actor),
    ).rejects.toMatchObject({ response: { code: 'USER_NOT_FOUND' } });
  });
});
