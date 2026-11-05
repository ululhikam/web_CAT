import { describe, expect, it } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { MediaService } from '../src/modules/media/media.service';
import { DevStorageController } from '../src/modules/media/dev-storage.controller';
import {
  buildMediaUrl,
  signMedia,
  verifyMediaSignature,
} from '../src/modules/media/media-signature';
import {
  DEV_STORAGE_CONTENT_ROUTE,
  DevStorage,
  devStorageContentUrl,
} from '../src/core/ports/impl/dev-storage';

/**
 * F3-20 — akses media 200 + `content-type`.
 *
 * Dua jalur yang dipakai halaman ujian:
 *   1. `GET /api/v1/media/:id/content?exp=&sig=` — snapshot baru (punya assetId).
 *   2. `GET /api/v1/dev-storage/content?path=`  — snapshot lama (hanya path),
 *      khusus `STORAGE=dev` (F3-18).
 *
 * Test ini menguji lapisan service + controller tanpa HTTP: yang penting
 * adalah keputusan 200 / 404 dan header `content-type`, bukan framework-nya.
 */

const SECRET = 'rahasia-test-media';
const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

interface FakeAsset {
  id: string;
  storagePath: string;
  mime: string;
  data: Buffer | null;
}

/** Prisma palsu: cukup mendukung dua query yang dipakai media.service. */
function fakePrisma(assets: FakeAsset[]) {
  return {
    mediaAsset: {
      findUnique: async ({ where }: { where: { id?: string; storagePath?: string } }) => {
        const key = where.id ?? where.storagePath;
        return assets.find((asset) => asset.id === key || asset.storagePath === key) ?? null;
      },
    },
  };
}

function createService(options: {
  assets?: FakeAsset[];
  storage?: 'dev' | 'supabase';
} = {}) {
  const prisma = fakePrisma(
    options.assets ?? [
      {
        id: 'asset-1',
        storagePath: 'media/2026/11/asset-1.webp',
        mime: 'image/webp',
        data: PNG_BYTES,
      },
    ],
  );

  const config = { value: { STORAGE: options.storage ?? 'dev', JWT_ACCESS_SECRET: SECRET } };
  const audit = { record: async () => undefined };
  const storagePort = {
    createSignedUpload: async () => ({
      path: 'x',
      token: 't',
      signedUrl: 'u',
      expiresAt: new Date(),
    }),
    createSignedUrl: async (path: string) => devStorageContentUrl(path),
    delete: async () => undefined,
  };

  const service = new MediaService(
    prisma as never,
    audit as never,
    config as never,
    storagePort as never,
  );

  return { service, prisma, config };
}

/** Response palsu yang merekam status + header. */
function fakeResponse() {
  const state = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as Buffer | null,
    redirect: null as string | null,
  };

  const response = {
    setHeader(name: string, value: string) {
      state.headers[name.toLowerCase()] = value;
      return response;
    },
    status(code: number) {
      state.statusCode = code;
      return response;
    },
    end(payload?: Buffer) {
      if (payload) state.body = payload;
      return response;
    },
    redirect(_code: number, url: string) {
      state.redirect = url;
      return response;
    },
  };

  return { state, response: response as unknown as Response };
}

describe('signature media', () => {
  it('buildMediaUrl menghasilkan URL /media/:id/content yang bisa diverifikasi', () => {
    const url = buildMediaUrl('asset-1', SECRET, 60);
    const parsed = new URL(url, 'http://localhost');

    expect(parsed.pathname).toBe('/api/v1/media/asset-1/content');

    const exp = Number(parsed.searchParams.get('exp'));
    const sig = parsed.searchParams.get('sig') ?? '';

    expect(verifyMediaSignature('asset-1', exp, sig, SECRET)).toBe(true);
  });

  it('menolak signature untuk id lain dan signature kedaluwarsa', () => {
    const exp = Math.floor(Date.now() / 1000) + 60;
    const sig = signMedia('asset-1', exp, SECRET);

    expect(verifyMediaSignature('asset-2', exp, sig, SECRET)).toBe(false);
    expect(verifyMediaSignature('asset-1', exp, sig, 'secret-lain')).toBe(false);

    const past = Math.floor(Date.now() / 1000) - 1;
    expect(verifyMediaSignature('asset-1', past, signMedia('asset-1', past, SECRET), SECRET)).toBe(
      false,
    );
  });
});

