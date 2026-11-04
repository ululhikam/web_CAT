import { z } from 'zod';

/** Filter daftar audit. Cursor memakai pasangan (createdAt, id) agar stabil. */
export const auditLogQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().trim().min(1).optional(),
  action: z.string().trim().max(120).optional(),
  entityType: z.string().trim().max(60).optional(),
  entityId: z.string().trim().max(120).optional(),
  actorUserId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;

export interface AuditLogItem {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}
