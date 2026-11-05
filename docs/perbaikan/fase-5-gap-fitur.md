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
| F5-10 | Autosave IndexedDB + replay + `sendBeacon` | in-memory saja | Jawaban aman saat offline/refresh | 3 j |
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

### F5-08 — Dashboard peserta

Ganti data mock dengan API nyata:

| Kartu | Sumber |
| --- | --- |
| Sesi terakhir | `GET /exams/history` |
| Skor rata-rata | agregasi `history` |
| Subtes terlemah | agregasi skor per subtes |
| Langganan | `GET /me/subscription` |

**Kriteria selesai**

- Semua angka berasal dari API; tidak ada nilai hardcode.
- Saat belum ada sesi, tampil empty state yang jelas.

---

### F5-10 — Autosave IndexedDB

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
7. `feat(web): autosave IndexedDB + sendBeacon (F5-10)`
8. `test(e2e): alur ujian Playwright (F5-16)`
