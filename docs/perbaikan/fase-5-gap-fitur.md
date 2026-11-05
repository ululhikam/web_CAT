# FASE 5 — Gap Fitur P1/P2

**Prioritas:** P1 (sebelum rilis) lalu P2 (kualitas)
**Estimasi:** 5–8 hari
**Prasyarat:** Fase 4 selesai (mesin ujian & bank soal beres)

---

## Tujuan

Menutup fitur yang seharusnya ada menurut `plan.md` tetapi belum ada atau baru
sebagian. Fase ini **tidak** memblokir alur ujian, tetapi memblokir kelayakan
rilis publik.

---

## P1 — sebelum rilis publik

| ID | Pekerjaan | Kondisi saat ini | Kriteria selesai | Est |
| --- | --- | --- | --- | --- |
| F5-01 | Pulihkan halaman `/pricing` | dihapus di commit `e0b23fd` | Halaman tampil, harga dari DB, test lulus | 1 j |
| F5-02 | CRUD plan admin | belum ada UI lengkap | Create/update/soft-delete + audit | 2 j |
| F5-03 | Detail user admin | daftar ada, detail minim | Riwayat sesi, langganan, pembayaran | 2 j |
| F5-04 | Detail transaksi admin | belum ada | Status, bukti bayar, refund | 2 j |
| F5-05 | Worker `job_queue`/outbox terjadwal | endpoint ada, tak dijadwalkan | Cron jalan, backlog termonitor | 1,5 j |
| F5-06 | Rate limit API | belum aktif | 429 sesuai kebijakan, terdokumentasi | 1,5 j |
| F5-07 | CSRF + CSP | belum aktif | Header terpasang, uji XSS dasar | 1,5 j |
| F5-08 | Dashboard peserta dari API | data mock | Angka nyata dari `history` & statistik | 1,5 j |
| F5-09 | Dokumentasi API produksi | belum sinkron | Swagger/OpenAPI diperbarui | 1 j |

---

## P2 — kualitas & UX

| ID | Pekerjaan | Kondisi saat ini | Kriteria selesai | Est |
| --- | --- | --- | --- | --- |
| F5-10 | Autosave IndexedDB + replay + `sendBeacon` | in-memory saja | Jawaban aman saat offline/refresh | 3 j |
| F5-11 | Preload 2 soal berikutnya (teks + gambar) | belum ada | Navigasi tanpa jeda | 1 j |
| F5-12 | Zoom/pan gambar figural | belum ada | Gambar kecil bisa diperbesar | 1,5 j |
| F5-13 | Flag anomali waktu jawab | belum ada | `< 300 ms` (gambar), `< 150 ms` (Kecermatan) tercatat | 1 j |
| F5-14 | Import ZIP gambar end-to-end | parser ada, UI belum | Pemetaan manual + laporan error | 2 j |
| F5-15 | Varian WebP/thumbnail | satu ukuran | 2 varian per gambar | 1 j |
| F5-16 | E2E Playwright alur ujian | belum ada | Skrip lulus di CI dengan DB nyata | 3 j |

---

## Langkah detail

### F5-01 — Pulihkan `/pricing`

Halaman `/pricing` hilang di commit `e0b23fd`. Pulihkan **bukan** dengan
`git revert` (commit itu mungkin memuat perubahan lain), tetapi dengan mengambil
file spesifik:

```powershell
git show e0b23fd^:apps/web/src/routes/pricing/+page.svelte > <path-tujuan>
git show e0b23fd^:apps/web/src/routes/pricing/+page.ts   > <path-tujuan>
```

Bila route-nya sudah berpindah lokasi (mis. ke `(public)/pricing`), sesuaikan
path tujuan dan `import` di dalamnya.

**Kriteria selesai**

- `/pricing` mengembalikan 200 dan menampilkan paket dari `GET /api/v1/plans`.
- Tidak ada harga hardcode di komponen (ADR 0003).
- Ada test/check bahwa halaman memuat data dari API.

---

### F5-02 — CRUD plan admin

Endpoint admin untuk plan sudah ada? Periksa `admin-*.controller.ts`. Yang
kurang adalah **UI** dan validasi:

| Bagian | Kebutuhan |
| --- | --- |
| Daftar | tabel plan + status aktif |
| Form | nama, harga, durasi, fitur, `isActive` |
| Hapus | soft delete (`deletedAt`), bukan hard delete |
| Audit | setiap perubahan tercatat (`audit.record`) |

**Kriteria selesai**

- Admin bisa membuat, mengubah, menonaktifkan plan.
- Perubahan langsung terlihat di `/pricing` (tanpa deploy).
- Setiap perubahan punya entri audit.

---

### F5-03 / F5-04 — Detail user & transaksi admin

Daftar user/transaksi sudah ada tetapi detail minim. Tambahkan:

| Halaman | Isi |
| --- | --- |
| Detail user | profil, status verifikasi, langganan aktif, riwayat sesi ujian, riwayat pembayaran |
| Detail transaksi | status, metode, bukti bayar (media), riwayat status, aksi refund/verifikasi |

**Kriteria selesai**

- Admin bisa menjawab "user ini pernah ikut ujian berapa kali, skornya berapa,
  dan langganannya kapan habis" tanpa query manual.
- Aksi verifikasi/refund tercatat di audit.

---

### F5-05 — Worker job queue

`POST /internal/cron/process-jobs` sudah ada, tetapi **tidak ada penjadwal**.

