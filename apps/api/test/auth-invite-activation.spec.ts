import { describe, expect, it, vi } from 'vitest';
import { ERROR_CODES, type AuthUser } from '@webcat/contracts';
import { AuthService, type AuthTokens } from '../src/modules/auth/auth.service';

function user(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'peserta@example.com',
    fullName: 'Peserta Baru',
    phone: null,
    avatarPath: null,
    passwordHash: null,
    status: 'PENDING_INVITE',
    emailVerifiedAt: null,
    mustChangePassword: false,
    tokenVersion: 0,
    deletedAt: null,
    role: { id: 'role-1', code: 'USER', permissions: [] },
    ...overrides,
  };
}

function authUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    email: 'peserta@example.com',
    fullName: 'Peserta Baru',
    phone: null,
    role: 'USER',
    permissions: [],
    emailVerified: true,
    mustChangePassword: false,
    status: 'ACTIVE',
    ...overrides,
  };
}

function makeHarness(options: { invite?: unknown; updatedUser?: unknown } = {}) {
  const invite =
    options.invite === undefined
      ? {
          id: 'invite-1',
          userId: 'user-1',
          purpose: 'INVITE',
          tokenHash: 'hash',
          usedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          user: user(),
        }
      : options.invite;

  const updatedUser = options.updatedUser ?? user({ status: 'ACTIVE', emailVerifiedAt: new Date() });
  const findFirst = vi.fn(async () => invite);
  const updateToken = vi.fn(async () => ({}));
  const updateUser = vi.fn(async () => updatedUser);
  const tx = {
    verificationToken: { update: updateToken },
    user: { update: updateUser },
  };
  const transaction = vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) =>
    callback(tx),
  );
  const hash = vi.fn(async () => 'new-password-hash');
  const auditRecord = vi.fn(async () => undefined);

  const service = new AuthService(
    {
      verificationToken: { findFirst },
      $transaction: transaction,
    } as never,
    { value: { APP_URL: 'https://cat.plays.web.id' } } as never,
    { signAccessToken: vi.fn() } as never,
    { hash, verify: vi.fn() } as never,
    { error: vi.fn() } as never,
    {} as never,
    { send: vi.fn() } as never,
    { record: auditRecord } as never,
  );

  return {
    service,
    findFirst,
    updateToken,
    updateUser,
    hash,
    auditRecord,
    updatedUser,
  };
}

function internals(service: AuthService) {
  return service as unknown as {
    assertSessionPolicy: (userId: string) => Promise<'replace' | 'reject'>;
    issueSession: (...args: unknown[]) => Promise<AuthTokens>;
  };
}

describe('AuthService.activateInvite', () => {
  it('mengaktifkan akun dan langsung membuat sesi login', async () => {
    const harness = makeHarness();
    const tokens: AuthTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: authUser(),
    };
    const policy = vi
      .spyOn(internals(harness.service), 'assertSessionPolicy')
      .mockResolvedValue('replace');
    const issueSession = vi
      .spyOn(internals(harness.service), 'issueSession')
      .mockResolvedValue(tokens);

    const meta = { ip: '127.0.0.1', userAgent: 'vitest' };
    const result = await harness.service.activateInvite(
      { token: 'a'.repeat(32), password: 'PesertaBaru123' },
      meta,
    );

    expect(harness.hash).toHaveBeenCalledWith('PesertaBaru123');
    expect(harness.updateToken).toHaveBeenCalledWith({
      where: { id: 'invite-1' },
      data: { usedAt: expect.any(Date) },
    });
    expect(harness.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          passwordHash: 'new-password-hash',
          status: 'ACTIVE',
          emailVerifiedAt: expect.any(Date),
          mustChangePassword: false,
          lastLoginAt: expect.any(Date),
        }),
      }),
    );
    expect(policy).toHaveBeenCalledWith('user-1');
    expect(issueSession).toHaveBeenCalledWith(harness.updatedUser, meta, undefined, 'replace');
    expect(harness.auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'user-1',
        action: 'auth.invite_activated',
        ip: '127.0.0.1',
        userAgent: 'vitest',
      }),
    );
    expect(result).toBe(tokens);
  });

  it('menolak token yang tidak valid tanpa menyentuh password atau sesi', async () => {
    const harness = makeHarness({ invite: null });
    const issueSession = vi.spyOn(internals(harness.service), 'issueSession');

    await expect(
      harness.service.activateInvite({ token: 'x'.repeat(32), password: 'PesertaBaru123' }),
    ).rejects.toMatchObject({
      response: { code: ERROR_CODES.USER_INVITE_EXPIRED },
    });

    expect(harness.hash).not.toHaveBeenCalled();
    expect(harness.updateUser).not.toHaveBeenCalled();
    expect(issueSession).not.toHaveBeenCalled();
  });

  it('tidak mengaktifkan akun yang sudah disuspend admin', async () => {
    const harness = makeHarness({
      invite: {
        id: 'invite-1',
        userId: 'user-1',
        purpose: 'INVITE',
        tokenHash: 'hash',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: user({ status: 'SUSPENDED' }),
      },
    });

    await expect(
      harness.service.activateInvite({ token: 'x'.repeat(32), password: 'PesertaBaru123' }),
    ).rejects.toMatchObject({
      response: { code: ERROR_CODES.USER_SUSPENDED },
    });

    expect(harness.updateUser).not.toHaveBeenCalled();
  });
});
