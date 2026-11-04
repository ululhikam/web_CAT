# Menyambungkan ke Supabase

Panduan ini menjelaskan apa saja yang dibutuhkan, dari membuat project sampai
aplikasi berjalan dengan data asli. Estimasi waktu: **10–15 menit**.

> Tidak memakai Docker. Supabase menjadi Postgres + Storage; aplikasi berjalan
> lokal dengan `pnpm dev` dan di produksi lewat Vercel.

---

## 1. Yang dibutuhkan

| Kebutuhan | Dari mana | Dipakai untuk |
| --- | --- | --- |
| **Project Supabase** | [supabase.com/dashboard](https://supabase.com/dashboard) → New project | Database + Storage |
| **Project ref** (20 karakter) | Project Settings → General | Disusun ke host pooler |
| **Database password** | Dibuat saat project dibuat (bisa di-reset di Settings → Database) | Kedua connection string |
| **Connection string pooler (6543)** | Settings → Database → Connection string → **Transaction** | `DATABASE_URL` (runtime API) |
| **Connection string session/direct (5432)** | Settings → Database → Connection string → **Session** / Direct | `DIRECT_URL` (migrasi & seed) |
| **Project URL** | Settings → API → Project URL | `SUPABASE_URL` |
| **anon public key** | Settings → API → Project API keys | `SUPABASE_ANON_KEY` (klien) |
| **service_role secret** | Settings → API → Project API keys | `SUPABASE_SERVICE_ROLE_KEY` (server saja) |

Wilayah yang disarankan: **Southeast Asia (Singapore)** — `aws-0-ap-southeast-1`.
Region pooler harus sama dengan region project; kalau tidak, host tidak ditemukan.

---

## 2. Buat file `.env`

Di root repo sudah tersedia `.env` (tidak ikut ter-commit). Isi hanya bagian
Supabase:

```dotenv
DATABASE_URL=postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres

SUPABASE_URL=https://<PROJECT_REF>.supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

Hal yang paling sering salah:

1. **Password mengandung karakter khusus.** `@ # ! $ % &` harus di-URL-encode.
   `@` → `%40`, `#` → `%23`, `!` → `%21`.
2. **User pooler bukan `postgres`.** Untuk pooler, user-nya
   `postgres.<PROJECT_REF>`, bukan sekadar `postgres`.
3. **Port tertukar.** Runtime = `6543` + `?pgbouncer=true`. Migrasi = `5432`.
4. **Project di-pause.** Project gratis di-pause setelah lama tidak aktif;
   buka dashboard untuk membangunkan.

`pnpm env:check` hanya memeriksa bentuk konfigurasi, bukan koneksi.

---

## 3. Verifikasi koneksi

```bash
pnpm db:ping
```

Contoh keluaran sehat:

```
Koneksi berhasil.
  Database     : postgres
  User         : postgres.abcdefghijklmnop
  Postgres     : PostgreSQL 15.x
  Tabel public : 0
```

Jika `Tabel public : 0`, lanjut ke langkah 4.

---

## 4. Buat tabel dan isi data awal

```bash
pnpm db:deploy   # menjalankan migrasi prisma/migrations
pnpm db:seed     # role, permission, 3 tahap, 6 subtes, 6 paket, SUPER_ADMIN
```

Seed bersifat idempoten — aman dijalankan ulang. Akun admin pertama diambil dari
`BOOTSTRAP_SUPER_ADMIN_EMAIL` / `BOOTSTRAP_SUPER_ADMIN_PASSWORD` di `.env`.

> `pnpm db:migrate` (dev) membuat migrasi baru saat schema berubah.
> Di Supabase/produksi selalu pakai `pnpm db:deploy`.

---

## 5. Storage (opsional, Fase B1)

Kode masih memakai `STORAGE=dev`, yaitu penyimpanan palsu di memori. Untuk
memakai bucket Supabase:

1. Dashboard → Storage → **New bucket** → nama `webcat-assets`, **Private**.
2. Set `STORAGE=supabase` di `.env`.
3. Implementasi `SupabaseStorage` baru tersedia di Fase B1; sebelum itu
   aplikasi tetap memakai `DevStorage`.

---

## 6. Variabel untuk Vercel

Isi di **kedua** project Vercel (API dan Web):

| Variabel | API | Web |
| --- | :-: | :-: |
| `DATABASE_URL` | ✅ | — |
| `DIRECT_URL` | ✅ | — |
| `SUPABASE_URL` | ✅ | ✅ |
| `SUPABASE_ANON_KEY` | ✅ | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | — |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | ✅ | — |
| `CRON_SECRET` | ✅ | — |
| `APP_URL` (domain web) | ✅ | — |
| `API_URL` (domain API) | ✅ | ✅ |

Secret Vercel **tidak** dibaca dari `.env`; `.env` hanya untuk lokal.

---

## 7. Tanpa Supabase (mode cepat)

Untuk mencoba UI tanpa database, cukup jalankan web memakai data mock:

```bash
pnpm --filter @webcat/mocks dev   # atau pakai handler MSW di aplikasi web
```

API tetap memerlukan Postgres. Alternatif lain: Postgres lokal (mis. instalasi
native) dan isi `DATABASE_URL`/`DIRECT_URL` ke localhost.
