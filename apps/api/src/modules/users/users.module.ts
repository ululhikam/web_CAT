import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { MeProfileController, UsersMeController } from './me.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [BillingModule],
  controllers: [UsersController, UsersMeController, MeProfileController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
