/**
 * Entry point Vercel: SATU serverless function untuk seluruh API.
 *
 * Berkas ini sengaja JavaScript CommonJS, bukan TypeScript:
 *
 *  - Bootstrap NestJS bergantung pada `emitDecoratorMetadata` (`design:paramtypes`).
 *    Builder `@vercel/node` mentranspile TypeScript per berkas tanpa type-checker
 *    penuh, sehingga decorator metadata bisa hilang dan DI Nest gagal.
 *  - Karena itu `buildCommand` menjalankan `tsc` lebih dulu, lalu berkas ini
 *    hanya memuat hasil kompilasinya (`dist/src/main.js`) yang metadata-nya utuh.
 *
 * `require` dengan path literal tetap bisa dilacak `@vercel/nft`, jadi
 * seluruh dependensi runtime ikut masuk bundel function.
 *
 * Instance Nest di-cache di `globalThis` agar warm invocation tidak mengulang
 * bootstrap (koneksi Prisma, registrasi route, dsb).
 *
 * Vercel meneruskan path asli (mis. `/api/v1/plans`) karena rewrite di
 * vercel.json memakai destination `/api` tanpa mengubah URL.
 */
'use strict';

/** @type {{ __webcatApp?: Promise<{ init(): Promise<void>, getHttpAdapter(): { getInstance(): unknown } }>, __webcatHandler?: (req: unknown, res: unknown) => void }} */
const globalScope = globalThis;

async function getHandler() {
  if (globalScope.__webcatHandler) return globalScope.__webcatHandler;

  if (!globalScope.__webcatApp) {
    const { createApp } = require('../dist/src/main.js');
    globalScope.__webcatApp = createApp().then(async (app) => {
      await app.init();
      return app;
    });
  }

  const app = await globalScope.__webcatApp;
  const express = app.getHttpAdapter().getInstance();
  globalScope.__webcatHandler = express;
  return express;
}

module.exports = async function handler(req, res) {
  const handlerFn = await getHandler();
  handlerFn(req, res);
};

module.exports.default = module.exports;
