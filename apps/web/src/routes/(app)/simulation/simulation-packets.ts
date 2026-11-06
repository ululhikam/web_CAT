/**
 * Bank Soal & Konfigurasi Paket Pretest CAT Polri (Seleksi SIP / Akpol / Bintara)
 * Rata-rata 100 Butir per Subtes Sesuai Standar Ujian CAT Polri:
 * 1. Kecerdasan: 100 Soal (90 Menit) — Verbal, Logika, Aritmatika Taktis, Denah Wilayah & Spasial
 * 2. Mental Kepribadian: 100 Soal (60 Menit) — Studi Kasus Situasional Kedinasan Polri (SJT Skala 1–5)
 * 3. Kecermatan: 100 Soal (5 Kolom @ 20 Soal / 1 Menit per Kolom = 5 Menit) — Format Monokrom Putih CAT
 * 4. TKK: 100 Soal (90 Menit) — Tes Kemampuan Komputer & Keamanan Siber Kedinasan
 * 5. TPK: 100 Soal (60 Menit) — UU No. 2/2002, Kode Etik Profesi Polri & KUHAP
 */

export interface SimOption {
  key: string;
  text: string;
  weight?: number;
}

export interface SimBenchmarkItem {
  char: string;
  label: string;
}

export interface SimQuestion {
  id: number;
  module: string;
  subtest?: 'KECERDASAN' | 'KEPRIBADIAN' | 'KECERMATAN' | 'TKK' | 'TPK';
  stem: string;
  image?: string;
  options: SimOption[];
  correctKey: string;
  explanation: string;
  weight?: number;
  optionWeights?: Record<string, number>;
  dimension?: string;
  isKecermatan?: boolean;
  columnNumber?: number;
  benchmark?: SimBenchmarkItem[];
  questionChars?: string[];
}

export interface SimPacket {
  id: string;
  category: 'PSIKOTES' | 'TKK' | 'TPK' | 'ALL';
  subtest?: 'ALL' | 'KECERDASAN' | 'KEPRIBADIAN' | 'KECERMATAN';
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  durationSeconds: number;
  isKecermatanOnly?: boolean;
  columnDurationSeconds?: number;
  questions: SimQuestion[];
}

