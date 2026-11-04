import { Global, Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

/**
 * Global agar modul lain (auth, dll.) dapat membaca pengaturan platform tanpa
 * mengimpor ulang dan tanpa risiko circular dependency.
 */
@Global()
@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
