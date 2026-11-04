import type { LayoutServerLoad } from './$types';

/**
 * Layout global tidak menyentuh database. Sesi peserta dipulihkan di klien
 * lewat cookie refresh httpOnly, sehingga SSR tetap bisa di-cache untuk
 * halaman publik (pricing, landing).
 */
export const load: LayoutServerLoad = async () => {
  return {};
};
