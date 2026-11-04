import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  decodeCursor,
  encodeCursor,
  canManageRole,
  type AdminCreateUserInput,
  type AdminCreateUserResponse,
  type AdminUserSummary,
  type Role,
} from '@webcat/contracts';
import { AUDIT, MAIL } from '../../core/ports/ports.module';
import type { AuditPort, MailPort } from '@webcat/contracts';
import { AppConfigService } from '../../core/config/config.service';
import { PasswordService } from '../../core/security/password.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { SubscriptionsService } from '../billing/subscriptions.service';

interface ListParams {
  limit: number;
  cursor?: string;
  q?: string;
  status?: string;
  role?: string;
}

interface Actor {
  id: string;
  role: Role;
  ip?: string | null;
  userAgent?: string | null;
}

const USER_INCLUDE = {
  role: true,
  subscriptions: {
    where: { status: 'ACTIVE' },
    orderBy: { endsAt: 'desc' },
    take: 1,
  },
} as const;

type UserWithRelations = Prisma.UserGetPayload<{ include: typeof USER_INCLUDE }>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly passwords: PasswordService,
    private readonly auth: AuthService,
    private readonly subscriptions: SubscriptionsService,
    @Inject(MAIL) private readonly mail: MailPort,
    @Inject(AUDIT) private readonly audit: AuditPort,
  ) {}

  // ------------------------------------------------------------------ mapping

  private toSummary(user: UserWithRelations): AdminUserSummary {
    const sub = user.subscriptions[0];
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role.code,
      status: (user.status === 'DELETED' ? 'SUSPENDED' : user.status) as
        | 'ACTIVE'
        | 'SUSPENDED'
        | 'PENDING_INVITE',
      emailVerified: user.emailVerifiedAt !== null,
      createdAt: user.createdAt.toISOString(),
      createdBy: user.createdById,
      subscription: sub
        ? {
            status: 'ACTIVE',
            endsAt: sub.endsAt.toISOString(),
            remainingDays: Math.max(
              0,
              Math.ceil((sub.endsAt.getTime() - Date.now()) / (24 * 3600 * 1000)),
            ),
            source: sub.source,
          }
        : null,
    };
  }

  // ------------------------------------------------------------------ queries

  async list(params: ListParams): Promise<{
    items: AdminUserSummary[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const where: Prisma.UserWhereInput = { deletedAt: null };

    if (params.status) where.status = params.status as never;
    if (params.role) where.role = { code: params.role as never };
    if (params.q) {
      const q = params.q.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ];
    }

    if (params.cursor) {
      const cursor = decodeCursor<{ t: string; i: string }>(params.cursor);
      const createdAt = new Date(cursor.t);
      where.AND = [
        {
          OR: [
            { createdAt: { lt: createdAt } },
            { createdAt, id: { lt: cursor.i } },
          ],
        },
      ];
    }

    const rows = await this.prisma.user.findMany({
      where,
      include: USER_INCLUDE,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: params.limit + 1,
    });

    const hasMore = rows.length > params.limit;
    const page = hasMore ? rows.slice(0, params.limit) : rows;
    const last = page[page.length - 1];

    return {
      items: page.map((row) => this.toSummary(row)),
      nextCursor:
        hasMore && last
          ? encodeCursor({ t: last.createdAt.toISOString(), i: last.id })
          : null,
      hasMore,
    };
  }

  async findById(id: string): Promise<AdminUserSummary> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: USER_INCLUDE,
    });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User tidak ditemukan' });
    return this.toSummary(user);
  }

  // ------------------------------------------------------------------ provisioning

  /**
   * Admin membuat akun untuk peserta. Ini SATU-SATUNYA jalur pembuatan akun
   * peserta; tidak ada self-registration wajib.
   */
  async create(
    input: AdminCreateUserInput,
    actor: Actor,
  ): Promise<AdminCreateUserResponse> {
    const email = input.email.trim().toLowerCase();

    if (!canManageRole(actor.role, input.role)) {
      throw new ForbiddenException({
        code: 'ROLE_CHANGE_FORBIDDEN',
        message: `Role ${actor.role} tidak boleh membuat akun ${input.role}`,
      });
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException({
        code: 'USER_EMAIL_ALREADY_EXISTS',
        message: 'Email sudah terdaftar',
      });
    }

    const role = await this.prisma.role.findUnique({ where: { code: input.role } });
    if (!role) throw new Error(`Role ${input.role} belum di-seed`);

    if (input.activation === 'TEMP_PASSWORD' && !input.temporaryPassword) {
      throw new ConflictException({
        code: 'COMMON_VALIDATION_FAILED',
        message: 'Password sementara wajib diisi',
      });
    }

    const passwordHash =
      input.activation === 'TEMP_PASSWORD' && input.temporaryPassword
        ? await this.passwords.hash(input.temporaryPassword)
        : null;

    const user = await this.prisma.user.create({
      data: {
        email,
        fullName: input.fullName.trim(),
        phone: input.phone ?? null,
        roleId: role.id,
        status: input.activation === 'TEMP_PASSWORD' ? 'ACTIVE' : 'PENDING_INVITE',
        passwordHash,
        mustChangePassword: input.activation === 'TEMP_PASSWORD',
        emailVerifiedAt: input.activation === 'TEMP_PASSWORD' ? new Date() : null,
        createdById: actor.id,
      },
      include: USER_INCLUDE,
    });

    let inviteUrl: string | null = null;

    if (input.activation === 'INVITE_EMAIL') {
      const invite = await this.auth.createInvite(user.id);
      inviteUrl = `${this.config.value.APP_URL}/invite/${invite.token}`;

      try {
        await this.mail.send({
          to: user.email,
          subject: 'Undangan akun Web CAT',
          html: `<p>Halo ${user.fullName},</p><p>Akun simulasi ujian Anda sudah dibuat. Klik tautan berikut untuk membuat password (berlaku 7 hari):</p><p><a href="${inviteUrl}">${inviteUrl}</a></p>`,
          text: `Aktifkan akun Web CAT Anda: ${inviteUrl}`,
        });
      } catch {
        // Undangan tetap bisa diberikan manual oleh admin (inviteUrl di respons).
      }
    }

    if (input.subscription) {
      await this.subscriptions.grant(
        {
          userId: user.id,
          planCode: input.subscription.planCode,
          durationDays: input.subscription.durationDays,
          startsAt: input.subscription.startsAt,
          mode: 'STACK',
          reason: `Langganan awal saat pembuatan akun oleh ${actor.id}`,
        },
        { id: actor.id, ip: actor.ip, userAgent: actor.userAgent },
      );
    }

    await this.audit.record({
      actorUserId: actor.id,
      action: 'user.created',
      entityType: 'user',
      entityId: user.id,
      metadata: {
        email: user.email,
        role: input.role,
        activation: input.activation,
        hasSubscription: Boolean(input.subscription),
      },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return { user: this.toSummary(user), inviteUrl };
  }

  // ------------------------------------------------------------------ lifecycle

  async updateStatus(
    id: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_INVITE',
    reason: string | undefined,
    actor: Actor,
  ): Promise<AdminUserSummary> {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User tidak ditemukan' });

    if (user.id === actor.id && status !== 'ACTIVE') {
      throw new ForbiddenException({
        code: 'ROLE_CHANGE_FORBIDDEN',
        message: 'Anda tidak dapat menonaktifkan akun sendiri',
      });
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        status,
        // Naikkan tokenVersion saat suspensi agar semua sesi lama langsung mati.
        ...(status === 'SUSPENDED' ? { tokenVersion: { increment: 1 } } : {}),
      },
      include: USER_INCLUDE,
    });

    if (status === 'SUSPENDED') {
      await this.prisma.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await this.audit.record({
      actorUserId: actor.id,
      action: 'user.status_changed',
      entityType: 'user',
      entityId: id,
      metadata: { from: user.status, to: status, reason: reason ?? null },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.toSummary(updated);
  }

  async changeRole(
    id: string,
    roleCode: Role,
    reason: string | undefined,
    actor: Actor,
  ): Promise<AdminUserSummary> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: true },
    });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User tidak ditemukan' });

    if (actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException({
        code: 'ROLE_CHANGE_FORBIDDEN',
        message: 'Hanya SUPER_ADMIN yang dapat mengubah role',
      });
    }

    if (!canManageRole(actor.role, roleCode) && user.id !== actor.id) {
      throw new ForbiddenException({
        code: 'ROLE_CHANGE_FORBIDDEN',
        message: 'Role target tidak dapat dikelola',
      });
    }

    // Anti-lockout: SUPER_ADMIN terakhir yang aktif tidak boleh diturunkan.
    if (user.role.code === 'SUPER_ADMIN' && roleCode !== 'SUPER_ADMIN') {
      const count = await this.prisma.user.count({
        where: { status: 'ACTIVE', deletedAt: null, role: { code: 'SUPER_ADMIN' } },
      });
      if (count <= 1) {
        throw new ConflictException({
          code: 'LAST_SUPER_ADMIN_FORBIDDEN',
          message: 'Tidak dapat menurunkan SUPER_ADMIN terakhir',
        });
      }
    }

    const role = await this.prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) throw new Error(`Role ${roleCode} belum di-seed`);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { roleId: role.id, tokenVersion: { increment: 1 } },
      include: USER_INCLUDE,
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'user.role_changed',
      entityType: 'user',
      entityId: id,
      metadata: { from: user.role.code, to: roleCode, reason: reason ?? null },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.toSummary(updated);
  }

  async adminResetPassword(
    id: string,
    newPassword: string,
    actor: Actor,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User tidak ditemukan' });

    const passwordHash = await this.passwords.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { passwordHash, mustChangePassword: true, tokenVersion: { increment: 1 } },
      }),
      this.prisma.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.audit.record({
      actorUserId: actor.id,
      action: 'user.password_reset_by_admin',
      entityType: 'user',
      entityId: id,
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return { message: 'Password direset. Semua sesi user telah dicabut.' };
  }
}
