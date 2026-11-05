# PROGRESS — Perbaikan WebCAT

**Terakhir diperbarui:** 5 November 2026
**Status keseluruhan:** 🟢 Fase 0–4 selesai — Fase 5 (gap fitur) berjalan **5/16**
**Peta fase:** [`BREAKDOWN-FASE.md`](./BREAKDOWN-FASE.md) · **Strategi:** [`RENCANA-PERBAIKAN.md`](./RENCANA-PERBAIKAN.md)
**Ringkasan otomatis:** `pnpm progress` · **Cek konsistensi ID:** `pnpm progress:check`

---

## Cara memperbarui tracker ini

1. Ubah **satu** kolom status pada tabel fase terkait.
2. Isi **Bukti** dengan perintah/hasil nyata (mis. `pnpm test` → 232 lulus).
3. Isi **Tanggal** (format `YYYY-MM-DD`).
4. Perbarui angka di **Dashboard**.
5. Tambahkan satu entri di **Log Harian**.

### Legenda status

| Simbol | Arti |
| --- | --- |
| ⬜ | Belum dikerjakan |
| 🟨 | Sedang dikerjakan |
| ✅ | Selesai & terverifikasi |
| ⛔ | Terblokir (tulis alasannya di kolom Bukti) |
| ➖ | Dibatalkan (tulis alasannya) |

> **Aturan:** ✅ hanya boleh dipakai bila kriteria selesai di runbook fase
> benar-benar terbukti. "Kode sudah ditulis" bukan alasan untuk ✅.

---

## Dashboard

| Fase | Nama | Prioritas | Selesai | Total | Progres |
| --- | --- | --- | --- | --- | --- |
| 0 | Persiapan & jaring pengaman | P0 | 10 | 10 | `██████████` 100% |
| 1 | Alur CAT fungsional (B1 & B2) | P0 | 19 | 19 | `██████████` 100% |
| 2 | Integration test & anti-regresi | P0 | 10 | 10 | `██████████` 100% |
| 3 | Soal bergambar end-to-end | P1 | 31 | 31 | `██████████` 100% |
| 4 | Bank soal & konten | P1 | 9 | 9 | `██████████` 100% |
| 5 | Gap fitur P1/P2 | P1/P2 | 5 | 16 | `███░░░░░░░` 31% |
| **Total** | | | **84** | **95** | **88%** |

---

## Baseline (diisi sebelum perubahan pertama)

### Lingkungan

| Item | Nilai |
| --- | --- |
| Branch kerja | `fix/cat-fase-1` (dibuat dari `main` @ `939eba3`) |
| Commit awal | `1fa5d52` → `939eba3 feat(seed): bank soal realistis 990 soal` |
| Node | 22.x (sesuai `engines`) |
| pnpm | `11.12.0` |
| `DATABASE_URL` | pooler Supabase (`pgbouncer=true&connection_limit=1`), DB `postgres` |
| `DATABASE_URL_TEST` | DB terpisah **`webcat_test`** di project Supabase yang sama (session pooler 5432) |
| `ACCESS_POLICY` / `QUESTION_POOL` / `STORAGE` | `dev` / `dev` / `supabase` |
| Supabase project | `qlgnodnlsthywuhzrbhg` |

> **Catatan penting:** DB `webcat_test` dibuat di project Supabase yang sama
> (bukan project kedua, karena kredensial mengikuti `.env`). Isolasi dilakukan
> di level **database**, bukan project. `pnpm test:integration` melakukan
> `TRUNCATE`, dan helper menolak jalan bila `DATABASE_URL_TEST` menunjuk
> database aplikasi. Konsekuensi: test integrasi memakai `connection_limit`
> pooler yang sama, sehingga perilaku pooler saat runtime tetap representatif.

### Gerbang mutu

| Gerbang | Perintah | Hasil | Tanggal |
| --- | --- | --- | --- |
| Test | `pnpm test` | 5 task turbo; **API 30 file / 253 test**, web 1 file / 12 test, contracts 4 file / 25 test, mocks 1 file / 5 test — semua hijau (total 295 test) | 2026-11-05 |
| Typecheck | `pnpm typecheck` | 6 task; web `svelte-check` **0 error / 64 warning**, api `tsc` 0 error | 2026-11-05 |
| Lint | `pnpm lint` | 6 task sukses (0 warning, `--max-warnings 0`) | 2026-11-05 |
| Build | `pnpm build` | 3 task sukses (contracts, api, web) | 2026-11-05 |
| Test integrasi | `pnpm test:integration` | **4 file / 14 test lulus** (`webcat_test`, 70,9 s) | 2026-11-05 |
| Smoke CAT | `pnpm smoke:cat` | **LULUS 2× berturut-turut** — 6/6 subtes COMPLETED, total 100, cleanup → sesi 0 / subtes 0 / soal 0 | 2026-11-05 |

### Data database (baseline `webcat_test` + dev, 2026-11-05)

| Tabel | Dev (`postgres`) | DB uji (`webcat_test`) |
| --- | --- | --- |
| `users` | 6 | 0 |
| `questions` | 1007 (**993 PUBLISHED**) | 0 |
| `subscription_plans` | 6 | 6 (hasil `ensureMasterData`) |
| `exam_stages` | 3 | 3 |
| `subtests` | 6 | 6 |
| `exam_settings` | 1 | 1 |
| `exam_sessions` | 0 | 0 |
| `exam_session_subtests` | 0 | 0 |
| `media_assets` | 0 | 0 |
| `question_media` | 0 | 0 |
| Duplikat `(session_id, order_index)` | **0** | **0** |

Distribusi soal per subtes (dev):

| Subtes | PUBLISHED | DRAFT | ARCHIVED |
| --- | --- | --- | --- |
| `KECERDASAN` | 100 | 8 | 1 |
| `KEPRIBADIAN` | 143 | 0 | 1 |
| `KECERMATAN` | 500 | 0 | 1 |
| `PASS_HAND` | 150 | 0 | 1 |
| `TPA` | **0** | 0 | 2 |
| `TPK` | 100 | 0 | 0 |

Distribusi tipe soal: `SINGLE_CHOICE` 209, `MULTI_CHOICE` 1, `IMAGE_CHOICE` 1,
`LIKERT_STATEMENT` 144, `MISSING_ELEMENT` 501, `PASS_HAND_COLUMN` 151.

> Artinya: bank soal **sudah ter-seed** (berbeda dari audit awal yang mencatat
> 14 soal / 0 PUBLISHED). Sisa kekurangan bank soal hanya **TPA (0 PUBLISHED)**
> dan **TPA belum ada di seed**. `media_assets`/`question_media` masih 0 →
> Fase 3 (soal bergambar) belum punya konten sama sekali.

---

## Fase 0 — Persiapan & jaring pengaman

| ID | Pekerjaan | Status | Bukti / Catatan | Tanggal |
| --- | --- | --- | --- | --- |
| F0-01 | Bersihkan `_tmp_*.ts` | ✅ | `Get-ChildItem apps\api -Filter "_tmp_*.ts"` → 0 berkas | 2026-11-05 |
| F0-02 | Commit seed bank soal yang belum masuk git | ✅ | commit `939eba3` — 9 file seed + `test/question-seed.spec.ts` | 2026-11-05 |
| F0-03 | Buat branch kerja | ✅ | `git branch --show-current` → `fix/cat-fase-1` | 2026-11-05 |
| F0-04 | Catat baseline gerbang mutu | ✅ | lihat tabel Baseline di atas (lint 6 task, typecheck 0 error, test 251, build 3 task) | 2026-11-05 |
| F0-05 | Siapkan `DATABASE_URL_TEST` | ✅ | DB terpisah `webcat_test` di project Supabase yang sama; ditambahkan ke `.env` + `.env.example` | 2026-11-05 |
| F0-06 | Migrasi ke DB uji | ✅ | `prisma migrate deploy` → 5 migrasi; `information_schema` → 38 tabel, `_prisma_migrations` 5 baris | 2026-11-05 |
| F0-07 | Helper integration test | ✅ | `test/integration/setup.ts` + `setup.spec.ts`; `pnpm test:integration` → 1 file / 2 test lulus | 2026-11-05 |
| F0-08 | Cek duplikat `(session_id, order_index)` | ✅ | query `GROUP BY 1,2 HAVING count(*)>1` → 0 baris di DB dev | 2026-11-05 |
| F0-09 | Script `test:integration` & `smoke:cat` | ✅ | `pnpm smoke:cat` exit 0; `pnpm test:integration` exit 0 | 2026-11-05 |
| F0-10 | Catat baseline isi database | ✅ | lihat tabel Data database di atas (questions 1007 / 993 PUBLISHED, TPA 0) | 2026-11-05 |

