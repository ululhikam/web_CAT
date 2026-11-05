import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ImageChoiceTiles from './ImageChoiceTiles.svelte';
import { examQuestionTileView, renderQuestionTileView } from '$lib/exams/render-adapter';

/**
 * F3-15 — bukti komponen tile dipakai bersama.
 *
 * Kriteria runbook: "pratinjau = runner". Test ini merender komponen yang
 * SAMA dari dua sumber data yang berbeda (DTO peserta dan soal pratinjau
 * admin) lalu membandingkan HTML-nya. Bila salah satu layar kembali punya
 * salinan markup sendiri, perbedaan ini akan langsung terlihat.
 */

const examView = examQuestionTileView({
  type: 'IMAGE_CHOICE',
  stem: 'Pilih gambar yang melanjutkan pola.',
  media: [{ role: 'STEM', url: '/api/v1/media/stem/content?sig=a', alt: 'Pola induk' }],
  options: [
    {
      id: 'opt-a',
      label: 'A',
      text: null,
      media: [{ role: 'OPTION', url: '/api/v1/media/a/content?sig=b', alt: 'Pilihan A' }],
    },
    { id: 'opt-b', label: 'B', text: null, media: [] },
  ],
} as never);

const adminView = renderQuestionTileView({
  type: 'IMAGE_CHOICE',
  stemText: 'Pilih gambar yang melanjutkan pola.',
  media: [{ role: 'STEM', url: '/api/v1/media/stem/content?sig=a', altText: 'Pola induk' }],
  options: [
    {
      id: 'opt-a',
      label: 'A',
      contentText: null,
      media: [{ role: 'OPTION', url: '/api/v1/media/a/content?sig=b', altText: 'Pilihan A' }],
    },
    { id: 'opt-b', label: 'B', contentText: null, media: [] },
  ],
});

describe('ImageChoiceTiles (F3-15)', () => {
  it('HTML runner dan pratinjau admin identik untuk data yang setara', () => {
    const runner = render(ImageChoiceTiles, { props: { options: examView.options } }).body;
    const admin = render(ImageChoiceTiles, { props: { options: adminView.options } }).body;

    // Kelas scope Svelte sama karena komponennya sama; hanya penanda hidrasi
    // komentar yang mungkin berbeda posisi.
    const normalize = (html: string) => html.replace(/<!--[^>]*-->/g, '').replace(/\s+/g, ' ').trim();
    expect(normalize(admin)).toBe(normalize(runner));
  });

  it('menampilkan placeholder untuk opsi yang belum bergambar', () => {
    const { body } = render(ImageChoiceTiles, { props: { options: examView.options } });

    expect(body.match(/Gambar belum tersedia/g)?.length).toBe(1);
    expect(body).toContain('/api/v1/media/a/content');
  });

  it('menandai opsi aktif berdasarkan callback pemanggil', () => {
    const { body } = render(ImageChoiceTiles, {
      props: { options: examView.options, isActive: (option) => option.label === 'B' },
    });

    expect(body).toContain('tile--active');
    expect(body).toContain('aria-pressed="true"');
  });

  it('menampilkan penanda kunci hanya bila diminta', () => {
    const withKeyOption = [
      { id: 'opt-a', label: 'A', text: null, isCorrect: true, media: [] },
    ] as typeof examView.options;

    const withKey = render(ImageChoiceTiles, {
      props: { options: withKeyOption, showAnswerKey: true },
    }).body;
    const withoutKey = render(ImageChoiceTiles, { props: { options: withKeyOption } }).body;

    expect(withKey).toContain('tile__badge');
    expect(withoutKey).not.toContain('tile__badge');
  });

  it('huruf tile mengikuti daftar yang diberikan (A, B, …)', () => {
    const { body } = render(ImageChoiceTiles, {
      props: { options: examView.options, letters: ['A', 'B'] },
    });

    expect(body).toContain('>A</span>');
    expect(body).toContain('>B</span>');
  });
});
