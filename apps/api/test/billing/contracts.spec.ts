import { describe, expect, it } from 'vitest';
import {
  createCheckoutSchema,
  createPlanSchema,
  formatInvoiceNumber,
  grantSubscriptionSchema,
  jakartaDateKey,
  jakartaMonthRange,
  mapMidtransStatus,
  markTransactionPaidSchema,
  MIDTRANS_STATUS_MAP,
  refundTransactionSchema,
  updatePlanSchema,
} from '@webcat/contracts';

const USER_ID = '11111111-1111-4111-8111-111111111111';

describe('kontrak billing — waktu & invoice', () => {
  it('jakartaDateKey memakai batas hari Asia/Jakarta (UTC+7)', () => {
    // 23:59:59 Jakarta masih tanggal 4.
    expect(jakartaDateKey(new Date('2026-11-04T16:59:59.000Z'))).toBe('2026-11-04');
    // 00:00:00 Jakarta sudah tanggal 5.
    expect(jakartaDateKey(new Date('2026-11-04T17:00:00.000Z'))).toBe('2026-11-05');
  });

  it('jakartaMonthRange menghasilkan [awal bulan, awal bulan berikutnya)', () => {
    const { start, end } = jakartaMonthRange(new Date('2026-11-15T00:00:00.000Z'));

    expect(start.toISOString()).toBe('2026-10-31T17:00:00.000Z');
    expect(end.toISOString()).toBe('2026-11-30T17:00:00.000Z');
    expect(end.getTime() - start.getTime()).toBe(30 * 86_400_000);
  });

  it('formatInvoiceNumber memakai tahun/bulan Jakarta dan urutan 4 digit', () => {
    expect(formatInvoiceNumber(new Date('2026-11-05T00:00:00.000Z'), 1)).toBe(
      'INV/2026/11/0001',
    );
    expect(formatInvoiceNumber(new Date('2026-12-31T17:00:00.000Z'), 42)).toBe(
      'INV/2027/01/0042',
    );
    expect(formatInvoiceNumber(new Date('2026-11-05T00:00:00.000Z'), 12345)).toBe(
      'INV/2026/11/12345',
    );
  });
});

describe('kontrak billing — status Midtrans', () => {
  it('memetakan semua status yang dikenal', () => {
    expect(MIDTRANS_STATUS_MAP).toMatchObject({
      pending: 'PENDING',
      capture: 'SUCCESS',
      settlement: 'SUCCESS',
      expire: 'EXPIRED',
      deny: 'FAILED',
      failure: 'FAILED',
      cancel: 'CANCELLED',
      refund: 'REFUNDED',
      partial_refund: 'REFUNDED',
      chargeback: 'REFUNDED',
    });
  });

  it('menerima huruf besar/spasi dan menolak status tak dikenal', () => {
    expect(mapMidtransStatus(' SETTLEMENT ')).toBe('SUCCESS');
    expect(mapMidtransStatus('CAPTURE')).toBe('SUCCESS');
    expect(mapMidtransStatus('something-new')).toBeNull();
  });
});

describe('kontrak billing — validasi input', () => {
  it('checkout hanya menerima planCode; nominal dari klien dibuang', () => {
    const parsed = createCheckoutSchema.parse({
      planCode: '  BULANAN ',
      amountIdr: 1,
      durationDays: 3650,
    });

    expect(parsed).toEqual({ planCode: 'BULANAN' });
  });

  it('checkout menolak planCode kosong', () => {
    expect(createCheckoutSchema.safeParse({ planCode: '   ' }).success).toBe(false);
  });

  it('grant wajib alasan, salah satu sumber durasi, dan batas 1–3650 hari', () => {
    const base = { userId: USER_ID, reason: 'hadiah lomba' };

    expect(grantSubscriptionSchema.safeParse({ ...base, durationDays: 0 }).success).toBe(false);
    expect(grantSubscriptionSchema.safeParse({ ...base, durationDays: 3651 }).success).toBe(false);
    expect(
      grantSubscriptionSchema.safeParse({ ...base, planCode: 'BULANAN', durationDays: 30 }).success,
    ).toBe(false);
    expect(grantSubscriptionSchema.safeParse(base).success).toBe(false);
    expect(grantSubscriptionSchema.safeParse({ ...base, durationDays: 1 }).success).toBe(true);
    expect(grantSubscriptionSchema.safeParse({ ...base, durationDays: 3650 }).success).toBe(true);
    expect(grantSubscriptionSchema.safeParse({ ...base, planCode: 'BULANAN' }).success).toBe(true);
  });

  it('grant default mode STACK', () => {
    const parsed = grantSubscriptionSchema.parse({
      userId: USER_ID,
      durationDays: 30,
      reason: 'kompensasi',
    });
    expect(parsed.mode).toBe('STACK');
  });

  it('refund wajib alasan dan default mencabut langganan', () => {
    const parsed = refundTransactionSchema.parse({ reason: 'salah beli' });
    expect(parsed.revokeSubscription).toBe(true);
    expect(refundTransactionSchema.safeParse({ reason: 'ab' }).success).toBe(false);
    expect(refundTransactionSchema.safeParse({}).success).toBe(false);
  });

  it('mark paid wajib alasan minimal 3 karakter', () => {
    expect(markTransactionPaidSchema.safeParse({ reason: 'ab' }).success).toBe(false);
    const parsed = markTransactionPaidSchema.parse({
      reason: 'transfer manual',
      paidAt: '2026-11-05T10:00:00+07:00',
    });
    expect(parsed.paidAt?.toISOString()).toBe('2026-11-05T03:00:00.000Z');
  });

  it('harga coret harus lebih besar dari harga jual', () => {
    const plan = {
      code: 'BULANAN',
      name: 'Paket Bulanan',
      priceIdr: 149000,
      compareAtPriceIdr: 149000,
      durationDays: 30,
    };

    expect(createPlanSchema.safeParse(plan).success).toBe(false);
    expect(createPlanSchema.safeParse({ ...plan, compareAtPriceIdr: 199000 }).success).toBe(true);
    expect(updatePlanSchema.safeParse({}).success).toBe(false);
    expect(updatePlanSchema.safeParse({ priceIdr: 129000 }).success).toBe(true);
  });
});
