import { Module } from '@nestjs/common';
import { BillingAccessPolicy } from './billing-access-policy';

/**
 * Modul entitlement: satu-satunya konsumen tabel `subscriptions` untuk
 * keputusan akses ujian. Diekspor agar `PortsModule` bisa memakainya.
 */
@Module({
  providers: [BillingAccessPolicy],
  exports: [BillingAccessPolicy],
})
export class EntitlementsModule {}
