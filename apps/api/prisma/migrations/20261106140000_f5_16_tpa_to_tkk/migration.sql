-- F5-16 — TPA diganti menjadi TKK (Tes Kemampuan Komputer).
--
-- Tujuan: nama tes mengikuti kebutuhan pengguna dan isi bank soal yang
-- berfokus pada literasi komputer. Enum di-rename (bukan drop+create) supaya
-- seluruh baris historis (`exam_stages`, `subtests`, `exam_session_stages`,
-- `exam_session_subtests`, `questions`, `exam_sessions.eliminated_subtest_code`)
-- otomatis ikut berubah nilai tanpa kehilangan relasi.
--
-- Rename nilai enum hanya didukung PostgreSQL >= 10; proyek ini memakai
-- PostgreSQL 15/17 di Supabase sehingga aman.
ALTER TYPE "StageCode" RENAME VALUE 'TPA' TO 'TKK';
ALTER TYPE "SubtestCode" RENAME VALUE 'TPA' TO 'TKK';