**Gate keluar:** semua ✅ dan baseline terisi.

> **Status Fase 0: ✅ SELESAI (2026-11-05).** Semua 10 task terbukti; lihat kolom
> Bukti. DB uji `webcat_test` sudah dimigrasi (38 tabel, 5 migrasi).

---

## Fase 1 — Alur CAT fungsional

### 1A — Blocker B1 (`order_index`)

| ID | Pekerjaan | Status | Bukti / Catatan | Tanggal |
| --- | --- | --- | --- | --- |
| F1-01 | Ubah unique index → index biasa | ✅ | `exam.prisma:181` → `@@index([sessionId, orderIndex])`; `pnpm db:validate` → "The schemas at prisma\schema are valid" | 2026-11-05 |
| F1-02 | Buat migrasi | ✅ | `migrations/20261105100000_fix_exam_session_subtest_order_index/migration.sql` (`DROP INDEX ..._key` + `CREATE INDEX ..._idx`) | 2026-11-05 |
| F1-03 | Terapkan migrasi ke DB dev | ✅ | `pnpm db:deploy` → "All migrations have been successfully applied" (6 migrasi); `pg_indexes` dev + `webcat_test` → `..._order_index_idx`, index unik lama hilang | 2026-11-05 |
| F1-04 | Sempitkan handler `P2002` | ✅ | `exam-session.service.ts:266-288`: hanya `exam_sessions_user_exam_date_active_key` / target `(user_id, exam_date)` → 409; selain itu `logger.error` + rethrow. `Logger` di L82 | 2026-11-05 |
| F1-05 | Unit test pemetaan error | ✅ | `test/exam-session-start.spec.ts` → 2 test lulus (P2002 lain diteruskan & dicatat; P2002 harian → 409) | 2026-11-05 |
| F1-06 | Verifikasi runtime start sesi | ✅ | `POST /exams/sessions` `{acknowledgeRules:true}` → **201**, 6 baris `exam_session_subtests` dengan `order_index` `[1,2,3,4,1,1]` | 2026-11-05 |

### 1B — Blocker B2 (deadlock transaksi)

| ID | Pekerjaan | Status | Bukti / Catatan | Tanggal |
| --- | --- | --- | --- | --- |
| F1-07 | `prepare(input, db)` + `loadFromDatabase(db)` | ✅ | `exam-question-source.ts:396` (`ExamDbClient`), `prepare` L413, `loadFromDatabase` L429; query memakai `db.question` | 2026-11-05 |
| F1-08 | `materializeQuestions` memakai `tx` | ✅ | `exam-session.service.ts:508` → `this.questionSource.prepare({...}, tx)` | 2026-11-05 |
| F1-09 | Naikkan batas transaksi | ✅ | `openSubtest` L480 `{timeout:20_000,maxWait:10_000}`; `autosave` L826 `{timeout:30_000,maxWait:10_000}` (ditemukan saat smoke: transaksi 5 s habis untuk 50 jawaban) | 2026-11-05 |
| F1-10 | Audit `$transaction` + root client | ✅ | Skrip audit paren-matching atas 22 `$transaction` interaktif di `apps/api/src` → **0** pemakaian `this.prisma.*` di dalam callback. `exam-question-projection.ts:111` & `exam-finalizer.service.ts:68` memakai bentuk array (bukan interaktif) | 2026-11-05 |
| F1-11 | (Opsional) materialisasi di luar transaksi | ➖ | Tidak diperlukan: `open` KECERMATAN (500 soal) selesai **3.495 ms** di dalam transaksi `tx` dengan batas 20 s | 2026-11-05 |

### 1C — Verifikasi alur manual

| ID | Pekerjaan | Status | Bukti / Catatan | Tanggal |
| --- | --- | --- | --- | --- |
| F1-12 | Start session | ✅ | 201; 6 subtes (PSIKOLOGI 4 + TPA 1 + TPK 1) | 2026-11-05 |
| F1-13 | Open KECERDASAN | ✅ | 201 dalam 3.318 ms; 100 baris `exam_session_questions` (position 1..100) | 2026-11-05 |
| F1-14 | Questions 2 halaman | ✅ | 200, 20 item, `meta.total=100`, `meta.nextCursor=20`; tidak ada `isCorrect`/`dimensionMap` di respons | 2026-11-05 |
| F1-15 | Autosave + replay `clientSeq` | ✅ | Kirim 2× `clientSeq=1` → dua 200; DB 1 event & 1 `client_seq` (idempoten). Smoke: 50 jawaban/batch, replay `clientSeq=0` OK untuk semua subtes | 2026-11-05 |
| F1-16 | Heartbeat + events | ✅ | `POST /heartbeat` → 201 (`remainingMs` valid); `POST /events` TAB_BLUR → 201 `accepted:1` | 2026-11-05 |
| F1-17 | Finish + result | ✅ | `POST /finish` → 201 dalam 3.426 ms; `GET /exams/sessions/:id/result` mengembalikan `ExamResultView` | 2026-11-05 |
| F1-18 | 6 subtes selesai | ✅ | `pnpm smoke:cat` → 6/6 COMPLETED (open 3,1–3,7 s; finish 1,6–6,7 s), tiap subtes 100% & lulus; sesi `COMPLETED`, total 100 (ambang 60) | 2026-11-05 |
| F1-19 | Cleanup data uji | ✅ | smoke menghapus sesinya sendiri: sisa `exam_sessions` 0, `exam_session_subtests` 0, `exam_session_questions` 0 | 2026-11-05 |

**Gate keluar:** ✅ `POST /sessions` dan `POST /open` berhasil untuk keenam subtes;
`exam_sessions` kembali 0 setelah cleanup.

> **Status Fase 1: ✅ SELESAI (2026-11-05).** B1 & B2 terbukti beres di runtime,
> bukan hanya di unit test. Bug tambahan ditemukan & diperbaiki: timeout 5 s pada
> transaksi `autosave` saat 50 jawaban dikirim ke Supabase remote.

---

## Fase 2 — Integration test & anti-regresi

