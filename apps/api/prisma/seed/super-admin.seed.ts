import type { PrismaClient } from '@prisma/client';
import { randomBytes, scrypt } from 'node:crypto';

const PARAMS = { N: 16384, r: 8, p: 1, keyLen: 64 };

function deriveKey(plain: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      plain,
      salt,
      PARAMS.keyLen,
      { N: PARAMS.N, r: PARAMS.r, p: PARAMS.p, maxmem: 64 * 1024 * 1024 },
      (error, derived) => {
        if (error) reject(error);
        else resolve(derived);
      },
    );
  });
}

/**
 * Hash password untuk seed. Sengaja menduplikasi logika PasswordService
 * (bukan mengimpornya) agar seed tidak bergantung pada bootstrap Nest.
 * Format HARUS identik: `scrypt$N$r$p$salt$hash`.
 */
async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await deriveKey(plain, salt);

  return [
    'scrypt',
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString('base64'),
    derived.toString('base64'),
  ].join('$');
}

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
    if (existing.roleId !== superRole.id) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { roleId: superRole.id, status: 'ACTIVE', deletedAt: null },
      });
      console.log(`  ${email} dinaikkan menjadi SUPER_ADMIN`);
    } else {
      console.log(`  ${email} sudah SUPER_ADMIN; tidak ada perubahan`);
    }
    return;
  }

  await prisma.user.create({
    data: {
      email,
      fullName,
      passwordHash: await hashPassword(password),
      roleId: superRole.id,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`  SUPER_ADMIN dibuat: ${email}`);
}
