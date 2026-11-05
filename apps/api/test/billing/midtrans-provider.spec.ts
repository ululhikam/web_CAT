import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppConfigService } from '../../src/core/config/config.service';
import type { LoggerService } from '../../src/core/logger/logger.service';
import { MidtransProvider } from '../../src/core/ports/impl/midtrans-provider';
import {
  MIDTRANS_TEST_SERVER_KEY,
  midtransNotification,
  midtransSignature,
} from './fixtures/midtrans';

const FIXED_SIGNATURE =
  '47a825bd189eeb32bcb985f33c13a856524fda7ef76857f99bf21d5169a99c92427659bf14cce3dff9ce768f2487c491ba2dbcc95369791dd738d9c151c1c8c7';

function createProvider() {
  const config = {
    value: {
      APP_URL: 'http://localhost:5173',
      MIDTRANS_SERVER_KEY: MIDTRANS_TEST_SERVER_KEY,
      MIDTRANS_IS_PRODUCTION: false,
    },
  } as unknown as AppConfigService;

  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(),
  } as unknown as LoggerService;

  return { provider: new MidtransProvider(config, logger), logger };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MidtransProvider — signature webhook', () => {
  it('menerima signature SHA512 yang valid', () => {
    const { provider } = createProvider();
    const fixture = midtransNotification();

    expect(fixture.signature_key).toBe(FIXED_SIGNATURE);
    expect(provider.signature('WC-TEST-1', '200', '149000.00')).toBe(FIXED_SIGNATURE);
    expect(provider.verifyWebhook({}, JSON.stringify(fixture))).toBe(true);
  });

  it('menolak body yang diubah setelah ditandatangani', () => {
    const { provider } = createProvider();
    const tampered = JSON.stringify({
      ...midtransNotification(),
      gross_amount: '1000.00',
    });

    expect(provider.verifyWebhook({}, tampered)).toBe(false);
  });

  it('menolak signature salah, field kurang, dan JSON rusak', () => {
    const { provider } = createProvider();

    expect(
      provider.verifyWebhook(
        {},
        JSON.stringify(midtransNotification({ signature_key: 'deadbeef' })),
      ),
    ).toBe(false);
    expect(provider.verifyWebhook({}, JSON.stringify({ order_id: 'WC-TEST-1' }))).toBe(false);
    expect(provider.verifyWebhook({}, 'bukan-json')).toBe(false);
  });

  it('menerima signature dalam huruf besar (dinormalisasi)', () => {
    const { provider } = createProvider();
    const fixture = midtransNotification({
      signature_key: FIXED_SIGNATURE.toUpperCase(),
    });

    expect(provider.verifyWebhook({}, JSON.stringify(fixture))).toBe(true);
  });
});

describe('MidtransProvider — parse notifikasi', () => {
  const cases: Array<[string, string | undefined, string]> = [
    ['settlement', 'accept', 'SUCCESS'],
    ['capture', 'accept', 'SUCCESS'],
    // Kartu yang masih ditinjau anti-fraud belum boleh mengaktifkan langganan.
    ['capture', 'challenge', 'PENDING'],
    ['pending', undefined, 'PENDING'],
    ['expire', undefined, 'EXPIRED'],
    ['deny', undefined, 'FAILED'],
    ['failure', undefined, 'FAILED'],
    ['cancel', undefined, 'CANCELLED'],
    ['refund', undefined, 'REFUNDED'],
    ['partial_refund', undefined, 'REFUNDED'],
    ['chargeback', undefined, 'REFUNDED'],
    ['status-baru', undefined, 'PENDING'],
  ];

  for (const [status, fraud, expected] of cases) {
    it(`memetakan ${status}${fraud ? `/${fraud}` : ''} → ${expected}`, () => {
      const { provider } = createProvider();
      const event = provider.parseEvent(
        JSON.stringify(midtransNotification({ transaction_status: status, fraud_status: fraud })),
      );

      expect(event.status).toBe(expected);
    });
  }

  it('membulatkan gross_amount desimal dan memakai settlement_time', () => {
    const { provider } = createProvider();
    const event = provider.parseEvent(
      JSON.stringify(
        midtransNotification({
          gross_amount: '149000.00',
          settlement_time: '2026-11-05T10:00:05+07:00',
        }),
      ),
    );

    expect(event.amountIdr).toBe(149000);
    expect(event.paidAt?.toISOString()).toBe('2026-11-05T03:00:05.000Z');
    // Status disertakan agar notifikasi refund setelah settlement tidak
    // dianggap replay.
    expect(event.providerEventId).toBe('txn-0001:settlement');
    expect(event.orderId).toBe('WC-TEST-1');
  });

  it('memakai order_id:status bila transaction_id tidak ada', () => {
    const { provider } = createProvider();
    const event = provider.parseEvent(
      JSON.stringify(
        midtransNotification({
          transaction_id: undefined,
          transaction_status: 'pending',
          fraud_status: undefined,
        }),
      ),
    );

    expect(event.providerEventId).toBe('WC-TEST-1:pending');
  });
});

