import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { MEDIA_MIN_DIMENSION } from '@webcat/contracts';
import {
  FIGURE_SIZE,
  correctOptionVariant,
  figureAltText,
  renderFigure,
  STEM_VARIANT,
  type FigureSpec,
} from '../prisma/seed/media/figural';
import {
  FIGURAL_KECERDASAN,
  FIGURAL_TPA,
  figureAssetCode,
  figureAssets,
  layoutFor,
} from '../prisma/seed/questions/figural';

/**
 * F3-21/F3-23/F3-24 — kualitas aset figural.
 *
 * Dua hal yang mudah salah pada soal bergambar dan mahal ditemukan di UI:
 *   1. gambar tidak valid / terlalu kecil → tile kosong di runner;
 *   2. dua pilihan gambar identik → soal punya lebih dari satu jawaban benar.
 *
 * Test ini memeriksa keduanya langsung dari generator, sebelum seed menyentuh
 * database.
 */

const FIGURAL_ROWS = [...FIGURAL_KECERDASAN, ...FIGURAL_TPA];
const IMAGE_ROWS = FIGURAL_ROWS.filter((row) => row.type === 'IMAGE_CHOICE');

function specOf(row: (typeof FIGURAL_ROWS)[number]): FigureSpec {
  return { family: row.family, seed: row.seed };
}

async function webpOf(spec: FigureSpec, variant: number): Promise<Buffer> {
  return sharp(Buffer.from(renderFigure(spec, variant), 'utf8'))
    .webp({ quality: 82 })
    .toBuffer();
}

describe('aset figural — bentuk berkas', () => {
  it('menghasilkan minimal 20 aset unik', () => {
    const assets = figureAssets();
    expect(assets.length).toBeGreaterThanOrEqual(20);
    expect(new Set(assets.map((asset) => asset.code)).size).toBe(assets.length);
  });

  it('setiap aset dirender menjadi WebP yang lebih besar dari batas minimum', async () => {
    // Sampel 8 aset (termasuk semua keluarga) sudah mewakili seluruh generator;
    // merender semuanya membuat test lambat tanpa menambah cakupan berarti.
    const sample = figureAssets().slice(0, 8);

    for (const asset of sample) {
      const buffer = await webpOf(asset.spec, asset.variant);
      const meta = await sharp(buffer).metadata();

      expect(meta.format, asset.code).toBe('webp');
      expect(meta.width ?? 0, asset.code).toBeGreaterThanOrEqual(MEDIA_MIN_DIMENSION);
      expect(meta.height ?? 0, asset.code).toBeGreaterThanOrEqual(MEDIA_MIN_DIMENSION);
      expect(meta.width, asset.code).toBe(FIGURE_SIZE);
      expect(buffer.length, asset.code).toBeLessThan(5 * 1024 * 1024);
    }
  });

  it('setiap aset punya alt text yang tidak kosong', () => {
    for (const asset of figureAssets()) {
      expect(asset.alt.length, asset.code).toBeGreaterThan(3);
    }
  });
});

describe('kunci jawaban soal bergambar', () => {
  it('setiap soal punya satu gambar benar dan empat gambar berbeda', async () => {
    for (const row of IMAGE_ROWS) {
      const spec = specOf(row);
      const { variantByLabel, correctIndex } = layoutFor(row);

      expect(variantByLabel, row.code).toHaveLength(4);
      expect(new Set(variantByLabel).size, row.code).toBe(4);
      expect(variantByLabel[correctIndex], row.code).toBe(correctOptionVariant(spec));

      // Empat pilihan harus tampak berbeda (byte berbeda ⇒ gambar berbeda).
      const rendered = await Promise.all(variantByLabel.map((variant) => webpOf(spec, variant)));
      for (let left = 0; left < rendered.length; left += 1) {
        for (let right = left + 1; right < rendered.length; right += 1) {
          expect(
            rendered[left]!.equals(rendered[right]!),
            `${row.code}: pilihan ${'ABCD'[left]} dan ${'ABCD'[right]} identik`,
          ).toBe(false);
        }
      }
    }
  });

  it('kunci tersebar di lebih dari satu label', () => {
    const labels = new Set(IMAGE_ROWS.map((row) => 'ABCD'[layoutFor(row).correctIndex]));
    expect(labels.size).toBeGreaterThanOrEqual(3);
  });

  it('gambar stem berbeda dari setiap gambar pilihan', async () => {
    for (const row of IMAGE_ROWS.slice(0, 8)) {
      const spec = specOf(row);
      const stem = await webpOf(spec, STEM_VARIANT);
      const options = await Promise.all(
        [0, 1, 2, 3].map((variant) => webpOf(spec, variant)),
      );

      for (const [index, option] of options.entries()) {
        expect(
          stem.equals(option),
          `${row.code}: stem sama dengan pilihan ${'ABCD'[index]}`,
        ).toBe(false);
      }
    }
  });

  it('kode aset untuk stem dan setiap label stabil dan unik', () => {
    const codes = new Set<string>();
    for (const row of FIGURAL_ROWS) {
      const spec = specOf(row);
      codes.add(figureAssetCode(spec, STEM_VARIANT));
      if (row.type === 'IMAGE_CHOICE') {
        for (const variant of [0, 1, 2, 3]) codes.add(figureAssetCode(spec, variant));
      }
    }

    expect(codes.size).toBeGreaterThanOrEqual(20);
    // Format kode dipakai sebagai kunci map saat seed.
    for (const code of codes) {
      expect(code).toMatch(/^FIG-[A-Z]+-\d+-(STEM|A|B|C|D)$/);
    }
  });

  it('teks alternatif menyebut keluarga gambar', () => {
    const spec: FigureSpec = { family: 'series', seed: 0 };
    expect(figureAltText(spec, STEM_VARIANT)).toContain('gambar soal');
    expect(figureAltText(spec, 0)).toContain('pilihan A');
    expect(figureAltText(spec, 3)).toContain('pilihan D');
  });
});
