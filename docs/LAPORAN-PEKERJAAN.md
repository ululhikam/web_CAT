# Laporan Pekerjaan — Fase 0 (Fondasi)

**Tanggal:** 5 November 2026
**Jam:** 03:15 WIB (UTC+7) — `2026-11-05T03:15+07:00`
**Cabang:** `main`
**Lingkup:** Fase 0 — fondasi monorepo, skema database, API, frontend, halaman
harga (_pricing_), pengujian, dan pipeline CI.

---

## 1. Ringkasan

Fase 0 menyelesaikan seluruh kerangka teknis yang dibutuhkan sebelum fitur ujian
dibangun. Tidak ada fitur yang di- _mock_ di dalam aplikasi produksi: API benar-benar
terhubung ke Prisma, frontend benar-benar memanggil API, dan halaman harga mengambil
data dari database — bukan dari daftar harga yang ditulis di komponen.

Hasil verifikasi terakhir (`pnpm verify`, 5 November 2026 03:15 WIB):

| Gerbang   | Perintah         | Hasil                                     |
| --------- | ---------------- | ----------------------------------------- |
| Lint      | `pnpm lint`      | ✅ 6 task berhasil                        |
| Typecheck | `pnpm typecheck` | ✅ 5 paket, `svelte-check` 0 error        |
| Test      | `pnpm test`      | ✅ 33 tes lulus (6 berkas)                |
| Build     | `pnpm build`     | ✅ API + web + paket, adapter-node `done` |

Total kode sumber: **176 berkas, ±15.340 baris** (di luar `node_modules`, `dist`,
`build`, dan `.svelte-kit`).

---

## 2. Keputusan Arsitektur

| #   | Keputusan                          | Alasan                                                                                        |
| --- | ---------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | Monolit modular NestJS, 1 function | Batas Vercel Hobby 12 function; satu instance Nest di-cache antar request.                    |
| 2   | Tanpa Redis/BullMQ                 | Menghindari layanan tambahan berbayar. Job memakai `job_queue` + `outbox_events` di Postgres. |
| 3   | Postgres `FOR UPDATE SKIP LOCKED`  | Worker aman dijalankan paralel tanpa saling menunggu.                                         |
| 4   | Vercel Cron + `pg_cron`            | Penjadwalan tanpa infrastruktur worker permanen.                                              |
| 5   | Dua proyek Vercel                  | Pemisahan API dan web agar build & cache independen.                                          |
| 6   | Prisma schema multi-file           | Schema besar dipecah per domain agar mudah ditinjau.                                          |
| 7   | Password: scrypt (Node built-in)   | Tanpa dependensi native; Argon2id ditunda ke Fase B1.                                         |
| 8   | Harga hanya dari DB                | Klien mengirim `planCode` saja; harga tidak pernah dipercaya dari browser.                    |
| 9   | Kontrak sebagai CommonJS           | NestJS (CJS) mengonsumsi langsung; web memakai `import type` + subpath exports.               |
| 10  | Guard rute di sisi klien (Fase 0)  | Cepat dan cukup untuk kerangka; dipindah ke `hooks.server.ts` pada Fase B1.                   |

Detail lengkap ada di `docs/adr/`.

---

## 3. Yang Sudah Dikerjakan

### 3.1 Konfigurasi akar

- `package.json` — workspace, `packageManager: pnpm@11.12.0`, script `verify`
  (lint → typecheck → test → build), `db:validate`.
- `pnpm-workspace.yaml` — `apps/*`, `packages/*`.
- `turbo.json` — `dependsOn: ["^build"]` agar paket kontrak selalu dibangun lebih dulu.
- `tsconfig.base.json`, `.npmrc`, `.editorconfig`, `.prettierrc`, `.prettierignore`,
  `.gitignore`, `.env.example`, `CODEOWNERS`.
- `eslint.config.mjs` — flat config ESLint 9 + typescript-eslint; `.svelte`
  diperiksa `svelte-check`, bukan ESLint.

### 3.2 `packages/contracts`

Sumber tunggal tipe, validasi, dan aturan akses:

