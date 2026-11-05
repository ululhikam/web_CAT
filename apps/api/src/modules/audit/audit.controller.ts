import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  auditLogQuerySchema,
  type AuditLogItem,
  type AuditLogQuery,
  type CursorPage,
} from '@webcat/contracts';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { EmailVerifiedGuard } from '../../core/auth/email-verified.guard';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import { zodPipe } from '../../core/http/validation.pipe';
import { AuditService } from './audit.service';

@ApiTags('Admin — Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmailVerifiedGuard, PermissionsGuard)
@Controller('admin/audit-logs')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @RequirePermissions('audit.read')
  @Get()
  @ApiOperation({ summary: 'Daftar jejak audit dengan filter' })
  list(
    @Query(zodPipe(auditLogQuerySchema)) query: AuditLogQuery,
  ): Promise<CursorPage<AuditLogItem>> {
    return this.audit.list(query);
  }
}