describe('MidtransProvider — Snap charge & refund', () => {
  const charge = {
    orderId: 'WC-TEST-1',
    amountIdr: 149000,
    planCode: 'BULANAN',
    customer: { id: 'user-1', email: 'user@example.com', name: 'User Satu' },
  };

  it('membuat charge dengan nominal dari server dan Basic Auth', async () => {
    const { provider } = createProvider();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'snap-token-1',
        redirect_url: 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-1',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await provider.createCharge(charge);

    expect(result).toMatchObject({
      providerToken: 'snap-token-1',
      redirectUrl: 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-1',
    });
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://app.sandbox.midtrans.com/snap/v1/transactions');
    expect(init.headers).toMatchObject({
      authorization: `Basic ${Buffer.from(`${MIDTRANS_TEST_SERVER_KEY}:`).toString('base64')}`,
    });

    const body = JSON.parse(String(init.body));
    expect(body.transaction_details).toEqual({
      order_id: 'WC-TEST-1',
      gross_amount: 149000,
    });
    expect(body.callbacks.finish).toBe(
      'http://localhost:5173/checkout?orderId=WC-TEST-1',
    );
  });

  it('melempar error dan mencatat log bila gateway menolak charge', async () => {
    const { provider, logger } = createProvider();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'unauthorized',
      }),
    );

    await expect(provider.createCharge(charge)).rejects.toThrow(
      'Midtrans gagal membuat transaksi (401)',
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Midtrans menolak pembuatan transaksi',
      expect.objectContaining({ orderId: 'WC-TEST-1', status: 401 }),
    );
  });

  it('melempar error bila respons tidak memuat token/redirect_url', async () => {
    const { provider } = createProvider();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ token: 'tanpa-url' }) }),
    );

    await expect(provider.createCharge(charge)).rejects.toThrow(
      'Respons Midtrans tidak memuat token/redirect_url',
    );
  });

  it('mengirim refund penuh ke Core API', async () => {
    const { provider } = createProvider();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ refund_key: 'refund-WC-TEST-1', status_code: '200' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await provider.refund({
      orderId: 'WC-TEST-1',
      amountIdr: 149000,
      reason: 'salah beli',
    });

    expect(result.providerRef).toBe('refund-WC-TEST-1');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.sandbox.midtrans.com/v2/WC-TEST-1/refund');
    expect(JSON.parse(String(init.body))).toEqual({
      refund_key: 'refund-WC-TEST-1',
      amount: 149000,
      reason: 'salah beli',
    });
  });

  it('melempar error bila refund ditolak gateway', async () => {
    const { provider, logger } = createProvider();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 412,
        text: async () => 'refund not allowed',
      }),
    );

    await expect(
      provider.refund({ orderId: 'WC-TEST-1', amountIdr: 149000, reason: 'salah beli' }),
    ).rejects.toThrow('Midtrans gagal refund (412)');
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('MidtransProvider — konfigurasi', () => {
  it('memakai base URL production saat MIDTRANS_IS_PRODUCTION=true', async () => {
    const config = {
      value: {
        APP_URL: 'https://webcat.id',
        MIDTRANS_SERVER_KEY: MIDTRANS_TEST_SERVER_KEY,
        MIDTRANS_IS_PRODUCTION: true,
      },
    } as unknown as AppConfigService;
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      child: vi.fn(),
    } as unknown as LoggerService;
    const provider = new MidtransProvider(config, logger);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 't', redirect_url: 'https://app.midtrans.com/x' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await provider.createCharge({
      orderId: 'WC-1',
      amountIdr: 1000,
      planCode: 'BULANAN',
      customer: { id: 'u', email: 'a@b.c', name: 'A' },
    });

    expect((fetchMock.mock.calls[0] as [string])[0]).toBe(
      'https://app.midtrans.com/snap/v1/transactions',
    );
  });

  it('signature fixture konsisten dengan formula provider', () => {
    expect(midtransSignature('WC-TEST-1', '200', '149000.00')).toBe(FIXED_SIGNATURE);
  });
});
