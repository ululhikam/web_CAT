import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../core/auth/decorators/public.decorator';
import { PrismaService } from '../../core/prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness: proses hidup. Tidak menyentuh DB. */
  @Public()
  @Get('live')
  live(): { status: 'ok'; uptime: number; version: string } {
    return {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version ?? '0.1.0',
    };
  }

  /** Readiness: DB dapat dijangkau. Dipakai Vercel health check. */
  @Public()
  @Get('ready')
  async ready(): Promise<{ status: 'ok' | 'degraded'; database: string; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up', latencyMs: Date.now() - start };
    } catch {
      throw new ServiceUnavailableException({
        code: 'COMMON_MAINTENANCE',
        message: 'Database tidak dapat dijangkau',
      });
    }
  }
}
