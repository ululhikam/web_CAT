# Breakdown Pekerjaan per Fase — Index

**Tanggal:** 5 November 2026
**Status:** rencana eksekusi (belum ada perubahan kode)
**Tracker tunggal:** [`PROGRESS.md`](./PROGRESS.md)

Dokumen ini hanya **peta**. Rincian langkah, perintah, dan potongan kode ada di
runbook per fase di folder [`perbaikan/`](./perbaikan/).

---

## 1. Runbook per fase

| Fase | Berkas | Prioritas | Estimasi | Isi |
| --- | --- | --- | --- | --- |
| 0 | [`perbaikan/fase-0-persiapan.md`](./perbaikan/fase-0-persiapan.md) | P0 | 0,5 hari | Branch, baseline, DB uji, helper test |
| 1 | [`perbaikan/fase-1-cat-fungsional.md`](./perbaikan/fase-1-cat-fungsional.md) | **P0** | 2 hari | Blocker B1 & B2 + verifikasi end-to-end |
| 2 | [`perbaikan/fase-2-integration-test.md`](./perbaikan/fase-2-integration-test.md) | **P0** | 1,5 hari | Test Postgres nyata, smoke script, CI |
| 3 | [`perbaikan/fase-3-soal-bergambar.md`](./perbaikan/fase-3-soal-bergambar.md) | P1 | 3,5 hari | Soal figural + opsi bergambar |
| 4 | [`perbaikan/fase-4-bank-soal.md`](./perbaikan/fase-4-bank-soal.md) | P1 | 2 hari | TPA, PUBLISHED, kuota pool |
| 5 | [`perbaikan/fase-5-gap-fitur.md`](./perbaikan/fase-5-gap-fitur.md) | P1/P2 | 5–8 hari | Admin, keamanan, UX |

Ringkasan strategi & bukti temuan: [`RENCANA-PERBAIKAN.md`](./RENCANA-PERBAIKAN.md).

---

## 2. Urutan & ketergantungan

```
FASE 0  Persiapan
   │
   ▼
FASE 1  CAT fungsional (B1 + B2)   ◄── jalur kritis
   │
   ├──────────────► FASE 2  Integration test & CI
   │
   ├──────────────► FASE 3  Soal bergambar
   │                     │
   │                     ▼
   └──────────────► FASE 4  Bank soal (TPA + PUBLISHED)
                         │
                         ▼
                     FASE 5  Gap fitur P1/P2
```

**Jalur kritis ke "CAT bisa dipakai peserta": Fase 0 → 1 → 2 (±4 hari).**
**Ke "CAT + psikotes bergambar": tambah Fase 3 (±7,5 hari).**

---

## 3. Cara memakai runbook

1. Buka runbook fase yang akan dikerjakan.
2. Ambil task paling atas yang belum selesai **dan** dependensinya sudah ✅.
3. Ikuti langkah apa adanya; jangan lompat sebelum **Verifikasi** task lulus.
4. Perbarui baris task di [`PROGRESS.md`](./PROGRESS.md): status → `✅`,
   isi **Bukti** (output nyata) dan **Tanggal**.
5. Jalankan `pnpm progress` untuk melihat ringkasan.

### Aturan status

| Status | Arti |
| --- | --- |
| ⬜ | Belum dikerjakan |
| 🟨 | Sedang dikerjakan (kode ada, verifikasi belum) |
| ✅ | Selesai & terverifikasi |
| ⛔ | Terblokir (wajib tulis alasan) |
| ➖ | Dibatalkan (wajib tulis alasan) |

> Satu task hanya boleh `✅` bila ada bukti yang bisa dijalankan ulang
> (perintah + output, atau hash commit).

---

## 4. Konvensi ID

```
F<fase>-<dua digit>     contoh: F1-04
```

ID dipakai di tiga tempat dan **harus sama**: runbook fase, `PROGRESS.md`, dan
pesan commit (opsional, mis. `fix(exam): ... (F1-04)`).

---

## 5. Definition of Done global

### Fungsional
- [ ] Peserta menyelesaikan **6 subtes** dari UI tanpa intervensi DB.
- [ ] Autosave idempoten; refresh tidak menghilangkan jawaban.
- [ ] Timer, lock, dan sistem gugur bekerja sesuai plan.
- [ ] Hasil akhir (skor per subtes + total) tampil dan benar.

### Kualitas
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` hijau.
- [ ] `pnpm test:integration` hijau terhadap PostgreSQL nyata.
- [ ] `pnpm smoke:cat` lulus berulang dan membersihkan data uji.
- [ ] Tidak ada `_tmp_*.ts` atau skrip scratch di repo.

### Konten
- [ ] Semua subtes memenuhi kuota soal PUBLISHED (termasuk TPA).
- [ ] ≥ 30 soal bergambar dengan media stem + media opsi.
- [ ] `QUESTION_POOL=db` berjalan tanpa fallback fixture.

---

## 6. Bukti blocker (konteks minimal)

| Kode | Ringkas | Bukti |
| --- | --- | --- |
| **B1** | `orderIndex` subtes per-stage vs unique index per-session | `exam.prisma:181`; data `[1,2,3,4,1,1]`; `P2002`; handler → `EXAM_SESSION_ALREADY_TODAY` |
| **B2** | root Prisma client di dalam `$transaction` | `exam-question-source.ts:420` dipanggil dari `exam-session.service.ts:480`; `connection_limit=1` |
| **B3** | bank soal belum layak `QUESTION_POOL=db` | 14 soal, 0 PUBLISHED, TPA tidak ada di seed |
| **M1–M4** | media opsi hilang di snapshot → materialisasi → proyeksi → runner | `SnapshotOption` tanpa `media`; `optionView` `media: []`; runner hanya `optionText` |
