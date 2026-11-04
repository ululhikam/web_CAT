import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  PLATFORM_SETTINGS_DEFAULTS,
  platformSettingsSchema,
  type PlatformSettingKey,
  type PlatformSettings,
  type PlatformSettingsView,
  type UpdatePlatformSettingsInput,
} from '@webcat/contracts';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface SettingsActor {
  id: string;
  ip?: string | null;
  userAgent?: string | null;
}

const KEYS = Object.keys(PLATFORM_SETTINGS_DEFAULTS) as PlatformSettingKey[];

/**
 * Sumber tunggal pengaturan platform.
 *
 * Nilai disimpan sebagai JSON per kunci di `platform_settings`; kunci yang
 * belum pernah diubah otomatis memakai default dari kontrak. Dengan begitu
 * penambahan kunci baru tidak memerlukan migrasi data.
 */
@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private defaults(): PlatformSettings {
    return { ...PLATFORM_SETTINGS_DEFAULTS };
  }

  async view(): Promise<PlatformSettingsView> {
    const rows = await this.prisma.platformSetting.findMany({
      where: { key: { in: KEYS } },
      select: { key: true, value: true, updatedAt: true, updatedBy: true },
    });

    const values = this.defaults();
    const updated = Object.fromEntries(KEYS.map((key) => [key, null])) as PlatformSettingsView['updated'];

    for (const row of rows) {
      const key = row.key as PlatformSettingKey;
      const parsed = platformSettingsSchema.shape[key].safeParse(row.value);
      if (parsed.success) {
        (values as Record<string, unknown>)[key] = parsed.data;
        updated[key] = {
          updatedAt: row.updatedAt.toISOString(),
          updatedBy: row.updatedBy,
        };
      }
    }

    return { values, updated };
  }

  /** Nilai satu kunci; dipakai modul lain (mis. auth untuk registrasi). */
  async value<K extends PlatformSettingKey>(key: K): Promise<PlatformSettings[K]> {
    const row = await this.prisma.platformSetting.findUnique({ where: { key } });
    if (!row) return this.defaults()[key];

    const parsed = platformSettingsSchema.shape[key].safeParse(row.value);
    return parsed.success ? (parsed.data as PlatformSettings[K]) : this.defaults()[key];
  }

  async update(input: UpdatePlatformSettingsInput, actor: SettingsActor): Promise<PlatformSettingsView> {
    const entries = Object.entries(input) as Array<[PlatformSettingKey, boolean | string]>;

    await this.prisma.$transaction(
      entries.map(([key, value]) =>
        this.prisma.platformSetting.upsert({
          where: { key },
          create: {
            key,
            value: value as Prisma.InputJsonValue,
            updatedBy: actor.id,
          },
          update: {
            value: value as Prisma.InputJsonValue,
            updatedBy: actor.id,
          },
        }),
      ),
    );

    await this.audit.record({
      actorUserId: actor.id,
      action: 'settings.updated',
      entityType: 'platform_setting',
      entityId: entries.map(([key]) => key).join(','),
      metadata: { keys: entries.map(([key]) => key), values: input },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.view();
  }
}
