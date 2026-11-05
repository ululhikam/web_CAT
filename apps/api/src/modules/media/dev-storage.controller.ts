import { Controller, Get, NotFoundException, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AppConfigService } from '../../core/config/config.service';
import { Public } from '../../core/auth/decorators/public.decorator';
import { PrismaService } from '../../core/prisma/prisma.service';

/**
 * Pelayan berkas untuk `STORAGE=dev` (F3-18).
 *
 * Sebelum ini `DevStorage.createSignedUrl()` mengembalikan
 * `http://localhost:3000/dev-storage/<path>`, padahal tidak ada route yang
 * menanganinya — semua gambar 404 di lingkungan dev.
 *
 * Route ini HANYA aktif saat `STORAGE=dev`. Pada konfigurasi produksi
 * (`STORAGE=supabase`) ia selalu 404, sehingga tidak menambah permukaan serang
 * baru: byte media produksi tetap hanya keluar lewat signed URL Supabase.
 */
@ApiTags('Dev — Storage')
@Public()
@Controller('dev-storage')
export class DevStorageController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  @Get('content')
  @ApiOperation({ summary: 'Sajikan berkas storage lokal (mode dev)' })
  async content(@Query('path') path: string, @Res() res: Response): Promise<void> {
    if (this.config.value.STORAGE !== 'dev') {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Rute ini hanya tersedia dengan STORAGE=dev',
      });
    }
    if (!path || !path.startsWith('media/')) {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Path media tidak valid',
      });
    }

    const asset = await this.prisma.mediaAsset.findUnique({
      where: { storagePath: path },
      select: { data: true, mime: true },
    });
    if (!asset?.data) {
      res.status(404).end();
      return;
    }

    res.setHeader('content-type', asset.mime);
    // Berkas dev tidak boleh di-cache agresif: isinya bisa berubah saat
    // pengembang mengunggah ulang aset dengan path sama.
    res.setHeader('cache-control', 'private, max-age=60');
    res.end(Buffer.from(asset.data));
  }
}
