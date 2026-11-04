import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

/** Global: hampir semua modul menulis jejak audit. */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
