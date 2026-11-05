import { describe, expect, it } from 'vitest';
import type { ExamQuestion } from '@webcat/contracts';
import {
  MediaPrefetcher,
  PRELOAD_AHEAD,
  planMediaPreload,
  questionMediaUrls,
  shouldPrefetchMedia,
} from '$lib/exams/media-preload';

/**
 * F5-11 — preload 2 soal berikutnya.
 *
 * Yang diuji adalah keputusan (soal mana, URL apa, kapan dilewati) karena
 * bagian itulah yang mudah salah: prefetch soal yang sedang tampil tidak ada
 * gunanya, prefetch soal yang sudah lewat memboroskan kuota, dan URL duplikat
 * (opsi memakai gambar identik) akan menambah request.
 */

function question(id: string, stemUrl: string | null, optionUrls: string[]): ExamQuestion {
  return {
    id,
    position: 1,
    type: 'IMAGE_CHOICE',
    stem: 'stem',
    stemFormat: 'MARKDOWN',
    difficulty: 'MEDIUM',
    weight: 1,
    columnIndex: null,
    rowCount: null,
    rows: null,
    missingElement: null,
    scale: null,
    answer: null,
    options: optionUrls.map((url, position) => ({
      id: `${id}-opt-${position}`,
      label: String.fromCharCode(65 + position),
      text: null,
      media: [{ url, role: 'OPTION' as const, alt: null }],
    })),
    media: stemUrl ? [{ url: stemUrl, role: 'STEM' as const, alt: 'Pola' }] : [],
  } as ExamQuestion;
}

describe('questionMediaUrls', () => {
  it('mengembalikan media stem lebih dulu, lalu media opsi', () => {
    const urls = questionMediaUrls(
      question('q1', '/stem.png', ['/a.png', '/b.png']),
    );
    expect(urls).toEqual(['/stem.png', '/a.png', '/b.png']);
  });

  it('membuang media EXPLANATION (tidak boleh bocor ke peserta)', () => {
    const withExplanation = question('q1', '/stem.png', ['/a.png']);
    withExplanation.media = [
      ...withExplanation.media,
      { url: '/pembahasan.png', role: 'EXPLANATION', alt: null },
    ];
    expect(questionMediaUrls(withExplanation)).toEqual(['/stem.png', '/a.png']);
  });

  it('mengabaikan URL kosong', () => {
    expect(questionMediaUrls(question('q1', '', ['', '/a.png']))).toEqual(['/a.png']);
  });

  it('mengembalikan larik kosong untuk soal tanpa gambar', () => {
    expect(questionMediaUrls(question('q1', null, []))).toEqual([]);
  });
});

describe('planMediaPreload', () => {
  const questions = [
    question('q1', '/q1-stem.png', ['/q1-a.png']),
    question('q2', '/q2-stem.png', ['/q2-a.png']),
    question('q3', '/q3-stem.png', ['/q3-a.png']),
    question('q4', '/q4-stem.png', ['/q4-a.png']),
  ];

  it('mengambil dua soal berikutnya, bukan soal yang sedang tampil', () => {
    expect(planMediaPreload(questions, 0)).toEqual([
      '/q2-stem.png',
      '/q2-a.png',
      '/q3-stem.png',
      '/q3-a.png',
    ]);
  });

  it('berhenti di akhir daftar soal', () => {
    expect(planMediaPreload(questions, 2)).toEqual(['/q4-stem.png', '/q4-a.png']);
    expect(planMediaPreload(questions, 3)).toEqual([]);
  });

  it('jumlah soal ke depan dapat diatur', () => {
    expect(planMediaPreload(questions, 0, 1)).toEqual(['/q2-stem.png', '/q2-a.png']);
    expect(planMediaPreload(questions, 0, 0)).toEqual([]);
  });

  it('menghapus URL duplikat antar soal', () => {
    const shared = [
      question('a', '/same.png', ['/x-a.png']),
      question('b', '/same.png', ['/x-b.png']),
      question('c', '/same.png', ['/x-c.png']),
    ];
    expect(planMediaPreload(shared, 0)).toEqual(['/same.png', '/x-b.png', '/x-c.png']);
  });

  it('tidak error untuk indeks negatif atau di luar daftar', () => {
    expect(planMediaPreload(questions, -1)).toEqual([]);
    expect(planMediaPreload([], 0)).toEqual([]);
    expect(planMediaPreload(questions, 99)).toEqual([]);
  });

  it('default-nya dua soal ke depan', () => {
    expect(PRELOAD_AHEAD).toBe(2);
  });
});

