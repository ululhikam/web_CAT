import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  decodeCursor,
  encodeCursor,
  FINAL_TRANSACTION_STATUSES,
  formatInvoiceNumber,
  jakartaMonthRange,
  type AdminTransactionListQuery,
  type AdminTransactionSummary,
  type CheckoutResult,
  type CursorPage,
  type MarkTransactionPaidInput,
  type PaymentEvent,
  type PaymentProvider,
  type RefundTransactionInput,
  type SubscriptionSummary,
  type TransactionListQuery,
  type TransactionStatus,
  type TransactionSummary,
  type WebhookAck,
} from '@webcat/contracts';
import { AppError } from '../../core/http/app-error';
import { LoggerService } from '../../core/logger/logger.service';
import { PAYMENT } from '../../core/ports/ports.module';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PlansService } from '../billing/plans.service';
import { SubscriptionsService, type ActorContext } from '../billing/subscriptions.service';

/** Tagihan PENDING yang masih segar dipakai ulang agar klik ganda tidak menggandakan tagihan. */
const PENDING_REUSE_MS = 30 * 60_000;
/** Masa berlaku tagihan bila gateway tidak mengirim `expiresAt`. */
const DEFAULT_TTL_MS = 24 * 3_600_000;
const DAY_MS = 86_400_000;

const TRANSACTION_INCLUDE = {
  plan: { select: { code: true, name: true, durationDays: true } },
  user: { select: { id: true, email: true, fullName: true } },
} satisfies Prisma.TransactionInclude;

type TransactionRow = Prisma.TransactionGetPayload<{ include: typeof TRANSACTION_INCLUDE }>;

