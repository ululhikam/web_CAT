/**
 * Seed data minimal yang HARUS ada agar aplikasi bisa dipakai:
 *
 *   1. 3 role + permission (matriks sama dengan packages/contracts/rbac)
 *   2. 3 stage: PSIKOLOGI, TPA, TPK
 *   3. 6 subtes (4 psikologi + TPA + TPK)
 *   4. exam_settings (singleton)
 *   5. subscription_plans (harga awal, bisa diubah admin lewat DB)
 *   6. akun SUPER_ADMIN pertama (dari env, sekali pakai)
 *   7. akun ADMIN operasional (dari env, sekali pakai)
 *   8. peserta contoh (opsional, hanya bila SEED_DEMO_USERS=true)
 *
 * Idempoten: aman dijalankan berulang (`pnpm db:seed`).
 */
import { PrismaClient } from '@prisma/client';
import { PERMISSIONS, ROLE_PERMISSIONS, ROLES } from '@webcat/contracts';
import { loadLocalEnv } from '../../src/core/config/load-env';
import { DevStorage } from '../../src/core/ports/impl/dev-storage';
import { MediaService } from '../../src/modules/media/media.service';
import { seedAdmin } from './admin.seed';
import { seedDemoUsers } from './demo-users.seed';
import { seedExamStructure } from './exam.seed';
import { seedMediaAssets } from './media.seed';
import { seedPlans } from './plans.seed';
import { seedQuestionBank } from './question.seed';
import { seedRoles } from './roles.seed';
import { seedPlatformSettings } from './settings.seed';
import { seedSuperAdmin } from './super-admin.seed';

// `pnpm db:seed` dijalankan lewat tsx (bukan Prisma CLI), jadi `.env`
// harus dimuat sendiri sebelum PrismaClient dibuat.
loadLocalEnv();

export const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

async function main(): Promise<void> {
  const started = Date.now();
  console.log('— Seed Web CAT —');

  await seedRoles(prisma);
  await seedExamStructure(prisma);

  // Aset gambar harus ada lebih dulu: `seedQuestionBank` menolak soal yang
  // menunjuk aset belum terdaftar (lebih baik gagal cepat daripada soal
  // bergambar tanpa gambar).
  const media = new MediaService(
    prisma as never,
    { record: async () => undefined } as never,
    {
      value: {
        NODE_ENV: process.env.NODE_ENV ?? 'development',
        STORAGE: 'dev',
        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'seed-media-placeholder',
      },
    } as never,
    new DevStorage(),
  );
  const seedMedia = await seedMediaAssets(prisma, media);
  console.log(
    `  aset media figural: ${seedMedia.total} gambar → ${seedMedia.idByCode.size} kode (baru ${seedMedia.created})`,
  );

  await seedQuestionBank(prisma, seedMedia.idByCode);
  await seedPlans(prisma);
  await seedPlatformSettings(prisma);
  await seedSuperAdmin(prisma);
  await seedAdmin(prisma);
  await seedDemoUsers(prisma);

  const permissions = await prisma.permission.count();
  const roles = await prisma.role.count();
  const stages = await prisma.examStage.count();
  const subtests = await prisma.subtest.count();
  const plans = await prisma.subscriptionPlan.count();
  const users = await prisma.user.count();
  const categories = await prisma.category.count();
  const questions = await prisma.question.count();
  const mediaAssets = await prisma.mediaAsset.count();
  const questionMedia = await prisma.questionMedia.count();

  console.log('Ringkasan Data:');
  console.table({
    permissions,
    roles,
    stages,
    subtests,
    plans,
    users,
    categories,
    questions,
    mediaAssets,
    questionMedia,
  });

  console.log('\n================ AKUN CONTOH LOGIN ================');
  console.table([
    {
      Peran: 'SUPER_ADMIN',
      Email: process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL || 'admin@example.com',
      Password: process.env.BOOTSTRAP_SUPER_ADMIN_PASSWORD || 'Narcissistic',
      'Target URL': '/super-admin',
      Keterangan: 'Akses penuh platform & audit log',
    },
    {
      Peran: 'ADMIN',
      Email: process.env.BOOTSTRAP_ADMIN_EMAIL || 'operator@example.com',
      Password: process.env.BOOTSTRAP_ADMIN_PASSWORD || 'AdminOperator123',
      'Target URL': '/admin',
      Keterangan: 'Kelola soal & peserta operasional',
    },
    {
      Peran: 'USER (Peserta)',
      Email: 'user@example.com',
      Password: 'PesertaDemo123',
      'Target URL': '/dashboard',
      Keterangan: 'Peserta aktif (langganan 30 hari)',
    },
    {
      Peran: 'USER (Peserta)',
      Email: 'peserta.aktif@example.com',
      Password: 'PesertaDemo123',
      'Target URL': '/dashboard',
      Keterangan: 'Peserta aktif (langganan 21 hari)',
    },
  ]);
  console.log('====================================================\n');
  console.log(`Selesai dalam ${Date.now() - started} ms.`);
}

main()
  .catch((error) => {
    console.error('Seed gagal:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// Re-export agar bisa dipakai script lain (mis. reset demo).
export { PERMISSIONS, ROLE_PERMISSIONS, ROLES };
