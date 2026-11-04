# 0004 — Webhook pembayaran: signature, idempotensi, dan transisi status

**Status:** Diterima
**Tanggal:** 5 November 2026

## Konteks

Endpoint notifikasi pembayaran bersifat publik dan dapat dipanggil siapa saja.
Gateway pembayaran juga dapat mengirim notifikasi yang sama berkali-kali, atau
mengirim notifikasi refund setelah notifikasi settlement. Tanpa pengaman,
replay dapat mengaktifkan langganan ganda atau memperpanjang masa aktif tanpa
pembayaran baru.

## Keputusan

- **Signature wajib.** Notifikasi Midtrans diverifikasi dengan
  `SHA512(order_id + status_code + gross_amount + server_key)` memakai
  `timingSafeEqual` atas raw body. Body yang sudah diubah setelah ditandatangani
  ditolak sebelum diproses.
- **Idempotensi di database.** Tabel `payment_webhook_events` memiliki
  `UNIQUE(provider, provider_event_id)`. Event key Midtrans adalah
  `<transaction_id>:<transaction_status>` (fallback `<order_id>:<status>`),
  sehingga refund setelah settlement bukan replay.
- **Retry yang aman.** Bila percobaan pertama gagal, kolom `error` diisi.
  Notifikasi ulang dari gateway dengan event key yang sama boleh dicoba lagi
  selama belum ada `processed_at`; replay yang sudah selesai dijawab `200`
  tanpa efek samping.
- **Transisi status terbatas.** Hanya transaksi `PENDING` yang boleh berpindah
  ke status final. `SUCCESS` hanya boleh berpindah ke `REFUNDED`; notifikasi
  terlambat untuk `EXPIRED`/`FAILED`/`CANCELLED` diabaikan.
- **Nominal dicek.** Event `SUCCESS` dengan nominal berbeda dari tagihan
  ditolak `PAYMENT_AMOUNT_MISMATCH` dan tidak mengaktifkan langganan.
- **Refund mencabut akses.** Refund dari gateway menandai transaksi
  `REFUNDED`, mencabut langganan terkait, serta menulis `subscription_events`
  dan outbox dalam satu transaksi database.

## Konsekuensi

- (+) Replay, dua webhook paralel, dan notifikasi refund aman.
- (+) Kegagalan sementara tidak menghilangkan notifikasi; gateway dapat retry.
- (+) Aktivasi langganan dan status transaksi selalu konsisten.
- (−) Provider baru wajib mendefinisikan event key yang stabil dan signature
  sendiri; kontrak `PaymentProvider` tidak boleh diperlonggar.
