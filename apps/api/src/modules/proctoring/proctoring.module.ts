import { Module } from '@nestjs/common';
import { ExamsModule } from '../exams/exams.module';
import { ProctoringController } from './proctoring.controller';
import { ProctoringService } from './proctoring.service';

@Module({
  imports: [ExamsModule],
  controllers: [ProctoringController],
  providers: [ProctoringService],
  exports: [ProctoringService],
})
export class ProctoringModule {}
