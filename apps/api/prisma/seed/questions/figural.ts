import {
  compassOf,
  countOfShapes,
  correctOptionVariant,
  figureAltText,
  renderFigure,
  rotationStepDegrees,
  STEM_VARIANT,
  type CompassDirection,
  type FigureFamily,
  type FigureSpec,
} from '../media/figural';
import { createRng, shuffle } from './rng';
import type { SeedDifficulty, SeedQuestionMedia } from './types';

/**
 * Soal figural (F3-23/F3-24).
 *
 * Setiap baris hanya menyebut **spesifikasi gambar** (keluarga + seed), bukan
 * berkas. Dari spesifikasi yang sama diturunkan:
 *   - gambar stem & 4 gambar pilihan (`figureAssets`),
 *   - label opsi yang benar (`correctOptionVariant`),
 *   - teks alternatif (`figureAltText`).
 *
 * Akibatnya kunci jawaban tidak bisa bertentangan dengan gambar: keduanya
 * dihitung dari geometri yang sama.
 */

export interface FiguralSeed {
  /** Kode publik unik. */
  code: string;
  family: FigureFamily;
  /** Angka pembeda variasi di dalam keluarga; menentukan gambar & kunci. */
  seed: number;
  type: 'IMAGE_CHOICE' | 'SINGLE_CHOICE';
  difficulty: SeedDifficulty;
  stem: string;
  explanation: string;
  tags: readonly string[];
}

