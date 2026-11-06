/**
 * Sakelar fitur yang tampil ke publik.
 *
 * Nilainya konstanta (bukan env) supaya hasil SSR dan browser selalu sama:
 * env publik di-inline saat build dan bisa berbeda antar deployment, sedangkan
 * keputusan "tampil atau tidak" harus satu nilai.
 */

/**
 * Halaman `/pricing` beserta semua tautan menuju ke sana.
 *
 * Dimatikan sementara karena daftar paket belum siap dipublikasikan. Selama
 * `false`:
 *  - "Harga & Paket" tidak muncul di navbar,
 *  - sekali "Beli paket"/"Lihat paket" di riwayat transaksi dan checkout
 *    disembunyikan,
 *  - setiap kunjungan ke `/pricing` dialihkan ke beranda.
 *
 * Ubah ke `true` lalu deploy ulang untuk mengaktifkan kembali tanpa perubahan
 * lain.
 */
export const PRICING_ENABLED: boolean = true;
