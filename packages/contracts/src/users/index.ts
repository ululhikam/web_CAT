import { z } from 'zod';
import { ROLES } from '../common/rbac';
import { emailSchema, passwordSchema, phoneSchema } from '../auth/index';

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

/**
 * PATCH /admin/users/:id — admin memperbaiki data profil peserta (mis. salah
 * ketik nama saat pembuatan akun). Email dan role sengaja tidak termasuk:
 * email adalah identitas login dan role punya endpoint sendiri yang ber-audit.
 */
export const adminUpdateUserSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Nama minimal 2 karakter').max(120).optional(),
    phone: phoneSchema.nullable().optional(),
    reason: z.string().trim().min(3).max(500).optional(),
  })
  .refine((value) => value.fullName !== undefined || value.phone !== undefined, {
    message: 'Kirim minimal satu field: fullName atau phone',
  });
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

/**
 * DELETE /admin/users/:id — hapus-lunak: akun tidak bisa login lagi, tetapi
 * riwayat ujian/transaksi tetap utuh untuk audit.
 */
export const adminDeleteUserSchema = z.object({
  reason: z.string().trim().min(3, 'Alasan minimal 3 karakter').max(500),
});
export type AdminDeleteUserInput = z.infer<typeof adminDeleteUserSchema>;

/* ------------------------------------------------------------------ profil sendiri */

/** PATCH /users/me — minimal satu field harus diisi. */
export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Nama minimal 2 karakter').max(120).optional(),
    phone: phoneSchema.nullable().optional(),
  })
  .refine((value) => value.fullName !== undefined || value.phone !== undefined, {
    message: 'Kirim minimal satu field: fullName atau phone',
  });
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** POST /users/me/avatar — minta signed upload langsung ke storage. */
export const avatarUploadSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp'], {
    message: 'Gunakan JPEG, PNG, atau WebP',
  }),
  sizeBytes: z.coerce
    .number()
    .int()
    .min(1, 'Berkas kosong')
    .max(2 * 1024 * 1024, 'Maksimal 2 MB'),
});
export type AvatarUploadInput = z.infer<typeof avatarUploadSchema>;

export interface AvatarUploadResponse {
  path: string;
  token: string;
  signedUrl: string;
  expiresAt: string;
}

/* ------------------------------------------------------------------ kuota harian */

/** Alasan wajib: reset kuota membebaskan kesempatan ujian hari itu. */
export const quotaResetSchema = z.object({
  reason: z.string().trim().min(10, 'Alasan minimal 10 karakter').max(500),
});
export type QuotaResetInput = z.infer<typeof quotaResetSchema>;

export interface QuotaResetResponse {
  userId: string;
  /** Tanggal WIB dalam format YYYY-MM-DD. */
  examDate: string;
  voidedSessions: number;
  message: string;
}

/**
 * Batas sesi ujian per hari (WIB).
 *
 * Satu angka ini dipakai bersama oleh `BillingAccessPolicy` (yang menolak sesi
 * berikutnya) dan panel admin (yang menampilkan sisa kuota). Kalau aturannya
 * berubah, hanya satu tempat yang perlu disentuh.
 */
export const DAILY_EXAM_SESSION_LIMIT = 3;

/** Pemakaian kuota ujian hari ini untuk satu peserta (cermin read-only). */
export interface AdminUserQuotaToday {
  /** Tanggal ujian WIB, format YYYY-MM-DD. */
  examDate: string;
  /** Batas sesi per hari yang berlaku. */
  dailyLimit: number;
  /** Sesi hari ini yang masih dihitung (belum di-void). */
  usedToday: number;
  /** Sesi hari ini yang dibatalkan admin. */
  voidedToday: number;
  /** Sisa kesempatan hari ini (tidak pernah negatif). */
  remainingToday: number;
}

/* ------------------------------------------------------------------ queries */

export const userListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().trim().min(1).optional(),
  q: z.string().trim().max(120).optional(),
  status: z.enum(['PENDING_INVITE', 'ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
  role: z.enum(ROLES).optional(),
  /**
   * Hanya akun yang dibuat dalam N hari terakhir.
   *
   * Dipakai lonceng notifikasi "pendaftar baru" agar admin bisa langsung
   * membuka daftar yang sudah terfilter, bukan sekadar melihat angkanya.
   */
  registeredWithinDays: z.coerce.number().int().min(1).max(365).optional(),
});
export type UserListQuery = z.infer<typeof userListQuerySchema>;