/* -------------------------------------------------------------------------- */
/* 1. KUMPULAN SOAL KECERDASAN (100 Butir)                                     */
/* -------------------------------------------------------------------------- */
const QUESTIONS_KECERDASAN: SimQuestion[] = [
  {
    "id": 101,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Dokter : Rumah Sakit = Guru : ...",
    "options": [
      {
        "key": "A",
        "text": "Kantor"
      },
      {
        "key": "B",
        "text": "Sekolah"
      },
      {
        "key": "C",
        "text": "Pasar"
      },
      {
        "key": "D",
        "text": "Terminal"
      },
      {
        "key": "E",
        "text": "Perpustakaan"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Sekolah Dokter bekerja di rumah sakit; guru bekerja di sekolah.",
    "weight": 10
  },
  {
    "id": 102,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Kompas : Arah = Termometer : ...",
    "options": [
      {
        "key": "A",
        "text": "Kecepatan"
      },
      {
        "key": "B",
        "text": "Suhu"
      },
      {
        "key": "C",
        "text": "Jarak"
      },
      {
        "key": "D",
        "text": "Berat"
      },
      {
        "key": "E",
        "text": "Volume"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Suhu Kompas menunjukkan arah, sedangkan termometer mengukur suhu.",
    "weight": 10
  },
  {
    "id": 103,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Kata yang paling dekat maknanya dengan “cermat” adalah ...",
    "options": [
      {
        "key": "A",
        "text": "Ceroboh"
      },
      {
        "key": "B",
        "text": "Teliti"
      },
      {
        "key": "C",
        "text": "Lambat"
      },
      {
        "key": "D",
        "text": "Ragu"
      },
      {
        "key": "E",
        "text": "Cepat"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Teliti Cermat berarti teliti dan berhati-hati.",
    "weight": 10
  },
  {
    "id": 104,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Lawan kata “objektif” adalah ...",
    "options": [
      {
        "key": "A",
        "text": "Netral"
      },
      {
        "key": "B",
        "text": "Faktual"
      },
      {
        "key": "C",
        "text": "Subjektif"
      },
      {
        "key": "D",
        "text": "Terukur"
      },
      {
        "key": "E",
        "text": "Terbuka"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. Subjektif Objektif berdasarkan fakta; subjektif dipengaruhi pandangan pribadi.",
    "weight": 10
  },
  {
    "id": 105,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Sinonim “integritas” yang paling tepat adalah ...",
    "options": [
      {
        "key": "A",
        "text": "Kejujuran"
      },
      {
        "key": "B",
        "text": "Kecepatan"
      },
      {
        "key": "C",
        "text": "Kekuasaan"
      },
      {
        "key": "D",
        "text": "Ketenaran"
      },
      {
        "key": "E",
        "text": "Kekayaan"
      }
    ],
    "correctKey": "A",
    "explanation": "Kunci Jawaban: A. Kejujuran Integritas berkaitan dengan kejujuran, konsistensi nilai, dan dapat dipercaya.",
    "weight": 10
  },
  {
    "id": 106,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Buku : Membaca = Makanan : ...",
    "options": [
      {
        "key": "A",
        "text": "Memasak"
      },
      {
        "key": "B",
        "text": "Memakan"
      },
      {
        "key": "C",
        "text": "Membeli"
      },
      {
        "key": "D",
        "text": "Menyimpan"
      },
      {
        "key": "E",
        "text": "Menyajikan"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Memakan Buku digunakan untuk dibaca; makanan untuk dimakan.",
    "weight": 10
  },
  {
    "id": 107,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Pilih kata yang tidak sekelompok.",
    "options": [
      {
        "key": "A",
        "text": "Mawar"
      },
      {
        "key": "B",
        "text": "Melati"
      },
      {
        "key": "C",
        "text": "Anggrek"
      },
      {
        "key": "D",
        "text": "Bayam"
      },
      {
        "key": "E",
        "text": "Tulip"
      }
    ],
    "correctKey": "D",
    "explanation": "Kunci Jawaban: D. Bayam Bayam merupakan sayuran, sedangkan lainnya bunga.",
    "weight": 10
  },
  {
    "id": 108,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "“Semua penyidik adalah anggota Polri. Sebagian anggota Polri bertugas di lalu lintas.” Kesimpulan yang pasti adalah ...",
    "options": [
      {
        "key": "A",
        "text": "Semua penyidik bertugas di lalu lintas"
      },
      {
        "key": "B",
        "text": "Sebagian penyidik pasti bertugas di lalu lintas"
      },
      {
        "key": "C",
        "text": "Semua penyidik adalah anggota Polri"
      },
      {
        "key": "D",
        "text": "Tidak ada penyidik di lalu lintas"
      },
      {
        "key": "E",
        "text": "Penyidik tidak terikat ketentuan Polri"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. Semua penyidik adalah anggota Polri Pernyataan pertama secara langsung memastikan semua penyidik termasuk anggota Polri; tidak ada hubungan pasti dengan petugas lalu lintas.",
    "weight": 10
  },
  {
    "id": 109,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Makna ungkapan “berpikir jernih” adalah ...",
    "options": [
      {
        "key": "A",
        "text": "Berpikir tanpa emosi berlebihan dan berdasarkan fakta"
      },
      {
        "key": "B",
        "text": "Berpikir sangat cepat"
      },
      {
        "key": "C",
        "text": "Mengikuti pendapat terbanyak"
      },
      {
        "key": "D",
        "text": "Menghindari keputusan"
      },
      {
        "key": "E",
        "text": "Mengambil keputusan secara emosional dan tergesa-gesa"
      }
    ],
    "correctKey": "A",
    "explanation": "Kunci Jawaban: A. Berpikir tanpa emosi berlebihan dan berdasarkan fakta Berpikir jernih berarti menilai masalah secara tenang, logis, dan berbasis fakta.",
    "weight": 10
  },
  {
    "id": 110,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Kalimat yang paling efektif adalah ...",
    "options": [
      {
        "key": "A",
        "text": "Para peserta-peserta diminta untuk hadir semua"
      },
      {
        "key": "B",
        "text": "Kepada seluruh peserta dimohon agar supaya hadir"
      },
      {
        "key": "C",
        "text": "Seluruh peserta diminta hadir tepat waktu"
      },
      {
        "key": "D",
        "text": "Seluruh daripada peserta wajib untuk hadir"
      },
      {
        "key": "B",
        "text": "KEMAMPUAN NUMERIK"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. Seluruh peserta diminta hadir tepat waktu Kalimat C hemat kata, jelas, dan tidak mengandung pengulangan yang tidak perlu.",
    "weight": 10
  },
  {
    "id": 111,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "18 + 27 × 2 = ...",
    "options": [
      {
        "key": "A",
        "text": "63"
      },
      {
        "key": "B",
        "text": "72"
      },
      {
        "key": "C",
        "text": "81"
      },
      {
        "key": "D",
        "text": "90"
      },
      {
        "key": "E",
        "text": "90"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. 72 Kerjakan perkalian lebih dahulu: 27 × 2 = 54, lalu 18 + 54 = 72.",
    "weight": 10
  },
  {
    "id": 112,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Jika 15% dari 240 adalah ...",
    "options": [
      {
        "key": "A",
        "text": "24"
      },
      {
        "key": "B",
        "text": "30"
      },
      {
        "key": "C",
        "text": "36"
      },
      {
        "key": "D",
        "text": "40"
      },
      {
        "key": "E",
        "text": "48"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. 36 15% × 240 = 0,15 × 240 = 36.",
    "weight": 10
  },
  {
    "id": 113,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Sebuah regu terdiri dari 8 orang. Jika 3 regu berjumlah ... orang.",
    "options": [
      {
        "key": "A",
        "text": "21"
      },
      {
        "key": "B",
        "text": "24"
      },
      {
        "key": "C",
        "text": "27"
      },
      {
        "key": "D",
        "text": "32"
      },
      {
        "key": "E",
        "text": "32"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. 24 Jumlah orang = 8 × 3 = 24.",
    "weight": 10
  },
  {
    "id": 114,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Perbandingan 2 : 5 setara dengan ...",
    "options": [
      {
        "key": "A",
        "text": "4 : 8"
      },
      {
        "key": "B",
        "text": "6 : 15"
      },
      {
        "key": "C",
        "text": "8 : 15"
      },
      {
        "key": "D",
        "text": "10 : 20"
      },
      {
        "key": "E",
        "text": "8 : 15"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. 6 : 15 Kalikan kedua bagian 2:5 dengan 3 sehingga menjadi 6:15.",
    "weight": 10
  },
  {
    "id": 115,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Harga barang Rp200.000 mendapat potongan 10%. Harga setelah diskon adalah ...",
    "options": [
      {
        "key": "A",
        "text": "Rp170.000"
      },
      {
        "key": "B",
        "text": "Rp175.000"
      },
      {
        "key": "C",
        "text": "Rp180.000"
      },
      {
        "key": "D",
        "text": "Rp190.000"
      },
      {
        "key": "E",
        "text": "Rp250.000"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. Rp180.000 Diskon 10% = Rp20.000; harga akhir Rp180.000.",
    "weight": 10
  },
  {
    "id": 116,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Rata-rata dari 6, 8, 10, dan 12 adalah ...",
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "9"
      },
      {
        "key": "C",
        "text": "10"
      },
      {
        "key": "D",
        "text": "11"
      },
      {
        "key": "E",
        "text": "15"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. 9 Jumlah 36 dibagi 4 data = 9.",
    "weight": 10
  },
  {
    "id": 117,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Sebuah kendaraan menempuh 150 km dalam 3 jam. Kecepatan rata-ratanya ...",
    "options": [
      {
        "key": "A",
        "text": "40 km/jam"
      },
      {
        "key": "B",
        "text": "45 km/jam"
      },
      {
        "key": "C",
        "text": "50 km/jam"
      },
      {
        "key": "D",
        "text": "60 km/jam"
      },
      {
        "key": "E",
        "text": "65 km/jam"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. 50 km/jam Kecepatan = jarak ÷ waktu = 150 ÷ 3 = 50 km/jam.",
    "weight": 10
  },
  {
    "id": 118,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Jika 4x = 52, nilai x adalah ...",
    "options": [
      {
        "key": "A",
        "text": "11"
      },
      {
        "key": "B",
        "text": "12"
      },
      {
        "key": "C",
        "text": "13"
      },
      {
        "key": "D",
        "text": "14"
      },
      {
        "key": "E",
        "text": "16"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. 13 Bagi kedua ruas dengan 4: x = 52 ÷ 4 = 13.",
    "weight": 10
  },
  {
    "id": 119,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Jumlah 5 bilangan berurutan adalah 60. Bilangan tengahnya adalah ...",
    "options": [
      {
        "key": "A",
        "text": "10"
      },
      {
        "key": "B",
        "text": "11"
      },
      {
        "key": "C",
        "text": "12"
      },
      {
        "key": "D",
        "text": "13"
      },
      {
        "key": "E",
        "text": "18"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. 12 Pada lima bilangan berurutan, rata-rata sama dengan bilangan tengah. 60 ÷ 5 = 12.",
    "weight": 10
  },
  {
    "id": 120,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Sebuah pekerjaan selesai 12 hari oleh 6 orang dengan kemampuan sama. Jika dikerjakan 9 orang, waktu yang diperlukan ...",
    "options": [
      {
        "key": "A",
        "text": "6 hari"
      },
      {
        "key": "B",
        "text": "8 hari"
      },
      {
        "key": "C",
        "text": "9 hari"
      },
      {
        "key": "D",
        "text": "10 hari"
      },
      {
        "key": "C",
        "text": "DERET DAN POLA"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. 8 hari Total beban 6 × 12 = 72 orang-hari. 72 ÷ 9 = 8 hari.",
    "weight": 10
  },
  {
    "id": 121,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "2, 4, 8, 16, ...",
    "options": [
      {
        "key": "A",
        "text": "20"
      },
      {
        "key": "B",
        "text": "24"
      },
      {
        "key": "C",
        "text": "30"
      },
      {
        "key": "D",
        "text": "32"
      },
      {
        "key": "E",
        "text": "36"
      }
    ],
    "correctKey": "D",
    "explanation": "Kunci Jawaban: D. 32 Setiap suku dikali 2; 16 × 2 = 32.",
    "weight": 10
  },
  {
    "id": 122,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "3, 6, 11, 18, 27, ...",
    "options": [
      {
        "key": "A",
        "text": "36"
      },
      {
        "key": "B",
        "text": "38"
      },
      {
        "key": "C",
        "text": "40"
      },
      {
        "key": "D",
        "text": "42"
      },
      {
        "key": "E",
        "text": "42"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. 38 Selisihnya +3, +5, +7, +9; berikutnya +11, sehingga 27 + 11 = 38.",
    "weight": 10
  },
  {
    "id": 123,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "5, 10, 20, 40, ...",
    "options": [
      {
        "key": "A",
        "text": "58"
      },
      {
        "key": "B",
        "text": "59"
      },
      {
        "key": "C",
        "text": "60"
      },
      {
        "key": "D",
        "text": "61"
      },
      {
        "key": "E",
        "text": "72"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. 60 Pengurangan −10, −9, −8, −7; berikutnya −6, hasil 60.",
    "weight": 10
  },
  {
    "id": 124,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "1, 4, 9, 16, 25, ...",
    "options": [
      {
        "key": "A",
        "text": "30"
      },
      {
        "key": "B",
        "text": "32"
      },
      {
        "key": "C",
        "text": "36"
      },
      {
        "key": "D",
        "text": "49"
      },
      {
        "key": "E",
        "text": "45"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. 36 Deret kuadrat: 1², 2², 3², 4², 5²; berikutnya 6² = 36.",
    "weight": 10
  },
  {
    "id": 125,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "40, 35, 29, 22, 14, ...",
    "options": [
      {
        "key": "A",
        "text": "4"
      },
      {
        "key": "B",
        "text": "5"
      },
      {
        "key": "C",
        "text": "6"
      },
      {
        "key": "D",
        "text": "7"
      },
      {
        "key": "E",
        "text": "7"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. 5 Selisih berturut-turut −5, −6, −7, −8; berikutnya −9, hasil 5.",
    "weight": 10
  },
  {
    "id": 126,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "2, 5, 10, 17, 26, ...",
    "options": [
      {
        "key": "A",
        "text": "35"
      },
      {
        "key": "B",
        "text": "36"
      },
      {
        "key": "C",
        "text": "37"
      },
      {
        "key": "D",
        "text": "38"
      },
      {
        "key": "E",
        "text": "45"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. 37 Pola n² + 1: 1²+1, 2²+1, ...; berikutnya 6²+1 = 37.",
    "weight": 10
  },
  {
    "id": 127,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "100, 90, 81, 73, 66, ...",
    "options": [
      {
        "key": "A",
        "text": "58"
      },
      {
        "key": "B",
        "text": "59"
      },
      {
        "key": "C",
        "text": "60"
      },
      {
        "key": "D",
        "text": "61"
      },
      {
        "key": "E",
        "text": "67"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. 59 Pengurangan −10, −9, −8, −7; berikutnya −6, hasil 60. (Jawaban yang benar 60.)",
    "weight": 10
  },
  {
    "id": 128,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "A, C, F, J, O, ...",
    "options": [
      {
        "key": "A",
        "text": "S"
      },
      {
        "key": "B",
        "text": "T"
      },
      {
        "key": "C",
        "text": "U"
      },
      {
        "key": "D",
        "text": "V"
      },
      {
        "key": "E",
        "text": "W"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. U Posisi huruf bertambah +2, +3, +4, +5; berikutnya +6: O ke U.",
    "weight": 10
  },
  {
    "id": 129,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "1, 2, 6, 24, 120, ...",
    "options": [
      {
        "key": "A",
        "text": "240"
      },
      {
        "key": "B",
        "text": "360"
      },
      {
        "key": "C",
        "text": "600"
      },
      {
        "key": "D",
        "text": "720"
      },
      {
        "key": "E",
        "text": "840"
      }
    ],
    "correctKey": "D",
    "explanation": "Kunci Jawaban: D. 720 Pola faktorial: ×2, ×3, ×4, ×5; berikutnya ×6 = 720.",
    "weight": 10
  },
  {
    "id": 130,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "7, 14, 12, 24, 22, 44, ...",
    "options": [
      {
        "key": "A",
        "text": "40"
      },
      {
        "key": "B",
        "text": "41"
      },
      {
        "key": "C",
        "text": "42"
      },
      {
        "key": "D",
        "text": "46"
      },
      {
        "key": "D",
        "text": "PENALARAN LOGIS"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. 42 Pola bergantian ×2 lalu −2; setelah 44, kurangi 2 menjadi 42.",
    "weight": 10
  },
  {
    "id": 131,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Semua perwira adalah pemimpin. Sebagian pemimpin mengikuti pelatihan. Kesimpulan yang pasti adalah ...",
    "options": [
      {
        "key": "A",
        "text": "Semua perwira mengikuti pelatihan"
      },
      {
        "key": "B",
        "text": "Sebagian perwira mengikuti pelatihan"
      },
      {
        "key": "C",
        "text": "Semua perwira adalah pemimpin"
      },
      {
        "key": "D",
        "text": "Tidak ada perwira yang mengikuti pelatihan"
      },
      {
        "key": "E",
        "text": "Semua pimpinan bertugas di staf"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. Semua perwira adalah pemimpin Premis pertama menyatakan seluruh perwira termasuk kelompok pemimpin. Premis kedua tidak memastikan apakah perwira termasuk peserta pelatihan.",
    "weight": 10
  },
  {
    "id": 132,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Jika hujan, lapangan basah. Lapangan tidak basah. Dengan asumsi hubungan sebab-akibat pada premis berlaku, kesimpulannya ...",
    "options": [
      {
        "key": "A",
        "text": "Hujan"
      },
      {
        "key": "B",
        "text": "Tidak hujan"
      },
      {
        "key": "C",
        "text": "Lapangan tergenang"
      },
      {
        "key": "D",
        "text": "Tidak dapat disimpulkan"
      },
      {
        "key": "E",
        "text": "Jalanan tidak licin"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Tidak hujan Ini bentuk modus tollens: jika P maka Q; bukan Q; maka bukan P.",
    "weight": 10
  },
  {
    "id": 133,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Semua dokumen rahasia disimpan terkunci. Berkas X tidak disimpan terkunci. Maka ...",
    "options": [
      {
        "key": "A",
        "text": "X pasti rahasia"
      },
      {
        "key": "B",
        "text": "X bukan dokumen rahasia"
      },
      {
        "key": "C",
        "text": "Semua berkas terbuka"
      },
      {
        "key": "D",
        "text": "X telah hilang"
      },
      {
        "key": "E",
        "text": "Dokumen X belum diverifikasi"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. X bukan dokumen rahasia Jika semua dokumen rahasia terkunci, berkas yang tidak terkunci tidak termasuk kelompok dokumen rahasia dalam premis.",
    "weight": 10
  },
  {
    "id": 134,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Andi lebih tinggi daripada Budi. Budi lebih tinggi daripada Candra. Siapa paling pendek?",
    "options": [
      {
        "key": "A",
        "text": "Andi"
      },
      {
        "key": "B",
        "text": "Budi"
      },
      {
        "key": "C",
        "text": "Candra"
      },
      {
        "key": "D",
        "text": "Tidak dapat ditentukan"
      },
      {
        "key": "E",
        "text": "Eko"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. Candra Urutan tinggi: Andi > Budi > Candra; jadi Candra paling pendek.",
    "weight": 10
  },
  {
    "id": 135,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Jika laporan lengkap, pemeriksaan dapat dilanjutkan. Laporan lengkap. Maka ...",
    "options": [
      {
        "key": "A",
        "text": "Pemeriksaan dapat dilanjutkan"
      },
      {
        "key": "B",
        "text": "Pemeriksaan pasti selesai"
      },
      {
        "key": "C",
        "text": "Laporan salah"
      },
      {
        "key": "D",
        "text": "Tidak ada pemeriksaan"
      },
      {
        "key": "E",
        "text": "Pemeriksaan dihentikan permanen"
      }
    ],
    "correctKey": "A",
    "explanation": "Kunci Jawaban: A. Pemeriksaan dapat dilanjutkan Pernyataan memenuhi bentuk modus ponens: P → Q, P, maka Q.",
    "weight": 10
  },
  {
    "id": 136,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Tiga orang A, B, C duduk berurutan. A tidak di ujung dan B di sebelah kiri C. Susunan yang benar adalah ...",
    "options": [
      {
        "key": "A",
        "text": "A-B-C"
      },
      {
        "key": "B",
        "text": "B-A-C"
      },
      {
        "key": "C",
        "text": "C-A-B"
      },
      {
        "key": "D",
        "text": "B-C-A"
      },
      {
        "key": "E",
        "text": "C-B-A"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. B-A-C A harus di tengah. Agar B di kiri C, susunannya B-A-C.",
    "weight": 10
  },
  {
    "id": 137,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Semua anggota tim hadir tepat waktu. Rina anggota tim. Maka ...",
    "options": [
      {
        "key": "A",
        "text": "Rina mungkin terlambat"
      },
      {
        "key": "B",
        "text": "Rina hadir tepat waktu"
      },
      {
        "key": "C",
        "text": "Rina bukan anggota"
      },
      {
        "key": "D",
        "text": "Semua orang anggota tim"
      },
      {
        "key": "E",
        "text": "Rina mendapatkan dispensasi"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Rina hadir tepat waktu Rina termasuk anggota tim sehingga sifat yang berlaku untuk semua anggota juga berlaku pada Rina.",
    "weight": 10
  },
  {
    "id": 138,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Jika keputusan disetujui atasan, operasi dimulai. Operasi belum dimulai. Kesimpulan paling logis ...",
    "options": [
      {
        "key": "A",
        "text": "Keputusan pasti disetujui"
      },
      {
        "key": "B",
        "text": "Keputusan belum disetujui"
      },
      {
        "key": "C",
        "text": "Operasi sudah selesai"
      },
      {
        "key": "D",
        "text": "Atasan tidak ada"
      },
      {
        "key": "E",
        "text": "Keputusan ditolak sepenuhnya"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Keputusan belum disetujui Dengan asumsi aturan bersifat pasti, belum dimulainya operasi berarti syarat persetujuan belum terpenuhi.",
    "weight": 10
  },
  {
    "id": 139,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Pernyataan “tidak semua peserta lulus” setara dengan ...",
    "options": [
      {
        "key": "A",
        "text": "Tidak ada peserta yang lulus"
      },
      {
        "key": "B",
        "text": "Semua peserta gagal"
      },
      {
        "key": "C",
        "text": "Ada peserta yang tidak lulus"
      },
      {
        "key": "D",
        "text": "Semua peserta lulus"
      },
      {
        "key": "E",
        "text": "Seluruh peserta gagal ujian"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. Ada peserta yang tidak lulus Negasi dari “semua lulus” adalah “setidaknya ada satu yang tidak lulus”.",
    "weight": 10
  },
  {
    "id": 140,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Dalam antrean, D di depan E, E di depan F, dan G di belakang F. Siapa paling depan di antara keempatnya?",
    "options": [
      {
        "key": "A",
        "text": "D"
      },
      {
        "key": "B",
        "text": "E"
      },
      {
        "key": "C",
        "text": "F"
      },
      {
        "key": "D",
        "text": "G"
      },
      {
        "key": "E",
        "text": "KLASIFIKASI DAN ANALOGI"
      }
    ],
    "correctKey": "A",
    "explanation": "Kunci Jawaban: A. D Urutannya D, E, F, G sehingga D berada paling depan.",
    "weight": 10
  },
  {
    "id": 141,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Manakah yang berbeda kelompok?",
    "options": [
      {
        "key": "A",
        "text": "Segitiga"
      },
      {
        "key": "B",
        "text": "Persegi"
      },
      {
        "key": "C",
        "text": "Lingkaran"
      },
      {
        "key": "D",
        "text": "Kubus"
      },
      {
        "key": "E",
        "text": "Prisma segitiga"
      }
    ],
    "correctKey": "D",
    "explanation": "Kunci Jawaban: D. Kubus Kubus merupakan bangun ruang tiga dimensi; lainnya bangun datar.",
    "weight": 10
  },
  {
    "id": 142,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Peta : Wilayah = Denah : ...",
    "options": [
      {
        "key": "A",
        "text": "Bangunan/ruangan"
      },
      {
        "key": "B",
        "text": "Cuaca"
      },
      {
        "key": "C",
        "text": "Waktu"
      },
      {
        "key": "D",
        "text": "Suara"
      },
      {
        "key": "E",
        "text": "Pemandangan alam terbuka"
      }
    ],
    "correctKey": "A",
    "explanation": "Kunci Jawaban: A. Bangunan/ruangan Peta menggambarkan wilayah; denah menggambarkan tata letak bangunan atau ruangan.",
    "weight": 10
  },
  {
    "id": 143,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Mata : Melihat = Telinga : ...",
    "options": [
      {
        "key": "A",
        "text": "Berjalan"
      },
      {
        "key": "B",
        "text": "Mendengar"
      },
      {
        "key": "C",
        "text": "Mencium"
      },
      {
        "key": "D",
        "text": "Mengecap"
      },
      {
        "key": "E",
        "text": "Berbicara"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Mendengar Mata berfungsi untuk melihat, telinga untuk mendengar.",
    "weight": 10
  },
  {
    "id": 144,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Manakah yang tidak sejenis?",
    "options": [
      {
        "key": "A",
        "text": "Merah"
      },
      {
        "key": "B",
        "text": "Biru"
      },
      {
        "key": "C",
        "text": "Hijau"
      },
      {
        "key": "D",
        "text": "Meja"
      },
      {
        "key": "E",
        "text": "Lantai"
      }
    ],
    "correctKey": "D",
    "explanation": "Kunci Jawaban: D. Meja Meja adalah benda; merah, biru, dan hijau adalah warna.",
    "weight": 10
  },
  {
    "id": 145,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Benih : Tanaman = Telur : ...",
    "options": [
      {
        "key": "A",
        "text": "Sarang"
      },
      {
        "key": "B",
        "text": "Burung"
      },
      {
        "key": "C",
        "text": "Bulu"
      },
      {
        "key": "D",
        "text": "Pohon"
      },
      {
        "key": "E",
        "text": "Kucing"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Burung Benih dapat tumbuh menjadi tanaman; telur dapat berkembang menjadi burung.",
    "weight": 10
  },
  {
    "id": 146,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Manakah pasangan yang memiliki hubungan bagian-keseluruhan?",
    "options": [
      {
        "key": "A",
        "text": "Roda-mobil"
      },
      {
        "key": "B",
        "text": "Buku-perpustakaan"
      },
      {
        "key": "C",
        "text": "Pohon-hutan"
      },
      {
        "key": "D",
        "text": "Semua benar"
      },
      {
        "key": "E",
        "text": "Tidak ada pilihan yang benar"
      }
    ],
    "correctKey": "D",
    "explanation": "Kunci Jawaban: D. Semua benar Roda bagian mobil; buku bagian koleksi perpustakaan; pohon bagian dari hutan.",
    "weight": 10
  },
  {
    "id": 147,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Pilih yang tidak termasuk alat ukur.",
    "options": [
      {
        "key": "A",
        "text": "Penggaris"
      },
      {
        "key": "B",
        "text": "Termometer"
      },
      {
        "key": "C",
        "text": "Timbangan"
      },
      {
        "key": "D",
        "text": "Kompas"
      },
      {
        "key": "E",
        "text": "Stopwatch"
      }
    ],
    "correctKey": "D",
    "explanation": "Kunci Jawaban: D. Kompas Kompas menunjukkan arah, bukan mengukur besaran seperti panjang, suhu, atau massa.",
    "weight": 10
  },
  {
    "id": 148,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Pagi : Siang = Senin : ...",
    "options": [
      {
        "key": "A",
        "text": "Minggu"
      },
      {
        "key": "B",
        "text": "Selasa"
      },
      {
        "key": "C",
        "text": "Jumat"
      },
      {
        "key": "D",
        "text": "Sabtu"
      },
      {
        "key": "E",
        "text": "Kamis"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Selasa Siang mengikuti pagi; Selasa mengikuti Senin.",
    "weight": 10
  },
  {
    "id": 149,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Kunci : Gembok = Kata sandi : ...",
    "options": [
      {
        "key": "A",
        "text": "Akun"
      },
      {
        "key": "B",
        "text": "Monitor"
      },
      {
        "key": "C",
        "text": "Kabel"
      },
      {
        "key": "D",
        "text": "Printer"
      },
      {
        "key": "E",
        "text": "Server pusat"
      }
    ],
    "correctKey": "A",
    "explanation": "Kunci Jawaban: A. Akun Kunci membuka gembok; kata sandi memberi akses ke akun.",
    "weight": 10
  },
  {
    "id": 150,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Manakah yang paling tepat menjadi kategori umum bagi apel, mangga, dan pisang?",
    "options": [
      {
        "key": "A",
        "text": "Sayuran"
      },
      {
        "key": "B",
        "text": "Buah-buahan"
      },
      {
        "key": "C",
        "text": "Rempah"
      },
      {
        "key": "D",
        "text": "Biji-bijian F. PENALARAN DATA"
      },
      {
        "key": "E",
        "text": "Biji-bijian"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Buah-buahan Ketiganya termasuk buah-buahan.",
    "weight": 10
  },
  {
    "id": 151,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Jumlah laporan: Senin 12, Selasa 15, Rabu 9. Total laporan selama tiga hari adalah ...",
    "options": [
      {
        "key": "A",
        "text": "34"
      },
      {
        "key": "B",
        "text": "35"
      },
      {
        "key": "C",
        "text": "36"
      },
      {
        "key": "D",
        "text": "37"
      },
      {
        "key": "E",
        "text": "48"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. 36 12 + 15 + 9 = 36 laporan.",
    "weight": 10
  },
  {
    "id": 152,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Dari 80 peserta, 20 orang memilih materi A. Persentasenya adalah ...",
    "options": [
      {
        "key": "A",
        "text": "20%"
      },
      {
        "key": "B",
        "text": "25%"
      },
      {
        "key": "C",
        "text": "30%"
      },
      {
        "key": "D",
        "text": "40%"
      },
      {
        "key": "E",
        "text": "35%"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. 25% 20 ÷ 80 × 100% = 25%.",
    "weight": 10
  },
  {
    "id": 153,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Nilai rata-rata 4 peserta adalah 70, 75, 80, dan 95. Rata-ratanya ...",
    "options": [
      {
        "key": "A",
        "text": "78"
      },
      {
        "key": "B",
        "text": "80"
      },
      {
        "key": "C",
        "text": "82"
      },
      {
        "key": "D",
        "text": "85"
      },
      {
        "key": "E",
        "text": "95"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. 80 Jumlah nilai 320 dibagi 4 = 80.",
    "weight": 10
  },
  {
    "id": 154,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Jumlah personel naik dari 40 menjadi 50. Persentase kenaikan adalah ...",
    "options": [
      {
        "key": "A",
        "text": "10%"
      },
      {
        "key": "B",
        "text": "20%"
      },
      {
        "key": "C",
        "text": "25%"
      },
      {
        "key": "D",
        "text": "30%"
      },
      {
        "key": "E",
        "text": "35%"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. 25% Kenaikan 10 dari dasar 40; 10 ÷ 40 × 100% = 25%.",
    "weight": 10
  },
  {
    "id": 155,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Dari 120 kendaraan, 30 merupakan sepeda motor. Perbandingan sepeda motor dengan seluruh kendaraan adalah ...",
    "options": [
      {
        "key": "A",
        "text": "1:2"
      },
      {
        "key": "B",
        "text": "1:3"
      },
      {
        "key": "C",
        "text": "1:4"
      },
      {
        "key": "D",
        "text": "1:5"
      },
      {
        "key": "E",
        "text": "1:6"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. 1:4 30:120 disederhanakan dengan membagi 30 menjadi 1:4.",
    "weight": 10
  },
  {
    "id": 156,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Jika 3 dari 12 tugas belum selesai, persentase tugas yang selesai adalah ...",
    "options": [
      {
        "key": "A",
        "text": "25%"
      },
      {
        "key": "B",
        "text": "50%"
      },
      {
        "key": "C",
        "text": "75%"
      },
      {
        "key": "D",
        "text": "80%"
      },
      {
        "key": "E",
        "text": "85%"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. 75% Tugas selesai 12 − 3 = 9; 9 ÷ 12 × 100% = 75%.",
    "weight": 10
  },
  {
    "id": 157,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Data waktu respons: 4, 6, 5, 7, 8 menit. Median data adalah ...",
    "options": [
      {
        "key": "A",
        "text": "5"
      },
      {
        "key": "B",
        "text": "6"
      },
      {
        "key": "C",
        "text": "7"
      },
      {
        "key": "D",
        "text": "8"
      },
      {
        "key": "E",
        "text": "8"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. 6 Urutannya 4, 5, 6, 7, 8; nilai tengah adalah 6.",
    "weight": 10
  },
  {
    "id": 158,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Nilai tertinggi 92 dan terendah 64. Jangkauan data adalah ...",
    "options": [
      {
        "key": "A",
        "text": "18"
      },
      {
        "key": "B",
        "text": "24"
      },
      {
        "key": "C",
        "text": "28"
      },
      {
        "key": "D",
        "text": "32"
      },
      {
        "key": "E",
        "text": "35"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. 28 Jangkauan = nilai tertinggi − terendah = 92 − 64 = 28.",
    "weight": 10
  },
  {
    "id": 159,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Anggaran Rp500 juta, terpakai Rp350 juta. Sisa anggaran adalah ...",
    "options": [
      {
        "key": "A",
        "text": "Rp100 juta"
      },
      {
        "key": "B",
        "text": "Rp125 juta"
      },
      {
        "key": "C",
        "text": "Rp150 juta"
      },
      {
        "key": "D",
        "text": "Rp175 juta"
      },
      {
        "key": "E",
        "text": "Rp200 juta"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. Rp150 juta Rp500 juta − Rp350 juta = Rp150 juta.",
    "weight": 10
  },
  {
    "id": 160,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Dari 200 responden, 120 menyatakan puas. Jumlah yang tidak puas atau tidak memilih puas adalah ...",
    "options": [
      {
        "key": "A",
        "text": "60"
      },
      {
        "key": "B",
        "text": "70"
      },
      {
        "key": "C",
        "text": "80"
      },
      {
        "key": "D",
        "text": "90 G. ORIENTASI RUANG DAN ARAH"
      },
      {
        "key": "E",
        "text": "95"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. 80 200 − 120 = 80 responden.",
    "weight": 10
  },
  {
    "id": 161,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Seseorang menghadap utara, lalu berbelok 90° ke kanan. Ia kini menghadap ...",
    "options": [
      {
        "key": "A",
        "text": "Barat"
      },
      {
        "key": "B",
        "text": "Timur"
      },
      {
        "key": "C",
        "text": "Selatan"
      },
      {
        "key": "D",
        "text": "Utara"
      },
      {
        "key": "E",
        "text": "Barat Daya"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Timur Dari utara, belok kanan 90 derajat berarti menghadap timur.",
    "weight": 10
  },
  {
    "id": 162,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Seseorang berjalan 5 km ke timur lalu 5 km ke barat. Posisi akhirnya terhadap titik awal ...",
    "options": [
      {
        "key": "A",
        "text": "5 km timur"
      },
      {
        "key": "B",
        "text": "5 km barat"
      },
      {
        "key": "C",
        "text": "Kembali ke titik awal"
      },
      {
        "key": "D",
        "text": "10 km utara"
      },
      {
        "key": "E",
        "text": "5 km ke arah barat"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. Kembali ke titik awal Perpindahan ke timur dan barat sama besar serta berlawanan arah, sehingga saling meniadakan.",
    "weight": 10
  },
  {
    "id": 163,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Pada peta, utara berada di atas. A berada di sebelah kiri B. A terletak di ... B.",
    "options": [
      {
        "key": "A",
        "text": "Timur"
      },
      {
        "key": "B",
        "text": "Barat"
      },
      {
        "key": "C",
        "text": "Utara"
      },
      {
        "key": "D",
        "text": "Selatan"
      },
      {
        "key": "E",
        "text": "Tenggara"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Barat Kiri pada peta dengan utara di atas menunjukkan arah barat.",
    "weight": 10
  },
  {
    "id": 164,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Sebuah panah mengarah ke selatan. Jika diputar 180°, arahnya menjadi ...",
    "options": [
      {
        "key": "A",
        "text": "Utara"
      },
      {
        "key": "B",
        "text": "Timur"
      },
      {
        "key": "C",
        "text": "Barat"
      },
      {
        "key": "D",
        "text": "Tetap selatan"
      },
      {
        "key": "E",
        "text": "Barat Laut"
      }
    ],
    "correctKey": "A",
    "explanation": "Kunci Jawaban: A. Utara Putaran 180 derajat membalik arah selatan menjadi utara.",
    "weight": 10
  },
  {
    "id": 165,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Dari titik P bergerak 3 km utara dan 4 km timur. Jarak lurus dari titik awal adalah ...",
    "options": [
      {
        "key": "A",
        "text": "5 km"
      },
      {
        "key": "B",
        "text": "6 km"
      },
      {
        "key": "C",
        "text": "7 km"
      },
      {
        "key": "D",
        "text": "8 km"
      },
      {
        "key": "E",
        "text": "8 km"
      }
    ],
    "correctKey": "A",
    "explanation": "Kunci Jawaban: A. 5 km Gunakan teorema Pythagoras: √(3²+4²) = √25 = 5 km.",
    "weight": 10
  },
  {
    "id": 166,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Jika pukul 03.00 jarum pendek menunjuk angka 3, sudut terkecil antara jarum jam dan menit adalah ...",
    "options": [
      {
        "key": "A",
        "text": "0°"
      },
      {
        "key": "B",
        "text": "45°"
      },
      {
        "key": "C",
        "text": "90°"
      },
      {
        "key": "D",
        "text": "180°"
      },
      {
        "key": "E",
        "text": "120°"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. 90° Pada pukul tepat 03.00, jarum menit di 12 dan jarum jam di 3; sudutnya 90 derajat.",
    "weight": 10
  },
  {
    "id": 167,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Seseorang menghadap barat, berputar 90° searah jarum jam. Ia menghadap ...",
    "options": [
      {
        "key": "A",
        "text": "Utara"
      },
      {
        "key": "B",
        "text": "Selatan"
      },
      {
        "key": "C",
        "text": "Timur"
      },
      {
        "key": "D",
        "text": "Barat"
      },
      {
        "key": "E",
        "text": "Barat Daya"
      }
    ],
    "correctKey": "A",
    "explanation": "Kunci Jawaban: A. Utara Dari barat, putaran searah jarum jam 90 derajat menuju utara.",
    "weight": 10
  },
  {
    "id": 168,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Sebuah kubus memiliki berapa sisi?",
    "options": [
      {
        "key": "A",
        "text": "4"
      },
      {
        "key": "B",
        "text": "6"
      },
      {
        "key": "C",
        "text": "8"
      },
      {
        "key": "D",
        "text": "12"
      },
      {
        "key": "E",
        "text": "8"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. 6 Kubus memiliki enam bidang sisi, delapan titik sudut, dan dua belas rusuk.",
    "weight": 10
  },
  {
    "id": 169,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Jika sisi kiri suatu benda berada di sebelah kanan pengamat yang berhadapan langsung, maka pengamat berada di ...",
    "options": [
      {
        "key": "A",
        "text": "Belakang benda"
      },
      {
        "key": "B",
        "text": "Depan benda"
      },
      {
        "key": "C",
        "text": "Atas benda"
      },
      {
        "key": "D",
        "text": "Bawah benda"
      },
      {
        "key": "E",
        "text": "Samping kiri benda"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Depan benda Saat pengamat berdiri di depan dan menghadap benda, sisi kiri benda tampak di kanan pengamat.",
    "weight": 10
  },
  {
    "id": 170,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Sebuah kendaraan bergerak ke selatan, lalu berbelok ke kiri. Arah berikutnya adalah ...",
    "options": [
      {
        "key": "A",
        "text": "Timur"
      },
      {
        "key": "B",
        "text": "Barat"
      },
      {
        "key": "C",
        "text": "Utara"
      },
      {
        "key": "D",
        "text": "Selatan H. KETELITIAN DAN KONSENTRASI"
      },
      {
        "key": "E",
        "text": "Barat Laut"
      }
    ],
    "correctKey": "A",
    "explanation": "Kunci Jawaban: A. Timur Jika menghadap selatan, sisi kiri adalah timur.",
    "weight": 10
  },
  {
    "id": 171,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Manakah kode yang sama persis dengan “BRM-2087-KL”?",
    "options": [
      {
        "key": "A",
        "text": "BRM-2087-KL"
      },
      {
        "key": "B",
        "text": "BRN-2087-KL"
      },
      {
        "key": "C",
        "text": "BRM-2087-KI"
      },
      {
        "key": "D",
        "text": "BRM-2807-KL"
      },
      {
        "key": "E",
        "text": "BRM-2087-KP"
      }
    ],
    "correctKey": "A",
    "explanation": "Kunci Jawaban: A. BRM-2087-KL Cocokkan seluruh karakter secara berurutan; hanya opsi A identik.",
    "weight": 10
  },
  {
    "id": 172,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Berapa banyak huruf A dalam rangkaian “KORABRIMOBNASIONAL”?",
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "5"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. 3 Huruf A muncul tiga kali: pada rangkaian KOR(A)BRIMOBN(A)SION(A)L.",
    "weight": 10
  },
  {
    "id": 173,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Pilih pasangan angka yang identik.",
    "options": [
      {
        "key": "A",
        "text": "583194 – 583149"
      },
      {
        "key": "B",
        "text": "726408 – 726408"
      },
      {
        "key": "C",
        "text": "901237 – 901273"
      },
      {
        "key": "D",
        "text": "445612 – 445621"
      },
      {
        "key": "E",
        "text": "726418 – 726418"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. 726408 – 726408 Hanya pasangan kedua memiliki urutan digit yang sama persis.",
    "weight": 10
  },
  {
    "id": 174,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Jika setiap huruf digeser satu langkah maju dalam alfabet, POLRI menjadi ...",
    "options": [
      {
        "key": "A",
        "text": "QPMSJ"
      },
      {
        "key": "B",
        "text": "QPOSJ"
      },
      {
        "key": "C",
        "text": "QPMRJ"
      },
      {
        "key": "D",
        "text": "QPLSJ"
      },
      {
        "key": "E",
        "text": "QPMSL"
      }
    ],
    "correctKey": "A",
    "explanation": "Kunci Jawaban: A. QPMSJ P→Q, O→P, L→M, R→S, I→J. Hasilnya QPMSJ.",
    "weight": 10
  },
  {
    "id": 175,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Manakah yang berbeda dari tiga kode lainnya?",
    "options": [
      {
        "key": "A",
        "text": "AB12-CD"
      },
      {
        "key": "B",
        "text": "AB12-CD"
      },
      {
        "key": "C",
        "text": "AB12-DC"
      },
      {
        "key": "D",
        "text": "AB12-CD"
      },
      {
        "key": "E",
        "text": "AB12-DB"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. AB12-DC Kode C menukar urutan dua huruf terakhir; yang lain sama.",
    "weight": 10
  },
  {
    "id": 176,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Berapa jumlah angka genap dalam 2, 5, 8, 11, 14, 17, 20?",
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "6"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. 4 Angka genapnya 2, 8, 14, dan 20; jumlahnya empat.",
    "weight": 10
  },
  {
    "id": 177,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Jika urutan nama diurutkan alfabetis: Bima, Andi, Citra, Dedi, nama kedua adalah ...",
    "options": [
      {
        "key": "A",
        "text": "Andi"
      },
      {
        "key": "B",
        "text": "Bima"
      },
      {
        "key": "C",
        "text": "Citra"
      },
      {
        "key": "D",
        "text": "Dedi"
      },
      {
        "key": "E",
        "text": "Danu"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Bima Urutan alfabetis: Andi, Bima, Citra, Dedi; nama kedua Bima.",
    "weight": 10
  },
  {
    "id": 178,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Pilih ejaan yang benar.",
    "options": [
      {
        "key": "A",
        "text": "Aktifitas"
      },
      {
        "key": "B",
        "text": "Aktivitas"
      },
      {
        "key": "C",
        "text": "Aktifvitas"
      },
      {
        "key": "D",
        "text": "Aktifitaz"
      },
      {
        "key": "E",
        "text": "Mobilitas"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Aktivitas Bentuk baku menurut kaidah bahasa Indonesia adalah “aktivitas”.",
    "weight": 10
  },
  {
    "id": 179,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Dalam daftar 101, 110, 011, 101, 110, 101, angka 101 muncul sebanyak ...",
    "options": [
      {
        "key": "A",
        "text": "1"
      },
      {
        "key": "B",
        "text": "2"
      },
      {
        "key": "C",
        "text": "3"
      },
      {
        "key": "D",
        "text": "4"
      },
      {
        "key": "E",
        "text": "5"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. 3 Angka 101 muncul pada posisi pertama, keempat, dan keenam: tiga kali.",
    "weight": 10
  },
  {
    "id": 180,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Manakah pasangan yang tidak sama?",
    "options": [
      {
        "key": "A",
        "text": "POLRI-POLRI"
      },
      {
        "key": "B",
        "text": "SIP-SIP"
      },
      {
        "key": "C",
        "text": "TPK-TPK"
      },
      {
        "key": "D",
        "text": "KORPS-KORP5 I. PENALARAN SITUASIONAL"
      },
      {
        "key": "E",
        "text": "KORPS-KORP8"
      }
    ],
    "correctKey": "D",
    "explanation": "Kunci Jawaban: D. KORPS-KORP5 Karakter terakhir pada KORP5 adalah angka 5, bukan huruf S.",
    "weight": 10
  },
  {
    "id": 181,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Anda menerima dua informasi yang saling bertentangan tentang suatu kejadian. Tindakan awal paling tepat adalah ...",
    "options": [
      {
        "key": "A",
        "text": "Memilih informasi dari orang paling senior"
      },
      {
        "key": "B",
        "text": "Memverifikasi sumber dan mencari bukti pendukung"
      },
      {
        "key": "C",
        "text": "Menyebarkan kedua informasi"
      },
      {
        "key": "D",
        "text": "Mengambil kesimpulan secepatnya"
      },
      {
        "key": "E",
        "text": "Mengabaikan informasi karena bukan tupoksi langsung"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Memverifikasi sumber dan mencari bukti pendukung Verifikasi sumber dan bukti menghindari keputusan berdasarkan rumor atau bias.",
    "weight": 10
  },
  {
    "id": 182,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Dalam tim, seorang anggota melakukan kesalahan administrasi yang dapat diperbaiki. Respons terbaik adalah ...",
    "options": [
      {
        "key": "A",
        "text": "Mempermalukannya di depan umum"
      },
      {
        "key": "B",
        "text": "Membantu koreksi, mengingatkan prosedur, dan mendokumentasikan sesuai aturan"
      },
      {
        "key": "C",
        "text": "Menyembunyikan kesalahan"
      },
      {
        "key": "D",
        "text": "Langsung menyalahkan seluruh tim"
      },
      {
        "key": "E",
        "text": "Menutup-nutupi kesalahan agar citra tim tetap terjaga"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Membantu koreksi, mengingatkan prosedur, dan mendokumentasikan sesuai aturan Perbaikan yang proporsional menjaga mutu kerja sekaligus membina anggota.",
    "weight": 10
  },
  {
    "id": 183,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Anda diminta menyelesaikan tugas mendesak sementara tugas lain juga penting. Langkah paling tepat ...",
    "options": [
      {
        "key": "A",
        "text": "Mengerjakan secara acak"
      },
      {
        "key": "B",
        "text": "Menilai urgensi dan dampak, menyusun prioritas, lalu berkoordinasi"
      },
      {
        "key": "C",
        "text": "Mengabaikan salah satu tanpa memberi tahu"
      },
      {
        "key": "D",
        "text": "Menunggu sampai ada teguran"
      },
      {
        "key": "E",
        "text": "Menunggu instruksi tanpa inisiatif awal"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Menilai urgensi dan dampak, menyusun prioritas, lalu berkoordinasi Prioritas ditetapkan berdasarkan urgensi, dampak, tenggat, dan koordinasi.",
    "weight": 10
  },
  {
    "id": 184,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Warga menyampaikan keluhan dengan nada tinggi. Sikap awal yang paling efektif adalah ...",
    "options": [
      {
        "key": "A",
        "text": "Membalas dengan nada lebih tinggi"
      },
      {
        "key": "B",
        "text": "Mendengarkan dengan tenang dan mengklarifikasi inti keluhan"
      },
      {
        "key": "C",
        "text": "Memotong pembicaraan"
      },
      {
        "key": "D",
        "text": "Langsung menolak"
      },
      {
        "key": "E",
        "text": "Meneruskan keluhan kepada staf lain tanpa mencatat"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Mendengarkan dengan tenang dan mengklarifikasi inti keluhan Mendengarkan aktif dan komunikasi tenang membantu meredakan ketegangan serta memahami masalah.",
    "weight": 10
  },
  {
    "id": 185,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Anda menemukan data pribadi korban tersebar di grup tidak berkepentingan. Tindakan tepat ...",
    "options": [
      {
        "key": "A",
        "text": "Meneruskan agar diketahui semua orang"
      },
      {
        "key": "B",
        "text": "Menghentikan penyebaran sejauh kewenangan, menjaga bukti, dan melapor melalui prosedur"
      },
      {
        "key": "C",
        "text": "Mengunggah ke media sosial"
      },
      {
        "key": "D",
        "text": "Mengabaikannya"
      },
      {
        "key": "E",
        "text": "Menyebarluaskan dokumen ke rekan lain untuk meminta pendapat"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Menghentikan penyebaran sejauh kewenangan, menjaga bukti, dan melapor melalui prosedur Data pribadi harus dilindungi; penanganan dilakukan sesuai prosedur dan jalur pelaporan.",
    "weight": 10
  },
  {
    "id": 186,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Dalam rapat, pendapat Anda berbeda dari pimpinan dan didukung data. Sebaiknya ...",
    "options": [
      {
        "key": "A",
        "text": "Menyampaikan dengan sopan, berbasis data, dan menghormati keputusan sesuai kewenangan"
      },
      {
        "key": "B",
        "text": "Diam meski ada risiko besar"
      },
      {
        "key": "C",
        "text": "Menyerang pribadi pimpinan"
      },
      {
        "key": "D",
        "text": "Menyebarkan perbedaan ke publik"
      },
      {
        "key": "E",
        "text": "Melaksanakan perintah tanpa mencatat risiko kendala"
      }
    ],
    "correctKey": "A",
    "explanation": "Kunci Jawaban: A. Menyampaikan dengan sopan, berbasis data, dan menghormati keputusan sesuai kewenangan Perbedaan profesional disampaikan secara santun dengan alasan dan data yang dapat diuji.",
    "weight": 10
  },
  {
    "id": 187,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Saat rencana kegiatan menghadapi risiko keselamatan baru, Anda sebaiknya ...",
    "options": [
      {
        "key": "A",
        "text": "Tetap menjalankan tanpa perubahan"
      },
      {
        "key": "B",
        "text": "Menilai risiko, memberi tahu komandan, dan mengusulkan mitigasi"
      },
      {
        "key": "C",
        "text": "Menyembunyikan informasi"
      },
      {
        "key": "D",
        "text": "Menunggu sampai terjadi insiden"
      },
      {
        "key": "E",
        "text": "Menghentikan tugas secara sepihak di lapangan"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Menilai risiko, memberi tahu komandan, dan mengusulkan mitigasi Risiko baru harus segera dinilai dan dikomunikasikan agar langkah pencegahan dapat diambil.",
    "weight": 10
  },
  {
    "id": 188,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Rekan meminta Anda menandatangani laporan yang belum diperiksa. Tindakan terbaik ...",
    "options": [
      {
        "key": "A",
        "text": "Menandatangani demi solidaritas"
      },
      {
        "key": "B",
        "text": "Memeriksa isi dan bukti terlebih dahulu; menolak jika tidak akurat"
      },
      {
        "key": "C",
        "text": "Meminta imbalan"
      },
      {
        "key": "D",
        "text": "Membiarkan orang lain menandatangani atas nama Anda"
      },
      {
        "key": "E",
        "text": "Mendelegasikan penandatanganan kepada bawahan"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Memeriksa isi dan bukti terlebih dahulu; menolak jika tidak akurat Tanda tangan berarti pertanggungjawaban; verifikasi diperlukan sebelum menyetujui dokumen.",
    "weight": 10
  },
  {
    "id": 189,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Anda melihat anggota tim kelelahan saat tugas panjang. Respons yang tepat ...",
    "options": [
      {
        "key": "A",
        "text": "Mengabaikan kondisi"
      },
      {
        "key": "B",
        "text": "Menilai keselamatan dan kesiapan, mengatur rotasi/istirahat sesuai prosedur"
      },
      {
        "key": "C",
        "text": "Memaksa terus bekerja tanpa evaluasi"
      },
      {
        "key": "D",
        "text": "Membatalkan tugas tanpa koordinasi"
      },
      {
        "key": "E",
        "text": "Melanjutkan operasi tanpa memperhatikan kelelahan fisik tim"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Menilai keselamatan dan kesiapan, mengatur rotasi/istirahat sesuai prosedur Kesiapan personel berkaitan dengan keselamatan dan efektivitas tugas.",
    "weight": 10
  },
  {
    "id": 190,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Setelah kegiatan, hasil tidak mencapai target. Sikap pemimpin yang baik ...",
    "options": [
      {
        "key": "A",
        "text": "Mencari kambing hitam"
      },
      {
        "key": "B",
        "text": "Mengevaluasi data, penyebab, pembelajaran, dan rencana perbaikan"
      },
      {
        "key": "C",
        "text": "Mengubah angka hasil"
      },
      {
        "key": "D",
        "text": "Menyalahkan masyarakat J. PENALARAN ABSTRAK DAN PEMECAHAN MASALAH"
      },
      {
        "key": "E",
        "text": "Menyalahkan faktor cuaca dan sarana prasarana saja"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Mengevaluasi data, penyebab, pembelajaran, dan rencana perbaikan Evaluasi berbasis fakta membantu menemukan akar masalah dan memperbaiki kinerja.",
    "weight": 10
  },
  {
    "id": 191,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Jika pola simbol adalah ▲, ■, ▲, ■, ▲, ... simbol berikutnya adalah ...",
    "options": [
      {
        "key": "A",
        "text": "▲"
      },
      {
        "key": "B",
        "text": "■"
      },
      {
        "key": "C",
        "text": "●"
      },
      {
        "key": "D",
        "text": "◆"
      },
      {
        "key": "E",
        "text": "●"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. ■ Pola bergantian segitiga dan persegi; setelah segitiga muncul persegi.",
    "weight": 10
  },
  {
    "id": 192,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Urutan pasangan: (1,2), (2,4), (3,6), (4,8), (...). Pasangan berikutnya ...",
    "options": [
      {
        "key": "A",
        "text": "(5,9)"
      },
      {
        "key": "B",
        "text": "(5,10)"
      },
      {
        "key": "C",
        "text": "(6,10)"
      },
      {
        "key": "D",
        "text": "(6,12)"
      },
      {
        "key": "E",
        "text": "(6,12)"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. (5,10) Angka kedua selalu dua kali angka pertama; setelah (4,8) adalah (5,10).",
    "weight": 10
  },
  {
    "id": 193,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Jika semua bentuk berwarna merah diubah menjadi biru, dan lingkaran merah ada tiga, berapa lingkaran yang berubah warna?",
    "options": [
      {
        "key": "A",
        "text": "1"
      },
      {
        "key": "B",
        "text": "2"
      },
      {
        "key": "C",
        "text": "3"
      },
      {
        "key": "D",
        "text": "Tidak dapat diketahui"
      },
      {
        "key": "E",
        "text": "5"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. 3 Ketiga lingkaran merah termasuk semua bentuk merah sehingga semuanya berubah menjadi biru.",
    "weight": 10
  },
  {
    "id": 194,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Sebuah pola bergerak: atas, kanan, bawah, kiri, atas, ... Arah berikutnya adalah ...",
    "options": [
      {
        "key": "A",
        "text": "Atas"
      },
      {
        "key": "B",
        "text": "Kanan"
      },
      {
        "key": "C",
        "text": "Bawah"
      },
      {
        "key": "D",
        "text": "Kiri"
      },
      {
        "key": "E",
        "text": "Atas"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Kanan Arah berputar 90 derajat searah jarum jam; setelah atas adalah kanan.",
    "weight": 10
  },
  {
    "id": 195,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Dua mesin menghasilkan 40 unit dalam 2 jam dengan laju sama. Berapa unit dihasilkan satu mesin dalam 3 jam?",
    "options": [
      {
        "key": "A",
        "text": "20"
      },
      {
        "key": "B",
        "text": "30"
      },
      {
        "key": "C",
        "text": "40"
      },
      {
        "key": "D",
        "text": "60"
      },
      {
        "key": "E",
        "text": "40"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. 30 Dua mesin menghasilkan 20 unit per jam gabungan; satu mesin menghasilkan 10 unit/jam, jadi 30 unit dalam 3 jam.",
    "weight": 10
  },
  {
    "id": 196,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Jika 5 orang saling berjabat tangan satu kali dengan setiap orang lain, jumlah jabat tangan adalah ...",
    "options": [
      {
        "key": "A",
        "text": "5"
      },
      {
        "key": "B",
        "text": "8"
      },
      {
        "key": "C",
        "text": "10"
      },
      {
        "key": "D",
        "text": "15"
      },
      {
        "key": "E",
        "text": "15"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. 10 Jumlah pasangan unik = 5×4÷2 = 10.",
    "weight": 10
  },
  {
    "id": 197,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Sebuah pola angka: 2→6, 3→12, 4→20, 5→30. Maka 6→ ...",
    "options": [
      {
        "key": "A",
        "text": "36"
      },
      {
        "key": "B",
        "text": "40"
      },
      {
        "key": "C",
        "text": "42"
      },
      {
        "key": "D",
        "text": "48"
      },
      {
        "key": "E",
        "text": "50"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: C. 42 Pola n dikalikan n+1: 2×3=6, ... 6×7=42.",
    "weight": 10
  },
  {
    "id": 198,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Jika hari ini Rabu, 17 hari lagi jatuh pada hari ...",
    "options": [
      {
        "key": "A",
        "text": "Jumat"
      },
      {
        "key": "B",
        "text": "Sabtu"
      },
      {
        "key": "C",
        "text": "Minggu"
      },
      {
        "key": "D",
        "text": "Senin"
      },
      {
        "key": "E",
        "text": "Minggu"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. Sabtu 17 dibagi 7 bersisa 3; tiga hari setelah Rabu adalah Sabtu.",
    "weight": 10
  },
  {
    "id": 199,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Sebuah kotak berisi 3 bola merah dan 2 bola putih. Peluang mengambil bola putih dalam satu pengambilan acak adalah ...",
    "options": [
      {
        "key": "A",
        "text": "1/5"
      },
      {
        "key": "B",
        "text": "2/5"
      },
      {
        "key": "C",
        "text": "3/5"
      },
      {
        "key": "D",
        "text": "1/2"
      },
      {
        "key": "E",
        "text": "3/5"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. 2/5 Ada 2 bola putih dari total 5 bola, sehingga peluangnya 2/5.",
    "weight": 10
  },
  {
    "id": 200,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "Empat orang menyelesaikan pekerjaan dalam 6 hari. Dengan produktivitas sama, delapan orang menyelesaikannya dalam ...",
    "options": [
      {
        "key": "A",
        "text": "2 hari"
      },
      {
        "key": "B",
        "text": "3 hari"
      },
      {
        "key": "C",
        "text": "4 hari"
      },
      {
        "key": "D",
        "text": "5 hari BAGIAN II — LEMBAR JAWABAN PESERTA Tuliskan atau lingkari satu pilihan untuk setiap nomor. Jumlah benar: ______ / 100     Nilai: ______"
      },
      {
        "key": "E",
        "text": "5 hari"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: B. 3 hari Beban kerja 4×6=24 orang-hari; 24÷8=3 hari.",
    "weight": 10
  }
];

/* -------------------------------------------------------------------------- */
/* 2. KUMPULAN SOAL KEPRIBADIAN (100 Butir SJT Polri)                         */
/* -------------------------------------------------------------------------- */
const QUESTIONS_KEPRIBADIAN: SimQuestion[] = [
  {
    "id": 201,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda mengetahui rekan mengubah angka dalam laporan agar hasil unit terlihat baik. Apa langkah paling tepat?",
    "options": [
      {
        "key": "A",
        "text": "Membiarkannya karena bukan tanggung jawab saya.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Memastikan fakta, mengingatkan rekan, dan menggunakan jalur pelaporan yang berlaku bila tidak diperbaiki.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyebarkan cerita kepada semua rekan.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengubah angka lain agar seimbang.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Verifikasi, koreksi, dan jalur pelaporan resmi menjaga integritas serta menghindari tuduhan tanpa dasar.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 202,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Seorang kenalan meminta didahulukan dalam pelayanan tanpa alasan yang sah. Anda akan…",
    "options": [
      {
        "key": "A",
        "text": "Mengabulkan karena hubungan baik.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Meminta imbalan sebagai gantinya.",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Menjelaskan prosedur dan melayani sesuai urutan serta ketentuan.",
        "weight": 5
      },
      {
        "key": "D",
        "text": "Meminta rekan lain melakukannya diam-diam.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "C",
    "optionWeights": {
      "A": 3,
      "B": 2,
      "C": 5,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (C) dengan bobot maksimal 5 poin. Pelayanan harus objektif dan bebas dari perlakuan istimewa yang tidak sah.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 203,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda menemukan barang milik warga di ruang pelayanan. Tindakan Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menyimpannya untuk sementara tanpa catatan.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Mengumumkan detail barang di media sosial.",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Menyerahkannya melalui prosedur barang temuan dan membuat pencatatan.",
        "weight": 5
      },
      {
        "key": "D",
        "text": "Membawanya pulang agar aman.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "C",
    "optionWeights": {
      "A": 3,
      "B": 2,
      "C": 5,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (C) dengan bobot maksimal 5 poin. Pencatatan dan mekanisme resmi melindungi pemilik maupun petugas.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 204,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Atasan meminta Anda menyampaikan informasi yang belum terverifikasi sebagai fakta. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menyampaikannya agar atasan senang.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menjelaskan status informasi dan mengusulkan verifikasi sebelum disampaikan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menolak dengan kata-kata kasar.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Meneruskan tanpa memberi konteks.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Kejujuran informasi dan komunikasi hormat harus dijaga bersamaan.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 205,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda melakukan kesalahan administrasi yang berdampak pada proses kerja. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menyembunyikannya sampai diketahui orang lain.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Mengakui, melaporkan kepada pihak terkait, dan segera memperbaiki sesuai prosedur.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyalahkan petugas sebelumnya.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menghapus dokumen terkait.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Akuntabilitas menuntut pengungkapan dan tindakan korektif.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 206,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Rekan menawarkan hadiah dari pihak yang sedang berkepentingan dengan tugas Anda. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menerima karena dianggap tanda terima kasih.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menerima lalu membaginya.",
        "weight": 2
      },
      {
        "key": "C",
        "text": "Menolak atau melaporkan sesuai aturan gratifikasi yang berlaku.",
        "weight": 5
      },
      {
        "key": "D",
        "text": "Menerima jika tidak diketahui orang lain.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "C",
    "optionWeights": {
      "A": 3,
      "B": 2,
      "C": 5,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (C) dengan bobot maksimal 5 poin. Menjaga independensi dan mengikuti ketentuan gratifikasi mencegah konflik kepentingan.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 207,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda diminta membagikan dokumen kedinasan ke grup yang tidak berwenang. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Mengirim agar pekerjaan cepat.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Memastikan kewenangan penerima dan menggunakan kanal yang disetujui.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengirim sebagian halaman saja.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Meminta orang lain mengirim.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Informasi hanya dibagikan kepada pihak berwenang melalui kanal yang tepat.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 208,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda melihat penggunaan kendaraan dinas untuk kepentingan pribadi. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menganggap hal biasa.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Memastikan konteks dan menindaklanjuti melalui mekanisme internal yang berlaku.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Memotret lalu mengunggahnya ke publik.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Ikut menggunakan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Fakta perlu dipastikan dan penanganan dilakukan secara proporsional melalui jalur resmi.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 209,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Seorang teman meminta Anda menghapus catatan pelanggaran yang sah. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menghapus karena pertemanan.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menolak secara profesional dan menjelaskan bahwa catatan harus sesuai fakta dan aturan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menunda sampai ia memberi imbalan.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengubah tanggal saja.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Keadilan dan integritas tidak boleh dikalahkan hubungan pribadi.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 210,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda menemukan dompet di area kantor tanpa pemilik terlihat. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Mengambil uangnya dan membuang dompet.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menyerahkan kepada petugas/pengelola yang berwenang dengan pencatatan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyimpan tanpa memberi tahu siapa pun.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Meninggalkannya begitu saja. Disiplin dan tanggung jawab",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Penyerahan tercatat memberi perlindungan dan peluang pengembalian kepada pemilik.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 211,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Dua tugas penting memiliki tenggat berdekatan. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Mengerjakan yang paling disukai dahulu.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Memetakan urgensi, dampak, waktu, lalu mengomunikasikan prioritas kepada atasan bila perlu.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menunda keduanya.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menyerahkan keduanya tanpa koordinasi.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Prioritas berbasis urgensi dan dampak serta komunikasi mencegah keterlambatan.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 212,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda terlambat karena kendala perjalanan yang tidak terduga. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Tidak memberi kabar.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Segera memberi informasi, memperkirakan waktu tiba, dan mengikuti arahan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membuat alasan palsu.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menyalahkan rekan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Komunikasi dini dan kejujuran adalah respons yang bertanggung jawab.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 213,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Tugas rutin terasa membosankan. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Mengurangi ketelitian.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Tetap mengikuti standar dan mencari cara kerja lebih efisien tanpa mengubah prosedur.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyerahkan kepada orang lain tanpa izin.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengabaikannya.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Konsistensi mutu tetap penting pada pekerjaan rutin.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 214,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda menerima instruksi yang belum jelas. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menebak maksudnya.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Meminta penjelasan tentang tujuan, batas, dan tenggat sebelum melaksanakan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengabaikan instruksi.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Meminta anggota lain menebak.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Klarifikasi lebih aman daripada asumsi yang berisiko.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 215,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Rekan satu tim tidak menyelesaikan bagian tugasnya. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Langsung mempermalukannya di depan umum.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menghubungi secara langsung, memastikan kendala, dan menyepakati tindak lanjut.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membiarkan seluruh pekerjaan gagal.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengambil alih tanpa memberi tahu.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Komunikasi langsung dan penyelesaian bersama menjaga akuntabilitas tim.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 216,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda menyadari ada tenggat yang mungkin tidak tercapai. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menunggu sampai tenggat lewat.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Melaporkan lebih awal, menjelaskan hambatan, dan menawarkan rencana pemulihan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengubah tanggal dokumen.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menyalahkan sistem.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Peringatan dini memberi ruang untuk mitigasi.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 217,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Setelah menyelesaikan tugas, Anda memiliki waktu tersisa. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menggunakan waktu untuk urusan pribadi tanpa izin.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Memeriksa hasil, merapikan dokumentasi, atau meminta tugas prioritas berikutnya.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengganggu rekan.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Pulang tanpa mengikuti ketentuan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Inisiatif tetap harus sesuai aturan dan kebutuhan unit.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 218,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda diminta menggantikan rekan yang berhalangan. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menolak tanpa mempertimbangkan situasi.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Memastikan kewenangan dan kesiapan, lalu membantu sesuai arahan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Melaksanakan tugas di luar kompetensi tanpa konsultasi.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengeluh kepada masyarakat.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Kesediaan membantu perlu disertai pemeriksaan kompetensi dan kewenangan.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 219,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Dokumen penting perlu diperiksa sebelum dikirim. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Mengirim cepat tanpa pemeriksaan.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Memeriksa identitas, isi, lampiran, tujuan, dan kewenangan penerima.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Meminta orang yang tidak terkait memeriksa data rahasia.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengirim versi lama.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Daftar pemeriksaan sederhana mengurangi kesalahan administrasi.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 220,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda menerima kritik atas keterlambatan kerja. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Membalas dengan emosi.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Mendengarkan, memeriksa fakta, mengakui bagian yang benar, dan menyusun perbaikan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menghindari pemberi kritik.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menyalahkan seluruh tim. Pengendalian emosi dan tekanan",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Sikap terbuka dan rencana perbaikan lebih produktif daripada defensif.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 221,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Masyarakat berbicara dengan nada tinggi saat menyampaikan keluhan. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menaikkan suara agar didengar.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menjaga nada bicara, mendengarkan, dan mengarahkan percakapan pada fakta serta solusi.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Meninggalkan tanpa penjelasan.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengejek keluhannya.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Deeskalasi dimulai dengan pengendalian diri dan komunikasi yang jelas.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 222,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda mendapat kritik keras di hadapan anggota lain. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Langsung membalas.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Tetap tenang, meminta contoh spesifik, dan membahas tindak lanjut secara profesional.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyimpan dendam.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menyebarkan keburukan pengkritik.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Respons tenang memungkinkan substansi kritik dinilai tanpa memperbesar konflik.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 223,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Dalam satu hari muncul beberapa masalah mendadak. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Mengerjakan semuanya sekaligus tanpa urutan.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Mengidentifikasi risiko, menetapkan prioritas, dan meminta dukungan bila kapasitas tidak cukup.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Panik dan berhenti bekerja.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Memilih masalah termudah saja.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Prioritas dan dukungan yang tepat menjaga efektivitas di bawah tekanan.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 224,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda merasa sangat lelah sebelum tugas yang membutuhkan ketelitian. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Memaksakan diri tanpa memberi tahu siapa pun.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menilai kondisi, melaporkan bila berisiko, dan mengikuti pengaturan istirahat/pengganti yang berlaku.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengonsumsi apa pun agar tetap terjaga.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengabaikan prosedur.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Kesadaran kondisi fisik merupakan bagian dari keselamatan dan mutu tugas.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 225,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Seseorang sengaja memancing emosi Anda. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Membalas provokasi.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Tidak terpancing, menjaga jarak aman, dan bertindak sesuai prosedur.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengancam di luar kewenangan.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengunggah identitasnya.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Pengendalian diri mencegah eskalasi dan menjaga tindakan tetap proporsional.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 226,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda gagal mencapai target kerja. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menyembunyikan hasil.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menganalisis penyebab, melaporkan secara jujur, dan menyusun langkah perbaikan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyalahkan keadaan tanpa evaluasi.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Berhenti mencoba.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Kegagalan dapat menjadi sumber pembelajaran bila ditangani terbuka.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 227,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda berbeda pendapat dengan rekan dalam rapat yang memanas. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Memotong pembicaraan.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menyampaikan alasan berbasis data dengan bahasa santun dan memberi ruang tanggapan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Meninggalkan rapat sambil membanting pintu.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengajak rekan lain memihak.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Asertivitas dan penghormatan menjaga diskusi tetap produktif.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 228,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda menerima kabar yang membuat cemas saat sedang bertugas. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Membiarkan kecemasan menguasai tugas.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Mengambil langkah yang diperlukan secara wajar, meminta dukungan bila perlu, dan menjaga keselamatan pelaksanaan tugas.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Melampiaskan emosi kepada orang lain.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengambil keputusan besar secara impulsif.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Pengenalan emosi dan dukungan yang tepat membantu mempertahankan fokus.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 229,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Kesalahan kecil berulang membuat Anda frustrasi. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Memarahi semua orang.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Mencari pola penyebab dan memperbaiki proses atau daftar pemeriksaan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengabaikan kesalahan.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menyembunyikan catatan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Perbaikan sistem sering lebih efektif daripada menyalahkan individu.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 230,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda harus menyampaikan kabar yang tidak menyenangkan kepada tim. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menyampaikan dengan kasar agar cepat selesai.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menyampaikan fakta secara jelas, empatik, dan menjelaskan langkah berikutnya.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyembunyikan informasi.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Membuat kabar terdengar lebih baik dari kenyataan. Kepemimpinan dan keputusan",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Kejujuran yang disampaikan dengan empati menjaga kepercayaan.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 231,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Tim Anda belum memahami tujuan kegiatan. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menyalahkan anggota.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menjelaskan tujuan, hasil yang diharapkan, peran, dan jalur koordinasi.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membiarkan mereka bekerja sendiri.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengubah tujuan tanpa koordinasi.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Pemimpin perlu memastikan pemahaman bersama sebelum pelaksanaan.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 232,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Dua anggota memiliki konflik yang mengganggu tugas. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Memihak teman dekat.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Mendengar kedua pihak, memisahkan fakta dari asumsi, lalu menyepakati penyelesaian profesional.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membiarkan konflik membesar.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengumumkan masalah pribadi mereka.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Proses yang adil dan berbasis fakta membantu memulihkan kerja sama.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 233,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Keputusan harus dibuat cepat tetapi informasi belum lengkap. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menebak tanpa menilai risiko.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Mengumpulkan fakta minimum yang kritis, menilai risiko, bertindak dalam kewenangan, dan mengevaluasi.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menunda tanpa batas.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengikuti tekanan pihak paling keras.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Keputusan cepat tetap membutuhkan dasar informasi dan batas kewenangan.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 234,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anggota melakukan kesalahan pertama kali karena belum memahami prosedur. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Langsung mempermalukannya.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Mengoreksi, menjelaskan prosedur, memastikan pemahaman, dan memantau perbaikan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membiarkan kesalahan berulang.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengambil seluruh tugasnya selamanya.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Pembinaan yang jelas sesuai untuk kesalahan karena kurang pemahaman, sambil tetap menjaga standar.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 235,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda menerima usulan bawahan yang lebih efektif daripada rencana awal. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menolak karena merasa harus selalu benar.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menilai usulan berdasarkan bukti, aturan, risiko, dan manfaat.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menerima tanpa pemeriksaan.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengklaim usulan itu sebagai ide sendiri.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Pemimpin perlu terbuka, tetapi tetap melakukan penilaian yang bertanggung jawab.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 236,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Hasil tim baik, tetapi kontribusi anggota tidak merata. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Mengambil seluruh pujian.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Mengapresiasi kontribusi secara adil dan membahas pembagian kerja untuk kegiatan berikutnya.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengabaikan anggota yang bekerja keras.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menyalahkan anggota di depan umum.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Pengakuan yang adil dan evaluasi pembagian kerja menjaga motivasi.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 237,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Atasan meminta masukan tentang kebijakan yang berpotensi menimbulkan kendala. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Diam walau memiliki data penting.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menyampaikan risiko dan alternatif secara hormat, berbasis data.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengkritik pribadi pembuat kebijakan.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menyebarkan keberatan ke luar organisasi.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Masukan profesional membantu keputusan lebih matang.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 238,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anggota meminta arahan untuk tugas di luar pengalaman Anda. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Memberi jawaban asal.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Mengakui batas pengetahuan, mencari rujukan atau ahli yang tepat, lalu memberi arahan terverifikasi.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menghindar selamanya.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Meminta anggota menebak.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Pemimpin yang bertanggung jawab tidak berpura-pura mengetahui semua hal.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 239,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda harus membagi tugas dalam waktu terbatas. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Membagi sama rata tanpa melihat kompetensi.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Mempertimbangkan kompetensi, beban, urgensi, dan kebutuhan pengawasan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Memberikan semua tugas kepada orang terdekat.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Memilih anggota secara acak.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Pembagian tugas efektif mempertimbangkan kemampuan dan beban kerja.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 240,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Setelah kegiatan, hasil tidak sesuai target. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Mencari kambing hitam.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Melakukan evaluasi terbuka, mengidentifikasi faktor kendali, dan menetapkan perbaikan terukur.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menghapus catatan evaluasi.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menganggap evaluasi tidak perlu. Kerja sama dan komunikasi",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Evaluasi berorientasi pembelajaran memperkuat kinerja berikutnya.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 241,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Rekan baru belum memahami budaya kerja unit. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Membiarkannya belajar sendiri.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Membantu orientasi, menjelaskan aturan kerja, dan mengenalkan jalur bertanya.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengejek ketidaktahuannya.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Memberi informasi yang salah sebagai candaan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Dukungan awal mempercepat adaptasi dan mencegah kesalahan.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 242,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Pesan dalam grup kerja disalahartikan dan memicu ketegangan. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menambah komentar menyindir.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Mengklarifikasi maksud dengan bahasa netral dan menghubungi pihak terkait bila perlu.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Meneruskan tangkapan layar ke luar grup.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menghapus pesan orang lain.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Klarifikasi langsung mengurangi salah paham digital.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 243,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda tidak setuju dengan cara kerja rekan. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Membicarakannya di belakang.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menyampaikan masukan secara pribadi, spesifik, dan berfokus pada pekerjaan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menghambat pekerjaannya.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Memaksakan cara sendiri.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Masukan spesifik dan langsung lebih konstruktif daripada gosip atau sabotase.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 244,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Dalam rapat, satu anggota jarang berbicara. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menganggap ia tidak memiliki ide.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Memberi kesempatan menyampaikan pendapat tanpa memaksanya.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengabaikannya terus.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menjawab atas namanya.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Ruang partisipasi membantu tim memperoleh sudut pandang beragam.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 245,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Informasi penting belum diterima seluruh anggota. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menganggap semua sudah tahu.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Memastikan informasi diterima melalui kanal resmi dan meminta konfirmasi bila penting.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyalahkan anggota.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengirim ke akun pribadi yang tidak aman.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Konfirmasi penerimaan penting untuk koordinasi yang dapat dipertanggungjawabkan.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 246,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda menerima instruksi berbeda dari dua pihak. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Memilih yang paling mudah.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Mengklarifikasi prioritas melalui jalur komando dan mendokumentasikan arahan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Melaksanakan keduanya tanpa menilai konflik.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengabaikan keduanya.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Klarifikasi rantai komando mencegah perintah yang saling bertentangan.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 247,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Rekan menyampaikan pendapat dengan cara kurang santun. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Membalas dengan penghinaan.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menanggapi substansi dan mengajak menjaga cara komunikasi.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyebarkan rekaman percakapan.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menghentikan semua komunikasi.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Fokus pada substansi sambil menjaga etika lebih efektif.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 248,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda perlu menyampaikan perubahan jadwal mendadak. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Memberi tahu sebagian orang saja.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menyampaikan perubahan, alasan yang dapat dibagikan, dampak, dan konfirmasi penerimaan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menunggu orang bertanya.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengubah jadwal tanpa pemberitahuan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Komunikasi lengkap membantu semua pihak menyesuaikan rencana.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 249,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Tim lintas fungsi memiliki istilah kerja yang berbeda. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menganggap istilah unit sendiri paling benar.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menyepakati definisi dan tujuan bersama sebelum pembagian pekerjaan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menghindari koordinasi.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Membiarkan kebingungan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Bahasa bersama mengurangi kesalahan koordinasi lintas fungsi.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 250,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda menerima pujian atas hasil yang sebenarnya dikerjakan bersama. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Mengambil seluruh kredit.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Mengakui kontribusi tim dan menjelaskan peran secara proporsional.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menolak semua pujian dengan marah.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menyebut nama tanpa persetujuan dalam konteks sensitif. Pelayanan dan empati",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Pengakuan yang adil menunjukkan kerendahan hati dan menghargai tim.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 251,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Seorang warga kesulitan memahami formulir. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menyuruhnya pergi.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menjelaskan bagian yang diperlukan dengan bahasa sederhana tanpa mengambil alih informasi yang harus ia isi sendiri.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengisi data dengan perkiraan.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Meminta imbalan bantuan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Bantuan yang jelas menjaga akses pelayanan sekaligus akurasi data.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 252,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Warga datang dalam keadaan emosional karena merasa tidak didengar. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Memotong penjelasannya.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Mendengarkan, merangkum keluhan, lalu menjelaskan pilihan tindak lanjut yang tersedia.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menjanjikan hasil yang belum pasti.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menyalahkan warga.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Mendengar aktif dan penjelasan realistis membangun kepercayaan.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 253,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Seorang penyandang disabilitas membutuhkan akses pelayanan. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Memintanya menunggu tanpa kepastian.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Mengupayakan akomodasi yang layak sesuai fasilitas dan prosedur.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengabaikan kebutuhannya.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Meminta orang lain mengurus tanpa koordinasi.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Aksesibilitas dan perlakuan bermartabat mendukung pelayanan setara.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 254,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Warga meminta informasi yang tidak boleh dibuka kepada publik. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Membocorkan agar dianggap membantu.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menjelaskan batas keterbukaan dan mengarahkan ke prosedur permohonan yang sah.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengarang jawaban.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menyebarkan dokumen tanpa izin.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Pelayanan yang baik tetap melindungi informasi yang dikecualikan.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 255,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda menghadapi orang yang berulang kali mengajukan pertanyaan sama. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menunjukkan kejengkelan.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menjawab dengan sabar dan memeriksa apakah penjelasan sebelumnya sudah dipahami.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengabaikannya.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengejeknya.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Kesabaran dan pemeriksaan pemahaman meningkatkan kualitas layanan.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 256,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Warga mengeluhkan perlakuan tidak adil. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Langsung menyimpulkan ia salah.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Mencatat keluhan, memeriksa fakta, dan menjelaskan mekanisme penanganan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menjanjikan petugas akan dihukum.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menghapus pengaduan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Pengaduan perlu ditangani objektif tanpa menjanjikan hasil sebelum pemeriksaan.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 257,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda melihat rekan berbicara merendahkan pemohon layanan. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Ikut tertawa.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Mengingatkan secara profesional dan menindaklanjuti sesuai mekanisme bila diperlukan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Merekam dan menyebarkan.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Berpura-pura tidak melihat dalam semua keadaan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Menjaga martabat pengguna layanan merupakan tanggung jawab bersama.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 258,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Seorang warga tidak memiliki dokumen yang diperlukan. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Memalsukan dokumen.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menjelaskan persyaratan dan alternatif prosedural yang sah.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Meminta uang agar proses berjalan.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menolak tanpa penjelasan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Penjelasan persyaratan yang jelas mencegah praktik tidak sah.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 259,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda menerima kritik di media sosial terkait pelayanan. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Membalas dengan emosi dan membuka data pribadi.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Melaporkan melalui kanal yang tepat, memeriksa fakta, dan memberi respons resmi yang proporsional.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengajak rekan menyerang akun tersebut.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menghapus kritik dengan akses tidak sah.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Respons publik harus menjaga etika, privasi, dan akurasi.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 260,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Seorang korban tampak takut saat dimintai keterangan. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Memaksanya menjawab cepat.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menciptakan suasana aman, menjelaskan proses, dan mengikuti prosedur pemeriksaan yang berlaku.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyalahkan korban.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menceritakan kasusnya kepada orang lain. Adaptabilitas dan pembelajaran",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Pendekatan empatik dan prosedural membantu menjaga martabat serta kualitas informasi.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 261,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Sistem kerja digital baru diterapkan. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menolak mempelajarinya.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Mengikuti pelatihan, mencoba sesuai panduan, dan melaporkan kendala secara spesifik.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Meminta orang lain mengerjakan selamanya.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menggunakan akun orang lain.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Belajar aktif dan penggunaan akun yang benar menjaga keamanan serta kompetensi.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 262,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda menerima umpan balik bahwa komunikasi Anda terlalu singkat. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menganggap semua orang terlalu sensitif.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Meminta contoh, menilai dampaknya, dan menyesuaikan kejelasan komunikasi.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membalas kritik.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menghindari komunikasi.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Umpan balik konkret dapat diterjemahkan menjadi perbaikan perilaku.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 263,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Prosedur berubah sementara Anda terbiasa dengan cara lama. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Tetap menggunakan cara lama.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Mempelajari ketentuan terbaru dan meminta klarifikasi bila ada bagian yang belum jelas.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyuruh tim mengabaikan perubahan.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengubah prosedur sendiri.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Adaptasi harus mengikuti ketentuan yang berlaku.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 264,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda mendapat tugas pada bidang yang belum dikuasai. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Berpura-pura ahli.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Memetakan kebutuhan kompetensi, belajar, dan berkonsultasi dengan personel yang berwenang.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menolak semua tugas baru.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengerjakan tanpa memeriksa risiko.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Pengembangan kompetensi disertai konsultasi mencegah kesalahan.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 265,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Ada informasi viral tentang kejadian yang berkaitan dengan tugas. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Langsung meneruskan.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Memeriksa sumber dan fakta sebelum menyampaikan atau mengambil tindakan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menambah spekulasi.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menggunakan informasi anonim sebagai kepastian.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Verifikasi adalah kebiasaan penting dalam lingkungan informasi cepat.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 266,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Metode kerja baru ditawarkan oleh anggota junior. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menolak karena usia/pangkat.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menilai manfaat dan risikonya secara objektif.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menerima tanpa uji coba.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengambil ide tanpa mengakui pengusul.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Kualitas ide tidak ditentukan semata-mata oleh senioritas.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 267,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda melakukan kesalahan karena belum memahami aplikasi. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Menyembunyikan kesalahan.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Melaporkan dampaknya, meminta bantuan, dan mempelajari panduan agar tidak terulang.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyalahkan aplikasi tanpa bukti.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menghapus data.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Transparansi dan pembelajaran mengurangi risiko berulang.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 268,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Perubahan situasi membuat rencana awal tidak relevan. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Tetap menjalankan rencana lama tanpa evaluasi.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menilai perubahan, menyesuaikan rencana dalam kewenangan, dan mengomunikasikan dampaknya.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menghentikan semua kegiatan tanpa alasan.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Mengambil keputusan di luar kewenangan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Adaptasi yang terukur menjaga tujuan dan kepatuhan.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 269,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Anda diminta mempelajari materi baru dalam waktu singkat. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Membaca sekilas tanpa memahami.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Menentukan pokok penting, memakai sumber tepercaya, dan menguji pemahaman.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyalin jawaban orang lain.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menunda sampai tenggat.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Belajar terstruktur meningkatkan pemahaman dalam waktu terbatas.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 270,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Kedinasan] Setelah pelatihan, Anda kembali ke rutinitas lama. Anda…",
    "options": [
      {
        "key": "A",
        "text": "Tidak menerapkan materi.",
        "weight": 3
      },
      {
        "key": "B",
        "text": "Memilih praktik yang relevan, menerapkannya sesuai aturan, dan mengevaluasi hasil.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengubah semua proses tanpa persetujuan.",
        "weight": 4
      },
      {
        "key": "D",
        "text": "Menganggap pelatihan tidak berguna. Panduan Jawaban dan Penjelasan Bagian A: tidak memiliki kunci benar-salah. Gunakan skala 1–5 untuk mencatat respons yang paling sesuai dengan diri Anda. Pernyataan positif menggambarkan kecenderungan perilaku yang umumnya mendukung kinerja profesional; skor tinggi bukan jaminan kelulusan dan bukan ukuran tunggal kepribadian. Untuk refleksi Bagian A, tandai pernyataan yang Anda jawab 1 atau 2 pada aspek yang penting bagi pekerjaan. Tanyakan: apakah ada contoh nyata yang mendukung jawaban saya? Apakah ada kebiasaan kecil yang perlu diperbaiki? Hindari mengubah jawaban hanya agar terlihat sempurna.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda tindakan dan melihat perkembangan situasi tanpa berkoordinasi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 4,
      "D": 1,
      "E": 2
    },
    "explanation": "Penilaian Bobot Etika Polri: Pilihan paling konstruktif adalah opsi (B) dengan bobot maksimal 5 poin. Transfer pembelajaran perlu dilakukan secara bertahap dan terukur.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 271,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya tetap menyampaikan fakta meskipun fakta tersebut dapat membuat saya mendapat teguran.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 272,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya menolak menggunakan fasilitas jabatan untuk kepentingan pribadi.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 273,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya bersedia mengakui kesalahan tanpa menyalahkan rekan kerja.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 274,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya menjaga kerahasiaan informasi kedinasan sesuai kewenangan.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 275,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya tidak mengubah laporan agar terlihat lebih baik dari keadaan sebenarnya.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 276,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya berani menolak ajakan yang bertentangan dengan aturan.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 277,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya menghindari janji yang tidak dapat saya penuhi.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 278,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya memperlakukan orang secara adil tanpa melihat kedekatan pribadi.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 279,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya segera memperbaiki informasi keliru yang pernah saya sampaikan.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 280,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya tetap mematuhi prosedur meskipun tidak sedang diawasi.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 281,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya menyusun prioritas agar pekerjaan selesai sesuai tenggat.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 282,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya datang tepat waktu untuk kegiatan yang telah dijadwalkan.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 283,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya menuntaskan tugas yang menjadi tanggung jawab saya.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 284,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya memeriksa kembali pekerjaan sebelum diserahkan.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 285,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya tetap bekerja sesuai standar meskipun tugas terasa rutin.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 286,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya memberi kabar lebih awal jika ada hambatan yang mengancam tenggat.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 287,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya menggunakan waktu kerja untuk kegiatan yang berkaitan dengan tugas.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 288,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya menerima evaluasi atas hasil kerja tanpa menghindarinya.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 289,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya mencatat tindak lanjut agar tidak ada tugas yang terlupakan.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 290,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya bertanggung jawab atas keputusan yang berada dalam kewenangan saya.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 291,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya berusaha tetap tenang ketika menghadapi kritik.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 292,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saat marah, saya menunda respons sampai dapat berpikir jernih.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 293,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya dapat bekerja terarah ketika menghadapi beberapa tuntutan sekaligus.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 294,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya tidak melampiaskan masalah pribadi kepada anggota tim.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 295,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya mampu meminta jeda atau bantuan ketika tekanan mulai mengganggu kinerja.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 296,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya mempertimbangkan fakta sebelum bereaksi terhadap provokasi.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 297,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya dapat kembali fokus setelah mengalami kegagalan.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 298,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya menjaga cara bicara meskipun sedang tidak sependapat.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 299,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya mengenali tanda-tanda kelelahan pada diri sendiri.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  },
  {
    "id": 300,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Sikap Kedinasan & Integritas] Terkait prinsip kedinasan: \"Saya mencari cara penyelesaian, bukan terus-menerus menyalahkan keadaan.\". Bagaimana tindakan konkret yang paling mencerminkan diri Anda saat bertugas?",
    "options": [
      {
        "key": "A",
        "text": "Selalu saya terapkan secara konsisten dan tegas dalam setiap situasi tugas kedinasan, tanpa kompromi.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Hampir selalu saya terapkan, dan bila ada kendala lapangan segera saya koordinasikan dengan pimpinan.",
        "weight": 4
      },
      {
        "key": "C",
        "text": "Saya berusaha menerapkan sesuai kondisi situasi dan arahan rekan kerja di lapangan.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Kadang-kadang saya terapkan jika situasi memungkinkan dan tidak menimbulkan gesekan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Saya cenderung mengikuti kebiasaan umum lingkungan tugas meskipun berbeda dengan prinsip tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 4,
      "C": 3,
      "D": 2,
      "E": 1
    },
    "explanation": "Penilaian Bobot Sikap: Nilai 5 diperoleh pada opsi (A) karena menunjukkan komitmen teguh terhadap nilai Tribrata dan Catur Prasetya dalam pelaksanaan tugas Polri.",
    "dimension": "Komitmen Kedinasan"
  }
];

/* -------------------------------------------------------------------------- */
/* 3. KUMPULAN SOAL KECERMATAN (100 Butir / 5 Kolom @ 20 Butir)               */
/* -------------------------------------------------------------------------- */
const QUESTIONS_KECERMATAN: SimQuestion[] = [
  {
    "id": 3001,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 1 (Angka Hilang) — Soal 1/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "B",
    "explanation": "Karakter patokan: 8 3 9 5 2. Karakter pada soal: 8 5 2 9. Karakter yang tidak ada adalah '3' yang berada di bawah huruf (B).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 1,
    "benchmark": [
      {
        "char": "8",
        "label": "A"
      },
      {
        "char": "3",
        "label": "B"
      },
      {
        "char": "9",
        "label": "C"
      },
      {
        "char": "5",
        "label": "D"
      },
      {
        "char": "2",
        "label": "E"
      }
    ],
    "questionChars": [
      "8",
      "5",
      "2",
      "9"
    ],
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "9"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "2"
      }
    ]
  },
  {
    "id": 3002,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 1 (Angka Hilang) — Soal 2/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "E",
    "explanation": "Karakter patokan: 8 3 9 5 2. Karakter pada soal: 8 5 9 3. Karakter yang tidak ada adalah '2' yang berada di bawah huruf (E).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 1,
    "benchmark": [
      {
        "char": "8",
        "label": "A"
      },
      {
        "char": "3",
        "label": "B"
      },
      {
        "char": "9",
        "label": "C"
      },
      {
        "char": "5",
        "label": "D"
      },
      {
        "char": "2",
        "label": "E"
      }
    ],
    "questionChars": [
      "8",
      "5",
      "9",
      "3"
    ],
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "9"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "2"
      }
    ]
  },
  {
    "id": 3003,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 1 (Angka Hilang) — Soal 3/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "C",
    "explanation": "Karakter patokan: 8 3 9 5 2. Karakter pada soal: 8 2 5 3. Karakter yang tidak ada adalah '9' yang berada di bawah huruf (C).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 1,
    "benchmark": [
      {
        "char": "8",
        "label": "A"
      },
      {
        "char": "3",
        "label": "B"
      },
      {
        "char": "9",
        "label": "C"
      },
      {
        "char": "5",
        "label": "D"
      },
      {
        "char": "2",
        "label": "E"
      }
    ],
    "questionChars": [
      "8",
      "2",
      "5",
      "3"
    ],
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "9"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "2"
      }
    ]
  },
  {
    "id": 3004,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 1 (Angka Hilang) — Soal 4/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "A",
    "explanation": "Karakter patokan: 8 3 9 5 2. Karakter pada soal: 9 3 5 2. Karakter yang tidak ada adalah '8' yang berada di bawah huruf (A).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 1,
    "benchmark": [
      {
        "char": "8",
        "label": "A"
      },
      {
        "char": "3",
        "label": "B"
      },
      {
        "char": "9",
        "label": "C"
      },
      {
        "char": "5",
        "label": "D"
      },
      {
        "char": "2",
        "label": "E"
      }
    ],
    "questionChars": [
      "9",
      "3",
      "5",
      "2"
    ],
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "9"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "2"
      }
    ]
  },
  {
    "id": 3005,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 1 (Angka Hilang) — Soal 5/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "D",
    "explanation": "Karakter patokan: 8 3 9 5 2. Karakter pada soal: 3 9 2 8. Karakter yang tidak ada adalah '5' yang berada di bawah huruf (D).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 1,
    "benchmark": [
      {
        "char": "8",
        "label": "A"
      },
      {
        "char": "3",
        "label": "B"
      },
      {
        "char": "9",
        "label": "C"
      },
      {
        "char": "5",
        "label": "D"
      },
      {
        "char": "2",
        "label": "E"
      }
    ],
    "questionChars": [
      "3",
      "9",
      "2",
      "8"
    ],
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "9"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "2"
      }
    ]
  },
  {
    "id": 3006,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 1 (Angka Hilang) — Soal 6/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "B",
    "explanation": "Karakter patokan: 8 3 9 5 2. Karakter pada soal: 9 8 2 5. Karakter yang tidak ada adalah '3' yang berada di bawah huruf (B).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 1,
    "benchmark": [
      {
        "char": "8",
        "label": "A"
      },
      {
        "char": "3",
        "label": "B"
      },
      {
        "char": "9",
        "label": "C"
      },
      {
        "char": "5",
        "label": "D"
      },
      {
        "char": "2",
        "label": "E"
      }
    ],
    "questionChars": [
      "9",
      "8",
      "2",
      "5"
    ],
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "9"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "2"
      }
    ]
  },
  {
    "id": 3007,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 1 (Angka Hilang) — Soal 7/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "E",
    "explanation": "Karakter patokan: 8 3 9 5 2. Karakter pada soal: 9 3 8 5. Karakter yang tidak ada adalah '2' yang berada di bawah huruf (E).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 1,
    "benchmark": [
      {
        "char": "8",
        "label": "A"
      },
      {
        "char": "3",
        "label": "B"
      },
      {
        "char": "9",
        "label": "C"
      },
      {
        "char": "5",
        "label": "D"
      },
      {
        "char": "2",
        "label": "E"
      }
    ],
    "questionChars": [
      "9",
      "3",
      "8",
      "5"
    ],
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "9"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "2"
      }
    ]
  },
  {
    "id": 3008,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 1 (Angka Hilang) — Soal 8/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "C",
    "explanation": "Karakter patokan: 8 3 9 5 2. Karakter pada soal: 8 2 5 3. Karakter yang tidak ada adalah '9' yang berada di bawah huruf (C).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 1,
    "benchmark": [
      {
        "char": "8",
        "label": "A"
      },
      {
        "char": "3",
        "label": "B"
      },
      {
        "char": "9",
        "label": "C"
      },
      {
        "char": "5",
        "label": "D"
      },
      {
        "char": "2",
        "label": "E"
      }
    ],
    "questionChars": [
      "8",
      "2",
      "5",
      "3"
    ],
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "9"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "2"
      }
    ]
  },
  {
    "id": 3009,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 1 (Angka Hilang) — Soal 9/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "A",
    "explanation": "Karakter patokan: 8 3 9 5 2. Karakter pada soal: 2 3 5 9. Karakter yang tidak ada adalah '8' yang berada di bawah huruf (A).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 1,
    "benchmark": [
      {
        "char": "8",
        "label": "A"
      },
      {
        "char": "3",
        "label": "B"
      },
      {
        "char": "9",
        "label": "C"
      },
      {
        "char": "5",
        "label": "D"
      },
      {
        "char": "2",
        "label": "E"
      }
    ],
    "questionChars": [
      "2",
      "3",
      "5",
      "9"
    ],
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "9"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "2"
      }
    ]
  },
  {
    "id": 3010,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 1 (Angka Hilang) — Soal 10/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "D",
    "explanation": "Karakter patokan: 8 3 9 5 2. Karakter pada soal: 2 3 8 9. Karakter yang tidak ada adalah '5' yang berada di bawah huruf (D).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 1,
    "benchmark": [
      {
        "char": "8",
        "label": "A"
      },
      {
        "char": "3",
        "label": "B"
      },
      {
        "char": "9",
        "label": "C"
      },
      {
        "char": "5",
        "label": "D"
      },
      {
        "char": "2",
        "label": "E"
      }
    ],
    "questionChars": [
      "2",
      "3",
      "8",
      "9"
    ],
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "9"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "2"
      }
    ]
  },
  {
    "id": 3011,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 1 (Angka Hilang) — Soal 11/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "B",
    "explanation": "Karakter patokan: 8 3 9 5 2. Karakter pada soal: 9 8 5 2. Karakter yang tidak ada adalah '3' yang berada di bawah huruf (B).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 1,
    "benchmark": [
      {
        "char": "8",
        "label": "A"
      },
      {
        "char": "3",
        "label": "B"
      },
      {
        "char": "9",
        "label": "C"
      },
      {
        "char": "5",
        "label": "D"
      },
      {
        "char": "2",
        "label": "E"
      }
    ],
    "questionChars": [
      "9",
      "8",
      "5",
      "2"
    ],
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "9"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "2"
      }
    ]
  },
  {
    "id": 3012,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 1 (Angka Hilang) — Soal 12/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "E",
    "explanation": "Karakter patokan: 8 3 9 5 2. Karakter pada soal: 8 9 5 3. Karakter yang tidak ada adalah '2' yang berada di bawah huruf (E).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 1,
    "benchmark": [
      {
        "char": "8",
        "label": "A"
      },
      {
        "char": "3",
        "label": "B"
      },
      {
        "char": "9",
        "label": "C"
      },
      {
        "char": "5",
        "label": "D"
      },
      {
        "char": "2",
        "label": "E"
      }
    ],
    "questionChars": [
      "8",
      "9",
      "5",
      "3"
    ],
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "9"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "2"
      }
    ]
  },
  {
    "id": 3013,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 1 (Angka Hilang) — Soal 13/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "C",
    "explanation": "Karakter patokan: 8 3 9 5 2. Karakter pada soal: 8 3 5 2. Karakter yang tidak ada adalah '9' yang berada di bawah huruf (C).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 1,
    "benchmark": [
      {
        "char": "8",
        "label": "A"
      },
      {
        "char": "3",
        "label": "B"
      },
      {
        "char": "9",
        "label": "C"
      },
      {
        "char": "5",
        "label": "D"
      },
      {
        "char": "2",
        "label": "E"
      }
    ],
    "questionChars": [
      "8",
      "3",
      "5",
      "2"
    ],
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "9"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "2"
      }
    ]
  },
  {
    "id": 3014,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 1 (Angka Hilang) — Soal 14/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "A",
    "explanation": "Karakter patokan: 8 3 9 5 2. Karakter pada soal: 2 9 5 3. Karakter yang tidak ada adalah '8' yang berada di bawah huruf (A).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 1,
    "benchmark": [
      {
        "char": "8",
        "label": "A"
      },
      {
        "char": "3",
        "label": "B"
      },
      {
        "char": "9",
        "label": "C"
      },
      {
        "char": "5",
        "label": "D"
      },
      {
        "char": "2",
        "label": "E"
      }
    ],
    "questionChars": [
      "2",
      "9",
      "5",
      "3"
    ],
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "9"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "2"
      }
    ]
  },
  {
    "id": 3015,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 1 (Angka Hilang) — Soal 15/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "D",
    "explanation": "Karakter patokan: 8 3 9 5 2. Karakter pada soal: 2 8 9 3. Karakter yang tidak ada adalah '5' yang berada di bawah huruf (D).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 1,
    "benchmark": [
      {
        "char": "8",
        "label": "A"
      },
      {
        "char": "3",
        "label": "B"
      },
      {
        "char": "9",
        "label": "C"
      },
      {
        "char": "5",
        "label": "D"
      },
      {
        "char": "2",
        "label": "E"
      }
    ],
    "questionChars": [
      "2",
      "8",
      "9",
      "3"
    ],
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "9"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "2"
      }
    ]
  },
  {
    "id": 3016,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 1 (Angka Hilang) — Soal 16/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "B",
    "explanation": "Karakter patokan: 8 3 9 5 2. Karakter pada soal: 9 2 8 5. Karakter yang tidak ada adalah '3' yang berada di bawah huruf (B).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 1,
    "benchmark": [
      {
        "char": "8",
        "label": "A"
      },
      {
        "char": "3",
        "label": "B"
      },
      {
        "char": "9",
        "label": "C"
      },
      {
        "char": "5",
        "label": "D"
      },
      {
        "char": "2",
        "label": "E"
      }
    ],
    "questionChars": [
      "9",
      "2",
      "8",
      "5"
    ],
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "9"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "2"
      }
    ]
  },
  {
    "id": 3017,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 1 (Angka Hilang) — Soal 17/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "E",
    "explanation": "Karakter patokan: 8 3 9 5 2. Karakter pada soal: 3 5 8 9. Karakter yang tidak ada adalah '2' yang berada di bawah huruf (E).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 1,
    "benchmark": [
      {
        "char": "8",
        "label": "A"
      },
      {
        "char": "3",
        "label": "B"
      },
      {
        "char": "9",
        "label": "C"
      },
      {
        "char": "5",
        "label": "D"
      },
      {
        "char": "2",
        "label": "E"
      }
    ],
    "questionChars": [
      "3",
      "5",
      "8",
      "9"
    ],
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "9"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "2"
      }
    ]
  },
  {
    "id": 3018,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 1 (Angka Hilang) — Soal 18/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "C",
    "explanation": "Karakter patokan: 8 3 9 5 2. Karakter pada soal: 2 5 8 3. Karakter yang tidak ada adalah '9' yang berada di bawah huruf (C).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 1,
    "benchmark": [
      {
        "char": "8",
        "label": "A"
      },
      {
        "char": "3",
        "label": "B"
      },
      {
        "char": "9",
        "label": "C"
      },
      {
        "char": "5",
        "label": "D"
      },
      {
        "char": "2",
        "label": "E"
      }
    ],
    "questionChars": [
      "2",
      "5",
      "8",
      "3"
    ],
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "9"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "2"
      }
    ]
  },
  {
    "id": 3019,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 1 (Angka Hilang) — Soal 19/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "A",
    "explanation": "Karakter patokan: 8 3 9 5 2. Karakter pada soal: 5 3 2 9. Karakter yang tidak ada adalah '8' yang berada di bawah huruf (A).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 1,
    "benchmark": [
      {
        "char": "8",
        "label": "A"
      },
      {
        "char": "3",
        "label": "B"
      },
      {
        "char": "9",
        "label": "C"
      },
      {
        "char": "5",
        "label": "D"
      },
      {
        "char": "2",
        "label": "E"
      }
    ],
    "questionChars": [
      "5",
      "3",
      "2",
      "9"
    ],
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "9"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "2"
      }
    ]
  },
  {
    "id": 3020,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 1 (Angka Hilang) — Soal 20/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "D",
    "explanation": "Karakter patokan: 8 3 9 5 2. Karakter pada soal: 2 3 8 9. Karakter yang tidak ada adalah '5' yang berada di bawah huruf (D).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 1,
    "benchmark": [
      {
        "char": "8",
        "label": "A"
      },
      {
        "char": "3",
        "label": "B"
      },
      {
        "char": "9",
        "label": "C"
      },
      {
        "char": "5",
        "label": "D"
      },
      {
        "char": "2",
        "label": "E"
      }
    ],
    "questionChars": [
      "2",
      "3",
      "8",
      "9"
    ],
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "9"
      },
      {
        "key": "D",
        "text": "5"
      },
      {
        "key": "E",
        "text": "2"
      }
    ]
  },
  {
    "id": 3021,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 2 (Huruf Hilang) — Soal 1/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "C",
    "explanation": "Karakter patokan: B K M P T. Karakter pada soal: K P T B. Karakter yang tidak ada adalah 'M' yang berada di bawah huruf (C).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "K",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "P",
        "label": "D"
      },
      {
        "char": "T",
        "label": "E"
      }
    ],
    "questionChars": [
      "K",
      "P",
      "T",
      "B"
    ],
    "options": [
      {
        "key": "A",
        "text": "B"
      },
      {
        "key": "B",
        "text": "K"
      },
      {
        "key": "C",
        "text": "M"
      },
      {
        "key": "D",
        "text": "P"
      },
      {
        "key": "E",
        "text": "T"
      }
    ]
  },
  {
    "id": 3022,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 2 (Huruf Hilang) — Soal 2/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "A",
    "explanation": "Karakter patokan: B K M P T. Karakter pada soal: T M P K. Karakter yang tidak ada adalah 'B' yang berada di bawah huruf (A).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "K",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "P",
        "label": "D"
      },
      {
        "char": "T",
        "label": "E"
      }
    ],
    "questionChars": [
      "T",
      "M",
      "P",
      "K"
    ],
    "options": [
      {
        "key": "A",
        "text": "B"
      },
      {
        "key": "B",
        "text": "K"
      },
      {
        "key": "C",
        "text": "M"
      },
      {
        "key": "D",
        "text": "P"
      },
      {
        "key": "E",
        "text": "T"
      }
    ]
  },
  {
    "id": 3023,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 2 (Huruf Hilang) — Soal 3/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "D",
    "explanation": "Karakter patokan: B K M P T. Karakter pada soal: B K M T. Karakter yang tidak ada adalah 'P' yang berada di bawah huruf (D).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "K",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "P",
        "label": "D"
      },
      {
        "char": "T",
        "label": "E"
      }
    ],
    "questionChars": [
      "B",
      "K",
      "M",
      "T"
    ],
    "options": [
      {
        "key": "A",
        "text": "B"
      },
      {
        "key": "B",
        "text": "K"
      },
      {
        "key": "C",
        "text": "M"
      },
      {
        "key": "D",
        "text": "P"
      },
      {
        "key": "E",
        "text": "T"
      }
    ]
  },
  {
    "id": 3024,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 2 (Huruf Hilang) — Soal 4/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "B",
    "explanation": "Karakter patokan: B K M P T. Karakter pada soal: P M T B. Karakter yang tidak ada adalah 'K' yang berada di bawah huruf (B).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "K",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "P",
        "label": "D"
      },
      {
        "char": "T",
        "label": "E"
      }
    ],
    "questionChars": [
      "P",
      "M",
      "T",
      "B"
    ],
    "options": [
      {
        "key": "A",
        "text": "B"
      },
      {
        "key": "B",
        "text": "K"
      },
      {
        "key": "C",
        "text": "M"
      },
      {
        "key": "D",
        "text": "P"
      },
      {
        "key": "E",
        "text": "T"
      }
    ]
  },
  {
    "id": 3025,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 2 (Huruf Hilang) — Soal 5/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "E",
    "explanation": "Karakter patokan: B K M P T. Karakter pada soal: K M B P. Karakter yang tidak ada adalah 'T' yang berada di bawah huruf (E).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "K",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "P",
        "label": "D"
      },
      {
        "char": "T",
        "label": "E"
      }
    ],
    "questionChars": [
      "K",
      "M",
      "B",
      "P"
    ],
    "options": [
      {
        "key": "A",
        "text": "B"
      },
      {
        "key": "B",
        "text": "K"
      },
      {
        "key": "C",
        "text": "M"
      },
      {
        "key": "D",
        "text": "P"
      },
      {
        "key": "E",
        "text": "T"
      }
    ]
  },
  {
    "id": 3026,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 2 (Huruf Hilang) — Soal 6/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "C",
    "explanation": "Karakter patokan: B K M P T. Karakter pada soal: P B K T. Karakter yang tidak ada adalah 'M' yang berada di bawah huruf (C).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "K",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "P",
        "label": "D"
      },
      {
        "char": "T",
        "label": "E"
      }
    ],
    "questionChars": [
      "P",
      "B",
      "K",
      "T"
    ],
    "options": [
      {
        "key": "A",
        "text": "B"
      },
      {
        "key": "B",
        "text": "K"
      },
      {
        "key": "C",
        "text": "M"
      },
      {
        "key": "D",
        "text": "P"
      },
      {
        "key": "E",
        "text": "T"
      }
    ]
  },
  {
    "id": 3027,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 2 (Huruf Hilang) — Soal 7/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "A",
    "explanation": "Karakter patokan: B K M P T. Karakter pada soal: P M T K. Karakter yang tidak ada adalah 'B' yang berada di bawah huruf (A).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "K",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "P",
        "label": "D"
      },
      {
        "char": "T",
        "label": "E"
      }
    ],
    "questionChars": [
      "P",
      "M",
      "T",
      "K"
    ],
    "options": [
      {
        "key": "A",
        "text": "B"
      },
      {
        "key": "B",
        "text": "K"
      },
      {
        "key": "C",
        "text": "M"
      },
      {
        "key": "D",
        "text": "P"
      },
      {
        "key": "E",
        "text": "T"
      }
    ]
  },
  {
    "id": 3028,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 2 (Huruf Hilang) — Soal 8/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "D",
    "explanation": "Karakter patokan: B K M P T. Karakter pada soal: T B M K. Karakter yang tidak ada adalah 'P' yang berada di bawah huruf (D).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "K",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "P",
        "label": "D"
      },
      {
        "char": "T",
        "label": "E"
      }
    ],
    "questionChars": [
      "T",
      "B",
      "M",
      "K"
    ],
    "options": [
      {
        "key": "A",
        "text": "B"
      },
      {
        "key": "B",
        "text": "K"
      },
      {
        "key": "C",
        "text": "M"
      },
      {
        "key": "D",
        "text": "P"
      },
      {
        "key": "E",
        "text": "T"
      }
    ]
  },
  {
    "id": 3029,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 2 (Huruf Hilang) — Soal 9/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "B",
    "explanation": "Karakter patokan: B K M P T. Karakter pada soal: M B T P. Karakter yang tidak ada adalah 'K' yang berada di bawah huruf (B).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "K",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "P",
        "label": "D"
      },
      {
        "char": "T",
        "label": "E"
      }
    ],
    "questionChars": [
      "M",
      "B",
      "T",
      "P"
    ],
    "options": [
      {
        "key": "A",
        "text": "B"
      },
      {
        "key": "B",
        "text": "K"
      },
      {
        "key": "C",
        "text": "M"
      },
      {
        "key": "D",
        "text": "P"
      },
      {
        "key": "E",
        "text": "T"
      }
    ]
  },
  {
    "id": 3030,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 2 (Huruf Hilang) — Soal 10/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "E",
    "explanation": "Karakter patokan: B K M P T. Karakter pada soal: M K P B. Karakter yang tidak ada adalah 'T' yang berada di bawah huruf (E).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "K",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "P",
        "label": "D"
      },
      {
        "char": "T",
        "label": "E"
      }
    ],
    "questionChars": [
      "M",
      "K",
      "P",
      "B"
    ],
    "options": [
      {
        "key": "A",
        "text": "B"
      },
      {
        "key": "B",
        "text": "K"
      },
      {
        "key": "C",
        "text": "M"
      },
      {
        "key": "D",
        "text": "P"
      },
      {
        "key": "E",
        "text": "T"
      }
    ]
  },
  {
    "id": 3031,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 2 (Huruf Hilang) — Soal 11/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "C",
    "explanation": "Karakter patokan: B K M P T. Karakter pada soal: P K B T. Karakter yang tidak ada adalah 'M' yang berada di bawah huruf (C).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "K",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "P",
        "label": "D"
      },
      {
        "char": "T",
        "label": "E"
      }
    ],
    "questionChars": [
      "P",
      "K",
      "B",
      "T"
    ],
    "options": [
      {
        "key": "A",
        "text": "B"
      },
      {
        "key": "B",
        "text": "K"
      },
      {
        "key": "C",
        "text": "M"
      },
      {
        "key": "D",
        "text": "P"
      },
      {
        "key": "E",
        "text": "T"
      }
    ]
  },
  {
    "id": 3032,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 2 (Huruf Hilang) — Soal 12/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "A",
    "explanation": "Karakter patokan: B K M P T. Karakter pada soal: M K T P. Karakter yang tidak ada adalah 'B' yang berada di bawah huruf (A).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "K",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "P",
        "label": "D"
      },
      {
        "char": "T",
        "label": "E"
      }
    ],
    "questionChars": [
      "M",
      "K",
      "T",
      "P"
    ],
    "options": [
      {
        "key": "A",
        "text": "B"
      },
      {
        "key": "B",
        "text": "K"
      },
      {
        "key": "C",
        "text": "M"
      },
      {
        "key": "D",
        "text": "P"
      },
      {
        "key": "E",
        "text": "T"
      }
    ]
  },
  {
    "id": 3033,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 2 (Huruf Hilang) — Soal 13/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "D",
    "explanation": "Karakter patokan: B K M P T. Karakter pada soal: K B M T. Karakter yang tidak ada adalah 'P' yang berada di bawah huruf (D).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "K",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "P",
        "label": "D"
      },
      {
        "char": "T",
        "label": "E"
      }
    ],
    "questionChars": [
      "K",
      "B",
      "M",
      "T"
    ],
    "options": [
      {
        "key": "A",
        "text": "B"
      },
      {
        "key": "B",
        "text": "K"
      },
      {
        "key": "C",
        "text": "M"
      },
      {
        "key": "D",
        "text": "P"
      },
      {
        "key": "E",
        "text": "T"
      }
    ]
  },
  {
    "id": 3034,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 2 (Huruf Hilang) — Soal 14/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "B",
    "explanation": "Karakter patokan: B K M P T. Karakter pada soal: P B T M. Karakter yang tidak ada adalah 'K' yang berada di bawah huruf (B).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "K",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "P",
        "label": "D"
      },
      {
        "char": "T",
        "label": "E"
      }
    ],
    "questionChars": [
      "P",
      "B",
      "T",
      "M"
    ],
    "options": [
      {
        "key": "A",
        "text": "B"
      },
      {
        "key": "B",
        "text": "K"
      },
      {
        "key": "C",
        "text": "M"
      },
      {
        "key": "D",
        "text": "P"
      },
      {
        "key": "E",
        "text": "T"
      }
    ]
  },
  {
    "id": 3035,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 2 (Huruf Hilang) — Soal 15/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "E",
    "explanation": "Karakter patokan: B K M P T. Karakter pada soal: B P K M. Karakter yang tidak ada adalah 'T' yang berada di bawah huruf (E).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "K",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "P",
        "label": "D"
      },
      {
        "char": "T",
        "label": "E"
      }
    ],
    "questionChars": [
      "B",
      "P",
      "K",
      "M"
    ],
    "options": [
      {
        "key": "A",
        "text": "B"
      },
      {
        "key": "B",
        "text": "K"
      },
      {
        "key": "C",
        "text": "M"
      },
      {
        "key": "D",
        "text": "P"
      },
      {
        "key": "E",
        "text": "T"
      }
    ]
  },
  {
    "id": 3036,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 2 (Huruf Hilang) — Soal 16/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "C",
    "explanation": "Karakter patokan: B K M P T. Karakter pada soal: T K P B. Karakter yang tidak ada adalah 'M' yang berada di bawah huruf (C).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "K",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "P",
        "label": "D"
      },
      {
        "char": "T",
        "label": "E"
      }
    ],
    "questionChars": [
      "T",
      "K",
      "P",
      "B"
    ],
    "options": [
      {
        "key": "A",
        "text": "B"
      },
      {
        "key": "B",
        "text": "K"
      },
      {
        "key": "C",
        "text": "M"
      },
      {
        "key": "D",
        "text": "P"
      },
      {
        "key": "E",
        "text": "T"
      }
    ]
  },
  {
    "id": 3037,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 2 (Huruf Hilang) — Soal 17/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "A",
    "explanation": "Karakter patokan: B K M P T. Karakter pada soal: T K P M. Karakter yang tidak ada adalah 'B' yang berada di bawah huruf (A).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "K",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "P",
        "label": "D"
      },
      {
        "char": "T",
        "label": "E"
      }
    ],
    "questionChars": [
      "T",
      "K",
      "P",
      "M"
    ],
    "options": [
      {
        "key": "A",
        "text": "B"
      },
      {
        "key": "B",
        "text": "K"
      },
      {
        "key": "C",
        "text": "M"
      },
      {
        "key": "D",
        "text": "P"
      },
      {
        "key": "E",
        "text": "T"
      }
    ]
  },
  {
    "id": 3038,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 2 (Huruf Hilang) — Soal 18/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "D",
    "explanation": "Karakter patokan: B K M P T. Karakter pada soal: K T B M. Karakter yang tidak ada adalah 'P' yang berada di bawah huruf (D).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "K",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "P",
        "label": "D"
      },
      {
        "char": "T",
        "label": "E"
      }
    ],
    "questionChars": [
      "K",
      "T",
      "B",
      "M"
    ],
    "options": [
      {
        "key": "A",
        "text": "B"
      },
      {
        "key": "B",
        "text": "K"
      },
      {
        "key": "C",
        "text": "M"
      },
      {
        "key": "D",
        "text": "P"
      },
      {
        "key": "E",
        "text": "T"
      }
    ]
  },
  {
    "id": 3039,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 2 (Huruf Hilang) — Soal 19/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "B",
    "explanation": "Karakter patokan: B K M P T. Karakter pada soal: M T B P. Karakter yang tidak ada adalah 'K' yang berada di bawah huruf (B).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "K",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "P",
        "label": "D"
      },
      {
        "char": "T",
        "label": "E"
      }
    ],
    "questionChars": [
      "M",
      "T",
      "B",
      "P"
    ],
    "options": [
      {
        "key": "A",
        "text": "B"
      },
      {
        "key": "B",
        "text": "K"
      },
      {
        "key": "C",
        "text": "M"
      },
      {
        "key": "D",
        "text": "P"
      },
      {
        "key": "E",
        "text": "T"
      }
    ]
  },
  {
    "id": 3040,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 2 (Huruf Hilang) — Soal 20/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "E",
    "explanation": "Karakter patokan: B K M P T. Karakter pada soal: K B P M. Karakter yang tidak ada adalah 'T' yang berada di bawah huruf (E).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "K",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "P",
        "label": "D"
      },
      {
        "char": "T",
        "label": "E"
      }
    ],
    "questionChars": [
      "K",
      "B",
      "P",
      "M"
    ],
    "options": [
      {
        "key": "A",
        "text": "B"
      },
      {
        "key": "B",
        "text": "K"
      },
      {
        "key": "C",
        "text": "M"
      },
      {
        "key": "D",
        "text": "P"
      },
      {
        "key": "E",
        "text": "T"
      }
    ]
  },
  {
    "id": 3041,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 3 (Simbol Hilang) — Soal 1/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "D",
    "explanation": "Karakter patokan: ★ ▲ ◆ ● ■. Karakter pada soal: ■ ★ ▲ ◆. Karakter yang tidak ada adalah '●' yang berada di bawah huruf (D).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "★",
        "label": "A"
      },
      {
        "char": "▲",
        "label": "B"
      },
      {
        "char": "◆",
        "label": "C"
      },
      {
        "char": "●",
        "label": "D"
      },
      {
        "char": "■",
        "label": "E"
      }
    ],
    "questionChars": [
      "■",
      "★",
      "▲",
      "◆"
    ],
    "options": [
      {
        "key": "A",
        "text": "★"
      },
      {
        "key": "B",
        "text": "▲"
      },
      {
        "key": "C",
        "text": "◆"
      },
      {
        "key": "D",
        "text": "●"
      },
      {
        "key": "E",
        "text": "■"
      }
    ]
  },
  {
    "id": 3042,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 3 (Simbol Hilang) — Soal 2/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "B",
    "explanation": "Karakter patokan: ★ ▲ ◆ ● ■. Karakter pada soal: ★ ◆ ● ■. Karakter yang tidak ada adalah '▲' yang berada di bawah huruf (B).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "★",
        "label": "A"
      },
      {
        "char": "▲",
        "label": "B"
      },
      {
        "char": "◆",
        "label": "C"
      },
      {
        "char": "●",
        "label": "D"
      },
      {
        "char": "■",
        "label": "E"
      }
    ],
    "questionChars": [
      "★",
      "◆",
      "●",
      "■"
    ],
    "options": [
      {
        "key": "A",
        "text": "★"
      },
      {
        "key": "B",
        "text": "▲"
      },
      {
        "key": "C",
        "text": "◆"
      },
      {
        "key": "D",
        "text": "●"
      },
      {
        "key": "E",
        "text": "■"
      }
    ]
  },
  {
    "id": 3043,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 3 (Simbol Hilang) — Soal 3/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "E",
    "explanation": "Karakter patokan: ★ ▲ ◆ ● ■. Karakter pada soal: ◆ ★ ▲ ●. Karakter yang tidak ada adalah '■' yang berada di bawah huruf (E).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "★",
        "label": "A"
      },
      {
        "char": "▲",
        "label": "B"
      },
      {
        "char": "◆",
        "label": "C"
      },
      {
        "char": "●",
        "label": "D"
      },
      {
        "char": "■",
        "label": "E"
      }
    ],
    "questionChars": [
      "◆",
      "★",
      "▲",
      "●"
    ],
    "options": [
      {
        "key": "A",
        "text": "★"
      },
      {
        "key": "B",
        "text": "▲"
      },
      {
        "key": "C",
        "text": "◆"
      },
      {
        "key": "D",
        "text": "●"
      },
      {
        "key": "E",
        "text": "■"
      }
    ]
  },
  {
    "id": 3044,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 3 (Simbol Hilang) — Soal 4/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "C",
    "explanation": "Karakter patokan: ★ ▲ ◆ ● ■. Karakter pada soal: ▲ ● ■ ★. Karakter yang tidak ada adalah '◆' yang berada di bawah huruf (C).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "★",
        "label": "A"
      },
      {
        "char": "▲",
        "label": "B"
      },
      {
        "char": "◆",
        "label": "C"
      },
      {
        "char": "●",
        "label": "D"
      },
      {
        "char": "■",
        "label": "E"
      }
    ],
    "questionChars": [
      "▲",
      "●",
      "■",
      "★"
    ],
    "options": [
      {
        "key": "A",
        "text": "★"
      },
      {
        "key": "B",
        "text": "▲"
      },
      {
        "key": "C",
        "text": "◆"
      },
      {
        "key": "D",
        "text": "●"
      },
      {
        "key": "E",
        "text": "■"
      }
    ]
  },
  {
    "id": 3045,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 3 (Simbol Hilang) — Soal 5/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "A",
    "explanation": "Karakter patokan: ★ ▲ ◆ ● ■. Karakter pada soal: ● ■ ▲ ◆. Karakter yang tidak ada adalah '★' yang berada di bawah huruf (A).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "★",
        "label": "A"
      },
      {
        "char": "▲",
        "label": "B"
      },
      {
        "char": "◆",
        "label": "C"
      },
      {
        "char": "●",
        "label": "D"
      },
      {
        "char": "■",
        "label": "E"
      }
    ],
    "questionChars": [
      "●",
      "■",
      "▲",
      "◆"
    ],
    "options": [
      {
        "key": "A",
        "text": "★"
      },
      {
        "key": "B",
        "text": "▲"
      },
      {
        "key": "C",
        "text": "◆"
      },
      {
        "key": "D",
        "text": "●"
      },
      {
        "key": "E",
        "text": "■"
      }
    ]
  },
  {
    "id": 3046,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 3 (Simbol Hilang) — Soal 6/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "D",
    "explanation": "Karakter patokan: ★ ▲ ◆ ● ■. Karakter pada soal: ★ ■ ◆ ▲. Karakter yang tidak ada adalah '●' yang berada di bawah huruf (D).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "★",
        "label": "A"
      },
      {
        "char": "▲",
        "label": "B"
      },
      {
        "char": "◆",
        "label": "C"
      },
      {
        "char": "●",
        "label": "D"
      },
      {
        "char": "■",
        "label": "E"
      }
    ],
    "questionChars": [
      "★",
      "■",
      "◆",
      "▲"
    ],
    "options": [
      {
        "key": "A",
        "text": "★"
      },
      {
        "key": "B",
        "text": "▲"
      },
      {
        "key": "C",
        "text": "◆"
      },
      {
        "key": "D",
        "text": "●"
      },
      {
        "key": "E",
        "text": "■"
      }
    ]
  },
  {
    "id": 3047,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 3 (Simbol Hilang) — Soal 7/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "B",
    "explanation": "Karakter patokan: ★ ▲ ◆ ● ■. Karakter pada soal: ◆ ★ ● ■. Karakter yang tidak ada adalah '▲' yang berada di bawah huruf (B).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "★",
        "label": "A"
      },
      {
        "char": "▲",
        "label": "B"
      },
      {
        "char": "◆",
        "label": "C"
      },
      {
        "char": "●",
        "label": "D"
      },
      {
        "char": "■",
        "label": "E"
      }
    ],
    "questionChars": [
      "◆",
      "★",
      "●",
      "■"
    ],
    "options": [
      {
        "key": "A",
        "text": "★"
      },
      {
        "key": "B",
        "text": "▲"
      },
      {
        "key": "C",
        "text": "◆"
      },
      {
        "key": "D",
        "text": "●"
      },
      {
        "key": "E",
        "text": "■"
      }
    ]
  },
  {
    "id": 3048,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 3 (Simbol Hilang) — Soal 8/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "E",
    "explanation": "Karakter patokan: ★ ▲ ◆ ● ■. Karakter pada soal: ★ ▲ ● ◆. Karakter yang tidak ada adalah '■' yang berada di bawah huruf (E).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "★",
        "label": "A"
      },
      {
        "char": "▲",
        "label": "B"
      },
      {
        "char": "◆",
        "label": "C"
      },
      {
        "char": "●",
        "label": "D"
      },
      {
        "char": "■",
        "label": "E"
      }
    ],
    "questionChars": [
      "★",
      "▲",
      "●",
      "◆"
    ],
    "options": [
      {
        "key": "A",
        "text": "★"
      },
      {
        "key": "B",
        "text": "▲"
      },
      {
        "key": "C",
        "text": "◆"
      },
      {
        "key": "D",
        "text": "●"
      },
      {
        "key": "E",
        "text": "■"
      }
    ]
  },
  {
    "id": 3049,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 3 (Simbol Hilang) — Soal 9/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "C",
    "explanation": "Karakter patokan: ★ ▲ ◆ ● ■. Karakter pada soal: ● ■ ★ ▲. Karakter yang tidak ada adalah '◆' yang berada di bawah huruf (C).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "★",
        "label": "A"
      },
      {
        "char": "▲",
        "label": "B"
      },
      {
        "char": "◆",
        "label": "C"
      },
      {
        "char": "●",
        "label": "D"
      },
      {
        "char": "■",
        "label": "E"
      }
    ],
    "questionChars": [
      "●",
      "■",
      "★",
      "▲"
    ],
    "options": [
      {
        "key": "A",
        "text": "★"
      },
      {
        "key": "B",
        "text": "▲"
      },
      {
        "key": "C",
        "text": "◆"
      },
      {
        "key": "D",
        "text": "●"
      },
      {
        "key": "E",
        "text": "■"
      }
    ]
  },
  {
    "id": 3050,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 3 (Simbol Hilang) — Soal 10/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "A",
    "explanation": "Karakter patokan: ★ ▲ ◆ ● ■. Karakter pada soal: ● ■ ◆ ▲. Karakter yang tidak ada adalah '★' yang berada di bawah huruf (A).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "★",
        "label": "A"
      },
      {
        "char": "▲",
        "label": "B"
      },
      {
        "char": "◆",
        "label": "C"
      },
      {
        "char": "●",
        "label": "D"
      },
      {
        "char": "■",
        "label": "E"
      }
    ],
    "questionChars": [
      "●",
      "■",
      "◆",
      "▲"
    ],
    "options": [
      {
        "key": "A",
        "text": "★"
      },
      {
        "key": "B",
        "text": "▲"
      },
      {
        "key": "C",
        "text": "◆"
      },
      {
        "key": "D",
        "text": "●"
      },
      {
        "key": "E",
        "text": "■"
      }
    ]
  },
  {
    "id": 3051,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 3 (Simbol Hilang) — Soal 11/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "D",
    "explanation": "Karakter patokan: ★ ▲ ◆ ● ■. Karakter pada soal: ◆ ▲ ■ ★. Karakter yang tidak ada adalah '●' yang berada di bawah huruf (D).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "★",
        "label": "A"
      },
      {
        "char": "▲",
        "label": "B"
      },
      {
        "char": "◆",
        "label": "C"
      },
      {
        "char": "●",
        "label": "D"
      },
      {
        "char": "■",
        "label": "E"
      }
    ],
    "questionChars": [
      "◆",
      "▲",
      "■",
      "★"
    ],
    "options": [
      {
        "key": "A",
        "text": "★"
      },
      {
        "key": "B",
        "text": "▲"
      },
      {
        "key": "C",
        "text": "◆"
      },
      {
        "key": "D",
        "text": "●"
      },
      {
        "key": "E",
        "text": "■"
      }
    ]
  },
  {
    "id": 3052,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 3 (Simbol Hilang) — Soal 12/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "B",
    "explanation": "Karakter patokan: ★ ▲ ◆ ● ■. Karakter pada soal: ■ ★ ◆ ●. Karakter yang tidak ada adalah '▲' yang berada di bawah huruf (B).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "★",
        "label": "A"
      },
      {
        "char": "▲",
        "label": "B"
      },
      {
        "char": "◆",
        "label": "C"
      },
      {
        "char": "●",
        "label": "D"
      },
      {
        "char": "■",
        "label": "E"
      }
    ],
    "questionChars": [
      "■",
      "★",
      "◆",
      "●"
    ],
    "options": [
      {
        "key": "A",
        "text": "★"
      },
      {
        "key": "B",
        "text": "▲"
      },
      {
        "key": "C",
        "text": "◆"
      },
      {
        "key": "D",
        "text": "●"
      },
      {
        "key": "E",
        "text": "■"
      }
    ]
  },
  {
    "id": 3053,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 3 (Simbol Hilang) — Soal 13/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "E",
    "explanation": "Karakter patokan: ★ ▲ ◆ ● ■. Karakter pada soal: ★ ● ◆ ▲. Karakter yang tidak ada adalah '■' yang berada di bawah huruf (E).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "★",
        "label": "A"
      },
      {
        "char": "▲",
        "label": "B"
      },
      {
        "char": "◆",
        "label": "C"
      },
      {
        "char": "●",
        "label": "D"
      },
      {
        "char": "■",
        "label": "E"
      }
    ],
    "questionChars": [
      "★",
      "●",
      "◆",
      "▲"
    ],
    "options": [
      {
        "key": "A",
        "text": "★"
      },
      {
        "key": "B",
        "text": "▲"
      },
      {
        "key": "C",
        "text": "◆"
      },
      {
        "key": "D",
        "text": "●"
      },
      {
        "key": "E",
        "text": "■"
      }
    ]
  },
  {
    "id": 3054,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 3 (Simbol Hilang) — Soal 14/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "C",
    "explanation": "Karakter patokan: ★ ▲ ◆ ● ■. Karakter pada soal: ★ ■ ● ▲. Karakter yang tidak ada adalah '◆' yang berada di bawah huruf (C).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "★",
        "label": "A"
      },
      {
        "char": "▲",
        "label": "B"
      },
      {
        "char": "◆",
        "label": "C"
      },
      {
        "char": "●",
        "label": "D"
      },
      {
        "char": "■",
        "label": "E"
      }
    ],
    "questionChars": [
      "★",
      "■",
      "●",
      "▲"
    ],
    "options": [
      {
        "key": "A",
        "text": "★"
      },
      {
        "key": "B",
        "text": "▲"
      },
      {
        "key": "C",
        "text": "◆"
      },
      {
        "key": "D",
        "text": "●"
      },
      {
        "key": "E",
        "text": "■"
      }
    ]
  },
  {
    "id": 3055,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 3 (Simbol Hilang) — Soal 15/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "A",
    "explanation": "Karakter patokan: ★ ▲ ◆ ● ■. Karakter pada soal: ● ▲ ■ ◆. Karakter yang tidak ada adalah '★' yang berada di bawah huruf (A).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "★",
        "label": "A"
      },
      {
        "char": "▲",
        "label": "B"
      },
      {
        "char": "◆",
        "label": "C"
      },
      {
        "char": "●",
        "label": "D"
      },
      {
        "char": "■",
        "label": "E"
      }
    ],
    "questionChars": [
      "●",
      "▲",
      "■",
      "◆"
    ],
    "options": [
      {
        "key": "A",
        "text": "★"
      },
      {
        "key": "B",
        "text": "▲"
      },
      {
        "key": "C",
        "text": "◆"
      },
      {
        "key": "D",
        "text": "●"
      },
      {
        "key": "E",
        "text": "■"
      }
    ]
  },
  {
    "id": 3056,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 3 (Simbol Hilang) — Soal 16/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "D",
    "explanation": "Karakter patokan: ★ ▲ ◆ ● ■. Karakter pada soal: ★ ▲ ◆ ■. Karakter yang tidak ada adalah '●' yang berada di bawah huruf (D).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "★",
        "label": "A"
      },
      {
        "char": "▲",
        "label": "B"
      },
      {
        "char": "◆",
        "label": "C"
      },
      {
        "char": "●",
        "label": "D"
      },
      {
        "char": "■",
        "label": "E"
      }
    ],
    "questionChars": [
      "★",
      "▲",
      "◆",
      "■"
    ],
    "options": [
      {
        "key": "A",
        "text": "★"
      },
      {
        "key": "B",
        "text": "▲"
      },
      {
        "key": "C",
        "text": "◆"
      },
      {
        "key": "D",
        "text": "●"
      },
      {
        "key": "E",
        "text": "■"
      }
    ]
  },
  {
    "id": 3057,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 3 (Simbol Hilang) — Soal 17/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "B",
    "explanation": "Karakter patokan: ★ ▲ ◆ ● ■. Karakter pada soal: ● ◆ ■ ★. Karakter yang tidak ada adalah '▲' yang berada di bawah huruf (B).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "★",
        "label": "A"
      },
      {
        "char": "▲",
        "label": "B"
      },
      {
        "char": "◆",
        "label": "C"
      },
      {
        "char": "●",
        "label": "D"
      },
      {
        "char": "■",
        "label": "E"
      }
    ],
    "questionChars": [
      "●",
      "◆",
      "■",
      "★"
    ],
    "options": [
      {
        "key": "A",
        "text": "★"
      },
      {
        "key": "B",
        "text": "▲"
      },
      {
        "key": "C",
        "text": "◆"
      },
      {
        "key": "D",
        "text": "●"
      },
      {
        "key": "E",
        "text": "■"
      }
    ]
  },
  {
    "id": 3058,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 3 (Simbol Hilang) — Soal 18/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "E",
    "explanation": "Karakter patokan: ★ ▲ ◆ ● ■. Karakter pada soal: ◆ ▲ ★ ●. Karakter yang tidak ada adalah '■' yang berada di bawah huruf (E).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "★",
        "label": "A"
      },
      {
        "char": "▲",
        "label": "B"
      },
      {
        "char": "◆",
        "label": "C"
      },
      {
        "char": "●",
        "label": "D"
      },
      {
        "char": "■",
        "label": "E"
      }
    ],
    "questionChars": [
      "◆",
      "▲",
      "★",
      "●"
    ],
    "options": [
      {
        "key": "A",
        "text": "★"
      },
      {
        "key": "B",
        "text": "▲"
      },
      {
        "key": "C",
        "text": "◆"
      },
      {
        "key": "D",
        "text": "●"
      },
      {
        "key": "E",
        "text": "■"
      }
    ]
  },
  {
    "id": 3059,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 3 (Simbol Hilang) — Soal 19/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "C",
    "explanation": "Karakter patokan: ★ ▲ ◆ ● ■. Karakter pada soal: ■ ● ▲ ★. Karakter yang tidak ada adalah '◆' yang berada di bawah huruf (C).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "★",
        "label": "A"
      },
      {
        "char": "▲",
        "label": "B"
      },
      {
        "char": "◆",
        "label": "C"
      },
      {
        "char": "●",
        "label": "D"
      },
      {
        "char": "■",
        "label": "E"
      }
    ],
    "questionChars": [
      "■",
      "●",
      "▲",
      "★"
    ],
    "options": [
      {
        "key": "A",
        "text": "★"
      },
      {
        "key": "B",
        "text": "▲"
      },
      {
        "key": "C",
        "text": "◆"
      },
      {
        "key": "D",
        "text": "●"
      },
      {
        "key": "E",
        "text": "■"
      }
    ]
  },
  {
    "id": 3060,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 3 (Simbol Hilang) — Soal 20/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "A",
    "explanation": "Karakter patokan: ★ ▲ ◆ ● ■. Karakter pada soal: ● ■ ▲ ◆. Karakter yang tidak ada adalah '★' yang berada di bawah huruf (A).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "★",
        "label": "A"
      },
      {
        "char": "▲",
        "label": "B"
      },
      {
        "char": "◆",
        "label": "C"
      },
      {
        "char": "●",
        "label": "D"
      },
      {
        "char": "■",
        "label": "E"
      }
    ],
    "questionChars": [
      "●",
      "■",
      "▲",
      "◆"
    ],
    "options": [
      {
        "key": "A",
        "text": "★"
      },
      {
        "key": "B",
        "text": "▲"
      },
      {
        "key": "C",
        "text": "◆"
      },
      {
        "key": "D",
        "text": "●"
      },
      {
        "key": "E",
        "text": "■"
      }
    ]
  },
  {
    "id": 3061,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 4 (Campuran Angka-Huruf) — Soal 1/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "E",
    "explanation": "Karakter patokan: 7 A 4 F 9. Karakter pada soal: 7 A F 4. Karakter yang tidak ada adalah '9' yang berada di bawah huruf (E).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "7",
        "label": "A"
      },
      {
        "char": "A",
        "label": "B"
      },
      {
        "char": "4",
        "label": "C"
      },
      {
        "char": "F",
        "label": "D"
      },
      {
        "char": "9",
        "label": "E"
      }
    ],
    "questionChars": [
      "7",
      "A",
      "F",
      "4"
    ],
    "options": [
      {
        "key": "A",
        "text": "7"
      },
      {
        "key": "B",
        "text": "A"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "F"
      },
      {
        "key": "E",
        "text": "9"
      }
    ]
  },
  {
    "id": 3062,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 4 (Campuran Angka-Huruf) — Soal 2/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "C",
    "explanation": "Karakter patokan: 7 A 4 F 9. Karakter pada soal: F A 7 9. Karakter yang tidak ada adalah '4' yang berada di bawah huruf (C).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "7",
        "label": "A"
      },
      {
        "char": "A",
        "label": "B"
      },
      {
        "char": "4",
        "label": "C"
      },
      {
        "char": "F",
        "label": "D"
      },
      {
        "char": "9",
        "label": "E"
      }
    ],
    "questionChars": [
      "F",
      "A",
      "7",
      "9"
    ],
    "options": [
      {
        "key": "A",
        "text": "7"
      },
      {
        "key": "B",
        "text": "A"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "F"
      },
      {
        "key": "E",
        "text": "9"
      }
    ]
  },
  {
    "id": 3063,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 4 (Campuran Angka-Huruf) — Soal 3/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "A",
    "explanation": "Karakter patokan: 7 A 4 F 9. Karakter pada soal: F 4 A 9. Karakter yang tidak ada adalah '7' yang berada di bawah huruf (A).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "7",
        "label": "A"
      },
      {
        "char": "A",
        "label": "B"
      },
      {
        "char": "4",
        "label": "C"
      },
      {
        "char": "F",
        "label": "D"
      },
      {
        "char": "9",
        "label": "E"
      }
    ],
    "questionChars": [
      "F",
      "4",
      "A",
      "9"
    ],
    "options": [
      {
        "key": "A",
        "text": "7"
      },
      {
        "key": "B",
        "text": "A"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "F"
      },
      {
        "key": "E",
        "text": "9"
      }
    ]
  },
  {
    "id": 3064,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 4 (Campuran Angka-Huruf) — Soal 4/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "D",
    "explanation": "Karakter patokan: 7 A 4 F 9. Karakter pada soal: 7 9 4 A. Karakter yang tidak ada adalah 'F' yang berada di bawah huruf (D).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "7",
        "label": "A"
      },
      {
        "char": "A",
        "label": "B"
      },
      {
        "char": "4",
        "label": "C"
      },
      {
        "char": "F",
        "label": "D"
      },
      {
        "char": "9",
        "label": "E"
      }
    ],
    "questionChars": [
      "7",
      "9",
      "4",
      "A"
    ],
    "options": [
      {
        "key": "A",
        "text": "7"
      },
      {
        "key": "B",
        "text": "A"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "F"
      },
      {
        "key": "E",
        "text": "9"
      }
    ]
  },
  {
    "id": 3065,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 4 (Campuran Angka-Huruf) — Soal 5/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "B",
    "explanation": "Karakter patokan: 7 A 4 F 9. Karakter pada soal: F 9 4 7. Karakter yang tidak ada adalah 'A' yang berada di bawah huruf (B).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "7",
        "label": "A"
      },
      {
        "char": "A",
        "label": "B"
      },
      {
        "char": "4",
        "label": "C"
      },
      {
        "char": "F",
        "label": "D"
      },
      {
        "char": "9",
        "label": "E"
      }
    ],
    "questionChars": [
      "F",
      "9",
      "4",
      "7"
    ],
    "options": [
      {
        "key": "A",
        "text": "7"
      },
      {
        "key": "B",
        "text": "A"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "F"
      },
      {
        "key": "E",
        "text": "9"
      }
    ]
  },
  {
    "id": 3066,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 4 (Campuran Angka-Huruf) — Soal 6/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "E",
    "explanation": "Karakter patokan: 7 A 4 F 9. Karakter pada soal: 4 A F 7. Karakter yang tidak ada adalah '9' yang berada di bawah huruf (E).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "7",
        "label": "A"
      },
      {
        "char": "A",
        "label": "B"
      },
      {
        "char": "4",
        "label": "C"
      },
      {
        "char": "F",
        "label": "D"
      },
      {
        "char": "9",
        "label": "E"
      }
    ],
    "questionChars": [
      "4",
      "A",
      "F",
      "7"
    ],
    "options": [
      {
        "key": "A",
        "text": "7"
      },
      {
        "key": "B",
        "text": "A"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "F"
      },
      {
        "key": "E",
        "text": "9"
      }
    ]
  },
  {
    "id": 3067,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 4 (Campuran Angka-Huruf) — Soal 7/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "C",
    "explanation": "Karakter patokan: 7 A 4 F 9. Karakter pada soal: 7 F A 9. Karakter yang tidak ada adalah '4' yang berada di bawah huruf (C).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "7",
        "label": "A"
      },
      {
        "char": "A",
        "label": "B"
      },
      {
        "char": "4",
        "label": "C"
      },
      {
        "char": "F",
        "label": "D"
      },
      {
        "char": "9",
        "label": "E"
      }
    ],
    "questionChars": [
      "7",
      "F",
      "A",
      "9"
    ],
    "options": [
      {
        "key": "A",
        "text": "7"
      },
      {
        "key": "B",
        "text": "A"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "F"
      },
      {
        "key": "E",
        "text": "9"
      }
    ]
  },
  {
    "id": 3068,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 4 (Campuran Angka-Huruf) — Soal 8/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "A",
    "explanation": "Karakter patokan: 7 A 4 F 9. Karakter pada soal: 9 F 4 A. Karakter yang tidak ada adalah '7' yang berada di bawah huruf (A).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "7",
        "label": "A"
      },
      {
        "char": "A",
        "label": "B"
      },
      {
        "char": "4",
        "label": "C"
      },
      {
        "char": "F",
        "label": "D"
      },
      {
        "char": "9",
        "label": "E"
      }
    ],
    "questionChars": [
      "9",
      "F",
      "4",
      "A"
    ],
    "options": [
      {
        "key": "A",
        "text": "7"
      },
      {
        "key": "B",
        "text": "A"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "F"
      },
      {
        "key": "E",
        "text": "9"
      }
    ]
  },
  {
    "id": 3069,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 4 (Campuran Angka-Huruf) — Soal 9/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "D",
    "explanation": "Karakter patokan: 7 A 4 F 9. Karakter pada soal: 4 7 A 9. Karakter yang tidak ada adalah 'F' yang berada di bawah huruf (D).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "7",
        "label": "A"
      },
      {
        "char": "A",
        "label": "B"
      },
      {
        "char": "4",
        "label": "C"
      },
      {
        "char": "F",
        "label": "D"
      },
      {
        "char": "9",
        "label": "E"
      }
    ],
    "questionChars": [
      "4",
      "7",
      "A",
      "9"
    ],
    "options": [
      {
        "key": "A",
        "text": "7"
      },
      {
        "key": "B",
        "text": "A"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "F"
      },
      {
        "key": "E",
        "text": "9"
      }
    ]
  },
  {
    "id": 3070,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 4 (Campuran Angka-Huruf) — Soal 10/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "B",
    "explanation": "Karakter patokan: 7 A 4 F 9. Karakter pada soal: F 4 7 9. Karakter yang tidak ada adalah 'A' yang berada di bawah huruf (B).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "7",
        "label": "A"
      },
      {
        "char": "A",
        "label": "B"
      },
      {
        "char": "4",
        "label": "C"
      },
      {
        "char": "F",
        "label": "D"
      },
      {
        "char": "9",
        "label": "E"
      }
    ],
    "questionChars": [
      "F",
      "4",
      "7",
      "9"
    ],
    "options": [
      {
        "key": "A",
        "text": "7"
      },
      {
        "key": "B",
        "text": "A"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "F"
      },
      {
        "key": "E",
        "text": "9"
      }
    ]
  },
  {
    "id": 3071,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 4 (Campuran Angka-Huruf) — Soal 11/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "E",
    "explanation": "Karakter patokan: 7 A 4 F 9. Karakter pada soal: 7 F 4 A. Karakter yang tidak ada adalah '9' yang berada di bawah huruf (E).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "7",
        "label": "A"
      },
      {
        "char": "A",
        "label": "B"
      },
      {
        "char": "4",
        "label": "C"
      },
      {
        "char": "F",
        "label": "D"
      },
      {
        "char": "9",
        "label": "E"
      }
    ],
    "questionChars": [
      "7",
      "F",
      "4",
      "A"
    ],
    "options": [
      {
        "key": "A",
        "text": "7"
      },
      {
        "key": "B",
        "text": "A"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "F"
      },
      {
        "key": "E",
        "text": "9"
      }
    ]
  },
  {
    "id": 3072,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 4 (Campuran Angka-Huruf) — Soal 12/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "C",
    "explanation": "Karakter patokan: 7 A 4 F 9. Karakter pada soal: F 9 7 A. Karakter yang tidak ada adalah '4' yang berada di bawah huruf (C).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "7",
        "label": "A"
      },
      {
        "char": "A",
        "label": "B"
      },
      {
        "char": "4",
        "label": "C"
      },
      {
        "char": "F",
        "label": "D"
      },
      {
        "char": "9",
        "label": "E"
      }
    ],
    "questionChars": [
      "F",
      "9",
      "7",
      "A"
    ],
    "options": [
      {
        "key": "A",
        "text": "7"
      },
      {
        "key": "B",
        "text": "A"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "F"
      },
      {
        "key": "E",
        "text": "9"
      }
    ]
  },
  {
    "id": 3073,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 4 (Campuran Angka-Huruf) — Soal 13/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "A",
    "explanation": "Karakter patokan: 7 A 4 F 9. Karakter pada soal: 4 A 9 F. Karakter yang tidak ada adalah '7' yang berada di bawah huruf (A).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "7",
        "label": "A"
      },
      {
        "char": "A",
        "label": "B"
      },
      {
        "char": "4",
        "label": "C"
      },
      {
        "char": "F",
        "label": "D"
      },
      {
        "char": "9",
        "label": "E"
      }
    ],
    "questionChars": [
      "4",
      "A",
      "9",
      "F"
    ],
    "options": [
      {
        "key": "A",
        "text": "7"
      },
      {
        "key": "B",
        "text": "A"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "F"
      },
      {
        "key": "E",
        "text": "9"
      }
    ]
  },
  {
    "id": 3074,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 4 (Campuran Angka-Huruf) — Soal 14/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "D",
    "explanation": "Karakter patokan: 7 A 4 F 9. Karakter pada soal: A 4 7 9. Karakter yang tidak ada adalah 'F' yang berada di bawah huruf (D).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "7",
        "label": "A"
      },
      {
        "char": "A",
        "label": "B"
      },
      {
        "char": "4",
        "label": "C"
      },
      {
        "char": "F",
        "label": "D"
      },
      {
        "char": "9",
        "label": "E"
      }
    ],
    "questionChars": [
      "A",
      "4",
      "7",
      "9"
    ],
    "options": [
      {
        "key": "A",
        "text": "7"
      },
      {
        "key": "B",
        "text": "A"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "F"
      },
      {
        "key": "E",
        "text": "9"
      }
    ]
  },
  {
    "id": 3075,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 4 (Campuran Angka-Huruf) — Soal 15/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "B",
    "explanation": "Karakter patokan: 7 A 4 F 9. Karakter pada soal: F 7 4 9. Karakter yang tidak ada adalah 'A' yang berada di bawah huruf (B).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "7",
        "label": "A"
      },
      {
        "char": "A",
        "label": "B"
      },
      {
        "char": "4",
        "label": "C"
      },
      {
        "char": "F",
        "label": "D"
      },
      {
        "char": "9",
        "label": "E"
      }
    ],
    "questionChars": [
      "F",
      "7",
      "4",
      "9"
    ],
    "options": [
      {
        "key": "A",
        "text": "7"
      },
      {
        "key": "B",
        "text": "A"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "F"
      },
      {
        "key": "E",
        "text": "9"
      }
    ]
  },
  {
    "id": 3076,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 4 (Campuran Angka-Huruf) — Soal 16/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "E",
    "explanation": "Karakter patokan: 7 A 4 F 9. Karakter pada soal: F A 7 4. Karakter yang tidak ada adalah '9' yang berada di bawah huruf (E).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "7",
        "label": "A"
      },
      {
        "char": "A",
        "label": "B"
      },
      {
        "char": "4",
        "label": "C"
      },
      {
        "char": "F",
        "label": "D"
      },
      {
        "char": "9",
        "label": "E"
      }
    ],
    "questionChars": [
      "F",
      "A",
      "7",
      "4"
    ],
    "options": [
      {
        "key": "A",
        "text": "7"
      },
      {
        "key": "B",
        "text": "A"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "F"
      },
      {
        "key": "E",
        "text": "9"
      }
    ]
  },
  {
    "id": 3077,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 4 (Campuran Angka-Huruf) — Soal 17/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "C",
    "explanation": "Karakter patokan: 7 A 4 F 9. Karakter pada soal: 9 A 7 F. Karakter yang tidak ada adalah '4' yang berada di bawah huruf (C).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "7",
        "label": "A"
      },
      {
        "char": "A",
        "label": "B"
      },
      {
        "char": "4",
        "label": "C"
      },
      {
        "char": "F",
        "label": "D"
      },
      {
        "char": "9",
        "label": "E"
      }
    ],
    "questionChars": [
      "9",
      "A",
      "7",
      "F"
    ],
    "options": [
      {
        "key": "A",
        "text": "7"
      },
      {
        "key": "B",
        "text": "A"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "F"
      },
      {
        "key": "E",
        "text": "9"
      }
    ]
  },
  {
    "id": 3078,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 4 (Campuran Angka-Huruf) — Soal 18/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "A",
    "explanation": "Karakter patokan: 7 A 4 F 9. Karakter pada soal: F 4 9 A. Karakter yang tidak ada adalah '7' yang berada di bawah huruf (A).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "7",
        "label": "A"
      },
      {
        "char": "A",
        "label": "B"
      },
      {
        "char": "4",
        "label": "C"
      },
      {
        "char": "F",
        "label": "D"
      },
      {
        "char": "9",
        "label": "E"
      }
    ],
    "questionChars": [
      "F",
      "4",
      "9",
      "A"
    ],
    "options": [
      {
        "key": "A",
        "text": "7"
      },
      {
        "key": "B",
        "text": "A"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "F"
      },
      {
        "key": "E",
        "text": "9"
      }
    ]
  },
  {
    "id": 3079,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 4 (Campuran Angka-Huruf) — Soal 19/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "D",
    "explanation": "Karakter patokan: 7 A 4 F 9. Karakter pada soal: 9 7 A 4. Karakter yang tidak ada adalah 'F' yang berada di bawah huruf (D).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "7",
        "label": "A"
      },
      {
        "char": "A",
        "label": "B"
      },
      {
        "char": "4",
        "label": "C"
      },
      {
        "char": "F",
        "label": "D"
      },
      {
        "char": "9",
        "label": "E"
      }
    ],
    "questionChars": [
      "9",
      "7",
      "A",
      "4"
    ],
    "options": [
      {
        "key": "A",
        "text": "7"
      },
      {
        "key": "B",
        "text": "A"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "F"
      },
      {
        "key": "E",
        "text": "9"
      }
    ]
  },
  {
    "id": 3080,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 4 (Campuran Angka-Huruf) — Soal 20/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "B",
    "explanation": "Karakter patokan: 7 A 4 F 9. Karakter pada soal: F 9 7 4. Karakter yang tidak ada adalah 'A' yang berada di bawah huruf (B).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "7",
        "label": "A"
      },
      {
        "char": "A",
        "label": "B"
      },
      {
        "char": "4",
        "label": "C"
      },
      {
        "char": "F",
        "label": "D"
      },
      {
        "char": "9",
        "label": "E"
      }
    ],
    "questionChars": [
      "F",
      "9",
      "7",
      "4"
    ],
    "options": [
      {
        "key": "A",
        "text": "7"
      },
      {
        "key": "B",
        "text": "A"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "F"
      },
      {
        "key": "E",
        "text": "9"
      }
    ]
  },
  {
    "id": 3081,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 5 (Sandi Taktis Campuran) — Soal 1/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "A",
    "explanation": "Karakter patokan: 2 ★ H 6 &. Karakter pada soal: ★ H 6 &. Karakter yang tidak ada adalah '2' yang berada di bawah huruf (A).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "2",
        "label": "A"
      },
      {
        "char": "★",
        "label": "B"
      },
      {
        "char": "H",
        "label": "C"
      },
      {
        "char": "6",
        "label": "D"
      },
      {
        "char": "&",
        "label": "E"
      }
    ],
    "questionChars": [
      "★",
      "H",
      "6",
      "&"
    ],
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "★"
      },
      {
        "key": "C",
        "text": "H"
      },
      {
        "key": "D",
        "text": "6"
      },
      {
        "key": "E",
        "text": "&"
      }
    ]
  },
  {
    "id": 3082,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 5 (Sandi Taktis Campuran) — Soal 2/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "D",
    "explanation": "Karakter patokan: 2 ★ H 6 &. Karakter pada soal: 2 ★ & H. Karakter yang tidak ada adalah '6' yang berada di bawah huruf (D).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "2",
        "label": "A"
      },
      {
        "char": "★",
        "label": "B"
      },
      {
        "char": "H",
        "label": "C"
      },
      {
        "char": "6",
        "label": "D"
      },
      {
        "char": "&",
        "label": "E"
      }
    ],
    "questionChars": [
      "2",
      "★",
      "&",
      "H"
    ],
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "★"
      },
      {
        "key": "C",
        "text": "H"
      },
      {
        "key": "D",
        "text": "6"
      },
      {
        "key": "E",
        "text": "&"
      }
    ]
  },
  {
    "id": 3083,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 5 (Sandi Taktis Campuran) — Soal 3/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "B",
    "explanation": "Karakter patokan: 2 ★ H 6 &. Karakter pada soal: & H 2 6. Karakter yang tidak ada adalah '★' yang berada di bawah huruf (B).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "2",
        "label": "A"
      },
      {
        "char": "★",
        "label": "B"
      },
      {
        "char": "H",
        "label": "C"
      },
      {
        "char": "6",
        "label": "D"
      },
      {
        "char": "&",
        "label": "E"
      }
    ],
    "questionChars": [
      "&",
      "H",
      "2",
      "6"
    ],
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "★"
      },
      {
        "key": "C",
        "text": "H"
      },
      {
        "key": "D",
        "text": "6"
      },
      {
        "key": "E",
        "text": "&"
      }
    ]
  },
  {
    "id": 3084,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 5 (Sandi Taktis Campuran) — Soal 4/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "E",
    "explanation": "Karakter patokan: 2 ★ H 6 &. Karakter pada soal: H 6 2 ★. Karakter yang tidak ada adalah '&' yang berada di bawah huruf (E).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "2",
        "label": "A"
      },
      {
        "char": "★",
        "label": "B"
      },
      {
        "char": "H",
        "label": "C"
      },
      {
        "char": "6",
        "label": "D"
      },
      {
        "char": "&",
        "label": "E"
      }
    ],
    "questionChars": [
      "H",
      "6",
      "2",
      "★"
    ],
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "★"
      },
      {
        "key": "C",
        "text": "H"
      },
      {
        "key": "D",
        "text": "6"
      },
      {
        "key": "E",
        "text": "&"
      }
    ]
  },
  {
    "id": 3085,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 5 (Sandi Taktis Campuran) — Soal 5/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "C",
    "explanation": "Karakter patokan: 2 ★ H 6 &. Karakter pada soal: 2 ★ 6 &. Karakter yang tidak ada adalah 'H' yang berada di bawah huruf (C).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "2",
        "label": "A"
      },
      {
        "char": "★",
        "label": "B"
      },
      {
        "char": "H",
        "label": "C"
      },
      {
        "char": "6",
        "label": "D"
      },
      {
        "char": "&",
        "label": "E"
      }
    ],
    "questionChars": [
      "2",
      "★",
      "6",
      "&"
    ],
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "★"
      },
      {
        "key": "C",
        "text": "H"
      },
      {
        "key": "D",
        "text": "6"
      },
      {
        "key": "E",
        "text": "&"
      }
    ]
  },
  {
    "id": 3086,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 5 (Sandi Taktis Campuran) — Soal 6/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "A",
    "explanation": "Karakter patokan: 2 ★ H 6 &. Karakter pada soal: ★ 6 & H. Karakter yang tidak ada adalah '2' yang berada di bawah huruf (A).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "2",
        "label": "A"
      },
      {
        "char": "★",
        "label": "B"
      },
      {
        "char": "H",
        "label": "C"
      },
      {
        "char": "6",
        "label": "D"
      },
      {
        "char": "&",
        "label": "E"
      }
    ],
    "questionChars": [
      "★",
      "6",
      "&",
      "H"
    ],
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "★"
      },
      {
        "key": "C",
        "text": "H"
      },
      {
        "key": "D",
        "text": "6"
      },
      {
        "key": "E",
        "text": "&"
      }
    ]
  },
  {
    "id": 3087,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 5 (Sandi Taktis Campuran) — Soal 7/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "D",
    "explanation": "Karakter patokan: 2 ★ H 6 &. Karakter pada soal: 2 H ★ &. Karakter yang tidak ada adalah '6' yang berada di bawah huruf (D).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "2",
        "label": "A"
      },
      {
        "char": "★",
        "label": "B"
      },
      {
        "char": "H",
        "label": "C"
      },
      {
        "char": "6",
        "label": "D"
      },
      {
        "char": "&",
        "label": "E"
      }
    ],
    "questionChars": [
      "2",
      "H",
      "★",
      "&"
    ],
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "★"
      },
      {
        "key": "C",
        "text": "H"
      },
      {
        "key": "D",
        "text": "6"
      },
      {
        "key": "E",
        "text": "&"
      }
    ]
  },
  {
    "id": 3088,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 5 (Sandi Taktis Campuran) — Soal 8/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "B",
    "explanation": "Karakter patokan: 2 ★ H 6 &. Karakter pada soal: H 2 6 &. Karakter yang tidak ada adalah '★' yang berada di bawah huruf (B).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "2",
        "label": "A"
      },
      {
        "char": "★",
        "label": "B"
      },
      {
        "char": "H",
        "label": "C"
      },
      {
        "char": "6",
        "label": "D"
      },
      {
        "char": "&",
        "label": "E"
      }
    ],
    "questionChars": [
      "H",
      "2",
      "6",
      "&"
    ],
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "★"
      },
      {
        "key": "C",
        "text": "H"
      },
      {
        "key": "D",
        "text": "6"
      },
      {
        "key": "E",
        "text": "&"
      }
    ]
  },
  {
    "id": 3089,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 5 (Sandi Taktis Campuran) — Soal 9/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "E",
    "explanation": "Karakter patokan: 2 ★ H 6 &. Karakter pada soal: H 2 ★ 6. Karakter yang tidak ada adalah '&' yang berada di bawah huruf (E).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "2",
        "label": "A"
      },
      {
        "char": "★",
        "label": "B"
      },
      {
        "char": "H",
        "label": "C"
      },
      {
        "char": "6",
        "label": "D"
      },
      {
        "char": "&",
        "label": "E"
      }
    ],
    "questionChars": [
      "H",
      "2",
      "★",
      "6"
    ],
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "★"
      },
      {
        "key": "C",
        "text": "H"
      },
      {
        "key": "D",
        "text": "6"
      },
      {
        "key": "E",
        "text": "&"
      }
    ]
  },
  {
    "id": 3090,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 5 (Sandi Taktis Campuran) — Soal 10/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "C",
    "explanation": "Karakter patokan: 2 ★ H 6 &. Karakter pada soal: ★ 6 2 &. Karakter yang tidak ada adalah 'H' yang berada di bawah huruf (C).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "2",
        "label": "A"
      },
      {
        "char": "★",
        "label": "B"
      },
      {
        "char": "H",
        "label": "C"
      },
      {
        "char": "6",
        "label": "D"
      },
      {
        "char": "&",
        "label": "E"
      }
    ],
    "questionChars": [
      "★",
      "6",
      "2",
      "&"
    ],
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "★"
      },
      {
        "key": "C",
        "text": "H"
      },
      {
        "key": "D",
        "text": "6"
      },
      {
        "key": "E",
        "text": "&"
      }
    ]
  },
  {
    "id": 3091,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 5 (Sandi Taktis Campuran) — Soal 11/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "A",
    "explanation": "Karakter patokan: 2 ★ H 6 &. Karakter pada soal: ★ & H 6. Karakter yang tidak ada adalah '2' yang berada di bawah huruf (A).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "2",
        "label": "A"
      },
      {
        "char": "★",
        "label": "B"
      },
      {
        "char": "H",
        "label": "C"
      },
      {
        "char": "6",
        "label": "D"
      },
      {
        "char": "&",
        "label": "E"
      }
    ],
    "questionChars": [
      "★",
      "&",
      "H",
      "6"
    ],
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "★"
      },
      {
        "key": "C",
        "text": "H"
      },
      {
        "key": "D",
        "text": "6"
      },
      {
        "key": "E",
        "text": "&"
      }
    ]
  },
  {
    "id": 3092,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 5 (Sandi Taktis Campuran) — Soal 12/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "D",
    "explanation": "Karakter patokan: 2 ★ H 6 &. Karakter pada soal: H & ★ 2. Karakter yang tidak ada adalah '6' yang berada di bawah huruf (D).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "2",
        "label": "A"
      },
      {
        "char": "★",
        "label": "B"
      },
      {
        "char": "H",
        "label": "C"
      },
      {
        "char": "6",
        "label": "D"
      },
      {
        "char": "&",
        "label": "E"
      }
    ],
    "questionChars": [
      "H",
      "&",
      "★",
      "2"
    ],
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "★"
      },
      {
        "key": "C",
        "text": "H"
      },
      {
        "key": "D",
        "text": "6"
      },
      {
        "key": "E",
        "text": "&"
      }
    ]
  },
  {
    "id": 3093,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 5 (Sandi Taktis Campuran) — Soal 13/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "B",
    "explanation": "Karakter patokan: 2 ★ H 6 &. Karakter pada soal: 6 & H 2. Karakter yang tidak ada adalah '★' yang berada di bawah huruf (B).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "2",
        "label": "A"
      },
      {
        "char": "★",
        "label": "B"
      },
      {
        "char": "H",
        "label": "C"
      },
      {
        "char": "6",
        "label": "D"
      },
      {
        "char": "&",
        "label": "E"
      }
    ],
    "questionChars": [
      "6",
      "&",
      "H",
      "2"
    ],
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "★"
      },
      {
        "key": "C",
        "text": "H"
      },
      {
        "key": "D",
        "text": "6"
      },
      {
        "key": "E",
        "text": "&"
      }
    ]
  },
  {
    "id": 3094,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 5 (Sandi Taktis Campuran) — Soal 14/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "E",
    "explanation": "Karakter patokan: 2 ★ H 6 &. Karakter pada soal: ★ H 6 2. Karakter yang tidak ada adalah '&' yang berada di bawah huruf (E).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "2",
        "label": "A"
      },
      {
        "char": "★",
        "label": "B"
      },
      {
        "char": "H",
        "label": "C"
      },
      {
        "char": "6",
        "label": "D"
      },
      {
        "char": "&",
        "label": "E"
      }
    ],
    "questionChars": [
      "★",
      "H",
      "6",
      "2"
    ],
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "★"
      },
      {
        "key": "C",
        "text": "H"
      },
      {
        "key": "D",
        "text": "6"
      },
      {
        "key": "E",
        "text": "&"
      }
    ]
  },
  {
    "id": 3095,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 5 (Sandi Taktis Campuran) — Soal 15/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "C",
    "explanation": "Karakter patokan: 2 ★ H 6 &. Karakter pada soal: ★ & 2 6. Karakter yang tidak ada adalah 'H' yang berada di bawah huruf (C).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "2",
        "label": "A"
      },
      {
        "char": "★",
        "label": "B"
      },
      {
        "char": "H",
        "label": "C"
      },
      {
        "char": "6",
        "label": "D"
      },
      {
        "char": "&",
        "label": "E"
      }
    ],
    "questionChars": [
      "★",
      "&",
      "2",
      "6"
    ],
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "★"
      },
      {
        "key": "C",
        "text": "H"
      },
      {
        "key": "D",
        "text": "6"
      },
      {
        "key": "E",
        "text": "&"
      }
    ]
  },
  {
    "id": 3096,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 5 (Sandi Taktis Campuran) — Soal 16/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "A",
    "explanation": "Karakter patokan: 2 ★ H 6 &. Karakter pada soal: ★ 6 & H. Karakter yang tidak ada adalah '2' yang berada di bawah huruf (A).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "2",
        "label": "A"
      },
      {
        "char": "★",
        "label": "B"
      },
      {
        "char": "H",
        "label": "C"
      },
      {
        "char": "6",
        "label": "D"
      },
      {
        "char": "&",
        "label": "E"
      }
    ],
    "questionChars": [
      "★",
      "6",
      "&",
      "H"
    ],
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "★"
      },
      {
        "key": "C",
        "text": "H"
      },
      {
        "key": "D",
        "text": "6"
      },
      {
        "key": "E",
        "text": "&"
      }
    ]
  },
  {
    "id": 3097,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 5 (Sandi Taktis Campuran) — Soal 17/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "D",
    "explanation": "Karakter patokan: 2 ★ H 6 &. Karakter pada soal: & 2 H ★. Karakter yang tidak ada adalah '6' yang berada di bawah huruf (D).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "2",
        "label": "A"
      },
      {
        "char": "★",
        "label": "B"
      },
      {
        "char": "H",
        "label": "C"
      },
      {
        "char": "6",
        "label": "D"
      },
      {
        "char": "&",
        "label": "E"
      }
    ],
    "questionChars": [
      "&",
      "2",
      "H",
      "★"
    ],
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "★"
      },
      {
        "key": "C",
        "text": "H"
      },
      {
        "key": "D",
        "text": "6"
      },
      {
        "key": "E",
        "text": "&"
      }
    ]
  },
  {
    "id": 3098,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 5 (Sandi Taktis Campuran) — Soal 18/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "B",
    "explanation": "Karakter patokan: 2 ★ H 6 &. Karakter pada soal: 2 H 6 &. Karakter yang tidak ada adalah '★' yang berada di bawah huruf (B).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "2",
        "label": "A"
      },
      {
        "char": "★",
        "label": "B"
      },
      {
        "char": "H",
        "label": "C"
      },
      {
        "char": "6",
        "label": "D"
      },
      {
        "char": "&",
        "label": "E"
      }
    ],
    "questionChars": [
      "2",
      "H",
      "6",
      "&"
    ],
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "★"
      },
      {
        "key": "C",
        "text": "H"
      },
      {
        "key": "D",
        "text": "6"
      },
      {
        "key": "E",
        "text": "&"
      }
    ]
  },
  {
    "id": 3099,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 5 (Sandi Taktis Campuran) — Soal 19/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "E",
    "explanation": "Karakter patokan: 2 ★ H 6 &. Karakter pada soal: 2 ★ 6 H. Karakter yang tidak ada adalah '&' yang berada di bawah huruf (E).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "2",
        "label": "A"
      },
      {
        "char": "★",
        "label": "B"
      },
      {
        "char": "H",
        "label": "C"
      },
      {
        "char": "6",
        "label": "D"
      },
      {
        "char": "&",
        "label": "E"
      }
    ],
    "questionChars": [
      "2",
      "★",
      "6",
      "H"
    ],
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "★"
      },
      {
        "key": "C",
        "text": "H"
      },
      {
        "key": "D",
        "text": "6"
      },
      {
        "key": "E",
        "text": "&"
      }
    ]
  },
  {
    "id": 3100,
    "module": "Tes Psikologi — Kecermatan (Format Monokrom CAT)",
    "subtest": "KECERMATAN",
    "stem": "Kolom 5 (Sandi Taktis Campuran) — Soal 20/20: Tentukan karakter patokan yang HILANG pada deret berikut.",
    "correctKey": "C",
    "explanation": "Karakter patokan: 2 ★ H 6 &. Karakter pada soal: 6 ★ 2 &. Karakter yang tidak ada adalah 'H' yang berada di bawah huruf (C).",
    "weight": 10,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "2",
        "label": "A"
      },
      {
        "char": "★",
        "label": "B"
      },
      {
        "char": "H",
        "label": "C"
      },
      {
        "char": "6",
        "label": "D"
      },
      {
        "char": "&",
        "label": "E"
      }
    ],
    "questionChars": [
      "6",
      "★",
      "2",
      "&"
    ],
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "★"
      },
      {
        "key": "C",
        "text": "H"
      },
      {
        "key": "D",
        "text": "6"
      },
      {
        "key": "E",
        "text": "&"
      }
    ]
  }
];

