# FASE 5 — Gap Fitur P1/P2

**Prioritas:** P1 (sebelum rilis) lalu P2 (kualitas)
**Estimasi:** 5–8 hari
**Prasyarat:** Fase 4 selesai (mesin ujian & bank soal beres)

---

## Tujuan

Menutup fitur yang seharusnya ada menurut `plan.md` tetapi belum ada atau baru
sebagian. Fase ini **tidak** memblokir alur ujian, tetapi memblokir kelayakan
rilis publik.

---

## P1 — sebelum rilis publik

| ID | Pekerjaan | Kondisi saat ini | Kriteria selesai | Est |
| --- | --- | --- | --- | --- |
| F5-01 | Pulihkan halaman `/pricing` | dihapus di commit `e0b23fd` | Halaman tampil, harga dari DB, test lulus | 1 j |
| F5-02 | CRUD plan admin | belum ada UI lengkap | Create/update/soft-delete + audit | 2 j |
| F5-03 | Detail user admin | daftar ada, detail minim | Riwayat sesi, langganan, pembayaran | 2 j |
| F5-04 | Detail transaksi admin | belum ada | Status, bukti bayar, refund | 2 j |
| F5-05 | Worker `job_queue`/outbox terjadwal | endpoint ada, tak dijadwalkan | Cron jalan, backlog termonitor | 1,5 j |
| F5-06 | Rate limit API | belum aktif | 429 sesuai kebijakan, terdokumentasi | 1,5 j |
| F5-07 | CSRF + CSP | belum aktif | Header terpasang, uji XSS dasar | 1,5 j |
| F5-08 | Dashboard peserta dari API | data mock | Angka nyata dari `history` & statistik | 1,5 j |
| F5-09 | Dokumentasi API produksi | belum sinkron | Swagger/OpenAPI diperbarui | 1 j |

---

## P2 — kualitas & UX

| ID | Pekerjaan | Kondisi saat ini | Kriteria selesai | Est |
| --- | --- | --- | --- | --- |
| F5-10 | Autosave IndexedDB + replay + `fetch keepalive` (bukan `sendBeacon`) | in-memory saja | Jawaban aman saat offline/refresh | 3 j |
| F5-11 | Preload 2 soal berikutnya (teks + gambar) | belum ada | Navigasi tanpa jeda | 1 j |
| F5-12 | Zoom/pan gambar figural | belum ada | Gambar kecil bisa diperbesar | 1,5 j |
| F5-13 | Flag anomali waktu jawab | belum ada | `< 300 ms` (gambar), `< 150 ms` (Kecermatan) tercatat | 1 j |
| F5-14 | Import ZIP gambar end-to-end | parser ada, UI belum | Pemetaan manual + laporan error | 2 j |
| F5-15 | Varian WebP/thumbnail | satu ukuran | 2 varian per gambar | 1 j |
| F5-16 | E2E Playwright alur ujian | belum ada | Skrip lulus di CI dengan DB nyata | 3 j |

---

## Langkah detail

### F5-01 — Pulihkan `/pricing`

Halaman `/pricing` hilang di commit `e0b23fd`. Pulihkan **bukan** dengan
`git revert` (commit itu mungkin memuat perubahan lain), tetapi dengan mengambil
file spesifik:

```powershell
git checkout e0b23fd^ -- "apps/web/src/routes/(site)/pricing" `
                          "apps/web/src/lib/components/PlanCard.svelte"
