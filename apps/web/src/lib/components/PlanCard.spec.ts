import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import PlanCard from './PlanCard.svelte';

/**
 * F5-01 / ADR 0003 — kartu paket tidak boleh menyimpan harga sendiri.
 *
 * Harga yang tampil harus berasal dari prop `plan` (data `GET /api/v1/plans`).
 * Angka uji sengaja dipilih tidak lazim (Rp 137.000) agar harga hardcode
 * langsung terdeteksi: kalau komponen memakai konstanta, angka itu tidak akan
 * muncul.
 */
const basePlan = {
  id: 'plan-1',
  code: 'UJI_30D',
  name: 'Paket Uji 30 Hari',
  tagline: 'Untuk pengujian',
  priceIdr: 137_000,
  compareAtPriceIdr: null,
  durationDays: 30,
  pricePerDayIdr: 4_567,
  features: [
    { label: 'Pembahasan lengkap', included: true },
    { label: 'Analisis per subtes', included: false },
  ],
  isPublic: true,
  sortOrder: 1,
  badge: null,
  isPopular: false,
};

describe('PlanCard', () => {
  it('menampilkan harga, durasi, dan harga per hari dari prop plan', () => {
    const { body } = render(PlanCard, { props: { plan: basePlan } });

    expect(body).toContain('Paket Uji 30 Hari');
    // formatIdr memakai locale id-ID dengan pemisah titik.
    expect(body).toContain('Rp 137.000');
    expect(body).toContain('30 hari');
    expect(body).toContain('Rp 4.567/hari');
  });

  it('menandai fitur yang tidak termasuk dan tidak menampilkan harga coret', () => {
    const { body } = render(PlanCard, { props: { plan: basePlan } });

    expect(body).toContain('Pembahasan lengkap');
    expect(body).toContain('Analisis per subtes');
    expect(body).toContain('plan__feature--off');
    expect(body).not.toContain('plan__compare');
  });

  it('memakai label "Gratis" untuk paket tanpa biaya', () => {
    const { body } = render(PlanCard, {
      props: {
        plan: { ...basePlan, code: 'TRIAL_3D', priceIdr: 0, pricePerDayIdr: 0, isPopular: true },
      },
    });

    expect(body).toContain('Gratis');
    expect(body).toContain('Coba gratis');
    expect(body).toContain('Paling populer');
  });
});
