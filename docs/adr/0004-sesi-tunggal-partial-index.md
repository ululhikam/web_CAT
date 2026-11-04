# ADR 0004 — Satu Sesi Aktif per Akun

- **Status:** Diterima
- **Tanggal:** 5 November 2026
- **Konteks branch:** `dev/b1-foundation-identity`

## Konteks

`plan.md` FR-ID-4 menetapkan satu akun hanya boleh memiliki satu sesi login
aktif. Login baru harus mengikuti kebijakan `replace` (default) atau `reject`.
Pemeriksaan di level aplikasi saja tidak cukup: dua request login yang berjalan
bersamaan dapat sama-sama melihat "tidak ada sesi aktif" lalu membuat dua sesi.

## Keputusan

1. Kebijakan disimpan sebagai pengaturan platform `auth.session_policy`
   (`replace` | `reject`) sehingga dapat diubah SUPER_ADMIN tanpa deploy.
2. Login `replace` mencabut sesi lama, login `reject` mengembalikan
   `AUTH_SESSION_ACTIVE_EXISTS` (409).
3. Pembuatan sesi berjalan dalam transaksi dan dilindungi **partial unique
   index** Postgres:

   ```sql
   CREATE UNIQUE INDEX "sessions_one_active_per_user"
     ON "sessions" ("user_id")
     WHERE "revoked_at" IS NULL;
   ```

4. Bila dua request paralel menabrak indeks (`P2002`), `replace` mencoba ulang
   sekali (mencabut pemenang), sedangkan `reject` tetap menolak.
5. Sesi kedaluwarsa tetapi belum dicabut ikut dicabut di dalam transaksi
   sebelum sesi baru dibuat, karena indeks hanya melihat `revoked_at`.

## Konsekuensi

- Perangkat lama otomatis keluar saat akun login di perangkat lain.
- Halaman perangkat tetap berguna untuk melihat sesi aktif dan mencabutnya.
- Indeks parsial tidak dapat dinyatakan di DSL Prisma, sehingga ditempatkan di
  migrasi SQL dan diberi komentar di `core.prisma`. `prisma migrate dev` perlu
  dijalankan dengan hati-hati agar tidak menganggapnya drift.
- Migrasi awal mencabut sesi ganda yang sudah ada sebelum membuat indeks.
