import { Global, Module } from '@nestjs/common';
import { AppConfigService } from '../config/config.service';
import { EntitlementsModule } from '../../modules/entitlements/entitlements.module';
import { BillingAccessPolicy } from '../../modules/entitlements/billing-access-policy';

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
import { DevStorage } from './impl/dev-storage';
import { ConsoleMail } from './impl/console-mail';
import { FakePaymentProvider } from './impl/fake-payment-provider';
import { MidtransProvider } from './impl/midtrans-provider';
import { HeuristicDocExtractor } from './impl/heuristic-doc-extractor';
import { PrismaAudit } from './impl/prisma-audit';

@Global()
@Module({
  imports: [EntitlementsModule],
  providers: [
    DevAccessPolicy,
    MockQuestionPool,
    DevStorage,
    ConsoleMail,
    FakePaymentProvider,
    MidtransProvider,
    HeuristicDocExtractor,
    PrismaAudit,
    {
      provide: ACCESS_POLICY,
      inject: [AppConfigService, DevAccessPolicy, BillingAccessPolicy],
      useFactory: (
        config: AppConfigService,
        dev: DevAccessPolicy,
        billing: BillingAccessPolicy,
      ) => {
        // `billing` dipakai setelah B4 selesai (gate G3). `dev` tetap tersedia
        // agar pengembangan modul lain tidak terblokir.
        return config.value.ACCESS_POLICY === 'billing' ? billing : dev;
      },
    },
    {
      provide: QUESTION_POOL,
      inject: [AppConfigService, MockQuestionPool],
      useFactory: (config: AppConfigService, mock: MockQuestionPool) => {
        void config.value.QUESTION_POOL;
        return mock;
      },
    },
    {
      provide: STORAGE,
      inject: [AppConfigService, DevStorage],
      useFactory: (config: AppConfigService, dev: DevStorage) => {
        void config.value.STORAGE;
        return dev;
      },
    },
    {
      provide: MAIL,
      inject: [AppConfigService, ConsoleMail],
      useFactory: (config: AppConfigService, consoleMail: ConsoleMail) => {
        void config.value.MAIL;
        return consoleMail;
      },
    },
    {
      provide: PAYMENT,
      inject: [AppConfigService, FakePaymentProvider, MidtransProvider],
      useFactory: (
        config: AppConfigService,
        fake: FakePaymentProvider,
        midtrans: MidtransProvider,
      ) => {
        return config.value.PAYMENT === 'midtrans' ? midtrans : fake;
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
