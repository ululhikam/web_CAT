import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Prisma, User } from '@prisma/client';
import {
  ERROR_CODES,
  ERROR_STATUS,
  type AuthSessionSummary,
  type MessageResult,
  type RegisterInput,
  type AuthUser,
} from '@webcat/contracts';
import type { MailPort } from '@webcat/contracts';
import { AUDIT, MAIL } from '../../core/ports/ports.module';
import type { AuditPort } from '@webcat/contracts';
import { AppConfigService } from '../../core/config/config.service';
import { JwtService } from '../../core/auth/jwt.service';
import { LoggerService } from '../../core/logger/logger.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PasswordService } from '../../core/security/password.service';
import { SettingsService } from '../settings/settings.service';
import { generateNumericCode, generateOpaqueToken, sha256 } from '../../core/security/token.util';

const EMAIL_OTP_TTL_MINUTES = 15;
const EMAIL_OTP_MAX_ATTEMPTS = 5;
const INVITE_TTL_DAYS = 7;
const RESET_TTL_MINUTES = 60;
const SESSION_TTL_DAYS = 30;

type UserWithRole = Prisma.UserGetPayload<{
  include: { role: { include: { permissions: { include: { permission: true } } } } };
}>;

export interface RequestMeta {
  ip?: string | null;
  userAgent?: string | null;
}

