# Rencana Perbaikan WebCAT — Prioritas: Alur Test CAT Fungsional

**Tanggal:** 5 November 2026
**Sumber bukti:** audit kode + uji runtime langsung (API hidup + PostgreSQL Supabase)
**Prinsip:** setiap klaim harus punya bukti kode/uji; hijau `pnpm test` **bukan** bukti alur jalan.

---

## 0. Ringkasan

Alur fitur ujian (CAT) saat ini **tidak bisa diselesaikan peserta** karena dua bug
blocker yang tidak terdeteksi unit test (semua test memakai fake Prisma, tidak pernah
menyentuh PostgreSQL). Selain itu, fitur **soal bergambar** sudah ada rangkanya tetapi
rantaiannya putus di 4 titik sehingga tidak pernah bisa dipakai.

| Blocker | Gejala | Akar masalah | Tingkat |
| --- | --- | --- | --- |
| **B1** | `POST /exams/sessions` → 409 `EXAM_SESSION_ALREADY_TODAY` padahal 0 sesi | `order_index` subtes per-stage + `@@unique([sessionId, orderIndex])` | P0 |
| **B2** | `POST .../open` → 500 timeout 5000 ms | query root Prisma di dalam `$transaction` + `connection_limit=1` | P0 |
| **B3** | `QUESTION_POOL=db` tidak valid | 0 soal PUBLISHED, TPA tidak ada di seed | P1 |

**Alur CAT yang sudah terbukti jalan** (setelah B1/B2 dilewati manual): `GET session`,
`GET questions`, `PATCH answers` (idempoten), `heartbeat`, `events`, `finish`, `result`,
`history`. Artinya perbaikan B1+B2 langsung membuka seluruh alur.

### Peta fase

Penomoran resmi eksekusi ada di [`perbaikan/00-INDEX.md`](./perbaikan/00-INDEX.md).
Dokumen ini adalah **ringkasan strategi**; rincian langkah per fase ada di runbook.

| Fase | Tujuan | Hasil yang bisa diverifikasi | Runbook |
| --- | --- | --- | --- |
| **0** | Persiapan & jaring pengaman | Branch, baseline, DB uji, helper test | [`perbaikan/fase-0-persiapan.md`](./perbaikan/fase-0-persiapan.md) |
| **1** | Alur CAT bisa jalan end-to-end | Peserta bisa mulai → kerjakan → selesai → lihat hasil | [`perbaikan/fase-1-cat-fungsional.md`](./perbaikan/fase-1-cat-fungsional.md) |
| **2** | Integration test & anti-regresi | Test Postgres nyata + smoke + CI | [`perbaikan/fase-2-integration-test.md`](./perbaikan/fase-2-integration-test.md) |
| **3** | Soal bergambar (psikotes) berfungsi | Soal figural + opsi bergambar tampil & dinilai | [`perbaikan/fase-3-soal-bergambar.md`](./perbaikan/fase-3-soal-bergambar.md) |
| **4** | Bank soal & konten lengkap | TPA ada, semua PUBLISHED, kuota terpenuhi | [`perbaikan/fase-4-bank-soal.md`](./perbaikan/fase-4-bank-soal.md) |
| **5** | Fitur pendukung & gap P1/P2 | Admin, monitoring, keamanan, UX | [`perbaikan/fase-5-gap-fitur.md`](./perbaikan/fase-5-gap-fitur.md) |

> Catatan: bagian di bawah memakai penomoran lama (Fase 1 = blocker CAT,
> Fase 2 = soal bergambar, dst.). Padanan barunya: Fase 1 → **0+1**,
> Fase 2 → **3**, Fase 3 → **4**, Fase 4 → **5**.

**Tracker progres:** [`PROGRESS.md`](./PROGRESS.md) · **Alat:** `pnpm progress`

---

## FASE 1 — Alur Test CAT Fungsional (P0)

> **Target:** dari akun demo, peserta dapat menyelesaikan 1 sesi penuh
> (6 subtes) tanpa intervensi database.

### 1.1 Perbaikan B1 — `order_index` subtes bertabrakan

**Bukti**

- `apps/api/prisma/schema/exam.prisma:181` → `@@unique([sessionId, orderIndex])`
- `apps/api/src/modules/exams/exam-session.service.ts:254` → `orderIndex: subtest.orderIndex`
- Data konfigurasi: PSIKOLOGI 4 subtes `1,2,3,4`; TPA `1`; TPK `1` → sesi menulis
  `[1,2,3,4,1,1]` pada satu `session_id` → `P2002 (session_id, order_index)`.
