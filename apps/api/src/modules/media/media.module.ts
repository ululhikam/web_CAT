import { Module } from '@nestjs/common';
import { MediaContentController, MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  controllers: [MediaController, MediaContentController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}