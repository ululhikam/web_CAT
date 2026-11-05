import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type {
  AdminSessionDetail,
  AdminSessionPage,
  AdminSessionQuery,
  ExamDashboardStats,
  ExamHistoryItem,
  ExamResultView,
  ExamStatsView,
  ForceUnlockInput,
  HistoryQuery,
  SessionStatus,
  VoidSessionInput,
} from '@webcat/contracts';
import {
  adminSessionQuerySchema,
  forceUnlockSchema,
  historyQuerySchema,
  voidSessionSchema,
} from '@webcat/contracts';
import { AuthUser } from '../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { zodPipe } from '../../core/http/validation.pipe';
import { ResultsService, type AdminActor } from './results.service';

function actorOf(user: AuthPrincipal, req: Request): AdminActor {
  return {
    id: user.id,
    ip: req.ip ?? null,
    userAgent: req.headers['user-agent'] ?? null,
  };
}

@ApiTags('Exams: Results')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@RequirePermissions('exam.take')
@Controller('exams')
export class ResultsController {
  constructor(private readonly results: ResultsService) {}

  @Get('sessions/:id/result')
  @ApiOperation({ summary: 'Hasil lengkap per subtes (setelah selesai/gugur)' })
  result(@AuthUser() user: AuthPrincipal, @Param('id') sessionId: string): Promise<ExamResultView> {
    return this.results.getResult(user.id, sessionId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Riwayat sesi ujian peserta (cursor pagination)' })
  history(
    @AuthUser() user: AuthPrincipal,
    @Query(zodPipe(historyQuerySchema)) query: HistoryQuery,
  ): Promise<{ items: ExamHistoryItem[]; nextCursor: string | null; hasMore: boolean }> {
    return this.results.history(user.id, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistik dan tren hasil ujian peserta' })
  stats(@AuthUser() user: AuthPrincipal): Promise<ExamStatsView> {
    return this.results.stats(user.id);
  }
}

@ApiTags('Admin: Exam Monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminResultsController {
  constructor(private readonly results: ResultsService) {}

  @Get('exam-sessions')
  @RequirePermissions('exams.monitor')
  @ApiOperation({ summary: 'Daftar sesi ujian untuk monitoring' })
  list(
    @Query(zodPipe(adminSessionQuerySchema)) query: AdminSessionQuery,
  ): Promise<AdminSessionPage> {
    return this.results.adminList(query);
  }

  @Get('exam-sessions/:id')
  @RequirePermissions('exams.monitor')
  @ApiOperation({ summary: 'Detail sesi ujian (proctoring & pelanggaran)' })
  detail(@Param('id') sessionId: string): Promise<AdminSessionDetail> {
    return this.results.adminDetail(sessionId);
  }

  @Post('exam-sessions/:id/void')
  @RequirePermissions('exams.monitor')
  @ApiOperation({ summary: 'Batalkan sesi ujian (void, data tetap tersimpan)' })
  voidSession(
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
    @Param('id') sessionId: string,
    @Body(zodPipe(voidSessionSchema)) input: VoidSessionInput,
  ): Promise<{ sessionId: string; status: SessionStatus }> {
    return this.results.voidSession(sessionId, input.reason, actorOf(user, req));
  }

  @Post('exam-sessions/:id/recompute')
  @RequirePermissions('exams.recompute')
  @ApiOperation({ summary: 'Hitung ulang skor sesi dari snapshot (deterministik)' })
  recompute(
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
    @Param('id') sessionId: string,
  ): Promise<{ sessionId: string; scoringVersion: number }> {
    return this.results.recompute(sessionId, actorOf(user, req));
  }

  @Post('exam-sessions/:id/subtests/:subId/unlock')
  @RequirePermissions('exams.force_unlock')
  @ApiOperation({ summary: 'Buka paksa subtes yang terkunci (SUPER_ADMIN)' })
  unlock(
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
    @Param('id') sessionId: string,
    @Param('subId') subtestId: string,
    @Body(zodPipe(forceUnlockSchema)) input: ForceUnlockInput,
  ): Promise<{ sessionId: string; subtestId: string; status: 'ACTIVE'; endsAt: string }> {
    return this.results.forceUnlock(sessionId, subtestId, input.reason, actorOf(user, req));
  }

  @Get('dashboard/exams')
  @RequirePermissions('exams.monitor')
  @ApiOperation({ summary: 'Ringkasan dashboard ujian' })
  dashboard(): Promise<ExamDashboardStats> {
    return this.results.adminDashboard();
  }
}
