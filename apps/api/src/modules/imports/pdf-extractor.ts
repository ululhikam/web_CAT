import type { ExtractedImage } from '@webcat/contracts';
import { nativeImport } from './native-import';
import type { SourceImage, SourceLine } from './document-parser';

interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  hasEOL?: boolean;
}

interface PdfDocumentProxy {
  numPages: number;
  destroy?: () => Promise<void>;
}

interface UnpdfModule {
  getDocumentProxy: (data: Uint8Array) => Promise<PdfDocumentProxy>;
  extractTextItems: (input: Uint8Array | PdfDocumentProxy) => Promise<{
    totalPages: number;
    items: PdfTextItem[][];
  }>;
  inspectPages: (input: Uint8Array | PdfDocumentProxy) => Promise<{
    totalPages: number;
    pages: Array<{
      textLength: number;
      invisibleTextLength: number;
      imageCount: number;
      imageCoverage: number;
    }>;
  }>;
  extractImages: (
    input: Uint8Array | PdfDocumentProxy,
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
 * Baris yang jelas bukan bagian soal: nomor halaman dan penanda halaman.
 * Dibuang supaya tidak menyamar sebagai nomor soal atau heading.
 */
const PAGE_NOISE = /^(?:hal(?:aman)?\.?\s*)?\d{1,4}(?:\s*(?:dari|\/|of)\s*\d{1,4})?$/i;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle]!;
}

interface ParsedText {
  totalPages: number;
  items: PdfTextItem[][];
}

interface Row {
  y: number;
  items: PdfTextItem[];
}

/** Kelompokkan potongan teks menjadi baris visual. */
function groupRows(items: PdfTextItem[], tolerance: number): Row[] {
  const rows: Row[] = [];
  for (const item of items) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(last.y - item.y) <= tolerance) {
      last.items.push(item);
    } else {
      rows.push({ y: item.y, items: [item] });
    }
  }
  return rows;
}

/**
 * Pisahkan halaman menjadi kolom bila terdeteksi tata letak dua kolom.
 *
 * Deteksi memakai sebaran tepi kiri teks: dua kelompok tepi kiri yang terpisah
 * jauh (>= 80pt) dan berukuran seimbang menandakan kolom. Gutter (celah di
 * antara kolom) juga diverifikasi agar tabel lebar tidak salah dipecah.
 * Halaman satu kolom dikembalikan apa adanya.
 */
export function splitColumns(items: PdfTextItem[]): PdfTextItem[][] {
  if (items.length < 10) return [items];

  const buckets = new Map<number, number>();
  for (const item of items) {
    const bucket = Math.round(item.x / 5) * 5;
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }
  const ranked = [...buckets.entries()].sort((a, b) => b[1] - a[1]);
  const [first, second] = ranked;
  if (!first || !second) return [items];

  const gap = second[0] - first[0];
  if (Math.abs(gap) < 80) return [items];

  const left = Math.min(first[0], second[0]);
  const right = Math.max(first[0], second[0]);
  const boundary = (left + right) / 2;

  const leftItems = items.filter((item) => item.x < boundary);
  const rightItems = items.filter((item) => item.x >= boundary);
  const share = items.length * 0.25;
  if (leftItems.length < share || rightItems.length < share) return [items];

  // Bila banyak potongan teks melewati batas kolom, ini bukan dua kolom
  // (kemungkinan tabel lebar atau paragraf penuh).
  const crossing = items.filter(
    (item) => item.x < boundary && item.x + item.width > boundary,
  ).length;
  if (crossing > items.length * 0.15) return [items];

  const byPos = (a: PdfTextItem, b: PdfTextItem) => b.y - a.y || a.x - b.x;
  return [leftItems.sort(byPos), rightItems.sort(byPos)];
}

/**
 * Ekstraksi PDF (pdf.js via `unpdf`).
 *
 * - Satu `PDFDocumentProxy` dipakai untuk teks, inspeksi, dan gambar. Selain
 *   lebih cepat, ini menghindari bug `DataCloneError` dari pdf.js ketika
 *   beberapa dokumen dibuat berurutan dalam satu proses.
 * - Teks dikelompokkan berdasarkan baseline Y dengan toleransi setengah tinggi
 *   font lalu diurutkan atas→bawah, kiri→kanan. Toleransi adaptif mencegah
 *   satu baris terpecah karena variasi baseline 1–2pt.
 * - Gambar hanya diekstrak pada halaman yang memang memuat gambar
 *   (`inspectPages`), sehingga PDF teks murni tidak memunculkan peringatan
 *   palsu dari decoder gambar.
 * - PDF hasil scan tidak menghasilkan teks → ditandai butuh OCR.
 */