/* -------------------------------------------------------------------------- */
/* 4. KUMPULAN SOAL TKK (100 Butir)                                           */
/* -------------------------------------------------------------------------- */
const QUESTIONS_TKK: SimQuestion[] = [
  {
    "id": 401,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #1] Komponen fisik komputer disebut…",
    "options": [
      {
        "key": "A",
        "text": "Hardware"
      },
      {
        "key": "B",
        "text": "Software"
      },
      {
        "key": "C",
        "text": "Brainware"
      },
      {
        "key": "D",
        "text": "Malware"
      }
    ],
    "correctKey": "A",
    "explanation": "Hardware adalah bagian fisik seperti monitor, keyboard, dan prosesor.",
    "weight": 10
  },
  {
    "id": 402,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #2] Perangkat lunak yang mengelola perangkat keras dan aplikasi adalah…",
    "options": [
      {
        "key": "A",
        "text": "Browser"
      },
      {
        "key": "B",
        "text": "Sistem operasi"
      },
      {
        "key": "C",
        "text": "Spreadsheet"
      },
      {
        "key": "D",
        "text": "Driver printer saja"
      }
    ],
    "correctKey": "B",
    "explanation": "Sistem operasi mengelola sumber daya komputer dan menyediakan antarmuka pengguna.",
    "weight": 10
  },
  {
    "id": 403,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #3] Pusat pemrosesan instruksi komputer adalah…",
    "options": [
      {
        "key": "A",
        "text": "Monitor"
      },
      {
        "key": "B",
        "text": "CPU/prosesor"
      },
      {
        "key": "C",
        "text": "Keyboard"
      },
      {
        "key": "D",
        "text": "Speaker"
      }
    ],
    "correctKey": "B",
    "explanation": "CPU menjalankan instruksi dan mengolah data.",
    "weight": 10
  },
  {
    "id": 404,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #4] RAM berfungsi sebagai…",
    "options": [
      {
        "key": "A",
        "text": "Memori kerja sementara"
      },
      {
        "key": "B",
        "text": "Penyimpanan arsip permanen"
      },
      {
        "key": "C",
        "text": "Perangkat cetak"
      },
      {
        "key": "D",
        "text": "Penghubung internet"
      }
    ],
    "correctKey": "A",
    "explanation": "RAM menyimpan data sementara yang sedang digunakan program.",
    "weight": 10
  },
  {
    "id": 405,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #5] Perangkat untuk memasukkan teks adalah…",
    "options": [
      {
        "key": "A",
        "text": "Monitor"
      },
      {
        "key": "B",
        "text": "Printer"
      },
      {
        "key": "C",
        "text": "Keyboard"
      },
      {
        "key": "D",
        "text": "Proyektor"
      }
    ],
    "correctKey": "C",
    "explanation": "Keyboard merupakan perangkat input.",
    "weight": 10
  },
  {
    "id": 406,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #6] Perangkat output visual adalah…",
    "options": [
      {
        "key": "A",
        "text": "Mouse"
      },
      {
        "key": "B",
        "text": "Monitor"
      },
      {
        "key": "C",
        "text": "Mikrofon"
      },
      {
        "key": "D",
        "text": "Scanner"
      }
    ],
    "correctKey": "B",
    "explanation": "Monitor menampilkan teks dan gambar.",
    "weight": 10
  },
  {
    "id": 407,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #7] Satuan kapasitas data digital adalah…",
    "options": [
      {
        "key": "A",
        "text": "Liter"
      },
      {
        "key": "B",
        "text": "Byte"
      },
      {
        "key": "C",
        "text": "Desibel"
      },
      {
        "key": "D",
        "text": "Ampere"
      }
    ],
    "correctKey": "B",
    "explanation": "Kapasitas digital dinyatakan dalam byte dan kelipatannya.",
    "weight": 10
  },
  {
    "id": 408,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #8] Alat untuk mengubah dokumen kertas menjadi digital adalah…",
    "options": [
      {
        "key": "A",
        "text": "Scanner"
      },
      {
        "key": "B",
        "text": "Speaker"
      },
      {
        "key": "C",
        "text": "Router"
      },
      {
        "key": "D",
        "text": "Keyboard"
      }
    ],
    "correctKey": "A",
    "explanation": "Scanner menangkap citra dokumen menjadi data digital.",
    "weight": 10
  },
  {
    "id": 409,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #9] SSD dan HDD digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Memproses suara"
      },
      {
        "key": "B",
        "text": "Menyimpan data"
      },
      {
        "key": "C",
        "text": "Menampilkan gambar"
      },
      {
        "key": "D",
        "text": "Mengatur jaringan"
      }
    ],
    "correctKey": "B",
    "explanation": "SSD dan HDD adalah media penyimpanan.",
    "weight": 10
  },
  {
    "id": 410,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #10] Salinan data untuk pemulihan saat data utama hilang disebut…",
    "options": [
      {
        "key": "A",
        "text": "Shortcut"
      },
      {
        "key": "B",
        "text": "Backup"
      },
      {
        "key": "C",
        "text": "Cache"
      },
      {
        "key": "D",
        "text": "Cookie"
      }
    ],
    "correctKey": "B",
    "explanation": "Backup adalah salinan cadangan untuk pemulihan data.",
    "weight": 10
  },
  {
    "id": 411,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #11] Perangkat lunak berbahaya disebut…",
    "options": [
      {
        "key": "A",
        "text": "Firmware"
      },
      {
        "key": "B",
        "text": "Malware"
      },
      {
        "key": "C",
        "text": "Freeware"
      },
      {
        "key": "D",
        "text": "Shareware"
      }
    ],
    "correctKey": "B",
    "explanation": "Malware dirancang merusak, mengganggu, atau mencuri data.",
    "weight": 10
  },
  {
    "id": 412,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #12] Papan utama tempat komponen komputer terhubung disebut…",
    "options": [
      {
        "key": "A",
        "text": "Motherboard"
      },
      {
        "key": "B",
        "text": "Touchpad"
      },
      {
        "key": "C",
        "text": "Heatsink"
      },
      {
        "key": "D",
        "text": "Flashdisk Windows dan pengelolaan berkas"
      }
    ],
    "correctKey": "A",
    "explanation": "Motherboard menghubungkan prosesor, RAM, penyimpanan, dan komponen lain. Windows dan pengelolaan berkas",
    "weight": 10
  },
  {
    "id": 413,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #13] Ekstensi .docx umumnya untuk dokumen…",
    "options": [
      {
        "key": "A",
        "text": "Word"
      },
      {
        "key": "B",
        "text": "Excel"
      },
      {
        "key": "C",
        "text": "PowerPoint"
      },
      {
        "key": "D",
        "text": "Audio"
      }
    ],
    "correctKey": "A",
    "explanation": ".docx adalah format dokumen Microsoft Word.",
    "weight": 10
  },
  {
    "id": 414,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #14] Ekstensi .xlsx digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Presentasi"
      },
      {
        "key": "B",
        "text": "Workbook Excel"
      },
      {
        "key": "C",
        "text": "Gambar"
      },
      {
        "key": "D",
        "text": "Video"
      }
    ],
    "correctKey": "B",
    "explanation": ".xlsx merupakan format buku kerja Excel.",
    "weight": 10
  },
  {
    "id": 415,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #15] Ekstensi .pptx digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Basis data"
      },
      {
        "key": "B",
        "text": "Presentasi PowerPoint"
      },
      {
        "key": "C",
        "text": "Teks biasa"
      },
      {
        "key": "D",
        "text": "Audio"
      }
    ],
    "correctKey": "B",
    "explanation": ".pptx adalah format presentasi PowerPoint.",
    "weight": 10
  },
  {
    "id": 416,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #16] Ctrl+C berfungsi untuk…",
    "options": [
      {
        "key": "A",
        "text": "Memotong"
      },
      {
        "key": "B",
        "text": "Menyalin"
      },
      {
        "key": "C",
        "text": "Menempel"
      },
      {
        "key": "D",
        "text": "Mencetak"
      }
    ],
    "correctKey": "B",
    "explanation": "Ctrl+C menyalin pilihan ke clipboard.",
    "weight": 10
  },
  {
    "id": 417,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #17] Ctrl+V berfungsi untuk…",
    "options": [
      {
        "key": "A",
        "text": "Undo"
      },
      {
        "key": "B",
        "text": "Paste/menempel"
      },
      {
        "key": "C",
        "text": "Menyimpan"
      },
      {
        "key": "D",
        "text": "Mencari"
      }
    ],
    "correctKey": "B",
    "explanation": "Ctrl+V menempelkan isi clipboard.",
    "weight": 10
  },
  {
    "id": 418,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #18] Ctrl+Z umumnya berfungsi untuk…",
    "options": [
      {
        "key": "A",
        "text": "Undo"
      },
      {
        "key": "B",
        "text": "Print"
      },
      {
        "key": "C",
        "text": "Save"
      },
      {
        "key": "D",
        "text": "Refresh"
      }
    ],
    "correctKey": "A",
    "explanation": "Undo membatalkan tindakan terakhir yang dapat dibatalkan.",
    "weight": 10
  },
  {
    "id": 419,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #19] Folder digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Mengelompokkan berkas"
      },
      {
        "key": "B",
        "text": "Mempercepat CPU"
      },
      {
        "key": "C",
        "text": "Mengganti OS"
      },
      {
        "key": "D",
        "text": "Menghapus virus"
      }
    ],
    "correctKey": "A",
    "explanation": "Folder membantu mengatur berkas agar mudah ditemukan.",
    "weight": 10
  },
  {
    "id": 420,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #20] Recycle Bin menampung…",
    "options": [
      {
        "key": "A",
        "text": "Berkas terhapus sementara"
      },
      {
        "key": "B",
        "text": "Kata sandi"
      },
      {
        "key": "C",
        "text": "Pembaruan BIOS"
      },
      {
        "key": "D",
        "text": "Driver"
      }
    ],
    "correctKey": "A",
    "explanation": "Berkas yang dihapus secara biasa dapat dipulihkan dari Recycle Bin sebelum dikosongkan.",
    "weight": 10
  },
  {
    "id": 421,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #21] Untuk menemukan berkas, gunakan…",
    "options": [
      {
        "key": "A",
        "text": "Kotak pencarian File Explorer"
      },
      {
        "key": "B",
        "text": "Tombol volume"
      },
      {
        "key": "C",
        "text": "Jam sistem"
      },
      {
        "key": "D",
        "text": "Task Manager saja"
      }
    ],
    "correctKey": "A",
    "explanation": "Pencarian File Explorer menemukan berkas berdasarkan nama atau kriteria.",
    "weight": 10
  },
  {
    "id": 422,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #22] Rename berarti…",
    "options": [
      {
        "key": "A",
        "text": "Mengganti nama"
      },
      {
        "key": "B",
        "text": "Menghapus permanen"
      },
      {
        "key": "C",
        "text": "Mengirim email"
      },
      {
        "key": "D",
        "text": "Mengompres"
      }
    ],
    "correctKey": "A",
    "explanation": "Rename mengubah nama berkas atau folder.",
    "weight": 10
  },
  {
    "id": 423,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #23] Ctrl+S biasanya digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Menyimpan"
      },
      {
        "key": "B",
        "text": "Mencetak"
      },
      {
        "key": "C",
        "text": "Menutup aplikasi"
      },
      {
        "key": "D",
        "text": "Memilih semua"
      }
    ],
    "correctKey": "A",
    "explanation": "Ctrl+S menyimpan perubahan pada dokumen.",
    "weight": 10
  },
  {
    "id": 424,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #24] Ekstensi .pdf lazim digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Dokumen dengan tata letak tetap"
      },
      {
        "key": "B",
        "text": "File program Windows"
      },
      {
        "key": "C",
        "text": "File audio mentah"
      },
      {
        "key": "D",
        "text": "Database relasional Microsoft Word"
      }
    ],
    "correctKey": "A",
    "explanation": "PDF mempertahankan tata letak dokumen lintas perangkat relatif konsisten. Microsoft Word",
    "weight": 10
  },
  {
    "id": 425,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #25] Microsoft Word terutama untuk…",
    "options": [
      {
        "key": "A",
        "text": "Mengolah dokumen teks"
      },
      {
        "key": "B",
        "text": "Mengolah spreadsheet"
      },
      {
        "key": "C",
        "text": "Mengedit video"
      },
      {
        "key": "D",
        "text": "Mengatur router"
      }
    ],
    "correctKey": "A",
    "explanation": "Word adalah aplikasi pengolah kata.",
    "weight": 10
  },
  {
    "id": 426,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #26] Ctrl+B digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Bold/tebal"
      },
      {
        "key": "B",
        "text": "Italic"
      },
      {
        "key": "C",
        "text": "Underline"
      },
      {
        "key": "D",
        "text": "Paste"
      }
    ],
    "correctKey": "A",
    "explanation": "Ctrl+B mengaktifkan format tebal.",
    "weight": 10
  },
  {
    "id": 427,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #27] Ctrl+I digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Underline"
      },
      {
        "key": "B",
        "text": "Italic/miring"
      },
      {
        "key": "C",
        "text": "Print"
      },
      {
        "key": "D",
        "text": "Find"
      }
    ],
    "correctKey": "B",
    "explanation": "Ctrl+I mengaktifkan format miring.",
    "weight": 10
  },
  {
    "id": 428,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #28] Ctrl+U digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Menggarisbawahi"
      },
      {
        "key": "B",
        "text": "Menghapus"
      },
      {
        "key": "C",
        "text": "Membuka"
      },
      {
        "key": "D",
        "text": "Menyisipkan gambar"
      }
    ],
    "correctKey": "A",
    "explanation": "Ctrl+U mengaktifkan garis bawah.",
    "weight": 10
  },
  {
    "id": 429,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #29] Ctrl+J pada Word menerapkan…",
    "options": [
      {
        "key": "A",
        "text": "Rata kiri"
      },
      {
        "key": "B",
        "text": "Rata tengah"
      },
      {
        "key": "C",
        "text": "Rata kiri-kanan"
      },
      {
        "key": "D",
        "text": "Rata kanan"
      }
    ],
    "correctKey": "C",
    "explanation": "Ctrl+J membuat paragraf rata kiri dan kanan.",
    "weight": 10
  },
  {
    "id": 430,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #30] Header berada di bagian…",
    "options": [
      {
        "key": "A",
        "text": "Atas halaman"
      },
      {
        "key": "B",
        "text": "Bawah halaman"
      },
      {
        "key": "C",
        "text": "Tengah tabel"
      },
      {
        "key": "D",
        "text": "Nama file"
      }
    ],
    "correctKey": "A",
    "explanation": "Header adalah area kepala halaman.",
    "weight": 10
  },
  {
    "id": 431,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #31] Footer berada di bagian…",
    "options": [
      {
        "key": "A",
        "text": "Atas halaman"
      },
      {
        "key": "B",
        "text": "Bawah halaman"
      },
      {
        "key": "C",
        "text": "Taskbar"
      },
      {
        "key": "D",
        "text": "Judul dokumen"
      }
    ],
    "correctKey": "B",
    "explanation": "Footer adalah area kaki halaman.",
    "weight": 10
  },
  {
    "id": 432,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #32] Fitur Numbering digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Daftar bernomor"
      },
      {
        "key": "B",
        "text": "Menyisipkan video"
      },
      {
        "key": "C",
        "text": "Membuat rumus"
      },
      {
        "key": "D",
        "text": "Mengunci file"
      }
    ],
    "correctKey": "A",
    "explanation": "Numbering membuat urutan nomor otomatis.",
    "weight": 10
  },
  {
    "id": 433,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #33] Find digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Mencari teks"
      },
      {
        "key": "B",
        "text": "Mengubah orientasi"
      },
      {
        "key": "C",
        "text": "Membuat grafik"
      },
      {
        "key": "D",
        "text": "Mengirim email"
      }
    ],
    "correctKey": "A",
    "explanation": "Find mencari kata atau frasa dalam dokumen.",
    "weight": 10
  },
  {
    "id": 434,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #34] Mail Merge bermanfaat untuk…",
    "options": [
      {
        "key": "A",
        "text": "Membuat banyak surat personal dari templat dan sumber data"
      },
      {
        "key": "B",
        "text": "Menggabungkan komputer"
      },
      {
        "key": "C",
        "text": "Menghapus email"
      },
      {
        "key": "D",
        "text": "Membuat formula"
      }
    ],
    "correctKey": "A",
    "explanation": "Mail Merge menggabungkan dokumen utama dengan data penerima.",
    "weight": 10
  },
  {
    "id": 435,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #35] Save As digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Menyimpan dengan nama/lokasi/format lain"
      },
      {
        "key": "B",
        "text": "Menutup tanpa simpan"
      },
      {
        "key": "C",
        "text": "Menghapus halaman"
      },
      {
        "key": "D",
        "text": "Mencetak"
      }
    ],
    "correctKey": "A",
    "explanation": "Save As menyimpan dokumen sebagai file baru atau format berbeda.",
    "weight": 10
  },
  {
    "id": 436,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #36] Orientasi halaman mendatar disebut…",
    "options": [
      {
        "key": "A",
        "text": "Portrait"
      },
      {
        "key": "B",
        "text": "Landscape"
      },
      {
        "key": "C",
        "text": "Narrow"
      },
      {
        "key": "D",
        "text": "Justify"
      }
    ],
    "correctKey": "B",
    "explanation": "Landscape menempatkan sisi lebar halaman secara horizontal.",
    "weight": 10
  },
  {
    "id": 437,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #37] Track Changes digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Melacak perubahan dokumen"
      },
      {
        "key": "B",
        "text": "Membuat animasi"
      },
      {
        "key": "C",
        "text": "Menghitung sel"
      },
      {
        "key": "D",
        "text": "Mengirim pesan"
      }
    ],
    "correctKey": "A",
    "explanation": "Track Changes merekam penambahan dan penghapusan saat peninjauan.",
    "weight": 10
  },
  {
    "id": 438,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #38] Nomor halaman disisipkan melalui…",
    "options": [
      {
        "key": "A",
        "text": "Insert > Page Number"
      },
      {
        "key": "B",
        "text": "Review > Spelling"
      },
      {
        "key": "C",
        "text": "View > Zoom"
      },
      {
        "key": "D",
        "text": "Home > Clipboard"
      }
    ],
    "correctKey": "A",
    "explanation": "Page Number berada pada menu Insert.",
    "weight": 10
  },
  {
    "id": 439,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #39] Format PDF berguna untuk…",
    "options": [
      {
        "key": "A",
        "text": "Mempertahankan tata letak saat dibagikan"
      },
      {
        "key": "B",
        "text": "Menjamin file bebas virus"
      },
      {
        "key": "C",
        "text": "Mencegah semua penyalinan"
      },
      {
        "key": "D",
        "text": "Selalu memperkecil file Microsoft Excel"
      }
    ],
    "correctKey": "A",
    "explanation": "PDF membantu menjaga tampilan dokumen, tetapi tidak menjamin keamanan atau ukuran kecil. Microsoft Excel",
    "weight": 10
  },
  {
    "id": 440,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #40] Excel terutama digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Spreadsheet dan perhitungan"
      },
      {
        "key": "B",
        "text": "Mengedit audio"
      },
      {
        "key": "C",
        "text": "Membuat OS"
      },
      {
        "key": "D",
        "text": "Mengelola perangkat"
      }
    ],
    "correctKey": "A",
    "explanation": "Excel mengolah data tabular, formula, analisis, dan grafik.",
    "weight": 10
  },
  {
    "id": 441,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #41] Pertemuan baris dan kolom disebut…",
    "options": [
      {
        "key": "A",
        "text": "Slide"
      },
      {
        "key": "B",
        "text": "Sel/cell"
      },
      {
        "key": "C",
        "text": "Folder"
      },
      {
        "key": "D",
        "text": "Layer"
      }
    ],
    "correctKey": "B",
    "explanation": "Sel adalah unit dasar worksheet, misalnya A1.",
    "weight": 10
  },
  {
    "id": 442,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #42] Alamat kolom B baris 5 adalah…",
    "options": [
      {
        "key": "A",
        "text": "5B"
      },
      {
        "key": "B",
        "text": "B5"
      },
      {
        "key": "C",
        "text": "BB5"
      },
      {
        "key": "D",
        "text": "B-5"
      }
    ],
    "correctKey": "B",
    "explanation": "Alamat sel ditulis huruf kolom lalu nomor baris.",
    "weight": 10
  },
  {
    "id": 443,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #43] Formula Excel umumnya diawali…",
    "options": [
      {
        "key": "A",
        "text": "#"
      },
      {
        "key": "B",
        "text": "="
      },
      {
        "key": "C",
        "text": "&"
      },
      {
        "key": "D",
        "text": "@"
      }
    ],
    "correctKey": "B",
    "explanation": "Tanda sama dengan menandai formula.",
    "weight": 10
  },
  {
    "id": 444,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #44] SUM digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Menjumlahkan"
      },
      {
        "key": "B",
        "text": "Mencari minimum"
      },
      {
        "key": "C",
        "text": "Menghitung karakter"
      },
      {
        "key": "D",
        "text": "Kapitalisasi"
      }
    ],
    "correctKey": "A",
    "explanation": "SUM menjumlahkan nilai dalam rentang.",
    "weight": 10
  },
  {
    "id": 445,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #45] AVERAGE(A1:A5) menghitung…",
    "options": [
      {
        "key": "A",
        "text": "Total"
      },
      {
        "key": "B",
        "text": "Rata-rata"
      },
      {
        "key": "C",
        "text": "Nilai tertinggi"
      },
      {
        "key": "D",
        "text": "Sel kosong"
      }
    ],
    "correctKey": "B",
    "explanation": "AVERAGE menghitung rata-rata aritmetika.",
    "weight": 10
  },
  {
    "id": 446,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #46] MAX menghasilkan…",
    "options": [
      {
        "key": "A",
        "text": "Nilai terbesar"
      },
      {
        "key": "B",
        "text": "Nilai terkecil"
      },
      {
        "key": "C",
        "text": "Median"
      },
      {
        "key": "D",
        "text": "Jumlah teks"
      }
    ],
    "correctKey": "A",
    "explanation": "MAX mencari angka terbesar.",
    "weight": 10
  },
  {
    "id": 447,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #47] MIN menghasilkan…",
    "options": [
      {
        "key": "A",
        "text": "Nilai terbesar"
      },
      {
        "key": "B",
        "text": "Nilai terkecil"
      },
      {
        "key": "C",
        "text": "Rata-rata"
      },
      {
        "key": "D",
        "text": "Jumlah data"
      }
    ],
    "correctKey": "B",
    "explanation": "MIN mencari angka terkecil.",
    "weight": 10
  },
  {
    "id": 448,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #48] COUNT menghitung…",
    "options": [
      {
        "key": "A",
        "text": "Sel berisi angka"
      },
      {
        "key": "B",
        "text": "Sel berwarna"
      },
      {
        "key": "C",
        "text": "Jumlah sheet"
      },
      {
        "key": "D",
        "text": "Huruf"
      }
    ],
    "correctKey": "A",
    "explanation": "COUNT menghitung banyak sel yang berisi angka.",
    "weight": 10
  },
  {
    "id": 449,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #49] COUNTA menghitung…",
    "options": [
      {
        "key": "A",
        "text": "Sel tidak kosong"
      },
      {
        "key": "B",
        "text": "Hanya angka"
      },
      {
        "key": "C",
        "text": "Sel nol saja"
      },
      {
        "key": "D",
        "text": "Kolom tersembunyi"
      }
    ],
    "correctKey": "A",
    "explanation": "COUNTA menghitung sel yang berisi data apa pun.",
    "weight": 10
  },
  {
    "id": 450,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #50] IF digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Uji logika bersyarat"
      },
      {
        "key": "B",
        "text": "Menjumlahkan"
      },
      {
        "key": "C",
        "text": "Mengurutkan"
      },
      {
        "key": "D",
        "text": "Mengunci workbook"
      }
    ],
    "correctKey": "A",
    "explanation": "IF menghasilkan nilai berdasarkan kondisi benar atau salah.",
    "weight": 10
  },
  {
    "id": 451,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #51] Jika A1=80, hasil =IF(A1>=75,\"Lulus\",\"Belum\") adalah…",
    "options": [
      {
        "key": "A",
        "text": "Belum"
      },
      {
        "key": "B",
        "text": "Lulus"
      },
      {
        "key": "C",
        "text": "80"
      },
      {
        "key": "D",
        "text": "Error"
      }
    ],
    "correctKey": "B",
    "explanation": "80 memenuhi kondisi lebih besar atau sama dengan 75.",
    "weight": 10
  },
  {
    "id": 452,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #52] A1:A10 menunjukkan…",
    "options": [
      {
        "key": "A",
        "text": "Rentang sel A1 sampai A10"
      },
      {
        "key": "B",
        "text": "Pembagian"
      },
      {
        "key": "C",
        "text": "Nama sheet"
      },
      {
        "key": "D",
        "text": "Komentar"
      }
    ],
    "correctKey": "A",
    "explanation": "Titik dua menyatakan rentang sel berurutan.",
    "weight": 10
  },
  {
    "id": 453,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #53] Sort digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Mengurutkan data"
      },
      {
        "key": "B",
        "text": "Menyisipkan gambar"
      },
      {
        "key": "C",
        "text": "Mengunci rumus"
      },
      {
        "key": "D",
        "text": "Menghapus workbook"
      }
    ],
    "correctKey": "A",
    "explanation": "Sort mengurutkan data menurut kriteria.",
    "weight": 10
  },
  {
    "id": 454,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #54] Filter digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Menampilkan data sesuai kriteria"
      },
      {
        "key": "B",
        "text": "Mengubah Excel ke Word"
      },
      {
        "key": "C",
        "text": "Menghapus semua baris"
      },
      {
        "key": "D",
        "text": "Mengganti nama file"
      }
    ],
    "correctKey": "A",
    "explanation": "Filter menyaring tampilan baris tanpa harus menghapus data.",
    "weight": 10
  },
  {
    "id": 455,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #55] Referensi absolut menggunakan tanda…",
    "options": [
      {
        "key": "A",
        "text": "$"
      },
      {
        "key": "B",
        "text": "%"
      },
      {
        "key": "C",
        "text": "!"
      },
      {
        "key": "D",
        "text": "?"
      }
    ],
    "correctKey": "A",
    "explanation": "Contoh $A$1 mengunci kolom dan baris saat formula disalin.",
    "weight": 10
  },
  {
    "id": 456,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #56] Formula =A1+B1 disalin satu baris ke bawah menjadi…",
    "options": [
      {
        "key": "A",
        "text": "=A1+B1"
      },
      {
        "key": "B",
        "text": "=A2+B2"
      },
      {
        "key": "C",
        "text": "=$A$1+$B$1"
      },
      {
        "key": "D",
        "text": "=B1+C1"
      }
    ],
    "correctKey": "B",
    "explanation": "Referensi relatif bergeser satu baris.",
    "weight": 10
  },
  {
    "id": 457,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #57] Freeze Panes berguna untuk…",
    "options": [
      {
        "key": "A",
        "text": "Mempertahankan baris/kolom terlihat saat scroll"
      },
      {
        "key": "B",
        "text": "Mengunci PC"
      },
      {
        "key": "C",
        "text": "Membekukan perhitungan"
      },
      {
        "key": "D",
        "text": "Menghapus sheet"
      }
    ],
    "correctKey": "A",
    "explanation": "Freeze Panes mempertahankan tampilan bagian worksheet.",
    "weight": 10
  },
  {
    "id": 458,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #58] Grafik dibuat melalui fitur…",
    "options": [
      {
        "key": "A",
        "text": "Insert Chart"
      },
      {
        "key": "B",
        "text": "Mail Merge"
      },
      {
        "key": "C",
        "text": "Track Changes"
      },
      {
        "key": "D",
        "text": "Page Number"
      }
    ],
    "correctKey": "A",
    "explanation": "Chart menyajikan data secara visual.",
    "weight": 10
  },
  {
    "id": 459,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #59] Error #DIV/0! muncul ketika…",
    "options": [
      {
        "key": "A",
        "text": "Membagi dengan nol atau penyebut kosong"
      },
      {
        "key": "B",
        "text": "File besar"
      },
      {
        "key": "C",
        "text": "Printer mati"
      },
      {
        "key": "D",
        "text": "Font hilang PowerPoint"
      }
    ],
    "correctKey": "A",
    "explanation": "Excel menampilkan #DIV/0! saat penyebut operasi pembagian nol/kosong. PowerPoint",
    "weight": 10
  },
  {
    "id": 460,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #60] PowerPoint digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Membuat presentasi"
      },
      {
        "key": "B",
        "text": "Menghitung formula"
      },
      {
        "key": "C",
        "text": "Mengelola email"
      },
      {
        "key": "D",
        "text": "Memindai"
      }
    ],
    "correctKey": "A",
    "explanation": "PowerPoint adalah aplikasi presentasi berbasis slide.",
    "weight": 10
  },
  {
    "id": 461,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #61] Satu halaman presentasi disebut…",
    "options": [
      {
        "key": "A",
        "text": "Cell"
      },
      {
        "key": "B",
        "text": "Slide"
      },
      {
        "key": "C",
        "text": "Sheet"
      },
      {
        "key": "D",
        "text": "Folder"
      }
    ],
    "correctKey": "B",
    "explanation": "Slide adalah unit halaman presentasi.",
    "weight": 10
  },
  {
    "id": 462,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #62] F5 umumnya memulai presentasi…",
    "options": [
      {
        "key": "A",
        "text": "Dari awal"
      },
      {
        "key": "B",
        "text": "Dari slide terakhir"
      },
      {
        "key": "C",
        "text": "Menyimpan"
      },
      {
        "key": "D",
        "text": "Mencetak"
      }
    ],
    "correctKey": "A",
    "explanation": "F5 memulai Slide Show dari slide pertama.",
    "weight": 10
  },
  {
    "id": 463,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #63] Ctrl+M digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Menambah slide"
      },
      {
        "key": "B",
        "text": "Mencetak"
      },
      {
        "key": "C",
        "text": "Mencari"
      },
      {
        "key": "D",
        "text": "Menutup"
      }
    ],
    "correctKey": "A",
    "explanation": "Ctrl+M menambahkan slide baru.",
    "weight": 10
  },
  {
    "id": 464,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #64] Transition mengatur…",
    "options": [
      {
        "key": "A",
        "text": "Efek perpindahan antar-slide"
      },
      {
        "key": "B",
        "text": "Animasi objek saja"
      },
      {
        "key": "C",
        "text": "Formula"
      },
      {
        "key": "D",
        "text": "Email"
      }
    ],
    "correctKey": "A",
    "explanation": "Transition adalah efek saat berpindah slide.",
    "weight": 10
  },
  {
    "id": 465,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #65] Animation diterapkan pada…",
    "options": [
      {
        "key": "A",
        "text": "Objek dalam slide"
      },
      {
        "key": "B",
        "text": "Nama folder"
      },
      {
        "key": "C",
        "text": "OS"
      },
      {
        "key": "D",
        "text": "Jaringan"
      }
    ],
    "correctKey": "A",
    "explanation": "Animation mengatur gerak/kemunculan objek di slide.",
    "weight": 10
  },
  {
    "id": 466,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #66] Slide yang efektif sebaiknya…",
    "options": [
      {
        "key": "A",
        "text": "Penuh teks kecil"
      },
      {
        "key": "B",
        "text": "Ringkas, terbaca, konsisten"
      },
      {
        "key": "C",
        "text": "Banyak font acak"
      },
      {
        "key": "D",
        "text": "Kontras rendah"
      }
    ],
    "correctKey": "B",
    "explanation": "Slide efektif menyampaikan pesan utama secara jelas.",
    "weight": 10
  },
  {
    "id": 467,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #67] Presenter View membantu penyaji melihat…",
    "options": [
      {
        "key": "A",
        "text": "Catatan dan kontrol presentasi"
      },
      {
        "key": "B",
        "text": "Hapus slide otomatis"
      },
      {
        "key": "C",
        "text": "Edit video"
      },
      {
        "key": "D",
        "text": "Kunci keyboard"
      }
    ],
    "correctKey": "A",
    "explanation": "Presenter View dapat menampilkan catatan dan slide berikutnya pada layar penyaji.",
    "weight": 10
  },
  {
    "id": 468,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #68] Ekspor presentasi menjadi PDF dilakukan melalui…",
    "options": [
      {
        "key": "A",
        "text": "Export/Save As PDF"
      },
      {
        "key": "B",
        "text": "Sort"
      },
      {
        "key": "C",
        "text": "Freeze Panes"
      },
      {
        "key": "D",
        "text": "Mail Merge"
      }
    ],
    "correctKey": "A",
    "explanation": "PowerPoint menyediakan opsi ekspor atau simpan ke PDF.",
    "weight": 10
  },
  {
    "id": 469,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #69] Theme digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Konsistensi desain visual"
      },
      {
        "key": "B",
        "text": "Menghapus gambar"
      },
      {
        "key": "C",
        "text": "Menghitung data"
      },
      {
        "key": "D",
        "text": "Mengirim ke semua kontak Internet dan email"
      }
    ],
    "correctKey": "A",
    "explanation": "Theme menerapkan kombinasi warna, font, dan efek. Internet dan email",
    "weight": 10
  },
  {
    "id": 470,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #70] Aplikasi untuk menjelajahi situs web disebut…",
    "options": [
      {
        "key": "A",
        "text": "Browser"
      },
      {
        "key": "B",
        "text": "Compiler"
      },
      {
        "key": "C",
        "text": "Spreadsheet"
      },
      {
        "key": "D",
        "text": "Antivirus"
      }
    ],
    "correctKey": "A",
    "explanation": "Browser membuka dan menampilkan halaman web.",
    "weight": 10
  },
  {
    "id": 471,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #71] Alamat sumber daya internet disebut…",
    "options": [
      {
        "key": "A",
        "text": "URL"
      },
      {
        "key": "B",
        "text": "CPU"
      },
      {
        "key": "C",
        "text": "RAM"
      },
      {
        "key": "D",
        "text": "USB"
      }
    ],
    "correctKey": "A",
    "explanation": "URL menunjukkan alamat sumber daya di internet.",
    "weight": 10
  },
  {
    "id": 472,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #72] HTTPS menunjukkan…",
    "options": [
      {
        "key": "A",
        "text": "Koneksi HTTP terenkripsi TLS"
      },
      {
        "key": "B",
        "text": "Situs pasti resmi"
      },
      {
        "key": "C",
        "text": "Informasi selalu benar"
      },
      {
        "key": "D",
        "text": "Bebas malware"
      }
    ],
    "correctKey": "A",
    "explanation": "HTTPS mengenkripsi komunikasi, tetapi tidak menjamin situs tepercaya.",
    "weight": 10
  },
  {
    "id": 473,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #73] Mesin pencari berguna untuk…",
    "options": [
      {
        "key": "A",
        "text": "Menemukan informasi berdasarkan kata kunci"
      },
      {
        "key": "B",
        "text": "Menambah RAM"
      },
      {
        "key": "C",
        "text": "Menghapus OS"
      },
      {
        "key": "D",
        "text": "Mencetak"
      }
    ],
    "correctKey": "A",
    "explanation": "Search engine membantu menemukan halaman web.",
    "weight": 10
  },
  {
    "id": 474,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #74] BCC pada email digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Salinan tersembunyi penerima"
      },
      {
        "key": "B",
        "text": "Menampilkan semua penerima"
      },
      {
        "key": "C",
        "text": "Melampirkan file"
      },
      {
        "key": "D",
        "text": "Menghapus subjek"
      }
    ],
    "correctKey": "A",
    "explanation": "Alamat BCC tidak terlihat oleh penerima lain pada umumnya.",
    "weight": 10
  },
  {
    "id": 475,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #75] Lampiran email disebut…",
    "options": [
      {
        "key": "A",
        "text": "Attachment"
      },
      {
        "key": "B",
        "text": "Bookmark"
      },
      {
        "key": "C",
        "text": "Cookie"
      },
      {
        "key": "D",
        "text": "Cache"
      }
    ],
    "correctKey": "A",
    "explanation": "Attachment adalah file yang disertakan dalam pesan.",
    "weight": 10
  },
  {
    "id": 476,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #76] Email kedinasan yang baik seharusnya…",
    "options": [
      {
        "key": "A",
        "text": "Subjek jelas, bahasa profesional, periksa penerima/lampiran"
      },
      {
        "key": "B",
        "text": "Huruf kapital semua"
      },
      {
        "key": "C",
        "text": "Kirim data rahasia ke sembarang alamat"
      },
      {
        "key": "D",
        "text": "Teruskan tanpa membaca"
      }
    ],
    "correctKey": "A",
    "explanation": "Email profesional harus jelas, sopan, tepat sasaran, dan aman.",
    "weight": 10
  },
  {
    "id": 477,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #77] Cloud storage adalah…",
    "options": [
      {
        "key": "A",
        "text": "Penyimpanan data melalui internet"
      },
      {
        "key": "B",
        "text": "Pendingin CPU"
      },
      {
        "key": "C",
        "text": "Printer tanpa tinta"
      },
      {
        "key": "D",
        "text": "Penghapus akun"
      }
    ],
    "correctKey": "A",
    "explanation": "Cloud storage menyimpan data pada server yang dapat diakses sesuai izin.",
    "weight": 10
  },
  {
    "id": 478,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #78] Berbagi dokumen cloud paling aman dengan…",
    "options": [
      {
        "key": "A",
        "text": "Akses seperlunya"
      },
      {
        "key": "B",
        "text": "Semua orang editor"
      },
      {
        "key": "C",
        "text": "Tautan publik untuk rahasia"
      },
      {
        "key": "D",
        "text": "Satu password bersama"
      }
    ],
    "correctKey": "A",
    "explanation": "Prinsip least privilege membatasi akses sesuai kebutuhan.",
    "weight": 10
  },
  {
    "id": 479,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #79] Informasi internet sebaiknya…",
    "options": [
      {
        "key": "A",
        "text": "Langsung dipercaya"
      },
      {
        "key": "B",
        "text": "Diverifikasi melalui sumber tepercaya"
      },
      {
        "key": "C",
        "text": "Disebar tanpa baca"
      },
      {
        "key": "D",
        "text": "Tidak perlu cek tanggal Keamanan informasi"
      }
    ],
    "correctKey": "B",
    "explanation": "Periksa sumber, tanggal, konteks, dan bukti. Keamanan informasi",
    "weight": 10
  },
  {
    "id": 480,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #80] Phishing adalah…",
    "options": [
      {
        "key": "A",
        "text": "Penipuan untuk memperoleh data sensitif"
      },
      {
        "key": "B",
        "text": "Mempercepat jaringan"
      },
      {
        "key": "C",
        "text": "Membersihkan keyboard"
      },
      {
        "key": "D",
        "text": "Backup"
      }
    ],
    "correctKey": "A",
    "explanation": "Phishing menyamar sebagai pihak tepercaya untuk mencuri informasi.",
    "weight": 10
  },
  {
    "id": 481,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #81] Kata sandi kuat sebaiknya…",
    "options": [
      {
        "key": "A",
        "text": "Panjang, unik, sulit ditebak"
      },
      {
        "key": "B",
        "text": "Nama dan tanggal lahir"
      },
      {
        "key": "C",
        "text": "Sama untuk semua akun"
      },
      {
        "key": "D",
        "text": "Dibagikan ke tim"
      }
    ],
    "correctKey": "A",
    "explanation": "Password unik dan panjang mengurangi risiko pembobolan.",
    "weight": 10
  },
  {
    "id": 482,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #82] MFA berarti…",
    "options": [
      {
        "key": "A",
        "text": "Lebih dari satu faktor verifikasi"
      },
      {
        "key": "B",
        "text": "Dua username sama"
      },
      {
        "key": "C",
        "text": "Dua browser"
      },
      {
        "key": "D",
        "text": "Dua monitor"
      }
    ],
    "correctKey": "A",
    "explanation": "MFA menambahkan faktor autentikasi selain password.",
    "weight": 10
  },
  {
    "id": 483,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #83] Lampiran email mencurigakan sebaiknya…",
    "options": [
      {
        "key": "A",
        "text": "Dibuka"
      },
      {
        "key": "B",
        "text": "Jangan dibuka; verifikasi pengirim dan laporkan"
      },
      {
        "key": "C",
        "text": "Diteruskan ke semua"
      },
      {
        "key": "D",
        "text": "Matikan antivirus"
      }
    ],
    "correctKey": "B",
    "explanation": "Lampiran dapat membawa malware; verifikasi dan laporkan.",
    "weight": 10
  },
  {
    "id": 484,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #84] Malware adalah…",
    "options": [
      {
        "key": "A",
        "text": "Perangkat lunak berbahaya"
      },
      {
        "key": "B",
        "text": "Spreadsheet"
      },
      {
        "key": "C",
        "text": "Perangkat penyimpanan"
      },
      {
        "key": "D",
        "text": "Kabel"
      }
    ],
    "correctKey": "A",
    "explanation": "Malware dirancang merusak, mengganggu, atau mencuri data.",
    "weight": 10
  },
  {
    "id": 485,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #85] Ransomware umumnya…",
    "options": [
      {
        "key": "A",
        "text": "Mengunci/mengenkripsi data dan meminta tebusan"
      },
      {
        "key": "B",
        "text": "Menambah storage"
      },
      {
        "key": "C",
        "text": "Membuat slide"
      },
      {
        "key": "D",
        "text": "Membersihkan cache"
      }
    ],
    "correctKey": "A",
    "explanation": "Ransomware menahan akses data atau sistem untuk meminta pembayaran.",
    "weight": 10
  },
  {
    "id": 486,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #86] Saat memakai Wi-Fi publik…",
    "options": [
      {
        "key": "A",
        "text": "Hindari aktivitas sensitif bila tak perlu; gunakan kanal aman"
      },
      {
        "key": "B",
        "text": "Matikan keamanan"
      },
      {
        "key": "C",
        "text": "Kirim password terbuka"
      },
      {
        "key": "D",
        "text": "Abaikan peringatan"
      }
    ],
    "correctKey": "A",
    "explanation": "Jaringan publik berisiko; lindungi koneksi dan hindari akses sensitif.",
    "weight": 10
  },
  {
    "id": 487,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #87] Data kedinasan seharusnya…",
    "options": [
      {
        "key": "A",
        "text": "Dibagikan sesuai kewenangan dan kebutuhan"
      },
      {
        "key": "B",
        "text": "Diunggah ke media sosial"
      },
      {
        "key": "C",
        "text": "Disimpan di PC umum"
      },
      {
        "key": "D",
        "text": "Dikirim ke siapa pun"
      }
    ],
    "correctKey": "A",
    "explanation": "Akses data harus dibatasi sesuai kebutuhan dan kewenangan.",
    "weight": 10
  },
  {
    "id": 488,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #88] Pembaruan sistem penting karena…",
    "options": [
      {
        "key": "A",
        "text": "Menutup celah keamanan dan memperbaiki bug"
      },
      {
        "key": "B",
        "text": "Menghapus semua file"
      },
      {
        "key": "C",
        "text": "Menjamin tak rusak"
      },
      {
        "key": "D",
        "text": "Mengubah password otomatis"
      }
    ],
    "correctKey": "A",
    "explanation": "Pembaruan sering berisi patch keamanan dan perbaikan.",
    "weight": 10
  },
  {
    "id": 489,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #89] Jika perangkat dinas hilang…",
    "options": [
      {
        "key": "A",
        "text": "Segera lapor agar akses dan risiko data ditangani"
      },
      {
        "key": "B",
        "text": "Tunggu beberapa minggu"
      },
      {
        "key": "C",
        "text": "Hapus laporan"
      },
      {
        "key": "D",
        "text": "Umumkan password Jaringan, data, dan troubleshooting"
      }
    ],
    "correctKey": "A",
    "explanation": "Pelaporan cepat memungkinkan pengamanan akun dan penanganan insiden. Jaringan, data, dan troubleshooting",
    "weight": 10
  },
  {
    "id": 490,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #90] Jaringan komputer adalah…",
    "options": [
      {
        "key": "A",
        "text": "Perangkat saling terhubung untuk bertukar data"
      },
      {
        "key": "B",
        "text": "Kumpulan font"
      },
      {
        "key": "C",
        "text": "Jenis dokumen"
      },
      {
        "key": "D",
        "text": "Aplikasi slide"
      }
    ],
    "correctKey": "A",
    "explanation": "Jaringan menghubungkan perangkat melalui kabel atau nirkabel.",
    "weight": 10
  },
  {
    "id": 491,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #91] Perangkat yang meneruskan paket antarjaringan disebut…",
    "options": [
      {
        "key": "A",
        "text": "Router"
      },
      {
        "key": "B",
        "text": "Keyboard"
      },
      {
        "key": "C",
        "text": "Scanner"
      },
      {
        "key": "D",
        "text": "Speaker"
      }
    ],
    "correctKey": "A",
    "explanation": "Router meneruskan paket berdasarkan alamat tujuan.",
    "weight": 10
  },
  {
    "id": 492,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #92] LAN adalah singkatan dari…",
    "options": [
      {
        "key": "A",
        "text": "Local Area Network"
      },
      {
        "key": "B",
        "text": "Large Access Number"
      },
      {
        "key": "C",
        "text": "Long Analog Node"
      },
      {
        "key": "D",
        "text": "Local App Name"
      }
    ],
    "correctKey": "A",
    "explanation": "LAN mencakup area terbatas seperti kantor atau gedung.",
    "weight": 10
  },
  {
    "id": 493,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #93] Alamat IP digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Pengalamatan perangkat pada jaringan IP"
      },
      {
        "key": "B",
        "text": "Ukuran layar"
      },
      {
        "key": "C",
        "text": "Jenis font"
      },
      {
        "key": "D",
        "text": "Menyimpan Word"
      }
    ],
    "correctKey": "A",
    "explanation": "IP mengidentifikasi antarmuka perangkat dalam jaringan.",
    "weight": 10
  },
  {
    "id": 494,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #94] Wi-Fi merupakan teknologi…",
    "options": [
      {
        "key": "A",
        "text": "Jaringan lokal nirkabel"
      },
      {
        "key": "B",
        "text": "Penyimpanan optik"
      },
      {
        "key": "C",
        "text": "Pengolah kata"
      },
      {
        "key": "D",
        "text": "Pendingin"
      }
    ],
    "correctKey": "A",
    "explanation": "Wi-Fi menghubungkan perangkat ke jaringan secara nirkabel.",
    "weight": 10
  },
  {
    "id": 495,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #95] Jika komputer tidak terhubung internet, langkah awal…",
    "options": [
      {
        "key": "A",
        "text": "Periksa Wi-Fi/kabel dan status router"
      },
      {
        "key": "B",
        "text": "Hapus semua file"
      },
      {
        "key": "C",
        "text": "Ganti monitor"
      },
      {
        "key": "D",
        "text": "Instal ulang OS langsung"
      }
    ],
    "correctKey": "A",
    "explanation": "Periksa koneksi dasar sebelum mengambil tindakan drastis.",
    "weight": 10
  },
  {
    "id": 496,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #96] Database adalah…",
    "options": [
      {
        "key": "A",
        "text": "Kumpulan data terstruktur yang dikelola"
      },
      {
        "key": "B",
        "text": "Program gambar saja"
      },
      {
        "key": "C",
        "text": "Perangkat output"
      },
      {
        "key": "D",
        "text": "Jenis kabel"
      }
    ],
    "correctKey": "A",
    "explanation": "Database menyimpan data terorganisasi agar dapat diakses dan diperbarui.",
    "weight": 10
  },
  {
    "id": 497,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #97] Primary key berfungsi untuk…",
    "options": [
      {
        "key": "A",
        "text": "Mengidentifikasi baris secara unik"
      },
      {
        "key": "B",
        "text": "Mengubah warna tabel"
      },
      {
        "key": "C",
        "text": "Menyimpan password teks biasa"
      },
      {
        "key": "D",
        "text": "Mengurutkan desktop"
      }
    ],
    "correctKey": "A",
    "explanation": "Primary key membedakan setiap record dan nilainya unik.",
    "weight": 10
  },
  {
    "id": 498,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #98] CSV umumnya digunakan untuk…",
    "options": [
      {
        "key": "A",
        "text": "Data tabular dalam teks berpemisah"
      },
      {
        "key": "B",
        "text": "Video HD"
      },
      {
        "key": "C",
        "text": "Sistem operasi"
      },
      {
        "key": "D",
        "text": "Animasi slide"
      }
    ],
    "correctKey": "A",
    "explanation": "CSV menyimpan nilai data dalam teks dengan delimiter.",
    "weight": 10
  },
  {
    "id": 499,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #99] Jika printer tidak mencetak, langkah awal…",
    "options": [
      {
        "key": "A",
        "text": "Periksa daya, koneksi, kertas, tinta/toner, antrean"
      },
      {
        "key": "B",
        "text": "Buang printer"
      },
      {
        "key": "C",
        "text": "Hapus OS"
      },
      {
        "key": "D",
        "text": "Ganti semua kabel Tambahan: produktivitas dan praktik aman"
      }
    ],
    "correctKey": "A",
    "explanation": "Periksa komponen dasar dan antrean cetak sebelum perbaikan lanjutan. Tambahan: produktivitas dan praktik aman",
    "weight": 10
  },
  {
    "id": 500,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri #100] Perintah Ctrl+A umumnya berarti…",
    "options": [
      {
        "key": "A",
        "text": "Pilih semua"
      },
      {
        "key": "B",
        "text": "Simpan"
      },
      {
        "key": "C",
        "text": "Cetak"
      },
      {
        "key": "D",
        "text": "Tutup"
      }
    ],
    "correctKey": "A",
    "explanation": "Ctrl+A memilih seluruh teks atau objek dalam konteks aktif. Lembar Jawaban Tuliskan pilihan A, B, C, atau D pada setiap nomor. Evaluasi Hasil Latihan Jumlah benar: ______ dari 100 Jumlah salah: ______ Skor latihan: ______ / 100 Materi yang perlu diulang: ______________________________________________ Catatan perbaikan: ______________________________________________________ Interpretasi latihan pribadi (bukan standar resmi): 85–100: pemahaman sangat baik; pertahankan dengan praktik. 70–84: baik; ulangi materi yang masih keliru. 55–69: perlu penguatan pada beberapa materi. 0–54: ulangi konsep dasar dan latihan bertahap. Untuk penggunaan kedinasan, ikuti kebijakan keamanan informasi, kewenangan akses, dan petunjuk resmi satuan.",
    "weight": 10
  }
];

