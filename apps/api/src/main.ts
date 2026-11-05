import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { loadLocalEnv } from './core/config/load-env';
import { buildOpenApiDocument } from './core/http/openapi';
import { requestIdMiddleware } from './core/http/request-id';
import { getLogger } from './core/logger/logger';

/**
 * CSP untuk respons API biasa: hanya JSON/berkas, tidak ada sumber eksternal.
 */
const API_CSP = "default-src 'none'; frame-ancestors 'none'";

/**
 * CSP khusus halaman Swagger UI (`/api/docs`). Swagger UI memuat asetnya
 * sendiri (`self`) dan memakai `<style>` inline bawaan paketnya, jadi
 * `style-src` harus mengizinkan inline. Tanpa pengecualian ini halaman
 * dokumentasi tampil kosong karena seluruh aset diblokir `default-src 'none'`.
 */
const DOCS_CSP =
  "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; " +
  "script-src 'self'; font-src 'self' data:; connect-src 'self'; " +
  "frame-ancestors 'none'; base-uri 'none'";

// Muat `.env` sebelum AppConfigService membaca process.env.
loadLocalEnv();

/**
 * Bootstrap bersama untuk dev server dan serverless handler.
 * Semua middleware/global prefix/CORS didefinisikan di sini supaya
 * perilaku lokal dan produksi identik.
 */
export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
    // Body mentah dibutuhkan verifikasi signature webhook.
    rawBody: true,
  });

  const express = app.getHttpAdapter().getInstance() as unknown as {
    set: (key: string, value: unknown) => void;
    use: (fn: unknown) => void;
    disable: (key: string) => void;
  };

  // Vercel menaruh satu lapis proxy di depan function.
  express.set('trust proxy', 1);
  express.use(requestIdMiddleware);
  express.disable('x-powered-by');

  // Header keamanan untuk semua respons API. API hanya mengirim JSON/berkas,
  // jadi CSP ketat tanpa sumber eksternal. Halaman dokumentasi
  // (`/api/docs`) adalah pengecualian: Swagger UI memuat CSS/JS-nya sendiri
  // dan memakai `<style>` inline, sehingga butuh CSP yang lebih longgar.
  express.use(
    (
      req: { path?: string },
      res: { setHeader: (name: string, value: string) => void },
      next: () => void,
    ) => {
      const isDocs = typeof req.path === 'string' && req.path.startsWith('/api/docs');
      res.setHeader('x-content-type-options', 'nosniff');
      res.setHeader('x-frame-options', 'DENY');
      res.setHeader('referrer-policy', 'no-referrer');
      res.setHeader('content-security-policy', isDocs ? DOCS_CSP : API_CSP);
      next();
    },
  );

  app.use(cookieParser());
  app.enableCors({
    origin: (process.env.APP_URL ?? 'http://localhost:5173')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    credentials: true,
    exposedHeaders: ['x-request-id'],
  });

  app.setGlobalPrefix('api/v1');

  // Dokumentasi OpenAPI selalu tersedia (dev maupun produksi) kecuali
  // dimatikan eksplisit lewat `API_DOCS_ENABLED=false`. Dokumen dibangun dari
  // metadata controller + skema Zod, jadi tidak bisa "basi" terhadap
  // implementasi. Lihat `core/http/openapi.ts`.
  if (process.env.API_DOCS_ENABLED !== 'false') {
    const document = buildOpenApiDocument(app);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true, displayRequestDuration: true },
      customSiteTitle: 'TES CAT API',
    });
  }

  return app;
}

async function main(): Promise<void> {
  const app = await createApp();
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  getLogger().info({ port }, 'API siap menerima request');
}

if (require.main === module) {
  void main();
}
