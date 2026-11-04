import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { revenueQuerySchema, type RevenueKpi, type RevenueQuery } from '@webcat/contracts';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { EmailVerifiedGuard } from '../../core/auth/email-verified.guard';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import { zodPipe } from '../../core/http/validation.pipe';
import { AnalyticsService } from './analytics.service';

/** Widget revenue dashboard admin (§9.7). Read-only. */
@ApiTags('Admin — Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmailVerifiedGuard, PermissionsGuard)
@Controller('admin/dashboard')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @RequirePermissions('billing.read')
  @Get('revenue')
  @ApiOperation({ summary: 'KPI revenue, konversi, dan rincian per paket' })
  revenue(@Query(zodPipe(revenueQuerySchema)) query: RevenueQuery): Promise<RevenueKpi> {
    return this.analytics.revenue(query);
  }
}
