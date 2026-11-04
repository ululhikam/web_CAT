import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { requestIdMiddleware } from './core/http/request-id';
import { getLogger } from './core/logger/logger';

/**
 * Bootstrap bersama untuk dev server dan serverless handler.
 * Semua middleware/global prefix/CORS didefinisikan di sini supaya
 * perilaku lokal dan produksi identik.
 */
export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
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

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Web CAT API')
      .setDescription(
        'Simulasi ujian Polri — Tes Psikologi (Kecerdasan, Kepribadian, Kecermatan, Pass Hand), TPA, TPK.',
      )
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
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
