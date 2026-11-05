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

### F5-04 — Detail transaksi admin

Halaman `[panel]/transactions/[id]` belum ada. Yang perlu ditampilkan: status,
metode, bukti bayar (media), riwayat status, dan aksi refund/verifikasi.

**Catatan penting**

- Model `Transaction` **tidak punya** kolom metode pembayaran atau bukti bayar.
  Kolom yang tersedia: `provider`, `providerRef`, `snapToken`, `redirectUrl`,
  `rawPayload`, `refundedAt`, `refundReason`, `refundedById`.
- Riwayat status harus diambil dari `audit_logs`
  (`transaction.mark_paid`, `transaction.refund`, `transaction.<status>`) dan/atau
  `payment_webhook_events`.
- Endpoint `mark-paid` dan `refund` sudah ada dan sudah menulis audit.

**Keputusan yang perlu diambil sebelum mulai**

1. Tambah unggah bukti bayar (kolom + alur media) **atau** nyatakan sebagai
   deviasi eksplisit dengan alasan (mis. pembayaran hanya lewat gateway).
2. Sumber riwayat status: `audit_logs` saja, atau digabung dengan
   `payment_webhook_events` agar replay webhook terlihat.

**Kriteria selesai**

- Admin bisa melihat detail transaksi dan riwayat statusnya tanpa query manual.
- Aksi verifikasi/refund dari halaman transaksi tercatat di audit.

---

### F5-05 — Worker job queue

`POST /internal/cron/process-jobs` sudah ada, tetapi **tidak ada penjadwal**.

| Langkah | Detail |
| --- | --- |
| 1 | Pastikan `vercel.json` (atau cron eksternal) memanggil endpoint cron secara berkala |
| 2 | Amankan endpoint dengan secret header (`CRON_SECRET`) |
| 3 | Tambahkan metrik backlog: jumlah job `PENDING` & umur tertua |
| 4 | Alert bila backlog > ambang |

**Kriteria selesai**

- Job `PENDING` berkurang tanpa intervensi manual.
- Ada endpoint/health check yang menampilkan backlog.

---

### F5-06 / F5-07 — Rate limit, CSRF, CSP

| Item | Implementasi yang disarankan |
| --- | --- |
| Rate limit | `@nestjs/throttler` global + limit lebih ketat untuk `/auth/login` |
| CSRF | token double-submit untuk endpoint non-Bearer (refresh cookie) |
| CSP | header via middleware: `default-src 'self'`, `img-src 'self' data: <storage-host>` |

**Kriteria selesai**

- `POST /auth/login` ke-11 dalam 1 menit → 429.
- Request state-changing tanpa token CSRF → 403.
- Tidak ada inline script yang diblokir CSP (uji halaman utama + runner).

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
