import { describe, expect, it, vi } from 'vitest';
import { UsersService } from '../src/modules/users/users.service';

function makeService(user: unknown) {
  const prisma = {
    user: {
      findFirst: vi.fn(async () => user),
      count: vi.fn(async () => 1),
      update: vi.fn(),
    },
    role: { findUnique: vi.fn() },
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

const actor = { id: 'admin-1', role: 'SUPER_ADMIN' as const };

describe('anti-lockout pengguna', () => {
  it('menolak menurunkan SUPER_ADMIN terakhir', async () => {
    const { service } = makeService({ id: 'user-1', role: { code: 'SUPER_ADMIN' } });

    await expect(service.changeRole('user-1', 'ADMIN', 'uji', actor)).rejects.toMatchObject({
      response: { code: 'LAST_SUPER_ADMIN_FORBIDDEN' },
    });
  });

  it('menolak menonaktifkan akun sendiri', async () => {
    const { service } = makeService({ id: 'admin-1', role: { code: 'SUPER_ADMIN' } });

    await expect(service.updateStatus('admin-1', 'SUSPENDED', 'uji', actor)).rejects.toMatchObject({
      response: { code: 'ROLE_CHANGE_FORBIDDEN' },
    });
  });
});