| ID | Pekerjaan | Status | Bukti / Catatan | Tanggal |
| --- | --- | --- | --- | --- |
| F2-01 | Factory data uji | ✅ | `test/integration/factory.ts`: `createExamEngine()` merakit `ExamSessionService`/`ExamConfigService`/`ExamFinalizerService`/`ExamQuestionSource`/`ExamQuestionProjection`/`ResultsService`/`ProctoringService` + `DevAccessPolicy`/`MockQuestionPool`/`DevStorage` di atas `DATABASE_URL_TEST`; `createExamUser()` membuat peserta role USER status ACTIVE. Terbukti: `exam-start.spec.ts` F2-01 lulus | 2026-11-05 |
| F2-02 | Spec `startSession` | ✅ | `exam-start.spec.ts` → 3 stage, 6 subtes urut `[KECERDASAN, KEPRIBADIAN, KECERMATAN, PASS_HAND, TPA, TPK]`, subtes pertama `READY` sisanya `LOCKED`; `order_index` `[1,2,3,4,1,1]` (regresi B1) | 2026-11-05 |
| F2-03 | Spec kuota harian | ✅ | Sesi aktif kedua → 409 `EXAM_SESSION_ACTIVE_EXISTS`; sesi selesai di hari sama → 409 `EXAM_SESSION_ALREADY_TODAY`; hari berikutnya boleh | 2026-11-05 |
| F2-04 | Spec `openSubtest` KECERDASAN | ✅ | `exam-open.spec.ts` → status `ACTIVE`, 100 baris `exam_session_questions` position 1..100 `external_id` unik, durasi `ends_at − started_at` = 120 menit, buka 3× idempoten tetap 100 soal & 1 subtes ACTIVE; subtes berikutnya ditolak 409 `EXAM_STAGE_LOCKED` | 2026-11-05 |
| F2-05 | Spec `openSubtest` KECERMATAN 500 | ✅ | 500 soal termaterialisasi **2.587 ms** (< 5 s); subtes lain tetap 0 soal — jaring pengaman B2 | 2026-11-05 |
| F2-06 | Spec alur penuh | ✅ | `exam-flow.spec.ts` → start → open → questions 2 halaman (100 id unik, tanpa `isCorrect`/`dimensionMap`/`pairGroup`) → autosave 2×50 → heartbeat → proctoring `accepted:1` → finish KECERDASAN 100% lulus → result ditolak 409 selama sesi berjalan → 5 subtes sisa → sesi `COMPLETED` total 100 lulus → result + history | 2026-11-05 |
| F2-07 | Spec autosave idempoten | ✅ | Replay `clientSeq=7` → `saved` sama, `exam_answer_events` tetap 10 baris; `clientSeq=8` → 20 event (revisi) tetapi 100 baris soal | 2026-11-05 |
| F2-08 | Script `smoke:cat` | ✅ | `pnpm smoke:cat` dijalankan **2× berturut-turut** → keduanya `LULUS` exit 0, 6/6 subtes COMPLETED total 100, cleanup → sesi 0 / subtes 0 / soal 0 | 2026-11-05 |
| F2-09 | Job CI integrasi | ✅ | `.github/workflows/ci.yml` job `integration` (`needs: verify`, service `postgres:17`, migrasi ke `webcat_test`, `pnpm test:integration`) | 2026-11-05 |
| F2-10 | Dokumentasi cara menjalankan | ✅ | `docs/perbaikan/README-test.md` (setup DB, migrasi, perintah, cakupan test, troubleshooting) + tautan di `docs/README.md` | 2026-11-05 |

**Gate keluar:** ✅ `pnpm test:integration` **4 file / 14 test lulus** (70,9 s) dan
`pnpm smoke:cat` LULUS 2× berturut-turut dengan baseline bersih.

> **Status Fase 2: ✅ SELESAI (2026-11-05).** Bug B1 & B2 kini punya test
> anti-regresi yang menyentuh PostgreSQL nyata — bukan fake Prisma. `pnpm test`
> tetap tidak menyentuh database karena `test/integration/**` dikecualikan di
> `vitest.config.ts`.

---

## Fase 3 — Soal bergambar

**Status Fase 3: ✅ SELESAI (2026-11-05).** Rantai soal bergambar kini utuh:
`question_media` → snapshot per opsi → proyeksi ber-URL bertanda tangan →
runner tile → dinilai `KEYED_CORRECT`. Bukti end-to-end dihasilkan
`pnpm smoke:media` (lihat F3-31), bukan hanya unit test.

### 3A — Snapshot & materialisasi

| ID | Pekerjaan | Status | Bukti / Catatan | Tanggal |
| --- | --- | --- | --- | --- |
| F3-01 | `SnapshotMedia.optionId` + `assetId` | ✅ | `scoring/scoring.types.ts` — keduanya opsional; snapshot lama tetap valid | 2026-11-05 |
| F3-02 | `SnapshotOption.media` | ✅ | idem; `SnapshotMedia[]` wajib di TS, parser mengisi `[]` | 2026-11-05 |
| F3-03 | Parser toleran snapshot lama | ✅ | `parseQuestionSnapshot` + 4 test (`exam-question-source.spec.ts`): snapshot lama → `media: []`, media rusak dibuang | 2026-11-05 |
| F3-04 | `QuestionRow` memuat `optionId`/`assetId` | ✅ | `exam-question-source.ts` `QuestionRow.media` + `orderBy sortOrder` | 2026-11-05 |
| F3-05 | `mapDbQuestion` mengelompokkan media opsi | ✅ | media `OPTION` ber-`optionId` → opsi; tanpa `optionId` tetap masuk media soal (tidak hilang diam-diam) | 2026-11-05 |
| F3-06 | Builder fixture menerima media | ✅ | `FixtureMediaSpec` + `applyFixtureMedia()`; media opsi memaksa tipe `IMAGE_CHOICE` | 2026-11-05 |
| F3-07 | Unit test materialisasi media | ✅ | `apps/api/test/exam-question-source.spec.ts` — 14 test lulus | 2026-11-05 |

### 3B — Proyeksi

| ID | Pekerjaan | Status | Bukti / Catatan | Tanggal |
| --- | --- | --- | --- | --- |
| F3-08 | `optionView` mengirim media opsi | ✅ | `exam-question-projection.ts` — `optionView()` memetakan `SnapshotOption.media` | 2026-11-05 |
| F3-09 | Saring `EXPLANATION` dari DTO ujian | ✅ | `mediaViews()` hanya `role === 'STEM'`; test proyeksi memastikan pembahasan tidak bocor | 2026-11-05 |
| F3-10 | Cache URL media opsi | ✅ | `collectPaths()` mencakup media opsi; `projectMany()` cache per path | 2026-11-05 |
| F3-11 | Unit test proyeksi media | ✅ | `apps/api/test/exam-question-projection.spec.ts` — 8 test lulus | 2026-11-05 |

### 3C — Runner

| ID | Pekerjaan | Status | Bukti / Catatan | Tanggal |
| --- | --- | --- | --- | --- |
| F3-12 | Render media opsi | ✅ | `exam/[sessionId]/+page.svelte` — media opsi pada SINGLE/MULTI/MISSING | 2026-11-05 |
| F3-13 | Cabang `IMAGE_CHOICE` (tile) | ✅ | grid tile, klik menyimpan `optionIds` lewat `chooseOption()` | 2026-11-05 |
| F3-14 | CSS media & tile | ✅ | CSS responsif; ≤640 px tetap dua kolom (tidak satu kolom yang terlalu panjang) | 2026-11-05 |
| F3-15 | Satukan renderer via adapter | ✅ | `lib/exams/render-adapter.ts` + `ImageChoiceTiles.svelte` dipakai runner **dan** pratinjau admin; 12 test (`render-adapter.spec.ts` 7 + `image-choice-tiles.spec.ts` 5) | 2026-11-05 |
| F3-16 | Test komponen `ImageChoice` | ✅ | `image-choice.spec.ts` — 6 test (render via `svelte/server`) | 2026-11-05 |

### 3D — URL & penyajian berkas

| ID | Pekerjaan | Status | Bukti / Catatan | Tanggal |
| --- | --- | --- | --- | --- |
| F3-17 | Proyeksi pakai `buildMediaUrl(assetId)` | ✅ | `/api/v1/media/:id/content?sig=…`; runtime: 115 URL → 200 `image/webp` | 2026-11-05 |
| F3-18 | `DevStorage` URL benar-benar dilayani | ✅ | `DevStorageController` + `MediaService.contentByPath()`; 404 untuk path di luar `media/` | 2026-11-05 |
| F3-19 | TTL URL ≥ durasi subtes | ✅ | `EXAM_MEDIA_TTL_SECONDS = 7_200` (120 menit) | 2026-11-05 |
| F3-20 | Test akses media 200 | ✅ | `media-access.spec.ts` — 13 test; runtime kontrol negatif `sig` rusak → 404 | 2026-11-05 |

