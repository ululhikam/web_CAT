import { describe, expect, it, vi } from 'vitest';
import { auditLogQuerySchema, decodeCursor } from '@webcat/contracts';
import { AuditService } from '../src/modules/audit/audit.service';

function row(id: string, createdAt: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    actorUserId: 'user-1',
    actor: { email: 'admin@example.com' },
    action: 'user.created',
    entityType: 'user',
    entityId: `target-${id}`,
    metadata: { ok: true },
    ip: '127.0.0.1',
    userAgent: 'vitest',
    createdAt: new Date(createdAt),
    ...overrides,
  };
}

function makeService(rows: ReturnType<typeof row>[]) {
  const findMany = vi.fn(async (_args: { where: Record<string, unknown> }) => rows);
  const prisma = { auditLog: { findMany } };
  const service = new AuditService({ record: vi.fn() } as never, prisma as never);
  return { service, findMany };
}

describe('AuditService.list', () => {
  it('memetakan baris dan menandai halaman berikutnya dengan cursor (createdAt,id)', async () => {
    const now = '2026-03-01T10:00:00.000Z';
    const older = '2026-03-01T09:00:00.000Z';
    const { service, findMany } = makeService([
      row('a', now),
      row('b', older),
      row('c', '2026-03-01T08:00:00.000Z'),
    ]);

    const page = await service.list(auditLogQuerySchema.parse({ limit: '2' }));

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 3,
      }),
    );
    expect(page.items).toHaveLength(2);
    expect(page.items[0]).toEqual(
      expect.objectContaining({
        id: 'a',
        actorEmail: 'admin@example.com',
        createdAt: now,
      }),
    );
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).not.toBeNull();
    expect(decodeCursor(page.nextCursor as string)).toEqual({ t: older, i: 'b' });
  });

  it('tidak memberi cursor bila baris habis', async () => {
    const { service } = makeService([row('a', '2026-03-01T10:00:00.000Z')]);

    const page = await service.list(auditLogQuerySchema.parse({ limit: '2' }));
    expect(page.hasMore).toBe(false);
    expect(page.nextCursor).toBeNull();
  });

  it('menerjemahkan filter ke klausa Prisma', async () => {
    const { service, findMany } = makeService([]);

    await service.list(
      auditLogQuerySchema.parse({
        action: 'ROLE',
        entityType: 'user',
        entityId: 'u-1',
        actorUserId: '11111111-1111-4111-8111-111111111111',
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-02-01T00:00:00.000Z',
      }),
    );

    const call = findMany.mock.calls[0][0];

    expect(call.where.action).toEqual({ contains: 'ROLE', mode: 'insensitive' });
    expect(call.where.entityType).toBe('user');
    expect(call.where.entityId).toBe('u-1');
    expect(call.where.actorUserId).toBe('11111111-1111-4111-8111-111111111111');
    expect(call.where.createdAt).toEqual({
      gte: new Date('2026-01-01T00:00:00.000Z'),
      lte: new Date('2026-02-01T00:00:00.000Z'),
    });
    expect(call.where.AND).toBeUndefined();
  });

  it('menolak cursor tidak valid sebelum query dijalankan', async () => {
    const { service, findMany } = makeService([]);

    await expect(
      service.list(auditLogQuerySchema.parse({ cursor: 'bukan-cursor' })),
    ).rejects.toThrow();
    expect(findMany).not.toHaveBeenCalled();
  });
});
