import type { PrismaClient } from '@prisma/client';
import { hashSeedPassword } from './password';

interface DemoUser {
  email: string;
  fullName: string;
  phone: string | null;
  status: 'ACTIVE' | 'PENDING_INVITE' | 'SUSPENDED';
  planCode: string | null;
  /** Offset hari dari sekarang; negatif = sudah lewat. */
  endsInDays: number | null;
}

/**
 * Peserta contoh agar panel admin langsung punya data untuk diperiksa.
 *
 * Aktif hanya bila `SEED_DEMO_USERS=true` (lihat .env.example). Jangan
 * dipakai di produksi. Idempoten berdasarkan email; akun yang sudah ada
 * tidak diubah.
 */
const DEMO_USERS: DemoUser[] = [
  {
    email: 'user@example.com',
    fullName: 'Budi Santoso',
    phone: '081234567890',
    status: 'ACTIVE',
    planCode: 'MONTHLY',
    endsInDays: 30,
  },
  {
    email: 'peserta.aktif@example.com',
    fullName: 'Rani Pratama',
    phone: '081200000001',
    status: 'ACTIVE',
    planCode: 'MONTHLY',
    endsInDays: 21,
  },
  {
    email: 'peserta.berakhir@example.com',
    fullName: 'Bagus Santoso',
    phone: '081200000002',
    status: 'ACTIVE',
    planCode: 'WEEKLY',
    endsInDays: -14,
  },
  {
    email: 'peserta.baru@example.com',
    fullName: 'Nadia Putri',
    phone: null,
    status: 'PENDING_INVITE',
    planCode: null,
    endsInDays: null,
  },
];

const DEMO_PASSWORD = 'PesertaDemo123';

export async function seedDemoUsers(prisma: PrismaClient): Promise<void> {
  if (process.env.SEED_DEMO_USERS !== 'true') {
    console.log('  SEED_DEMO_USERS tidak aktif; peserta contoh dilewati.');
    return;
  }

  const userRole = await prisma.role.findUnique({ where: { code: 'USER' } });
  if (!userRole) throw new Error('Role USER belum ada — seed roles dulu');

  const grantedByUser = await prisma.user.findUnique({
    where: { email: (process.env.BOOTSTRAP_ADMIN_EMAIL ?? '').trim().toLowerCase() },
    select: { id: true },
  });
  const grantedById = grantedByUser?.id ?? null;

  const plans = await prisma.subscriptionPlan.findMany({
    where: { code: { in: DEMO_USERS.map((user) => user.planCode).filter(Boolean) as string[] } },
    select: { id: true, code: true },
  });
  const planByCode = new Map(plans.map((plan) => [plan.code, plan.id]));

  let created = 0;
  for (const demo of DEMO_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: demo.email } });
    if (existing) {
      // Pastikan password tetap sesuai dengan DEMO_PASSWORD
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash: await hashSeedPassword(DEMO_PASSWORD),
          status: demo.status,
          roleId: userRole.id,
        },
      });
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email: demo.email,
        fullName: demo.fullName,
        phone: demo.phone,
        passwordHash: await hashSeedPassword(DEMO_PASSWORD),
        roleId: userRole.id,
        status: demo.status,
        emailVerifiedAt: demo.status === 'ACTIVE' ? new Date() : null,
      },
      select: { id: true },
    });

    if (demo.planCode && demo.endsInDays !== null) {
      const now = new Date();
      const startsAt = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const endsAt = new Date(now.getTime() + demo.endsInDays * 24 * 60 * 60 * 1000);

      await prisma.subscription.create({
        data: {
          userId: user.id,
          planId: planByCode.get(demo.planCode) ?? null,
          source: 'MANUAL_GRANT',
          status: demo.endsInDays > 0 ? 'ACTIVE' : 'EXPIRED',
          startsAt,
          endsAt,
          grantedById: grantedById,
          grantNote: 'Seed data contoh',
        },
      });
    }

    created += 1;
  }

  console.log(
    created > 0
      ? `  ${created} peserta contoh dibuat (password: ${DEMO_PASSWORD}).`
      : '  Peserta contoh sudah ada; tidak ada perubahan.',
  );
}
