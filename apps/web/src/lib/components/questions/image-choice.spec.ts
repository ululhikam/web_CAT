import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ImageChoice from './ImageChoice.svelte';
import type { RenderQuestion } from './types';

/**
 * F3-16 — renderer soal figural.
 *
 * Dirender lewat `svelte/server` (tanpa jsdom) supaya test cukup memeriksa
 * HTML hasil render: tile gambar, placeholder saat media opsi belum ada, dan
 * kunci jawaban yang hanya muncul bila diminta eksplisit.
 */

function question(overrides: Partial<RenderQuestion> = {}): RenderQuestion {
  return {
    id: 'q-1',
    type: 'IMAGE_CHOICE',
    stemText: 'Pilih gambar yang melanjutkan pola.',
    options: [
      {
        id: 'opt-a',
        label: 'A',
        contentText: null,
        media: [{ url: '/api/v1/media/asset-a/content?sig=abc', altText: 'Pola A' }],
      },
      {
        id: 'opt-b',
        label: 'B',
        contentText: null,
        media: [{ url: '/api/v1/media/asset-b/content?sig=def', altText: 'Pola B' }],
      },
    ],
    media: [],
    ...overrides,
  };
}

describe('ImageChoice', () => {
  it('merender satu tile per opsi beserta gambarnya', () => {
    const { body } = render(ImageChoice, { props: { question: question() } });

    expect(body.match(/class="tile(?: |")/g)?.length).toBe(2);
    expect(body).toContain('/api/v1/media/asset-a/content');
    expect(body).toContain('/api/v1/media/asset-b/content');
    expect(body).toContain('alt="Pola A"');
  });

  it('memberi placeholder bila opsi belum bergambar', () => {
    const { body } = render(ImageChoice, {
      props: {
        question: question({
          options: [
            { id: 'opt-a', label: 'A', contentText: null, media: [] },
            { id: 'opt-b', label: 'B', contentText: null, media: [] },
          ],
        }),
      },
    });

    expect(body.match(/Gambar belum tersedia/g)?.length).toBe(2);
  });

  it('menandai opsi terpilih lewat aria-pressed + kelas aktif', () => {
    const { body } = render(ImageChoice, {
      props: { question: question(), selected: ['B'] },
    });

    expect(body).toContain('aria-pressed="true"');
    expect(body).toContain('tile--active');
  });

  it('tidak membocorkan kunci jawaban ke peserta', () => {
    const { body } = render(ImageChoice, {
      props: {
        question: question({
          options: [
            {
              id: 'opt-a',
              label: 'A',
              contentText: null,
              isCorrect: true,
              media: [{ url: '/a.webp', altText: 'A' }],
            },
            {
              id: 'opt-b',
              label: 'B',
              contentText: null,
              isCorrect: false,
              media: [{ url: '/b.webp', altText: 'B' }],
            },
          ],
        }),
      },
    });

    expect(body).not.toContain('tile--correct');
    expect(body).not.toContain('kunci');
  });

  it('menampilkan kunci hanya untuk pratinjau admin', () => {
    const { body } = render(ImageChoice, {
      props: {
        question: question({
          options: [
            {
              id: 'opt-a',
              label: 'A',
              contentText: null,
              isCorrect: true,
              media: [{ url: '/a.webp', altText: 'A' }],
            },
          ],
        }),
        showAnswerKey: true,
      },
    });

    expect(body).toContain('tile--correct');
    expect(body).toContain('kunci');
  });

  it('merender media stem bila ada', () => {
    const { body } = render(ImageChoice, {
      props: {
        question: question({
          media: [{ url: '/api/v1/media/asset-stem/content?sig=xyz', altText: 'Pola induk' }],
        }),
      },
    });

    expect(body).toContain('/api/v1/media/asset-stem/content');
    expect(body).toContain('alt="Pola induk"');
  });
});
