import { describe, expect, it } from 'vitest';
import { emptyDraft, singleCorrect, toPayload, usesOptions, type QuestionDraft } from './draft';

function draft(overrides: Partial<QuestionDraft> = {}): QuestionDraft {
  return {
    ...emptyDraft(),
    stemText: '  Sinonim kata abadi adalah ...  ',
    ...overrides,
  };
}

describe('emptyDraft', () => {
  it('memberi empat opsi kosong berlabel A–D', () => {
    const value = emptyDraft();

    expect(value.options.map((option) => option.label)).toEqual(['A', 'B', 'C', 'D']);
    expect(value.options.every((option) => option.contentText === '')).toBe(true);
    expect(value.type).toBe('SINGLE_CHOICE');
    expect(value.status).toBe('DRAFT');
  });

  it('mengembalikan objek baru setiap panggilan', () => {
    const first = emptyDraft();
    first.options[0]!.contentText = 'x';

    expect(emptyDraft().options[0]?.contentText).toBe('');
  });
});

describe('usesOptions', () => {
  it('false hanya untuk Pass Hand', () => {
    expect(usesOptions('PASS_HAND_COLUMN')).toBe(false);
    expect(usesOptions('SINGLE_CHOICE')).toBe(true);
    expect(usesOptions('LIKERT_STATEMENT')).toBe(true);
  });
});

describe('singleCorrect', () => {
  it('true untuk pilihan tunggal, gambar, dan elemen hilang', () => {
    expect(singleCorrect('SINGLE_CHOICE')).toBe(true);
    expect(singleCorrect('IMAGE_CHOICE')).toBe(true);
    expect(singleCorrect('MISSING_ELEMENT')).toBe(true);
  });

  it('false untuk pilihan ganda dan Likert', () => {
    expect(singleCorrect('MULTI_CHOICE')).toBe(false);
    expect(singleCorrect('LIKERT_STATEMENT')).toBe(false);
  });
});

describe('toPayload', () => {
  it('memangkas teks dan membuang opsi kosong', () => {
    const payload = toPayload(
      draft({
        options: [
          { label: 'A', contentText: ' Kekal ', isCorrect: true, scoreValue: 1 },
          { label: 'B', contentText: '   ', isCorrect: false, scoreValue: 0 },
          { label: 'C', contentText: 'Sementara', isCorrect: false, scoreValue: 0 },
        ],
      }),
    );

    expect(payload.stemText).toBe('Sinonim kata abadi adalah ...');
    const options = payload.options as Array<{ label: string; contentText: string; sortOrder: number }>;
    expect(options.map((option) => option.label)).toEqual(['A', 'C']);
    expect(options.map((option) => option.sortOrder)).toEqual([0, 1]);
  });

  it('mengosongkan opsi untuk soal Pass Hand', () => {
    const payload = toPayload(draft({ type: 'PASS_HAND_COLUMN', columnIndex: 4 }));

    expect(payload.options).toEqual([]);
    expect(payload.columnIndex).toBe(4);
  });

  it('columnIndex hanya dikirim untuk soal Pass Hand', () => {
    const payload = toPayload(draft({ type: 'SINGLE_CHOICE', columnIndex: 9 }));

    expect(payload.columnIndex).toBeNull();
  });

  it('memecah tag berdasarkan koma dan membuang kosong', () => {
    const payload = toPayload(draft({ tags: 'verbal, , sinonim ,,' }));

    expect(payload.tags).toEqual(['verbal', 'sinonim']);
  });

  it('mengirim null untuk field opsional yang kosong', () => {
    const payload = toPayload(draft({ explanation: '   ', pairGroup: '', categoryId: '' }));

    expect(payload.explanation).toBeNull();
    expect(payload.pairGroup).toBeNull();
    expect(payload.categoryId).toBeNull();
  });

  it('tidak mengirim publicCode bila kosong', () => {
    expect(toPayload(draft({ publicCode: '   ' })).publicCode).toBeUndefined();
    expect(toPayload(draft({ publicCode: ' DEMO-1 ' })).publicCode).toBe('DEMO-1');
  });

  it('media opsi menyertakan optionLabel, media stem tidak', () => {
    const payload = toPayload(
      draft({
        media: [
          { mediaAssetId: '11111111-1111-1111-1111-111111111111', role: 'STEM', optionLabel: '' },
          {
            mediaAssetId: '22222222-2222-2222-2222-222222222222',
            role: 'OPTION',
            optionLabel: 'A',
          },
        ],
      }),
    );

    const media = payload.media as Array<{ role: string; optionLabel?: string; sortOrder: number }>;
    expect(media[0]).toMatchObject({ role: 'STEM', sortOrder: 0 });
    expect(media[0]?.optionLabel).toBeUndefined();
    expect(media[1]).toMatchObject({ role: 'OPTION', optionLabel: 'A', sortOrder: 1 });
  });
});
