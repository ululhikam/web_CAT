# Laporan Pekerjaan — Branch 1: Fondasi & Identitas

**Tanggal:** 5 November 2026
**Jam:** 04.51 WIB (UTC+7) — `2026-11-05T04:51+07:00`
**Cabang:** `dev/b1-foundation-identity`
**Worktree:** `D:\hikam\concern\web_app_tes_b1`
**Lingkup:** `plan.md` §17.1 — fondasi platform, identitas/RBAC, dan fitur
platform. Mesin ujian (subtes, gugur, penilaian), import soal, dan pembayaran
**tidak** termasuk branch ini.

---

## 1. Ringkasan

Branch 1 melengkapi fondasi Fase 0 dengan identitas, sesi, audit, pengaturan
platform, dan operasional admin. Semua alur yang diverifikasi memakai database
Supabase pengembangan; tidak ada data pengguna, sesi, atau pengaturan yang
di- _mock_ pada jalur produksi.

Hasil verifikasi terakhir (`pnpm verify`, 5 November 2026 04.51 WIB):

| Gerbang   | Perintah         | Hasil                                          |
| --------- | ---------------- | ---------------------------------------------- |
| Lint      | `pnpm lint`      | ✅ 6 task berhasil                              |
| Typecheck | `pnpm typecheck` | ✅ 6 task, `svelte-check` 0 error / 0 warning   |
| Test      | `pnpm test`      | ✅ 68 tes lulus (15 berkas)                     |
| Build     | `pnpm build`     | ✅ API + web + paket, adapter-node `done`       |

Rincian tes: **25** tes kontrak, **38** tes API, **5** tes mocks. Paket web
belum memiliki tes unit (vitest keluar dengan kode 0).

---

## 2. Yang Sudah Dikerjakan

### 2.1 Kontrak (`packages/contracts`)

- `settings/` — `PLATFORM_SETTINGS_DEFAULTS`, `platformSettingsSchema`,
  `updatePlatformSettingsSchema`, dan `PlatformSettingsView`.
  Kunci pengaturan:
  - `auth.registration_enabled` (default `false`);
  - `auth.session_policy` (`replace` | `reject`, default `replace`);
  - `platform.maintenance_mode`;
  - `platform.announcement`.
- `audit/` — tipe `AuditLog`, filter, dan `CursorPage<AuditLog>`.
- `users/` — schema profil, unggah avatar, reset kuota, serta
  `AdminUserSummary` yang kini memuat `phone` dan `avatarPath`.
- `auth/` — `AuthSessionSummary`, `REFRESH_COOKIE_NAME`, dan kode error OAuth.
- Subpath export baru (`./audit`, `./settings`) agar web tetap hanya memakai
  `import type` dan tidak menarik Zod ke bundle klien.

### 2.2 API (`apps/api`)

