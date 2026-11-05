import { describe, expect, it } from 'vitest';
import type { MediaZipFile, MediaZipQuestionRef } from '@webcat/contracts';
import {
  applyResultLines,
  applySuggestions,
  buildDraftRows,
  canApply,
  draftIssues,
  findQuestionBySlug,
  formatBytes,
  mappingRowsFromDraft,
  mergeQuestions,
  selectQuestion,
  statusLabel,
  statusTone,
  suggestedCodes,
  summarizeDraft,
} from './media-zip-draft';

/**
 * F5-14 — logika layar impor ZIP gambar.
 *
 * Yang diuji adalah keputusan yang tidak terlihat di markup: baris mana yang
 * boleh dikirim, bagaimana saran nama berkas diterjemahkan, dan kapan tombol
 * "Terapkan" dinonaktifkan. */

function file(overrides: Partial<MediaZipFile> = {}): MediaZipFile {
  const fileName = overrides.fileName ?? 'fig-016-stem.png';
  return {
    fileName,
    normalizedName: fileName.toLowerCase(),
    archivePath: fileName,
    sizeBytes: 1200,
    status: 'OK',
    message: null,
    ...overrides,
  };
}

const QUESTIONS: MediaZipQuestionRef[] = [
  { id: 'q-1', publicCode: 'FIG-016', optionLabels: ['A', 'B', 'C'] },
  { id: 'q-2', publicCode: 'VERB-001', optionLabels: ['A', 'B'] },
];

describe('buildDraftRows', () => {
  it('mengisi saran peran dan label opsi dari nama berkas', () => {
    const [stem, opsi] = buildDraftRows([
      file({ fileName: 'fig-016-stem.png' }),
      file({ fileName: 'fig-016-opt-b.png' }),
    ]);

    expect(stem?.role).toBe('STEM');
    expect(stem?.suggestion.slug).toBe('fig-016');
    expect(stem?.questionId).toBe('');
    expect(opsi?.role).toBe('OPTION');
    expect(opsi?.optionLabel).toBe('B');
  });

  it('meneruskan status dan pesan berkas bermasalah', () => {
    const [row] = buildDraftRows([
      file({ fileName: 'x.exe', status: 'UNSUPPORTED', message: 'Ekstensi tidak didukung' }),
    ]);

    expect(row?.status).toBe('UNSUPPORTED');
    expect(row?.message).toBe('Ekstensi tidak didukung');
  });

  it('menyimpan path arsip sebagai kunci baris karena nama dasar bisa ganda', () => {
    const [row] = buildDraftRows([
      file({ fileName: 'duplikat.png', archivePath: 'folder-a/duplikat.png', status: 'DUPLICATE' }),
    ]);

    expect(row?.archivePath).toBe('folder-a/duplikat.png');
    expect(row?.fileName).toBe('duplikat.png');
  });
});

describe('applySuggestions', () => {
  it('mencocokkan slug nama berkas dengan kode soal tanpa peduli huruf', () => {
    const rows = buildDraftRows([
      file({ fileName: 'FIG-016-stem.png' }),
      file({ fileName: 'verb-001-opt-b.png' }),
      file({ fileName: 'tidak-ada-stem.png' }),
    ]);

    const filled = applySuggestions(rows, QUESTIONS);

    expect(filled[0]?.questionId).toBe('q-1');
    expect(filled[0]?.publicCode).toBe('FIG-016');
    expect(filled[1]?.questionId).toBe('q-2');
    expect(filled[1]?.optionLabel).toBe('B');
    expect(filled[1]?.optionLabels).toEqual(['A', 'B']);
    // Tanpa soal yang cocok, baris dibiarkan kosong agar admin memilih manual.
    expect(filled[2]?.questionId).toBe('');
  });

  it('membuang label opsi yang tidak ada pada soal hasil pencocokan', () => {
    const [row] = buildDraftRows([file({ fileName: 'verb-001-opt-c.png' })]);
    expect(row?.optionLabel).toBe('C');

    const [filled] = applySuggestions([row!], QUESTIONS);

    // VERB-001 hanya punya A dan B; mengirim C pasti ditolak server.
    expect(filled?.questionId).toBe('q-2');
    expect(filled?.optionLabel).toBe('');
  });

  it('tidak menyentuh baris yang berkasnya tidak bisa diimpor', () => {
    const rows = buildDraftRows([
      file({ fileName: 'fig-016-stem.png', status: 'TOO_LARGE', message: '6 MB' }),
    ]);

    expect(applySuggestions(rows, QUESTIONS)[0]?.questionId).toBe('');
  });
});

describe('findQuestionBySlug', () => {
  it('mendahulukan kecocokan persis, lalu potongan kode', () => {
    const extra: MediaZipQuestionRef[] = [
      ...QUESTIONS,
      { id: 'q-3', publicCode: 'FIG-016-B', optionLabels: ['A'] },
    ];

    expect(findQuestionBySlug('fig-016', extra)?.id).toBe('q-1');
    expect(findQuestionBySlug('VERB', extra)?.id).toBe('q-2');
    expect(findQuestionBySlug('  ', extra)).toBeNull();
  });
});

