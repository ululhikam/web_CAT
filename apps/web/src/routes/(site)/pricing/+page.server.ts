import type { Plan } from '@webcat/contracts';
import { apiRequest } from '$lib/api/client';
import type { PageServerLoad } from './$types';

/**
 * Halaman pricing (§9.3 plan.md).
 *
 * - SSR: harga sudah ada di HTML pertama sehingga terlihat tanpa menunggu JS.
 * - Sumber data tunggal: `GET /plans` → tabel `subscription_plans`.
 * - Kegagalan API ditampilkan sebagai state error dengan tombol "Coba lagi"
 *   (bukan halaman kosong). API sendiri sudah punya fallback `DEFAULT_PLANS`
 *   sehingga kondisi ini hanya terjadi saat API benar-benar tak terjangkau.
 * - `?plan=<CODE>` menandai kartu terpilih dan divalidasi terhadap daftar.
 */
export const load: PageServerLoad = async ({ fetch, setHeaders, url }) => {
  setHeaders({
    'cache-control': 'public, max-age=60, stale-while-revalidate=300',
  });

  const requested = url.searchParams.get('plan')?.trim().toUpperCase() ?? null;

  try {
    const plans = await apiRequest<Plan[]>('/plans', { fetchImpl: fetch });

    const visible = plans
      .filter((plan) => plan.isPublic)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.priceIdr - b.priceIdr);

    const selectedCode =
      requested && visible.some((plan) => plan.code === requested) ? requested : null;

    return {
      plans: visible,
      trial: visible.find((plan) => plan.code === 'TRIAL_3D') ?? null,
      cards: visible.filter((plan) => plan.code !== 'TRIAL_3D' && plan.code !== 'CUSTOM'),
      selectedCode,
      error: null,
    };
  } catch {
    return {
      plans: [] as Plan[],
      trial: null,
      cards: [] as Plan[],
      selectedCode: null,
      error: 'Daftar paket gagal dimuat. Periksa koneksi Anda lalu coba lagi.',
    };
  }
};