### 3E — Konten bergambar

| ID | Pekerjaan | Status | Bukti / Catatan | Tanggal |
| --- | --- | --- | --- | --- |
| F3-21 | Aset gambar figural WebP | ✅ | **Deviasi:** aset digenerate dari SVG (`seed/media/figural.ts`, 7 keluarga) lalu dikonversi WebP oleh `storeBuffer`; tidak ada biner di repo. 235 aset → 104 baris `media_assets` (dedupe checksum) | 2026-11-05 |
| F3-22 | `seedMediaAssets` (dedupe) | ✅ | Seed 2× → run kedua `baru 0`; `media_assets = 104` | 2026-11-05 |
| F3-23 | 30–40 `IMAGE_CHOICE` (Kecerdasan) | ✅ | 44 soal figural Kecerdasan (`PSI-KEC-FIG-*`), semua PUBLISHED | 2026-11-05 |
| F3-24 | 15 soal figural TPA | ✅ | 15 soal `PSI-TPA-FIG-*`; `db:stats` TPA PUBLISHED = 15 | 2026-11-05 |
| F3-25 | Seed menulis `question_media` | ✅ | `question_media = 235` baris; seed menghapus lalu menulis ulang (unik dengan `option_id NULL`) | 2026-11-05 |
| F3-26 | Test kelengkapan media soal | ✅ | `question-seed.spec.ts` — 25 test; hanya `DEMO-TPA-IMG-001` (ARCHIVED) tanpa media | 2026-11-05 |

### 3F — Validasi & UI admin

| ID | Pekerjaan | Status | Bukti / Catatan | Tanggal |
| --- | --- | --- | --- | --- |
| F3-27 | Validasi `IMAGE_CHOICE` wajib media | ✅ | `questionShapeIssues()` menolak tanpa media STEM dan tanpa media untuk setiap label opsi | 2026-11-05 |
| F3-28 | Validasi dimensi min 200×200 | ✅ | `MEDIA_MIN_DIMENSION` di `MediaService.upload()` → 422; `storeBuffer` sengaja dikecualikan (import + seed) | 2026-11-05 |
| F3-29 | Indikator opsi belum bergambar di form admin | ✅ | `draftMediaIssues()` + badge "⚠ belum bergambar" di `QuestionForm.svelte` | 2026-11-05 |
| F3-30 | Test kontrak + upload | ✅ | `packages/contracts/test/questions.spec.ts` (6) + `apps/api/test/media-upload.spec.ts` (5) | 2026-11-05 |
| F3-31 | Uji visual runner dengan soal figural | ✅ | `pnpm smoke:media`: 30 soal figural terpilih, 23 `IMAGE_CHOICE`, 115 URL → 200, artefak `docs/perbaikan/fase-3-bukti/` | 2026-11-05 |

**Gate keluar:** ✅ 59 `IMAGE_CHOICE` PUBLISHED (44 Kecerdasan + 15 TPA);
soal figural tampil di runner dan dinilai benar.

> **Perbaikan di luar daftar tugas (ditemukan saat F3-31).** `loadFromDatabase`
> memakai `orderBy publicCode asc` + `take: count`, sehingga 44 soal figural
> yang kodenya berakhiran `-FIG-` **tidak pernah** masuk sesi (pool 144, kuota
> 100). Diganti dengan `spreadSelection()` — sampling merata dengan offset
> deterministik dari `subtestSessionId` — plus 5 test regresi dan skrip
> `pnpm pool:coverage` untuk memantau cakupan tiap subtes.

---

## Fase 4 — Bank soal & konten

| ID | Pekerjaan | Status | Bukti / Catatan | Tanggal |
| --- | --- | --- | --- | --- |
| F4-01 | Jalankan `pnpm db:seed` | ✅ | Seed 2×: run-2 "baru 0, diperbarui 1052" → idempoten. Total **1.159** baris `questions`; 1.145 soal bank (KECERDASAN 147, KEPRIBADIAN 143, KECERMATAN 500, PASS_HAND 150, TPA 105, TPK 100) | 2026-11-05 |
| F4-02 | Verifikasi kuota per subtes | ✅ | Query kuota → **0 baris** kurang: 147/100, 143/140, 500/500, 150/150, 105/100, 100/100 | 2026-11-05 |
| F4-03 | Bank TPA 100 soal | ✅ | `seed/questions/tpa.ts`: 87 `SINGLE_CHOICE` (verbal 40 / numerik 35 / penalaran 12) + 3 `MULTI_CHOICE`; + 15 figural Fase 3 = **105 PUBLISHED** | 2026-11-05 |
| F4-04 | Daftarkan TPA di seed | ✅ | 4 kategori `tpa/{verbal,numerik,penalaran,figural}`; `buildTpaChoices()` + `buildTpaMultiChoices()` masuk `buildSeedQuestions()` | 2026-11-05 |
| F4-05 | Tambah `MULTI_CHOICE` | ✅ | 6 soal: 3 KECERDASAN (`PSI-KEC-M-*`) + 3 TPA; DB `MULTI_CHOICE` = 6, `IMAGE_CHOICE` = 44. Strategi simpan `MULTI_CORRECT_PARTIAL` (metadata), scoring sesi tetap `KEYED_CORRECT` | 2026-11-05 |
| F4-06 | Test `pair_group` Kepribadian | ✅ | `question-seed.spec.ts` 32 test: pair genap + ≥1 reverse; 3 dimensi dengan rasio reverse 20–60% | 2026-11-05 |
| F4-07 | Aktifkan `QUESTION_POOL=db` | ✅ | `.env` + `.env.example` → `db`; API dijalankan dari `dist` (tanpa watch) lalu `smoke:cat` **LULUS** (6/6 subtes COMPLETED, total 100 vs ambang 60). Query: `snapshot->>'sourceId' LIKE 'DEV-%'` = **0 dari 740** baris; prefix `PSI` = 740 | 2026-11-05 |
| F4-08 | Hapus/perjelas fallback fixture | ✅ | `resolve()` + `PreparedQuestions`; `db` → 503 `EXAM_POOL_INSUFFICIENT` (`details.subtestCode/required/available/missing`), `dev` → `logger.warn`; 4 test. Env tetap `db` | 2026-11-05 |
| F4-09 | Health check kuota | ✅ | `PoolStatus.problems[]` (`subtestCode/required/available/missing/message`); `ExamEligibility.poolProblems` + sub-daftar di `/exam`; `startSession` → `EXAM_POOL_INSUFFICIENT` dengan pesan spesifik; 7 test | 2026-11-05 |

**Gate keluar:** ✅ semua subtes PUBLISHED & kuota penuh; `QUESTION_POOL=db` aktif;
tidak ada lagi fallback senyap ke fixture.

### Verifikasi penutup Fase 4 (5 Nov 2026)

| Perintah | Hasil |
| --- | --- |
| `pnpm db:seed` (3×) | ✅ run-3 "baru 0, diperbarui 1145"; 1.159 `questions`, 235 `question_media`, 104 `media_assets` stabil |
| `pnpm --filter @webcat/api test` | ✅ 34 berkas / **320** test |
| `pnpm test:integration` | ✅ 4 berkas / **14** test |
| `pnpm pool:coverage` | ✅ 6/6 subtes "bank soal" (DB=kuota), 0 fixture |
| `pnpm smoke:cat` | ✅ 6/6 subtes COMPLETED, total 100, `DEV-*` = 0 |
| `pnpm smoke:media` | ✅ 29 figural, 23 `IMAGE_CHOICE`, 115 URL → 200, `sig` rusak → 404 |

