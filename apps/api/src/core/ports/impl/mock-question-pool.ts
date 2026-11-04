import { Injectable } from '@nestjs/common';
import type { PoolStatus, QuestionPoolPort } from '@webcat/contracts';

/**
 * Pool dev: menganggap bank soal selalu cukup. B2 menggantinya dengan
 * PrismaQuestionPool pada gate G2.
 */
@Injectable()
export class MockQuestionPool implements QuestionPoolPort {
  async validate(_subtestCode: string, count: number): Promise<PoolStatus> {
    return {
      ready: true,
      available: count,
      required: count,
      missingSubtestCodes: [],
    };
  }
}