- `common/` — envelope respons, kode error, pagination cursor (base64url),
  RBAC (`ROLES`, `PERMISSIONS`, `ROLE_PERMISSIONS`, `ROLE_RANK`, `canManageRole`).
- `auth/` — schema Zod: register, login, verifikasi email, lupa/reset password,
  ganti password, aktivasi undangan. Tipe `AuthUser`, `LoginResult`.
- `users/` — schema daftar/buat/patch pengguna admin, `AdminUserSummary`,
  `AdminCreateUserResponse`.
- `plans/` — `Plan`, `SubscriptionSummary`, `grantSubscriptionSchema`
  (durasi 1–3650 hari, `mode: STACK | REPLACE`, alasan wajib), dan
  `DEFAULT_PLANS` sebagai satu-satunya sumber data paket awal.
- `exams/`, `ports/` — tipe domain ujian dan antarmuka port (storage, mail,
  payment) agar mudah diganti implementasinya.

### 3.3 Database (Prisma + Supabase)

- Schema dipecah: `core.prisma`, `exam.prisma`, `question.prisma`, `billing.prisma`.
- Entitas inti: `users`, `sessions`, `roles`, `permissions`, `role_permissions`,
  `subscription_plans`, `subscriptions`, `payments`, `stages`, `subtests`,
  `exam_sessions`, `subtest_attempts`, `subtest_locks`, `questions`,
  `question_options`, `answers`, `audit_logs`, `job_queue`, `outbox_events`,
  `rate_limits`, `settings`.
- Migrasi baseline `20260101000000_init` (±941 baris SQL) + `migration_lock.toml`.
- Seed idempoten: 3 role, 20 permission, 3 tahap, **6 subtes**, 6 paket harga,
  dan bootstrap `SUPER_ADMIN` dari environment.

Struktur ujian yang dikodekan:

| Tahap         | Subtes      | Soal | Durasi  | Format         |
| ------------- | ----------- | ---- | ------- | -------------- |
| Tes Psikologi | Kecerdasan  | 100  | 120 mnt | pilihan ganda  |
| Tes Psikologi | Kepribadian | 140  | 45 mnt  | Likert 5 titik |
| Tes Psikologi | Kecermatan  | 500  | 10 mnt  | cepat-tepat    |
| Tes Psikologi | Pass Hand   | 150  | 18 mnt  | kolom          |
| TPA           | TPA         | 100  | 90 mnt  | pilihan ganda  |
| TPK           | TPK         | 100  | 60 mnt  | pilihan ganda  |

> Angka TPA/TPK dan harga paket masih **provisional** — tersimpan di database
> sehingga dapat diubah admin tanpa deploy.

### 3.4 API (`apps/api`)

- `main.ts` (`createApp()` dipakai bersama oleh server lokal dan serverless),
  `api/index.ts` dengan instance Nest yang di-cache.
- `core/`:
  - `config` — validasi env dengan Zod, gagal cepat saat boot.
  - `prisma` — `PrismaService` dengan `onModuleInit` (peringatan di dev, lempar
    error di produksi).
  - `http` — envelope sukses/gagal, exception filter, interceptor `requestId`.
  - `auth` — guard JWT, dekorator `@Public()`, `@RequirePermissions()`,
    `PrincipalLoader` (global `AuthModule`).
  - `security` — scrypt hashing (`scrypt$N$r$p$salt$hash`), token opaque, SHA-256.
  - `ratelimit` — token bucket di Postgres (UPSERT atomik per jendela waktu).
  - `jobs` — `job_queue` worker + outbox, klaim `SKIP LOCKED`.
  - `cron` — endpoint cron yang dilindungi `CRON_SECRET`.
  - `ports` — antarmuka storage/mail/payment + implementasi default.
