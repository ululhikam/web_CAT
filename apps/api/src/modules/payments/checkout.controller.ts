import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  createCheckoutSchema,
  transactionListQuerySchema,
  type CheckoutResult,
  type CreateCheckoutInput,
  type CursorPage,
  type TransactionListQuery,
  type TransactionSummary,
} from '@webcat/contracts';
import { AuthUser } from '../../core/auth/decorators/current-user.decorator';
import { EmailVerifiedGuard } from '../../core/auth/email-verified.guard';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { zodPipe } from '../../core/http/validation.pipe';
import { RateLimit, RateLimitGuard } from '../../core/ratelimit/rate-limit.guard';
import { PaymentsService } from './payments.service';

/**
 * Checkout & riwayat transaksi milik user.
 *
 * Klien hanya mengirim `planCode`; nominal, durasi, dan kelayakan paket selalu
 * dibaca server dari `subscription_plans`.
 */
@ApiTags('Checkout & Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CheckoutController {
  constructor(private readonly payments: PaymentsService) {}

  /**
   * Rate limit 3/menit/user: setiap panggilan membuat tagihan di gateway, jadi
   * klik ganda tidak boleh menghasilkan banyak tagihan.
   */
  @UseGuards(EmailVerifiedGuard, RateLimitGuard)
  @RateLimit({ limit: 3, windowSeconds: 60, scope: 'user' })
  @Post('checkout/transactions')
  @ApiOperation({ summary: 'Buat transaksi + token Snap untuk paket terpilih' })
  @ApiResponse({ status: 201, description: 'Transaksi dan token pembayaran dibuat' })
  @ApiResponse({ status: 403, description: 'Email belum terverifikasi / akun ditangguhkan' })
  @ApiResponse({ status: 404, description: 'Paket tidak ditemukan' })
  @ApiResponse({ status: 409, description: 'Paket sedang tidak dapat dibeli' })
  checkout(
    @Body(zodPipe(createCheckoutSchema)) body: CreateCheckoutInput,
    @AuthUser() user: AuthPrincipal,
  ): Promise<CheckoutResult> {
    return this.payments.checkout(user.id, body.planCode);
  }

  /** Riwayat transaksi user (owner-only, cursor pagination). */
  @Get('transactions')
  @ApiOperation({ summary: 'Riwayat transaksi saya' })
  @ApiResponse({ status: 200, description: 'Halaman transaksi terbaru lebih dulu' })
  list(
    @Query(zodPipe(transactionListQuerySchema)) query: TransactionListQuery,
    @AuthUser() user: AuthPrincipal,
  ): Promise<CursorPage<TransactionSummary>> {
    return this.payments.listForUser(user.id, query);
  }

  /**
   * Polling status untuk halaman checkout. Status tidak pernah diterima dari
   * query string gateway; selalu dibaca dari database.
   */
  @Get('transactions/by-order/:orderId')
  @ApiOperation({ summary: 'Status pembayaran berdasarkan orderId' })
  @ApiResponse({ status: 404, description: 'Transaksi tidak ditemukan' })
  status(
    @Param('orderId') orderId: string,
    @AuthUser() user: AuthPrincipal,
  ): Promise<TransactionSummary> {
    return this.payments.findByOrderIdForUser(user.id, orderId);
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Detail transaksi milik saya' })
  @ApiResponse({ status: 404, description: 'Transaksi tidak ditemukan' })
  detail(@Param('id') id: string, @AuthUser() user: AuthPrincipal): Promise<TransactionSummary> {
    return this.payments.findForUser(user.id, id);
  }
}
