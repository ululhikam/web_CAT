import { describe, expect, it, vi } from 'vitest';
import { UsersService } from '../src/modules/users/users.service';

/**
 * F5-17 — kelola akun oleh admin.
 *
 * Dua keputusan penting di sini: hapus akun selalu *hapus-lunak* (riwayat ujian
 * dan transaksi tetap utuh) dan panel tidak boleh kehilangan SUPER_ADMIN
 * terakhir. Keduanya tidak kasat mata di UI, jadi diuji langsung di service.
 */

const actor = { id: 'admin-1', role: 'ADMIN' as const };
const superActor = { id: 'super-1', role: 'SUPER_ADMIN' as const };

function makeService(
  user: Record<string, unknown> | null,
  options: { superAdminCount?: number } = {},
) {
  const audit = { record: vi.fn(async () => undefined) };
  const prisma = {
    user: {
      findFirst: vi.fn(async () => user),
      count: vi.fn(async () => options.superAdminCount ?? 2),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        ...user,
        ...data,
      })),
    },
    session: { updateMany: vi.fn(async () => ({ count: 1 })) },
    $transaction: vi.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations)),
  };

  const service = new UsersService(
    prisma as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { toSummary: undefined } as never,
    audit as never,
    {} as never,
  );

  return { service, prisma, audit };
}

const userRow = {
  id: 'user-1',
  email: 'peserta@example.com',
  fullName: 'Peserta Uji',
  phone: null,
  avatarPath: null,
  status: 'ACTIVE',
  role: { code: 'USER' },
  emailVerifiedAt: new Date('2026-11-01T00:00:00.000Z'),
  createdAt: new Date('2026-11-01T00:00:00.000Z'),
  createdById: null,
  subscriptions: [],
};

describe('hapus akun oleh admin', () => {
  it('menolak menghapus akun sendiri', async () => {
    const { service } = makeService({ ...userRow, id: 'admin-1' });

    await expect(service.softDelete('admin-1', 'uji coba', actor)).rejects.toMatchObject({
      response: { code: 'USER_DELETE_SELF_FORBIDDEN' },
    });
  });

  it('menolak menghapus SUPER_ADMIN terakhir', async () => {
    const { service } = makeService(
      { ...userRow, role: { code: 'SUPER_ADMIN' } },
      { superAdminCount: 1 },
    );

    await expect(service.softDelete('user-1', 'uji coba', superActor)).rejects.toMatchObject({
      response: { code: 'LAST_SUPER_ADMIN_FORBIDDEN' },
    });
  });

  it('menghapus-lunak: status DELETED, deletedAt terisi, sesi dicabut', async () => {
    const { service, prisma, audit } = makeService(userRow);

    const result = await service.softDelete('user-1', 'peserta pindah jadwal', actor);

    expect(result.message).toMatch(/dihapus/i);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({ status: 'DELETED', tokenVersion: { increment: 1 } }),
    });
    const data = prisma.user.update.mock.calls[0][0].data;
    expect(data.deletedAt).toBeInstanceOf(Date);

    expect(prisma.session.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'user.deleted',
        entityId: 'user-1',
        metadata: expect.objectContaining({ reason: 'peserta pindah jadwal' }),
      }),
    );
  });
});

describe('perbaiki data profil oleh admin', () => {
  it('menyimpan nama & telepon baru dan mencatat audit', async () => {
    const { service, prisma, audit } = makeService(userRow);

    await service.updateProfileByAdmin(
      'user-1',
      { fullName: 'Nama Diperbaiki', phone: '628111222333', reason: 'salah ketik' },
      actor,
    );

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { fullName: 'Nama Diperbaiki', phone: '628111222333' },
      include: expect.anything(),
    });

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'user.profile_updated_by_admin',
        metadata: expect.objectContaining({
          from: { fullName: 'Peserta Uji', phone: null },
          reason: 'salah ketik',
        }),
      }),
    );
  });

  it('tidak menyentuh field yang tidak dikirim', async () => {
    const { service, prisma } = makeService(userRow);

    await service.updateProfileByAdmin('user-1', { phone: null }, actor);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { phone: null },
      include: expect.anything(),
    });
  });
});
