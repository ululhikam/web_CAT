import type { INestApplication } from '@nestjs/common';
import { createApp } from '../src/main';

/**
 * Entry point Vercel: SATU serverless function untuk seluruh API.
 *
 * Instance Nest di-cache di `globalThis` agar warm invocation tidak
 * mengulang bootstrap (koneksi Prisma, route registration, dsb).
 *
 * Vercel meneruskan path asli (mis. `/api/v1/plans`) karena rewrite di
 * vercel.json memakai destination `/api` tanpa mengubah URL.
 */
type NodeHandler = (req: unknown, res: unknown) => void;

const globalScope = globalThis as unknown as {
  __webcatApp?: Promise<INestApplication>;
  __webcatHandler?: NodeHandler;
};

async function getHandler(): Promise<NodeHandler> {
  if (globalScope.__webcatHandler) return globalScope.__webcatHandler;

  if (!globalScope.__webcatApp) {
    globalScope.__webcatApp = createApp().then(async (app) => {
      await app.init();
      return app;
    });
  }

  const app = await globalScope.__webcatApp;
  const express = app.getHttpAdapter().getInstance() as NodeHandler;
  globalScope.__webcatHandler = express;
  return express;
}

export default async function handler(req: unknown, res: unknown): Promise<void> {
  const handlerFn = await getHandler();
  handlerFn(req, res);
}
