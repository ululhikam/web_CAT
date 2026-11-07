/**
 * Bank Soal & Konfigurasi Paket Pretest CAT Polri (Seleksi SIP / Akpol / Bintara)
 * Audit & Perbaikan Standar CAT Polri:
 * 1. Kecerdasan: 100 Soal (90 Menit) — Figural Bergambar, Denah Peta & Arah, Deret Angka, Aritmatika, Verbal & Logika Alibi
 * 2. Mental Kepribadian: 100 Soal (60 Menit) — Studi Kasus Situasional Kedinasan Polri (SJT Skala 1–5)
 * 3. Kecermatan: 100 Soal (5 Kolom @ 20 Soal / 1 Menit per Kolom = 5 Menit) — Format Monokrom Putih CAT
 * 4. TKK: 100 Soal (90 Menit) — Tes Kemampuan Komputer & Keamanan Siber Kedinasan (Bersih dari Label Preffix)
 * 5. TPK: 100 Soal (60 Menit) — UU No. 2/2002, Kode Etik Profesi Polri & KUHAP (Bersih dari Label Preffix)
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
/* 1. KUMPULAN SOAL KECERDASAN (100 Butir: Figural, Denah, Deret, Aritmatika) */
/* -------------------------------------------------------------------------- */
const QUESTIONS_KECERDASAN: SimQuestion[] = [
  {
    "id": 101,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Figural Spasial] Perhatikan hubungan antara Bentuk A dan Bentuk B. Carilah hubungan yang setara untuk Bentuk C terhadap salah satu pilihan jawaban.",
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
    "explanation": "Pembahasan Soal #1 ➔ Jawaban: (A) Penjelasan: Pada seri analogi nomor 1, Bentuk A mengalami perubahan/transformasi geometri tertentu untuk menjadi Bentuk B. Berdasarkan aturan yang sama, Bentuk C jika ditransformasikan dengan pola serupa akan menghasilkan bentuk yang terdapat pada opsi **(A)**.",
    "weight": 10
  },
  {
    "id": 102,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Figural Spasial] Amati urutan perubahan dari Pola 1 hingga Pola 4. Tentukan gambar selanjutnya (Pola 5) yang melengkapi deret figural tersebut.",
    "image": "/images/questions/figural_q_2.png",
    "options": [
      {
        "key": "A",
        "text": "Rotasi 45° searah jarum jam dengan elemen interior penuh"
      },
      {
        "key": "B",
        "text": "Rotasi 90° searah jarum jam dengan penambahan satu titik sudut"
      },
      {
        "key": "C",
        "text": "Rotasi 135° berlawanan jarum jam dengan simetri lipat"
      },
      {
        "key": "D",
        "text": "Rotasi 180° dengan inversi warna hitam-putih"
      },
      {
        "key": "E",
        "text": "Pencerminan diagonal dengan pengurangan elemen garis"
      }
    ],
    "correctKey": "D",
    "explanation": "Pembahasan Soal #2 ➔ Jawaban: (D) Penjelasan: Perubahan dari Pola 1 hingga Pola 4 menunjukkan rotasi dan penambahan elemen berulang secara berurutan. Mengikuti urutan inkremental tersebut, Pola 5 yang tepat adalah **(D)**.",
    "weight": 10
  },
  {
    "id": 103,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Figural Spasial] Di antara kelima pilihan gambar (A, B, C, D, E), terdapat satu gambar yang tidak mengikuti pola kelompoknya (berbeda sendiri). Pilihlah gambar tersebut.",
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
    "explanation": "Pembahasan Soal #3 ➔ Jawaban: (B) Penjelasan: Empat dari lima opsi memiliki simetri dan jumlah elemen interior yang konisten, sedangkan opsi **(B)** memiliki struktur yang tidak sesuai dengan kaidah kelompoknya.",
    "weight": 10
  },
  {
    "id": 104,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Figural Spasial] Amati matriks 3x3 di bawah ini. Tentukan bentuk yang paling tepat untuk mengisi sel berlabel tanda tanya (?) sesuai konsistensi baris dan kolom.",
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
    "explanation": "Pembahasan Soal #4 ➔ Jawaban: (E) Penjelasan: Secara horizontal (baris) dan vertikal (kolom), elemen figural bertambah dan berganti selang-seling. Opsi yang memenuhi kombinasi logika matriks tersebut adalah **(E)**.",
    "weight": 10
  },
  {
    "id": 105,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Figural Spasial] Perhatikan hubungan antara Bentuk A dan Bentuk B. Carilah hubungan yang setara untuk Bentuk C terhadap salah satu pilihan jawaban.",
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
    "explanation": "Pembahasan Soal #5 ➔ Jawaban: (C) Penjelasan: Pada seri analogi nomor 5, Bentuk A mengalami perubahan/transformasi geometri tertentu untuk menjadi Bentuk B. Berdasarkan aturan yang sama, Bentuk C jika ditransformasikan dengan pola serupa akan menghasilkan bentuk yang terdapat pada opsi **(C)**.",
    "weight": 10
  },
  {
    "id": 106,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Figural Spasial] Amati urutan perubahan dari Pola 1 hingga Pola 4. Tentukan gambar selanjutnya (Pola 5) yang melengkapi deret figural tersebut.",
    "image": "/images/questions/figural_q_6.png",
    "options": [
      {
        "key": "A",
        "text": "Rotasi 45° searah jarum jam dengan elemen interior penuh"
      },
      {
        "key": "B",
        "text": "Rotasi 90° searah jarum jam dengan penambahan satu titik sudut"
      },
      {
        "key": "C",
        "text": "Rotasi 135° berlawanan jarum jam dengan simetri lipat"
      },
      {
        "key": "D",
        "text": "Rotasi 180° dengan inversi warna hitam-putih"
      },
      {
        "key": "E",
        "text": "Pencerminan diagonal dengan pengurangan elemen garis"
      }
    ],
    "correctKey": "A",
    "explanation": "Pembahasan Soal #6 ➔ Jawaban: (A) Penjelasan: Perubahan dari Pola 1 hingga Pola 4 menunjukkan rotasi dan penambahan elemen berulang secara berurutan. Mengikuti urutan inkremental tersebut, Pola 5 yang tepat adalah **(A)**.",
    "weight": 10
  },
  {
    "id": 107,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Figural Spasial] Di antara kelima pilihan gambar (A, B, C, D, E), terdapat satu gambar yang tidak mengikuti pola kelompoknya (berbeda sendiri). Pilihlah gambar tersebut.",
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
    "explanation": "Pembahasan Soal #7 ➔ Jawaban: (D) Penjelasan: Empat dari lima opsi memiliki simetri dan jumlah elemen interior yang konisten, sedangkan opsi **(D)** memiliki struktur yang tidak sesuai dengan kaidah kelompoknya.",
    "weight": 10
  },
  {
    "id": 108,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Figural Spasial] Amati matriks 3x3 di bawah ini. Tentukan bentuk yang paling tepat untuk mengisi sel berlabel tanda tanya (?) sesuai konsistensi baris dan kolom.",
    "image": "/images/questions/figural_q_8.png",
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
    "explanation": "Pembahasan Soal #8 ➔ Jawaban: (B) Penjelasan: Secara horizontal (baris) dan vertikal (kolom), elemen figural bertambah dan berganti selang-seling. Opsi yang memenuhi kombinasi logika matriks tersebut adalah **(B)**.",
    "weight": 10
  },
  {
    "id": 109,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Figural Spasial] Perhatikan hubungan antara Bentuk A dan Bentuk B. Carilah hubungan yang setara untuk Bentuk C terhadap salah satu pilihan jawaban.",
    "image": "/images/questions/figural_q_9.png",
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
    "explanation": "Pembahasan Soal #9 ➔ Jawaban: (E) Penjelasan: Pada seri analogi nomor 9, Bentuk A mengalami perubahan/transformasi geometri tertentu untuk menjadi Bentuk B. Berdasarkan aturan yang sama, Bentuk C jika ditransformasikan dengan pola serupa akan menghasilkan bentuk yang terdapat pada opsi **(E)**.",
    "weight": 10
  },
  {
    "id": 110,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Figural Spasial] Amati urutan perubahan dari Pola 1 hingga Pola 4. Tentukan gambar selanjutnya (Pola 5) yang melengkapi deret figural tersebut.",
    "image": "/images/questions/figural_q_10.png",
    "options": [
      {
        "key": "A",
        "text": "Rotasi 45° searah jarum jam dengan elemen interior penuh"
      },
      {
        "key": "B",
        "text": "Rotasi 90° searah jarum jam dengan penambahan satu titik sudut"
      },
      {
        "key": "C",
        "text": "Rotasi 135° berlawanan jarum jam dengan simetri lipat"
      },
      {
        "key": "D",
        "text": "Rotasi 180° dengan inversi warna hitam-putih"
      },
      {
        "key": "E",
        "text": "Pencerminan diagonal dengan pengurangan elemen garis"
      }
    ],
    "correctKey": "C",
    "explanation": "Pembahasan Soal #10 ➔ Jawaban: (C) Penjelasan: Perubahan dari Pola 1 hingga Pola 4 menunjukkan rotasi dan penambahan elemen berulang secara berurutan. Mengikuti urutan inkremental tersebut, Pola 5 yang tepat adalah **(C)**.",
    "weight": 10
  },
  {
    "id": 111,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Figural Spasial] Di antara kelima pilihan gambar (A, B, C, D, E), terdapat satu gambar yang tidak mengikuti pola kelompoknya (berbeda sendiri). Pilihlah gambar tersebut.",
    "image": "/images/questions/figural_q_11.png",
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
    "correctKey": "A",
    "explanation": "Pembahasan Soal #11 ➔ Jawaban: (A) Penjelasan: Empat dari lima opsi memiliki simetri dan jumlah elemen interior yang konisten, sedangkan opsi **(A)** memiliki struktur yang tidak sesuai dengan kaidah kelompoknya.",
    "weight": 10
  },
  {
    "id": 112,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Figural Spasial] Amati matriks 3x3 di bawah ini. Tentukan bentuk yang paling tepat untuk mengisi sel berlabel tanda tanya (?) sesuai konsistensi baris dan kolom.",
    "image": "/images/questions/figural_q_12.png",
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
    "correctKey": "D",
    "explanation": "Pembahasan Soal #12 ➔ Jawaban: (D) Penjelasan: Secara horizontal (baris) dan vertikal (kolom), elemen figural bertambah dan berganti selang-seling. Opsi yang memenuhi kombinasi logika matriks tersebut adalah **(D)**.",
    "weight": 10
  },
  {
    "id": 113,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Figural Spasial] Perhatikan hubungan antara Bentuk A dan Bentuk B. Carilah hubungan yang setara untuk Bentuk C terhadap salah satu pilihan jawaban.",
    "image": "/images/questions/figural_q_13.png",
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
    "correctKey": "B",
    "explanation": "Pembahasan Soal #13 ➔ Jawaban: (B) Penjelasan: Pada seri analogi nomor 13, Bentuk A mengalami perubahan/transformasi geometri tertentu untuk menjadi Bentuk B. Berdasarkan aturan yang sama, Bentuk C jika ditransformasikan dengan pola serupa akan menghasilkan bentuk yang terdapat pada opsi **(B)**.",
    "weight": 10
  },
  {
    "id": 114,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Figural Spasial] Amati urutan perubahan dari Pola 1 hingga Pola 4. Tentukan gambar selanjutnya (Pola 5) yang melengkapi deret figural tersebut.",
    "image": "/images/questions/figural_q_14.png",
    "options": [
      {
        "key": "A",
        "text": "Rotasi 45° searah jarum jam dengan elemen interior penuh"
      },
      {
        "key": "B",
        "text": "Rotasi 90° searah jarum jam dengan penambahan satu titik sudut"
      },
      {
        "key": "C",
        "text": "Rotasi 135° berlawanan jarum jam dengan simetri lipat"
      },
      {
        "key": "D",
        "text": "Rotasi 180° dengan inversi warna hitam-putih"
      },
      {
        "key": "E",
        "text": "Pencerminan diagonal dengan pengurangan elemen garis"
      }
    ],
    "correctKey": "E",
    "explanation": "Pembahasan Soal #14 ➔ Jawaban: (E) Penjelasan: Perubahan dari Pola 1 hingga Pola 4 menunjukkan rotasi dan penambahan elemen berulang secara berurutan. Mengikuti urutan inkremental tersebut, Pola 5 yang tepat adalah **(E)**.",
    "weight": 10
  },
  {
    "id": 115,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Figural Spasial] Di antara kelima pilihan gambar (A, B, C, D, E), terdapat satu gambar yang tidak mengikuti pola kelompoknya (berbeda sendiri). Pilihlah gambar tersebut.",
    "image": "/images/questions/figural_q_15.png",
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
    "correctKey": "C",
    "explanation": "Pembahasan Soal #15 ➔ Jawaban: (C) Penjelasan: Empat dari lima opsi memiliki simetri dan jumlah elemen interior yang konisten, sedangkan opsi **(C)** memiliki struktur yang tidak sesuai dengan kaidah kelompoknya.",
    "weight": 10
  },
  {
    "id": 116,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Figural Spasial] Amati matriks 3x3 di bawah ini. Tentukan bentuk yang paling tepat untuk mengisi sel berlabel tanda tanya (?) sesuai konsistensi baris dan kolom.",
    "image": "/images/questions/figural_q_16.png",
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
    "correctKey": "A",
    "explanation": "Pembahasan Soal #16 ➔ Jawaban: (A) Penjelasan: Secara horizontal (baris) dan vertikal (kolom), elemen figural bertambah dan berganti selang-seling. Opsi yang memenuhi kombinasi logika matriks tersebut adalah **(A)**.",
    "weight": 10
  },
  {
    "id": 117,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Denah Wilayah & Orientasi Arah] Berdasarkan denah di atas, bangunan yang berada tepat di sebelah utara R. Budi adalah...",
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
    "explanation": "Kunci Jawaban: (A). Pembahasan: R. Budi terletak di utara Jln. Kusuma Raya. Di sebelah utara R. Budi berbatasan langsung dengan pekarangan R. Ahmad.",
    "weight": 10
  },
  {
    "id": 118,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Denah Wilayah & Orientasi Arah] Bangunan yang terletak di sudut antara Jln. Kusuma Raya dan Jln. Rambutan di sebelah utara jalan adalah...",
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
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Pembahasan: Kantor Polisi terletak tepat di sudut pertemuan Jln. Kusuma Raya dan Jln. Rambutan di sisi utara.",
    "weight": 10
  },
  {
    "id": 119,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Denah Wilayah & Orientasi Arah] Masjid terletak di sebelah... dari Lapangan.",
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
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Pembahasan: Masjid terletak di sebelah utara dari Lapangan olah raga dan dibatasi jalur jalan utama.",
    "weight": 10
  },
  {
    "id": 120,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Denah Wilayah & Orientasi Arah] Jika seseorang berada di Balai Desa dan berjalan ke arah barat menyusuri Jln. Kusuma Raya, bangunan pertama di sebelah kanan jalan yang ditemuinya adalah...",
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
    "correctKey": "D",
    "explanation": "Kunci Jawaban: (D). Pembahasan: Dari Balai Desa menyusuri Jln. Kusuma Raya ke arah barat, bangunan pertama di sisi kanan jalan adalah R. Budi.",
    "weight": 10
  },
  {
    "id": 121,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Denah Wilayah & Orientasi Arah] Bangunan yang berada paling selatan pada wilayah yang dibatasi Jln. Pemuda adalah...",
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
    "explanation": "Kunci Jawaban: (A). Pembahasan: Bangunan yang berada paling selatan pada wilayah yang dibatasi Jln. Pemuda adalah R. Bayu.",
    "weight": 10
  },
  {
    "id": 122,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Denah Wilayah & Orientasi Arah] Rumah warga yang terletak tepat di sebelah timur Kantor Polisi adalah...",
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
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Pembahasan: Rumah warga yang terletak tepat di sebelah timur Kantor Polisi adalah R. Ahmad.",
    "weight": 10
  },
  {
    "id": 123,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Denah Wilayah & Orientasi Arah] Bangunan SD Brlian Jaya terletak di sebelah... Jln. Majapahit.",
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
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Pembahasan: SD Brlian Jaya terletak di sisi timur Jln. Majapahit dan di sebelah selatan Jln. Kusuma Raya.",
    "weight": 10
  },
  {
    "id": 124,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Denah Wilayah & Orientasi Arah] Di sebelah selatan R. Budi, dipisahkan oleh Jln. Kusuma Raya, berdiri bangunan...",
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
    "explanation": "Kunci Jawaban: (A). Pembahasan: Tepat di seberang selatan R. Budi adalah Gd. Serbaguna.",
    "weight": 10
  },
  {
    "id": 125,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Denah Wilayah & Orientasi Arah] Posisi R. Bagas terletak pada sudut persimpangan antara jalan...",
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
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Pembahasan: R. Bagas terletak di sebelah timur Jln. Merdeka dan di sebelah utara Jln. Sentosa.",
    "weight": 10
  },
  {
    "id": 126,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Denah Wilayah & Orientasi Arah] Rumah warga yang berdekatan langsung dengan batas utara Balai Desa adalah...",
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
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Pembahasan: Dari Balai Desa, rumah R. Sinta terletak di arah barat laut.",
    "weight": 10
  },
  {
    "id": 127,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Denah Wilayah & Orientasi Arah] Petugas patroli berangkat dari Kantor Polisi menuju Masjid. Rute jalan paling efisien yang dilalui adalah...",
    "image": "/images/questions/denah_lokasi_sip.png",
    "options": [
      {
        "key": "A",
        "text": "Jln. Rambutan -> Jln. Pemuda -> Jln. Sentosa"
      },
      {
        "key": "B",
        "text": "Jln. Kusuma Raya lurus ke timur -> belok kanan ke Jln. Merdeka -> belok kiri ke Jln. Sentosa"
      },
      {
        "key": "C",
        "text": "Jln. Kusuma Raya lurus ke timur -> belok kiri ke Jln. Majapahit -> belok kanan ke Jln. Sentosa"
      },
      {
        "key": "D",
        "text": "Jln. Kusuma Raya lurus ke timur -> belok kanan ke Jln. Pemuda -> belok kiri ke Jln. Sentosa"
      },
      {
        "key": "E",
        "text": "Jln. Madukara -> Jln. Majapahit -> Jln. Merdeka"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Pembahasan: Kantor Polisi berada di Jln. Kusuma Raya barat. Menyusuri Jln. Kusuma Raya ke arah timur menuju Balai Desa melewati 3 persimpangan jalan.",
    "weight": 10
  },
  {
    "id": 128,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Denah Wilayah & Orientasi Arah] Seorang murid dari R. Anita ingin pergi ke SD Brlian Jaya. Jalur yang paling tepat adalah berjalan ke utara menyusuri...",
    "image": "/images/questions/denah_lokasi_sip.png",
    "options": [
      {
        "key": "A",
        "text": "Jln. Pemuda -> belok timur ke Jln. Kusuma Raya -> belok utara ke Jln. Majapahit"
      },
      {
        "key": "B",
        "text": "Jln. Rambutan -> Jln. Madukara -> Jln. Majapahit"
      },
      {
        "key": "C",
        "text": "Jln. Merdeka -> Jln. Sentosa -> Jln. Pemuda"
      },
      {
        "key": "D",
        "text": "Jln. Sentosa -> Jln. Rambutan -> Jln. Kusuma Raya"
      },
      {
        "key": "E",
        "text": "Jln. Pemuda -> Jln. Sentosa -> Jln. Merdeka"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Pembahasan: R. Anita berada di Jln. Pemuda. Bergerak ke utara menyusuri Jln. Pemuda, di sebelah timur terdapat Lapangan.",
    "weight": 10
  },
  {
    "id": 129,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Denah Wilayah & Orientasi Arah] Apabila Jln. Madukara ditutup total karena perbaikan, warga dari R. Sinta yang akan ke KUD harus berputar melalui...",
    "image": "/images/questions/denah_lokasi_sip.png",
    "options": [
      {
        "key": "A",
        "text": "Jln. Majapahit -> Jln. Kusuma Raya -> Jln. Pemuda"
      },
      {
        "key": "B",
        "text": "Jln. Rambutan -> Jln. Sentosa -> Jln. Merdeka"
      },
      {
        "key": "C",
        "text": "Jln. Merdeka -> Jln. Sentosa -> Jln. Rambutan"
      },
      {
        "key": "D",
        "text": "Langsung menyeberang Lapangan"
      },
      {
        "key": "E",
        "text": "Jln. Kusuma Raya -> Jln. Rambutan -> Jln. Sentosa"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Pembahasan: Jika Jln. Madukara ditutup, rute tercepat dari R. Sinta menuju KUD adalah melalui Jln. Majapahit lalu belok barat ke Jln. Kusuma Raya.",
    "weight": 10
  },
  {
    "id": 130,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Denah Wilayah & Orientasi Arah] Kurir mengantar paket dari KUA ke R. Bagas. Jalan yang TIDAK perlu dilalui adalah...",
    "image": "/images/questions/denah_lokasi_sip.png",
    "options": [
      {
        "key": "A",
        "text": "Jln. Madukara"
      },
      {
        "key": "B",
        "text": "Jln. Kusuma Raya"
      },
      {
        "key": "C",
        "text": "Jln. Merdeka"
      },
      {
        "key": "D",
        "text": "Jln. Sentosa"
      },
      {
        "key": "E",
        "text": "Jln. Rambutan"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Pembahasan: KUA berada di Jln. Madukara, sedangkan R. Bagas berada di Jln. Sentosa bagian tenggara.",
    "weight": 10
  },
  {
    "id": 131,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Denah Wilayah & Orientasi Arah] Jalan yang membatasi antara Balai Desa dan SD Brlian Jaya adalah...",
    "image": "/images/questions/denah_lokasi_sip.png",
    "options": [
      {
        "key": "A",
        "text": "Jln. Madukara"
      },
      {
        "key": "B",
        "text": "Jln. Majapahit"
      },
      {
        "key": "C",
        "text": "Jln. Merdeka"
      },
      {
        "key": "D",
        "text": "Jln. Pemuda"
      },
      {
        "key": "E",
        "text": "Jln. Kusuma Raya"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Pembahasan: Balai Desa terletak di sebelah barat Jln. Majapahit, berhadapan diagonal dengan SD Brlian Jaya.",
    "weight": 10
  },
  {
    "id": 132,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Denah Wilayah & Orientasi Arah] Untuk memindahkan barang dari Gd. Serbaguna ke KUD, rute paling lurus adalah menyusuri...",
    "image": "/images/questions/denah_lokasi_sip.png",
    "options": [
      {
        "key": "A",
        "text": "Jln. Rambutan ke utara"
      },
      {
        "key": "B",
        "text": "Jln. Kusuma Raya bagian selatan ke arah timur"
      },
      {
        "key": "C",
        "text": "Jln. Pemuda ke selatan"
      },
      {
        "key": "D",
        "text": "Jln. Merdeka ke utara"
      },
      {
        "key": "E",
        "text": "Jln. Majapahit ke selatan"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Pembahasan: Gd. Serbaguna dan KUD berada di deretan bangunan sebelah selatan Jln. Kusuma Raya.",
    "weight": 10
  },
  {
    "id": 133,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Denah Wilayah & Orientasi Arah] Jika seorang warga berencana pergi dari R. Ahmad ke Balai Desa, berapakah persimpangan jalan utama yang harus dilewatinya?",
    "image": "/images/questions/denah_lokasi_sip.png",
    "options": [
      {
        "key": "A",
        "text": "1 persimpangan"
      },
      {
        "key": "B",
        "text": "2 persimpangan"
      },
      {
        "key": "C",
        "text": "3 persimpangan"
      },
      {
        "key": "D",
        "text": "4 persimpangan"
      },
      {
        "key": "E",
        "text": "Tanpa persimpangan"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Pembahasan: Dari R. Ahmad menyusuri Jln. Kusuma Raya ke timur: melintasi persimpangan Jln. Madukara dan Jln. Pemuda.",
    "weight": 10
  },
  {
    "id": 134,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Denah Wilayah & Orientasi Arah] Mobil polisi dari Kantor Polisi ingin menuju lokasi R. Bayu. Arah belokan pertama setelah menyusuri Jln. Kusuma Raya ke timur adalah belok...",
    "image": "/images/questions/denah_lokasi_sip.png",
    "options": [
      {
        "key": "A",
        "text": "Kiri masuk Jln. Madukara"
      },
      {
        "key": "B",
        "text": "Kanan masuk Jln. Pemuda"
      },
      {
        "key": "C",
        "text": "Kiri masuk Jln. Majapahit"
      },
      {
        "key": "D",
        "text": "Kanan masuk Jln. Merdeka"
      },
      {
        "key": "E",
        "text": "Putar balik ke Jln. Rambutan"
      }
    ],
    "correctKey": "A",
    "explanation": "Kunci Jawaban: (A). Pembahasan: R. Bayu berada di sebelah timur Jln. Pemuda (tepat di sisi selatan Jln. Kusuma Raya).",
    "weight": 10
  },
  {
    "id": 135,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Denah Wilayah & Orientasi Arah] Akses jalan tercepat dari R. Sari menuju Masjid adalah menyusuri...",
    "image": "/images/questions/denah_lokasi_sip.png",
    "options": [
      {
        "key": "A",
        "text": "Jln. Majapahit ke selatan -> belok timur ke Jln. Kusuma Raya -> belok selatan ke Jln. Merdeka"
      },
      {
        "key": "B",
        "text": "Jln. Rambutan -> Jln. Pemuda"
      },
      {
        "key": "C",
        "text": "Jln. Madukara -> Jln. Sentosa"
      },
      {
        "key": "D",
        "text": "Jln. Kusuma Raya -> Jln. Pemuda"
      },
      {
        "key": "E",
        "text": "Jln. Pemuda -> Jln. Merdeka"
      }
    ],
    "correctKey": "A",
    "explanation": "Kunci Jawaban: (A). Pembahasan: Dari R. Sari di utara Jln. Majapahit bergerak ke selatan di Jln. Majapahit sampai ujung, bangunan terakhir di sebelah barat adalah Balai Desa.",
    "weight": 10
  },
  {
    "id": 136,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Denah Wilayah & Orientasi Arah] Di manakah posisi Lapangan terhadap Jln. Pemuda dan Jln. Merdeka?",
    "image": "/images/questions/denah_lokasi_sip.png",
    "options": [
      {
        "key": "A",
        "text": "Di antara Jln. Pemuda (barat) dan Jln. Merdeka (timur)"
      },
      {
        "key": "B",
        "text": "Di sebelah utara Jln. Pemuda"
      },
      {
        "key": "C",
        "text": "Di sebelah timur Jln. Merdeka"
      },
      {
        "key": "D",
        "text": "Di sebelah selatan Jln. Sentosa"
      },
      {
        "key": "E",
        "text": "Di sebelah barat Jln. Rambutan"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Pembahasan: Lapangan terbuka hijau membentang vertikal di antara Jln. Pemuda di sebelah barat dan Jln. Merdeka di sebelah timur.",
    "weight": 10
  },
  {
    "id": 137,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Deret Angka & Pola Bilangan] Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 4, 7, 12, 19, 28, ...",
    "options": [
      {
        "key": "A",
        "text": "35"
      },
      {
        "key": "B",
        "text": "37"
      },
      {
        "key": "C",
        "text": "39"
      },
      {
        "key": "D",
        "text": "41"
      },
      {
        "key": "E",
        "text": "43"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Pola bertingkat selisih bertambah 2: +3, +5, +7, +9, +11. Angka berikutnya: 28 + 11 = 39.",
    "weight": 10
  },
  {
    "id": 138,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Deret Angka & Pola Bilangan] Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 3, 6, 12, 24, 48, ...",
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
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Pola geometri rasio 2 (dikalikan 2): 3×2=6, 6×2=12, 12×2=24, 24×2=48, 48×2=96.",
    "weight": 10
  },
  {
    "id": 139,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Deret Angka & Pola Bilangan] Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 2, 3, 5, 8, 13, 21, ...",
    "options": [
      {
        "key": "A",
        "text": "31"
      },
      {
        "key": "B",
        "text": "33"
      },
      {
        "key": "C",
        "text": "34"
      },
      {
        "key": "D",
        "text": "36"
      },
      {
        "key": "E",
        "text": "38"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Pola barisan Fibonacci (setiap suku adalah jumlah dua suku sebelumnya): 13 + 21 = 34.",
    "weight": 10
  },
  {
    "id": 140,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Deret Angka & Pola Bilangan] Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 100, 95, 85, 70, 50, ...",
    "options": [
      {
        "key": "A",
        "text": "20"
      },
      {
        "key": "B",
        "text": "25"
      },
      {
        "key": "C",
        "text": "30"
      },
      {
        "key": "D",
        "text": "35"
      },
      {
        "key": "E",
        "text": "40"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Pola selisih berkurang kelipatan 5 bertingkat: -5, -10, -15, -20, -25. Angka berikutnya: 50 - 25 = 25.",
    "weight": 10
  },
  {
    "id": 141,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Deret Angka & Pola Bilangan] Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 1, 4, 9, 16, 25, 36, ...",
    "options": [
      {
        "key": "A",
        "text": "45"
      },
      {
        "key": "B",
        "text": "47"
      },
      {
        "key": "C",
        "text": "49"
      },
      {
        "key": "D",
        "text": "51"
      },
      {
        "key": "E",
        "text": "55"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Pola bilangan kuadrat: 1², 2², 3², 4², 5², 6², 7² = 49.",
    "weight": 10
  },
  {
    "id": 142,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Deret Angka & Pola Bilangan] Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 5, 8, 16, 19, 38, 41, ...",
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
        "text": "84"
      },
      {
        "key": "E",
        "text": "86"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Pola kombinasi bergantian: +3, ×2, +3, ×2, +3, ×2. Angka berikutnya: 41 × 2 = 82.",
    "weight": 10
  },
  {
    "id": 143,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Deret Angka & Pola Bilangan] Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 2, 5, 10, 17, 26, 37, ...",
    "options": [
      {
        "key": "A",
        "text": "48"
      },
      {
        "key": "B",
        "text": "49"
      },
      {
        "key": "C",
        "text": "50"
      },
      {
        "key": "D",
        "text": "52"
      },
      {
        "key": "E",
        "text": "54"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Pola n² + 1: (1²+1=2), (2²+1=5), (3²+1=10), (4²+1=17), (5²+1=26), (6²+1=37), (7²+1=50).",
    "weight": 10
  },
  {
    "id": 144,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Deret Angka & Pola Bilangan] Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 64, 32, 16, 8, 4, ...",
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
        "text": "0"
      },
      {
        "key": "E",
        "text": "4"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Pola pembagian 2 (geometri r = 1/2): 4 ÷ 2 = 2.",
    "weight": 10
  },
  {
    "id": 145,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Deret Angka & Pola Bilangan] Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 3, 5, 9, 17, 33, ...",
    "options": [
      {
        "key": "A",
        "text": "57"
      },
      {
        "key": "B",
        "text": "61"
      },
      {
        "key": "C",
        "text": "65"
      },
      {
        "key": "D",
        "text": "69"
      },
      {
        "key": "E",
        "text": "73"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Pola penambahan kelipatan 2: +2, +4, +8, +16, +32. Angka berikutnya: 33 + 32 = 65.",
    "weight": 10
  },
  {
    "id": 146,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Deret Angka & Pola Bilangan] Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 12, 15, 20, 27, 36, ...",
    "options": [
      {
        "key": "A",
        "text": "43"
      },
      {
        "key": "B",
        "text": "45"
      },
      {
        "key": "C",
        "text": "47"
      },
      {
        "key": "D",
        "text": "49"
      },
      {
        "key": "E",
        "text": "52"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Pola deret bilangan prima/ganjil bertingkat: +3, +5, +7, +9, +11. Angka berikutnya: 36 + 11 = 47.",
    "weight": 10
  },
  {
    "id": 147,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Deret Angka & Pola Bilangan] Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 1, 2, 6, 24, 120, ...",
    "options": [
      {
        "key": "A",
        "text": "600"
      },
      {
        "key": "B",
        "text": "680"
      },
      {
        "key": "C",
        "text": "720"
      },
      {
        "key": "D",
        "text": "840"
      },
      {
        "key": "E",
        "text": "960"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Pola faktorial (×2, ×3, ×4, ×5, ×6): 120 × 6 = 720.",
    "weight": 10
  },
  {
    "id": 148,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Deret Angka & Pola Bilangan] Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 4, 8, 7, 14, 13, 26, ...",
    "options": [
      {
        "key": "A",
        "text": "23"
      },
      {
        "key": "B",
        "text": "24"
      },
      {
        "key": "C",
        "text": "25"
      },
      {
        "key": "D",
        "text": "27"
      },
      {
        "key": "E",
        "text": "28"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Pola kombinasi: ×2, -1, ×2, -1, ×2, -1. Angka berikutnya: 26 - 1 = 25.",
    "weight": 10
  },
  {
    "id": 149,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Deret Angka & Pola Bilangan] Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 21, 20, 18, 15, 11, ...",
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
        "text": "9"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Pola pengurangan bertingkat: -1, -2, -3, -4, -5. Angka berikutnya: 11 - 5 = 6.",
    "weight": 10
  },
  {
    "id": 150,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Deret Angka & Pola Bilangan] Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 2, 4, 8, 16, 32, 64, ...",
    "options": [
      {
        "key": "A",
        "text": "112"
      },
      {
        "key": "B",
        "text": "120"
      },
      {
        "key": "C",
        "text": "124"
      },
      {
        "key": "D",
        "text": "128"
      },
      {
        "key": "E",
        "text": "136"
      }
    ],
    "correctKey": "D",
    "explanation": "Kunci Jawaban: (D). Pola eksponensial basis 2: 2¹, 2², 2³, 2⁴, 2⁵, 2⁶, 2⁷ = 128.",
    "weight": 10
  },
  {
    "id": 151,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Deret Angka & Pola Bilangan] Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 10, 12, 16, 22, 30, ...",
    "options": [
      {
        "key": "A",
        "text": "38"
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
        "text": "44"
      },
      {
        "key": "E",
        "text": "46"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Pola penambahan bilangan genap bertingkat: +2, +4, +6, +8, +10. Angka berikutnya: 30 + 10 = 40.",
    "weight": 10
  },
  {
    "id": 152,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Deret Angka & Pola Bilangan] Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 81, 27, 9, 3, ...",
    "options": [
      {
        "key": "A",
        "text": "0"
      },
      {
        "key": "B",
        "text": "1"
      },
      {
        "key": "C",
        "text": "2"
      },
      {
        "key": "D",
        "text": "3"
      },
      {
        "key": "E",
        "text": "1/3"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Pola pembagian 3 (3⁴, 3³, 3², 3¹, 3⁰): 3 ÷ 3 = 1.",
    "weight": 10
  },
  {
    "id": 153,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Deret Angka & Pola Bilangan] Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 1, 3, 7, 15, 31, 63, ...",
    "options": [
      {
        "key": "A",
        "text": "121"
      },
      {
        "key": "B",
        "text": "125"
      },
      {
        "key": "C",
        "text": "127"
      },
      {
        "key": "D",
        "text": "129"
      },
      {
        "key": "E",
        "text": "135"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Pola (×2 + 1): 1×2+1=3, 3×2+1=7, 7×2+1=15, 15×2+1=31, 31×2+1=63, 63×2+1=127.",
    "weight": 10
  },
  {
    "id": 154,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Deret Angka & Pola Bilangan] Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 15, 14, 16, 15, 17, 16, ...",
    "options": [
      {
        "key": "A",
        "text": "16"
      },
      {
        "key": "B",
        "text": "17"
      },
      {
        "key": "C",
        "text": "18"
      },
      {
        "key": "D",
        "text": "19"
      },
      {
        "key": "E",
        "text": "20"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Pola dua larik selang-seling (+1 setiap dua langkah): suku berikutnya adalah 18.",
    "weight": 10
  },
  {
    "id": 155,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Deret Angka & Pola Bilangan] Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 2, 6, 12, 20, 30, 42, ...",
    "options": [
      {
        "key": "A",
        "text": "50"
      },
      {
        "key": "B",
        "text": "52"
      },
      {
        "key": "C",
        "text": "54"
      },
      {
        "key": "D",
        "text": "56"
      },
      {
        "key": "E",
        "text": "60"
      }
    ],
    "correctKey": "D",
    "explanation": "Kunci Jawaban: (D). Pola n × (n + 1): 1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=42, 7×8=56.",
    "weight": 10
  },
  {
    "id": 156,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Deret Angka & Pola Bilangan] Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 50, 48, 44, 38, 30, ...",
    "options": [
      {
        "key": "A",
        "text": "18"
      },
      {
        "key": "B",
        "text": "20"
      },
      {
        "key": "C",
        "text": "22"
      },
      {
        "key": "D",
        "text": "24"
      },
      {
        "key": "E",
        "text": "26"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Pola pengurangan bilangan genap: -2, -4, -6, -8, -10. Angka berikutnya: 30 - 10 = 20.",
    "weight": 10
  },
  {
    "id": 157,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Aritmatika Taktis] Mobil patroli polisi bergerak dengan kecepatan rata-rata 75 km/jam menuju lokasi TKP yang berjarak 150 km. Berapa waktu tempuh yang dibutuhkan?",
    "options": [
      {
        "key": "A",
        "text": "90 menit"
      },
      {
        "key": "B",
        "text": "105 menit"
      },
      {
        "key": "C",
        "text": "120 menit"
      },
      {
        "key": "D",
        "text": "135 menit"
      },
      {
        "key": "E",
        "text": "150 menit"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Waktu = Jarak / Kecepatan = 150 km / 75 km/jam = 2 jam (120 menit).",
    "weight": 10
  },
  {
    "id": 158,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Aritmatika Taktis] Sebuah regu pengamanan terdiri atas 12 personil. Jika rasio personil Polri terhadap massa aksi adalah 1 : 25, berapa jumlah massa maksimum yang dapat diamankan sesuai rasio tersebut?",
    "options": [
      {
        "key": "A",
        "text": "240 orang"
      },
      {
        "key": "B",
        "text": "280 orang"
      },
      {
        "key": "C",
        "text": "300 orang"
      },
      {
        "key": "D",
        "text": "320 orang"
      },
      {
        "key": "E",
        "text": "350 orang"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Jumlah massa = 12 × 25 = 300 orang.",
    "weight": 10
  },
  {
    "id": 159,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Aritmatika Taktis] Pada triwulan pertama tercatat 160 kasus kejahatan, dan pada triwulan kedua menurun menjadi 120 kasus. Berapakah persentase penurunan angka kejahatan tersebut?",
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
        "text": "33.3%"
      },
      {
        "key": "E",
        "text": "40%"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Penurunan = (160 - 120) / 160 × 100% = 40 / 160 × 100% = 25%.",
    "weight": 10
  },
  {
    "id": 160,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Aritmatika Taktis] Kendaraan dinas menghabiskan 8 liter bensin untuk menempuh jarak 96 km. Berapa liter bensin yang diperlukan untuk rute patroli sejauh 240 km?",
    "options": [
      {
        "key": "A",
        "text": "16 liter"
      },
      {
        "key": "B",
        "text": "18 liter"
      },
      {
        "key": "C",
        "text": "20 liter"
      },
      {
        "key": "D",
        "text": "22 liter"
      },
      {
        "key": "E",
        "text": "25 liter"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Konsumsi = 96 / 8 = 12 km/liter. Kebutuhan = 240 / 12 = 20 liter.",
    "weight": 10
  },
  {
    "id": 161,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Aritmatika Taktis] Sebuah pos polisi memiliki 45 personil. 60% dari personil bertugas di lapangan dan sisanya bertugas administrasi staf. Berapa personil yang bertugas administrasi staf?",
    "options": [
      {
        "key": "A",
        "text": "15 personil"
      },
      {
        "key": "B",
        "text": "18 personil"
      },
      {
        "key": "C",
        "text": "20 personil"
      },
      {
        "key": "D",
        "text": "24 personil"
      },
      {
        "key": "E",
        "text": "27 personil"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Personil staf = (100% - 60%) × 45 = 40% × 45 = 18 personil.",
    "weight": 10
  },
  {
    "id": 162,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Aritmatika Taktis] Dua mobil patroli berangkat dari Mapolres menuju lokasi perbatasan dari arah berlawanan. Mobil A melaju 60 km/jam dan Mobil B melaju 80 km/jam. Jika mereka berjarak 280 km, setelah berapa jam mereka akan berpapasan?",
    "options": [
      {
        "key": "A",
        "text": "1.5 jam"
      },
      {
        "key": "B",
        "text": "2.0 jam"
      },
      {
        "key": "C",
        "text": "2.5 jam"
      },
      {
        "key": "D",
        "text": "3.0 jam"
      },
      {
        "key": "E",
        "text": "3.5 jam"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Waktu berpapasan = Jarak total / (vA + vB) = 280 / (60 + 80) = 280 / 140 = 2 jam.",
    "weight": 10
  },
  {
    "id": 163,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Aritmatika Taktis] Rata-rata nilai tes jasmani 5 personil adalah 78. Jika 1 personil baru dengan nilai 90 bergabung, berapakah nilai rata-rata sekarang?",
    "options": [
      {
        "key": "A",
        "text": "79.0"
      },
      {
        "key": "B",
        "text": "80.0"
      },
      {
        "key": "C",
        "text": "81.0"
      },
      {
        "key": "D",
        "text": "82.5"
      },
      {
        "key": "E",
        "text": "84.0"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Total lama = 5 × 78 = 390. Total baru = 390 + 90 = 480. Rata-rata baru = 480 / 6 = 80.",
    "weight": 10
  },
  {
    "id": 164,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Aritmatika Taktis] Anggaran pemeliharaan sarpras sebesar Rp120.000.000 dialokasikan untuk 3 unit: Unit Patroli 50%, Unit Reskrim 30%, dan Unit Intelijen sisanya. Berapakah anggaran untuk Unit Intelijen?",
    "options": [
      {
        "key": "A",
        "text": "Rp18.000.000"
      },
      {
        "key": "B",
        "text": "Rp20.000.000"
      },
      {
        "key": "C",
        "text": "Rp24.000.000"
      },
      {
        "key": "D",
        "text": "Rp28.000.000"
      },
      {
        "key": "E",
        "text": "Rp32.000.000"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Persentase Intelijen = 100% - (50% + 30%) = 20%. Alokasi = 20% × Rp120.000.000 = Rp24.000.000.",
    "weight": 10
  },
  {
    "id": 165,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Aritmatika Taktis] Sebuah gudang logistik menyimpan 360 rompi antipeluru. Jika setiap peleton membutuhkan 45 rompi, berapa peleton yang dapat menerima perlengkapan tersebut secara lengkap?",
    "options": [
      {
        "key": "A",
        "text": "6 peleton"
      },
      {
        "key": "B",
        "text": "7 peleton"
      },
      {
        "key": "C",
        "text": "8 peleton"
      },
      {
        "key": "D",
        "text": "9 peleton"
      },
      {
        "key": "E",
        "text": "10 peleton"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Jumlah peleton = 360 / 45 = 8 peleton.",
    "weight": 10
  },
  {
    "id": 166,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Aritmatika Taktis] Empat petugas mampu memeriksa 120 berkas perkara dalam waktu 6 hari. Berapa berkas yang dapat diperiksa oleh 6 petugas dalam 4 hari dengan kecepatan kerja yang sama?",
    "options": [
      {
        "key": "A",
        "text": "100 berkas"
      },
      {
        "key": "B",
        "text": "110 berkas"
      },
      {
        "key": "C",
        "text": "120 berkas"
      },
      {
        "key": "D",
        "text": "130 berkas"
      },
      {
        "key": "E",
        "text": "140 berkas"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Produktivitas 1 orang per hari = 120 / (4 × 6) = 5 berkas. Maka 6 petugas dalam 4 hari = 6 × 4 × 5 = 120 berkas.",
    "weight": 10
  },
  {
    "id": 167,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Aritmatika Taktis] Harga 3 unit radio komunikasi HT dan 2 baterai cadangan adalah Rp4.800.000. Jika harga 1 baterai cadangan Rp300.000, berapakah harga 1 unit HT?",
    "options": [
      {
        "key": "A",
        "text": "Rp1.200.000"
      },
      {
        "key": "B",
        "text": "Rp1.300.000"
      },
      {
        "key": "C",
        "text": "Rp1.400.000"
      },
      {
        "key": "D",
        "text": "Rp1.500.000"
      },
      {
        "key": "E",
        "text": "Rp1.600.000"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Harga 2 baterai = Rp600.000. Total HT = Rp4.800.000 - Rp600.000 = Rp4.200.000. 1 unit HT = Rp4.200.000 / 3 = Rp1.400.000.",
    "weight": 10
  },
  {
    "id": 168,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Aritmatika Taktis] Waktu operasional pos pengamanan Lebaran adalah 24 jam non-stop yang dibagi rata ke dalam 4 shift giliran jaga. Berapa jam durasi setiap shift?",
    "options": [
      {
        "key": "A",
        "text": "4 jam"
      },
      {
        "key": "B",
        "text": "6 jam"
      },
      {
        "key": "C",
        "text": "8 jam"
      },
      {
        "key": "D",
        "text": "10 jam"
      },
      {
        "key": "E",
        "text": "12 jam"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Durasi shift = 24 jam / 4 = 6 jam.",
    "weight": 10
  },
  {
    "id": 169,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Aritmatika Taktis] Dari 200 pelanggar lalu lintas dalam operasi Zebra, 70% tidak membawa SIM, dan 45% tidak memakai helm SNI. Jika 25% melakukan kedua pelanggaran tersebut, berapa orang yang hanya melanggar salah satu aturan?",
    "options": [
      {
        "key": "A",
        "text": "110 orang"
      },
      {
        "key": "B",
        "text": "120 orang"
      },
      {
        "key": "C",
        "text": "130 orang"
      },
      {
        "key": "D",
        "text": "140 orang"
      },
      {
        "key": "E",
        "text": "150 orang"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Hanya SIM = 70% - 25% = 45%. Hanya Helm = 45% - 25% = 20%. Total salah satu = 45% + 20% = 65% dari 200 = 130 orang.",
    "weight": 10
  },
  {
    "id": 170,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Aritmatika Taktis] Jika x = 25% dari 480 dan y = 1/3 dari 360, maka hubungan x dan y yang tepat adalah...",
    "options": [
      {
        "key": "A",
        "text": "x > y"
      },
      {
        "key": "B",
        "text": "x < y"
      },
      {
        "key": "C",
        "text": "x = y"
      },
      {
        "key": "D",
        "text": "x = 2y"
      },
      {
        "key": "E",
        "text": "Hubungan tidak dapat ditentukan"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). x = 0.25 × 480 = 120. y = 1/3 × 360 = 120. Jadi x = y.",
    "weight": 10
  },
  {
    "id": 171,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Aritmatika Taktis] Suatu regu menempuh 18 km dalam 20 menit saat patroli darurat. Berapakah kecepatan rata-rata mobil patroli dalam satuan km/jam?",
    "options": [
      {
        "key": "A",
        "text": "48 km/jam"
      },
      {
        "key": "B",
        "text": "50 km/jam"
      },
      {
        "key": "C",
        "text": "54 km/jam"
      },
      {
        "key": "D",
        "text": "60 km/jam"
      },
      {
        "key": "E",
        "text": "64 km/jam"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Kecepatan = Jarak / (Waktu dlm jam) = 18 km / (20/60 jam) = 18 × 3 = 54 km/jam.",
    "weight": 10
  },
  {
    "id": 172,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Aritmatika Taktis] Seorang penyidik memeriksa saksi dari pukul 08.45 sampai 11.15 WIB. Berapa total menit durasi pemeriksaan berlangsung?",
    "options": [
      {
        "key": "A",
        "text": "135 menit"
      },
      {
        "key": "B",
        "text": "145 menit"
      },
      {
        "key": "C",
        "text": "150 menit"
      },
      {
        "key": "D",
        "text": "155 menit"
      },
      {
        "key": "E",
        "text": "165 menit"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Dari 08.45 ke 11.15 = 2 jam 30 menit = 150 menit.",
    "weight": 10
  },
  {
    "id": 173,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Analogi Kedinasan] Bareskrim : Reserse = Korlantas : ...",
    "options": [
      {
        "key": "A",
        "text": "Sabhara"
      },
      {
        "key": "B",
        "text": "Lalu Lintas"
      },
      {
        "key": "C",
        "text": "Brimob"
      },
      {
        "key": "D",
        "text": "Propam"
      },
      {
        "key": "E",
        "text": "Humas"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Bareskrim membidangi tugas reserse kriminal; Korlantas membidangi lalu lintas.",
    "weight": 10
  },
  {
    "id": 174,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Analogi Kedinasan] Borgol : Tersangka = Helm Baja : ...",
    "options": [
      {
        "key": "A",
        "text": "Saksi"
      },
      {
        "key": "B",
        "text": "Terdakwa"
      },
      {
        "key": "C",
        "text": "Pasukan Dalmas"
      },
      {
        "key": "D",
        "text": "Korban"
      },
      {
        "key": "E",
        "text": "Penyidik"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Borgol digunakan pada tersangka; helm baja digunakan oleh pasukan Pengendalian Massa (Dalmas) sebagai perlindungan.",
    "weight": 10
  },
  {
    "id": 175,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Analogi Kedinasan] Sinonim kata DISKRESI dalam pelaksanaan tugas kepolisian adalah...",
    "options": [
      {
        "key": "A",
        "text": "Kewenangan bertindak objektif"
      },
      {
        "key": "B",
        "text": "Kewajiban administratif"
      },
      {
        "key": "C",
        "text": "Pemberhentian dinas"
      },
      {
        "key": "D",
        "text": "Perintah tertulis mutlak"
      },
      {
        "key": "E",
        "text": "Pelanggaran disiplin"
      }
    ],
    "correctKey": "A",
    "explanation": "Kunci Jawaban: (A). Diskresi berarti kebebasan mengambil keputusan sendiri berdasarkan pertimbangan situasi yang tepat dan bertanggung jawab.",
    "weight": 10
  },
  {
    "id": 176,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Analogi Kedinasan] Lawan kata (antonim) yang paling tepat untuk istilah OBJEKTIF adalah...",
    "options": [
      {
        "key": "A",
        "text": "Faktual"
      },
      {
        "key": "B",
        "text": "Rasional"
      },
      {
        "key": "C",
        "text": "Subjektif"
      },
      {
        "key": "D",
        "text": "Netral"
      },
      {
        "key": "E",
        "text": "Transparan"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Objektif berarti berdasarkan fakta sebenarnya tanpa dipengaruhi perasaan; lawannya adalah subjektif.",
    "weight": 10
  },
  {
    "id": 177,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Analogi Kedinasan] Kompas : Arah = Speedometer : ...",
    "options": [
      {
        "key": "A",
        "text": "Jarak"
      },
      {
        "key": "B",
        "text": "Suhu"
      },
      {
        "key": "C",
        "text": "Kecepatan"
      },
      {
        "key": "D",
        "text": "Bahan bakar"
      },
      {
        "key": "E",
        "text": "Waktu"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Kompas mengukur arah mata angin; speedometer mengukur kecepatan laju kendaraan.",
    "weight": 10
  },
  {
    "id": 178,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Analogi Kedinasan] Jaksa : Penuntutan = Hakim : ...",
    "options": [
      {
        "key": "A",
        "text": "Penyidikan"
      },
      {
        "key": "B",
        "text": "Pembelaan"
      },
      {
        "key": "C",
        "text": "Pengadilan / Memutus perkara"
      },
      {
        "key": "D",
        "text": "Penggeledahan"
      },
      {
        "key": "E",
        "text": "Penangkapan"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Jaksa bertugas melakukan penuntutan perkara di persidangan; Hakim bertugas mengadili dan memutus perkara.",
    "weight": 10
  },
  {
    "id": 179,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Analogi Kedinasan] Sinonim kata INTEGRITAS yang paling dekat maknanya adalah...",
    "options": [
      {
        "key": "A",
        "text": "Kekuasaan"
      },
      {
        "key": "B",
        "text": "Kejujuran dan keteguhan moral"
      },
      {
        "key": "C",
        "text": "Kecepatan bertindak"
      },
      {
        "key": "D",
        "text": "Ketenaran"
      },
      {
        "key": "E",
        "text": "Kecerdasan akademik"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Integritas bermakna kejujuran, keteguhan moral, dan keselarasan antara perkataan dengan tindakan.",
    "weight": 10
  },
  {
    "id": 180,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Analogi Kedinasan] Dokter : Rumah Sakit = Polisi : ...",
    "options": [
      {
        "key": "A",
        "text": "Pengadilan"
      },
      {
        "key": "B",
        "text": "Kantor Polisi"
      },
      {
        "key": "C",
        "text": "Rutan"
      },
      {
        "key": "D",
        "text": "Kecamatan"
      },
      {
        "key": "E",
        "text": "Pos ronda"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Dokter bertugas di rumah sakit; polisi bertugas di kantor polisi (Mapolres/Mapolsek).",
    "weight": 10
  },
  {
    "id": 181,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Analogi Kedinasan] Pilihlah kelompok kata yang TIDAK setara dengan yang lain:",
    "options": [
      {
        "key": "A",
        "text": "Borgol"
      },
      {
        "key": "B",
        "text": "Pistol dinas"
      },
      {
        "key": "C",
        "text": "Tongkat T"
      },
      {
        "key": "D",
        "text": "Stempel dinas"
      },
      {
        "key": "E",
        "text": "Helm baja"
      }
    ],
    "correctKey": "D",
    "explanation": "Kunci Jawaban: (D). Borgol, pistol, tongkat T, dan helm baja adalah perlengkapan operasional taktis Polri, sedangkan stempel dinas adalah alat administrasi kantor.",
    "weight": 10
  },
  {
    "id": 182,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Analogi Kedinasan] KUHAP : Hukum Acara Pidana = KUHP : ...",
    "options": [
      {
        "key": "A",
        "text": "Hukum Perdata"
      },
      {
        "key": "B",
        "text": "Hukum Pidana Materiil"
      },
      {
        "key": "C",
        "text": "Hukum Dagang"
      },
      {
        "key": "D",
        "text": "Hukum Tata Negara"
      },
      {
        "key": "E",
        "text": "Hukum Adat"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). KUHAP mengatur hukum acara formal pidana; KUHP mengatur hukum pidana materiil.",
    "weight": 10
  },
  {
    "id": 183,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Analogi Kedinasan] Sinonim kata YURISDIKSI dalam hukum kepolisian adalah...",
    "options": [
      {
        "key": "A",
        "text": "Kewenangan wilayah hukum"
      },
      {
        "key": "B",
        "text": "Perlindungan saksi"
      },
      {
        "key": "C",
        "text": "Penegakan etika"
      },
      {
        "key": "D",
        "text": "Bantuan operasional"
      },
      {
        "key": "E",
        "text": "Gelar perkara"
      }
    ],
    "correctKey": "A",
    "explanation": "Kunci Jawaban: (A). Yurisdiksi adalah batas wilayah atau lingkungan kekuasaan hukum berlakunya suatu kewenangan.",
    "weight": 10
  },
  {
    "id": 184,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Analogi Kedinasan] Lawan kata dari TRANSPARAN dalam pelayanan publik adalah...",
    "options": [
      {
        "key": "A",
        "text": "Terbuka"
      },
      {
        "key": "B",
        "text": "Akuntabel"
      },
      {
        "key": "C",
        "text": "Tertutup"
      },
      {
        "key": "D",
        "text": "Terukur"
      },
      {
        "key": "E",
        "text": "Inklusif"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Transparan berarti terbuka dan jelas; lawannya adalah tertutup / rahasia gelap.",
    "weight": 10
  },
  {
    "id": 185,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Analogi Kedinasan] Patroli : Pencegahan = Olah TKP : ...",
    "options": [
      {
        "key": "A",
        "text": "Penuntutan"
      },
      {
        "key": "B",
        "text": "Pengungkapan bukti"
      },
      {
        "key": "C",
        "text": "Penghukuman"
      },
      {
        "key": "D",
        "text": "Pengawasan"
      },
      {
        "key": "E",
        "text": "Penghentian perkara"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Patroli berfungsi sebagai upaya preventif (pencegahan); Olah TKP berfungsi untuk pengungkapan tindak pidana (investigasi).",
    "weight": 10
  },
  {
    "id": 186,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Analogi Kedinasan] Tribrata : Falsafah Hidup = Catur Prasetya : ...",
    "options": [
      {
        "key": "A",
        "text": "Peraturan lalu lintas"
      },
      {
        "key": "B",
        "text": "Pedoman kerja Polri"
      },
      {
        "key": "C",
        "text": "Hukum perdata"
      },
      {
        "key": "D",
        "text": "Standar operasional toko"
      },
      {
        "key": "E",
        "text": "Sanksi disiplin"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Tribrata merupakan falsafah hidup Polri; Catur Prasetya merupakan pedoman kerja insan Bhayangkara.",
    "weight": 10
  },
  {
    "id": 187,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Analogi Kedinasan] Surat Perintah Tugas : Sprin = Laporan Polisi : ...",
    "options": [
      {
        "key": "A",
        "text": "LP"
      },
      {
        "key": "B",
        "text": "BAP"
      },
      {
        "key": "C",
        "text": "SPDP"
      },
      {
        "key": "D",
        "text": "SP3"
      },
      {
        "key": "E",
        "text": "STPL"
      }
    ],
    "correctKey": "A",
    "explanation": "Kunci Jawaban: (A). Singkatan resmi kedinasan dari Laporan Polisi adalah LP.",
    "weight": 10
  },
  {
    "id": 188,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Verbal & Analogi Kedinasan] Antonim kata RESISTENSI dalam dinamika sosial kemasyarakatan adalah...",
    "options": [
      {
        "key": "A",
        "text": "Penolakan"
      },
      {
        "key": "B",
        "text": "Perlawanan"
      },
      {
        "key": "C",
        "text": "Kepatuhan / Penerimaan"
      },
      {
        "key": "D",
        "text": "Ketegangan"
      },
      {
        "key": "E",
        "text": "Kerusuhan"
      }
    ],
    "correctKey": "C",
    "explanation": "Kunci Jawaban: (C). Resistensi berarti perlawanan atau penolakan; lawannya adalah kepatuhan atau penerimaan.",
    "weight": 10
  },
  {
    "id": 189,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Logis & Silogisme Penyidikan] Semua penyidik Polri berpangkat perwira. Sebagian penyidik Polri memiliki sertifikasi audit forensik. Kesimpulan yang sah adalah...",
    "options": [
      {
        "key": "A",
        "text": "Semua perwira Polri pasti bersertifikasi audit forensik"
      },
      {
        "key": "B",
        "text": "Sebagian perwira Polri memiliki sertifikasi audit forensik"
      },
      {
        "key": "C",
        "text": "Tidak ada perwira Polri yang bersertifikasi audit forensik"
      },
      {
        "key": "D",
        "text": "Semua yang memiliki sertifikasi forensik bukan penyidik"
      },
      {
        "key": "E",
        "text": "Penyidik tidak perlu berpangkat perwira"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Karena semua penyidik berpangkat perwira dan sebagian memiliki sertifikasi audit forensik, maka sebagian perwira Polri memiliki sertifikasi audit forensik.",
    "weight": 10
  },
  {
    "id": 190,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Logis & Silogisme Penyidikan] Jika hujan lebat disertai badai, maka apel siaga dilakukan di aula dalam. Pagi ini apel siaga dilaksanakan di lapangan terbuka. Kesimpulan yang pasti adalah...",
    "options": [
      {
        "key": "A",
        "text": "Pagi ini hujan lebat di aula"
      },
      {
        "key": "B",
        "text": "Pagi ini tidak hujan lebat disertai badai"
      },
      {
        "key": "C",
        "text": "Apel siaga dibatalkan komandan"
      },
      {
        "key": "D",
        "text": "Aula dalam sedang direnovasi"
      },
      {
        "key": "E",
        "text": "Hujan terjadi setelah apel selesai"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Menggunakan modus tollens: p -> q, ~q, maka ~p. Karena apel tidak di aula dalam, maka pagi ini tidak hujan lebat disertai badai.",
    "weight": 10
  },
  {
    "id": 191,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Logis & Silogisme Penyidikan] Empat saksi diperiksa terkait waktu keberadaan di TKP perampokan pada pukul 21.00 WIB:\n- Saksi A: 'Saya bersama Saksi B di warung kopi pukul 20.45 - 21.30.'\n- Saksi B: 'Saya sendirian di rumah membaca buku sejak pukul 20.00.'\n- Saksi C: 'Saya melihat Saksi D di pasar pukul 21.00.'\n- Saksi D: 'Saya berada di pasar membeli obat pukul 21.00.'\nBerdasarkan alibi di atas, dua saksi yang keterangannya saling bertentangan secara langsung adalah...",
    "options": [
      {
        "key": "A",
        "text": "Saksi C dan Saksi D"
      },
      {
        "key": "B",
        "text": "Saksi A dan Saksi B"
      },
      {
        "key": "C",
        "text": "Saksi B dan Saksi C"
      },
      {
        "key": "D",
        "text": "Saksi A dan Saksi D"
      },
      {
        "key": "E",
        "text": "Semua saksi selaras"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Keterangan Saksi A mengatakan ia bersama Saksi B, sedangkan Saksi B menyatakan ia sendirian di rumah. Pernyataan A dan B bertentangan langsung.",
    "weight": 10
  },
  {
    "id": 192,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Logis & Silogisme Penyidikan] Semua kendaraan operasional kepolisian wajib diperiksa kelaikannya secara berkala. Kendaraan X tidak diperiksa kelaikannya secara berkala. Kesimpulan yang tepat adalah...",
    "options": [
      {
        "key": "A",
        "text": "Kendaraan X adalah mobil dinas pimpinan"
      },
      {
        "key": "B",
        "text": "Kendaraan X bukan kendaraan operasional kepolisian yang aktif"
      },
      {
        "key": "C",
        "text": "Kendaraan X telah lulus uji emisi"
      },
      {
        "key": "D",
        "text": "Semua kendaraan polisi tidak laik jalan"
      },
      {
        "key": "E",
        "text": "Pemeriksaan kelaikan ditunda sepihak"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Semua kendaraan operasional diperiksa berkala. Kendaraan X tidak diperiksa, maka Kendaraan X bukan kendaraan operasional kepolisian yang aktif digunakan.",
    "weight": 10
  },
  {
    "id": 193,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Logis & Silogisme Penyidikan] Tidak ada anggota kepolisian yang diperbolehkan mengonsumsi narkotika. Bripka Z adalah anggota kepolisian. Kesimpulan yang pasti adalah...",
    "options": [
      {
        "key": "A",
        "text": "Bripka Z bebas dari pengawasan Propam"
      },
      {
        "key": "B",
        "text": "Bripka Z tidak diperbolehkan mengonsumsi narkotika"
      },
      {
        "key": "C",
        "text": "Bripka Z bertugas di Satresnarkoba"
      },
      {
        "key": "D",
        "text": "Sebagian polisi boleh memakai obat penenang"
      },
      {
        "key": "E",
        "text": "Bripka Z telah menjalani tes urine"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Semua anggota Polri dilarang konsumsi narkoba. Karena Bripka Z anggota kepolisian, maka Bripka Z tidak diperbolehkan mengonsumsi narkotika.",
    "weight": 10
  },
  {
    "id": 194,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Logis & Silogisme Penyidikan] Di sebuah persimpangan jalan, kendaraan dari arah Barat hanya boleh belok kiri atau lurus. Mobil patroli datang dari arah Barat dan tidak belok kiri. Maka mobil patroli tersebut...",
    "options": [
      {
        "key": "A",
        "text": "Berbalik arah kembali ke Barat"
      },
      {
        "key": "B",
        "text": "Bergerak lurus ke arah Timur"
      },
      {
        "key": "C",
        "text": "Belok kanan ke arah Selatan"
      },
      {
        "key": "D",
        "text": "Berhenti permanen"
      },
      {
        "key": "E",
        "text": "Masuk ke jalur trotoar"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Pilihan arah dari Barat hanya belok kiri atau lurus. Jika tidak belok kiri, maka dipastikan bergerak lurus.",
    "weight": 10
  },
  {
    "id": 195,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Logis & Silogisme Penyidikan] Semua dokumen rahasia berkas penyidikan disimpan dalam brankas terkunci. Dokumen Berkas M tidak disimpan dalam brankas terkunci. Kesimpulan yang logis adalah...",
    "options": [
      {
        "key": "A",
        "text": "Berkas M adalah dokumen sangat rahasia"
      },
      {
        "key": "B",
        "text": "Berkas M bukan dokumen rahasia penyidikan"
      },
      {
        "key": "C",
        "text": "Brankas penyidik rusak"
      },
      {
        "key": "D",
        "text": "Berkas M telah hilang"
      },
      {
        "key": "E",
        "text": "Semua berkas penyidik tidak rahasia"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Jika semua dokumen rahasia terkunci, maka berkas M yang tidak terkunci bukan dokumen rahasia berkas penyidikan.",
    "weight": 10
  },
  {
    "id": 196,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Logis & Silogisme Penyidikan] Jika seorang anggota Polri terbukti melanggar kode etik berat, maka ia akan menjalani Sidang KKEP. Inspektur Dua D tidak menjalani Sidang KKEP. Maka kesimpulannya adalah...",
    "options": [
      {
        "key": "A",
        "text": "Inspektur Dua D terbukti melanggar kode etik berat"
      },
      {
        "key": "B",
        "text": "Inspektur Dua D tidak terbukti melanggar kode etik berat"
      },
      {
        "key": "C",
        "text": "Sidang KKEP belum dijadwalkan"
      },
      {
        "key": "D",
        "text": "Inspektur Dua D dimutasi ke Yanma"
      },
      {
        "key": "E",
        "text": "Pelanggaran dialihkan ke peradilan umum"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Modus tollens: Inspektur Dua D tidak terbukti melanggar kode etik berat.",
    "weight": 10
  },
  {
    "id": 197,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Logis & Silogisme Penyidikan] Setiap tindakan penangkapan oleh penyidik wajib dilengkapi Surat Perintah Penangkapan, kecuali dalam hal tertangkap tangan. Petugas menangkap tersangka Z tanpa Surat Perintah Penangkapan yang sah. Maka penangkapan tersebut sah HANYA JIKA...",
    "options": [
      {
        "key": "A",
        "text": "Tersangka berjanji kooperatif"
      },
      {
        "key": "B",
        "text": "Terjadi dalam keadaan tertangkap tangan"
      },
      {
        "key": "C",
        "text": "Penyidik berpangkat perwira menengah"
      },
      {
        "key": "D",
        "text": "Keluarga tersangka menyetujui"
      },
      {
        "key": "E",
        "text": "Tindak pidana diancam di bawah 5 tahun"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Berdasarkan KUHAP Pasal 18 ayat (2), penangkapan tanpa surat perintah penangkapan hanya sah jika pelaku tertangkap tangan.",
    "weight": 10
  },
  {
    "id": 198,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Logis & Silogisme Penyidikan] Urutan prioritas pertama petugas kepolisian saat pertama kali tiba di TKP kecelakaan lalu lintas dengan korban luka parah adalah...",
    "options": [
      {
        "key": "A",
        "text": "Mengamankan dan menolong korban luka ke fasilitas medis terdekat"
      },
      {
        "key": "B",
        "text": "Memeriksa SIM dan STNK pengemudi"
      },
      {
        "key": "C",
        "text": "Menghubungi wartawan untuk rilis pers"
      },
      {
        "key": "D",
        "text": "Mengukur panjang jejak rem kendaraan"
      },
      {
        "key": "E",
        "text": "Mengamankan barang bawaan yang berserakan"
      }
    ],
    "correctKey": "A",
    "explanation": "Kunci Jawaban: (A). Prioritas mutlak utama kepolisian di TKP adalah keselamatan nyawa manusia: menolong korban dan mengamankan pertolongan medis segera.",
    "weight": 10
  },
  {
    "id": 199,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Logis & Silogisme Penyidikan] Semua anggota Dalmas wajib memakai helm pelindung dan tameng. Sebagian anggota Dalmas membawa alat pelontar gas air mata. Kesimpulan yang sah adalah...",
    "options": [
      {
        "key": "A",
        "text": "Semua anggota Dalmas membawa pelontar gas air mata"
      },
      {
        "key": "B",
        "text": "Sebagian anggota yang membawa pelontar gas air mata wajib memakai helm dan tameng"
      },
      {
        "key": "C",
        "text": "Alat pelontar gas air mata menggantikan tameng"
      },
      {
        "key": "D",
        "text": "Tidak ada anggota Dalmas yang memakai tameng"
      },
      {
        "key": "E",
        "text": "Helm pelindung hanya untuk komandan kompi"
      }
    ],
    "correctKey": "B",
    "explanation": "Kunci Jawaban: (B). Sebagian anggota yang membawa pelontar gas air mata tetap memakai helm pelindung dan tameng.",
    "weight": 10
  },
  {
    "id": 200,
    "module": "Tes Psikologi — Kecerdasan (SIP Polri)",
    "subtest": "KECERDASAN",
    "stem": "[Penalaran Logis & Silogisme Penyidikan] Hasil penyelidikan menunjukkan bahwa Pelaku kejahatan memiliki ciri: bertato di lengan kiri ATAU memakai jaket hitam. Tersangka K tidak bertato di lengan kiri, namun ia terbukti sebagai pelaku. Maka tersangka K...",
    "options": [
      {
        "key": "A",
        "text": "Memakai jaket hitam"
      },
      {
        "key": "B",
        "text": "Tidak memakai jaket apapun"
      },
      {
        "key": "C",
        "text": "Memiliki tato di lengan kanan"
      },
      {
        "key": "D",
        "text": "Bukan merupakan tersangka yang dicari"
      },
      {
        "key": "E",
        "text": "Mengganti pakaian sebelum diperiksa"
      }
    ],
    "correctKey": "A",
    "explanation": "Kunci Jawaban: (A). Pernyataan disjungtif (A atau B). Karena tidak A, maka dipastikan B (tersangka K memakai jaket hitam).",
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
    "stem": "Anda mengetahui rekan kerja mengubah angka dalam laporan rekapitulasi penindakan agar hasil unit terlihat melampaui target. Tindakan paling tepat adalah...",
    "options": [
      {
        "key": "A",
        "text": "Membiarkannya karena tidak merugikan keuangan pribadi saya.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Memverifikasi fakta, mengingatkan rekan secara persuasif, dan melaporkan melalui jalur kedinasan bila tidak diperbaiki.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menceritakan kekeliruan tersebut kepada semua rekan di grup percakapan informal.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Mengubah angka unit saya sendiri agar data terlihat serasi.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menegur rekan tersebut secara pribadi namun tidak berani melapor jika diabaikan.",
        "weight": 3
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 3
    },
    "explanation": "Tindakan berintegritas menuntut verifikasi data, upaya koreksi internal secara persuasif, dan pelaporan berjenjang demi menjaga keakuratan dokumen dinas.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 202,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Seorang kerabat dekat meminta Anda mendahulukan pengurusan SIM tanpa melalui ujian praktik yang sah. Sikap Anda...",
    "options": [
      {
        "key": "A",
        "text": "Membantunya karena menjaga hubungan kekerabatan keluarga besar.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Meminta imbalan jasa tambahan atas bantuan yang diberikan.",
        "weight": 1
      },
      {
        "key": "C",
        "text": "Menolak secara santun dan menjelaskan bahwa seluruh pemohon wajib mengikuti prosedur ujian sesuai aturan.",
        "weight": 5
      },
      {
        "key": "D",
        "text": "Menolak dengan nada ketus dan memarahinya di depan umum.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Menyarankan kerabat menghubungi calo di luar kantor pelayanan.",
        "weight": 1
      }
    ],
    "correctKey": "C",
    "optionWeights": {
      "A": 1,
      "B": 1,
      "C": 5,
      "D": 2,
      "E": 1
    },
    "explanation": "Integritas pelayanan publik kepolisian mengharuskan penolakan perlakuan khusus secara santun dengan tetap mengedukasi aturan resmi.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 203,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat membersihkan ruang pemeriksaan usai gelar perkara, Anda menemukan dompet berisi sejumlah uang milik saksi yang tertinggal. Tindakan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menyimpan dompet tersebut dan menggunakannya jika tidak ada yang mencari.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Segera mencatatnya dalam buku register barang temuan dan menyerahkannya kepada perwira piket SPKT untuk dikembalikan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menitipkannya kepada petugas kebersihan kantor.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Menunggu hingga pemiliknya datang sendiri tanpa melaporkannya ke buku inventaris.",
        "weight": 3
      },
      {
        "key": "E",
        "text": "Mengambil uangnya dan mengembalikan dompet beserta kartu identitasnya.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 3,
      "E": 1
    },
    "explanation": "Menyerahkan barang temuan melalui pencatatan resmi register SPKT menjamin keamanan barang bukti dan akuntabilitas personel.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 204,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Atasan meminta Anda mencantumkan kegiatan sosialisasi yang sebenarnya belum terlaksana ke dalam laporan pertanggungjawaban penyerapan anggaran. Sikap Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menuruti perintah atasan tanpa membantah demi kelancaran administrasi.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menyampaikan secara sopan kepada atasan bahwa pelaporan harus sesuai realisasi riil dan siap membantu mempercepat pelaksanaan kegiatan tersebut.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menolak secara kasar dan melaporkan atasan langsung ke media sosial.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menyetujui namun meminta kompensasi bagian dari anggaran tersebut.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Membicarakan perintah tersebut dengan rekan sejawat tanpa memberikan solusi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 2
    },
    "explanation": "Integritas menuntut penolakan manipulasi dokumen secara beretika dengan menawarkan percepatan realisasi kegiatan riil.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 205,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Pihak pelapor kasus penipuan online memberikan bingkisan bernilai mahal sebagai ucapan terima kasih karena perkaranya lekas ditangani. Tindakan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menerima bingkisan tersebut karena diberikan secara sukarela setelah perkara selesai.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Menolak bingkisan dengan santun dan menjelaskan bahwa penanganan perkara adalah tugas dinas kepolisian yang bebas biaya.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menerima bingkisan lalu membagikannya kepada seluruh staf penyidik.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Menolak di depan kantor namun meminta dikirimkan ke alamat rumah pribadi.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Meminta bingkisan diganti dengan uang tunai untuk kas unit kerja.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Menolak gratifikasi dalam bentuk apa pun menjaga marwah independensi dan profesionalisme penyidik kepolisian.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 206,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Anda mengetahui rekan penyidik membocorkan jadwal penggerebekan lokasi perjudian kepada pengelola lokasi. Langkah Anda...",
    "options": [
      {
        "key": "A",
        "text": "Pura-pura tidak tahu agar tidak dimusuhi di kesatuan.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Mengumpulkan indikasi pendukung dan segera melaporkan pelanggaran kode etik tersebut kepada Si Propam.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Meminta bagian uang tutup mulut dari rekan tersebut.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menegur rekan di depan tahanan lain tanpa melapor ke atasan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Menghubungi media massa secara anonim.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 2,
      "E": 2
    },
    "explanation": "Pembocoran rahasia operasi adalah pelanggaran disiplin berat yang wajib dilaporkan kepada Si Propam melalui bukti pendukung.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 207,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat melakukan penindakan tilang elektronik dan manual, pengemudi berusaha menyelipkan uang damai di balik surat kendaraan. Respons Anda...",
    "options": [
      {
        "key": "A",
        "text": "Mengembalikan uang tersebut secara tegas, mengedukasi pelanggar tentang sistem tilang resmi, dan memproses pelanggaran.",
        "weight": 5
      },
      {
        "key": "B",
        "text": "Menerima uang damai tersebut demi mempercepat kelancaran arus lalu lintas.",
        "weight": 1
      },
      {
        "key": "C",
        "text": "Mengancam pelanggar dengan hukuman pidana suap tanpa menjelaskan prosedur tilang.",
        "weight": 3
      },
      {
        "key": "D",
        "text": "Mengabaikan pelanggaran dan membiarkan pengemudi melintas.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menyita uang tersebut untuk keperluan kas patroli regu.",
        "weight": 1
      }
    ],
    "correctKey": "A",
    "optionWeights": {
      "A": 5,
      "B": 1,
      "C": 3,
      "D": 1,
      "E": 1
    },
    "explanation": "Menolak suap secara tegas dan memproses tilang resmi mencerminkan kepatuhan penuh terhadap integritas penegak hukum lalu lintas.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 208,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Anda ditawari fasilitas menginap gratis di hotel berbintang oleh seorang saksi yang sedang diperiksa dalam kasus korupsi. Sikap Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menerima fasilitas tersebut selama tidak mempengaruhi kesimpulan berita acara.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Menolak fasilitas tersebut dan memilih akomodasi dinas resmi yang telah dianggarkan kesatuan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengajak anggota keluarga untuk turut menikmati fasilitas tersebut.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menerima fasilitas atas nama unit penyidikan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Meminta fasilitas hotel dialihkan dalam bentuk uang tunai.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Menggunakan anggaran dinas resmi dan menolak fasilitas dari pihak terkait perkara mencegah terjadinya konflik kepentingan.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 209,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Seorang tokoh masyarakat meminta agar berkas perkara pidana anaknya diselesaikan secara damai tanpa melalui peradilan hukum pidana murni. Sikap Anda...",
    "options": [
      {
        "key": "A",
        "text": "Langsung menyetujui permintaan tersebut demi menjaga hubungan baik dengan tokoh masyarakat.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menjelaskan mekanisme Restorative Justice (RJ) secara transparan sesuai Perpol No. 8/2021 dan memastikan syarat materiil serta formil terpenuhi.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menolak secara arogan tanpa memberikan penjelasan hukum yang edukatif.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Meminta sejumlah uang pelicin untuk menghentikan penyidikan perkara.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Membiarkan perkara menggantung tanpa kepastian hukum.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Penyelesaian perkara melalui keadilan restoratif harus berpijak pada ketentuan yuridis resmi Perpol No. 8 Tahun 2021 secara transparan.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 210,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Anda melihat rekan kerja menggunakan mobil patroli dinas kepolisian untuk mengantar keperluan belanja pribadi keluarganya saat jam dinas. Tindakan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Mengabaikannya karena bukan urusan tugas saya.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Mengingatkan rekan bahwa kendaraan dinas inventaris hanya boleh digunakan untuk tugas operasional kepolisian.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Meminjam mobil dinas tersebut untuk keperluan pribadi saya sendiri pada hari berikutnya.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Memviralkan rekaman mobil tersebut ke akun media sosial publik.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Melaporkan secara anonim ke provos tanpa melakukan teguran persuasif terlebih dahulu.",
        "weight": 3
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 3
    },
    "explanation": "Mengingatkan rekan secara persuasif tentang peruntukan aset dinas menjaga kepatuhan tata kelola inventaris institusi.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 211,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Ketika membuat laporan hasil interogasi tersangka, rekan penyidik mengusulkan menambahkan pengakuan palsu yang tidak diucapkan tersangka agar dakwaan semakin kuat. Sikap Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menyetujui usulan tersebut agar tersangka segera dihukum berat.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menolak tegas usulan tersebut dan memastikan isi BAP hanya memuat keterangan faktual tersangka sesuai asas Due Process of Law.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengundurkan diri dari proses penyidikan tanpa memberikan sanggahan.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Menyerahkan penyusunan berkas kepada rekan tanpa membaca ulang.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menanyakan pendapat tersangka mengenai penambahan pasal tersebut.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 2
    },
    "explanation": "Penyidikan kepolisian berpijak pada fakta objektif dan scientific crime investigation, menolak keras rekayasa keterangan dalam BAP.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 212,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Anda menemukan kesalahan perhitungan dalam penetapan denda tilang tilang elektronik (ETLE) yang merugikan masyarakat pemilik kendaraan. Tindakan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Membiarkan data tersebut karena sistem sudah berjalan otomatis.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Segera berkoordinasi dengan tim IT dan pimpinan Satlantas untuk melakukan koreksi sistem serta menginformasikan kepada pemilik kendaraan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menghapus data pelanggaran secara manual tanpa izin atasan.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Menyalahkan pihak ketiga vendor penyedia perangkat kamera.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunggu ada komplain resmi dari warga baru bertindak.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 2
    },
    "explanation": "Koreksi proaktif terhadap anomali sistem teknologi penegakan hukum menunjukkan tanggung jawab moral dan akuntabilitas dinas.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 213,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Seorang pengusaha menawarkan bantuan renovasi pos polisi dengan harapan kendaraannya bebas dari pemeriksaan muatan berlebih (ODOL). Respons Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menerima tawaran tersebut demi perbaikan fasilitas pos pengamanan.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Menjelaskan bahwa bantuan hibah harus melalui mekanisme resmi kedinasan dan tidak dapat dikaitkan dengan kelonggaran penegakan hukum.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Meminta pengusaha memberikan bantuan tunai langsung ke personel pos.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menolak tawaran secara kasar dan mengusir pengusaha tersebut.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Menerima bantuan dan tetap menilang kendaraannya tanpa pemberitahuan.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 1,
      "D": 2,
      "E": 2
    },
    "explanation": "Bantuan hibah sarana dinas wajib melalui jalur resmi kedinasan serta tidak boleh mengorbankan integritas penegakan hukum lalu lintas.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 214,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Dalam tugas penjagaan tahanan, keluarga salah satu tahanan meminta izin memasukkan telepon genggam ke dalam ruang sel dengan imbalan uang. Tindakan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Mengizinkan selama telepon hanya digunakan untuk menghubungi anak dan istri.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menolak secara tegas dan menyita barang terlarang tersebut sesuai SOP pengamanan ruang tahanan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menerima uangnya namun menyimpan telepon di loker penjagaan.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Mengizinkan pada malam hari saat perwira pengawas sedang tidur.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Membiarkan keluarga memasukkan barang tanpa memeriksa isi bawaan.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Menjaga ruang tahanan steril dari alat komunikasi ilegal adalah SOP mutlak demi mencegah pengendalian kejahatan dari dalam sel.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 215,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat bertugas sebagai panitia lelang barang inventaris dinas yang telah rusak, ada peserta lelang yang mengajak berkomplot menetapkan harga rendah. Sikap Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menyetujui ajakan tersebut demi mendapatkan bagian keuntungan lelang.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menolak ajakan tersebut, mencatat percobaan kolusi, dan memastikan proses lelang berjalan terbuka sesuai taksiran wajar KPKNL.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membatalkan seluruh proses lelang secara sepihak tanpa koordinasi pimpinan.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Menyerahkan keputusan sepenuhnya kepada peserta lelang lainnya.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Membantu peserta lelang dengan syarat rahasia terjaga.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Proses lelang aset negara harus menjunjung tinggi prinsip transparansi, persaingan sehat, dan akuntabilitas keuangan negara.",
    "dimension": "Integritas & Etika Profesi"
  },
  {
    "id": 216,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Meskipun jarak rumah ke kantor cukup jauh dan cuaca hujan deras, Anda dijadwalkan menjadi perwira apel pagi pukul 07.00 WIB. Tindakan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Datang terlambat dan menyampaikan alasan cuaca buruk kepada pimpinan.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Berangkat lebih awal dengan persiapan mantel hujan agar dapat memimpin apel tepat waktu sesuai jadwal dinas.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Meminta rekan lain menggantikan tugas tanpa pemberitahuan resmi.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Tidak hadir dan langsung masuk saat jam kerja pelayanan dimulai.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menghubungi operator piket agar apel ditunda hingga hujan reda.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 2
    },
    "explanation": "Kedisiplinan waktu ditunjukkan dengan kesiapan mengantisipasi kendala perjalanan demi menepati komitmen tugas dinas.",
    "dimension": "Disiplin & Ketaatan Prosedur"
  },
  {
    "id": 217,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat hendak melakukan penangkapan tersangka narkotika, tim mendapati surat perintah penangkapan tertinggal di markas. Langkah regu...",
    "options": [
      {
        "key": "A",
        "text": "Tetap melakukan penangkapan paksa tanpa surat dan mengurus administrasinya kemudian.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Memerintahkan satu personel mengambil surat tugas resmi secara cepat sementara regu melakukan pengintaian status quo.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membatalkan operasi secara permanen dan membiarkan tersangka melarikan diri.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Membuat surat perintah palsu di tempat menggunakan tanda tangan rekan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Mengancam tersangka agar menyerah secara sukarela tanpa surat resmi.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 2
    },
    "explanation": "Pengamanan tersangka wajib mematuhi legalitas formil KUHAP; pengintaian taktis tetap berjalan sambil melengkapi surat perintah tugas.",
    "dimension": "Disiplin & Ketaatan Prosedur"
  },
  {
    "id": 218,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Pimpinan menginstruksikan seluruh personel wajib mengenakan rompi antipeluru dan helm taktis saat patroli malam di zona merah. Tindakan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Hanya mengenakan rompi saat memasuki wilayah yang diperkirakan ada musuh.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Memakai seluruh perlengkapan pelindung diri sesuai instruksi sejak keluar mako demi keselamatan kerja.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menolak memakai karena rompi terasa berat dan membatasi gerak tubuh.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menyimpan rompi di bagasi mobil patroli untuk diperlihatkan saat ada pemeriksaan provos.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Memakai helm saja tanpa mengenakan rompi antipeluru.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 2
    },
    "explanation": "Mematuhi SOP perlengkapan keselamatan dinas melindungi personel dari ancaman fatalitas di area rawan kerawanan.",
    "dimension": "Disiplin & Ketaatan Prosedur"
  },
  {
    "id": 219,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat bertugas jaga tahanan pada pukul 03.00 dini hari, rasa kantuk melanda Anda sangat hebat. Tindakan paling tepat adalah...",
    "options": [
      {
        "key": "A",
        "text": "Tidur sejenak di meja penjagaan dan meminta tahanan tidak berisik.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Mencuci muka, melakukan peregangan ringan, dan bergiliran dengan rekan jaga untuk memastikan situasi sel tetap termonitor.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Meninggalkan ruang jaga dan mencari kopi di warung luar markas.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Membiarkan pintu sel terkunci gembok tanpa perlu melakukan patroli keliling lorong.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Menyalakan musik bervolume keras di ruang tahanan.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 2,
      "E": 1
    },
    "explanation": "Menjaga kewaspadaan piket melalui pembagian giliran aktif dan kebugaran fisik mencegah risiko tahanan melarikan diri.",
    "dimension": "Disiplin & Ketaatan Prosedur"
  },
  {
    "id": 220,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Dalam penyusunan berkas administrasi penyelidikan, terdapat format baru sesuai Perkap terbaru yang belum Anda kuasai. Sikap Anda...",
    "options": [
      {
        "key": "A",
        "text": "Tetap menggunakan format lama karena sudah biasa dan mudah.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Mempelajari pedoman format baru dari buku panduan dinas serta berkonsultasi dengan perwira hukum kesatuan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyerahkan seluruh tugas pembuatan berkas kepada staf magang.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menunda pembuatan berkas hingga format lama diizinkan kembali.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Membuat berkas dengan format campuran seadanya.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 2
    },
    "explanation": "Kepatuhan terhadap regulasi baru menunjukkan komitmen adaptif dan disiplin profesional dalam standardisasi dokumen penyidikan.",
    "dimension": "Disiplin & Ketaatan Prosedur"
  },
  {
    "id": 221,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat melakukan pengawalan tahanan menuju pengadilan, salah satu tahanan meminta borgolnya dilepas dengan alasan tangan kram. Respons Anda...",
    "options": [
      {
        "key": "A",
        "text": "Melepas borgol sepenuhnya karena merasa kasihan kepada tahanan.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Memeriksa kekencangan borgol, menyesuaikan tingkat kenyamanan tanpa melepas kunci pengaman, dan tetap waspada sesuai SOP pengawalan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membentak tahanan dan memperketat borgol hingga sakit.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Mengizinkan melepas borgol jika tahanan berjanji tidak kabur.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Mengabaikan keluhan tahanan tanpa memeriksa kondisi fisiknya.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 2
    },
    "explanation": "Memastikan prosedur keamanan pengawalan tetap berlaku ketat sambil secara proporsional memeriksa kondisi fisik tahanan.",
    "dimension": "Disiplin & Ketaatan Prosedur"
  },
  {
    "id": 222,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Anda melihat rekan bintara piket menerima tamu masyarakat di luar jam besuk tahanan resmi. Langkah Anda...",
    "options": [
      {
        "key": "A",
        "text": "Membiarkannya karena merasa tidak enak menegur senior.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Mengingatkan rekan piket bahwa jam besuk telah diatur secara ketat dalam SOP rutan demi mencegah penyelundupan barang terlarang.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membantu tamu tersebut masuk ke dalam ruang tahanan.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Melaporkan rekan ke media massa tanpa komunikasi internal.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Meminta bayaran tiket masuk dari tamu tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Penegakan disiplin waktu kunjungan rutan merupakan kunci utama menjaga keamanan fasilitas tahanan kepolisian.",
    "dimension": "Disiplin & Ketaatan Prosedur"
  },
  {
    "id": 223,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Sebelum mengoperasikan senjata api dinas laras panjang saat pengamanan pemilu, tindakan wajib yang harus Anda lakukan adalah...",
    "options": [
      {
        "key": "A",
        "text": "Langsung mengisi peluru ke kamar senjata dan mencabut pengaman.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Melakukan pemeriksaan visual dan fisik kelaikan mekanik, kebersihan laras, dan memastikan laras mengarah ke arah yang aman.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menembakkan senjata ke udara untuk menguji fungsinya.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Meminjamkan senjata kepada warga masyarakat yang ingin berfoto.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Membawa senjata tanpa memeriksa buku mutasi amunisi.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Disiplin keamanan penanganan senjata api inventaris (weapons safety rules) wajib dipatuhi demi mencegah tembakan tidak disengaja.",
    "dimension": "Disiplin & Ketaatan Prosedur"
  },
  {
    "id": 224,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Ketika diperintahkan membuat laporan intelijen kilat mengenai situasi kamtibmas pasca aksi massa, batas waktu pengiriman adalah 30 menit. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Mengirim laporan ala kadarnya tanpa memverifikasi kebenaran informasi.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Menyusun poin-poin data kunci yang telah diverifikasi secara cepat, cermat, dan mengirimkan laporan sebelum batas waktu habis.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Meminta perpanjangan waktu 2 jam dan mengabaikan sifat kedaruratan laporan.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Mengabaikan perintah dan menunggu arahan lanjutan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menyalin laporan hari kemarin tanpa memperbarui fakta lapangan.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Disiplin kecepatan dan akurasi informasi intelijen sangat krusial dalam mendukung pimpinan mengambil keputusan taktis.",
    "dimension": "Disiplin & Ketaatan Prosedur"
  },
  {
    "id": 225,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat bertugas mengamankan aksi unjuk rasa, orator demonstrasi menyampaikan kata-kata provokatif terhadap institusi kepolisian. Tindakan regu...",
    "options": [
      {
        "key": "A",
        "text": "Membalas makian orator dengan pengeras suara mobil Raisa.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Tetap dalam formasi pertahanan Dalmas, mengabaikan provokasi verbal, dan bertindak sesuai arahan komandan kompi.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Maju menyerang massa tanpa menunggu aba-aba dari komandan peleton.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Meninggalkan barisan untuk mengamankan diri sendiri.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Melepaskan gas air mata atas inisiatif pribadi.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Kepatuhan terhadap garis komando saat pengendalian massa mencegah eskalasi anarkis dan menjamin penerapan SOP yang sah.",
    "dimension": "Disiplin & Ketaatan Prosedur"
  },
  {
    "id": 226,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Sesuai aturan kedinasan, setiap serah terima piket wajib dilaksanakan pengecekan jumlah tahanan dan barang inventaris. Rekan mengajak melewati proses ini karena terburu-buru pulang. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menyetujui usulan rekan agar cepat beristirahat.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menolak tegas dan bersikeras melaksanakan apel serah terima serta pengecekan fisik bersama personel piket baru sesuai SOP.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Hanya mengecek jumlah tahanan lewat buku mutasi tanpa melihat kondisi fisik.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Melakukan serah terima lewat panggilan telepon.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menandatangani buku mutasi kosong dan pulang lebih dahulu.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Serah terima fisik piket jaga menjamin tidak adanya selisih inventaris dan memastikan status kesehatan tahanan secara nyata.",
    "dimension": "Disiplin & Ketaatan Prosedur"
  },
  {
    "id": 227,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Ketika pimpinan memberikan teguran tertulis atas keterlambatan pengiriman berkas perkara, sikap Anda adalah...",
    "options": [
      {
        "key": "A",
        "text": "Membantah dan menyalahkan bagian pos pengiriman berkas ekspedisi.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Menerima teguran dengan sikap ksatria, mengevaluasi sistem kerja unit, dan berjanji memperbaiki manajemen waktu.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Melakukan aksi mogok kerja sebagai bentuk protes.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menghindari komunikasi dengan pimpinan selama beberapa minggu.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Mengajukan mutasi pindah ke satuan lain yang lebih santai.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Sikap ksatria dan disiplin menerima koreksi pimpinan merupakan ciri kedewasaan perwira dalam memperbaiki kinerja kedinasan.",
    "dimension": "Disiplin & Ketaatan Prosedur"
  },
  {
    "id": 228,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat berpatroli, Anda melihat sepeda motor rekan polisi lain tidak dilengkapi spion dan pelat nomor dinas yang sah. Tindakan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Membiarkannya karena solidaritas sesama anggota korps kepolisian.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Mengingatkan rekan secara baik-baik bahwa anggota Polri harus menjadi teladan tertib berlalu lintas di jalan raya.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Memviralkan rekan tersebut di media sosial tanpa koordinasi.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Membantu membuatkan pelat dinas palsu.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menghukum rekan dengan push-up di pinggir jalan umum.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 2
    },
    "explanation": "Menegakkan disiplin internal dimulai dari saling mengingatkan ketertiban berlalu lintas agar tidak mencoreng citra institusi.",
    "dimension": "Disiplin & Ketaatan Prosedur"
  },
  {
    "id": 229,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Dalam melaksanakan olah tempat kejadian perkara (TKP) pembunuhan, warga sekitar mendesak ingin masuk ke dalam garis polisi (police line). Tindakan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Mengizinkan tokoh masyarakat masuk untuk melihat jenazah.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Secara humanis namun tegas melarang warga melintasi garis polisi demi menjaga keaslian dan status quo jejak forensik di TKP.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membiarkan warga masuk karena jumlah personel polisi kalah banyak.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menggunakan senjata tajam untuk menakut-nakuti warga.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Membubarkan warga dengan menyemprotkan air pemadam kebakaran.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Menjaga status quo TKP dari kontaminasi warga merupakan prosedur mutlak keberhasilan pengungkapan bukti forensik ilmiah.",
    "dimension": "Disiplin & Ketaatan Prosedur"
  },
  {
    "id": 230,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Instruksi dinas mewajibkan pemusnahan berkas formulir permohonan yang salah cetak menggunakan mesin penghancur kertas (paper shredder). Rekan Anda membuangnya langsung ke tempat sampah terbuka. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Mengikuti cara rekan karena lebih cepat dan tidak memakan waktu.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Mengambil kembali berkas tersebut dan memusnahkannya dengan paper shredder demi mencegah kebocoran data pribadi pemohon.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membakar sampah di halaman kantor yang mengganggu pernapasan warga.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Menjual berkas bekas tersebut kepada pengepul kertas loak.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Membiarkan berkas berserakan di ruang kerja.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Pemusnahan berkas berdata identitas sesuai SOP dokumen rahasia melindungi privasi warga dan keamanan informasi publik.",
    "dimension": "Disiplin & Ketaatan Prosedur"
  },
  {
    "id": 231,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat bertugas mengawal tahanan berisiko tinggi menuju rumah sakit untuk perawatan darurat, tahanan mencoba memanfaatkan kelengahan untuk melarikan diri. Tindakan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Panik dan melepaskan tembakan membabi-buta di kerumunan pasien.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menerapkan teknik melumpuhkan tanpa senjata api sesuai level eskalasi ancaman dan segera mengamankan kembali borgol tahanan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membiarkan tahanan lari dan beralasan kelalaian pihak perawat.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Meminta bantuan warga sipil bersenjata tajam untuk mengejar.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Menyerah dan meninggalkan lokasi rumah sakit.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 2,
      "E": 1
    },
    "explanation": "Tanggung jawab pengawalan menuntut kesiapan respon taktis pelumpuhan proporsional tanpa membahayakan keselamatan pasien sipil di sekitar.",
    "dimension": "Tanggung Jawab & Akuntabilitas"
  },
  {
    "id": 232,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Anda ditugaskan menyusun Surat Pemberitahuan Perkembangan Hasil Penyidikan (SP2HP) kepada pelapor kasus pencurian, namun data labfor belum keluar. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Tidak mengirimkan SP2HP sampai seluruh hasil labfor selesai tanpa batas waktu.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Tetap mengirimkan SP2HP tepat waktu dengan menerangkan secara transparan tahapan pemeriksaan labfor yang sedang berlangsung.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membuat kesimpulan labfor palsu agar pelapor tidak bertanya-tanya.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menyuruh pelapor datang sendiri memeriksa ke laboratorium forensik.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Mengabaikan surat permohonan perkembangan perkara dari pelapor.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 1,
      "D": 2,
      "E": 1
    },
    "explanation": "Kewajiban penyidik menyampaikan SP2HP secara berkala adalah wujud akuntabilitas transparansi penyidikan kepada masyarakat.",
    "dimension": "Tanggung Jawab & Akuntabilitas"
  },
  {
    "id": 233,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat memeriksa senjata inventaris dinas pasca patroli, Anda mendapati ada 1 butir amunisi yang hilang atau tidak cocok dengan catatan logistik. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Membeli amunisi gelap di pasar ilegal untuk menggantikan yang hilang.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Melaporkan secara jujur ketidaksesuaian amunisi kepada Ba Logistik dan perwira pengawas serta membuat laporan kronologis tertulis.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengubah angka catatan mutasi agar data terlihat seimbang.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menyalahkan rekan jaga sebelumnya yang telah pulang.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Menyimpan senjata dan pura-pura tidak menyadari selisih amunisi.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 2,
      "E": 1
    },
    "explanation": "Akuntabilitas pertanggungjawaban amunisi dinas menuntut kejujuran pelaporan kronologis demi mencegah penyalahgunaan senjata api.",
    "dimension": "Tanggung Jawab & Akuntabilitas"
  },
  {
    "id": 234,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Dalam penugasan pengamanan TPS Pemilu di pedalaman, terjadi banjir bandang yang mengancam keselamatan logistik kotak suara. Tindakan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menyelamatkan barang pribadi dan membiarkan kotak suara hanyut.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Berkoordinasi dengan KPPS dan warga mengevakuasi kotak suara ke tempat aman tertinggi serta mengawal segel kotak suara secara ketat.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membuka kotak suara untuk mengeringkan surat suara yang basah tanpa saksi.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Meninggalkan TPS dan kembali ke markas komando polsek.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menyerahkan pengamanan kotak suara kepada relawan tanpa pengawasan.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 2
    },
    "explanation": "Pengamanan logistik negara adalah amanat tanggung jawab mutlak personel kepolisian yang wajib diprioritaskan saat krisis kontinjensi.",
    "dimension": "Tanggung Jawab & Akuntabilitas"
  },
  {
    "id": 235,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Ketika mengemudikan kendaraan dinas, Anda tanpa sengaja menyenggol pagar rumah warga hingga rusak ringan. Sikap Anda...",
    "options": [
      {
        "key": "A",
        "text": "Segera tancap gas meninggalkan lokasi mumpung tidak ada saksi yang melihat.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Berhenti, turun dari kendaraan, menemui pemilik rumah, meminta maaf secara santun, dan bertanggung jawab mengganti biaya perbaikan pagar.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyalahkan pemilik rumah karena memasang pagar terlalu dekat dengan jalan.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Menakut-nakuti pemilik rumah dengan kewenangan dinas kepolisian.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menyuruh bawahan Anda mengaku sebagai pengemudi.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Perwira berintegritas dan bertanggung jawab mengakui kelalaian secara ksatria serta memberikan ganti rugi wajar kepada masyarakat.",
    "dimension": "Tanggung Jawab & Akuntabilitas"
  },
  {
    "id": 236,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Anda ditunjuk sebagai bendahara pengeluaran unit penugasan operasi khusus dan memegang uang operasional lapangan. Sikap Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menggunakan sebagian uang dinas untuk keperluan trading pribadi dengan janji dikembalikan.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Mencatat setiap pengeluaran secara transparan, melampirkan bukti transaksi sah, dan membuat buku kas harian yang dapat diaudit sewaktu-waktu.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membelanjakan dana tanpa kuitansi pendukung karena situasi lapangan.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Membagi sisa dana operasional sebagai bonus pribadi tanpa persetujuan komandan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menyimpan pembukuan hanya dalam ingatan pribadi.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Akuntabilitas tata kelola keuangan penugasan kepolisian wajib dibuktikan dengan pencatatan tertib dan bukti kuitansi yang sah.",
    "dimension": "Tanggung Jawab & Akuntabilitas"
  },
  {
    "id": 237,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Sebuah berkas perkara penganiayaan yang Anda tangani ditolak kejaksaan karena batas waktu penahanan tersangka hampir habis. Tindakan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menyerah dan melepaskan tersangka tanpa petunjuk jaksa.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Bekerja ekstra melengkapi kekurangan berkas (P-19) bersama tim secara cermat sebelum masa penahanan berakhir demi kepastian hukum.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyalahkan jaksa penuntut umum di hadapan keluarga korban.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Memalsukan tanda tangan jaksa agar berkas tampak telah P-21.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunda penyerahan berkas hingga masa penahanan kedaluwarsa.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Tanggung jawab penyidikan menuntut kerja keras melengkapi petunjuk P-19 secara cermat dalam batas tenggat hukum yang sah.",
    "dimension": "Tanggung Jawab & Akuntabilitas"
  },
  {
    "id": 238,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat bertugas di pos pelayanan pengaduan, sistem komputer pendaftaran mendadak mengalami gangguan jaringan offline. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menutup loket dan meminta warga datang kembali esok hari.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Segera beralih ke pencatatan register manual sementara waktu agar warga tetap terlayani dengan tertib tanpa menunggu perbaikan server.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyalahkan tim teknisi jaringan di hadapan antrean warga.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Duduk santai di ruang tunggu sambil bermain telepon genggam.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menerima pengaduan hanya dari warga yang Anda kenal baik.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Solutif dan bertanggung jawab dalam pelayanan publik memastikan hak masyarakat tetap terlayani melalui mitigasi prosedur manual.",
    "dimension": "Tanggung Jawab & Akuntabilitas"
  },
  {
    "id": 239,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Ketika barang bukti elektronik berupa laptop tersangka korupsi berada di bawah pengawasan Anda, rekan ingin meminjamnya untuk keperluan mengetik. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Mengizinkan peminjaman asalkan tidak menghapus file penting.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menolak dengan tegas dan menjelaskan bahwa barang bukti berstatus disegel dan tidak boleh diakses tanpa penetapan pengadilan dan berita acara.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membiarkan rekan menggunakan laptop tanpa pengawasan.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Membongkar harddisk laptop tersebut untuk diperiksa sendiri.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Menjual laptop tersebut dan menggantinya dengan unit serupa.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 2,
      "E": 1
    },
    "explanation": "Menjaga integritas rantai bukti (chain of custody) barang bukti digital merupakan tanggung jawab mutlak penyidik tindak pidana.",
    "dimension": "Tanggung Jawab & Akuntabilitas"
  },
  {
    "id": 240,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat mengawasi apel malam ruang tahanan, seorang tahanan mengeluh sakit dada hebat dan sesak napas. Langkah Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menyuruh tahanan tidur dan beristirahat tanpa tindakan medis.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Segera berkoordinasi dengan perwira jaga dan membawa tahanan ke Dokkes atau rumah sakit terdekat dengan pengawalan ketat sesuai SOP.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Memberikan obat pribadi yang Anda miliki tanpa resep dokter.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Mengeluarkan tahanan ke halaman luar tanpa borgol pengaman.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunggu hingga jadwal pemeriksaan kesehatan rutin esok pagi.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Perlindungan hak asasi dan kesehatan tahanan adalah tanggung jawab hukum personel kepolisian; rujukan medis segera wajib dilakukan.",
    "dimension": "Tanggung Jawab & Akuntabilitas"
  },
  {
    "id": 241,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Setelah selesai melaksanakan razia balap liar, Anda menemukan beberapa helm sitaan tercecer di pinggir jalan. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Mengambil helm yang bagus untuk digunakan sendiri di rumah.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Mengumpulkan seluruh helm, mendatanya dalam daftar barang sitaan razia, dan membawanya ke kantor untuk disimpan di gudang barang bukti.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Meninggalkan helm di pinggir jalan karena bukan tanggung jawab saya.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Membagikan helm kepada warga sekitar yang menonton razia.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Membuang helm tersebut ke sungai dekat lokasi razia.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 2,
      "E": 1
    },
    "explanation": "Semua barang sitaan hasil operasi kepolisian wajib diinventarisasi secara tertib dan disimpan dalam gudang barang bukti resmi.",
    "dimension": "Tanggung Jawab & Akuntabilitas"
  },
  {
    "id": 242,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Ketika pimpinan memberikan tugas memimpin tim verifikasi data internal kesatuan dengan tenggat waktu ketat, sikap Anda...",
    "options": [
      {
        "key": "A",
        "text": "Mendelegasikan seluruh pekerjaan kepada bawahan dan pergi meninggalkan kantor.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menyusun pembagian kerja yang proporsional, memimpin pengecekan silang data secara berkala, dan memastikan hasil akurat sebelum diserahkan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membuat kesimpulan data berdasarkan estimasi kira-kira tanpa verifikasi.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Menunda penyerahan laporan hingga ditegur berkali-kali oleh pimpinan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Meminta tim lain mengambil alih tugas unit Anda.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Kepemimpinan yang bertanggung jawab memastikan supervisi aktif dan akurasi data dalam menyelesaikan target kedinasan.",
    "dimension": "Tanggung Jawab & Akuntabilitas"
  },
  {
    "id": 243,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat bertugas patroli jalan raya, Anda menemukan lampu sirene kendaraan dinas mati akibat korsleting sekring. Tindakan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Tetap berpatroli tanpa sirene dan mengabaikan kerusakan kendaraan.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Menepi di tempat aman, mengganti sekring cadangan yang tersedia atau segera melaporkannya ke bengkel dinas logistik polres.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Memukul lampu sirene dengan tongkat polisi agar menyala kembali.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Mematikan mobil dan pulang ke rumah sebelum jam dinas selesai.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menyalakan klakson terus-menerus sebagai pengganti sirene.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Memelihara kelaikan operasional sarana mobilitas dinas merupakan bentuk tanggung jawab keselamatan personel dan pengguna jalan.",
    "dimension": "Tanggung Jawab & Akuntabilitas"
  },
  {
    "id": 244,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Anda ditugaskan mendampingi saksi mahkota dalam perjalanan menuju pengadilan. Keluarga terdakwa berusaha mendekati saksi untuk mengintimidasi. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Membiarkan keluarga terdakwa berbicara agar tidak terjadi keributan.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menempatkan posisi tubuh sebagai barikade pengaman, menjauhkan pihak pengintimidasi, dan memastikan saksi memasuki ruang steril pengadilan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membalas intimidasi dengan kekerasan fisik di depan umum.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Meninggalkan saksi dan bersembunyi di mobil pengawal.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menyarankan saksi untuk mengubah keterangannya di persidangan.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Tanggung jawab perlindungan saksi mengharuskan tindakan proteksi fisik yang sigap, tegas, dan berpedoman pada SOP perlindungan saksi.",
    "dimension": "Tanggung Jawab & Akuntabilitas"
  },
  {
    "id": 245,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Dalam evaluasi triwulan, satuan kerja Anda mendapatkan nilai kinerja terendah akibat keterlambatan penyelesaian laporan online. Sebagai staf operator, Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menyalahkan pimpinan karena sering memberikan tugas tambahan lain.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Mengakui kelemahan dalam manajemen waktu, menganalisis faktor penghambat, dan berkomitmen memperbaiki ritme pelaporan harian.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Bersikap masa bodoh karena merasa sudah bekerja sesuai gaji.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Mengajukan pengunduran diri dari posisi operator sistem data.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menghapus akun operator agar sistem dinilai rusak.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Sikap akuntabel menerima hasil evaluasi kinerja secara konstruktif dan berkomitmen melakukan perbaikan sistem kerja nyata.",
    "dimension": "Tanggung Jawab & Akuntabilitas"
  },
  {
    "id": 246,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat bertugas mengurai kemacetan parah di perempatan jalan, seorang pengemudi mobil mewah memaki Anda dengan kata-kata kasar karena merasa jalurnya tertahan. Tindakan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Balik memaki pengemudi tersebut dengan suara lebih keras.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Tetap tenang, tidak terpancing emosi, menjelaskan pengaturan prioritas arus dengan santun namun tegas, lalu melanjutkan penarikan arus.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Memukul kap mobil pengemudi menggunakan tongkat pengatur lalu lintas.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Meninggalkan perempatan dan membiarkan kemacetan bertambah parah.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menahan kendaraan pengemudi tersebut selama berjam-jam tanpa alasan hukum.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 2
    },
    "explanation": "Kematangan stabilitas emosi aparat penegak hukum diuji dari kemampuan tetap tenang, sopan, dan berfokus pada tugas utama saat diprovokasi.",
    "dimension": "Pengendalian Diri & Stabilitas Emosi"
  },
  {
    "id": 247,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Ketika memeriksa tersangka pencurian yang berbelit-belit dan terus berbohong saat diinterogasi, Anda merasa sangat jengkel. Tindakan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Melakukan intimidasi fisik agar tersangka segera mengaku.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menghentikan pemeriksaan sejenak untuk menenangkan pikiran, lalu melanjutkan interogasi berbasis teknik pembuktian ilmiah dan data konfrontasi bukti.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyerahkan interogasi kepada bintara muda untuk diberi pelajaran fisik.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Mengurung tersangka di ruangan gelap tanpa makan dan minum.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menutup berkas dan membebaskan tersangka begitu saja.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Pengendalian emosi penyidik mencegah pelanggaran HAM dan memastikan pengakuan diperoleh melalui scientific crime investigation yang sah.",
    "dimension": "Pengendalian Diri & Stabilitas Emosi"
  },
  {
    "id": 248,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Massa pengunjuk rasa melemparkan botol air mineral dan tomat busuk ke arah perisai Dalmas yang Anda pegang. Komandan belum memberi aba-aba maju. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Membalas melempar botol kembali ke arah kerumunan massa.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menahan emosi, merapatkan perisai dalam formasi bertahan, dan tetap disiplin menunggu aba-aba dari komandan peleton.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Keluar dari barisan pertahanan untuk mengejar pelempar botol sendirian.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Melempar tameng ke tanah dan lari meninggalkan regu.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Mencabut pistol dinas untuk menakut-nakuti pengunjuk rasa.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Kekuatan mental pasukan pengendalian massa terletak pada ketahanan menahan emosi dan kedisiplinan formasi menunggu instruksi resmi.",
    "dimension": "Pengendalian Diri & Stabilitas Emosi"
  },
  {
    "id": 249,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Keluarga Anda sedang mengalami masalah pribadi yang berat di rumah, sementara Anda harus melayani masyarakat di loket pengaduan. Sikap Anda...",
    "options": [
      {
        "key": "A",
        "text": "Melampiaskan kekesalan rumah tangga kepada warga yang datang melapor.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menyisihkan beban masalah pribadi saat memakai seragam dinas dan tetap melayani masyarakat dengan ramah, empati, dan profesional.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menutup loket lebih awal untuk menyelesaikan urusan pribadi.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Menceritakan masalah pribadi kepada warga yang sedang melapor.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Bekerja sambil menangis di depan meja pelayanan.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Profesionalisme kepolisian menuntut kematangan emosi untuk memisahkan urusan personal dari dedikasi pelayanan prima kepada warga.",
    "dimension": "Pengendalian Diri & Stabilitas Emosi"
  },
  {
    "id": 250,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Dalam apel konsolidasi, pimpinan menegur hasil kerja peleton Anda secara keras di hadapan seluruh anggota satuan. Respons Anda...",
    "options": [
      {
        "key": "A",
        "text": "Memotong omongan pimpinan di tengah lapangan untuk membela diri.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Mendengarkan teguran dengan sikap sempurna, mengendalikan reaksi kecewa, dan menjadikan kritik sebagai bahan evaluasi perbaikan peleton.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menunjukkan ekspresi wajah sinis dan bersungut-sungut di barisan apel.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Mengajak anggota peleton lain memboikot kegiatan dinas berikutnya.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menulis curhatan kekesalan terhadap pimpinan di status media sosial.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Kedewasaan personel diwujudkan dalam kemampuan menerima evaluasi pimpinan dengan sikap tenang, bijak, dan berorientasi pada koreksi diri.",
    "dimension": "Pengendalian Diri & Stabilitas Emosi"
  },
  {
    "id": 251,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat bertugas mengamankan pertandingan sepak bola, suporter tim tuan rumah mengejek dan menyanyikan yel-yel menghina polisi. Sikap Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menantang suporter berkelahi di tribun penonton.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Tetap bersikap humanis, tenang, tidak terprovokasi, dan fokus mengawasi pergerakan massa guna mencegah potensi kerusuhan fisik.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyerang penonton menggunakan gas air mata tanpa koordinasi panitia.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Ikut menyanyikan yel-yel menghina tim sepak bola lawan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Meninggalkan sektor tribun pengamanan sebelum pertandingan selesai.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Fokus pengamanan kamtibmas menuntut pengendalian diri tingkat tinggi agar tidak terdistraksi oleh provokasi verbal penonton olahraga.",
    "dimension": "Pengendalian Diri & Stabilitas Emosi"
  },
  {
    "id": 252,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Anda mendapati akun media sosial Anda diserang komentar negatif dan fitnah dari oknum warganet terkait penindakan tilang yang viral. Langkah Anda...",
    "options": [
      {
        "key": "A",
        "text": "Membalas komentar dengan makian kasar dan ancaman pasal UU ITE secara emosional.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menahan diri dari membalas secara emosional, mendokumentasikan bukti tangkapan layar, dan melaporkannya ke Bagian Humas kesatuan untuk klarifikasi resmi.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengajak teman-teman satu angkatan menyerbu akun warganet tersebut.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menghapus akun dan mogok menjalankan tugas patroli jalan raya.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menantang warganet tersebut untuk duel secara terbuka di lapangan.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Menghadapi serangan siber dan opini publik negatif harus melalui jalur kehumasan resmi dan penegakan hukum yang profesional, bukan amarah personal.",
    "dimension": "Pengendalian Diri & Stabilitas Emosi"
  },
  {
    "id": 253,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat melakukan patroli malam, Anda mencurigai kendaraan yang melarikan diri saat hendak dihentikan. Setelah terkejar, pengemudi ternyata remaja panik tanpa SIM. Sikap Anda...",
    "options": [
      {
        "key": "A",
        "text": "Memukul pengemudi remaja tersebut karena telah merepotkan pengejaran polisi.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Mengendalikan amarah pasca pengejaran, memeriksa identitas pengemudi dengan tegas dan tenang, serta memproses pelanggaran sesuai hukum anak yang berlaku.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menghancurkan kaca mobil remaja tersebut dengan helm dinas.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Meminta uang tebusan agar remaja tersebut tidak ditangkap.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Melepaskan remaja tersebut tanpa sanksi apa pun karena merasa kasihan.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 2
    },
    "explanation": "Adrenalin tinggi pasca pengejaran harus segera dinetralkan dengan pengendalian diri agar tindakan penegakan hukum tetap proporsional dan terukur.",
    "dimension": "Pengendalian Diri & Stabilitas Emosi"
  },
  {
    "id": 254,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Seorang rekan kerja sering mengkritik cara kerja Anda di depan rekan-rekan lain dengan nada meremehkan. Respons Anda...",
    "options": [
      {
        "key": "A",
        "text": "Memukul rekan kerja tersebut di ruang istirahat untuk memberi pelajaran.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menjaga ketenangan emosi, mengajak rekan tersebut berdiskusi empat mata secara dewasa untuk mendengar masukan konkretnya, dan membuktikan kinerja terbaik.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyebarkan gosip buruk tentang kehidupan pribadi rekan tersebut.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menangis di depan atasan dan menuntut rekan tersebut dimutasi.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Mengabaikan tugas kedinasan unit karena merasa tidak dihargai.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 2,
      "E": 1
    },
    "explanation": "Menyelesaikan dinamika hubungan kerja internal secara dewasa dan kepala dingin menjaga iklim kerja kesatuan tetap solid dan produktif.",
    "dimension": "Pengendalian Diri & Stabilitas Emosi"
  },
  {
    "id": 255,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Ketika mengantre pembagian bekal penugasan operasi pengamanan pemilu yang panjang dan melelahkan, seorang anggota berusaha menyelak antrean Anda. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Mendorong anggota tersebut hingga terjatuh ke tanah.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Mengingatkan anggota tersebut dengan sopan namun tegas agar tertib menghormati antrean demi keadilan bersama seluruh personel.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Diam saja namun menyimpan kebencian mendalam.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Membalas dengan menyelak antrean orang lain di depan Anda.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Berteriak membuat keributan yang menarik perhatian pimpinan.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Pengendalian diri dalam situasi antrean menumbuhkan budaya ketertiban internal dan saling menghargai sesama anggota korps kepolisian.",
    "dimension": "Pengendalian Diri & Stabilitas Emosi"
  },
  {
    "id": 256,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat bertugas mengamankan konser musik akbar, cuaca sangat panas dan debu beterbangan tebal, sementara penonton terus berdesak-desakan. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Marah-marah kepada penonton dan mendorong barikade dengan keras.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menjaga kesabaran, membasahi wajah, minum air putih cukup, dan tetap bersikap ramah namun waspada mengarahkan arus penonton.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Meninggalkan barikade dan berteduh di tenda VIP tanpa izin.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Mengusir penonton yang berdiri di dekat pagar pembatas.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Membiarkan penonton merusak pagar pembatas karena lelah.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 2,
      "E": 1
    },
    "explanation": "Ketahanan fisik dan stabilitas emosi di lingkungan penugasan ekstrem merupakan kompetensi dasar personel dalam menjaga kamtibmas.",
    "dimension": "Pengendalian Diri & Stabilitas Emosi"
  },
  {
    "id": 257,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Anda mendapati tersangka pembunuhan sadis yang korbannya adalah anak kecil bersikap dingin dan tidak menunjukkan penyesalan saat diperiksa. Reaksi Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menyiksa tersangka agar merasakan sakitnya penderitaan korban.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menahan luapan kemarahan batin, tetap bertindak objektif sesuai koridor hukum, dan menyusun konstruksi pasal dakwaan seberat-beratnya berdasarkan bukti kuat.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menolak memeriksa tersangka dan membiarkan kasusnya terbengkalai.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menyebarkan foto wajah tersangka ke publik sebelum penetapan resmi.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Membiarkan tersangka dipukuli oleh pihak keluarga korban di ruang penyidikan.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 2,
      "E": 1
    },
    "explanation": "Keadilan hukum ditegakkan melalui ketelitian bukti yuridis yang tak terbantahkan, bukan melalui luapan kemarahan emosional penyidik.",
    "dimension": "Pengendalian Diri & Stabilitas Emosi"
  },
  {
    "id": 258,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Setelah bertugas selama 14 hari penuh tanpa libur dalam operasi kemanusiaan bencana gempa bumi, fisik dan psikis Anda sangat lelah. Sikap Anda...",
    "options": [
      {
        "key": "A",
        "text": "Mengeluh di media sosial bahwa institusi memperlakukan anggota secara tidak adil.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Memanfaatkan waktu istirahat yang diberikan pimpinan secara efektif untuk pemulihan fisik dan mental serta menjaga semangat pengabdian demi warga korban.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mogok bertugas membantu pencarian korban di reruntuhan.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Melampiaskan stres kepada relawan warga sipil.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Mengonsumsi obat-obatan terlarang penambah stamina tanpa resep dokter.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Manajemen stres dan pemulihan stamina yang teratur menjaga kesehatan mental personel dalam penugasan operasi kemanusiaan jangka panjang.",
    "dimension": "Pengendalian Diri & Stabilitas Emosi"
  },
  {
    "id": 259,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat melakukan negosiasi dengan warga yang memblokir jalan lintas provinsi akibat sengketa lahan, warga berbicara dengan nada tinggi dan mengacungkan parang. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Langsung menembak warga yang memegang parang tanpa peringatan.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Tetap tenang, mengambil jarak aman taktis, menenangkan situasi dengan komunikasi persuasif kearifan lokal, dan mengajak perwakilan berdialog di pos pengamanan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Lari meninggalkan lokasi negosiasi karena ketakutan.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menantang warga untuk adu kekuatan fisik dengan polisi.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Membiarkan jalan terblokir selamanya tanpa ada upaya mediasi.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Pengendalian emosi dalam negosiasi krisis di lapangan mengedepankan pendekatan persuasif dan de-eskalasi konflik tanpa jatuhnya korban.",
    "dimension": "Pengendalian Diri & Stabilitas Emosi"
  },
  {
    "id": 260,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Ketika berkas perkara yang Anda siapkan dengan teliti dicoret dan direvisi total oleh perwira pengawas karena beda penafsiran hukum, Anda...",
    "options": [
      {
        "key": "A",
        "text": "Membanting berkas di meja kerja dan menolak memperbaikinya.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Mengendalikan rasa kecewa, mendiskusikan poin koreksi secara ilmiah hukum dengan perwira pengawas, dan melakukan perbaikan demi kesempurnaan berkas.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membicarakan keburukan perwira pengawas kepada sesama penyidik.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Mengajukan cuti panjang mendadak untuk menghindar dari revisi.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menyerahkan berkas yang dicoret langsung ke kejaksaan tanpa revisi.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Kematangan profesionalisme terlihat dari kemampuan menerima koreksi dengan pikiran terbuka dan semangat menyempurnakan kualitas berkas perkara.",
    "dimension": "Pengendalian Diri & Stabilitas Emosi"
  },
  {
    "id": 261,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Dalam operasi penangkapan gembong narkoba lintas batas, tim gabungan terdiri dari fungsi Reskrim, Intelkam, dan Brimob. Tindakan paling tepat bagi tim...",
    "options": [
      {
        "key": "A",
        "text": "Setiap fungsi bergerak sendiri-sendiri tanpa koordinasi radio agar tidak berebut peran.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Melaksanakan briefing komando terpadu, berbagi peta sasaran secara transparan, mematuhi peran masing-masing, dan menjaga komunikasi frekuensi radio yang disiplin.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menolak berbagi informasi intelijen agar tangkapan dinilai murni prestasi satuan Reskrim.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Mundur dari operasi karena merasa peran Brimob lebih berbahaya.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menunggu operasi selesai baru mendatangi TKP.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Keberhasilan penindakan taktis skala besar bertumpu pada soliditas sinergi komando, transparansi informasi, dan koordinasi terpadu lintas fungsi.",
    "dimension": "Kerjasama Tim & Sinergi Kedinasan"
  },
  {
    "id": 262,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Seorang rekan satu regu patroli mengalami musibah sakit mendadak sehingga pos jaga rawan kekurangan personel. Sikap Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menolak membantu penambahan jam dinas karena bukan jadwal piket saya.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Secara sukarela menawarkan diri mengisi kekosongan pos jaga atau berkoordinasi mengatur rotasi giliran tugas bersama regu lain demi keamanan mako.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membiarkan pos kosong tanpa laporan kepada perwira piket.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menyuruh warga sipil menjaga pos kepolisian.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menuntut upah lembur tambahan di depan rekan yang sedang sakit.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Soliditas korps dan rasa empati kedinasan diwujudkan dalam kesediaan saling membackup saat rekan menghadapi kedaruratan.",
    "dimension": "Kerjasama Tim & Sinergi Kedinasan"
  },
  {
    "id": 263,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat menggelar operasi penyekatan jalur mudik lebaran bersama instansi TNI, Dishub, dan Satpol PP, terjadi perbedaan pendapat mengenai titik pengalihan arus. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Memaksakan kehendak Polri dan mengabaikan saran dari instansi lain.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Mengajak seluruh unsur perwakilan instansi berembuk di tenda posko gabungan untuk menentukan skema rekayasa arus terbaik demi kepentingan masyarakat.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menarik seluruh personel polisi dan membiarkan instansi lain bekerja sendiri.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menyerahkan seluruh keputusan lalu lintas kepada pihak luar tanpa pertimbangan teknis.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Membiarkan kemacetan terjadi tanpa kesepakatan rekayasa jalan.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 1,
      "D": 2,
      "E": 1
    },
    "explanation": "Kepemimpinan sinergis lintas instansi mengutamakan musyawarah mufakat dan kolaborasi teknis demi keberhasilan pelayanan masyarakat bersama.",
    "dimension": "Kerjasama Tim & Sinergi Kedinasan"
  },
  {
    "id": 264,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Dalam tim penyusunan rencana kerja tahunan (Renja), ada anggota bintara muda yang menyampaikan ide digitalisasi pengarsipan berkas. Respons Anda...",
    "options": [
      {
        "key": "A",
        "text": "Meremehkan idenya karena ia personel baru yang belum berpengalaman.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menyambut baik ide inovatif tersebut, mempelajari teknis penerapannya, dan memberikan ruang bagi anggota untuk mempresentasikan konsepnya di forum tim.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mencuri ide tersebut dan mengakuinya sebagai pemikiran pribadi kepada pimpinan.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menolak inovasi baru karena lebih nyaman dengan cara manual konvensional.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Menyuruh anggota tersebut fokus pada tugas piket jaga saja.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 2,
      "E": 1
    },
    "explanation": "Iklim kerja tim yang sehat mendorong inklusivitas ide dan inovasi konstruktif tanpa memandang batasan senioritas semata.",
    "dimension": "Kerjasama Tim & Sinergi Kedinasan"
  },
  {
    "id": 265,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat bertugas sebagai tim SAR gabungan pencarian korban tenggelam bersama Basarnas, perahu karet satuan Anda mengalami kerusakan baling-baling motor. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menghentikan pencarian dan bersantai di posko darat.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Segera berkoordinasi dengan tim Basarnas untuk bergabung menaiki perahu cadangan mereka serta membantu tugas pengamatan visual dari atas perahu.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyalahkan rekan pengemudi perahu atas kerusakan teknis tersebut.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Meminjam perahu nelayan tanpa izin untuk melanjutkan pencarian sendirian.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Meminta pimpinan membatalkan status pencarian korban.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 2,
      "E": 1
    },
    "explanation": "Kemampuan beradaptasi dan berintegrasi dengan armada instansi mitra saat krisis membuktikan komitmen sinergi penyelamatan kemanusiaan.",
    "dimension": "Kerjasama Tim & Sinergi Kedinasan"
  },
  {
    "id": 266,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Rekan satu tim penyidikan Anda mengalami kesulitan dalam menganalisis data jejak digital (digital forensics) perkara penipuan. Anda yang memahami IT akan...",
    "options": [
      {
        "key": "A",
        "text": "Mengejek ketidaktahuannya di depan rekan kerja lainnya.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Meluangkan waktu untuk mendampingi, memandu teknik penarikan data, dan berbagi pengetahuan teknis agar kemampuan tim meningkat secara merata.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menolak membantu dengan alasan bukan bagian dari rincian tugas formal saya.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Mengerjakan seluruh kasusnya namun meminta imbalan uang pribadi.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menyarankan rekan memalsukan bukti digital daripada repot menganalisis.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Transfer pengetahuan (knowledge sharing) antar-rekan kerja memperkuat kompetensi kolektif satuan dalam mengungkap kejahatan modern.",
    "dimension": "Kerjasama Tim & Sinergi Kedinasan"
  },
  {
    "id": 267,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Ketika operasi penertiban tambang ilegal berhasil mengamankan alat berat, ada rekan yang ingin langsung mengumumkan keberhasilan tim di akun media sosial pribadinya sebelum rilis resmi humas. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Mendukungnya agar akun media sosial rekan menjadi viral dan terkenal.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Mengingatkan rekan bahwa publikasi operasi wajib satu pintu melalui Humas Polri demi menjaga kerahasiaan pengembangan target berikutnya.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Ikut-ikutan membuat konten video di lokasi penggerebekan.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Merampas telepon genggam rekan dan membantingnya.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menjual informasi penangkapan kepada media swasta secara rahasia.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Disiplin komunikasi publik institusi menjaga kerahasiaan penyidikan lanjutan dan menghormati peran kehumasan resmi kepolisian.",
    "dimension": "Kerjasama Tim & Sinergi Kedinasan"
  },
  {
    "id": 268,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Dalam tugas pengamanan unjuk rasa, Anda melihat ada celah kosong pada barisan pertahanan kompi sebelah yang berpotensi diterobos massa. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Membiarkannya karena itu merupakan sektor tanggung jawab kompi lain.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Segera memberitahukan komandan peleton Anda dan berkomunikasi dengan komandan kompi sebelah untuk segera melakukan perapatan formasi saling melengkapi.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menertawakan kelalaian formasi kompi sebelah.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Lari mundur sebelum massa menerobos celah tersebut.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Mendorong massa agar menyerbu celah kosong tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Kewaspadaan kolektif dan komunikasi taktis lintas unit menjamin keutuhan sistem pengamanan serta mencegah kegagalan operasi pertahanan.",
    "dimension": "Kerjasama Tim & Sinergi Kedinasan"
  },
  {
    "id": 269,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat bertugas sebagai Bhabinkamtibmas, Babinsa dari Koramil setempat sedang menyelenggarakan kegiatan bakti sosial karya bakti pembersihan saluran air. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Tidak hadir karena kegiatan tersebut diinisiasi oleh pihak militer.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Hadir bersama warga binaan, aktif bergotong-royong bersama Babinsa, dan memperkuat pilar sinergitas TNI-Polri di tengah masyarakat.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Datang hanya untuk berfoto dokumentasi lalu pergi meninggalkan lokasi.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Melarang warga binaan ikut membantu kegiatan Babinsa.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menggelar acara tandingan di waktu dan lokasi yang sama.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Sinergitas Tiga Pilar (Bhabinkamtibmas, Babinsa, dan Kepala Desa) diwujudkan melalui partisipasi aktif nyata dalam kegiatan kemasyarakatan.",
    "dimension": "Kerjasama Tim & Sinergi Kedinasan"
  },
  {
    "id": 270,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Dalam penyelesaian berkas perkara yang kompleks, terjadi kebuntuan koordinasi antara penyidik kepolisian dan jaksa penuntut umum (JPU). Langkah tim...",
    "options": [
      {
        "key": "A",
        "text": "Saling melempar tuduhan dan berdebat secara emosional di media massa.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Mengajukan permohonan gelar perkara bersama (koordinasi pra-penuntutan) untuk menyamakan persepsi yuridis pembuktian alat bukti.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menghentikan penyidikan perkara tanpa dasar hukum yang jelas.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Melaporkan pihak kejaksaan kepada komisi yudisial tanpa dasar bukti.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Mengabaikan petunjuk jaksa dan memaksakan pengiriman berkas berkali-kali.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 2
    },
    "explanation": "Koordinasi pra-penuntutan melalui gelar perkara bersama adalah mekanisme resmi Criminal Justice System untuk mempercepat kelengkapan berkas perkara.",
    "dimension": "Kerjasama Tim & Sinergi Kedinasan"
  },
  {
    "id": 271,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Ketika anggota regu patroli Anda melakukan kesalahan navigasi arah sehingga terlambat tiba di lokasi laporan perkelahian warga, Anda...",
    "options": [
      {
        "key": "A",
        "text": "Memarahi dan mempermalukan pengemudi di hadapan warga masyarakat.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Fokus mengamankan TKP terlebih dahulu bersama regu, lalu melakukan evaluasi rute dan peta wilayah secara konstruktif saat konsolidasi internal.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membiarkan perkelahian berlanjut sebagai hukuman atas keterlambatan.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Melaporkan pengemudi ke provos saat itu juga di pinggir jalan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Meninggalkan regu dan berjalan kaki sendirian.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 2,
      "E": 1
    },
    "explanation": "Mengutamakan penyelesaian penanganan krisis di lapangan, kemudian melakukan debriefing evaluasi teknis secara objektif demi perbaikan tim.",
    "dimension": "Kerjasama Tim & Sinergi Kedinasan"
  },
  {
    "id": 272,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Unit kerja Anda dipercaya menyelenggarakan simulasi penanganan ancaman terorisme tingkat polda. Rekan kerja tampak pasif dan bingung dengan perannya. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Mengerjakan seluruh skenario sendirian agar acara cepat selesai.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Mengajak rekan berdiskusi, membedah buku pedoman latihan bersama, dan membagi tanggung jawab adegan secara jelas sesuai kompetensinya.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Melaporkan kepasifan rekan kepada pimpinan agar mereka ditegur keras.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Membatalkan simulasi dan beralasan sarana prasarana kurang memadai.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menertawakan kebingungan rekan di depan umum.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Membangun kolaborasi aktif melalui pendampingan dan kejelasan pembagian peran menumbuhkan rasa percaya diri serta kekompakan kelompok kerja.",
    "dimension": "Kerjasama Tim & Sinergi Kedinasan"
  },
  {
    "id": 273,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat bertugas di pos pantau arus wisata, ada anggota dari satuan lalu lintas lain yang membutuhkan bantuan sarana komunikasi cadangan karena handy talky (HT) miliknya rusak. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menolak meminjamkan karena bukan berasal dari satu polres yang sama.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Meminjamkan perangkat komunikasi cadangan dinas yang tersedia dan memastikan frekuensi terhubung demi kelancaran koordinasi pengamanan arus.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyewakan perangkat cadangan tersebut dengan tarif harian.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menyuruh rekan tersebut menggunakan sinyal asap untuk berkomunikasi.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menyembunyikan seluruh perangkat komunikasi cadangan di laci terkunci.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Semangat kebersamaan korps Tribrata melintasi batas kewilayahan satker demi menunjang kelancaran misi pengamanan lalu lintas nasional.",
    "dimension": "Kerjasama Tim & Sinergi Kedinasan"
  },
  {
    "id": 274,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Dalam operasi penegakan hukum tindak pidana kehutanan (illegal logging) bersama Polhut Kemenhut, tim dihadapkan pada medan hutan lebat yang ekstrem. Sikap Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menuntut personel Polhut membawa seluruh logistik kepolisian.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menjalin komunikasi taktis yang solid, saling menjaga keselamatan antarpersonel, dan memadukan keahlian navigasi rimba Polhut dengan taktik penindakan Polri.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Memutuskan kembali ke pangkalan dan membiarkan pelaku penebangan liar lolos.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Berjalan mendahului rombongan sendirian tanpa peta rujukan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Menyalahkan cuaca dan mendirikan tenda istirahat di tengah jalur bahaya.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 2,
      "E": 1
    },
    "explanation": "Sinergi lintas sektoral di medan operasi gabungan mengintegrasikan keunggulan taktis masing-masing unsur demi menuntaskan target operasi negara.",
    "dimension": "Kerjasama Tim & Sinergi Kedinasan"
  },
  {
    "id": 275,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Seorang warga penyandang disabilitas tuna rungu datang ke SPKT untuk melaporkan kehilangan dokumen penting, namun petugas loket kesulitan memahami bahasa isyaratnya. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menyuruh warga tersebut pulang dan mencari juru bahasa sendiri.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Mendekati warga tersebut dengan ramah, menyediakan media tulis/kertas atau aplikasi teks di telepon genggam, dan melayani pelaporan dengan sabar.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membentak warga tersebut agar berbicara lebih jelas.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Mengabaikan warga tersebut dan melayani pelapor lain yang normal.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menertawakan keterbatasan fisik warga tersebut.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Pelayanan kepolisian yang inklusif dan humanis menuntut inisiatif adaptasi sarana komunikasi agar hak pelayanan warga berkebutuhan khusus terpenuhi.",
    "dimension": "Pelayanan Publik & Humanis"
  },
  {
    "id": 276,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Seorang ibu histeris mendatangi kantor polisi melaporkan bahwa balitanya hilang di pasar tradisional. Sikap Anda saat menerima laporan...",
    "options": [
      {
        "key": "A",
        "text": "Menyuruh ibu tersebut tenang dan menunggu masa 1x24 jam sebelum membuat laporan resmi.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menenangkan sang ibu dengan empati, mencatat ciri-ciri fisik anak secara cepat, dan segera menyiarkan informasi darurat ke seluruh jajaran patroli terdekat.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Memarahi sang ibu karena dinilai lalai menjaga anaknya di tempat ramai.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Meminta biaya operasional pencarian kepada ibu tersebut.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Mencatat laporan di buku tanpa melakukan tindakan lapangan.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 2
    },
    "explanation": "Kedaruratan kehilangan anak memerlukan respons kilat (quick response), empati tinggi, dan koordinasi radio seketika tanpa menunggu masa 24 jam.",
    "dimension": "Pelayanan Publik & Humanis"
  },
  {
    "id": 277,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Ketika mengantre perpanjangan SKCK di loket pelayanan, warga mengeluhkan ruang tunggu yang panas karena pendingin ruangan (AC) mati. Tindakan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menyuruh warga keluar jika merasa kepanasan di kantor polisi.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menyampaikan permohonan maaf atas ketidaknyamanan, membuka ventilasi jendela, menyediakan kipas angin portabel cadangan, dan segera menghubungi teknisi perbaikan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Memarahi petugas keamanan kantor atas kerusakan AC.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Pura-pura tidak mendengar keluhan warga yang mengantre.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menutup loket pelayanan SKCK untuk hari itu.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Responsivitas terhadap kenyamanan fasilitas pelayanan publik mencerminkan komitmen kepolisian yang berorientasi pada kepuasan masyarakat.",
    "dimension": "Pelayanan Publik & Humanis"
  },
  {
    "id": 278,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat bertugas patroli siang hari di jalan arteri, Anda melihat seorang kakek pejalan kaki kesulitan menyeberang jalan akibat padatnya arus kendaraan cepat. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Membunyikan sirine mobil patroli dari kejauhan agar kendaraan lain berhenti sendiri.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Menepikan kendaraan di tempat aman, turun ke jalan, menghentikan arus kendaraan dengan aba-aba tangan yang jelas, dan menuntun sang kakek menyeberang hingga selamat.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengabaikan kakek tersebut karena bukan penindakan pelanggaran hukum.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Merekam kakek tersebut untuk bahan konten media sosial pribadi.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menyuruh kakek tersebut berjalan mencari jembatan penyeberangan orang yang jauh.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Perlindungan dan pertolongan nyata kepada warga lansia di jalan raya merupakan implementasi nilai luhur tugas pokok Polri sebagai pelindung dan pengayom.",
    "dimension": "Pelayanan Publik & Humanis"
  },
  {
    "id": 279,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Seorang korban kekerasan seksual datang melapor ke kantor kepolisian dalam kondisi trauma berat dan takut bertemu polisi pria. Sebagai perwira piket, Anda...",
    "options": [
      {
        "key": "A",
        "text": "Memaksa korban menceritakan kronologi di hadapan seluruh petugas piket pria.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Mengantar korban ke Ruang Pelayanan Khusus (RPK), memanggil penyidik Polwan dari Unit PPA, serta memastikan privasi dan pendampingan psikologis korban terjaga.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menolak laporan karena korban tidak membawa bukti visum mandiri.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menanyakan pertanyaan yang menyudutkan gaya pakaian korban saat kejadian.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menyuruh korban pulang dan berdamai dengan pelaku kekerasan.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "SOP penanganan korban kekerasan seksual mewajibkan pemeriksaan di Ruang Pelayanan Khusus oleh penyidik Polwan demi melindungi kondisi psikologis korban.",
    "dimension": "Pelayanan Publik & Humanis"
  },
  {
    "id": 280,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Di media sosial viral keluhan warga mengenai adanya oknum petugas yang meminta biaya fotokopi berkas laporan kehilangan di polsek Anda. Tindakan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menyerang akun warga tersebut dengan komentar pembelaan diri yang agresif.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Melakukan investigasi internal bersama perwira Provost, menertibkan praktik pungutan tidak resmi, dan menyediakan sarana fotokopi gratis bagi masyarakat pemohon.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menutup pelayanan penerbitan surat kehilangan di polsek.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Membiarkan keluhan tersebut hilang dengan sendirinya.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menyalahkan pimpinan polres atas minimnya anggaran fotokopi kantor.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 2
    },
    "explanation": "Menindaklanjuti keluhan masyarakat dengan perbaikan sistemik dan penertiban internal menjaga marwah pelayanan publik kepolisian yang bersih dan akuntabel.",
    "dimension": "Pelayanan Publik & Humanis"
  },
  {
    "id": 281,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat patroli subuh, Anda menemukan anak jalanan yang tidur menggigil di emperan ruko dalam kondisi kelaparan. Tindakan paling tepat adalah...",
    "options": [
      {
        "key": "A",
        "text": "Mengusir anak tersebut dengan tongkat polisi agar kota terlihat tertib.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Membangunkan dengan lembut, memberikan makanan dan minuman, mendata identitas keluarganya, serta berkoordinasi dengan Dinas Sosial untuk pembinaan lanjutan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menangkap anak tersebut dan memasukkannya ke dalam sel tahanan kriminal.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Mengabaikannya karena urusan anak jalanan bukan tugas pokok penegak hukum.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Memfoto anak tersebut untuk meminta donasi di rekening pribadi Anda.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 2,
      "E": 1
    },
    "explanation": "Pendekatan humanis kepada kelompok rentan dan anak jalanan mengutamakan perlindungan sosial dan sinergi dengan instansi kesejahteraan sosial negara.",
    "dimension": "Pelayanan Publik & Humanis"
  },
  {
    "id": 282,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Seorang pengendara motor yang Anda hentikan karena tidak memakai helm menangis tersedu-sedu dan mengaku sedang panik menuju rumah sakit karena anaknya kritis. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Tetap menyita sepeda motornya di tempat dan membiarkan pengendara berjalan kaki.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Memverifikasi situasi secara cepat, memberikan pengawalan patroli motor menuju rumah sakit demi keselamatan anak, dan memproses pembinaan edukasi tilang kemudian.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Memarahi pengendara karena berbohong menggunakan alasan anak sakit.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Meminta uang damai agar pengendara diizinkan lewat tanpa helm.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Melepaskan pengendara tanpa helm dan membiarkannya ngebut membahayakan diri di jalan.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 2
    },
    "explanation": "Diskresi kepolisian yang berkeadilan mendahulukan nilai kemanusiaan darurat keselamatan jiwa dengan memberikan diskresi pengawalan menuju rumah sakit.",
    "dimension": "Pelayanan Publik & Humanis"
  },
  {
    "id": 283,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Warga masyarakat di wilayah binaan Anda merasa takut melapor adanya bandar miras oplosan karena takut diintimidasi preman. Langkah Bhabinkamtibmas...",
    "options": [
      {
        "key": "A",
        "text": "Mengumumkan nama pelapor di pengeras suara masjid desa.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Membangun saluran aduan rahasia (hotline khusus), menjamin kerahasiaan identitas saksi pelapor, dan berkoordinasi dengan tim opsnal untuk penindakan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyuruh warga menangkap sendiri bandar miras tersebut.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menolak menangani aduan jika warga tidak mau menjadi saksi terbuka di persidangan.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Membiarkan peredaran miras karena tidak ada aduan tertulis resmi.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 2,
      "E": 1
    },
    "explanation": "Menumbuhkan kepercayaan masyarakat (public trust) dicapai melalui jaminan kerahasiaan identitas dan perlindungan penuh kepada warga pelapor kejahatan.",
    "dimension": "Pelayanan Publik & Humanis"
  },
  {
    "id": 284,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat memberikan materi penyuluhan bahaya narkoba di sekolah menengah, para siswa tampak bosan dengan materi hukum yang kaku. Pendekatan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Membentak para siswa agar memperhatikan ceramah dengan tertib.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Mengubah metode penyampaian dengan media interaktif, studi kasus nyata yang relevan bagi remaja, kuis berhadiah, dan dialog komunikasi dua arah yang hangat.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mempersingkat materi menjadi 5 menit dan langsung pulang.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Mengancam akan menilang seluruh siswa yang tidak memperhatikan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menyerahkan mic kepada guru dan tidur di belakang kelas.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Penyuluhan Binmas yang humanis dan edukatif menuntut kreativitas komunikasi agar pesan pencegahan kejahatan dapat diterima generasi muda secara efektif.",
    "dimension": "Pelayanan Publik & Humanis"
  },
  {
    "id": 285,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Seorang turis asing kehilangan paspor dan dompet di kawasan objek wisata, namun turis tersebut tidak bisa berbahasa Indonesia. Tindakan petugas pos pam...",
    "options": [
      {
        "key": "A",
        "text": "Mengusir turis tersebut karena menyulitkan komunikasi petugas pos.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menyapa dengan ramah menggunakan bahasa Inggris dasar atau aplikasi penerjemah, menenangkan turis tersebut, menerbitkan surat tanda lapor kehilangan, dan membantu menghubungi kedutaannya.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Meminta bayaran dolar untuk biaya penterjemahan bahasa.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menyuruh turis tersebut mencari kantor imigrasi sendiri.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Mengabaikan turis tersebut hingga ia pergi dengan kebingungan.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 2,
      "E": 1
    },
    "explanation": "Pelayanan prima kepada wisatawan mencerminkan profesionalisme standar internasional kepolisian dalam menjaga keamanan destinasi pariwisata nasional.",
    "dimension": "Pelayanan Publik & Humanis"
  },
  {
    "id": 286,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Seorang warga mendatangi kantor polisi pada malam hari meminta bantuan mediasi perselisihan batas pekarangan dengan tetangganya yang memanas. Tindakan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menolak melayani karena masalah perdata tanah bukan urusan polisi pidana.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Menerima warga dengan baik, mendengarkan duduk perkara secara objektif, dan menawarkan kehadiran Bhabinkamtibmas untuk problem solving bersama kepala desa esok hari secara damai.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyuruh kedua warga tersebut saling menuntut di pengadilan perdata.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Menahan kedua belah pihak di sel kantor polisi agar tidak ribut.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Meminta sertifikat tanah asli warga sebagai jaminan laporan.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Peran kepolisian dalam Pemolisian Masyarakat (Polmas) mengedepankan problem solving awal untuk meredam potensi konflik horizontal antarwarga.",
    "dimension": "Pelayanan Publik & Humanis"
  },
  {
    "id": 287,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Setelah jam pelayanan SIM ditutup pukul 15.00 WIB, seorang buruh pabrik yang baru saja izin kerja datang dengan terengah-engah memohon perpanjangan SIM karena hari itu adalah hari terakhir masa berlakunya. Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menutup pintu loket di depan wajah warga tanpa sepatah kata pun.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Memeriksa kelengkapan berkas, mengapresiasi itikad baik warga yang telah berusaha hadir, dan melayaninya melalui diskresi pelayanan lembur singkat agar SIM-nya tidak hangus.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Meminta bayaran denda keterlambatan uang pribadi sebesar dua kali lipat.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menyuruh warga membuat SIM baru dari awal dengan ujian tes ulang.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Menyalahkan buruh tersebut mengapa baru datang sore hari.",
        "weight": 2
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 2,
      "E": 2
    },
    "explanation": "Diskresi pelayanan humanis dalam batas kewajaran administrasi mencegah kerugian hak warga yang telah menunjukkan itikad baik mematuhi hukum.",
    "dimension": "Pelayanan Publik & Humanis"
  },
  {
    "id": 288,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Sebagai komandan regu patroli malam, Anda menerima informasi bahwa sekelompok geng motor bersenjata tajam sedang bergerak menuju pemukiman warga. Keputusan taktis Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menunggu hingga ada laporan warga yang menjadi korban baru bergerak.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Mengonsolidasikan regu dengan perlengkapan taktis, melapor ke perwira pengendali (Padal), mengarahkan rute penyekatan sebelum kelompok masuk ke pemukiman, dan meminta bantuan perkuatan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menghindari rute geng motor agar personel regu patroli aman dari risiko.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Memerintahkan anggota regu melepaskan tembakan peluru tajam ke arah kepala tanpa peringatan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Membubarkan regu patroli dan berlindung di dalam kantor polsek.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Kepemimpinan taktis lapangan menuntut kesigapan langkah preventif penyekatan, koordinasi rantai komando, dan penindakan proporsional demi melindungi warga.",
    "dimension": "Kepemimpinan & Pengambilan Keputusan"
  },
  {
    "id": 289,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Dalam regu yang Anda pimpin, terdapat dua personel senior yang berselisih paham mengenai pembagian jadwal piket pengamanan, sehingga suasana kerja menjadi tegang. Sikap Anda...",
    "options": [
      {
        "key": "A",
        "text": "Membiarkan perselisihan berlanjut hingga salah satu mengalah sendiri.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Memanggil kedua personel ke ruang kerja, mendengarkan argumen masing-masing secara objektif, menegaskan kembali aturan dinas, dan menetapkan rotasi jadwal yang adil serta transparan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Memihak kepada personel yang paling dekat dengan Anda secara pribadi.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menghukum kedua personel dengan mencabut hak cuti mereka secara sepihak.",
        "weight": 2
      },
      {
        "key": "E",
        "text": "Mengeluh kepada komandan kompi bahwa bawahan Anda tidak bisa diatur.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 2,
      "E": 1
    },
    "explanation": "Pemimpin yang efektif mengambil peran aktif sebagai penengah yang adil, menyelesaikan konflik internal secara bijaksana, dan menegakkan aturan objektif.",
    "dimension": "Kepemimpinan & Pengambilan Keputusan"
  },
  {
    "id": 290,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat memimpin operasi tangkap tangan penyelundupan barang terlarang di pelabuhan, target melarikan diri ke area keramaian pasar ikan. Keputusan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Memerintahkan penembakan beruntun ke arah kerumunan pasar.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menginstruksikan pengepungan pintu keluar pasar secara senyap tanpa melepaskan tembakan yang dapat memicu kepanikan warga, serta berkoordinasi dengan pengamanan pelabuhan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membatalkan pengejaran dan membiarkan pelaku kabur demi kenyamanan.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Menyuruh warga pasar menabrakkan diri ke arah pelaku yang membawa senjata tajam.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Melepaskan gas air mata di dalam pasar ikan.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Keputusan taktis di area padat penduduk wajib mengutamakan keselamatan jiwa masyarakat sipil melalui teknik pengepungan perimeter tanpa senjata api.",
    "dimension": "Kepemimpinan & Pengambilan Keputusan"
  },
  {
    "id": 291,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Unit kerja Anda dihadapkan pada target penuntasan perkara (Crime Clearance) yang menurun tajam dalam bulan ini. Sebagai kanit, langkah strategis Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menyalahkan bintara penyidik di hadapan pimpinan saat rapat polda.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Menggelar evaluasi gelar perkara internal, membedah hambatan pembuktian pada setiap berkas yang macet, serta menyusun jadwal asistensi teknis pemecahan masalah perkara.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Memalsukan laporan statistik agar angka pengungkapan perkara tampak tinggi.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menghentikan penyidikan seluruh perkara yang sulit pembuktiannya.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Mengundurkan diri dari jabatan kepala unit penyidikan.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Kepemimpinan visioner berfokus pada penyelesaian akar masalah (problem-solving) dan penguatan kapasitas tim dalam mendongkrak produktivitas kerja.",
    "dimension": "Kepemimpinan & Pengambilan Keputusan"
  },
  {
    "id": 292,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Seorang anggota regu Anda melakukan kesalahan prosedur penilangan karena kurang memahami aturan tilang baru sehingga videonya menuai kritik publik. Tindakan Anda sebagai pimpinan...",
    "options": [
      {
        "key": "A",
        "text": "Langsung mencopot dan menghukum anggota tersebut di depan media massa untuk cuci tangan.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Mengambil alih pertanggungjawaban komando, memberikan pembinaan dan pelatihan intensif kepada anggota, serta menyampaikan klarifikasi korektif yang santun kepada publik.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membela anggota secara membabi-buta meskipun jelas-jelas tindakannya salah.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Menyembunyikan anggota tersebut di daerah terpencil tanpa pembinaan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menghapus akun humas polres agar tidak melihat kritik warga.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Pemimpin sejati memegang prinsip akuntabilitas komando, melindungi kehormatan institusi dengan pembinaan internal yang mendidik dan klarifikasi transparan.",
    "dimension": "Kepemimpinan & Pengambilan Keputusan"
  },
  {
    "id": 293,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat bertugas mengamankan evakuasi warga korban tanah longsor, akses jalan utama terputus dan alat berat belum tiba. Sebagai perwira pengendali lapangan, Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menunggu instruksi komando polda tanpa melakukan tindakan penyelamatan apa pun.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Mengambil inisiatif diskresi darurat mengerahkan personel dan relawan merintis jalur evakuasi alternatif setapak menggunakan tandu manual demi menyelamatkan korban luka parah.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyuruh warga korban longsor berjalan sendiri melintasi area rawan longsor susulan.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Kembali ke markas komando karena fasilitas operasi dinilai minim.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Mengumumkan kepada publik bahwa operasi penyelamatan mustahil dilakukan.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Inisiatif kepemimpinan darurat (crisis leadership) menuntut keberanian mengambil diskresi penyelamatan rute alternatif saat keselamatan jiwa warga terancam maut.",
    "dimension": "Kepemimpinan & Pengambilan Keputusan"
  },
  {
    "id": 294,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Pimpinan memberikan target penyerapan anggaran operasional dan penyusunan laporan pertanggungjawaban dalam sisa waktu 3 hari. Langkah Anda sebagai ketua tim...",
    "options": [
      {
        "key": "A",
        "text": "Menolak target tersebut karena dinilai tidak masuk akal.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Membuat rencana kerja harian yang terperinci, membagi klaster penyusunan SPJ kepada anggota tim sesuai tupoksi, dan memonitor kelengkapan kuitansi setiap 4 jam.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menyerahkan seluruh berkas kosong kepada bendahara pengeluaran.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menyalin SPJ tahun lalu tanpa memeriksa keabsahan transaksi riil.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Membiarkan batas waktu terlewati dan menerima teguran pimpinan.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Kemampuan manajerial pemimpin diuji dari efektivitas perencanaan kerja terstruktur dan pengawasan intensif dalam menyelesaikan tenggat waktu dinas.",
    "dimension": "Kepemimpinan & Pengambilan Keputusan"
  },
  {
    "id": 295,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Dalam situasi kebakaran hutan dan lahan (Karhutla), arah angin mendadak berbalik menuju posko pemadaman tim Anda. Keputusan cepat Anda...",
    "options": [
      {
        "key": "A",
        "text": "Menyuruh pasukan tetap memadamkan api di titik yang sama tanpa peduli arah angin.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Segera meniup peluit darurat, memerintahkan pergeseran pasukan mundur teratur ke zona aman yang telah ditentukan, dan mengatur formasi pemadaman dari arah berlawanan.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Lari sendirian meninggalkan anggota pasukan di tengah kepulan asap tebal.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menyerah dan membiarkan api membakar peralatan pemadam dinas.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menyiramkan air ke seragam dinas sendiri dan tidur di semak belukar.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Keputusan taktis tanggap darurat memprioritaskan keselamatan jiwa personel (force protection) dengan reposisi terencana sebelum melakukan penanggulangan lanjutan.",
    "dimension": "Kepemimpinan & Pengambilan Keputusan"
  },
  {
    "id": 296,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Saat mengevaluasi pembagian penghargaan kenaikan pangkat luar biasa (KPLB), ada anggota berprestasi yang kurang disukai di kesatuan karena sifatnya yang pendiam. Keputusan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Mencoret namanya dan mengusulkan anggota lain yang lebih populer.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Tetap mengusulkan nama anggota tersebut secara adil berdasarkan fakta riil data pengungkapan kasus dan prestasi operasionalnya yang gemilang.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mengusulkan nama anggota keluarga pimpinan kesatuan.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Membatalkan seluruh usulan KPLB bagi unit Anda.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Meminta imbalan uang dari anggota tersebut jika ingin diusulkan.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Objektivitas dan keadilan meritokrasi merupakan pilar kepemimpinan berwibawa yang menghargai dedikasi nyata tanpa bias subjektivitas pertemanan.",
    "dimension": "Kepemimpinan & Pengambilan Keputusan"
  },
  {
    "id": 297,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Sebagai padal pengamanan sidang vonis terorisme, suasana di ruang sidang mulai ricuh oleh teriakan simpatisan terdakwa. Keputusan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Membiarkan simpatisan berteriak agar persidangan segera dibubarkan hakim.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Berkoordinasi dengan majelis hakim, memerintahkan regu sterilisasi menertibkan simpatisan anarkis keluar dari ruang sidang, dan memperkuat perimeter keamanan di dalam ruang sidang.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menembakkan senjata api ke langit-langit ruang sidang pengadilan.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Memborgol majelis hakim dan jaksa penuntut umum.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Meninggalkan ruang sidang dan menutup pintu dari luar.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Menjaga wibawa peradilan (contempt of court) dan ketertiban ruang sidang dilakukan melalui penertiban terukur dan penguatan pengamanan perimeter.",
    "dimension": "Kepemimpinan & Pengambilan Keputusan"
  },
  {
    "id": 298,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Seorang bintara muda dalam tim Anda tampak kehilangan rasa percaya diri setelah gagal dalam ujian menembak kualifikasi kelas satu. Tindakan kepemimpinan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Mengejek bintara tersebut di depan anggota lain agar merasa malu.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Mengajak bintara tersebut berdiskusi, mengevaluasi kesalahan teknik membidik, memberikan bimbingan latihan ekstra secara sabar, dan menumbuhkan kembali semangat juangnya.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Mencabut hak membawa senjata api secara permanen tanpa evaluasi.",
        "weight": 2
      },
      {
        "key": "D",
        "text": "Menyuruh bintara tersebut mengurus mutasi ke bagian administrasi non-lapangan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Mengabaikan masalah moral bawahan karena bukan urusan pribadi komandan.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 2,
      "D": 1,
      "E": 1
    },
    "explanation": "Fungsi kepemimpinan pembinaan (mentoring) berfokus pada pengembangan potensi bawahan melalui evaluasi teknik dan dorongan motivasi mental yang berkelanjutan.",
    "dimension": "Kepemimpinan & Pengambilan Keputusan"
  },
  {
    "id": 299,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Dalam pelaksanaan pengamanan rute konvoi kepala negara sahabat, terjadi kecelakaan lalu lintas warga sipil pada jalur alternatif yang sedang Anda amankan. Keputusan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Mengabaikan korban kecelakaan karena tugas utama adalah pengawalan VVIP.",
        "weight": 2
      },
      {
        "key": "B",
        "text": "Membagi personel regu: menugaskan dua personel memberikan pertolongan pertama dan evakuasi korban ke tepi jalan, sementara jalur utama VVIP tetap steril dan terjaga aman.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Menutup total seluruh jalur jalan raya dan menelantarkan korban di aspal.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Memerintahkan konvoi VVIP berhenti dan ikut menolong korban kecelakaan.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menyalahkan korban mengapa melintas di rute pengamanan negara.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 2,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Kepemimpinan taktis yang cakap mampu mengambil keputusan pembagian peran terukur (task allocation): prioritas keselamatan VVIP terjaga dan korban sipil tertolong.",
    "dimension": "Kepemimpinan & Pengambilan Keputusan"
  },
  {
    "id": 300,
    "module": "Tes Psikologi — Mental Kepribadian (SJT Polri)",
    "subtest": "KEPRIBADIAN",
    "stem": "Sebagai perwira pengendali, Anda menemukan fakta bahwa rencana penyergapan sarang peredaran senjata api ilegal telah tercium oleh mata-mata musuh. Keputusan Anda...",
    "options": [
      {
        "key": "A",
        "text": "Tetap memaksakan rencana awal menyerbu ke titik sasaran yang telah siap disergap musuh.",
        "weight": 1
      },
      {
        "key": "B",
        "text": "Mengubah rencana taktis operasi secara mendadak, menunda penyerbuan langsung, mengubah waktu serta sudut perimeter sergapan, dan mengisolasi jalur kebocoran informasi internal.",
        "weight": 5
      },
      {
        "key": "C",
        "text": "Membatalkan seluruh penegakan hukum dan membiarkan para pelaku bebas beroperasi.",
        "weight": 1
      },
      {
        "key": "D",
        "text": "Menyerang markas musuh seorang diri tanpa melibatkan pasukan regu.",
        "weight": 1
      },
      {
        "key": "E",
        "text": "Menghubungi pimpinan musuh untuk bernegosiasi damai.",
        "weight": 1
      }
    ],
    "correctKey": "B",
    "optionWeights": {
      "A": 1,
      "B": 5,
      "C": 1,
      "D": 1,
      "E": 1
    },
    "explanation": "Keberanian mengubah rencana operasi saat intelijen mendeteksi kebocoran taktik melindungi nyawa pasukan regu dan menjamin keberhasilan penegakan hukum.",
    "dimension": "Kepemimpinan & Pengambilan Keputusan"
  }
];

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
    "stem": "Komponen fisik komputer disebut…",
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
      },
      {
        "key": "E",
        "text": "Brainware (Pengguna)"
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
    "stem": "Perangkat lunak yang mengelola perangkat keras dan aplikasi adalah…",
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
      },
      {
        "key": "E",
        "text": "Firmware BIOS"
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
    "stem": "Pusat pemrosesan instruksi komputer adalah…",
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
      },
      {
        "key": "E",
        "text": "Motherboard"
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
    "stem": "RAM berfungsi sebagai…",
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
      },
      {
        "key": "E",
        "text": "Harddisk eksternal offline"
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
    "stem": "Perangkat untuk memasukkan teks adalah…",
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
      },
      {
        "key": "E",
        "text": "Trackball"
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
    "stem": "Perangkat output visual adalah…",
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
      },
      {
        "key": "E",
        "text": "Plotter cetak teknik"
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
    "stem": "Satuan kapasitas data digital adalah…",
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
      },
      {
        "key": "E",
        "text": "Hertz (Hz)"
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
    "stem": "Alat untuk mengubah dokumen kertas menjadi digital adalah…",
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
      },
      {
        "key": "E",
        "text": "Barcode Scanner"
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
    "stem": "SSD dan HDD digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "Heatsink pendingin"
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
    "stem": "Salinan data untuk pemulihan saat data utama hilang disebut…",
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
      },
      {
        "key": "E",
        "text": "Enkripsi berkas"
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
    "stem": "Perangkat lunak berbahaya disebut…",
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
      },
      {
        "key": "E",
        "text": "Firmware"
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
    "stem": "Papan utama tempat komponen komputer terhubung disebut…",
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
        "text": "Flashdisk"
      },
      {
        "key": "E",
        "text": "Power Supply Unit"
      }
    ],
    "correctKey": "A",
    "explanation": "Motherboard menghubungkan prosesor, RAM, penyimpanan, dan komponen lain.",
    "weight": 10
  },
  {
    "id": 413,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "Ekstensi .docx umumnya untuk dokumen…",
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
      },
      {
        "key": "E",
        "text": "Arsip terkompresi ZIP"
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
    "stem": "Ekstensi .xlsx digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "Basis data SQL"
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
    "stem": "Ekstensi .pptx digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "Kode sumber program"
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
    "stem": "Ctrl+C berfungsi untuk…",
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
      },
      {
        "key": "E",
        "text": "Memotong teks (Cut)"
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
    "stem": "Ctrl+V berfungsi untuk…",
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
      },
      {
        "key": "E",
        "text": "Menghapus teks terpilih"
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
    "stem": "Ctrl+Z umumnya berfungsi untuk…",
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
      },
      {
        "key": "E",
        "text": "Spasi ganda (Double spacing)"
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
    "stem": "Folder digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "Header dan Footer"
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
    "stem": "Recycle Bin menampung…",
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
      },
      {
        "key": "E",
        "text": "Margin halaman"
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
    "stem": "Untuk menemukan berkas, gunakan…",
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
      },
      {
        "key": "E",
        "text": "Perataan justified"
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
    "stem": "Rename berarti…",
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
      },
      {
        "key": "E",
        "text": "Format mata uang"
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
    "stem": "Ctrl+S biasanya digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "Grafik batang (Bar chart)"
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
    "stem": "Ekstensi .pdf lazim digunakan untuk…",
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
        "text": "Database relasional"
      },
      {
        "key": "E",
        "text": "Merge cells"
      }
    ],
    "correctKey": "A",
    "explanation": "PDF mempertahankan tata letak dokumen lintas perangkat relatif konsisten.",
    "weight": 10
  },
  {
    "id": 425,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "Microsoft Word terutama untuk…",
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
      },
      {
        "key": "E",
        "text": "Kondisional formatting"
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
    "stem": "Ctrl+B digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "Slide sorter view"
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
    "stem": "Ctrl+I digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "Desain tema presentasi"
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
    "stem": "Ctrl+U digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "Penyesuaian aspek rasio"
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
    "stem": "Ctrl+J pada Word menerapkan…",
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
      },
      {
        "key": "E",
        "text": "Pengaturan audio latar"
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
    "stem": "Header berada di bagian…",
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
      },
      {
        "key": "E",
        "text": "Navigasi tombol aksi"
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
    "stem": "Footer berada di bagian…",
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
      },
      {
        "key": "E",
        "text": "Area kerja kanvas"
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
    "stem": "Fitur Numbering digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "Format vektor SVG"
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
    "stem": "Find digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "Panel properti"
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
    "stem": "Mail Merge bermanfaat untuk…",
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
      },
      {
        "key": "E",
        "text": "Pengaturan rotasi objek"
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
    "stem": "Save As digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "Penyelarasan kisi panduan"
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
    "stem": "Orientasi halaman mendatar disebut…",
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
      },
      {
        "key": "E",
        "text": "Server proksi"
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
    "stem": "Track Changes digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "Web server"
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
    "stem": "Nomor halaman disisipkan melalui…",
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
      },
      {
        "key": "E",
        "text": "Protokol FTP"
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
    "stem": "Format PDF berguna untuk…",
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
        "text": "Selalu memperkecil file"
      },
      {
        "key": "E",
        "text": "Bandwidth transfer"
      }
    ],
    "correctKey": "A",
    "explanation": "PDF membantu menjaga tampilan dokumen, tetapi tidak menjamin keamanan atau ukuran kecil.",
    "weight": 10
  },
  {
    "id": 440,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "Excel terutama digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "Jaringan Mesh"
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
    "stem": "Pertemuan baris dan kolom disebut…",
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
      },
      {
        "key": "E",
        "text": "Kabel Fiber Optik"
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
    "stem": "Alamat kolom B baris 5 adalah…",
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
      },
      {
        "key": "E",
        "text": "Subnet mask"
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
    "stem": "Formula Excel umumnya diawali…",
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
      },
      {
        "key": "E",
        "text": "Port komunikasi TCP"
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
    "stem": "SUM digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "Penyedia Layanan Internet (ISP)"
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
    "stem": "AVERAGE(A1:A5) menghitung…",
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
      },
      {
        "key": "E",
        "text": "Router gateway"
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
    "stem": "MAX menghasilkan…",
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
      },
      {
        "key": "E",
        "text": "Koneksi hotspot nirkabel"
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
    "stem": "MIN menghasilkan…",
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
      },
      {
        "key": "E",
        "text": "Autentikasi dua langkah (2FA)"
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
    "stem": "COUNT menghitung…",
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
      },
      {
        "key": "E",
        "text": "Phishing credential harvest"
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
    "stem": "COUNTA menghitung…",
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
      },
      {
        "key": "E",
        "text": "Backup terisolasi offline"
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
    "stem": "IF digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "Trojan horse"
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
    "stem": "Jika A1=80, hasil =IF(A1>=75,\"Lulus\",\"Belum\") adalah…",
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
      },
      {
        "key": "E",
        "text": "Adware promosi"
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
    "stem": "A1:A10 menunjukkan…",
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
      },
      {
        "key": "E",
        "text": "Enkripsi end-to-end"
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
    "stem": "Sort digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "Biometrik sidik jari"
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
    "stem": "Filter digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "WAF (Web Application Firewall)"
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
    "stem": "Referensi absolut menggunakan tanda…",
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
      },
      {
        "key": "E",
        "text": "Audit jejak log sistem"
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
    "stem": "Formula =A1+B1 disalin satu baris ke bawah menjadi…",
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
      },
      {
        "key": "E",
        "text": "Komputasi awan hibrida"
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
    "stem": "Freeze Panes berguna untuk…",
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
      },
      {
        "key": "E",
        "text": "Virtual Private Cloud"
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
    "stem": "Grafik dibuat melalui fitur…",
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
      },
      {
        "key": "E",
        "text": "Sinkronisasi berkas otomatis"
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
    "stem": "Error #DIV/0! muncul ketika…",
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
        "text": "Font hilang"
      },
      {
        "key": "E",
        "text": "Ketersediaan layanan 99.9%"
      }
    ],
    "correctKey": "A",
    "explanation": "Excel menampilkan #DIV/0! saat penyebut operasi pembagian nol/kosong.",
    "weight": 10
  },
  {
    "id": 460,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "PowerPoint digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "Redundansi data multi-wilayah"
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
    "stem": "Satu halaman presentasi disebut…",
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
      },
      {
        "key": "E",
        "text": "Kabel transmisi data"
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
    "stem": "F5 umumnya memulai presentasi…",
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
      },
      {
        "key": "E",
        "text": "Bluetooth low energy"
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
    "stem": "Ctrl+M digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "Repeater penguat sinyal"
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
    "stem": "Transition mengatur…",
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
      },
      {
        "key": "E",
        "text": "Mode senyap getar"
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
    "stem": "Animation diterapkan pada…",
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
      },
      {
        "key": "E",
        "text": "Penguncian pola layar"
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
    "stem": "Slide yang efektif sebaiknya…",
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
      },
      {
        "key": "E",
        "text": "Format terstruktur CSV"
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
    "stem": "Presenter View membantu penyaji melihat…",
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
      },
      {
        "key": "E",
        "text": "Konversi karakter UTF-8"
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
    "stem": "Ekspor presentasi menjadi PDF dilakukan melalui…",
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
      },
      {
        "key": "E",
        "text": "Validasi masukan data"
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
    "stem": "Theme digunakan untuk…",
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
        "text": "Mengirim ke semua kontak"
      },
      {
        "key": "E",
        "text": "Pemilahan data dinamis"
      }
    ],
    "correctKey": "A",
    "explanation": "Theme menerapkan kombinasi warna, font, dan efek.",
    "weight": 10
  },
  {
    "id": 470,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "Aplikasi untuk menjelajahi situs web disebut…",
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
      },
      {
        "key": "E",
        "text": "Ekspor tabel berkala"
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
    "stem": "Alamat sumber daya internet disebut…",
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
      },
      {
        "key": "E",
        "text": "Tanda tangan digital RSA"
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
    "stem": "HTTPS menunjukkan…",
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
      },
      {
        "key": "E",
        "text": "Watermark tanda air dokumen"
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
    "stem": "Mesin pencari berguna untuk…",
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
      },
      {
        "key": "E",
        "text": "Riwayat versi dokumen"
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
    "stem": "BCC pada email digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "Metadata berkas digital"
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
    "stem": "Lampiran email disebut…",
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
      },
      {
        "key": "E",
        "text": "Restriksi hak akses baca saja"
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
    "stem": "Email kedinasan yang baik seharusnya…",
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
      },
      {
        "key": "E",
        "text": "Sistem pendukung keputusan"
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
    "stem": "Cloud storage adalah…",
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
      },
      {
        "key": "E",
        "text": "Visualisasi analitik dashboard"
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
    "stem": "Berbagi dokumen cloud paling aman dengan…",
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
      },
      {
        "key": "E",
        "text": "Algoritma pencarian indeks"
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
    "stem": "Informasi internet sebaiknya…",
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
        "text": "Tidak perlu cek tanggal"
      },
      {
        "key": "E",
        "text": "Penyaringan data otomatis"
      }
    ],
    "correctKey": "B",
    "explanation": "Periksa sumber, tanggal, konteks, dan bukti.",
    "weight": 10
  },
  {
    "id": 480,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "Phishing adalah…",
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
      },
      {
        "key": "E",
        "text": "Integritas relasi tabel"
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
    "stem": "Kata sandi kuat sebaiknya…",
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
      },
      {
        "key": "E",
        "text": "Kamera termal pengintai"
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
    "stem": "MFA berarti…",
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
      },
      {
        "key": "E",
        "text": "Sensor inframerah"
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
    "stem": "Lampiran email mencurigakan sebaiknya…",
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
      },
      {
        "key": "E",
        "text": "GPS pelacak lokasi"
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
    "stem": "Malware adalah…",
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
      },
      {
        "key": "E",
        "text": "Radio komunikasi digital"
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
    "stem": "Ransomware umumnya…",
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
      },
      {
        "key": "E",
        "text": "Sistem alarm perimeter"
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
    "stem": "Saat memakai Wi-Fi publik…",
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
      },
      {
        "key": "E",
        "text": "Server basis data terpusat"
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
    "stem": "Data kedinasan seharusnya…",
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
      },
      {
        "key": "E",
        "text": "Antarmuka grafis pengguna (GUI)"
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
    "stem": "Pembaruan sistem penting karena…",
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
      },
      {
        "key": "E",
        "text": "Prosesor grafis GPU"
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
    "stem": "Jika perangkat dinas hilang…",
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
        "text": "Umumkan password"
      },
      {
        "key": "E",
        "text": "Port USB-C universal"
      }
    ],
    "correctKey": "A",
    "explanation": "Pelaporan cepat memungkinkan pengamanan akun dan penanganan insiden.",
    "weight": 10
  },
  {
    "id": 490,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "Jaringan komputer adalah…",
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
      },
      {
        "key": "E",
        "text": "Kabel HDMI audio visual"
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
    "stem": "Perangkat yang meneruskan paket antarjaringan disebut…",
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
      },
      {
        "key": "E",
        "text": "Penyimpanan solid state SSD"
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
    "stem": "LAN adalah singkatan dari…",
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
      },
      {
        "key": "E",
        "text": "Memori cache L3"
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
    "stem": "Alamat IP digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "Baterai UPS cadangan"
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
    "stem": "Wi-Fi merupakan teknologi…",
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
      },
      {
        "key": "E",
        "text": "Driver periferal resmi"
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
    "stem": "Jika komputer tidak terhubung internet, langkah awal…",
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
      },
      {
        "key": "E",
        "text": "Konektivitas Ethernet LAN"
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
    "stem": "Database adalah…",
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
      },
      {
        "key": "E",
        "text": "Kombinasi tombol Alt+Tab"
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
    "stem": "Primary key berfungsi untuk…",
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
      },
      {
        "key": "E",
        "text": "Kombinasi tombol Windows+L"
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
    "stem": "CSV umumnya digunakan untuk…",
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
      },
      {
        "key": "E",
        "text": "Tombol navigasi Esc"
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
    "stem": "Jika printer tidak mencetak, langkah awal…",
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
        "text": "Ganti semua kabel"
      },
      {
        "key": "E",
        "text": "Kombinasi tombol Ctrl+Shift+Esc"
      }
    ],
    "correctKey": "A",
    "explanation": "Periksa komponen dasar dan antrean cetak sebelum perbaikan lanjutan.",
    "weight": 10
  },
  {
    "id": 500,
    "module": "Tes Kemampuan Komputer (TKK)",
    "subtest": "TKK",
    "stem": "Perintah Ctrl+A umumnya berarti…",
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
      },
      {
        "key": "E",
        "text": "Kombinasi tombol Ctrl+P"
      }
    ],
    "correctKey": "A",
    "explanation": "Ctrl+A memilih seluruh teks atau objek dalam konteks aktif.",
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
    "stem": "Pancasila berkedudukan sebagai apa?",
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
      },
      {
        "key": "E",
        "text": "Kaidah kebiasaan internasional"
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
    "stem": "Rumusan Pancasila tercantum dalam bagian mana dari UUD 1945?",
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
      },
      {
        "key": "E",
        "text": "Keputusan Presiden langsung"
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
    "stem": "Sila ketiga Pancasila menekankan nilai apa?",
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
      },
      {
        "key": "E",
        "text": "Menjaga stabilitas nilai tukar Rupiah"
      }
    ],
    "correctKey": "A",
    "explanation": "Sila ketiga berbunyi Persatuan Indonesia.",
    "weight": 10
  },
  {
    "id": 504,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Menurut UUD 1945, kedaulatan berada di tangan siapa?",
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
      },
      {
        "key": "E",
        "text": "Membentuk lembaga peradilan baru"
      }
    ],
    "correctKey": "C",
    "explanation": "Pasal 1 ayat (2) menegaskan kedaulatan berada di tangan rakyat dan dilaksanakan menurut UUD.",
    "weight": 10
  },
  {
    "id": 505,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Indonesia adalah negara apa menurut Pasal 1 ayat (3) UUD 1945?",
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
      },
      {
        "key": "E",
        "text": "Kaidah adat istiadat setempat"
      }
    ],
    "correctKey": "B",
    "explanation": "UUD 1945 menegaskan Indonesia adalah negara hukum.",
    "weight": 10
  },
  {
    "id": 506,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Lembaga yang memegang kekuasaan membentuk undang-undang adalah?",
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
      },
      {
        "key": "E",
        "text": "Peraturan Daerah Provinsi"
      }
    ],
    "correctKey": "A",
    "explanation": "Pasal 20 UUD 1945 menyatakan DPR memegang kekuasaan membentuk undang-undang.",
    "weight": 10
  },
  {
    "id": 507,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Presiden menurut UUD 1945 memegang kekuasaan apa?",
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
      },
      {
        "key": "E",
        "text": "Surat izin dari instansi asal"
      }
    ],
    "correctKey": "B",
    "explanation": "Presiden memegang kekuasaan pemerintahan menurut UUD.",
    "weight": 10
  },
  {
    "id": 508,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Bentuk negara Indonesia adalah?",
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
        "text": "Konfederasi"
      },
      {
        "key": "E",
        "text": "Melakukan penindakan tanpa dasar hukum"
      }
    ],
    "correctKey": "B",
    "explanation": "Pasal 1 ayat (1) menyatakan Indonesia ialah Negara Kesatuan yang berbentuk Republik.",
    "weight": 10
  },
  {
    "id": 509,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Persamaan warga negara di hadapan hukum dikenal sebagai prinsip apa?",
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
      },
      {
        "key": "E",
        "text": "Menerima imbalan sukarela warga"
      }
    ],
    "correctKey": "A",
    "explanation": "Prinsip ini menghendaki hukum diterapkan tanpa diskriminasi.",
    "weight": 10
  },
  {
    "id": 510,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Pembatasan kekuasaan dalam negara hukum terutama bertujuan untuk apa?",
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
      },
      {
        "key": "E",
        "text": "Diskresi tanpa pertimbangan situasional"
      }
    ],
    "correctKey": "B",
    "explanation": "Pembatasan dan pengawasan mencegah tindakan sewenang-wenang.",
    "weight": 10
  },
  {
    "id": 511,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Undang-undang pokok yang mengatur Polri adalah?",
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
      },
      {
        "key": "E",
        "text": "Menolak laporan sebelum ada bukti kuat"
      }
    ],
    "correctKey": "A",
    "explanation": "UU 2/2002 adalah UU tentang Polri dan harus dibaca bersama perubahan yang berlaku.",
    "weight": 10
  },
  {
    "id": 512,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Tiga tugas pokok Polri meliputi apa?",
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
      },
      {
        "key": "E",
        "text": "Membatasi akses bantuan hukum tersangka"
      }
    ],
    "correctKey": "B",
    "explanation": "Pasal 13 UU 2/2002 merumuskan tiga tugas pokok tersebut.",
    "weight": 10
  },
  {
    "id": 513,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Polri berada di bawah siapa dalam struktur ketatanegaraan?",
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
      },
      {
        "key": "E",
        "text": "Menyita barang tanpa surat penetapan"
      }
    ],
    "correctKey": "B",
    "explanation": "UU Kepolisian mengatur Polri berada di bawah Presiden; perhatikan perubahan peraturan terbaru.",
    "weight": 10
  },
  {
    "id": 514,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Kapolri diangkat dan diberhentikan Presiden dengan persetujuan siapa?",
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
      },
      {
        "key": "E",
        "text": "Menahan saksi untuk penyelidikan awal"
      }
    ],
    "correctKey": "A",
    "explanation": "UU Kepolisian mengatur persetujuan DPR untuk pengangkatan dan pemberhentian Kapolri.",
    "weight": 10
  },
  {
    "id": 515,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Fungsi kepolisian merupakan fungsi pemerintahan di bidang apa?",
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
      },
      {
        "key": "E",
        "text": "Melakukan penyadapan tanpa izin pengadilan"
      }
    ],
    "correctKey": "B",
    "explanation": "Rumusan fungsi kepolisian terdapat dalam Pasal 2 UU 2/2002.",
    "weight": 10
  },
  {
    "id": 516,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Polri sebagai Kepolisian Nasional berarti apa?",
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
      },
      {
        "key": "E",
        "text": "Menghentikan kasus atas dasar perdamaian sepihak"
      }
    ],
    "correctKey": "B",
    "explanation": "UU 2/2002 menyatakan Polri merupakan Kepolisian Nasional yang satu kesatuan.",
    "weight": 10
  },
  {
    "id": 517,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Pelaksanaan tugas Polri harus menjunjung tinggi apa?",
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
        "text": "Kepentingan kelompok"
      },
      {
        "key": "E",
        "text": "Menyerahkan tahanan kepada pihak keluarga"
      }
    ],
    "correctKey": "B",
    "explanation": "Penghormatan HAM merupakan prinsip penting dalam pelaksanaan tugas.",
    "weight": 10
  },
  {
    "id": 518,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Contoh tugas preventif kepolisian adalah?",
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
      },
      {
        "key": "E",
        "text": "Mengumumkan identitas korban kejahatan asusila"
      }
    ],
    "correctKey": "A",
    "explanation": "Patroli bertujuan mencegah gangguan keamanan dan ketertiban.",
    "weight": 10
  },
  {
    "id": 519,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Contoh tindakan represif dalam penegakan hukum adalah?",
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
      },
      {
        "key": "E",
        "text": "Menerima hadiah tanda terima kasih dari korban"
      }
    ],
    "correctKey": "A",
    "explanation": "Penyidikan merupakan tindakan penegakan hukum atas dugaan tindak pidana.",
    "weight": 10
  },
  {
    "id": 520,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Pelayanan publik Polri seharusnya seperti apa?",
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
        "text": "Menolak kelompok rentan"
      },
      {
        "key": "E",
        "text": "Menyalahgunakan senjata api untuk intimidasi"
      }
    ],
    "correctKey": "B",
    "explanation": "Pelayanan harus profesional, transparan, dan nondiskriminatif.",
    "weight": 10
  },
  {
    "id": 521,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Salah satu kewenangan umum Polri menurut UU 2/2002 adalah?",
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
      },
      {
        "key": "E",
        "text": "Mengabaikan panggilan gelar perkara"
      }
    ],
    "correctKey": "A",
    "explanation": "Pasal 15 UU 2/2002 mencantumkan kewenangan menerima laporan/pengaduan.",
    "weight": 10
  },
  {
    "id": 522,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Tindakan pertama di TKP bertujuan antara lain untuk apa?",
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
      },
      {
        "key": "E",
        "text": "Mengubah isi berita acara pemeriksaan (BAP)"
      }
    ],
    "correctKey": "B",
    "explanation": "Pengamanan TKP mencegah kontaminasi dan menjaga integritas barang bukti.",
    "weight": 10
  },
  {
    "id": 523,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Prinsip legalitas dalam tindakan kepolisian berarti apa?",
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
      },
      {
        "key": "E",
        "text": "Menolak perintah atasan yang sah sesuai aturan"
      }
    ],
    "correctKey": "A",
    "explanation": "Tindakan harus sesuai kewenangan, prosedur, dan peraturan.",
    "weight": 10
  },
  {
    "id": 524,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Prinsip nesesitas dalam penggunaan kekuatan menghendaki apa?",
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
      },
      {
        "key": "E",
        "text": "Memberikan keterangan pers tanpa koordinasi humas"
      }
    ],
    "correctKey": "B",
    "explanation": "Kekuatan hanya digunakan ketika benar-benar diperlukan, bukan untuk membalas.",
    "weight": 10
  },
  {
    "id": 525,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Prinsip proporsionalitas berarti apa?",
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
      },
      {
        "key": "E",
        "text": "Melakukan pungutan liar dalam pengurusan SIM"
      }
    ],
    "correctKey": "A",
    "explanation": "Respons harus sebanding dengan tingkat ancaman dan situasi.",
    "weight": 10
  },
  {
    "id": 526,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Akuntabilitas tindakan kepolisian menuntut apa?",
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
      },
      {
        "key": "E",
        "text": "Menahan barang bukti kendaraan di luar kantor"
      }
    ],
    "correctKey": "B",
    "explanation": "Akuntabilitas memerlukan alasan, prosedur, dokumentasi, dan pertanggungjawaban.",
    "weight": 10
  },
  {
    "id": 527,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Diskresi kepolisian seharusnya digunakan bagaimana?",
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
      },
      {
        "key": "E",
        "text": "Menghapus rekaman kamera pengawas (CCTV)"
      }
    ],
    "correctKey": "B",
    "explanation": "Diskresi bukan kewenangan tanpa batas dan harus dapat dipertanggungjawabkan.",
    "weight": 10
  },
  {
    "id": 528,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Saat menerima laporan masyarakat, petugas sebaiknya?",
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
      },
      {
        "key": "E",
        "text": "Menyebarkan rahasia operasi di media sosial"
      }
    ],
    "correctKey": "B",
    "explanation": "Penerimaan laporan memerlukan sikap profesional, empati, dan informasi yang benar.",
    "weight": 10
  },
  {
    "id": 529,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Jika konflik warga berpotensi meluas, langkah awal tepat adalah?",
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
        "text": "Pergi tanpa koordinasi"
      },
      {
        "key": "E",
        "text": "Membela pihak tertentu karena hubungan kerabat"
      }
    ],
    "correctKey": "B",
    "explanation": "Prioritas awal adalah keselamatan, deeskalasi, dan pencegahan eskalasi.",
    "weight": 10
  },
  {
    "id": 530,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Barang temuan yang diterima petugas harus bagaimana?",
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
      },
      {
        "key": "E",
        "text": "Menggunakan kendaraan dinas untuk urusan pribadi"
      }
    ],
    "correctKey": "B",
    "explanation": "Pencatatan dan pengamanan mencegah penyalahgunaan serta menjaga akuntabilitas.",
    "weight": 10
  },
  {
    "id": 531,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "KUHP nasional diatur dalam undang-undang nomor berapa?",
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
      },
      {
        "key": "E",
        "text": "Mengabaikan standar operasional prosedur patroli"
      }
    ],
    "correctKey": "A",
    "explanation": "UU 1/2023 merupakan Kitab Undang-Undang Hukum Pidana.",
    "weight": 10
  },
  {
    "id": 532,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "KUHP nasional mulai berlaku kapan?",
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
      },
      {
        "key": "E",
        "text": "Memperlakukan tahanan secara diskriminatif"
      }
    ],
    "correctKey": "B",
    "explanation": "UU 1/2023 mulai berlaku tiga tahun setelah diundangkan, yaitu 2 Januari 2026.",
    "weight": 10
  },
  {
    "id": 533,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Asas legalitas pidana secara umum mengandung prinsip apa?",
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
      },
      {
        "key": "E",
        "text": "Menunda penyerahan berkas perkara ke kejaksaan"
      }
    ],
    "correctKey": "A",
    "explanation": "Asas legalitas menjamin kepastian hukum dan melarang pemidanaan tanpa dasar hukum.",
    "weight": 10
  },
  {
    "id": 534,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Pertanggungjawaban pidana pada prinsipnya berkaitan dengan apa?",
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
      },
      {
        "key": "E",
        "text": "Membocorkan rencana razia kepada sasaran"
      }
    ],
    "correctKey": "A",
    "explanation": "Penilaian pertanggungjawaban mencakup unsur kesalahan dan kemampuan bertanggung jawab sesuai hukum.",
    "weight": 10
  },
  {
    "id": 535,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Perbedaan tindak pidana dan pelanggaran etik adalah?",
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
      },
      {
        "key": "E",
        "text": "Mengabaikan keselamatan masyarakat saat penindakan"
      }
    ],
    "correctKey": "B",
    "explanation": "Ranah pidana dan etik berbeda, walau satu perbuatan dapat menimbulkan konsekuensi keduanya.",
    "weight": 10
  },
  {
    "id": 536,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Pidana dijatuhkan oleh siapa?",
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
      },
      {
        "key": "E",
        "text": "Menggunakan kekerasan dalam interogasi saksi"
      }
    ],
    "correctKey": "B",
    "explanation": "Penyidik tidak menjatuhkan putusan pidana; kewenangan mengadili berada pada pengadilan.",
    "weight": 10
  },
  {
    "id": 537,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Tujuan pemidanaan modern dapat mencakup apa?",
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
      },
      {
        "key": "E",
        "text": "Menolak pendampingan penasihat hukum"
      }
    ],
    "correctKey": "B",
    "explanation": "Sistem pemidanaan memiliki beragam tujuan yang diterapkan menurut undang-undang.",
    "weight": 10
  },
  {
    "id": 538,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Percobaan melakukan tindak pidana pada umumnya berkaitan dengan apa?",
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
        "text": "Kesalahan administrasi"
      },
      {
        "key": "E",
        "text": "Menerima janji atau suap dari pihak berperkara"
      }
    ],
    "correctKey": "B",
    "explanation": "Percobaan mensyaratkan unsur tertentu, termasuk permulaan pelaksanaan menurut KUHP.",
    "weight": 10
  },
  {
    "id": 539,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Pembelaan terpaksa dalam hukum pidana dikenal dengan istilah apa?",
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
      },
      {
        "key": "E",
        "text": "Menutupi pelanggaran rekan kerja satu unit"
      }
    ],
    "correctKey": "A",
    "explanation": "Noodweer adalah pembelaan terpaksa terhadap serangan/ancaman melawan hukum dengan syarat hukum.",
    "weight": 10
  },
  {
    "id": 540,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Penerapan KUHP dalam perkara konkret harus memperhatikan apa?",
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
        "text": "Tekanan massa"
      },
      {
        "key": "E",
        "text": "Mengabaikan keluhan pelayanan pengaduan warga"
      }
    ],
    "correctKey": "B",
    "explanation": "Analisis pidana harus berbasis unsur hukum dan fakta yang dapat dibuktikan.",
    "weight": 10
  },
  {
    "id": 541,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "KUHAP yang berlaku sejak 2 Januari 2026 adalah?",
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
      },
      {
        "key": "E",
        "text": "Menggunakan fasilitas dinas tanpa izin pimpinan"
      }
    ],
    "correctKey": "B",
    "explanation": "UU 20/2025 menggantikan UU 8/1981 dan berlaku sejak 2 Januari 2026.",
    "weight": 10
  },
  {
    "id": 542,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Penyelidikan pada pokoknya bertujuan untuk apa?",
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
      },
      {
        "key": "E",
        "text": "Menolak kehadiran pihak pelapor dalam mediasi"
      }
    ],
    "correctKey": "A",
    "explanation": "Penyelidikan merupakan tahap awal mencari dan menemukan peristiwa yang diduga tindak pidana.",
    "weight": 10
  },
  {
    "id": 543,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Penyidikan pada pokoknya bertujuan untuk apa?",
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
      },
      {
        "key": "E",
        "text": "Menyita barang di luar daftar surat perintah penyitaan"
      }
    ],
    "correctKey": "A",
    "explanation": "Penyidikan berfokus pada pengumpulan bukti dan penentuan pihak yang diduga bertanggung jawab.",
    "weight": 10
  },
  {
    "id": 544,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Penyidik wajib bekerja berdasarkan apa?",
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
      },
      {
        "key": "E",
        "text": "Mengalihkan tanggung jawab piket tanpa serah terima"
      }
    ],
    "correctKey": "B",
    "explanation": "Kewenangan penyidik dibatasi hukum dan prosedur untuk melindungi hak semua pihak.",
    "weight": 10
  },
  {
    "id": 545,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "UU 20/2025 menekankan penguatan hak siapa?",
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
      },
      {
        "key": "E",
        "text": "Menunda pembuatan laporan polisi tindak pidana"
      }
    ],
    "correctKey": "A",
    "explanation": "Ringkasan resmi UU 20/2025 menekankan penguatan hak pihak-pihak tersebut.",
    "weight": 10
  },
  {
    "id": 546,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Praperadilan merupakan mekanisme apa?",
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
      },
      {
        "key": "E",
        "text": "Menyembunyikan informasi penting saat olah TKP"
      }
    ],
    "correctKey": "A",
    "explanation": "Praperadilan memberi kontrol pengadilan atas tindakan/proses yang ditentukan undang-undang.",
    "weight": 10
  },
  {
    "id": 547,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Barang bukti harus dikelola dengan prinsip apa?",
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
      },
      {
        "key": "E",
        "text": "Melakukan penangkapan tanpa menunjukkan identitas"
      }
    ],
    "correctKey": "B",
    "explanation": "Pengelolaan tertib menjaga keaslian dan nilai pembuktian barang bukti.",
    "weight": 10
  },
  {
    "id": 548,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Keterangan saksi yang baik dalam pembuktian adalah?",
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
      },
      {
        "key": "E",
        "text": "Mengabaikan asas praduga tak bersalah"
      }
    ],
    "correctKey": "A",
    "explanation": "Keterangan harus diperoleh secara sah dan dinilai sesuai ketentuan pembuktian.",
    "weight": 10
  },
  {
    "id": 549,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Hak atas bantuan hukum bertujuan untuk apa?",
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
        "text": "Menentukan hasil perkara"
      },
      {
        "key": "E",
        "text": "Mengintimidasi saksi agar mengubah keterangan"
      }
    ],
    "correctKey": "B",
    "explanation": "Bantuan hukum mendukung fair trial dan perlindungan hak.",
    "weight": 10
  },
  {
    "id": 550,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Keadilan restoratif menitikberatkan pada apa?",
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
      },
      {
        "key": "E",
        "text": "Menolak koordinasi antar-instansi penegak hukum"
      }
    ],
    "correctKey": "A",
    "explanation": "KUHAP baru mengatur mekanisme keadilan restoratif sebagai salah satu pembaruan.",
    "weight": 10
  },
  {
    "id": 551,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Perpol yang mengatur Kode Etik Profesi dan Komisi Kode Etik Polri adalah?",
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
      },
      {
        "key": "E",
        "text": "Mempercepat perkara karena adanya imbalan"
      }
    ],
    "correctKey": "A",
    "explanation": "Perpol 7/2022 mengatur Kode Etik Profesi dan Komisi Kode Etik Polri.",
    "weight": 10
  },
  {
    "id": 552,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Peraturan disiplin anggota Polri diatur dalam?",
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
      },
      {
        "key": "E",
        "text": "Mengabaikan barang bukti digital yang rentan hilang"
      }
    ],
    "correctKey": "A",
    "explanation": "PP 2/2003 mengatur Peraturan Disiplin Anggota Polri.",
    "weight": 10
  },
  {
    "id": 553,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Kode etik profesi terutama berfungsi sebagai apa?",
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
      },
      {
        "key": "E",
        "text": "Menolak perlindungan kepada saksi kunci"
      }
    ],
    "correctKey": "A",
    "explanation": "Kode etik menjadi pedoman profesional dalam tugas dan kehidupan anggota.",
    "weight": 10
  },
  {
    "id": 554,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Integritas dalam tugas kepolisian tercermin dari apa?",
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
      },
      {
        "key": "E",
        "text": "Membuat keputusan berdasarkan opini pribadi"
      }
    ],
    "correctKey": "B",
    "explanation": "Integritas menuntut kejujuran dan penggunaan kewenangan secara benar.",
    "weight": 10
  },
  {
    "id": 555,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Konflik kepentingan terjadi ketika apa?",
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
      },
      {
        "key": "E",
        "text": "Menghalangi tersangka menghubungi keluarga"
      }
    ],
    "correctKey": "A",
    "explanation": "Konflik kepentingan harus diungkap dan dikelola agar keputusan objektif.",
    "weight": 10
  },
  {
    "id": 556,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Jika mengetahui rekan meminta imbalan ilegal, tindakan profesional adalah?",
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
      },
      {
        "key": "E",
        "text": "Mengabaikan hak asasi tahanan yang sakit"
      }
    ],
    "correctKey": "C",
    "explanation": "Penyimpangan ditangani melalui saluran pelaporan dan pengawasan.",
    "weight": 10
  },
  {
    "id": 557,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Praduga tak bersalah berarti apa?",
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
      },
      {
        "key": "E",
        "text": "Melakukan razia tanpa dilengkapi surat perintah tugas"
      }
    ],
    "correctKey": "B",
    "explanation": "Prinsip ini melindungi martabat dan hak orang yang berhadapan dengan proses pidana.",
    "weight": 10
  },
  {
    "id": 558,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Perlakuan terhadap tahanan harus bagaimana?",
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
        "text": "Dipertontonkan"
      },
      {
        "key": "E",
        "text": "Menyimpan barang bukti narkotika di tempat pribadi"
      }
    ],
    "correctKey": "A",
    "explanation": "Orang yang ditahan tetap memiliki hak dan martabat yang wajib dihormati.",
    "weight": 10
  },
  {
    "id": 559,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Penyiksaan untuk memperoleh pengakuan adalah?",
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
      },
      {
        "key": "E",
        "text": "Mengabaikan rantai komando saat situasi darurat"
      }
    ],
    "correctKey": "B",
    "explanation": "Pengakuan tidak boleh diperoleh melalui penyiksaan atau perlakuan melanggar hukum.",
    "weight": 10
  },
  {
    "id": 560,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Netralitas anggota Polri dalam politik praktis menuntut apa?",
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
        "text": "Kampanye dengan fasilitas dinas"
      },
      {
        "key": "E",
        "text": "Menyerahkan dokumen rahasia kepada pihak ketiga"
      }
    ],
    "correctKey": "B",
    "explanation": "Netralitas menjaga profesionalitas dan kepercayaan publik.",
    "weight": 10
  },
  {
    "id": 561,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Fungsi utama lalu lintas berkaitan dengan apa?",
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
      },
      {
        "key": "E",
        "text": "Mengabaikan etika komunikasi di ruang publik"
      }
    ],
    "correctKey": "A",
    "explanation": "Fungsi lalu lintas mengelola keamanan, keselamatan, ketertiban, kelancaran lalu lintas.",
    "weight": 10
  },
  {
    "id": 562,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Contoh kegiatan preventif Satlantas adalah?",
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
      },
      {
        "key": "E",
        "text": "Menyebarkan informasi hoax di lingkungan kedinasan"
      }
    ],
    "correctKey": "A",
    "explanation": "Dikmas lantas dan pengaturan mencegah kecelakaan serta pelanggaran.",
    "weight": 10
  },
  {
    "id": 563,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Fungsi Reserse terutama berhubungan dengan apa?",
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
      },
      {
        "key": "E",
        "text": "Menolak penugasan operasi pengamanan wilayah"
      }
    ],
    "correctKey": "A",
    "explanation": "Reserse menjalankan fungsi penegakan hukum melalui penyelidikan/penyidikan.",
    "weight": 10
  },
  {
    "id": 564,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Fungsi Intelkam mendukung tugas melalui apa?",
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
      },
      {
        "key": "E",
        "text": "Menggunakan seragam dinas tidak sesuai regulasi"
      }
    ],
    "correctKey": "A",
    "explanation": "Intelkam membantu deteksi dini, peringatan dini, dan pengambilan keputusan.",
    "weight": 10
  },
  {
    "id": 565,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Fungsi Samapta antara lain melaksanakan apa?",
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
      },
      {
        "key": "E",
        "text": "Membawa senjata api dinas ke tempat hiburan malam"
      }
    ],
    "correctKey": "A",
    "explanation": "Samapta menjalankan tugas preventif dan pemeliharaan keamanan.",
    "weight": 10
  },
  {
    "id": 566,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Fungsi Binmas menitikberatkan pada apa?",
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
      },
      {
        "key": "E",
        "text": "Mengabaikan instruksi kapolsek dalam apel pagi"
      }
    ],
    "correctKey": "A",
    "explanation": "Binmas membangun partisipasi dan kemitraan masyarakat dalam menjaga kamtibmas.",
    "weight": 10
  },
  {
    "id": 567,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Identifikasi kepolisian membantu apa?",
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
      },
      {
        "key": "E",
        "text": "Menolak menandatangani pakta integritas dinas"
      }
    ],
    "correctKey": "A",
    "explanation": "Identifikasi mendukung pengenalan identitas untuk kepentingan tugas.",
    "weight": 10
  },
  {
    "id": 568,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Laboratorium forensik berperan dalam apa?",
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
      },
      {
        "key": "E",
        "text": "Mengurangi jatah ransum dinas personel piket"
      }
    ],
    "correctKey": "A",
    "explanation": "Labfor membantu pemeriksaan ilmiah untuk mendukung pembuktian.",
    "weight": 10
  },
  {
    "id": 569,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Kedokteran kepolisian dapat mendukung apa?",
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
        "text": "Penerbitan SIM"
      },
      {
        "key": "E",
        "text": "Memalsukan tanda tangan pimpinan pada disposisi"
      }
    ],
    "correctKey": "A",
    "explanation": "Dokpol memberi dukungan medis dan forensik dalam tugas kepolisian.",
    "weight": 10
  },
  {
    "id": 570,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Kemitraan polisi-masyarakat bertujuan apa?",
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
      },
      {
        "key": "E",
        "text": "Menghilangkan dokumen rekam jejak personel"
      }
    ],
    "correctKey": "A",
    "explanation": "Pemolisian masyarakat mendorong kolaborasi, kepercayaan, dan pencegahan.",
    "weight": 10
  },
  {
    "id": 571,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Kepemimpinan berintegritas ditunjukkan dengan apa?",
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
      },
      {
        "key": "E",
        "text": "Mengintervensi penyidik unit lain secara sepihak"
      }
    ],
    "correctKey": "A",
    "explanation": "Pemimpin berintegritas memberi contoh, adil, dan bertanggung jawab.",
    "weight": 10
  },
  {
    "id": 572,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Delegasi tugas yang baik harus disertai apa?",
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
      },
      {
        "key": "E",
        "text": "Menolak mediasi restorative justice yang memenuhi syarat"
      }
    ],
    "correctKey": "A",
    "explanation": "Delegasi efektif jelas dan disertai pengendalian serta akuntabilitas.",
    "weight": 10
  },
  {
    "id": 573,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Saat menerima informasi belum terverifikasi, pimpinan sebaiknya?",
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
      },
      {
        "key": "E",
        "text": "Menunda pelaksanaan eksekusi putusan pengadilan"
      }
    ],
    "correctKey": "B",
    "explanation": "Keputusan yang baik memerlukan data valid dan verifikasi.",
    "weight": 10
  },
  {
    "id": 574,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Dalam situasi darurat, prioritas pertama petugas adalah?",
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
      },
      {
        "key": "E",
        "text": "Mengabaikan laporan warga terkait peredaran miras"
      }
    ],
    "correctKey": "A",
    "explanation": "Keselamatan manusia merupakan prioritas utama respons darurat.",
    "weight": 10
  },
  {
    "id": 575,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Pelayanan berorientasi masyarakat berarti?",
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
      },
      {
        "key": "E",
        "text": "Menjadikan pos lantas sebagai tempat komersial"
      }
    ],
    "correctKey": "A",
    "explanation": "Pelayanan publik berkualitas memenuhi kebutuhan masyarakat dalam koridor hukum.",
    "weight": 10
  },
  {
    "id": 576,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Pengawasan melekat atasan bertujuan apa?",
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
      },
      {
        "key": "E",
        "text": "Menggunakan rotator dan sirine saat bukan tugas darurat"
      }
    ],
    "correctKey": "A",
    "explanation": "Pengawasan memastikan kepatuhan, kualitas, dan perbaikan kinerja.",
    "weight": 10
  },
  {
    "id": 577,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Evaluasi setelah operasi berguna untuk apa?",
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
      },
      {
        "key": "E",
        "text": "Mengabaikan keamanan kantor komando polsek"
      }
    ],
    "correctKey": "A",
    "explanation": "Evaluasi menjadi dasar pembelajaran dan peningkatan kinerja.",
    "weight": 10
  },
  {
    "id": 578,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Dalam konflik internal tim, pemimpin sebaiknya?",
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
        "text": "Menyebarkan isu"
      },
      {
        "key": "E",
        "text": "Menolak laporan orang hilang sebelum 1x24 jam"
      }
    ],
    "correctKey": "A",
    "explanation": "Penyelesaian adil memerlukan komunikasi, fakta, dan prosedur.",
    "weight": 10
  },
  {
    "id": 579,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Indikator pelayanan baik antara lain?",
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
      },
      {
        "key": "E",
        "text": "Meminta biaya administrasi penerbitan SKCK ilegal"
      }
    ],
    "correctKey": "A",
    "explanation": "Mutu layanan dinilai dari standar, kepastian, akuntabilitas, pengalaman pengguna.",
    "weight": 10
  },
  {
    "id": 580,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Perwira menerima kritik valid dari anggota. Sikap terbaik?",
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
        "text": "Menghapus bukti"
      },
      {
        "key": "E",
        "text": "Menolak pengamanan unjuk rasa damai warga"
      }
    ],
    "correctKey": "B",
    "explanation": "Pemimpin terbuka menerima masukan relevan untuk perbaikan.",
    "weight": 10
  },
  {
    "id": 581,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Rekan memakai kendaraan dinas untuk kepentingan pribadi yang dilarang. Respons?",
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
      },
      {
        "key": "E",
        "text": "Mengambil gambar korban kekerasan untuk konsumsi pribadi"
      }
    ],
    "correctKey": "B",
    "explanation": "Penyimpangan ditangani proporsional melalui mekanisme sah.",
    "weight": 10
  },
  {
    "id": 582,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Di TKP kecelakaan, kerumunan menghalangi ambulans. Prioritas?",
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
      },
      {
        "key": "E",
        "text": "Membocorkan materi ujian seleksi dinas internal"
      }
    ],
    "correctKey": "B",
    "explanation": "Pertolongan korban dan akses darurat harus diprioritaskan.",
    "weight": 10
  },
  {
    "id": 583,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Pelapor meminta kepastian terlapor langsung ditahan. Petugas sebaiknya?",
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
      },
      {
        "key": "E",
        "text": "Menolak tes urin berkala pencegahan narkoba"
      }
    ],
    "correctKey": "B",
    "explanation": "Petugas tidak boleh menjanjikan tindakan paksa sebelum syarat hukum terpenuhi.",
    "weight": 10
  },
  {
    "id": 584,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Atasan meminta bawahan mengubah fakta laporan. Bawahan sebaiknya?",
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
      },
      {
        "key": "E",
        "text": "Melakukan transaksi mencurigakan di rekening dinas"
      }
    ],
    "correctKey": "B",
    "explanation": "Akurasi laporan merupakan bagian integritas dan akuntabilitas.",
    "weight": 10
  },
  {
    "id": 585,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Informasi intelijen berbeda dengan temuan lapangan. Langkah tepat?",
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
      },
      {
        "key": "E",
        "text": "Mengabaikan panggilan komisi kode etik polri"
      }
    ],
    "correctKey": "B",
    "explanation": "Keputusan operasional harus adaptif dan berbasis verifikasi.",
    "weight": 10
  },
  {
    "id": 586,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Korban takut memberi keterangan. Petugas sebaiknya?",
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
      },
      {
        "key": "E",
        "text": "Menutupi status tersangka seorang pejabat daerah"
      }
    ],
    "correctKey": "B",
    "explanation": "Pendekatan berperspektif korban membantu keterangan tanpa tekanan.",
    "weight": 10
  },
  {
    "id": 587,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Saat menerima pengaduan diskriminasi, petugas harus?",
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
      },
      {
        "key": "E",
        "text": "Mengabaikan protokol kesehatan saat penanganan massa"
      }
    ],
    "correctKey": "B",
    "explanation": "Prinsip nondiskriminasi dan pelayanan setara berlaku bagi semua.",
    "weight": 10
  },
  {
    "id": 588,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Jika terjadi kesalahan prosedur, langkah tepat?",
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
      },
      {
        "key": "E",
        "text": "Menghalangi wartawan meliput kegiatan humas resmi"
      }
    ],
    "correctKey": "B",
    "explanation": "Transparansi dan tindakan korektif mencegah kerugian lebih lanjut.",
    "weight": 10
  },
  {
    "id": 589,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Saat tekanan massa meningkat, komandan lapangan harus?",
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
        "text": "Biarkan anggota sendiri"
      },
      {
        "key": "E",
        "text": "Menolak supervisi dari inspektorat pengawasan daerah"
      }
    ],
    "correctKey": "A",
    "explanation": "Komando jelas dan deeskalasi mengurangi risiko salah tindakan.",
    "weight": 10
  },
  {
    "id": 590,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Keputusan tepat ketika data belum cukup adalah?",
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
      },
      {
        "key": "E",
        "text": "Mengabaikan perawatan berkala kendaraan dinas"
      }
    ],
    "correctKey": "B",
    "explanation": "Keputusan profesional mengakui keterbatasan data dan menghindari kesimpulan prematur.",
    "weight": 10
  },
  {
    "id": 591,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Akronim PRESISI dikenal sebagai apa?",
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
      },
      {
        "key": "E",
        "text": "Menolak pembinaan rohani dan mental di satker"
      }
    ],
    "correctKey": "A",
    "explanation": "PRESISI merupakan singkatan Prediktif, Responsibilitas, dan Transparansi Berkeadilan.",
    "weight": 10
  },
  {
    "id": 592,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Pemolisian prediktif menekankan apa?",
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
      },
      {
        "key": "E",
        "text": "Melakukan pinjaman online ilegal mengatasnamakan dinas"
      }
    ],
    "correctKey": "A",
    "explanation": "Pendekatan prediktif memakai analisis untuk deteksi dan pencegahan.",
    "weight": 10
  },
  {
    "id": 593,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Transparansi berkeadilan berarti apa?",
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
      },
      {
        "key": "E",
        "text": "Mengancam pelapor agar mencabut laporannya"
      }
    ],
    "correctKey": "B",
    "explanation": "Transparansi seimbang dengan perlindungan data, proses hukum, dan kepentingan sah.",
    "weight": 10
  },
  {
    "id": 594,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Responsibilitas dalam pelayanan menekankan apa?",
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
      },
      {
        "key": "E",
        "text": "Menolak menyerahkan senjata dinas saat evaluasi"
      }
    ],
    "correctKey": "A",
    "explanation": "Responsibilitas berarti pelaksanaan tugas secara bertanggung jawab.",
    "weight": 10
  },
  {
    "id": 595,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Kepercayaan publik terhadap Polri dibangun melalui apa?",
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
      },
      {
        "key": "E",
        "text": "Menyimpan amunisi dinas melebihi batas ketentuan"
      }
    ],
    "correctKey": "A",
    "explanation": "Kepercayaan tumbuh dari pengalaman nyata masyarakat atas layanan dan penegakan hukum.",
    "weight": 10
  },
  {
    "id": 596,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Koordinasi lintas instansi diperlukan karena apa?",
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
      },
      {
        "key": "E",
        "text": "Mengabaikan laporan kekerasan dalam rumah tangga (KDRT)"
      }
    ],
    "correctKey": "A",
    "explanation": "Koordinasi mencegah tumpang tindih dan meningkatkan efektivitas.",
    "weight": 10
  },
  {
    "id": 597,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Dalam penggunaan media sosial anggota perlu menjaga apa?",
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
      },
      {
        "key": "E",
        "text": "Membatalkan penilangan dengan kompensasi uang"
      }
    ],
    "correctKey": "B",
    "explanation": "Media sosial harus digunakan bertanggung jawab dan tidak melanggar aturan/privasi.",
    "weight": 10
  },
  {
    "id": 598,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Data pribadi korban/saksi sebaiknya bagaimana?",
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
        "text": "Dipakai pribadi"
      },
      {
        "key": "E",
        "text": "Menyembunyikan buronan DPO di kediaman pribadi"
      }
    ],
    "correctKey": "B",
    "explanation": "Perlindungan data dan privasi bagian dari penghormatan hak.",
    "weight": 10
  },
  {
    "id": 599,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Profesionalisme anggota menuntut kompetensi yang bagaimana?",
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
      },
      {
        "key": "E",
        "text": "Mengabaikan instruksi pengamanan TPS saat pemilu"
      }
    ],
    "correctKey": "A",
    "explanation": "Kompetensi harus terus dikembangkan agar sesuai tantangan dan hukum terbaru.",
    "weight": 10
  },
  {
    "id": 600,
    "module": "Tes Pengetahuan Kepolisian (TPK)",
    "subtest": "TPK",
    "stem": "Sikap yang mencerminkan pelindung, pengayom, pelayan masyarakat adalah?",
    "options": [
      {
        "key": "A",
        "text": "Menakut-nakuti"
      },
      {
        "key": "B",
        "text": "Hadir, mendengar, melindungi hak, bertindak adil sesuai hukum"
      },
      {
        "key": "C",
        "text": "Menghindari kelompok rentan"
      },
      {
        "key": "D",
        "text": "Kepentingan pribadi"
      },
      {
        "key": "E",
        "text": "Menolak melayani masyarakat dengan sikap humanis"
      }
    ],
    "correctKey": "B",
    "explanation": "Esensi peran Polri ialah melindungi, mengayomi, melayani secara profesional dan adil.",
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
    subtitle: '100 Soal • 90 Menit • Figural Bergambar, Denah Peta, Deret Angka, Aritmatika & Logika',
    description:
      '100 butir soal kecerdasan standar seleksi Polri mencakup penalaran figural bergambar, orientasi denah tata letak wilayah tugas, deret angka pola bertingkat, aritmatika taktis, analogi verbal, dan silogisme penyidikan.',
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
