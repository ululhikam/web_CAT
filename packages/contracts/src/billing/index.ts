import { z } from 'zod';
import { paginationQuerySchema } from '../common/pagination';
import type { PlanFeature, SubscriptionSummary } from '../plans/index';

/**
 * Kontrak domain B4 — checkout, transaksi, webhook, dan revenue.
 *
 * Aturan yang tidak boleh dilanggar:
 *  - Klien tidak pernah mengirim nominal; semua harga dibaca server dari DB.
 *  - Status transaksi internal SELALU SCREAMING_SNAKE, tidak mengikuti nama
 *    status gateway.
 *  - Webhook hanya dipercaya setelah signature diverifikasi.
 */

/* ------------------------------------------------------------------ status */

export const TRANSACTION_STATUSES = [
  'PENDING',
  'SUCCESS',
  'EXPIRED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

/** Status akhir: transaksi tidak boleh kembali menjadi PENDING. */
export const FINAL_TRANSACTION_STATUSES: readonly TransactionStatus[] = [
  'SUCCESS',
  'EXPIRED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
];

/* ------------------------------------------------------------------ transaksi */

/** Baris transaksi yang aman dikirim ke pemiliknya (tanpa payload gateway). */
export interface TransactionSummary {
  id: string;
  orderId: string;
  status: TransactionStatus;
  amountIdr: number;
  provider: string;
  planCode: string | null;
  planName: string | null;
  invoiceNumber: string | null;
  snapToken: string | null;
  /** URL pembayaran aktif; `null` bila transaksi sudah final. */
  redirectUrl: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  createdAt: string;
  subscriptionId: string | null;
}

/** Transaksi + identitas pemesan untuk panel admin. */
export interface AdminTransactionSummary extends TransactionSummary {
  userId: string;
  userEmail: string;
  userFullName: string;
  refundedAt: string | null;
  refundReason: string | null;
}

/** Respons `POST /checkout/transactions`. */
export interface CheckoutResult {
  transaction: TransactionSummary;
  snapToken: string | null;
  redirectUrl: string | null;
  expiresAt: string | null;
  /**
   * `true` bila provider pembayaran adalah simulasi (dev). UI boleh
   * menampilkan tombol "Simulasikan pembayaran".
   */
  simulated: boolean;
  /** Terisi bila paket gratis langsung mengaktifkan langganan. */
  subscription: SubscriptionSummary | null;
}

/**
 * Klien HANYA mengirim kode paket. Nominal, durasi, dan status paket
 * ditentukan server dari `subscription_plans`.
 */
export const createCheckoutSchema = z.object({
  planCode: z.string().trim().min(1, 'Paket wajib dipilih').max(50),
});
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;

export const fakeSettleSchema = z.object({
  orderId: z.string().trim().min(1).max(80),
});
export type FakeSettleInput = z.infer<typeof fakeSettleSchema>;

/* ------------------------------------------------------------------ query */

export const transactionListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(TRANSACTION_STATUSES).optional(),
});
export type TransactionListQuery = z.infer<typeof transactionListQuerySchema>;

export const adminTransactionListQuerySchema = transactionListQuerySchema.extend({
  q: z.string().trim().max(120).optional(),
  planCode: z.string().trim().max(50).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  /**
   * Filter per peserta (F5-03). Dipakai halaman detail user untuk menjawab
   * "berapa kali dia membayar" tanpa memindai seluruh tabel.
   */
  userId: z.string().uuid().optional(),
});
export type AdminTransactionListQuery = z.infer<typeof adminTransactionListQuerySchema>;

export const adminSubscriptionListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['PENDING', 'ACTIVE', 'EXPIRED', 'REVOKED']).optional(),
  /** Hanya langganan ACTIVE yang berakhir dalam N hari ke depan. */
  expiringDays: z.coerce.number().int().min(0).max(365).optional(),
  userId: z.string().uuid().optional(),
  q: z.string().trim().max(120).optional(),
});
export type AdminSubscriptionListQuery = z.infer<typeof adminSubscriptionListQuerySchema>;

/* ------------------------------------------------------------------ admin: plans */

export const planStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']);
export type PlanStatusValue = z.infer<typeof planStatusSchema>;