| Langkah | Detail |
| --- | --- |
| 1 | Pastikan `vercel.json` (atau cron eksternal) memanggil endpoint cron secara berkala |
| 2 | Amankan endpoint dengan secret header (`CRON_SECRET`) |
| 3 | Tambahkan metrik backlog: jumlah job `PENDING` & umur tertua |
| 4 | Alert bila backlog > ambang |

**Kriteria selesai**

- Job `PENDING` berkurang tanpa intervensi manual.
- Ada endpoint/health check yang menampilkan backlog.

---

### F5-06 / F5-07 — Rate limit, CSRF, CSP

| Item | Implementasi yang disarankan |
| --- | --- |
| Rate limit | `@nestjs/throttler` global + limit lebih ketat untuk `/auth/login` |
| CSRF | token double-submit untuk endpoint non-Bearer (refresh cookie) |
| CSP | header via middleware: `default-src 'self'`, `img-src 'self' data: <storage-host>` |

**Kriteria selesai**

- `POST /auth/login` ke-11 dalam 1 menit → 429.
- Request state-changing tanpa token CSRF → 403.
- Tidak ada inline script yang diblokir CSP (uji halaman utama + runner).

---

### F5-08 — Dashboard peserta

Ganti data mock dengan API nyata:

| Kartu | Sumber |
| --- | --- |
| Sesi terakhir | `GET /exams/history` |
| Skor rata-rata | agregasi `history` |
| Subtes terlemah | agregasi skor per subtes |
| Langganan | `GET /me/subscription` |

**Kriteria selesai**

- Semua angka berasal dari API; tidak ada nilai hardcode.
- Saat belum ada sesi, tampil empty state yang jelas.

---

### F5-10 — Autosave IndexedDB

Saat ini jawaban hanya disimpan di memori + dikirim ke server. Bila koneksi
putus atau tab ditutup, jawaban bisa hilang.

Rancangan:

```
setiap perubahan jawaban:
  1. tulis ke IndexedDB (key: sessionId + subtestId + questionId)
  2. tambahkan ke antrean kirim
  3. flush antrean tiap N detik / saat online
  4. saat unload: navigator.sendBeacon(...)
  5. saat load: pulihkan jawaban yang belum tersinkron
```

**Kriteria selesai**

- Matikan jaringan → jawab 5 soal → nyalakan jaringan → semua tersimpan.
- Refresh tab di tengah subtes → jawaban tetap ada.
- Replay `clientSeq` tetap idempoten di server (lihat F2-07).

---

### F5-12 — Zoom/pan gambar figural

Untuk soal figural detail (jaring-jaring kubus, pola kompleks), tambahkan
viewer:

- Klik gambar → modal layar penuh.
- Pinch/scroll untuk zoom, drag untuk pan.
- Tombol reset & close, aksesibel via keyboard (`Esc`).

**Kriteria selesai**

- Gambar 200×200 bisa diperbesar sampai 400% tanpa pecah berlebihan.
- `Esc` menutup viewer.

---

### F5-13 — Flag anomali waktu jawab

Data `timeSpentMs` sudah dikirim saat autosave. Tambahkan pencatatan anomali:

| Aturan | Ambang |
| --- | --- |
| Soal bergambar dijawab terlalu cepat | `< 300 ms` |
| Kecermatan beruntun sangat cepat | `< 150 ms` untuk 5 soal berturut |
| Jawaban diubah berkali-kali dalam waktu singkat | `> 5` perubahan dalam 2 detik |

Simpan sebagai event proctoring (`exam_answer_events` atau tabel anomali),
**jangan** otomatis menggugurkan peserta.

---

### F5-16 — E2E Playwright

Tambahkan `apps/web/e2e/exam.spec.ts`:

1. Login sebagai peserta demo.
2. Mulai sesi.
3. Buka subtes pertama.
4. Jawab 5 soal.
5. Refresh halaman → jawaban tetap ada (uji F5-10).
6. Selesaikan subtes.
7. Cek halaman hasil.

Jalankan terhadap API + DB nyata (bukan mock). Bisa digabung dengan job CI
integrasi (F2-09) atau job terpisah.

---

## Verifikasi fase

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:integration
```

Manual:

| Cek | Target |
| --- | --- |
| `/pricing` | tampil, harga dari DB |
| Admin plan/user/transaksi | CRUD + audit |
| Cron | backlog turun |
| `POST /auth/login` berulang | 429 |
| Dashboard peserta | angka nyata |
| Offline + refresh saat ujian | jawaban tidak hilang |
| E2E Playwright | lulus |

---

## Risiko fase ini

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Rate limit terlalu ketat | peserta terblokir saat ujian | kecualikan endpoint ujian atau naikkan limit per user terautentikasi |
| CSP memblokir media eksternal | gambar tidak tampil | `img-src` memuat host storage |
| IndexedDB menyimpan data sensitif | risiko privasi | simpan hanya jawaban, bersihkan setelah sesi selesai |
| Cron dipanggil tanpa secret | penyalahgunaan | wajib header `CRON_SECRET` |
| E2E flaky | CI merah palsu | gunakan `data-testid`, tunggu kondisi eksplisit |

---

## Commit yang disarankan

1. `feat(web): pulihkan halaman pricing (F5-01)`
2. `feat(admin): CRUD plan (F5-02)`
3. `feat(admin): detail user & transaksi (F5-03, F5-04)`
4. `feat(ops): jadwalkan worker + metrik backlog (F5-05)`
5. `feat(security): rate limit + CSRF + CSP (F5-06, F5-07)`
6. `feat(web): dashboard peserta dari API (F5-08)`
7. `feat(web): autosave IndexedDB + sendBeacon (F5-10)`
8. `test(e2e): alur ujian Playwright (F5-16)`