```

Route lama sudah di grup `(site)`, jadi path tujuan tidak perlu diubah. Setelah
dipulihkan, sesuaikan dengan konvensi kode sekarang:

| Bagian | Penyesuaian |
| --- | --- |
| `$app/stores` | ganti ke `$app/state` (`page`, bukan `$page`) |
| `SiteHeader.svelte` | tambahkan kembali tautan `Harga & Paket` → `/pricing` |
| `+page.server.ts` | `apiRequest(..., { cacheTtlMs: 0 })` |

**Kenapa `cacheTtlMs: 0`.** Klien API web punya memory cache 15 dtk **plus**
stale-while-revalidate hingga 60 dtk (`apps/web/src/lib/api/client.ts`), jadi
perubahan harga di DB bisa tertahan ~75 dtk di proses SSR. Halaman ini sudah
memakai `cache-control` HTTP sendiri, sehingga cache lapis kedua itu hanya
menambah keterlambatan yang bertabrakan dengan kriteria F5-02 ("perubahan
langsung terlihat di `/pricing`").

**Kriteria selesai**

- `/pricing` mengembalikan 200 dan menampilkan paket dari `GET /api/v1/plans`.
- Tidak ada harga hardcode di komponen (ADR 0003).
- Ada test/check bahwa halaman memuat data dari API.

---

### F5-02 — CRUD plan admin

Endpoint admin sudah ada (`admin-plans.controller.ts`: GET/POST/PATCH), tetapi
tabelnya **belum punya `deleted_at`** sehingga "hapus" tidak mungkin tanpa
kehilangan riwayat. UI-nya juga masih baca-saja dan justru memanggil endpoint
publik.

| Bagian | Kebutuhan | Status |
| --- | --- | --- |
| Skema | `subscription_plans.deleted_at` + index | ✅ migrasi `20261105140000_f5_02_plan_soft_delete` |
| Daftar | tabel plan, tab aktif vs arsip | ✅ `[panel]/plans/+page.svelte` |
| Form | kode, nama, tagline, harga, coret, durasi, fitur, badge, urutan, status, publik | ✅ |
| Hapus | soft delete + wajib alasan; tolak bila ada langganan `ACTIVE` | ✅ `DELETE /admin/plans/:id` |
| Pulihkan | `POST /admin/plans/:id/restore` + alasan | ✅ |
| Audit | `plan.create` / `plan.update` / `plan.delete` / `plan.restore` | ✅ |

**Keputusan desain**

1. **Soft delete, bukan hard delete.** `transactions.plan_id` dan
   `subscriptions.plan_id` memakai `ON DELETE SET NULL`; hapus fisik akan
   menghilangkan nama paket dari riwayat pembayaran lama.
2. **`code` tetap UNIQUE termasuk baris terhapus.** Kode paket yang pernah
   dipakai transaksi tidak boleh dipakai ulang agar audit tidak ambigu. Pesan
   error mengarahkan admin untuk *restore* paket lama.
3. **Fallback `DEFAULT_PLANS` hanya saat tabel benar-benar kosong.** Kalau
   semua paket dihapus admin, `/pricing` harus kosong — bukan menampilkan lagi
   harga default yang sudah "dihapus". Dijaga test regresi.
4. **Paket terhapus tidak bisa di-`PATCH`** (`BILLING_PLAN_ARCHIVED`) agar
   admin sadar harus restore dulu; mencegah "edit hantu" pada data arsip.
5. **`includeDeleted=true`** pada `GET /admin/plans` dipakai tab Arsip. Default
   tetap hanya paket hidup.

**Kenapa `DELETE` membawa body.** Alasan hapus wajib masuk audit, dan
`DELETE …/plans/:id` dengan `{ "reason": "..." }` lebih jujur daripada
menyembunyikan alasan di query string (yang mudah hilang di log proxy).

**Kriteria selesai**

- Admin bisa membuat, mengubah, menonaktifkan plan. ✅
- Perubahan langsung terlihat di `/pricing` (tanpa deploy). ✅ (`cacheTtlMs: 0`
  dari F5-01; panel memakai `cacheTtlMs: 0`)
- Setiap perubahan punya entri audit. ✅ (`plan.*`)

---

### F5-03 — Detail user admin ✅

Daftar user sudah ada tetapi detail minim. Halaman `[panel]/users/[id]` kini
merangkum profil, status verifikasi, langganan aktif + riwayat, riwayat sesi
ujian, dan riwayat pembayaran.

**Implementasi**

| Bagian | Detail |
| --- | --- |
| API | `GET /admin/users/:id/overview` — satu request; agregat dihitung di DB (`count`/`aggregate`), bukan di memori |
| Kontrak | `AdminUserOverview` + tipe baris lokal (`AdminUserSubscriptionRow`, `AdminUserExamRow`, `AdminUserPaymentRow`). Tipe baris sengaja lokal agar halaman tidak ikut berubah setiap kontrak modul lain berevolusi |
| Filter transaksi | `userId` opsional pada `GET /admin/transactions` (dipakai halaman detail dan tautan "lihat semua") |
| UI | `[panel]/users/[id]/+page.svelte`; baris daftar user menaut ke detail; `cacheTtlMs: 0` agar angka selalu segar; helper label di `lib/admin/user-detail.ts` (13 test) |

**Keputusan desain**

1. **Satu endpoint agregat, bukan empat request.** Halaman detail hanya butuh
   satu round-trip; `exams` dan `payments` dihitung dengan `count`/`aggregate`
   di DB.
2. **`null` ≠ `0`.** `bestScore`, `averageScore`, dan `lastPaidAt` bernilai
   `null` bila belum ada data; `0` berarti ada data dengan nilai nol.
3. **Sesi yang di-void tidak dihitung.** Semua agregat ujian memakai
   `voidedAt: null`. `exams.completed` = sesi `COMPLETED` + `ELIMINATED` (hanya
   keduanya punya `totalScore`); `exams.passed` dihitung terpisah dari
   `passed: true`.
4. **Riwayat langganan menyimpan baris `ACTIVE` yang sudah kedaluwarsa.**
   "Langganan aktif" mensyaratkan `status = ACTIVE` **dan** `endsAt > now`;
   baris lama tetap tampil di riwayat, bukan di kartu langganan aktif.
5. **Pembayaran:** `totalPaidIdr` hanya menjumlahkan `status = SUCCESS`,
   sedangkan `totalTransactions` menghitung semua status.

**Kriteria selesai**

- Admin bisa menjawab "user ini pernah ikut ujian berapa kali, skornya berapa,
  dan langganannya kapan habis" tanpa query manual. ✅ (satu request; angka
  dibandingkan langsung dengan query DB)
- Aksi verifikasi/refund tercatat di audit. ✅ untuk endpoint
  `mark-paid`/`refund`; aksi dari halaman transaksi dikerjakan di F5-04.

---

### F5-04 — Detail transaksi admin ➖ (ditunda)

**Keputusan (5 Nov 2026):** payment gateway ditunda, jadi detail transaksi juga
ditunda. Saat ini peserta memperoleh akses lewat dua jalur non-gateway:

1. Admin membuat akun (email + password undangan) sekaligus menentukan
   langganan; sistem mengirim email aktivasi ke pengguna.
2. Pengguna masuk lewat Google (belum bisa dipakai penuh); ia menghubungi admin
   untuk ditambahkan langganan, lalu email dikirim ulang ke akun Google yang
   sudah terdaftar.

Konsekuensinya tidak ada transaksi yang perlu diverifikasi/direfund sekarang.
Halaman `[panel]/transactions/[id]` dan unggah bukti bayar baru dikerjakan bila
gateway diaktifkan kembali.

**Yang sudah tersedia bila nanti dibutuhkan**

- `POST /admin/transactions/:id/mark-paid` dan `/:id/refund` — wajib alasan,
  sudah menulis `audit_logs`.
- `payment_webhook_events` menyimpan payload gateway untuk rekonsiliasi.
- Model `Transaction` **tidak punya** kolom metode/bukti bayar; kolom yang ada:
  `provider`, `providerRef`, `snapToken`, `redirectUrl`, `rawPayload`,
  `refundedAt`, `refundReason`, `refundedById`.

---

### F5-05 — Worker job queue ✅

Penjadwal dan guard ternyata **sudah ada**: `apps/api/vercel.json` memanggil
`process-jobs` tiap menit, dan `CronAuthGuard` memeriksa
`Authorization: Bearer $CRON_SECRET`. Gap yang tersisa hanya metrik backlog dan
alert.

**Implementasi**

| Bagian | Detail |
| --- | --- |
| Metrik | `JobQueueService.stats()` → `pending`, `running`, `failed`, `oldestPendingAgeSeconds` |
| Endpoint | `GET /internal/cron/backlog` (butuh `CRON_SECRET`) → metrik + `threshold` + `alert` |
| Alert | `logger.warn('Backlog job melewati ambang', …)` saat `pending > JOB_BACKLOG_ALERT_THRESHOLD` (default 100) |
| Cron | `process-jobs` menyertakan `details.backlog` dan `details.backlogAlert` pada respons |
| Lokal | `pnpm --filter @webcat/api cron:run --status` |

**Keputusan desain**

1. **Penjadwal tetap di `vercel.json`.** Tidak menambah proses worker terpisah;
   Vercel Cron sudah memanggil tiap menit dan endpoint idempoten (klaim
   `FOR UPDATE SKIP LOCKED`).
2. **Alert lewat log terstruktur.** Belum ada kanal on-call; `logger.warn` +
   `SENTRY_DSN` yang sudah ada adalah jalur termurah yang bisa langsung dipakai.
3. **Ambang dapat dikonfigurasi** lewat `JOB_BACKLOG_ALERT_THRESHOLD` agar uji
   dan produksi bisa memakai nilai berbeda.

**Kriteria selesai**

- Job `PENDING` berkurang tanpa intervensi manual. ✅ (6 job uji → 0 lewat
  `POST /process-jobs`, semuanya `COMPLETED`)
- Ada endpoint/health check yang menampilkan backlog. ✅
  `GET /internal/cron/backlog`

---

### F5-06 — Rate limit API ✅

Rate limit per-rute sudah ada (`RateLimitGuard` + tabel `rate_limit_hits`),
tetapi hanya auth/checkout/webhook yang dibatasi. Endpoint lain tidak punya
batas sama sekali.

**Implementasi**

| Bagian | Detail |
| --- | --- |
| Global | `RATE_LIMIT_GLOBAL_PER_MINUTE` (default 600) untuk endpoint tanpa `@RateLimit` |
| Scope | per pengguna login (`global:user:<id>`), anonim per IP (`global:ip:<ip>`) |
| Per-rute | `@RateLimit` tetap menang: login 10/900 dtk, checkout 3/60 dtk, webhook 120/60 dtk |
| Header | respons 429 menyertakan `Retry-After` |
| Penyimpanan | `rate_limit_hits` (Postgres, UPSERT atomik, tanpa Redis) |

**Keputusan desain**

1. **Tidak menambah `@nestjs/throttler`.** Guard yang ada sudah atomik dan
   tidak membutuhkan Redis; menambah dependensi hanya menggandakan mekanisme.
2. **Default per pengguna untuk request terautentikasi**, per IP untuk anonim.
   Ini mencegah siswa di balik satu NAT sekolah saling memblokir.
3. **Login tetap 10/900 detik** — lebih ketat daripada kriteria 10/menit, jadi
   tidak dilonggarkan.

**Kriteria selesai**

- `POST /auth/login` ke-11 dalam jendela → 429. ✅ (diuji; `Retry-After: 523`)
- Request global ke-6 saat limit uji 5 → 429 + `Retry-After`. ✅
- Trafik normal pada limit default 600/menit tidak terblokir. ✅ (6/6 health 200)

---

### F5-07 — CSRF + CSP ✅

| Item | Implementasi |
| --- | --- |
| CSRF | double-submit token: cookie `webcat_csrf` (dibaca JS) + header `x-csrf-token` |
| Guard | `CsrfGuard` global, urutan ke-2 setelah `JwtAuthGuard` |
| CSP web | `kit.csp` mode `hash` di `svelte.config.js` |
| Header API | middleware di `main.ts` (nosniff, DENY, no-referrer, CSP `default-src 'none'`) |

**Implementasi CSRF**

| Bagian | Detail |
| --- | --- |
| Token | 32 byte acak → base64url 43 karakter, dibandingkan `timingSafeEqual` |
| Penerbitan | `setRefreshCookie` menulis `webcat_rt` (httpOnly) **dan** `webcat_csrf` (bisa dibaca JS) |
| Rotasi | setiap login/refresh/Google callback menerbitkan ulang keduanya |
| Logout | `clearRefreshCookie` menghapus keduanya |
| Klien web | `csrfHeaders()` di `client.ts` membaca cookie dan mengirim header pada non-GET |
| Pengecualian | GET/HEAD/OPTIONS; request `Authorization: Bearer`; request tanpa cookie refresh |
| Migrasi | sesi lama (cookie refresh tanpa cookie CSRF) hanya boleh `POST /auth/refresh`; respons menerbitkan token baru |
| Gagal | 403 `COMMON_CSRF_FAILED` |

**Implementasi CSP**

| Directive | Nilai |
| --- | --- |
| `default-src` | `'self'` |
| `script-src` | `'self'` + hash inline yang digenerate SvelteKit |
| `style-src` | `'self' 'unsafe-inline' https://fonts.googleapis.com` |
| `img-src` | `'self' data: blob: https://*.supabase.co` |
| `font-src` | `'self' data: https://fonts.gstatic.com` |
| `connect-src` | `'self'` (`+ ws:` hanya saat dev) |
| `frame-ancestors` / `base-uri` / `form-action` / `object-src` | `'none'` / `'self'` / `'self'` / `'none'` |

