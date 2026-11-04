import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  adminCreateUserSchema,
  adminResetPasswordSchema,
  changeUserRoleSchema,
  updateUserStatusSchema,
  userListQuerySchema,
  type AdminCreateUserInput,
  type AdminCreateUserResponse,
  type AdminResetPasswordInput,
  type AdminUserSummary,
  type UserListQuery,
} from '@webcat/contracts';
import { AuthUser } from '../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { EmailVerifiedGuard } from '../../core/auth/email-verified.guard';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { zodPipe } from '../../core/http/validation.pipe';
import { UsersService } from './users.service';

@ApiTags('Admin — Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmailVerifiedGuard, PermissionsGuard)
@Controller('admin/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  private actor(user: AuthPrincipal, req: Request) {
    return {
      id: user.id,
      role: user.role,
      ip: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    };
  }

  @RequirePermissions('users.read')
  @Get()
  list(@Query(zodPipe(userListQuerySchema)) query: UserListQuery) {
    return this.users.list(query);
  }

  @RequirePermissions('users.read')
  @Get(':id')
  detail(@Param('id') id: string): Promise<AdminUserSummary> {
    return this.users.findById(id);
  }

  /** Jalur utama pembuatan akun peserta (tanpa self-registration). */
  @RequirePermissions('users.create')
  @Post()
  create(
    @Body(zodPipe(adminCreateUserSchema)) body: AdminCreateUserInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<AdminCreateUserResponse> {
    return this.users.create(body, this.actor(user, req));
  }

  @RequirePermissions('users.suspend')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body(zodPipe(updateUserStatusSchema))
    body: { status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_INVITE'; reason?: string },
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<AdminUserSummary> {
    return this.users.updateStatus(id, body.status, body.reason, this.actor(user, req));
  }

  @RequirePermissions('roles.manage')
  @Patch(':id/role')
  changeRole(
    @Param('id') id: string,
    @Body(zodPipe(changeUserRoleSchema))
    body: { role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'; reason?: string },
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<AdminUserSummary> {
    return this.users.changeRole(id, body.role, body.reason, this.actor(user, req));
  }

  @RequirePermissions('users.password.reset')
  @Post(':id/reset-password')
  resetPassword(
    @Param('id') id: string,
    @Body(zodPipe(adminResetPasswordSchema)) body: AdminResetPasswordInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ) {
    return this.users.adminResetPassword(id, body.newPassword, this.actor(user, req));
  }
}
