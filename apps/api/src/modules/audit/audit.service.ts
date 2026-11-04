import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  decodeCursor,
  encodeCursor,
  type AuditLogItem,
  type AuditLogQuery,
  type AuditPort,
  type CursorPage,
} from '@webcat/contracts';
import { AUDIT } from '../../core/ports/ports.module';
import { PrismaService } from '../../core/prisma/prisma.service';

export interface AuditRecordInput {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Fasad tipis di atas AuditPort. Modul domain tidak boleh menulis
 * `audit_logs` langsung — semua jejak audit lewat sini agar format seragam
 * dan mudah diekspor.
 */
@Injectable()
export class AuditService {
  constructor(
    @Inject(AUDIT) private readonly port: AuditPort,
    private readonly prisma: PrismaService,
  ) {}

  async record(input: AuditRecordInput): Promise<void> {
    await this.port.record(input);
  }

  /**
   * Daftar audit dengan cursor (createdAt, id).
   *
   * Cursor dipakai bersama `id` agar baris dengan timestamp identik tidak
   * terlewat/terduplikasi saat halaman berikutnya diambil.
   */
  async list(query: AuditLogQuery): Promise<CursorPage<AuditLogItem>> {
    const where: Prisma.AuditLogWhereInput = {};

    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.actorUserId) where.actorUserId = query.actorUserId;

    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { gte: query.from } : {}),
        ...(query.to ? { lte: query.to } : {}),
      };
    }

    if (query.cursor) {
      const cursor = decodeCursor<{ t: string; i: string }>(query.cursor);
      const createdAt = new Date(cursor.t);
      where.AND = [
        {
          OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: cursor.i } }],
        },
      ];
    }

    const rows = await this.prisma.auditLog.findMany({
      where,
      include: { actor: { select: { email: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
    });

    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    const last = page[page.length - 1];

    return {
      items: page.map((row) => ({
        id: row.id,
        actorUserId: row.actorUserId,
        actorEmail: row.actor?.email ?? null,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        metadata: row.metadata,
        ip: row.ip,
        userAgent: row.userAgent,
        createdAt: row.createdAt.toISOString(),
      })),
      nextCursor:
        hasMore && last
          ? encodeCursor({ t: last.createdAt.toISOString(), i: last.id })
          : null,
      hasMore,
    };
  }
}
