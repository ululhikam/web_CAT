import { Body, Controller, Get, HttpCode, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { fakeSettleSchema, type FakeSettleInput, type WebhookAck } from '@webcat/contracts';
import { Public } from '../../core/auth/decorators/public.decorator';
import { AppConfigService } from '../../core/config/config.service';
import { AppError } from '../../core/http/app-error';
import { zodPipe } from '../../core/http/validation.pipe';
import { LoggerService } from '../../core/logger/logger.service';
import { RateLimit, RateLimitGuard } from '../../core/ratelimit/rate-limit.guard';
import { PaymentsService } from './payments.service';

/**
 * Webhook gateway + halaman simulasi pembayaran.
 *
 * Aturan yang tidak boleh dilanggar:
 *  - Signature diverifikasi SEBELUM body dipercaya.
 *  - `payment_webhook_events` UNIQUE(provider, provider_event_id) membuat
 *    replay aman: notifikasi kedua dijawab 200 tanpa efek ganda.
 *  - Notifikasi yang sudah pernah diproses selalu dibalas 2xx supaya gateway
 *    berhenti mencoba ulang.
 */
@ApiTags('Payments')
@Controller('payments')
export class PaymentWebhookController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly config: AppConfigService,
    private readonly logger: LoggerService,
  ) {}

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 120, windowSeconds: 60 })
  @Post('midtrans/notification')
  @HttpCode(200)
  @ApiOperation({ summary: 'Notifikasi pembayaran Midtrans (signature wajib valid)' })
  async midtransNotification(@Req() req: RawBodyRequest<Request>): Promise<WebhookAck> {
    const raw = req.rawBody?.toString('utf8') ?? JSON.stringify(req.body ?? {});
    const headers = req.headers as Record<string, string | undefined>;

    if (!this.payments.verifyWebhook(headers, raw)) {
      this.logger.warn('Notifikasi pembayaran ditolak: signature tidak valid', {
        provider: this.payments.providerName,
      });
      throw new AppError({
        code: 'PAYMENT_SIGNATURE_INVALID',
        status: 401,
        message: 'Signature notifikasi tidak valid',
      });
    }

    const event = this.payments.parseWebhook(raw);
    return this.payments.applyWebhookEvent(this.payments.providerName, event);
  }

  /**
   * Return URL Snap. Status TIDAK dipercaya dari parameter ini; halaman
   * checkout selalu menanyakan ulang status ke API.
   */
  @Public()
  @Get('midtrans/finish')
  @ApiOperation({ summary: 'Return URL Midtrans → redirect ke halaman checkout' })
  finish(@Query('orderId') orderId: string | undefined, @Res() res: Response): void {
    const target = new URL('/checkout', this.config.value.APP_URL);
    if (orderId) target.searchParams.set('orderId', orderId);
    res.redirect(302, target.toString());
  }

  /* ---------------------------------------------------------------- dev only */

  /** Halaman simulasi pembayaran (hanya provider fake & non-produksi). */
  @Public()
  @Get('fake/checkout')
  @ApiExcludeEndpoint()
  async fakeCheckout(@Query('orderId') orderId: string, @Res() res: Response): Promise<void> {
    if (!this.devFake()) {
      res.status(404).send('Not found');
      return;
    }

    const transaction = await this.payments.findByOrderId(orderId).catch(() => null);
    if (!transaction) {
      res.status(404).send('Transaksi tidak ditemukan');
      return;
    }

    res.type('html').send(renderFakeCheckout(orderId, transaction.amountIdr));
  }

  /**
   * Simulasi penyelesaian pembayaran. Memakai jalur `applyPaymentEvent` yang
   * sama dengan webhook asli sehingga aktivasi langganan ikut teruji.
   */
  @Public()
  @Post('fake/settle')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async fakeSettle(
    @Body(zodPipe(fakeSettleSchema)) body: FakeSettleInput,
  ): Promise<WebhookAck> {
    if (!this.devFake()) {
      throw new AppError({ code: 'COMMON_NOT_FOUND', status: 404, message: 'Not found' });
    }
    return this.payments.settleFake(body.orderId);
  }

  private devFake(): boolean {
    return !this.config.isProduction && this.config.value.PAYMENT === 'fake';
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

function renderFakeCheckout(orderId: string, amountIdr: number): string {
  const amount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amountIdr);
  const web = process.env.APP_URL ?? 'http://localhost:5173';

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Simulasi Pembayaran</title>
<style>
  :root { color-scheme: light; }
  body { font-family: system-ui, sans-serif; background:#f5f6f8; margin:0; min-height:100vh; display:grid; place-items:center; }
  main { background:#fff; padding:32px; border-radius:16px; max-width:420px; width:calc(100% - 32px); box-shadow:0 12px 40px rgba(15,23,42,.08); }
  h1 { font-size:20px; margin:0 0 4px; }
  p { color:#475569; font-size:14px; line-height:1.5; }
  dl { display:grid; grid-template-columns:auto 1fr; gap:8px 16px; margin:20px 0; font-size:14px; }
  dt { color:#64748b; }
  dd { margin:0; text-align:right; font-weight:600; }
  button { width:100%; padding:12px 16px; border:0; border-radius:10px; background:#0f766e; color:#fff; font-size:15px; font-weight:600; cursor:pointer; }
  button:disabled { opacity:.6; cursor:progress; }
  .badge { display:inline-block; font-size:11px; letter-spacing:.04em; text-transform:uppercase; background:#fef3c7; color:#92400e; padding:4px 8px; border-radius:999px; margin-bottom:12px; }
</style>
</head>
<body>
<main>
  <span class="badge">Mode simulasi</span>
  <h1>Konfirmasi Pembayaran</h1>
  <p>Halaman gateway palsu untuk pengembangan. Tidak ada uang yang berpindah.</p>
  <dl>
    <dt>Order ID</dt><dd>${escapeHtml(orderId)}</dd>
    <dt>Total</dt><dd>${escapeHtml(amount)}</dd>
  </dl>
  <button id="pay">Bayar sekarang</button>
  <p id="msg" hidden></p>
</main>
<script>
  const button = document.getElementById('pay');
  const msg = document.getElementById('msg');
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const res = await fetch('/api/v1/payments/fake/settle', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderId: ${JSON.stringify(orderId)} }),
      });
      if (!res.ok) throw new Error('gagal');
      window.location.href = ${JSON.stringify(`${web}/checkout?orderId=${encodeURIComponent(orderId)}`)};
    } catch {
      button.disabled = false;
      msg.hidden = false;
      msg.textContent = 'Simulasi gagal. Coba lagi.';
    }
  });
</script>
</body>
</html>`;
}
