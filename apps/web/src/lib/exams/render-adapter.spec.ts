import { describe, expect, it } from 'vitest';
import type { ExamQuestion } from '@webcat/contracts';
import {
  examQuestionTileView,
  renderQuestionTileView,
  toImageTileView,
} from '$lib/exams/render-adapter';
import type { RenderQuestion } from '$lib/components/questions/types';

/**
 * F3-15 — pratinjau admin dan runner memakai adapter yang sama.
 *
 * Yang dijaga di sini bukan tampilan (itu tugas test komponen), melainkan
 * ATURAN BACA data: media `EXPLANATION` tidak boleh ikut, opsi tanpa gambar
 * tetap muncul (agar placeholder tampil), alt text diambil dari `alt` (DTO
 * peserta) maupun `altText` (form admin).
 */

const media = {
  stem: { url: '/api/v1/media/stem/content?sig=x', role: 'STEM', alt: 'Pola induk' },
  explanation: { url: '/api/v1/media/expl/content?sig=y', role: 'EXPLANATION', alt: 'Pembahasan' },
  optionA: { url: '/api/v1/media/a/content?sig=z', role: 'OPTION', alt: 'Pilihan A' },
};

function examQuestion(overrides: Partial<ExamQuestion> = {}): ExamQuestion {
  return {
    id: 'q-1',
    position: 1,
    type: 'IMAGE_CHOICE',
    stem: 'Pilih gambar yang melanjutkan pola.',
    stemFormat: 'MARKDOWN',
    difficulty: 'MEDIUM',
    weight: 1,
    columnIndex: null,
    rowCount: null,
    rows: null,
    missingElement: null,
    scale: null,
    answer: null,
    options: [
      {
        id: 'opt-a',
        label: 'A',
        text: null,
        media: [media.optionA],
      },
      {
        id: 'opt-b',
        label: 'B',
        text: 'Cadangan',
        media: [],
      },
    ],
    media: [media.stem, media.explanation],
    ...overrides,
  } as ExamQuestion;
}

function renderQuestion(overrides: Partial<RenderQuestion> = {}): RenderQuestion {
  return {
    id: 'q-1',
    type: 'IMAGE_CHOICE',
    stemText: 'Pilih gambar yang melanjutkan pola.',
    options: [
      {
        id: 'opt-a',
        label: 'A',
        contentText: null,
        media: [{ url: media.optionA.url, altText: 'Pilihan A', role: 'OPTION' }],
      },
      { id: 'opt-b', label: 'B', contentText: 'Cadangan', media: [] },
    ],
    media: [
      { url: media.stem.url, altText: 'Pola induk', role: 'STEM' },
      { url: media.explanation.url, altText: 'Pembahasan', role: 'EXPLANATION' },
    ],
    ...overrides,
  };
}

describe('adapter tile soal bergambar (F3-15)', () => {
  it('hanya media STEM yang menjadi media soal', () => {
    const view = examQuestionTileView(examQuestion());

    expect(view.stemMedia.map((entry) => entry.url)).toEqual([media.stem.url]);
    expect(view.stemMedia[0]?.alt).toBe('Pola induk');
  });

  it('opsi tanpa gambar tetap ada agar placeholder muncul', () => {
    const view = examQuestionTileView(examQuestion());

    expect(view.options).toHaveLength(2);
    expect(view.options[1]).toMatchObject({ label: 'B', text: 'Cadangan', media: [] });
  });

  it('media opsi mempertahankan urutan dan alt-nya', () => {
    const view = examQuestionTileView(examQuestion());

    expect(view.options[0]?.media).toEqual([
      { url: media.optionA.url, alt: 'Pilihan A' },
    ]);
  });

  it('pratinjau admin menghasilkan view yang sama dengan runner', () => {
    expect(renderQuestionTileView(renderQuestion())).toEqual(
      examQuestionTileView(examQuestion()),
    );
  });

  it('teks dari dua sumber field (text/contentText) dinormalkan', () => {
    const view = toImageTileView({
      type: 'IMAGE_CHOICE',
      options: [
        { label: 'A', text: 'dari-runner' },
        { label: 'B', contentText: 'dari-admin' },
        { label: 'C', text: '   ' },
        { label: 'D' },
      ],
    });

    expect(view.options.map((option) => option.text)).toEqual(['dari-runner', 'dari-admin', null, null]);
  });

  it('entri media rusak (tanpa url) dibuang, bukan membuat render gagal', () => {
    const view = toImageTileView({
      type: 'IMAGE_CHOICE',
      media: [{ url: '' }, { url: '/ok.webp', role: 'STEM' }],
      options: [{ label: 'A', media: [{ url: '' }] }],
    });

    expect(view.stemMedia.map((entry) => entry.url)).toEqual(['/ok.webp']);
    expect(view.options[0]?.media).toEqual([]);
  });

  it('media tanpa role dianggap media soal (pilihan baru di form admin)', () => {
    const view = toImageTileView({
      type: 'IMAGE_CHOICE',
      media: [{ url: '/baru.webp' }],
      options: [],
    });

    expect(view.stemMedia).toHaveLength(1);
  });
});