export async function extractPdf(buffer: Uint8Array): Promise<PdfExtraction> {
  const warnings: string[] = [];
  const unpdf = await nativeImport<UnpdfModule>('unpdf');

  let proxy: PdfDocumentProxy | null = null;
  let text: ParsedText;
  let inspection: Awaited<ReturnType<UnpdfModule['inspectPages']>> | null = null;

  try {
    proxy = await unpdf.getDocumentProxy(buffer);
    text = await unpdf.extractTextItems(proxy);

    try {
      inspection = await unpdf.inspectPages(proxy);
    } catch (error) {
      warnings.push(
        `Tidak dapat memeriksa gambar PDF: ${
          error instanceof Error ? error.message : 'kesalahan tidak dikenal'
        }`,
      );
    }
  } catch (error) {
    // Fallback: sebagian PDF gagal dibuka lewat proxy bersama pada Node lama.
    if (proxy) {
      await proxy.destroy?.().catch(() => undefined);
      proxy = null;
    }
    try {
      text = await unpdf.extractTextItems(buffer);
    } catch {
      throw error;
    }
  }

  const lines: SourceLine[] = [];
  let characterCount = 0;
  const pagesWithoutText: number[] = [];

  for (const [pageIndex, pageItems] of (text!.items ?? []).entries()) {
    const page = pageIndex + 1;
    const heights = pageItems
      .map((item) => item.height || item.fontSize || 0)
      .filter((value) => value > 0);
    const tolerance = Math.max(1.5, (median(heights) || 6) * 0.5);

    const sorted = pageItems
      .filter((item) => item.str?.trim())
      .sort((a, b) => b.y - a.y || a.x - b.x);

    if (sorted.length === 0) pagesWithoutText.push(page);

    // Bank soal sering dicetak dua kolom. Tanpa pemisahan kolom, teks kiri dan
    // kanan pada baris yang sama akan tergabung menjadi satu baris rusak.
    for (const column of splitColumns(sorted)) {
      for (const row of groupRows(column, tolerance)) {
        const lineText = row.items
          .slice()
          .sort((a, b) => a.x - b.x)
          .map((item) => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (!lineText) continue;
        characterCount += lineText.length;
        if (PAGE_NOISE.test(lineText)) continue;
        lines.push({ text: lineText, page, y: row.y });
      }
    }
  }

  const images: ExtractedImage[] = [];
  const imagePositions = new Map<number, { y: number; height: number }>();
  let imageIndex = 0;

  const imagePages = (inspection?.pages ?? [])
    .map((info, index) => ({
      page: index + 1,
      count: info.imageCount,
      coverage: info.imageCoverage,
    }))
    .filter((entry) => entry.count > 0);

  for (const entry of imagePages) {
    try {
      const pageImages = await unpdf.extractImages(proxy ?? buffer, entry.page, {
        format: 'png',
      });
      for (const image of pageImages) {
        if (image.width < MIN_IMAGE_EDGE || image.height < MIN_IMAGE_EDGE) continue;
        images.push({
          index: imageIndex,
          page: entry.page,
          data: image.data,
          mime: 'image/png',
          width: image.width,
          height: image.height,
        });
        imagePositions.set(imageIndex, { y: image.bounds.y, height: image.bounds.height });
        imageIndex += 1;
      }
    } catch (error) {
      // Hanya beri peringatan bila halaman memang bergambar; kegagalan decoder
      // pada halaman teks murni tidak perlu mengganggu admin.
      if (entry.coverage > 0.01) {
        warnings.push(
          `Gambar halaman ${entry.page} tidak dapat diekstrak (${
            error instanceof Error ? error.message : 'kesalahan tidak dikenal'
          }); unggah gambar lewat ZIP atau lampirkan manual di review`,
        );
      }
    }
  }

  if (proxy) await proxy.destroy?.().catch(() => undefined);

  if (characterCount === 0) {
    warnings.push(
      'PDF tidak mengandung teks digital; kemungkinan hasil scan sehingga perlu OCR/koreksi manual',
    );
  } else {
    if (pagesWithoutText.length > 0) {
      warnings.push(
        `Halaman ${pagesWithoutText.join(', ')} tidak mengandung teks (kemungkinan hasil scan) dan perlu dikoreksi manual`,
      );
    }
    if (characterCount / Math.max(1, text!.totalPages) < 40) {
      warnings.push('Teks PDF sangat sedikit per halaman; periksa hasil ekstraksi');
    }
  }

  return {
    lines,
    images,
    imagePositions,
    pageCount: text!.totalPages,
    warnings,
    characterCount,
  };
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