export interface FigureAssetRef {
  code: string;
  spec: FigureSpec;
  /** `STEM_VARIANT` atau 0..3 (label A..D). */
  variant: number;
  alt: string;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

/* ------------------------------------------------------------- Kecerdasan */

const KEC_IMAGE: ReadonlyArray<Omit<FiguralSeed, 'type'>> = [
  {
    code: 'PSI-KEC-FIG-001',
    family: 'series',
    seed: 0,
    difficulty: 'EASY',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Perhatikan deret bentuk berikut. Bentuk manakah yang melanjutkan pola?',
    explanation: 'Jumlah bentuk bertambah satu setiap baris (1, 2, 3), jadi baris berikutnya berisi 4 bentuk.',
    tags: ['figural', 'pola'],
  },
  {
    code: 'PSI-KEC-FIG-002',
    family: 'series',
    seed: 1,
    difficulty: 'EASY',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Deret berikut bertambah teratur. Lanjutan pola yang tepat adalah ...',
    explanation: 'Banyaknya bentuk naik satu per baris; lanjutan yang benar memuat 4 bentuk.',
    tags: ['figural', 'pola'],
  },
  {
    code: 'PSI-KEC-FIG-003',
    family: 'series',
    seed: 2,
    difficulty: 'EASY',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Tentukan bentuk yang tepat untuk melanjutkan pola baris berikut.',
    explanation: 'Pola jumlah 1–2–3 berlanjut menjadi 4 bentuk pada baris keempat.',
    tags: ['figural', 'pola'],
  },
  {
    code: 'PSI-KEC-FIG-004',
    family: 'series',
    seed: 3,
    difficulty: 'EASY',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Baris bentuk di bawah ini mengikuti satu aturan. Pilih lanjutan yang sesuai.',
    explanation: 'Aturannya adalah penambahan satu bentuk per baris, sehingga lanjutan berisi 4 bentuk.',
    tags: ['figural', 'pola'],
  },
  {
    code: 'PSI-KEC-FIG-005',
    family: 'series',
    seed: 4,
    difficulty: 'MEDIUM',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Amati perubahan jumlah bentuk pada setiap baris, lalu pilih gambar lanjutan.',
    explanation: 'Jumlah bentuk membentuk deret aritmetika 1, 2, 3 sehingga baris berikutnya 4 bentuk.',
    tags: ['figural', 'pola'],
  },
  {
    code: 'PSI-KEC-FIG-006',
    family: 'series',
    seed: 5,
    difficulty: 'MEDIUM',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Pola deret bentuk manakah yang benar untuk gambar selanjutnya?',
    explanation: 'Setiap baris menambah satu bentuk; pilihan dengan 4 bentuk adalah jawabannya.',
    tags: ['figural', 'pola'],
  },
  {
    code: 'PSI-KEC-FIG-007',
    family: 'series',
    seed: 6,
    difficulty: 'MEDIUM',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Deret bentuk ini memiliki aturan tetap. Gambar manakah yang melengkapi deret?',
    explanation: 'Deret jumlah 1, 2, 3 dilanjutkan 4 bentuk.',
    tags: ['figural', 'pola'],
  },
  {
    code: 'PSI-KEC-FIG-008',
    family: 'series',
    seed: 7,
    difficulty: 'MEDIUM',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Lanjutkan pola bentuk berikut dengan memilih satu gambar yang tepat.',
    explanation: 'Baris keempat harus memuat empat bentuk agar pola penambahan satu tetap berjalan.',
    tags: ['figural', 'pola'],
  },
  {
    code: 'PSI-KEC-FIG-009',
    family: 'series',
    seed: 8,
    difficulty: 'HARD',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Perhatikan irama jumlah bentuk pada tiap baris. Pilih gambar lanjutan yang benar.',
    explanation: 'Irama jumlah bentuk naik satu tiap baris, sehingga lanjutan berisi 4 bentuk.',
    tags: ['figural', 'pola'],
  },
  {
    code: 'PSI-KEC-FIG-010',
    family: 'series',
    seed: 9,
    difficulty: 'HARD',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Deret gambar berikut mengikuti pola jumlah. Tentukan gambar selanjutnya.',
    explanation: 'Jumlah bentuk per baris 1, 2, 3, lalu 4. Pilihan dengan empat bentuk benar.',
    tags: ['figural', 'pola'],
  },

  {
    code: 'PSI-KEC-FIG-011',
    family: 'rotation',
    seed: 0,
    difficulty: 'EASY',
    stem: 'Pada pengujian persepsi spasial dan orientasi objek dua dimensi, sebuah bangun geometri mengalami perputaran (rotasi) dengan besaran sudut dan arah putar yang konsisten pada setiap langkah. Peserta dituntut menganalisis perubahan posisi sudut elemen penanda secara presisi untuk menentukan posisi akhir objek. Bentuk L diputar dengan sudut tetap. Pilih gambar hasil putaran berikutnya.',
    explanation: 'Putaran bertambah 90° searah jarum jam setiap langkah, jadi hasil berikutnya adalah 180° dari posisi awal.',
    tags: ['figural', 'rotasi'],
  },
  {
    code: 'PSI-KEC-FIG-012',
    family: 'rotation',
    seed: 1,
    difficulty: 'MEDIUM',
    stem: 'Pada pengujian persepsi spasial dan orientasi objek dua dimensi, sebuah bangun geometri mengalami perputaran (rotasi) dengan besaran sudut dan arah putar yang konsisten pada setiap langkah. Peserta dituntut menganalisis perubahan posisi sudut elemen penanda secara presisi untuk menentukan posisi akhir objek. Perhatikan arah putaran bentuk berikut, lalu tentukan lanjutannya.',
    explanation: 'Langkah putar 45° searah jarum jam berlanjut menjadi 90° dari posisi awal.',
    tags: ['figural', 'rotasi'],
  },
  {
    code: 'PSI-KEC-FIG-013',
    family: 'rotation',
    seed: 2,
    difficulty: 'MEDIUM',
    stem: 'Pada pengujian persepsi spasial dan orientasi objek dua dimensi, sebuah bangun geometri mengalami perputaran (rotasi) dengan besaran sudut dan arah putar yang konsisten pada setiap langkah. Peserta dituntut menganalisis perubahan posisi sudut elemen penanda secara presisi untuk menentukan posisi akhir objek. Bentuk pada gambar diputar secara beraturan. Gambar manakah lanjutannya?',
    explanation: 'Langkah putar 135° berlanjut menjadi 270° dari posisi awal.',
    tags: ['figural', 'rotasi'],
  },
  {
    code: 'PSI-KEC-FIG-014',
    family: 'rotation',
    seed: 3,
    difficulty: 'MEDIUM',
    stem: 'Pada pengujian persepsi spasial dan orientasi objek dua dimensi, sebuah bangun geometri mengalami perputaran (rotasi) dengan besaran sudut dan arah putar yang konsisten pada setiap langkah. Peserta dituntut menganalisis perubahan posisi sudut elemen penanda secara presisi untuk menentukan posisi akhir objek. Tentukan hasil putaran berikutnya pada deret bentuk L di bawah ini.',
    explanation: 'Sudut putar tetap 90°, sehingga gambar berikutnya berada pada 180° dari posisi awal.',
    tags: ['figural', 'rotasi'],
  },
  {
    code: 'PSI-KEC-FIG-015',
    family: 'rotation',
    seed: 4,
    difficulty: 'HARD',
    stem: 'Pada pengujian persepsi spasial dan orientasi objek dua dimensi, sebuah bangun geometri mengalami perputaran (rotasi) dengan besaran sudut dan arah putar yang konsisten pada setiap langkah. Peserta dituntut menganalisis perubahan posisi sudut elemen penanda secara presisi untuk menentukan posisi akhir objek. Amati arah putaran bentuk. Pilih gambar yang melanjutkan deret dengan benar.',
    explanation: 'Putaran berlangsung 90° berlawanan arah jarum jam; langkah kedua menjadi 180° dari posisi awal.',
    tags: ['figural', 'rotasi'],
  },
  {
    code: 'PSI-KEC-FIG-016',
    family: 'rotation',
    seed: 5,
    difficulty: 'HARD',
    stem: 'Pada pengujian persepsi spasial dan orientasi objek dua dimensi, sebuah bangun geometri mengalami perputaran (rotasi) dengan besaran sudut dan arah putar yang konsisten pada setiap langkah. Peserta dituntut menganalisis perubahan posisi sudut elemen penanda secara presisi untuk menentukan posisi akhir objek. Deret bentuk L berikut berputar teratur. Lanjutan yang tepat adalah ...',
    explanation: 'Langkah putar 45° berlawanan arah jarum jam berlanjut menjadi 90° dari posisi awal.',
    tags: ['figural', 'rotasi'],
  },
  {
    code: 'PSI-KEC-FIG-017',
    family: 'rotation',
    seed: 6,
    difficulty: 'HARD',
    stem: 'Pada pengujian persepsi spasial dan orientasi objek dua dimensi, sebuah bangun geometri mengalami perputaran (rotasi) dengan besaran sudut dan arah putar yang konsisten pada setiap langkah. Peserta dituntut menganalisis perubahan posisi sudut elemen penanda secara presisi untuk menentukan posisi akhir objek. Pilih gambar yang tepat untuk melanjutkan rotasi bentuk di bawah.',
    explanation: 'Putaran 135° berlawanan arah jarum jam berlanjut menjadi 270° dari posisi awal.',
    tags: ['figural', 'rotasi'],
  },
  {
    code: 'PSI-KEC-FIG-018',
    family: 'rotation',
    seed: 7,
    difficulty: 'HARD',
    stem: 'Pada pengujian persepsi spasial dan orientasi objek dua dimensi, sebuah bangun geometri mengalami perputaran (rotasi) dengan besaran sudut dan arah putar yang konsisten pada setiap langkah. Peserta dituntut menganalisis perubahan posisi sudut elemen penanda secara presisi untuk menentukan posisi akhir objek. Bentuk L diputar dengan besar sudut yang sama setiap langkah. Tentukan gambar keempat.',
    explanation: 'Rotasi 90° berlawanan arah jarum jam; langkah kedua sama dengan 180° dari posisi awal.',
    tags: ['figural', 'rotasi'],
  },

  {
    code: 'PSI-KEC-FIG-019',
    family: 'mirror',
    seed: 0,
    difficulty: 'MEDIUM',
    stem: 'Dalam pemeriksaan simetri visual dan pembalikan citra optik, suatu komposisi bentuk geometri dicerminkan terhadap sumbu refleksi tertentu sehingga menghasilkan bayangan yang berkebalikan arah secara proporsional. Ketelitian mengamati posisi setiap detail bentuk terhadap garis cermin sangat menentukan ketepatan identifikasi bayangan. Gambar manakah yang merupakan pencerminan bentuk terhadap garis putus-putus?',
    explanation: 'Pencerminan terhadap garis mendatar membalik posisi atas–bawah tanpa mengubah kiri–kanan.',
    tags: ['figural', 'pencerminan'],
  },
  {
    code: 'PSI-KEC-FIG-020',
    family: 'mirror',
    seed: 1,
    difficulty: 'MEDIUM',
    stem: 'Dalam pemeriksaan simetri visual dan pembalikan citra optik, suatu komposisi bentuk geometri dicerminkan terhadap sumbu refleksi tertentu sehingga menghasilkan bayangan yang berkebalikan arah secara proporsional. Ketelitian mengamati posisi setiap detail bentuk terhadap garis cermin sangat menentukan ketepatan identifikasi bayangan. Pilih hasil pencerminan yang benar terhadap sumbu mendatar pada gambar.',
    explanation: 'Hasil cermin terhadap sumbu mendatar adalah bayangan terbalik atas–bawah.',
    tags: ['figural', 'pencerminan'],
  },
  {
    code: 'PSI-KEC-FIG-021',
    family: 'mirror',
    seed: 2,
    difficulty: 'MEDIUM',
    stem: 'Dalam pemeriksaan simetri visual dan pembalikan citra optik, suatu komposisi bentuk geometri dicerminkan terhadap sumbu refleksi tertentu sehingga menghasilkan bayangan yang berkebalikan arah secara proporsional. Ketelitian mengamati posisi setiap detail bentuk terhadap garis cermin sangat menentukan ketepatan identifikasi bayangan. Bentuk di bawah dicerminkan pada garis putus-putus. Hasilnya adalah ...',
    explanation: 'Bayangan cermin mendatar mempertahankan susunan kiri–kanan dan membalik arah tegak.',
    tags: ['figural', 'pencerminan'],
  },
  {
    code: 'PSI-KEC-FIG-022',
    family: 'mirror',
    seed: 3,
    difficulty: 'HARD',
    stem: 'Dalam pemeriksaan simetri visual dan pembalikan citra optik, suatu komposisi bentuk geometri dicerminkan terhadap sumbu refleksi tertentu sehingga menghasilkan bayangan yang berkebalikan arah secara proporsional. Ketelitian mengamati posisi setiap detail bentuk terhadap garis cermin sangat menentukan ketepatan identifikasi bayangan. Tentukan bayangan cermin bentuk berikut terhadap garis mendatar.',
    explanation: 'Pencerminan terhadap garis mendatar menghasilkan bayangan yang terbalik secara vertikal.',
    tags: ['figural', 'pencerminan'],
  },
  {
    code: 'PSI-KEC-FIG-023',
    family: 'mirror',
    seed: 4,
    difficulty: 'HARD',
    stem: 'Dalam pemeriksaan simetri visual dan pembalikan citra optik, suatu komposisi bentuk geometri dicerminkan terhadap sumbu refleksi tertentu sehingga menghasilkan bayangan yang berkebalikan arah secara proporsional. Ketelitian mengamati posisi setiap detail bentuk terhadap garis cermin sangat menentukan ketepatan identifikasi bayangan. Manakah bayangan yang tepat bila bentuk dicerminkan terhadap garis putus-putus?',
    explanation: 'Sumbu cermin mendatar membalik koordinat tegak; susunan mendatar tetap.',
    tags: ['figural', 'pencerminan'],
  },
  {
    code: 'PSI-KEC-FIG-024',
    family: 'mirror',
    seed: 5,
    difficulty: 'HARD',
    stem: 'Dalam pemeriksaan simetri visual dan pembalikan citra optik, suatu komposisi bentuk geometri dicerminkan terhadap sumbu refleksi tertentu sehingga menghasilkan bayangan yang berkebalikan arah secara proporsional. Ketelitian mengamati posisi setiap detail bentuk terhadap garis cermin sangat menentukan ketepatan identifikasi bayangan. Pilih gambar hasil pencerminan yang sesuai dengan sumbu pada gambar.',
    explanation: 'Bayangan cermin terhadap sumbu mendatar adalah hasil pembalikan arah vertikal.',
    tags: ['figural', 'pencerminan'],
  },

  {
    code: 'PSI-KEC-FIG-025',
    family: 'analogy',
    seed: 0,
    difficulty: 'MEDIUM',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Perhatikan hubungan pada baris pertama, lalu lengkapi baris kedua.',
    explanation: 'Aturannya: bentuk tetap, ukuran membesar. Jadi jawabannya bentuk yang sama dalam ukuran besar.',
    tags: ['figural', 'analogi'],
  },
  {
    code: 'PSI-KEC-FIG-026',
    family: 'analogy',
    seed: 1,
    difficulty: 'MEDIUM',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Jika pasangan pertama berhubungan seperti pada gambar, pasangan kedua adalah ...',
    explanation: 'Hubungannya adalah pembesaran ukuran tanpa perubahan bentuk.',
    tags: ['figural', 'analogi'],
  },
  {
    code: 'PSI-KEC-FIG-027',
    family: 'analogy',
    seed: 2,
    difficulty: 'MEDIUM',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Tentukan gambar yang melengkapi analogi figural berikut.',
    explanation: 'Bentuk dipertahankan, ukuran diperbesar. Pilihan dengan bentuk sama dan ukuran besar benar.',
    tags: ['figural', 'analogi'],
  },
  {
    code: 'PSI-KEC-FIG-028',
    family: 'analogy',
    seed: 3,
    difficulty: 'HARD',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Lengkapi analogi bentuk di bawah dengan aturan yang sama seperti contoh.',
    explanation: 'Aturan contoh: bentuk tetap dan ukuran membesar.',
    tags: ['figural', 'analogi'],
  },
  {
    code: 'PSI-KEC-FIG-029',
    family: 'analogy',
    seed: 4,
    difficulty: 'HARD',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Pilih gambar yang meneruskan hubungan bentuk pada contoh.',
    explanation: 'Ukuran membesar sedangkan bentuk tidak berubah.',
    tags: ['figural', 'analogi'],
  },
  {
    code: 'PSI-KEC-FIG-030',
    family: 'analogy',
    seed: 5,
    difficulty: 'HARD',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Analogi figural: tentukan pasangan yang tepat untuk tanda tanya.',
    explanation: 'Pasangan benar adalah bentuk yang sama dengan ukuran lebih besar.',
    tags: ['figural', 'analogi'],
  },

  {
    code: 'PSI-KEC-FIG-031',
    family: 'net',
    seed: 0,
    difficulty: 'HARD',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Sisi bertanda merah dilipat menjadi kubus. Sisi manakah yang berhadapan dengannya?',
    explanation: 'Pada jaring salib, sisi yang dipisahkan satu kotak pada baris yang sama saling berhadapan.',
    tags: ['figural', 'kubus'],
  },
  {
    code: 'PSI-KEC-FIG-032',
    family: 'net',
    seed: 1,
    difficulty: 'HARD',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Tentukan sisi yang berhadapan dengan sisi bertanda pada jaring-jaring kubus berikut.',
    explanation: 'Lipatan jaring membuat sisi berjarak satu kotak pada baris utama menjadi berhadapan.',
    tags: ['figural', 'kubus'],
  },
  {
    code: 'PSI-KEC-FIG-033',
    family: 'net',
    seed: 2,
    difficulty: 'HARD',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Jaring-jaring kubus di bawah dilipat. Pilih sisi yang berhadapan dengan tanda merah.',
    explanation: 'Sisi berhadapan ditentukan oleh posisi berlawanan pada jaring salib.',
    tags: ['figural', 'kubus'],
  },
  {
    code: 'PSI-KEC-FIG-034',
    family: 'net',
    seed: 3,
    difficulty: 'HARD',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Setelah dilipat, sisi bertanda merah berhadapan dengan sisi ...',
    explanation: 'Dua sisi yang berselang satu kotak pada deret jaring akan berhadapan.',
    tags: ['figural', 'kubus'],
  },
];

const KEC_TEXT_WITH_STEM: ReadonlyArray<Omit<FiguralSeed, 'type'>> = [
  {
    code: 'PSI-KEC-FIG-035',
    family: 'count',
    seed: 0,
    difficulty: 'EASY',
    stem: 'Dalam latihan ketelitian pengamatan visual cepat terhadap objek bertumpuk, petugas dihadapkan pada komposisi sejumlah bangun geometri yang tersebar di dalam bidang gambar. Anda harus menghitung secara sistematis dan cermat seluruh bangun penyusun tanpa ada yang terlewat maupun terhitung ganda. Berapa banyak bentuk pada gambar berikut?',
    explanation: 'Hitung satu per satu bentuk pada gambar; jumlahnya sesuai pilihan yang tersedia.',
    tags: ['figural', 'hitung'],
  },
  {
    code: 'PSI-KEC-FIG-036',
    family: 'count',
    seed: 1,
    difficulty: 'EASY',
    stem: 'Dalam latihan ketelitian pengamatan visual cepat terhadap objek bertumpuk, petugas dihadapkan pada komposisi sejumlah bangun geometri yang tersebar di dalam bidang gambar. Anda harus menghitung secara sistematis dan cermat seluruh bangun penyusun tanpa ada yang terlewat maupun terhitung ganda. Tentukan jumlah bentuk yang tampak pada gambar.',
    explanation: 'Hitung seluruh bentuk, termasuk yang berwarna berbeda.',
    tags: ['figural', 'hitung'],
  },
  {
    code: 'PSI-KEC-FIG-037',
    family: 'count',
    seed: 2,
    difficulty: 'MEDIUM',
    stem: 'Dalam latihan ketelitian pengamatan visual cepat terhadap objek bertumpuk, petugas dihadapkan pada komposisi sejumlah bangun geometri yang tersebar di dalam bidang gambar. Anda harus menghitung secara sistematis dan cermat seluruh bangun penyusun tanpa ada yang terlewat maupun terhitung ganda. Berapakah jumlah bentuk geometri pada gambar di bawah ini?',
    explanation: 'Jumlahkan bentuk pada setiap baris untuk memperoleh total.',
    tags: ['figural', 'hitung'],
  },
  {
    code: 'PSI-KEC-FIG-038',
    family: 'count',
    seed: 3,
    difficulty: 'MEDIUM',
    stem: 'Dalam latihan ketelitian pengamatan visual cepat terhadap objek bertumpuk, petugas dihadapkan pada komposisi sejumlah bangun geometri yang tersebar di dalam bidang gambar. Anda harus menghitung secara sistematis dan cermat seluruh bangun penyusun tanpa ada yang terlewat maupun terhitung ganda. Hitung banyaknya bentuk yang ditampilkan, lalu pilih jawaban yang tepat.',
    explanation: 'Hitung bentuk baris demi baris agar tidak ada yang terlewat.',
    tags: ['figural', 'hitung'],
  },
  {
    code: 'PSI-KEC-FIG-039',
    family: 'direction',
    seed: 0,
    difficulty: 'EASY',
    stem: 'Pada pengujian orientasi navigasi instrumen kompas taktis, jarum penunjuk arah memperlihatkan sudut haluan tertentu terhadap titik mata angin utama dan mata angin perantara. Ketepatan membaca arah panah kompas sangat krusial dalam memandu pergerakan tim operasional di medan tugas. Jarum kompas pada gambar menunjuk ke arah ...',
    explanation: 'Perhatikan ujung panah kompas untuk menentukan arah mata angin.',
    tags: ['figural', 'arah'],
  },
  {
    code: 'PSI-KEC-FIG-040',
    family: 'direction',
    seed: 1,
    difficulty: 'EASY',
    stem: 'Pada pengujian orientasi navigasi instrumen kompas taktis, jarum penunjuk arah memperlihatkan sudut haluan tertentu terhadap titik mata angin utama dan mata angin perantara. Ketepatan membaca arah panah kompas sangat krusial dalam memandu pergerakan tim operasional di medan tugas. Arah yang ditunjukkan jarum kompas berikut adalah ...',
    explanation: 'Ujung panah menunjuk arah mata angin sesuai skala kompas.',
    tags: ['figural', 'arah'],
  },
  {
    code: 'PSI-KEC-FIG-041',
    family: 'direction',
    seed: 2,
    difficulty: 'EASY',
    stem: 'Pada pengujian orientasi navigasi instrumen kompas taktis, jarum penunjuk arah memperlihatkan sudut haluan tertentu terhadap titik mata angin utama dan mata angin perantara. Ketepatan membaca arah panah kompas sangat krusial dalam memandu pergerakan tim operasional di medan tugas. Tentukan arah mata angin yang ditunjuk jarum pada gambar.',
    explanation: 'Baca arah ujung jarum terhadap empat arah utama kompas.',
    tags: ['figural', 'arah'],
  },
  {
    code: 'PSI-KEC-FIG-042',
    family: 'direction',
    seed: 3,
    difficulty: 'MEDIUM',
    stem: 'Pada pengujian orientasi navigasi instrumen kompas taktis, jarum penunjuk arah memperlihatkan sudut haluan tertentu terhadap titik mata angin utama dan mata angin perantara. Ketepatan membaca arah panah kompas sangat krusial dalam memandu pergerakan tim operasional di medan tugas. Jarum kompas berputar seperti pada gambar. Arah yang ditunjuk adalah ...',
    explanation: 'Arah ditentukan oleh posisi ujung panah pada bidang kompas.',
    tags: ['figural', 'arah'],
  },
  {
    code: 'PSI-KEC-FIG-043',
    family: 'direction',
    seed: 4,
    difficulty: 'MEDIUM',
    stem: 'Pada pengujian orientasi navigasi instrumen kompas taktis, jarum penunjuk arah memperlihatkan sudut haluan tertentu terhadap titik mata angin utama dan mata angin perantara. Ketepatan membaca arah panah kompas sangat krusial dalam memandu pergerakan tim operasional di medan tugas. Berdasarkan gambar kompas, arah yang benar adalah ...',
    explanation: 'Ujung panah menunjuk salah satu dari empat arah mata angin utama.',
    tags: ['figural', 'arah'],
  },
  {
    code: 'PSI-KEC-FIG-044',
    family: 'direction',
    seed: 5,
    difficulty: 'MEDIUM',
    stem: 'Pada pengujian orientasi navigasi instrumen kompas taktis, jarum penunjuk arah memperlihatkan sudut haluan tertentu terhadap titik mata angin utama dan mata angin perantara. Ketepatan membaca arah panah kompas sangat krusial dalam memandu pergerakan tim operasional di medan tugas. Pilih arah mata angin yang sesuai dengan jarum kompas di bawah.',
    explanation: 'Cocokkan posisi ujung panah dengan arah mata angin.',
    tags: ['figural', 'arah'],
  },
];

/* -------------------------------------------------------------------- TKK */

const TKK_IMAGE: ReadonlyArray<Omit<FiguralSeed, 'type'>> = [
  {
    code: 'PSI-KEC-FIG-045',
    family: 'series',
    seed: 100,
    difficulty: 'EASY',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Lanjutkan pola jumlah bentuk pada gambar berikut.',
    explanation: 'Jumlah bentuk bertambah satu pada setiap baris, sehingga lanjutan berisi empat bentuk.',
    tags: ['figural', 'pola'],
  },
  {
    code: 'PSI-KEC-FIG-046',
    family: 'series',
    seed: 101,
    difficulty: 'MEDIUM',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Deret bentuk berikut memiliki pola tetap. Pilih gambar lanjutannya.',
    explanation: 'Pola penambahan satu bentuk per baris berlanjut menjadi empat bentuk.',
    tags: ['figural', 'pola'],
  },
  {
    code: 'PSI-KEC-FIG-047',
    family: 'series',
    seed: 102,
    difficulty: 'MEDIUM',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Tentukan gambar yang melanjutkan deret bentuk di bawah ini.',
    explanation: 'Baris keempat memuat empat bentuk sesuai pola 1, 2, 3.',
    tags: ['figural', 'pola'],
  },
  {
    code: 'PSI-KEC-FIG-048',
    family: 'series',
    seed: 103,
    difficulty: 'HARD',
    stem: 'Dalam analisis pola visual dan pemetaan urutan bukti grafis di laboratorium identifikasi, penyidik mengamati perubahan teratur pada jumlah serta susunan elemen bentuk geometri dari satu tahap ke tahap berikutnya. Kemampuan mengenali kaidah pertambahan struktur secara konsisten sangat diperlukan untuk memprediksi tahapan pola selanjutnya. Amati pola jumlah bentuk dan pilih kelanjutan yang tepat.',
    explanation: 'Jumlah bentuk naik satu setiap baris; kelanjutannya empat bentuk.',
    tags: ['figural', 'pola'],
  },
  {
    code: 'PSI-KEC-FIG-049',
    family: 'rotation',
    seed: 100,
    difficulty: 'MEDIUM',
    stem: 'Pada pengujian persepsi spasial dan orientasi objek dua dimensi, sebuah bangun geometri mengalami perputaran (rotasi) dengan besaran sudut dan arah putar yang konsisten pada setiap langkah. Peserta dituntut menganalisis perubahan posisi sudut elemen penanda secara presisi untuk menentukan posisi akhir objek. Bentuk diputar dengan sudut tetap. Tentukan hasil putaran berikutnya.',
    explanation: 'Sudut putar bertambah 90°, sehingga gambar berikutnya berputar 180° dari posisi awal.',
    tags: ['figural', 'rotasi'],
  },
  {
    code: 'PSI-KEC-FIG-050',
    family: 'rotation',
    seed: 101,
    difficulty: 'HARD',
    stem: 'Pada pengujian persepsi spasial dan orientasi objek dua dimensi, sebuah bangun geometri mengalami perputaran (rotasi) dengan besaran sudut dan arah putar yang konsisten pada setiap langkah. Peserta dituntut menganalisis perubahan posisi sudut elemen penanda secara presisi untuk menentukan posisi akhir objek. Perhatikan langkah rotasi pada gambar, lalu pilih lanjutannya.',
    explanation: 'Langkah 45° berlanjut menjadi 90° dari posisi awal.',
    tags: ['figural', 'rotasi'],
  },
  {
    code: 'PSI-KEC-FIG-051',
    family: 'rotation',
    seed: 102,
    difficulty: 'HARD',
    stem: 'Pada pengujian persepsi spasial dan orientasi objek dua dimensi, sebuah bangun geometri mengalami perputaran (rotasi) dengan besaran sudut dan arah putar yang konsisten pada setiap langkah. Peserta dituntut menganalisis perubahan posisi sudut elemen penanda secara presisi untuk menentukan posisi akhir objek. Tentukan gambar keempat pada deret rotasi bentuk berikut.',
    explanation: 'Rotasi 135° per langkah menghasilkan posisi 270° pada langkah kedua.',
    tags: ['figural', 'rotasi'],
  },
  {
    code: 'PSI-KEC-FIG-052',
    family: 'mirror',
    seed: 100,
    difficulty: 'MEDIUM',
    stem: 'Dalam pemeriksaan simetri visual dan pembalikan citra optik, suatu komposisi bentuk geometri dicerminkan terhadap sumbu refleksi tertentu sehingga menghasilkan bayangan yang berkebalikan arah secara proporsional. Ketelitian mengamati posisi setiap detail bentuk terhadap garis cermin sangat menentukan ketepatan identifikasi bayangan. Pilih bayangan cermin bentuk terhadap garis putus-putus.',
    explanation: 'Pencerminan terhadap garis mendatar membalik arah vertikal.',
    tags: ['figural', 'pencerminan'],
  },
  {
    code: 'PSI-KEC-FIG-053',
    family: 'mirror',
    seed: 101,
    difficulty: 'HARD',
    stem: 'Dalam pemeriksaan simetri visual dan pembalikan citra optik, suatu komposisi bentuk geometri dicerminkan terhadap sumbu refleksi tertentu sehingga menghasilkan bayangan yang berkebalikan arah secara proporsional. Ketelitian mengamati posisi setiap detail bentuk terhadap garis cermin sangat menentukan ketepatan identifikasi bayangan. Gambar manakah hasil pencerminan bentuk berikut?',
    explanation: 'Bayangan cermin mempertahankan susunan mendatar dan membalik susunan tegak.',
    tags: ['figural', 'pencerminan'],
  },
  {
    code: 'PSI-KEC-FIG-054',
    family: 'mirror',
    seed: 102,
    difficulty: 'HARD',
    stem: 'Dalam pemeriksaan simetri visual dan pembalikan citra optik, suatu komposisi bentuk geometri dicerminkan terhadap sumbu refleksi tertentu sehingga menghasilkan bayangan yang berkebalikan arah secara proporsional. Ketelitian mengamati posisi setiap detail bentuk terhadap garis cermin sangat menentukan ketepatan identifikasi bayangan. Tentukan hasil pencerminan bentuk pada sumbu mendatar.',
    explanation: 'Hasil cermin terhadap sumbu mendatar adalah pembalikan arah tegak.',
    tags: ['figural', 'pencerminan'],
  },
];

const TKK_TEXT_WITH_STEM: ReadonlyArray<Omit<FiguralSeed, 'type'>> = [
  {
    code: 'PSI-KEC-FIG-055',
    family: 'count',
    seed: 100,
    difficulty: 'EASY',
    stem: 'Dalam latihan ketelitian pengamatan visual cepat terhadap objek bertumpuk, petugas dihadapkan pada komposisi sejumlah bangun geometri yang tersebar di dalam bidang gambar. Anda harus menghitung secara sistematis dan cermat seluruh bangun penyusun tanpa ada yang terlewat maupun terhitung ganda. Berapa jumlah bentuk pada gambar berikut?',
    explanation: 'Hitung seluruh bentuk pada gambar satu per satu.',
    tags: ['figural', 'hitung'],
  },
  {
    code: 'PSI-KEC-FIG-056',
    family: 'count',
    seed: 101,
    difficulty: 'MEDIUM',
    stem: 'Dalam latihan ketelitian pengamatan visual cepat terhadap objek bertumpuk, petugas dihadapkan pada komposisi sejumlah bangun geometri yang tersebar di dalam bidang gambar. Anda harus menghitung secara sistematis dan cermat seluruh bangun penyusun tanpa ada yang terlewat maupun terhitung ganda. Hitung banyaknya bentuk geometri yang tampak.',
    explanation: 'Jumlahkan bentuk pada tiap baris untuk memperoleh total.',
    tags: ['figural', 'hitung'],
  },
  {
    code: 'PSI-KEC-FIG-057',
    family: 'direction',
    seed: 100,
    difficulty: 'EASY',
    stem: 'Pada pengujian orientasi navigasi instrumen kompas taktis, jarum penunjuk arah memperlihatkan sudut haluan tertentu terhadap titik mata angin utama dan mata angin perantara. Ketepatan membaca arah panah kompas sangat krusial dalam memandu pergerakan tim operasional di medan tugas. Jarum kompas menunjuk ke arah ...',
    explanation: 'Arah ditentukan oleh ujung panah pada kompas.',
    tags: ['figural', 'arah'],
  },
  {
    code: 'PSI-KEC-FIG-058',
    family: 'direction',
    seed: 101,
    difficulty: 'MEDIUM',
    stem: 'Pada pengujian orientasi navigasi instrumen kompas taktis, jarum penunjuk arah memperlihatkan sudut haluan tertentu terhadap titik mata angin utama dan mata angin perantara. Ketepatan membaca arah panah kompas sangat krusial dalam memandu pergerakan tim operasional di medan tugas. Tentukan arah mata angin yang ditunjuk jarum kompas.',
    explanation: 'Cocokkan posisi ujung panah dengan arah mata angin.',
    tags: ['figural', 'arah'],
  },
  {
    code: 'PSI-KEC-FIG-059',
    family: 'direction',
    seed: 102,
    difficulty: 'MEDIUM',
    stem: 'Pada pengujian orientasi navigasi instrumen kompas taktis, jarum penunjuk arah memperlihatkan sudut haluan tertentu terhadap titik mata angin utama dan mata angin perantara. Ketepatan membaca arah panah kompas sangat krusial dalam memandu pergerakan tim operasional di medan tugas. Berdasarkan gambar, arah yang ditunjuk kompas adalah ...',
    explanation: 'Ujung panah menunjuk salah satu arah mata angin utama.',
    tags: ['figural', 'arah'],
  },
];

/* ---------------------------------------------------------------- ekspor */

function withType(
  rows: ReadonlyArray<Omit<FiguralSeed, 'type'>>,
  type: FiguralSeed['type'],
): FiguralSeed[] {
  return rows.map((row) => ({ ...row, type }));
}

export const FIGURAL_KECERDASAN: readonly FiguralSeed[] = [
  ...withType(KEC_IMAGE, 'IMAGE_CHOICE'),
  ...withType(KEC_TEXT_WITH_STEM, 'SINGLE_CHOICE'),
  ...withType(TKK_IMAGE, 'IMAGE_CHOICE'),
  ...withType(TKK_TEXT_WITH_STEM, 'SINGLE_CHOICE'),
  ...Array.from({ length: 15 }, (_, idx): FiguralSeed => {
    const num = 60 + idx;
    const submode = idx % 4;
    const stems = [
      `Pada analisis sekuens kisi visual hitam-putih (Varian #${idx + 1}), setiap kotak memuat petak jendela dengan sel hitam pekat dan sel arsiran yang bergeser secara sistematis dari langkah 1, langkah 2, hingga langkah 3. Amati pola perpindahan posisi petak hitam tersebut, lalu tentukan gambar ke-4 yang tepat untuk mengisi kotak bertanda tanya (?).`,
      `Dalam pengujian persepsi rotasi baling-baling hitam-putih (Varian #${idx + 1}), empat kelopak mengelilingi poros tengah di mana tepat satu kelopak berwarna hitam pekat dan satu penanda sudut ikut berpindah searah putaran. Perhatikan perubahan orientasi dari kotak 1 ke kotak 3, kemudian pilih gambar yang melanjutkan pola pada kotak ke-4 (?).`,
      `Dalam evaluasi deret matriks titik hitam-putih (Varian #${idx + 1}), jumlah noktah bulat hitam di dalam kotak berubah secara aritmetis teratur pada setiap tahap pengamatan. Hitung perubahan jumlah dan susunan titik dari kotak pertama hingga ketiga, lalu tentukan konfigurasi titik yang benar untuk kotak keempat (?).`,
      `Pada analisis pergeseran simbol mikro sudut dan bangun pusat hitam-putih (Varian #${idx + 1}), bangun geometri di tengah mengalami pergantian teratur sementara empat simbol kecil di sudut kotak bergeser mengelilingi tepi. Tentukan gambar yang tepat untuk melengkapi urutan keempat (?).`,
    ];
    const explanations = [
      'Sel hitam dan sel arsiran pada kisi jendela bergeser maju secara konstan setiap langkah; gambar yang tepat adalah kelanjutan posisi langkah ke-4.',
      'Kelopak hitam pekat dan penanda sudut berputar 90 derajat searah jarum jam setiap langkah sehingga pada langkah ke-4 berada pada posisi berikutnya.',
      'Jumlah titik hitam berubah secara konsisten dengan selisih 2 titik per langkah (mis. 9 → 7 → 5 → 3 atau 2 → 4 → 6 → 8).',
      'Bangun pusat berganti mengikuti siklus bentuk geometri dan keempat simbol sudut bergeser satu sudut searah jarum jam.',
    ];
    return {
      code: `PSI-KEC-FIG-${String(num).padStart(3, '0')}`,
      family: 'gridseries',
      seed: idx,
      type: 'IMAGE_CHOICE',
      difficulty: idx % 3 === 0 ? 'EASY' : idx % 3 === 1 ? 'MEDIUM' : 'HARD',
      stem: stems[submode]!,
      explanation: explanations[submode]!,
      tags: ['figural', 'pola', 'deret-gambar', 'hitam-putih'],
    };
  }),
  ...Array.from({ length: 15 }, (_, idx): FiguralSeed => {
    const num = 75 + idx;
    return {
      code: `PSI-KEC-FIG-${String(num).padStart(3, '0')}`,
      family: 'matrixline',
      seed: idx,
      type: 'IMAGE_CHOICE',
      difficulty: idx % 3 === 0 ? 'MEDIUM' : 'HARD',
      stem: `Perhatikan matriks penalaran figural 3×3 hitam-putih berikut (Kasus Matriks Garis & Titik #${idx + 1}). Setiap baris mempertahankan bentuk bingkai luar yang konsisten, sedangkan elemen garis palang (+), garis diagonal (×), serta empat titik sudut pada kolom ketiga merupakan hasil operasi penggabungan atau relasi logis dari kolom pertama dan kolom kedua. Pilih gambar yang tepat untuk mengisi sel kanan bawah bertanda tanya (?).`,
      explanation:
        'Bentuk bingkai luar mengikuti baris ketiga, sedangkan elemen garis bagian dalam (+ dan ×) serta keempat titik sudut mengikuti kaidah superposisi/kombinasi kolom pertama dan kolom kedua.',
      tags: ['figural', 'matriks', 'superposisi-garis', 'hitam-putih'],
    };
  }),
  ...Array.from({ length: 15 }, (_, idx): FiguralSeed => {
    const num = 90 + idx;
    return {
      code: `PSI-KEC-FIG-${String(num).padStart(3, '0')}`,
      family: 'matrixshape',
      seed: idx,
      type: 'IMAGE_CHOICE',
      difficulty: idx % 2 === 0 ? 'MEDIUM' : 'HARD',
      stem: `Amati matriks transformasi bangun bersarang 3×3 hitam-putih di atas (Kasus Matriks Bangun Bersarang #${idx + 1}). Pada matriks ini, bangun luar ditentukan oleh pola baris, bangun dalam ditentukan oleh pola kolom, dan warna blok hitam-putih berganti secara selang-seling. Tentukan gambar yang paling tepat untuk melengkapi sel sudut kanan bawah yang bertanda tanya (?).`,
      explanation:
        'Bangun luar sel kanan bawah harus sama dengan bangun luar baris ke-3, bangun dalamnya harus sama dengan bangun dalam kolom ke-3, dengan kontras warna hitam-putih yang konsisten terhadap pola selang-seling matriks.',
      tags: ['figural', 'matriks', 'bangun-bersarang', 'hitam-putih'],
    };
  }),
];

/**
 * TKK tidak lagi memuat soal figural/rotasi gambar (dipindahkan seluruhnya ke Psikotes Kecerdasan).
 * Diekspor sebagai larik kosong agar kompatibilitas kode pengimpor tetap terjaga.
 */
export const FIGURAL_TKK: readonly FiguralSeed[] = [];

/* ------------------------------------------------------- aset & kunci opsi */

/** Kode aset untuk satu gambar; stabil antar seed. */
export function figureAssetCode(spec: FigureSpec, variant: number): string {
  return `FIG-${spec.family.toUpperCase()}-${spec.seed}-${
    variant === STEM_VARIANT ? 'STEM' : OPTION_LABELS[variant] ?? variant
  }`;
}

/**
 * Seluruh aset gambar yang dibutuhkan soal figural.
 *
 * Satu baris per gambar (stem + pilihan). Duplikat dibuang agar gambar yang
 * dipakai dua soal tidak di-render dua kali.
 */
export function figureAssets(): FigureAssetRef[] {
  const byCode = new Map<string, FigureAssetRef>();

  for (const row of [...FIGURAL_KECERDASAN, ...FIGURAL_TKK]) {
    const spec: FigureSpec = { family: row.family, seed: row.seed };
    const variants = row.type === 'IMAGE_CHOICE' ? [STEM_VARIANT, 0, 1, 2, 3] : [STEM_VARIANT];

    for (const variant of variants) {
      const code = figureAssetCode(spec, variant);
      if (byCode.has(code)) continue;
      byCode.set(code, {
        code,
        spec,
        variant,
        alt: figureAltText(spec, variant),
      });
    }
  }

  return [...byCode.values()];
}

export interface FiguralLayout {
  /** Varian gambar per label (indeks 0..3 = label A..D). */
  variantByLabel: number[];
  /** Label (0..3) yang benar. */
  correctIndex: number;
}

/**
 * Susunan gambar pada pilihan jawaban.
 *
 * Varian diacak deterministik per soal agar kunci tidak selalu di label A.
 * Semua varian tetap muncul tepat satu kali, jadi soal selalu punya satu
 * jawaban benar.
 */
export function layoutFor(row: FiguralSeed): FiguralLayout {
  const spec: FigureSpec = { family: row.family, seed: row.seed };
  const correct = correctOptionVariant(spec);
  const variantByLabel = shuffle(
    createRng(`figural-layout:${row.code}`),
    [0, 1, 2, 3].filter((variant) => variant !== correct),
  );
  // Sisipkan varian benar pada posisi acak tersendiri.
  const insertAt = Math.floor(createRng(`figural-key:${row.code}`).next() * 4);
  variantByLabel.splice(insertAt, 0, correct);

  return { variantByLabel, correctIndex: variantByLabel.indexOf(correct) };
}

/** Label opsi bergambar yang benar untuk satu spesifikasi. */
export function correctLabel(row: FiguralSeed): string {
  return OPTION_LABELS[layoutFor(row).correctIndex]!;
}

/** Varian gambar (0..3) yang benar — dipakai test konsistensi kunci. */
export function correctVariant(row: FiguralSeed): number {
  return correctOptionVariant({ family: row.family, seed: row.seed });
}

/** Empat pengecoh untuk soal hitung (angka di sekitar jawaban). */
export function countDistractors(answer: number): [string, string, string, string] {
  const unique: string[] = [];
  for (const candidate of [answer - 1, answer + 1, answer + 2, answer - 2]) {
    const text = String(candidate);
    if (candidate > 0 && candidate !== answer && !unique.includes(text)) unique.push(text);
  }
  let extra = answer + 3;
  while (unique.length < 4) {
    const text = String(extra);
    if (extra !== answer && !unique.includes(text)) unique.push(text);
    extra += 1;
  }
  return unique.slice(0, 4) as [string, string, string, string];
}

/** Pengecoh arah: tiga arah mata angin lain + satu arah diagonal. */
export function directionDistractors(answer: CompassDirection): [string, string, string, string] {
  const others = (['Utara', 'Timur', 'Selatan', 'Barat'] as const).filter(
    (direction) => direction !== answer,
  );
  return [others[0]!, others[1]!, others[2]!, 'Timur Laut'];
}

/** Jawaban teks & stem bergambar untuk keluarga hitung/arah. */
export function figuralTextAnswer(row: FiguralSeed): string {
  const spec: FigureSpec = { family: row.family, seed: row.seed };
  if (row.family === 'count') return String(countOfShapes(spec));
  if (row.family === 'direction') return compassOf(spec);
  throw new Error(`${row.code}: keluarga ${row.family} tidak memakai jawaban teks`);
}

/** Render SVG satu aset; dipakai seed dan test. */
export function renderAsset(asset: FigureAssetRef): string {
  return renderFigure(asset.spec, asset.variant);
}
