/**
 * Bank Soal & Konfigurasi Paket Pretest CAT Polri (Seleksi SIP / Akpol / Bintara)
 * Diperbarui sesuai standar CAT Polri:
 * 1. Kecerdasan: Logika Spasial/Figural, Denah Wilayah, Aritmatika Dasar, dan Silogisme/Verbal
 * 2. Kepribadian: Studi Kasus Realistis Lingkungan Kedinasan Polri (SJT & Skala Bobot Jawaban)
 * 3. Kecermatan: Format Monokrom CAT (Angka Hilang, Huruf Hilang, Simbol Hilang, dan Campuran)
 * 4. TKK & TPK: Kompetensi Komputer dan Regulasi Kedinasan Kepolisian
 */

export interface SimOption {
  key: string;
  text: string;
  weight?: number; // bobot nilai jawaban untuk opsi ini (1-5 pada kepribadian)
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
  weight?: number; // bobot butir soal (misal 10 poin)
  optionWeights?: Record<string, number>; // bobot tiap pilihan jawaban A-E
  dimension?: string; // dimensi kepribadian atau bidang materi
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
/* 1. KUMPULAN SOAL KECERDASAN (40 Butir: Figural, Denah, Aritmatika, Logika) */
/* -------------------------------------------------------------------------- */
const QUESTIONS_KECERDASAN: SimQuestion[] = [
  {
    "id": 101,
    "module": "Tes Psikologi — Kecerdasan (Logika Spasial & Figural)",
    "subtest": "KECERDASAN",
    "stem": "Soal Nomor 1 [Analogi]: Perhatikan hubungan antara Bentuk A dan Bentuk B. Carilah hubungan yang setara untuk Bentuk C terhadap salah satu pilihan jawaban.",
    "image": "/images/questions/figural_q_1.png",
    "options": [
      {
        "key": "A",
        "text": "Bentuk Lingkaran sempurna"
      },
      {
        "key": "B",
        "text": "Segitiga sama sisi"
      },
      {
        "key": "C",
        "text": "Persegi bertumpuk"
      },
      {
        "key": "D",
        "text": "Segi lima beraturan"
      },
      {
        "key": "E",
        "text": "Segi enam beraturan"
      }
    ],
    "correctKey": "A",
    "explanation": "Penjelasan: Pada seri analogi nomor 1, Bentuk A mengalami perubahan/transformasi geometri tertentu untuk menjadi Bentuk B. Berdasarkan aturan yang sama, Bentuk C jika ditransformasikan dengan pola serupa akan menghasilkan bentuk yang terdapat pada opsi **(A)**.",
    "weight": 10
  },
  {
    "id": 102,
    "module": "Tes Psikologi — Kecerdasan (Logika Spasial & Figural)",
    "subtest": "KECERDASAN",
    "stem": "Soal Nomor 2 [Serial]: Amati urutan perubahan dari Pola 1 hingga Pola 4. Tentukan gambar selanjutnya (Pola 5) yang melengkapi deret figural tersebut.",
    "image": "/images/questions/figural_q_2.png",
    "options": [
      {
        "key": "A",
        "text": "Gambar A"
      },
      {
        "key": "B",
        "text": "Gambar B"
      },
      {
        "key": "C",
        "text": "Gambar C"
      },
      {
        "key": "D",
        "text": "Gambar D"
      },
      {
        "key": "E",
        "text": "Gambar E"
      }
    ],
    "correctKey": "D",
    "explanation": "Penjelasan: Perubahan dari Pola 1 hingga Pola 4 menunjukkan rotasi dan penambahan elemen berulang secara berurutan. Mengikuti urutan inkremental tersebut, Pola 5 yang tepat adalah **(D)**.",
    "weight": 10
  },
  {
    "id": 103,
    "module": "Tes Psikologi — Kecerdasan (Logika Spasial & Figural)",
    "subtest": "KECERDASAN",
    "stem": "Soal Nomor 3 [Ketidaksamaan]: Di antara kelima pilihan gambar (A, B, C, D, E), terdapat satu gambar yang tidak mengikuti pola kelompoknya (berbeda sendiri). Pilihlah gambar tersebut.",
    "image": "/images/questions/figural_q_3.png",
    "options": [
      {
        "key": "A",
        "text": "Pola penambahan 1 garis diagonal"
      },
      {
        "key": "B",
        "text": "Rotasi 45° berlawanan jarum jam"
      },
      {
        "key": "C",
        "text": "Pengurangan elemen interior"
      },
      {
        "key": "D",
        "text": "Penggabungan dua bentuk dasar"
      },
      {
        "key": "E",
        "text": "Pencerminan horizontal"
      }
    ],
    "correctKey": "B",
    "explanation": "Penjelasan: Empat dari lima opsi memiliki simetri dan jumlah elemen interior yang konisten, sedangkan opsi **(B)** memiliki struktur yang tidak sesuai dengan kaidah kelompoknya.",
    "weight": 10
  },
  {
    "id": 104,
    "module": "Tes Psikologi — Kecerdasan (Logika Spasial & Figural)",
    "subtest": "KECERDASAN",
    "stem": "Soal Nomor 4 [Diagram]: Amati matriks 3x3 di bawah ini. Tentukan bentuk yang paling tepat untuk mengisi sel berlabel tanda tanya (?) sesuai konsistensi baris dan kolom.",
    "image": "/images/questions/figural_q_4.png",
    "options": [
      {
        "key": "A",
        "text": "Rotasi 90° searah jarum jam"
      },
      {
        "key": "B",
        "text": "Rotasi 180°"
      },
      {
        "key": "C",
        "text": "Refleksi vertikal"
      },
      {
        "key": "D",
        "text": "Perbesaran 2x"
      },
      {
        "key": "E",
        "text": "Inversi warna"
      }
    ],
    "correctKey": "E",
    "explanation": "Penjelasan: Secara horizontal (baris) dan vertikal (kolom), elemen figural bertambah dan berganti selang-seling. Opsi yang memenuhi kombinasi logika matriks tersebut adalah **(E)**.",
    "weight": 10
  },
  {
    "id": 105,
    "module": "Tes Psikologi — Kecerdasan (Logika Spasial & Figural)",
    "subtest": "KECERDASAN",
    "stem": "Soal Nomor 5 [Analogi]: Perhatikan hubungan antara Bentuk A dan Bentuk B. Carilah hubungan yang setara untuk Bentuk C terhadap salah satu pilihan jawaban.",
    "image": "/images/questions/figural_q_5.png",
    "options": [
      {
        "key": "A",
        "text": "Bentuk Lingkaran sempurna"
      },
      {
        "key": "B",
        "text": "Segitiga sama sisi"
      },
      {
        "key": "C",
        "text": "Persegi bertumpuk"
      },
      {
        "key": "D",
        "text": "Segi lima beraturan"
      },
      {
        "key": "E",
        "text": "Segi enam beraturan"
      }
    ],
    "correctKey": "C",
    "explanation": "Penjelasan: Pada seri analogi nomor 5, Bentuk A mengalami perubahan/transformasi geometri tertentu untuk menjadi Bentuk B. Berdasarkan aturan yang sama, Bentuk C jika ditransformasikan dengan pola serupa akan menghasilkan bentuk yang terdapat pada opsi **(C)**.",
    "weight": 10
  },
  {
    "id": 106,
    "module": "Tes Psikologi — Kecerdasan (Logika Spasial & Figural)",
    "subtest": "KECERDASAN",
    "stem": "Soal Nomor 6 [Serial]: Amati urutan perubahan dari Pola 1 hingga Pola 4. Tentukan gambar selanjutnya (Pola 5) yang melengkapi deret figural tersebut.",
    "image": "/images/questions/figural_q_6.png",
    "options": [
      {
        "key": "A",
        "text": "Gambar A"
      },
      {
        "key": "B",
        "text": "Gambar B"
      },
      {
        "key": "C",
        "text": "Gambar C"
      },
      {
        "key": "D",
        "text": "Gambar D"
      },
      {
        "key": "E",
        "text": "Gambar E"
      }
    ],
    "correctKey": "A",
    "explanation": "Penjelasan: Perubahan dari Pola 1 hingga Pola 4 menunjukkan rotasi dan penambahan elemen berulang secara berurutan. Mengikuti urutan inkremental tersebut, Pola 5 yang tepat adalah **(A)**.",
    "weight": 10
  },
  {
    "id": 107,
    "module": "Tes Psikologi — Kecerdasan (Logika Spasial & Figural)",
    "subtest": "KECERDASAN",
    "stem": "Soal Nomor 7 [Ketidaksamaan]: Di antara kelima pilihan gambar (A, B, C, D, E), terdapat satu gambar yang tidak mengikuti pola kelompoknya (berbeda sendiri). Pilihlah gambar tersebut.",
    "image": "/images/questions/figural_q_7.png",
    "options": [
      {
        "key": "A",
        "text": "Pola penambahan 1 garis diagonal"
      },
      {
        "key": "B",
        "text": "Rotasi 45° berlawanan jarum jam"
      },
      {
        "key": "C",
        "text": "Pengurangan elemen interior"
      },
      {
        "key": "D",
        "text": "Penggabungan dua bentuk dasar"
      },
      {
        "key": "E",
        "text": "Pencerminan horizontal"
      }
    ],
    "correctKey": "D",
    "explanation": "Penjelasan: Empat dari lima opsi memiliki simetri dan jumlah elemen interior yang konisten, sedangkan opsi **(D)** memiliki struktur yang tidak sesuai dengan kaidah kelompoknya.",
    "weight": 10
  },
  {
    "id": 108,
    "module": "Tes Psikologi — Kecerdasan (Logika Spasial & Figural)",
    "subtest": "KECERDASAN",
    "stem": "Soal Nomor 8 [Diagram]: Amati matriks 3x3 di bawah ini. Tentukan bentuk yang paling tepat untuk mengisi sel berlabel tanda tanya (?) sesuai konsistensi baris dan kolom.",
    "image": "/images/questions/figural_q_4.png",
    "options": [
      {
        "key": "A",
        "text": "Rotasi 90° searah jarum jam"
      },
      {
        "key": "B",
        "text": "Rotasi 180°"
      },
      {
        "key": "C",
        "text": "Refleksi vertikal"
      },
      {
        "key": "D",
        "text": "Perbesaran 2x"
      },
      {
        "key": "E",
        "text": "Inversi warna"
      }
    ],
    "correctKey": "B",
    "explanation": "Penjelasan: Secara horizontal (baris) dan vertikal (kolom), elemen figural bertambah dan berganti selang-seling. Opsi yang memenuhi kombinasi logika matriks tersebut adalah **(B)**.",
    "weight": 10
  },
  {
    "id": 109,
    "module": "Tes Psikologi — Kecerdasan (Logika Spasial & Figural)",
    "subtest": "KECERDASAN",
    "stem": "Soal Nomor 9 [Analogi]: Perhatikan hubungan antara Bentuk A dan Bentuk B. Carilah hubungan yang setara untuk Bentuk C terhadap salah satu pilihan jawaban.",
    "image": "/images/questions/figural_q_8.png",
    "options": [
      {
        "key": "A",
        "text": "Bentuk Lingkaran sempurna"
      },
      {
        "key": "B",
        "text": "Segitiga sama sisi"
      },
      {
        "key": "C",
        "text": "Persegi bertumpuk"
      },
      {
        "key": "D",
        "text": "Segi lima beraturan"
      },
      {
        "key": "E",
        "text": "Segi enam beraturan"
      }
    ],
    "correctKey": "E",
    "explanation": "Penjelasan: Pada seri analogi nomor 9, Bentuk A mengalami perubahan/transformasi geometri tertentu untuk menjadi Bentuk B. Berdasarkan aturan yang sama, Bentuk C jika ditransformasikan dengan pola serupa akan menghasilkan bentuk yang terdapat pada opsi **(E)**.",
    "weight": 10
  },
  {
    "id": 110,
    "module": "Tes Psikologi — Kecerdasan (Logika Spasial & Figural)",
    "subtest": "KECERDASAN",
    "stem": "Soal Nomor 10 [Serial]: Amati urutan perubahan dari Pola 1 hingga Pola 4. Tentukan gambar selanjutnya (Pola 5) yang melengkapi deret figural tersebut.",
    "image": "/images/questions/figural_q_9.png",
    "options": [
      {
        "key": "A",
        "text": "Gambar A"
      },
      {
        "key": "B",
        "text": "Gambar B"
      },
      {
        "key": "C",
        "text": "Gambar C"
      },
      {
        "key": "D",
        "text": "Gambar D"
      },
      {
        "key": "E",
        "text": "Gambar E"
      }
    ],
    "correctKey": "C",
    "explanation": "Penjelasan: Perubahan dari Pola 1 hingga Pola 4 menunjukkan rotasi dan penambahan elemen berulang secara berurutan. Mengikuti urutan inkremental tersebut, Pola 5 yang tepat adalah **(C)**.",
    "weight": 10
  },
  {
    "id": 111,
    "module": "Tes Psikologi — Kecerdasan (Penalaran Spasial & Denah Wilayah)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Spasial Denah Wilayah] Berdasarkan denah di atas, bangunan yang berada tepat di sebelah utara R. Budi adalah...",
    "image": "/images/questions/denah_lokasi_sip.png",
    "options": [
      {
        "key": "A",
        "text": "R. Ahmad"
      },
      {
        "key": "B",
        "text": "Kantor Polisi"
      },
      {
        "key": "C",
        "text": "KUA"
      },
      {
        "key": "D",
        "text": "Gd. Serbaguna"
      },
      {
        "key": "E",
        "text": "Balai Desa"
      }
    ],
    "correctKey": "A",
    "explanation": "Soal No. 1 — Jawaban: C\nPembahasan: R. Budi terletak di utara Jln. Kusuma Raya. Di sebelah utara R. Budi (seberang Jln. Madukara ke arah atas) terdapat bangunan KUA.",
    "weight": 10
  },
  {
    "id": 112,
    "module": "Tes Psikologi — Kecerdasan (Penalaran Spasial & Denah Wilayah)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Spasial Denah Wilayah] Bangunan yang terletak di sudut antara Jln. Kusuma Raya dan Jln. Rambutan di sebelah utara jalan adalah...",
    "image": "/images/questions/denah_lokasi_sip.png",
    "options": [
      {
        "key": "A",
        "text": "Gd. Serbaguna"
      },
      {
        "key": "B",
        "text": "Kantor Polisi"
      },
      {
        "key": "C",
        "text": "R. Ahmad"
      },
      {
        "key": "D",
        "text": "KUD"
      },
      {
        "key": "E",
        "text": "R. Budi"
      }
    ],
    "correctKey": "A",
    "explanation": "Soal No. 2 — Jawaban: B\nPembahasan: Kantor Polisi terletak di tepi barat Jln. Kusuma Raya dan berada di sebelah timur Jln. Rambutan (di sebelah utara Jln. Kusuma Raya).",
    "weight": 10
  },
  {
    "id": 113,
    "module": "Tes Psikologi — Kecerdasan (Penalaran Spasial & Denah Wilayah)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Spasial Denah Wilayah] Masjid terletak di sebelah... dari Lapangan.",
    "image": "/images/questions/denah_lokasi_sip.png",
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
        "text": "Utara"
      },
      {
        "key": "D",
        "text": "Selatan"
      },
      {
        "key": "E",
        "text": "Barat Daya"
      }
    ],
    "correctKey": "A",
    "explanation": "Soal No. 3 — Jawaban: B\nPembahasan: Lapangan dibatasi oleh Jln. Merdeka di sebelah timurnya. Di sebelah timur Jln. Merdeka terdapat Masjid. Jadi Masjid berada di sebelah timur Lapangan.",
    "weight": 10
  },
  {
    "id": 114,
    "module": "Tes Psikologi — Kecerdasan (Penalaran Spasial & Denah Wilayah)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Spasial Denah Wilayah] Jika seseorang berada di Balai Desa dan berjalan ke arah barat menyusuri Jln. Kusuma Raya, bangunan pertama di sebelah kanan jalan yang ditemuinya adalah...",
    "image": "/images/questions/denah_lokasi_sip.png",
    "options": [
      {
        "key": "A",
        "text": "R. Sinta"
      },
      {
        "key": "B",
        "text": "KUA"
      },
      {
        "key": "C",
        "text": "R. Andi"
      },
      {
        "key": "D",
        "text": "R. Budi"
      },
      {
        "key": "E",
        "text": "Kantor Polisi"
      }
    ],
    "correctKey": "A",
    "explanation": "Soal No. 4 — Jawaban: C\nPembahasan: Balai Desa terletak di timur Jln. Madukara. Berjalan ke barat melintasi pertigaan Jln. Madukara, di sebelah kanan (utara jalan) akan mendapati R. Andi.",
    "weight": 10
  },
  {
    "id": 115,
    "module": "Tes Psikologi — Kecerdasan (Penalaran Spasial & Denah Wilayah)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Spasial Denah Wilayah] Bangunan yang berada paling selatan pada wilayah yang dibatasi Jln. Pemuda adalah...",
    "image": "/images/questions/denah_lokasi_sip.png",
    "options": [
      {
        "key": "A",
        "text": "R. Bayu"
      },
      {
        "key": "B",
        "text": "Lapangan"
      },
      {
        "key": "C",
        "text": "R. Anita"
      },
      {
        "key": "D",
        "text": "KUD"
      },
      {
        "key": "E",
        "text": "R. Bagas"
      }
    ],
    "correctKey": "A",
    "explanation": "Soal No. 5 — Jawaban: C\nPembahasan: Di sepanjang Jln. Pemuda bagian timur, terdapat R. Bayu di utara dan R. Anita di posisi paling selatan.",
    "weight": 10
  },
  {
    "id": 116,
    "module": "Tes Psikologi — Kecerdasan (Penalaran Spasial & Denah Wilayah)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Spasial Denah Wilayah] Rumah warga yang terletak tepat di sebelah timur Kantor Polisi adalah...",
    "image": "/images/questions/denah_lokasi_sip.png",
    "options": [
      {
        "key": "A",
        "text": "R. Budi"
      },
      {
        "key": "B",
        "text": "R. Ahmad"
      },
      {
        "key": "C",
        "text": "R. Andi"
      },
      {
        "key": "D",
        "text": "R. Sinta"
      },
      {
        "key": "E",
        "text": "R. Sari"
      }
    ],
    "correctKey": "A",
    "explanation": "Soal No. 6 — Jawaban: A\nPembahasan: Berderet di sebelah utara Jln. Kusuma Raya dari barat ke timur: Kantor Polisi, R. Budi, R. Andi. Jadi di sebelah timur Kantor Polisi adalah R. Budi.",
    "weight": 10
  },
  {
    "id": 117,
    "module": "Tes Psikologi — Kecerdasan (Penalaran Spasial & Denah Wilayah)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Spasial Denah Wilayah] Bangunan SD Brlian Jaya terletak di sebelah... Jln. Majapahit.",
    "image": "/images/questions/denah_lokasi_sip.png",
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
    "correctKey": "A",
    "explanation": "Soal No. 7 — Jawaban: B\nPembahasan: SD Brlian Jaya terletak di sisi timur Jln. Majapahit dan di sebelah utara Jln. Kusuma Raya.",
    "weight": 10
  },
  {
    "id": 118,
    "module": "Tes Psikologi — Kecerdasan (Penalaran Spasial & Denah Wilayah)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Spasial Denah Wilayah] Di sebelah selatan R. Budi, dipisahkan oleh Jln. Kusuma Raya, berdiri bangunan...",
    "image": "/images/questions/denah_lokasi_sip.png",
    "options": [
      {
        "key": "A",
        "text": "Gd. Serbaguna"
      },
      {
        "key": "B",
        "text": "R. Ahmad"
      },
      {
        "key": "C",
        "text": "KUD"
      },
      {
        "key": "D",
        "text": "R. Bayu"
      },
      {
        "key": "E",
        "text": "R. Anita"
      }
    ],
    "correctKey": "A",
    "explanation": "Soal No. 8 — Jawaban: B\nPembahasan: R. Budi berada di sisi utara Jln. Kusuma Raya. Tepat di seberang selatannya terdapat R. Ahmad.",
    "weight": 10
  },
  {
    "id": 119,
    "module": "Tes Psikologi — Kecerdasan (Penalaran Spasial & Denah Wilayah)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Spasial Denah Wilayah] Posisi R. Bagas terletak pada sudut persimpangan antara jalan...",
    "image": "/images/questions/denah_lokasi_sip.png",
    "options": [
      {
        "key": "A",
        "text": "Jln. Pemuda dan Jln. Sentosa"
      },
      {
        "key": "B",
        "text": "Jln. Merdeka dan Jln. Sentosa"
      },
      {
        "key": "C",
        "text": "Jln. Majapahit dan Jln. Kusuma Raya"
      },
      {
        "key": "D",
        "text": "Jln. Madukara dan Jln. Kusuma Raya"
      },
      {
        "key": "E",
        "text": "Jln. Rambutan dan Jln. Kusuma Raya"
      }
    ],
    "correctKey": "A",
    "explanation": "Soal No. 9 — Jawaban: B\nPembahasan: R. Bagas terletak di sebelah timur Jln. Merdeka dan di sebelah utara Jln. Sentosa (persimpangan Jln. Merdeka & Sentosa).",
    "weight": 10
  },
  {
    "id": 120,
    "module": "Tes Psikologi — Kecerdasan (Penalaran Spasial & Denah Wilayah)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Spasial Denah Wilayah] Rumah warga yang berdekatan langsung dengan batas utara Balai Desa adalah...",
    "image": "/images/questions/denah_lokasi_sip.png",
    "options": [
      {
        "key": "A",
        "text": "R. Sinta"
      },
      {
        "key": "B",
        "text": "R. Sari"
      },
      {
        "key": "C",
        "text": "R. Andi"
      },
      {
        "key": "D",
        "text": "R. Bayu"
      },
      {
        "key": "E",
        "text": "R. Anita"
      }
    ],
    "correctKey": "A",
    "explanation": "Soal No. 10 — Jawaban: A\nPembahasan: R. Sinta terletak di utara Balai Desa (dipisahkan oleh kawasan permukiman/Jln. Madukara bagian utara).",
    "weight": 10
  },
  {
    "id": 121,
    "module": "Tes Psikologi — Kecerdasan (Aritmatika Dasar & Numerik)",
    "subtest": "KECERDASAN",
    "stem": "[Aritmatika & Penalaran Numerik] Berapakah hasil dari 25% dari 480 dikurangi 120 ÷ 4?",
    "options": [
      {
        "key": "A",
        "text": "90"
      },
      {
        "key": "B",
        "text": "100"
      },
      {
        "key": "C",
        "text": "110"
      },
      {
        "key": "D",
        "text": "120"
      },
      {
        "key": "E",
        "text": "130"
      }
    ],
    "correctKey": "A",
    "explanation": "",
    "weight": 10
  },
  {
    "id": 122,
    "module": "Tes Psikologi — Kecerdasan (Aritmatika Dasar & Numerik)",
    "subtest": "KECERDASAN",
    "stem": "[Aritmatika & Penalaran Numerik] Hitunglah nilai dari (0,75 × 120) + (1/3 × 180).",
    "options": [
      {
        "key": "A",
        "text": "130"
      },
      {
        "key": "B",
        "text": "140"
      },
      {
        "key": "C",
        "text": "150"
      },
      {
        "key": "D",
        "text": "160"
      },
      {
        "key": "E",
        "text": "170"
      }
    ],
    "correctKey": "A",
    "explanation": "",
    "weight": 10
  },
  {
    "id": 123,
    "module": "Tes Psikologi — Kecerdasan (Aritmatika Dasar & Numerik)",
    "subtest": "KECERDASAN",
    "stem": "[Aritmatika & Penalaran Numerik] Nilai dari 15² - 13² + √144 adalah...",
    "options": [
      {
        "key": "A",
        "text": "64"
      },
      {
        "key": "B",
        "text": "68"
      },
      {
        "key": "C",
        "text": "72"
      },
      {
        "key": "D",
        "text": "76"
      },
      {
        "key": "E",
        "text": "80"
      }
    ],
    "correctKey": "A",
    "explanation": "",
    "weight": 10
  },
  {
    "id": 124,
    "module": "Tes Psikologi — Kecerdasan (Aritmatika Dasar & Numerik)",
    "subtest": "KECERDASAN",
    "stem": "[Aritmatika & Penalaran Numerik] Jika 3x + 15 = 45, maka nilai dari 2x - 5 adalah...",
    "options": [
      {
        "key": "A",
        "text": "10"
      },
      {
        "key": "B",
        "text": "15"
      },
      {
        "key": "C",
        "text": "20"
      },
      {
        "key": "D",
        "text": "25"
      },
      {
        "key": "E",
        "text": "30"
      }
    ],
    "correctKey": "A",
    "explanation": "",
    "weight": 10
  },
  {
    "id": 125,
    "module": "Tes Psikologi — Kecerdasan (Aritmatika Dasar & Numerik)",
    "subtest": "KECERDASAN",
    "stem": "[Aritmatika & Penalaran Numerik] Berapakah 33,33% dari 660?",
    "options": [
      {
        "key": "A",
        "text": "200"
      },
      {
        "key": "B",
        "text": "210"
      },
      {
        "key": "C",
        "text": "220"
      },
      {
        "key": "D",
        "text": "230"
      },
      {
        "key": "E",
        "text": "240"
      }
    ],
    "correctKey": "A",
    "explanation": "",
    "weight": 10
  },
  {
    "id": 126,
    "module": "Tes Psikologi — Kecerdasan (Aritmatika Dasar & Numerik)",
    "subtest": "KECERDASAN",
    "stem": "[Aritmatika & Penalaran Numerik] Hasil dari (2/5 + 3/4) × 20 adalah...",
    "options": [
      {
        "key": "A",
        "text": "21"
      },
      {
        "key": "B",
        "text": "22"
      },
      {
        "key": "C",
        "text": "23"
      },
      {
        "key": "D",
        "text": "24"
      },
      {
        "key": "E",
        "text": "25"
      }
    ],
    "correctKey": "A",
    "explanation": "",
    "weight": 10
  },
  {
    "id": 127,
    "module": "Tes Psikologi — Kecerdasan (Aritmatika Dasar & Numerik)",
    "subtest": "KECERDASAN",
    "stem": "[Aritmatika & Penalaran Numerik] Jika p = 6 dan q = 4, berapakah nilai dari (p³ - q³) / (p - q)?",
    "options": [
      {
        "key": "A",
        "text": "68"
      },
      {
        "key": "B",
        "text": "72"
      },
      {
        "key": "C",
        "text": "76"
      },
      {
        "key": "D",
        "text": "80"
      },
      {
        "key": "E",
        "text": "84"
      }
    ],
    "correctKey": "A",
    "explanation": "",
    "weight": 10
  },
  {
    "id": 128,
    "module": "Tes Psikologi — Kecerdasan (Aritmatika Dasar & Numerik)",
    "subtest": "KECERDASAN",
    "stem": "[Aritmatika & Penalaran Numerik] Jika 40% dari suatu bilangan x adalah 160, berapakah 15% dari bilangan x tersebut?",
    "options": [
      {
        "key": "A",
        "text": "40"
      },
      {
        "key": "B",
        "text": "50"
      },
      {
        "key": "C",
        "text": "60"
      },
      {
        "key": "D",
        "text": "70"
      },
      {
        "key": "E",
        "text": "80"
      }
    ],
    "correctKey": "A",
    "explanation": "",
    "weight": 10
  },
  {
    "id": 129,
    "module": "Tes Psikologi — Kecerdasan (Aritmatika Dasar & Numerik)",
    "subtest": "KECERDASAN",
    "stem": "[Aritmatika & Penalaran Numerik] Hitunglah: 144 ÷ 12 × 5 + (18 - 6) × 3",
    "options": [
      {
        "key": "A",
        "text": "84"
      },
      {
        "key": "B",
        "text": "92"
      },
      {
        "key": "C",
        "text": "96"
      },
      {
        "key": "D",
        "text": "102"
      },
      {
        "key": "E",
        "text": "108"
      }
    ],
    "correctKey": "A",
    "explanation": "",
    "weight": 10
  },
  {
    "id": 130,
    "module": "Tes Psikologi — Kecerdasan (Aritmatika Dasar & Numerik)",
    "subtest": "KECERDASAN",
    "stem": "[Aritmatika & Penalaran Numerik] Jika 0,625 × A = 250, berapakah nilai A?",
    "options": [
      {
        "key": "A",
        "text": "350"
      },
      {
        "key": "B",
        "text": "380"
      },
      {
        "key": "C",
        "text": "400"
      },
      {
        "key": "D",
        "text": "420"
      },
      {
        "key": "E",
        "text": "450"
      }
    ],
    "correctKey": "A",
    "explanation": "",
    "weight": 10
  },
  {
    "id": 131,
    "module": "Tes Psikologi — Kecerdasan (Penalaran Verbal & Logis)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Logis] Dokter : Rumah Sakit = Guru : ...",
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
      }
    ],
    "correctKey": "A",
    "explanation": "",
    "weight": 10
  },
  {
    "id": 132,
    "module": "Tes Psikologi — Kecerdasan (Penalaran Verbal & Logis)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Logis] Kompas : Arah = Termometer : ...",
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
      }
    ],
    "correctKey": "A",
    "explanation": "",
    "weight": 10
  },
  {
    "id": 133,
    "module": "Tes Psikologi — Kecerdasan (Penalaran Verbal & Logis)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Logis] Kata yang paling dekat maknanya dengan “cermat” adalah ...",
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
      }
    ],
    "correctKey": "A",
    "explanation": "",
    "weight": 10
  },
  {
    "id": 134,
    "module": "Tes Psikologi — Kecerdasan (Penalaran Verbal & Logis)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Logis] Lawan kata “objektif” adalah ...",
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
      }
    ],
    "correctKey": "A",
    "explanation": "",
    "weight": 10
  },
  {
    "id": 135,
    "module": "Tes Psikologi — Kecerdasan (Penalaran Verbal & Logis)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Logis] Sinonim “integritas” yang paling tepat adalah ...",
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
      }
    ],
    "correctKey": "A",
    "explanation": "",
    "weight": 10
  },
  {
    "id": 136,
    "module": "Tes Psikologi — Kecerdasan (Penalaran Verbal & Logis)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Logis] Buku : Membaca = Makanan : ...",
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
      }
    ],
    "correctKey": "A",
    "explanation": "",
    "weight": 10
  },
  {
    "id": 137,
    "module": "Tes Psikologi — Kecerdasan (Penalaran Verbal & Logis)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Logis] Pilih kata yang tidak sekelompok.",
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
      }
    ],
    "correctKey": "A",
    "explanation": "",
    "weight": 10
  },
  {
    "id": 138,
    "module": "Tes Psikologi — Kecerdasan (Penalaran Verbal & Logis)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Logis] “Semua penyidik adalah anggota Polri. Sebagian anggota Polri bertugas di lalu lintas.” Kesimpulan yang pasti adalah ...",
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
      }
    ],
    "correctKey": "A",
    "explanation": "",
    "weight": 10
  },
  {
    "id": 139,
    "module": "Tes Psikologi — Kecerdasan (Penalaran Verbal & Logis)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Logis] Makna ungkapan “berpikir jernih” adalah ...",
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
      }
    ],
    "correctKey": "A",
    "explanation": "",
    "weight": 10
  },
  {
    "id": 140,
    "module": "Tes Psikologi — Kecerdasan (Penalaran Verbal & Logis)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Logis] Kalimat yang paling efektif adalah ...",
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
    "correctKey": "A",
    "explanation": "",
    "weight": 10
  }
];

