import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../src/modules/auth/auth.service';

function makeService() {
  const findMany = vi.fn(async () => [
    {
      id: 'session-1',
      ip: '127.0.0.1',
      userAgent: 'Chrome',
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
      lastSeenAt: new Date('2026-01-02T10:00:00.000Z'),
      expiresAt: new Date('2026-02-01T10:00:00.000Z'),
    },
    {
      id: 'session-2',
      ip: null,
      userAgent: null,
      createdAt: new Date('2026-01-01T09:00:00.000Z'),
      lastSeenAt: new Date('2026-01-01T09:00:00.000Z'),
      expiresAt: new Date('2026-02-01T09:00:00.000Z'),
    },
  ]);
  const updateMany = vi.fn(async () => ({ count: 1 }));
  const auditRecord = vi.fn(async () => undefined);

  const prisma = { session: { findMany, updateMany } };
  const service = new AuthService(
    prisma as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { record: auditRecord } as never,
  );

  return { service, findMany, updateMany, auditRecord };
}

describe('AuthService device management', () => {
  it('hanya membaca sesi aktif milik user dan menandai sesi saat ini', async () => {
    const { service, findMany } = makeService();

    const sessions = await service.listSessions('user-1', 'session-1');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          revokedAt: null,
          expiresAt: expect.objectContaining({ gt: expect.any(Date) }),
        }),
      }),
    );
    expect(sessions).toHaveLength(2);
    expect(sessions[0]).toEqual(
      expect.objectContaining({
        id: 'session-1',
        current: true,
        createdAt: '2026-01-01T10:00:00.000Z',
      }),
    );
    expect(sessions[1]?.current).toBe(false);
  });

  it('mencabut sesi dengan filter userId agar tidak bisa lintas pengguna', async () => {
    const { service, updateMany, auditRecord } = makeService();

    const result = await service.revokeSession('user-1', 'session-2');

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'session-2', userId: 'user-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'user-1',
        action: 'auth.session_revoked',
        entityId: 'session-2',
      }),
    );
    expect(result.message).toMatch(/dicabut/i);
  });

  it('menolak pencabutan sesi yang bukan milik user', async () => {
    const { service, updateMany } = makeService();
    updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(service.revokeSession('user-1', 'session-milik-user-lain')).rejects.toMatchObject({
      response: { code: 'AUTH_TOKEN_INVALID' },
    });
  });
});
