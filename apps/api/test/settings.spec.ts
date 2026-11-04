import { describe, expect, it, vi } from 'vitest';
import { SettingsService } from '../src/modules/settings/settings.service';

interface FakeRow {
  key: string;
  value: unknown;
  updatedAt: Date;
  updatedBy: string | null;
}

function makeService(rows: FakeRow[] = []) {
  const upsert = vi.fn(async ({ create }: { create: Record<string, unknown> }) => create);
  const findMany = vi.fn(async () => rows);
  const findUnique = vi.fn(async ({ where }: { where: { key: string } }) => {
    return rows.find((row) => row.key === where.key) ?? null;
  });
  const transaction = vi.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations));

  const prisma = {
    platformSetting: { findMany, findUnique, upsert },
    $transaction: transaction,
  };

  const record = vi.fn(async () => undefined);
  const service = new SettingsService(prisma as never, { record } as never);

  return { service, prisma, upsert, transaction, record, findMany };
}

describe('SettingsService', () => {
  it('menggabungkan default dengan nilai dari database', async () => {
    const { service } = makeService([
      {
        key: 'auth.registration_enabled',
        value: true,
        updatedAt: new Date('2026-02-01T10:00:00.000Z'),
        updatedBy: 'admin-1',
      },
      {
        key: 'platform.announcement',
        value: 'Halo peserta',
        updatedAt: new Date('2026-02-02T10:00:00.000Z'),
        updatedBy: 'admin-1',
      },
    ]);

    const view = await service.view();

    expect(view.values['auth.registration_enabled']).toBe(true);
    expect(view.values['platform.maintenance_mode']).toBe(false);
    expect(view.values['platform.announcement']).toBe('Halo peserta');
    expect(view.updated['auth.registration_enabled']?.updatedBy).toBe('admin-1');
    expect(view.updated['platform.maintenance_mode']).toBeNull();
  });

  it('mengabaikan baris dengan tipe tidak valid dan kembali ke default', async () => {
    const { service } = makeService([
      {
        key: 'auth.registration_enabled',
        value: 'bukan-boolean',
        updatedAt: new Date(),
        updatedBy: null,
      },
    ]);

    const view = await service.view();
    expect(view.values['auth.registration_enabled']).toBe(false);

    const value = await service.value('auth.registration_enabled');
    expect(value).toBe(false);
  });

  it('mengembalikan default bila kunci belum ada', async () => {
    const { service } = makeService([]);
    await expect(service.value('platform.maintenance_mode')).resolves.toBe(false);
    await expect(service.value('platform.announcement')).resolves.toBe('');
  });

  it('menyimpan hanya kunci yang dikirim dan mencatat audit', async () => {
    const { service, upsert, transaction, record } = makeService([]);

    await service.update(
      { 'auth.registration_enabled': true },
      { id: 'admin-1', ip: '127.0.0.1', userAgent: 'vitest' },
    );

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'auth.registration_enabled' },
        create: expect.objectContaining({ key: 'auth.registration_enabled', value: true }),
        update: expect.objectContaining({ value: true, updatedBy: 'admin-1' }),
      }),
    );
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-1',
        action: 'settings.updated',
        entityType: 'platform_setting',
      }),
    );
  });
});