/* -------------------------------------------------------------------------- */
/* 2. KUMPULAN SOAL KEPRIBADIAN (20 Butir Studi Kasus Polri)            */
/* -------------------------------------------------------------------------- */
const QUESTIONS_KEPRIBADIAN: SimQuestion[] = [
  {
    "id": 201,
    "module": "Tes Psikologi — Mental Kepribadian (Studi Kasus Lingkungan Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Lingkungan Kepolisian] Anda mengetahui rekan mengubah angka dalam laporan agar hasil unit terlihat baik. Apa langkah paling tepat?",
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
        "weight": 2
      },
      {
        "key": "D",
        "text": "Mengubah angka lain agar seimbang.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 2,
      "D": 1
    },
    "explanation": "Verifikasi, koreksi, dan jalur pelaporan resmi menjaga integritas serta menghindari tuduhan tanpa dasar.",
    "dimension": "Integritas & Etika Profesi Polri"
  },
  {
    "id": 202,
    "module": "Tes Psikologi — Mental Kepribadian (Studi Kasus Lingkungan Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Lingkungan Kepolisian] Seorang kenalan meminta didahulukan dalam pelayanan tanpa alasan yang sah. Anda akan…",
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
      }
    ],
    "correctKey": "C",
    "optionWeights": {
      "A": 3,
      "B": 2,
      "C": 5,
      "D": 1
    },
    "explanation": "Pelayanan harus objektif dan bebas dari perlakuan istimewa yang tidak sah.",
    "dimension": "Integritas & Etika Profesi Polri"
  },
  {
    "id": 203,
    "module": "Tes Psikologi — Mental Kepribadian (Studi Kasus Lingkungan Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Lingkungan Kepolisian] Anda menemukan barang milik warga di ruang pelayanan. Tindakan Anda…",
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
      }
    ],
    "correctKey": "C",
    "optionWeights": {
      "A": 3,
      "B": 2,
      "C": 5,
      "D": 1
    },
    "explanation": "Pencatatan dan mekanisme resmi melindungi pemilik maupun petugas.",
    "dimension": "Integritas & Etika Profesi Polri"
  },
  {
    "id": 204,
    "module": "Tes Psikologi — Mental Kepribadian (Studi Kasus Lingkungan Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Lingkungan Kepolisian] Atasan meminta Anda menyampaikan informasi yang belum terverifikasi sebagai fakta. Anda…",
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
        "weight": 2
      },
      {
        "key": "D",
        "text": "Meneruskan tanpa memberi konteks.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 2,
      "D": 1
    },
    "explanation": "Kejujuran informasi dan komunikasi hormat harus dijaga bersamaan.",
    "dimension": "Integritas & Etika Profesi Polri"
  },
  {
    "id": 205,
    "module": "Tes Psikologi — Mental Kepribadian (Studi Kasus Lingkungan Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Lingkungan Kepolisian] Anda melakukan kesalahan administrasi yang berdampak pada proses kerja. Anda…",
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
        "weight": 2
      },
      {
        "key": "D",
        "text": "Menghapus dokumen terkait.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 2,
      "D": 1
    },
    "explanation": "Akuntabilitas menuntut pengungkapan dan tindakan korektif.",
    "dimension": "Integritas & Etika Profesi Polri"
  },
  {
    "id": 206,
    "module": "Tes Psikologi — Mental Kepribadian (Studi Kasus Lingkungan Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Lingkungan Kepolisian] Rekan menawarkan hadiah dari pihak yang sedang berkepentingan dengan tugas Anda. Anda…",
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
      }
    ],
    "correctKey": "C",
    "optionWeights": {
      "A": 3,
      "B": 2,
      "C": 5,
      "D": 1
    },
    "explanation": "Menjaga independensi dan mengikuti ketentuan gratifikasi mencegah konflik kepentingan.",
    "dimension": "Integritas & Etika Profesi Polri"
  },
  {
    "id": 207,
    "module": "Tes Psikologi — Mental Kepribadian (Studi Kasus Lingkungan Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Lingkungan Kepolisian] Anda diminta membagikan dokumen kedinasan ke grup yang tidak berwenang. Anda…",
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
        "weight": 2
      },
      {
        "key": "D",
        "text": "Meminta orang lain mengirim.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 2,
      "D": 1
    },
    "explanation": "Informasi hanya dibagikan kepada pihak berwenang melalui kanal yang tepat.",
    "dimension": "Integritas & Etika Profesi Polri"
  },
  {
    "id": 208,
    "module": "Tes Psikologi — Mental Kepribadian (Studi Kasus Lingkungan Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Lingkungan Kepolisian] Anda melihat penggunaan kendaraan dinas untuk kepentingan pribadi. Anda…",
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
        "weight": 2
      },
      {
        "key": "D",
        "text": "Ikut menggunakan.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 2,
      "D": 1
    },
    "explanation": "Fakta perlu dipastikan dan penanganan dilakukan secara proporsional melalui jalur resmi.",
    "dimension": "Integritas & Etika Profesi Polri"
  },
  {
    "id": 209,
    "module": "Tes Psikologi — Mental Kepribadian (Studi Kasus Lingkungan Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Lingkungan Kepolisian] Seorang teman meminta Anda menghapus catatan pelanggaran yang sah. Anda…",
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
        "weight": 2
      },
      {
        "key": "D",
        "text": "Mengubah tanggal saja.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 2,
      "D": 1
    },
    "explanation": "Keadilan dan integritas tidak boleh dikalahkan hubungan pribadi.",
    "dimension": "Integritas & Etika Profesi Polri"
  },
  {
    "id": 210,
    "module": "Tes Psikologi — Mental Kepribadian (Studi Kasus Lingkungan Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Lingkungan Kepolisian] Anda menemukan dompet di area kantor tanpa pemilik terlihat. Anda…",
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
        "weight": 2
      },
      {
        "key": "D",
        "text": "Meninggalkannya begitu saja.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 2,
      "D": 1
    },
    "explanation": "Penyerahan tercatat memberi perlindungan dan peluang pengembalian kepada pemilik.\nDisiplin dan tanggung jawab",
    "dimension": "Integritas & Etika Profesi Polri"
  },
  {
    "id": 211,
    "module": "Tes Psikologi — Mental Kepribadian (Studi Kasus Lingkungan Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Lingkungan Kepolisian] Dua tugas penting memiliki tenggat berdekatan. Anda…",
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
        "weight": 2
      },
      {
        "key": "D",
        "text": "Menyerahkan keduanya tanpa koordinasi.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 2,
      "D": 1
    },
    "explanation": "Prioritas berbasis urgensi dan dampak serta komunikasi mencegah keterlambatan.",
    "dimension": "Integritas & Etika Profesi Polri"
  },
  {
    "id": 212,
    "module": "Tes Psikologi — Mental Kepribadian (Studi Kasus Lingkungan Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Lingkungan Kepolisian] Anda terlambat karena kendala perjalanan yang tidak terduga. Anda…",
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
        "weight": 2
      },
      {
        "key": "D",
        "text": "Menyalahkan rekan.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 2,
      "D": 1
    },
    "explanation": "Komunikasi dini dan kejujuran adalah respons yang bertanggung jawab.",
    "dimension": "Integritas & Etika Profesi Polri"
  },
  {
    "id": 213,
    "module": "Tes Psikologi — Mental Kepribadian (Studi Kasus Lingkungan Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Lingkungan Kepolisian] Tugas rutin terasa membosankan. Anda…",
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
        "weight": 2
      },
      {
        "key": "D",
        "text": "Mengabaikannya.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 2,
      "D": 1
    },
    "explanation": "Konsistensi mutu tetap penting pada pekerjaan rutin.",
    "dimension": "Integritas & Etika Profesi Polri"
  },
  {
    "id": 214,
    "module": "Tes Psikologi — Mental Kepribadian (Studi Kasus Lingkungan Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Lingkungan Kepolisian] Anda menerima instruksi yang belum jelas. Anda…",
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
        "weight": 2
      },
      {
        "key": "D",
        "text": "Meminta anggota lain menebak.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 2,
      "D": 1
    },
    "explanation": "Klarifikasi lebih aman daripada asumsi yang berisiko.",
    "dimension": "Integritas & Etika Profesi Polri"
  },
  {
    "id": 215,
    "module": "Tes Psikologi — Mental Kepribadian (Studi Kasus Lingkungan Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Lingkungan Kepolisian] Rekan satu tim tidak menyelesaikan bagian tugasnya. Anda…",
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
        "weight": 2
      },
      {
        "key": "D",
        "text": "Mengambil alih tanpa memberi tahu.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 2,
      "D": 1
    },
    "explanation": "Komunikasi langsung dan penyelesaian bersama menjaga akuntabilitas tim.",
    "dimension": "Integritas & Etika Profesi Polri"
  },
  {
    "id": 216,
    "module": "Tes Psikologi — Mental Kepribadian (Studi Kasus Lingkungan Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Lingkungan Kepolisian] Anda menyadari ada tenggat yang mungkin tidak tercapai. Anda…",
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
        "weight": 2
      },
      {
        "key": "D",
        "text": "Menyalahkan sistem.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 2,
      "D": 1
    },
    "explanation": "Peringatan dini memberi ruang untuk mitigasi.",
    "dimension": "Integritas & Etika Profesi Polri"
  },
  {
    "id": 217,
    "module": "Tes Psikologi — Mental Kepribadian (Studi Kasus Lingkungan Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Lingkungan Kepolisian] Setelah menyelesaikan tugas, Anda memiliki waktu tersisa. Anda…",
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
        "weight": 2
      },
      {
        "key": "D",
        "text": "Pulang tanpa mengikuti ketentuan.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 2,
      "D": 1
    },
    "explanation": "Inisiatif tetap harus sesuai aturan dan kebutuhan unit.",
    "dimension": "Integritas & Etika Profesi Polri"
  },
  {
    "id": 218,
    "module": "Tes Psikologi — Mental Kepribadian (Studi Kasus Lingkungan Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Lingkungan Kepolisian] Anda diminta menggantikan rekan yang berhalangan. Anda…",
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
        "weight": 2
      },
      {
        "key": "D",
        "text": "Mengeluh kepada masyarakat.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 2,
      "D": 1
    },
    "explanation": "Kesediaan membantu perlu disertai pemeriksaan kompetensi dan kewenangan.",
    "dimension": "Integritas & Etika Profesi Polri"
  },
  {
    "id": 219,
    "module": "Tes Psikologi — Mental Kepribadian (Studi Kasus Lingkungan Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Lingkungan Kepolisian] Dokumen penting perlu diperiksa sebelum dikirim. Anda…",
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
        "weight": 2
      },
      {
        "key": "D",
        "text": "Mengirim versi lama.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 2,
      "D": 1
    },
    "explanation": "Daftar pemeriksaan sederhana mengurangi kesalahan administrasi.",
    "dimension": "Integritas & Etika Profesi Polri"
  },
  {
    "id": 220,
    "module": "Tes Psikologi — Mental Kepribadian (Studi Kasus Lingkungan Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "[Studi Kasus Lingkungan Kepolisian] Anda menerima kritik atas keterlambatan kerja. Anda…",
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
        "weight": 2
      },
      {
        "key": "D",
        "text": "Menyalahkan seluruh tim.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 3,
      "B": 5,
      "C": 2,
      "D": 1
    },
    "explanation": "Sikap terbuka dan rencana perbaikan lebih produktif daripada defensif.\nPengendalian emosi dan tekanan",
    "dimension": "Integritas & Etika Profesi Polri"
  }
];

