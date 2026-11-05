import { q } from './mcq';
import { numericDistractors } from './rng';
import type { SeedDifficulty, WrittenMultiChoice, WrittenQuestion } from './types';

/**
 * Bank soal Tes Potensi Akademik (TPA).
 *
 * Komposisi (lihat `docs/perbaikan/fase-4-bank-soal.md`):
 *
 *   Verbal     40 soal — sinonim, antonim, analogi, pemahaman bacaan
 *   Numerik    35 soal — deret, aritmetika, perbandingan, persentase
 *   Penalaran  12 soal — silogisme, analitis, logika (pilihan tunggal)
 *              + 3 soal `MULTI_CHOICE` (banyak jawaban benar)
 *
 * Ditambah 15 soal figural (`TPA-FIG-*`, lihat `figural.ts`), subtes TPA
 * memiliki 105 soal PUBLISHED untuk kuota 100 — surplus 5 soal memberi ruang
 * bila ada soal yang perlu dinonaktifkan.
 *
 * Kunci ditulis sebagai **teks** (`q()` selalu menaruh kunci di posisi pertama,
 * lalu `buildChoices` mengacak opsi secara deterministik) sehingga label akhir
 * tidak pernah bertentangan dengan isi jawaban.
 */

/* ----------------------------------------------------------------- helper */

/**
 * Empat pengecoh numerik di sekitar kunci (selalu terisi, unik, ≥ 0).
 *
 * Skala pengecoh mengikuti besaran jawaban: jawaban ribuan (mis. harga
 * `68.000`) diberi pengecoh kelipatan 1.000 — `68.001` mustahil muncul sebagai
 * pilihan harga yang masuk akal.
 */
function numericOptions(answer: number): [string, string, string, string] {
  const round = answer >= 1_000 && answer % 1_000 === 0;
  const deltas = round ? [1_000, 2_000, 3_000, 5_000, 10_000] : undefined;
  const values = (deltas ? numericDistractors(answer, deltas) : numericDistractors(answer)).slice(
    0,
    4,
  );
  const seen = new Set([String(answer), ...values]);
  const step = round ? 1_000 : 6;
  let candidate = 1;
  while (values.length < 4) {
    const text = String(answer + candidate * step);
    if (!seen.has(text)) {
      seen.add(text);
      values.push(text);
    }
    candidate += 1;
  }
  return values as [string, string, string, string];
}

function n(
  topic: string,
  difficulty: SeedDifficulty,
  stem: string,
  answer: number,
  explanation: string,
  tags: readonly string[],
): WrittenQuestion {
  return q(topic, difficulty, stem, String(answer), numericOptions(answer), explanation, tags);
}

/* ---------------------------------------------------------------- verbal 40 */