> **Perbaikan di luar daftar tugas (ditemukan saat F4-07).** Dua hal yang bukan
> bug produk tetapi menghalangi verifikasi:
> 1. Test suite gagal acak di `figural-media.spec.ts` (`Test timed out in
>    5000ms`) karena render WebP via `sharp` berebut CPU saat suite paralel →
>    `vitest.config.ts` kini `testTimeout: 30_000`.
> 2. Setelah `.env` menjadi `db`, test integrasi gagal `EXAM_POOL_INSUFFICIENT`
>    karena DB uji di-`TRUNCATE`. Factory test kini memaksa `QUESTION_POOL=dev`
>    secara eksplisit — tidak lagi mewarisi `.env`.

---

## Fase 5 — Gap fitur

### P1

| ID | Pekerjaan | Status | Bukti / Catatan | Tanggal |
| --- | --- | --- | --- | --- |
| F5-01 | Pulihkan `/pricing` | ✅ | Dipulihkan dari `e0b23fd^` (`(site)/pricing/*`, `PlanCard.svelte`), migrasi `$app/stores`→`$app/state`, tautan nav dikembalikan. Bukti runtime dua arah: DB `MONTHLY=151000` → halaman `Rp 151.000` (149.000 hilang), lalu revert `149000` → `Rp 149.000` (151.000 hilang). 6 test `page.server.spec.ts` + 3 test `PlanCard.spec.ts` | 2026-11-05 |
| F5-02 | CRUD plan admin | ✅ | `subscription_plans.deleted_at` (migrasi `20261105140000_f5_02_plan_soft_delete`), `DELETE /admin/plans/:id` + `POST /:id/restore` (wajib alasan), `GET ?includeDeleted=true`. UI `[panel]/plans` kini CRUD penuh (form + tab Arsip), sebelumnya baca-saja & memakai endpoint publik. Audit `plan.create/update/delete/restore` | 2026-11-05 |
| F5-03 | Detail user admin | ✅ | `GET /admin/users/:id/overview` — satu request berisi profil, verifikasi, langganan aktif + riwayat, agregat & riwayat ujian, agregat & riwayat pembayaran; agregat dihitung di DB. `GET /admin/transactions?userId=` untuk riwayat pembayaran peserta. Halaman `[panel]/users/[id]` + tautan dari daftar. 13 test `users-overview.spec.ts` + 2 test filter `payments.service.spec.ts`. Bukti runtime 18/18 cek, semua angka cocok dengan query DB | 2026-11-05 |
| F5-04 | Detail transaksi admin | ➖ | Ditunda: payment gateway juga ditunda. Saat ini langganan diberikan manual oleh admin (buat akun + langganan, atau grant untuk akun Google), jadi detail transaksi/refund belum relevan. Aksi `mark-paid`/`refund` sudah ada dan tercatat di audit bila nanti gateway aktif | 2026-11-05 |
| F5-05 | Worker job queue terjadwal | ✅ | `vercel.json` sudah memanggil `process-jobs` tiap menit + guard `CRON_SECRET`; ditambahkan `JobQueueService.stats()`, `GET /internal/cron/backlog` (pending/running/failed/umur tertua + threshold + alert), dan `logger.warn` saat backlog melewati `JOB_BACKLOG_ALERT_THRESHOLD` (default 100). `process-jobs` kini mengembalikan `details.backlog`/`backlogAlert`. 8 test baru; bukti runtime 12/12 | 2026-11-05 |
| F5-06 | Rate limit API | ⬜ | — | — |
| F5-07 | CSRF + CSP | ⬜ | — | — |
| F5-08 | Dashboard peserta dari API | ⬜ | — | — |
| F5-09 | Dokumentasi API produksi | ⬜ | — | — |

#### Verifikasi penutup F5-01 (5 Nov 2026)

| Perintah / bukti | Hasil |
| --- | --- |
| `pnpm --filter @webcat/web test` | ✅ 6 berkas / **45** test (termasuk 6 test `page.server.spec.ts`, 3 `PlanCard.spec.ts`) |
| `svelte-check --tsconfig ./tsconfig.json` | ✅ **0 error**, 64 warning (hanya `dashboard/+page.svelte`) |
| `eslint src --max-warnings 0` | ✅ exit 0 |
| `GET /pricing` (API `dist` + vite dev) | ✅ **200**, 53.729 byte, `cache-control: public, max-age=60, stale-while-revalidate=300` |
| Harga di HTML | ✅ `Rp 49.000`, `Rp 89.000`, `Rp 149.000`, `Rp 399.000` — semuanya cocok dengan query `subscription_plans` |
| Kartu terender | ✅ `plan-WEEKLY`, `plan-BIWEEKLY`, `plan-MONTHLY`, `plan-QUARTERLY` (TRIAL_3D → banner, CUSTOM tidak jadi kartu) |
| Uji propagasi DB→halaman | ✅ `MONTHLY=151000` → `Rp 151.000` muncul, `Rp 149.000` hilang; revert `149000` → kebalikan. DB akhir: 0/49000/89000/**149000**/399000/0 |
| `?plan=MONTHLY` | ✅ kelas `plan--selected` ada |
| Tautan nav | ✅ "Harga & Paket" → `/pricing` |

> **Dua bug nyata yang ikut diperbaiki** (keduanya ditemukan justru karena uji
> propagasi DB di atas):
> 1. `apps/web/src/lib/api/client.ts` — `promise.finally()` pada dedup GET
>    membuat promise turunan yang ditolak tanpa penangan, sehingga setiap GET
>    gagal memunculkan `unhandled rejection` (terbukti di test 502). Diganti
>    `void promise.then(release, release)`.
> 2. `+page.server.ts` memakai memory cache klien API (15 dtk + SWR 60 dtk),
>    jadi harga baru bisa tertahan ~75 dtk. Kini `cacheTtlMs: 0`; dijaga test
>    regresi "harga baru langsung terlihat".

#### Verifikasi penutup F5-02 (5 Nov 2026)

| Perintah / bukti | Hasil |
| --- | --- |
| `prisma migrate deploy` | ✅ migrasi `20261105140000_f5_02_plan_soft_delete` diterapkan; `\d subscription_plans` memuat `deleted_at` + `subscription_plans_deleted_at_idx` |
| `vitest run test/billing/plans.service.spec.ts` | ✅ **15/15** (termasuk soft delete, restore, tolak paket terarsip, fallback pricing) |
| `vitest run` (API penuh) | ✅ 34 berkas / **329** test |
| `vitest run` (web penuh) | ✅ 7 berkas / **57** test (termasuk 11 `plans-draft.spec.ts`) |
| `tsc --noEmit` (API) · `tsc -p tsconfig.build.json` | ✅ exit 0 keduanya |
| `svelte-check --tsconfig ./tsconfig.json` | ✅ **0 error**, 64 warning (hanya `dashboard/+page.svelte`) |
| `eslint src --max-warnings 0` | ✅ exit 0 |
| Uji HTTP nyata (API `dist` + DB dev) | ✅ **16/16** cek: create → 201 dan langsung muncul di `GET /plans`; `PATCH` harga 123000→133000 langsung terlihat; `DELETE` → hilang dari `/admin/plans` default, tetap ada di `?includeDeleted=true`, hilang dari `GET /plans` **dan** HTML `/pricing`; `PATCH` paket terhapus → 409 `BILLING_PLAN_ARCHIVED`; kode dipakai ulang → 409 `BILLING_PLAN_CODE_EXISTS`; `POST /restore` → kembali muncul |
| Audit `audit_logs` | ✅ 5 baris `plan.*` untuk paket uji: `plan.create`, `plan.update`, `plan.delete` (2×), `plan.restore`, masing-masing dengan `reason` di `metadata` |
| DB akhir | ✅ baris uji dihapus fisik (0 referensi `transactions`/`subscriptions`); tabel kembali 6 paket `deleted_at` NULL, harga 0/49000/89000/149000/399000/0 |