| Area   | Endpoint                                                                                                                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth   | `POST /api/v1/auth/register`, `/verify-email`, `/resend-verification`, `/login`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password`, `/activate-invite`, `/change-password`, `/logout-all` |
| Sesi   | `GET /api/v1/auth/sessions`, `DELETE /api/v1/auth/sessions/:id`, `GET /api/v1/auth/me`                                                                                                              |
| OAuth  | `GET /api/v1/auth/google`, `GET /api/v1/auth/google/callback`                                                                                                                                       |
| Profil | `GET/PATCH /api/v1/users/me`, `PATCH /api/v1/users/me/password`, `POST /api/v1/users/me/avatar`, `GET /api/v1/me/profile`                                                                           |
| Admin  | `GET/PATCH /api/v1/admin/settings`, `GET /api/v1/admin/audit-logs`, `POST /api/v1/admin/users/:id/quota-reset`                                                                                      |

Perilaku penting:

- **Registrasi mandiri** diperiksa terhadap `auth.registration_enabled`. Bila
  mati (default), API mengembalikan `AUTH_REGISTRATION_DISABLED` (403).
- **Google OAuth** memakai state HMAC + cookie berumur pendek. Callback tanpa
  state sah diarahkan ke `/login?error=oauth_state`. Tidak ada provisioning
  otomatis: akun harus dibuat admin lebih dulu dan hanya akun `ACTIVE` yang
  boleh login. `googleSub` ditautkan pada login Google pertama.
- **Satu akun = satu sesi aktif** (FR-ID-4). Login menerapkan
  `auth.session_policy`: `replace` mencabut sesi lama, `reject` menolak dengan
  `AUTH_SESSION_ACTIVE_EXISTS` (409). Pembuatan sesi berjalan dalam transaksi
  dan dilindungi partial unique index; bila dua login paralel menabrak indeks
  (`P2002`), `replace` mencoba ulang sekali sedangkan `reject` tetap menolak.
  Detail: `docs/adr/0004-sesi-tunggal-partial-index.md`.
- **Refresh token** dirotasi; sesi lama dicabut sebelum sesi baru dibuat.
- **Anti-lockout**: SUPER_ADMIN terakhir tidak dapat diturunkan atau
  dinonaktifkan; pengguna juga tidak dapat menonaktifkan akunnya sendiri.
- **Audit** mencatat login, login Google, perubahan pengaturan, perubahan
  role/status, reset password, reset kuota, dan pencabutan sesi. Daftar audit
  memakai cursor `(createdAt, id)` + filter.
- **Storage/email**: implementasi `SupabaseStorage` (signed upload) dan
  `ResendMail` tersedia; mode `dev`/`console` tetap dipakai saat pengembangan.
- **Quota reset** meng-void sesi ujian pada tanggal WIB berjalan, menaikkan
  `tokenVersion`, dan mencatat audit.

### 2.3 Web (`apps/web`)

- `/profile` — ubah nama/telepon, ganti password, unggah avatar.
- `/devices` — daftar sesi aktif, tandai perangkat ini, cabut sesi lain.
- `/login` — tombol **Masuk dengan Google** serta pesan error OAuth.
- `/register` dan `/verify` — registrasi dan verifikasi email.
- `/invite/[token]` — meneruskan token undangan ke halaman aktivasi.
- Admin `/admin/audit` — tabel audit dengan filter, cursor, dan "muat lagi".
- Admin `/admin/settings` — pendaftaran mandiri, kebijakan sesi, mode
  pemeliharaan, dan pengumuman. Hanya tampil bagi pemegang izin.
- `hooks.server.ts` — guard SSR: halaman terlindungi diarahkan ke `/login`
  bila cookie refresh tidak ada.
- Navigasi diperbarui; tautan admin disembunyikan bila izin tidak ada.

### 2.4 Database

Satu migrasi baru, **sudah diterapkan** ke database Supabase pengembangan:

```
apps/api/prisma/migrations/20261105043000_b1_one_active_session/migration.sql
```

Isinya:

1. Mencabut sesi ganda yang sudah ada (menyisakan sesi terbaru per user).
2. Membuat partial unique index:

```sql
CREATE UNIQUE INDEX "sessions_one_active_per_user"
  ON "sessions" ("user_id")
  WHERE "revoked_at" IS NULL;
```

Indeks parsial tidak dapat dinyatakan di DSL Prisma, sehingga sengaja berada di
migrasi SQL dan diberi komentar di `apps/api/prisma/schema/core.prisma`.

---

## 3. Verifikasi Runtime

API hasil build dijalankan di `http://127.0.0.1:3101` dan diuji terhadap
Supabase pengembangan.

| Pemeriksaan                            | Hasil                                                       |
| -------------------------------------- | ----------------------------------------------------------- |
| `GET /health/ready`                    | `ok`                                                        |
| Login `admin@example.com`              | 200, role `SUPER_ADMIN`                                     |
| `GET /users/me`                        | 200, email dan role sesuai                                  |
| `GET /auth/sessions`                   | 1 sesi aktif, `current: true`                               |
| `GET/PATCH /admin/settings`            | 200; `auth.session_policy` dapat diubah                     |
| `GET /admin/audit-logs?limit=3`        | 3 item, cursor tersedia                                     |
| Registrasi saat pendaftaran mati       | 403 `AUTH_REGISTRATION_DISABLED`                            |
| `GET /auth/google` (kredensial asli)   | 302 ke `accounts.google.com`                                |
| Callback tanpa state                   | 302 ke `/login?error=oauth_state`                           |
| `POST /admin/users/:id/quota-reset`    | 200, `voidedSessions: 0`, tanggal WIB benar                 |
| 2 login berurutan, policy `replace`    | **1** sesi aktif                                            |
| Login saat policy `reject`             | 409 `AUTH_SESSION_ACTIVE_EXISTS`                            |
| **8 login paralel, policy `replace`**  | 8 sukses, **1** sesi aktif (retry `P2002` bekerja)           |
| **8 login paralel, policy `reject`**   | 0 sukses, semuanya `AUTH_SESSION_ACTIVE_EXISTS`             |
| Partial unique index di database       | `sessions_one_active_per_user ... WHERE revoked_at IS NULL` |
| Duplikat sesi aktif per user           | tidak ada                                                   |

