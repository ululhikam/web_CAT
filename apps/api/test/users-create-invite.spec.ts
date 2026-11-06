import { Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { AdminCreateUserInput } from '@webcat/contracts';
import { UsersService } from '../src/modules/users/users.service';

function userRow() {
  return {
    id: 'user-1',
    email: 'peserta@example.com',
    fullName: 'Peserta Baru',
    phone: null,
    avatarPath: null,
    status: 'PENDING_INVITE',
    emailVerifiedAt: null,
    createdAt: new Date('2026-11-06T00:00:00.000Z'),
    createdById: 'admin-1',
    role: { code: 'USER' },
    subscriptions: [],
  };
}

function makeHarness(options: { sendError?: Error } = {}) {
  const createInvite = vi.fn(async () => ({
    token: 'invite-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
  }));
  const send = options.sendError
    ? vi.fn(async () => {
        throw options.sendError;
      })
    : vi.fn(async () => undefined);
  const auditRecord = vi.fn(async () => undefined);

  const prisma = {
    user: {
      findUnique: vi.fn(async () => null),
      create: vi.fn(async () => userRow()),
    },
    role: {
      findUnique: vi.fn(async () => ({ id: 'role-1', code: 'USER' })),
    },
  };

  const service = new UsersService(
    prisma as never,
    { value: { APP_URL: 'https://cat.plays.web.id/' } } as never,
    { hash: vi.fn() } as never,
    { createInvite } as never,
    {} as never,
    { send } as never,
    { record: auditRecord } as never,
    {} as never,
  );

  return { service, prisma, createInvite, send, auditRecord };
}

const input: AdminCreateUserInput = {
  fullName: 'Peserta Baru',
  email: 'peserta@example.com',
  role: 'USER',
  activation: 'INVITE_EMAIL',
};

const actor = {
  id: 'admin-1',
  role: 'SUPER_ADMIN' as const,
  ip: '127.0.0.1',
  userAgent: 'vitest',
};

describe('UsersService.create dengan undangan email', () => {
  it('mengirim tautan verifikasi Resend dan menandai email terkirim', async () => {
    const harness = makeHarness();

    const result = await harness.service.create(input, actor);

    expect(harness.createInvite).toHaveBeenCalledWith('user-1');
    expect(harness.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'peserta@example.com',
        subject: 'Verifikasi & aktivasi akun TES CAT',
      }),
    );
    const mail = (harness.send.mock.calls as unknown as Array<[{ html: string; text: string }]>)[0][0];
    expect(mail.html).toContain('https://cat.plays.web.id/invite/invite-token');
    expect(mail.text).toContain('https://cat.plays.web.id/invite/invite-token');
    expect(result).toMatchObject({
      emailSent: true,
      inviteUrl: 'https://cat.plays.web.id/invite/invite-token',
    });
  });

  it('tetap membuat akun dan menyediakan tautan cadangan saat email gagal', async () => {
    const loggerError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const harness = makeHarness({ sendError: new Error('Resend menolak pengirim') });

    try {
      const result = await harness.service.create(input, actor);

      expect(result).toMatchObject({
        emailSent: false,
        inviteUrl: 'https://cat.plays.web.id/invite/invite-token',
        user: { id: 'user-1', status: 'PENDING_INVITE' },
      });
      expect(harness.auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user.created',
          metadata: expect.objectContaining({ activation: 'INVITE_EMAIL' }),
        }),
      );
      expect(loggerError).toHaveBeenCalled();
    } finally {
      loggerError.mockRestore();
    }
  });
});