- `exam-session.service.ts:265-271` menangkap **semua** `P2002` → 409
  `EXAM_SESSION_ALREADY_TODAY` (pesan palsu; DB sesi masih 0).

**Langkah**

| # | Tindakan | File |
| --- | --- | --- |
| 1.1.1 | Ganti `@@unique([sessionId, orderIndex])` → `@@index([sessionId, orderIndex])`. Pertahankan `@@unique([sessionId, subtestId])` sebagai penjaga duplikat. | `apps/api/prisma/schema/exam.prisma` |
| 1.1.2 | Buat migrasi: `pnpm --filter @webcat/api prisma:migrate -- --name fix_exam_session_subtest_order_index`. Pastikan isi migrasi benar-benar `DROP INDEX` + `CREATE INDEX`. | `apps/api/prisma/migrations/` |
| 1.1.3 | Sempitkan handler `P2002`: hanya petakan ke `EXAM_SESSION_ALREADY_TODAY` bila `error.meta?.target` memuat `user_id`/`exam_date`; selain itu rethrow. | `exam-session.service.ts:264` |
| 1.1.4 | Verifikasi tidak ada pemakaian `orderIndex` yang mengasumsikan global: `exam-session.service.ts:512,544,548,1059,1066,1103`, `apps/web/.../exam/[sessionId]/+page.svelte` ("Subtes ke-N"). Dengan `orderIndex` per-stage, perilaku UI tidak berubah. | — |

**Uji**

- [ ] Unit (baru) `test/exam-session-start.spec.ts`: fake Prisma melempar `P2002` dengan
      `meta.target = ['session_id','order_index']` → **bukan** `EXAM_SESSION_ALREADY_TODAY`.
- [ ] Unit (baru): `P2002` dengan `target = ['user_id','exam_date']` → tetap 409 benar.
- [ ] Runtime: `POST /api/v1/exams/sessions` → 201; DB `exam_session_subtests` = 6 baris.
- [ ] Runtime: ulangi di hari sama → 409 (kuota harian), bukan karena constraint.

---

### 1.2 Perbaikan B2 — deadlock transaksi `openSubtest`

**Bukti**

- `exam-session.service.ts:431` → `materializeQuestions(tx, ...)`
- `exam-session.service.ts:480` → `this.questionSource.prepare({...})`
- `exam-question-source.ts` → `loadFromDatabase()` memakai `this.prisma` (**root**, bukan `tx`)
- `DATABASE_URL` = pooler Supabase `?pgbouncer=true&connection_limit=1`
- Pengukuran: `tx` di dalam `tx` = **186 ms**; `root` di dalam `tx` = **4178 ms → timeout 5000 ms**
- Bukan karena `createMany`: 100 baris 388 ms, 500 baris 593 ms, `startSession` total ~679 ms.

**Langkah**

| # | Tindakan | File |
| --- | --- | --- |
| 1.2.1 | Tambah parameter client pada `prepare(input, db = this.prisma)`; teruskan ke `loadFromDatabase(code, count, db)`. | `exam-question-source.ts` |
| 1.2.2 | `materializeQuestions` memanggil `prepare(input, tx)`. | `exam-session.service.ts:480` |
| 1.2.3 | Naikkan batas transaksi: `$transaction(fn, { timeout: 20_000, maxWait: 10_000 })`. | `exam-session.service.ts:414` |
| 1.2.4 | (Opsional, disarankan) Pindahkan materialisasi ke **luar** transaksi karena idempoten (`count` guard + `skipDuplicates`): advisory lock → materialisasi → transaksi pendek untuk update status. | `exam-session.service.ts` |
| 1.2.5 | Audit ulang semua `$transaction(async (tx) => ...)` yang memakai `this.prisma.*` di dalamnya. | `grep -rn "\$transaction" apps/api/src` |

**Uji**

- [ ] Runtime: `POST .../open` KECERDASAN → 200, status `ACTIVE`, 100 baris `exam_session_questions`.
- [ ] Runtime: KECERMATAN (500 soal) → 200 dalam < 3 s.
- [ ] Runtime: Pass Hand (150 kolom) → 200.
- [ ] Test integrasi: `openSubtest` dua kali (idempoten) tidak menduplikasi soal.

