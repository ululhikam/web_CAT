# 0002 — Penjadwalan & antrean tanpa Redis (Postgres saja)

**Status:** Diterima
**Tanggal:** 5 November 2026

## Konteks

Fitur seperti kedaluwarsa langganan, finalisasi subtes, dan pengiriman email
membutuhkan pekerjaan terjadwal. Menambah Redis + BullMQ berarti satu layanan
berbayar lagi yang harus dioperasikan dan diamankan.

## Keputusan

- Tabel `job_queue` dan `outbox_events` di Postgres.
- Klaim pekerjaan memakai `SELECT ... FOR UPDATE SKIP LOCKED`, sehingga beberapa
  worker dapat berjalan paralel tanpa saling mengunci.
- Pemicu: **Vercel Cron** memanggil endpoint cron yang dilindungi `CRON_SECRET`,
  ditambah `pg_cron` untuk pekerjaan yang murni SQL.
- Setiap pekerjaan idempoten dan memiliki batas percobaan (`attempts`, `maxAttempts`).

## Konsekuensi

- (+) Tidak ada infrastruktur tambahan; backup database sudah mencakup antrean.
- (+) Atomik: pekerjaan dan perubahan data berada di transaksi yang sama.
- (−) Throughput lebih rendah daripada Redis; memadai untuk skala ujian.
- (−) Tabel antrean perlu dibersihkan berkala (job `cleanup`).
