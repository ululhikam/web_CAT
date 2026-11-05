import { Module } from '@nestjs/common';
import { DevStorageController } from './dev-storage.controller';
import { MediaContentController, MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  controllers: [MediaController, MediaContentController, DevStorageController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
