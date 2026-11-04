import { Module } from '@nestjs/common';
import { BillingModule } from '../../modules/billing/billing.module';
import { PaymentsModule } from '../../modules/payments/payments.module';
import { CronAuthGuard } from './cron-auth.guard';
import { CronController } from './cron.controller';

/**
 * Menjalankan pekerjaan terjadwal. Modul domain di-import agar service-nya
 * bisa dipakai langsung; controller tidak menyentuh logika domain.
 */
@Module({
  imports: [BillingModule, PaymentsModule],
  controllers: [CronController],
  providers: [CronAuthGuard],
})
export class CronModule {}
