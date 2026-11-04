import { Injectable, Logger } from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SignedUpload, StoragePort } from '@webcat/contracts';
import { AppConfigService } from '../../config/config.service';

/**
 * Storage produksi: Supabase Storage.
 *
 * Berkas diunggah langsung dari browser memakai signed upload URL (batas body
 * Vercel 4 MB), lalu API hanya menyimpan path. Service role key tidak pernah
 * dikirim ke klien.
 */
@Injectable()
export class SupabaseStorage implements StoragePort {
  private readonly logger = new Logger(SupabaseStorage.name);
  private readonly client: SupabaseClient;
  private readonly bucket: string;

  constructor(config: AppConfigService) {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET } = config.value;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        'STORAGE=supabase membutuhkan SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY',
      );
    }

    this.client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this.bucket = SUPABASE_STORAGE_BUCKET;
  }

  async createSignedUpload(path: string, contentType: string): Promise<SignedUpload> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUploadUrl(path);

    if (error || !data) {
      this.logger.error('Gagal membuat signed upload URL', { path, error: error?.message });
      throw new Error('Gagal membuat tautan unggah berkas');
    }

    this.logger.debug('Signed upload dibuat', { path, contentType });

    // Supabase memberi masa berlaku 2 jam untuk signed upload URL.
    return {
      path: data.path,
      token: data.token,
      signedUrl: data.signedUrl,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    };
  }

  async createSignedUrl(path: string, ttlSeconds: number): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(path, ttlSeconds);

    if (error || !data) {
      this.logger.error('Gagal membuat signed URL', { path, error: error?.message });
      throw new Error('Gagal membuat tautan berkas');
    }

    return data.signedUrl;
  }

  async delete(path: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([path]);
    if (error) {
      // Idempoten: penghapusan objek yang sudah tidak ada bukan kegagalan fatal.
      this.logger.warn('Gagal menghapus berkas storage', { path, error: error.message });
    }
  }
}