- `modules/`:
  - `auth` — verifikasi email, login, refresh (cookie httpOnly), logout,
    lupa/reset password, aktivasi undangan, `GET /me`, ganti password,
    logout semua sesi. Endpoint `register` ada di API tetapi **tidak**
    diekspos di UI: pendaftaran hanya lewat admin (§9.7).
  - `users` — CRUD admin, provisioning akun (undangan / password sementara),
    ubah status & role, reset password paksa.
  - `billing` — `GET /plans`, `GET /plans/:code`, langganan saya, riwayat,
    grant manual (audit + alasan), ubah/revoke langganan.
  - `audit` — pencatatan aksi sensitif.
  - `health` — `/health/live`, `/health/ready`.
- Skrip operasional: `env-check.ts`, `db-guard.ts` (menolak operasi destruktif
  di produksi), `cron-run.ts`.

### 3.5 `packages/ui`

Design token (`tokens.css`, `app.css`) dan 7 komponen Svelte 5:
`Button`, `Card`, `Badge`, `Alert`, `Field`, `Input`, `Spinner`.
Dikonsumsi lewat alias Vite, tanpa langkah build terpisah.

### 3.6 `packages/mocks`

- Generator fixture deterministik (mulberry32, `FIXTURE_SEED = 20260101`).
- **1.090 soal**: 890 psikologi + 100 TPA + 100 TPK.
- Handler MSW untuk pengembangan tanpa database.
- Tes memastikan jumlah, determinisme, dan tidak adanya kunci jawaban di payload.

### 3.7 Frontend (`apps/web`)

SvelteKit 2 + Svelte 5 (runes) + Vite 6.

- `svelte.config.js` — adapter berganti otomatis: `adapter-vercel` bila `VERCEL`
  terisi, `adapter-node` bila tidak (menghindari kegagalan symlink di Windows).
- `vite.config.ts` — proxy `/api` → `http://localhost:3000`.
- `hooks.server.ts` — header keamanan (nosniff, frame, referrer, permissions policy).
- `src/lib/api/client.ts` — pembungkus `fetch` yang membuka envelope, melempar
  `ApiError`, dan melakukan **satu** percobaan refresh token.
- `src/lib/stores/session.svelte.ts` — store runes: `restore()`, `login()`, `logout()`.
- `src/lib/format.ts` — `formatIdr`, `formatPerDay`, `formatDate`, `formatDateTime`,
  `discountPercent`.

Rute yang sudah ada:

| Rute               | Grup      | Keterangan                                 |
| ------------------ | --------- | ------------------------------------------ |
| `/`                | `(site)`  | Landing: 3 tahap ujian, sistem gugur, CTA. |
| `/pricing`         | `(site)`  | **Halaman harga lengkap** (lihat §3.8).    |
| `/login`           | `(site)`  | Login + penanganan `must_change_password`. |
| `/forgot-password` | `(site)`  | Permintaan reset password.                 |
| `/reset-password`  | `(site)`  | Reset dengan token.                        |
| `/invite`          | `(site)`  | Aktivasi undangan admin.                   |
| `/dashboard`       | `(app)`   | Ringkasan peserta; guard sesi.             |
| `/subscription`    | `(app)`   | Status langganan & sisa hari.              |
| `/admin/users`     | `(admin)` | Daftar peserta, filter, aksi.              |
| `/admin/users/new` | `(admin)` | Buat akun + set durasi langganan.          |
| `/admin/plans`     | `(admin)` | Kelola paket harga.                        |

### 3.8 Halaman Harga (`/pricing`) — deliverable §9.3

Halaman ini sebelumnya tidak ada dan menjadi permintaan eksplisit:

- `+page.server.ts` mengambil `GET /plans` dari API saat SSR, mengirim header
  `cache-control: public, max-age=60, stale-while-revalidate=300`.
- Bila API gagal, halaman menampilkan galat + tombol **Coba lagi**; tidak ada
  daftar harga duplikat di komponen.
- Isi halaman: hero, kartu uji coba, grid 4 paket (bulanan/3 bulan/6 bulan/
  institusi), harga coret + persentase hemat, tabel perbandingan fitur,
  akordeon detail, FAQ, metode pembayaran, dan **JSON-LD `Product`/`Offer`**.
- Tombol beli mengirim **hanya** `planCode`; nominal selalu dihitung ulang di server.

