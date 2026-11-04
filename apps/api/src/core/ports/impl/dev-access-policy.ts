import { Injectable } from '@nestjs/common';
import type { AccessDecision, AccessPolicyPort } from '@webcat/contracts';

/**
 * Implementasi dev: selalu mengizinkan ujian. Dipakai B3 sebelum B4 selesai.
 * Sengaja TIDAK membaca database agar tidak ada ketergantungan silang.
 */
@Injectable()
export class DevAccessPolicy implements AccessPolicyPort {
  async check(_userId: string): Promise<AccessDecision> {
    return {
      allowed: true,
      code: 'OK',
      message: 'Mode dev: akses selalu diizinkan',
      endsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      remainingDays: 30,
    };
  }

  async assertCanStartExam(_userId: string): Promise<void> {
    return;
  }

  async assertCanContinue(_userId: string): Promise<void> {
    return;
  }
}
