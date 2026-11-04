import { Injectable } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';
import {
  mapMidtransStatus,
  midtransNotificationSchema,
  type ChargeRequest,
  type ChargeResult,
  type PaymentEvent,
  type PaymentProvider,
  type RefundRequest,
  type RefundResult,
  type TransactionStatus,
} from '@webcat/contracts';
import { AppConfigService } from '../../config/config.service';
import { LoggerService } from '../../logger/logger.service';

interface SnapResponse {
  token?: string;
  redirect_url?: string;
}

interface RefundResponse {
  refund_key?: string;
  status_code?: string;
}

/**
 * Midtrans Snap + Core API (refund).
 *
 * Keputusan penting:
 *  - `order_id` dibuat server (bukan klien) dan menjadi idempotency key.
 *  - Notifikasi hanya dipercaya setelah signature SHA512 diverifikasi
 *    memakai `timingSafeEqual` (hindari timing attack).
 *  - `capture` dengan `fraud_status=challenge` BUKAN lunas → tetap PENDING.
 *  - Status yang tidak dikenal juga diperlakukan PENDING: lebih baik menunda
 *    aktivasi daripada mengaktifkan langganan tanpa pembayaran sah.
 *  - Sandbox vs production ditentukan `MIDTRANS_IS_PRODUCTION`.
 */
@Injectable()
export class MidtransProvider implements PaymentProvider {
  readonly name = 'midtrans';

  constructor(
    private readonly config: AppConfigService,
    private readonly logger: LoggerService,
  ) {}

  private get isProduction(): boolean {
    return this.config.value.MIDTRANS_IS_PRODUCTION;
  }

  private get serverKey(): string {
    const key = this.config.value.MIDTRANS_SERVER_KEY;
    if (!key) {
      throw new Error('MIDTRANS_SERVER_KEY wajib diisi saat PAYMENT=midtrans');
    }
    return key;
  }

  private get snapBaseUrl(): string {
    return this.isProduction ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
  }

  private get apiBaseUrl(): string {
    return this.isProduction ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
  }

  private get authHeader(): string {
    return `Basic ${Buffer.from(`${this.serverKey}:`).toString('base64')}`;
  }

  async createCharge(request: ChargeRequest): Promise<ChargeResult> {
    const finishUrl = `${this.config.value.APP_URL}/checkout?orderId=${encodeURIComponent(
      request.orderId,
    )}`;

    const response = await fetch(`${this.snapBaseUrl}/snap/v1/transactions`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: this.authHeader,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: request.orderId,
          gross_amount: request.amountIdr,
        },
        item_details: [
          {
            id: request.planCode,
            name: `Paket ${request.planCode}`.slice(0, 50),
            price: request.amountIdr,
            quantity: 1,
          },
        ],
        customer_details: {
          first_name: request.customer.name.slice(0, 50),
          email: request.customer.email,
        },
        callbacks: { finish: finishUrl },
        expiry: { unit: 'hours', duration: 24 },
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      this.logger.error('Midtrans menolak pembuatan transaksi', {
        orderId: request.orderId,
        status: response.status,
        detail: detail.slice(0, 500),
      });
      throw new Error(`Midtrans gagal membuat transaksi (${response.status})`);
    }

    const payload = (await response.json()) as SnapResponse;
    if (!payload.token || !payload.redirect_url) {
      throw new Error('Respons Midtrans tidak memuat token/redirect_url');
    }

    return {
      providerToken: payload.token,
      redirectUrl: payload.redirect_url,
      expiresAt: new Date(Date.now() + 24 * 3_600_000),
    };
  }

  /**
   * Signature notifikasi = SHA512(order_id + status_code + gross_amount + serverKey).
   * `body` WAJIB string asli dari gateway (tidak dinormalisasi).
   */
  verifyWebhook(_headers: Record<string, string | undefined>, body: string): boolean {
    let parsed: { order_id?: string; status_code?: string; gross_amount?: string; signature_key?: string };
    try {
      parsed = JSON.parse(body) as typeof parsed;
    } catch {
      return false;
    }

    if (!parsed.order_id || !parsed.status_code || !parsed.gross_amount || !parsed.signature_key) {
      return false;
    }

    const expected = this.signature(parsed.order_id, parsed.status_code, parsed.gross_amount);
    const provided = parsed.signature_key.toLowerCase();

    const a = Buffer.from(provided, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  }

  /** Dipakai juga oleh test fixture agar tidak menduplikasi formula. */
  signature(orderId: string, statusCode: string, grossAmount: string): string {
    return createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${this.serverKey}`)
      .digest('hex');
  }

  parseEvent(body: string): PaymentEvent {
    const parsed = midtransNotificationSchema.parse(JSON.parse(body));
    const amount = Number.parseFloat(parsed.gross_amount);
    const paidAtSource = parsed.settlement_time ?? parsed.transaction_time;

    return {
      providerEventId: parsed.transaction_id
        ? // Satu transaksi Midtrans dapat mengirim beberapa status (settlement lalu
          // refund). Sertakan status agar refund tidak dianggap replay.
          `${parsed.transaction_id}:${parsed.transaction_status}`
        : `${parsed.order_id}:${parsed.transaction_status}`,
      orderId: parsed.order_id,
      status: this.statusFor(parsed.transaction_status, parsed.fraud_status),
      // `gross_amount` dikirim sebagai string desimal ("149000.00").
      amountIdr: Number.isFinite(amount) ? Math.round(amount) : Number.NaN,
      paidAt: paidAtSource ? new Date(paidAtSource) : null,
      raw: parsed,
    };
  }

  private statusFor(transactionStatus: string, fraudStatus?: string): TransactionStatus {
    const mapped = mapMidtransStatus(transactionStatus);

    // Kartu "capture" masih bisa ditinjau anti-fraud → belum lunas.
    if (mapped === 'SUCCESS' && fraudStatus === 'challenge') {
      return 'PENDING';
    }

    // Status tak dikenal tidak boleh dianggap lunas.
    return mapped ?? 'PENDING';
  }

  /** Refund penuh via Core API (dipakai admin dari panel transaksi). */
  async refund(request: RefundRequest): Promise<RefundResult> {
    const response = await fetch(
      `${this.apiBaseUrl}/v2/${encodeURIComponent(request.orderId)}/refund`,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: this.authHeader,
        },
        body: JSON.stringify({
          refund_key: `refund-${request.orderId}`,
          amount: request.amountIdr,
          reason: request.reason.slice(0, 255),
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      this.logger.error('Midtrans menolak refund', {
        orderId: request.orderId,
        status: response.status,
        detail: detail.slice(0, 500),
      });
      throw new Error(`Midtrans gagal refund (${response.status})`);
    }

    const payload = (await response.json()) as RefundResponse;
    return { providerRef: payload.refund_key ?? null, raw: payload };
  }
}
