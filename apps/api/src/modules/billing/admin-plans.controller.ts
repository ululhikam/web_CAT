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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  createPlanSchema,
  deletePlanSchema,
  restorePlanSchema,
  updatePlanSchema,
  type AdminPlan,
  type CreatePlanInput,
  type DeletePlanInput,
  type PlanDeleteResult,
  type RestorePlanInput,
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
  @ApiOperation({ summary: 'Daftar paket (default tanpa paket terhapus)' })
  list(@Query('includeDeleted') includeDeleted?: string): Promise<AdminPlan[]> {
    return this.plans.listAll(includeDeleted === 'true' || includeDeleted === '1');
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

  @RequirePermissions('billing.write')
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete paket (wajib alasan, masuk audit)' })
  remove(
    @Param('id') id: string,
    @Body(zodPipe(deletePlanSchema)) body: DeletePlanInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<PlanDeleteResult> {
    return this.plans.remove(id, body.reason, this.actor(user, req));
  }

  @RequirePermissions('billing.write')
  @Post(':id/restore')
  @ApiOperation({ summary: 'Pulihkan paket yang di-soft-delete' })
  restore(
    @Param('id') id: string,
    @Body(zodPipe(restorePlanSchema)) body: RestorePlanInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<AdminPlan> {
    return this.plans.restore(id, body.reason, this.actor(user, req));
  }
}
