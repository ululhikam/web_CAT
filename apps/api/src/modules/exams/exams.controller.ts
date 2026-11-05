import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  ActiveSessionResponse,
  AutosaveResponse,
  ExamEligibility,
  ExamQuestionPage,
  HeartbeatResponse,
} from '@webcat/contracts';
import {
  autosaveAnswersSchema,
  examQuestionsQuerySchema,
  finishSubtestSchema,
  heartbeatSchema,
  startExamSessionSchema,
  type AutosaveAnswersInput,
  type ExamQuestionsQuery,
  type StartExamSessionInput,
} from '@webcat/contracts';
import { AuthUser } from '../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { zodPipe } from '../../core/http/validation.pipe';
import { ExamSessionService } from './exam-session.service';

/**
 * ADMIN/SUPER_ADMIN boleh mengerjakan semua tes tanpa langganan aktif dan
 * tanpa batas kuota harian. Ini hanya soal akses; seluruh guard teknis sesi
 * (satu sesi aktif, ketersediaan bank soal) tetap berlaku.
 */
function isPrivileged(role: AuthPrincipal['role']): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

@ApiTags('Exams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@RequirePermissions('exam.take')
@Controller('exams')
export class ExamsController {
  constructor(private readonly sessions: ExamSessionService) {}

  @Get('eligibility')
  @ApiOperation({ summary: 'Cek apakah peserta boleh memulai sesi ujian' })
  eligibility(@AuthUser() user: AuthPrincipal): Promise<ExamEligibility> {
    return this.sessions.getEligibility(user.id, { privileged: isPrivileged(user.role) });
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Mulai sesi ujian baru (materialisasi konfigurasi)' })
  start(
    @AuthUser() user: AuthPrincipal,
    @Body(zodPipe(startExamSessionSchema)) input: StartExamSessionInput,
  ): Promise<ActiveSessionResponse> {
    return this.sessions.startSession(
      user.id,
      { stageCode: input.stageCode },
      { privileged: isPrivileged(user.role) },
    );
  }

  @Get('sessions/active')
  @ApiOperation({ summary: 'Ambil sesi aktif untuk resume' })
  active(@AuthUser() user: AuthPrincipal): Promise<ActiveSessionResponse> {
    return this.sessions.getActiveSession(user.id);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Ringkasan sesi milik peserta' })
  detail(
    @AuthUser() user: AuthPrincipal,
    @Param('id') sessionId: string,
  ): Promise<ActiveSessionResponse> {
    return this.sessions.getSession(user.id, sessionId);
  }

  @Post('sessions/:id/stages/:stageId/subtests/:subId/open')
  @ApiOperation({ summary: 'Buka subtes: mulai timer dan materialisasi soal' })
  open(
    @AuthUser() user: AuthPrincipal,
    @Param('id') sessionId: string,
    @Param('stageId') stageId: string,
    @Param('subId') subtestId: string,
  ): Promise<ActiveSessionResponse> {
    return this.sessions.openSubtest(user.id, sessionId, stageId, subtestId, {
      privileged: isPrivileged(user.role),
    });
  }

  @Get('sessions/:id/subtests/:subId/questions')
  @ApiOperation({ summary: 'Ambil batch soal (tanpa kunci jawaban)' })
  questions(
    @AuthUser() user: AuthPrincipal,
    @Param('id') sessionId: string,
    @Param('subId') subtestId: string,
    @Query(zodPipe(examQuestionsQuerySchema)) query: ExamQuestionsQuery,
  ): Promise<ExamQuestionPage> {
    return this.sessions.getQuestions(user.id, sessionId, subtestId, query);
  }

  @Patch('sessions/:id/subtests/:subId/answers')
  @ApiOperation({ summary: 'Autosave batch jawaban (idempoten per clientSeq)' })
  autosave(
    @AuthUser() user: AuthPrincipal,
    @Param('id') sessionId: string,
    @Param('subId') subtestId: string,
    @Body(zodPipe(autosaveAnswersSchema)) input: AutosaveAnswersInput,
  ): Promise<AutosaveResponse> {
    return this.sessions.autosave(user.id, sessionId, subtestId, input);
  }

  @Post('sessions/:id/subtests/:subId/finish')
  @ApiOperation({ summary: 'Selesaikan subtes lebih awal' })
  finish(
    @AuthUser() user: AuthPrincipal,
    @Param('id') sessionId: string,
    @Param('subId') subtestId: string,
    @Body(zodPipe(finishSubtestSchema)) _input: { clientSeq?: number },
  ): Promise<ActiveSessionResponse> {
    return this.sessions.finishSubtest(user.id, sessionId, subtestId);
  }

  @Post('sessions/:id/heartbeat')
  @ApiOperation({ summary: 'Sinkronisasi waktu dan status kunci' })
  heartbeat(
    @AuthUser() user: AuthPrincipal,
    @Param('id') sessionId: string,
    @Body(zodPipe(heartbeatSchema)) _input: { clientTime?: Date },
  ): Promise<HeartbeatResponse> {
    return this.sessions.heartbeat(user.id, sessionId);
  }
}
