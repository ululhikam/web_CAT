import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { BadRequestException } from '@nestjs/common';
import { MediaZipImportService } from '../src/modules/imports/media-zip.service';
import type { MediaZipMappingRow } from '@webcat/contracts';
import { MEDIA_ZIP_MAX_ENTRIES } from '@webcat/contracts';

/**
 * F5-14 — uji service impor ZIP gambar.
 *
 * Fungsi pemindaian & validasi murni sudah diuji di paket contracts; di sini
 * yang diperiksa adalah orkestrasinya: membaca ZIP sungguhan (JSZip), menyimpan
 * hanya berkas yang dipetakan, memasang media ke soal/opsi, dan menyusun
 * laporan per baris tanpa menggagalkan seluruh impor.
 */

async function buildZip(files: Record<string, Buffer | string>): Promise<Buffer> {
  const zip = new JSZip();
  for (const [name, content] of Object.entries(files)) zip.file(name, content);
  return zip.generateAsync({ type: 'nodebuffer' });
}

function upload(buffer: Buffer): Express.Multer.File {
  return {
    buffer,
    size: buffer.length,
    originalname: 'gambar.zip',
    mimetype: 'application/zip',
  } as Express.Multer.File;
}

interface HarnessOptions {
  existingLink?: boolean;
}

function createHarness(options: HarnessOptions = {}) {
  const created: Array<Record<string, unknown>> = [];
  const stored: string[] = [];
  const audited: Array<Record<string, unknown>> = [];

  const questions = [
    {
      id: 'q-fig-016',
      publicCode: 'FIG-016',
      stemText: 'Perhatikan gambar berikut.',
      options: [
        { id: 'opt-a', label: 'A' },
        { id: 'opt-b', label: 'B' },
      ],
    },
    {
      id: 'q-verb-001',
      publicCode: 'VERB-001',
      stemText: 'Tentukan bentuk verb yang tepat.',
      options: [{ id: 'opt-a2', label: 'A' }],
    },
  ];

  const prisma = {
    question: {
      findMany: async ({
        where,
      }: {
        where: {
          OR: Array<Record<string, unknown>>;
        };
      }) => {
        const ids = new Set<string>();
        const codes = new Set<string>();
        const needles: string[] = [];

        for (const clause of where.OR) {
          const byId = (clause as { id?: { in: string[] } }).id;
          const byCode = (clause as { publicCode?: { in: string[] } }).publicCode;
          const codeContains = (
            clause as { publicCode?: { contains?: string } }
          ).publicCode?.contains;
          const stemContains = (clause as { stemText?: { contains?: string } }).stemText
            ?.contains;
          if (byId?.in) for (const id of byId.in) ids.add(id);
          if (byCode?.in) for (const code of byCode.in) codes.add(code);
          if (codeContains) needles.push(codeContains.toLowerCase());
          if (stemContains) needles.push(stemContains.toLowerCase());
        }

        return questions
          .filter((row) => {
            if (ids.has(row.id) || codes.has(row.publicCode)) return true;
            return needles.some(
              (needle) =>
                row.publicCode.toLowerCase().includes(needle) ||
                row.stemText.toLowerCase().includes(needle),
            );
          })
          .map((row) => ({
            id: row.id,
            publicCode: row.publicCode,
            options: row.options.map((option) => ({ label: option.label })),
          }));
      },
    },
    questionOption: {
      findFirst: async ({ where }: { where: { questionId: string; label: string } }) => {
        const question = questions.find((row) => row.id === where.questionId);
        const option = question?.options.find((row) => row.label === where.label);
        return option ? { id: option.id } : null;
      },
    },
    questionMedia: {
      findFirst: async () => (options.existingLink ? { id: 'link-existing' } : null),
      create: async ({ data }: { data: Record<string, unknown> }) => {
        created.push(data);
        return { id: `link-${created.length}`, ...data };
      },
    },
  };

  const media = {
    storeBuffer: async (_buffer: Buffer, _mime: string, _actorId: string | null) => {
      stored.push('asset');
      return { id: `asset-${stored.length}` };
    },
  };

  const audit = {
    record: async (input: Record<string, unknown>) => {
      audited.push(input);
    },
  };

  const service = new MediaZipImportService(prisma as never, audit as never, media as never);

  return { service, created, stored, audited };
}