> **Kenapa soft delete, bukan `status = ARCHIVED`.** `status` sudah dipakai untuk
> alur editorial (DRAFT → ACTIVE → ARCHIVED). Menghapus lewat `status` akan
> membuat "arsip" dan "dihapus" tak terbedakan, padahal hanya yang terakhir yang
> harus hilang dari `/pricing` dan dari daftar default admin.
>
> **Kenapa `DELETE` membawa body.** Alasan hapus wajib masuk audit; body JSON
> lebih aman daripada query string yang sering dipangkas log proxy.

#### Verifikasi penutup F5-03 (5 Nov 2026)

| Perintah / bukti | Hasil |
| --- | --- |
| `vitest run test/users-overview.spec.ts` | ✅ **13/13** (profil, langganan aktif vs kedaluwarsa, agregat ujian, sesi di-void, pembayaran) |
| `vitest run test/billing/payments.service.spec.ts` | ✅ **25/25** (termasuk 2 test filter `userId`) |
| `vitest run` (API penuh) | ✅ 35 berkas / **344** test |
| `vitest run` (web penuh) | ✅ 8 berkas / **70** test (termasuk 13 `user-detail.spec.ts`) |
| `tsc --noEmit` (API) · `tsc -p tsconfig.build.json` | ✅ exit 0 keduanya |
| `svelte-check --tsconfig ./tsconfig.json` | ✅ **0 error, 0 warning** (474 berkas) |
| `eslint src --max-warnings 0` (API & web) | ✅ exit 0 keduanya |
| Uji HTTP nyata (API `dist` + DB dev) | ✅ **18/18** cek. `GET /admin/users/:id/overview` → 200; sesi 1 = DB 1, skor 100 = DB 100, transaksi 1 = DB 1, total bayar Rp149.000 = DB; langganan habis 2027-01-04. `?userId=` → 1 baris milik peserta, peserta lain 0 baris; UUID invalid → 422 `COMMON_VALIDATION_FAILED`; tanpa token → 401; id asing → 404 `USER_NOT_FOUND` |
| Halaman detail | ✅ SSR `/admin/users/:id` dengan cookie sesi nyata → **200**, 33.892 byte (bukan redirect login) |
| Data pembayaran nyata | ✅ checkout `MONTHLY` → `WC-MW3JCNY9-PGY8CJ`, lalu `POST /payments/fake/settle` → `SUCCESS` / Rp149.000; dipakai sebagai bukti lalu dibersihkan |
| DB akhir | ✅ sesi uji dihapus (0 `exam_sessions`), transaksi & langganan uji dihapus (0 `transactions`, kembali 3 `subscriptions` baseline) |

> **Flaky test ikut diperbaiki.** `google-oauth.spec.ts` menamper tanda tangan
> dengan `state.slice(0, -1) + 'A'`; bila HMAC kebetulan berakhiran `A`
> (≈1/64) string tidak berubah dan `verifyState` mengembalikan `true`. Kini
> karakter terakhir dijamin berbeda.

#### Verifikasi penutup F5-05 (5 Nov 2026)

| Perintah / bukti | Hasil |
| --- | --- |
| `vitest run test/cron-backlog.spec.ts` | ✅ **8/8** (stats, ambang, alert, guard) |
| `vitest run` (API penuh) | ✅ 36 berkas / **352** test |
| `vitest run` (web penuh) | ✅ 8 berkas / **70** test |
| `tsc --noEmit` · `tsc -p tsconfig.build.json` | ✅ exit 0 keduanya |
| `svelte-check --tsconfig ./tsconfig.json` | ✅ **0 error, 0 warning** (474 berkas) |
| `eslint src --max-warnings 0` (API & web) | ✅ exit 0 keduanya |
| `apps/api/vercel.json` | ✅ `process-jobs` + `finalize-subtests` tiap menit, `expire-subscriptions`/`cleanup` harian; guard memakai `Authorization: Bearer $CRON_SECRET` |
| Uji HTTP nyata (API `dist` + DB dev) | ✅ **12/12** cek. Tanpa/salah secret → 401; backlog 6 = DB 6; umur tertua **899 detik**; ambang 5 → `alert: true`; `POST /process-jobs` → **201**, klaim 6 job, backlog turun ke 0; 6 baris `COMPLETED` |
| Log alert | ✅ 2 baris `WARN: Backlog job melewati ambang` di log API saat backlog melewati ambang |
| DB akhir | ✅ 0 baris `f5-05-proof`; API kembali memakai ambang default (100) |

### P2

| ID | Pekerjaan | Status | Bukti / Catatan | Tanggal |
| --- | --- | --- | --- | --- |
| F5-10 | Autosave IndexedDB + `sendBeacon` | ⬜ | — | — |
| F5-11 | Preload 2 soal berikutnya | ⬜ | — | — |
| F5-12 | Zoom/pan gambar figural | ⬜ | — | — |
| F5-13 | Flag anomali waktu jawab | ⬜ | — | — |
| F5-14 | Import ZIP gambar end-to-end | ⬜ | — | — |
| F5-15 | Varian WebP/thumbnail | ⬜ | — | — |
| F5-16 | E2E Playwright alur ujian | ⬜ | — | — |

---

## Log Harian

Format entri:

```
### YYYY-MM-DD
**Dikerjakan:** F1-01, F1-02
**Hasil:** migrasi dibuat & diterapkan
**Bukti:** `prisma migrate status` → up to date
**Hambatan:** —
**Berikutnya:** F1-04
```

### 2026-11-05 — Fase 5: F5-03 selesai

**Dikerjakan:** F5-03
**Hasil:** Fase 5 ✅ 3/16. Admin bisa membuka detail peserta dan langsung
melihat berapa kali ikut ujian, skor terbaik/rata-rata, kapan langganan habis,
dan berapa total yang sudah dibayar — semuanya dari satu endpoint. Tracker:
**82/95 = 86%**.

**Bukti:**

- `GET /admin/users/:id/overview` menggabungkan profil, verifikasi, langganan
  aktif + riwayat, agregat & riwayat ujian, agregat & riwayat pembayaran.
  Agregat dihitung di DB (`count`/`aggregate`); sesi yang di-void dikecualikan.
- `GET /admin/transactions?userId=` menyaring riwayat pembayaran per peserta
  (2 test baru di `payments.service.spec.ts`).
- Halaman `[panel]/users/[id]` + tautan dari daftar; helper label di
  `lib/admin/user-detail.ts` (13 test). `cacheTtlMs: 0` agar angka segar.
- Uji HTTP nyata **18/18**: angka overview cocok dengan query DB, filter
  `userId` tidak membocorkan peserta lain, otorisasi 401/404/422 benar, dan
  SSR halaman detail 200 dengan cookie sesi nyata.
- Ikut memperbaiki flaky `google-oauth.spec.ts` (tamper tanda tangan bisa
  menghasilkan string yang sama bila HMAC berakhiran `A`).
- DB uji dibersihkan: 0 sesi, 0 transaksi, 3 langganan baseline.

**Hambatan:** —
**Berikutnya:** F5-04 ditunda (gateway ditunda) → F5-05.

### 2026-11-05 — Fase 5: F5-05 selesai

**Dikerjakan:** F5-05
**Hasil:** Fase 5 ✅ 5/16. Penjadwal & guard cron sudah ada; ditambahkan metrik
backlog + alert. Tracker: **84/95 = 88%**.

**Bukti:**

- `GET /internal/cron/backlog` mengembalikan `pending`, `running`, `failed`,
  `oldestPendingAgeSeconds`, `threshold`, dan `alert`.
