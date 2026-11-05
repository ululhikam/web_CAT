import { Injectable } from '@nestjs/common';
import type { SignedUpload, StoragePort } from '@webcat/contracts';

/**
 * Implementasi `StoragePort` untuk pengembangan lokal (F3-18).
 *
 * Di dev tidak ada bucket: byte gambar disimpan di kolom `media_assets.data`
 * dan diambil lewat `GET /api/v1/dev-storage/content?path=...`
 * (`DevStorageController`).
 *
 * Sebelum F3-18 URL di sini menunjuk `http://localhost:3000/dev-storage/...`
 * yang tidak punya route, sehingga setiap gambar 404. Sekarang URL-nya relatif
 * (ikut origin web/app) dan benar-benar dilayani controller tersebut.
 */

/** Path route dev; diekspor agar test dan controller memakai nilai yang sama. */
export const DEV_STORAGE_CONTENT_ROUTE = '/api/v1/dev-storage/content';

export function devStorageContentUrl(path: string): string {
  return `${DEV_STORAGE_CONTENT_ROUTE}?path=${encodeURIComponent(path)}`;
}

@Injectable()
export class DevStorage implements StoragePort {
  async createSignedUpload(path: string): Promise<SignedUpload> {
    // Dev tidak punya bucket; unggahan langsung lewat `POST /admin/media/upload`
    // (multipart) yang menyimpan byte ke database.
    return {
      path,
      token: 'dev-upload-token',
      signedUrl: devStorageContentUrl(path),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };
  }

  async createSignedUrl(path: string, _ttlSeconds = 900): Promise<string> {
    return devStorageContentUrl(path);
  }

  async delete(_path: string): Promise<void> {
    return;
  }
}