const VERBAL: WrittenQuestion[] = [
  /* ---------- sinonim (12) ---------- */
  q(
    'verbal',
    'EASY',
    'Sinonim dari kata "abadi" adalah ...',
    'Kekal',
    ['Sementara', 'Berubah', 'Baru', 'Rusak'],
    '"Abadi" berarti kekal atau tidak berubah selamanya; "sementara" justru antonimnya.',
    ['verbal', 'sinonim'],
  ),
  q(
    'verbal',
    'EASY',
    'Sinonim dari kata "cermat" adalah ...',
    'Teliti',
    ['Ceroboh', 'Cepat', 'Malas', 'Ragu'],
    '"Cermat" berarti teliti dan berhati-hati dalam mengerjakan sesuatu.',
    ['verbal', 'sinonim'],
  ),
  q(
    'verbal',
    'MEDIUM',
    'Sinonim dari kata "defisit" adalah ...',
    'Kekurangan',
    ['Kelebihan', 'Kesimpulan', 'Kemajuan', 'Perbaikan'],
    '"Defisit" berarti berkurang atau kurang dari yang seharusnya; lawannya surplus.',
    ['verbal', 'sinonim'],
  ),
  q(
    'verbal',
    'EASY',
    'Sinonim dari kata "efektif" adalah ...',
    'Berhasil guna',
    ['Berlebihan', 'Sementara', 'Mahal', 'Rumit'],
    '"Efektif" berarti membawa hasil atau berhasil guna.',
    ['verbal', 'sinonim'],
  ),
  q(
    'verbal',
    'MEDIUM',
    'Sinonim dari kata "fundamental" adalah ...',
    'Mendasar',
    ['Tambahan', 'Permukaan', 'Sementara', 'Terperinci'],
    '"Fundamental" berarti menjadi dasar atau pokok.',
    ['verbal', 'sinonim'],
  ),
  q(
    'verbal',
    'MEDIUM',
    'Sinonim dari kata "hipotesis" adalah ...',
    'Dugaan',
    ['Kesimpulan akhir', 'Bukti', 'Kepastian', 'Perintah'],
    '"Hipotesis" adalah dugaan sementara yang masih harus diuji.',
    ['verbal', 'sinonim'],
  ),
  q(
    'verbal',
    'HARD',
    'Sinonim dari kata "implisit" adalah ...',
    'Tersirat',
    ['Tersurat', 'Terbuka', 'Jelas', 'Ringkas'],
    '"Implisit" berarti terkandung di dalamnya tetapi tidak dinyatakan langsung.',
    ['verbal', 'sinonim'],
  ),
  q(
    'verbal',
    'MEDIUM',
    'Sinonim dari kata "konsisten" adalah ...',
    'Taat asas',
    ['Berubah-ubah', 'Ragu', 'Terputus', 'Berbeda'],
    '"Konsisten" berarti tetap dan selaras dengan aturan atau pendirian sebelumnya.',
    ['verbal', 'sinonim'],
  ),
  q(
    'verbal',
    'MEDIUM',
    'Sinonim dari kata "kredibel" adalah ...',
    'Dapat dipercaya',
    ['Mencurigakan', 'Berlebihan', 'Tidak pasti', 'Sementara'],
    '"Kredibel" berarti dapat dipercaya karena bukti atau reputasinya.',
    ['verbal', 'sinonim'],
  ),
  q(
    'verbal',
    'MEDIUM',
    'Sinonim dari kata "objektif" adalah ...',
    'Apa adanya',
    ['Memihak', 'Menurut perasaan', 'Bersifat pribadi', 'Spekulatif'],
    '"Objektif" berarti berdasarkan fakta, bukan perasaan atau kepentingan pribadi.',
    ['verbal', 'sinonim'],
  ),
  q(
    'verbal',
    'MEDIUM',
    'Sinonim dari kata "relatif" adalah ...',
    'Nisbi',
    ['Mutlak', 'Pasti', 'Tetap', 'Akhir'],
    '"Relatif" berarti tidak mutlak dan bergantung pada pembandingnya.',
    ['verbal', 'sinonim'],
  ),
  q(
    'verbal',
    'MEDIUM',
    'Sinonim dari kata "sinergi" adalah ...',
    'Kerja sama',
    ['Persaingan', 'Perpecahan', 'Pemisahan', 'Penundaan'],
    '"Sinergi" berarti kerja sama yang menghasilkan dampak lebih besar daripada bekerja sendiri.',
    ['verbal', 'sinonim'],
  ),

  /* ---------- antonim (10) ---------- */
  q(
    'verbal',
    'EASY',
    'Antonim dari kata "ekspansi" adalah ...',
    'Penyusutan',
    ['Perluasan', 'Penambahan', 'Peningkatan', 'Pengembangan'],
    '"Ekspansi" berarti perluasan; lawannya penyusutan atau pengecilan.',
    ['verbal', 'antonim'],
  ),
  q(
    'verbal',
    'EASY',
    'Antonim dari kata "maksimal" adalah ...',
    'Minimal',
    ['Maksimum', 'Tinggi', 'Penuh', 'Sempurna'],
    '"Maksimal" berarti paling banyak/tinggi, sedangkan "minimal" paling sedikit/rendah.',
    ['verbal', 'antonim'],
  ),
  q(
    'verbal',
    'EASY',
    'Antonim dari kata "optimis" adalah ...',
    'Pesimis',
    ['Yakin', 'Semangat', 'Tegas', 'Sabar'],
    '"Optimis" melihat sesuatu dari sisi baik; lawannya pesimis.',
    ['verbal', 'antonim'],
  ),
  q(
    'verbal',
    'MEDIUM',
    'Antonim dari kata "transparan" adalah ...',
    'Tertutup',
    ['Jelas', 'Bening', 'Terbuka', 'Gamblang'],
    '"Transparan" berarti terbuka dan dapat dilihat; lawannya tertutup.',
    ['verbal', 'antonim'],
  ),
  q(
    'verbal',
    'MEDIUM',
    'Antonim dari kata "sporadis" adalah ...',
    'Rutin',
    ['Jarang', 'Acak', 'Terpisah', 'Sesekali'],
    '"Sporadis" berarti muncul sesekali tanpa pola; lawannya rutin atau teratur.',
    ['verbal', 'antonim'],
  ),
  q(
    'verbal',
    'HARD',
    'Antonim dari kata "konvergen" adalah ...',
    'Divergen',
    ['Menyatu', 'Mengumpul', 'Memusat', 'Bertemu'],
    '"Konvergen" berarti menuju satu titik; "divergen" berarti menyebar menjauh.',
    ['verbal', 'antonim'],
  ),
  q(
    'verbal',
    'MEDIUM',
    'Antonim dari kata "abstrak" adalah ...',
    'Konkret',
    ['Samar', 'Maya', 'Umum', 'Teoretis'],
    '"Abstrak" berarti tidak berwujud; "konkret" berarti nyata dan berwujud.',
    ['verbal', 'antonim'],
  ),
  q(
    'verbal',
    'EASY',
    'Antonim dari kata "modern" adalah ...',
    'Tradisional',
    ['Canggih', 'Baru', 'Mutakhir', 'Kontemporer'],
    '"Modern" berarti mengikuti perkembangan terbaru; lawannya tradisional.',
    ['verbal', 'antonim'],
  ),
  q(
    'verbal',
    'MEDIUM',
    'Antonim dari kata "surplus" adalah ...',
    'Defisit',
    ['Laba', 'Kelebihan', 'Sisa', 'Simpanan'],
    '"Surplus" berarti kelebihan; lawannya defisit atau kekurangan.',
    ['verbal', 'antonim'],
  ),
  q(
    'verbal',
    'EASY',
    'Antonim dari kata "ramai" adalah ...',
    'Sepi',
    ['Bising', 'Padat', 'Riang', 'Sibuk'],
    '"Ramai" berarti banyak orang atau sibuk; lawannya sepi.',
    ['verbal', 'antonim'],
  ),

  /* ---------- analogi (10) ---------- */
  q(
    'verbal',
    'EASY',
    'Dokter : rumah sakit = guru : ...',
    'Sekolah',
    ['Murid', 'Buku', 'Papan tulis', 'Belajar'],
    'Dokter bekerja di rumah sakit, sebagaimana guru bekerja di sekolah.',
    ['verbal', 'analogi'],
  ),
  q(
    'verbal',
    'EASY',
    'Pisau : memotong = pena : ...',
    'Menulis',
    ['Kertas', 'Tinta', 'Meja', 'Membaca'],
    'Pisau dipakai untuk memotong; pena dipakai untuk menulis.',
    ['verbal', 'analogi'],
  ),
  q(
    'verbal',
    'EASY',
    'Air : haus = makanan : ...',
    'Lapar',
    ['Kenyang', 'Gizi', 'Piring', 'Masak'],
    'Air mengatasi haus, makanan mengatasi lapar.',
    ['verbal', 'analogi'],
  ),
  q(
    'verbal',
    'EASY',
    'Mata : melihat = telinga : ...',
    'Mendengar',
    ['Mencium', 'Meraba', 'Berbicara', 'Berjalan'],
    'Mata adalah indra penglihatan; telinga indra pendengaran.',
    ['verbal', 'analogi'],
  ),
  q(
    'verbal',
    'EASY',
    'Dingin : selimut = hujan : ...',
    'Payung',
    ['Awan', 'Angin', 'Becek', 'Jaket'],
    'Selimut melindungi dari dingin, payung melindungi dari hujan.',
    ['verbal', 'analogi'],
  ),
  q(
    'verbal',
    'EASY',
    'Pisang : buah = bayam : ...',
    'Sayur',
    ['Daun', 'Hijau', 'Vitamin', 'Tanaman'],
    'Pisang termasuk kelompok buah; bayam termasuk kelompok sayur.',
    ['verbal', 'analogi'],
  ),
  q(
    'verbal',
    'MEDIUM',
    'Guru : murid = dokter : ...',
    'Pasien',
    ['Obat', 'Rumah sakit', 'Perawat', 'Penyakit'],
    'Guru melayani murid, dokter melayani pasien.',
    ['verbal', 'analogi'],
  ),
  q(
    'verbal',
    'MEDIUM',
    'Petani : sawah = nelayan : ...',
    'Laut',
    ['Perahu', 'Jala', 'Ikan', 'Pasar'],
    'Petani bekerja di sawah, nelayan bekerja di laut.',
    ['verbal', 'analogi'],
  ),
  q(
    'verbal',
    'MEDIUM',
    'Buku : membaca = lagu : ...',
    'Mendengar',
    ['Menulis', 'Menari', 'Menggambar', 'Berbicara'],
    'Buku dinikmati dengan membaca; lagu dinikmati dengan mendengar.',
    ['verbal', 'analogi'],
  ),
  q(
    'verbal',
    'MEDIUM',
    'Gunting : kain = gergaji : ...',
    'Kayu',
    ['Besi', 'Paku', 'Tukang', 'Palu'],
    'Gunting memotong kain; gergaji memotong kayu.',
    ['verbal', 'analogi'],
  ),

  /* ---------- pemahaman bacaan (8) ---------- */
  q(
    'verbal',
    'MEDIUM',
    'Bacalah: "Kualitas udara di kota besar menurun pada musim kemarau karena debu dan asap kendaraan tidak tercuci hujan." Simpulan yang tepat adalah ...',
    'Hujan membantu menurunkan debu dan asap di udara',
    [
      'Musim kemarau selalu menyehatkan warga kota',
      'Asap kendaraan tidak berpengaruh pada kualitas udara',
      'Debu jalanan hanya muncul saat hujan',
      'Kualitas udara kota besar selalu baik',
    ],
    'Teks menyebut debu dan asap tidak tercuci karena tidak ada hujan, sehingga hujan berperan membersihkan udara.',
    ['verbal', 'pemahaman-bacaan'],
  ),
  q(
    'verbal',
    'MEDIUM',
    'Bacalah: "Perpustakaan kampus memperpanjang jam buka hingga pukul 22.00 selama pekan ujian." Gagasan utama kalimat tersebut adalah ...',
    'Perpanjangan jam buka perpustakaan saat pekan ujian',
    [
      'Mahasiswa malas belajar di perpustakaan',
      'Perpustakaan kampus selalu tutup pukul 22.00',
      'Pekan ujian diadakan sepanjang semester',
      'Perpustakaan kampus tutup selama pekan ujian',
    ],
    'Inti kalimat adalah perpanjangan jam buka perpustakaan selama pekan ujian.',
    ['verbal', 'pemahaman-bacaan'],
  ),
  q(
    'verbal',
    'MEDIUM',
    'Bacalah: "Pemerintah daerah menambah armada bus pada jam sibuk setelah keluhan penumpang meningkat." Masalah yang ingin diatasi adalah ...',
    'Bus selalu penuh pada jam sibuk',
    [
      'Tarif bus terlalu murah',
      'Jumlah penumpang menurun',
      'Armada bus terlalu banyak',
      'Jadwal bus tidak pernah berubah',
    ],
    'Keluhan penumpang yang meningkat berkaitan dengan bus penuh pada jam sibuk.',
    ['verbal', 'pemahaman-bacaan'],
  ),
  q(
    'verbal',
    'EASY',
    'Bacalah: "Tanaman hidroponik ditanam tanpa media tanah dan diberi nutrisi lewat air. Cara ini menghemat lahan dan air." Keuntungan hidroponik menurut teks adalah ...',
    'Menghemat lahan dan air',
    [
      'Menghasilkan panen tanpa nutrisi',
      'Tidak memerlukan air sama sekali',
      'Hanya dapat dilakukan di sawah',
      'Menghilangkan kebutuhan cahaya',
    ],
    'Kalimat kedua menyebut penghematan lahan dan air sebagai keuntungan.',
    ['verbal', 'pemahaman-bacaan'],
  ),
  q(
    'verbal',
    'HARD',
    'Bacalah: "Penjualan naik pada kuartal ketiga, tetapi kenaikan itu terjadi karena diskon besar sehingga laba bersih menurun." Simpulan yang tepat adalah ...',
    'Kenaikan penjualan belum tentu diikuti kenaikan laba',
    [
      'Diskon selalu menaikkan laba',
      'Penjualan kuartal ketiga menurun',
      'Laba bersih naik bersama penjualan',
      'Diskon tidak berpengaruh pada penjualan',
    ],
    'Teks menyatakan penjualan naik karena diskon, sementara laba bersih justru menurun.',
    ['verbal', 'pemahaman-bacaan'],
  ),
  q(
    'verbal',
    'MEDIUM',
    'Bacalah: "Antrean di loket diperpendek dengan sistem nomor daring sehingga peserta tidak perlu datang lebih awal." Manfaat yang disebutkan adalah ...',
    'Peserta tidak perlu datang lebih awal',
    [
      'Loket layanan ditutup lebih cepat',
      'Nomor diberikan tanpa sistem',
      'Antrean bertambah panjang',
      'Peserta wajib datang sebelum fajar',
    ],
    'Kalimat menyebut manfaat langsung: peserta tidak perlu datang lebih awal.',
    ['verbal', 'pemahaman-bacaan'],
  ),
  q(
    'verbal',
    'HARD',
    'Bacalah: "Latihan fisik berlebihan dapat menimbulkan cedera, sehingga program latihan disusun bertahap dengan jeda pemulihan." Tujuan penyusunan bertahap menurut teks adalah ...',
    'Mencegah cedera akibat latihan berlebihan',
    [
      'Mempercepat kelelahan peserta',
      'Menghapus jeda pemulihan',
      'Mengurangi jumlah pelatih',
      'Membuat latihan tanpa target',
    ],
    'Latihan bertahap dan jeda pemulihan adalah respons atas risiko cedera.',
    ['verbal', 'pemahaman-bacaan'],
  ),
  q(
    'verbal',
    'MEDIUM',
    'Bacalah: "Sebuah studi menemukan bahwa siswa yang tidur cukup memperoleh nilai lebih baik daripada siswa yang kurang tidur." Pernyataan yang sesuai dengan teks adalah ...',
    'Tidur cukup berkaitan dengan nilai yang lebih baik',
    [
      'Tidur cukup menjamin nilai sempurna',
      'Siswa yang kurang tidur selalu gagal',
      'Nilai tidak dipengaruhi kebiasaan tidur',
      'Studi hanya meneliti siswa yang tidur berlebih',
    ],
    'Teks menyebut kaitan (bukan jaminan) antara tidur cukup dan nilai lebih baik.',
    ['verbal', 'pemahaman-bacaan'],
  ),
];

