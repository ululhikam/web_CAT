import { Body, Controller, Get, HttpCode, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  avatarUploadSchema,
  changePasswordSchema,
  updateProfileSchema,
  type AdminUserSummary,
  type AvatarUploadInput,
  type AvatarUploadResponse,
  type ChangePasswordInput,
  type MessageResult,
  type UpdateProfileInput,
} from '@webcat/contracts';
import { AuthUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { zodPipe } from '../../core/http/validation.pipe';
import { AuthService } from '../auth/auth.service';
import { UsersService } from './users.service';

function actor(user: AuthPrincipal, req: Request) {
  return {
    id: user.id,
    role: user.role,
    ip: req.ip ?? null,
    userAgent: req.headers['user-agent'] ?? null,
  };
}

/** Profil ringkas milik sendiri; tidak butuh permission admin. */
@ApiTags('Profil (saya)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me')
export class UsersMeController {
  constructor(
    private readonly users: UsersService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Ambil profil saya' })
  profile(@AuthUser() user: AuthPrincipal): Promise<AdminUserSummary> {
    return this.users.findById(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Ubah profil saya' })
  update(
    @Body(zodPipe(updateProfileSchema)) body: UpdateProfileInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<AdminUserSummary> {
    return this.users.updateProfile(user.id, body, actor(user, req));
  }

  @Patch('password')
  @ApiOperation({ summary: 'Ubah password saya' })
  @HttpCode(200)
  password(
    @Body(zodPipe(changePasswordSchema)) body: ChangePasswordInput,
    @AuthUser() user: AuthPrincipal,
  ): Promise<MessageResult> {
    return this.auth.changePassword(user.id, body);
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Unggah avatar saya' })
  @HttpCode(201)
  avatar(
    @Body(zodPipe(avatarUploadSchema)) body: AvatarUploadInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<AvatarUploadResponse> {
    return this.users.requestAvatar(user.id, body.contentType, body.sizeBytes, actor(user, req));
  }
}

/** Alias lama `GET /me/profile`; dipertahankan agar klien lama tidak rusak. */
@ApiTags('Profil (saya)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeProfileController {
  constructor(private readonly users: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Alias profil saya untuk klien lama' })
  profile(@AuthUser() user: AuthPrincipal): Promise<AdminUserSummary> {
    return this.users.findById(user.id);
  }
}