---

### 1.3 Integration test dengan PostgreSQL nyata

Masalah utama: bug B1/B2 lolos karena **tidak ada satu pun test** untuk `startSession`
dan `openSubtest`, dan semua test memakai fake Prisma.

| # | Tindakan | File |
| --- | --- | --- |
| 1.3.1 | Tambah `apps/api/test/integration/` dengan guard `describe.skipIf(!process.env.DATABASE_URL_TEST)`. | baru |
| 1.3.2 | Skenario A: `startSession` → 1 sesi, 3 stage, 6 subtes, urutan benar. | `exam-start.spec.ts` |
| 1.3.3 | Skenario B: `openSubtest` KECERDASAN → 100 soal, status ACTIVE, timer `endsAt`. | `exam-open.spec.ts` |
| 1.3.4 | Skenario C: alur penuh — open → questions (2 halaman) → autosave (replay `clientSeq` yang sama) → heartbeat → events → finish → result. | `exam-flow.spec.ts` |
| 1.3.5 | Skenario D: jawaban semua benar → tidak `ELIMINATED`; subtes berikutnya `READY`. | `exam-flow.spec.ts` |
| 1.3.6 | Skenario E: `openSubtest` KECERMATAN 500 soal (uji beban materialisasi). | `exam-open.spec.ts` |
| 1.3.7 | Tambah script `test:integration` di `apps/api/package.json`; job CI terpisah dengan service container `postgres:17`. | `package.json`, `.github/workflows/ci.yml` |
| 1.3.8 | Buat `apps/api/scripts/smoke-cat.ts`: alur HTTP penuh + cleanup (sesi & jawaban uji dihapus). | baru |

**Kriteria keluar Fase 1**

- [ ] `POST /exams/sessions` → 201 tanpa error.
- [ ] `POST .../open` → 200 untuk **semua** 6 subtes.
- [ ] Peserta bisa menyelesaikan seluruh 6 subtes dan melihat hasil.
- [ ] `pnpm test` + `pnpm test:integration` hijau.
- [ ] `scripts/smoke-cat.ts` lulus berulang (idempoten, membersihkan data).

---

## FASE 2 — Soal Bergambar / Jawaban Bergambar (P0 untuk psikotes)

> **Target:** subtes **Kecerdasan** dan **TPA** memuat soal figural; stem bergambar
> dan opsi jawaban bergambar tampil di runner dan dinilai benar.

### 2.1 Kondisi saat ini (bukti)

| Komponen | Status | Bukti |
| --- | --- | --- |
| Enum `IMAGE_CHOICE` | ✅ ada | `question.prisma` |
| Tabel `question_media` + `option_id` | ✅ ada | `question.prisma` |
| Upload media + konversi WebP + dedupe | ✅ ada | `media.service.ts:103-190` |
| Renderer `ImageChoice.svelte` | ✅ ada (admin preview) | `components/questions/ImageChoice.svelte` |
| Form admin memasang media STEM/OPTION | ✅ ada | `QuestionForm.svelte:120-160` |
| Media di snapshot **per opsi** | ❌ tidak ada | `SnapshotOption` tanpa field `media` |
| Media opsi di proyeksi | ❌ hardcode `[]` | `exam-question-projection.ts:31` |
| Runner merender opsi bergambar | ❌ tidak ada | `exam/[sessionId]/+page.svelte:585` hanya `optionText()` |
| Runner merender `IMAGE_CHOICE` sebagai tile | ❌ jatuh ke cabang teks | cabang `{:else}` |
| Soal bergambar di bank/seed/fixture | ❌ tidak ada | 0 media, 0 `IMAGE_CHOICE` PUBLISHED |

**Akibat nyata:** soal `IMAGE_CHOICE` yang dibuat admin akan tampil sebagai tombol teks
tanpa gambar, meskipun gambar sudah diunggah.

### 2.2 Langkah teknis

#### 2.2.1 Model snapshot: media per opsi

| # | Tindakan | File |
| --- | --- | --- |
| 2.2.1.1 | Tambah `media: SnapshotMedia[]` pada `SnapshotOption`. | `apps/api/src/modules/scoring/scoring.types.ts` |
| 2.2.1.2 | Tambah `optionId: string \| null` pada `SnapshotMedia` (agar bisa dipetakan balik). | idem |
| 2.2.1.3 | `parseQuestionSnapshot` membaca `media` per opsi; default `[]` untuk snapshot lama (kompatibilitas). | `exam-snapshot.ts:135-180` |

