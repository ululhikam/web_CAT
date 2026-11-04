import type { PrismaClient } from '@prisma/client';
import { PLATFORM_SETTINGS_DEFAULTS } from '@webcat/contracts';

/**
 * Menanam nilai awal pengaturan platform.
 *
 * `update: {}` sengaja kosong: seed berulang tidak boleh menimpa perubahan
 * yang sudah dibuat SUPER_ADMIN lewat UI.
 */
export async function seedPlatformSettings(prisma: PrismaClient): Promise<void> {
  for (const [key, value] of Object.entries(PLATFORM_SETTINGS_DEFAULTS)) {
    await prisma.platformSetting.upsert({
      where: { key },
      create: { key, value: value as never },
      update: {},
    });
  }
}
