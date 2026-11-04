# 0003 — Harga paket hanya dari database

**Status:** Diterima
**Tanggal:** 5 November 2026

## Konteks

Halaman harga adalah deliverable, dan harga akan sering berubah. Menaruh nominal
di komponen frontend atau di kode API membuat perubahan harga menuntut deploy dan
membuka celah manipulasi bila klien mengirim nominal sendiri.

## Keputusan

- Sumber kebenaran harga: tabel `subscription_plans`.
- `DEFAULT_PLANS` di `packages/contracts/src/plans/default-plans.ts` hanya dipakai
  untuk **seed awal**; tidak pernah menjadi fallback runtime di web.
- Klien mengirim `planCode` saja. API memuat paket dari database, memvalidasi
  status aktif, lalu menghitung nominal di server sebelum membuat transaksi.
- Bila API gagal, halaman harga menampilkan galat + tombol **Coba lagi**.
  Daftar harga duplikat sengaja **tidak** disediakan.

## Konsekuensi

- (+) Satu sumber kebenaran; admin dapat mengubah harga tanpa deploy.
- (+) Tidak ada jalur bagi klien untuk menentukan nominal pembayaran.
- (−) Halaman harga bergantung pada ketersediaan API.
- (−) Perubahan bentuk `Plan` menuntut migrasi data, bukan sekadar edit kode.
