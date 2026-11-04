import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { SubscriptionHistoryItem, SubscriptionSummary } from '@webcat/contracts';
import { AuthUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { SubscriptionsService } from './subscriptions.service';

/**
 * Status & riwayat langganan milik user yang sedang login.
 *
 * Endpoint ini hanya membaca. Aktivasi hanya terjadi lewat pembayaran
 * (webhook) atau grant manual admin, sehingga user tidak bisa memberi
 * dirinya akses.
 */
@ApiTags('Subscriptions (saya)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class MeSubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Langganan aktif saya (null bila tidak ada)' })
  active(@AuthUser() user: AuthPrincipal): Promise<SubscriptionSummary | null> {
    return this.subscriptions.activeForUser(user.id);
  }

  @Get('me/history')
  @ApiOperation({ summary: 'Riwayat langganan beserta jejak perubahannya' })
  history(@AuthUser() user: AuthPrincipal): Promise<SubscriptionHistoryItem[]> {
    return this.subscriptions.historyForUser(user.id);
  }
}
