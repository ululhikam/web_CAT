import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import {
  IMPORT_MAX_BYTES,
  importCommitSchema,
  importCreateSchema,
  importItemUpdateSchema,
  importListQuerySchema,
  importPreviewQuerySchema,
  type ImportCommitInput,
  type ImportCommitResult,
  type ImportCreateInput,
  type ImportItemUpdateInput,
  type ImportItemView,
  type ImportJobListResponse,
  type ImportJobView,
  type ImportListQuery,
  type ImportPreviewQuery,
  type ImportPreviewResponse,
} from '@webcat/contracts';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { AuthUser } from '../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { EmailVerifiedGuard } from '../../core/auth/email-verified.guard';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import { zodPipe } from '../../core/http/validation.pipe';
import { ImportsService } from './imports.service';

function actor(user: AuthPrincipal, req: Request) {
  return {
    id: user.id,
    role: user.role,
    ip: req.ip ?? null,
    userAgent: req.headers['user-agent'] ?? null,
  };
}

/**
 * Impor soal (spreadsheet & dokumen).
 *
 * Semua endpoint admin-only dan wajib permission `questions.import`.
 * Hasil impor maksimum berstatus REVIEW — tidak ada auto-publish.
 *
 * ADMIN hanya melihat job impor miliknya sendiri; SUPER_ADMIN melihat semua
 * job beserta admin pembuatnya.
 */
@ApiTags('Admin — Imports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmailVerifiedGuard, PermissionsGuard)
@Controller('admin/imports')
export class ImportsController {
  constructor(private readonly imports: ImportsService) {}

  @RequirePermissions('questions.import')
  @Get()
  list(
    @Query(zodPipe(importListQuerySchema)) query: ImportListQuery,
    @AuthUser() user: AuthPrincipal,
  ): Promise<ImportJobListResponse> {
    return this.imports.list(query, user);
  }

  @RequirePermissions('questions.import')
  @Get('template.xlsx')
  async template(@Res() res: Response): Promise<void> {
    const buffer = await this.imports.template();
    res.setHeader(
      'content-type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('content-disposition', 'attachment; filename="template-import-soal.xlsx"');
    res.setHeader('cache-control', 'private, max-age=60');
    res.end(buffer);
  }

  @RequirePermissions('questions.import')
  @Post()
  @HttpCode(201)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
        { name: 'assets', maxCount: 1 },
      ],
      { limits: { fileSize: IMPORT_MAX_BYTES } },
    ),
  )
  create(
    @UploadedFiles()
    files: { file?: Express.Multer.File[]; assets?: Express.Multer.File[] },
    @Body(zodPipe(importCreateSchema)) body: ImportCreateInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<ImportJobView> {
    return this.imports.create(
      {
        file: files.file?.[0] as Express.Multer.File,
        assets: files.assets?.[0],
        settings: {
          targetStageCode: body.targetStageCode,
          targetSubtestCode: body.targetSubtestCode,
          categoryId: body.categoryId,
          defaultType: body.defaultType,
          defaultDifficulty: body.defaultDifficulty,
          dedupeMode: body.dedupeMode,
          autoDetect: body.autoDetect,
        },
      },
      actor(user, req),
    );
  }

  @RequirePermissions('questions.import')
  @Get(':id')
  detail(@Param('id') id: string, @AuthUser() user: AuthPrincipal): Promise<ImportJobView> {
    return this.imports.getById(id, user);
  }

  @RequirePermissions('questions.import')
  @Get(':id/preview')
  preview(
    @Param('id') id: string,
    @Query(zodPipe(importPreviewQuerySchema)) query: ImportPreviewQuery,
    @AuthUser() user: AuthPrincipal,
  ): Promise<ImportPreviewResponse> {
    return this.imports.preview(id, query, user);
  }

  @RequirePermissions('questions.import')
  @Post(':id/preview')
  @HttpCode(200)
  previewPost(
    @Param('id') id: string,
    @Body(zodPipe(importPreviewQuerySchema)) body: ImportPreviewQuery,
    @AuthUser() user: AuthPrincipal,
  ): Promise<ImportPreviewResponse> {
    return this.imports.preview(id, body, user);
  }

  @RequirePermissions('questions.import')
  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body(zodPipe(importItemUpdateSchema)) body: ImportItemUpdateInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<ImportItemView> {
    return this.imports.updateItem(id, itemId, body, actor(user, req));
  }

  @RequirePermissions('questions.import')
  @Post(':id/commit')
  @HttpCode(200)
  commit(
    @Param('id') id: string,
    @Body(zodPipe(importCommitSchema)) body: ImportCommitInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<ImportCommitResult> {
    return this.imports.commit(id, body, actor(user, req));
  }

  @RequirePermissions('questions.import')
  @Post(':id/cancel')
  @HttpCode(200)
  cancel(
    @Param('id') id: string,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<ImportJobView> {
    return this.imports.cancel(id, actor(user, req));
  }

  @RequirePermissions('questions.import')
  @Get(':id/errors')
  errors(
    @Param('id') id: string,
    @AuthUser() user: AuthPrincipal,
  ): Promise<Array<{ rowNumber: number | null; code: string; message: string }>> {
    return this.imports.listErrors(id, user);
  }

  @RequirePermissions('questions.import')
  @Get(':id/errors.csv')
  async errorsCsv(
    @Param('id') id: string,
    @AuthUser() user: AuthPrincipal,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.imports.errorsCsv(id, user);
    res.setHeader('content-type', 'text/csv; charset=utf-8');
    res.setHeader('content-disposition', `attachment; filename="import-${id}-errors.csv"`);
    res.end(`\ufeff${csv}`);
  }
}