**Keputusan desain**

1. **Double-submit cookie, bukan token per-sesi di database.** Refresh token sudah
   httpOnly + `SameSite=Lax`; token kedua yang bisa dibaca JS cukup untuk
   membuktikan request berasal dari origin yang sama, tanpa tabel/Redis baru.
2. **Mode `hash`, bukan `nonce`.** Halaman `/pricing` memakai
   `cache-control: public, max-age=60`. Nonce yang ikut ter-cache akan kedaluwarsa
   atau dipakai ulang; hash selalu cocok dengan HTML yang dilayani.
3. **`style-src 'unsafe-inline'` dipertahankan.** Banyak komponen memakai atribut
   `style=` dan transisi Svelte membuat elemen `<style>` saat runtime. Risiko
   inline style jauh lebih kecil daripada inline script.
4. **Bearer dikecualikan.** Token akses tidak dikirim otomatis oleh browser,
   sehingga tidak ada ambient credential yang bisa dieksploitasi CSRF.
5. **Pengecualian refresh untuk sesi lama.** Tanpa ini semua pengguna yang login
   sebelum deploy akan ter-logout paksa. Setelah satu refresh, cookie CSRF ada
   dan aturan penuh berlaku.

**Deviasi: JSON-LD `/pricing` dihapus**

`{@html}` yang menyisipkan `<script type="application/ld+json">` tidak ikut
di-hash SvelteKit, sehingga akan melanggar `script-src 'self'` (hash/nonce
diperlukan untuk script inline). Blok JSON-LD dinamis di
`apps/web/src/routes/(site)/pricing/+page.svelte` dihapus; meta/OG tetap ada.
Bila structured data dibutuhkan lagi, rutenya harus diprerender atau memakai
nonce yang disuntikkan lewat `app.html`.

**Kriteria selesai**

- Request state-changing tanpa token CSRF → 403. ✅ runtime: `POST /auth/logout`
  tanpa header → 403 `COMMON_CSRF_FAILED`; header salah → 403.
- `POST /auth/refresh` dengan cookie + header → 200 dan token CSRF berotasi. ✅
- Logout dengan Bearer + header → 200 dan kedua cookie dihapus. ✅
- Header API hadir: `content-security-policy`, `x-content-type-options: nosniff`,
  `x-frame-options: DENY`, `referrer-policy: no-referrer`, tanpa `x-powered-by`. ✅
- Tidak ada inline script yang diblokir CSP. ✅ diuji `/`, `/login`, `/pricing`,
  `/dashboard`, `/exam/<id>`: setiap halaman punya tepat 1 script inline dan
  hash-nya ada di `script-src`.
- Test otomatis: `apps/api/test/csrf.spec.ts` 11 test (guard, perbandingan token,
  pasangan cookie). ✅

---

### F5-08 — Dashboard peserta ✅

