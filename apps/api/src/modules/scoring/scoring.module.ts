import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service';

/**
 * Modul penilaian. Tidak mengimpor modul domain lain agar dapat dipakai ulang
 * oleh `exams` (finalisasi) dan `results` (recompute admin).
 */
@Module({
  providers: [ScoringService],
  exports: [ScoringService],
})
export class ScoringModule {}
