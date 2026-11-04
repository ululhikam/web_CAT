import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email('Format email tidak valid');

export const passwordSchema = z
  .string()
  .min(10, 'Password minimal 10 karakter')
  .max(128, 'Password maksimal 128 karakter')
  .regex(/[a-z]/, 'Harus mengandung huruf kecil')
  .regex(/[A-Z]/, 'Harus mengandung huruf besar')
  .regex(/\d/, 'Harus mengandung angka');

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?62\d{8,14}$/, 'Gunakan format 62xxxxxxxxxx');

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().trim().min(2, 'Nama minimal 2 karakter').max(120),
  phone: phoneSchema.optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password wajib diisi'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Kode OTP harus 6 digit'),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendVerificationSchema = z.object({ email: emailSchema });

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(20, 'Token tidak valid'),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password lama wajib diisi'),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const activateInviteSchema = z.object({
  token: z.string().min(20, 'Token undangan tidak valid'),
  password: passwordSchema,
  fullName: z.string().trim().min(2).max(120).optional(),
});
export type ActivateInviteInput = z.infer<typeof activateInviteSchema>;

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  permissions: string[];
  emailVerified: boolean;
  mustChangePassword: boolean;
  status: string;
}

/** Satu perangkat/sesi aktif milik user (untuk halaman device management). */
export interface AuthSessionSummary {
  id: string;
  /** True untuk sesi yang sedang dipakai melakukan request ini. */
  current: boolean;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
}

export interface LoginResult {
  accessToken: string;
  user: AuthUser;
}

/** Respons standar endpoint yang hanya mengembalikan pesan. */
export interface MessageResult {
  message: string;
}