Dashboard sebelumnya menampilkan angka contoh yang ditulis langsung di template
(`subtestProgress`, `recentSessions`, `notices`). Sekarang seluruh isinya berasal
dari API peserta.

| Bagian | Sumber data |
| --- | --- |
| Status langganan + sisa masa aktif | `GET /subscriptions/me` (`status`, `planName`, `endsAt`, `remainingDays`) |
| Total sesi (selesai/gugur) | `GET /exams/stats` (`totalSessions`, `completedSessions`, `eliminatedSessions`) |
| Skor terbaik + rata-rata | `GET /exams/stats` (`bestScore`, `averageScore`) |
| Grafik tren + garis ambang lulus | `GET /exams/stats` (`trend`, `totalPassingScore`) |
| Cakupan per subtes + subtes terlemah | `GET /exams/stats` (`perSubtest`) |
| Riwayat 5 sesi terakhir + modal detail | `GET /exams/history?limit=5` |

**Perubahan kontrak**

`ExamStatsView` mendapat field `totalPassingScore` (`exam_settings.total_passing_score`,
0–100). Sebelumnya template menulis ambang 60/61 secara hardcode, sehingga nilai
yang terlihat bisa berbeda dari aturan ujian yang benar-benar berlaku.
`ResultsService` menyuntikkan `ExamConfigService` dan mengembalikan pengaturan
efektif dari DB.

**Keputusan desain**

1. **Satu endpoint agregat untuk semua kartu ujian.** `/exams/stats` sudah
   menghitung rata-rata, terbaik, tren, dan per-subtes di server; dashboard tidak
   mengagregasi ulang riwayat di klien (kecuali 5 baris tabel).
2. **Panel "Pengumuman" palsu diganti "Ringkasan Akun".** Pengumuman contoh
   berisi timestamp dan angka karangan; diganti ringkasan yang seluruh isinya
   berasal dari sesi/statistik nyata (tingkat kelulusan, skor terakhir, aturan
   ujian).
3. **`cacheTtlMs: 0`.** Dashboard adalah halaman pertama setelah login; angka
   lama (mis. sisa hari) lebih membingungkan daripada satu request tambahan.
   Hanya kartu langganan yang memakai cache `sessionStorage` untuk render instan,
   dan cache itu tidak dipakai untuk kartu ujian (`examsLoading` terpisah) agar
   tidak ada "0 sesi" palsu sebelum respons tiba.
4. **Helper murni di `lib/dashboard/summary.ts`.** Pengurutan subtes (paling
   lemah = rata-rata non-null terendah), pemetaan tren ke koordinat SVG, label
   status, dan format skor diuji tanpa merender Svelte.

**Kriteria selesai**

- Semua angka berasal dari API; tidak ada nilai hardcode. ✅ angka contoh
  (`subtestProgress`, `recentSessions`, `notices`) dihapus; ambang lulus kini
  `totalPassingScore` dari `exam_settings`. Bukti runtime: respons
  `GET /exams/stats` memuat `totalPassingScore: 60`, dan halaman merender
  "Ambang lulus 60" dari field itu.
- Saat belum ada sesi, tampil empty state yang jelas. ✅ DB dev berisi 0
  `exam_sessions`: dashboard menampilkan "TOTAL SESI 0", "SKOR TERBAIK —",
  "Belum ada skor. Selesaikan satu sesi untuk melihat tren.", dan
  "Belum ada jawaban yang dinilai." tanpa error.

---

### F5-09 — Dokumentasi API produksi ✅

Masalah sebenarnya bukan "belum ada Swagger" — `/api/docs` sudah ada sejak awal.
Masalahnya dokumentasi itu **tidak bisa dipakai**:

1. Halaman `/api/docs` **tampil kosong**. Middleware header keamanan global
   memasang `content-security-policy: default-src 'none'`, sehingga CSS/JS
   Swagger UI (`./docs/swagger-ui-*.js`) diblokir browser. Dibuktikan lewat
   Chrome DevTools Protocol: `document.querySelectorAll('.opblock').length === 0`.
2. Dokumen berisi **120 operasi tanpa satu pun `requestBody`**. Controller
   memvalidasi body dengan `@Body(zodPipe(schema))`, sedangkan `@nestjs/swagger`
   hanya mengenali DTO berbasis class. Akibatnya semua endpoint tulis
   terdokumentasi tanpa bentuk request.
3. Tidak ada schema respons, tidak ada deskripsi tag, dan 70 dari 120 operasi
   tidak punya ringkasan.
4. Dokumentasi hanya aktif bila `NODE_ENV !== 'production'`, jadi tidak ada
   dokumentasi untuk API produksi.

**Solusi**

`apps/api/src/core/http/openapi.ts` membangun dokumen dari metadata rute:

| Langkah | Detail |
| --- | --- |
| Pindai controller | `ModulesContainer` → semua kelas controller terdaftar |
| Baca rute | `PATH_METADATA`, `METHOD_METADATA`, `DECORATORS.API_EXCLUDE_*` |
| Baca skema Zod | `ROUTE_ARGS_METADATA` → pipe `ZodValidationPipe` (`BODY`/`QUERY`) |
| Konversi | `zod-to-json-schema` (`target: openApi3`, `$refStrategy: 'none'`) |
| Query | Skema objek dipecah menjadi parameter `in: query` (nama + `required`) |
| Multipart | `@ApiConsumes('multipart/form-data')` + `@ApiFileFields('file', 'assets')` → field biner digabung dengan field dari skema Zod |
| Envelope | Setiap 2xx memakai `$ref: SuccessEnvelope`; `401/403/422/429/500` memakai `ErrorEnvelope` |
| Metadata | `x-public`, `x-required-permissions`, `x-rate-limit` dari decorator yang sama dengan guard |
| Tag | 25 tag terpakai didaftarkan otomatis dengan deskripsi (`TAG_DESCRIPTIONS`) |

Karena skema dibaca dari pipe yang benar-benar dipakai `zodPipe`, dokumentasi
tidak bisa "basi": mengubah skema validasi otomatis mengubah dokumen.

**Ringkasan operasi**

70 operasi yang belum punya ringkasan diberi `@ApiOperation({ summary })` di
controller masing-masing (bukan peta terpusat), sehingga Swagger UI menampilkan
judul yang bisa dibaca. Diverifikasi: 120/120 operasi punya summary.

**CSP halaman dokumentasi**

Respons API biasa tetap `default-src 'none'`. Halaman `/api/docs*` memakai CSP
terpisah karena Swagger UI memuat asetnya sendiri dan memakai `<style>` inline:

```
default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline';
script-src 'self'; font-src 'self' data:; connect-src 'self';
frame-ancestors 'none'; base-uri 'none'
```

