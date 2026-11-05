import { z } from 'zod';

const bool = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1');

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().url().default('http://localhost:5173'),
  API_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi'),
  DIRECT_URL: z.string().min(1).optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  /** Bucket Supabase Storage untuk aset soal & berkas impor. */
  SUPABASE_STORAGE_BUCKET: z.string().default('webcat-assets'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET minimal 32 karakter'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET minimal 32 karakter'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('30d'),
  COOKIE_DOMAIN: z.string().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),

  MAIL: z.enum(['console', 'resend']).default('console'),
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().default('Web CAT <no-reply@example.com>'),

  STORAGE: z.enum(['dev', 'supabase']).default('dev'),

  ACCESS_POLICY: z.enum(['dev', 'billing']).default('dev'),
  QUESTION_POOL: z.enum(['dev', 'db']).default('dev'),
  PAYMENT: z.enum(['fake', 'midtrans']).default('fake'),
  DOC_EXTRACTOR: z.enum(['heuristic', 'ai']).default('heuristic'),
  IMPORT_AI_ENABLED: bool.default('false'),

  MIDTRANS_SERVER_KEY: z.string().optional(),
  MIDTRANS_CLIENT_KEY: z.string().optional(),
  MIDTRANS_IS_PRODUCTION: bool.default('false'),

  CRON_SECRET: z.string().min(8, 'CRON_SECRET minimal 8 karakter'),
  /** Ambang job PENDING yang memicu peringatan backlog di endpoint cron. */
  JOB_BACKLOG_ALERT_THRESHOLD: z.coerce.number().int().min(1).default(100),
  SENTRY_DSN: z.string().optional(),

  /** Sekali pakai saat seed: membuat akun SUPER_ADMIN pertama. */
  BOOTSTRAP_SUPER_ADMIN_EMAIL: z.string().email().optional(),
  BOOTSTRAP_SUPER_ADMIN_PASSWORD: z.string().min(10).optional(),
  BOOTSTRAP_SUPER_ADMIN_NAME: z.string().default('Super Admin'),
  FAKE_PAYMENT_SECRET: z.string().optional(),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  TZ: z.string().default('Asia/Jakarta'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validasi env sekali di boot. Pesan error menyebut nama variabel yang salah
 * tanpa pernah mencetak nilainya (mencegah secret bocor ke log).
 */
export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Konfigurasi environment tidak valid:\n${detail}`);
  }
  return result.data;
}
