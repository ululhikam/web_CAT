import type { PrismaClient } from '@prisma/client';
import { hashSeedPassword } from './password';

/**
 * Membuat akun ADMIN operasional dari environment:
 *   BOOTSTRAP_ADMIN_EMAIL
 *   BOOTSTRAP_ADMIN_PASSWORD
 *   BOOTSTRAP_ADMIN_NAME (opsional)
 *
 * ADMIN sengaja TIDAK memiliki `audit.read`, `settings.write`, dan
 * `roles.manage`, sehingga panel yang tampil berbeda dari SUPER_ADMIN.
 *
 * Aman dijalankan berulang: bila email sudah ada, role hanya dinormalkan
 * ke ADMIN; password TIDAK pernah ditimpa diam-diam, dan akun SUPER_ADMIN
 * tidak akan diturunkan.
 */
export async function seedAdmin(prisma: PrismaClient): Promise<void> {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const fullName = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || 'Admin Operasional';

  const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  if (!adminRole) throw new Error('Role ADMIN belum ada — seed roles dulu');

  const existingAdminCount = await prisma.user.count({
    where: { roleId: adminRole.id, deletedAt: null },
  });

  if (!email || !password) {
    if (existingAdminCount === 0) {
      console.warn('  [PERINGATAN] Belum ada ADMIN dan BOOTSTRAP_ADMIN_EMAIL/PASSWORD kosong.');
      console.warn('               Isi keduanya di .env lalu jalankan `pnpm db:seed` lagi.');
    } else {
      console.log(`  ${existingAdminCount} ADMIN sudah ada; bootstrap dilewati.`);
    }
    return;
  }

  if (password.length < 10) {
    throw new Error('BOOTSTRAP_ADMIN_PASSWORD minimal 10 karakter');
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (existing) {
    if (existing.role.code === 'SUPER_ADMIN') {
      console.log(`  ${email} sudah SUPER_ADMIN; tidak diturunkan menjadi ADMIN`);
      return;
    }

    await prisma.user.update({
      where: { id: existing.id },
      data: {
        roleId: adminRole.id,
        status: 'ACTIVE',
        deletedAt: null,
        passwordHash: await hashSeedPassword(password),
      },
    });
    console.log(`  ${email} dipastikan ADMIN dengan password terkonfigurasi`);
    return;
  }

  await prisma.user.create({
    data: {
      email,
      fullName,
      passwordHash: await hashSeedPassword(password),
      roleId: adminRole.id,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`  ADMIN dibuat: ${email}`);
}
