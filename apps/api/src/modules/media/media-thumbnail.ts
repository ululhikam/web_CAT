import sharp from 'sharp';
import { MEDIA_THUMBNAIL_MAX_DIMENSION, MEDIA_THUMBNAIL_QUALITY } from '@webcat/contracts';

/**
 * F5-15 — turunan thumbnail media.
 *
 * Thumbnail adalah varian kedua dari gambar yang sama: WebP dengan sisi
 * terpanjang maksimum 400 px. Grid media admin dan pemilih gambar pada formulir
 * soal hanya butuh gambar kecil, sementara runner ujian tetap memakai berkas
 * asli agar pola figural tetap tajam.
 *
 * Turunan dibuat sekali saat gambar disimpan (lihat `MediaService.storeBuffer`)
 * lalu ikut tersimpan sebagai kolom `thumb_*` pada baris `media_assets`. Dengan
 * begitu grid admin tidak memicu pekerjaan sharp tambahan, dan aset lama tetap
 * dilayani sebagai berkas asli tanpa backfill.
 */

export interface MediaThumbnail {
  data: Buffer;
  width: number;
  height: number;
}

/**
 * Buat thumbnail dari byte gambar.
 *
 * `withoutEnlargement` mencegah gambar kecil diperbesar; `fit: 'inside'`
 * menjaga rasio aspek agar pola figural tidak terpotong.
 */
export async function buildMediaThumbnail(
  input: Buffer,
  maxDimension: number = MEDIA_THUMBNAIL_MAX_DIMENSION,
): Promise<MediaThumbnail | null> {
  try {
    const { data, info } = await sharp(input)
      .rotate()
      .resize({
        width: maxDimension,
        height: maxDimension,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: MEDIA_THUMBNAIL_QUALITY })
      .toBuffer({ resolveWithObject: true });

    return { data, width: info.width, height: info.height };
  } catch {
    // Thumbnail bersifat turunan: kegagalan di sini tidak boleh menggagalkan
    // penyimpanan maupun penyajian gambar asli (mis. format tak dikenali sharp).
    return null;
  }
}
