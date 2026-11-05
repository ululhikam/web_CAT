# Perbaikan WebCAT — Index & Peta Eksekusi

**Tanggal:** 5 November 2026
**Status:** rencana eksekusi — belum ada perubahan kode
**Tracker tunggal:** [`../PROGRESS.md`](../PROGRESS.md)

---

## 1. Dokumen di folder ini

| Berkas | Isi |
| --- | --- |
| [`00-INDEX.md`](./00-INDEX.md) | Peta fase, urutan kerja, cara pakai, definisi selesai |
| [`fase-0-persiapan.md`](./fase-0-persiapan.md) | Branch, baseline, DB uji, helper test |
| [`fase-1-cat-fungsional.md`](./fase-1-cat-fungsional.md) | **P0** — 2 blocker CAT + verifikasi end-to-end |
| [`fase-2-integration-test.md`](./fase-2-integration-test.md) | Test Postgres nyata + smoke script + CI |
| [`fase-3-soal-bergambar.md`](./fase-3-soal-bergambar.md) | Soal figural + opsi bergambar end-to-end |
| [`fase-4-bank-soal.md`](./fase-4-bank-soal.md) | TPA, PUBLISHED, kuota pool |
| [`fase-5-gap-fitur.md`](./fase-5-gap-fitur.md) | Gap P1/P2 di luar mesin ujian |

Ringkasan strategi & bukti temuan ada di [`../RENCANA-PERBAIKAN.md`](../RENCANA-PERBAIKAN.md).

---

## 2. Peta fase & ketergantungan

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

| Fase | Prioritas | Bisa paralel dengan | Estimasi |
| --- | --- | --- | --- |
| 0 | P0 | — | 0,5 hari |
| 1 | P0 | — | 2 hari |
| 2 | P0 | Fase 3 | 1,5 hari |
| 3 | P1 | Fase 2 | 3,5 hari |
| 4 | P1 | Fase 5 (sebagian) | 2 hari |
| 5 | P1/P2 | Fase 4 | 5–8 hari |

**Jalur kritis ke "CAT bisa dipakai": Fase 0 → 1 → 2 (±4 hari).**

---

## 3. Cara memakai runbook

1. Buka file fase yang akan dikerjakan.
2. Ambil task paling atas yang belum selesai dan **dependensinya sudah ✅**.
3. Ikuti **Langkah** apa adanya; jangan lompat ke task berikutnya sebelum
   **Verifikasi** task tersebut lulus.
4. Setelah lulus, perbarui baris task di [`../PROGRESS.md`](../PROGRESS.md):
   status → `✅`, isi **Bukti** (output nyata) dan **Tanggal**.
5. Jalankan `pnpm progress` untuk melihat ringkasan terbaru.

### Aturan status

| Status | Kapan dipakai |
| --- | --- |
| ⬜ Belum | default |
| 🟨 Dikerjakan | sudah ada perubahan kode, belum lulus verifikasi |
| ✅ Selesai | kriteria selesai + perintah verifikasi terbukti |
| ⛔ Terblokir | ada penghalang eksternal; **wajib** tulis alasannya |
| ➖ Dibatalkan | keputusan sadar; tulis alasannya |

> Satu task hanya boleh `✅` bila ada bukti yang bisa dijalankan ulang
> (perintah + output, atau link commit).

---

## 4. Konvensi ID

```
F<fase>-<dua digit>     contoh: F1-04
```

ID dipakai di tiga tempat dan **harus sama**:

- runbook fase (`docs/perbaikan/*.md`)
- tracker (`docs/PROGRESS.md`)
- pesan commit (opsional, mis. `fix(exam): ... (F1-04)`)

---

## 5. Definition of Done global

Dipakai sebagai gerbang sebelum menyatakan perbaikan selesai.

### Perbaikan fungsional
- [ ] Peserta bisa menyelesaikan **6 subtes** dari UI tanpa intervensi DB.
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

## 6. Ringkasan bukti blocker (konteks minimal)

Agar runbook bisa dipakai tanpa membuka audit lengkap.

| Kode | Ringkas | Bukti |
| --- | --- | --- |
| **B1** | `order_index` subtes per-stage vs unique index per-session | `exam.prisma:181` `@@unique([sessionId, orderIndex])`; data `[1,2,3,4,1,1]`; error `P2002`; handler melempar `EXAM_SESSION_ALREADY_TODAY` |
| **B2** | root Prisma client dipakai di dalam `$transaction` | `exam-question-source.ts:420` dipanggil dari `exam-session.service.ts:480`; `connection_limit=1` |
| **B3** | bank soal belum layak `QUESTION_POOL=db` | 14 soal, 0 PUBLISHED, tidak ada TPA di seed |
| **M1–M4** | media opsi hilang di snapshot → materialisasi → proyeksi → runner | `SnapshotOption` tanpa `media`; `optionView` `media: []`; runner hanya `optionText` |