> **Kompatibilitas:** snapshot yang sudah tersimpan di `exam_session_questions` tidak
> boleh gagal diparse. Field baru harus opsional saat dibaca.

#### 2.2.2 Materialisasi: pertahankan relasi media → opsi

| # | Tindakan | File |
| --- | --- | --- |
| 2.2.2.1 | Sertakan `optionId` pada select `media` dan pada tipe `QuestionRow.media`. | `exam-question-source.ts:318-330` |
| 2.2.2.2 | Di `mapDbQuestion`: kelompokkan media `role === 'OPTION'` ke `options[i].media` berdasarkan `optionId`; media `STEM`/`EXPLANATION` tetap di `snapshot.media`. | `exam-question-source.ts:378` |
| 2.2.2.3 | `buildChoice`/seed builder: dukung parameter `media` opsional agar fixture bisa menghasilkan soal bergambar. | `exam-question-source.ts:110` |

#### 2.2.3 Proyeksi: kirim media opsi ke peserta

| # | Tindakan | File |
| --- | --- | --- |
| 2.2.3.1 | `optionView(option, resolve)` → `media: option.media.map(...)` (bukan `[]`). | `exam-question-projection.ts:31` |
| 2.2.3.2 | `mediaViews()` **hanya** memproyeksikan `role === 'STEM'` untuk DTO ujian; `EXPLANATION` hanya di endpoint hasil/review. | idem |
| 2.2.3.3 | `projectMany` ikut mengumpulkan path media opsi agar signed URL di-cache. | idem |

#### 2.2.4 Runner ujian: render gambar

| # | Tindakan | File |
| --- | --- | --- |
| 2.2.4.1 | Tambah cabang `IMAGE_CHOICE` → grid tile gambar (pakai `ImageChoice.svelte` atau markup setara). | `apps/web/src/routes/(app)/exam/[sessionId]/+page.svelte` |
| 2.2.4.2 | Render `<img>` untuk `option.media` pada `SINGLE_CHOICE`/`MULTI_CHOICE`/`MISSING_ELEMENT`. | idem (~L585, L612, L652) |
| 2.2.4.3 | Render media `STEM` (sudah ada) + dukung banyak gambar per stem. | idem (~L520) |
| 2.2.4.4 | Tambah CSS: `option__media`, `tile` grid, `max-height`, `object-fit: contain`, `loading="lazy"`. | idem (`<style>`) |
| 2.2.4.5 | (Disarankan) Satukan renderer: runner memakai `QuestionRenderer` agar pratinjau admin = tampilan peserta (syarat plan §10.2). Perlu adapter `ExamQuestion → RenderQuestion` (`stem`→`stemText`, `alt`→`altText`). | `apps/web/src/lib/exams/render-adapter.ts` (baru) |

#### 2.2.5 Penyajian berkas media (URL)

| # | Tindakan | File |
| --- | --- | --- |
| 2.2.5.1 | Jalur ujian memakai `storage.createSignedUrl(path)`. Untuk `STORAGE=supabase` ini benar **hanya bila objek ada di bucket**. `storeBuffer` menyimpan byte ke kolom `media_assets.data` **tanpa** mengunggah ke bucket → gambar 404. Pilih satu: (a) unggah ke storage di `storeBuffer`, atau (b) proyeksi memakai `buildMediaUrl(assetId)` → `/api/v1/media/:id/content` yang melayani byte dari DB. **Rekomendasi (b)** karena sudah ada dan tidak butuh bucket. | `media.service.ts:160-190`, `exam-question-projection.ts:110` |
| 2.2.5.2 | `DevStorage` menghasilkan `http://localhost:3000/dev-storage/...` **tanpa route** → 404. Tambah route `GET /dev-storage/*` (khusus `STORAGE=dev`) atau ganti ke `/api/v1/media/:id/content`. | `core/ports/impl/dev-storage.ts` |
| 2.2.5.3 | Pastikan TTL signed URL ≥ durasi subtes (Kecerdasan 120 mnt) atau refresh per batch fetch. | `exam-question-projection.ts` |

#### 2.2.6 Konten: soal bergambar di bank soal

