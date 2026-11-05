import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { ProctoringBatchInput, ProctoringBatchResponse } from '@webcat/contracts';
import { proctoringBatchSchema } from '@webcat/contracts';
import { AuthUser } from '../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { zodPipe } from '../../core/http/validation.pipe';
import { ProctoringService } from './proctoring.service';

@ApiTags('Exams: Proctoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@RequirePermissions('exam.take')
@Controller('exams')
export class ProctoringController {
  constructor(private readonly proctoring: ProctoringService) {}

  @Post('sessions/:id/events')
  @ApiOperation({ summary: 'Kirim batch sinyal proctoring (dedupe per clientEventId)' })
  record(
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
    @Param('id') sessionId: string,
    @Body(zodPipe(proctoringBatchSchema)) input: ProctoringBatchInput,
  ): Promise<ProctoringBatchResponse> {
    return this.proctoring.recordEvents(user.id, sessionId, input, {
      id: user.id,
      ip: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }
}
