import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  ChargeRequest,
  ChargeResult,
  PaymentEvent,
  PaymentProvider,
} from '@webcat/contracts';

/**
 * Payment provider palsu untuk dev/test.
 * Menandatangani body dengan header `x-fake-signature` agar jalur
 * verifikasi webhook tetap teruji. Settle manual:
 *   POST /api/v1/internal/payments/fake/settle  { orderId }
 */
@Injectable()
export class FakePaymentProvider implements PaymentProvider {
  readonly name = 'fake';
  private readonly secret = process.env.FAKE_PAYMENT_SECRET ?? 'fake-secret';

  async createCharge(request: ChargeRequest): Promise<ChargeResult> {
    const providerToken = `fake-${request.orderId}`;
    return {
      providerToken,
      redirectUrl: `${process.env.API_URL ?? 'http://localhost:3000'}/api/v1/payments/fake/checkout?orderId=${encodeURIComponent(request.orderId)}`,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    };
  }

  verifyWebhook(headers: Record<string, string | undefined>, body: string): boolean {
    const sent = headers['x-fake-signature'];
    if (!sent) return false;
    const expected = createHmac('sha256', this.secret).update(body).digest('hex');
    const a = Buffer.from(sent);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  parseEvent(body: string): PaymentEvent {
    const parsed = JSON.parse(body) as {
      eventId: string;
      orderId: string;
      status: PaymentEvent['status'];
      amountIdr: number;
      paidAt?: string;
    };
    return {
      providerEventId: parsed.eventId,
      orderId: parsed.orderId,
      status: parsed.status,
      amountIdr: parsed.amountIdr,
      paidAt: parsed.paidAt ? new Date(parsed.paidAt) : null,
      raw: parsed,
    };
  }

  /** Helper test: membuat signature valid untuk body tertentu. */
  sign(body: string): string {
    return createHmac('sha256', this.secret).update(body).digest('hex');
  }
}
