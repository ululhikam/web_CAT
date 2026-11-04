/**
 * Seed data minimal yang HARUS ada agar aplikasi bisa dipakai:
 *
 *   1. 3 role + permission (matriks sama dengan packages/contracts/rbac)
 *   2. 3 stage: PSIKOLOGI, TPA, TPK
 *   3. 6 subtes (4 psikologi + TPA + TPK)
 *   4. exam_settings (singleton)
 *   5. subscription_plans (harga awal, bisa diubah admin lewat DB)
 *   6. akun SUPER_ADMIN pertama (dari env, sekali pakai)
 *
 * Idempoten: aman dijalankan berulang (`pnpm db:seed`).
 */
import { PrismaClient } from '@prisma/client';
import { PERMISSIONS, ROLE_PERMISSIONS, ROLES } from '@webcat/contracts';
import { loadLocalEnv } from '../../src/core/config/load-env';
import { seedExamStructure } from './exam.seed';
import { seedPlans } from './plans.seed';
import { seedRoles } from './roles.seed';
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
  await seedPlans(prisma);
  await seedSuperAdmin(prisma);

  const permissions = await prisma.permission.count();
  const roles = await prisma.role.count();
  const stages = await prisma.examStage.count();
  const subtests = await prisma.subtest.count();
  const plans = await prisma.subscriptionPlan.count();
  const users = await prisma.user.count();

  console.log('Ringkasan:');
  console.table({
    permissions,
    roles,
    stages,
    subtests,
    plans,
    users,
  });
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