export const planFeatureSchema = z.object({
  label: z.string().trim().min(1, 'Label fitur wajib diisi').max(120),
  included: z.boolean(),
});
export type PlanFeatureInput = z.infer<typeof planFeatureSchema>;

const planBase = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_]{2,50}$/, 'Kode paket hanya huruf besar, angka, dan garis bawah'),
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(80),
  tagline: z.string().trim().max(160).nullable().optional(),
  priceIdr: z.coerce.number().int().min(0).max(1_000_000_000),
  compareAtPriceIdr: z.coerce.number().int().min(0).max(1_000_000_000).nullable().optional(),
  durationDays: z.coerce.number().int().min(1).max(3650),
  features: z.array(planFeatureSchema).max(30).default([]),
  badge: z.string().trim().max(40).nullable().optional(),
  isPopular: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(10_000).default(0),
  status: planStatusSchema.default('DRAFT'),
});

const comparePriceRule = (value: {
  priceIdr?: number | null;
  compareAtPriceIdr?: number | null;
}): boolean => {
  if (value.priceIdr == null || value.compareAtPriceIdr == null) return true;
  return value.compareAtPriceIdr > value.priceIdr;
};

export const createPlanSchema = planBase.refine(comparePriceRule, {
  message: 'Harga coret harus lebih besar dari harga jual',
  path: ['compareAtPriceIdr'],
});
export type CreatePlanInput = z.infer<typeof createPlanSchema>;

/** `code` sengaja tidak bisa diubah: dipakai transaksi & audit. */
export const updatePlanSchema = planBase
  .omit({ code: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Tidak ada perubahan yang dikirim',
  })
  .refine(comparePriceRule, {
    message: 'Harga coret harus lebih besar dari harga jual',
    path: ['compareAtPriceIdr'],
  });
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

/** Paket versi admin: menyertakan status non-publik + timestamps. */
export interface AdminPlan {
  id: string;
  code: string;
  name: string;
  tagline: string | null;
  priceIdr: number;
  compareAtPriceIdr: number | null;
  durationDays: number;
  pricePerDayIdr: number;
  features: PlanFeature[];
  badge: string | null;
  isPopular: boolean;
  isPublic: boolean;
  sortOrder: number;
  status: PlanStatusValue;
  createdAt: string;
  updatedAt: string;
  /** Terisi bila paket sudah di-soft-delete (F5-02). */
  deletedAt: string | null;
}

/**
 * Body `POST /admin/plans/:id/restore` (F5-02).
 * Restore wajib beralasan agar audit bisa menjelaskan kenapa paket hidup lagi.
 */
export const restorePlanSchema = z.object({
  reason: z.string().trim().min(3, 'Alasan wajib diisi').max(500),
});
export type RestorePlanInput = z.infer<typeof restorePlanSchema>;

/** Body `DELETE /admin/plans/:id` (F5-02) — soft delete, bukan hapus fisik. */
export const deletePlanSchema = z.object({
  reason: z.string().trim().min(3, 'Alasan wajib diisi').max(500),
});
export type DeletePlanInput = z.infer<typeof deletePlanSchema>;

/** Hasil soft delete / restore paket. */
export interface PlanDeleteResult {
  id: string;
  code: string;
  /** Selalu `true`: delete paket bersifat arsip, tidak menghapus riwayat. */
  deleted: boolean;
  deletedAt: string;
}

/* ------------------------------------------------------------------ admin: transaksi */

export const markTransactionPaidSchema = z.object({
  reason: z.string().trim().min(3, 'Alasan wajib diisi').max(500),
  /** Tanggal pembayaran sebenarnya (opsional, default: sekarang). */
  paidAt: z.coerce.date().optional(),
});
export type MarkTransactionPaidInput = z.infer<typeof markTransactionPaidSchema>;

export const refundTransactionSchema = z.object({
  reason: z.string().trim().min(3, 'Alasan refund wajib diisi').max(500),
  /** Cabut langganan yang berasal dari transaksi ini (default: ya). */
  revokeSubscription: z.boolean().default(true),
});
export type RefundTransactionInput = z.infer<typeof refundTransactionSchema>;

/* ------------------------------------------------------------------ revenue */

