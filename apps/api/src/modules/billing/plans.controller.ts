import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Plan } from '@webcat/contracts';
import { Public } from '../../core/auth/decorators/public.decorator';
import { PlansService } from './plans.service';

/**
 * Endpoint publik yang menyuplai halaman /pricing (SSR).
 * Tanpa autentikasi: harga harus bisa dilihat sebelum mendaftar.
 */
@ApiTags('Plans (public)')
@Controller('plans')
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Public()
  @Get()
  list(): Promise<Plan[]> {
    return this.plans.listPublic();
  }

  @Public()
  @Get(':code')
  async detail(@Param('code') code: string): Promise<Plan> {
    const plan = await this.plans.findByCode(code);
    if (!plan) {
      throw new NotFoundException({
        code: 'BILLING_PLAN_NOT_FOUND',
        message: 'Paket tidak ditemukan',
      });
    }
    return plan;
  }
}
