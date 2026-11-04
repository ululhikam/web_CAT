import { Injectable } from '@nestjs/common';
import type { DocExtractorPort, ExtractionResult } from '@webcat/contracts';

const SUPPORTED = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * Placeholder Phase 0. B2 mengisi ekstraksi nyata (unpdf + mammoth) pada
 * gate G2; kontraknya sudah dibekukan di sini sehingga pemanggil tidak berubah.
 */
@Injectable()
export class HeuristicDocExtractor implements DocExtractorPort {
  supports(mime: string): boolean {
    return SUPPORTED.includes(mime);
  }

  async extract(_buffer: Uint8Array, _mime: string): Promise<ExtractionResult> {
    return {
      blocks: [],
      warnings: ['Ekstraksi dokumen belum diimplementasikan (Phase 0 placeholder)'],
      pageCount: 0,
      confidence: 0,
    };
  }
}
