import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  updatePlatformSettingsSchema,
  type PlatformSettingsView,
  type UpdatePlatformSettingsInput,
} from '@webcat/contracts';
import { AuthUser } from '../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { EmailVerifiedGuard } from '../../core/auth/email-verified.guard';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { zodPipe } from '../../core/http/validation.pipe';
import { SettingsService } from './settings.service';

@ApiTags('Admin — Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmailVerifiedGuard, PermissionsGuard)
@Controller('admin/settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  private actor(user: AuthPrincipal, req: Request) {
    return { id: user.id, ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
  }

  @RequirePermissions('settings.write')
  @Get()
  get(): Promise<PlatformSettingsView> {
    return this.settings.view();
  }

  @RequirePermissions('settings.write')
  @Patch()
  update(
    @Body(zodPipe(updatePlatformSettingsSchema)) body: UpdatePlatformSettingsInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<PlatformSettingsView> {
    return this.settings.update(body, this.actor(user, req));
  }
}