describe('MediaService.content (F3-20)', () => {
  it('mengembalikan byte + mime untuk signature sah', async () => {
    const { service } = createService();
    const exp = Math.floor(Date.now() / 1000) + 60;

    const content = await service.content('asset-1', exp, signMedia('asset-1', exp, SECRET));

    expect(content.mime).toBe('image/webp');
    expect(content.data?.equals(PNG_BYTES)).toBe(true);
    // Byte ada di database → tidak perlu signed URL storage.
    expect(content.url).toBeNull();
  });

  it('menolak signature tidak sah dengan 404 MEDIA_NOT_FOUND', async () => {
    const { service } = createService();

    await expect(service.content('asset-1', Math.floor(Date.now() / 1000) + 60, 'palsu')).rejects.toMatchObject(
      {
        response: { code: 'MEDIA_NOT_FOUND' },
      },
    );
  });

  it('menolak signature kedaluwarsa', async () => {
    const { service } = createService();
    const past = Math.floor(Date.now() / 1000) - 10;

    await expect(service.content('asset-1', past, signMedia('asset-1', past, SECRET))).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('404 ketika aset sudah tidak ada meski signature sah', async () => {
    const { service } = createService({ assets: [] });
    const exp = Math.floor(Date.now() / 1000) + 60;

    await expect(service.content('asset-1', exp, signMedia('asset-1', exp, SECRET))).rejects.toMatchObject({
      response: { code: 'MEDIA_NOT_FOUND' },
    });
  });
});

describe('MediaContentController — perilaku respons', () => {
  it('mengirim 200 dengan content-type gambar', async () => {
    const { service } = createService();
    const { MediaContentController } = await import('../src/modules/media/media.controller');
    const controller = new MediaContentController(service);
    const { state, response } = fakeResponse();

    const exp = Math.floor(Date.now() / 1000) + 60;
    await controller.content('asset-1', String(exp), signMedia('asset-1', exp, SECRET), response);

    expect(state.statusCode).toBe(200);
    expect(state.headers['content-type']).toBe('image/webp');
    expect(state.body?.equals(PNG_BYTES)).toBe(true);
  });

  it('404 untuk signature salah', async () => {
    const { service } = createService();
    const { MediaContentController } = await import('../src/modules/media/media.controller');
    const controller = new MediaContentController(service);
    const { response } = fakeResponse();

    await expect(
      controller.content('asset-1', String(Math.floor(Date.now() / 1000) + 60), 'salah', response),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('DevStorage (F3-18)', () => {
  it('createSignedUrl menunjuk route dev yang benar-benar dilayani', async () => {
    const url = await new DevStorage().createSignedUrl('media/2026/11/asset-1.webp');

    expect(url.startsWith(`${DEV_STORAGE_CONTENT_ROUTE}?path=`)).toBe(true);

    const parsed = new URL(url, 'http://localhost');
    expect(parsed.pathname).toBe('/api/v1/dev-storage/content');
    expect(parsed.searchParams.get('path')).toBe('media/2026/11/asset-1.webp');
  });

  it('bukan URL absolut ke localhost:3000 yang dulu 404', async () => {
    const url = await new DevStorage().createSignedUrl('media/2026/11/asset-1.webp');

    expect(url).not.toContain('http://localhost:3000/dev-storage/');
  });
});

describe('DevStorageController', () => {
  const asset: FakeAsset = {
    id: 'asset-1',
    storagePath: 'media/2026/11/asset-1.webp',
    mime: 'image/webp',
    data: PNG_BYTES,
  };

  function createController(storage: 'dev' | 'supabase') {
    const prisma = fakePrisma([asset]);
    const config = { value: { STORAGE: storage } };
    return new DevStorageController(prisma as never, config as never);
  }

  it('melayani byte saat STORAGE=dev', async () => {
    const controller = createController('dev');
    const { state, response } = fakeResponse();

    await controller.content(asset.storagePath, response);

    expect(state.statusCode).toBe(200);
    expect(state.headers['content-type']).toBe('image/webp');
    expect(state.body?.equals(PNG_BYTES)).toBe(true);
  });

  it('404 saat STORAGE bukan dev (produksi tidak membuka route ini)', async () => {
    const controller = createController('supabase');
    const { response } = fakeResponse();

    await expect(controller.content(asset.storagePath, response)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('404 untuk path di luar folder media/ dan path tidak dikenal', async () => {
    const controller = createController('dev');

    await expect(controller.content('../etc/passwd', fakeResponse().response)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    const { state, response } = fakeResponse();
    await controller.content('media/2026/11/tidak-ada.webp', response);
    expect(state.statusCode).toBe(404);
  });
});
