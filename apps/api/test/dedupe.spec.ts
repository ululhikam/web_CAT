import { describe, expect, it } from 'vitest';
import { computeChecksum, computeDedupeHash, normalizeForHash } from '../src/modules/questions/dedupe';

describe('normalizeForHash', () => {
  it('membuang markup, tanda baca, dan variasi spasi', () => {
    expect(normalizeForHash('  <b>Ibu</b>   KOTA,  adalah... ')).toBe('ibu kota adalah');
  });

  it('menyamakan huruf besar-kecil', () => {
    expect(normalizeForHash('Sinonim KATA')).toBe(normalizeForHash('sinonim kata'));
  });
});

describe('computeDedupeHash', () => {
  it('sama untuk teks yang hanya berbeda format', () => {
    const a = computeDedupeHash('Apa ibu kota Indonesia?', [
      { contentText: 'Jakarta' },
      { contentText: 'Bandung' },
    ]);
    const b = computeDedupeHash('<p>Apa ibu kota <b>Indonesia</b>?</p>', [
      { contentText: 'Bandung!' },
      { contentText: 'jakarta' },
    ]);

    expect(a).toBe(b);
  });

  it('berbeda bila isi opsi berbeda', () => {
    const a = computeDedupeHash('Pertanyaan sama', [{ contentText: 'A' }, { contentText: 'B' }]);
    const b = computeDedupeHash('Pertanyaan sama', [{ contentText: 'A' }, { contentText: 'C' }]);
    expect(a).not.toBe(b);
  });

  it('mengabaikan urutan opsi', () => {
    const a = computeDedupeHash('Pertanyaan', [{ contentText: 'Satu' }, { contentText: 'Dua' }]);
    const b = computeDedupeHash('Pertanyaan', [{ contentText: 'Dua' }, { contentText: 'Satu' }]);
    expect(a).toBe(b);
  });

  it('menghasilkan sha256 hex 64 karakter', () => {
    expect(computeDedupeHash('teks', [])).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('computeChecksum', () => {
  it('stabil untuk isi yang sama', () => {
    const bytes = new TextEncoder().encode('gambar');
    expect(computeChecksum(bytes)).toBe(computeChecksum(bytes));
  });

  it('berbeda untuk isi berbeda', () => {
    expect(computeChecksum(new Uint8Array([1, 2, 3]))).not.toBe(
      computeChecksum(new Uint8Array([3, 2, 1])),
    );
  });
});
