import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import {
  MEDIA_THUMBNAIL_MAX_DIMENSION,
  MEDIA_THUMBNAIL_QUALITY,
  needsThumbnail,
} from '@webcat/contracts';
import { buildMediaThumbnail } from '../src/modules/media/media-thumbnail';

/**
 * F5-15 — turunan thumbnail.
 *
 * Yang penting bukan piksel yang identik, melainkan kontraknya:
 *   - sisi terpanjang tidak pernah melebihi 400 px;
 *   - rasio aspek dipertahankan dan gambar kecil tidak diperbesar;
 *   - masukan rusak menghasilkan `null`, bukan exception, supaya penyajian
 *     berkas asli tidak ikut gagal.
 */

async function png(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 30, g: 120, b: 200 },
    },
  })
    .png()
    .toBuffer();
}

describe('buildMediaThumbnail', () => {
  it('mengecilkan sisi terpanjang ke batas dan mempertahankan rasio', async () => {
    const source = await png(1600, 900);
    const thumb = await buildMediaThumbnail(source);

    expect(thumb).not.toBeNull();
    expect(Math.max(thumb!.width, thumb!.height)).toBe(MEDIA_THUMBNAIL_MAX_DIMENSION);
    // 1600x900 → 400x225 (rasio 16:9).
    expect(thumb!.width).toBe(400);
    expect(thumb!.height).toBe(225);
  });

  it('memakai batas pada sisi tinggi untuk gambar potret', async () => {
    const thumb = await buildMediaThumbnail(await png(600, 1800));

    expect(thumb).not.toBeNull();
    expect(thumb!.height).toBe(MEDIA_THUMBNAIL_MAX_DIMENSION);
    expect(thumb!.width).toBeLessThan(MEDIA_THUMBNAIL_MAX_DIMENSION);
  });

  it('tidak memperbesar gambar yang sudah kecil', async () => {
    const thumb = await buildMediaThumbnail(await png(320, 240));

    expect(thumb).not.toBeNull();
    expect(thumb!.width).toBe(320);
    expect(thumb!.height).toBe(240);
  });

  it('selalu menghasilkan WebP', async () => {
    const thumb = await buildMediaThumbnail(await png(1200, 1200));

    expect(thumb).not.toBeNull();
    const metadata = await sharp(thumb!.data).metadata();
    expect(metadata.format).toBe('webp');
  });

  it('mengembalikan null untuk byte yang bukan gambar', async () => {
    expect(await buildMediaThumbnail(Buffer.from('bukan gambar'))).toBeNull();
  });
});

describe('needsThumbnail', () => {
  it('hanya butuh turunan bila sisi terpanjang melewati batas', () => {
    expect(needsThumbnail(1200, 800)).toBe(true);
    expect(needsThumbnail(401, 300)).toBe(true);
    expect(needsThumbnail(400, 300)).toBe(false);
    expect(needsThumbnail(null, 800)).toBe(false);
    expect(needsThumbnail(0, 0)).toBe(false);
  });
});

describe('konstanta thumbnail', () => {
  it('batas 400 px dan kualitas 70 sesuai spesifikasi F5-15', () => {
    expect(MEDIA_THUMBNAIL_MAX_DIMENSION).toBe(400);
    expect(MEDIA_THUMBNAIL_QUALITY).toBe(70);
  });
});
