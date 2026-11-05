import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { QuestionsModule } from '../questions/questions.module';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { MediaZipImportController } from './media-zip.controller';
import { MediaZipImportService } from './media-zip.service';

@Module({
  imports: [MediaModule, QuestionsModule],
  controllers: [ImportsController, MediaZipImportController],
  providers: [ImportsService, MediaZipImportService],
  exports: [ImportsService],
})
export class ImportsModule {}