describe('shouldPrefetchMedia', () => {
  it('aktif bila informasi koneksi tidak tersedia', () => {
    expect(shouldPrefetchMedia(null)).toBe(true);
    expect(shouldPrefetchMedia(undefined)).toBe(true);
  });

  it('aktif pada koneksi normal', () => {
    expect(shouldPrefetchMedia({ effectiveType: '4g' })).toBe(true);
    expect(shouldPrefetchMedia({ effectiveType: '3g' })).toBe(true);
  });

  it('mati saat saveData aktif', () => {
    expect(shouldPrefetchMedia({ saveData: true, effectiveType: '4g' })).toBe(false);
  });

  it('mati pada koneksi sangat lambat', () => {
    expect(shouldPrefetchMedia({ effectiveType: '2g' })).toBe(false);
    expect(shouldPrefetchMedia({ effectiveType: 'slow-2g' })).toBe(false);
  });
});

describe('MediaPrefetcher', () => {
  function fakeFactory() {
    const created: Array<{ src: string; decode: () => Promise<void> }> = [];
    return {
      created,
      createImage: () => {
        const image = { src: '', decode: () => Promise.resolve() };
        created.push(image);
        return image;
      },
    };
  }

  it('meminta setiap URL tepat satu kali', () => {
    const { created, createImage } = fakeFactory();
    const prefetcher = new MediaPrefetcher({ createImage, connection: () => null });

    expect(prefetcher.prefetch(['/a.png', '/b.png'])).toEqual(['/a.png', '/b.png']);
    expect(prefetcher.prefetch(['/b.png', '/c.png'])).toEqual(['/c.png']);
    expect(created.map((image) => image.src)).toEqual(['/a.png', '/b.png', '/c.png']);
    expect(prefetcher.urls).toEqual(['/a.png', '/b.png', '/c.png']);
  });

  it('tidak meminta apa pun saat prefetch dimatikan', () => {
    const { created, createImage } = fakeFactory();
    const prefetcher = new MediaPrefetcher({
      createImage,
      connection: () => ({ saveData: true }),
    });

    expect(prefetcher.enabled).toBe(false);
    expect(prefetcher.prefetch(['/a.png'])).toEqual([]);
    expect(created).toHaveLength(0);
  });

  it('tidak meminta apa pun bila lingkungan tanpa Image', () => {
    const { created, createImage } = fakeFactory();
    const prefetcher = new MediaPrefetcher({
      createImage,
      available: () => false,
      connection: () => null,
    });

    expect(prefetcher.prefetch(['/a.png'])).toEqual([]);
    expect(created).toHaveLength(0);
  });

  it('mengabaikan decode yang gagal', async () => {
    const prefetcher = new MediaPrefetcher({
      createImage: () => ({ src: '', decode: () => Promise.reject(new Error('rusak')) }),
      connection: () => null,
    });

    expect(prefetcher.prefetch(['/a.png'])).toEqual(['/a.png']);
    // Tidak ada unhandled rejection: promise sudah ditangkap internal.
    await Promise.resolve();
  });

  it('berhenti menambah entri setelah batas memori', () => {
    const { created, createImage } = fakeFactory();
    const prefetcher = new MediaPrefetcher({
      createImage,
      connection: () => null,
      maxEntries: 2,
    });

    expect(prefetcher.prefetch(['/a.png', '/b.png', '/c.png'])).toEqual(['/a.png', '/b.png']);
    expect(created).toHaveLength(2);
  });

  it('reset melupakan riwayat URL', () => {
    const { createImage } = fakeFactory();
    const prefetcher = new MediaPrefetcher({ createImage, connection: () => null });

    prefetcher.prefetch(['/a.png']);
    prefetcher.reset();
    expect(prefetcher.urls).toEqual([]);
    expect(prefetcher.prefetch(['/a.png'])).toEqual(['/a.png']);
  });
});
