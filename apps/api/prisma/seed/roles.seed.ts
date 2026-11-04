import type { PrismaClient } from '@prisma/client';
import { PERMISSIONS, ROLE_PERMISSIONS, ROLES } from '@webcat/contracts';

const ROLE_LABEL: Record<(typeof ROLES)[number], string> = {
  USER: 'Peserta',
  ADMIN: 'Administrator',
  SUPER_ADMIN: 'Super Administrator',
};

const PERMISSION_LABEL: Record<string, string> = {
  'exam.take': 'Mengerjakan simulasi ujian',
  'questions.read': 'Melihat bank soal',
  'questions.write': 'Membuat/mengubah soal',
  'questions.import': 'Mengimpor soal dari PDF/DOCX',
  'questions.publish': 'Menerbitkan soal ke bank aktif',
  'exams.config': 'Mengubah konfigurasi tes & subtes',
  'exams.monitor': 'Memantau sesi ujian berjalan',
  'exams.recompute': 'Menghitung ulang skor sesi',
  'exams.force_unlock': 'Membuka paksa subtes yang terkunci',
  'users.read': 'Melihat daftar & detail user',
  'users.create': 'Membuat akun user baru',
  'users.suspend': 'Menonaktifkan / mengaktifkan user',
  'users.password.reset': 'Mereset password user',
  'subscriptions.manage': 'Memberi & mencabut langganan manual',
  'roles.manage': 'Mengubah role user',
  'settings.write': 'Mengubah pengaturan platform',
  'audit.read': 'Melihat jejak audit',
  'system.impersonate': 'Menyamar sebagai user (audited)',
  'billing.read': 'Melihat transaksi & langganan',
  'billing.write': 'Mengelola produk & harga',
};

/**
 * Role bersifat aditif: SUPER_ADMIN memegang SEMUA permission.
 * Disimpan di DB agar SUPER_ADMIN dapat mengubahnya tanpa deploy, tetapi
 * matriks di packages/contracts tetap menjadi default saat seed.
 */
export async function seedRoles(prisma: PrismaClient): Promise<void> {
  for (const code of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code },
      update: { name: PERMISSION_LABEL[code] ?? code },
      create: { code, name: PERMISSION_LABEL[code] ?? code },
    });
  }

  for (const roleCode of ROLES) {
    const role = await prisma.role.upsert({
      where: { code: roleCode },
      update: { name: ROLE_LABEL[roleCode] },
      create: { code: roleCode, name: ROLE_LABEL[roleCode] },
    });

    const wanted = ROLE_PERMISSIONS[roleCode];
    const permissions = await prisma.permission.findMany({
      where: { code: { in: [...wanted] } },
      select: { id: true },
    });

    // Sinkronisasi penuh: role selalu tepat sama dengan matriks kontrak.
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });

    console.log(`  role ${roleCode}: ${permissions.length} permission`);
  }
}
