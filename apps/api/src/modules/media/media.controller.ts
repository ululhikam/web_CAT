import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import {
  MEDIA_MAX_BYTES,
  mediaConfirmSchema,
  mediaListQuerySchema,
  mediaUploadUrlSchema,
  type MediaAssetView,
  type MediaConfirmInput,
  type MediaListQuery,
  type MediaListResponse,
  type MediaUploadUrlInput,
  type MediaUploadUrlResponse,
} from '@webcat/contracts';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { AuthUser } from '../../core/auth/decorators/current-user.decorator';
import { Public } from '../../core/auth/decorators/public.decorator';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { EmailVerifiedGuard } from '../../core/auth/email-verified.guard';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import { zodPipe } from '../../core/http/validation.pipe';
import { MediaService } from './media.service';

function actor(user: AuthPrincipal, req: Request) {
  return { id: user.id, ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

@ApiTags('Admin — Media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmailVerifiedGuard, PermissionsGuard)
@Controller('admin/media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @RequirePermissions('questions.read')
  @Get()
  list(
    @Query(zodPipe(mediaListQuerySchema)) query: MediaListQuery,
  ): Promise<MediaListResponse> {
    return this.media.list(query);
  }

  @RequirePermissions('questions.write')
  @Post('upload-url')
  @HttpCode(200)
  uploadUrl(
    @Body(zodPipe(mediaUploadUrlSchema)) body: MediaUploadUrlInput,
  ): Promise<MediaUploadUrlResponse> {
    return this.media.createUploadUrl(body);
  }

  @RequirePermissions('questions.write')
  @Post('confirm')
  @HttpCode(200)
  confirm(
    @Body(zodPipe(mediaConfirmSchema)) body: MediaConfirmInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<MediaAssetView> {
    return this.media.confirm(body, actor(user, req));
  }

  @RequirePermissions('questions.write')
  @Post('upload')
  @HttpCode(201)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MEDIA_MAX_BYTES } }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<MediaAssetView> {
    return this.media.upload(file, actor(user, req));
  }

  @RequirePermissions('questions.read')
  @Get(':id/preview')
  async preview(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const content = await this.media.contentForAdmin(id);
    if (content.data) {
      res.setHeader('content-type', content.mime);
      res.setHeader('cache-control', 'private, max-age=300');
      res.end(content.data);
      return;
    }
    if (content.url) {
      res.redirect(302, content.url);
      return;
    }
    res.status(404).end();
  }

  @RequirePermissions('questions.write')
  @Delete(':id')
  @HttpCode(200)
  remove(
    @Param('id') id: string,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<{ deleted: boolean }> {
    return this.media.remove(id, actor(user, req));
  }
}

/**
 * Endpoint publik untuk konten media ber-signature.
 *
 * Tidak memakai guard JWT: URL sudah HMAC dan berumur pendek sehingga aman
 * dipakai di `<img src>` pada halaman ujian.
 */
@ApiTags('Media')
@Public()
@Controller('media')
export class MediaContentController {
  constructor(private readonly media: MediaService) {}

  @Get(':id/content')
  async content(
    @Param('id') id: string,
    @Query('exp') exp: string,
    @Query('sig') sig: string,
    @Res() res: Response,
  ): Promise<void> {
    const content = await this.media.content(id, Number(exp), sig ?? '');
    if (content.data) {
      res.setHeader('content-type', content.mime);
      res.setHeader('cache-control', 'public, max-age=300, immutable');
      res.end(content.data);
      return;
    }
    if (content.url) {
      res.redirect(302, content.url);
      return;
    }
    res.status(404).end();
  }
}