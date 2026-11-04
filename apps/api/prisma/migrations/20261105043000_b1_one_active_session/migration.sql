-- Satu akun hanya boleh memiliki satu sesi aktif (revoked_at IS NULL).
-- Partial unique index ini adalah pengaman terakhir saat dua login berjalan
-- paralel; aplikasi juga mencabut sesi lama secara eksplisit.
--
-- Sebelum indeks dibuat, rapikan data lama: sisakan hanya sesi aktif terbaru
-- per user (berdasarkan created_at lalu id) agar migrasi tidak gagal.

UPDATE "sessions" AS older
SET "revoked_at" = now()
WHERE older."revoked_at" IS NULL
  AND EXISTS (
    SELECT 1
    FROM "sessions" AS newer
    WHERE newer."user_id" = older."user_id"
      AND newer."revoked_at" IS NULL
      AND (newer."created_at", newer."id") > (older."created_at", older."id")
  );

CREATE UNIQUE INDEX "sessions_one_active_per_user"
  ON "sessions" ("user_id")
  WHERE "revoked_at" IS NULL;