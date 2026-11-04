-- B4 Monetization
-- 1. URL pembayaran gateway disimpan agar user bisa melanjutkan pembayaran
--    dari halaman /transactions tanpa membuat tagihan baru.
-- 2. Jejak refund pada transaksi (riwayat tidak pernah dihapus).
-- 3. Penanda pengingat masa aktif agar email H-3/H-0 hanya dikirim sekali.

ALTER TABLE "transactions"
  ADD COLUMN IF NOT EXISTS "redirect_url" TEXT,
  ADD COLUMN IF NOT EXISTS "refunded_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "refund_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "refunded_by" UUID;

CREATE INDEX IF NOT EXISTS "transactions_status_paid_at_idx"
  ON "transactions" ("status", "paid_at");

ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "last_reminder_at" TIMESTAMP(3);

-- 4. View revenue harian untuk dashboard admin.
--    Tanggal dihitung pada zona Asia/Jakarta (UTC+7); agregasi tetap dilakukan
--    di query agar rentang `from`/`to` detik tetap presisi.
CREATE OR REPLACE VIEW "v_daily_revenue" AS
SELECT
  "id",
  to_char("created_at" + interval '7 hours', 'YYYY-MM-DD') AS "date",
  "amount_idr",
  "created_at"
FROM "transactions"
WHERE "status" IN ('SUCCESS', 'REFUNDED');

COMMENT ON VIEW "v_daily_revenue" IS
  'Transaksi lunas/refund dengan tanggal Asia/Jakarta untuk agregasi revenue harian.';