`'unsafe-inline'` hanya untuk `style-src` (bawaan paket Swagger UI), bukan
`script-src`. Respons JSON tetap tidak boleh memuat style/script apa pun.

**Ketersediaan di produksi**

`/api/docs` dan `/api/docs-json` aktif di semua environment; set
`API_DOCS_ENABLED=false` untuk mematikannya.

**Artefak & anti-drift**

| Berkas | Isi |
| --- | --- |
| `docs/api/openapi.json` | Spesifikasi lengkap: 103 path, 120 operasi, 4 schema |
| `docs/api/README.md` | Panduan auth, CSRF, envelope, error code, rate limit, pagination |
| `apps/api/scripts/openapi.ts` | Generator + mode `--check` |

```bash
pnpm --filter @webcat/api docs:openapi        # tulis artefak
pnpm --filter @webcat/api docs:openapi:check  # gagal bila artefak ≠ kode
```

Generator dijalankan dari hasil build (`node dist/scripts/openapi.js`) karena
`tsx`/esbuild tidak meng-emit decorator metadata; tanpa metadata itu container
Nest gagal dibuat. Skrip tidak menghubungi database.

**Kriteria selesai**

- Swagger/OpenAPI diperbarui. ✅ 103 path / 120 operasi; `requestBody` naik dari
  **0 → 51**, parameter query dari 0 → 17, schema komponen dari 0 → 4,
  operasi tanpa summary dari 70 → 0.
- Dokumentasi bisa dipakai. ✅ Chrome CDP pada `http://127.0.0.1:3000/api/docs`:
  `opblocks: 120`, `tags: 25`, `swaggerUiPresent: true`, `console errors: []`.
- Tidak ada `$ref` menggantung. ✅ seluruh `$ref` menunjuk
  `SuccessEnvelope`/`ErrorEnvelope`/`ErrorBody`/`ResponseMeta` yang ada.
- Anti-drift. ✅ `docs:openapi:check` lulus; test `test/openapi.spec.ts` (11 test)
  memeriksa summary/tag/operationId/2xx/429/500, `x-public` vs `security`,
  resolusi `$ref`, kelengkapan deskripsi tag, konversi Zod → JSON Schema, dan
  bentuk multipart (field berkas + field skema).

---

### F5-10 — Autosave IndexedDB ✅

Saat ini jawaban hanya disimpan di memori + dikirim ke server. Bila koneksi
putus atau tab ditutup, jawaban bisa hilang.

Rancangan:

```
setiap perubahan jawaban:
  1. tulis ke IndexedDB (key: sessionId + subtestId + questionId)
  2. tambahkan ke antrean kirim
  3. flush antrean tiap N detik / saat online
  4. saat unload: navigator.sendBeacon(...)
  5. saat load: pulihkan jawaban yang belum tersinkron
```

**Kriteria selesai**

- Matikan jaringan → jawab 5 soal → nyalakan jaringan → semua tersimpan.
- Refresh tab di tengah subtes → jawaban tetap ada.
- Replay `clientSeq` tetap idempoten di server (lihat F2-07).

#### Kondisi awal (apa yang sebenarnya belum jalan)

Antrean IndexedDB sudah ada (`apps/web/src/lib/offline/answer-queue.ts`) dan
setiap perubahan jawaban sudah ditulis ke sana. Yang **belum** benar:

1. **Refresh menghapus jawaban dari layar.** `loadQuestions()` hanya memakai
   jawaban dari server; baris antrean dibaca sebatas untuk menghitung
   `pendingCount`. Jawaban yang belum terkirim tetap ada di IndexedDB, tetapi
   UI menampilkannya sebagai soal kosong — peserta mengira jawabannya hilang.
2. **Tidak ada pengiriman ulang saat koneksi pulih.** Retry berhenti setelah
   `MAX_RETRIES` (5 kali, ±23 detik). Bila jaringan mati lebih lama, antrean
   berhenti dicoba sampai peserta menjawab soal lain. Tidak ada listener
   `online`.
3. **Dua baris untuk satu soal = jawaban terbaru hilang.** Setiap perubahan
   jawaban menambah baris baru. Beberapa baris untuk soal yang sama masuk ke
   batch dengan `clientSeq` yang sama; server menyimpan yang **pertama**
   (`exam_answer_events` unik per soal + `clientSeq`), sehingga jawaban terakhir
   peserta diabaikan.
4. **`keepaliveFlush()` hanya memuat jawaban sejak halaman dibuka.** Setelah
   refresh, `recentAnswers` kosong, sehingga menutup tab tidak mengirim apa pun.

#### Solusi

| Berkas | Perubahan |
| --- | --- |
| `lib/offline/answer-queue.ts` | `enqueueAnswer()` menggabungkan jawaban berulang pada soal yang sama **selama belum terkirim** (satu baris per soal, `timeSpentMs` dijumlahkan). `nextClientSeq` di fallback memori kini per subtes (sebelumnya satu counter global) |
| `lib/offline/answer-sync.ts` (baru) | Fungsi murni `mergePendingAnswers()` (prioritas server < antrean < memori) dan `buildKeepaliveBatch()` (batch unload memakai `clientSeq` yang sudah ada) |
| `lib/stores/examRunner.svelte.ts` | `loadQuestions()` memulihkan antrean ke `answers` + `pendingMirror`; `online`/`offline` listener; `keepaliveFlush()` memakai cermin antrean, bukan `recentAnswers` |
| `routes/(app)/exam/[sessionId]/+page.svelte` | `pagehide` + flush saat tab disembunyikan; indikator "N jawaban dipulihkan dari perangkat" |
| `modules/exams/exam-session.service.ts` (API) | Bug turunan: `GET .../questions` selalu mengembalikan `answer: null` karena `select` memakai `answerPayload` sedangkan `ProjectionRow` membaca `answer`. Sekarang dipetakan eksplisit |

`pendingMirror` adalah salinan antrean di memori. Saat tab ditutup, operasi
IndexedDB yang asinkron tidak bisa diandalkan lagi, jadi batch terakhir disusun
dari cermin ini. Cermin hanya dihapus bila jawaban yang ter-ACK masih sama
(`clientSeq` cocok) sehingga perubahan yang terjadi saat request berjalan tidak
ikut terhapus.

#### Deviasi: `sendBeacon` tidak dipakai

Rancangan menyebut `navigator.sendBeacon(...)`. Itu **tidak bisa** dipakai di
sini: `sendBeacon` tidak dapat mengirim header `Authorization`, sedangkan
`PATCH /exams/sessions/:id/subtests/:id/answers` menuntut Bearer token (tidak ada
cookie akses — lihat F5-07). Beacon akan menerima 401 dan jawaban hilang tanpa
jejak, sementara browser melaporkan "terkirim".

