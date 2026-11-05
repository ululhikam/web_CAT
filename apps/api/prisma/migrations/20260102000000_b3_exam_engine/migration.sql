-- ============================================================================
-- b3_exam_engine — kolom tambahan mesin ujian (B3)
--
-- Migrasi aditif di atas `20260101000000_init`. Tidak ada tabel baru: seluruh
-- tabel ujian sudah dibuat Phase 0. Yang ditambahkan hanya kolom/indeks yang
-- dibutuhkan mesin ujian:
--   1. exam_settings.subtest_transition        → on_open | immediate
--   2. exam_sessions.eliminated_subtest_code   → subtes penyebab gugur
--      exam_sessions.elimination_reason
--   3. exam_session_subtests.<counter>         → ringkasan hasil per subtes
--      exam_session_subtests.config_snapshot  → snapshot konfigurasi subtes
--   4. exam_session_questions.snapshot         → snapshot soal (server-only)
--      + soal dari pool non-DB (question_id nullable) & metadata autosave
-- ============================================================================

ALTER TABLE "exam_settings"
  ADD COLUMN IF NOT EXISTS "subtest_transition" TEXT NOT NULL DEFAULT 'on_open';

ALTER TABLE "exam_sessions"
  ADD COLUMN IF NOT EXISTS "eliminated_subtest_code" "SubtestCode",
  ADD COLUMN IF NOT EXISTS "elimination_reason" TEXT;

ALTER TABLE "exam_session_subtests"
  ADD COLUMN IF NOT EXISTS "answered_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "correct_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "wrong_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "blank_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "consistency_index" DECIMAL(8, 4),
  ADD COLUMN IF NOT EXISTS "config_snapshot" JSONB;

-- Soal boleh berasal dari pool non-DB sampai gate G2. Identitas soal dalam sesi
-- memakai `external_id` (kode publik) sehingga materialisasi tetap idempoten.
ALTER TABLE "exam_session_questions"
  ALTER COLUMN "question_id" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "external_id" TEXT,
  ADD COLUMN IF NOT EXISTS "snapshot" JSONB,
  ADD COLUMN IF NOT EXISTS "answer_payload" JSONB,
  ADD COLUMN IF NOT EXISTS "answered_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "revision" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "time_spent_ms" INTEGER NOT NULL DEFAULT 0;

-- Backfill baris lama (bila ada) agar NOT NULL di bawah aman.
UPDATE "exam_session_questions"
   SET "external_id" = COALESCE("question_id"::TEXT, "id"::TEXT)
 WHERE "external_id" IS NULL;

UPDATE "exam_session_questions"
   SET "snapshot" = '{}'::JSONB
 WHERE "snapshot" IS NULL;

ALTER TABLE "exam_session_questions"
  ALTER COLUMN "external_id" SET NOT NULL,
  ALTER COLUMN "snapshot" SET NOT NULL;

-- Nama index mengikuti konvensi Prisma untuk @@unique([subtestSessionId, externalId]).
-- Index unik lama berbasis `question_id` dihapus karena identitas soal dalam sesi
-- sekarang memakai `external_id` (dan `question_id` boleh NULL untuk fixture).
DROP INDEX IF EXISTS "exam_session_questions_subtest_session_id_question_id_key";

CREATE UNIQUE INDEX IF NOT EXISTS "exam_session_questions_subtest_session_id_external_id_key"
  ON "exam_session_questions"("subtest_session_id", "external_id");

-- Index pencarian riwayat per peserta (dideklarasikan di schema Prisma).
CREATE INDEX IF NOT EXISTS "exam_sessions_user_id_exam_date_idx"
  ON "exam_sessions"("user_id", "exam_date");

-- Satu sesi per peserta per hari. Sesi yang di-void membebaskan kuota.
-- Index parsial tidak dapat dinyatakan di Prisma schema, jadi dibuat di sini.
CREATE UNIQUE INDEX IF NOT EXISTS "exam_sessions_user_exam_date_active_key"
  ON "exam_sessions"("user_id", "exam_date")
  WHERE "voided_at" IS NULL;

-- Pemindaian cron: subtes ACTIVE yang melewati tenggat.
CREATE INDEX IF NOT EXISTS "exam_session_subtests_active_ends_at_idx"
  ON "exam_session_subtests"("ends_at")
  WHERE "status" = 'ACTIVE';
