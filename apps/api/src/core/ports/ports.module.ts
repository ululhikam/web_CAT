import { Global, Module } from '@nestjs/common';
import { AppConfigService } from '../config/config.service';

/**
 * ============================================================================
 * PORTS MODULE — SHARED FILE (hanya integrator yang mengedit)
 * ----------------------------------------------------------------------------
 * Wiring implementasi port berdasarkan env. Setiap penambahan provider
 * adalah satu baris + review integrator.
 *
 *   ACCESS_POLICY   = dev  → DevAccessPolicy   | billing → BillingAccessPolicy (B4)
 *   QUESTION_POOL   = dev  → MockQuestionPool  | db      → PrismaQuestionPool (B2)
 *   PAYMENT         = fake → FakeProvider      | midtrans→ MidtransProvider (B4)
 *   STORAGE         = dev  → DevStorage        | supabase→ SupabaseStorage (B1)
 *   MAIL            = console → ConsoleMail    | resend  → ResendMail (B1)
 *   DOC_EXTRACTOR   = heuristic → HeuristicExtractor | ai → AiExtractor (B2)
 * ============================================================================
 */

export const ACCESS_POLICY = Symbol('ACCESS_POLICY');
export const QUESTION_POOL = Symbol('QUESTION_POOL');
export const STORAGE = Symbol('STORAGE');
export const MAIL = Symbol('MAIL');
export const PAYMENT = Symbol('PAYMENT');
export const DOC_EXTRACTOR = Symbol('DOC_EXTRACTOR');
export const AUDIT = Symbol('AUDIT');

import { DevAccessPolicy } from './impl/dev-access-policy';
import { MockQuestionPool } from './impl/mock-question-pool';
import { PrismaQuestionPool } from './impl/prisma-question-pool';
import { DevStorage } from './impl/dev-storage';
import { ConsoleMail } from './impl/console-mail';
import { SupabaseStorage } from './impl/supabase-storage';
import { ResendMail } from './impl/resend-mail';
import { FakePaymentProvider } from './impl/fake-payment-provider';
import { HeuristicDocExtractor } from './impl/heuristic-doc-extractor';
import { PrismaAudit } from './impl/prisma-audit';

@Global()
@Module({
  providers: [
    DevAccessPolicy,
    MockQuestionPool,
    PrismaQuestionPool,
    DevStorage,
    ConsoleMail,
    FakePaymentProvider,
    HeuristicDocExtractor,
    PrismaAudit,
    {
      provide: ACCESS_POLICY,
      inject: [AppConfigService, DevAccessPolicy],
      useFactory: (config: AppConfigService, dev: DevAccessPolicy) => {
        // Fase 5 (B4) mengganti cabang 'billing' ke BillingAccessPolicy.
        // Sampai itu, dev policy dipakai agar B3 tidak terblokir.
        void config.value.ACCESS_POLICY;
        return dev;
      },
    },
    {
      provide: QUESTION_POOL,
      inject: [AppConfigService, MockQuestionPool, PrismaQuestionPool],
      useFactory: (
        config: AppConfigService,
        mock: MockQuestionPool,
        prismaPool: PrismaQuestionPool,
      ) => {
        // `dev` memakai mock agar sesi ujian dapat dijalankan tanpa seed soal;
        // `db` memakai sampling nyata dari bank soal PUBLISHED.
        return config.value.QUESTION_POOL === 'db' ? prismaPool : mock;
      },
    },
    {
      provide: STORAGE,
      inject: [AppConfigService, DevStorage],
      useFactory: (config: AppConfigService, dev: DevStorage) => {
        return config.value.STORAGE === 'supabase' ? new SupabaseStorage(config) : dev;
      },
    },
    {
      provide: MAIL,
      inject: [AppConfigService, ConsoleMail],
      useFactory: (config: AppConfigService, consoleMail: ConsoleMail) => {
        return config.value.MAIL === 'resend' ? new ResendMail(config) : consoleMail;
      },
    },
    {
      provide: PAYMENT,
      inject: [AppConfigService, FakePaymentProvider],
      useFactory: (config: AppConfigService, fake: FakePaymentProvider) => {
        void config.value.PAYMENT;
        return fake;
      },
    },
    {
      provide: DOC_EXTRACTOR,
      inject: [AppConfigService, HeuristicDocExtractor],
      useFactory: (config: AppConfigService, heuristic: HeuristicDocExtractor) => {
        void config.value.DOC_EXTRACTOR;
        return heuristic;
      },
    },
    { provide: AUDIT, useExisting: PrismaAudit },
  ],
  exports: [ACCESS_POLICY, QUESTION_POOL, STORAGE, MAIL, PAYMENT, DOC_EXTRACTOR, AUDIT],
})
export class PortsModule {}
