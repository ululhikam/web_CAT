import { DEFAULT_PLANS as CONTRACT_DEFAULT_PLANS, type Plan } from '@webcat/contracts';

/**
 * Fallback pricing bila database belum di-seed / belum terjangkau.
 *
 * Nilainya TIDAK didefinisikan di sini: satu sumber di `@webcat/contracts`
 * agar API dan halaman pricing web tidak pernah berbeda angka.
 */
export const DEFAULT_PLANS: Plan[] = [...CONTRACT_DEFAULT_PLANS];
