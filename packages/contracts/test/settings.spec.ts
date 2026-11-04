import { describe, expect, it } from 'vitest';
import {
  PLATFORM_SETTINGS_DEFAULTS,
  platformSettingsSchema,
  updatePlatformSettingsSchema,
} from '../src/settings/index';

describe('platform settings', () => {
  it('default menutup pendaftaran mandiri, memakai policy replace, dan mode pemeliharaan mati', () => {
    expect(PLATFORM_SETTINGS_DEFAULTS['auth.registration_enabled']).toBe(false);
    expect(PLATFORM_SETTINGS_DEFAULTS['auth.session_policy']).toBe('replace');
    expect(PLATFORM_SETTINGS_DEFAULTS['platform.maintenance_mode']).toBe(false);
    expect(PLATFORM_SETTINGS_DEFAULTS['platform.announcement']).toBe('');
  });

  it('memvalidasi seluruh nilai yang dikirim', () => {
    const parsed = platformSettingsSchema.parse({
      'auth.registration_enabled': true,
      'auth.session_policy': 'reject',
      'platform.maintenance_mode': false,
      'platform.announcement': '  Ujian serentak Senin  ',
    });

    expect(parsed['platform.announcement']).toBe('Ujian serentak Senin');
    expect(parsed['auth.session_policy']).toBe('reject');
  });

  it('menolak tipe nilai yang salah', () => {
    expect(
      platformSettingsSchema.safeParse({
        'auth.registration_enabled': 'true',
        'auth.session_policy': 'replace',
        'platform.maintenance_mode': false,
        'platform.announcement': '',
      }).success,
    ).toBe(false);
  });

  it('menolak policy sesi di luar replace/reject', () => {
    expect(
      platformSettingsSchema.safeParse({
        'auth.registration_enabled': false,
        'auth.session_policy': 'allow-all',
        'platform.maintenance_mode': false,
        'platform.announcement': '',
      }).success,
    ).toBe(false);
  });

  it('menolak pengumuman lebih dari 500 karakter', () => {
    expect(
      platformSettingsSchema.safeParse({
        'auth.registration_enabled': false,
        'auth.session_policy': 'replace',
        'platform.maintenance_mode': false,
        'platform.announcement': 'x'.repeat(501),
      }).success,
    ).toBe(false);
  });

  it('update parsial menerima satu kunci dan menolak objek kosong', () => {
    expect(updatePlatformSettingsSchema.parse({ 'auth.session_policy': 'reject' })).toEqual({
      'auth.session_policy': 'reject',
    });
    expect(updatePlatformSettingsSchema.safeParse({}).success).toBe(false);
  });
});