/* --------------------------------------------------------------- numerik 35 */

const NUMERIK: WrittenQuestion[] = [
  /* ---------- deret (15) ---------- */
  n(
    'numerik',
    'EASY',
    'Lanjutkan deret berikut: 5, 10, 20, 40, ...',
    80,
    'Setiap suku dikalikan 2, sehingga 40 × 2 = 80.',
    ['numerik', 'deret'],
  ),
  n(
    'numerik',
    'MEDIUM',
    'Lanjutkan deret berikut: 3, 6, 11, 18, ...',
    27,
    'Selisih antarsuku bertambah 2: +3, +5, +7, lalu +9 sehingga 18 + 9 = 27.',
    ['numerik', 'deret'],
  ),
  n(
    'numerik',
    'EASY',
    'Lanjutkan deret berikut: 2, 4, 8, 16, ...',
    32,
    'Setiap suku dikalikan 2, sehingga 16 × 2 = 32.',
    ['numerik', 'deret'],
  ),
  n(
    'numerik',
    'MEDIUM',
    'Lanjutkan deret berikut: 100, 90, 81, ...',
    73,
    'Selisihnya berkurang satu: −10, −9, lalu −8 sehingga 81 − 8 = 73.',
    ['numerik', 'deret'],
  ),
  n(
    'numerik',
    'EASY',
    'Lanjutkan deret berikut: 1, 4, 9, 16, ...',
    25,
    'Deret bilangan kuadrat: 1², 2², 3², 4², sehingga 5² = 25.',
    ['numerik', 'deret'],
  ),
  n(
    'numerik',
    'EASY',
    'Lanjutkan deret berikut: 7, 14, 21, 28, ...',
    35,
    'Deret kelipatan 7, sehingga 28 + 7 = 35.',
    ['numerik', 'deret'],
  ),
  n(
    'numerik',
    'MEDIUM',
    'Lanjutkan deret berikut: 2, 3, 5, 7, 11, ...',
    13,
    'Deret bilangan prima berurutan, sehingga setelah 11 adalah 13.',
    ['numerik', 'deret'],
  ),
  n(
    'numerik',
    'HARD',
    'Lanjutkan deret berikut: 1, 2, 6, 24, ...',
    120,
    'Pengali bertambah satu: ×2, ×3, ×4, lalu ×5 sehingga 24 × 5 = 120.',
    ['numerik', 'deret'],
  ),
  n(
    'numerik',
    'EASY',
    'Lanjutkan deret berikut: 96, 48, 24, ...',
    12,
    'Setiap suku dibagi 2, sehingga 24 ÷ 2 = 12.',
    ['numerik', 'deret'],
  ),
  n(
    'numerik',
    'HARD',
    'Lanjutkan deret berikut: 3, 4, 7, 11, 18, ...',
    29,
    'Setiap suku adalah jumlah dua suku sebelumnya: 7 + 11 = 18 dan 11 + 18 = 29.',
    ['numerik', 'deret'],
  ),
  n(
    'numerik',
    'EASY',
    'Lanjutkan deret berikut: 81, 27, 9, ...',
    3,
    'Setiap suku dibagi 3, sehingga 9 ÷ 3 = 3.',
    ['numerik', 'deret'],
  ),
  n(
    'numerik',
    'MEDIUM',
    'Lanjutkan deret berikut: 5, 6, 8, 11, 15, ...',
    20,
    'Selisih bertambah satu: +1, +2, +3, +4, lalu +5 sehingga 15 + 5 = 20.',
    ['numerik', 'deret'],
  ),
  n(
    'numerik',
    'MEDIUM',
    'Lanjutkan deret berikut: 2, 5, 10, 17, ...',
    26,
    'Selisih bertambah dua: +3, +5, +7, lalu +9 sehingga 17 + 9 = 26.',
    ['numerik', 'deret'],
  ),
  n(
    'numerik',
    'EASY',
    'Lanjutkan deret berikut: 4, 12, 36, ...',
    108,
    'Setiap suku dikalikan 3, sehingga 36 × 3 = 108.',
    ['numerik', 'deret'],
  ),
  n(
    'numerik',
    'EASY',
    'Lanjutkan deret berikut: 64, 32, 16, ...',
    8,
    'Setiap suku dibagi 2, sehingga 16 ÷ 2 = 8.',
    ['numerik', 'deret'],
  ),

  /* ---------- aritmetika (12) ---------- */
  n(
    'numerik',
    'EASY',
    'Berapakah 25% dari 240?',
    60,
    '25% = 1/4, sehingga 240 ÷ 4 = 60.',
    ['numerik', 'persentase'],
  ),
  n(
    'numerik',
    'EASY',
    'Berapakah 3/4 dari 80?',
    60,
    '80 ÷ 4 = 20, lalu 20 × 3 = 60.',
    ['numerik', 'pecahan'],
  ),
  n(
    'numerik',
    'EASY',
    'Berapakah 15% dari 200?',
    30,
    '15% × 200 = 0,15 × 200 = 30.',
    ['numerik', 'persentase'],
  ),
  n(
    'numerik',
    'EASY',
    'Berapakah 0,5 × 48?',
    24,
    '0,5 sama dengan setengah, sehingga setengah dari 48 adalah 24.',
    ['numerik', 'desimal'],
  ),
  n(
    'numerik',
    'MEDIUM',
    'Berapakah 7² − 5²?',
    24,
    '7² = 49 dan 5² = 25, sehingga 49 − 25 = 24.',
    ['numerik', 'bilangan-berpangkat'],
  ),
  n(
    'numerik',
    'EASY',
    'Berapakah 144 ÷ 12 + 8?',
    20,
    '144 ÷ 12 = 12, lalu 12 + 8 = 20.',
    ['numerik', 'aritmetika'],
  ),
  n(
    'numerik',
    'EASY',
    'Berapakah akar dari 81 dikalikan 2?',
    18,
    'Akar 81 = 9, lalu 9 × 2 = 18.',
    ['numerik', 'aritmetika'],
  ),
  n(
    'numerik',
    'MEDIUM',
    'Faktor persekutuan terbesar (FPB) dari 24 dan 36 adalah ...',
    12,
    'Faktor persekutuan 24 dan 36 adalah 1, 2, 3, 4, 6, 12; yang terbesar 12.',
    ['numerik', 'fpb'],
  ),
  n(
    'numerik',
    'MEDIUM',
    'Kelipatan persekutuan terkecil (KPK) dari 12 dan 18 adalah ...',
    36,
    'Kelipatan 12: 12, 24, 36; kelipatan 18: 18, 36; yang terkecil sama adalah 36.',
    ['numerik', 'kpk'],
  ),
  n(
    'numerik',
    'EASY',
    'Rata-rata dari bilangan 4, 6, 8, 10, dan 12 adalah ...',
    8,
    'Jumlah = 40 dan banyak data 5, sehingga rata-ratanya 8.',
    ['numerik', 'statistika'],
  ),
  n(
    'numerik',
    'EASY',
    'Berapakah 2/5 dari 150?',
    60,
    '150 ÷ 5 = 30, lalu 30 × 2 = 60.',
    ['numerik', 'pecahan'],
  ),
  n(
    'numerik',
    'MEDIUM',
    'Berapakah 1.000 − 3 × 25?',
    925,
    'Perkalian dikerjakan lebih dulu: 3 × 25 = 75, lalu 1.000 − 75 = 925.',
    ['numerik', 'aritmetika'],
  ),

  /* ---------- perbandingan & persentase (8) ---------- */
  n(
    'numerik',
    'MEDIUM',
    'Perbandingan siswa laki-laki dan perempuan adalah 3 : 5. Jika total 64 siswa, banyak siswa laki-laki adalah ...',
    24,
    'Jumlah bagian = 8; laki-laki = 3/8 × 64 = 24 siswa.',
    ['numerik', 'perbandingan'],
  ),
  n(
    'numerik',
    'MEDIUM',
    'Suatu pekerjaan selesai oleh 5 orang dalam 12 hari. Jika dikerjakan 6 orang dengan kecepatan sama, pekerjaan selesai dalam ... hari',
    10,
    'Total pekerjaan = 5 × 12 = 60 hari-orang; 60 ÷ 6 = 10 hari.',
    ['numerik', 'perbandingan-berbalik'],
  ),
  n(
    'numerik',
    'HARD',
    'Perbandingan A : B = 4 : 7 dan selisihnya 12. Jumlah A dan B adalah ...',
    44,
    'Selisih bagian = 3 setara 12, sehingga 1 bagian = 4; jumlah 11 bagian = 44.',
    ['numerik', 'perbandingan'],
  ),
  n(
    'numerik',
    'EASY',
    'Harga barang Rp80.000 mendapat diskon 15%. Harga yang dibayar adalah ... rupiah',
    68000,
    'Diskon = 15% × 80.000 = 12.000, sehingga harga bayar 80.000 − 12.000 = 68.000.',
    ['numerik', 'persentase'],
  ),
  n(
    'numerik',
    'MEDIUM',
    'Perbandingan tiga kelompok 2 : 3 : 5 dengan total 200 orang. Banyak anggota kelompok terbesar adalah ...',
    100,
    'Jumlah bagian = 10, sehingga 1 bagian = 20; kelompok terbesar 5 × 20 = 100 orang.',
    ['numerik', 'perbandingan'],
  ),
  n(
    'numerik',
    'MEDIUM',
    'Pada peta berskala 1 : 1.000.000, jarak dua kota 3 cm. Jarak sebenarnya adalah ... km',
    30,
    '3 × 1.000.000 cm = 3.000.000 cm = 30 km.',
    ['numerik', 'skala'],
  ),
  n(
    'numerik',
    'EASY',
    'Mobil melaju 60 km/jam selama 2,5 jam. Jarak yang ditempuh adalah ... km',
    150,
    'Jarak = kecepatan × waktu = 60 × 2,5 = 150 km.',
    ['numerik', 'soal-cerita'],
  ),
  n(
    'numerik',
    'MEDIUM',
    'Tabungan Rp2.000.000 mendapat bunga tunggal 5% per tahun. Bunga setelah 2 tahun adalah ... rupiah',
    200000,
    'Bunga per tahun = 5% × 2.000.000 = 100.000; dua tahun = 200.000.',
    ['numerik', 'soal-cerita'],
  ),
];

