import { Inject, Injectable } from '@nestjs/common';
import type { MailMessage, MailPort } from '@webcat/contracts';
import { LoggerService } from '../../core/logger/logger.service';
import { MAIL } from '../../core/ports/ports.module';
import { PrismaService } from '../../core/prisma/prisma.service';

const DAY_MS = 86_400_000;
const REMIND_BEFORE_DAYS = 3;
/** Jarak minimum agar cron per menit tidak mengirim email berulang. */
const REMIND_COOLDOWN_MS = 12 * 3_600_000;

/**
 * Pekerjaan terjadwal domain billing:
 *  1. Mengakhiri langganan yang sudah lewat `endsAt` (status EXPIRED + event).
 *  2. Mengirim pengingat H-3 dan H-0 sekali per jendela.
 *
 * Semua langkah idempoten; cron boleh berjalan berkali-kali.
 */
@Injectable()
export class BillingExpiryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    @Inject(MAIL) private readonly mail: MailPort,
  ) {}

  /**
   * Ubah langganan ACTIVE yang kedaluwarsa menjadi EXPIRED dan catat event.
   * Tidak menyentuh `REVOKED`, karena pencabutan manual punya alasannya sendiri.
   */
  async expireDueSubscriptions(now = new Date()): Promise<number> {
    const due = await this.prisma.subscription.findMany({
      where: { status: { in: ['ACTIVE', 'PENDING'] }, endsAt: { lte: now } },
      select: { id: true, userId: true, planId: true, endsAt: true },
      take: 500,
    });

    let expired = 0;
    for (const subscription of due) {
      const updated = await this.prisma.subscription.updateMany({
        where: { id: subscription.id, status: { in: ['ACTIVE', 'PENDING'] } },
        data: { status: 'EXPIRED' },
      });
      if (updated.count === 0) continue;
      expired += 1;

      await this.prisma.subscriptionEvent.create({
        data: {
          subscriptionId: subscription.id,
          type: 'EXPIRED',
          startsAt: subscription.endsAt,
          endsAt: subscription.endsAt,
          note: 'Masa aktif berakhir',
        },
      });

      await this.prisma.outboxEvent.create({
        data: {
          topic: 'subscription.expired',
          payload: {
            subscriptionId: subscription.id,
            userId: subscription.userId,
            planId: subscription.planId,
            endsAt: subscription.endsAt.toISOString(),
          },
        },
      });
    }

    if (expired > 0) this.logger.info('Langganan kedaluwarsa diproses', { expired });
    return expired;
  }

  /**
   * Aktifkan langganan PENDING yang sudah mencapai `startsAt`.
   *
   * Grant manual bertumpuk (STACK) menyimpan baris PENDING sampai masa aktif
   * sebelumnya berakhir. Tanpa langkah ini baris tersebut tidak pernah terlihat
   * oleh `AccessPolicyPort` dan pengguna kehilangan akses yang sudah dibayar.
   */
  async activateDueSubscriptions(now = new Date()): Promise<number> {
    const due = await this.prisma.subscription.findMany({
      where: { status: 'PENDING', startsAt: { lte: now }, endsAt: { gt: now } },
      select: { id: true, userId: true, planId: true, startsAt: true, endsAt: true },
      take: 500,
    });

    let activated = 0;
    for (const subscription of due) {
      const updated = await this.prisma.subscription.updateMany({
        where: { id: subscription.id, status: 'PENDING' },
        data: { status: 'ACTIVE' },
      });
      if (updated.count === 0) continue;
      activated += 1;

      await this.prisma.subscriptionEvent.create({
        data: {
          subscriptionId: subscription.id,
          type: 'ACTIVATED',
          startsAt: subscription.startsAt,
          endsAt: subscription.endsAt,
          note: 'Masa aktif dimulai',
        },
      });

      await this.prisma.outboxEvent.create({
        data: {
          topic: 'subscription.activated',
          payload: {
            subscriptionId: subscription.id,
            userId: subscription.userId,
            planId: subscription.planId,
            endsAt: subscription.endsAt.toISOString(),
          },
        },
      });
    }

    if (activated > 0) this.logger.info('Langganan tertunda diaktifkan', { activated });
    return activated;
  }

  /**
   * Kirim pengingat sebelum masa aktif berakhir.
   *
   * Penerima: langganan ACTIVE yang berakhir dalam <= 3 hari dan belum
   * diingatkan dalam 12 jam terakhir. Kolom `lastReminderAt` mencegah email
   * ganda saat cron berjalan tiap menit.
   */
  async sendExpiryReminders(now = new Date()): Promise<{ sent: number; skipped: number }> {
    const threshold = new Date(now.getTime() + REMIND_BEFORE_DAYS * DAY_MS);
    const cooldown = new Date(now.getTime() - REMIND_COOLDOWN_MS);

    const candidates = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endsAt: { gt: now, lte: threshold },
        OR: [{ lastReminderAt: null }, { lastReminderAt: { lt: cooldown } }],
      },
      select: {
        id: true,
        endsAt: true,
        user: { select: { email: true, fullName: true } },
        plan: { select: { name: true } },
      },
      take: 200,
    });

    let sent = 0;
    let skipped = 0;

    for (const subscription of candidates) {
      const daysLeft = Math.max(
        1,
        Math.ceil((subscription.endsAt.getTime() - now.getTime()) / DAY_MS),
      );

      const message: MailMessage = {
        to: subscription.user.email,
        subject: `Masa aktif ${subscription.plan?.name ?? 'langganan Anda'} berakhir dalam ${daysLeft} hari`,
        text: [
          `Halo ${subscription.user.fullName},`,
          '',
          `Masa aktif ${subscription.plan?.name ?? 'langganan Anda'} berakhir pada ${subscription.endsAt.toISOString()}.`,
          'Perpanjang sekarang agar latihan tidak terhenti.',
          '',
          '— Tim TES CAT',
        ].join('\n'),
        html: `<p>Halo ${subscription.user.fullName},</p>
<p>Masa aktif <strong>${subscription.plan?.name ?? 'langganan Anda'}</strong> berakhir pada
<strong>${subscription.endsAt.toLocaleDateString('id-ID', { dateStyle: 'long' })}</strong>.</p>
<p>Perpanjang sekarang agar latihan tidak terhenti.</p>`,
      };

      try {
        await this.mail.send(message);
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { lastReminderAt: now },
        });
        sent += 1;
      } catch (error) {
        // Email gagal tidak boleh menggagalkan cron; coba lagi pada putaran
        // berikutnya karena `lastReminderAt` sengaja tidak diubah.
        skipped += 1;
        this.logger.warn('Gagal mengirim pengingat masa aktif', {
          subscriptionId: subscription.id,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { sent, skipped };
  }
}
