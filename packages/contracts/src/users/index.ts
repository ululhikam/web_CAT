import { z } from 'zod';
import { ROLES } from '../common/rbac';
import { emailSchema, passwordSchema } from '../auth/index';

/* ------------------------------------------------------------------ provisioning */

/** Masa langganan awal yang bisa langsung disertakan saat admin membuat user. */
export const initialSubscriptionSchema = z
  .object({
    planCode: z.string().trim().min(1).optional(),
    durationDays: z.coerce.number().int().min(1).max(3650).optional(),
    startsAt: z.coerce.date().optional(),
  })
  .refine((v) => Boolean(v.planCode) !== Boolean(v.durationDays), {
    message: 'Isi salah satu: planCode atau durationDays',
  });
export type InitialSubscription = z.infer<typeof initialSubscriptionSchema>;

/** POST /admin/users — satu-satunya jalur pembuatan akun peserta. */
export const adminCreateUserSchema = z
  .object({
    email: emailSchema,
    fullName: z.string().trim().min(2, 'Nama minimal 2 karakter').max(120),
    phone: z.string().trim().regex(/^\+?62\d{8,14}$/, 'Gunakan format 62xxxxxxxxxx').optional(),
    role: z.enum(ROLES).default('USER'),
    /** Kirim email undangan (default) atau buat password sementara. */
    activation: z.enum(['INVITE_EMAIL', 'TEMP_PASSWORD']).default('INVITE_EMAIL'),
    temporaryPassword: passwordSchema.optional(),
    subscription: initialSubscriptionSchema.optional(),
  })
  .refine((v) => v.activation !== 'TEMP_PASSWORD' || Boolean(v.temporaryPassword), {
    message: 'Password sementara wajib diisi untuk mode TEMP_PASSWORD',
    path: ['temporaryPassword'],
  });
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;

/* ------------------------------------------------------------------ mutations */

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING_INVITE']),
  reason: z.string().trim().min(3).max(500).optional(),
});
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

export const changeUserRoleSchema = z.object({
  role: z.enum(ROLES),
  reason: z.string().trim().min(3).max(500).optional(),
});
export type ChangeUserRoleInput = z.infer<typeof changeUserRoleSchema>;

export const adminResetPasswordSchema = z.object({
  newPassword: passwordSchema,
});
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;

/* ------------------------------------------------------------------ queries */

export const userListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().trim().min(1).optional(),
  q: z.string().trim().max(120).optional(),
  status: z.enum(['PENDING_INVITE', 'ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
  role: z.enum(ROLES).optional(),
});
export type UserListQuery = z.infer<typeof userListQuerySchema>;

/* ------------------------------------------------------------------ responses */

export type SubscriptionState = 'ACTIVE' | 'EXPIRED' | 'NONE';

export interface AdminUserSummary {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_INVITE';
  emailVerified: boolean;
  createdAt: string;
  createdBy: string | null;
  subscription: {
    status: SubscriptionState;
    endsAt: string | null;
    remainingDays: number;
    source: 'PURCHASE' | 'MANUAL_GRANT' | 'TRIAL' | null;
  } | null;
}

export interface AdminCreateUserResponse {
  user: AdminUserSummary;
  /** Ditampilkan ke admin agar bisa diteruskan manual bila email gagal. */
  inviteUrl: string | null;
}