/** Profil minimal dari Google OpenID Connect (`userinfo`). */
export interface GoogleIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly jwt: JwtService,
    private readonly passwords: PasswordService,
    private readonly logger: LoggerService,
    private readonly settings: SettingsService,
    @Inject(MAIL) private readonly mail: MailPort,
    @Inject(AUDIT) private readonly audit: AuditPort,
  ) {}

  // ------------------------------------------------------------------ helpers

  private toAuthUser(user: UserWithRole): AuthUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role.code,
      permissions: user.role.permissions.map((item) => item.permission.code).sort(),
      emailVerified: user.emailVerifiedAt !== null,
      mustChangePassword: user.mustChangePassword,
      status: user.status,
    };
  }

  private includeRole = {
    role: { include: { permissions: { include: { permission: true } } } },
  } as const;

  private async sendMail(to: string, subject: string, html: string, text: string): Promise<void> {
    try {
      await this.mail.send({ to, subject, html, text });
    } catch (error) {
      // Email gagal TIDAK boleh menggagalkan alur utama; user bisa minta kirim ulang.
      this.logger.error('Gagal mengirim email', {
        to,
        subject,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async issueSession(
    user: UserWithRole,
    meta: RequestMeta,
    familyId?: string,
    policy: 'replace' | 'reject' = 'replace',
  ): Promise<AuthTokens> {
    const refreshToken = generateOpaqueToken();
    const session = await this.createSessionRecord(user, meta, refreshToken, familyId, policy);

    const accessToken = this.jwt.signAccessToken({
      sub: user.id,
      sid: session.id,
      role: user.role.code,
      ver: user.tokenVersion,
    });

    return { accessToken, refreshToken, user: this.toAuthUser(user) };
  }

  /**
   * Membuat baris sesi dengan menegakkan satu sesi aktif per user.
   *
   * Partial unique index `sessions_one_active_per_user` adalah pengaman
   * terakhir untuk request paralel. Bila dua login berbarengan, salah satu
   * mendapat P2002; percobaan kedua mencabut sesi pemenang lalu membuat sesi
   * baru sehingga hasil akhirnya tetap satu sesi aktif.
   */
  private async createSessionRecord(
    user: UserWithRole,
    meta: RequestMeta,
    refreshToken: string,
    familyId?: string,
    policy: 'replace' | 'reject' = 'replace',
    attempt = 0,
  ): Promise<{ id: string }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const now = new Date();

        // Baris kedaluwarsa tetap dihitung oleh partial unique index
        // (`revoked_at IS NULL`), jadi cabut dulu sebelum membuat sesi baru.
        await tx.session.updateMany({
          where: { userId: user.id, revokedAt: null, expiresAt: { lte: now } },
          data: { revokedAt: now },
        });

        if (policy === 'replace') {
          await tx.session.updateMany({
            where: { userId: user.id, revokedAt: null },
            data: { revokedAt: now },
          });
        }

        return tx.session.create({
          data: {
            userId: user.id,
            familyId: familyId ?? randomUUID(),
            refreshTokenHash: sha256(refreshToken),
            ip: meta.ip ?? null,
            userAgent: meta.userAgent?.slice(0, 400) ?? null,
            expiresAt: new Date(Date.now() + SESSION_TTL_DAYS * 24 * 3600 * 1000),
          },
          select: { id: true },
        });
      });
    } catch (error) {
      const isUniqueViolation = (error as { code?: string }).code === 'P2002';
      if (!isUniqueViolation) throw error;

      // Request paralel: kebijakan `reject` harus tetap menolak, sedangkan
      // `replace` mencabut pemenang lalu mencoba sekali lagi.
      if (policy === 'reject' || attempt > 0) {
        if (policy === 'reject') {
          throw new ConflictException({
            code: ERROR_CODES.AUTH_SESSION_ACTIVE_EXISTS,
            message:
              'Akun sedang aktif di perangkat lain. Keluar dari perangkat tersebut atau minta admin mencabut sesinya.',
          });
        }
        throw error;
      }

      return this.createSessionRecord(user, meta, refreshToken, familyId, policy, attempt + 1);
    }
  }

  /** Cek policy `reject` sebelum sesi baru dibuat. */
  private async assertSessionPolicy(userId: string): Promise<'replace' | 'reject'> {
    const policy = await this.settings.value('auth.session_policy');

    if (policy === 'reject') {
      const active = await this.prisma.session.findFirst({
        where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
        select: { id: true },
      });

      if (active) {
        throw new ConflictException({
          code: ERROR_CODES.AUTH_SESSION_ACTIVE_EXISTS,
          message:
            'Akun sedang aktif di perangkat lain. Keluar dari perangkat tersebut atau minta admin mencabut sesinya.',
        });
      }
    }

    return policy;
  }

  // ------------------------------------------------------------------ register

  async register(input: RegisterInput): Promise<MessageResult> {
    const registrationEnabled = await this.settings.value('auth.registration_enabled');

    // Default mati: akun peserta dibuat admin. SUPER_ADMIN dapat membuka
    // pendaftaran publik lewat menu Pengaturan.
    if (!registrationEnabled) {
      throw new ForbiddenException({
        code: ERROR_CODES.AUTH_REGISTRATION_DISABLED,
        message: 'Pendaftaran mandiri dinonaktifkan. Hubungi admin untuk dibuatkan akun.',
      });
    }

    const email = input.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException({
        code: ERROR_CODES.AUTH_EMAIL_ALREADY_REGISTERED,
        message: 'Email sudah terdaftar. Silakan masuk atau reset password.',
      });
    }

    const role = await this.prisma.role.findUnique({ where: { code: 'USER' } });
    if (!role) {
      throw new Error('Role USER belum di-seed. Jalankan `pnpm db:seed`.');
    }

    const passwordHash = await this.passwords.hash(input.password);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: input.fullName.trim(),
        phone: input.phone ?? null,
        roleId: role.id,
        status: 'ACTIVE',
      },
      select: { id: true, email: true, fullName: true },
    });

    const code = generateNumericCode(6);
    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        purpose: 'EMAIL_VERIFY',
        codeHash: sha256(code),
        expiresAt: new Date(Date.now() + EMAIL_OTP_TTL_MINUTES * 60 * 1000),
      },
    });

    await this.sendMail(
      user.email,
      'Kode verifikasi TES CAT',
      `<p>Halo ${user.fullName},</p><p>Kode verifikasi Anda: <strong>${code}</strong></p><p>Berlaku ${EMAIL_OTP_TTL_MINUTES} menit.</p>`,
      `Kode verifikasi TES CAT: ${code} (berlaku ${EMAIL_OTP_TTL_MINUTES} menit)`,
    );

    await this.audit.record({
      actorUserId: user.id,
      action: 'auth.register',
      entityType: 'user',
      entityId: user.id,
      metadata: { email: user.email },
    });

    return { message: 'Pendaftaran berhasil. Cek email untuk kode verifikasi.' };
  }

  // ------------------------------------------------------------------ verify

  async verifyEmail(input: { email: string; code: string }): Promise<MessageResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.trim().toLowerCase() },
      select: { id: true, email: true, emailVerifiedAt: true },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_OTP_INVALID,
        message: 'Kode verifikasi tidak valid atau sudah kedaluwarsa',
      });
    }

    const token = await this.prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        purpose: 'EMAIL_VERIFY',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!token || !token.codeHash) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_OTP_INVALID,
        message: 'Kode verifikasi tidak valid atau sudah kedaluwarsa',
      });
    }

    if (token.attempts >= EMAIL_OTP_MAX_ATTEMPTS) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_OTP_ATTEMPTS_EXCEEDED,
        message: 'Terlalu banyak percobaan. Minta kode baru.',
      });
    }

    if (token.codeHash !== sha256(input.code)) {
      await this.prisma.verificationToken.update({
        where: { id: token.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_OTP_INVALID,
        message: 'Kode verifikasi salah',
      });
    }

    await this.prisma.$transaction([
      this.prisma.verificationToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);

    return { message: 'Email berhasil diverifikasi. Silakan masuk.' };
  }

  async resendVerification(email: string): Promise<MessageResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true, fullName: true, emailVerifiedAt: true },
    });

    // Selalu jawab generik agar tidak membocorkan status email.
    const generic = { message: 'Jika email terdaftar, kode baru telah dikirim.' };
    if (!user || user.emailVerifiedAt) return generic;

    const code = generateNumericCode(6);
    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        purpose: 'EMAIL_VERIFY',
        codeHash: sha256(code),
        expiresAt: new Date(Date.now() + EMAIL_OTP_TTL_MINUTES * 60 * 1000),
      },
    });

    await this.sendMail(
      user.email,
      'Kode verifikasi TES CAT (baru)',
      `<p>Kode verifikasi baru: <strong>${code}</strong></p>`,
      `Kode verifikasi TES CAT: ${code}`,
    );

    return generic;
  }

  // ------------------------------------------------------------------ login

  async login(input: { email: string; password: string }, meta: RequestMeta): Promise<AuthTokens> {
    const user = await this.prisma.user.findFirst({
      where: { email: input.email.trim().toLowerCase(), deletedAt: null },
      include: this.includeRole,
    });

    const invalid = new UnauthorizedException({
      code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      message: 'Email atau password salah',
    });

    if (!user || !user.passwordHash) throw invalid;

    const ok = await this.passwords.verify(user.passwordHash, input.password);
    if (!ok) throw invalid;

    if (user.status === 'SUSPENDED' || user.status === 'DELETED') {
      throw new ForbiddenException({
        code: ERROR_CODES.USER_SUSPENDED,
        status: ERROR_STATUS.USER_SUSPENDED,
        message: 'Akun Anda dinonaktifkan. Hubungi admin.',
      });
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException({
        code: ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED,
        message: 'Verifikasi email Anda terlebih dahulu.',
      });
    }

    // Cek kebijakan sesi sebelum mencatat login, agar percobaan yang ditolak
    // tidak tercatat sebagai login sukses.
    const policy = await this.assertSessionPolicy(user.id);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'auth.login',
      entityType: 'user',
      entityId: user.id,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    });

    return this.issueSession(user, meta, undefined, policy);
  }

  // ------------------------------------------------------------------ google oauth

  /**
   * Login lewat Google hanya untuk akun yang SUDAH dibuat admin.
   *
   * Tidak ada provisioning otomatis: bila email Google tidak cocok dengan akun
   * mana pun, user diarahkan menghubungi admin. `googleSub` ditautkan saat
   * login pertama agar perubahan email Google tidak memutus akun.
   */
  async loginWithGoogle(identity: GoogleIdentity, meta: RequestMeta): Promise<AuthTokens> {
    if (!identity.emailVerified) {
      throw new ForbiddenException({
        code: ERROR_CODES.AUTH_OAUTH_FAILED,
        message: 'Email Google belum diverifikasi',
      });
    }

    const email = identity.email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ googleSub: identity.sub }, { email }],
      },
      include: this.includeRole,
    });

    if (!user) {
      throw new NotFoundException({
        code: ERROR_CODES.AUTH_OAUTH_ACCOUNT_NOT_FOUND,
        message: 'Akun Google ini belum terdaftar. Hubungi admin untuk dibuatkan akun.',
      });
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException({
        code: ERROR_CODES.USER_SUSPENDED,
        message: 'Akun belum aktif. Selesaikan aktivasi undangan terlebih dahulu.',
      });
    }

    // Jangan biarkan akun tertaut ke dua identitas Google berbeda meski
    // emailnya sama (mis. email dipakai ulang setelah pergantian pemilik).
    if (user.googleSub && user.googleSub !== identity.sub) {
      throw new ForbiddenException({
        code: ERROR_CODES.AUTH_OAUTH_FAILED,
        message: 'Akun ini sudah tertaut ke akun Google lain. Hubungi admin.',
      });
    }

    // Kebijakan sesi diperiksa sebelum menulis perubahan akun/audit agar
    // percobaan yang ditolak tidak meninggalkan efek samping.
    const policy = await this.assertSessionPolicy(user.id);

    if (!user.googleSub) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleSub: identity.sub,
          ...(user.emailVerifiedAt ? {} : { emailVerifiedAt: new Date() }),
          lastLoginAt: new Date(),
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          ...(user.emailVerifiedAt ? {} : { emailVerifiedAt: new Date() }),
          lastLoginAt: new Date(),
        },
      });
    }

    await this.audit.record({
      actorUserId: user.id,
      action: 'auth.login_google',
      entityType: 'user',
      entityId: user.id,
      metadata: { linked: !user.googleSub },
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    });

    const fresh = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: this.includeRole,
    });

    return this.issueSession(fresh, meta, undefined, policy);
  }

  // ------------------------------------------------------------------ refresh

  async refresh(refreshToken: string | undefined, meta: RequestMeta): Promise<AuthTokens> {
    if (!refreshToken) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_TOKEN_INVALID,
        message: 'Sesi tidak ditemukan',
      });
    }

    const session = await this.prisma.session.findFirst({
      where: { refreshTokenHash: sha256(refreshToken) },
      include: { user: { include: this.includeRole } },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_SESSION_REVOKED,
        message: 'Sesi sudah berakhir. Silakan masuk kembali.',
      });
    }

    const user = session.user;
    if (user.deletedAt || user.status === 'SUSPENDED' || user.status === 'DELETED') {
      throw new UnauthorizedException({
        code: ERROR_CODES.USER_SUSPENDED,
        message: 'Akun Anda tidak aktif',
      });
    }

    // Rotasi: token lama langsung dicabut; family dipertahankan agar
    // deteksi replay tetap bekerja.
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date(), lastSeenAt: new Date() },
    });

    return this.issueSession(user, meta, session.familyId, 'replace');
  }

  async logout(refreshToken: string | undefined): Promise<MessageResult> {
    if (refreshToken) {
      await this.prisma.session.updateMany({
        where: { refreshTokenHash: sha256(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { message: 'Berhasil keluar' };
  }

  async logoutAll(userId: string): Promise<MessageResult> {
    await this.prisma.$transaction([
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
      }),
    ]);
    return { message: 'Semua sesi berhasil dicabut' };
  }

  // ------------------------------------------------------------------ device mgmt

  /** Sesi aktif milik user; sesi yang sedang dipakai ditandai `current`. */
  async listSessions(userId: string, currentSessionId: string): Promise<AuthSessionSummary[]> {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: [{ lastSeenAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        ip: true,
        userAgent: true,
        createdAt: true,
        lastSeenAt: true,
        expiresAt: true,
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      current: session.id === currentSessionId,
      ip: session.ip,
      userAgent: session.userAgent,
      createdAt: session.createdAt.toISOString(),
      lastSeenAt: session.lastSeenAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
    }));
  }

  /**
   * Cabut satu sesi milik sendiri. Filter `userId` wajib agar user tidak
   * bisa mencabut sesi orang lain hanya dengan menebak id.
   */
  async revokeSession(userId: string, sessionId: string): Promise<MessageResult> {
    const result = await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (result.count === 0) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_TOKEN_INVALID,
        message: 'Sesi tidak ditemukan atau sudah berakhir',
      });
    }

    await this.audit.record({
      actorUserId: userId,
      action: 'auth.session_revoked',
      entityType: 'session',
      entityId: sessionId,
    });

    return { message: 'Sesi berhasil dicabut' };
  }

  // ------------------------------------------------------------------ password

  async forgotPassword(email: string): Promise<MessageResult> {
    const generic = { message: 'Jika email terdaftar, tautan reset sudah dikirim.' };
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true, deletedAt: true },
    });
    if (!user || user.deletedAt) return generic;

    const token = generateOpaqueToken();
    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        purpose: 'PASSWORD_RESET',
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000),
      },
    });

    const link = `${this.config.value.APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
    await this.sendMail(
      user.email,
      'Reset password TES CAT',
      `<p>Klik tautan berikut untuk mengatur ulang password (berlaku ${RESET_TTL_MINUTES} menit):</p><p><a href="${link}">${link}</a></p>`,
      `Reset password TES CAT: ${link}`,
    );

    return generic;
  }

  async resetPassword(input: { token: string; password: string }): Promise<MessageResult> {
    const record = await this.prisma.verificationToken.findFirst({
      where: {
        purpose: 'PASSWORD_RESET',
        tokenHash: sha256(input.token),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_TOKEN_INVALID,
        message: 'Tautan reset tidak valid atau sudah kedaluwarsa',
      });
    }

    const passwordHash = await this.passwords.hash(input.password);

    await this.prisma.$transaction([
      this.prisma.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, mustChangePassword: false, tokenVersion: { increment: 1 } },
      }),
      this.prisma.session.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.audit.record({
      actorUserId: record.userId,
      action: 'auth.password_reset',
      entityType: 'user',
      entityId: record.userId,
    });

    return { message: 'Password berhasil diubah. Silakan masuk.' };
  }

  async changePassword(
    userId: string,
    input: { currentPassword: string; newPassword: string },
  ): Promise<MessageResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        message: 'Password lama salah',
      });
    }

    const ok = await this.passwords.verify(user.passwordHash, input.currentPassword);
    if (!ok) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        message: 'Password lama salah',
      });
    }

    const passwordHash = await this.passwords.hash(input.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false, tokenVersion: { increment: 1 } },
    });

    return { message: 'Password berhasil diperbarui' };
  }

  // ------------------------------------------------------------------ invite

  /**
   * Aktivasi akun yang dibuat admin lewat tautan undangan.
   * Token sekali pakai, berlaku 7 hari, disimpan sebagai hash.
   */
  async activateInvite(input: {
    token: string;
    password: string;
    fullName?: string;
  }): Promise<MessageResult> {
    const record = await this.prisma.verificationToken.findFirst({
      where: {
        purpose: 'INVITE',
        tokenHash: sha256(input.token),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: { select: { id: true, deletedAt: true } } },
    });

    if (!record || record.user.deletedAt) {
      throw new UnauthorizedException({
        code: ERROR_CODES.USER_INVITE_EXPIRED,
        message: 'Tautan undangan tidak valid atau sudah kedaluwarsa',
      });
    }

    const passwordHash = await this.passwords.hash(input.password);

    await this.prisma.$transaction([
      this.prisma.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: {
          passwordHash,
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
          mustChangePassword: false,
          ...(input.fullName ? { fullName: input.fullName.trim() } : {}),
        },
      }),
    ]);

    await this.audit.record({
      actorUserId: record.userId,
      action: 'auth.invite_activated',
      entityType: 'user',
      entityId: record.userId,
    });

    return { message: 'Akun berhasil diaktifkan. Silakan masuk.' };
  }

  // ------------------------------------------------------------------ invite

  /**
   * Dipanggil modul users saat provisioning: membuat token undangan
   * sekali pakai yang berlaku INVITE_TTL_DAYS hari.
   */
  async createInvite(userId: string): Promise<{ token: string; expiresAt: Date }> {
    const token = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 3600 * 1000);

    await this.prisma.verificationToken.create({
      data: {
        userId,
        purpose: 'INVITE',
        tokenHash: sha256(token),
        expiresAt,
      },
    });

    return { token, expiresAt };
  }

  // ------------------------------------------------------------------ me

  async me(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: this.includeRole,
    });

    if (!user) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_TOKEN_INVALID,
        message: 'Akun tidak ditemukan',
      });
    }

    return this.toAuthUser(user);
  }

  /** Dipakai PrincipalLoader: satu query untuk sesi + user + role + permission. */
  async loadPrincipal(input: {
    sub: string;
    sid: string;
    ver: number;
  }): Promise<{ user: AuthUser; sessionId: string } | null> {
    const session = await this.prisma.session.findFirst({
      where: {
        id: input.sid,
        userId: input.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: { include: this.includeRole } },
    });

    if (!session) return null;

    const user = session.user;
    if (user.deletedAt || user.status !== 'ACTIVE' || user.tokenVersion !== input.ver) {
      return null;
    }

    return { user: this.toAuthUser(user), sessionId: session.id };
  }

  /** Dipakai seed & provisioning: user dengan email tertentu. */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  }
}
