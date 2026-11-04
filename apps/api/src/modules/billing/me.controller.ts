import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { SubscriptionSummary } from '@webcat/contracts';
import { AuthUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscription (saya)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeSubscriptionController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('subscription')
  active(@AuthUser() user: AuthPrincipal): Promise<SubscriptionSummary | null> {
    return this.subscriptions.activeForUser(user.id);
  }

  @Get('subscriptions')
  history(@AuthUser() user: AuthPrincipal): Promise<SubscriptionSummary[]> {
    return this.subscriptions.listForUser(user.id);
  }
}
