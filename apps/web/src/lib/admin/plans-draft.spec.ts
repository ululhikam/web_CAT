import { describe, expect, it } from 'vitest';
import type { AdminPlan } from '@webcat/contracts';
import {
  buildCreatePayload,
  buildUpdatePayload,
  describePlanChange,
  draftFromPlan,
  emptyDraft,
  splitPlans,
  validateDraft,
  type PlanDraft,
} from './plans-draft';

/**
 * F5-02 — form paket admin.
 *
 * Yang diuji adalah keputusan yang tidak terlihat di UI: kapan payload boleh
 * dikirim, apa yang dikirim (harga sebagai angka, kode di-uppercase), dan
 * bagaimana paket terarsip dipisahkan dari paket hidup.
 */
function plan(overrides: Partial<AdminPlan> = {}): AdminPlan {
  return {
    id: 'plan-1',
    code: 'BULANAN',
    name: 'Paket Bulanan',
    tagline: 'Akses 30 hari',
    priceIdr: 149_000,
    compareAtPriceIdr: null,
    durationDays: 30,
    pricePerDayIdr: 4_967,
    features: [{ label: 'Semua tes', included: true }],
    badge: null,
    isPopular: false,
    isPublic: true,
    sortOrder: 1,
    status: 'ACTIVE',
    createdAt: '2026-11-05T00:00:00.000Z',
    updatedAt: '2026-11-05T00:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

function draft(overrides: Partial<PlanDraft> = {}): PlanDraft {
  return {
    ...emptyDraft('ACTIVE'),
    code: 'BULANAN',
    name: 'Paket Bulanan',
    priceIdr: 149_000,
    ...overrides,
  };
}

describe('plan draft — validasi', () => {
  it('draf kosong ditolak dengan pesan yang menunjuk field', () => {
    const issues = validateDraft(emptyDraft(), 'create');

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Kode paket'),
        expect.stringContaining('Nama paket'),
      ]),
    );
  });

  it('menerima draf lengkap dan menolak harga coret yang tidak lebih besar', () => {
    expect(validateDraft(draft(), 'create')).toEqual([]);

    const issues = validateDraft(draft({ compareAtPriceIdr: 149_000 }), 'create');
    expect(issues).toEqual(
      expect.arrayContaining([expect.stringContaining('Harga coret harus lebih besar')]),
    );
  });

  it('tidak mewajibkan kode saat update (kode tidak bisa diubah)', () => {
    const issues = validateDraft(draft({ code: 'x' }), 'update');

    expect(issues.filter((issue) => issue.includes('Kode paket'))).toEqual([]);
  });

  it('menolak durasi, urutan, dan harga di luar batas kontrak', () => {
    const issues = validateDraft(
      draft({ durationDays: 0, sortOrder: -1, priceIdr: -5 }),
      'create',
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Durasi'),
        expect.stringContaining('Urutan'),
        expect.stringContaining('Harga'),
      ]),
    );
  });
});

describe('plan draft — payload', () => {
  it('mengirim kode uppercase, angka sebagai number, dan tagline kosong sebagai null', () => {
    const payload = buildCreatePayload(
      draft({ code: '  bulanan  ', tagline: '   ', badge: '  Hemat  ' }),
    );

    expect(payload.code).toBe('BULANAN');
    expect(payload.priceIdr).toBe(149_000);
    expect(payload.tagline).toBeNull();
    expect(payload.badge).toBe('Hemat');
    expect(payload.status).toBe('ACTIVE');
  });

  it('membuang baris fitur tanpa label sebelum dikirim', () => {
    const payload = buildCreatePayload(
      draft({
        features: [
          { label: ' Pembahasan lengkap ', included: true },
          { label: '   ', included: false },
        ],
      }),
    );

    expect(payload.features).toEqual([{ label: 'Pembahasan lengkap', included: true }]);
  });

  it('payload update tidak menyertakan code', () => {
    const payload = buildUpdatePayload(draft({ code: 'BERUBAH' }));

    expect(payload).not.toHaveProperty('code');
    expect(payload.priceIdr).toBe(149_000);
  });
});

describe('plan draft — daftar', () => {
  it('memisahkan paket hidup dari paket terarsip', () => {
    const { live, archived } = splitPlans([
      plan(),
      plan({ id: 'plan-2', code: 'LAMA', deletedAt: '2026-11-05T10:00:00.000Z' }),
    ]);

    expect(live.map((row) => row.code)).toEqual(['BULANAN']);
    expect(archived.map((row) => row.code)).toEqual(['LAMA']);
  });

  it('draftFromPlan menyalin semua field yang bisa diedit', () => {
    const source = plan({ tagline: null, badge: null, compareAtPriceIdr: 199_000 });
    const copy = draftFromPlan(source);

    expect(copy).toMatchObject({
      code: 'BULANAN',
      tagline: '',
      badge: '',
      compareAtPriceIdr: 199_000,
      durationDays: 30,
    });
    // Salinan: mengubah draft tidak boleh mengubah objek sumber.
    copy.features.push({ label: 'Baru', included: true });
    expect(source.features).toHaveLength(1);
  });
});

describe('plan draft — ringkasan perubahan', () => {
  it('menyebut akibat yang paling penting: harga dan publikasi', () => {
    const before = plan();
    const after = plan({ priceIdr: 159_000, isPublic: false });

    const summary = describePlanChange(before, after);

    expect(summary).toContain('harga 149000 → 159000');
    expect(summary).toContain('disembunyikan dari /pricing');
  });

  it('menandai pembuatan paket baru', () => {
    expect(describePlanChange(null, plan())).toBe('Paket BULANAN dibuat.');
  });
});
