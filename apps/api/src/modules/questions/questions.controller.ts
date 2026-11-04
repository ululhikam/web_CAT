import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  bulkQuestionActionSchema,
  mediaAttachSchema,
  questionCreateSchema,
  questionListQuerySchema,
  questionPreviewSchema,
  questionUpdateSchema,
  type BulkQuestionActionInput,
  type BulkQuestionActionResult,
  type MediaAttachInput,
  type QuestionCreateInput,
  type QuestionListQuery,
  type QuestionListResponse,
  type QuestionPreviewInput,
  type QuestionPreviewResult,
  type QuestionStatsResponse,
  type QuestionUpdateInput,
  type QuestionView,
} from '@webcat/contracts';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { AuthUser } from '../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { EmailVerifiedGuard } from '../../core/auth/email-verified.guard';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import { zodPipe } from '../../core/http/validation.pipe';
import { QuestionsService } from './questions.service';

@ApiTags('Admin — Questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmailVerifiedGuard, PermissionsGuard)
@Controller('admin/questions')
export class QuestionsController {
  constructor(private readonly questions: QuestionsService) {}

  private actor(user: AuthPrincipal, req: Request) {
    return { id: user.id, ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
  }

  @RequirePermissions('questions.read')
  @Get()
  list(@Query(zodPipe(questionListQuerySchema)) query: QuestionListQuery): Promise<QuestionListResponse> {
    return this.questions.list(query);
  }

  @RequirePermissions('questions.read')
  @Get('stats')
  stats(): Promise<QuestionStatsResponse> {
    return this.questions.stats();
  }

  @RequirePermissions('questions.write')
  @Post('preview')
  preview(@Body(zodPipe(questionPreviewSchema)) body: QuestionPreviewInput): Promise<QuestionPreviewResult> {
    return this.questions.preview(body);
  }

  @RequirePermissions('questions.publish')
  @Post('bulk-action')
  bulkAction(
    @Body(zodPipe(bulkQuestionActionSchema)) body: BulkQuestionActionInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<BulkQuestionActionResult> {
    return this.questions.bulkAction(body, this.actor(user, req));
  }

  @RequirePermissions('questions.write')
  @Post()
  create(
    @Body(zodPipe(questionCreateSchema)) body: QuestionCreateInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<QuestionView> {
    return this.questions.create(body, this.actor(user, req));
  }

  @RequirePermissions('questions.read')
  @Get(':id')
  detail(@Param('id') id: string): Promise<QuestionView> {
    return this.questions.getById(id);
  }

  @RequirePermissions('questions.write')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(zodPipe(questionUpdateSchema)) body: QuestionUpdateInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<QuestionView> {
    return this.questions.update(id, body, this.actor(user, req));
  }

  @RequirePermissions('questions.write')
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<{ deleted: boolean }> {
    return this.questions.remove(id, this.actor(user, req));
  }

  @RequirePermissions('questions.publish')
  @Post(':id/publish')
  publish(
    @Param('id') id: string,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<QuestionView> {
    return this.questions.publish(id, this.actor(user, req));
  }

  @RequirePermissions('questions.write')
  @Post(':id/media')
  attachMedia(
    @Param('id') id: string,
    @Body(zodPipe(mediaAttachSchema)) body: MediaAttachInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<QuestionView> {
    return this.questions.attachMedia(id, body, this.actor(user, req));
  }

  @RequirePermissions('questions.write')
  @Delete(':id/media/:mediaId')
  detachMedia(
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<QuestionView> {
    return this.questions.detachMedia(id, mediaId, this.actor(user, req));
  }
}
