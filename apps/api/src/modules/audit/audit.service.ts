import { Inject, Injectable } from '@nestjs/common';
import { AUDIT } from '../../core/ports/ports.module';
import type { AuditPort } from '@webcat/contracts';

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
  constructor(@Inject(AUDIT) private readonly port: AuditPort) {}

  async record(input: AuditRecordInput): Promise<void> {
    await this.port.record(input);
  }
}