/* -------------------------------------------------------------------------- */
/* 3. KUMPULAN SOAL KECERMATAN (50 Butir: 5 Kolom Monokrom CAT)         */
/* -------------------------------------------------------------------------- */
const QUESTIONS_KECERMATAN: SimQuestion[] = [
  {
    "id": 301,
    "module": "Tes Kecermatan — Kolom 1: Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 1: Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "A",
    "explanation": "Pada Kolom 1: Angka Hilang, patokan adalah 8(A), 3(B), 9(C), 5(D), 2(E). Pada kotak soal terdapat karakter [5, 3, 2, 9]. Karakter yang tidak muncul (hilang) adalah \"8\", yang berada pada kolom (A).",
    "weight": 1,
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
        "text": "Pilihan A (8)"
      },
      {
        "key": "B",
        "text": "Pilihan B (3)"
      },
      {
        "key": "C",
        "text": "Pilihan C (9)"
      },
      {
        "key": "D",
        "text": "Pilihan D (5)"
      },
      {
        "key": "E",
        "text": "Pilihan E (2)"
      }
    ]
  },
  {
    "id": 302,
    "module": "Tes Kecermatan — Kolom 1: Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 1: Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "B",
    "explanation": "Pada Kolom 1: Angka Hilang, patokan adalah 8(A), 3(B), 9(C), 5(D), 2(E). Pada kotak soal terdapat karakter [9, 2, 8, 5]. Karakter yang tidak muncul (hilang) adalah \"3\", yang berada pada kolom (B).",
    "weight": 1,
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
        "text": "Pilihan A (8)"
      },
      {
        "key": "B",
        "text": "Pilihan B (3)"
      },
      {
        "key": "C",
        "text": "Pilihan C (9)"
      },
      {
        "key": "D",
        "text": "Pilihan D (5)"
      },
      {
        "key": "E",
        "text": "Pilihan E (2)"
      }
    ]
  },
  {
    "id": 303,
    "module": "Tes Kecermatan — Kolom 1: Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 1: Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "C",
    "explanation": "Pada Kolom 1: Angka Hilang, patokan adalah 8(A), 3(B), 9(C), 5(D), 2(E). Pada kotak soal terdapat karakter [5, 8, 2, 3]. Karakter yang tidak muncul (hilang) adalah \"9\", yang berada pada kolom (C).",
    "weight": 1,
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
      "8",
      "2",
      "3"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (8)"
      },
      {
        "key": "B",
        "text": "Pilihan B (3)"
      },
      {
        "key": "C",
        "text": "Pilihan C (9)"
      },
      {
        "key": "D",
        "text": "Pilihan D (5)"
      },
      {
        "key": "E",
        "text": "Pilihan E (2)"
      }
    ]
  },
  {
    "id": 304,
    "module": "Tes Kecermatan — Kolom 1: Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 1: Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "D",
    "explanation": "Pada Kolom 1: Angka Hilang, patokan adalah 8(A), 3(B), 9(C), 5(D), 2(E). Pada kotak soal terdapat karakter [3, 2, 8, 9]. Karakter yang tidak muncul (hilang) adalah \"5\", yang berada pada kolom (D).",
    "weight": 1,
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
      "2",
      "8",
      "9"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (8)"
      },
      {
        "key": "B",
        "text": "Pilihan B (3)"
      },
      {
        "key": "C",
        "text": "Pilihan C (9)"
      },
      {
        "key": "D",
        "text": "Pilihan D (5)"
      },
      {
        "key": "E",
        "text": "Pilihan E (2)"
      }
    ]
  },
  {
    "id": 305,
    "module": "Tes Kecermatan — Kolom 1: Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 1: Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "E",
    "explanation": "Pada Kolom 1: Angka Hilang, patokan adalah 8(A), 3(B), 9(C), 5(D), 2(E). Pada kotak soal terdapat karakter [9, 8, 5, 3]. Karakter yang tidak muncul (hilang) adalah \"2\", yang berada pada kolom (E).",
    "weight": 1,
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
      "3"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (8)"
      },
      {
        "key": "B",
        "text": "Pilihan B (3)"
      },
      {
        "key": "C",
        "text": "Pilihan C (9)"
      },
      {
        "key": "D",
        "text": "Pilihan D (5)"
      },
      {
        "key": "E",
        "text": "Pilihan E (2)"
      }
    ]
  },
  {
    "id": 306,
    "module": "Tes Kecermatan — Kolom 1: Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 1: Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "A",
    "explanation": "Pada Kolom 1: Angka Hilang, patokan adalah 8(A), 3(B), 9(C), 5(D), 2(E). Pada kotak soal terdapat karakter [9, 2, 3, 5]. Karakter yang tidak muncul (hilang) adalah \"8\", yang berada pada kolom (A).",
    "weight": 1,
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
      "3",
      "5"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (8)"
      },
      {
        "key": "B",
        "text": "Pilihan B (3)"
      },
      {
        "key": "C",
        "text": "Pilihan C (9)"
      },
      {
        "key": "D",
        "text": "Pilihan D (5)"
      },
      {
        "key": "E",
        "text": "Pilihan E (2)"
      }
    ]
  },
  {
    "id": 307,
    "module": "Tes Kecermatan — Kolom 1: Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 1: Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "B",
    "explanation": "Pada Kolom 1: Angka Hilang, patokan adalah 8(A), 3(B), 9(C), 5(D), 2(E). Pada kotak soal terdapat karakter [5, 8, 2, 9]. Karakter yang tidak muncul (hilang) adalah \"3\", yang berada pada kolom (B).",
    "weight": 1,
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
      "8",
      "2",
      "9"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (8)"
      },
      {
        "key": "B",
        "text": "Pilihan B (3)"
      },
      {
        "key": "C",
        "text": "Pilihan C (9)"
      },
      {
        "key": "D",
        "text": "Pilihan D (5)"
      },
      {
        "key": "E",
        "text": "Pilihan E (2)"
      }
    ]
  },
  {
    "id": 308,
    "module": "Tes Kecermatan — Kolom 1: Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 1: Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "C",
    "explanation": "Pada Kolom 1: Angka Hilang, patokan adalah 8(A), 3(B), 9(C), 5(D), 2(E). Pada kotak soal terdapat karakter [3, 2, 8, 5]. Karakter yang tidak muncul (hilang) adalah \"9\", yang berada pada kolom (C).",
    "weight": 1,
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
      "2",
      "8",
      "5"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (8)"
      },
      {
        "key": "B",
        "text": "Pilihan B (3)"
      },
      {
        "key": "C",
        "text": "Pilihan C (9)"
      },
      {
        "key": "D",
        "text": "Pilihan D (5)"
      },
      {
        "key": "E",
        "text": "Pilihan E (2)"
      }
    ]
  },
  {
    "id": 309,
    "module": "Tes Kecermatan — Kolom 1: Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 1: Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "D",
    "explanation": "Pada Kolom 1: Angka Hilang, patokan adalah 8(A), 3(B), 9(C), 5(D), 2(E). Pada kotak soal terdapat karakter [9, 8, 2, 3]. Karakter yang tidak muncul (hilang) adalah \"5\", yang berada pada kolom (D).",
    "weight": 1,
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
      "3"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (8)"
      },
      {
        "key": "B",
        "text": "Pilihan B (3)"
      },
      {
        "key": "C",
        "text": "Pilihan C (9)"
      },
      {
        "key": "D",
        "text": "Pilihan D (5)"
      },
      {
        "key": "E",
        "text": "Pilihan E (2)"
      }
    ]
  },
  {
    "id": 310,
    "module": "Tes Kecermatan — Kolom 1: Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 1: Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "E",
    "explanation": "Pada Kolom 1: Angka Hilang, patokan adalah 8(A), 3(B), 9(C), 5(D), 2(E). Pada kotak soal terdapat karakter [3, 5, 8, 9]. Karakter yang tidak muncul (hilang) adalah \"2\", yang berada pada kolom (E).",
    "weight": 1,
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
        "text": "Pilihan A (8)"
      },
      {
        "key": "B",
        "text": "Pilihan B (3)"
      },
      {
        "key": "C",
        "text": "Pilihan C (9)"
      },
      {
        "key": "D",
        "text": "Pilihan D (5)"
      },
      {
        "key": "E",
        "text": "Pilihan E (2)"
      }
    ]
  },
  {
    "id": 311,
    "module": "Tes Kecermatan — Kolom 2: Huruf Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 2: Huruf Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "A",
    "explanation": "Pada Kolom 2: Huruf Hilang, patokan adalah G(A), M(B), R(C), T(D), W(E). Pada kotak soal terdapat karakter [T, M, W, R]. Karakter yang tidak muncul (hilang) adalah \"G\", yang berada pada kolom (A).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "G",
        "label": "A"
      },
      {
        "char": "M",
        "label": "B"
      },
      {
        "char": "R",
        "label": "C"
      },
      {
        "char": "T",
        "label": "D"
      },
      {
        "char": "W",
        "label": "E"
      }
    ],
    "questionChars": [
      "T",
      "M",
      "W",
      "R"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (G)"
      },
      {
        "key": "B",
        "text": "Pilihan B (M)"
      },
      {
        "key": "C",
        "text": "Pilihan C (R)"
      },
      {
        "key": "D",
        "text": "Pilihan D (T)"
      },
      {
        "key": "E",
        "text": "Pilihan E (W)"
      }
    ]
  },
  {
    "id": 312,
    "module": "Tes Kecermatan — Kolom 2: Huruf Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 2: Huruf Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "B",
    "explanation": "Pada Kolom 2: Huruf Hilang, patokan adalah G(A), M(B), R(C), T(D), W(E). Pada kotak soal terdapat karakter [R, W, G, T]. Karakter yang tidak muncul (hilang) adalah \"M\", yang berada pada kolom (B).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "G",
        "label": "A"
      },
      {
        "char": "M",
        "label": "B"
      },
      {
        "char": "R",
        "label": "C"
      },
      {
        "char": "T",
        "label": "D"
      },
      {
        "char": "W",
        "label": "E"
      }
    ],
    "questionChars": [
      "R",
      "W",
      "G",
      "T"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (G)"
      },
      {
        "key": "B",
        "text": "Pilihan B (M)"
      },
      {
        "key": "C",
        "text": "Pilihan C (R)"
      },
      {
        "key": "D",
        "text": "Pilihan D (T)"
      },
      {
        "key": "E",
        "text": "Pilihan E (W)"
      }
    ]
  },
  {
    "id": 313,
    "module": "Tes Kecermatan — Kolom 2: Huruf Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 2: Huruf Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "C",
    "explanation": "Pada Kolom 2: Huruf Hilang, patokan adalah G(A), M(B), R(C), T(D), W(E). Pada kotak soal terdapat karakter [T, G, W, M]. Karakter yang tidak muncul (hilang) adalah \"R\", yang berada pada kolom (C).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "G",
        "label": "A"
      },
      {
        "char": "M",
        "label": "B"
      },
      {
        "char": "R",
        "label": "C"
      },
      {
        "char": "T",
        "label": "D"
      },
      {
        "char": "W",
        "label": "E"
      }
    ],
    "questionChars": [
      "T",
      "G",
      "W",
      "M"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (G)"
      },
      {
        "key": "B",
        "text": "Pilihan B (M)"
      },
      {
        "key": "C",
        "text": "Pilihan C (R)"
      },
      {
        "key": "D",
        "text": "Pilihan D (T)"
      },
      {
        "key": "E",
        "text": "Pilihan E (W)"
      }
    ]
  },
  {
    "id": 314,
    "module": "Tes Kecermatan — Kolom 2: Huruf Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 2: Huruf Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "D",
    "explanation": "Pada Kolom 2: Huruf Hilang, patokan adalah G(A), M(B), R(C), T(D), W(E). Pada kotak soal terdapat karakter [M, W, G, R]. Karakter yang tidak muncul (hilang) adalah \"T\", yang berada pada kolom (D).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "G",
        "label": "A"
      },
      {
        "char": "M",
        "label": "B"
      },
      {
        "char": "R",
        "label": "C"
      },
      {
        "char": "T",
        "label": "D"
      },
      {
        "char": "W",
        "label": "E"
      }
    ],
    "questionChars": [
      "M",
      "W",
      "G",
      "R"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (G)"
      },
      {
        "key": "B",
        "text": "Pilihan B (M)"
      },
      {
        "key": "C",
        "text": "Pilihan C (R)"
      },
      {
        "key": "D",
        "text": "Pilihan D (T)"
      },
      {
        "key": "E",
        "text": "Pilihan E (W)"
      }
    ]
  },
  {
    "id": 315,
    "module": "Tes Kecermatan — Kolom 2: Huruf Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 2: Huruf Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "E",
    "explanation": "Pada Kolom 2: Huruf Hilang, patokan adalah G(A), M(B), R(C), T(D), W(E). Pada kotak soal terdapat karakter [R, G, T, M]. Karakter yang tidak muncul (hilang) adalah \"W\", yang berada pada kolom (E).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "G",
        "label": "A"
      },
      {
        "char": "M",
        "label": "B"
      },
      {
        "char": "R",
        "label": "C"
      },
      {
        "char": "T",
        "label": "D"
      },
      {
        "char": "W",
        "label": "E"
      }
    ],
    "questionChars": [
      "R",
      "G",
      "T",
      "M"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (G)"
      },
      {
        "key": "B",
        "text": "Pilihan B (M)"
      },
      {
        "key": "C",
        "text": "Pilihan C (R)"
      },
      {
        "key": "D",
        "text": "Pilihan D (T)"
      },
      {
        "key": "E",
        "text": "Pilihan E (W)"
      }
    ]
  },
  {
    "id": 316,
    "module": "Tes Kecermatan — Kolom 2: Huruf Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 2: Huruf Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "A",
    "explanation": "Pada Kolom 2: Huruf Hilang, patokan adalah G(A), M(B), R(C), T(D), W(E). Pada kotak soal terdapat karakter [R, W, M, T]. Karakter yang tidak muncul (hilang) adalah \"G\", yang berada pada kolom (A).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "G",
        "label": "A"
      },
      {
        "char": "M",
        "label": "B"
      },
      {
        "char": "R",
        "label": "C"
      },
      {
        "char": "T",
        "label": "D"
      },
      {
        "char": "W",
        "label": "E"
      }
    ],
    "questionChars": [
      "R",
      "W",
      "M",
      "T"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (G)"
      },
      {
        "key": "B",
        "text": "Pilihan B (M)"
      },
      {
        "key": "C",
        "text": "Pilihan C (R)"
      },
      {
        "key": "D",
        "text": "Pilihan D (T)"
      },
      {
        "key": "E",
        "text": "Pilihan E (W)"
      }
    ]
  },
  {
    "id": 317,
    "module": "Tes Kecermatan — Kolom 2: Huruf Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 2: Huruf Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "B",
    "explanation": "Pada Kolom 2: Huruf Hilang, patokan adalah G(A), M(B), R(C), T(D), W(E). Pada kotak soal terdapat karakter [T, G, W, R]. Karakter yang tidak muncul (hilang) adalah \"M\", yang berada pada kolom (B).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "G",
        "label": "A"
      },
      {
        "char": "M",
        "label": "B"
      },
      {
        "char": "R",
        "label": "C"
      },
      {
        "char": "T",
        "label": "D"
      },
      {
        "char": "W",
        "label": "E"
      }
    ],
    "questionChars": [
      "T",
      "G",
      "W",
      "R"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (G)"
      },
      {
        "key": "B",
        "text": "Pilihan B (M)"
      },
      {
        "key": "C",
        "text": "Pilihan C (R)"
      },
      {
        "key": "D",
        "text": "Pilihan D (T)"
      },
      {
        "key": "E",
        "text": "Pilihan E (W)"
      }
    ]
  },
  {
    "id": 318,
    "module": "Tes Kecermatan — Kolom 2: Huruf Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 2: Huruf Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "C",
    "explanation": "Pada Kolom 2: Huruf Hilang, patokan adalah G(A), M(B), R(C), T(D), W(E). Pada kotak soal terdapat karakter [M, W, G, T]. Karakter yang tidak muncul (hilang) adalah \"R\", yang berada pada kolom (C).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "G",
        "label": "A"
      },
      {
        "char": "M",
        "label": "B"
      },
      {
        "char": "R",
        "label": "C"
      },
      {
        "char": "T",
        "label": "D"
      },
      {
        "char": "W",
        "label": "E"
      }
    ],
    "questionChars": [
      "M",
      "W",
      "G",
      "T"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (G)"
      },
      {
        "key": "B",
        "text": "Pilihan B (M)"
      },
      {
        "key": "C",
        "text": "Pilihan C (R)"
      },
      {
        "key": "D",
        "text": "Pilihan D (T)"
      },
      {
        "key": "E",
        "text": "Pilihan E (W)"
      }
    ]
  },
  {
    "id": 319,
    "module": "Tes Kecermatan — Kolom 2: Huruf Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 2: Huruf Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "D",
    "explanation": "Pada Kolom 2: Huruf Hilang, patokan adalah G(A), M(B), R(C), T(D), W(E). Pada kotak soal terdapat karakter [R, G, W, M]. Karakter yang tidak muncul (hilang) adalah \"T\", yang berada pada kolom (D).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "G",
        "label": "A"
      },
      {
        "char": "M",
        "label": "B"
      },
      {
        "char": "R",
        "label": "C"
      },
      {
        "char": "T",
        "label": "D"
      },
      {
        "char": "W",
        "label": "E"
      }
    ],
    "questionChars": [
      "R",
      "G",
      "W",
      "M"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (G)"
      },
      {
        "key": "B",
        "text": "Pilihan B (M)"
      },
      {
        "key": "C",
        "text": "Pilihan C (R)"
      },
      {
        "key": "D",
        "text": "Pilihan D (T)"
      },
      {
        "key": "E",
        "text": "Pilihan E (W)"
      }
    ]
  },
  {
    "id": 320,
    "module": "Tes Kecermatan — Kolom 2: Huruf Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 2: Huruf Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "E",
    "explanation": "Pada Kolom 2: Huruf Hilang, patokan adalah G(A), M(B), R(C), T(D), W(E). Pada kotak soal terdapat karakter [M, T, G, R]. Karakter yang tidak muncul (hilang) adalah \"W\", yang berada pada kolom (E).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 2,
    "benchmark": [
      {
        "char": "G",
        "label": "A"
      },
      {
        "char": "M",
        "label": "B"
      },
      {
        "char": "R",
        "label": "C"
      },
      {
        "char": "T",
        "label": "D"
      },
      {
        "char": "W",
        "label": "E"
      }
    ],
    "questionChars": [
      "M",
      "T",
      "G",
      "R"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (G)"
      },
      {
        "key": "B",
        "text": "Pilihan B (M)"
      },
      {
        "key": "C",
        "text": "Pilihan C (R)"
      },
      {
        "key": "D",
        "text": "Pilihan D (T)"
      },
      {
        "key": "E",
        "text": "Pilihan E (W)"
      }
    ]
  },
  {
    "id": 321,
    "module": "Tes Kecermatan — Kolom 3: Simbol Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 3: Simbol Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "A",
    "explanation": "Pada Kolom 3: Simbol Hilang, patokan adalah §(A), #(B), &(C), %(D), @(E). Pada kotak soal terdapat karakter [%, #, @, &]. Karakter yang tidak muncul (hilang) adalah \"§\", yang berada pada kolom (A).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "§",
        "label": "A"
      },
      {
        "char": "#",
        "label": "B"
      },
      {
        "char": "&",
        "label": "C"
      },
      {
        "char": "%",
        "label": "D"
      },
      {
        "char": "@",
        "label": "E"
      }
    ],
    "questionChars": [
      "%",
      "#",
      "@",
      "&"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (§)"
      },
      {
        "key": "B",
        "text": "Pilihan B (#)"
      },
      {
        "key": "C",
        "text": "Pilihan C (&)"
      },
      {
        "key": "D",
        "text": "Pilihan D (%)"
      },
      {
        "key": "E",
        "text": "Pilihan E (@)"
      }
    ]
  },
  {
    "id": 322,
    "module": "Tes Kecermatan — Kolom 3: Simbol Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 3: Simbol Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "B",
    "explanation": "Pada Kolom 3: Simbol Hilang, patokan adalah §(A), #(B), &(C), %(D), @(E). Pada kotak soal terdapat karakter [&, @, §, %]. Karakter yang tidak muncul (hilang) adalah \"#\", yang berada pada kolom (B).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "§",
        "label": "A"
      },
      {
        "char": "#",
        "label": "B"
      },
      {
        "char": "&",
        "label": "C"
      },
      {
        "char": "%",
        "label": "D"
      },
      {
        "char": "@",
        "label": "E"
      }
    ],
    "questionChars": [
      "&",
      "@",
      "§",
      "%"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (§)"
      },
      {
        "key": "B",
        "text": "Pilihan B (#)"
      },
      {
        "key": "C",
        "text": "Pilihan C (&)"
      },
      {
        "key": "D",
        "text": "Pilihan D (%)"
      },
      {
        "key": "E",
        "text": "Pilihan E (@)"
      }
    ]
  },
  {
    "id": 323,
    "module": "Tes Kecermatan — Kolom 3: Simbol Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 3: Simbol Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "C",
    "explanation": "Pada Kolom 3: Simbol Hilang, patokan adalah §(A), #(B), &(C), %(D), @(E). Pada kotak soal terdapat karakter [%, §, @, #]. Karakter yang tidak muncul (hilang) adalah \"&\", yang berada pada kolom (C).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "§",
        "label": "A"
      },
      {
        "char": "#",
        "label": "B"
      },
      {
        "char": "&",
        "label": "C"
      },
      {
        "char": "%",
        "label": "D"
      },
      {
        "char": "@",
        "label": "E"
      }
    ],
    "questionChars": [
      "%",
      "§",
      "@",
      "#"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (§)"
      },
      {
        "key": "B",
        "text": "Pilihan B (#)"
      },
      {
        "key": "C",
        "text": "Pilihan C (&)"
      },
      {
        "key": "D",
        "text": "Pilihan D (%)"
      },
      {
        "key": "E",
        "text": "Pilihan E (@)"
      }
    ]
  },
  {
    "id": 324,
    "module": "Tes Kecermatan — Kolom 3: Simbol Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 3: Simbol Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "D",
    "explanation": "Pada Kolom 3: Simbol Hilang, patokan adalah §(A), #(B), &(C), %(D), @(E). Pada kotak soal terdapat karakter [#, @, §, &]. Karakter yang tidak muncul (hilang) adalah \"%\", yang berada pada kolom (D).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "§",
        "label": "A"
      },
      {
        "char": "#",
        "label": "B"
      },
      {
        "char": "&",
        "label": "C"
      },
      {
        "char": "%",
        "label": "D"
      },
      {
        "char": "@",
        "label": "E"
      }
    ],
    "questionChars": [
      "#",
      "@",
      "§",
      "&"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (§)"
      },
      {
        "key": "B",
        "text": "Pilihan B (#)"
      },
      {
        "key": "C",
        "text": "Pilihan C (&)"
      },
      {
        "key": "D",
        "text": "Pilihan D (%)"
      },
      {
        "key": "E",
        "text": "Pilihan E (@)"
      }
    ]
  },
  {
    "id": 325,
    "module": "Tes Kecermatan — Kolom 3: Simbol Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 3: Simbol Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "E",
    "explanation": "Pada Kolom 3: Simbol Hilang, patokan adalah §(A), #(B), &(C), %(D), @(E). Pada kotak soal terdapat karakter [&, §, %, #]. Karakter yang tidak muncul (hilang) adalah \"@\", yang berada pada kolom (E).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "§",
        "label": "A"
      },
      {
        "char": "#",
        "label": "B"
      },
      {
        "char": "&",
        "label": "C"
      },
      {
        "char": "%",
        "label": "D"
      },
      {
        "char": "@",
        "label": "E"
      }
    ],
    "questionChars": [
      "&",
      "§",
      "%",
      "#"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (§)"
      },
      {
        "key": "B",
        "text": "Pilihan B (#)"
      },
      {
        "key": "C",
        "text": "Pilihan C (&)"
      },
      {
        "key": "D",
        "text": "Pilihan D (%)"
      },
      {
        "key": "E",
        "text": "Pilihan E (@)"
      }
    ]
  },
  {
    "id": 326,
    "module": "Tes Kecermatan — Kolom 3: Simbol Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 3: Simbol Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "A",
    "explanation": "Pada Kolom 3: Simbol Hilang, patokan adalah §(A), #(B), &(C), %(D), @(E). Pada kotak soal terdapat karakter [&, @, #, %]. Karakter yang tidak muncul (hilang) adalah \"§\", yang berada pada kolom (A).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "§",
        "label": "A"
      },
      {
        "char": "#",
        "label": "B"
      },
      {
        "char": "&",
        "label": "C"
      },
      {
        "char": "%",
        "label": "D"
      },
      {
        "char": "@",
        "label": "E"
      }
    ],
    "questionChars": [
      "&",
      "@",
      "#",
      "%"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (§)"
      },
      {
        "key": "B",
        "text": "Pilihan B (#)"
      },
      {
        "key": "C",
        "text": "Pilihan C (&)"
      },
      {
        "key": "D",
        "text": "Pilihan D (%)"
      },
      {
        "key": "E",
        "text": "Pilihan E (@)"
      }
    ]
  },
  {
    "id": 327,
    "module": "Tes Kecermatan — Kolom 3: Simbol Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 3: Simbol Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "B",
    "explanation": "Pada Kolom 3: Simbol Hilang, patokan adalah §(A), #(B), &(C), %(D), @(E). Pada kotak soal terdapat karakter [%, §, @, &]. Karakter yang tidak muncul (hilang) adalah \"#\", yang berada pada kolom (B).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "§",
        "label": "A"
      },
      {
        "char": "#",
        "label": "B"
      },
      {
        "char": "&",
        "label": "C"
      },
      {
        "char": "%",
        "label": "D"
      },
      {
        "char": "@",
        "label": "E"
      }
    ],
    "questionChars": [
      "%",
      "§",
      "@",
      "&"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (§)"
      },
      {
        "key": "B",
        "text": "Pilihan B (#)"
      },
      {
        "key": "C",
        "text": "Pilihan C (&)"
      },
      {
        "key": "D",
        "text": "Pilihan D (%)"
      },
      {
        "key": "E",
        "text": "Pilihan E (@)"
      }
    ]
  },
  {
    "id": 328,
    "module": "Tes Kecermatan — Kolom 3: Simbol Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 3: Simbol Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "C",
    "explanation": "Pada Kolom 3: Simbol Hilang, patokan adalah §(A), #(B), &(C), %(D), @(E). Pada kotak soal terdapat karakter [#, @, §, %]. Karakter yang tidak muncul (hilang) adalah \"&\", yang berada pada kolom (C).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "§",
        "label": "A"
      },
      {
        "char": "#",
        "label": "B"
      },
      {
        "char": "&",
        "label": "C"
      },
      {
        "char": "%",
        "label": "D"
      },
      {
        "char": "@",
        "label": "E"
      }
    ],
    "questionChars": [
      "#",
      "@",
      "§",
      "%"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (§)"
      },
      {
        "key": "B",
        "text": "Pilihan B (#)"
      },
      {
        "key": "C",
        "text": "Pilihan C (&)"
      },
      {
        "key": "D",
        "text": "Pilihan D (%)"
      },
      {
        "key": "E",
        "text": "Pilihan E (@)"
      }
    ]
  },
  {
    "id": 329,
    "module": "Tes Kecermatan — Kolom 3: Simbol Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 3: Simbol Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "D",
    "explanation": "Pada Kolom 3: Simbol Hilang, patokan adalah §(A), #(B), &(C), %(D), @(E). Pada kotak soal terdapat karakter [&, §, @, #]. Karakter yang tidak muncul (hilang) adalah \"%\", yang berada pada kolom (D).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "§",
        "label": "A"
      },
      {
        "char": "#",
        "label": "B"
      },
      {
        "char": "&",
        "label": "C"
      },
      {
        "char": "%",
        "label": "D"
      },
      {
        "char": "@",
        "label": "E"
      }
    ],
    "questionChars": [
      "&",
      "§",
      "@",
      "#"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (§)"
      },
      {
        "key": "B",
        "text": "Pilihan B (#)"
      },
      {
        "key": "C",
        "text": "Pilihan C (&)"
      },
      {
        "key": "D",
        "text": "Pilihan D (%)"
      },
      {
        "key": "E",
        "text": "Pilihan E (@)"
      }
    ]
  },
  {
    "id": 330,
    "module": "Tes Kecermatan — Kolom 3: Simbol Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 3: Simbol Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "E",
    "explanation": "Pada Kolom 3: Simbol Hilang, patokan adalah §(A), #(B), &(C), %(D), @(E). Pada kotak soal terdapat karakter [#, %, §, &]. Karakter yang tidak muncul (hilang) adalah \"@\", yang berada pada kolom (E).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 3,
    "benchmark": [
      {
        "char": "§",
        "label": "A"
      },
      {
        "char": "#",
        "label": "B"
      },
      {
        "char": "&",
        "label": "C"
      },
      {
        "char": "%",
        "label": "D"
      },
      {
        "char": "@",
        "label": "E"
      }
    ],
    "questionChars": [
      "#",
      "%",
      "§",
      "&"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (§)"
      },
      {
        "key": "B",
        "text": "Pilihan B (#)"
      },
      {
        "key": "C",
        "text": "Pilihan C (&)"
      },
      {
        "key": "D",
        "text": "Pilihan D (%)"
      },
      {
        "key": "E",
        "text": "Pilihan E (@)"
      }
    ]
  },
  {
    "id": 331,
    "module": "Tes Kecermatan — Kolom 4: Campuran Huruf & Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 4: Campuran Huruf & Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "A",
    "explanation": "Pada Kolom 4: Campuran Huruf & Angka Hilang, patokan adalah B(A), 7(B), M(C), 4(D), X(E). Pada kotak soal terdapat karakter [4, 7, X, M]. Karakter yang tidak muncul (hilang) adalah \"B\", yang berada pada kolom (A).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "7",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "4",
        "label": "D"
      },
      {
        "char": "X",
        "label": "E"
      }
    ],
    "questionChars": [
      "4",
      "7",
      "X",
      "M"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (B)"
      },
      {
        "key": "B",
        "text": "Pilihan B (7)"
      },
      {
        "key": "C",
        "text": "Pilihan C (M)"
      },
      {
        "key": "D",
        "text": "Pilihan D (4)"
      },
      {
        "key": "E",
        "text": "Pilihan E (X)"
      }
    ]
  },
  {
    "id": 332,
    "module": "Tes Kecermatan — Kolom 4: Campuran Huruf & Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 4: Campuran Huruf & Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "B",
    "explanation": "Pada Kolom 4: Campuran Huruf & Angka Hilang, patokan adalah B(A), 7(B), M(C), 4(D), X(E). Pada kotak soal terdapat karakter [M, X, B, 4]. Karakter yang tidak muncul (hilang) adalah \"7\", yang berada pada kolom (B).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "7",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "4",
        "label": "D"
      },
      {
        "char": "X",
        "label": "E"
      }
    ],
    "questionChars": [
      "M",
      "X",
      "B",
      "4"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (B)"
      },
      {
        "key": "B",
        "text": "Pilihan B (7)"
      },
      {
        "key": "C",
        "text": "Pilihan C (M)"
      },
      {
        "key": "D",
        "text": "Pilihan D (4)"
      },
      {
        "key": "E",
        "text": "Pilihan E (X)"
      }
    ]
  },
  {
    "id": 333,
    "module": "Tes Kecermatan — Kolom 4: Campuran Huruf & Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 4: Campuran Huruf & Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "C",
    "explanation": "Pada Kolom 4: Campuran Huruf & Angka Hilang, patokan adalah B(A), 7(B), M(C), 4(D), X(E). Pada kotak soal terdapat karakter [4, B, X, 7]. Karakter yang tidak muncul (hilang) adalah \"M\", yang berada pada kolom (C).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "7",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "4",
        "label": "D"
      },
      {
        "char": "X",
        "label": "E"
      }
    ],
    "questionChars": [
      "4",
      "B",
      "X",
      "7"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (B)"
      },
      {
        "key": "B",
        "text": "Pilihan B (7)"
      },
      {
        "key": "C",
        "text": "Pilihan C (M)"
      },
      {
        "key": "D",
        "text": "Pilihan D (4)"
      },
      {
        "key": "E",
        "text": "Pilihan E (X)"
      }
    ]
  },
  {
    "id": 334,
    "module": "Tes Kecermatan — Kolom 4: Campuran Huruf & Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 4: Campuran Huruf & Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "D",
    "explanation": "Pada Kolom 4: Campuran Huruf & Angka Hilang, patokan adalah B(A), 7(B), M(C), 4(D), X(E). Pada kotak soal terdapat karakter [7, X, B, M]. Karakter yang tidak muncul (hilang) adalah \"4\", yang berada pada kolom (D).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "7",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "4",
        "label": "D"
      },
      {
        "char": "X",
        "label": "E"
      }
    ],
    "questionChars": [
      "7",
      "X",
      "B",
      "M"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (B)"
      },
      {
        "key": "B",
        "text": "Pilihan B (7)"
      },
      {
        "key": "C",
        "text": "Pilihan C (M)"
      },
      {
        "key": "D",
        "text": "Pilihan D (4)"
      },
      {
        "key": "E",
        "text": "Pilihan E (X)"
      }
    ]
  },
  {
    "id": 335,
    "module": "Tes Kecermatan — Kolom 4: Campuran Huruf & Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 4: Campuran Huruf & Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "E",
    "explanation": "Pada Kolom 4: Campuran Huruf & Angka Hilang, patokan adalah B(A), 7(B), M(C), 4(D), X(E). Pada kotak soal terdapat karakter [M, B, 4, 7]. Karakter yang tidak muncul (hilang) adalah \"X\", yang berada pada kolom (E).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "7",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "4",
        "label": "D"
      },
      {
        "char": "X",
        "label": "E"
      }
    ],
    "questionChars": [
      "M",
      "B",
      "4",
      "7"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (B)"
      },
      {
        "key": "B",
        "text": "Pilihan B (7)"
      },
      {
        "key": "C",
        "text": "Pilihan C (M)"
      },
      {
        "key": "D",
        "text": "Pilihan D (4)"
      },
      {
        "key": "E",
        "text": "Pilihan E (X)"
      }
    ]
  },
  {
    "id": 336,
    "module": "Tes Kecermatan — Kolom 4: Campuran Huruf & Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 4: Campuran Huruf & Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "A",
    "explanation": "Pada Kolom 4: Campuran Huruf & Angka Hilang, patokan adalah B(A), 7(B), M(C), 4(D), X(E). Pada kotak soal terdapat karakter [M, X, 7, 4]. Karakter yang tidak muncul (hilang) adalah \"B\", yang berada pada kolom (A).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "7",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "4",
        "label": "D"
      },
      {
        "char": "X",
        "label": "E"
      }
    ],
    "questionChars": [
      "M",
      "X",
      "7",
      "4"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (B)"
      },
      {
        "key": "B",
        "text": "Pilihan B (7)"
      },
      {
        "key": "C",
        "text": "Pilihan C (M)"
      },
      {
        "key": "D",
        "text": "Pilihan D (4)"
      },
      {
        "key": "E",
        "text": "Pilihan E (X)"
      }
    ]
  },
  {
    "id": 337,
    "module": "Tes Kecermatan — Kolom 4: Campuran Huruf & Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 4: Campuran Huruf & Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "B",
    "explanation": "Pada Kolom 4: Campuran Huruf & Angka Hilang, patokan adalah B(A), 7(B), M(C), 4(D), X(E). Pada kotak soal terdapat karakter [4, B, X, M]. Karakter yang tidak muncul (hilang) adalah \"7\", yang berada pada kolom (B).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "7",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "4",
        "label": "D"
      },
      {
        "char": "X",
        "label": "E"
      }
    ],
    "questionChars": [
      "4",
      "B",
      "X",
      "M"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (B)"
      },
      {
        "key": "B",
        "text": "Pilihan B (7)"
      },
      {
        "key": "C",
        "text": "Pilihan C (M)"
      },
      {
        "key": "D",
        "text": "Pilihan D (4)"
      },
      {
        "key": "E",
        "text": "Pilihan E (X)"
      }
    ]
  },
  {
    "id": 338,
    "module": "Tes Kecermatan — Kolom 4: Campuran Huruf & Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 4: Campuran Huruf & Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "C",
    "explanation": "Pada Kolom 4: Campuran Huruf & Angka Hilang, patokan adalah B(A), 7(B), M(C), 4(D), X(E). Pada kotak soal terdapat karakter [7, X, B, 4]. Karakter yang tidak muncul (hilang) adalah \"M\", yang berada pada kolom (C).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "7",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "4",
        "label": "D"
      },
      {
        "char": "X",
        "label": "E"
      }
    ],
    "questionChars": [
      "7",
      "X",
      "B",
      "4"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (B)"
      },
      {
        "key": "B",
        "text": "Pilihan B (7)"
      },
      {
        "key": "C",
        "text": "Pilihan C (M)"
      },
      {
        "key": "D",
        "text": "Pilihan D (4)"
      },
      {
        "key": "E",
        "text": "Pilihan E (X)"
      }
    ]
  },
  {
    "id": 339,
    "module": "Tes Kecermatan — Kolom 4: Campuran Huruf & Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 4: Campuran Huruf & Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "D",
    "explanation": "Pada Kolom 4: Campuran Huruf & Angka Hilang, patokan adalah B(A), 7(B), M(C), 4(D), X(E). Pada kotak soal terdapat karakter [M, B, X, 7]. Karakter yang tidak muncul (hilang) adalah \"4\", yang berada pada kolom (D).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "7",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "4",
        "label": "D"
      },
      {
        "char": "X",
        "label": "E"
      }
    ],
    "questionChars": [
      "M",
      "B",
      "X",
      "7"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (B)"
      },
      {
        "key": "B",
        "text": "Pilihan B (7)"
      },
      {
        "key": "C",
        "text": "Pilihan C (M)"
      },
      {
        "key": "D",
        "text": "Pilihan D (4)"
      },
      {
        "key": "E",
        "text": "Pilihan E (X)"
      }
    ]
  },
  {
    "id": 340,
    "module": "Tes Kecermatan — Kolom 4: Campuran Huruf & Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 4: Campuran Huruf & Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "E",
    "explanation": "Pada Kolom 4: Campuran Huruf & Angka Hilang, patokan adalah B(A), 7(B), M(C), 4(D), X(E). Pada kotak soal terdapat karakter [7, 4, B, M]. Karakter yang tidak muncul (hilang) adalah \"X\", yang berada pada kolom (E).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 4,
    "benchmark": [
      {
        "char": "B",
        "label": "A"
      },
      {
        "char": "7",
        "label": "B"
      },
      {
        "char": "M",
        "label": "C"
      },
      {
        "char": "4",
        "label": "D"
      },
      {
        "char": "X",
        "label": "E"
      }
    ],
    "questionChars": [
      "7",
      "4",
      "B",
      "M"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (B)"
      },
      {
        "key": "B",
        "text": "Pilihan B (7)"
      },
      {
        "key": "C",
        "text": "Pilihan C (M)"
      },
      {
        "key": "D",
        "text": "Pilihan D (4)"
      },
      {
        "key": "E",
        "text": "Pilihan E (X)"
      }
    ]
  },
  {
    "id": 341,
    "module": "Tes Kecermatan — Kolom 5: Campuran Simbol, Huruf & Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 5: Campuran Simbol, Huruf & Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "A",
    "explanation": "Pada Kolom 5: Campuran Simbol, Huruf & Angka Hilang, patokan adalah K(A), 9(B), ★(C), R(D), #(E). Pada kotak soal terdapat karakter [R, 9, #, ★]. Karakter yang tidak muncul (hilang) adalah \"K\", yang berada pada kolom (A).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "K",
        "label": "A"
      },
      {
        "char": "9",
        "label": "B"
      },
      {
        "char": "★",
        "label": "C"
      },
      {
        "char": "R",
        "label": "D"
      },
      {
        "char": "#",
        "label": "E"
      }
    ],
    "questionChars": [
      "R",
      "9",
      "#",
      "★"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (K)"
      },
      {
        "key": "B",
        "text": "Pilihan B (9)"
      },
      {
        "key": "C",
        "text": "Pilihan C (★)"
      },
      {
        "key": "D",
        "text": "Pilihan D (R)"
      },
      {
        "key": "E",
        "text": "Pilihan E (#)"
      }
    ]
  },
  {
    "id": 342,
    "module": "Tes Kecermatan — Kolom 5: Campuran Simbol, Huruf & Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 5: Campuran Simbol, Huruf & Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "B",
    "explanation": "Pada Kolom 5: Campuran Simbol, Huruf & Angka Hilang, patokan adalah K(A), 9(B), ★(C), R(D), #(E). Pada kotak soal terdapat karakter [★, #, K, R]. Karakter yang tidak muncul (hilang) adalah \"9\", yang berada pada kolom (B).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "K",
        "label": "A"
      },
      {
        "char": "9",
        "label": "B"
      },
      {
        "char": "★",
        "label": "C"
      },
      {
        "char": "R",
        "label": "D"
      },
      {
        "char": "#",
        "label": "E"
      }
    ],
    "questionChars": [
      "★",
      "#",
      "K",
      "R"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (K)"
      },
      {
        "key": "B",
        "text": "Pilihan B (9)"
      },
      {
        "key": "C",
        "text": "Pilihan C (★)"
      },
      {
        "key": "D",
        "text": "Pilihan D (R)"
      },
      {
        "key": "E",
        "text": "Pilihan E (#)"
      }
    ]
  },
  {
    "id": 343,
    "module": "Tes Kecermatan — Kolom 5: Campuran Simbol, Huruf & Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 5: Campuran Simbol, Huruf & Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "C",
    "explanation": "Pada Kolom 5: Campuran Simbol, Huruf & Angka Hilang, patokan adalah K(A), 9(B), ★(C), R(D), #(E). Pada kotak soal terdapat karakter [R, K, #, 9]. Karakter yang tidak muncul (hilang) adalah \"★\", yang berada pada kolom (C).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "K",
        "label": "A"
      },
      {
        "char": "9",
        "label": "B"
      },
      {
        "char": "★",
        "label": "C"
      },
      {
        "char": "R",
        "label": "D"
      },
      {
        "char": "#",
        "label": "E"
      }
    ],
    "questionChars": [
      "R",
      "K",
      "#",
      "9"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (K)"
      },
      {
        "key": "B",
        "text": "Pilihan B (9)"
      },
      {
        "key": "C",
        "text": "Pilihan C (★)"
      },
      {
        "key": "D",
        "text": "Pilihan D (R)"
      },
      {
        "key": "E",
        "text": "Pilihan E (#)"
      }
    ]
  },
  {
    "id": 344,
    "module": "Tes Kecermatan — Kolom 5: Campuran Simbol, Huruf & Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 5: Campuran Simbol, Huruf & Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "D",
    "explanation": "Pada Kolom 5: Campuran Simbol, Huruf & Angka Hilang, patokan adalah K(A), 9(B), ★(C), R(D), #(E). Pada kotak soal terdapat karakter [9, #, K, ★]. Karakter yang tidak muncul (hilang) adalah \"R\", yang berada pada kolom (D).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "K",
        "label": "A"
      },
      {
        "char": "9",
        "label": "B"
      },
      {
        "char": "★",
        "label": "C"
      },
      {
        "char": "R",
        "label": "D"
      },
      {
        "char": "#",
        "label": "E"
      }
    ],
    "questionChars": [
      "9",
      "#",
      "K",
      "★"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (K)"
      },
      {
        "key": "B",
        "text": "Pilihan B (9)"
      },
      {
        "key": "C",
        "text": "Pilihan C (★)"
      },
      {
        "key": "D",
        "text": "Pilihan D (R)"
      },
      {
        "key": "E",
        "text": "Pilihan E (#)"
      }
    ]
  },
  {
    "id": 345,
    "module": "Tes Kecermatan — Kolom 5: Campuran Simbol, Huruf & Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 5: Campuran Simbol, Huruf & Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "E",
    "explanation": "Pada Kolom 5: Campuran Simbol, Huruf & Angka Hilang, patokan adalah K(A), 9(B), ★(C), R(D), #(E). Pada kotak soal terdapat karakter [★, K, R, 9]. Karakter yang tidak muncul (hilang) adalah \"#\", yang berada pada kolom (E).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "K",
        "label": "A"
      },
      {
        "char": "9",
        "label": "B"
      },
      {
        "char": "★",
        "label": "C"
      },
      {
        "char": "R",
        "label": "D"
      },
      {
        "char": "#",
        "label": "E"
      }
    ],
    "questionChars": [
      "★",
      "K",
      "R",
      "9"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (K)"
      },
      {
        "key": "B",
        "text": "Pilihan B (9)"
      },
      {
        "key": "C",
        "text": "Pilihan C (★)"
      },
      {
        "key": "D",
        "text": "Pilihan D (R)"
      },
      {
        "key": "E",
        "text": "Pilihan E (#)"
      }
    ]
  },
  {
    "id": 346,
    "module": "Tes Kecermatan — Kolom 5: Campuran Simbol, Huruf & Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 5: Campuran Simbol, Huruf & Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "A",
    "explanation": "Pada Kolom 5: Campuran Simbol, Huruf & Angka Hilang, patokan adalah K(A), 9(B), ★(C), R(D), #(E). Pada kotak soal terdapat karakter [★, #, 9, R]. Karakter yang tidak muncul (hilang) adalah \"K\", yang berada pada kolom (A).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "K",
        "label": "A"
      },
      {
        "char": "9",
        "label": "B"
      },
      {
        "char": "★",
        "label": "C"
      },
      {
        "char": "R",
        "label": "D"
      },
      {
        "char": "#",
        "label": "E"
      }
    ],
    "questionChars": [
      "★",
      "#",
      "9",
      "R"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (K)"
      },
      {
        "key": "B",
        "text": "Pilihan B (9)"
      },
      {
        "key": "C",
        "text": "Pilihan C (★)"
      },
      {
        "key": "D",
        "text": "Pilihan D (R)"
      },
      {
        "key": "E",
        "text": "Pilihan E (#)"
      }
    ]
  },
  {
    "id": 347,
    "module": "Tes Kecermatan — Kolom 5: Campuran Simbol, Huruf & Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 5: Campuran Simbol, Huruf & Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "B",
    "explanation": "Pada Kolom 5: Campuran Simbol, Huruf & Angka Hilang, patokan adalah K(A), 9(B), ★(C), R(D), #(E). Pada kotak soal terdapat karakter [R, K, #, ★]. Karakter yang tidak muncul (hilang) adalah \"9\", yang berada pada kolom (B).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "K",
        "label": "A"
      },
      {
        "char": "9",
        "label": "B"
      },
      {
        "char": "★",
        "label": "C"
      },
      {
        "char": "R",
        "label": "D"
      },
      {
        "char": "#",
        "label": "E"
      }
    ],
    "questionChars": [
      "R",
      "K",
      "#",
      "★"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (K)"
      },
      {
        "key": "B",
        "text": "Pilihan B (9)"
      },
      {
        "key": "C",
        "text": "Pilihan C (★)"
      },
      {
        "key": "D",
        "text": "Pilihan D (R)"
      },
      {
        "key": "E",
        "text": "Pilihan E (#)"
      }
    ]
  },
  {
    "id": 348,
    "module": "Tes Kecermatan — Kolom 5: Campuran Simbol, Huruf & Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 5: Campuran Simbol, Huruf & Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "C",
    "explanation": "Pada Kolom 5: Campuran Simbol, Huruf & Angka Hilang, patokan adalah K(A), 9(B), ★(C), R(D), #(E). Pada kotak soal terdapat karakter [9, #, K, R]. Karakter yang tidak muncul (hilang) adalah \"★\", yang berada pada kolom (C).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "K",
        "label": "A"
      },
      {
        "char": "9",
        "label": "B"
      },
      {
        "char": "★",
        "label": "C"
      },
      {
        "char": "R",
        "label": "D"
      },
      {
        "char": "#",
        "label": "E"
      }
    ],
    "questionChars": [
      "9",
      "#",
      "K",
      "R"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (K)"
      },
      {
        "key": "B",
        "text": "Pilihan B (9)"
      },
      {
        "key": "C",
        "text": "Pilihan C (★)"
      },
      {
        "key": "D",
        "text": "Pilihan D (R)"
      },
      {
        "key": "E",
        "text": "Pilihan E (#)"
      }
    ]
  },
  {
    "id": 349,
    "module": "Tes Kecermatan — Kolom 5: Campuran Simbol, Huruf & Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 5: Campuran Simbol, Huruf & Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "D",
    "explanation": "Pada Kolom 5: Campuran Simbol, Huruf & Angka Hilang, patokan adalah K(A), 9(B), ★(C), R(D), #(E). Pada kotak soal terdapat karakter [★, K, #, 9]. Karakter yang tidak muncul (hilang) adalah \"R\", yang berada pada kolom (D).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "K",
        "label": "A"
      },
      {
        "char": "9",
        "label": "B"
      },
      {
        "char": "★",
        "label": "C"
      },
      {
        "char": "R",
        "label": "D"
      },
      {
        "char": "#",
        "label": "E"
      }
    ],
    "questionChars": [
      "★",
      "K",
      "#",
      "9"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (K)"
      },
      {
        "key": "B",
        "text": "Pilihan B (9)"
      },
      {
        "key": "C",
        "text": "Pilihan C (★)"
      },
      {
        "key": "D",
        "text": "Pilihan D (R)"
      },
      {
        "key": "E",
        "text": "Pilihan E (#)"
      }
    ]
  },
  {
    "id": 350,
    "module": "Tes Kecermatan — Kolom 5: Campuran Simbol, Huruf & Angka Hilang",
    "subtest": "KECERMATAN",
    "stem": "Perhatikan patokan Kolom 5: Campuran Simbol, Huruf & Angka Hilang. Tentukan karakter yang HILANG pada kotak soal di bawah ini.",
    "correctKey": "E",
    "explanation": "Pada Kolom 5: Campuran Simbol, Huruf & Angka Hilang, patokan adalah K(A), 9(B), ★(C), R(D), #(E). Pada kotak soal terdapat karakter [9, R, K, ★]. Karakter yang tidak muncul (hilang) adalah \"#\", yang berada pada kolom (E).",
    "weight": 1,
    "isKecermatan": true,
    "columnNumber": 5,
    "benchmark": [
      {
        "char": "K",
        "label": "A"
      },
      {
        "char": "9",
        "label": "B"
      },
      {
        "char": "★",
        "label": "C"
      },
      {
        "char": "R",
        "label": "D"
      },
      {
        "char": "#",
        "label": "E"
      }
    ],
    "questionChars": [
      "9",
      "R",
      "K",
      "★"
    ],
    "options": [
      {
        "key": "A",
        "text": "Pilihan A (K)"
      },
      {
        "key": "B",
        "text": "Pilihan B (9)"
      },
      {
        "key": "C",
        "text": "Pilihan C (★)"
      },
      {
        "key": "D",
        "text": "Pilihan D (R)"
      },
      {
        "key": "E",
        "text": "Pilihan E (#)"
      }
    ]
  }
];

