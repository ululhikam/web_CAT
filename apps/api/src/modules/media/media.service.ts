import {
  ConflictException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import {
  MEDIA_MAX_BYTES,
  decodeCursor,
  encodeCursor,
  type MediaAssetView,
  type MediaConfirmInput,
  type MediaListQuery,
  type MediaListResponse,
  type MediaUploadUrlInput,
  type MediaUploadUrlResponse,
} from '@webcat/contracts';
import { AppConfigService } from '../../core/config/config.service';
import { STORAGE } from '../../core/ports/ports.module';
import type { StoragePort } from '@webcat/contracts';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { computeChecksum } from '../questions/dedupe';
import { buildMediaUrl, verifyMediaSignature } from './media-signature';

interface Actor {
  id: string;
  ip?: string | null;
  userAgent?: string | null;
}

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: AppConfigService,
    @Inject(STORAGE) private readonly storage: StoragePort,
  ) {}

  async createUploadUrl(input: MediaUploadUrlInput): Promise<MediaUploadUrlResponse> {
    const now = new Date();
    const path = `media/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.${EXTENSIONS[input.contentType] ?? 'bin'}`;
    const upload = await this.storage.createSignedUpload(path, input.contentType);
    return {
      path: upload.path,
      token: upload.token,
      signedUrl: upload.signedUrl,
      expiresAt: upload.expiresAt.toISOString(),
    };
  }

  async confirm(input: MediaConfirmInput, actor: Actor): Promise<MediaAssetView> {
    if (!input.path.startsWith('media/')) {
      throw new ConflictException({
        code: 'COMMON_VALIDATION_FAILED',
        message: 'Path media tidak valid',
      });
    }

    const existing = await this.prisma.mediaAsset.findUnique({
      where: { checksum: input.checksum },
      include: { _count: { select: { questionMedia: true } } },
    });
    if (existing) return this.mapAsset(existing);

    const asset = await this.prisma.mediaAsset.create({
      data: {
        storagePath: input.path,
        mime: input.mime,
        width: input.width ?? null,
        height: input.height ?? null,
        sizeBytes: input.sizeBytes,
        checksum: input.checksum,
        uploadedBy: actor.id,
      },
      include: { _count: { select: { questionMedia: true } } },
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'media.uploaded',
      entityType: 'media_asset',
      entityId: asset.id,
      metadata: { path: asset.storagePath, mime: asset.mime, sizeBytes: asset.sizeBytes },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.mapAsset(asset);
  }

  /** Upload langsung (multipart) — dipakai UI admin. Konversi ke WebP. */
  async upload(file: Express.Multer.File, actor: Actor): Promise<MediaAssetView> {
    if (!file || file.size === 0) {
      throw new ConflictException({
        code: 'COMMON_VALIDATION_FAILED',
        message: 'Berkas gambar wajib diunggah',
      });
    }
    if (file.size > MEDIA_MAX_BYTES) {
      throw new PayloadTooLargeException({
        code: 'COMMON_VALIDATION_FAILED',
        message: 'Ukuran gambar maksimal 5 MB',
      });
    }

    const detected = detectImageMime(file.buffer);
    if (!detected) {
      throw new UnsupportedMediaTypeException({
        code: 'COMMON_VALIDATION_FAILED',
        message: 'Hanya PNG, JPEG, atau WebP yang diterima',
      });
    }

    const asset = await this.storeBuffer(file.buffer, detected, actor.id);
    await this.audit.record({
      actorUserId: actor.id,
      action: 'media.uploaded',
      entityType: 'media_asset',
      entityId: asset.id,
      metadata: {
        path: asset.storagePath,
        mime: asset.mime,
        sizeBytes: asset.sizeBytes,
        originalName: file.originalname,
      },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.mapAsset(asset);
  }

  /**
   * Dipakai impor dokumen untuk menyimpan gambar inline. Idempoten berdasarkan
   * checksum: gambar yang sama tidak diduplikasi.
   */
  async storeBuffer(
    buffer: Buffer,
    _mime: string,
    actorId: string | null,
  ): Promise<{
    id: string;
    storagePath: string;
    mime: string;
    width: number | null;
    height: number | null;
    sizeBytes: number | null;
    checksum: string;
    createdAt: Date;
    data?: Uint8Array | null;
    _count: { questionMedia: number };
  }> {
    const checksum = computeChecksum(buffer);
    const existing = await this.prisma.mediaAsset.findUnique({
      where: { checksum },
      include: { _count: { select: { questionMedia: true } } },
    });
    if (existing) {
      return existing;
    }

    const normalized = await sharp(buffer).rotate().webp({ quality: 82 }).toBuffer();
    const metadata = await sharp(normalized).metadata();
    const now = new Date();
    const storagePath = `media/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.webp`;

    const asset = await this.prisma.mediaAsset.create({
      data: {
        storagePath,
        mime: 'image/webp',
        width: metadata.width ?? null,
        height: metadata.height ?? null,
        sizeBytes: normalized.length,
        checksum,
        data: normalized,
        uploadedBy: actorId,
      },
    });

    return { ...asset, _count: { questionMedia: 0 } };
  }

  async list(query: MediaListQuery): Promise<MediaListResponse> {
    const where = {
      ...(query.q
        ? {
            OR: [
              { storagePath: { contains: query.q, mode: 'insensitive' as const } },
              { checksum: { contains: query.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(query.mime ? { mime: query.mime } : {}),
      ...(query.unusedOnly ? { questionMedia: { none: {} } } : {}),
    };

    const cursor = query.cursor
      ? decodeCursor<{ t: string; i: string }>(query.cursor)
      : null;

    const rows = await this.prisma.mediaAsset.findMany({
      where: cursor
        ? {
            ...where,
            AND: [
              {
                OR: [
                  { createdAt: { lt: new Date(cursor.t) } },
                  { createdAt: new Date(cursor.t), id: { lt: cursor.i } },
                ],
              },
            ],
          }
        : where,
      include: { _count: { select: { questionMedia: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
    });

    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    const last = page[page.length - 1];

    return {
      rows: page.map((row) => this.mapAsset(row)),
      nextCursor:
        hasMore && last
          ? encodeCursor({ t: last.createdAt.toISOString(), i: last.id })
          : null,
      hasMore,
    };
  }

  async content(
    id: string,
    expiresAt: number,
    signature: string,
  ): Promise<{ data: Buffer | null; mime: string; url: string | null }> {
    if (!verifyMediaSignature(id, expiresAt, signature, this.config.value.JWT_ACCESS_SECRET)) {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Tautan media tidak valid atau kedaluwarsa',
      });
    }

    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Media tidak ditemukan',
      });
    }

    return {
      data: asset.data ? Buffer.from(asset.data) : null,
      mime: asset.mime,
      url: asset.data ? null : await this.storage.createSignedUrl(asset.storagePath, 900),
    };
  }

  /** Konten untuk pratinjau admin (sudah lolos guard permission). */
  async contentForAdmin(
    id: string,
  ): Promise<{ data: Buffer | null; mime: string; url: string | null }> {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Media tidak ditemukan',
      });
    }
    return {
      data: asset.data ? Buffer.from(asset.data) : null,
      mime: asset.mime,
      url: asset.data ? null : await this.storage.createSignedUrl(asset.storagePath, 900),
    };
  }

  async remove(id: string, actor: Actor): Promise<{ deleted: boolean }> {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id },
      include: { _count: { select: { questionMedia: true } } },
    });
    if (!asset) {
      throw new NotFoundException({ code: 'MEDIA_NOT_FOUND', message: 'Media tidak ditemukan' });
    }
    if (asset._count.questionMedia > 0) {
      throw new ConflictException({
        code: 'COMMON_CONFLICT',
        message: 'Media masih dipakai soal. Lepas dari soal terlebih dahulu.',
      });
    }

    await this.storage.delete(asset.storagePath).catch(() => undefined);
    await this.prisma.mediaAsset.delete({ where: { id } });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'media.deleted',
      entityType: 'media_asset',
      entityId: id,
      metadata: { path: asset.storagePath },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return { deleted: true };
  }

  private mapAsset(row: {
    id: string;
    storagePath: string;
    mime: string;
    width: number | null;
    height: number | null;
    sizeBytes: number | null;
    checksum: string;
    createdAt: Date;
    data?: Uint8Array | null;
    _count: { questionMedia: number };
  }): MediaAssetView {
    return {
      id: row.id,
      storagePath: row.storagePath,
      url: row.data
        ? buildMediaUrl(row.id, this.config.value.JWT_ACCESS_SECRET)
        : `/api/v1/admin/media/${row.id}/preview`,
      mime: row.mime,
      width: row.width,
      height: row.height,
      sizeBytes: row.sizeBytes,
      checksum: row.checksum,
      createdAt: row.createdAt.toISOString(),
      usageCount: row._count.questionMedia,
    };
  }
}

function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}