/* ------------------------------------------------------------- penalaran 12 */

const PENALARAN: WrittenQuestion[] = [
  /* ---------- silogisme (4) ---------- */
  q(
    'penalaran',
    'EASY',
    'Semua A adalah B. Semua B adalah C. Kesimpulan yang tepat adalah ...',
    'Semua A adalah C',
    ['Semua C adalah A', 'Sebagian A bukan C', 'Tidak ada A yang C', 'Sebagian C bukan B'],
    'Relasi himpunan bersifat transitif: A ⊆ B dan B ⊆ C, sehingga A ⊆ C.',
    ['penalaran', 'silogisme'],
  ),
  q(
    'penalaran',
    'MEDIUM',
    'Semua pegawai memakai seragam. Andi tidak memakai seragam. Kesimpulan yang tepat adalah ...',
    'Andi bukan pegawai',
    [
      'Andi pegawai yang lalai',
      'Andi memakai seragam',
      'Semua pemakai seragam adalah pegawai',
      'Andi pegawai baru',
    ],
    'Kontraposisi "semua pegawai memakai seragam" adalah "yang tidak memakai seragam bukan pegawai".',
    ['penalaran', 'silogisme'],
  ),
  q(
    'penalaran',
    'MEDIUM',
    'Sebagian A adalah B. Semua B adalah C. Kesimpulan yang tepat adalah ...',
    'Sebagian A adalah C',
    ['Semua A adalah C', 'Semua C adalah A', 'Tidak ada A yang C', 'Sebagian C bukan B'],
    'Anggota A yang sekaligus B pasti C, sehingga sebagian A adalah C.',
    ['penalaran', 'silogisme'],
  ),
  q(
    'penalaran',
    'HARD',
    'Tidak ada A yang B. Semua C adalah A. Kesimpulan yang tepat adalah ...',
    'Tidak ada C yang B',
    ['Semua C adalah B', 'Sebagian C adalah B', 'Semua B adalah C', 'Sebagian A adalah C'],
    'C seluruhnya bagian dari A, dan A tidak beririsan dengan B, sehingga C juga tidak beririsan dengan B.',
    ['penalaran', 'silogisme'],
  ),

  /* ---------- analitis (4) ---------- */
  q(
    'penalaran',
    'EASY',
    'Andi lebih tinggi dari Budi. Budi lebih tinggi dari Cici. Siapa yang paling tinggi?',
    'Andi',
    ['Budi', 'Cici', 'Andi dan Budi', 'Tidak dapat disimpulkan'],
    'Andi > Budi > Cici, sehingga Andi paling tinggi.',
    ['penalaran', 'analitis'],
  ),
  q(
    'penalaran',
    'MEDIUM',
    'Rapat A dilaksanakan hari Senin. Rapat B dua hari setelah rapat A. Rapat C sehari sebelum rapat A. Rapat C dilaksanakan hari ...',
    'Minggu',
    ['Sabtu', 'Selasa', 'Senin', 'Jumat'],
    'Sehari sebelum Senin adalah Minggu.',
    ['penalaran', 'analitis'],
  ),
  q(
    'penalaran',
    'MEDIUM',
    'Toko buka Senin sampai Sabtu dan tutup pada Minggu. Hari ini Rabu. Tiga hari lagi toko ...',
    'buka, karena hari Sabtu',
    [
      'tutup, karena hari Minggu',
      'tutup, karena hari Jumat',
      'buka, karena hari Jumat',
      'tidak dapat ditentukan',
    ],
    'Rabu ditambah tiga hari menjadi Sabtu; toko buka pada Sabtu.',
    ['penalaran', 'analitis'],
  ),
  q(
    'penalaran',
    'HARD',
    'Nilai Dodi lebih tinggi dari Eka, Eka lebih tinggi dari Fani, dan Fani lebih tinggi dari Gita. Nilai terendah adalah milik ...',
    'Gita',
    ['Dodi', 'Eka', 'Fani', 'Tidak dapat disimpulkan'],
    'Urutan menurun: Dodi, Eka, Fani, Gita sehingga Gita paling rendah.',
    ['penalaran', 'analitis'],
  ),

  /* ---------- logika (4) ---------- */
  q(
    'penalaran',
    'EASY',
    'Ingkaran dari pernyataan "Semua peserta lulus" adalah ...',
    'Ada peserta yang tidak lulus',
    [
      'Semua peserta tidak lulus',
      'Tidak ada peserta yang lulus',
      'Sebagian peserta lulus',
      'Peserta tidak diuji',
    ],
    'Ingkaran "semua P adalah Q" adalah "ada P yang bukan Q".',
    ['penalaran', 'logika'],
  ),
  q(
    'penalaran',
    'MEDIUM',
    'Jika hujan turun maka jalan basah. Jalan tidak basah. Kesimpulan yang tepat adalah ...',
    'Hujan tidak turun',
    ['Hujan turun', 'Jalan tetap basah', 'Jalan kering karena angin', 'Tidak dapat disimpulkan'],
    'Modus tollens: p → q dan ¬q menghasilkan ¬p.',
    ['penalaran', 'logika'],
  ),
  q(
    'penalaran',
    'MEDIUM',
    'Jika lampu mati maka ruang gelap. Ruang gelap. Kesimpulan yang tepat adalah ...',
    'Tidak dapat disimpulkan bahwa lampu mati',
    ['Lampu pasti mati', 'Lampu pasti menyala', 'Ruang tidak gelap', 'Lampu tidak ada'],
    'Menegaskan konsekuen tidak menghasilkan kesimpulan yang sah (fallacy of affirming the consequent).',
    ['penalaran', 'logika'],
  ),
  q(
    'penalaran',
    'MEDIUM',
    'Kontraposisi dari pernyataan "Jika A maka B" adalah ...',
    'Jika bukan B maka bukan A',
    ['Jika B maka A', 'Jika bukan A maka bukan B', 'Jika A maka bukan B', 'B dan bukan A'],
    'Kontraposisi "A → B" adalah "¬B → ¬A" dan bernilai ekuivalen.',
    ['penalaran', 'logika'],
  ),
];

