# Laporan Pekerjaan — Branch 2: Bank Soal & Pipeline Impor

**Tanggal:** 5 November 2026  
**Cabang:** `dev/b2-question-bank`  
**Lingkup:** `plan.md` §17.2 — Bank soal, taksonomi kategori, media library, pipeline impor spreadsheet (XLSX/CSV) + dokumen (PDF/DOCX), deduplikasi hash, review UI, dan implementasi `QuestionPoolPort` (`PrismaQuestionPool`).

---

## 1. Ringkasan Eksekutif

Pengerjaan Branch 2 (`dev/b2-question-bank`) telah diselesaikan secara menyeluruh sesuai dengan blueprint arsitektur pada `plan.md` §10, §12.2, dan §17.2. 

Seluruh gerbang verifikasi monorepo (`pnpm verify`) berhasil hijau:
- **Lint**: 6/6 paket berhasil (`eslint --max-warnings 0`)
- **Typecheck**: 6/6 paket berhasil (`tsc --noEmit` & `svelte-check` 0 error / 0 warning)
- **Unit Test**: 88 tes lulus di 5 paket (contracts: 19 tes, mocks: 5 tes, api: 54 tes, web: 12 tes)
- **Build**: Berhasil membangun paket `@webcat/contracts`, `@webcat/api`, dan `@webcat/web` (SvelteKit SSR production bundle via `@sveltejs/adapter-node`)

---

## 2. Fitur & Komponen yang Dibangun

### 2.1 Kontrak (`packages/contracts`)
- `packages/contracts/src/questions/index.ts`: Skema Zod untuk 6 tipe soal (`SINGLE_CHOICE`, `MULTI_CHOICE`, `IMAGE_CHOICE`, `LIKERT_STATEMENT`, `MISSING_ELEMENT`, `PASS_HAND_COLUMN`), tingkat kesulitan (`EASY`, `MEDIUM`, `HARD`), format stem (`MARKDOWN`, `HTML`), aksi massal (`bulkQuestionActionSchema`), pratinjau (`questionPreviewSchema`), dan query filter.
- `packages/contracts/src/categories/index.ts`: Skema hierarki pohon kategori dan validasi CRUD.
- `packages/contracts/src/media/index.ts`: Skema upload presigned URL, konfirmasi aset media, checksum SHA-256, dan query media.
- `packages/contracts/src/imports/index.ts`: Skema status impor (`UPLOADED`, `PARSING`, `PARSED`, `REVIEWING`, `COMMITTING`, `COMPLETED`, `FAILED`, `CANCELLED`), status item (`VALID`, `INVALID`, `DUPLICATE`, `IMPORTED`, `SKIPPED`), pengaturan target impor, pembaruan item tinjauan, dan komit bertahap.

### 2.2 Backend (`apps/api`)
1. **Modul Kategori (`apps/api/src/modules/categories/`)**:
   - `GET /admin/categories`: Daftar struktur pohon kategori berhierarki.
   - `POST/PATCH/DELETE /admin/categories`: Operasi CRUD dengan pemeliharaan path dan pengurutan (`sortOrder`).
2. **Modul Bank Soal (`apps/api/src/modules/questions/`)**:
   - `GET /admin/questions`: Pencarian dan pemfilteran dengan kursor/paginasi berdasarkan subtes, status, dan tingkat kesulitan.
   - `POST /admin/questions`: Pembuatan soal baru dengan kalkulasi otomatis `dedupeHash`.
   - `GET/PATCH/DELETE /admin/questions/:id`: Detail, modifikasi, dan soft-delete soal.
   - `POST /admin/questions/:id/publish`: Publikasi soal individual.
   - `POST /admin/questions/bulk-action`: Aksi massal (publikasi, pengarsipan, penghapusan) ber-audit.
   - `POST /admin/questions/:id/media` & `DELETE .../media/:mediaId`: Penautan dan pelepasan media gambar pada stem/opsi.
   - `GET /admin/questions/stats`: Agregasi statistik jumlah soal per subtes dan status.
   - Algoritma deduplikasi (`dedupe.ts`): Normalisasi teks berbasis Unicode NFKC, penghapusan spasi/tanda baca berlebih, dan pengurutan opsi jawaban untuk mencegah soal ganda.
3. **Modul Media Library (`apps/api/src/modules/media/`)**:
   - `POST /admin/media/upload-url`: Pembuatan URL presigned upload.
   - `POST /admin/media/confirm`: Verifikasi checksum SHA-256 dan pencatatan aset media.
   - `POST /admin/media/upload`: Dukungan direct upload multipart untuk mode dev/lokal.
   - `GET /admin/media`: Galeri aset media.
