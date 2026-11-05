-- F5-17 — pilih tes per sesi + kuota harian yang dapat dikonfigurasi.
--
-- Index parsial `exam_sessions_user_exam_date_active_key` membatasi tepat satu
-- sesi per peserta per hari, sehingga peserta tidak dapat memilih tes lain
-- (Psikologi/TKK/TPK) pada hari yang sama meski `max_sessions_per_day`
-- mengizinkan. Kuota kini ditegakkan di aplikasi (dengan advisory lock per
-- peserta agar aman dari balapan), dan `exam_sessions_user_id_exam_date_idx`
-- tetap tersedia untuk pencarian riwayat.
DROP INDEX IF EXISTS "exam_sessions_user_exam_date_active_key";
