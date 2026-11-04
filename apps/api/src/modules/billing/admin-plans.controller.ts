import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  createPlanSchema,
  updatePlanSchema,
  type AdminPlan,
  type CreatePlanInput,
  type UpdatePlanInput,
} from '@webcat/contracts';
import { AuthUser } from '../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { EmailVerifiedGuard } from '../../core/auth/email-verified.guard';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { zodPipe } from '../../core/http/validation.pipe';
import { PlansService } from './plans.service';
import type { ActorContext } from './subscriptions.service';

/**
 * CRUD paket & harga. Harga adalah data, bukan konstanta: perubahan di sini
 * langsung dipakai checkout berikutnya tanpa deploy.
 */
@ApiTags('Admin — Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmailVerifiedGuard, PermissionsGuard)
@Controller('admin/plans')
export class AdminPlansController {
  constructor(private readonly plans: PlansService) {}

  private actor(user: AuthPrincipal, req: Request): ActorContext {
    return { id: user.id, ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
  }

  @RequirePermissions('billing.read')
  @Get()
  @ApiOperation({ summary: 'Daftar semua paket (termasuk DRAFT/ARCHIVED)' })
  list(): Promise<AdminPlan[]> {
    return this.plans.listAll();
  }

  @RequirePermissions('billing.read')
  @Get(':id')
  @ApiOperation({ summary: 'Detail satu paket' })
  detail(@Param('id') id: string): Promise<AdminPlan> {
    return this.plans.findById(id);
  }

  @RequirePermissions('billing.write')
  @Post()
  @ApiOperation({ summary: 'Buat paket baru' })
  create(
    @Body(zodPipe(createPlanSchema)) body: CreatePlanInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<AdminPlan> {
    return this.plans.create(body, this.actor(user, req));
  }

  @RequirePermissions('billing.write')
  @Patch(':id')
  @ApiOperation({ summary: 'Ubah paket (code tidak bisa diubah)' })
  update(
    @Param('id') id: string,
    @Body(zodPipe(updatePlanSchema)) body: UpdatePlanInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<AdminPlan> {
    return this.plans.update(id, body, this.actor(user, req));
  }
}
