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

/**
 * F4-09 — rincian satu subtes yang bank soalnya belum memenuhi kuota.
 *
 * Dikembalikan `QuestionPoolPort.validate()` agar pemanggil bisa menyebut
 * subtes mana yang kurang dan berapa banyak, bukan sekadar "pool tidak siap".
 */
export interface PoolShortage {
  subtestCode: string;
  required: number;
  available: number;
  missing: number;
  /** Kalimat siap tampil (dipakai endpoint kelayakan & error start sesi). */
  message: string;
}

export interface PoolStatus {
  ready: boolean;
  available: number;
  required: number;
  /** Dipertahankan untuk konsumen lama; selalu sinkron dengan `problems`. */
  missingSubtestCodes: string[];
  /** Rincian kekurangan; kosong saat `ready`. */
  problems: PoolShortage[];
}

export interface DifficultyMix {
  EASY?: number;
  MEDIUM?: number;
  HARD?: number;
}

export interface PoolMedia {
  id: string;
  storagePath: string;
  mime: string;
  role: 'STEM' | 'OPTION' | 'EXPLANATION';
  optionLabel: string | null;
  altText: string | null;
  sortOrder: number;
}

export interface PoolOption {
  id: string;
  label: string;
  contentText: string | null;
  isCorrect: boolean;
  scoreValue: number;
  dimensionMap: Record<string, number> | null;
  sortOrder: number;
}

export interface PoolQuestion {
  id: string;
  publicCode: string;
  stageCode: string;
  subtestCode: string;
  type: string;
  stemText: string;
  stemFormat: string;
  explanation: string | null;
  scoringStrategy: string;
  scoringConfig: Record<string, unknown> | null;
  weight: number;
  pairGroup: string | null;
  columnIndex: number | null;
  options: PoolOption[];
  media: PoolMedia[];
}

export interface QuestionPoolPort {
  validate(subtestCode: string, count: number): Promise<PoolStatus>;
  sample(subtestCode: string, count: number, mix?: DifficultyMix): Promise<PoolQuestion[]>;
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

/** Gambar yang ditemukan saat ekstraksi dokumen. */
export interface ExtractedImage {
  index: number;
  /** Halaman asal (PDF) bila ada. */
  page?: number;
  /** Indeks blok teks tempat gambar berada (DOCX). */
  blockIndex?: number;
  /** Petunjuk penempatan hasil heuristik; admin tetap dapat mengubahnya. */
  role?: 'STEM' | 'OPTION';
  optionLabel?: string;
  altText?: string;
  data: Uint8Array;
  mime: string;
  width?: number;
  height?: number;
}

export interface ExtractionResult {
  blocks: ExtractedBlock[];
  warnings: string[];
  pageCount: number;
  confidence: number;
  images?: ExtractedImage[];
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

export interface RefundRequest {
  orderId: string;
  amountIdr: number;
  reason: string;
}

export interface RefundResult {
  providerRef: string | null;
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  createCharge(request: ChargeRequest): Promise<ChargeResult>;
  verifyWebhook(headers: Record<string, string | undefined>, body: string): boolean;
  parseEvent(body: string): PaymentEvent;
  /** Opsional: provider tanpa API refund (mis. fake) cukup melempar/melewati. */
  refund?(request: RefundRequest): Promise<RefundResult>;
}

/** Dipakai modul plan/pricing; memisahkan domain dari Prisma. */
export interface PlanRepository {
  listPublic(): Promise<Plan[]>;
  findByCode(code: string): Promise<Plan | null>;
}
