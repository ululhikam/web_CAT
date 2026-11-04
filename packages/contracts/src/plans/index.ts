import { z } from 'zod';

/* ------------------------------------------------------------------ plan */

export interface PlanFeature {
  label: string;
  included: boolean;
}

/** Baris `subscription_plans` yang dikirim ke halaman pricing. */
export interface Plan {
  id: string;
  code: string;
  name: string;
  tagline: string | null;
  priceIdr: number;
  compareAtPriceIdr: number | null;
  durationDays: number;
  /** Harga per hari, dihitung server agar tidak ada pembulatan berbeda di klien. */
  pricePerDayIdr: number;
  features: PlanFeature[];
  isPublic: boolean;
  sortOrder: number;
  badge: string | null;
  isPopular: boolean;
}

/* ------------------------------------------------------------------ subscription */

export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REVOKED';
export type SubscriptionSource = 'PURCHASE' | 'MANUAL_GRANT' | 'TRIAL';

export interface SubscriptionSummary {
  id: string;
  userId: string;
  planCode: string | null;
  status: SubscriptionStatus;
  source: SubscriptionSource;
  startsAt: string;
  endsAt: string;
  remainingDays: number;
  grantedBy: string | null;
  grantNote: string | null;
}

/* ------------------------------------------------------------------ admin: grant */

export const grantSubscriptionSchema = z
  .object({
    userId: z.string().uuid('userId tidak valid'),
    planCode: z.string().trim().min(1).max(50).optional(),
    durationDays: z.coerce.number().int().min(1).max(3650).optional(),
    startsAt: z.coerce.date().optional(),
    /** STACK = tambahkan setelah langganan aktif berakhir; REPLACE = timpa. */
    mode: z.enum(['STACK', 'REPLACE']).default('STACK'),
    reason: z.string().trim().min(3, 'Alasan wajib diisi').max(500),
  })
  .refine((v) => Boolean(v.planCode) !== Boolean(v.durationDays), {
    message: 'Isi salah satu: planCode atau durationDays',
  });
export type GrantSubscriptionInput = z.infer<typeof grantSubscriptionSchema>;

export const updateSubscriptionSchema = z.object({
  endsAt: z.coerce.date().optional(),
  extendDays: z.coerce.number().int().min(1).max(3650).optional(),
  status: z.enum(['ACTIVE', 'REVOKED', 'EXPIRED']).optional(),
  reason: z.string().trim().min(3, 'Alasan wajib diisi').max(500),
});
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

export const checkoutSchema = z.object({
  planCode: z.string().trim().min(1).max(50),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const MAX_SUBSCRIPTION_DAYS = 3650;

export { DEFAULT_PLANS } from './default-plans';