/**
 * Jantung alur pembayaran.
 *
 * Prinsip yang tidak boleh dilanggar:
 *  - Paket & harga selalu dibaca ulang dari database; klien hanya mengirim kode.
 *  - `order_id` dibuat server dan menjadi idempotency key ke gateway.
 *  - Status transaksi + aktivasi langganan + audit ditulis dalam satu transaksi
 *    database agar tidak pernah terpisah.
 *  - Notifikasi duplikat tidak mengubah apa pun (idempoten).
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plans: PlansService,
    private readonly subscriptions: SubscriptionsService,
    private readonly audit: AuditService,
    private readonly logger: LoggerService,
    @Inject(PAYMENT) private readonly provider: PaymentProvider,
  ) {}

  /* ---------------------------------------------------------------- mapping */

  private toSummary(row: TransactionRow): TransactionSummary {
    const isFinal = row.status !== 'PENDING';
    return {
      id: row.id,
      orderId: row.orderId,
      amountIdr: row.amountIdr,
      status: row.status,
      provider: row.provider,
      invoiceNumber: row.invoiceNumber,
      planCode: row.plan?.code ?? null,
      planName: row.plan?.name ?? null,
      snapToken: isFinal ? null : row.snapToken,
      redirectUrl: isFinal ? null : row.redirectUrl,
      paidAt: row.paidAt?.toISOString() ?? null,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      subscriptionId: row.subscriptionId,
    };
  }

  private toAdminSummary(row: TransactionRow): AdminTransactionSummary {
    return {
      ...this.toSummary(row),
      userId: row.userId,
      userEmail: row.user.email,
      userFullName: row.user.fullName,
      refundedAt: row.refundedAt?.toISOString() ?? null,
      refundReason: row.refundReason,
    };
  }

  private toCheckoutResult(
    row: TransactionRow,
    subscription: SubscriptionSummary | null,
  ): CheckoutResult {
    const transaction = this.toSummary(row);
    const awaitingPayment = row.status === 'PENDING';
    return {
      transaction,
      snapToken: awaitingPayment ? row.snapToken : null,
      redirectUrl: awaitingPayment ? row.redirectUrl : null,
      expiresAt: awaitingPayment ? transaction.expiresAt : null,
      simulated: this.provider.name === 'fake',
      subscription,
    };
  }

  /* ---------------------------------------------------------------- provider */

  /** Nama provider aktif — dipakai sebagai kunci idempotensi webhook. */
  get providerName(): string {
    return this.provider.name;
  }

  verifyWebhook(headers: Record<string, string | undefined>, body: string): boolean {
    return this.provider.verifyWebhook(headers, body);
  }

  parseWebhook(body: string): PaymentEvent {
    return this.provider.parseEvent(body);
  }

  /* ---------------------------------------------------------------- checkout */

  /**
   * Buat transaksi + tagihan gateway.
   *
   * Paket harga 0 langsung mengaktifkan langganan tanpa gateway. Paket berbayar
   * memakai tagihan PENDING yang masih segar bila ada, sehingga klik ganda
   * tidak menghasilkan dua tagihan.
   */
  async checkout(userId: string, planCode: string): Promise<CheckoutResult> {
    const plan = await this.plans.requirePurchasable(planCode);

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, email: true, fullName: true, status: true },
    });
    if (!user) {
      throw new AppError({ code: 'USER_NOT_FOUND', status: 404, message: 'User tidak ditemukan' });
    }
    if (user.status !== 'ACTIVE') {
      throw new AppError({
        code: 'USER_SUSPENDED',
        status: 403,
        message: 'Akun belum aktif atau sedang ditangguhkan',
      });
    }

    const now = new Date();

    if (plan.priceIdr === 0) {
      return this.activateWithoutPayment(user.id, {
        planId: plan.id,
        planCode: plan.code,
        durationDays: plan.durationDays,
      });
    }

    const reusable = await this.prisma.transaction.findFirst({
      where: {
        userId: user.id,
        planId: plan.id,
        provider: this.provider.name,
        status: 'PENDING',
        createdAt: { gt: new Date(now.getTime() - PENDING_REUSE_MS) },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: TRANSACTION_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    if (reusable) {
      return this.toCheckoutResult(reusable, null);
    }

    const orderId = this.newOrderId();
    const expiresAt = new Date(now.getTime() + DEFAULT_TTL_MS);
    const invoiceNumber = await this.issueInvoiceNumber(now);

    const created = await this.prisma.transaction.create({
      data: {
        orderId,
        userId: user.id,
        planId: plan.id,
        amountIdr: plan.priceIdr,
        status: 'PENDING',
        provider: this.provider.name,
        invoiceNumber,
        expiresAt,
      },
    });

    try {
      const charge = await this.provider.createCharge({
        orderId,
        amountIdr: plan.priceIdr,
        planCode: plan.code,
        customer: { id: user.id, email: user.email, name: user.fullName },
      });

      const updated = await this.prisma.transaction.update({
        where: { id: created.id },
        data: {
          providerRef: charge.providerToken,
          snapToken: charge.providerToken,
          redirectUrl: charge.redirectUrl,
          expiresAt: charge.expiresAt ?? expiresAt,
        },
        include: TRANSACTION_INCLUDE,
      });

      return this.toCheckoutResult(updated, null);
    } catch (error) {
      // Jangan biarkan tagihan PENDING tanpa token gateway.
      await this.prisma.transaction.updateMany({
        where: { id: created.id, status: 'PENDING' },
        data: { status: 'FAILED' },
      });
      this.logger.error('Gagal membuat tagihan pembayaran', {
        orderId,
        provider: this.provider.name,
        message: messageOf(error),
      });
      throw new AppError({
        code: 'PAYMENT_PROVIDER_ERROR',
        status: 502,
        message: 'Gagal membuat transaksi pembayaran. Silakan coba lagi.',
      });
    }
  }

  /** Paket gratis: transaksi langsung SUCCESS dan langganan aktif seketika. */
  private async activateWithoutPayment(
    userId: string,
    plan: { planId: string; planCode: string; durationDays: number },
  ): Promise<CheckoutResult> {
    const now = new Date();
    const invoiceNumber = await this.issueInvoiceNumber(now);

    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          orderId: this.newOrderId(),
          userId,
          planId: plan.planId,
          amountIdr: 0,
          status: 'SUCCESS',
          provider: this.provider.name,
          invoiceNumber,
          paidAt: now,
        },
      });

      const subscription = await this.subscriptions.activateFromPayment(tx, {
        userId,
        planId: plan.planId,
        planCode: plan.planCode,
        durationDays: plan.durationDays,
        transactionId: transaction.id,
        paidAt: now,
      });

      const row = await tx.transaction.update({
        where: { id: transaction.id },
        data: { subscriptionId: subscription.id },
        include: TRANSACTION_INCLUDE,
      });

      return { row, subscription };
    });

    return this.toCheckoutResult(result.row, result.subscription);
  }

  /* ---------------------------------------------------------------- riwayat */

  async listForUser(
    userId: string,
    query: TransactionListQuery,
  ): Promise<CursorPage<TransactionSummary>> {
    const conditions: Prisma.TransactionWhereInput[] = [{ userId }];
    if (query.status) conditions.push({ status: query.status });

    return this.paginate(conditions, query.cursor, query.limit, (row) => this.toSummary(row));
  }

  async findForUser(userId: string, id: string): Promise<TransactionSummary> {
    const row = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: TRANSACTION_INCLUDE,
    });
    if (!row) {
      throw new AppError({
        code: 'PAYMENT_TRANSACTION_NOT_FOUND',
        status: 404,
        message: 'Transaksi tidak ditemukan',
      });
    }
    return this.toSummary(row);
  }

  async findByOrderIdForUser(userId: string, orderId: string): Promise<TransactionSummary> {
    const row = await this.prisma.transaction.findFirst({
      where: { orderId, userId },
      include: TRANSACTION_INCLUDE,
    });
    if (!row) {
      throw new AppError({
        code: 'PAYMENT_TRANSACTION_NOT_FOUND',
        status: 404,
        message: 'Transaksi tidak ditemukan',
      });
    }
    return this.toSummary(row);
  }

  /** Dipakai halaman simulasi; tidak mengekspos data user lain. */
  async findByOrderId(orderId: string): Promise<TransactionSummary> {
    const row = await this.prisma.transaction.findUnique({
      where: { orderId },
      include: TRANSACTION_INCLUDE,
    });
    if (!row) {
      throw new AppError({
        code: 'PAYMENT_TRANSACTION_NOT_FOUND',
        status: 404,
        message: 'Transaksi tidak ditemukan',
      });
    }
    return this.toSummary(row);
  }

  /* ---------------------------------------------------------------- admin */

  async listAdmin(
    query: AdminTransactionListQuery,
  ): Promise<CursorPage<AdminTransactionSummary>> {
    const conditions: Prisma.TransactionWhereInput[] = [];

    if (query.status) conditions.push({ status: query.status });
    if (query.planCode) conditions.push({ plan: { code: query.planCode.toUpperCase() } });
    if (query.from || query.to) {
      conditions.push({
        createdAt: {
          ...(query.from ? { gte: query.from } : {}),
          ...(query.to ? { lte: query.to } : {}),
        },
      });
    }
    if (query.q) {
      conditions.push({
        OR: [
          { orderId: { contains: query.q, mode: 'insensitive' } },
          { invoiceNumber: { contains: query.q, mode: 'insensitive' } },
          { user: { email: { contains: query.q, mode: 'insensitive' } } },
          { user: { fullName: { contains: query.q, mode: 'insensitive' } } },
        ],
      });
    }

    return this.paginate(conditions, query.cursor, query.limit, (row) => this.toAdminSummary(row));
  }

  async findAdmin(id: string): Promise<AdminTransactionSummary> {
    const row = await this.prisma.transaction.findUnique({
      where: { id },
      include: TRANSACTION_INCLUDE,
    });
    if (!row) {
      throw new AppError({
        code: 'PAYMENT_TRANSACTION_NOT_FOUND',
        status: 404,
        message: 'Transaksi tidak ditemukan',
      });
    }
    return this.toAdminSummary(row);
  }

  /**
   * Rekonsiliasi manual: admin menandai transaksi lunas (mis. transfer bank di
   * luar gateway). Langganan mengikuti aturan stacking yang sama.
   */
  async markPaid(
    id: string,
    input: MarkTransactionPaidInput,
    actor: ActorContext,
  ): Promise<AdminTransactionSummary> {
    const current = await this.prisma.transaction.findUnique({
      where: { id },
      include: TRANSACTION_INCLUDE,
    });
    if (!current) {
      throw new AppError({
        code: 'PAYMENT_TRANSACTION_NOT_FOUND',
        status: 404,
        message: 'Transaksi tidak ditemukan',
      });
    }
    if (current.status === 'SUCCESS' || current.status === 'REFUNDED') {
      throw new AppError({
        code: 'PAYMENT_STATUS_INVALID',
        status: 409,
        message: `Transaksi berstatus ${current.status} tidak bisa ditandai lunas`,
      });
    }

    const paidAt = input.paidAt ?? new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      let subscriptionId = current.subscriptionId;
      if (current.plan) {
        const subscription = await this.subscriptions.activateFromPayment(tx, {
          userId: current.userId,
          planId: current.planId,
          planCode: current.plan.code,
          durationDays: current.plan.durationDays,
          transactionId: current.id,
          paidAt,
        });
        subscriptionId = subscription.id;
      }

      return tx.transaction.update({
        where: { id: current.id },
        data: {
          status: 'SUCCESS',
          paidAt,
          subscriptionId,
          rawPayload: {
            reconciliation: { by: actor.id, reason: input.reason, at: paidAt.toISOString() },
          },
        },
        include: TRANSACTION_INCLUDE,
      });
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'transaction.mark_paid',
      entityType: 'transaction',
      entityId: id,
      metadata: { orderId: current.orderId, userId: current.userId, reason: input.reason },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.toAdminSummary(updated);
  }

  /**
   * Refund penuh. Bila `revokeSubscription` (default) langganan hasil transaksi
   * ikut dicabut agar akses berhenti; riwayat transaksi tetap tersimpan.
   */
  async refund(
    id: string,
    input: RefundTransactionInput,
    actor: ActorContext,
  ): Promise<AdminTransactionSummary> {
    const current = await this.prisma.transaction.findUnique({
      where: { id },
      include: TRANSACTION_INCLUDE,
    });
    if (!current) {
      throw new AppError({
        code: 'PAYMENT_TRANSACTION_NOT_FOUND',
        status: 404,
        message: 'Transaksi tidak ditemukan',
      });
    }
    if (current.status !== 'SUCCESS') {
      throw new AppError({
        code: 'PAYMENT_REFUND_NOT_ALLOWED',
        status: 409,
        message: 'Hanya transaksi berstatus SUCCESS yang bisa direfund',
      });
    }

    // Provider tanpa API refund (fake/dev) tetap boleh direkonsiliasi manual;
    // kegagalan gateway tidak boleh membuat admin terkunci.
    if (this.provider.refund) {
      try {
        await this.provider.refund({
          orderId: current.orderId,
          amountIdr: current.amountIdr,
          reason: input.reason,
        });
      } catch (error) {
        this.logger.warn('Refund gateway gagal; dicatat untuk rekonsiliasi manual', {
          orderId: current.orderId,
          message: messageOf(error),
        });
      }
    }

    const refundedAt = new Date();
    const updated = await this.prisma.transaction.update({
      where: { id: current.id },
      data: {
        status: 'REFUNDED',
        refundedAt,
        refundReason: input.reason,
        refundedById: actor.id,
      },
      include: TRANSACTION_INCLUDE,
    });

    if (input.revokeSubscription && current.subscriptionId) {
      await this.subscriptions
        .revoke(
          current.subscriptionId,
          `Refund transaksi ${current.orderId}: ${input.reason}`,
          actor,
        )
        .catch((error: unknown) => {
          this.logger.warn('Gagal mencabut langganan setelah refund', {
            subscriptionId: current.subscriptionId,
            message: messageOf(error),
          });
        });
    }

    await this.audit.record({
      actorUserId: actor.id,
      action: 'transaction.refund',
      entityType: 'transaction',
      entityId: id,
      metadata: {
        orderId: current.orderId,
        userId: current.userId,
        amountIdr: current.amountIdr,
        reason: input.reason,
        revokeSubscription: input.revokeSubscription,
      },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.toAdminSummary(updated);
  }

  /* ---------------------------------------------------------------- webhook */

  /**
   * Simpan notifikasi + terapkan efeknya.
   *
   * Baris `payment_webhook_events` dibuat lebih dulu; unique constraint
   * `(provider, provider_event_id)` adalah kunci idempotensi. Replay langsung
   * dijawab `duplicate: true` tanpa efek samping.
   */
  async applyWebhookEvent(provider: string, event: PaymentEvent): Promise<WebhookAck> {
    try {
      await this.prisma.paymentWebhookEvent.create({
        data: {
          provider,
          providerEventId: event.providerEventId,
          status: event.status,
          payload: (event.raw ?? {}) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }

      const existing = await this.prisma.paymentWebhookEvent.findUnique({
        where: {
          provider_providerEventId: {
            provider,
            providerEventId: event.providerEventId,
          },
        },
        select: { processedAt: true, error: true },
      });

      // Sudah selesai, atau request lain masih memproses event yang sama:
      // jangan jalankan efek samping dua kali.
      if (!existing || existing.processedAt || !existing.error) {
        return { received: true, duplicate: true, status: null };
      }

      // Percobaan sebelumnya gagal sebelum selesai (mis. DB sempat down).
      // Gateway yang mengirim ulang berhak mendapat percobaan baru.
    }

    try {
      const result = await this.applyPaymentEvent(event);
      await this.prisma.paymentWebhookEvent.updateMany({
        where: { provider, providerEventId: event.providerEventId },
        data: { processedAt: new Date(), error: null },
      });
      return { received: true, duplicate: false, status: result.status };
    } catch (error) {
      // Simpan alasan agar bisa direkonsiliasi; payload tidak dibuang.
      await this.prisma.paymentWebhookEvent
        .updateMany({
          where: { provider, providerEventId: event.providerEventId },
          data: { error: messageOf(error).slice(0, 500) },
        })
        .catch(() => undefined);
      throw error;
    }
  }

  /**
   * Terapkan satu event ke transaksi.
   *
   * Idempoten: transaksi final (SUCCESS/REFUNDED) tidak diproses ulang, dan
   * hanya status PENDING yang boleh berpindah. Nominal SUCCESS wajib sama
   * dengan tagihan; selisih dianggap percobaan manipulasi.
   */
  async applyPaymentEvent(event: PaymentEvent): Promise<{
    status: TransactionStatus;
    subscriptionId: string | null;
  }> {
    const current = await this.prisma.transaction.findUnique({
      where: { orderId: event.orderId },
      include: TRANSACTION_INCLUDE,
    });
    if (!current) {
      throw new AppError({
        code: 'PAYMENT_TRANSACTION_NOT_FOUND',
        status: 404,
        message: 'Transaksi untuk notifikasi ini tidak ditemukan',
      });
    }

    const isRefund = event.status === 'REFUNDED';
    const settled = current.status === 'SUCCESS';

    // SUCCESS hanya boleh berpindah ke REFUNDED; status final lain tidak
    // menerima notifikasi terlambat. Replay settlement tidak berefek ganda.
    const terminal =
      current.status === 'REFUNDED' ||
      (settled && !isRefund) ||
      (!settled && FINAL_TRANSACTION_STATUSES.includes(current.status));

    if (terminal) {
      return { status: current.status, subscriptionId: current.subscriptionId };
    }

    if (event.status === 'SUCCESS' && event.amountIdr !== current.amountIdr) {
      throw new AppError({
        code: 'PAYMENT_AMOUNT_MISMATCH',
        status: 422,
        message: 'Nominal pembayaran tidak sesuai dengan tagihan',
        details: { expected: current.amountIdr, received: event.amountIdr },
      });
    }

    const paidAt = event.paidAt ?? new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      let subscriptionId = current.subscriptionId;

      if (event.status === 'SUCCESS' && current.plan) {
        const subscription = await this.subscriptions.activateFromPayment(tx, {
          userId: current.userId,
          planId: current.planId,
          planCode: current.plan.code,
          durationDays: current.plan.durationDays,
          transactionId: current.id,
          paidAt,
        });
        subscriptionId = subscription.id;
      }

      if (isRefund && current.subscriptionId) {
        const subscription = await tx.subscription.findUnique({
          where: { id: current.subscriptionId },
          select: {
            id: true,
            userId: true,
            status: true,
            startsAt: true,
            endsAt: true,
          },
        });

        if (subscription && subscription.status !== 'REVOKED') {
          await tx.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'REVOKED',
              revokedAt: paidAt,
              revokeReason: 'Refund diterima dari gateway',
            },
          });

          await tx.subscriptionEvent.create({
            data: {
              subscriptionId: subscription.id,
              transactionId: current.id,
              type: 'REVOKED',
              startsAt: subscription.startsAt,
              endsAt: subscription.endsAt,
              note: 'Refund diterima dari gateway',
            },
          });

          await tx.outboxEvent.create({
            data: {
              topic: 'subscription.revoked',
              payload: {
                subscriptionId: subscription.id,
                userId: subscription.userId,
                reason: 'Refund diterima dari gateway',
              },
            },
          });
        }
      }

      const row = await tx.transaction.update({
        where: { id: current.id },
        data: {
          status: event.status,
          subscriptionId,
          paidAt: event.status === 'SUCCESS' ? paidAt : current.paidAt,
          refundedAt: event.status === 'REFUNDED' ? paidAt : current.refundedAt,
          refundReason:
            event.status === 'REFUNDED'
              ? (current.refundReason ?? 'Refund dari gateway')
              : current.refundReason,
          rawPayload: (event.raw ?? undefined) as Prisma.InputJsonValue,
        },
        include: TRANSACTION_INCLUDE,
      });

      return { row, subscriptionId };
    });

    await this.audit.record({
      actorUserId: null,
      action: `transaction.${event.status.toLowerCase()}`,
      entityType: 'transaction',
      entityId: current.id,
      metadata: {
        orderId: current.orderId,
        providerEventId: event.providerEventId,
        amountIdr: event.amountIdr,
      },
    });

    return { status: result.row.status, subscriptionId: result.subscriptionId };
  }

  /* ---------------------------------------------------------------- dev only */

  /**
   * Simulasi pembayaran sukses untuk provider `fake`.
   *
   * Body ditandatangani provider lalu diverifikasi ulang, kemudian diproses
   * lewat `applyWebhookEvent` — jalur aktivasi yang identik dengan webhook
   * produksi.
   */
  async settleFake(orderId: string): Promise<WebhookAck> {
    const body = JSON.stringify({
      eventId: `fake-${orderId}-success`,
      orderId,
      status: 'SUCCESS' as TransactionStatus,
      amountIdr: (await this.findByOrderId(orderId)).amountIdr,
      paidAt: new Date().toISOString(),
    });

    const signer = this.provider as PaymentProvider & { sign?: (payload: string) => string };
    if (typeof signer.sign === 'function') {
      const headers = { 'x-fake-signature': signer.sign(body) };
      if (!this.provider.verifyWebhook(headers, body)) {
        throw new AppError({
          code: 'PAYMENT_SIGNATURE_INVALID',
          status: 401,
          message: 'Signature simulasi tidak valid',
        });
      }
    }

    return this.applyWebhookEvent(this.provider.name, this.provider.parseEvent(body));
  }

  /* ---------------------------------------------------------------- expiry */

  /** Tandai tagihan PENDING yang melewati `expiresAt` sebagai EXPIRED. */
  async expireOverdue(now = new Date()): Promise<number> {
    const result = await this.prisma.transaction.updateMany({
      where: { status: 'PENDING', expiresAt: { lt: now } },
      data: { status: 'EXPIRED' },
    });
    return result.count;
  }

  /** Tagihan PENDING tanpa `expiresAt` yang sudah lebih dari 24 jam. */
  async expireStale(now = new Date()): Promise<number> {
    const result = await this.prisma.transaction.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: null,
        createdAt: { lt: new Date(now.getTime() - DAY_MS) },
      },
      data: { status: 'EXPIRED' },
    });
    return result.count;
  }

  /* ---------------------------------------------------------------- helper */

  private newOrderId(): string {
    const stamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `WC-${stamp}-${random}`;
  }

  /**
   * Nomor invoice berurutan per bulan (`INV/YYYY/MM/NNNN`).
   *
   * Loop kecil menghindari tabrakan saat ada checkout bersamaan; unique index
   * tetap menjadi benteng terakhir.
   */
  private async issueInvoiceNumber(now = new Date()): Promise<string> {
    const { start, end } = jakartaMonthRange(now);
    const used = await this.prisma.transaction.count({
      where: { createdAt: { gte: start, lt: end }, invoiceNumber: { not: null } },
    });

    for (let offset = 1; offset <= 20; offset += 1) {
      const candidate = formatInvoiceNumber(now, used + offset);
      const exists = await this.prisma.transaction.findUnique({
        where: { invoiceNumber: candidate },
        select: { id: true },
      });
      if (!exists) return candidate;
    }

    return formatInvoiceNumber(now, used + (Date.now() % 1000) + 1);
  }

  private async paginate<T>(
    baseConditions: Prisma.TransactionWhereInput[],
    cursor: string | undefined,
    limit: number,
    map: (row: TransactionRow) => T,
  ): Promise<CursorPage<T>> {
    const conditions = [...baseConditions];

    if (cursor) {
      let decoded: { createdAt?: string; id?: string };
      try {
        decoded = decodeCursor<{ createdAt?: string; id?: string }>(cursor);
      } catch {
        decoded = {};
      }
      const createdAt = decoded.createdAt ? new Date(decoded.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime()) || !decoded.id) {
        throw new AppError({
          code: 'COMMON_BAD_REQUEST',
          status: 400,
          message: 'Cursor tidak valid',
        });
      }
      conditions.push({
        OR: [
          { createdAt: { lt: createdAt } },
          { createdAt, id: { lt: decoded.id } },
        ],
      });
    }

    const rows = await this.prisma.transaction.findMany({
      where: conditions.length > 0 ? { AND: conditions } : {},
      include: TRANSACTION_INCLUDE,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const page = rows.slice(0, limit);
    const last = page.at(-1);

    return {
      items: page.map(map),
      nextCursor:
        rows.length > limit && last
          ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
          : null,
      hasMore: rows.length > limit,
    };
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
