import type { Permission, Role } from '../common/rbac';
import type { Plan } from '../plans/index';

/** Identitas pemanggil yang sudah divalidasi guard. */
export interface AuthenticatedUser {
  id: string;
  sessionId: string;
  role: Role;
  permissions: Permission[];
  emailVerified: boolean;
  mustChangePassword: boolean;
}

export interface AccessDecision {
  allowed: boolean;
  code: 'OK' | 'SUBSCRIPTION_REQUIRED' | 'SUBSCRIPTION_EXPIRED' | 'USER_SUSPENDED' | 'DAILY_LIMIT_REACHED';
  message: string;
  endsAt: Date | null;
  remainingDays: number;
}

/** Port tunggal yang dibaca mesin ujian; tidak peduli sumber langganan. */
export interface AccessPolicyPort {
  check(userId: string): Promise<AccessDecision>;
  assertCanStartExam(userId: string): Promise<void>;
  assertCanContinue(userId: string): Promise<void>;
}

export interface PoolStatus {
  ready: boolean;
  available: number;
  required: number;
  missingSubtestCodes: string[];
}

export interface QuestionPoolPort {
  validate(subtestCode: string, count: number): Promise<PoolStatus>;
}

export interface SignedUpload {
  path: string;
  token: string;
  signedUrl: string;
  expiresAt: Date;
}

export interface StoragePort {
  createSignedUpload(path: string, contentType: string): Promise<SignedUpload>;
  createSignedUrl(path: string, ttlSeconds: number): Promise<string>;
  delete(path: string): Promise<void>;
}

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface MailPort {
  send(message: MailMessage): Promise<void>;
}

export interface AuditEntry {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}

export interface AuditPort {
  record(entry: AuditEntry): Promise<void>;
}

export interface ExtractedBlock {
  index: number;
  text: string;
  page?: number;
}

export interface ExtractionResult {
  blocks: ExtractedBlock[];
  warnings: string[];
  pageCount: number;
  confidence: number;
}

export interface DocExtractorPort {
  supports(mime: string): boolean;
  extract(buffer: Uint8Array, mime: string): Promise<ExtractionResult>;
}

export interface ChargeRequest {
  orderId: string;
  amountIdr: number;
  planCode: string;
  customer: { id: string; email: string; name: string };
}

export interface ChargeResult {
  providerToken: string;
  redirectUrl: string;
  expiresAt: Date;
}

export interface PaymentEvent {
  providerEventId: string;
  orderId: string;
  status: 'PENDING' | 'SUCCESS' | 'EXPIRED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  amountIdr: number;
  paidAt: Date | null;
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  createCharge(request: ChargeRequest): Promise<ChargeResult>;
  verifyWebhook(headers: Record<string, string | undefined>, body: string): boolean;
  parseEvent(body: string): PaymentEvent;
}

/** Dipakai modul plan/pricing; memisahkan domain dari Prisma. */
export interface PlanRepository {
  listPublic(): Promise<Plan[]>;
  findByCode(code: string): Promise<Plan | null>;
}