describe('MediaZipImportService.preview', () => {
  it('mengklasifikasikan berkas dan mengabaikan metadata sistem', async () => {
    const { service } = createHarness();
    const buffer = await buildZip({
      'fig-016-stem.png': Buffer.from('stem'),
      'folder/fig-016-opt-b.jpg': Buffer.from('opsi-b'),
      'catatan.txt': 'bukan gambar',
      '.DS_Store': 'metadata',
      '__MACOSX/._fig-016-stem.png': Buffer.from('metadata'),
      'a/duplikat.webp': Buffer.from('satu'),
      'b/duplikat.webp': Buffer.from('dua'),
    });

    const result = await service.preview(upload(buffer));
    const byName = new Map(result.files.map((file) => [file.fileName, file]));

    expect(result.archiveName).toBe('gambar.zip');
    expect(byName.get('fig-016-stem.png')?.status).toBe('OK');
    expect(byName.get('fig-016-opt-b.jpg')?.status).toBe('OK');
    expect(byName.get('duplikat.webp')?.status).toBe('DUPLICATE');
    // Berkas non-gambar dan metadata tidak pernah masuk laporan.
    expect(byName.has('catatan.txt')).toBe(false);
    expect(byName.has('.DS_Store')).toBe(false);
    expect(result.summary.importable).toBe(2);
    expect(result.summary.duplicate).toBe(2);
  });

  it('menolak arsip yang bukan ZIP', async () => {
    const { service } = createHarness();

    await expect(
      service.preview({
        buffer: Buffer.from('bukan zip'),
        size: 9,
        originalname: 'data.zip',
        mimetype: 'application/zip',
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('menolak unggahan tanpa berkas', async () => {
    const { service } = createHarness();
    await expect(service.preview(undefined)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('melaporkan arsip yang melebihi jumlah berkas alih-alih memotongnya diam-diam', async () => {
    const { service } = createHarness();
    const files: Record<string, Buffer> = {};
    for (let index = 0; index <= MEDIA_ZIP_MAX_ENTRIES; index += 1) {
      files[`fig-${index}.png`] = Buffer.from('x');
    }

    const result = await service.preview(upload(await buildZip(files)));

    expect(result.files).toHaveLength(0);
    expect(result.issues.map((issue) => issue.code)).toContain('TOO_MANY_ENTRIES');
  });
});

describe('MediaZipImportService.apply', () => {
  it('menyimpan gambar yang dipetakan lalu memasangnya ke soal dan opsi', async () => {
    const { service, created, stored, audited } = createHarness();
    const buffer = await buildZip({
      'fig-016-stem.png': Buffer.from('stem'),
      'fig-016-opt-b.png': Buffer.from('opsi-b'),
    });

    const mappings: MediaZipMappingRow[] = [
      { fileName: 'fig-016-stem.png', publicCode: 'fig-016', role: 'STEM' },
      { fileName: 'fig-016-opt-b.png', publicCode: 'FIG-016', role: 'OPTION', optionLabel: 'B' },
    ];

    const result = await service.apply(upload(buffer), mappings, { id: 'admin-1' });

    expect(result.mapped).toBe(2);
    expect(result.imported).toBe(2);
    expect(result.attached).toBe(2);
    expect(result.questionsUpdated).toBe(1);
    expect(result.errors).toEqual([]);
    expect(stored).toHaveLength(2);

    expect(created[0]).toMatchObject({
      questionId: 'q-fig-016',
      optionId: null,
      mediaAssetId: 'asset-1',
      role: 'STEM',
    });
    expect(created[1]).toMatchObject({
      questionId: 'q-fig-016',
      optionId: 'opt-b',
      mediaAssetId: 'asset-2',
      role: 'OPTION',
    });

    expect(audited[0]).toMatchObject({
      actorUserId: 'admin-1',
      action: 'import.media_zip_applied',
      entityType: 'media_import',
      metadata: { mapped: 2, attached: 2, imported: 2, skipped: 0 },
    });
  });

  it('melaporkan berkas yang tidak dipetakan dan kode soal yang tidak ada', async () => {
    const { service, created } = createHarness();
    const buffer = await buildZip({
      'fig-016-stem.png': Buffer.from('stem'),
      'tidak-dipakai.png': Buffer.from('lain'),
    });

    const result = await service.apply(
      upload(buffer),
      [
        { fileName: 'fig-016-stem.png', publicCode: 'TIDAK-ADA', role: 'STEM' },
        { fileName: 'hilang.png', publicCode: 'FIG-016', role: 'STEM' },
      ],
      { id: 'admin-1' },
    );

    expect(created).toHaveLength(0);
    expect(result.attached).toBe(0);
    expect(result.errors.map((row) => row.code)).toEqual(
      expect.arrayContaining(['UNKNOWN_FILE', 'UNKNOWN_TARGET']),
    );
    // Berkas yang ada di ZIP tetapi tidak dipetakan tetap dilaporkan.
    expect(result.warnings.some((line) => line.includes('tidak-dipakai.png'))).toBe(true);
  });

  it('melewati target yang sudah punya media (idempoten per slot)', async () => {
    const { service, created } = createHarness({ existingLink: true });
    const buffer = await buildZip({ 'fig-016-stem.png': Buffer.from('stem') });

    const result = await service.apply(
      upload(buffer),
      [{ fileName: 'fig-016-stem.png', publicCode: 'FIG-016', role: 'STEM' }],
      { id: 'admin-1' },
    );

    // Slot sudah terisi: tidak ada lampiran baru, tetapi byte tetap disimpan
    // (idempoten lewat checksum, jadi bukan duplikat di pustaka).
    expect(result.imported).toBe(1);
    expect(result.attached).toBe(0);
    expect(result.skipped).toBe(1);
    expect(created).toHaveLength(0);
    expect(result.warnings.some((line) => line.includes('sudah terpasang'))).toBe(true);
  });

  it('menolak label opsi yang tidak ada pada soal', async () => {
    const { service, created } = createHarness();
    const buffer = await buildZip({ 'fig-016-opt-e.png': Buffer.from('opsi-e') });

    const result = await service.apply(
      upload(buffer),
      [{ fileName: 'fig-016-opt-e.png', publicCode: 'FIG-016', role: 'OPTION', optionLabel: 'E' }],
      { id: 'admin-1' },
    );

    expect(created).toHaveLength(0);
    expect(result.errors).toEqual([
      expect.objectContaining({ fileName: 'fig-016-opt-e.png', code: 'OPTION_LABEL_INVALID' }),
    ]);
  });
});

describe('MediaZipImportService.searchQuestions', () => {
  it('mengembalikan kosong untuk kueri lebih pendek dari dua karakter', async () => {
    const { service } = createHarness();

    expect(await service.searchQuestions('f')).toEqual([]);
    expect(await service.searchQuestions('   ')).toEqual([]);
  });

  it('mencari berdasarkan kode soal tanpa peduli huruf besar', async () => {
    const { service } = createHarness();

    const rows = await service.searchQuestions('fig-01');

    expect(rows).toEqual([
      { id: 'q-fig-016', publicCode: 'FIG-016', optionLabels: ['A', 'B'] },
    ]);
  });

  it('mencari berdasarkan potongan teks soal', async () => {
    const { service } = createHarness();

    const rows = await service.searchQuestions('verb');

    expect(rows.map((row) => row.publicCode)).toEqual(['VERB-001']);
  });
});

describe('MediaZipImportService.resolveQuestions', () => {
  it('mengambil banyak kode dalam satu query dan mengabaikan yang tidak ada', async () => {
    const { service } = createHarness();

    const rows = await service.resolveQuestions(['fig-016', 'VERB-001', 'TIDAK-ADA']);

    expect(rows.map((row) => row.publicCode).sort()).toEqual(['FIG-016', 'VERB-001']);
    expect(rows[0]?.optionLabels.length).toBeGreaterThan(0);
  });

  it('mengembalikan kosong tanpa kode', async () => {
    const { service } = createHarness();

    expect(await service.resolveQuestions([])).toEqual([]);
  });
});
