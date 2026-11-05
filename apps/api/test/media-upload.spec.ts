import { describe, expect, it } from 'vitest';
import { UnprocessableEntityException } from '@nestjs/common';
import sharp from 'sharp';
import { MediaService } from '../src/modules/media/media.service';

/**
 * F3-30 — uji unggah media: ambang dimensi minimum (F3-28) dan konversi WebP.
 *
 * Ambang dimensi hidup di `upload()` (jalur form admin), bukan di
 * `storeBuffer()` (jalur impor dokumen / seed). Alasannya: seed perlu
 * menyimpan aset kecil untuk fixture, sementara admin tidak boleh menyimpan
 * ikon 32×32 sebagai gambar soal.
 */

const SECRET = 'rahasia-test-upload';

async function pngBuffer(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 30, g: 90, b: 200 } },
  })
    .png()
    .toBuffer();
}

function createService() {
  const created: Array<Record<string, unknown>> = [];

  const prisma = {
    mediaAsset: {
      findUnique: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const row = {
          ...data,
          id: '00000000-0000-4000-8000-000000000001',
          createdAt: new Date(),
        };
        created.push(row);
        return row;
      },
    },
  };

  const audit = { record: async () => undefined };
  const config = { value: { JWT_ACCESS_SECRET: SECRET, STORAGE: 'dev' } };

  const service = new MediaService(
    prisma as never,
    audit as never,
    config as never,
    {
      createSignedUrl: async (path: string) => `/dev/${path}`,
      createSignedUpload: async () => ({
        path: 'x',
        token: 't',
        signedUrl: 'u',
        expiresAt: new Date(),
      }),
      delete: async () => undefined,
    } as never,
  );

  return { service, created };
}

describe('MediaService.upload — F3-28 ambang dimensi minimum', () => {
  it('menolak gambar 50×50 dengan 422 dan pesan yang menyebut ukuran minimum', async () => {
    const { service, created } = createService();
    const buffer = await pngBuffer(50, 50);

    const error = await service
      .upload(
        { buffer, size: buffer.length, originalname: 'kecil.png', mimetype: 'image/png' } as never,
        { id: 'admin-1' },
      )
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(UnprocessableEntityException);
    expect((error as UnprocessableEntityException).getResponse()).toMatchObject({
      code: 'COMMON_VALIDATION_FAILED',
    });
    expect(
      (error as UnprocessableEntityException).message,
    ).toContain('200×200');

    // Tidak ada baris yang ditulis saat ditolak.
    expect(created).toHaveLength(0);
  });

  it('menolak gambar 600×120 (satu sisi di bawah minimum)', async () => {
    const { service } = createService();
    const buffer = await pngBuffer(600, 120);

    await expect(
      service.upload(
        { buffer, size: buffer.length, originalname: 'tipis.png', mimetype: 'image/png' } as never,
        { id: 'admin-1' },
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('menerima gambar 300×300 dan menyimpannya sebagai WebP', async () => {
    const { service, created } = createService();
    const buffer = await pngBuffer(300, 300);

    const asset = await service.upload(
      { buffer, size: buffer.length, originalname: 'pola.png', mimetype: 'image/png' } as never,
      { id: 'admin-1' },
    );

    expect(created).toHaveLength(1);
    expect(created[0]?.mime).toBe('image/webp');
    // storeBuffer menyimpan byte hasil konversi WebP ke kolom `data`.
    expect(Buffer.from(created[0]?.data as Uint8Array).subarray(8, 12).toString('ascii')).toBe(
      'WEBP',
    );
    expect(asset.mime).toBe('image/webp');
  });

  it('menerima tepat di batas 200×200', async () => {
    const { service } = createService();
    const buffer = await pngBuffer(200, 200);

    await expect(
      service.upload(
        { buffer, size: buffer.length, originalname: 'batas.png', mimetype: 'image/png' } as never,
        { id: 'admin-1' },
      ),
    ).resolves.toMatchObject({ mime: 'image/webp' });
  });
});

describe('MediaService.storeBuffer — dikecualikan dari ambang dimensi', () => {
  it('tetap menyimpan gambar 50×50 karena dipakai impor dokumen & seed', async () => {
    const { service } = createService();
    const buffer = await pngBuffer(50, 50);

    await expect(service.storeBuffer(buffer, 'image/png', null)).resolves.toMatchObject({
      mime: 'image/webp',
      checksum: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
  });

  it('membuat turunan thumbnail untuk gambar besar (F5-15)', async () => {
    const { service, created } = createService();
    const buffer = await pngBuffer(800, 450);

    const asset = await service.storeBuffer(buffer, 'image/png', null);

    // Sisi terpanjang dipotong ke 400 px, rasio 16:9 dipertahankan.
    expect(asset.thumbWidth).toBe(400);
    expect(asset.thumbHeight).toBe(225);
    expect(asset.thumbSizeBytes).toBeGreaterThan(0);
    expect(asset.thumbData).toBeInstanceOf(Uint8Array);
    // Turunan disimpan bersama baris aset, bukan di berkas terpisah.
    expect(created[0]?.thumbWidth).toBe(400);
    expect(created[0]?.thumbData).toBeInstanceOf(Uint8Array);
  });

  it('tidak membuat thumbnail untuk gambar yang sudah kecil (F5-15)', async () => {
    const { service, created } = createService();
    const buffer = await pngBuffer(320, 240);

    const asset = await service.storeBuffer(buffer, 'image/png', null);

    expect(asset.thumbData).toBeNull();
    expect(asset.thumbWidth).toBeNull();
    expect(asset.thumbHeight).toBeNull();
    expect(asset.thumbSizeBytes).toBeNull();
    expect(created[0]?.thumbData).toBeNull();
  });
});
