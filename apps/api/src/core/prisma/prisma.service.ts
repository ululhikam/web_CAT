import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Satu instance Prisma per proses. Di Vercel (serverless) instance di-cache
 * pada `globalThis` supaya tidak dibuat ulang di setiap invocation.
 *
 * Catatan dev: bila database belum tersedia, aplikasi tetap boleh boot
 * (hanya peringatan) agar pengembangan web bisa berjalan tanpa
 * Supabase. Di produksi kegagalan koneksi tetap fatal.
 */
const globalForPrisma = globalThis as unknown as { __webcatPrisma?: PrismaClient };

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      errorFormat: 'minimal',
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Koneksi database siap');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (process.env.NODE_ENV === 'production') {
        this.logger.error(`Gagal terhubung ke database: ${message}`);
        throw error;
      }
      this.logger.warn(
        `Database belum tersedia (${message}). Mode dev dilanjutkan; endpoint yang butuh DB akan gagal.`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

export function createPrismaClient(): PrismaClient {
  if (!globalForPrisma.__webcatPrisma) {
    globalForPrisma.__webcatPrisma = new PrismaClient({ errorFormat: 'minimal' });
  }
  return globalForPrisma.__webcatPrisma;
}
