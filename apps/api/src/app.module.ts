import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppConfigModule } from './core/config/config.module';
import { LoggerModule } from './core/logger/logger.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { SecurityModule } from './core/security/security.module';
import { CoreAuthModule } from './core/auth/auth.module';
import { JwtAuthGuard } from './core/auth/jwt-auth.guard';
import { PermissionsGuard } from './core/auth/permissions.guard';
import { EmailVerifiedGuard } from './core/auth/email-verified.guard';
import { RateLimitModule } from './core/ratelimit/rate-limit.module';
import { RateLimitGuard } from './core/ratelimit/rate-limit.guard';
import { JobsModule } from './core/jobs/jobs.module';
import { PortsModule } from './core/ports/ports.module';
import { CronModule } from './core/cron/cron.module';
import { AllExceptionsFilter } from './core/http/all-exceptions.filter';
import { ResponseInterceptor } from './core/http/response.interceptor';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BillingModule } from './modules/billing/billing.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HealthModule } from './modules/health/health.module';
import { SettingsModule } from './modules/settings/settings.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { MediaModule } from './modules/media/media.module';
import { ImportsModule } from './modules/imports/imports.module';

/**
 * Root module — modular monolith.
 *
 * Guard didaftarkan global agar tidak ada endpoint yang lupa diproteksi.
 * Urutan eksekusi guard mengikuti urutan provider APP_GUARD:
 *   1. JwtAuthGuard       — verifikasi token, isi req.user (kecuali @Public)
 *   2. PermissionsGuard   — cek @RequirePermissions / @RequireRoles
 *   3. EmailVerifiedGuard — email wajib terverifikasi
 */
@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    PrismaModule,
    SecurityModule,
    CoreAuthModule,
    RateLimitModule,
    JobsModule,
    PortsModule,
    AuditModule,
    AuthModule,
    SettingsModule,
    UsersModule,
    BillingModule,
    CategoriesModule,
    MediaModule,
    QuestionsModule,
    ImportsModule,
    PaymentsModule,
    AnalyticsModule,
    HealthModule,
    CronModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: EmailVerifiedGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
