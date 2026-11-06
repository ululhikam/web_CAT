import { Injectable } from '@nestjs/common';
import {
  DAILY_EXAM_SESSION_LIMIT,
  jakartaDateKey,
  type AccessDecision,
  type AccessPolicyPort,
} from '@webcat/contracts';
import { AppError } from '../../core/http/app-error';
import { PrismaService } from '../../core/prisma/prisma.service';

const DAY_MS = 86_400_000;

/**
 * Implementasi produksi `AccessPolicyPort` (B4).
 *
 * Mesin ujian tidak boleh tahu dari mana akses berasal (beli, grant admin,
 * trial). Port ini satu-satunya pintu: baca langganan ACTIVE yang belum
 * berakhir, lalu kembalikan keputusan yang bisa dipakai UI.
 */
@Injectable()
export class BillingAccessPolicy implements AccessPolicyPort {
  constructor(private readonly prisma: PrismaService) {}

  async check(userId: string): Promise<AccessDecision> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { status: true },
    });

    if (!user) {
      return {
        allowed: false,
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Akun tidak ditemukan',
        endsAt: null,
        remainingDays: 0,
      };
    }

    if (user.status === 'SUSPENDED') {
      return {
        allowed: false,
        code: 'USER_SUSPENDED',
        message: 'Akun Anda sedang ditangguhkan. Hubungi admin.',
        endsAt: null,
        remainingDays: 0,
      };
    }

    const now = new Date();
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE', endsAt: { gt: now } },
      orderBy: { endsAt: 'desc' },
      select: { endsAt: true },
    });

    if (!subscription) {
      const expired = await this.prisma.subscription.findFirst({
        where: { userId, status: 'EXPIRED' },
        orderBy: { endsAt: 'desc' },
        select: { endsAt: true },
      });

      if (expired) {
        return {
          allowed: false,
          code: 'SUBSCRIPTION_EXPIRED',
          message: 'Masa aktif langganan sudah berakhir. Perpanjang untuk melanjutkan.',
          endsAt: expired.endsAt,
          remainingDays: 0,
        };
      }

      return {
        allowed: false,
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Pilih paket langganan untuk mulai latihan.',
        endsAt: null,
        remainingDays: 0,
      };
    }

    const remainingDays = Math.max(
      0,
      Math.ceil((subscription.endsAt.getTime() - now.getTime()) / DAY_MS),
    );

    return {
      allowed: true,
      code: 'OK',
      message: 'Langganan aktif',
      endsAt: subscription.endsAt,
      remainingDays,
    };
  }

  async assertCanStartExam(userId: string): Promise<void> {
    await this.assertAllowed(userId);

    // Maksimal `DAILY_EXAM_SESSION_LIMIT` sesi ujian per hari (Asia/Jakarta).
    // Sesi yang di-void admin tidak menghalangi peserta mencoba lagi.
    const today = new Date(`${jakartaDateKey(new Date())}T00:00:00.000Z`);
    const existing = await this.prisma.examSession.findMany({
      where: { userId, examDate: today, voidedAt: null },
      select: { id: true },
      take: DAILY_EXAM_SESSION_LIMIT,
    });
    if (existing.length >= DAILY_EXAM_SESSION_LIMIT) {
      throw new AppError({
        code: 'EXAM_SESSION_ALREADY_TODAY',
        status: 409,
        message: 'Anda sudah memiliki sesi ujian hari ini. Coba lagi besok.',
        details: { sessionId: existing[0]?.id ?? null },
      });
    }
  }

  async assertCanContinue(userId: string): Promise<void> {
    await this.assertAllowed(userId);
  }

  private async assertAllowed(userId: string): Promise<void> {
    const decision = await this.check(userId);
    if (decision.allowed) return;

    throw new AppError({
      code:
        decision.code === 'USER_SUSPENDED'
          ? 'USER_SUSPENDED'
          : 'BILLING_SUBSCRIPTION_REQUIRED',
      status: decision.code === 'USER_SUSPENDED' ? 403 : 402,
      message: decision.message,
      details: {
        accessCode: decision.code,
        endsAt: decision.endsAt?.toISOString() ?? null,
        remainingDays: decision.remainingDays,
      },
    });
  }
}