### 3.9 CI & tata kelola

- `.github/workflows/ci.yml` — install → validasi Prisma → build kontrak → lint →
  typecheck → test → build; job terpisah untuk deteksi drift migrasi
  (hanya berjalan bila `SHADOW_DATABASE_URL` tersedia).
- `contract-diff` memakai `prisma migrate diff --exit-code`.
- `.github/pull_request_template.md` — daftar periksa sebelum merge.

---

## 4. Pengujian

| Berkas                                       | Jumlah | Cakupan                                                   |
| -------------------------------------------- | ------ | --------------------------------------------------------- |
| `packages/contracts/test/rbac.spec.ts`       | 5      | Hierarki role, matriks permission aditif, anti-escalation |
| `packages/contracts/test/pagination.spec.ts` | 8      | Default limit, batas, round-trip cursor, base64url        |
| `packages/contracts/test/plans.spec.ts`      | 6      | Kode unik, satu paket populer, harga/hari konsisten       |
| `apps/api/test/token.spec.ts`                | 5      | Panjang token, keunikan, OTP 6 digit, SHA-256             |
| `apps/api/test/envelope.spec.ts`             | 4      | Bentuk envelope sukses/gagal, `details` opsional          |
| `packages/mocks/test/fixtures.spec.ts`       | 5      | Total 1090, determinisme, komposisi, tanpa kunci jawaban  |
| **Total**                                    | **33** |                                                           |

---

## 5. Verifikasi

Dijalankan pada **5 November 2026, 03:08–03:16 WIB** (`pnpm verify`):

```
pnpm install        → 6 proyek workspace
pnpm lint           → 6 task berhasil
pnpm typecheck      → contracts, ui, mocks, api, web — 0 error
pnpm test           → 33 tes lulus, 0 gagal
pnpm build          → contracts (tsc), api (tsc), web (vite + adapter-node)
pnpm db:validate    → schema Prisma valid
```

Total kode sumber saat laporan ditulis: **176 berkas, ±15.340 baris**.

---

## 6. Keterbatasan yang Diketahui

1. **Guard rute masih di klien.** Redirect `/dashboard` dan `/admin` terjadi
   setelah hidrasi. Otorisasi data tetap di API, jadi tidak ada kebocoran data,
   tetapi pengalaman pertama bisa berkedip. Pindah ke `hooks.server.ts` di Fase B1.
2. **`adapter-vercel` gagal di Windows** karena operasi symlink. Build lokal
   memakai `adapter-node`; Vercel memakai `adapter-vercel` karena `VERCEL` terisi.
3. **Angka TPA/TPK dan harga paket bersifat provisional.** Tersimpan di database
   dan dapat diubah admin, tetapi belum dikonfirmasi sebagai angka bisnis final.
4. **Argon2id belum dipakai.** Saat ini scrypt (bawaan Node) agar tidak ada
   dependensi native di serverless.
5. **Modul ujian belum dibangun.** Fase 0 hanya menyiapkan skema, kontrak, dan
   kerangka. Mesin ujian (timer, autosave, sistem gugur, hard lock) masuk Fase B.
6. **Impor soal PDF/Word belum ada.** Skema dan port sudah disiapkan; pipeline
   ekstraksi masuk Fase C.
7. **Midtrans belum terpasang.** Kontrak port pembayaran sudah ada, implementasi
   dan webhook menyusul.

---

## 7. Langkah Berikutnya

1. Fase B1 — mesin ujian: timer server-authoritative, autosave jawaban,
   `subtest_locks` permanen, `exam_sessions.status = ELIMINATED`.
2. Fase B2 — dashboard hasil & analitik per subtes.
3. Fase C — impor soal dari PDF/Word + editor bank soal.
4. Fase D — Midtrans Snap, webhook, rekonsiliasi pembayaran.
5. Pindahkan guard rute ke `hooks.server.ts` dan tambah tes integrasi API.

---

_Dokumen ini dibuat otomatis sebagai bagian dari penyerahan Fase 0._

---

# Laporan Branch 4 — Monetization (B4)

