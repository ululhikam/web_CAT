import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type {
  CreateSubtestInput,
  ExamSettingsView,
  StagePlan,
  SubtestPlan,
  UpdateExamSettingsInput,
  UpdateExamStageInput,
  UpdateSubtestInput,
} from '@webcat/contracts';
import {
  createSubtestSchema,
  updateExamSettingsSchema,
  updateExamStageSchema,
  updateSubtestSchema,
} from '@webcat/contracts';
import { AuthUser } from '../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { zodPipe } from '../../core/http/validation.pipe';
import { ExamConfigService, type ActorContext } from './exam-config.service';

function actorOf(user: AuthPrincipal, req: Request): ActorContext {
  return {
    id: user.id,
    ip: req.ip ?? null,
    userAgent: req.headers['user-agent'] ?? null,
  };
}

@ApiTags('Admin: Exams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@RequirePermissions('exams.config')
@Controller('admin')
export class AdminExamsController {
  constructor(private readonly config: ExamConfigService) {}

  @Get('exam-stages')
  @ApiOperation({ summary: 'Daftar stage & subtes ujian (termasuk nonaktif)' })
  stages(): Promise<StagePlan[]> {
    return this.config.getAdminStages();
  }

  @Patch('exam-stages/:id')
  @ApiOperation({ summary: 'Ubah konfigurasi stage ujian' })
  updateStage(
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
    @Param('id') stageId: string,
    @Body(zodPipe(updateExamStageSchema)) input: UpdateExamStageInput,
  ): Promise<StagePlan> {
    return this.config.updateStage(stageId, input, actorOf(user, req));
  }

  @Get('subtests')
  @ApiOperation({ summary: 'Daftar subtes ujian' })
  subtests(): Promise<SubtestPlan[]> {
    return this.config.getAdminSubtests();
  }

  @Post('subtests')
  @ApiOperation({ summary: 'Tambah subtes ujian' })
  createSubtest(
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
    @Body(zodPipe(createSubtestSchema)) input: CreateSubtestInput,
  ): Promise<SubtestPlan> {
    return this.config.createSubtest(input, actorOf(user, req));
  }

  @Patch('subtests/:id')
  @ApiOperation({ summary: 'Ubah konfigurasi subtes' })
  updateSubtest(
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
    @Param('id') subtestId: string,
    @Body(zodPipe(updateSubtestSchema)) input: UpdateSubtestInput,
  ): Promise<SubtestPlan> {
    return this.config.updateSubtest(subtestId, input, actorOf(user, req));
  }

  @Get('exam-settings')
  @ApiOperation({ summary: 'Pengaturan global ujian' })
  settings(): Promise<ExamSettingsView> {
    return this.config.getSettings();
  }

  @Patch('exam-settings')
  @ApiOperation({ summary: 'Ubah pengaturan global ujian' })
  updateSettings(
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
    @Body(zodPipe(updateExamSettingsSchema)) input: UpdateExamSettingsInput,
  ): Promise<ExamSettingsView> {
    return this.config.updateSettings(input, actorOf(user, req));
  }
}
