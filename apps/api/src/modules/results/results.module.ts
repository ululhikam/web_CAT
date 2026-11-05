import { Module } from '@nestjs/common';
import { ExamsModule } from '../exams/exams.module';
import { AdminResultsController, ResultsController } from './results.controller';
import { ResultsService } from './results.service';

@Module({
  imports: [ExamsModule],
  controllers: [ResultsController, AdminResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
