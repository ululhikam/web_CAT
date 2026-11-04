import { Injectable } from '@nestjs/common';
import type { AuditEntry, AuditPort } from '@webcat/contracts';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaAudit implements AuditPort {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: entry.actorUserId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: (entry.metadata ?? undefined) as never,
        ip: entry.ip ?? null,
        userAgent: entry.userAgent ?? null,
      },
    });
  }
}