Penggantinya `fetch(..., { keepalive: true })`: semantiknya sama (request tetap
dijalankan saat halaman ditinggalkan), tetapi header tetap terkirim. Dipicu dari
tiga jalur — `beforeunload`, `pagehide` (mobile Safari/Chrome Android sering
melewatkan `beforeunload`), dan `visibilitychange` → `hidden` (tab bisa dibuang
OS tanpa event unload).

#### Idempotensi replay

Tidak ada endpoint baru: replay tetap memakai `clientSeq` yang sama.
`buildKeepaliveBatch()` sengaja mengutamakan record yang **sudah** punya
`clientSeq` agar unload tidak menerbitkan nomor baru untuk jawaban yang sudah
pernah dicoba. Server menyimpan `exam_answer_events` unik per
`(sessionQuestionId, clientSeq)` dan menganggap replay sebagai `saved` tanpa
menambah baris — dibuktikan `exam-flow.spec.ts` (F2-07).

#### Bukti runtime (Chrome + DevTools Protocol)

Skenario 1 — jaringan mati lalu hidup:

| Langkah | Hasil |
| --- | --- |
| `Network.emulateNetworkConditions { offline: true }` | `navigator.onLine === false` |
| Jawab 5 soal (2 `IMAGE_CHOICE` tile + 3 opsi) | IndexedDB `answers` berisi **5** baris |
| Statusline | `"5 jawaban menunggu terkirim · Offline"` |
| Kembali online + event `online` | antrean **0**, statusline `"Tersimpan 5 Nov 2026, 23.37 · Terhubung"` |

Skenario 2 — autosave diblokir, lalu refresh:

| Langkah | Hasil |
| --- | --- |
| `Network.setBlockedURLs { urls: ['*/answers'] }`, jawab 3 soal belum terjawab | IndexedDB berisi **3** baris |
| `Page.reload` (halaman tetap bisa dimuat) | soal terjawab **9 → 12**; notice `"3 jawaban dipulihkan dari perangkat dan sedang dikirim ulang."`; statusline `"3 jawaban menunggu terkirim"` |
| Blokir dibuka + event `online` | antrean **0** tanpa interaksi tambahan |
| Error runtime | `[]` |

Idempotensi di DB setelah uji: `exam_answer_events` 20 baris / 12 soal unik,
**0** pasangan `(session_question_id, client_seq)` duplikat; 
`exam_session_subtests.answered_count = 12` sama dengan jumlah baris
`answer_payload IS NOT NULL`.


---

### F5-11 — Preload 2 soal berikutnya ✅

**Kriteria selesai:** navigasi tanpa jeda.

#### Kondisi awal (apa yang sebenarnya belum jalan)

Rancangan mengasumsikan soal diambil per halaman, sehingga soal berikutnya perlu
diambil lebih awal. Kenyataannya `loadQuestions()` **sudah** mengambil seluruh
halaman (`limit=50` + cursor sampai `nextCursor === null`) saat subtes dibuka,
jadi teks soal ada di memori dan berpindah soal tidak pernah memicu request teks.

Yang masih menimbulkan jeda adalah **gambar**. Runner baru meminta
`/media/:id/content` ketika `<img>` dirender untuk soal yang sedang tampil
(`ImageChoiceTiles` memakai `loading="lazy"`, media stem dan opsi memakai
`<img>` biasa). Pada koneksi lambat, soal figural tampil dengan kotak kosong
sampai unduhan selesai — persis "jeda" yang dimaksud kriteria.

#### Solusi

| Berkas | Perubahan |
| --- | --- |
| `lib/exams/media-preload.ts` (baru) | Fungsi murni `questionMediaUrls()` (media stem + opsi, `EXPLANATION` dibuang, URL duplikat dihapus) dan `planMediaPreload()` (indeks `index+1..index+ahead`, maksimal 2, digabung tanpa duplikat). Kelas `MediaPrefetcher` menghangatkan gambar lewat `new Image()` + `decode()` |
| `routes/(app)/exam/[sessionId]/+page.svelte` | `$effect` memanggil `planMediaPreload()` setiap `index`/daftar soal berubah, lalu `mediaPrefetcher.prefetch()`; instance direset saat berpindah subtes dan saat halaman ditinggalkan |

Catatan teknis:

- Soal **sekarang** tidak ikut di-prefetch; `<img>`-nya sudah memulai unduhan
  sendiri. Yang dihangatkan hanya dua soal berikutnya.
- Endpoint media mengirim `cache-control: public, max-age=300, immutable`
  (`media.controller.ts`), jadi saat soal berikutnya tampil, `<img>`-nya memakai
  entri HTTP cache — tidak ada request baru.
- `fetchPriority` **tidak** dipakai: nilainya tidak berpengaruh pada
  `new Image()` yang tidak masuk layout, dan sempat membuat prefetch berhenti
  di sebagian browser. Urutan URL (soal terdekat dulu) yang menjaga prioritas.
- Prefetch dilewati bila `navigator.connection.saveData === true` atau
  `effectiveType` termasuk `slow-2g`/`2g`; menghemat kuota peserta lebih penting
  daripada navigasi instan.
- Prefetch bersifat "best effort": `decode()` yang gagal diabaikan, dan URL yang
  sama tidak pernah diminta dua kali dalam satu sesi halaman (batas 64 entri
  agar memori tidak tumbuh tanpa henti).

#### Bukti runtime (Chrome + DevTools Protocol)

Harness: login peserta → buka runner → duduk di soal 9, lalu bandingkan dua
navigasi pada jaringan yang diperlambat (`300 ms`, `100 kB/s`):

| Langkah | Hasil |
| --- | --- |
| Duduk di soal 9 (warmFrom) | **5 request media** baru dipicu prefetch untuk soal 10–11 sebelum tombol ditekan |
| Tekan "Berikutnya" → soal 10 | **18 ms** sampai 5 gambar siap; `ownRequestsAfterClick = 0` (semua dari cache) |
| Pembanding: lompat ke soal 57 (belum pernah diminta) | **764–1190 ms** sampai 5 gambar siap; `ownRequestsAfterClick = 5` |
| Error runtime | `[]` |

Selisih ~40–65× pada jaringan lambat; satu-satunya biaya prefetch adalah 5
request yang berjalan saat peserta masih membaca soal sebelumnya.

---

### F5-12 — Zoom/pan gambar figural

Untuk soal figural detail (jaring-jaring kubus, pola kompleks), tambahkan
viewer:

- Klik gambar → modal layar penuh.
- Pinch/scroll untuk zoom, drag untuk pan.
- Tombol reset & close, aksesibel via keyboard (`Esc`).

**Kriteria selesai**

- Gambar 200×200 bisa diperbesar sampai 400% tanpa pecah berlebihan.
- `Esc` menutup viewer.

