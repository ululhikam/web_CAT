import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  grantSubscriptionSchema,
  updateSubscriptionSchema,
  type GrantSubscriptionInput,
  type SubscriptionSummary,
} from '@webcat/contracts';
import { AuthUser } from '../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { EmailVerifiedGuard } from '../../core/auth/email-verified.guard';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { ZodValidationPipe } from '../../core/http/validation.pipe';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Admin — Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmailVerifiedGuard, PermissionsGuard)
@Controller('admin/subscriptions')
export class AdminSubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  private actor(user: AuthPrincipal, req: Request) {
    return {
      id: user.id,
      ip: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    };
  }

  @RequirePermissions('subscriptions.manage')
  @Get('user/:userId')
  listForUser(@Param('userId') userId: string): Promise<SubscriptionSummary[]> {
    return this.subscriptions.listForUser(userId);
  }

  /** Admin memberi masa langganan tanpa payment gateway. */
  @RequirePermissions('subscriptions.manage')
  @Post()
  grant(
    @Body(new ZodValidationPipe(grantSubscriptionSchema)) body: GrantSubscriptionInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<SubscriptionSummary> {
    return this.subscriptions.grant(body, this.actor(user, req));
  }

  @RequirePermissions('subscriptions.manage')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSubscriptionSchema))
    body: { reason: string; endsAt?: Date; extendDays?: number; status?: 'ACTIVE' | 'REVOKED' | 'EXPIRED' },
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<SubscriptionSummary> {
    return this.subscriptions.revoke(id, { reason: body.reason }, this.actor(user, req));
  }
}
