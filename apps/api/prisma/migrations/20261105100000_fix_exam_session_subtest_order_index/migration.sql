-- F1-02: `order_index` pada `exam_session_subtests` adalah urutan PER STAGE.
--
-- Bukti: konfigurasi subtes menulis PSIKOLOGI=[1,2,3,4], TPA=[1], TPK=[1],
-- sehingga satu sesi berisi order_index [1,2,3,4,1,1]. Unique index per sesi
-- membuat setiap `POST /exams/sessions` gagal dengan P2002 sebelum satu baris
-- pun tercipta.
--
-- Keunikan subtes per sesi tetap dijaga oleh
-- `exam_session_subtests_session_id_subtest_id_key`.

DROP INDEX "exam_session_subtests_session_id_order_index_key";

CREATE INDEX "exam_session_subtests_session_id_order_index_idx"
  ON "exam_session_subtests"("session_id", "order_index");
