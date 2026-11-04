import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../src/modules/auth/auth.service';

function makeUser() {
  return {
    id: 'user-1',
    email: 'user@example.com',
    fullName: 'User Uji',
    phone: null,
    passwordHash: 'hash',
    status: 'ACTIVE',
    emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
    mustChangePassword: false,
    tokenVersion: 0,
    deletedAt: null,
    role: { code: 'USER', permissions: [] },
  };
}

function makeService(policy: 'replace' | 'reject', activeSession = false, userOverride = {}) {
  const user = { ...makeUser(), ...userOverride };
  const create = vi.fn(async () => ({ id: 'session-new' }));
  const updateMany = vi.fn(async () => ({ count: 1 }));
  const findFirst = vi.fn(async () => (activeSession ? { id: 'session-old' } : null));

  const prisma = {
    user: {
      findFirst: vi.fn(async () => user),
      update: vi.fn(async () => user),
    },
    session: { create, updateMany, findFirst },
    $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(prisma)),
  };

  const settings = { value: vi.fn(async () => policy) };
  const jwt = { signAccessToken: vi.fn(() => 'access-token') };
  const passwords = { verify: vi.fn(async () => true) };
  const audit = { record: vi.fn(async () => undefined) };

  const service = new AuthService(
    prisma as never,
    {} as never,
    jwt as never,
    passwords as never,
    {} as never,
    settings as never,
    {} as never,
    audit as never,
  );

  return { service, prisma, create, updateMany, findFirst, audit };
}

const meta = { ip: '127.0.0.1', userAgent: 'vitest' };
const input = { email: 'user@example.com', password: 'Rahasia12345' };

describe('kebijakan sesi tunggal', () => {
  it('policy replace mencabut sesi lama sebelum membuat sesi baru', async () => {
    const { service, updateMany, create } = makeService('replace', true);

    const result = await service.login(input, meta);

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1', revokedAt: null }),
      }),
    );
    expect(create).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe('access-token');
  });

  it('policy reject menolak login saat masih ada sesi aktif', async () => {
    const { service, create } = makeService('reject', true);

    await expect(service.login(input, meta)).rejects.toMatchObject({
      response: { code: 'AUTH_SESSION_ACTIVE_EXISTS' },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('policy reject mengizinkan login bila tidak ada sesi aktif', async () => {
    const { service, create } = makeService('reject', false);

    const result = await service.login(input, meta);
    expect(result.accessToken).toBe('access-token');
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('mencoba ulang sekali saat request paralel memicu unique violation', async () => {
    const { service, create, updateMany } = makeService('replace', false);

    create
      .mockRejectedValueOnce(Object.assign(new Error('unique'), { code: 'P2002' }))
      .mockResolvedValueOnce({ id: 'session-new' });

    const result = await service.login(input, meta);

    expect(create).toHaveBeenCalledTimes(2);
    // Percobaan ulang wajib mencabut sesi pemenang lebih dulu.
    expect(updateMany).toHaveBeenCalled();
    expect(result.accessToken).toBe('access-token');
  });

  it('menolak login Google bila akun sudah tertaut ke sub Google lain', async () => {
    const { service } = makeService('replace', false, { googleSub: 'google-lama' });

    await expect(
      service.loginWithGoogle(
        { sub: 'google-baru', email: 'user@example.com', emailVerified: true } as never,
        meta,
      ),
    ).rejects.toMatchObject({ response: { code: 'AUTH_OAUTH_FAILED' } });
  });
});
