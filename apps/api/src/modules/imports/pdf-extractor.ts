import type { ExtractedImage } from '@webcat/contracts';
import type { SourceImage, SourceLine } from './document-parser';

/**
 * `unpdf` hanya tersedia sebagai ESM, sedangkan API dikompilasi ke CommonJS.
 *
 * `new Function` dipakai agar TypeScript tidak menurunkan `import()` menjadi
 * `require()`; sekaligus menjaga modul berat tetap dimuat malas (cold start
 * jalur ujian tidak terpengaruh).
 */
const nativeImport = new Function('specifier', 'return import(specifier)') as <T>(
  specifier: string,
) => Promise<T>;

interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

interface UnpdfModule {
  extractTextItems: (data: Uint8Array) => Promise<{
    totalPages: number;
    items: PdfTextItem[][];
  }>;
  extractImages: (
    data: Uint8Array,
    pageNumber: number,
    options?: { format?: 'rgba' | 'png' },
  ) => Promise<
    Array<{
      data: Uint8Array;
      width: number;
      height: number;
      key: string | null;
      bounds: { x: number; y: number; width: number; height: number };
    }>
  >;
}

export interface PdfExtraction {
  lines: SourceLine[];
  images: ExtractedImage[];
  /** Posisi gambar pada koordinat PDF (untuk penempatan otomatis). */
  imagePositions: Map<number, { y: number; height: number }>;
  pageCount: number;
  warnings: string[];
  characterCount: number;
}

const MIN_IMAGE_EDGE = 80;

/**
 * Ekstraksi PDF (pdf.js via `unpdf`).
 *
 * - Teks per halaman dikelompokkan berdasarkan baseline Y (origin kiri-bawah)
 *   lalu diurutkan dari atas ke bawah, kiri ke kanan.
 * - Gambar diekstrak per halaman sebagai PNG; posisi Y disimpan agar parser
 *   bisa memutuskan STEM vs OPTION.
 * - PDF hasil scan tidak menghasilkan teks → ditandai butuh OCR.
 */
export async function extractPdf(buffer: Uint8Array): Promise<PdfExtraction> {
  const warnings: string[] = [];
  const unpdf = await nativeImport<UnpdfModule>('unpdf');

  const { totalPages, items } = await unpdf.extractTextItems(buffer);
  const lines: SourceLine[] = [];
  let characterCount = 0;

  items.forEach((pageItems, pageIndex) => {
    const page = pageIndex + 1;
    const rows = new Map<number, PdfTextItem[]>();

    for (const item of pageItems) {
      const text = item.str?.trim();
      if (!text) continue;
      characterCount += text.length;
      const key = Math.round(item.y / 3) * 3;
      const bucket = rows.get(key);
      if (bucket) bucket.push(item);
      else rows.set(key, [item]);
    }

    const ordered = [...rows.entries()].sort((a, b) => b[0] - a[0]);
    for (const [, bucket] of ordered) {
      const text = bucket
        .slice()
        .sort((a, b) => a.x - b.x)
        .map((item) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (!text) continue;
      lines.push({ text, page, y: bucket[0]!.y });
    }
  });

  const images: ExtractedImage[] = [];
  const imagePositions = new Map<number, { y: number; height: number }>();
  let imageIndex = 0;

  for (let page = 1; page <= totalPages; page += 1) {
    try {
      const pageImages = await unpdf.extractImages(buffer, page, { format: 'png' });
      for (const image of pageImages) {
        if (image.width < MIN_IMAGE_EDGE || image.height < MIN_IMAGE_EDGE) continue;
        images.push({
          index: imageIndex,
          page,
          data: image.data,
          mime: 'image/png',
          width: image.width,
          height: image.height,
        });
        imagePositions.set(imageIndex, { y: image.bounds.y, height: image.bounds.height });
        imageIndex += 1;
      }
    } catch (error) {
      warnings.push(
        `Gambar halaman ${page} tidak dapat diekstrak: ${
          error instanceof Error ? error.message : 'kesalahan tidak dikenal'
        }`,
      );
    }
  }

  await unpdf;
  if (characterCount === 0) {
    warnings.push(
      'PDF tidak mengandung teks digital; kemungkinan hasil scan sehingga perlu OCR/koreksi manual',
    );
  } else if (characterCount / Math.max(1, totalPages) < 40) {
    warnings.push('Teks PDF sangat sedikit per halaman; periksa hasil ekstraksi');
  }

  return { lines, images, imagePositions, pageCount: totalPages, warnings, characterCount };
}

/** Konversi hasil ekstraksi ke bentuk yang dipakai parser. */
export function pdfImagesForParser(extraction: PdfExtraction): SourceImage[] {
  return extraction.images.map((image) => ({
    index: image.index,
    page: image.page,
    y: extraction.imagePositions.get(image.index)?.y,
    height: extraction.imagePositions.get(image.index)?.height ?? image.height,
  }));
}