import { describe, expect, it } from 'vitest';
import { DEFAULT_PLANS } from '../src/plans/default-plans';

describe('DEFAULT_PLANS', () => {
  it('memiliki kode unik dan id unik', () => {
    const codes = DEFAULT_PLANS.map((plan) => plan.code);
    const ids = DEFAULT_PLANS.map((plan) => plan.id);

    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('selalu punya tepat satu paket populer', () => {
    const popular = DEFAULT_PLANS.filter((plan) => plan.isPopular);
    expect(popular).toHaveLength(1);
    expect(popular[0].code).toBe('MONTHLY');
  });

  it('harga per hari konsisten dengan harga dibagi durasi', () => {
    for (const plan of DEFAULT_PLANS) {
      if (plan.durationDays <= 0 || plan.priceIdr === 0) {
        expect(plan.pricePerDayIdr).toBe(0);
        continue;
      }

      const expected = Math.round(plan.priceIdr / plan.durationDays);
      expect(
        Math.abs(plan.pricePerDayIdr - expected),
        `${plan.code}: harga per hari tidak konsisten`,
      ).toBeLessThanOrEqual(1);
    }
  });

  it('harga coret selalu lebih tinggi dari harga jual', () => {
    for (const plan of DEFAULT_PLANS) {
      if (plan.compareAtPriceIdr === null) continue;
      expect(plan.compareAtPriceIdr).toBeGreaterThan(plan.priceIdr);
    }
  });

  it('durasi dalam rentang 1..3650 hari dan urutan tidak duplikat', () => {
    for (const plan of DEFAULT_PLANS) {
      expect(plan.durationDays).toBeGreaterThanOrEqual(1);
      expect(plan.durationDays).toBeLessThanOrEqual(3650);
    }

    const orders = DEFAULT_PLANS.map((plan) => plan.sortOrder);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('memuat paket gratis, populer, dan institusi', () => {
    const codes = new Set(DEFAULT_PLANS.map((plan) => plan.code));
    expect(codes.has('TRIAL_3D')).toBe(true);
    expect(codes.has('MONTHLY')).toBe(true);
    expect(codes.has('CUSTOM')).toBe(true);

    const trial = DEFAULT_PLANS.find((plan) => plan.code === 'TRIAL_3D');
    expect(trial?.priceIdr).toBe(0);
  });
});
