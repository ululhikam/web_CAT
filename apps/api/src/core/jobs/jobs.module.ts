import { Global, Module } from '@nestjs/common';
import { JobQueueService } from './job-queue.service';
import { OutboxService } from './outbox.service';

@Global()
@Module({
  providers: [JobQueueService, OutboxService],
  exports: [JobQueueService, OutboxService],
})
export class JobsModule {}
