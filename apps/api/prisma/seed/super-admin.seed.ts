import type { PrismaClient } from '@prisma/client';
import { hashSeedPassword } from './password';

/**
 * Membuat akun SUPER_ADMIN pertama dari environment:
 *   BOOTSTRAP_SUPER_ADMIN_EMAIL
 *   BOOTSTRAP_SUPER_ADMIN_PASSWORD
 *   BOOTSTRAP_SUPER_ADMIN_NAME (opsional)
 *
 * Aman dijalankan berulang: bila email sudah ada, hanya role yang
 * dinormalkan ke SUPER_ADMIN; password TIDAK pernah ditimpa diam-diam.
 */
export async function seedSuperAdmin(prisma: PrismaClient): Promise<void> {
  const email = process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_SUPER_ADMIN_PASSWORD;
  const fullName = process.env.BOOTSTRAP_SUPER_ADMIN_NAME?.trim() || 'Super Admin';

  const superRole = await prisma.role.findUnique({ where: { code: 'SUPER_ADMIN' } });
  if (!superRole) throw new Error('Role SUPER_ADMIN belum ada — seed roles dulu');

  const existingSuperAdmin = await prisma.user.count({
    where: { roleId: superRole.id, deletedAt: null },
  });

  if (!email || !password) {
    if (existingSuperAdmin === 0) {
      console.warn(
        '  [PERINGATAN] Belum ada SUPER_ADMIN dan BOOTSTRAP_SUPER_ADMIN_EMAIL/PASSWORD kosong.',
      );
      console.warn('               Isi keduanya di .env lalu jalankan `pnpm db:seed` lagi.');
    } else {
      console.log('  SUPER_ADMIN sudah ada; bootstrap dilewati.');
    }
    return;
  }

  if (password.length < 10) {
    throw new Error('BOOTSTRAP_SUPER_ADMIN_PASSWORD minimal 10 karakter');
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        roleId: superRole.id,
        status: 'ACTIVE',
        deletedAt: null,
        passwordHash: await hashSeedPassword(password),
      },
    });
    console.log(`  ${email} dipastikan SUPER_ADMIN dengan password terkonfigurasi`);
    return;
  }

  await prisma.user.create({
    data: {
      email,
      fullName,
      passwordHash: await hashSeedPassword(password),
      roleId: superRole.id,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`  SUPER_ADMIN dibuat: ${email}`);
}
