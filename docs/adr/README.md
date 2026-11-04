# Keputusan Arsitektur (ADR)

Catatan ringkas keputusan teknis yang membentuk Fase 0. Setiap ADR menjelaskan
konteks, keputusan, dan konsekuensinya agar perubahan di masa depan punya jejak.

| ADR                                          | Judul                                             |
| -------------------------------------------- | ------------------------------------------------- |
| [0001](0001-monolit-nestjs-satu-function.md) | Monolit modular NestJS dalam satu Vercel Function |
| [0002](0002-antrean-postgres-tanpa-redis.md) | Penjadwalan & antrean tanpa Redis (Postgres saja) |
| [0003](0003-harga-hanya-dari-database.md)    | Harga paket hanya dari database                   |
| [0004](0004-sesi-tunggal-partial-index.md)   | Satu sesi aktif per akun via partial unique index |
