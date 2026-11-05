# Menjalankan test integrasi

Test integrasi menyentuh **PostgreSQL sungguhan**. Karena helper-nya melakukan
`TRUNCATE`, test ini **wajib** memakai database terpisah dari database
pengembangan/produksi.

## Ringkasan perintah

| Perintah | Arti |
| --- | --- |
| `pnpm test` | Unit test (tanpa database). |
| `pnpm test:integration` | Test integrasi (butuh `DATABASE_URL_TEST`). |
| `pnpm smoke:cat` | Smoke HTTP end-to-end 6 subtes (butuh API berjalan). |

Tanpa `DATABASE_URL_TEST`, seluruh spec integrasi di-skip otomatis sehingga
`pnpm test:integration` tetap exit 0 di mesin tanpa database.

## 1. Siapkan database uji

### Opsi A — Docker (lokal, sekali jalan)

```powershell
docker run --rm -d --name webcat-test `
  -e POSTGRES_PASSWORD=test `
  -e POSTGRES_DB=webcat_test `
  -p 5433:5432 postgres:17
```

### Opsi B — Supabase kedua

Buat database baru (mis. `webcat_test`) pada project Supabase yang sama, lalu
ambil connection string-nya (`Session pooler` atau `Direct`).

## 2. Set `DATABASE_URL_TEST`

Tambahkan ke `.env` (root repo):

```dotenv
DATABASE_URL_TEST="postgresql://postgres:test@localhost:5433/webcat_test"
```

Helper `apps/api/test/integration/setup.ts` menolak berjalan bila:

- `DATABASE_URL_TEST` kosong → spec di-skip;
- nama database sama dengan `DATABASE_URL`/`DIRECT_URL` → error;
- nama database mengandung `prod`/`production` → error.

## 3. Jalankan migrasi ke database uji

```powershell
$env:DATABASE_URL = $env:DATABASE_URL_TEST
$env:DIRECT_URL   = $env:DATABASE_URL_TEST
pnpm db:deploy
```

Data master (role, stage, subtest, paket, pengaturan) diisi otomatis oleh
`ensureMasterData()` di dalam spec — tidak perlu `db:seed`.

## 4. Jalankan test

```powershell
pnpm test:integration
```

Hasil yang diharapkan: 4 file / 14 test lulus (data uji 2026-11-05).

Cakupan:

| File | ID | Isi |
| --- | --- | --- |
| `setup.spec.ts` | F0-07 | Koneksi DB uji + `resetTestData` |
| `exam-start.spec.ts` | F2-01…F2-03 | 3 stage / 6 subtes, `order_index` berulang (B1), kuota harian |
| `exam-open.spec.ts` | F2-04, F2-05 | `openSubtest` 100 soal + idempoten; KECERMATAN 500 soal < 5 s (B2) |
| `exam-flow.spec.ts` | F2-06, F2-07 | Alur penuh peserta + autosave idempoten |

## 5. Smoke HTTP (opsional)

Smoke memakai **API yang benar-benar berjalan**, jadi lebih lambat tetapi
menguji lapisan HTTP (guard, interceptor, serialisasi response).

```powershell
# terminal 1
cd apps/api; $env:PORT="3100"; pnpm dev

# terminal 2
$env:SMOKE_API="http://localhost:3100/api/v1"
pnpm smoke:cat
```

Smoke menjalankan keenam subtes, memverifikasi hasil, lalu menghapus sesinya
sendiri. Gunakan `--keep` untuk mempertahankan data uji, `--no-answer` untuk
menguji jalur gugur.

> **Catatan rate limit:** `/auth/login` dibatasi 10 percobaan / 15 menit.
> Bila smoke dijalankan berulang kali terlalu cepat, kosongkan
> `rate_limit_hits` di database pengembangan.

## 6. Di CI

Job `integration` pada `.github/workflows/ci.yml` menjalankan langkah yang sama
dengan service `postgres:17`. Job ini berjalan setelah `verify` lulus.

## Pemecahan masalah

| Gejala | Penyebab / solusi |
| --- | --- |
| Semua spec di-skip | `DATABASE_URL_TEST` kosong → isi di `.env`. |
| `DATABASE_URL_TEST menunjuk database aplikasi` | Nama DB sama dengan `DATABASE_URL`; buat DB terpisah. |
| `Transaction API error: Transaction not found` | Transaksi melewati batas waktu; lihat `timeout` di `$transaction`. |
| Test lambat (> 5 s pada KECERMATAN) | Pooler remote lambat; jalankan Postgres lokal. |
| `ECONNREFUSED` | Database belum siap / port salah. |
