import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  adminSubscriptionListQuerySchema,
  grantSubscriptionSchema,
  updateSubscriptionSchema,
  type AdminSubscriptionListQuery,
  type AdminSubscriptionSummary,
  type CursorPage,
  type GrantSubscriptionInput,
  type SubscriptionSummary,
  type UpdateSubscriptionInput,
} from '@webcat/contracts';
import { AuthUser } from '../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { EmailVerifiedGuard } from '../../core/auth/email-verified.guard';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { zodPipe } from '../../core/http/validation.pipe';
import { SubscriptionsService } from './subscriptions.service';

/**
 * Panel admin untuk masa langganan.
 *
 * Jalur ini ada supaya pembayaran tidak pernah menjadi satu-satunya cara
 * memberi akses: admin dapat memberi, memperpanjang, dan mencabut langganan
 * dengan alasan yang selalu tercatat di audit log.
 */
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

  @RequirePermissions('billing.read')
  @Get()
  @ApiOperation({ summary: 'Daftar langganan (filter status/akan habis/pencarian)' })
  list(
    @Query(zodPipe(adminSubscriptionListQuerySchema)) query: AdminSubscriptionListQuery,
  ): Promise<CursorPage<AdminSubscriptionSummary>> {
    return this.subscriptions.listAdmin(query);
  }

  @RequirePermissions('billing.read')
  @Get('user/:userId')
  @ApiOperation({ summary: 'Riwayat langganan satu user' })
  listForUser(@Param('userId') userId: string): Promise<SubscriptionSummary[]> {
    return this.subscriptions.listForUser(userId);
  }

  @RequirePermissions('billing.read')
  @Get(':id')
  @ApiOperation({ summary: 'Detail langganan' })
  detail(@Param('id') id: string): Promise<SubscriptionSummary> {
    return this.subscriptions.findById(id);
  }

  /** Admin memberi masa langganan tanpa payment gateway. */
  @RequirePermissions('subscriptions.manage')
  @Post()
  @ApiOperation({ summary: 'Grant manual (STACK/REPLACE, alasan wajib)' })
  grant(
    @Body(zodPipe(grantSubscriptionSchema)) body: GrantSubscriptionInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<SubscriptionSummary> {
    return this.subscriptions.grant(body, this.actor(user, req));
  }

  @RequirePermissions('subscriptions.manage')
  @Patch(':id')
  @ApiOperation({ summary: 'Perpanjang / ubah tanggal berakhir / cabut (alasan wajib)' })
  update(
    @Param('id') id: string,
    @Body(zodPipe(updateSubscriptionSchema)) body: UpdateSubscriptionInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<SubscriptionSummary> {
    return this.subscriptions.update(id, body, this.actor(user, req));
  }
}
