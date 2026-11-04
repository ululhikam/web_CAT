import type { Plan } from '@webcat/contracts';
import { apiRequest } from '$lib/api/client';
import type { PageServerLoad } from './$types';

/**
 * Landing page. Menampilkan ringkasan paket termurah sebagai teaser.
 * Kegagalan API tidak boleh mematikan halaman pemasaran: blok harga
 * disembunyikan, bukan menampilkan error.
 */
export const load: PageServerLoad = async ({ fetch }) => {
  try {
    const plans = await apiRequest<Plan[]>('/plans', { fetchImpl: fetch });

    const paid = plans
      .filter((plan) => plan.isPublic && plan.priceIdr > 0)
      .sort((a, b) => a.priceIdr - b.priceIdr);

    return {
      cheapest: paid[0] ?? null,
      planCount: plans.filter((plan) => plan.isPublic).length,
    };
  } catch {
    return { cheapest: null, planCount: 0 };
  }
};
