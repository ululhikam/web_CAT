import { createHash } from 'node:crypto';

/**
 * Normalisasi teks untuk dedupe: buang markup, tanda baca, dan variasi spasi.
 * Dua soal dengan isi sama tetapi format berbeda harus menghasilkan hash sama.
 */
export function normalizeForHash(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface DedupeOption {
  contentText?: string | null;
}

/**
 * sha256(stem ternormalisasi + '|' + opsi ternormalisasi terurut).
 * Opsi diurutkan agar perubahan urutan tampilan tidak dianggap soal baru.
 */
export function computeDedupeHash(stem: string, options: readonly DedupeOption[]): string {
  const optionText = options
    .map((option) => normalizeForHash(option.contentText ?? ''))
    .filter(Boolean)
    .sort()
    .join('|');
  return createHash('sha256').update(`${normalizeForHash(stem)}|${optionText}`, 'utf8').digest('hex');
}

/** Hash isi berkas untuk dedupe media. */
export function computeChecksum(buffer: Uint8Array): string {
  return createHash('sha256').update(buffer).digest('hex');
}
