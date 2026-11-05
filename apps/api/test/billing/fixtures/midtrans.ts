import { createHash } from 'node:crypto';

export const MIDTRANS_TEST_SERVER_KEY = 'SB-Mid-server-TEST';

/** Formula resmi Midtrans: SHA512(order_id + status_code + gross_amount + serverKey). */
export function midtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey = MIDTRANS_TEST_SERVER_KEY,
): string {
  return createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest('hex');
}

/**
 * Fixture notifikasi Snap.
 *
 * Signature dihitung ulang saat field penentu berubah, kecuali test memang
 * ingin mengirim signature yang salah.
 */
export function midtransNotification(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    transaction_id: 'txn-0001',
    order_id: 'WC-TEST-1',
    status_code: '200',
    gross_amount: '149000.00',
    transaction_status: 'settlement',
    fraud_status: 'accept',
    payment_type: 'qris',
    transaction_time: '2026-11-05T10:00:00+07:00',
    settlement_time: '2026-11-05T10:00:05+07:00',
    status_message: 'midtrans payment notification',
    ...overrides,
  };

  if (!('signature_key' in overrides)) {
    payload.signature_key = midtransSignature(
      String(payload.order_id),
      String(payload.status_code),
      String(payload.gross_amount),
    );
  }

  return payload;
}