/* -------------------------------------------------------------------------- */
/* 4. KUMPULAN SOAL TKK (20 Butir Kemampuan Komputer)                    */
/* -------------------------------------------------------------------------- */
const QUESTIONS_TKK: SimQuestion[] = [
  {
    "id": 401,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri] Komponen fisik komputer disebut…",
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
    "stem": "[Kompetensi Komputer & TI Polri] Perangkat lunak yang mengelola perangkat keras dan aplikasi adalah…",
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
    "stem": "[Kompetensi Komputer & TI Polri] Pusat pemrosesan instruksi komputer adalah…",
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
    "stem": "[Kompetensi Komputer & TI Polri] RAM berfungsi sebagai…",
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
    "stem": "[Kompetensi Komputer & TI Polri] Perangkat untuk memasukkan teks adalah…",
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
    "stem": "[Kompetensi Komputer & TI Polri] Perangkat output visual adalah…",
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
    "stem": "[Kompetensi Komputer & TI Polri] Satuan kapasitas data digital adalah…",
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
    "stem": "[Kompetensi Komputer & TI Polri] Alat untuk mengubah dokumen kertas menjadi digital adalah…",
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
    "stem": "[Kompetensi Komputer & TI Polri] SSD dan HDD digunakan untuk…",
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
    "stem": "[Kompetensi Komputer & TI Polri] Salinan data untuk pemulihan saat data utama hilang disebut…",
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
    "stem": "[Kompetensi Komputer & TI Polri] Perangkat lunak berbahaya disebut…",
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
    "stem": "[Kompetensi Komputer & TI Polri] Papan utama tempat komponen komputer terhubung disebut…",
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
        "text": "Flashdisk\nWindows dan pengelolaan berkas"
      }
    ],
    "correctKey": "A",
    "explanation": "Motherboard menghubungkan prosesor, RAM, penyimpanan, dan komponen lain.\nWindows dan pengelolaan berkas",
    "weight": 10
  },
  {
    "id": 413,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "[Kompetensi Komputer & TI Polri] Ekstensi .docx umumnya untuk dokumen…",
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
    "stem": "[Kompetensi Komputer & TI Polri] Ekstensi .xlsx digunakan untuk…",
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
    "stem": "[Kompetensi Komputer & TI Polri] Ekstensi .pptx digunakan untuk…",
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
    "stem": "[Kompetensi Komputer & TI Polri] Ctrl+C berfungsi untuk…",
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
    "stem": "[Kompetensi Komputer & TI Polri] Ctrl+V berfungsi untuk…",
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
    "stem": "[Kompetensi Komputer & TI Polri] Ctrl+Z umumnya berfungsi untuk…",
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
    "stem": "[Kompetensi Komputer & TI Polri] Folder digunakan untuk…",
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
    "stem": "[Kompetensi Komputer & TI Polri] Recycle Bin menampung…",
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
  }
];

