import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AdminUserSummary } from '@webcat/contracts';
import { AuthUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { UsersService } from './users.service';

/** Profil ringkas milik sendiri; tidak butuh permission admin. */
@ApiTags('Profil (saya)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeProfileController {
  constructor(private readonly users: UsersService) {}

  @Get('profile')
  profile(@AuthUser() user: AuthPrincipal): Promise<AdminUserSummary> {
    return this.users.findById(user.id);
  }
}