describe('mergeQuestions & suggestedCodes', () => {
  it('menambahkan soal baru tanpa menggandakan yang sudah ada', () => {
    const merged = mergeQuestions(
      [QUESTIONS[0]!],
      [QUESTIONS[0]!, QUESTIONS[1]!, { id: 'q-3', publicCode: 'KEP-009', optionLabels: [] }],
    );

    expect(merged.map((item) => item.id)).toEqual(['q-1', 'q-2', 'q-3']);
  });

  it('hanya menyarankan kode dari berkas yang bisa diimpor', () => {
    const rows = buildDraftRows([
      file({ fileName: 'fig-016-stem.png' }),
      file({ fileName: 'fig-016-opt-b.png' }),
      file({ fileName: 'verb-001-stem.png', status: 'TOO_LARGE', message: 'besar' }),
    ]);

    expect(suggestedCodes(rows)).toEqual(['FIG-016']);
  });
});

describe('selectQuestion', () => {
  it('menyegarkan label opsi dan membersihkan label yang tidak valid', () => {
    const [row] = buildDraftRows([file({ fileName: 'x-opt-e.png' })]);
    const updated = selectQuestion(row!, QUESTIONS[0]!);

    expect(updated.questionId).toBe('q-1');
    expect(updated.optionLabels).toEqual(['A', 'B', 'C']);
    expect(updated.optionLabel).toBe('');
  });
});

describe('mappingRowsFromDraft', () => {
  it('hanya mengirim baris bertarget dan membawa publicCode saat id kosong', () => {
    const rows = buildDraftRows([
      file({ fileName: 'a.png' }),
      file({ fileName: 'b.png' }),
      file({ fileName: 'c.png', status: 'DUPLICATE', message: 'ganda' }),
    ]);

    rows[0] = { ...rows[0]!, questionId: 'q-1', publicCode: 'FIG-016', role: 'STEM' };
    rows[1] = { ...rows[1]!, publicCode: 'VERB-001', role: 'OPTION', optionLabel: 'A' };

    const mappings = mappingRowsFromDraft(rows);

    expect(mappings).toHaveLength(2);
    expect(mappings[0]).toEqual({
      fileName: 'a.png',
      questionId: 'q-1',
      role: 'STEM',
    });
    expect(mappings[1]).toEqual({
      fileName: 'b.png',
      publicCode: 'VERB-001',
      role: 'OPTION',
      optionLabel: 'A',
    });
  });

  it('tidak mengirim optionLabel untuk peran non-OPTION', () => {
    const rows = buildDraftRows([file({ fileName: 'a.png' })]);
    rows[0] = { ...rows[0]!, questionId: 'q-1', optionLabel: 'B' };

    expect(mappingRowsFromDraft(rows)[0]).not.toHaveProperty('optionLabel');
  });
});

describe('summarizeDraft & canApply', () => {
  it('memisahkan baris siap, bertarget, dan yang belum lengkap', () => {
    const rows = buildDraftRows([
      file({ fileName: 'a.png' }),
      file({ fileName: 'b.png' }),
      file({ fileName: 'c.png', status: 'TOO_LARGE', message: 'besar' }),
    ]);
    rows[0] = { ...rows[0]!, questionId: 'q-1', publicCode: 'FIG-016' };

    expect(summarizeDraft(rows)).toEqual({
      total: 3,
      importable: 2,
      mapped: 1,
      missingTarget: 1,
      missingOptionLabel: 0,
    });
  });

  it('menghitung baris opsi tanpa label opsi', () => {
    const rows = buildDraftRows([file({ fileName: 'a-opt-b.png' })]);
    rows[0] = { ...rows[0]!, questionId: 'q-1', publicCode: 'FIG-016', optionLabel: '' };

    expect(summarizeDraft(rows).missingOptionLabel).toBe(1);
  });

  it('melarang terapkan bila belum ada baris bertarget', () => {
    const files = [file({ fileName: 'a.png' })];
    const rows = buildDraftRows(files);

    expect(canApply(rows, files, QUESTIONS)).toBe(false);
  });

  it('mengizinkan terapkan bila semua baris bertarget valid', () => {
    const files = [file({ fileName: 'fig-016-stem.png' })];
    const rows = applySuggestions(buildDraftRows(files), QUESTIONS);

    expect(canApply(rows, files, QUESTIONS)).toBe(true);
  });

  it('menolak terapkan saat dua berkas dipetakan ke target yang sama', () => {
    const files = [file({ fileName: 'a.png' }), file({ fileName: 'b.png' })];
    const rows = buildDraftRows(files).map((row) => ({
      ...row,
      questionId: 'q-1',
      publicCode: 'FIG-016',
      role: 'STEM' as const,
    }));

    const issues = draftIssues(rows, files, QUESTIONS);
    expect(issues.errors.map((issue) => issue.code)).toContain('TARGET_CONFLICT');
    expect(canApply(rows, files, QUESTIONS)).toBe(false);
  });
});

describe('label & format', () => {
  it('menerjemahkan status menjadi label dan warna', () => {
    expect(statusLabel('OK')).toBe('Siap');
    expect(statusLabel('DUPLICATE')).toBe('Nama ganda');
    expect(statusTone('OK')).toBe('success');
    expect(statusTone('DUPLICATE')).toBe('warning');
    expect(statusTone('TOO_LARGE')).toBe('danger');
  });

  it('memformat ukuran berkas', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(900)).toBe('900 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB');
  });

  it('meringkas hasil terapkan tanpa mengulang angka yang sama', () => {
    const lines = applyResultLines({
      mapped: 4,
      imported: 4,
      attached: 3,
      skipped: 1,
      questionsUpdated: 2,
    });

    expect(lines[0]).toBe('3 lampiran terpasang pada 2 soal.');
    expect(lines[1]).toBe('4 gambar tersimpan sebagai media.');
    expect(lines[2]).toBe('1 target sudah punya gambar dan dilewati.');
    expect(lines).toHaveLength(3);
  });
});