/* -------------------------------------------------------------------------- */
/* 5. KUMPULAN SOAL TPK (100 Butir)                                           */
/* -------------------------------------------------------------------------- */
const QUESTIONS_TPK: SimQuestion[] = [
  {
    "id": 501,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #1] Pancasila berkedudukan sebagai apa?",
    "options": [
      {
        "key": "A",
        "text": "Peraturan pemerintah"
      },
      {
        "key": "B",
        "text": "Dasar negara dan ideologi negara"
      },
      {
        "key": "C",
        "text": "Keputusan presiden"
      },
      {
        "key": "D",
        "text": "Hukum acara"
      }
    ],
    "correctKey": "B",
    "explanation": "Pancasila menjadi dasar penyelenggaraan negara dan pandangan hidup bangsa.",
    "weight": 10
  },
  {
    "id": 502,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #2] Pilih satu jawaban paling tepat: A, B, C, atau D.",
    "options": [
      {
        "key": "D",
        "text": ""
      }
    ],
    "correctKey": "B",
    "explanation": "Rumusan lima sila tercantum dalam Pembukaan UUD 1945 alinea keempat.",
    "weight": 10
  },
  {
    "id": 503,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #2] Rumusan Pancasila tercantum dalam bagian mana dari UUD 1945?  A. Batang tubuh Pasal 1",
    "options": [
      {
        "key": "A",
        "text": "Batang tubuh Pasal 1"
      },
      {
        "key": "B",
        "text": "Pembukaan alinea keempat"
      },
      {
        "key": "C",
        "text": "Penjelasan UUD"
      },
      {
        "key": "D",
        "text": "Dekrit Presiden"
      }
    ],
    "correctKey": "B",
    "explanation": "Rumusan lima sila tercantum dalam Pembukaan UUD 1945 alinea keempat.",
    "weight": 10
  },
  {
    "id": 504,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #3] Sila ketiga Pancasila menekankan nilai apa?  A. Persatuan Indonesia",
    "options": [
      {
        "key": "A",
        "text": "Persatuan Indonesia"
      },
      {
        "key": "B",
        "text": "Keadilan sosial"
      },
      {
        "key": "C",
        "text": "Ketuhanan"
      },
      {
        "key": "D",
        "text": "Musyawarah"
      }
    ],
    "correctKey": "A",
    "explanation": "Sila ketiga berbunyi Persatuan Indonesia.",
    "weight": 10
  },
  {
    "id": 505,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #4] Menurut UUD 1945, kedaulatan berada di tangan siapa?  A. Presiden",
    "options": [
      {
        "key": "A",
        "text": "Presiden"
      },
      {
        "key": "B",
        "text": "MPR saja"
      },
      {
        "key": "C",
        "text": "Rakyat dan dilaksanakan menurut UUD"
      },
      {
        "key": "D",
        "text": "DPR saja"
      }
    ],
    "correctKey": "C",
    "explanation": "Pasal 1 ayat (2) menegaskan kedaulatan berada di tangan rakyat dan dilaksanakan menurut UUD.",
    "weight": 10
  },
  {
    "id": 506,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #5] Indonesia adalah negara apa menurut Pasal 1 ayat (3) UUD 1945?  A. Negara kekuasaan",
    "options": [
      {
        "key": "A",
        "text": "Negara kekuasaan"
      },
      {
        "key": "B",
        "text": "Negara hukum"
      },
      {
        "key": "C",
        "text": "Monarki"
      },
      {
        "key": "D",
        "text": "Negara militer"
      }
    ],
    "correctKey": "B",
    "explanation": "UUD 1945 menegaskan Indonesia adalah negara hukum.",
    "weight": 10
  },
  {
    "id": 507,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #6] Lembaga yang memegang kekuasaan membentuk undang-undang adalah?  A. DPR",
    "options": [
      {
        "key": "A",
        "text": "DPR"
      },
      {
        "key": "B",
        "text": "MA"
      },
      {
        "key": "C",
        "text": "BPK"
      },
      {
        "key": "D",
        "text": "KY"
      }
    ],
    "correctKey": "A",
    "explanation": "Pasal 20 UUD 1945 menyatakan DPR memegang kekuasaan membentuk undang-undang.",
    "weight": 10
  },
  {
    "id": 508,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #7] Presiden menurut UUD 1945 memegang kekuasaan apa?  A. Kehakiman",
    "options": [
      {
        "key": "A",
        "text": "Kehakiman"
      },
      {
        "key": "B",
        "text": "Pemerintahan"
      },
      {
        "key": "C",
        "text": "Pemeriksaan keuangan"
      },
      {
        "key": "D",
        "text": "Legislasi tunggal"
      }
    ],
    "correctKey": "B",
    "explanation": "Presiden memegang kekuasaan pemerintahan menurut UUD.",
    "weight": 10
  },
  {
    "id": 509,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #8] Bentuk negara Indonesia adalah?  A. Serikat",
    "options": [
      {
        "key": "A",
        "text": "Serikat"
      },
      {
        "key": "B",
        "text": "Kesatuan berbentuk republik"
      },
      {
        "key": "C",
        "text": "Monarki"
      },
      {
        "key": "D",
        "text": "Konfederasi  SIMULASI TPK SIP — BUKAN SOAL RESMI / BOCORAN SELEKSI POLRI Halaman 4"
      }
    ],
    "correctKey": "B",
    "explanation": "Pasal 1 ayat (1) menyatakan Indonesia ialah Negara Kesatuan yang berbentuk Republik.",
    "weight": 10
  },
  {
    "id": 510,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #9] Persamaan warga negara di hadapan hukum dikenal sebagai prinsip apa?  A. Equality before the law",
    "options": [
      {
        "key": "A",
        "text": "Equality before the law"
      },
      {
        "key": "B",
        "text": "Kekebalan mutlak"
      },
      {
        "key": "C",
        "text": "Diskresi tanpa batas"
      },
      {
        "key": "D",
        "text": "Dominasi mayoritas"
      }
    ],
    "correctKey": "A",
    "explanation": "Prinsip ini menghendaki hukum diterapkan tanpa diskriminasi.",
    "weight": 10
  },
  {
    "id": 511,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #10] Pembatasan kekuasaan dalam negara hukum terutama bertujuan untuk apa?  A. Mempercepat hukuman tanpa proses",
    "options": [
      {
        "key": "A",
        "text": "Mempercepat hukuman tanpa proses"
      },
      {
        "key": "B",
        "text": "Mencegah penyalahgunaan kekuasaan"
      },
      {
        "key": "C",
        "text": "Menghapus pengawasan"
      },
      {
        "key": "D",
        "text": "Mengutamakan pejabat"
      }
    ],
    "correctKey": "B",
    "explanation": "Pembatasan dan pengawasan mencegah tindakan sewenang-wenang.",
    "weight": 10
  },
  {
    "id": 512,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #11] Undang-undang pokok yang mengatur Polri adalah?  A. UU 2 Tahun 2002",
    "options": [
      {
        "key": "A",
        "text": "UU 2 Tahun 2002"
      },
      {
        "key": "B",
        "text": "UU 8 Tahun 1981"
      },
      {
        "key": "C",
        "text": "UU 1 Tahun 1974"
      },
      {
        "key": "D",
        "text": "UU 5 Tahun 2014"
      }
    ],
    "correctKey": "A",
    "explanation": "UU 2/2002 adalah UU tentang Polri dan harus dibaca bersama perubahan yang berlaku.",
    "weight": 10
  },
  {
    "id": 513,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #12] Tiga tugas pokok Polri meliputi apa?  A. Membentuk UU, mengadili, memenjarakan",
    "options": [
      {
        "key": "A",
        "text": "Membentuk UU, mengadili, memenjarakan"
      },
      {
        "key": "B",
        "text": "Harkamtibmas, penegakan hukum, perlindungan/pengayoman/pelayanan"
      },
      {
        "key": "C",
        "text": "Kebijakan ekonomi"
      },
      {
        "key": "D",
        "text": "Pertahanan militer"
      }
    ],
    "correctKey": "B",
    "explanation": "Pasal 13 UU 2/2002 merumuskan tiga tugas pokok tersebut.",
    "weight": 10
  },
  {
    "id": 514,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #13] Polri berada di bawah siapa dalam struktur ketatanegaraan?  A. DPR",
    "options": [
      {
        "key": "A",
        "text": "DPR"
      },
      {
        "key": "B",
        "text": "Presiden"
      },
      {
        "key": "C",
        "text": "Mahkamah Agung"
      },
      {
        "key": "D",
        "text": "Gubernur"
      }
    ],
    "correctKey": "B",
    "explanation": "UU Kepolisian mengatur Polri berada di bawah Presiden; perhatikan perubahan peraturan terbaru.",
    "weight": 10
  },
  {
    "id": 515,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #14] Kapolri diangkat dan diberhentikan Presiden dengan persetujuan siapa?  A. DPR",
    "options": [
      {
        "key": "A",
        "text": "DPR"
      },
      {
        "key": "B",
        "text": "DPD"
      },
      {
        "key": "C",
        "text": "MPR"
      },
      {
        "key": "D",
        "text": "Mahkamah Konstitusi"
      }
    ],
    "correctKey": "A",
    "explanation": "UU Kepolisian mengatur persetujuan DPR untuk pengangkatan dan pemberhentian Kapolri.",
    "weight": 10
  },
  {
    "id": 516,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #15] Fungsi kepolisian merupakan fungsi pemerintahan di bidang apa?  A. Moneter",
    "options": [
      {
        "key": "A",
        "text": "Moneter"
      },
      {
        "key": "B",
        "text": "Harkamtibmas, penegakan hukum, perlindungan, pengayoman, pelayanan"
      },
      {
        "key": "C",
        "text": "Diplomasi saja"
      },
      {
        "key": "D",
        "text": "Pendidikan tinggi"
      }
    ],
    "correctKey": "B",
    "explanation": "Rumusan fungsi kepolisian terdapat dalam Pasal 2 UU 2/2002.",
    "weight": 10
  },
  {
    "id": 517,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #16] Polri sebagai Kepolisian Nasional berarti apa?  A. Setiap daerah berdiri terpisah",
    "options": [
      {
        "key": "A",
        "text": "Setiap daerah berdiri terpisah"
      },
      {
        "key": "B",
        "text": "Satu kesatuan dalam pelaksanaan peran kepolisian"
      },
      {
        "key": "C",
        "text": "Hanya bertugas di ibu kota"
      },
      {
        "key": "D",
        "text": "Di bawah pemda"
      }
    ],
    "correctKey": "B",
    "explanation": "UU 2/2002 menyatakan Polri merupakan Kepolisian Nasional yang satu kesatuan.",
    "weight": 10
  },
  {
    "id": 518,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #17] Pelaksanaan tugas Polri harus menjunjung tinggi apa?  A. Kepentingan pribadi",
    "options": [
      {
        "key": "A",
        "text": "Kepentingan pribadi"
      },
      {
        "key": "B",
        "text": "Hak asasi manusia"
      },
      {
        "key": "C",
        "text": "Kekuasaan tanpa kontrol"
      },
      {
        "key": "D",
        "text": "Kepentingan kelompok  SIMULASI TPK SIP — BUKAN SOAL RESMI / BOCORAN SELEKSI POLRI Halaman 5"
      }
    ],
    "correctKey": "B",
    "explanation": "Penghormatan HAM merupakan prinsip penting dalam pelaksanaan tugas.",
    "weight": 10
  },
  {
    "id": 519,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #18] Contoh tugas preventif kepolisian adalah?  A. Patroli pencegahan gangguan kamtibmas",
    "options": [
      {
        "key": "A",
        "text": "Patroli pencegahan gangguan kamtibmas"
      },
      {
        "key": "B",
        "text": "Menjatuhkan vonis"
      },
      {
        "key": "C",
        "text": "Menetapkan UU"
      },
      {
        "key": "D",
        "text": "Putusan perdata"
      }
    ],
    "correctKey": "A",
    "explanation": "Patroli bertujuan mencegah gangguan keamanan dan ketertiban.",
    "weight": 10
  },
  {
    "id": 520,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #19] Contoh tindakan represif dalam penegakan hukum adalah?  A. Penyidikan tindak pidana sesuai hukum",
    "options": [
      {
        "key": "A",
        "text": "Penyidikan tindak pidana sesuai hukum"
      },
      {
        "key": "B",
        "text": "Penyuluhan keselamatan"
      },
      {
        "key": "C",
        "text": "Sambang warga"
      },
      {
        "key": "D",
        "text": "Kampanye tertib lalu lintas"
      }
    ],
    "correctKey": "A",
    "explanation": "Penyidikan merupakan tindakan penegakan hukum atas dugaan tindak pidana.",
    "weight": 10
  },
  {
    "id": 521,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #20] Pelayanan publik Polri seharusnya seperti apa?  A. Hanya untuk kenalan",
    "options": [
      {
        "key": "A",
        "text": "Hanya untuk kenalan"
      },
      {
        "key": "B",
        "text": "Adil, sesuai standar, dan bertanggung jawab"
      },
      {
        "key": "C",
        "text": "Mengutamakan imbalan"
      },
      {
        "key": "D",
        "text": "Menolak kelompok rentan  SIMULASI TPK SIP — BUKAN SOAL RESMI / BOCORAN SELEKSI POLRI Halaman 6"
      }
    ],
    "correctKey": "B",
    "explanation": "Pelayanan harus profesional, transparan, dan nondiskriminatif.",
    "weight": 10
  },
  {
    "id": 522,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #21] Salah satu kewenangan umum Polri menurut UU 2/2002 adalah?  A. Menerima laporan/pengaduan",
    "options": [
      {
        "key": "A",
        "text": "Menerima laporan/pengaduan"
      },
      {
        "key": "B",
        "text": "Menjatuhkan pidana penjara"
      },
      {
        "key": "C",
        "text": "Membatalkan putusan"
      },
      {
        "key": "D",
        "text": "Membuat APBN"
      }
    ],
    "correctKey": "A",
    "explanation": "Pasal 15 UU 2/2002 mencantumkan kewenangan menerima laporan/pengaduan.",
    "weight": 10
  },
  {
    "id": 523,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #22] Tindakan pertama di TKP bertujuan antara lain untuk apa?  A. Mengubah posisi barang",
    "options": [
      {
        "key": "A",
        "text": "Mengubah posisi barang"
      },
      {
        "key": "B",
        "text": "Mengamankan TKP dan menjaga bukti"
      },
      {
        "key": "C",
        "text": "Membiarkan kerumunan masuk"
      },
      {
        "key": "D",
        "text": "Menyebarkan identitas korban"
      }
    ],
    "correctKey": "B",
    "explanation": "Pengamanan TKP mencegah kontaminasi dan menjaga integritas barang bukti.",
    "weight": 10
  },
  {
    "id": 524,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #23] Prinsip legalitas dalam tindakan kepolisian berarti apa?  A. Tindakan memiliki dasar hukum",
    "options": [
      {
        "key": "A",
        "text": "Tindakan memiliki dasar hukum"
      },
      {
        "key": "B",
        "text": "Berdasarkan perasaan"
      },
      {
        "key": "C",
        "text": "Semua tindakan dibenarkan"
      },
      {
        "key": "D",
        "text": "Aturan boleh diabaikan"
      }
    ],
    "correctKey": "A",
    "explanation": "Tindakan harus sesuai kewenangan, prosedur, dan peraturan.",
    "weight": 10
  },
  {
    "id": 525,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #24] Prinsip nesesitas dalam penggunaan kekuatan menghendaki apa?  A. Kekuatan sebagai pilihan pertama",
    "options": [
      {
        "key": "A",
        "text": "Kekuatan sebagai pilihan pertama"
      },
      {
        "key": "B",
        "text": "Digunakan bila diperlukan untuk tujuan sah"
      },
      {
        "key": "C",
        "text": "Untuk menghukum"
      },
      {
        "key": "D",
        "text": "Tanpa evaluasi"
      }
    ],
    "correctKey": "B",
    "explanation": "Kekuatan hanya digunakan ketika benar-benar diperlukan, bukan untuk membalas.",
    "weight": 10
  },
  {
    "id": 526,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #25] Prinsip proporsionalitas berarti apa?  A. Kekuatan seimbang dengan ancaman dan tujuan sah",
    "options": [
      {
        "key": "A",
        "text": "Kekuatan seimbang dengan ancaman dan tujuan sah"
      },
      {
        "key": "B",
        "text": "Selalu maksimal"
      },
      {
        "key": "C",
        "text": "Semua pelanggaran direspons sama"
      },
      {
        "key": "D",
        "text": "Tanpa menilai risiko"
      }
    ],
    "correctKey": "A",
    "explanation": "Respons harus sebanding dengan tingkat ancaman dan situasi.",
    "weight": 10
  },
  {
    "id": 527,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #26] Akuntabilitas tindakan kepolisian menuntut apa?  A. Tidak ada pencatatan",
    "options": [
      {
        "key": "A",
        "text": "Tidak ada pencatatan"
      },
      {
        "key": "B",
        "text": "Tindakan dapat dipertanggungjawabkan dan didokumentasikan"
      },
      {
        "key": "C",
        "text": "Keputusan tanpa pengawasan"
      },
      {
        "key": "D",
        "text": "Menghindari evaluasi"
      }
    ],
    "correctKey": "B",
    "explanation": "Akuntabilitas memerlukan alasan, prosedur, dokumentasi, dan pertanggungjawaban.",
    "weight": 10
  },
  {
    "id": 528,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #27] Diskresi kepolisian seharusnya digunakan bagaimana?  A. Sesuka hati",
    "options": [
      {
        "key": "A",
        "text": "Sesuka hati"
      },
      {
        "key": "B",
        "text": "Dalam kewenangan, berdasarkan hukum dan kepentingan umum"
      },
      {
        "key": "C",
        "text": "Untuk keuntungan pribadi"
      },
      {
        "key": "D",
        "text": "Menghindari prosedur"
      }
    ],
    "correctKey": "B",
    "explanation": "Diskresi bukan kewenangan tanpa batas dan harus dapat dipertanggungjawabkan.",
    "weight": 10
  },
  {
    "id": 529,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #28] Saat menerima laporan masyarakat, petugas sebaiknya?  A. Menilai pelapor sebelum mendengar",
    "options": [
      {
        "key": "A",
        "text": "Menilai pelapor sebelum mendengar"
      },
      {
        "key": "B",
        "text": "Mendengar, mencatat, memverifikasi awal, menjelaskan prosedur"
      },
      {
        "key": "C",
        "text": "Menjanjikan perkara menang"
      },
      {
        "key": "D",
        "text": "Meminta imbalan"
      }
    ],
    "correctKey": "B",
    "explanation": "Penerimaan laporan memerlukan sikap profesional, empati, dan informasi yang benar.",
    "weight": 10
  },
  {
    "id": 530,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #29] Jika konflik warga berpotensi meluas, langkah awal tepat adalah?  A. Memihak kelompok",
    "options": [
      {
        "key": "A",
        "text": "Memihak kelompok"
      },
      {
        "key": "B",
        "text": "Mengendalikan situasi dan mengupayakan komunikasi"
      },
      {
        "key": "C",
        "text": "Menyebarkan provokasi"
      },
      {
        "key": "D",
        "text": "Pergi tanpa koordinasi  SIMULASI TPK SIP — BUKAN SOAL RESMI / BOCORAN SELEKSI POLRI Halaman 7"
      }
    ],
    "correctKey": "B",
    "explanation": "Prioritas awal adalah keselamatan, deeskalasi, dan pencegahan eskalasi.",
    "weight": 10
  },
  {
    "id": 531,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #30] Barang temuan yang diterima petugas harus bagaimana?  A. Dibawa pulang",
    "options": [
      {
        "key": "A",
        "text": "Dibawa pulang"
      },
      {
        "key": "B",
        "text": "Dicatat, diamankan, diproses sesuai prosedur"
      },
      {
        "key": "C",
        "text": "Dibagikan"
      },
      {
        "key": "D",
        "text": "Dibiarkan tanpa tanda terima"
      }
    ],
    "correctKey": "B",
    "explanation": "Pencatatan dan pengamanan mencegah penyalahgunaan serta menjaga akuntabilitas.",
    "weight": 10
  },
  {
    "id": 532,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #31] KUHP nasional diatur dalam undang-undang nomor berapa?  A. UU 1 Tahun 2023",
    "options": [
      {
        "key": "A",
        "text": "UU 1 Tahun 2023"
      },
      {
        "key": "B",
        "text": "UU 2 Tahun 2002"
      },
      {
        "key": "C",
        "text": "UU 20 Tahun 2025"
      },
      {
        "key": "D",
        "text": "PP 2 Tahun 2003"
      }
    ],
    "correctKey": "A",
    "explanation": "UU 1/2023 merupakan Kitab Undang-Undang Hukum Pidana.",
    "weight": 10
  },
  {
    "id": 533,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #32] KUHP nasional mulai berlaku kapan?  A. 1 Januari 2024",
    "options": [
      {
        "key": "A",
        "text": "1 Januari 2024"
      },
      {
        "key": "B",
        "text": "2 Januari 2026"
      },
      {
        "key": "C",
        "text": "17 Agustus 2025"
      },
      {
        "key": "D",
        "text": "2 Januari 2023"
      }
    ],
    "correctKey": "B",
    "explanation": "UU 1/2023 mulai berlaku tiga tahun setelah diundangkan, yaitu 2 Januari 2026.",
    "weight": 10
  },
  {
    "id": 534,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #33] Asas legalitas pidana secara umum mengandung prinsip apa?  A. Tidak ada pidana tanpa aturan pidana sebelumnya",
    "options": [
      {
        "key": "A",
        "text": "Tidak ada pidana tanpa aturan pidana sebelumnya"
      },
      {
        "key": "B",
        "text": "Hukuman dibuat setelah perbuatan"
      },
      {
        "key": "C",
        "text": "Semua perilaku tidak sopan pidana"
      },
      {
        "key": "D",
        "text": "Hukuman berdasar prasangka"
      }
    ],
    "correctKey": "A",
    "explanation": "Asas legalitas menjamin kepastian hukum dan melarang pemidanaan tanpa dasar hukum.",
    "weight": 10
  },
  {
    "id": 535,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #34] Pertanggungjawaban pidana pada prinsipnya berkaitan dengan apa?  A. Kesalahan dan kemampuan bertanggung jawab",
    "options": [
      {
        "key": "A",
        "text": "Kesalahan dan kemampuan bertanggung jawab"
      },
      {
        "key": "B",
        "text": "Status sosial"
      },
      {
        "key": "C",
        "text": "Pengikut media sosial"
      },
      {
        "key": "D",
        "text": "Pendapat tetangga"
      }
    ],
    "correctKey": "A",
    "explanation": "Penilaian pertanggungjawaban mencakup unsur kesalahan dan kemampuan bertanggung jawab sesuai hukum.",
    "weight": 10
  },
  {
    "id": 536,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #35] Perbedaan tindak pidana dan pelanggaran etik adalah?  A. Selalu sama",
    "options": [
      {
        "key": "A",
        "text": "Selalu sama"
      },
      {
        "key": "B",
        "text": "Pidana melanggar hukum pidana, etik melanggar standar profesi"
      },
      {
        "key": "C",
        "text": "Etik selalu lebih berat"
      },
      {
        "key": "D",
        "text": "Pidana hanya di kantor"
      }
    ],
    "correctKey": "B",
    "explanation": "Ranah pidana dan etik berbeda, walau satu perbuatan dapat menimbulkan konsekuensi keduanya.",
    "weight": 10
  },
  {
    "id": 537,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #36] Pidana dijatuhkan oleh siapa?  A. Penyidik",
    "options": [
      {
        "key": "A",
        "text": "Penyidik"
      },
      {
        "key": "B",
        "text": "Pengadilan melalui proses peradilan"
      },
      {
        "key": "C",
        "text": "Pelapor"
      },
      {
        "key": "D",
        "text": "Ketua RT"
      }
    ],
    "correctKey": "B",
    "explanation": "Penyidik tidak menjatuhkan putusan pidana; kewenangan mengadili berada pada pengadilan.",
    "weight": 10
  },
  {
    "id": 538,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #37] Tujuan pemidanaan modern dapat mencakup apa?  A. Pembalasan tanpa batas",
    "options": [
      {
        "key": "A",
        "text": "Pembalasan tanpa batas"
      },
      {
        "key": "B",
        "text": "Pencegahan, pembinaan, perlindungan masyarakat, pemulihan sesuai hukum"
      },
      {
        "key": "C",
        "text": "Mempermalukan keluarga"
      },
      {
        "key": "D",
        "text": "Menguntungkan korban dengan cara apa pun"
      }
    ],
    "correctKey": "B",
    "explanation": "Sistem pemidanaan memiliki beragam tujuan yang diterapkan menurut undang-undang.",
    "weight": 10
  },
  {
    "id": 539,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #38] Percobaan melakukan tindak pidana pada umumnya berkaitan dengan apa?  A. Niat saja selalu cukup",
    "options": [
      {
        "key": "A",
        "text": "Niat saja selalu cukup"
      },
      {
        "key": "B",
        "text": "Permulaan pelaksanaan yang tidak selesai bukan semata kehendak pelaku"
      },
      {
        "key": "C",
        "text": "Pikiran pribadi"
      },
      {
        "key": "D",
        "text": "Kesalahan administrasi  SIMULASI TPK SIP — BUKAN SOAL RESMI / BOCORAN SELEKSI POLRI Halaman 8"
      }
    ],
    "correctKey": "B",
    "explanation": "Percobaan mensyaratkan unsur tertentu, termasuk permulaan pelaksanaan menurut KUHP.",
    "weight": 10
  },
  {
    "id": 540,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #39] Pembelaan terpaksa dalam hukum pidana dikenal dengan istilah apa?  A. Noodweer",
    "options": [
      {
        "key": "A",
        "text": "Noodweer"
      },
      {
        "key": "B",
        "text": "Arbitrase"
      },
      {
        "key": "C",
        "text": "Mediasi bisnis"
      },
      {
        "key": "D",
        "text": "Grasi"
      }
    ],
    "correctKey": "A",
    "explanation": "Noodweer adalah pembelaan terpaksa terhadap serangan/ancaman melawan hukum dengan syarat hukum.",
    "weight": 10
  },
  {
    "id": 541,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #40] Penerapan KUHP dalam perkara konkret harus memperhatikan apa?  A. Perasaan petugas",
    "options": [
      {
        "key": "A",
        "text": "Perasaan petugas"
      },
      {
        "key": "B",
        "text": "Rumusan delik, unsur, bukti, asas hukum, ketentuan berlaku"
      },
      {
        "key": "C",
        "text": "Opini media"
      },
      {
        "key": "D",
        "text": "Tekanan massa  SIMULASI TPK SIP — BUKAN SOAL RESMI / BOCORAN SELEKSI POLRI Halaman 9"
      }
    ],
    "correctKey": "B",
    "explanation": "Analisis pidana harus berbasis unsur hukum dan fakta yang dapat dibuktikan.",
    "weight": 10
  },
  {
    "id": 542,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #41] KUHAP yang berlaku sejak 2 Januari 2026 adalah?  A. UU 8 Tahun 1981",
    "options": [
      {
        "key": "A",
        "text": "UU 8 Tahun 1981"
      },
      {
        "key": "B",
        "text": "UU 20 Tahun 2025"
      },
      {
        "key": "C",
        "text": "UU 1 Tahun 2023"
      },
      {
        "key": "D",
        "text": "UU 2 Tahun 2002"
      }
    ],
    "correctKey": "B",
    "explanation": "UU 20/2025 menggantikan UU 8/1981 dan berlaku sejak 2 Januari 2026.  SIMULASI TPK SIP — BUKAN SOAL RESMI / BOCORAN SELEKSI POLRI Halaman 21",
    "weight": 10
  },
  {
    "id": 543,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #42] Penyelidikan pada pokoknya bertujuan untuk apa?  A. Menentukan apakah peristiwa diduga tindak pidana untuk ditindaklanjuti",
    "options": [
      {
        "key": "A",
        "text": "Menentukan apakah peristiwa diduga tindak pidana untuk ditindaklanjuti"
      },
      {
        "key": "B",
        "text": "Menjatuhkan pidana"
      },
      {
        "key": "C",
        "text": "Menetapkan vonis"
      },
      {
        "key": "D",
        "text": "Eksekusi putusan"
      }
    ],
    "correctKey": "A",
    "explanation": "Penyelidikan merupakan tahap awal mencari dan menemukan peristiwa yang diduga tindak pidana.",
    "weight": 10
  },
  {
    "id": 544,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #43] Penyidikan pada pokoknya bertujuan untuk apa?  A. Mengumpulkan bukti untuk membuat terang tindak pidana dan menemukan tersangka",
    "options": [
      {
        "key": "A",
        "text": "Mengumpulkan bukti untuk membuat terang tindak pidana dan menemukan tersangka"
      },
      {
        "key": "B",
        "text": "Menyusun UU"
      },
      {
        "key": "C",
        "text": "Mengadili terdakwa"
      },
      {
        "key": "D",
        "text": "Menentukan hukuman oleh polisi"
      }
    ],
    "correctKey": "A",
    "explanation": "Penyidikan berfokus pada pengumpulan bukti dan penentuan pihak yang diduga bertanggung jawab.",
    "weight": 10
  },
  {
    "id": 545,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #44] Penyidik wajib bekerja berdasarkan apa?  A. Perintah siapa pun",
    "options": [
      {
        "key": "A",
        "text": "Perintah siapa pun"
      },
      {
        "key": "B",
        "text": "Hukum acara, kewenangan, prosedur sah"
      },
      {
        "key": "C",
        "text": "Tekanan media"
      },
      {
        "key": "D",
        "text": "Target pengakuan"
      }
    ],
    "correctKey": "B",
    "explanation": "Kewenangan penyidik dibatasi hukum dan prosedur untuk melindungi hak semua pihak.",
    "weight": 10
  },
  {
    "id": 546,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #45] UU 20/2025 menekankan penguatan hak siapa?  A. Tersangka, terdakwa, terpidana, saksi, korban, penyandang disabilitas",
    "options": [
      {
        "key": "A",
        "text": "Tersangka, terdakwa, terpidana, saksi, korban, penyandang disabilitas"
      },
      {
        "key": "B",
        "text": "Pejabat saja"
      },
      {
        "key": "C",
        "text": "Hanya pelapor"
      },
      {
        "key": "D",
        "text": "Hanya penuntut umum"
      }
    ],
    "correctKey": "A",
    "explanation": "Ringkasan resmi UU 20/2025 menekankan penguatan hak pihak-pihak tersebut.",
    "weight": 10
  },
  {
    "id": 547,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #46] Praperadilan merupakan mekanisme apa?  A. Pengawasan yudisial atas tindakan/proses tertentu menurut KUHAP",
    "options": [
      {
        "key": "A",
        "text": "Pengawasan yudisial atas tindakan/proses tertentu menurut KUHAP"
      },
      {
        "key": "B",
        "text": "Pengganti seluruh sidang"
      },
      {
        "key": "C",
        "text": "Pemeriksaan etik internal"
      },
      {
        "key": "D",
        "text": "Pengadilan militer"
      }
    ],
    "correctKey": "A",
    "explanation": "Praperadilan memberi kontrol pengadilan atas tindakan/proses yang ditentukan undang-undang.",
    "weight": 10
  },
  {
    "id": 548,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #47] Barang bukti harus dikelola dengan prinsip apa?  A. Bebas dipindahkan",
    "options": [
      {
        "key": "A",
        "text": "Bebas dipindahkan"
      },
      {
        "key": "B",
        "text": "Integritas, rantai penguasaan, dokumentasi, keutuhan"
      },
      {
        "key": "C",
        "text": "Dipakai pribadi"
      },
      {
        "key": "D",
        "text": "Tanpa identifikasi"
      }
    ],
    "correctKey": "B",
    "explanation": "Pengelolaan tertib menjaga keaslian dan nilai pembuktian barang bukti.",
    "weight": 10
  },
  {
    "id": 549,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #48] Keterangan saksi yang baik dalam pembuktian adalah?  A. Berdasarkan yang dilihat, didengar, dialami sesuai hukum",
    "options": [
      {
        "key": "A",
        "text": "Berdasarkan yang dilihat, didengar, dialami sesuai hukum"
      },
      {
        "key": "B",
        "text": "Rumor anonim"
      },
      {
        "key": "C",
        "text": "Dibuat sesuai dugaan penyidik"
      },
      {
        "key": "D",
        "text": "Hasil tekanan"
      }
    ],
    "correctKey": "A",
    "explanation": "Keterangan harus diperoleh secara sah dan dinilai sesuai ketentuan pembuktian.",
    "weight": 10
  },
  {
    "id": 550,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #49] Hak atas bantuan hukum bertujuan untuk apa?  A. Menghalangi proses hukum",
    "options": [
      {
        "key": "A",
        "text": "Menghalangi proses hukum"
      },
      {
        "key": "B",
        "text": "Menjamin akses pembelaan dan proses adil"
      },
      {
        "key": "C",
        "text": "Menghapus kewajiban hadir"
      },
      {
        "key": "D",
        "text": "Menentukan hasil perkara  SIMULASI TPK SIP — BUKAN SOAL RESMI / BOCORAN SELEKSI POLRI Halaman 10"
      }
    ],
    "correctKey": "B",
    "explanation": "Bantuan hukum mendukung fair trial dan perlindungan hak.",
    "weight": 10
  },
  {
    "id": 551,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #50] Keadilan restoratif menitikberatkan pada apa?  A. Pemulihan yang sah dengan memperhatikan korban, pelaku, masyarakat",
    "options": [
      {
        "key": "A",
        "text": "Pemulihan yang sah dengan memperhatikan korban, pelaku, masyarakat"
      },
      {
        "key": "B",
        "text": "Penghukuman massa"
      },
      {
        "key": "C",
        "text": "Menghapus semua tindak pidana"
      },
      {
        "key": "D",
        "text": "Ancaman"
      }
    ],
    "correctKey": "A",
    "explanation": "KUHAP baru mengatur mekanisme keadilan restoratif sebagai salah satu pembaruan.",
    "weight": 10
  },
  {
    "id": 552,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #51] Perpol yang mengatur Kode Etik Profesi dan Komisi Kode Etik Polri adalah?  A. Perpol 7 Tahun 2022",
    "options": [
      {
        "key": "A",
        "text": "Perpol 7 Tahun 2022"
      },
      {
        "key": "B",
        "text": "PP 2 Tahun 2003"
      },
      {
        "key": "C",
        "text": "UU 1 Tahun 2023"
      },
      {
        "key": "D",
        "text": "UU 20 Tahun 2025"
      }
    ],
    "correctKey": "A",
    "explanation": "Perpol 7/2022 mengatur Kode Etik Profesi dan Komisi Kode Etik Polri.",
    "weight": 10
  },
  {
    "id": 553,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #52] Peraturan disiplin anggota Polri diatur dalam?  A. PP 2 Tahun 2003",
    "options": [
      {
        "key": "A",
        "text": "PP 2 Tahun 2003"
      },
      {
        "key": "B",
        "text": "PP 40 Tahun 1958"
      },
      {
        "key": "C",
        "text": "PP 1 Tahun 2020"
      },
      {
        "key": "D",
        "text": "PP 7 Tahun 2022"
      }
    ],
    "correctKey": "A",
    "explanation": "PP 2/2003 mengatur Peraturan Disiplin Anggota Polri.",
    "weight": 10
  },
  {
    "id": 554,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #53] Kode etik profesi terutama berfungsi sebagai apa?  A. Pedoman sikap, perilaku, perbuatan anggota",
    "options": [
      {
        "key": "A",
        "text": "Pedoman sikap, perilaku, perbuatan anggota"
      },
      {
        "key": "B",
        "text": "Pengganti KUHP"
      },
      {
        "key": "C",
        "text": "Dasar APBN"
      },
      {
        "key": "D",
        "text": "Pedoman kampanye"
      }
    ],
    "correctKey": "A",
    "explanation": "Kode etik menjadi pedoman profesional dalam tugas dan kehidupan anggota.",
    "weight": 10
  },
  {
    "id": 555,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #54] Integritas dalam tugas kepolisian tercermin dari apa?  A. Mengubah fakta",
    "options": [
      {
        "key": "A",
        "text": "Mengubah fakta"
      },
      {
        "key": "B",
        "text": "Jujur, konsisten, menolak penyalahgunaan wewenang"
      },
      {
        "key": "C",
        "text": "Melindungi pelanggaran"
      },
      {
        "key": "D",
        "text": "Menerima hadiah ilegal"
      }
    ],
    "correctKey": "B",
    "explanation": "Integritas menuntut kejujuran dan penggunaan kewenangan secara benar.",
    "weight": 10
  },
  {
    "id": 556,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #55] Konflik kepentingan terjadi ketika apa?  A. Kepentingan pribadi berpotensi memengaruhi objektivitas tugas",
    "options": [
      {
        "key": "A",
        "text": "Kepentingan pribadi berpotensi memengaruhi objektivitas tugas"
      },
      {
        "key": "B",
        "text": "Petugas ikut SOP"
      },
      {
        "key": "C",
        "text": "Petugas membuat laporan"
      },
      {
        "key": "D",
        "text": "Atasan supervisi"
      }
    ],
    "correctKey": "A",
    "explanation": "Konflik kepentingan harus diungkap dan dikelola agar keputusan objektif.",
    "weight": 10
  },
  {
    "id": 557,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #56] Jika mengetahui rekan meminta imbalan ilegal, tindakan profesional adalah?  A. Ikut menerima",
    "options": [
      {
        "key": "A",
        "text": "Ikut menerima"
      },
      {
        "key": "B",
        "text": "Mendiamkan"
      },
      {
        "key": "C",
        "text": "Menolak terlibat dan melapor melalui mekanisme sah"
      },
      {
        "key": "D",
        "text": "Meminta bagian"
      }
    ],
    "correctKey": "C",
    "explanation": "Penyimpangan ditangani melalui saluran pelaporan dan pengawasan.",
    "weight": 10
  },
  {
    "id": 558,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #57] Praduga tak bersalah berarti apa?  A. Tersangka pasti bersalah",
    "options": [
      {
        "key": "A",
        "text": "Tersangka pasti bersalah"
      },
      {
        "key": "B",
        "text": "Dianggap tidak bersalah sampai ada putusan berkekuatan hukum tetap"
      },
      {
        "key": "C",
        "text": "Penyidikan dilarang"
      },
      {
        "key": "D",
        "text": "Korban tidak boleh melapor"
      }
    ],
    "correctKey": "B",
    "explanation": "Prinsip ini melindungi martabat dan hak orang yang berhadapan dengan proses pidana.",
    "weight": 10
  },
  {
    "id": 559,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #58] Perlakuan terhadap tahanan harus bagaimana?  A. Menghormati martabat dan hak yang dijamin hukum",
    "options": [
      {
        "key": "A",
        "text": "Menghormati martabat dan hak yang dijamin hukum"
      },
      {
        "key": "B",
        "text": "Mengintimidasi"
      },
      {
        "key": "C",
        "text": "Mengabaikan medis"
      },
      {
        "key": "D",
        "text": "Dipertontonkan  SIMULASI TPK SIP — BUKAN SOAL RESMI / BOCORAN SELEKSI POLRI Halaman 11"
      }
    ],
    "correctKey": "A",
    "explanation": "Orang yang ditahan tetap memiliki hak dan martabat yang wajib dihormati.",
    "weight": 10
  },
  {
    "id": 560,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #59] Penyiksaan untuk memperoleh pengakuan adalah?  A. Dibenarkan",
    "options": [
      {
        "key": "A",
        "text": "Dibenarkan"
      },
      {
        "key": "B",
        "text": "Dilarang dan bertentangan dengan HAM serta hukum"
      },
      {
        "key": "C",
        "text": "Boleh jika direkam"
      },
      {
        "key": "D",
        "text": "Boleh atas perintah informal"
      }
    ],
    "correctKey": "B",
    "explanation": "Pengakuan tidak boleh diperoleh melalui penyiksaan atau perlakuan melanggar hukum.",
    "weight": 10
  },
  {
    "id": 561,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #60] Netralitas anggota Polri dalam politik praktis menuntut apa?  A. Mendukung peserta dengan jabatan",
    "options": [
      {
        "key": "A",
        "text": "Mendukung peserta dengan jabatan"
      },
      {
        "key": "B",
        "text": "Tidak menyalahgunakan jabatan untuk kepentingan politik praktis"
      },
      {
        "key": "C",
        "text": "Memaksa warga memilih"
      },
      {
        "key": "D",
        "text": "Kampanye dengan fasilitas dinas  SIMULASI TPK SIP — BUKAN SOAL RESMI / BOCORAN SELEKSI POLRI Halaman 12"
      }
    ],
    "correctKey": "B",
    "explanation": "Netralitas menjaga profesionalitas dan kepercayaan publik.",
    "weight": 10
  },
  {
    "id": 562,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #61] Fungsi utama lalu lintas berkaitan dengan apa?  A. Kamseltibcarlantas",
    "options": [
      {
        "key": "A",
        "text": "Kamseltibcarlantas"
      },
      {
        "key": "B",
        "text": "Pengelolaan pajak"
      },
      {
        "key": "C",
        "text": "Penuntutan"
      },
      {
        "key": "D",
        "text": "Pengawasan bank"
      }
    ],
    "correctKey": "A",
    "explanation": "Fungsi lalu lintas mengelola keamanan, keselamatan, ketertiban, kelancaran lalu lintas.",
    "weight": 10
  },
  {
    "id": 563,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #62] Contoh kegiatan preventif Satlantas adalah?  A. Pendidikan masyarakat dan pengaturan lalu lintas",
    "options": [
      {
        "key": "A",
        "text": "Pendidikan masyarakat dan pengaturan lalu lintas"
      },
      {
        "key": "B",
        "text": "Menjatuhkan vonis"
      },
      {
        "key": "C",
        "text": "Putusan perdata"
      },
      {
        "key": "D",
        "text": "Pemasyarakatan"
      }
    ],
    "correctKey": "A",
    "explanation": "Dikmas lantas dan pengaturan mencegah kecelakaan serta pelanggaran.",
    "weight": 10
  },
  {
    "id": 564,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #63] Fungsi Reserse terutama berhubungan dengan apa?  A. Penyelidikan dan penyidikan tindak pidana",
    "options": [
      {
        "key": "A",
        "text": "Penyelidikan dan penyidikan tindak pidana"
      },
      {
        "key": "B",
        "text": "Kurikulum sekolah"
      },
      {
        "key": "C",
        "text": "Diplomasi"
      },
      {
        "key": "D",
        "text": "Pajak"
      }
    ],
    "correctKey": "A",
    "explanation": "Reserse menjalankan fungsi penegakan hukum melalui penyelidikan/penyidikan.",
    "weight": 10
  },
  {
    "id": 565,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #64] Fungsi Intelkam mendukung tugas melalui apa?  A. Pengumpulan dan analisis informasi untuk deteksi/peringatan dini",
    "options": [
      {
        "key": "A",
        "text": "Pengumpulan dan analisis informasi untuk deteksi/peringatan dini"
      },
      {
        "key": "B",
        "text": "Putusan pidana"
      },
      {
        "key": "C",
        "text": "Rumah sakit"
      },
      {
        "key": "D",
        "text": "Paspor"
      }
    ],
    "correctKey": "A",
    "explanation": "Intelkam membantu deteksi dini, peringatan dini, dan pengambilan keputusan.",
    "weight": 10
  },
  {
    "id": 566,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #65] Fungsi Samapta antara lain melaksanakan apa?  A. Kegiatan preventif seperti patroli dan penjagaan",
    "options": [
      {
        "key": "A",
        "text": "Kegiatan preventif seperti patroli dan penjagaan"
      },
      {
        "key": "B",
        "text": "Penuntutan"
      },
      {
        "key": "C",
        "text": "Uji UU"
      },
      {
        "key": "D",
        "text": "Pemilu"
      }
    ],
    "correctKey": "A",
    "explanation": "Samapta menjalankan tugas preventif dan pemeliharaan keamanan.",
    "weight": 10
  },
  {
    "id": 567,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #66] Fungsi Binmas menitikberatkan pada apa?  A. Pembinaan masyarakat dan kemitraan",
    "options": [
      {
        "key": "A",
        "text": "Pembinaan masyarakat dan kemitraan"
      },
      {
        "key": "B",
        "text": "Sanksi pidana"
      },
      {
        "key": "C",
        "text": "Putusan hakim"
      },
      {
        "key": "D",
        "text": "Bea cukai"
      }
    ],
    "correctKey": "A",
    "explanation": "Binmas membangun partisipasi dan kemitraan masyarakat dalam menjaga kamtibmas.",
    "weight": 10
  },
  {
    "id": 568,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #67] Identifikasi kepolisian membantu apa?  A. Pengenalan identitas melalui metode ilmiah sesuai kewenangan",
    "options": [
      {
        "key": "A",
        "text": "Pengenalan identitas melalui metode ilmiah sesuai kewenangan"
      },
      {
        "key": "B",
        "text": "Menentukan vonis"
      },
      {
        "key": "C",
        "text": "Menggantikan saksi"
      },
      {
        "key": "D",
        "text": "Menghapus TKP"
      }
    ],
    "correctKey": "A",
    "explanation": "Identifikasi mendukung pengenalan identitas untuk kepentingan tugas.",
    "weight": 10
  },
  {
    "id": 569,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #68] Laboratorium forensik berperan dalam apa?  A. Pemeriksaan ilmiah barang bukti",
    "options": [
      {
        "key": "A",
        "text": "Pemeriksaan ilmiah barang bukti"
      },
      {
        "key": "B",
        "text": "Penetapan hukuman"
      },
      {
        "key": "C",
        "text": "Kampanye"
      },
      {
        "key": "D",
        "text": "Pengaturan lantas"
      }
    ],
    "correctKey": "A",
    "explanation": "Labfor membantu pemeriksaan ilmiah untuk mendukung pembuktian.",
    "weight": 10
  },
  {
    "id": 570,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #69] Kedokteran kepolisian dapat mendukung apa?  A. Pemeriksaan medis-forensik sesuai kewenangan",
    "options": [
      {
        "key": "A",
        "text": "Pemeriksaan medis-forensik sesuai kewenangan"
      },
      {
        "key": "B",
        "text": "Penetapan UU"
      },
      {
        "key": "C",
        "text": "Penunjukan hakim"
      },
      {
        "key": "D",
        "text": "Penerbitan SIM  SIMULASI TPK SIP — BUKAN SOAL RESMI / BOCORAN SELEKSI POLRI Halaman 13"
      }
    ],
    "correctKey": "A",
    "explanation": "Dokpol memberi dukungan medis dan forensik dalam tugas kepolisian.",
    "weight": 10
  },
  {
    "id": 571,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #70] Kemitraan polisi-masyarakat bertujuan apa?  A. Membangun kepercayaan dan pemecahan masalah kamtibmas bersama",
    "options": [
      {
        "key": "A",
        "text": "Membangun kepercayaan dan pemecahan masalah kamtibmas bersama"
      },
      {
        "key": "B",
        "text": "Mengalihkan semua tanggung jawab"
      },
      {
        "key": "C",
        "text": "Membentuk kelompok kebal hukum"
      },
      {
        "key": "D",
        "text": "Membatasi pelaporan"
      }
    ],
    "correctKey": "A",
    "explanation": "Pemolisian masyarakat mendorong kolaborasi, kepercayaan, dan pencegahan.",
    "weight": 10
  },
  {
    "id": 572,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #71] Kepemimpinan berintegritas ditunjukkan dengan apa?  A. Memberi teladan dan bertanggung jawab",
    "options": [
      {
        "key": "A",
        "text": "Memberi teladan dan bertanggung jawab"
      },
      {
        "key": "B",
        "text": "Menghindari tanggung jawab"
      },
      {
        "key": "C",
        "text": "Kedekatan pribadi"
      },
      {
        "key": "D",
        "text": "Mengubah laporan"
      }
    ],
    "correctKey": "A",
    "explanation": "Pemimpin berintegritas memberi contoh, adil, dan bertanggung jawab.",
    "weight": 10
  },
  {
    "id": 573,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #72] Delegasi tugas yang baik harus disertai apa?  A. Tujuan, kewenangan, tanggung jawab, pengawasan",
    "options": [
      {
        "key": "A",
        "text": "Tujuan, kewenangan, tanggung jawab, pengawasan"
      },
      {
        "key": "B",
        "text": "Instruksi samar"
      },
      {
        "key": "C",
        "text": "Lepas tanggung jawab"
      },
      {
        "key": "D",
        "text": "Tanpa evaluasi"
      }
    ],
    "correctKey": "A",
    "explanation": "Delegasi efektif jelas dan disertai pengendalian serta akuntabilitas.",
    "weight": 10
  },
  {
    "id": 574,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #73] Saat menerima informasi belum terverifikasi, pimpinan sebaiknya?  A. Menyebarkan",
    "options": [
      {
        "key": "A",
        "text": "Menyebarkan"
      },
      {
        "key": "B",
        "text": "Memeriksa sumber dan memverifikasi"
      },
      {
        "key": "C",
        "text": "Menganggap pasti benar"
      },
      {
        "key": "D",
        "text": "Menghapus catatan"
      }
    ],
    "correctKey": "B",
    "explanation": "Keputusan yang baik memerlukan data valid dan verifikasi.",
    "weight": 10
  },
  {
    "id": 575,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #74] Dalam situasi darurat, prioritas pertama petugas adalah?  A. Keselamatan jiwa dan pengendalian risiko",
    "options": [
      {
        "key": "A",
        "text": "Keselamatan jiwa dan pengendalian risiko"
      },
      {
        "key": "B",
        "text": "Media sosial"
      },
      {
        "key": "C",
        "text": "Popularitas"
      },
      {
        "key": "D",
        "text": "Menghindari koordinasi"
      }
    ],
    "correctKey": "A",
    "explanation": "Keselamatan manusia merupakan prioritas utama respons darurat.",
    "weight": 10
  },
  {
    "id": 576,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #75] Pelayanan berorientasi masyarakat berarti?  A. Responsif, mudah diakses, adil, informatif",
    "options": [
      {
        "key": "A",
        "text": "Responsif, mudah diakses, adil, informatif"
      },
      {
        "key": "B",
        "text": "Cepat hanya untuk kerabat"
      },
      {
        "key": "C",
        "text": "Menutup prosedur"
      },
      {
        "key": "D",
        "text": "Pungutan ilegal"
      }
    ],
    "correctKey": "A",
    "explanation": "Pelayanan publik berkualitas memenuhi kebutuhan masyarakat dalam koridor hukum.",
    "weight": 10
  },
  {
    "id": 577,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #76] Pengawasan melekat atasan bertujuan apa?  A. Memastikan tugas sesuai aturan dan memperbaiki penyimpangan",
    "options": [
      {
        "key": "A",
        "text": "Memastikan tugas sesuai aturan dan memperbaiki penyimpangan"
      },
      {
        "key": "B",
        "text": "Menakuti bawahan"
      },
      {
        "key": "C",
        "text": "Menghapus audit"
      },
      {
        "key": "D",
        "text": "Menutup laporan"
      }
    ],
    "correctKey": "A",
    "explanation": "Pengawasan memastikan kepatuhan, kualitas, dan perbaikan kinerja.",
    "weight": 10
  },
  {
    "id": 578,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #77] Evaluasi setelah operasi berguna untuk apa?  A. Mengidentifikasi hasil, kendala, dan perbaikan",
    "options": [
      {
        "key": "A",
        "text": "Mengidentifikasi hasil, kendala, dan perbaikan"
      },
      {
        "key": "B",
        "text": "Mencari kambing hitam"
      },
      {
        "key": "C",
        "text": "Menyembunyikan kesalahan"
      },
      {
        "key": "D",
        "text": "Menghindari belajar"
      }
    ],
    "correctKey": "A",
    "explanation": "Evaluasi menjadi dasar pembelajaran dan peningkatan kinerja.",
    "weight": 10
  },
  {
    "id": 579,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #78] Dalam konflik internal tim, pemimpin sebaiknya?  A. Mendengar pihak, memeriksa fakta, menyelesaikan adil",
    "options": [
      {
        "key": "A",
        "text": "Mendengar pihak, memeriksa fakta, menyelesaikan adil"
      },
      {
        "key": "B",
        "text": "Menghukum sepihak"
      },
      {
        "key": "C",
        "text": "Membiarkan"
      },
      {
        "key": "D",
        "text": "Menyebarkan isu  SIMULASI TPK SIP — BUKAN SOAL RESMI / BOCORAN SELEKSI POLRI Halaman 14"
      }
    ],
    "correctKey": "A",
    "explanation": "Penyelesaian adil memerlukan komunikasi, fakta, dan prosedur.",
    "weight": 10
  },
  {
    "id": 580,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #79] Indikator pelayanan baik antara lain?  A. Kepastian prosedur, waktu, keterbukaan, kepuasan pengguna",
    "options": [
      {
        "key": "A",
        "text": "Kepastian prosedur, waktu, keterbukaan, kepuasan pengguna"
      },
      {
        "key": "B",
        "text": "Pungutan"
      },
      {
        "key": "C",
        "text": "Warga takut mengadu"
      },
      {
        "key": "D",
        "text": "Prosedur berubah-ubah"
      }
    ],
    "correctKey": "A",
    "explanation": "Mutu layanan dinilai dari standar, kepastian, akuntabilitas, pengalaman pengguna.",
    "weight": 10
  },
  {
    "id": 581,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #80] Perwira menerima kritik valid dari anggota. Sikap terbaik?  A. Menolak karena pangkat",
    "options": [
      {
        "key": "A",
        "text": "Menolak karena pangkat"
      },
      {
        "key": "B",
        "text": "Menilai substansi dan memperbaiki bila perlu"
      },
      {
        "key": "C",
        "text": "Mengintimidasi"
      },
      {
        "key": "D",
        "text": "Menghapus bukti  SIMULASI TPK SIP — BUKAN SOAL RESMI / BOCORAN SELEKSI POLRI Halaman 15"
      }
    ],
    "correctKey": "B",
    "explanation": "Pemimpin terbuka menerima masukan relevan untuk perbaikan.",
    "weight": 10
  },
  {
    "id": 582,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #81] Rekan memakai kendaraan dinas untuk kepentingan pribadi yang dilarang. Respons?  A. Mengabaikan",
    "options": [
      {
        "key": "A",
        "text": "Mengabaikan"
      },
      {
        "key": "B",
        "text": "Mengingatkan sesuai kewenangan dan melapor melalui jalur benar"
      },
      {
        "key": "C",
        "text": "Ikut memakai"
      },
      {
        "key": "D",
        "text": "Meminta imbalan"
      }
    ],
    "correctKey": "B",
    "explanation": "Penyimpangan ditangani proporsional melalui mekanisme sah.",
    "weight": 10
  },
  {
    "id": 583,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #82] Di TKP kecelakaan, kerumunan menghalangi ambulans. Prioritas?  A. Membiarkan",
    "options": [
      {
        "key": "A",
        "text": "Membiarkan"
      },
      {
        "key": "B",
        "text": "Mengamankan akses pertolongan dan mengatur kerumunan"
      },
      {
        "key": "C",
        "text": "Memarahi korban"
      },
      {
        "key": "D",
        "text": "Memindahkan barang tanpa catatan"
      }
    ],
    "correctKey": "B",
    "explanation": "Pertolongan korban dan akses darurat harus diprioritaskan.",
    "weight": 10
  },
  {
    "id": 584,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #83] Pelapor meminta kepastian terlapor langsung ditahan. Petugas sebaiknya?  A. Menjanjikan penahanan",
    "options": [
      {
        "key": "A",
        "text": "Menjanjikan penahanan"
      },
      {
        "key": "B",
        "text": "Menjelaskan tindakan bergantung syarat hukum dan fakta"
      },
      {
        "key": "C",
        "text": "Menyuruh ke media"
      },
      {
        "key": "D",
        "text": "Menolak laporan"
      }
    ],
    "correctKey": "B",
    "explanation": "Petugas tidak boleh menjanjikan tindakan paksa sebelum syarat hukum terpenuhi.",
    "weight": 10
  },
  {
    "id": 585,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #84] Atasan meminta bawahan mengubah fakta laporan. Bawahan sebaiknya?  A. Menuruti",
    "options": [
      {
        "key": "A",
        "text": "Menuruti"
      },
      {
        "key": "B",
        "text": "Menolak profesional dan gunakan mekanisme pelaporan"
      },
      {
        "key": "C",
        "text": "Menghapus dokumen"
      },
      {
        "key": "D",
        "text": "Membuat laporan palsu"
      }
    ],
    "correctKey": "B",
    "explanation": "Akurasi laporan merupakan bagian integritas dan akuntabilitas.",
    "weight": 10
  },
  {
    "id": 586,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #85] Informasi intelijen berbeda dengan temuan lapangan. Langkah tepat?  A. Mengabaikan salah satunya",
    "options": [
      {
        "key": "A",
        "text": "Mengabaikan salah satunya"
      },
      {
        "key": "B",
        "text": "Verifikasi, nilai reliabilitas, perbarui rencana"
      },
      {
        "key": "C",
        "text": "Memaksakan rencana lama"
      },
      {
        "key": "D",
        "text": "Sebarkan informasi mentah"
      }
    ],
    "correctKey": "B",
    "explanation": "Keputusan operasional harus adaptif dan berbasis verifikasi.  SIMULASI TPK SIP — BUKAN SOAL RESMI / BOCORAN SELEKSI POLRI Halaman 22",
    "weight": 10
  },
  {
    "id": 587,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #86] Korban takut memberi keterangan. Petugas sebaiknya?  A. Mengintimidasi",
    "options": [
      {
        "key": "A",
        "text": "Mengintimidasi"
      },
      {
        "key": "B",
        "text": "Ciptakan suasana aman, jelaskan hak/prosedur, perhatikan kebutuhan"
      },
      {
        "key": "C",
        "text": "Menyalahkan"
      },
      {
        "key": "D",
        "text": "Sebarkan rekaman"
      }
    ],
    "correctKey": "B",
    "explanation": "Pendekatan berperspektif korban membantu keterangan tanpa tekanan.",
    "weight": 10
  },
  {
    "id": 588,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #87] Saat menerima pengaduan diskriminasi, petugas harus?  A. Berdasar prasangka",
    "options": [
      {
        "key": "A",
        "text": "Berdasar prasangka"
      },
      {
        "key": "B",
        "text": "Melayani setara, mencatat fakta, tindak lanjuti"
      },
      {
        "key": "C",
        "text": "Menolak"
      },
      {
        "key": "D",
        "text": "Memaksa berdamai"
      }
    ],
    "correctKey": "B",
    "explanation": "Prinsip nondiskriminasi dan pelayanan setara berlaku bagi semua.",
    "weight": 10
  },
  {
    "id": 589,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #88] Jika terjadi kesalahan prosedur, langkah tepat?  A. Menutupinya",
    "options": [
      {
        "key": "A",
        "text": "Menutupinya"
      },
      {
        "key": "B",
        "text": "Hentikan dampak, laporkan, evaluasi, perbaiki sesuai aturan"
      },
      {
        "key": "C",
        "text": "Salahkan warga"
      },
      {
        "key": "D",
        "text": "Hilangkan dokumen"
      }
    ],
    "correctKey": "B",
    "explanation": "Transparansi dan tindakan korektif mencegah kerugian lebih lanjut.",
    "weight": 10
  },
  {
    "id": 590,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #89] Saat tekanan massa meningkat, komandan lapangan harus?  A. Instruksi jelas, komunikasi, nilai ancaman, deeskalasi",
    "options": [
      {
        "key": "A",
        "text": "Instruksi jelas, komunikasi, nilai ancaman, deeskalasi"
      },
      {
        "key": "B",
        "text": "Tindakan tanpa batas"
      },
      {
        "key": "C",
        "text": "Abaikan keselamatan"
      },
      {
        "key": "D",
        "text": "Biarkan anggota sendiri  SIMULASI TPK SIP — BUKAN SOAL RESMI / BOCORAN SELEKSI POLRI Halaman 16"
      }
    ],
    "correctKey": "A",
    "explanation": "Komando jelas dan deeskalasi mengurangi risiko salah tindakan.",
    "weight": 10
  },
  {
    "id": 591,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #90] Keputusan tepat ketika data belum cukup adalah?  A. Membuat kesimpulan pasti",
    "options": [
      {
        "key": "A",
        "text": "Membuat kesimpulan pasti"
      },
      {
        "key": "B",
        "text": "Kumpulkan informasi dan ambil langkah sementara yang aman"
      },
      {
        "key": "C",
        "text": "Ikuti rumor"
      },
      {
        "key": "D",
        "text": "Hukum pihak termudah"
      }
    ],
    "correctKey": "B",
    "explanation": "Keputusan profesional mengakui keterbatasan data dan menghindari kesimpulan prematur.",
    "weight": 10
  },
  {
    "id": 592,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #91] Akronim PRESISI dikenal sebagai apa?  A. Prediktif, Responsibilitas, Transparansi Berkeadilan",
    "options": [
      {
        "key": "A",
        "text": "Prediktif, Responsibilitas, Transparansi Berkeadilan"
      },
      {
        "key": "B",
        "text": "Preventif, Rahasia, Tertutup, Independen"
      },
      {
        "key": "C",
        "text": "Profesional, Rahasia, Sentralistik"
      },
      {
        "key": "D",
        "text": "Proaktif, Resmi, Sistematis, Integratif"
      }
    ],
    "correctKey": "A",
    "explanation": "PRESISI merupakan singkatan Prediktif, Responsibilitas, dan Transparansi Berkeadilan.",
    "weight": 10
  },
  {
    "id": 593,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #92] Pemolisian prediktif menekankan apa?  A. Data dan analisis untuk mengantisipasi gangguan",
    "options": [
      {
        "key": "A",
        "text": "Data dan analisis untuk mengantisipasi gangguan"
      },
      {
        "key": "B",
        "text": "Tindakan setelah kerugian"
      },
      {
        "key": "C",
        "text": "Rumor"
      },
      {
        "key": "D",
        "text": "Mengabaikan evaluasi"
      }
    ],
    "correctKey": "A",
    "explanation": "Pendekatan prediktif memakai analisis untuk deteksi dan pencegahan.",
    "weight": 10
  },
  {
    "id": 594,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #93] Transparansi berkeadilan berarti apa?  A. Semua informasi dibuka tanpa batas",
    "options": [
      {
        "key": "A",
        "text": "Semua informasi dibuka tanpa batas"
      },
      {
        "key": "B",
        "text": "Keterbukaan akuntabel dengan menghormati hukum dan hak"
      },
      {
        "key": "C",
        "text": "Menutup semua informasi"
      },
      {
        "key": "D",
        "text": "Mengutamakan orang berpengaruh"
      }
    ],
    "correctKey": "B",
    "explanation": "Transparansi seimbang dengan perlindungan data, proses hukum, dan kepentingan sah.",
    "weight": 10
  },
  {
    "id": 595,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #94] Responsibilitas dalam pelayanan menekankan apa?  A. Tanggung jawab atas tugas, keputusan, dampak",
    "options": [
      {
        "key": "A",
        "text": "Tanggung jawab atas tugas, keputusan, dampak"
      },
      {
        "key": "B",
        "text": "Kebebasan tanpa evaluasi"
      },
      {
        "key": "C",
        "text": "Pengalihan kesalahan"
      },
      {
        "key": "D",
        "text": "Tanpa standar"
      }
    ],
    "correctKey": "A",
    "explanation": "Responsibilitas berarti pelaksanaan tugas secara bertanggung jawab.",
    "weight": 10
  },
  {
    "id": 596,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #95] Kepercayaan publik terhadap Polri dibangun melalui apa?  A. Kinerja profesional, integritas, keadilan, pelayanan baik",
    "options": [
      {
        "key": "A",
        "text": "Kinerja profesional, integritas, keadilan, pelayanan baik"
      },
      {
        "key": "B",
        "text": "Pencitraan saja"
      },
      {
        "key": "C",
        "text": "Pembatasan pengaduan"
      },
      {
        "key": "D",
        "text": "Perlakuan istimewa"
      }
    ],
    "correctKey": "A",
    "explanation": "Kepercayaan tumbuh dari pengalaman nyata masyarakat atas layanan dan penegakan hukum.",
    "weight": 10
  },
  {
    "id": 597,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #96] Koordinasi lintas instansi diperlukan karena apa?  A. Masalah publik memerlukan kewenangan dan keahlian beberapa lembaga",
    "options": [
      {
        "key": "A",
        "text": "Masalah publik memerlukan kewenangan dan keahlian beberapa lembaga"
      },
      {
        "key": "B",
        "text": "Polri tak punya tugas"
      },
      {
        "key": "C",
        "text": "Semua lembaga identik"
      },
      {
        "key": "D",
        "text": "Menghilangkan tanggung jawab"
      }
    ],
    "correctKey": "A",
    "explanation": "Koordinasi mencegah tumpang tindih dan meningkatkan efektivitas.",
    "weight": 10
  },
  {
    "id": 598,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #97] Dalam penggunaan media sosial anggota perlu menjaga apa?  A. Sebar data perkara kapan saja",
    "options": [
      {
        "key": "A",
        "text": "Sebar data perkara kapan saja"
      },
      {
        "key": "B",
        "text": "Etika, kerahasiaan dinas, akurasi, nama baik"
      },
      {
        "key": "C",
        "text": "Unggah identitas korban"
      },
      {
        "key": "D",
        "text": "Berdebat dengan pelapor"
      }
    ],
    "correctKey": "B",
    "explanation": "Media sosial harus digunakan bertanggung jawab dan tidak melanggar aturan/privasi.",
    "weight": 10
  },
  {
    "id": 599,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #98] Data pribadi korban/saksi sebaiknya bagaimana?  A. Disebar demi transparansi",
    "options": [
      {
        "key": "A",
        "text": "Disebar demi transparansi"
      },
      {
        "key": "B",
        "text": "Dilindungi dan digunakan sesuai dasar hukum/kebutuhan tugas"
      },
      {
        "key": "C",
        "text": "Dikirim grup umum"
      },
      {
        "key": "D",
        "text": "Dipakai pribadi  SIMULASI TPK SIP — BUKAN SOAL RESMI / BOCORAN SELEKSI POLRI Halaman 17"
      }
    ],
    "correctKey": "B",
    "explanation": "Perlindungan data dan privasi bagian dari penghormatan hak.",
    "weight": 10
  },
  {
    "id": 600,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi #99] Profesionalisme anggota menuntut kompetensi yang bagaimana?  A. Dipelihara melalui pendidikan, latihan, evaluasi",
    "options": [
      {
        "key": "A",
        "text": "Dipelihara melalui pendidikan, latihan, evaluasi"
      },
      {
        "key": "B",
        "text": "Tidak diperbarui"
      },
      {
        "key": "C",
        "text": "Hanya senioritas"
      },
      {
        "key": "D",
        "text": "Popularitas"
      }
    ],
    "correctKey": "A",
    "explanation": "Kompetensi harus terus dikembangkan agar sesuai tantangan dan hukum terbaru.",
    "weight": 10
  }
];


