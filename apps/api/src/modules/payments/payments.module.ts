import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { AdminTransactionsController } from './admin-transactions.controller';
import { CheckoutController } from './checkout.controller';
import { PaymentWebhookController } from './payment-webhook.controller';
import { PaymentsService } from './payments.service';

/**
 * Checkout, webhook, dan panel transaksi.
 *
 * `PAYMENT` di-inject dari `PortsModule` (global) sehingga implementasi
 * gateway bisa diganti tanpa menyentuh domain.
 */
@Module({
  imports: [BillingModule],
  controllers: [CheckoutController, PaymentWebhookController, AdminTransactionsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