---

### F5-13 — Flag anomali waktu jawab

Data `timeSpentMs` sudah dikirim saat autosave. Tambahkan pencatatan anomali:

| Aturan | Ambang |
| --- | --- |
| Soal bergambar dijawab terlalu cepat | `< 300 ms` |
| Kecermatan beruntun sangat cepat | `< 150 ms` untuk 5 soal berturut |
| Jawaban diubah berkali-kali dalam waktu singkat | `> 5` perubahan dalam 2 detik |

Simpan sebagai event proctoring (`exam_answer_events` atau tabel anomali),
**jangan** otomatis menggugurkan peserta.

---

### F5-14 — Impor ZIP media + pemetaan manual ✅

**Kriteria selesai:** admin bisa mengunggah sekumpulan gambar dan menetapkan
sendiri berkas mana milik soal/opsi mana, tanpa salah pasang.

#### Kondisi awal (apa yang sebenarnya belum jalan)

Impor soal lewat spreadsheet sudah bisa membawa gambar (`image_stem_1`, dst.),
tetapi selalu **membuat soal baru**. Bank soal yang sudah ada tidak punya jalan
untuk menambal gambar yang hilang: admin harus membuka soal satu per satu dan
mengunggah gambar lewat form. Untuk paket 100 soal figural itu ratusan unggahan
manual, dan tidak ada cara memeriksa hasilnya sebelum menulis.

#### Solusi

| Berkas | Perubahan |
| --- | --- |
| `packages/contracts/src/imports/media-zip.ts` (baru) | Aturan murni: `scanMediaZipEntries()` (klasifikasi OK/UNSUPPORTED/TOO_LARGE/DUPLICATE/UNSAFE_PATH/EMPTY), `validateMediaZipMappings()` (cocokkan nama berkas ↔ kode soal ↔ label opsi), `mediaZipApplySchema`, `suggestMediaZipTarget()` (tebak target dari nama `fig-016-stem.png`) |
| `apps/api/src/modules/imports/media-zip.service.ts` (baru) | Baca ZIP (JSZip), panggil fungsi kontrak, simpan lewat `MediaService.storeBuffer()` (ikut membuat thumbnail F5-15), lalu `questionMedia.create()` |
| `apps/api/src/modules/imports/media-zip.controller.ts` (baru) | `POST admin/media/import/preview`, `POST admin/media/import/apply`, `GET admin/media/import/questions`, `POST admin/media/import/questions/resolve` |
| `apps/web/src/routes/(admin)/[panel]/media/import/+page.svelte` (baru) | UI 3 langkah: unggah → periksa tabel → petakan & terapkan |
| `apps/web/src/lib/admin/media-zip-draft.ts` (baru) | State draf pemetaan murni (dipakai UI dan unit test) |

Catatan teknis:

- **Duplikat nama menandai semua berkas**, bukan hanya yang kedua: `a/gambar.png`
  dan `b/gambar.png` sama-sama `DUPLICATE` karena pemetaan memakai basename —
  kalau hanya salah satu ditandai, admin bisa memetakan berkas yang salah tanpa
  sadar.
- Arsip dengan lebih dari **200 entri ditolak utuh** (`TOO_MANY_ENTRIES`), tidak
  dipotong diam-diam.
- Berkas metadata OS (`__MACOSX/`, `.DS_Store`, `Thumbs.db`, `desktop.ini`, path
  berawalan titik) dan berkas non-gambar dibuang dari laporan, bukan dijadikan
  error — ZIP buatan Finder/Windows selalu membawanya.
- Path tidak aman (`../`, absolut) dilaporkan `UNSAFE_PATH` dan tidak pernah
  ditulis ke disk; isi ZIP hanya dibaca ke memori.
- `apply` idempoten per `(soal, aset)`: menjalankan ZIP yang sama dua kali
  menghasilkan `skipped`, bukan lampiran ganda. Gambar **berbeda** pada soal yang
  sama tetap boleh ditambahkan karena satu soal bisa punya beberapa gambar.
- Baris yang gagal tidak menghentikan baris lain; `errors` selalu dikembalikan
  lengkap agar admin bisa memperbaiki tanpa mengulang seluruh unggahan.
- Tidak ada `ImportJob` yang dibuat: tidak ada soal baru, jadi tidak perlu status
  REVIEW.

#### Bukti runtime (API nyata, DB dev)

| Langkah | Hasil |
| --- | --- |
| `POST /admin/media/import/preview` dengan ZIP 5 berkas (`catatan.txt` + `a/duplikat.png` + `b/duplikat.png` + `tpa-fig-001-stem.png` + `tpa-fig-001-opt-a.png`; 4 dilaporkan) | `summary { entries: 4, importable: 2, duplicate: 2 }`; kedua `duplikat.png` berstatus `DUPLICATE`; `catatan.txt` tidak muncul di laporan |
| `POST /admin/media/import/questions/resolve` body `["TPA-FIG-001","tidak-ada-xyz"]` | hanya `TPA-FIG-001` (`afc19cc0-7386-4b23-927a-457181113af5`, opsi A–D) |
| `POST /admin/media/import/apply` (2 gambar → `DEMO-TPA-IMG-001` STEM + opsi A) | `{ imported: 2, attached: 2, skipped: 0, questionsUpdated: 1, errors: [] }` |
| DB setelah apply | 2 baris `question_media` (STEM + OPTION A) dan 2 aset baru; keduanya otomatis punya thumbnail (320×420→400×262 4.700 B, 520×520→400×400 5.376 B) |
| Bersih-bersih | 2 baris `question_media` + 2 aset dihapus; kembali ke 235 lampiran / 105 aset |

Bukti UI (Chrome + DevTools Protocol, `:5173`, login `SUPER_ADMIN`): buka
`/super-admin/media/import` lewat tautan sidebar, lalu unggah `f5-import.zip`
lewat `<input type="file">` (bukan memanggil API langsung). Halaman berpindah
ke langkah petakan dan menampilkan **Ringkasan arsip**: `f5-import.zip`,
4 berkas, 2 siap dipetakan, 0 sudah dipetakan, 2 belum bertarget. Tabel
"Petakan berkas" berisi 4 baris — dua baris `duplikat.png` berstatus **Nama
ganda** dengan keterangan "Nama berkas sama dengan berkas lain di ZIP; ganti
salah satu nama.", dua lainnya (`tpa-fig-001-opt-a.png`, `tpa-fig-001-stem.png`)
berstatus **Siap**. Satu-satunya respons non-2xx adalah `401 /auth/refresh`
saat pemulihan sesi di navigasi penuh; tidak ada error lain.