**Tanggal:** 5 November 2026
**Cabang:** `dev/b4-monetization`
**Lingkup:** pricing & checkout Midtrans Snap, langganan (pembelian + grant
manual), webhook terverifikasi dan idempoten, expiry/reminder cron, entitlement
gating, panel transaksi & langganan admin, serta widget revenue dashboard.

## 1. Ringkasan

B4 menutup alur monetisasi dari halaman harga publik sampai akses ujian.
Harga tidak pernah dikirim klien: checkout membaca ulang `subscription_plans`
dari database. Pembayaran masuk lewat webhook bertanda tangan, disimpan dengan
kunci idempotensi, lalu mengaktifkan langganan dalam transaksi database yang
sama. Grant manual admin memakai alasan wajib, mendukung penumpukan (`STACK`)
atau penggantian (`REPLACE`), dan setiap perubahan menulis
`subscription_events` + `audit_logs`.

## 2. Backend

| Modul                  | Isi                                                                                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modules/billing`      | `PlansService` (publik + admin CRUD), `SubscriptionsService` (grant/update/revoke/aktivasi pembelian), `BillingExpiryService` (aktivasi tertunda, expiry, reminder H-3/H-0) |
| `modules/payments`     | `PaymentsService` (checkout, webhook, mark-paid, refund, expiry tagihan), controller checkout/admin/webhook, halaman simulasi `FakeProvider`                                |
| `modules/entitlements` | `BillingAccessPolicy` — implementasi produksi `AccessPolicyPort`                                                                                                            |
| `modules/analytics`    | `AnalyticsService` — KPI revenue, konversi, rincian per paket, seri harian Jakarta                                                                                          |
| `core/ports/impl`      | `MidtransProvider` (Snap charge, refund Core API, signature SHA512) dan `FakePaymentProvider` (HMAC-SHA256)                                                                 |

Endpoint utama:

- Publik: `GET /plans`, `GET /plans/:code`, `POST /payments/midtrans/notification`,
  `GET /payments/midtrans/finish`.
- User: `GET /subscriptions/me`, `GET /subscriptions/me/history`,
  `POST /checkout/transactions`, `GET /transactions`, `GET /transactions/:id`.
- Admin: CRUD `GET/POST/PATCH /admin/plans`, `GET /admin/transactions`,
  `GET /admin/transactions/:id`, `POST /admin/transactions/:id/mark-paid`,
  `POST /admin/transactions/:id/refund`, `GET/POST /admin/subscriptions`,
  `PATCH /admin/subscriptions/:id`, `GET /admin/dashboard/revenue`.

Setiap endpoint baru memakai skema Zod dari `@webcat/contracts`, tercatat di
Swagger, dan memiliki minimal satu tes jalur sukses + satu jalur gagal.

## 3. Database

Migrasi `20261105000000_b4_monetization` menambahkan:

- `transactions.redirect_url`, `refunded_at`, `refund_reason`, `refunded_by`
  dan index `(status, paid_at)`.
- `subscriptions.last_reminder_at` agar email pengingat tidak berulang.
- View `v_daily_revenue` (tanggal Asia/Jakarta per transaksi lunas/refund)
  yang dipakai widget revenue.

Skema Prisma `billing.prisma` diperbarui sesuai kolom di atas; tidak ada tabel
domain baru di luar yang sudah direncanakan.

## 4. Frontend

- `(site)/pricing` — SSR dari `GET /plans`, cache 60 detik, state loading/
  kosong/error, kartu paket, harga coret, fitur, CTA yang hanya mengirim
  `planCode`.
- `(app)/checkout` — ringkasan, polling status ringan, tombol simulasi hanya
  untuk provider `fake`; status selalu dibaca ulang dari API.
- `(app)/transactions` — riwayat + filter status + tombol lanjutkan pembayaran.
- `(app)/transactions/[id]` — invoice HTML yang bisa dicetak/disimpan PDF.
- `(app)/subscription` — status aktif, sisa hari, tanggal berakhir, riwayat event.
- `(admin)/admin/plans` — CRUD paket, toggle publik, urutan tampil.
- `(admin)/admin/transactions` — filter, mark-paid, refund dengan alasan.
- `(admin)/admin/subscriptions` — grant manual (`STACK`/`REPLACE`), perpanjang,
  cabut dengan alasan.
- `(admin)/admin/dashboard` — widget revenue & konversi per paket.

## 5. Pengujian

`pnpm test` — **129 tes lulus, 0 gagal**:

| Berkas                                                 | Jumlah | Cakupan                                                            |
| ------------------------------------------------------ | ------ | ------------------------------------------------------------------ |
| `apps/api/test/billing/contracts.spec.ts`              | 12     | Waktu Jakarta, invoice, status Midtrans, validasi input            |
| `apps/api/test/billing/midtrans-provider.spec.ts`      | 25     | Signature, parsing status, Snap charge, refund, sandbox/production |
| `apps/api/test/billing/plans.service.spec.ts`          | 6      | Paket publik, fallback, kode ganda, audit                          |
| `apps/api/test/billing/subscriptions.service.spec.ts`  | 15     | Grant STACK/REPLACE, batas durasi, revoke, aktivasi pembelian      |
| `apps/api/test/billing/payments.service.spec.ts`       | 23     | Checkout, replay webhook, retry, refund, mark-paid, cursor         |
| `apps/api/test/billing/billing-expiry.service.spec.ts` | 5      | Aktivasi tertunda, expiry, reminder                                |
| `apps/api/test/billing/entitlements.spec.ts`           | 8      | Gate akses, akun ditangguhkan, kode 402, batas 1 sesi/hari         |
| `apps/api/test/billing/analytics.service.spec.ts`      | 2      | KPI revenue, zero-fill harian                                      |
| `apps/api/test/{envelope,token}.spec.ts`               | 9      | Fondasi B1                                                         |
| `packages/contracts/test/*` + `packages/mocks/test/*`  | 24     | RBAC, pagination, paket, fixture                                   |

Verifikasi yang dijalankan:

```
pnpm --filter @webcat/contracts build   → sukses
pnpm --filter @webcat/api typecheck     → 0 error
pnpm --filter @webcat/api lint          → 0 warning
pnpm --filter @webcat/api test          → 105 tes lulus
pnpm --filter @webcat/web check         → 0 error, 0 warning
pnpm --filter @webcat/web lint          → 0 warning
pnpm --filter @webcat/web build         → sukses (adapter-node)
pnpm test                               → 129 tes lulus
```

## 6. Keterbatasan

1. **Playwright belum tersedia.** Repo belum memiliki harness E2E; pengujian
   halaman pricing/checkout admin dilakukan manual dan lewat `svelte-check`.
   Konfigurasi root E2E adalah milik integrator.
2. **Midtrans live belum diuji.** Semua tes memakai fixture signature statis
   dan `FakeProvider`; kredensial sandbox tidak dipakai di CI.
3. **Tab langganan di `(admin)/users/:id` belum ada.** Repo belum memiliki
   halaman detail user. Pengelolaan grant/revoke dipusatkan di
   `(admin)/admin/subscriptions`, sedangkan form tambah user sudah mendukung
   `durationDays`.
4. **PDF invoice belum dibuat.** Fase 1 menyediakan halaman HTML siap cetak;
   ekspor PDF otomatis masuk fase berikutnya.
5. **View `v_daily_revenue` membutuhkan migrasi.** Dashboard revenue akan
   kosong sampai migrasi B4 dijalankan di environment tersebut.

## 7. Langkah Berikutnya

1. Jalankan `pnpm db:deploy` di environment staging lalu verifikasi view
   `v_daily_revenue`.
2. Uji webhook Midtrans sandbox end-to-end dan rekonsiliasi refund.
3. Tambahkan halaman detail user admin + tab langganan bila B1 menyediakan
   rute tersebut.
4. Tambahkan Playwright untuk pricing SSR dan checkout `FakeProvider`.

---

_Dokumen ini diperbarui sebagai bagian dari penyerahan Branch 4 (B4)._