4. **Modul Pipeline Impor (`apps/api/src/modules/imports/`)**:
   - `POST /admin/imports`: Unggah berkas dokumen (PDF, DOCX) atau lembar kerja (XLSX, CSV) beserta arsip ZIP media.
   - `GET /admin/imports/:id`: Status dan statistik progres parsing.
   - `GET /admin/imports/:id/preview` & `POST .../preview`: Pratinjau hasil ekstraksi per baris beserta skor keyakinan (*confidence score*) dan daftar temuan isu.
   - `PATCH /admin/imports/:id/items/:itemId`: Fasilitas perbaikan/koreksi manual sebelum komit.
   - `POST /admin/imports/:id/commit`: Komit bertahap item valid ke bank soal berstatus `REVIEW` (tanpa auto-publish).
   - `POST /admin/imports/:id/cancel`: Pembatalan berkas impor.
   - `GET /admin/imports/:id/errors.csv`: Unduh laporan rincian galat baris per baris format CSV.
   - `GET /admin/imports/template.xlsx`: Unduh template spreadsheet resmi.
   - Ekstraktor dokumen:
     - `pdf-extractor.ts`: Ekstraksi teks dari PDF via `unpdf` / `pdfjs-dist`.
     - `docx-extractor.ts`: Ekstraksi teks dan inline images via `mammoth`.
     - `document-parser.ts`: Heuristik pendeteksian nomor soal, stem, opsi A-E, kunci jawaban, dan pembahasan.
     - `spreadsheet-parser.ts`: Parser XLSX via `exceljs` dan CSV via `papaparse`.
5. **Implementasi Question Pool (`PrismaQuestionPool`)**:
   - `apps/api/src/core/ports/impl/prisma-question-pool.ts`: Implementasi nyata `QuestionPoolPort` (gate G2).
   - Menjamin hanya soal berstatus `PUBLISHED` dan belum dihapus (`deletedAt: null`) yang dapat di-sampling.
   - Pengambilan soal acak (sampling) dengan proporsi tingkat kesulitan (*difficulty mix*).
   - Sanitasi kunci jawaban dan pembahasan agar tidak bocor ke klien saat ujian berlangsung.

### 2.3 Frontend Admin (`apps/web`)
- `(admin)/admin/questions/+page.svelte`: Tampilan daftar soal dengan filter, pencarian, status badge, dan bulk actions.
- `(admin)/admin/questions/new/+page.svelte` & `[id]/+page.svelte`: Wizard form input/edit soal dengan live preview komponen.
- `(admin)/admin/questions/import/+page.svelte`: Wizard impor komprehensif (Upload berkas & ZIP -> Parsing & Analisis -> Side-by-side review dengan confidence score & status tag -> Komit bertahap / Download error CSV).
- `(admin)/admin/categories/+page.svelte`: Manajemen hierarki taksonomi kategori.
- `(admin)/admin/media/+page.svelte`: Galeri media dan pengelolaan aset.
- `apps/web/src/lib/components/questions/`: Renderer responsif untuk ke-6 tipe soal:
  - `SingleChoice.svelte`
  - `MultiChoice.svelte`
  - `LikertStatement.svelte`
  - `MissingElement.svelte`
  - `PassHandColumn.svelte`
  - `ImageChoice.svelte`
  - `QuestionRenderer.svelte`
  - `QuestionForm.svelte`

### 2.4 Database & Migrasi
- `apps/api/prisma/schema/question.prisma`: Skema lengkap untuk model kategori, tag, soal, opsi jawaban, aset media, relasi media soal, riwayat impor, serta item tinjauan impor (`import_job_items`).
- Migrasi: `20261105090000_b2_question_bank` menambahkan indeks unik dedupe aktif:
  `CREATE UNIQUE INDEX "questions_active_dedupe_key" ON "questions"("stage_code", "subtest_code", "dedupe_hash") WHERE "deleted_at" IS NULL AND "dedupe_override" = false;`
- Seed: `apps/api/prisma/seed/question.seed.ts` menginisialisasi taksonomi kategori dan soal demo untuk seluruh 6 tipe soal dalam status DRAFT.

---

## 3. Hasil Pengujian Unit

| Paket | File Uji | Jumlah Tes | Status |
|---|---|---|---|
| `@webcat/api` | `test/dedupe.spec.ts` | 8 | ✅ Lulus |
| `@webcat/api` | `test/document-parser.spec.ts` | 11 | ✅ Lulus |
| `@webcat/api` | `test/import-draft.spec.ts` | 11 | ✅ Lulus |
| `@webcat/api` | `test/question-pool.spec.ts` | 7 | ✅ Lulus |
| `@webcat/api` | `test/spreadsheet-parser.spec.ts` | 8 | ✅ Lulus |
| `@webcat/api` | `test/envelope.spec.ts` | 4 | ✅ Lulus |
| `@webcat/api` | `test/token.spec.ts` | 5 | ✅ Lulus |
| `@webcat/web` | `draft.spec.ts` | 12 | ✅ Lulus |
| `@webcat/contracts` | `test/pagination.spec.ts`, `rbac.spec.ts`, `plans.spec.ts` | 19 | ✅ Lulus |
| `@webcat/mocks` | `test/fixtures.spec.ts` | 5 | ✅ Lulus |
| **Total** | | **88** | **Semua Hijau** |

---

## 4. Status Integrasi & Siap Lanjut ke Branch 3

Branch 2 (`dev/b2-question-bank`) telah mencapai Definition of Done (DoD) dan siap menjadi dasar integrasi untuk **Branch 3 (Mesin Ujian / `dev/b3-exam-engine`)**, terutama ketersediaan:
1. `QuestionPoolPort` (`PrismaQuestionPool` & `MockQuestionPool`) untuk sampling soal ujian per subtes.
2. Renderer komponen soal untuk runner ujian (`apps/web/src/lib/components/questions/**`).
3. Dukungan multi-tipe soal (Kecerdasan MCQ, Kepribadian Likert berpasangan, Kecermatan missing element, dan Pass Hand kolom).
