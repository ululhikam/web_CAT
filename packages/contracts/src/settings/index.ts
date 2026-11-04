import { z } from 'zod';

/**
 * Pengaturan platform yang boleh diubah SUPER_ADMIN tanpa deploy.
 *
 * Nilai default dipakai bila baris di `platform_settings` belum ada, sehingga
 * GET selalu mengembalikan objek lengkap.
 */
export const PLATFORM_SETTINGS_DEFAULTS = {
  'auth.registration_enabled': false,
  'auth.session_policy': 'replace',
  'platform.maintenance_mode': false,
  'platform.announcement': '',
} as const;

export type PlatformSettingKey = keyof typeof PLATFORM_SETTINGS_DEFAULTS;

export const platformSettingsSchema = z.object({
  'auth.registration_enabled': z.boolean(),
  /**
   * `replace`: login baru mencabut sesi lama (default, satu akun satu sesi).
   * `reject`: login baru ditolak selama masih ada sesi aktif.
   */
  'auth.session_policy': z.enum(['replace', 'reject']),
  'platform.maintenance_mode': z.boolean(),
  'platform.announcement': z.string().trim().max(500),
});

export type PlatformSettings = z.infer<typeof platformSettingsSchema>;

export const updatePlatformSettingsSchema = platformSettingsSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Kirim minimal satu pengaturan',
  });

export type UpdatePlatformSettingsInput = z.infer<typeof updatePlatformSettingsSchema>;

export interface PlatformSettingStamp {
  updatedAt: string;
  updatedBy: string | null;
}

export interface PlatformSettingsView {
  values: PlatformSettings;
  /** Kapan & oleh siapa tiap kunci terakhir diubah; null = masih default. */
  updated: Record<PlatformSettingKey, PlatformSettingStamp | null>;
}
