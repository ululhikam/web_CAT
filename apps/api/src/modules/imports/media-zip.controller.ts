import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  MEDIA_ZIP_MAX_BYTES,
  mediaZipApplyBodySchema,
  mediaZipResolveSchema,
  type MediaZipApplyBody,
  type MediaZipApplyResult,
  type MediaZipPreviewResponse,
  type MediaZipQuestionRef,
  type MediaZipResolveInput,
} from '@webcat/contracts';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { AuthUser } from '../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { EmailVerifiedGuard } from '../../core/auth/email-verified.guard';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import { ApiFileFields } from '../../core/http/api-file-fields.decorator';
import { zodPipe } from '../../core/http/validation.pipe';
import { MediaZipImportService } from './media-zip.service';

function actor(user: AuthPrincipal, req: Request) {
  return { id: user.id, ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

/**
 * F5-14 — impor ZIP gambar dengan pemetaan manual.
 *
 * Dua langkah supaya admin bisa memeriksa sebelum menulis: `preview` membaca
 * ZIP dan melaporkan per berkas, `apply` menyimpan media lalu memasangnya ke
 * soal/opsi. Tidak ada job impor yang dibuat karena tidak ada soal baru.
 *
 * Path sengaja di bawah `admin/media` (bukan `admin/imports`) agar tidak
 * bertabrakan dengan route `admin/imports/:id/*` milik impor soal.
 */
@ApiTags('Admin — Media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmailVerifiedGuard, PermissionsGuard)
@Controller('admin/media/import')
export class MediaZipImportController {
  constructor(private readonly imports: MediaZipImportService) {}

  @RequirePermissions('questions.import')
  @Post('preview')
  @HttpCode(200)
  @ApiOperation({ summary: 'Pindai ZIP gambar tanpa menyimpan apa pun' })
  @ApiConsumes('multipart/form-data')
  @ApiFileFields('file')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MEDIA_ZIP_MAX_BYTES } }))
  preview(@UploadedFile() file: Express.Multer.File): Promise<MediaZipPreviewResponse> {
    return this.imports.preview(file);
  }

  @RequirePermissions('questions.import')
  @Post('apply')
  @HttpCode(200)
  @ApiOperation({ summary: 'Simpan gambar dari ZIP dan pasang sesuai pemetaan' })
  @ApiConsumes('multipart/form-data')
  @ApiFileFields('file')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MEDIA_ZIP_MAX_BYTES } }))
  apply(
    @UploadedFile() file: Express.Multer.File,
    @Body(zodPipe(mediaZipApplyBodySchema)) body: MediaZipApplyBody,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<MediaZipApplyResult> {
    return this.imports.apply(file, body.mapping.mappings, actor(user, req));
  }

  @RequirePermissions('questions.read')
  @Get('questions')
  @ApiOperation({ summary: 'Cari soal untuk pemetaan gambar' })
  search(@Query('q') q: string): Promise<MediaZipQuestionRef[]> {
    return this.imports.searchQuestions(q ?? '');
  }

  @RequirePermissions('questions.read')
  @Post('questions/resolve')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cari beberapa soal sekaligus berdasarkan kode' })
  resolve(
    @Body(zodPipe(mediaZipResolveSchema)) body: MediaZipResolveInput,
  ): Promise<MediaZipQuestionRef[]> {
    return this.imports.resolveQuestions(body.codes);
  }
}
