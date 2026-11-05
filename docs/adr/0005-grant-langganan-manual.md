# 0005 — Grant langganan manual: STACK, REPLACE, dan aktivasi tertunda

**Status:** Diterima
**Tanggal:** 5 November 2026

## Konteks

Admin perlu memberi masa aktif tanpa pembayaran (kompensasi, hadiah, kerja
sama) dan memperpanjang atau mencabut langganan. Grant dapat bertumpuk dengan
langganan yang masih aktif, atau sengaja dimulai pada tanggal tertentu. Bila
baris yang mulai di masa depan langsung berstatus `ACTIVE`, pengguna bisa
mendapat akses lebih awal; bila dibiarkan `PENDING` tanpa pekerjaan terjadwal,
akses yang sudah diberikan tidak pernah aktif.

## Keputusan

- **Alasan wajib.** Setiap grant, perpanjangan, dan pencabutan menuntut alasan
  minimal 3 karakter; aksi ditulis ke `subscription_events` dan `audit_logs`.
- **STACK.** Grant baru mulai setelah `ends_at` langganan aktif terakhir.
  Bila tanggal mulai berada di masa depan, baris disimpan `PENDING` agar tidak
  dihitung sebagai akses aktif.
- **REPLACE.** Langganan aktif yang ada dicabut lebih dulu (dengan event
  `REVOKED`), lalu grant baru mulai sekarang.
- **Aktivasi tertunda.** Cron `expire-subscriptions` menjalankan
  `activateDueSubscriptions`: baris `PENDING` dengan
  `starts_at <= now < ends_at` diubah menjadi `ACTIVE`, disertai event
  `ACTIVATED` dan outbox `subscription.activated`.
- **Satu pintu akses.** `BillingAccessPolicy` hanya membaca langganan `ACTIVE`
  yang belum melewati `ends_at`; sumber akses (pembelian, grant, trial) tidak
  pernah bocor ke mesin ujian.

## Konsekuensi

- (+) Admin dapat menumpuk atau mengganti masa aktif dengan jejak audit lengkap.
- (+) Grant yang dimulai di masa depan tetap dihormati tanpa memberi akses dini.
- (+) Mesin ujian tidak perlu tahu asal langganan.
- (−) Aktivasi bergantung pada cron; bila cron mati, baris `PENDING` tidak
  aktif. Endpoint cron idempoten sehingga aman dijalankan ulang.
