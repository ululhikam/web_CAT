import { describe, expect, it } from 'vitest';
import { MEDIA_MAX_BYTES } from '../src/media/index';
import {
  MEDIA_ZIP_MAX_ENTRIES,
  isIgnoredArchivePath,
  mediaZipApplyBodySchema,
  mediaZipMimeOf,
  scanMediaZipEntries,
  suggestMediaZipTarget,
  validateMediaZipMappings,
  type MediaZipFile,
  type MediaZipQuestionRef,
} from '../src/imports/media-zip';

/**
 * F5-14 — impor ZIP gambar.
 *
 * Yang diuji hanya fungsi murni: klasifikasi isi arsip, saran peran dari nama
 * berkas, dan validasi pemetaan berkas → soal/opsi. Pembacaan ZIP dan
 * penyimpanan media diuji di paket API.
 */

function scan(paths: Array<[string, number]>) {
  return scanMediaZipEntries(
    paths.map(([name, sizeBytes]) => ({ archivePath: name, sizeBytes })),
  );
}

function file(overrides: Partial<MediaZipFile> = {}): MediaZipFile {
  return {
    fileName: 'fig-016-stem.png',
    normalizedName: 'fig-016-stem.png',
    archivePath: 'fig-016-stem.png',
    sizeBytes: 1024,
    status: 'OK',
    message: null,
    ...overrides,
  };
}

function question(overrides: Partial<MediaZipQuestionRef> = {}): MediaZipQuestionRef {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    publicCode: 'PSI-KEC-FIG-016',
    optionLabels: ['A', 'B', 'C', 'D', 'E'],
    ...overrides,
  };
}

describe('scanMediaZipEntries', () => {
  it('menandai berkas sah sebagai OK dan menghitung ringkasan', () => {
    const result = scan([
      ['fig-016-stem.png', 2048],
      ['fig-016-opt-a.jpg', 4096],
    ]);

    expect(result.files.map((entry) => entry.status)).toEqual(['OK', 'OK']);
    expect(result.summary).toMatchObject({ entries: 2, importable: 2 });
    expect(result.issues).toEqual([]);
  });

  it('menolak ekstensi yang tidak didukung dengan pesan yang menyebut ekstensinya', () => {
    const result = scan([['animasi.gif', 1024]]);

    expect(result.files[0]?.status).toBe('UNSUPPORTED');
    expect(result.files[0]?.message).toContain('.gif');
    expect(result.summary.unsupported).toBe(1);
  });

  it('menolak gambar melebihi batas ukuran media (5 MB)', () => {
    const result = scan([['besar.png', MEDIA_MAX_BYTES + 1]]);

    expect(result.files[0]?.status).toBe('TOO_LARGE');
    expect(result.files[0]?.message).toContain('5.0 MB');
    expect(result.summary.tooLarge).toBe(1);
  });

  it('menandai SEMUA berkas bernama dasar sama supaya admin memilih, bukan menebak', () => {
    const result = scan([
      ['set-a/fig-016.png', 1024],
      ['set-b/fig-016.png', 1024],
    ]);

    expect(result.files.map((entry) => entry.status)).toEqual(['DUPLICATE', 'DUPLICATE']);
    expect(result.summary.duplicate).toBe(2);
  });

  it('mewaspadai path absolut atau berisi ".."', () => {
    const result = scan([
      ['../rahasia.png', 1024],
      ['C:/gambar/fig.png', 1024],
    ]);

    expect(result.files.map((entry) => entry.status)).toEqual(['UNSAFE_PATH', 'UNSAFE_PATH']);
    expect(result.summary.unsafe).toBe(2);
  });

  it('melaporkan arsip kosong dan arsip kebanyakan berkas', () => {
    const empty = scanMediaZipEntries([]);
    expect(empty.issues[0]?.code).toBe('EMPTY_ARCHIVE');

    const tooMany = scanMediaZipEntries(
      Array.from({ length: MEDIA_ZIP_MAX_ENTRIES + 1 }, (_, index) => ({
        archivePath: `fig-${index}.png`,
        sizeBytes: 10,
      })),
    );
    expect(tooMany.issues[0]?.code).toBe('TOO_MANY_ENTRIES');
    expect(tooMany.files).toEqual([]);
  });

  it('menandai berkas 0 byte sebagai EMPTY, bukan gambar sah', () => {
    const result = scan([['kosong.png', 0]]);
    expect(result.files[0]?.status).toBe('EMPTY');
  });
});

