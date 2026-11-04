import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AdminSubscriptionsController } from './subscriptions.controller';
import { MeSubscriptionController } from './me.controller';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [AuditModule],
  controllers: [PlansController, AdminSubscriptionsController, MeSubscriptionController],
  providers: [PlansService, SubscriptionsService],
  exports: [PlansService, SubscriptionsService],
})
export class BillingModule {}
