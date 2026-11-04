import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { QuestionsModule } from '../questions/questions.module';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';

@Module({
  imports: [MediaModule, QuestionsModule],
  controllers: [ImportsController],
  providers: [ImportsService],
  exports: [ImportsService],
})
export class ImportsModule {}