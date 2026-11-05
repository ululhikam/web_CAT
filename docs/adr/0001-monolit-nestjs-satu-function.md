# 0001 — Monolit modular NestJS dalam satu Vercel Function

**Status:** Diterima
**Tanggal:** 5 November 2026

## Konteks

Platform ini kecil secara domain (ujian, langganan, admin) tetapi padat aturan.
Vercel Hobby membatasi jumlah serverless function per deployment, dan model
serverless tidak menyimpan proses latar belakang jangka panjang.

## Keputusan

- Satu fungsi Vercel menangani seluruh `/api/*` (`apps/api/api/index.js`).
  Entry ini JavaScript CommonJS dan memuat `dist/src/main.js` hasil `tsc`,
  karena builder Vercel tidak meng-emit decorator metadata (`design:paramtypes`)
  yang dibutuhkan DI NestJS.
- Aplikasi Nest di-cache pada variabel modul sehingga container yang dihangatkan
  tidak melakukan bootstrap ulang setiap request.
- Modul dipisah rapi di `src/modules/*` dengan batas yang jelas, meski berjalan
  di satu proses. Pemisahan ini memudahkan ekstraksi ke layanan terpisah bila
  suatu saat diperlukan.

## Konsekuensi

- (+) Satu deployment, satu pipeline, biaya minimum, cold start terkendali.
- (+) Transaksi lintas domain tetap mudah (satu koneksi database).
- (−) Satu bug fatal dapat menjatuhkan seluruh API; mitigasi lewat test dan guard.
- (−) Tidak ada proses latar belakang — ditangani ADR 0002.