describe('metadata sistem di ZIP', () => {
  it('mengabaikan __MACOSX dan dotfile', () => {
    expect(isIgnoredArchivePath('__MACOSX/._fig-016.png')).toBe(true);
    expect(isIgnoredArchivePath('folder/.DS_Store')).toBe(true);
    expect(isIgnoredArchivePath('fig-016.png')).toBe(false);
  });

  it('memetakan ekstensi ke MIME yang benar', () => {
    expect(mediaZipMimeOf('a.PNG')).toBe('image/png');
    expect(mediaZipMimeOf('a.webp')).toBe('image/webp');
    expect(mediaZipMimeOf('a.jpeg')).toBe('image/jpeg');
    expect(mediaZipMimeOf('a.jpg')).toBe('image/jpeg');
  });
});

describe('suggestMediaZipTarget', () => {
  it('mengenali akhiran stem', () => {
    expect(suggestMediaZipTarget('fig-016-stem.png')).toEqual({
      slug: 'fig-016',
      role: 'STEM',
    });
  });

  it('mengenali akhiran opsi dan mengambil labelnya', () => {
    expect(suggestMediaZipTarget('fig-016-opt-b.png')).toEqual({
      slug: 'fig-016',
      role: 'OPTION',
      optionLabel: 'B',
    });
    expect(suggestMediaZipTarget('fig-016_opsi_c.webp').optionLabel).toBe('C');
  });

  it('mengenali akhiran pembahasan', () => {
    expect(suggestMediaZipTarget('fig-016-pembahasan.jpg')).toMatchObject({
      slug: 'fig-016',
      role: 'EXPLANATION',
    });
  });

  it('tidak menebak peran bila tidak ada akhiran yang dikenali', () => {
    expect(suggestMediaZipTarget('soal khusus 12.png')).toEqual({
      slug: 'soal khusus 12',
      role: 'STEM',
    });
  });
});

