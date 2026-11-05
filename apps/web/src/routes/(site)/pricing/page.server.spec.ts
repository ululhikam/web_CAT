import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Plan } from '@webcat/contracts';
import { apiClearCache } from '$lib/api/client';
import { load } from './+page.server';

/**
 * F5-01 — `/pricing` harus mengambil harga dari API, bukan konstanta.
 *
 * Test ini memanggil `load()` apa adanya dengan `fetch` palsu yang meniru
 * envelope API. Yang dijaga:
 *  - satu-satunya sumber data adalah `GET /plans`,
 *  - paket non-publik tidak ikut tampil,
 *  - urutan mengikuti `sortOrder` lalu harga termurah,
 *  - `TRIAL_3D` dipisah ke banner dan `CUSTOM` tidak menjadi kartu,
 *  - `?plan=` hanya diterima bila kodenya benar-benar ada,
 *  - kegagalan API menjadi state error, bukan halaman kosong.
 */

/** Bentuk hasil `load()` yang dipakai test (union `void` dari tipe SvelteKit diabaikan). */
interface PricingData {
  plans: Plan[];
  trial: Plan | null;
  cards: Plan[];
  selectedCode: string | null;
  error: string | null;
}

function plan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 'plan-1',
    code: 'MONTHLY',
    name: 'Bulanan',
    tagline: 'Akses 30 hari',
    priceIdr: 149_000,
    compareAtPriceIdr: null,
    durationDays: 30,
    pricePerDayIdr: 4_967,
    features: [{ label: 'Pembahasan lengkap', included: true }],
    isPublic: true,
    sortOrder: 30,
    badge: null,
    isPopular: true,
    ...overrides,
  };
}

function envelope(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** Palsukan `GET /plans`; satu argumen supaya `mock.calls` bertipe rapi. */
function apiFetch(plans: Plan[]) {
  return vi.fn(async (_input: RequestInfo | URL) =>
    envelope({ success: true, data: plans }),
  );
}

/** Event minimal `load()`; `as never` menghindari tiruan tipe `$types`. */
function makeEvent(fetchImpl: unknown, search = '') {
  const setHeaders = vi.fn();
  return {
    event: {
      fetch: fetchImpl,
      setHeaders,
      url: new URL(`http://localhost/pricing${search}`),
    } as never,
    setHeaders,
  };
}

async function run(fetchImpl: unknown, search = '') {
  const { event, setHeaders } = makeEvent(fetchImpl, search);
  const data = (await load(event)) as PricingData;
  return { data, setHeaders };
}

describe('pricing +page.server — sumber data API (F5-01)', () => {
  beforeEach(() => {
    // Cache in-memory klien API (TTL 15 dtk) akan menyeberangi test.
    apiClearCache();
  });

  it('membaca paket dari GET /plans dan mengurutkannya', async () => {
    const fetchImpl = apiFetch([
      plan({ code: 'QUARTERLY', name: 'Tiga Bulan', priceIdr: 399_000, sortOrder: 40 }),
      plan({ code: 'WEEKLY', name: 'Mingguan', priceIdr: 49_000, sortOrder: 10 }),
      plan(),
    ]);

    const { data, setHeaders } = await run(fetchImpl);

    expect(fetchImpl.mock.calls).toHaveLength(1);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe('/api/v1/plans');
    expect(data.cards.map((item) => item.code)).toEqual(['WEEKLY', 'MONTHLY', 'QUARTERLY']);
    expect(data.plans).toHaveLength(3);
    expect(data.error).toBeNull();
    expect(setHeaders).toHaveBeenCalledWith({
      'cache-control': 'public, max-age=60, stale-while-revalidate=300',
    });
  });

  it('menyembunyikan paket non-publik', async () => {
    const { data } = await run(
      apiFetch([
        plan(),
        plan({ code: 'DRAFT_1', name: 'Draf', isPublic: false, sortOrder: 0, priceIdr: 1 }),
      ]),
    );

    expect(data.plans.map((item) => item.code)).toEqual(['MONTHLY']);
  });

  it('memisahkan TRIAL_3D ke banner dan tidak menjadikan CUSTOM kartu', async () => {
    const { data } = await run(
      apiFetch([
        plan({ code: 'TRIAL_3D', name: 'Coba 3 Hari', priceIdr: 0, sortOrder: 0 }),
        plan({ code: 'CUSTOM', name: 'Paket Institusi', priceIdr: 0, sortOrder: 50 }),
        plan(),
      ]),
    );

    expect(data.trial?.code).toBe('TRIAL_3D');
    expect(data.cards.map((item) => item.code)).toEqual(['MONTHLY']);
  });

  it('hanya menerima ?plan= yang ada di daftar', async () => {
    const valid = await run(apiFetch([plan()]), '?plan=monthly');
    expect(valid.data.selectedCode).toBe('MONTHLY');

    apiClearCache();

    const invalid = await run(apiFetch([plan()]), '?plan=TIDAK_ADA');
    expect(invalid.data.selectedCode).toBeNull();
  });

  it('mengembalikan state error saat API gagal', async () => {
    const failing = vi.fn(async (_input: RequestInfo | URL) =>
      envelope({ success: false }, 502),
    );

    const { data } = await run(failing);

    expect(data.plans).toEqual([]);
    expect(data.cards).toEqual([]);
    expect(data.trial).toBeNull();
    expect(data.error).toBeTruthy();
  });

  /**
   * F5-02 bergantung pada ini: harga yang diubah admin harus langsung tampil.
   * Klien API web menyimpan GET di memory cache 15 dtk + stale-while-revalidate
   * 60 dtk, jadi `load` wajib memakai `cacheTtlMs: 0`. Kalau tidak, dua panggilan
   * berturut-turut akan mengembalikan harga lama.
   */
  it('tidak memakai memory cache klien API (harga baru langsung terlihat)', async () => {
    let price = 149_000;
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL) =>
      envelope({ success: true, data: [plan({ priceIdr: price })] }),
    );

    const first = await run(fetchImpl);
    expect(first.data.cards[0]?.priceIdr).toBe(149_000);

    price = 151_000;
    const second = await run(fetchImpl);

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(second.data.cards[0]?.priceIdr).toBe(151_000);
  });
});
