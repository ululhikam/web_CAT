import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  adminTransactionListQuerySchema,
  markTransactionPaidSchema,
  refundTransactionSchema,
  type AdminTransactionListQuery,
  type AdminTransactionSummary,
  type CursorPage,
  type MarkTransactionPaidInput,
  type RefundTransactionInput,
} from '@webcat/contracts';
import { AuthUser } from '../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { EmailVerifiedGuard } from '../../core/auth/email-verified.guard';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { zodPipe } from '../../core/http/validation.pipe';
import { PaymentsService } from './payments.service';

/**
 * Panel transaksi admin.
 *
 * Dua jalur rekonsiliasi tersedia karena pembayaran nyata tidak selalu lewat
 * gateway (mis. transfer bank atau instansi):
 *  - `mark-paid`: tandai lunas + aktifkan langganan.
 *  - `refund`: kembalikan dana + cabut langganan (default).
 * Keduanya wajib alasan dan selalu menulis audit log.
 */
@ApiTags('Admin — Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmailVerifiedGuard, PermissionsGuard)
@Controller('admin/transactions')
export class AdminTransactionsController {
  constructor(private readonly payments: PaymentsService) {}

  private actor(user: AuthPrincipal, req: Request) {
    return { id: user.id, ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
  }

  @RequirePermissions('billing.read')
  @Get()
  @ApiOperation({ summary: 'Daftar transaksi (filter status, paket, tanggal, pencarian)' })
  list(
    @Query(zodPipe(adminTransactionListQuerySchema)) query: AdminTransactionListQuery,
  ): Promise<CursorPage<AdminTransactionSummary>> {
    return this.payments.listAdmin(query);
  }

  @RequirePermissions('billing.read')
  @Get(':id')
  @ApiOperation({ summary: 'Detail transaksi + identitas pemesan' })
  detail(@Param('id') id: string): Promise<AdminTransactionSummary> {
    return this.payments.findAdmin(id);
  }

  @RequirePermissions('billing.write')
  @Post(':id/mark-paid')
  @ApiOperation({ summary: 'Tandai transaksi lunas secara manual (alasan wajib)' })
  markPaid(
    @Param('id') id: string,
    @Body(zodPipe(markTransactionPaidSchema)) body: MarkTransactionPaidInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<AdminTransactionSummary> {
    return this.payments.markPaid(id, body, this.actor(user, req));
  }

  @RequirePermissions('billing.write')
  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund transaksi + cabut langganan (alasan wajib)' })
  refund(
    @Param('id') id: string,
    @Body(zodPipe(refundTransactionSchema)) body: RefundTransactionInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<AdminTransactionSummary> {
    return this.payments.refund(id, body, this.actor(user, req));
  }
}