- `process-jobs` menyertakan `details.backlog` dan `details.backlogAlert`.
- Ambang `JOB_BACKLOG_ALERT_THRESHOLD` (default 100) memicu
  `logger.warn('Backlog job melewati ambang', …)`.
- Uji HTTP **12/12**: 401 tanpa/salah secret, backlog 6 = DB 6, umur tertua
  899 detik, alert true saat ambang 5, `process-jobs` 201 memproses 6 job →
  pending 0.
- 8 test baru (`cron-backlog.spec.ts`); API 36 berkas / 352 test.
- DB uji dibersihkan; API kembali memakai ambang default.

**Hambatan:** —
**Berikutnya:** F5-06 — rate limit API.

### 2026-11-05 — Fase 5: F5-04 ditunda

**Dikerjakan:** keputusan cakupan F5-04
**Hasil:** F5-04 (detail transaksi + bukti bayar) ditunda karena payment
gateway ditunda. Fase 5 tracker: **83/95 = 87%** (F5-04 dihitung `➖`).

**Alasan:** langganan saat ini diberikan manual oleh admin — akun dibuat
dengan langganan, atau akun Google yang sudah ada di-grant langganan lalu
email dikirim ulang. Belum ada transaksi yang perlu diverifikasi/direfund.

**Bukti:** `docs/perbaikan/fase-5-gap-fitur.md` §F5-04; `pnpm progress` → 83/95.
**Hambatan:** —
**Berikutnya:** F5-05 — worker job queue terjadwal.

### 2026-11-05 — Fase 5: F5-02 selesai

**Dikerjakan:** F5-02
**Hasil:** Fase 5 ✅ 2/16. Panel admin kini bisa membuat, mengubah, menghapus
(soft), dan memulihkan paket; semua perubahan langsung terlihat di `/pricing`
dan tercatat di audit. Tracker: **81/95 = 85%**.

**Bukti:**

- Migrasi `20261105140000_f5_02_plan_soft_delete`: `subscription_plans.deleted_at`
  + `subscription_plans_deleted_at_idx`, diterapkan ke DB dev. Diverifikasi
  dengan `\d subscription_plans`.
- API: `DELETE /admin/plans/:id` (wajib `reason`) dan
  `POST /admin/plans/:id/restore`, plus `GET /admin/plans?includeDeleted=true`.
  Seluruh jalur baca publik (`listPublic`, `findPublicByCode`,
  `requirePurchasable`, `requireAnyByCode`) menyaring `deletedAt: null`.
- Web: `[panel]/plans/+page.svelte` ditulis ulang dari baca-saja (yang bahkan
  memanggil endpoint publik) menjadi CRUD penuh dengan tab Paket/Arsip.
  Logika form murni dipisah ke `$lib/admin/plans-draft.ts` (11 test).
- Uji HTTP nyata 16/16: create/patch/delete/restore, propagasi ke `GET /plans`
  dan HTML `/pricing`, plus dua penolakan yang benar (`PATCH` paket terhapus →
  409 `BILLING_PLAN_ARCHIVED`, kode terarsip dipakai ulang → 409
  `BILLING_PLAN_CODE_EXISTS`).
- Audit: `plan.create`, `plan.update`, `plan.delete`, `plan.restore` — 5 baris
  terbukti ada di `audit_logs` dengan `reason` di `metadata`.
- Gerbang mutu: API 329 test / web 57 test, `tsc` 0, `svelte-check` 0 error,
  `eslint --max-warnings 0` exit 0.

**Keputusan penting:**

1. Hapus = soft delete. `transactions.plan_id` & `subscriptions.plan_id`
   memakai `ON DELETE SET NULL`, jadi hapus fisik akan menghapus jejak paket
   pada riwayat pembayaran.
2. `code` tetap UNIQUE termasuk baris terhapus → kode yang pernah dipakai
   transaksi tidak bisa dipakai ulang; admin diarahkan memakai *restore*.
3. Fallback `DEFAULT_PLANS` hanya saat tabel benar-benar kosong, supaya
   "hapus semua paket" menghasilkan pricing kosong (bukan harga default).
4. `plans.seed.ts` ikut mengosongkan `deletedAt` supaya `db:seed` idempoten dan
   test integrasi tidak mewarisi paket terarsip (`subscription_plans` tidak
   di-truncate oleh helper test).

**Hambatan:** — (catatan: ada dua perubahan working tree yang bukan hasil kerja
sesi ini — `apps/api/package.json` skrip `dev` dan `apps/api/scripts/dev-server.mjs`
— sengaja tidak disentuh/di-commit.)

**Berikutnya:** F5-03 / F5-04 — detail user & transaksi admin.

---

### 2026-11-05 — Fase 5 dimulai (F5-01)

**Dikerjakan:** F5-01
**Hasil:** Fase 5 ✅ 1/16. Halaman `/pricing` pulih dan kembali memakai harga dari
DB. Tracker: **80/95 = 84%**.

**Bukti:**

- Dipulihkan dengan `git checkout e0b23fd^ -- "apps/web/src/routes/(site)/pricing" apps/web/src/lib/components/PlanCard.svelte`
  (bukan `git revert`), lalu migrasi `$app/stores`→`$app/state` dan penambahan
  tautan nav "Harga & Paket".
- Test: `vitest` **6 berkas / 45 test**; `svelte-check` **0 error**;
  `eslint src --max-warnings 0` exit 0.
- Runtime (API dari `dist` + vite dev `--strictPort`): `GET /pricing` **200**,
  53.729 byte, 4 kartu (`WEEKLY`/`BIWEEKLY`/`MONTHLY`/`QUARTERLY`), banner
  `Coba 3 Hari`, `CUSTOM` tidak muncul.
- Propagasi DB dua arah: `MONTHLY=151000` → `Rp 151.000` (149.000 hilang);
  revert `149000` → `Rp 149.000` (151.000 hilang). DB akhir
  0/49000/89000/**149000**/399000/0.

**Bug tambahan ditemukan & diperbaiki:**

1. `apps/web/src/lib/api/client.ts` — `promise.finally()` pada dedup GET
   menghasilkan unhandled rejection setiap kali GET gagal.
2. `+page.server.ts` — memory cache klien API (15 dtk + SWR 60 dtk) menahan
   perubahan harga ~75 dtk; kini `cacheTtlMs: 0`.

**Hambatan:** —
**Berikutnya:** F5-02 — CRUD plan admin.

---

### 2026-11-05 — Fase 2 selesai

**Dikerjakan:** F2-01 … F2-10
**Hasil:** Fase 2 ✅ (10/10). B1 & B2 kini dijaga test yang menyentuh PostgreSQL
nyata, bukan fake Prisma.

**Bukti:**

- `pnpm test:integration` → **4 file / 14 test lulus** (70,9 s) terhadap
  `webcat_test`.
- `exam-start.spec.ts`: 3 stage / 6 subtes urut benar, `order_index`
  `[1,2,3,4,1,1]` (regresi B1), `READY` + 5×`LOCKED`, kuota harian 409.
- `exam-open.spec.ts`: 100 soal + timer 120 menit + buka 3× idempoten;
  KECERMATAN 500 soal **2.587 ms** (< 5 s) — jaring pengaman B2.
- `exam-flow.spec.ts`: alur penuh sampai `result` + `history`; replay
  `clientSeq` tidak menduplikasi (10 → 10 event, `clientSeq` baru → 20).
- `pnpm smoke:cat` **2× berturut-turut LULUS** (exit 0), cleanup → sesi 0,
  subtes 0, soal 0.
- `.github/workflows/ci.yml` job `integration` (postgres:17) + dokumentasi
  `docs/perbaikan/README-test.md`.