| # | Tindakan | File |
| --- | --- | --- |
| 2.2.6.1 | Buat aset gambar contoh (pola figural, kubus, peta, pencerminan) → `apps/api/prisma/seed/media/`. Format WebP, ≥ 200×200 px, ≤ 5 MB. | baru |
| 2.2.6.2 | Buat `seedMediaAssets(prisma)` yang memanggil `MediaService.storeBuffer()` (dedupe checksum) dan mengembalikan map `kode → mediaAssetId`. | `prisma/seed/media.seed.ts` |
| 2.2.6.3 | Tambah 30–40 soal `IMAGE_CHOICE` (Kecerdasan: pola/rotasi/pencerminan; TPA: figural) + 10 soal `SINGLE_CHOICE` ber-stem gambar, dengan `media` STEM & OPTION. | `prisma/seed/questions/kecerdasan.ts`, `tpa.ts` |
| 2.2.6.4 | `seedQuestionBank` menulis baris `question_media` dari deklarasi soal. | `prisma/seed/questions/index.ts` |
| 2.2.6.5 | Perbarui `question-seed.spec.ts`: setiap `IMAGE_CHOICE` wajib punya media STEM dan setiap opsi punya media OPTION. | `apps/api/test/question-seed.spec.ts` |

#### 2.2.7 Validasi kontrak

| # | Tindakan | File |
| --- | --- | --- |
| 2.2.7.1 | `questionShapeIssues`: `IMAGE_CHOICE` wajib punya ≥1 media `STEM`; setiap opsi wajib punya ≥1 media `OPTION`. | `packages/contracts/src/questions/index.ts:105-155` |
| 2.2.7.2 | Tambah uji kontrak untuk aturan tersebut. | `packages/contracts` / `apps/api/test` |
| 2.2.7.3 | Validasi dimensi minimum (200×200) saat upload di server. | `media.service.ts:160` |

**Kriteria keluar Fase 2**

- [ ] Ada ≥ 30 soal `IMAGE_CHOICE` PUBLISHED dengan stem **dan** opsi bergambar.
- [ ] Runner ujian menampilkan gambar stem + tile gambar opsi.
- [ ] Klik opsi gambar menyimpan `optionIds` dan dinilai benar.
- [ ] Pratinjau admin dan runner menampilkan soal secara identik.
- [ ] Media hanya dapat diakses via URL bertanda tangan.
- [ ] Media `EXPLANATION` tidak bocor ke DTO peserta.

---

## FASE 3 — Kelengkapan Bank Soal & Konten

> **Target:** `QUESTION_POOL=db` valid untuk semua subtes; tidak ada fallback fixture
> yang tak disadari.

| # | Tindakan | Detail |
| --- | --- | --- |
| 3.1 | Jalankan seed ke DB dev | `pnpm db:seed`; verifikasi `questions` semua `PUBLISHED` (990 baris) |
| 3.2 | Tambah bank soal **TPA** 100 soal | `seed/questions/tpa.ts` (verbal, numerik, penalaran) + daftarkan di `SeedStageCode`/`SeedSubtestCode` |
| 3.3 | Tambah kategori `tpa/*` | `QUESTION_CATEGORIES` |
| 3.4 | Tambah beberapa `MULTI_CHOICE` | Kecerdasan/TPA (saat ini 0 di bank) |
| 3.5 | Validasi kunci jawaban | test: tepat satu kunci untuk SINGLE/IMAGE/MISSING; ≥1 untuk MULTI |
| 3.6 | Pastikan `pair_group` Kepribadian berpasangan | test: setiap pair punya genap anggota, ada item terbalik |
| 3.7 | Ganti `.env` ke `QUESTION_POOL=db` | hanya setelah 3.1–3.4 hijau |
| 3.8 | Health-check kuota | `PrismaQuestionPool.validate()` mengembalikan alasan jelas; `startSession` menolak dengan pesan spesifik |

**Kriteria keluar Fase 3**

- [ ] `SELECT subtest_code, count(*) FROM questions WHERE status='PUBLISHED' GROUP BY 1`
      memenuhi: KECERDASAN 100, KEPRIBADIAN 140, KECERMATAN 500, PASS_HAND 150, TPA 100, TPK 100.
- [ ] Dengan `QUESTION_POOL=db`, tidak ada soal sintetis di sesi nyata.

