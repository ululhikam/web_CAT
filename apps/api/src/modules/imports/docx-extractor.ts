import type { ExtractedImage } from '@webcat/contracts';
import type { SourceLine } from './document-parser';

/** Sama seperti PDF: mammoth adalah paket CommonJS tetapi dimuat malas. */
const nativeImport = new Function('specifier', 'return import(specifier)') as <T>(
  specifier: string,
) => Promise<T>;

interface MammothImage {
  contentType: string;
  readAsBuffer: () => Promise<Buffer>;
}

interface MammothModule {
  convertToHtml: (
    input: { buffer: Buffer },
    options?: {
      convertImage?: unknown;
      ignoreEmptyParagraphs?: boolean;
      styleMap?: string[];
    },
  ) => Promise<{ value: string; messages: Array<{ type: string; message: string }> }>;
  images: {
    imgElement: (handler: (image: MammothImage) => Promise<{ src: string }>) => unknown;
  };
}

export interface DocxExtraction {
  lines: SourceLine[];
  images: ExtractedImage[];
  warnings: string[];
}

const IMAGE_TOKEN = /^\[\[IMG:(\d+)\]\]$/;

/**
 * Ekstraksi DOCX memakai `mammoth` (HTML) + `jszip` (lewat mammoth) untuk
 * gambar inline.
 *
 * Setiap gambar diganti token `[[IMG:n]]` sehingga parser tahu posisinya
 * relatif terhadap stem dan opsi — setara dengan koordinat pada PDF.
 */
export async function extractDocx(buffer: Buffer): Promise<DocxExtraction> {
  const warnings: string[] = [];
  const images: ExtractedImage[] = [];
  const mammoth = await nativeImport<MammothModule>('mammoth');

  const convertImage = mammoth.images.imgElement(async (image) => {
    const data = await image.readAsBuffer();
    const index = images.length;
    images.push({
      index,
      data: new Uint8Array(data),
      mime: normalizeMime(image.contentType),
    });
    return { src: `[[IMG:${index}]]` };
  });

  const result = await mammoth.convertToHtml(
    { buffer },
    {
      convertImage,
      ignoreEmptyParagraphs: true,
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
      ],
    },
  );

  for (const message of result.messages) {
    if (message.type === 'error') warnings.push(`DOCX: ${message.message}`);
  }

  const lines = htmlToLines(result.value);
  if (lines.every((line) => !line.text.trim())) {
    warnings.push('DOCX tidak menghasilkan teks yang dapat dibaca');
  }
  if (images.length > 0) {
    warnings.push(`${images.length} gambar inline ditemukan; periksa penempatannya di review`);
  }

  return { lines, images, warnings };
}

function normalizeMime(mime: string): string {
  const normalized = (mime || '').toLowerCase();
  if (normalized === 'image/jpg') return 'image/jpeg';
  if (['image/png', 'image/jpeg', 'image/webp'].includes(normalized)) return normalized;
  // Format lain (EMF/WMF/GIF) tetap dicoba; sharp akan menolak bila tak didukung.
  return normalized || 'image/png';
}

/**
 * Ubah HTML mammoth menjadi baris teks. Satu elemen blok = satu baris agar
 * heuristik nomor/opsi bekerja sama seperti pada PDF.
 */
export function htmlToLines(html: string): SourceLine[] {
  const withBreaks = html
    .replace(/\r/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|h[1-6]|li|tr|div|table|blockquote|ul|ol)>/gi, '\n')
    .replace(/<img[^>]*src="\[\[IMG:(\d+)\]\]"[^>]*>/gi, '\n[[IMG:$1]]\n');

  const text = stripTags(withBreaks);

  return text
    .split('\n')
    .map((line) => decodeEntities(line).replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .map((text) => ({ text }));
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?(?:span|strong|b|em|i|u|a|sup|sub|font|td|th|thead|tbody|p|h[1-6]|li|ul|ol|div|table|tr|blockquote)[^>]*>/gi, (tag) =>
      /^<\/(?:td|th)/i.test(tag) ? ' ' : '',
    )
    .replace(/<[^>]+>/g, '');
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));
}

export function isImageToken(line: string): boolean {
  return IMAGE_TOKEN.test(line);
}