`pnpm --filter @webcat/api prisma:deploy` melaporkan
**"Database schema is up to date"** setelah migrasi diterapkan.

---

## 4. Keterbatasan / Belum Dikerjakan

Hal-hal berikut **belum** diklaim selesai:

1. **E2E Playwright belum ada.** DoD menyebut alur auth + RBAC E2E; verifikasi
   saat ini berupa unit test API + uji runtime manual dengan database nyata.
2. **Coverage belum diukur.** Target 80% di `plan.md` belum dibuktikan; belum
   ada konfigurasi coverage yang dijalankan di CI.
3. **Google OAuth** memerlukan kredensial asli dan interaksi browser. Alur
   callback sukses belum diuji end-to-end; yang diuji adalah redirect awal dan
   callback tanpa state.
4. **Email/storage** diverifikasi dengan `MAIL=console` dan `STORAGE=dev`.
   Pengiriman Resend dan signed URL Supabase Storage belum diuji dengan
   layanan nyata.
5. **Device management** mengikuti kebijakan satu sesi; belum ada tombol
   "keluar dari semua perangkat" di UI (endpoint `logout-all` tersedia).
6. **Rate limit** dasar aktif sebagai guard global untuk endpoint yang ditandai
   `@RateLimit` (login, registrasi, OTP, reset password); nilainya belum diuji
   dengan beban nyata.
7. **Import soal PDF/Word, mesin ujian, dan pembayaran** di luar cakupan B1.
8. Pekerjaan dilakukan di worktree terpisah karena worktree utama sedang
   dipakai branch B2. Migrasi B1 **sudah diterapkan ke database Supabase
   bersama**; branch B2 perlu menggabungkan migrasi ini sebelum menjalankan
   `prisma migrate` agar tidak terjadi drift.
9. `pnpm format:check` masih gagal pada berkas lama di luar perubahan B1;
   gerbang `pnpm verify` (lint, typecheck, test, build) tetap hijau.

---

## 5. Berkas Penting

| Berkas                                                             | Keterangan                                 |
| ------------------------------------------------------------------ | ------------------------------------------ |
| `apps/api/src/modules/auth/auth.service.ts`                        | Login, sesi tunggal, refresh, OAuth, audit |
| `apps/api/src/modules/auth/google-oauth.service.ts`                | State HMAC + tukar code Google             |
| `apps/api/src/modules/settings/settings.service.ts`                | Default, merge, upsert, audit pengaturan   |
| `apps/api/src/modules/audit/audit.service.ts`                      | Daftar audit dengan cursor                 |
| `apps/api/src/modules/users/users.service.ts`                      | Profil, avatar, reset kuota, anti-lockout  |
| `apps/api/prisma/migrations/20261105043000_b1_one_active_session/` | Partial unique index sesi                  |
| `packages/contracts/src/settings/index.ts`                         | Kunci & validasi pengaturan platform       |
| `apps/web/src/hooks.server.ts`                                     | Guard SSR halaman terlindungi              |
| `apps/web/src/routes/(admin)/admin/settings/+page.svelte`          | UI pengaturan + kebijakan sesi             |
| `apps/web/src/routes/(app)/devices/+page.svelte`                   | Manajemen sesi/perangkat                   |
| `apps/api/test/session-policy.spec.ts`                             | Uji replace/reject + retry `P2002`         |
| `apps/api/test/users-role.spec.ts`                                 | Uji anti-lockout SUPER_ADMIN terakhir      |
| `docs/adr/0004-sesi-tunggal-partial-index.md`                      | Keputusan desain sesi tunggal              |