/* -------------------------------------------------------------------------- */
/* 5. KUMPULAN SOAL TPK (21 Butir Pengetahuan Kepolisian)                */
/* -------------------------------------------------------------------------- */
const QUESTIONS_TPK: SimQuestion[] = [
  {
    "id": 501,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi] Pilih satu jawaban paling tepat: A, B, C, atau D.",
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
    "id": 502,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi] Pancasila berkedudukan sebagai apa?\n A. Peraturan pemerintah",
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
    "id": 503,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "[Pengetahuan Kepolisian & Regulasi] Rumusan Pancasila tercantum dalam bagian mana dari UUD 1945?\n A. Batang tubuh Pasal 1",
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
    "stem": "[Pengetahuan Kepolisian & Regulasi] Sila ketiga Pancasila menekankan nilai apa?\n A. Persatuan Indonesia",
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
    "stem": "[Pengetahuan Kepolisian & Regulasi] Menurut UUD 1945, kedaulatan berada di tangan siapa?\n A. Presiden",
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
    "stem": "[Pengetahuan Kepolisian & Regulasi] Indonesia adalah negara apa menurut Pasal 1 ayat (3) UUD 1945?\n A. Negara kekuasaan",
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
    "stem": "[Pengetahuan Kepolisian & Regulasi] Lembaga yang memegang kekuasaan membentuk undang-undang adalah?\n A. DPR",
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
    "stem": "[Pengetahuan Kepolisian & Regulasi] Presiden menurut UUD 1945 memegang kekuasaan apa?\n A. Kehakiman",
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
    "stem": "[Pengetahuan Kepolisian & Regulasi] Bentuk negara Indonesia adalah?\n A. Serikat",
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
        "text": "Konfederasi\n\nSIMULASI TPK SIP — BUKAN SOAL RESMI / BOCORAN SELEKSI POLRI\nHalaman 4"
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
    "stem": "[Pengetahuan Kepolisian & Regulasi] Persamaan warga negara di hadapan hukum dikenal sebagai prinsip apa?\n A. Equality before the law",
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
    "stem": "[Pengetahuan Kepolisian & Regulasi] Pembatasan kekuasaan dalam negara hukum terutama bertujuan untuk apa?\n A. Mempercepat hukuman tanpa proses",
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
    "stem": "[Pengetahuan Kepolisian & Regulasi] Undang-undang pokok yang mengatur Polri adalah?\n A. UU 2 Tahun 2002",
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
    "stem": "[Pengetahuan Kepolisian & Regulasi] Tiga tugas pokok Polri meliputi apa?\n A. Membentuk UU, mengadili, memenjarakan",
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
    "stem": "[Pengetahuan Kepolisian & Regulasi] Polri berada di bawah siapa dalam struktur ketatanegaraan?\n A. DPR",
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
    "stem": "[Pengetahuan Kepolisian & Regulasi] Kapolri diangkat dan diberhentikan Presiden dengan persetujuan siapa?\n A. DPR",
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
    "stem": "[Pengetahuan Kepolisian & Regulasi] Fungsi kepolisian merupakan fungsi pemerintahan di bidang apa?\n A. Moneter",
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
    "stem": "[Pengetahuan Kepolisian & Regulasi] Polri sebagai Kepolisian Nasional berarti apa?\n A. Setiap daerah berdiri terpisah",
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
    "stem": "[Pengetahuan Kepolisian & Regulasi] Pelaksanaan tugas Polri harus menjunjung tinggi apa?\n A. Kepentingan pribadi",
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
        "text": "Kepentingan kelompok\n\nSIMULASI TPK SIP — BUKAN SOAL RESMI / BOCORAN SELEKSI POLRI\nHalaman 5"
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
    "stem": "[Pengetahuan Kepolisian & Regulasi] Contoh tugas preventif kepolisian adalah?\n A. Patroli pencegahan gangguan kamtibmas",
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
    "stem": "[Pengetahuan Kepolisian & Regulasi] Contoh tindakan represif dalam penegakan hukum adalah?\n A. Penyidikan tindak pidana sesuai hukum",
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
    "stem": "[Pengetahuan Kepolisian & Regulasi] Pelayanan publik Polri seharusnya seperti apa?\n A. Hanya untuk kenalan",
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
        "text": "Menolak kelompok rentan\n\nSIMULASI TPK SIP — BUKAN SOAL RESMI / BOCORAN SELEKSI POLRI\nHalaman 6"
      }
    ],
    "correctKey": "B",
    "explanation": "Pelayanan harus profesional, transparan, dan nondiskriminatif.",
    "weight": 10
  }
];