> Catatan operasional: bila halaman impor 500 dengan pesan "does not provide
> an export named …", itu cache pre-bundel Vite yang basi setelah `dist`
> kontrak dibangun ulang — hapus `apps/web/node_modules/.vite/deps` dan
> restart dev server. Bukan bug kode.

---

### F5-15 — Varian WebP/thumbnail ✅

**Kriteria selesai:** grid media & pratinjau tidak perlu mengunduh berkas besar.

#### Kondisi awal (apa yang sebenarnya belum jalan)

Semua media disimpan sebagai satu berkas WebP ukuran penuh dan dilayani apa
adanya. Halaman daftar media dan panel pemilihan gambar merender banyak
thumbnail 64–200 px, tetapi setiap kotak mengunduh berkas asli — satu halaman
bank soal bisa menarik puluhan megabita hanya untuk melihat gambar kecil.

#### Solusi

| Berkas | Perubahan |
| --- | --- |
| `packages/contracts/src/media/index.ts` | `MEDIA_VARIANTS = ['full','thumb']`, `normalizeMediaVariant()`, `needsThumbnail()` (sisi terpanjang > `MEDIA_THUMBNAIL_MAX_DIMENSION` = 400 px), field `thumbUrl` pada `MediaAssetView` |
| `apps/api/src/modules/media/media-thumbnail.ts` (baru) | `buildMediaThumbnail()` memakai sharp: resize `fit: inside`, WebP kualitas 70, `withoutEnlargement` |
| `apps/api/src/modules/media/media.service.ts` | `storeBuffer()` membuat thumbnail saat simpan (kegagalan thumbnail tidak menggagalkan penyimpanan); `resolveVariant()` memilih byte sesuai `?variant` |
| `apps/api/src/modules/media/media.controller.ts` | `?variant=` pada `GET media/:id/content` dan `GET admin/media/:id/preview` |
| `apps/api/prisma/schema/question.prisma` + migrasi `20261106120000_f5_15_media_thumbnail` | Kolom `thumb_data`, `thumb_width`, `thumb_height`, `thumb_size_bytes` (semua nullable) |

Catatan teknis:

- **Varian bukan bagian dari HMAC.** URL bertanda tangan tetap satu;
  `?variant=thumb` ditambahkan setelah tanda tangan dan tidak mengubah
  `exp`/`sig`. Kalau varian ikut di-HMAC, setiap gambar butuh dua URL bertanda
  tangan dan cache CDN terbelah tanpa manfaat keamanan (byte-nya sama-sama
  publik).
- Thumbnail dibuat **saat simpan**, bukan saat diminta, supaya request baca tetap
  satu query tanpa CPU sharp.
- Aset lama tidak di-backfill: selama `thumb_data` kosong, `?variant=thumb`
  mengembalikan byte asli (fallback), **tidak pernah 404**.
- Gambar yang sudah ≤ 400 px tidak dibuatkan turunan karena hasilnya bisa lebih
  besar dari aslinya.
- Respons tetap `cache-control: public, max-age=300, immutable` untuk kedua
  varian.

#### Bukti runtime (API nyata, DB dev)

| Langkah | Hasil |
| --- | --- |
| `POST /admin/media/upload` `f5-big.png` 1200×800 | respons memuat `thumbUrl` yang tepat sama dengan `url + "&variant=thumb"`; `sizeBytes` 55.880 |
| `GET url` (full) | `200`, `image/webp`, **55.880 byte**, `cache-control: public, max-age=300, immutable` |
| `GET url&variant=thumb` | `200`, `image/webp`, **8.112 byte** (6,9× lebih kecil), header cache sama |
| DB aset tersebut | `thumb_width 400`, `thumb_height 267`, `thumb_size_bytes 8112`, `octet_length(thumb_data) = 8112` |
| Aset kecil 256×256 (tanpa turunan) | `thumb_size_bytes` NULL; `?variant=thumb` mengembalikan **3.032 byte** (byte asli) — fallback bekerja |
| Migrasi | `prisma migrate deploy` mencatat `20261106120000_f5_15_media_thumbnail`; kolom `thumb_*` ada di `information_schema` |

Bukti UI (Chrome + DevTools Protocol): grid media admin
`/super-admin/media` merender 30 gambar dan meminta thumbnail lewat
`/api/v1/media/<id>/content?exp=…&sig=…&variant=thumb` (terpantau 15 request
`variant=thumb` pada muatan pertama; sisanya menyusul saat digulir karena
`loading="lazy"`). Kolom `src` pada kartu media dan pemilih media di form soal
kini memakai `thumbUrl` (jatuh ke `url` bila kosong).

---

### F5-16 — E2E Playwright

Tambahkan `apps/web/e2e/exam.spec.ts`:

1. Login sebagai peserta demo.
2. Mulai sesi.
3. Buka subtes pertama.
4. Jawab 5 soal.
5. Refresh halaman → jawaban tetap ada (uji F5-10).
6. Selesaikan subtes.
7. Cek halaman hasil.

Jalankan terhadap API + DB nyata (bukan mock). Bisa digabung dengan job CI
integrasi (F2-09) atau job terpisah.

---

## Verifikasi fase

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:integration
```

Manual:

| Cek | Target |
| --- | --- |
| `/pricing` | tampil, harga dari DB |
| Admin plan/user/transaksi | CRUD + audit |
| Cron | backlog turun |
| `POST /auth/login` berulang | 429 |
| Dashboard peserta | angka nyata |
| Offline + refresh saat ujian | jawaban tidak hilang |
| E2E Playwright | lulus |

---

## Risiko fase ini

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Rate limit terlalu ketat | peserta terblokir saat ujian | kecualikan endpoint ujian atau naikkan limit per user terautentikasi |
| CSP memblokir media eksternal | gambar tidak tampil | `img-src` memuat host storage |
| IndexedDB menyimpan data sensitif | risiko privasi | simpan hanya jawaban, bersihkan setelah sesi selesai |
| Cron dipanggil tanpa secret | penyalahgunaan | wajib header `CRON_SECRET` |
| E2E flaky | CI merah palsu | gunakan `data-testid`, tunggu kondisi eksplisit |

---

## Commit yang disarankan

1. `feat(web): pulihkan halaman pricing (F5-01)`
2. `feat(admin): CRUD plan (F5-02)`
3. `feat(admin): detail user & transaksi (F5-03, F5-04)`
4. `feat(ops): jadwalkan worker + metrik backlog (F5-05)`
5. `feat(security): rate limit + CSRF + CSP (F5-06, F5-07)`
6. `feat(web): dashboard peserta dari API (F5-08)`
7. `docs(api): OpenAPI sinkron + Swagger UI produksi (F5-09)`
8. `feat(web): autosave IndexedDB + sendBeacon (F5-10)`
9. `test(e2e): alur ujian Playwright (F5-16)`