> ⚠️ Catatan: matikan perilaku fallback diam-diam ke `buildFixture()` di produksi —
> log peringatan atau tolak sesi bila bank tidak memenuhi kuota.

---

## FASE 4 — Fitur Pendukung & Gap P1/P2

### P1 — sebelum rilis publik

| # | Fitur | Kondisi | Tindakan |
| --- | --- | --- | --- |
| 4.1 | Halaman `/pricing` | dihapus di commit `e0b23fd` | pulihkan via `git show "e0b23fd^:<path>"` atau bangun ulang dari API plan |
| 4.2 | CRUD plan admin | belum ada UI lengkap | form + validasi + audit |
| 4.3 | Detail user & transaksi admin | daftar ada, detail minim | halaman detail + riwayat langganan |
| 4.4 | Worker `job_queue`/outbox | endpoint ada, tidak dijadwalkan | `cron:run` terjadwal + metrik backlog |
| 4.5 | Rate limit & CSRF/CSP | belum aktif | throttle per-IP/per-user, header CSP, token CSRF |
| 4.6 | Dashboard peserta | data mock | ganti ke `GET /exams/history` + statistik nyata |
| 4.7 | Dokumentasi API produksi | belum mencerminkan implementasi | regenerasi dari Swagger/OpenAPI |

### P2 — kualitas & UX

| # | Fitur | Kondisi | Tindakan |
| --- | --- | --- | --- |
| 4.8 | Autosave IndexedDB + replay | hanya in-memory | simpan lokal, retry eksponensial, `sendBeacon` saat unload |
| 4.9 | Preload 2 soal berikutnya | belum ada | prefetch + preload gambar |
| 4.10 | Zoom/pan gambar figural | belum ada | komponen viewer untuk soal pola |
| 4.11 | Flag anomali waktu jawab | belum ada | `< 300 ms` soal bergambar, `< 150 ms` Kecermatan beruntun |
| 4.12 | Import ZIP gambar | parser ada, alur UI belum | pemetaan manual + laporan error |
| 4.13 | Varian WebP/thumbnail | hanya satu ukuran | generate 2 varian saat upload |

---

## 5. Matriks Uji (definition of done per fase)

| Fase | Unit | Integrasi DB | Runtime/smoke | Manual UI |
| --- | --- | --- | --- | --- |
| 1 | `exam-session-start.spec.ts`, `exam-hard-lock.spec.ts` | start/open/answer/finish | `smoke-cat.ts` | peserta menyelesaikan 1 sesi |
| 2 | `exam-question-projection.spec.ts` (+media opsi), `question-seed.spec.ts` | media tersimpan & terproyeksi | soal figural tampil | klik opsi gambar |
| 3 | `question-seed.spec.ts`, `question-pool.spec.ts` | kuota pool | sesi tanpa fallback | — |
| 4 | sesuai fitur | sesuai fitur | — | uji manual |

---

## 6. Urutan Eksekusi & Estimasi

| Urutan | Pekerjaan | Estimasi | Ketergantungan |
| --- | --- | --- | --- |
| 1 | B1 (schema + migrasi + penyempitan `P2002`) | 0,5 hari | — |
| 2 | B2 (`prepare(tx)` + timeout) | 0,5 hari | — |
| 3 | Runtime verifikasi alur penuh | 0,5 hari | 1,2 |
| 4 | Integration test + smoke script | 1 hari | 1,2 |
| 5 | Snapshot & proyeksi media opsi | 1 hari | 4 |
| 6 | Runner merender gambar | 1 hari | 5 |
| 7 | Seed media + soal figural | 1,5 hari | 5 |
| 8 | Bank soal TPA + PUBLISHED | 1 hari | 4 |
| 9 | Gap P1 | 2–4 hari | 8 |
| 10 | Gap P2 | 3–5 hari | 9 |

**Total jalur kritis menuju CAT fungsional (1–4): ±2,5 hari kerja.**
**Menuju CAT + soal bergambar (1–8): ±6 hari kerja.**

---

