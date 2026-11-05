import type { ExamQuestion } from '@webcat/contracts';
import { examQuestionTileView } from './render-adapter';

/**
 * F5-11 — preload 2 soal berikutnya.
 *
 * Seluruh teks soal sudah diambil `loadQuestions()` saat subtes dibuka, jadi
 * satu-satunya yang masih membuat navigasi terasa berhenti adalah gambar:
 * `<img>` baru meminta `/media/:id/content` ketika soal yang bersangkutan
 * dirender. Modul ini menghangatkan gambar soal berikutnya sehingga saat peserta
 * menekan "Berikutnya" gambarnya sudah ada di cache browser.
 *
 * Isi modul dipisah menjadi fungsi murni (mudah diuji tanpa DOM) dan kelas
 * `MediaPrefetcher` yang melakukan efek samping `new Image()`.
 */

/** Jumlah soal ke depan yang dihangatkan. */
export const PRELOAD_AHEAD = 2;

/** Bentuk minimal elemen gambar; unit test memakai objek palsu. */
export interface PreloadImage {
  src: string;
  decode?(): Promise<void>;
}

export type PreloadImageFactory = () => PreloadImage;

export interface ConnectionInfo {
  saveData?: boolean;
  effectiveType?: string;
}

/**
 * Media satu soal: stem lebih dulu, lalu media tiap opsi. Media `EXPLANATION`
 * tidak pernah ikut karena adapter F3-09 sudah membuangnya.
 */
export function questionMediaUrls(question: ExamQuestion): string[] {
  const view = examQuestionTileView(question);
  const urls: string[] = [];
  for (const media of view.stemMedia) {
    if (media.url.length > 0) urls.push(media.url);
  }
  for (const option of view.options) {
    for (const media of option.media) {
      if (media.url.length > 0) urls.push(media.url);
    }
  }
  return urls;
}

/**
 * URL media untuk `ahead` soal **setelah** `index` (soal yang sedang tampil
 * tidak ikut: `<img>`-nya sudah memulai unduhan sendiri). Urutan dipertahankan
 * agar media soal terdekat diminta lebih dulu, dan URL duplikat hanya diambil
 * sekali.
 */
export function planMediaPreload(
  questions: readonly ExamQuestion[],
  index: number,
  ahead: number = PRELOAD_AHEAD,
): string[] {
  if (!Number.isInteger(index) || index < 0 || ahead <= 0) return [];
  const urls: string[] = [];
  const seen = new Set<string>();

  for (let offset = 1; offset <= ahead; offset += 1) {
    const question = questions[index + offset];
    if (!question) break;
    for (const url of questionMediaUrls(question)) {
      if (seen.has(url)) continue;
      seen.add(url);
      urls.push(url);
    }
  }
  return urls;
}

/**
 * Prefetch dilewati pada koneksi hemat data / sangat lambat: navigasi sedikit
 * lebih lambat lebih baik daripada memakai jatah kuota peserta.
 */
export function shouldPrefetchMedia(connection?: ConnectionInfo | null): boolean {
  if (!connection) return true;
  if (connection.saveData === true) return false;
  return connection.effectiveType !== 'slow-2g' && connection.effectiveType !== '2g';
}

function navigatorConnection(): ConnectionInfo | null {
  if (typeof navigator === 'undefined') return null;
  const value = (navigator as Navigator & { connection?: ConnectionInfo }).connection;
  return value ?? null;
}

export interface MediaPrefetcherOptions {
  /** Pengganti `new Image()` untuk unit test. */
  createImage?: PreloadImageFactory;
  /** Sumber info koneksi; default `navigator.connection`. */
  connection?: () => ConnectionInfo | null;
  /** `false` bila lingkungan tidak bisa memuat gambar (SSR). */
  available?: () => boolean;
  /** Batas URL yang diingat agar memori tidak tumbuh tanpa henti. */
  maxEntries?: number;
}

const DEFAULT_MAX_ENTRIES = 64;

/**
 * Penghangat cache gambar. Satu instance per halaman ujian: URL yang sudah
 * pernah diminta tidak diulang, sehingga peserta yang bolak-balik antar soal
 * tidak memicu request tambahan.
 */
export class MediaPrefetcher {
  private readonly requested = new Set<string>();
  private readonly createImage: PreloadImageFactory;
  private readonly connection: () => ConnectionInfo | null;
  private readonly available: () => boolean;
  private readonly maxEntries: number;

  constructor(options: MediaPrefetcherOptions = {}) {
    const factory = options.createImage;
    this.createImage = factory ?? (() => new Image());
    this.connection = options.connection ?? navigatorConnection;
    // Factory yang disuntikkan (unit test) dianggap selalu tersedia; tanpa itu
    // SSR tidak punya `Image` dan prefetch harus dilewati.
    this.available = options.available ?? (() => factory !== undefined || typeof Image !== 'undefined');
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
  }

  /** `false` bila lingkungan tidak punya `Image` atau koneksi minta hemat data. */
  get enabled(): boolean {
    return this.available() && shouldPrefetchMedia(this.connection());
  }

  /** URL yang sudah dihangatkan (diagnostik & test). */
  get urls(): string[] {
    return [...this.requested];
  }

  /**
   * Menghangatkan `urls` tanpa menunggu hasilnya. Mengembalikan URL yang
   * benar-benar baru diminta (kosong bila prefetch mati atau sudah pernah).
   */
  prefetch(urls: readonly string[]): string[] {
    if (!this.enabled) return [];
    const started: string[] = [];

    for (const url of urls) {
      if (typeof url !== 'string' || url.length === 0) continue;
      if (this.requested.has(url)) continue;
      if (this.requested.size >= this.maxEntries) break;
      this.requested.add(url);
      started.push(url);

      const image = this.createImage();
      image.src = url;
      // Kegagalan decode bukan kegagalan ujian: soal tetap bisa dijawab.
      const decoded = image.decode?.();
      if (decoded) void decoded.catch(() => undefined);
    }
    return started;
  }

  /** Lupakan riwayat URL (dipakai saat berpindah subtes atau halaman ditutup). */
  reset(): void {
    this.requested.clear();
  }
}
