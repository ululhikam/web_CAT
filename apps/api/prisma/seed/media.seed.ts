import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PrismaClient } from '@prisma/client';
import type { MediaService } from '../../src/modules/media/media.service';
import { renderFigure, STEM_VARIANT, type FigureSpec } from './media/figural';
import { figureAssets, type FigureAssetRef } from './questions/figural';

/**
 * Seed aset gambar figural (F3-21/F3-22).
 *
 * Gambar tidak disimpan sebagai berkas biner. Sumber kebenaran adalah
 * `media/figural.ts`: setiap aset dirender dari SVG deterministik lalu
 * dimasukkan lewat `MediaService.storeBuffer()` — jalur yang sama dengan
 * impor dokumen dan upload admin.
 *
 * Efeknya:
 *   - `storeBuffer` mengubah gambar menjadi WebP 256×256 dan menyimpan byte di
 *     `media_assets.data` (dipakai `DevStorage`);
 *   - dedupe berbasis checksum SHA-256 membuat seed **idempoten**: dijalankan
 *     dua kali tidak menambah baris `media_assets`.
 *
 * Alt text disimpan terpisah di `question_media.alt_text` (bukan di aset),
 * karena satu gambar bisa dipakai sebagai stem di satu soal dan pilihan di
 * soal lain.
 */

export interface SeedMediaRef {
  /** Kode aset, mis. `FIG-SERIES-0-A`. */
  code: string;
  /** Ukuran gambar yang dibangkitkan (selalu WebP). */
  spec: FigureSpec;
  /** `STEM_VARIANT` atau 0..3. */
  variant: number;
  /** Teks alternatif untuk `<img alt>`; wajib terisi. */
  alt: string;
}

export interface SeedMediaResult {
  /** Kode aset → `media_assets.id`. */
  idByCode: Map<string, string>;
  /** Jumlah gambar yang dirender. */
  total: number;
  /** Baris `media_assets` baru pada eksekusi ini (0 bila idempoten). */
  created: number;
}

/** Daftar aset yang dibutuhkan soal figural (stem + setiap pilihan). */
export function seedMediaRefs(): SeedMediaRef[] {
  return figureAssets().map((asset: FigureAssetRef) => ({
    code: asset.code,
    spec: asset.spec,
    variant: asset.variant,
    alt: asset.alt,
  }));
}

/** Render SVG untuk satu aset. */
export function renderSeedMedia(ref: SeedMediaRef): Buffer {
  return Buffer.from(renderFigure(ref.spec, ref.variant), 'utf8');
}

export const DENAH_PETA_ASSET_CODE = 'DENAH-SIP-PETA-1';

/**
 * Menyimpan seluruh aset dan mengembalikan peta kode → id.
 *
 * @param before Jumlah baris `media_assets` sebelum seed berjalan, dipakai
 *   hanya untuk melaporkan berapa aset baru.
 */
export async function seedMediaAssets(
  prisma: PrismaClient,
  media: MediaService,
  refs: readonly SeedMediaRef[] = seedMediaRefs(),
): Promise<SeedMediaResult> {
  const before = await prisma.mediaAsset.count();
  const idByCode = new Map<string, string>();

  for (const ref of refs) {
    const stored = await media.storeBuffer(renderSeedMedia(ref), 'image/webp', null);
    idByCode.set(ref.code, stored.id);
  }

  // Aset gambar denah lokasi / peta acuan SIP (50 soal kecerdasan)
  const denahBuffer = await readSeedMediaFile('denah-lokasi-sip');
  if (denahBuffer) {
    const stored = await media.storeBuffer(denahBuffer, 'image/png', null);
    idByCode.set(DENAH_PETA_ASSET_CODE, stored.id);
  }

  const after = await prisma.mediaAsset.count();

  return { idByCode, total: refs.length + (denahBuffer ? 1 : 0), created: after - before };
}

/**
 * Membaca aset dari disk bila ada (mode "aset nyata"), dengan fallback ke
 * generator. Dipakai bila suatu saat aset figural diganti foto/ilustrasi
 * manual: cukup taruh berkas di `prisma/seed/media/assets/<kode>.(png|webp)`.
 */
export async function readSeedMediaFile(code: string): Promise<Buffer | null> {
  for (const ext of ['png', 'webp', 'jpg']) {
    try {
      return await readFile(join(__dirname, 'media', 'assets', `${code}.${ext}`));
    } catch {
      // lanjut cari ekstensi lain
    }
  }
  return null;
}

export { STEM_VARIANT };
