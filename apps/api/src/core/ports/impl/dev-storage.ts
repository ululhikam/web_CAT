import { Injectable } from '@nestjs/common';
import type { SignedUpload, StoragePort } from '@webcat/contracts';

@Injectable()
export class DevStorage implements StoragePort {
  async createSignedUpload(path: string): Promise<SignedUpload> {
    return {
      path,
      token: 'dev-upload-token',
      signedUrl: `http://localhost:3000/dev-storage/${encodeURIComponent(path)}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };
  }

  async createSignedUrl(path: string): Promise<string> {
    return `http://localhost:3000/dev-storage/${encodeURIComponent(path)}`;
  }

  async delete(_path: string): Promise<void> {
    return;
  }
}