export const SIMULATION_PACKETS: SimPacket[] = [
  {
    id: 'psikotes-all',
    category: 'PSIKOTES',
    subtest: 'ALL',
    title: 'Pretest CAT Psikotes — Semua Subtes (Campuran)',
    subtitle: 'Kecerdasan (100 Soal), Mental Kepribadian (100 Soal), dan Kecermatan (100 Soal)',
    description:
      'Latihan komprehensif 3 pilar psikotes standar CAT Polri (100 Kecerdasan, 100 Kepribadian, 100 Kecermatan = Total 300 Butir). Dilengkapi sistem pembobotan khusus, jeda waktu antar-subtes, dan ulasan komprehensif.',
    badge: '300 Soal • Paket Utama Psikotes',
    durationSeconds: (90 + 60 + 5) * 60,
    questions: [...QUESTIONS_KECERDASAN, ...QUESTIONS_KEPRIBADIAN, ...QUESTIONS_KECERMATAN],
  },
  {
    id: 'psikotes-kecerdasan',
    category: 'PSIKOTES',
    subtest: 'KECERDASAN',
    title: 'Pretest CAT Psikotes — Subtes Kecerdasan',
    subtitle: '100 Soal • 90 Menit • Verbal, Numerik, Deret, Logika Alibi & Spasial',
    description:
      '100 butir soal kecerdasan standar seleksi Polri mencakup analogi verbal, logika penyidikan, deret aritmatika patroli, denah wilayah tugas, dan penalaran analitis.',
    badge: '100 Soal • 90 Menit',
    durationSeconds: 90 * 60,
    questions: QUESTIONS_KECERDASAN,
  },
  {
    id: 'psikotes-kepribadian',
    category: 'PSIKOTES',
    subtest: 'KEPRIBADIAN',
    title: 'Pretest CAT Psikotes — Subtes Mental Kepribadian',
    subtitle: '100 Soal • 60 Menit • Studi Kasus Kedinasan Polri (SJT & Skala Bobot 1–5)',
    description:
      '100 studi kasus situasional kedinasan kepolisian (SJT), integritas anti-gratifikasi, pengendalian emosi, dan etika kepemimpinan. Setiap jawaban dinilai dengan skala bobot profesi 1–5.',
    badge: '100 Soal • 60 Menit',
    durationSeconds: 60 * 60,
    questions: QUESTIONS_KEPRIBADIAN,
  },
  {
    id: 'psikotes-kecermatan',
    category: 'PSIKOTES',
    subtest: 'KECERMATAN',
    title: 'Pretest CAT Psikotes — Subtes Kecermatan (Format Monokrom)',
    subtitle: '100 Soal • 5 Kolom @ 20 Soal • 1 Menit/Kolom (Angka, Huruf, Simbol & Campuran)',
    description:
      'Latihan kecepatan dan ketelitian format monokrom putih standar CAT Polri (100 soal dalam 5 kolom, 60 detik per kolom). Berpindah otomatis per kolom dengan evaluasi kecepatan, akurasi, dan kestabilan.',
    badge: '100 Soal • 5 Menit',
    durationSeconds: 5 * 60,
    isKecermatanOnly: true,
    columnDurationSeconds: 60,
    questions: QUESTIONS_KECERMATAN,
  },
  {
    id: 'tkk',
    category: 'TKK',
    title: 'Pretest CAT — Tes Kemampuan Komputer (TKK / TKP)',
    subtitle: '100 Soal • 90 Menit • Hardware, Jaringan, OS & Keamanan Siber Polri',
    description:
      '100 soal penguasaan teknologi informasi dan komunikasi untuk seleksi Polri dengan pembahasan mendalam di setiap butir soal.',
    badge: '100 Soal • 90 Menit',
    durationSeconds: 90 * 60,
    questions: QUESTIONS_TKK,
  },
  {
    id: 'tpk',
    category: 'TPK',
    title: 'Pretest CAT — Tes Pengetahuan Kepolisian (TPK)',
    subtitle: '100 Soal • 60 Menit • UU No. 2/2002, Kode Etik Profesi, KUHAP & Wawasan Kebangsaan',
    description:
      '100 soal regulasi perundang-undangan kepolisian, etika dinas Polri, tupoksi penegakan hukum, serta wawasan kebangsaan RI.',
    badge: '100 Soal • 60 Menit',
    durationSeconds: 60 * 60,
    questions: QUESTIONS_TPK,
  },
  {
    id: 'cat-all',
    category: 'ALL',
    subtest: 'ALL',
    title: 'Pretest Komprehensif CAT Polri (Seluruh Modul Lulus SIP)',
    subtitle: 'Total 500 Soal: Kecerdasan (100), Kepribadian (100), Kecermatan (100), TKK (100) & TPK (100)',
    description:
      'Simulasi try out komprehensif seluruh materi seleksi CAT Polri lulus SIP dengan rata-rata 100 soal per subtes: Kecerdasan 100 soal, Kepribadian 100 soal, Kecermatan 100 soal, TKK 100 soal, dan TPK 100 soal (Total 500 soal).',
    badge: '500 Soal • Simulasi Lengkap Lulus SIP',
    durationSeconds: (90 + 60 + 5 + 90 + 60) * 60,
    questions: [
      ...QUESTIONS_KECERDASAN,
      ...QUESTIONS_KEPRIBADIAN,
      ...QUESTIONS_KECERMATAN,
      ...QUESTIONS_TKK,
      ...QUESTIONS_TPK,
    ],
  },
];