/* -------------------------------------------------------------------------- */
/* DAFTAR PAKET PRETEST CAT POLRI                                             */
/* -------------------------------------------------------------------------- */

export const SIMULATION_PACKETS: SimPacket[] = [
  {
    id: 'psikotes-all',
    category: 'PSIKOTES',
    subtest: 'ALL',
    title: 'Pretest CAT Psikotes — Semua Subtes (Campuran)',
    subtitle: 'Kecerdasan (40%), Mental Kepribadian (30%), dan Kecermatan (30%)',
    description:
      'Latihan gabungan 3 pilar psikotes standar CAT Polri. Dilengkapi penilaian bobot komposit resmi, jeda antar-subtes, dan ulasan komprehensif.',
    badge: 'Paket Utama Psikotes',
    durationSeconds: 75 * 60,
    questions: [...QUESTIONS_KECERDASAN, ...QUESTIONS_KEPRIBADIAN, ...QUESTIONS_KECERMATAN],
  },
  {
    id: 'psikotes-kecerdasan',
    category: 'PSIKOTES',
    subtest: 'KECERDASAN',
    title: 'Pretest CAT Psikotes — Subtes Kecerdasan',
    subtitle: 'Logika Spasial & Figural, Denah Wilayah, Aritmatika, dan Verbal',
    description:
      'Latihan fokus subtes kecerdasan mencakup soal bergambar pola figural, orientasi denah tata letak, aritmatika dasar, dan penalaran analitis.',
    badge: 'Bobot 40%',
    durationSeconds: 40 * 60,
    questions: QUESTIONS_KECERDASAN,
  },
  {
    id: 'psikotes-kepribadian',
    category: 'PSIKOTES',
    subtest: 'KEPRIBADIAN',
    title: 'Pretest CAT Psikotes — Subtes Mental Kepribadian',
    subtitle: 'Studi Kasus Lingkungan Kepolisian (Integritas, Sikap Kerja & Kepemimpinan)',
    description:
      'Latihan respons situasional kedinasan formal dengan skenario nyata tugas kepolisian. Setiap jawaban dinilai dengan skala bobot etika profesi.',
    badge: 'Bobot 30%',
    durationSeconds: 30 * 60,
    questions: QUESTIONS_KEPRIBADIAN,
  },
  {
    id: 'psikotes-kecermatan',
    category: 'PSIKOTES',
    subtest: 'KECERMATAN',
    title: 'Pretest CAT Psikotes — Subtes Kecermatan (Monokrom)',
    subtitle: '5 Kolom: Angka Hilang, Huruf Hilang, Simbol Hilang, dan Campuran',
    description:
      'Latihan kecepatan dan ketelitian format hitam putih (kolom putih standar CAT Polri). Berpindah otomatis per kolom dengan evaluasi kecepatan, akurasi, dan kestabilan.',
    badge: 'Bobot 30% • Monokrom',
    durationSeconds: 5 * 60,
    isKecermatanOnly: true,
    columnDurationSeconds: 60,
    questions: QUESTIONS_KECERMATAN,
  },
  {
    id: 'tkk',
    category: 'TKK',
    title: 'Pretest CAT — Tes Kemampuan Komputer (TKK)',
    subtitle: 'Hardware, Software OS, Jaringan Komputer, dan Keamanan Siber',
    description:
      'Latihan penguasaan teknologi informasi dan komunikasi untuk seleksi Polri dengan pembahasan mendalam di setiap butir soal.',
    badge: 'Uji Kompetensi TI',
    durationSeconds: 30 * 60,
    questions: QUESTIONS_TKK,
  },
  {
    id: 'tpk',
    category: 'TPK',
    title: 'Pretest CAT — Tes Pengetahuan Kepolisian (TPK)',
    subtitle: 'UU No. 2 Tahun 2002, Kode Etik Profesi, KUHAP & Wawasan Kebangsaan',
    description:
      'Uji pemahaman regulasi perundang-undangan kepolisian, etika dinas Polri, tupoksi, serta dasar wawasan kebangsaan RI.',
    badge: 'Regulasi Kedinasan',
    durationSeconds: 30 * 60,
    questions: QUESTIONS_TPK,
  },
  {
    id: 'cat-all',
    category: 'ALL',
    subtest: 'ALL',
    title: 'Pretest Komprehensif CAT Polri (Seluruh Modul)',
    subtitle: 'Psikotes (Kecerdasan, Kepribadian, Kecermatan) + TKK + TPK',
    description:
      'Try out komprehensif seluruh materi seleksi CAT Polri. Uji kesiapan menyeluruh sebelum menghadapi seleksi sesungguhnya.',
    badge: 'Simulasi Lengkap',
    durationSeconds: 120 * 60,
    questions: [
      ...QUESTIONS_KECERDASAN,
      ...QUESTIONS_KEPRIBADIAN,
      ...QUESTIONS_KECERMATAN,
      ...QUESTIONS_TKK,
      ...QUESTIONS_TPK,
    ],
  },
];
