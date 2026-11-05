-- F5-15 — varian WebP/thumbnail.
--
-- Menambah kolom turunan thumbnail pada media_assets. Semua kolom nullable dan
-- tanpa backfill: aset lama dilayani sebagai berkas asli sampai thumbnail
-- dibuat ulang, dan gambar yang sudah <= 400 px memang tidak butuh turunan.
ALTER TABLE "media_assets"
  ADD COLUMN "thumb_data" BYTEA,
  ADD COLUMN "thumb_width" INTEGER,
  ADD COLUMN "thumb_height" INTEGER,
  ADD COLUMN "thumb_size_bytes" INTEGER;
