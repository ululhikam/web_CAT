# Dokumentasi

| Berkas                                               | Isi                                                   |
| ---------------------------------------------------- | ----------------------------------------------------- |
| [RENCANA-PERBAIKAN.md](RENCANA-PERBAIKAN.md)         | Ringkasan strategi perbaikan + bukti temuan           |
| [BREAKDOWN-FASE.md](BREAKDOWN-FASE.md)               | Peta fase & daftar runbook                            |
| [PROGRESS.md](PROGRESS.md)                           | Tracker progres & log harian                          |
| [perbaikan/](perbaikan/00-INDEX.md)                  | Runbook eksekusi per fase (langkah + verifikasi)      |
| [perbaikan/README-test.md](perbaikan/README-test.md) | Cara menjalankan test integrasi & smoke CAT           |
| [LAPORAN-PEKERJAAN.md](LAPORAN-PEKERJAAN.md)         | Laporan pekerjaan Fase 0 lengkap dengan tanggal & jam |
| [LAPORAN-B1.md](LAPORAN-B1.md)                       | Laporan branch B1: identitas, RBAC, sesi, audit       |
| [SUPABASE-SETUP.md](SUPABASE-SETUP.md)               | Menyambungkan aplikasi ke Supabase (env + migrasi)    |
| [DEPLOY-VERCEL.md](DEPLOY-VERCEL.md)                 | Deploy dua project Vercel (`tes-cat` + `tes-cat-api`)  |
| [adr/0001](adr/0001-monolit-nestjs-satu-function.md) | Satu Vercel Function untuk seluruh API                |
| [adr/0002](adr/0002-antrean-postgres-tanpa-redis.md) | Antrean & penjadwalan tanpa Redis                     |
| [adr/0003](adr/0003-harga-hanya-dari-database.md)    | Harga paket hanya dari database                       |
| [adr/0004](adr/0004-sesi-tunggal-partial-index.md)   | Satu sesi aktif per akun (partial unique index)       |

Dokumen rencana induk ada di [`../plan.md`](../plan.md).

## Konvensi

- Bahasa dokumen: **Indonesia**.
- Komentar kode: **Indonesia**; nama identifier: **Inggris**.
- Setiap keputusan teknis besar dicatat sebagai ADR bernomor.
- Laporan pekerjaan selalu mencantumkan **tanggal dan jam** eksekusi.