export const revenueQuerySchema = z.object({
  /** Rentang hari ke belakang bila `from`/`to` tidak diisi. */
  days: z.coerce.number().int().min(1).max(366).default(30),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type RevenueQuery = z.infer<typeof revenueQuerySchema>;

export interface RevenuePlanRow {
  planCode: string | null;
  planName: string;
  transactionCount: number;
  paidCount: number;
  revenueIdr: number;
}

export interface RevenueDayRow {
  /** `YYYY-MM-DD` pada zona waktu Asia/Jakarta. */
  date: string;
  revenueIdr: number;
  paidCount: number;
}

export interface RevenueKpi {
  from: string;
  to: string;
  grossRevenueIdr: number;
  refundedIdr: number;
  netRevenueIdr: number;
  transactionCount: number;
  paidCount: number;
  pendingCount: number;
  expiringCount: number;
  /** paidCount / transactionCount × 100 (0 bila belum ada transaksi). */
  conversionRate: number;
  averageOrderValueIdr: number;
  activeSubscriptions: number;
  newSubscriptions: number;
  byPlan: RevenuePlanRow[];
  daily: RevenueDayRow[];
}

/* ------------------------------------------------------------------ midtrans */

/**
 * Body notifikasi Midtrans (Snap). `gross_amount` dikirim sebagai string
 * desimal ("149000.00"), jadi divalidasi terpisah dari transaksi internal.
 */
export const midtransNotificationSchema = z.object({
  transaction_id: z.string().min(1).optional(),
  order_id: z.string().min(1),
  status_code: z.string().min(1),
  gross_amount: z.string().min(1),
  signature_key: z.string().min(1),
  transaction_status: z.string().min(1),
  fraud_status: z.string().optional(),
  payment_type: z.string().optional(),
  transaction_time: z.string().optional(),
  settlement_time: z.string().optional(),
  status_message: z.string().optional(),
  expiry_time: z.string().optional(),
});
export type MidtransNotification = z.infer<typeof midtransNotificationSchema>;

/** Pemetaan status Midtrans → status internal. */
export const MIDTRANS_STATUS_MAP: Readonly<Record<string, TransactionStatus>> = {
  pending: 'PENDING',
  capture: 'SUCCESS',
  settlement: 'SUCCESS',
  expire: 'EXPIRED',
  deny: 'FAILED',
  failure: 'FAILED',
  cancel: 'CANCELLED',
  refund: 'REFUNDED',
  partial_refund: 'REFUNDED',
  chargeback: 'REFUNDED',
};

export function mapMidtransStatus(status: string): TransactionStatus | null {
  return MIDTRANS_STATUS_MAP[status.trim().toLowerCase()] ?? null;
}

/* ------------------------------------------------------------------ waktu & nomor invoice */

/** Offset Asia/Jakarta (UTC+7, tanpa DST) dalam milidetik. */
export const JAKARTA_OFFSET_MS = 7 * 3_600_000;

/** Tanggal `YYYY-MM-DD` menurut zona waktu Asia/Jakarta. */
export function jakartaDateKey(date: Date): string {
  return new Date(date.getTime() + JAKARTA_OFFSET_MS).toISOString().slice(0, 10);
}

/** Rentang [awal bulan, awal bulan berikutnya) pada zona Asia/Jakarta. */
export function jakartaMonthRange(date: Date): { start: Date; end: Date } {
  const shifted = new Date(date.getTime() + JAKARTA_OFFSET_MS);
  const start = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), 1) - JAKARTA_OFFSET_MS;
  const end =
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, 1) - JAKARTA_OFFSET_MS;
  return { start: new Date(start), end: new Date(end) };
}

/**
 * Nomor invoice deterministik per bulan: `INV/YYYY/MM/<urut 4 digit>`.
 * Urutan dihitung pemanggil agar fungsi ini murni dan mudah diuji.
 */
export function formatInvoiceNumber(date: Date, sequence: number): string {
  const shifted = new Date(date.getTime() + JAKARTA_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  return `INV/${year}/${month}/${String(sequence).padStart(4, '0')}`;
}

export interface WebhookAck {
  received: true;
  duplicate: boolean;
  status: TransactionStatus | null;
}


