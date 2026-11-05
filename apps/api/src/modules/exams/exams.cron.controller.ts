import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../../core/auth/decorators/public.decorator';
import { CronAuthGuard } from '../../core/cron/cron-auth.guard';
import { ExamFinalizerService } from './exam-finalizer.service';

/**
 * Cron B3. Endpoint ini sengaja didaftarkan modul `exams` (bukan mengubah
 * `core/cron/cron.controller.ts`) dan menimpa stub `finalize-subtests` pada
 * `CronModule` karena modul ini diimpor lebih dahulu di `AppModule`.
 *
 * Aman dipanggil berkali-kali: finalisasi memakai advisory lock + status
 * terminal, sehingga tidak ada double scoring.
 */
@ApiExcludeController()
@Public()
@UseGuards(CronAuthGuard)
@Controller('internal/cron')
export class ExamsCronController {
  constructor(private readonly finalizer: ExamFinalizerService) {}

  @Post('finalize-subtests')
  async finalizeSubtests(): Promise<{
    job: string;
    processed: number;
    details: Record<string, unknown>;
  }> {
    const result = await this.finalizer.finalizeExpiredBatch(100);
    return {
      job: 'finalize-subtests',
      processed: result.processed,
      details: {
        expired: result.expired,
        abandoned: result.abandoned,
        owner: 'B3',
      },
    };
  }
}