**Temuan:** `exam_sessions_user_exam_date_active_key` bersifat parsial
(`WHERE voided_at IS NULL`), jadi sesi yang di-*void* tidak memblokir sesi baru —
perilaku ini sekarang terkunci lewat test kuota harian.

**Hambatan:** Docker tidak tersedia di mesin lokal; test integrasi memakai
database Supabase kedua (`webcat_test`). CI memakai `postgres:17` sehingga
tidak terpengaruh.

**Berikutnya:** Fase 3 — soal bergambar (F3-01 … F3-31).

---

### 2026-11-05 — Fase 1 selesai

**Dikerjakan:** F1-01 … F1-19
**Hasil:** Fase 1 ✅ (19/19). B1 & B2 beres dan terbukti di runtime. Peserta bisa
menyelesaikan keenam subtes sampai hasil akhir.

**Bukti:**

- `POST /exams/sessions` → **201**, 6 baris `exam_session_subtests` `order_index`
  `[1,2,3,4,1,1]` (B1 hilang).
- `POST .../open` KECERDASAN → **201** dalam 3.673 ms, 100 soal termaterialisasi (B2 hilang).
- `pnpm smoke:cat` → LULUS: 6/6 subtes COMPLETED, tiap subtes 100% & lulus,
  sesi `COMPLETED` total 100 (ambang 60), lalu cleanup → `exam_sessions` 0.
- Autosave idempoten: kirim 2× `clientSeq=1` → 1 baris `exam_answer_events`.
- `pg_indexes` dev & `webcat_test` → `exam_session_subtests_session_id_order_index_idx`.

**Bug tambahan ditemukan & diperbaiki:** transaksi `autosave` melewati batas
default Prisma 5 s saat 50 jawaban dikirim ke Supabase remote (error
`Transaction API error: Transaction not found`). Batas dinaikkan ke 30 s dan
diberi alasan di komentar.

**Hambatan:** —
**Berikutnya:** Fase 2 — F2-01 (factory data uji) → F2-09 (job CI).

---

### 2026-11-05 — Fase 0 selesai

**Dikerjakan:** F0-01 … F0-10
**Hasil:** Fase 0 ✅ (10/10). Baseline gerbang mutu dan isi DB tercatat; DB uji
`webcat_test` siap; helper integration test + script npm aktif.

**Bukti:**

- `pnpm lint` → 6 task sukses · `pnpm typecheck` → 6 task, 0 error (64 warning
  svelte-check) · `pnpm test` → 5 task, API 29 file/251 test · `pnpm build` → 3 task.
- `pnpm test:integration` → 1 file / 2 test lulus terhadap `webcat_test`
  (38 tabel, 5 migrasi).
- `pnpm smoke:cat` → exit 0.
- `pnpm db:stats` → questions 1007 (993 PUBLISHED), TPA 0 PUBLISHED,
  duplikat `(session_id, order_index)` = 0.
- Commit seed `939eba3`; branch `fix/cat-fase-1` aktif.

**Hambatan:** Docker tidak tersedia → DB uji dibuat sebagai database terpisah
di project Supabase yang sama (sesuai instruksi memakai `.env`).

**Berikutnya:** F1-01 → F1-02 → F1-03 (fix B1), lalu F1-07 → F1-08 (fix B2).

---

### 2026-11-05

**Dikerjakan:** audit + penyusunan rencana (belum ada perubahan kode)
**Hasil:**

- Membuktikan 2 blocker CAT lewat uji runtime: B1 (`P2002` pada
  `exam_session_subtests`) dan B2 (deadlock transaksi `openSubtest`).
- Membuktikan rantai soal bergambar putus di 4 titik: snapshot, materialisasi,
  proyeksi, dan runner. Ditambah 3 masalah penyajian berkas media.
- Menyusun runbook per fase (`docs/perbaikan/`), `BREAKDOWN-FASE.md`,
  `RENCANA-PERBAIKAN.md`, dan tracker ini.

**Bukti:**

- `POST /exams/sessions` → 409 `EXAM_SESSION_ALREADY_TODAY`; `exam_sessions` = 0 baris.
- `POST .../open` → 500 `Transaction already closed ... timeout 5000 ms`.
  Uji terukur: transaksi-dalam-transaksi 186 ms OK; root-di-dalam-transaksi 4178 ms timeout.
- DB: `media_assets` 0, `question_media` 0, soal PUBLISHED 0.

**Hambatan:** subagent tidak tersedia (kuota), verifikasi dilakukan manual.
**Berikutnya:** F0-01 → F0-02 → F1-01.

---

## Keputusan yang Perlu Diambil

| # | Pertanyaan | Opsi | Keputusan | Tanggal |
| --- | --- | --- | --- | --- |
| 1 | Strategi perbaikan `order_index` | (A) index non-unik / (B) `orderIndex` global | **A** (disarankan) | — |
| 2 | Materialisasi soal | (A) dalam tx dengan `prepare(tx)` / (B) di luar tx | **A** dulu, B bila masih lambat | — |
| 3 | Penyajian media | (A) unggah ke bucket / (B) `/media/:id/content` | **B** (disarankan) | — |
| 4 | Uji alur penuh 6 subtes | (A) jawab benar / (B) flag dev bypass passing | belum diputuskan | — |
| 5 | Commit seed bank soal yang belum masuk git | (A) commit terpisah / (B) buang | **A** | — |
| 6 | DB uji integrasi | (A) Supabase kedua / (B) Docker Postgres lokal | **Supabase, DB terpisah `webcat_test`** di project yang sama — Docker tidak tersedia, `.env` dipakai apa adanya | 2026-11-05 |
| 7 | Renderer runner vs admin | (A) satukan via adapter / (B) dua jalur | belum diputuskan | — |

---

## Ringkasan Bukti Teknis

Rujukan cepat agar konteks tidak hilang bila sesi baru dimulai.

| Temuan | Lokasi | Bukti |
| --- | --- | --- |
| B1 index unik | `apps/api/prisma/schema/exam.prisma:181` | `@@unique([sessionId, orderIndex])` vs data `[1,2,3,4,1,1]` |
| B1 pemetaan error | `exam-session.service.ts:264-272` | semua `P2002` → `EXAM_SESSION_ALREADY_TODAY` |
| B2 root client dalam tx | `exam-question-source.ts:420` | `this.prisma.question.findMany` dipanggil dari `$transaction` |
| B2 titik panggil | `exam-session.service.ts:480` | `this.questionSource.prepare(...)` |
| B2 batas transaksi | `exam-session.service.ts:414` | `$transaction` tanpa `timeout`/`maxWait` |
| Media opsi hilang (snapshot) | `scoring/scoring.types.ts` | `SnapshotOption` tanpa `media` |
| Media opsi hilang (materialisasi) | `exam-question-source.ts:378` | `media: row.media.map(({role, path, alt}))` — `optionId` dibuang |
| Media opsi hilang (proyeksi) | `exam-question-projection.ts:32` | `media: []` hardcode |
| Media opsi tidak dirender | `apps/web/src/routes/(app)/exam/[sessionId]/+page.svelte:585` | hanya `optionText(option)` |
| Media stem terbatas | idem:520 | hanya `role === 'STEM'` |
| `IMAGE_CHOICE` jatuh ke teks | idem (cabang `{:else}`) | tidak ada cabang gambar |
| Byte media tidak di bucket | `media.service.ts:149-190` | `data: normalized`, tanpa unggah storage |
| `DevStorage` tanpa route | `core/ports/impl/dev-storage.ts:10,16` | `/dev-storage/...` tidak ada controller |
| Seed tanpa gambar | `apps/api/prisma/seed/questions/*` | 0 `IMAGE_CHOICE`, 0 media |
| Seed tanpa TPA | `seed/questions/index.ts` | `SeedSubtestCode` tanpa `TPA` |