## 7. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Migrasi index pada DB berisi data | `exam_session_subtests` lama bisa konflik | cek duplikat dulu; migrasi hanya `DROP INDEX` (tidak menyentuh data) |
| Snapshot lama tanpa media opsi | 500 saat parse | parser harus toleran: field baru opsional, default `[]` |
| `connection_limit=1` pada pooler | transaksi lambat/timeout | jangan pernah memakai root client di dalam tx; pertimbangkan `connection_limit` lebih besar untuk migrasi/seed |
| Materialisasi 500 soal | transaksi panjang | ukur; bila > 5 s, pecah `createMany` per 100 baris atau pindahkan ke luar tx |
| Media byte di DB | DB membengkak | batasi 5 MB, konversi WebP, pertimbangkan pindah ke bucket saat produksi |
| Signed URL kedaluwarsa saat ujian panjang | gambar hilang di tengah subtes | TTL ≥ durasi subtes atau refresh per batch |
| `finish` dengan skor < passing → `ELIMINATED` | sulit menguji alur penuh | sediakan `ACCES_POLICY`/flag dev untuk menonaktifkan ambang, atau uji dengan jawaban benar |

---

## 8. Checklist Ringkas (tracking)

### Fase 1 — CAT fungsional
- [ ] 1.1.1 index schema diubah
- [ ] 1.1.2 migrasi dibuat & dijalankan
- [ ] 1.1.3 handler `P2002` disempitkan
- [ ] 1.1.4 unit test start session
- [ ] 1.2.1 `prepare(input, db)` 
- [ ] 1.2.2 `materializeQuestions` pakai `tx`
- [ ] 1.2.3 timeout transaksi dinaikkan
- [ ] 1.2.5 audit tx lain
- [ ] 1.3.1–1.3.8 integration test + smoke script
- [ ] Runtime: 6 subtes terbuka & selesai

### Fase 2 — Soal bergambar
- [ ] 2.2.1 model snapshot media per opsi
- [ ] 2.2.2 materialisasi memetakan `optionId`
- [ ] 2.2.3 proyeksi mengirim media opsi
- [ ] 2.2.4 runner merender gambar stem & opsi
- [ ] 2.2.5 URL media benar (bucket/DB) + `DevStorage` berfungsi
- [ ] 2.2.6 seed media + soal figural
- [ ] 2.2.7 validasi kontrak `IMAGE_CHOICE`

### Fase 3 — Bank soal
- [ ] 3.1 seed dijalankan (semua PUBLISHED)
- [ ] 3.2 bank TPA 100 soal
- [ ] 3.3 kategori `tpa/*`
- [ ] 3.4 `MULTI_CHOICE` ditambah
- [ ] 3.7 `QUESTION_POOL=db` aktif

### Fase 4 — Gap fitur
- [ ] 4.1 `/pricing` dipulihkan
- [ ] 4.2 CRUD plan admin
- [ ] 4.3 detail user/transaksi
- [ ] 4.4 worker job queue
- [ ] 4.5 rate limit + CSRF/CSP
- [ ] 4.6 dashboard nyata
- [ ] 4.7 dokumentasi API

---

## 9. Lampiran: Evidence Ringkas

**Runtime DB (5 Nov 2026)**

```
users 6 · questions 14 (0 PUBLISHED) · plans 6 · stages 3 · subtests 6
exam_sessions 0 · media_assets 0 · question_media 0
tipe soal: SINGLE_CHOICE 9, MULTI_CHOICE 1, IMAGE_CHOICE 1,
           LIKERT_STATEMENT 1, MISSING_ELEMENT 1, PASS_HAND_COLUMN 1
```

**Bukti B1**

```
POST /api/v1/exams/sessions
→ 409 { code: "EXAM_SESSION_ALREADY_TODAY" }
DB: SELECT count(*) FROM exam_sessions; → 0
Server: P2002 Unique constraint failed on (session_id, order_index)
```

**Bukti B2**

```
POST .../subtests/{id}/open
→ 500 Transaction API error: Transaction already closed ... timeout 5000 ms
lokasi: exam-session.service.ts:486 (materializeQuestions)
pengukuran: tx-dalam-tx 186 ms OK · root-dalam-tx 4178 ms timeout
```

**Bukti Fase 2**

```
SnapshotOption  : { id, label, text, isCorrect, scoreValue, dimensionMap }   ← tanpa media
optionView()    : return { ..., media: [] }                                  ← hardcode
runner L520     : {#if media.role === 'STEM'}                                ← hanya stem
runner L585     : <span class="option__text">{optionText(option)}</span>     ← tanpa gambar
seed            : 0 IMAGE_CHOICE · 0 media
```
