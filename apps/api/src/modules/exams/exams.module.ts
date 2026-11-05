import { Module } from '@nestjs/common';
import { ScoringModule } from '../scoring/scoring.module';
import { AdminExamsController } from './admin-exams.controller';
import { ExamConfigService } from './exam-config.service';
import { ExamFinalizerService } from './exam-finalizer.service';
import { ExamQuestionProjection } from './exam-question-projection';
import { ExamQuestionSource } from './exam-question-source';
import { ExamSessionService } from './exam-session.service';
import { ExamsCronController } from './exams.cron.controller';
import { ExamsController } from './exams.controller';

@Module({
  imports: [ScoringModule],
  controllers: [ExamsController, AdminExamsController, ExamsCronController],
  providers: [
    ExamConfigService,
    ExamQuestionSource,
    ExamQuestionProjection,
    ExamFinalizerService,
    ExamSessionService,
  ],
  exports: [ExamConfigService, ExamFinalizerService, ExamSessionService],
})
export class ExamsModule {}
