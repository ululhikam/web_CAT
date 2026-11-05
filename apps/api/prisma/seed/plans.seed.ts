import type { PrismaClient } from '@prisma/client';

interface PlanSeed {
  code: string;
  name: string;
  tagline: string;
  priceIdr: number;
  compareAtPriceIdr: number | null;
  durationDays: number;
  badge: string | null;
  isPopular: boolean;
  isPublic: boolean;
  sortOrder: number;
  features: Array<{ label: string; included: boolean }>;
}

/**
 * Harga awal. Sumber kebenaran = tabel ini (bukan hardcode di web).
 * Admin dapat mengubah harga/konten lewat panel; kode plan TIDAK boleh diubah
 * karena dipakai sebagai referensi transaksi dan audit.
 *
 * Catatan: nominal masih sementara dan perlu konfirmasi bisnis.
 */
export const PLANS: PlanSeed[] = [
  {
    code: 'TRIAL_3D',
    name: 'Coba 3 Hari',
    tagline: 'Kenali alur ujian tanpa komitmen',
    priceIdr: 0,
    compareAtPriceIdr: null,
    durationDays: 3,
    badge: 'GRATIS',
    isPopular: false,
    isPublic: true,
    sortOrder: 0,
    features: [
      { label: '1 sesi simulasi penuh (3 tes)', included: true },
      { label: 'Pembahasan jawaban', included: false },
      { label: 'Analisis hasil per subtes', included: false },
    ],
  },
  {
    code: 'WEEKLY',
    name: 'Mingguan',
    tagline: 'Latihan intensif tujuh hari',
    priceIdr: 49000,
    compareAtPriceIdr: null,
    durationDays: 7,
    badge: null,
    isPopular: false,
    isPublic: true,
    sortOrder: 10,
    features: [
      { label: 'Sesi simulasi tanpa batas', included: true },
      { label: 'Pembahasan jawaban', included: true },
      { label: 'Analisis hasil per subtes', included: true },
      { label: 'Mentoring grup', included: false },
    ],
  },
  {
    code: 'BIWEEKLY',
    name: 'Dua Mingguan',
    tagline: 'Persiapan seleksi tahap awal',
    priceIdr: 89000,
    compareAtPriceIdr: 98000,
    durationDays: 14,
    badge: null,
    isPopular: false,
    isPublic: true,
    sortOrder: 20,
    features: [
      { label: 'Sesi simulasi tanpa batas', included: true },
      { label: 'Pembahasan jawaban', included: true },
      { label: 'Analisis hasil per subtes', included: true },
      { label: 'Mentoring grup', included: false },
    ],
  },
  {
    code: 'MONTHLY',
    name: 'Bulanan',
    tagline: 'Pilihan paling banyak diambil',
    priceIdr: 149000,
    compareAtPriceIdr: 196000,
    durationDays: 30,
    badge: 'PALING POPULER',
    isPopular: true,
    isPublic: true,
    sortOrder: 30,
    features: [
      { label: 'Sesi simulasi tanpa batas', included: true },
      { label: 'Pembahasan jawaban', included: true },
      { label: 'Analisis hasil per subtes', included: true },
      { label: 'Mentoring grup', included: true },
    ],
  },
  {
    code: 'QUARTERLY',
    name: 'Tiga Bulan',
    tagline: 'Untuk persiapan seleksi penuh',
    priceIdr: 399000,
    compareAtPriceIdr: 447000,
    durationDays: 90,
    badge: 'HEMAT 33%',
    isPopular: false,
    isPublic: true,
    sortOrder: 40,
    features: [
      { label: 'Sesi simulasi tanpa batas', included: true },
      { label: 'Pembahasan jawaban', included: true },
      { label: 'Analisis hasil per subtes', included: true },
      { label: 'Mentoring grup', included: true },
      { label: 'Prioritas dukungan', included: true },
    ],
  },
  {
    code: 'CUSTOM',
    name: 'Paket Institusi',
    tagline: 'Untuk sekolah / lembaga bimbel',
    priceIdr: 0,
    compareAtPriceIdr: null,
    durationDays: 30,
    badge: null,
    isPopular: false,
    isPublic: true,
    sortOrder: 50,
    features: [
      { label: 'Kuota peserta fleksibel', included: true },
      { label: 'Dashboard admin lembaga', included: true },
      { label: 'Laporan agregat', included: true },
      { label: 'Harga menyesuaikan kuota', included: true },
    ],
  },
];

export async function seedPlans(prisma: PrismaClient): Promise<void> {
  for (const plan of PLANS) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        tagline: plan.tagline,
        priceIdr: plan.priceIdr,
        compareAtPriceIdr: plan.compareAtPriceIdr,
        durationDays: plan.durationDays,
        features: plan.features as never,
        badge: plan.badge,
        isPopular: plan.isPopular,
        isPublic: plan.isPublic,
        sortOrder: plan.sortOrder,
        // Seed = keadaan yang diinginkan untuk dataset demo, jadi paket yang
        // pernah di-soft-delete admin ikut hidup lagi. Tanpa ini, `db:seed`
        // menjadi tidak idempoten dan test integrasi bisa mewarisi paket
        // terarsip dari run sebelumnya (`subscription_plans` tidak di-truncate).
        deletedAt: null,
      },
      create: {
        code: plan.code,
        name: plan.name,
        tagline: plan.tagline,
        priceIdr: plan.priceIdr,
        compareAtPriceIdr: plan.compareAtPriceIdr,
        durationDays: plan.durationDays,
        features: plan.features as never,
        badge: plan.badge,
        isPopular: plan.isPopular,
        isPublic: plan.isPublic,
        sortOrder: plan.sortOrder,
        status: 'ACTIVE',
      },
    });
  }
  console.log(`  ${PLANS.length} paket langganan`);
}
