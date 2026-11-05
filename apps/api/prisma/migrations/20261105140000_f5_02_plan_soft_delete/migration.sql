-- F5-02: soft delete paket (`subscription_plans.deleted_at`).
--
-- Paket yang sudah pernah dipakai transaksi atau langganan tidak boleh
-- dihapus fisik: `transactions.plan_id` & `subscriptions.plan_id` memakai
-- ON DELETE SET NULL, sehingga riwayat pembelian akan kehilangan nama paket.
-- Karena itu "hapus" di panel admin hanya mengisi `deleted_at`, dan semua
-- query publik/admin menyaring `deleted_at IS NULL`.
--
-- `code` tetap UNIQUE: kode paket yang sudah dihapus tidak boleh dipakai ulang
-- agar audit & riwayat transaksi lama tidak ambigu. Admin yang ingin "kode
-- sama" cukup mengaktifkan kembali baris lama lewat restore.

ALTER TABLE "subscription_plans" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- Mempercepat query daftar/publik yang selalu menyaring soft delete.
CREATE INDEX "subscription_plans_deleted_at_idx" ON "subscription_plans"("deleted_at");
