-- ============================================================================
-- B2 — Bank soal: item hasil impor + dedupe unik per subtes
-- Additive only.
-- ============================================================================

-- CreateEnum
CREATE TYPE "ImportItemStatus" AS ENUM ('VALID', 'INVALID', 'DUPLICATE', 'IMPORTED', 'SKIPPED');

-- CreateTable
CREATE TABLE "import_job_items" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "row_number" INTEGER NOT NULL,
    "status" "ImportItemStatus" NOT NULL DEFAULT 'VALID',
    "confidence" DECIMAL(5,4),
    "payload" JSONB,
    "raw_text" TEXT,
    "issues" JSONB,
    "question_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_job_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "import_job_items_job_id_row_number_key" ON "import_job_items"("job_id", "row_number");

-- CreateIndex
CREATE INDEX "import_job_items_job_id_status_idx" ON "import_job_items"("job_id", "status");

-- AddForeignKey
ALTER TABLE "import_job_items" ADD CONSTRAINT "import_job_items_job_id_fkey"
  FOREIGN KEY ("job_id") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Dedupe: satu soal aktif per (stage, subtes, hash). Override eksplisit dikecualikan.
CREATE UNIQUE INDEX "questions_active_dedupe_key"
  ON "questions"("stage_code", "subtest_code", "dedupe_hash")
  WHERE "deleted_at" IS NULL AND "dedupe_override" = false;

-- Mempercepat daftar soal & pool sampling.
CREATE INDEX "questions_status_deleted_at_idx" ON "questions"("status", "deleted_at");

-- Fallback biner media untuk StoragePort dev (produksi memakai bucket privat).
ALTER TABLE "media_assets" ADD COLUMN "data" BYTEA;

-- Pengaturan impor (target subtes, tipe default, mode dedupe, kategori).
ALTER TABLE "import_jobs" ADD COLUMN "settings" JSONB;
