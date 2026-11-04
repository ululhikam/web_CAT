import { Module } from '@nestjs/common';
import { CronController } from './cron.controller';
import { CronAuthGuard } from './cron-auth.guard';

@Module({
  controllers: [CronController],
  providers: [CronAuthGuard],
})
export class CronModule {}
