-- F5-13 — flag anomali waktu jawab.
--
-- `exam_answer_events.time_spent_ms` menyimpan waktu sejak soal tampil pada saat
-- jawaban itu dikirim. Tanpa kolom ini, anomali "jawaban pertama 120 ms" tidak
-- bisa dibedakan dari "soal dikerjakan 9 detik lalu diubah" karena
-- `exam_session_questions.time_spent_ms` bersifat akumulatif.
--
-- Tidak ada tabel baru: temuan disimpan di `proctoring_events` yang kolom
-- `type`/`metadata`-nya sudah generik, sehingga langsung tampil di halaman
-- monitoring. Baris anomali **tidak** menyentuh `exam_violations`, jadi tidak
-- ada aksi otomatis (warn/lock/eliminate) yang menggugurkan peserta.
ALTER TABLE "exam_answer_events"
  ADD COLUMN "time_spent_ms" INTEGER NOT NULL DEFAULT 0;