describe('validateMediaZipMappings', () => {
  it('menerima pemetaan lengkap dan memberi peringatan untuk berkas tak dipetakan', () => {
    const result = validateMediaZipMappings({
      files: [file(), file({ fileName: 'lain.png', normalizedName: 'lain.png' })],
      mappings: [
        { fileName: 'fig-016-stem.png', questionId: question().id, role: 'STEM' },
        { fileName: 'fig-016-stem.png', publicCode: question().publicCode, role: 'OPTION', optionLabel: 'a' },
      ],
      questions: [question()],
    });

    expect(result.errors).toEqual([
      expect.objectContaining({ fileName: 'fig-016-stem.png', code: 'DUPLICATE_MAPPING' }),
    ]);
    expect(result.accepted).toEqual([
      {
        fileName: 'fig-016-stem.png',
        normalizedName: 'fig-016-stem.png',
        questionId: question().id,
        publicCode: question().publicCode,
        role: 'STEM',
      },
    ]);
    expect(result.warnings).toContain('"lain.png" tidak dipetakan dan akan dilewati.');
  });

  it('mencocokkan kode soal tanpa peduli huruf besar/kecil', () => {
    const result = validateMediaZipMappings({
      files: [file()],
      mappings: [{ fileName: 'fig-016-stem.png', publicCode: 'psi-kec-fig-016', role: 'STEM' }],
      questions: [question()],
    });

    expect(result.errors).toEqual([]);
    expect(result.accepted[0]?.questionId).toBe(question().id);
  });

  it('melaporkan berkas yang tidak ada di ZIP', () => {
    const result = validateMediaZipMappings({
      files: [file()],
      mappings: [{ fileName: 'hilang.png', questionId: question().id, role: 'STEM' }],
      questions: [question()],
    });

    expect(result.accepted).toEqual([]);
    expect(result.errors[0]).toMatchObject({ code: 'UNKNOWN_FILE' });
  });

  it('menolak berkas yang sudah gagal dipindai meski ikut dipetakan', () => {
    const result = validateMediaZipMappings({
      files: [file({ status: 'TOO_LARGE', message: 'Ukuran melebihi batas.' })],
      mappings: [{ fileName: 'fig-016-stem.png', questionId: question().id, role: 'STEM' }],
      questions: [question()],
    });

    expect(result.errors[0]).toMatchObject({
      code: 'FILE_NOT_IMPORTABLE',
      message: 'Ukuran melebihi batas.',
    });
  });

  it('melaporkan soal tujuan yang tidak ditemukan', () => {
    const result = validateMediaZipMappings({
      files: [file()],
      mappings: [{ fileName: 'fig-016-stem.png', publicCode: 'TIDAK-ADA', role: 'STEM' }],
      questions: [question()],
    });

    expect(result.errors[0]?.code).toBe('UNKNOWN_TARGET');
  });

  it('mewajibkan label opsi yang benar-benar ada pada soal', () => {
    const withoutLabel = validateMediaZipMappings({
      files: [file()],
      mappings: [{ fileName: 'fig-016-stem.png', questionId: question().id, role: 'OPTION' }],
      questions: [question()],
    });
    expect(withoutLabel.errors[0]?.code).toBe('OPTION_LABEL_REQUIRED');

    const invalidLabel = validateMediaZipMappings({
      files: [file()],
      mappings: [
        { fileName: 'fig-016-stem.png', questionId: question().id, role: 'OPTION', optionLabel: 'F' },
      ],
      questions: [question()],
    });
    expect(invalidLabel.errors[0]?.code).toBe('OPTION_LABEL_INVALID');
    expect(invalidLabel.errors[0]?.message).toContain('opsi F');
  });

  it('menolak dua berkas untuk target yang sama', () => {
    const result = validateMediaZipMappings({
      files: [
        file(),
        file({ fileName: 'fig-016-stem-2.png', normalizedName: 'fig-016-stem-2.png' }),
      ],
      mappings: [
        { fileName: 'fig-016-stem.png', questionId: question().id, role: 'STEM' },
        { fileName: 'fig-016-stem-2.png', questionId: question().id, role: 'STEM' },
      ],
      questions: [question()],
    });

    expect(result.errors).toEqual([
      expect.objectContaining({ fileName: 'fig-016-stem-2.png', code: 'TARGET_CONFLICT' }),
    ]);
  });

  it('melaporkan pemetaan kosong sebagai error, bukan impor diam-diam', () => {
    const result = validateMediaZipMappings({
      files: [file()],
      mappings: [],
      questions: [question()],
    });

    expect(result.errors[0]?.code).toBe('MAPPING_EMPTY');
    expect(result.accepted).toEqual([]);
  });
});

describe('mediaZipApplyBodySchema', () => {
  it('mem-parse JSON string dari multipart menjadi daftar pemetaan', () => {
    const parsed = mediaZipApplyBodySchema.parse({
      mapping: JSON.stringify({
        mappings: [
          { fileName: 'fig-016-stem.png', questionId: question().id, role: 'STEM' },
        ],
      }),
    });

    expect(parsed.mapping.mappings[0]).toMatchObject({ role: 'STEM' });
  });

  it('menolak JSON rusak dengan pesan yang jelas', () => {
    expect(() => mediaZipApplyBodySchema.parse({ mapping: '{bukan json' })).toThrow();
  });

  it('menolak baris tanpa questionId maupun publicCode', () => {
    expect(() =>
      mediaZipApplyBodySchema.parse({
        mapping: JSON.stringify({ mappings: [{ fileName: 'a.png', role: 'STEM' }] }),
      }),
    ).toThrow();
  });
});
