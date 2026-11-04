import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AdminPlansController } from './admin-plans.controller';
import { BillingExpiryService } from './billing-expiry.service';
import { MeSubscriptionsController } from './me.controller';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { AdminSubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

/**
 * Domain harga & langganan.
 *
 * `PlansService` diekspor karena checkout membaca ulang harga dari database,
 * `SubscriptionsService` karena payments mengaktifkan langganan setelah
 * pembayaran sah, dan `BillingExpiryService` karena dipakai cron.
 */
@Module({
  imports: [AuditModule],
  controllers: [
    PlansController,
    AdminPlansController,
    AdminSubscriptionsController,
    MeSubscriptionsController,
  ],
  providers: [PlansService, SubscriptionsService, BillingExpiryService],
  exports: [PlansService, SubscriptionsService, BillingExpiryService],
})
export class BillingModule {}
