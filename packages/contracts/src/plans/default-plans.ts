import type { Plan } from './index';

/**
 * Paket default — nilai cadangan bila tabel `subscription_plans` belum diisi
 * atau database tidak terjangkau.
 *
 * Sumber kebenaran tetap database (admin bisa mengubah harga tanpa deploy).
 * Konstanta ini dipakai oleh:
 *   - API (`PlansService`) sebagai fallback, dan
 *   - web (`/pricing` +page.server.ts) agar halaman tetap menampilkan paket
 *     saat API gagal sesaat.
 *
 * Semua nominal dalam Rupiah penuh (bukan sen).
 */
const DEFAULT_PLAN_SEEDS: ReadonlyArray<Omit<Plan, 'status'>> = [
  {
    id: 'fallback-trial-3d',
    code: 'TRIAL_3D',
    name: 'Coba 3 Hari',
    tagline: 'Kenali alur ujian tanpa komitmen',
    priceIdr: 0,
    compareAtPriceIdr: null,
    durationDays: 3,
    pricePerDayIdr: 0,
    features: [
      { label: '1 sesi simulasi penuh (3 tes)', included: true },
      { label: 'Pembahasan jawaban', included: false },
      { label: 'Analisis hasil per subtes', included: false },
    ],
    isPublic: true,
    sortOrder: 0,
    badge: 'GRATIS',
    isPopular: false,
  },
  {
    id: 'fallback-weekly',
    code: 'WEEKLY',
    name: 'Mingguan',
    tagline: 'Latihan intensif tujuh hari',
    priceIdr: 49000,
    compareAtPriceIdr: null,
    durationDays: 7,
    pricePerDayIdr: 7000,
    features: [
      { label: 'Sesi simulasi tanpa batas', included: true },
      { label: 'Pembahasan jawaban', included: true },
      { label: 'Analisis hasil per subtes', included: true },
      { label: 'Mentoring grup', included: false },
    ],
    isPublic: true,
    sortOrder: 10,
    badge: null,
    isPopular: false,
  },
  {
    id: 'fallback-biweekly',
    code: 'BIWEEKLY',
    name: 'Dua Mingguan',
    tagline: 'Persiapan seleksi tahap awal',
    priceIdr: 89000,
    compareAtPriceIdr: 98000,
    durationDays: 14,
    pricePerDayIdr: 6358,
    features: [
      { label: 'Sesi simulasi tanpa batas', included: true },
      { label: 'Pembahasan jawaban', included: true },
      { label: 'Analisis hasil per subtes', included: true },
      { label: 'Mentoring grup', included: false },
    ],
    isPublic: true,
    sortOrder: 20,
    badge: null,
    isPopular: false,
  },
  {
    id: 'fallback-monthly',
    code: 'MONTHLY',
    name: 'Bulanan',
    tagline: 'Pilihan paling banyak diambil',
    priceIdr: 149000,
    compareAtPriceIdr: 196000,
    durationDays: 30,
    pricePerDayIdr: 4967,
    features: [
      { label: 'Sesi simulasi tanpa batas', included: true },
      { label: 'Pembahasan jawaban', included: true },
      { label: 'Analisis hasil per subtes', included: true },
      { label: 'Mentoring grup', included: true },
    ],
    isPublic: true,
    sortOrder: 30,
    badge: 'PALING POPULER',
    isPopular: true,
  },
  {
    id: 'fallback-quarterly',
    code: 'QUARTERLY',
    name: 'Tiga Bulan',
    tagline: 'Untuk persiapan seleksi penuh',
    priceIdr: 399000,
    compareAtPriceIdr: 447000,
    durationDays: 90,
    pricePerDayIdr: 4433,
    features: [
      { label: 'Sesi simulasi tanpa batas', included: true },
      { label: 'Pembahasan jawaban', included: true },
      { label: 'Analisis hasil per subtes', included: true },
      { label: 'Mentoring grup', included: true },
      { label: 'Prioritas dukungan', included: true },
    ],
    isPublic: true,
    sortOrder: 40,
    badge: 'HEMAT 33%',
    isPopular: false,
  },
  {
    id: 'fallback-custom',
    code: 'CUSTOM',
    name: 'Paket Institusi',
    tagline: 'Untuk sekolah / lembaga bimbel',
    priceIdr: 0,
    compareAtPriceIdr: null,
    durationDays: 30,
    pricePerDayIdr: 0,
    features: [
      { label: 'Kuota peserta fleksibel', included: true },
      { label: 'Dashboard admin lembaga', included: true },
      { label: 'Laporan agregat', included: true },
      { label: 'Harga menyesuaikan kuota', included: true },
    ],
    isPublic: true,
    sortOrder: 50,
    badge: null,
    isPopular: false,
  },
];

/** Semua paket fallback dianggap aktif agar bisa tampil di halaman pricing. */
export const DEFAULT_PLANS: readonly Plan[] = DEFAULT_PLAN_SEEDS.map((plan) => ({
  ...plan,
  status: 'ACTIVE' as const,
}));