/**
 * Ringkasan pendaftar baru untuk notifikasi dashboard admin.
 *
 * `total` sengaja dihitung terpisah dari `items`: lonceng hanya butuh angka,
 * sedangkan kartu dashboard butuh beberapa baris terbaru. Keduanya diambil
 * dalam satu request agar badge dan daftar tidak pernah berbeda.
 */
export const newSignupsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});
export type NewSignupsQuery = z.infer<typeof newSignupsQuerySchema>;

/**
 * Hasil `GET /admin/users/new-signups` — sumber tunggal untuk badge lonceng
 * dan kartu "Pendaftar baru" di dashboard admin/superadmin.
 *
 * `total` dihitung dengan `count()` terpisah dari `items`, karena badge hanya
 * butuh angka dan tidak boleh ikut mengecil saat daftar dipotong `limit`.
 */
export interface NewSignupsSummary {
  /** Jendela waktu yang dipakai, dalam hari. */
  days: number;
  /** Jumlah akun baru dalam jendela waktu tersebut. */
  total: number;
  /** Dari `total`, berapa yang belum memverifikasi email. */
  unverified: number;
  /** Akun terbaru, terbaru lebih dulu (maksimum `limit`). */
  items: AdminUserSummary[];
}

/* ------------------------------------------------------------------ responses */

export type SubscriptionState = 'ACTIVE' | 'EXPIRED' | 'NONE';

export interface AdminUserSummary {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarPath: string | null;
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
  /**
   * `true` bila email undangan berhasil diterima penyedia email (Resend).
   * Bila `false`, admin tetap bisa meneruskan `inviteUrl` secara manual.
   */
  emailSent: boolean;
  /** Ditampilkan ke admin agar bisa diteruskan manual bila email gagal. */
  inviteUrl: string | null;
}

/* ------------------------------------------------------------------ detail peserta */

/**
 * Proyeksi baris untuk halaman detail peserta (F5-03).
 *
 * Tipe-tipe ini sengaja didefinisikan lokal, bukan memakai tipe modul billing/
 * exams, supaya kontrak halaman detail tidak ikut berubah setiap kali kontrak
 * modul lain berevolusi — halaman ini hanya butuh kolom yang ditampilkan.
 */
export interface AdminUserSubscriptionRow {
  id: string;
  planCode: string | null;
  planName: string | null;
  status: string;
  source: string;
  startsAt: string;
  endsAt: string;
  remainingDays: number;
  revokedAt: string | null;
  revokeReason: string | null;
  createdAt: string;
}

export interface AdminUserExamRow {
  id: string;
  examDate: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  totalScore: number | null;
  passed: boolean | null;
  eliminatedSubtestCode: string | null;
}

export interface AdminUserPaymentRow {
  id: string;
  orderId: string;
  status: string;
  amountIdr: number;
  planCode: string | null;
  planName: string | null;
  paidAt: string | null;
  createdAt: string;
}

/**
 * Ringkasan satu peserta untuk halaman detail admin (F5-03).
 *
 * Halaman ini harus menjawab tiga pertanyaan tanpa query manual:
 *   1. berapa kali dia ikut ujian dan skornya berapa,
 *   2. langganannya kapan habis,
 *   3. berapa yang sudah dia bayar.
 *
 * Karena itu `exams` dan `payments` membawa agregat sekaligus daftar terbaru,
 * bukan hanya daftar mentah yang harus dijumlahkan klien.
 */
export interface AdminUserOverview {
  profile: AdminUserSummary;
  /** Langganan yang sedang aktif (bila ada). */
  subscription: AdminUserSubscriptionRow | null;
  /** Riwayat langganan terbaru, termasuk yang sudah berakhir/dicabut. */
  subscriptionHistory: AdminUserSubscriptionRow[];
  /** Pemakaian kuota ujian hari ini (WIB). */
  quota: AdminUserQuotaToday;
  exams: {
    total: number;
    completed: number;
    passed: number;
    /** Rata-rata `totalScore` ujian yang selesai (null bila belum ada). */
    averageScore: number | null;
    /** Skor tertinggi yang pernah dicapai (null bila belum ada). */
    bestScore: number | null;
    lastExamAt: string | null;
    /** Sesi terbaru, terbaru lebih dulu. */
    recent: AdminUserExamRow[];
  };
  payments: {
    totalTransactions: number;
    /** Transaksi berstatus SUCCESS. */
    paidTransactions: number;
    /** Jumlah rupiah dari transaksi SUCCESS. */
    totalPaidIdr: number;
    lastPaidAt: string | null;
    recent: AdminUserPaymentRow[];
  };
}