/* --------------------------------------------- pilihan ganda banyak jawaban */

/**
 * Soal `MULTI_CHOICE` TPA (F4-05).
 *
 * Catatan penilaian: `scoringStrategy` pada baris soal disimpan sebagai
 * metadata (`MULTI_CORRECT_PARTIAL`, sama dengan default admin), tetapi
 * perhitungan skor sesi memakai strategi **subtes** (`KEYED_CORRECT`). Strategi
 * itu menilai benar bila himpunan opsi terpilih sama persis dengan kunci —
 * tidak ada kredit parsial — sehingga perilakunya dapat diuji dan konsisten
 * dengan soal pilihan tunggal pada subtes yang sama.
 */
export const TPA_MULTI_CHOICE: WrittenMultiChoice[] = [
  {
    topic: 'penalaran',
    difficulty: 'EASY',
    stem: 'Manakah di antara bilangan berikut yang merupakan bilangan prima?',
    correct: ['2', '7', '13'],
    distractors: ['9', '15'],
    explanation:
      '2, 7, dan 13 hanya habis dibagi 1 dan dirinya sendiri. 9 = 3 × 3 dan 15 = 3 × 5.',
    tags: ['penalaran', 'bilangan-prima', 'multi-jawaban'],
  },
  {
    topic: 'penalaran',
    difficulty: 'MEDIUM',
    stem: 'Manakah pernyataan berikut yang benar tentang segitiga?',
    correct: ['Jumlah ketiga sudutnya 180 derajat', 'Segitiga sama sisi memiliki tiga sudut 60 derajat'],
    distractors: [
      'Jumlah ketiga sudutnya 360 derajat',
      'Semua segitiga memiliki satu sudut siku-siku',
      'Segitiga sama kaki tidak memiliki simetri lipat',
    ],
    explanation:
      'Jumlah sudut segitiga selalu 180 derajat; pada segitiga sama sisi tiap sudut 180 ÷ 3 = 60 derajat.',
    tags: ['penalaran', 'geometri', 'multi-jawaban'],
  },
  {
    topic: 'penalaran',
    difficulty: 'MEDIUM',
    stem: 'Manakah perhitungan berikut yang hasilnya benar?',
    correct: ['12 × 3 = 36', '48 ÷ 4 = 12'],
    distractors: ['7 + 8 = 16', '9 × 9 = 80', '100 − 45 = 65'],
    explanation:
      '12 × 3 = 36 dan 48 ÷ 4 = 12 benar. 7 + 8 = 15, 9 × 9 = 81, dan 100 − 45 = 55.',
    tags: ['penalaran', 'aritmetika', 'multi-jawaban'],
  },
];

/* ----------------------------------------------------------------- ekspor */

export const TPA_VERBAL = VERBAL;
export const TPA_NUMERIK = NUMERIK;
export const TPA_PENALARAN = PENALARAN;

/** 87 soal TPA tertulis (40 verbal + 35 numerik + 12 penalaran). */
export const TPA_QUESTIONS: WrittenQuestion[] = [...VERBAL, ...NUMERIK, ...PENALARAN];
