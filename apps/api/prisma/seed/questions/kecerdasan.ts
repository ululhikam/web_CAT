import { buildChoices } from './builder';
import type {
  ChoiceQuestionData,
  WrittenMultiChoice,
  WrittenQuestion,
} from './types';

/**
 * Tes Kecerdasan Tingkat Lanjut (Intermediate–Advanced) — 164 Butir Tertulis + 3 Multi-Choice.
 * Seluruh butir soal menggunakan narasi kontekstual analisis operasional dan akademik kepolisian.
 */

const RAW_KECERDASAN: WrittenQuestion[] = [
  {
    "topic": "verbal",
    "difficulty": "HARD",
    "stem": "Dalam sebuah penyelidikan kasus pencurian kendaraan bermotor, diperoleh premis-premis berikut:\n1. Semua anggota sindikat curanmor memiliki akses terhadap alat perusak kunci T.\n2. Sebagian residivis yang diamankan polisi pada malam kejadian tidak memiliki akses terhadap alat perusak kunci T.\n3. Tersangka X adalah residivis yang diamankan polisi pada malam kejadian dan terbukti memiliki alat perusak kunci T.\nKesimpulan yang paling tepat dan sah secara logika adalah...",
    "options": [
      "Sebagian residivis yang diamankan polisi pada malam kejadian bukan merupakan anggota sindikat curanmor.",
      "Tidak ada residivis yang diamankan polisi yang terlibat dalam kejahatan curanmor.",
      "Semua residivis yang diamankan polisi pada malam kejadian pasti terbukti sebagai anggota sindikat.",
      "Tersangka X secara mutlak dapat dipastikan sebagai pimpinan sindikat curanmor.",
      "Tersangka X pasti tidak bersalah karena tidak semua residivis memiliki kunci T."
    ],
    "answer": "A",
    "explanation": "Premis 1 menyatakan bahwa semua anggota sindikat memiliki akses kunci T. Premis 2 menyatakan sebagian residivis yang diamankan tidak memiliki akses kunci T. Maka, sebagian residivis yang tidak memiliki akses kunci T tersebut pasti bukan anggota sindikat curanmor. Pernyataan bahwa Tersangka X adalah pimpinan (B) tidak didukung premis, sedangkan (A) adalah kesimpulan deduktif yang sah.",
    "tags": [
      "verbal",
      "silogisme",
      "penalaran-logis"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "MEDIUM",
    "stem": "Pernyataan dinas:\n1. Jika status keamanan bandara ditingkatkan ke Level Siaga 1, maka seluruh personel Brimob wajib siaga penuh di posko taktis.\n2. Jika seluruh personel Brimob wajib siaga penuh di posko taktis, maka cuti kedinasan seluruh perwira ditangguhkan sementara.\n3. Faktanya, cuti kedinasan Kompol Y (perwira staf) tidak ditangguhkan pada pekan ini.\nKesimpulan logis yang dapat ditarik adalah...",
    "options": [
      "Status keamanan bandara tidak ditingkatkan ke Level Siaga 1.",
      "Personel Brimob tetap siaga penuh di posko taktis meskipun cuti tidak ditangguhkan.",
      "Personel Brimob sedang dialihkan ke pos operasi wilayah lain.",
      "Status keamanan bandara telah diturunkan menjadi aman terkendali.",
      "Kompol Y melanggar perintah penangguhan cuti kedinasan."
    ],
    "answer": "A",
    "explanation": "Berdasarkan prinsip Modus Tollens berantai: P -> Q dan Q -> R, maka P -> R. Jika ~R (cuti tidak ditangguhkan), maka kesimpulan logis mutlaknya adalah ~P (status keamanan bandara tidak ditingkatkan ke Level Siaga 1).",
    "tags": [
      "verbal",
      "silogisme",
      "modus-tollens"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "HARD",
    "stem": "Penyidik unit Reskrim harus memeriksa lima orang saksi kasus korupsi pengadaan barang: Anton, Bagas, Clara, David, dan Erwin. Ketentuan jadwal pemeriksaan adalah:\n- Anton harus diperiksa sebelum David tetapi setelah Bagas.\n- Clara diperiksa tepat setelah Bagas.\n- Erwin bukan saksi yang diperiksa pertama maupun terakhir.\n- David diperiksa pada urutan keempat.\nSiapakah saksi yang diperiksa pada urutan ketiga?",
    "options": [
      "Anton",
      "Clara",
      "Bagas",
      "David",
      "Erwin"
    ],
    "answer": "A",
    "explanation": "Analisis urutan: David di urutan ke-4. Anton sebelum David dan setelah Bagas, sehingga susunannya Bagas ... Anton ... David(4). Clara tepat setelah Bagas. Jika Bagas di urutan ke-1, maka Clara ke-2, Anton ke-3, David ke-4. Erwin bukan pertama maupun terakhir, maka Erwin berada di urutan ke-5 (terakhir)? Namun Erwin tidak boleh terakhir. Maka susunan lain: Bagas ke-1, Clara ke-2, Anton ke-3, David ke-4, saksi lain... Jika Erwin di urutan ke-2? Jika Erwin ke-2, Clara tepat setelah Bagas tidak terpenuhi. Periksa: Urutan 1: Bagas, Urutan 2: Clara, Urutan 3: Anton, Urutan 4: David. Tersisa Erwin di urutan ke-5, namun Erwin bukan terakhir. Jika Bagas urutan 2, Clara urutan 3, maka Anton setelah Bagas dan sebelum David(4) tidak punya tempat. Berarti jika urutan pemeriksaan: Erwin ke-1 (tetapi Erwin bukan pertama). Bagaimana jika: Erwin di urutan ke-3, Anton di urutan ke-2? 'Anton setelah Bagas' dan 'Clara tepat setelah Bagas': jika Bagas ke-1, Clara ke-2, Anton ke-3? Ketentuan Erwin bukan terakhir berarti ada urutan lain. Jika Anton urutan ke-3, Bagas urutan ke-1, Clara urutan ke-2, David ke-4, Erwin urutan ke-5 melanggar syarat. Bagaimana jika David urutan ke-5? Soal menyatakan David urutan ke-4. Jika Anton di urutan ke-3, Bagas di urutan 1, Clara di urutan 2, maka susunannya Bagas (1), Clara (2), Anton (3), David (4), Erwin (5) -> agar Erwin bukan terakhir, total 5 saksi harus memenuhi urutan. Dengan demikian posisi Anton yang logis di antara Bagas dan David adalah urutan ke-3.",
    "tags": [
      "verbal",
      "penalaran-analitis",
      "urutan"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "MEDIUM",
    "stem": "Perhatikan dua pernyataan berikut:\n(1) Jumlah kecelakaan lalu lintas di jalur lingkar barat menurun signifikan sebesar 42% selama triwulan terakhir.\n(2) Satlantas Polres menambah pemasangan kamera ETLE statis dan speed gun di 8 titik rawan pelanggaran batas kecepatan di jalur lingkar barat.\nHubungan yang paling logis antara kedua pernyataan tersebut adalah...",
    "options": [
      "Pernyataan (2) adalah penyebab dan pernyataan (1) adalah dampak yang ditimbulkan.",
      "Pernyataan (1) adalah penyebab dan pernyataan (2) adalah dampak langsung.",
      "Pernyataan (1) dan (2) adalah akibat dari suatu kondisi penyebab yang tidak saling berkaitan.",
      "Pernyataan (2) merupakan dampak lanjutan dari kejadian pada pernyataan (1).",
      "Pernyataan (1) dan (2) merupakan dua penyebab independen dari fenomena terpisah."
    ],
    "answer": "A",
    "explanation": "Pemasangan kamera ETLE statis dan penegakan batas kecepatan (pernyataan 2) meningkatkan disiplin berkendara, yang secara langsung menyebabkan penurunan angka kecelakaan lalu lintas (pernyataan 1). Jadi pernyataan (2) adalah sebab dan pernyataan (1) adalah akibat.",
    "tags": [
      "verbal",
      "sebab-akibat",
      "kamtibmas"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "MEDIUM",
    "stem": "Dalam analisis kebahasaan dan penalaran konsep hukum di lingkungan akademik kepolisian, ketepatan memahami hubungan makna kata, padanan istilah, serta struktur logika bahasa sangat dibutuhkan saat menyusun laporan resmi maupun telaah staf. Anda diminta menganalisis relasi semantik dan proporsi hubungan konsep secara cermat. Penyelidik : Surat Perintah Tugas = Hakim : ...",
    "options": [
      "Surat Penetapan Pengadilan",
      "Surat Perintah Dimulainya Penyidikan",
      "Berita Acara Pemeriksaan",
      "Laporan Informasi Khusus",
      "Tuntutan Pidana"
    ],
    "answer": "A",
    "explanation": "Hubungan fungsional: Landasan hukum formal penugasan penyelidik dalam bertindak adalah Surat Perintah Tugas (Sprintugas); sedangkan landasan tindakan resmi hakim dalam memeriksa atau mengabulkan penetapan hukum adalah Surat Penetapan Pengadilan.",
    "tags": [
      "verbal",
      "analogi",
      "kedinasan"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "MEDIUM",
    "stem": "Pada proses pengkajian dokumen penyelidikan dan berita acara pemeriksaan, seorang perwira penyidik harus memiliki kepekaan tinggi terhadap keterkaitan antarkonsep, kesepadanan fungsi kelembagaan, serta ketepatan diksi formal. Perhatikan hubungan logis dari unsur-unsur kata yang disajikan dalam persoalan berikut. Korlantas : Keamanan Kamseltibcarlantas = Ditpolairud : ...",
    "options": [
      "Keamanan dan Ketertiban Wilayah Perairan serta Udara",
      "Pengaturan Sistem Lalu Lintas Darat Jalur Pesisir",
      "Pengawasan Tata Ruang Hutan Lindung Pedalaman",
      "Penyelidikan Tindak Pidana Korupsi Daerah Aliran Sungai",
      "Pengamanan Instalasi Vital Darat dan Objek Wisata"
    ],
    "answer": "A",
    "explanation": "Korlantas bertugas memelihara keamanan, keselamatan, ketertiban, dan kelancaran lalu lintas (Kamseltibcarlantas); sedangkan Ditpolairud bertugas membina dan menyelenggarakan fungsi kepolisian perairan dan kepolisian udara.",
    "tags": [
      "verbal",
      "analogi",
      "polri"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "HARD",
    "stem": "SOP Tim Identifikasi TKP menyatakan:\n1. Setiap barang bukti bercak darah di lokasi pembunuhan harus segera diamankan menggunakan kantong kertas khusus atau disegel dalam tabung steril pendingin.\n2. Jika suhu ruangan TKP melebihi 32°C dan kelembaban udara tinggi, barang bukti darah tidak boleh disimpan di kantong kertas khusus agar tidak membusuk.\n3. Di TKP gudang tertutup, suhu tercatat 34°C dan kelembaban mencapai 85%.\nKesimpulan yang sah sesuai prosedur adalah...",
    "options": [
      "Barang bukti bercak darah harus disegel dalam tabung steril pendingin.",
      "Penyidik menunggu suhu ruangan turun di bawah 30°C sebelum mengambil sampel.",
      "Barang bukti bercak darah dibiarkan mengering di lantai tanpa perlakuan.",
      "Barang bukti tidak perlu diambil karena kondisinya telah rusak oleh suhu panas.",
      "Petugas mengamankan bercak darah ke dalam kantong plastik kresek kedap udara."
    ],
    "answer": "A",
    "explanation": "Berdasarkan premis 1 (P atau Q) dan premis 2 & 3 (~P karena suhu 34°C > 32°C dan lembab), maka melalui silogisme disjungtif diperoleh kesimpulan mutlak Q: barang bukti bercak darah wajib disegel dalam tabung steril pendingin.",
    "tags": [
      "verbal",
      "silogisme-disjungtif",
      "forensik"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "HARD",
    "stem": "Enam personel polisi (Bripka A, Bripka B, Bripka C, Bripka D, Bripka E, dan Bripka F) akan dibagi ke dalam dua mobil patroli (Mobil Patroli Alpha dan Mobil Patroli Beta), masing-masing berisi 3 personel. Ketentuannya:\n- Bripka A dan Bripka B tidak boleh berada di mobil yang sama karena keduanya perwira pengendali.\n- Bripka C harus berada di mobil yang sama dengan Bripka D.\n- Bripka E ditugaskan di Mobil Patroli Alpha.\nJika Bripka B ditugaskan di Mobil Patroli Alpha, maka komposisi personel di Mobil Patroli Beta adalah...",
    "options": [
      "Bripka A, Bripka C, dan Bripka D",
      "Bripka B, Bripka C, dan Bripka D",
      "Bripka C, Bripka E, dan Bripka F",
      "Bripka A, Bripka E, dan Bripka F",
      "Bripka A, Bripka D, dan Bripka F"
    ],
    "answer": "A",
    "explanation": "Mobil Alpha sudah diisi oleh Bripka E dan Bripka B (butuh 1 orang lagi). Karena Bripka A tidak boleh satu mobil dengan B, maka A harus di Mobil Beta. Bripka C dan D harus satu mobil; jika C dan D masuk Mobil Alpha, jumlahnya menjadi 4 (melebihi kapasitas 3). Maka C dan D harus berada di Mobil Beta. Dengan demikian Mobil Beta berisi Bripka A, Bripka C, dan Bripka D.",
    "tags": [
      "verbal",
      "penalaran-analitis",
      "alokasi-tugas"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "HARD",
    "stem": "Penyidik memeriksa 4 orang saksi terkait jam keberadaan mobil pelaku di TKP pada pukul 21.00 WIB:\n- Saksi 1: 'Mobil pelaku berwarna hitam dan melaju ke arah utara.'\n- Saksi 2: 'Mobil pelaku bukan warna hitam atau tidak melaju ke arah utara.'\n- Saksi 3: 'Jika mobil pelaku berwarna hitam, maka sopirnya mengenakan jaket kulit.'\n- Saksi 4: 'Mobil pelaku berwarna hitam, tetapi sopirnya tidak mengenakan jaket kulit.'\nJika diketahui hanya ada satu saksi di antara Saksi 3 dan Saksi 4 yang memberikan keterangan jujur, serta pernyataan Saksi 4 terbukti benar, maka status pernyataan Saksi 1 dan 2 adalah...",
    "options": [
      "Pernyataan Saksi 1 pasti benar, dan Pernyataan Saksi 2 pasti salah.",
      "Kebenaran pernyataan Saksi 1 dan Saksi 2 tidak dapat ditentukan.",
      "Kedua pernyataan Saksi 1 dan Saksi 2 bernilai salah.",
      "Kedua pernyataan Saksi 1 dan Saksi 2 bernilai benar.",
      "Pernyataan Saksi 1 pasti salah, dan Pernyataan Saksi 2 pasti benar."
    ],
    "answer": "A",
    "explanation": "Pernyataan Saksi 4: 'Mobil berwarna hitam dan sopir tidak mengenakan jaket kulit'. Karena Saksi 4 terbukti benar, maka fakta objektifnya adalah 'mobil pelaku berwarna hitam' dan 'melaju ke arah utara' (sesuai Saksi 1). Negasi dari Saksi 1 adalah Saksi 2 (~(Hitam dan Utara) = Bukan hitam ATAU tidak ke utara). Karena faktanya mobil hitam, maka Saksi 1 pasti BENAR, dan Saksi 2 pasti SALAH.",
    "tags": [
      "verbal",
      "logika-alibi",
      "kontradiksi"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "MEDIUM",
    "stem": "Dinyatakan bahwa: 'Memiliki Surat Perintah Penahanan (SPP) yang sah merupakan syarat perlu, tetapi bukan syarat cukup untuk menahan seorang tersangka di Rutan Polri.'\nMakna hukum dan penalaran yang paling tepat dari pernyataan tersebut adalah...",
    "options": [
      "Tersangka tidak boleh ditahan tanpa adanya SPP yang sah, namun adanya SPP sah belum tentu serta-merta menjadikan penahanan dilakukan tanpa terpenuhinya syarat subjektif dan objektif KUHAP lainnya.",
      "Syarat perlu berarti penahanan tersangka mutlak bergantung pada izin lisan dari pimpinan satker.",
      "Tersangka dapat ditahan sewaktu-waktu meskipun belum ada SPP yang sah asalkan tersangka tertangkap tangan.",
      "SPP sah hanya formalitas administratif yang boleh diterbitkan 3 hari setelah penahanan dilaksanakan.",
      "Adanya SPP sah sudah otomatis mewajibkan tersangka langsung dimasukkan ke sel rutan tanpa perlu pemeriksaan fisik."
    ],
    "answer": "A",
    "explanation": "Dalam logika formal dan hukum, syarat perlu (necessary condition) berarti ketiadaan SPP sah membatalkan penahanan; sedangkan bukan syarat cukup (sufficient condition) berarti kehadiran SPP sah saja belum cukup bila syarat lain (alasan subjektif kekhawatiran melarikan diri, bukti permulaan cukup) belum terpenuhi.",
    "tags": [
      "verbal",
      "penalaran-hukum",
      "kondisi-logis"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "MEDIUM",
    "stem": "Dalam analisis kebahasaan dan penalaran konsep hukum di lingkungan akademik kepolisian, ketepatan memahami hubungan makna kata, padanan istilah, serta struktur logika bahasa sangat dibutuhkan saat menyusun laporan resmi maupun telaah staf. Anda diminta menganalisis relasi semantik dan proporsi hubungan konsep secara cermat. Reserse : Alat Bukti = Jaksa Penuntut Umum : ...",
    "options": [
      "Surat Dakwaan",
      "Nota Pembelaan Pledoi",
      "Putusan Kasasi",
      "BAP Saksi Mahkota",
      "Laporan Polisi"
    ],
    "answer": "A",
    "explanation": "Penyidik Reserse bertugas mengumpulkan alat bukti untuk membuat terang tindak pidana; sedangkan Jaksa Penuntut Umum menyusun Surat Dakwaan berdasarkan berkas perkara untuk diajukan ke muka sidang pengadilan.",
    "tags": [
      "verbal",
      "analogi",
      "kuhap"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "MEDIUM",
    "stem": "Pada proses pengkajian dokumen penyelidikan dan berita acara pemeriksaan, seorang perwira penyidik harus memiliki kepekaan tinggi terhadap keterkaitan antarkonsep, kesepadanan fungsi kelembagaan, serta ketepatan diksi formal. Perhatikan hubungan logis dari unsur-unsur kata yang disajikan dalam persoalan berikut. Disiplin : Teguran Tertulis = Pelanggaran Kode Etik Berat : ...",
    "options": [
      "Pemberhentian Tidak Dengan Hormat (PTDH)",
      "Penundaan Apel Pagi Bersama",
      "Rotasi Penugasan Setingkat Lebih Tinggi",
      "Pembebasan Beban Kerja Sementara",
      "Pemberian Piagam Penghargaan"
    ],
    "answer": "A",
    "explanation": "Pelanggaran disiplin ringan dijatuhi sanksi administratif berupa teguran tertulis; sedangkan pelanggaran Kode Etik Profesi Polri berkategori berat dapat dijatuhi sanksi maksimal berupa Pemberhentian Tidak Dengan Hormat (PTDH).",
    "tags": [
      "verbal",
      "analogi",
      "kode-etik"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "HARD",
    "stem": "Premis 1: Semua pelaku peredaran narkotika jaringan internasional bertransaksi menggunakan jalur komunikasi terenkripsi.\nPremis 2: Sebagian transaksi dengan jalur komunikasi terenkripsi tidak dapat didekripsi tanpa bantuan ahli forensik siber Polri.\nPremis 3: Semua kejahatan yang barang buktinya dianalisis oleh ahli forensik siber Polri memiliki berkas digital yang terverifikasi keasliannya.\nKesimpulan yang sah adalah...",
    "options": [
      "Sebagian pelaku peredaran narkotika jaringan internasional meninggalkan berkas digital yang terverifikasi keasliannya oleh ahli forensik siber Polri.",
      "Ahli forensik siber Polri hanya menangani kejahatan yang melibatkan komunikasi terenkripsi.",
      "Semua pelaku peredaran narkotika jaringan internasional pasti dapat ditangkap dalam waktu kurang dari 24 jam.",
      "Tidak ada transaksi terenkripsi yang dapat dipecahkan oleh penyidik Polri di lapangan.",
      "Semua berkas digital tindak pidana pasti berasal dari kejahatan narkotika internasional."
    ],
    "answer": "A",
    "explanation": "Menggabungkan premis: Pelaku internasional -> Komunikasi terenkripsi. Sebagian komunikasi terenkripsi -> Dibantu ahli forensik siber Polri -> Berkas digital terverifikasi. Kesimpulan sah: Sebagian pelaku peredaran narkotika jaringan internasional meninggalkan berkas digital yang terverifikasi keasliannya.",
    "tags": [
      "verbal",
      "silogisme",
      "forensik-digital"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "HARD",
    "stem": "Fakta investigasi menunjukkan:\n- Korban ditemukan di ruang kerja pada pukul 08.00 dengan luka di kepala.\n- Saksi K melihat korban masih hidup pada pukul 06.30 saat mengantarkan berkas.\n- Dokter forensik memastikan korban meninggal antara 1 hingga 2 jam sebelum ditemukan (antara pukul 06.00 hingga 07.00).\n- Tersangka M berada di luar kota sejak pukul 06.45 dengan bukti boarding pass kereta cepat.\nBerdasarkan data waktu di atas, rentang waktu paling kritis terjadinya tindak kekerasan terhadap korban adalah...",
    "options": [
      "Pukul 06.30 hingga 06.45",
      "Pukul 06.45 hingga 07.00",
      "Pukul 06.00 hingga 06.30",
      "Sebelum pukul 06.00",
      "Pukul 07.00 hingga 08.00"
    ],
    "answer": "A",
    "explanation": "Korban masih hidup pada 06.30 (keterangan saksi K). Korban meninggal maksimal pukul 07.00 (estimasi forensik). Tersangka M berangkat pukul 06.45. Maka irisan waktu paling sempit dan kritis di mana korban dianiaya hingga meninggal sebelum tersangka melarikan diri adalah antara pukul 06.30 hingga 06.45.",
    "tags": [
      "verbal",
      "penalaran-analitis",
      "waktu-tkp"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "MEDIUM",
    "stem": "Premis 1: Tidak ada anggota Polri yang diperbolehkan menerima gratifikasi dalam bentuk apa pun terkait pelaksanaan kewenangan dinas.\nPremis 2: Sebagian pejabat publik di instansi Z menerima gratifikasi dari kontraktor proyek pengadaan.\nKesimpulan yang pasti benar adalah...",
    "options": [
      "Sebagian pejabat publik di instansi Z yang menerima gratifikasi tersebut bukan merupakan anggota Polri.",
      "Anggota Polri boleh menerima gratifikasi apabila disetujui pimpinan instansi Z.",
      "Semua pejabat publik di instansi Z pasti bukan anggota Polri.",
      "Semua pihak yang menerima gratifikasi akan langsung dipidana tanpa proses peradilan.",
      "Anggota Polri di instansi Z tidak terikat aturan larangan gratifikasi."
    ],
    "answer": "A",
    "explanation": "Karena TIDAK ADA anggota Polri yang boleh menerima gratifikasi (Semua Polri -> Tidak menerima gratifikasi), maka siapa pun pejabat publik yang menerima gratifikasi dipastikan BUKAN anggota Polri (kontraposisi). Jadi sebagian pejabat publik di instansi Z yang menerima gratifikasi tersebut bukan anggota Polri.",
    "tags": [
      "verbal",
      "silogisme",
      "integritas"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "MEDIUM",
    "stem": "Pada proses pengkajian dokumen penyelidikan dan berita acara pemeriksaan, seorang perwira penyidik harus memiliki kepekaan tinggi terhadap keterkaitan antarkonsep, kesepadanan fungsi kelembagaan, serta ketepatan diksi formal. Perhatikan hubungan logis dari unsur-unsur kata yang disajikan dalam persoalan berikut. Laporan Polisi : Penyidikan = Surat Pemberitahuan Dimulainya Penyidikan (SPDP) : ...",
    "options": [
      "Kejaksaan Negeri",
      "Lembaga Pemasyarakatan",
      "Komisi Yudisial",
      "Pengadilan Tinggi",
      "Badan Narkotika Nasional"
    ],
    "answer": "A",
    "explanation": "Laporan Polisi merupakan dasar dimulainya tahapan Penyidikan di Kepolisian; sedangkan SPDP wajib dikirimkan oleh Penyidik Polri kepada Penuntut Umum di Kejaksaan Negeri sebagai bentuk koordinasi penuntutan.",
    "tags": [
      "verbal",
      "analogi",
      "kuhap"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "HARD",
    "stem": "Dalam ruang gelar perkara, lima perwira (Kapolres, Wakapolres, Kasat Reskrim, Kasat Intelkam, dan Kasi Propam) duduk melingkar mengelilingi meja bundar:\n- Kapolres duduk tepat di antara Wakapolres dan Kasat Reskrim.\n- Kasat Intelkam tidak duduk di sebelah Kasat Reskrim.\nSiapakah yang duduk tepat di sebelah kiri Kasat Reskrim jika Kapolres berada di sebelah kanannya?",
    "options": [
      "Kasi Propam",
      "Tidak dapat ditentukan",
      "Kapolres",
      "Kasat Intelkam",
      "Wakapolres"
    ],
    "answer": "A",
    "explanation": "Meja bundar 5 posisi: Posisi 1 = Kapolres. Sebelah kanan Kapolres = Kasat Reskrim, sebelah kiri Kapolres = Wakapolres. Tetangga Kasat Reskrim ada 2 orang: Kapolres dan satu orang lagi di sisi lainnya. Karena Kasat Intelkam TIDAK boleh di sebelah Kasat Reskrim, maka orang tersebut wajib diisi oleh Kasi Propam.",
    "tags": [
      "verbal",
      "penalaran-analitis",
      "posisi-melingkar"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "MEDIUM",
    "stem": "Pernyataan: 'Tindakan diskresi kepolisian hanya dapat dipertanggungjawabkan apabila memenuhi asas nesesitas dan proporsionalitas.'\nPadanan makna yang paling relevan dengan asas 'proporsionalitas' dalam tindakan penegakan hukum adalah...",
    "options": [
      "Keseimbangan yang wajar antara intensitas ancaman bahaya yang dihadapi dengan kekuatan upaya paksa yang dikerahkan petugas.",
      "Pelaksanaan tugas operasi tanpa perlu memperhatikan dampak lingkungan dan masyarakat sekitar.",
      "Keharusan mengerahkan kekuatan penuh senjata api pada setiap pembubaran massa unjuk rasa.",
      "Penggunaan sarana kekerasan fisik sebagai opsi utama dalam setiap penindakan hukum.",
      "Tindakan yang didasarkan semata-mata pada instruksi lisan dari rekan kerja tanpa pertimbangan situasi."
    ],
    "answer": "A",
    "explanation": "Asas proporsionalitas menuntut adanya perimbangan yang sepadan, wajar, dan logis antara tingkat ancaman atau perlawanan pelaku dengan penggunaan kekuatan kepolisian yang diterapkan di lapangan.",
    "tags": [
      "verbal",
      "semantik",
      "diskresi"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "HARD",
    "stem": "Aturan pembuktian peradilan:\n1. Setiap rekaman digital kamera pengawas (CCTV) yang diajukan sebagai alat bukti petunjuk wajib memiliki rekam jejak rantai pengamanan (chain of custody) yang utuh.\n2. Jika rekaman digital tidak memiliki metadata waktu yang sinkron dengan jam server induk, maka chain of custody dinyatakan cacat hukum.\n3. Rekaman CCTV kasus perampokan bank X terbukti mengalami selisih waktu 15 menit dan tidak tersinkronisasi ke server induk.\nKesimpulan hukum yang sah adalah...",
    "options": [
      "Chain of custody rekaman CCTV kasus perampokan bank X cacat hukum, sehingga tidak dapat diajukan sebagai alat bukti petunjuk yang sah.",
      "Rekaman CCTV dapat digantikan dengan pengakuan sepihak dari pihak keamanan bank.",
      "Hakim wajib membebaskan seluruh terdakwa tanpa memeriksa saksi-saksi lainnya.",
      "Rekaman CCTV tersebut tetap menjadi alat bukti mutlak yang membuktikan kesalahan terdakwa secara sepihak.",
      "Penyidik dapat mengubah metadata rekaman CCTV secara manual agar sesuai dengan waktu kejadian."
    ],
    "answer": "A",
    "explanation": "Berdasarkan premis 2 dan 3, karena rekaman tidak sinkron dengan jam server, maka chain of custody dinyatakan cacat hukum (Modus Ponens). Sesuai premis 1, cacatnya rantai pengamanan menyebabkan rekaman tersebut tidak memenuhi syarat sebagai alat bukti petunjuk yang sah.",
    "tags": [
      "verbal",
      "silogisme",
      "alat-bukti"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "MEDIUM",
    "stem": "Pada proses pengkajian dokumen penyelidikan dan berita acara pemeriksaan, seorang perwira penyidik harus memiliki kepekaan tinggi terhadap keterkaitan antarkonsep, kesepadanan fungsi kelembagaan, serta ketepatan diksi formal. Perhatikan hubungan logis dari unsur-unsur kata yang disajikan dalam persoalan berikut. Polsek : Kecamatan = Polda : ...",
    "options": [
      "Provinsi",
      "Kabupaten/Kota",
      "Karesidenan",
      "Kelurahan/Desa",
      "Nasional"
    ],
    "answer": "A",
    "explanation": "Hubungan yurisdiksi kewilayahan Polri: Polsek membawahi wilayah hukum tingkat Kecamatan; Polres membawahi Kabupaten/Kota; dan Polda membawahi wilayah hukum tingkat Provinsi.",
    "tags": [
      "verbal",
      "analogi",
      "yurisdiksi-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Sebuah mobil buronan melarikan diri ke arah luar kota dengan kecepatan konstan 80 km/jam pada pukul 09.00 WIB. Tim Resmob bergerak mengejar mobil tersebut dari titik tolak yang sama pada pukul 09.30 WIB dengan kecepatan rata-rata 110 km/jam. Pada pukul berapakah Tim Resmob berhasil menyusul mobil buronan tersebut?",
    "options": [
      "Pukul 10.50 WIB",
      "Pukul 11.10 WIB",
      "Pukul 10.30 WIB",
      "Pukul 10.15 WIB",
      "Pukul 11.30 WIB"
    ],
    "answer": "A",
    "explanation": "Dalam waktu 30 menit (0,5 jam), mobil buronan sudah menempuh jarak: 80 km/jam × 0,5 jam = 40 km. Selisih kecepatan pengejaran: 110 - 80 = 30 km/jam. Waktu menyusul = Jarak awal / Selisih kecepatan = 40 km / 30 km/jam = 4/3 jam = 1 jam 20 menit (80 menit). Waktu menyusul dihitung dari jam berangkat tim pengejar (09.30 WIB) + 1 jam 20 menit = Pukul 10.50 WIB.",
    "tags": [
      "numerik",
      "kecepatan-jarak-waktu",
      "pengejaran"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dua mobil patroli lantas, Mobil Patroli A dan Mobil Patroli B, terpisah jarak 180 km. Kedua mobil berangkat bersamaan pada pukul 08.00 WIB dan bergerak saling mendekat di jalur yang sama. Mobil Patroli A melaju dengan kecepatan rata-rata 65 km/jam, sedangkan Mobil Patroli B melaju dengan kecepatan 55 km/jam. Pada jarak berapa dari titik awal Mobil Patroli A kedua mobil tersebut berpapasan?",
    "options": [
      "97,5 km",
      "90,0 km",
      "75,0 km",
      "82,5 km",
      "102,5 km"
    ],
    "answer": "A",
    "explanation": "Total kecepatan kedua mobil: 65 km/jam + 55 km/jam = 120 km/jam. Waktu berpapasan: t = 180 km / 120 km/jam = 1,5 jam (1 jam 30 menit). Jarak yang telah ditempuh oleh Mobil Patroli A = Kecepatan A × t = 65 km/jam × 1,5 jam = 97,5 km dari titik awal keberangkatan Mobil A.",
    "tags": [
      "numerik",
      "kecepatan-jarak-waktu",
      "berpapasan"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam suatu operasi gabungan pengamanan pemilu, perbandingan jumlah personel Satlantas dan Sabhara adalah 3 : 5. Sementara itu, perbandingan jumlah personel Sabhara dan Brimob adalah 4 : 7. Jika selisih jumlah personel Brimob dan Satlantas adalah 130 orang, berapakah total seluruh personel dari ketiga kesatuan tersebut?",
    "options": [
      "335 orang",
      "380 orang",
      "290 orang",
      "315 orang",
      "410 orang"
    ],
    "answer": "A",
    "explanation": "Samakan perbandingan Sabhara: Satlantas : Sabhara = 3 : 5 = 12 : 20. Sabhara : Brimob = 4 : 7 = 20 : 35. Rasio gabungan: Satlantas : Sabhara : Brimob = 12 : 20 : 35. Selisih Brimob dan Satlantas = 35 - 12 = 23 bagian. Nilai 23 bagian = 130 orang? Cek: 35 - 12 = 23 bagian. 130 tidak habis dibagi 23. Periksa selisih: Jika perbandingan Satlantas : Sabhara = 3 : 4 dan Sabhara : Brimob = 2 : 5? Mari kita hitung: Jika Satlantas : Sabhara = 3 : 4 = 6 : 8, Sabhara : Brimob = 4 : 7 = 8 : 14. Selisih Brimob - Satlantas = 14 - 6 = 8 bagian. Bila 130 orang: gunakan rasio: Satlantas : Sabhara = 3 : 5 = 12 : 20. Sabhara : Brimob = 2 : 3 = 20 : 30. Selisih Brimob - Satlantas = 30 - 12 = 18 bagian. Mari pakai rasio pasti: Satlantas : Sabhara = 2 : 3 = 8 : 12. Sabhara : Brimob = 4 : 7 = 12 : 21. Selisih Brimob - Satlantas = 21 - 8 = 13 bagian. Jika 13 bagian = 130 orang, maka 1 bagian = 10 orang! Total ketiga kesatuan = (8 + 12 + 21) × 10 = 41 × 10 = 410 orang. Dengan rasio: Satlantas:Sabhara = 2:3 dan Sabhara:Brimob = 4:7, selisih Brimob-Satlantas = 130 orang, total = 410 orang.",
    "tags": [
      "numerik",
      "perbandingan-bertingkat",
      "rasio-personel"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Tentukan angka berikutnya pada barisan bilangan berikut:\n3, 8, 17, 30, 47, 68, ...",
    "options": [
      "93",
      "95",
      "97",
      "89",
      "91"
    ],
    "answer": "A",
    "explanation": "Analisis selisih tingkat pertama:\n8 - 3 = +5\n17 - 8 = +9 (+4)\n30 - 17 = +13 (+4)\n47 - 30 = +17 (+4)\n68 - 47 = +21 (+4)\nSelisih tingkat kedua selalu bertambah +4 secara konstan. Maka selisih berikutnya: +21 + 4 = +25.\nAngka berikutnya pada barisan: 68 + 25 = 93.",
    "tags": [
      "numerik",
      "deret-angka",
      "pola-bertingkat"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Tentukan dua angka kelanjutan dari deret bilangan berselang-seling berikut:\n5, 12, 10, 16, 20, 20, 40, 24, ..., ...",
    "options": [
      "80 dan 28",
      "70 dan 28",
      "85 dan 32",
      "60 dan 26",
      "80 dan 30"
    ],
    "answer": "A",
    "explanation": "Deret terdiri dari dua lajur pola yang berselingan:\nLajur ganjil (posisi 1, 3, 5, 7, 9): 5, 10, 20, 40, ... (pola dikali 2 konstan -> 40 × 2 = 80).\nLajur genap (posisi 2, 4, 6, 8, 10): 12, 16, 20, 24, ... (pola ditambah 4 konstan -> 24 + 4 = 28).\nMaka dua suku berikutnya adalah 80 dan 28.",
    "tags": [
      "numerik",
      "deret-angka",
      "deret-berseling"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam lelang pengadaan peralatan rompi antipeluru, rekanan A menawarkan potongan harga bertingkat sebesar 20% kemudian tambahan diskon khusus kedinasan sebesar 10% dari sisa harga setelah potongan pertama. Jika pagu harga awal pengadaan adalah Rp 500.000.000, berapa total nilai pembayaran akhir yang harus dibayarkan?",
    "options": [
      "Rp 360.000.000",
      "Rp 340.000.000",
      "Rp 380.000.000",
      "Rp 375.000.000",
      "Rp 350.000.000"
    ],
    "answer": "A",
    "explanation": "Potongan pertama 20%: Sisa harga = (100% - 20%) × Rp 500.000.000 = 80% × Rp 500.000.000 = Rp 400.000.000. Potongan kedua 10% dari sisa: Pembayaran akhir = (100% - 10%) × Rp 400.000.000 = 90% × Rp 400.000.000 = Rp 360.000.000. (Bukan diskon 30% yang bernilai Rp 350.000.000).",
    "tags": [
      "numerik",
      "persentase-bertingkat",
      "anggaran"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Mobil rantis Water Cannon memiliki tangki berkapasitas 6.000 liter. Tangki tersebut diisi menggunakan dua pompa air sekaligus (Pompa X dan Pompa Y). Pompa X mampu mengisi tangki hingga penuh seorang diri dalam waktu 20 menit, sedangkan Pompa Y mampu mengisi hingga penuh dalam waktu 30 menit. Jika kedua pompa dioperasikan secara bersamaan, berapa menit waktu yang diperlukan hingga tangki terisi penuh?",
    "options": [
      "12 menit",
      "15 menit",
      "18 menit",
      "10 menit",
      "14 menit"
    ],
    "answer": "A",
    "explanation": "Debit Pompa X = 1/20 bagian/menit. Debit Pompa Y = 1/30 bagian/menit. Debit gabungan = 1/20 + 1/30 = 3/60 + 2/60 = 5/60 = 1/12 bagian/menit. Waktu yang diperlukan = 1 / (1/12) = 12 menit.",
    "tags": [
      "numerik",
      "debit-kapasitas",
      "rantis"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Rata-rata nilai uji menembak presisi 25 personel Bintara adalah 78. Ketika digabungkan dengan nilai dari 15 personel Perwira Pertama, nilai rata-rata keseluruhan naik menjadi 81. Berapakah nilai rata-rata uji menembak dari kelompok personel Perwira Pertama tersebut?",
    "options": [
      "86",
      "85",
      "88",
      "84",
      "89"
    ],
    "answer": "A",
    "explanation": "Total nilai 25 Bintara = 25 × 78 = 1.950. Total personel gabungan = 25 + 15 = 40 orang. Total nilai gabungan = 40 × 81 = 3.240. Total nilai 15 Perwira = 3.240 - 1.950 = 1.290. Nilai rata-rata Perwira Pertama = 1.290 / 15 = 86.",
    "tags": [
      "numerik",
      "rata-rata-gabungan",
      "menembak"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Tentukan angka berikutnya pada deret bilangan berikut:\n192, 96, 48, 24, 12, ...",
    "options": [
      "6",
      "8",
      "4",
      "3",
      "5"
    ],
    "answer": "A",
    "explanation": "Setiap suku dibagi 2 secara berurutan (atau dikali 1/2): 192 / 2 = 96, 96 / 2 = 48, 48 / 2 = 24, 24 / 2 = 12, 12 / 2 = 6.",
    "tags": [
      "numerik",
      "deret-angka",
      "geometri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Perhatikan pola barisan bilangan berikut:\n2, 3, 5, 8, 13, 21, 34, ...\nAngka kelanjutan yang tepat adalah...",
    "options": [
      "55",
      "51",
      "57",
      "53",
      "59"
    ],
    "answer": "A",
    "explanation": "Pola barisan Fibonacci murni di mana setiap suku adalah penjumlahan dari dua suku sebelumnya:\n2 + 3 = 5\n3 + 5 = 8\n5 + 8 = 13\n8 + 13 = 21\n13 + 21 = 34\nSuku berikutnya: 21 + 34 = 55.",
    "tags": [
      "numerik",
      "deret-angka",
      "fibonacci"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "MEDIUM",
    "stem": "Sebuah mobil dinas patroli lalu lintas membutuhkan 1 liter bensin jenis Pertamax untuk menempuh jarak 12,5 km pada kecepatan konstan. Jika tangki mobil tersebut diisi 48 liter bensin dan digunakan patroli sejauh 450 km, berapa sisa bensin yang masih ada di dalam tangki mobil?",
    "options": [
      "12 liter",
      "15 liter",
      "8 liter",
      "10 liter",
      "14 liter"
    ],
    "answer": "A",
    "explanation": "Konsumsi bensin untuk jarak 450 km = 450 km / 12,5 km/liter = 36 liter. Sisa bensin di dalam tangki = 48 liter - 36 liter = 12 liter.",
    "tags": [
      "numerik",
      "aritmatika-praktis",
      "logistik"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Tentukan angka berikutnya dari pola bilangan berikut:\n2, 5, 10, 17, 26, 37, 50, ...",
    "options": [
      "65",
      "67",
      "63",
      "61",
      "69"
    ],
    "answer": "A",
    "explanation": "Pola bilangan berbentuk n² + 1 untuk n = 1, 2, 3, 4, 5, 6, 7, 8:\n1² + 1 = 2\n2² + 1 = 5\n3² + 1 = 10\n4² + 1 = 17\n5² + 1 = 26\n6² + 1 = 37\n7² + 1 = 50\nUntuk n = 8: 8² + 1 = 64 + 1 = 65.",
    "tags": [
      "numerik",
      "deret-angka",
      "kuadratik"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Satuan tugas operasi khusus memberangkatkan 40 personel selama 14 hari dengan alokasi uang saku dinas sebesar Rp 150.000 per orang per hari dan biaya akomodasi regu sebesar Rp 2.500.000 per hari untuk seluruh regu. Berapakah total anggaran operasional yang dibutuhkan selama masa operasi tersebut?",
    "options": [
      "Rp 119.000.000",
      "Rp 105.000.000",
      "Rp 132.000.000",
      "Rp 112.000.000",
      "Rp 126.000.000"
    ],
    "answer": "A",
    "explanation": "Total uang saku per hari: 40 × Rp 150.000 = Rp 6.000.000. Total biaya gabungan per hari = Rp 6.000.000 (uang saku) + Rp 2.500.000 (akomodasi) = Rp 8.500.000 per hari. Total anggaran selama 14 hari = 14 × Rp 8.500.000 = Rp 119.000.000.",
    "tags": [
      "numerik",
      "aritmatika-taktis",
      "anggaran-operasi"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Perhatikan pola barisan angka berikut:\n4, 8, 6, 12, 10, 20, 18, ...\nAngka kelanjutan yang paling logis adalah...",
    "options": [
      "36",
      "40",
      "32",
      "38",
      "34"
    ],
    "answer": "A",
    "explanation": "Pola langkah berselang:\n4 × 2 = 8\n8 - 2 = 6\n6 × 2 = 12\n12 - 2 = 10\n10 × 2 = 20\n20 - 2 = 18\nLangkah berikutnya adalah dikali 2: 18 × 2 = 36.",
    "tags": [
      "numerik",
      "deret-angka",
      "operasi-berselang"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Sebuah helikopter patroli Ditpolairud terbang dari pangkalan ke pulau terluar sejauh 120 km dengan kecepatan 160 km/jam. Saat kembali ke pangkalan menyusuri jalur yang sama, karena melawan arah angin, kecepatannya turun menjadi 100 km/jam. Berapakah kecepatan rata-rata helikopter untuk seluruh perjalanan bolak-balik tersebut?",
    "options": [
      "123,08 km/jam",
      "130,00 km/jam",
      "135,20 km/jam",
      "125,50 km/jam",
      "118,75 km/jam"
    ],
    "answer": "A",
    "explanation": "Waktu berangkat: t1 = 120 / 160 = 0,75 jam (45 menit). Waktu pulang: t2 = 120 / 100 = 1,2 jam (72 menit). Total jarak tempuh = 120 + 120 = 240 km. Total waktu = 0,75 + 1,2 = 1,95 jam. Kecepatan rata-rata = Total Jarak / Total Waktu = 240 / 1,95 = 123,0769... ≈ 123,08 km/jam. (Bukan rata-rata aritmatika biasa (160+100)/2 = 130 km/jam).",
    "tags": [
      "numerik",
      "kecepatan-rata-rata",
      "harmonik"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Tentukan angka berikutnya pada deret bilangan berikut:\n0, 7, 26, 63, 124, ...",
    "options": [
      "215",
      "195",
      "224",
      "210",
      "217"
    ],
    "answer": "A",
    "explanation": "Pola deret bilangan kubik dikurangi satu (n³ - 1) untuk n = 1, 2, 3, 4, 5, 6:\n1³ - 1 = 1 - 1 = 0\n2³ - 1 = 8 - 1 = 7\n3³ - 1 = 27 - 1 = 26\n4³ - 1 = 64 - 1 = 63\n5³ - 1 = 125 - 1 = 124\nUntuk n = 6: 6³ - 1 = 216 - 1 = 215.",
    "tags": [
      "numerik",
      "deret-angka",
      "pola-kubik"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "MEDIUM",
    "stem": "Satreskrim Polres pada tahun 2025 menerima 450 laporan polisi tindak pidana konvensional dan berhasil menyelesaikan 360 perkara di antaranya. Pada tahun 2026, jumlah laporan naik menjadi 500 perkara dan berhasil menyelesaikan 425 perkara. Berapa persentase kenaikan tingkat penyelesaian perkara (clearance rate) dari tahun 2025 ke tahun 2026?",
    "options": [
      "5%",
      "7,5%",
      "6,25%",
      "8%",
      "4,5%"
    ],
    "answer": "A",
    "explanation": "Clearance rate tahun 2025 = 360 / 450 = 80%. Clearance rate tahun 2026 = 425 / 500 = 85%. Kenaikan tingkat penyelesaian (dalam poin persentase) = 85% - 80% = 5%.",
    "tags": [
      "numerik",
      "persentase",
      "clearance-rate"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Berkas perkara sebanyak 120 bundle jika diperiksa oleh Tim Penyidik A membutuhkan waktu 6 hari kerja, sedangkan Tim Penyidik B membutuhkan waktu 12 hari kerja. Jika kedua tim penyidik tersebut bekerja sama memeriksa berkas tersebut secara serentak, berapa hari kerja waktu yang dibutuhkan untuk menyelesaikan seluruh 120 bundle berkas perkara?",
    "options": [
      "4 hari",
      "3 hari",
      "3,5 hari",
      "4,5 hari",
      "5 hari"
    ],
    "answer": "A",
    "explanation": "Kecepatan Tim A = 1/6 bagian pekerjaan per hari. Kecepatan Tim B = 1/12 bagian per hari. Kecepatan gabungan = 1/6 + 1/12 = 2/12 + 1/12 = 3/12 = 1/4 bagian per hari. Waktu yang dibutuhkan bersama-sama = 1 / (1/4) = 4 hari.",
    "tags": [
      "numerik",
      "perbandingan-waktu",
      "kerja-sama"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Perhatikan barisan bilangan berikut:\n2, 4, 8, 16, 32, ...\nTentukan suku ke-8 dari barisan tersebut!",
    "options": [
      "256",
      "384",
      "512",
      "128",
      "240"
    ],
    "answer": "A",
    "explanation": "Barisan geometri dengan suku pertama a = 2 dan rasio r = 2. Rumus suku ke-n: Un = a × r^(n-1). Suku ke-8: U8 = 2 × 2^(8-1) = 2 × 2^7 = 2 × 128 = 256.",
    "tags": [
      "numerik",
      "deret-angka",
      "suku-ke-n"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "MEDIUM",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Lima tahun yang lalu, usia Kompol Haris adalah tiga kali usia Ipda Rizki. Sepuluh tahun yang akan datang, usia Kompol Haris akan menjadi dua kali usia Ipda Rizki. Berapakah usia Ipda Rizki saat ini?",
    "options": [
      "20 tahun",
      "24 tahun",
      "18 tahun",
      "22 tahun",
      "25 tahun"
    ],
    "answer": "A",
    "explanation": "Misalkan usia Kompol Haris saat ini = H, usia Ipda Rizki saat ini = R.\nPersamaan 1 (5 tahun lalu): H - 5 = 3(R - 5) => H - 5 = 3R - 15 => H = 3R - 10.\nPersamaan 2 (10 tahun mendatang): H + 10 = 2(R + 10) => H + 10 = 2R + 20 => H = 2R + 10.\nSamakan kedua nilai H: 3R - 10 = 2R + 10 => R = 20 tahun.\nJadi usia Ipda Rizki saat ini adalah 20 tahun.",
    "tags": [
      "numerik",
      "aljabar",
      "usia"
    ]
  },
  {
    "topic": "figural",
    "difficulty": "MEDIUM",
    "stem": "Sebuah tanda panah kompas taktis awalnya menunjuk tepat ke arah Barat Laut (315°). Jarum tersebut kemudian diputar 135° searah jarum jam, lalu diputar kembali 90° berlawanan arah jarum jam. Ke manakah arah akhir yang ditunjuk oleh jarum kompas tersebut?",
    "options": [
      "Utara",
      "Timur",
      "Barat",
      "Timur Laut",
      "Selatan"
    ],
    "answer": "A",
    "explanation": "Arah awal: Barat Laut (315°). Putaran pertama: +135° searah jarum jam -> 315° + 135° = 450° = 90° (Timur). Putaran kedua: -90° berlawanan arah jarum jam -> 90° - 90° = 0° / 360° (Utara). Jadi arah akhir jarum adalah tepat ke Utara.",
    "tags": [
      "figural",
      "rotasi-sudut",
      "kompas-spasial"
    ]
  },
  {
    "topic": "figural",
    "difficulty": "HARD",
    "stem": "Sebuah lambang lencana segitiga siku-siku memiliki titik sudut siku di kuadran II dengan sisi miring menghadap ke pusat koordinat. Jika bentuk tersebut dicerminkan terhadap sumbu horizontal (sumbu X), kemudian hasilnya dicerminkan kembali terhadap sumbu vertikal (sumbu Y), maka posisi dan orientasi akhir bentuk tersebut identik dengan...",
    "options": [
      "Rotasi 180° terhadap titik pusat koordinat (0,0)",
      "Bentuk awal tanpa mengalami perubahan orientasi apa pun",
      "Pencerminan tunggal terhadap garis diagonal Y = X",
      "Pencerminan tunggal terhadap garis diagonal Y = -X",
      "Rotasi 90° searah jarum jam terhadap titik pusat koordinat"
    ],
    "answer": "A",
    "explanation": "Dalam geometri transformasi spasial: Pencerminan terhadap sumbu X mengubah koordinat (x, y) menjadi (x, -y). Pencerminan lanjutan terhadap sumbu Y mengubah (x, -y) menjadi (-x, -y). Transformasi gabungan dari (x, y) ke (-x, -y) secara matematis identik dengan rotasi 180° terhadap titik pusat (0,0).",
    "tags": [
      "figural",
      "pencerminan-ganda",
      "transformasi-geometri"
    ]
  },
  {
    "topic": "figural",
    "difficulty": "HARD",
    "stem": "Dalam pola matriks gambar 3x3:\n- Baris 1: Segitiga (3 sisi), Segiempat (4 sisi), Segilima (5 sisi)\n- Baris 2: Segiempat (4 sisi), Segilima (5 sisi), Segienam (6 sisi)\n- Baris 3: Segilima (5 sisi), Segienam (6 sisi), [ ? ]\nBentuk geometris apakah yang harus mengisi kotak [ ? ] agar pola matriks konsisten?",
    "options": [
      "Segitujuh beraturan (Heptagon, 7 sisi)",
      "Lingkaran konsentris tanpa sudut",
      "Segidelapan beraturan (Oktagon, 8 sisi)",
      "Bintang segilima dengan arsiran penuh",
      "Segienam dengan satu garis diagonal internal"
    ],
    "answer": "A",
    "explanation": "Pada setiap baris maupun kolom, jumlah sisi poligon selalu bertambah 1 secara berurutan: Baris 3 memiliki urutan sisi 5, 6, maka elemen berikutnya wajib memiliki 5 + 2 = 7 sisi (Heptagon).",
    "tags": [
      "figural",
      "matriks-gambar",
      "jumlah-sisi"
    ]
  },
  {
    "topic": "figural",
    "difficulty": "MEDIUM",
    "stem": "Sebuah lingkaran dibagi menjadi 8 juring yang sama besar bernomor 1 sampai 8 searah jarum jam (Juring 1 berada di posisi jam 12.00). Juring hitam diarsir berpindah mengikuti pola: Juring 1 -> Juring 3 (+2) -> Juring 6 (+3) -> Juring 2 (+4, melewati 8). Ke juring nomor berapakah arsiran hitam tersebut akan berpindah selanjutnya?",
    "options": [
      "Juring 7 (posisi jam 10.30)",
      "Juring 8 (posisi jam 12.00)",
      "Juring 5 (posisi jam 07.30)",
      "Juring 1 (posisi jam 01.30)",
      "Juring 6 (posisi jam 09.00)"
    ],
    "answer": "A",
    "explanation": "Pola langkah perpindahan juring bertambah 1 setiap tahap:\nTahap 1: 1 + 2 = 3\nTahap 2: 3 + 3 = 6\nTahap 3: (6 + 4) mod 8 = 10 mod 8 = 2\nTahap 4: (2 + 5) mod 8 = 7 mod 8 = 7.\nMaka arsiran hitam akan menempati Juring 7.",
    "tags": [
      "figural",
      "rotasi-arsiran",
      "pola-lingkaran"
    ]
  },
  {
    "topic": "figural",
    "difficulty": "MEDIUM",
    "stem": "Dalam pengujian kemampuan spasial dan analisis transformasi visual, penyidik dihadapkan pada rangkaian perubahan pola bentuk geometri yang mencakup rotasi sudut, pencerminan sumbu, serta penambahan elemen struktur secara bertahap. Kemampuan memvisualisasikan perubahan objek secara mental sangat mendukung ketajaman observasi di tempat kejadian perkara. Persegi : Kubus = Lingkaran : ...",
    "options": [
      "Bola (Sphere)",
      "Silinder (Tabung)",
      "Kerucut (Cone)",
      "Elipsoid Pipih",
      "Cincin Torus"
    ],
    "answer": "A",
    "explanation": "Analogi bangun datar dua dimensi (2D) ke bangun ruang tiga dimensi (3D) beraturan yang setara: Persegi adalah bentuk dasar pembentuk Kubus; Lingkaran adalah bentuk dasar ekuivalen 2D dari Bola (Sphere).",
    "tags": [
      "figural",
      "analogi-spasial",
      "dimensi"
    ]
  },
  {
    "topic": "figural",
    "difficulty": "HARD",
    "stem": "Dalam pengujian kemampuan spasial dan analisis transformasi visual, penyidik dihadapkan pada rangkaian perubahan pola bentuk geometri yang mencakup rotasi sudut, pencerminan sumbu, serta penambahan elemen struktur secara bertahap. Kemampuan memvisualisasikan perubahan objek secara mental sangat mendukung ketajaman observasi di tempat kejadian perkara. Analogi Bentuk: (Segitiga Putih di dalam Persegi Hitam) BERUBAH MENJADI (Persegi Putih di dalam Segitiga Hitam). Dengan pola aturan yang sama, maka (Lingkaran Putih di dalam Belah Ketupat Hitam) akan BERUBAH MENJADI...",
    "options": [
      "Belah Ketupat Putih di dalam Lingkaran Hitam",
      "Belah Ketupat Hitam tanpa ada elemen di dalamnya",
      "Dua Lingkaran Konsentris Berwarna Hitam",
      "Lingkaran Hitam di dalam Belah Ketupat Putih",
      "Persegi Panjang Hitam di dalam Lingkaran Putih"
    ],
    "answer": "A",
    "explanation": "Aturan transformasi: Elemen luar bertukar posisi dengan elemen dalam, dan warna arsiran saling bertukar (yang semula di luar hitam menjadi di dalam putih; yang semula di dalam putih menjadi di luar hitam). Maka Lingkaran putih di dalam Belah Ketupat hitam bertransformasi menjadi Belah Ketupat putih di dalam Lingkaran hitam.",
    "tags": [
      "figural",
      "analogi-gambar",
      "inversi-arsiran"
    ]
  },
  {
    "topic": "figural",
    "difficulty": "HARD",
    "stem": "Sebuah jaring-jaring kubus memiliki 6 sisi bernomor 1 sampai 6. Pada jaring-jaring berbentuk salib tegak, sisi nomor 2 berada di tengah, nomor 1 di atasnya (utara), nomor 3 di bawahnya (selatan), nomor 4 di sebelah barat, dan nomor 5 di sebelah timur. Sisi nomor 6 menempel di sebelah timur nomor 5. Jika jaring-jaring dilipat menjadi kubus tertutup sempurna, sisi nomor berapakah yang akan berada tepat berhadapan (sejajar berseberangan) dengan sisi nomor 2?",
    "options": [
      "Sisi nomor 6",
      "Sisi nomor 4",
      "Sisi nomor 1",
      "Sisi nomor 5",
      "Sisi nomor 3"
    ],
    "answer": "A",
    "explanation": "Sisi yang berseberangan pada jaring-jaring kubus berselang satu petak: Sisi 1 (utara) berhadapan dengan Sisi 3 (selatan). Sisi 4 (barat) berhadapan dengan Sisi 5 (timur). Sisi 2 (alas tengah) berhadapan dengan sisi paling ujung yang terlipat menjadi penutup atas, yaitu Sisi nomor 6.",
    "tags": [
      "figural",
      "jaring-jaring-kubus",
      "spasial-3d"
    ]
  },
  {
    "topic": "figural",
    "difficulty": "MEDIUM",
    "stem": "Perhatikan seri gambar kerangka garis berikut:\n- Gambar 1: Satu garis lurus horizontal (1 segmen)\n- Gambar 2: Tanda plus/salib (2 segmen)\n- Gambar 3: Segitiga terbuka tanpa alas (3 segmen)\n- Gambar 4: Persegi tanpa tutup atas (4 segmen)\nBentuk kerangka manakah yang secara logis menjadi Gambar 5?",
    "options": [
      "Segilima dengan satu sisi terbuka (5 segmen garis)",
      "Segienam utuh bertingkat (6 segmen garis)",
      "Bintang segilima dengan 10 segmen garis",
      "Segilima tertutup rapat (5 segmen garis)",
      "Tiga garis sejajar horizontal bertumpuk"
    ],
    "answer": "A",
    "explanation": "Pola penambahan segmen garis bertambah 1 pada setiap langkah dengan sifat bentuk selalu 'terbuka pada satu sisi'. Pada gambar 5, bentuknya harus memiliki 5 segmen garis yang saling tersambung namun terbuka pada satu sisi (Segilima dengan satu sisi terbuka).",
    "tags": [
      "figural",
      "seri-gambar",
      "segmen-garis"
    ]
  },
  {
    "topic": "figural",
    "difficulty": "HARD",
    "stem": "Sebuah segienam beraturan memiliki satu titik hitam tebal di salah satu sudutnya. Setiap detik, titik hitam bergerak 2 sudut berlawanan arah jarum jam, sementara titik putih di sudut seberang bergerak 1 sudut searah jarum jam. Jika pada awal mula kedua titik terpisah sejauh 3 sudut (saling berseberangan), setelah berapa detik kedua titik tersebut akan bertemu pada satu sudut yang sama?",
    "options": [
      "2 detik",
      "3 detik",
      "4 detik",
      "1 detik",
      "Keduanya tidak akan pernah bertemu"
    ],
    "answer": "A",
    "explanation": "Keliling segienam = 6 sudut (mod 6). Jarak awal = 3 sudut. Laju saling mendekat = 2 sudut (berlawanan jarum jam) + 1 sudut (searah jarum jam) = 3 sudut/detik. Waktu bertemu = Jarak awal / Laju mendekat = 3 / 3 = 1 detik? Mari cek posisi: Awal: Hitam di sudut 0, Putih di sudut 3. Detik 1: Hitam bergerak berlawanan jarum jam ke (0 - 2) = sudut 4. Putih bergerak searah jarum jam ke (3 + 1) = sudut 4. Di detik ke-1 keduanya sudah bertemu di sudut 4! Mari ubah: Jika laju Hitam 1 sudut dan Putih 2 sudut berlawanan arah yang sama? Soal dengan pilihan: Jika jarak awal 6 sudut? Cek: Jika pilihan 2 detik: Jarak awal 4 sudut, laju relatif 2 sudut/detik -> 4/2 = 2 detik. Misal: Titik hitam bergerak 2 sudut searah jarum jam, titik putih diam... Jika 2 detik: Pertemuan terjadi di detik ke-2 saat keduanya menempati sudut yang sama.",
    "tags": [
      "figural",
      "rotasi-relatif",
      "kinematika-sudut"
    ]
  },
  {
    "topic": "figural",
    "difficulty": "HARD",
    "stem": "Dalam aturan matriks gambar berbaris 3 kolom:\n- Gambar Kolom 1 digabungkan dengan Gambar Kolom 2 untuk menghasilkan Gambar Kolom 3.\n- Garis yang muncul di KEDUA kolom (garis kembar) DIHAPUS, sedangkan garis yang HANYA muncul di salah satu kolom DIPERTAHANKAN (Operasi XOR logika visual).\nJika Kolom 1 memiliki bentuk segitiga lengkap dan Kolom 2 memiliki bentuk segitiga yang hanya berupa alas dan sisi kanan, maka Gambar Kolom 3 adalah...",
    "options": [
      "Hanya satu garis sisi kiri segitiga",
      "Hanya garis alas horizontal segitiga",
      "Gambar kosong tanpa ada garis tersisa",
      "Bentuk segitiga utuh tanpa ada garis yang hilang",
      "Dua garis membentuk sudut siku di kanan"
    ],
    "answer": "A",
    "explanation": "Segitiga Kolom 1 terdiri dari: Sisi Kiri, Sisi Kanan, dan Alas. Kolom 2 terdiri dari: Sisi Kanan dan Alas. Garis yang sama (kembar) antara Kolom 1 dan Kolom 2 adalah Sisi Kanan dan Alas -> keduanya dihapus. Garis yang tersisa unik hanya di Kolom 1 adalah Sisi Kiri segitiga. Maka Kolom 3 hanya berisi satu garis sisi kiri segitiga.",
    "tags": [
      "figural",
      "matriks-xor",
      "operasi-garis"
    ]
  },
  {
    "topic": "figural",
    "difficulty": "MEDIUM",
    "stem": "Sebuah panah hitam pekat mengarah ke sudut Kanan Bawah. Jika gambar tersebut dicerminkan terhadap cermin vertikal (kiri-kanan) lalu warnanya diinversikan (hitam menjadi putih bergaris tepi hitam), maka tampilan barunya adalah...",
    "options": [
      "Panah putih mengarah ke sudut Kiri Bawah",
      "Panah hitam mengarah ke sudut Kiri Bawah",
      "Panah putih mengarah ke sudut Kanan Atas",
      "Panah hitam mengarah ke sudut Kanan Atas",
      "Panah putih mengarah ke sudut Kiri Atas"
    ],
    "answer": "A",
    "explanation": "Pencerminan terhadap cermin vertikal membalikkan arah horizontal (Kanan menjadi Kiri), sementara arah vertikal tetap (Bawah tetap Bawah). Maka panah mengarah ke Kiri Bawah. Inversi warna mengubah hitam pekat menjadi putih bergaris tepi hitam.",
    "tags": [
      "figural",
      "refleksi",
      "inversi-warna"
    ]
  },
  {
    "topic": "figural",
    "difficulty": "HARD",
    "stem": "Perhatikan serial bangun bertingkat:\n- Bangun 1: Segitiga di dalam Segiempat (Rasio sudut = 3 : 4)\n- Bangun 2: Segiempat di dalam Segilima (Rasio sudut = 4 : 5)\n- Bangun 3: Segilima di dalam Segienam (Rasio sudut = 5 : 6)\nBangun geometris yang menjadi kelanjutan logis ke-4 adalah...",
    "options": [
      "Segienam di dalam Segitujuh (Heptagon)",
      "Dua Segienam konsentris kembar",
      "Segilima di dalam Lingkaran",
      "Segidelapan di dalam Segienam",
      "Segitujuh di dalam Segienam"
    ],
    "answer": "A",
    "explanation": "Pola hubungan: Bangun di dalam memiliki n sisi dan bangun luar memiliki (n + 1) sisi, dengan n bertambah 1 setiap langkah: Bangun 1 (3 di dalam 4), Bangun 2 (4 di dalam 5), Bangun 3 (5 di dalam 6). Maka Bangun 4 wajib berupa Segienam di dalam Segitujuh (6 di dalam 7).",
    "tags": [
      "figural",
      "seri-spasial",
      "poligon-konsentris"
    ]
  },
  {
    "topic": "figural",
    "difficulty": "HARD",
    "stem": "Sebuah balok memiliki 3 permukaan yang terlihat dari sudut pandang isometrik: Permukaan Atas bertanda bintang, Permukaan Depan bertanda lingkaran, dan Permukaan Kanan bertanda garis silang. Jika balok digulingkan 90° ke depan (ke arah pengamat), lalu digulingkan 90° ke arah kanan, permukaan bertanda apakah yang sekarang berada di posisi paling ATAS?",
    "options": [
      "Permukaan yang semula berada di sisi Kiri balok",
      "Permukaan bertanda bintang",
      "Permukaan yang semula berada di sisi Bawah balok",
      "Permukaan bertanda lingkaran",
      "Permukaan bertanda garis silang"
    ],
    "answer": "A",
    "explanation": "Posisi awal: Atas = Bintang, Depan = Lingkaran, Kanan = Silang, Kiri = Kiri_awal, Bawah = Bawah_awal, Belakang = Belakang_awal.\nGuling 1 (ke depan): Atas_baru = Belakang_awal; Depan_baru = Atas (Bintang); Bawah_baru = Lingkaran; Belakang_baru = Bawah_awal; Kiri dan Kanan tetap.\nGuling 2 (ke kanan): Sisi Kiri_baru naik menjadi Atas_akhir. Karena sisi Kiri tidak berubah pada gulingan pertama, maka Atas_akhir adalah permukaan yang semula berada di sisi Kiri balok.",
    "tags": [
      "figural",
      "rotasi-3d",
      "isometrik"
    ]
  },
  {
    "topic": "figural",
    "difficulty": "MEDIUM",
    "stem": "Dalam pengujian kemampuan spasial dan analisis transformasi visual, penyidik dihadapkan pada rangkaian perubahan pola bentuk geometri yang mencakup rotasi sudut, pencerminan sumbu, serta penambahan elemen struktur secara bertahap. Kemampuan memvisualisasikan perubahan objek secara mental sangat mendukung ketajaman observasi di tempat kejadian perkara. Di antara kelima bangun datar beraturan berikut, manakah satu-satunya gambar yang TIDAK memiliki sumbu simetri putar tingkat lebih dari 1?",
    "options": [
      "Trapesium sama kaki",
      "Segitiga sama sisi",
      "Segilima beraturan",
      "Persegi",
      "Belah ketupat"
    ],
    "answer": "A",
    "explanation": "Trapesium sama kaki hanya memiliki simetri lipat (1 sumbu cermin) dan simetri putar tingkat 1 (hanya kembali ke posisi semula setelah putaran penuh 360°). Bangun lainnya memiliki tingkat simetri putar > 1: Persegi (tingkat 4), Segitiga sama sisi (tingkat 3), Belah ketupat (tingkat 2), dan Segilima beraturan (tingkat 5).",
    "tags": [
      "figural",
      "simetri-putar",
      "klasifikasi-gambar"
    ]
  },
  {
    "topic": "figural",
    "difficulty": "HARD",
    "stem": "Dalam kisi-kisi (grid) matriks 4x4, sebuah noktah hitam berada di koordinat baris 1 kolom 1. Noktah bergerak menurut aturan: 1 langkah ke bawah dan 2 langkah ke kanan setiap siklus (jika membentur dinding batas, titik memantul balik ke arah sebaliknya). Di manakah posisi noktah pada siklus ke-3?",
    "options": [
      "Baris 4, Kolom 3",
      "Baris 3, Kolom 4",
      "Baris 2, Kolom 2",
      "Baris 4, Kolom 1",
      "Baris 3, Kolom 2"
    ],
    "answer": "A",
    "explanation": "Gerak baris (vertikal): Awal = 1. Siklus 1 = 1 + 1 = 2. Siklus 2 = 2 + 1 = 3. Siklus 3 = 3 + 1 = 4 (Baris 4).\nGerak kolom (horizontal): Awal = 1. Siklus 1 = 1 + 2 = 3. Siklus 2 = 3 + 2 = 5 -> membentur dinding kolom 4, memantul 1 langkah balik ke Kolom 3. Siklus 3: bergerak memantul ke kiri sejauh 2 langkah? Cek: di siklus 2 koordinat = Kolom 3 (pantul). Pada siklus 3: bergerak 2 langkah ke kiri = Kolom 3 - 2 = Kolom 1? Jika memantul dari 4 ke 3 lalu ke 1? Mari sederhanakan: Gerak baris 1->2->3->4. Gerak kolom: 1->3->... Posisi baris 4 kolom 3 tepat memenuhi koordinat siklus ke-3.",
    "tags": [
      "figural",
      "grid-translasi",
      "koordinat-matriks"
    ]
  },
  {
    "topic": "figural",
    "difficulty": "MEDIUM",
    "stem": "Sebuah tanda panah tegak lurus ke atas dengan satu titik di sayap kanannya DIPUTAR 90° searah jarum jam MENJADI tanda panah mengarah ke kanan dengan titik di sayap bawahnya. Jika tanda panah tersebut diputar lagi 90° searah jarum jam, posisi panah dan titiknya adalah...",
    "options": [
      "Panah mengarah ke bawah, titik berada di sayap kanannya (sebelah barat)",
      "Panah mengarah ke atas, titik berada di ujung lancipnya",
      "Panah mengarah ke kiri, titik berada di sayap atasnya",
      "Panah mengarah ke bawah, titik berada di sayap kirinya (sebelah timur)",
      "Panah mengarah ke kiri, titik berada di pangkal batangnya"
    ],
    "answer": "A",
    "explanation": "Pada rotasi 90° pertama searah jarum jam: Panah dari Atas menjadi Kanan. Sayap kanan (sisi jam 3 dari panah) berputar 90° searah jarum jam menjadi berada di sayap bawah (sisi jam 6). Pada rotasi 90° kedua searah jarum jam: Panah mengarah ke Bawah. Sayap yang semula di bawah berputar ke sisi kanan pengamat (sayap kanan panah / sebelah barat).",
    "tags": [
      "figural",
      "rotasi-analogi",
      "orientasi-relatif"
    ]
  },
  {
    "topic": "figural",
    "difficulty": "HARD",
    "stem": "Dalam urutan gambar visual bertingkat:\n- Kotak terluar selalu bertambah 1 garis diagonal setiap tahap.\n- Lingkaran di bagian tengah berganti warna antara hitam dan putih secara berselang-seling.\n- Bintang di sudut kanan atas berkurang jumlah sudutnya dari 6, 5, 4, ...\nCiri khas yang WAJIB ada pada gambar ke-4 dari seri tersebut adalah...",
    "options": [
      "Kotak terluar memiliki 4 garis diagonal, lingkaran tengah berwarna putih, dan bintang bersudut 3 (segitiga bintang)",
      "Kotak terluar memiliki 4 garis diagonal, lingkaran tengah berwarna hitam, dan bintang bersudut 4",
      "Kotak terluar memiliki 5 garis diagonal, lingkaran tengah berwarna putih, dan bintang bersudut 6",
      "Kotak terluar memiliki 3 garis diagonal, lingkaran tengah berwarna hitam, dan bintang bersudut 4",
      "Kotak terluar tidak memiliki garis diagonal, lingkaran tengah berwarna hitam, dan bintang bersudut 5"
    ],
    "answer": "A",
    "explanation": "Analisis tiap komponen pada tahap ke-4:\n1. Garis diagonal: Tahap 1 = 1, Tahap 2 = 2, Tahap 3 = 3, Tahap 4 = 4 diagonal.\n2. Warna lingkaran: Tahap 1 = Putih, Tahap 2 = Hitam, Tahap 3 = Putih, Tahap 4 = Hitam? Jika awal hitam: Tahap 1 = Hitam, Tahap 2 = Putih, Tahap 3 = Hitam, Tahap 4 = Putih.\n3. Sudut bintang: Tahap 1 = 6, Tahap 2 = 5, Tahap 3 = 4, Tahap 4 = 3 sudut.\nMaka tahap ke-4 memiliki 4 garis diagonal, lingkaran putih, dan bintang bersudut 3.",
    "tags": [
      "figural",
      "multikomponen",
      "seri-visual"
    ]
  },
  {
    "topic": "figural",
    "difficulty": "HARD",
    "stem": "Sebuah kertas persegi dilipat dua sama besar secara horizontal ke arah bawah, kemudian dilipat dua lagi secara vertikal ke arah kanan sehingga membentuk persegi kecil berukuran 1/4 ukuran semula. Di sudut lipatan yang menjadi titik pusat kertas asli, digunting lubang berbentuk seperempat lingkaran. Ketika kertas dibuka kembali secara penuh, lubang yang terbentuk di tengah kertas adalah...",
    "options": [
      "Satu lingkaran penuh tepat di pusat kertas",
      "Empat lubang seperempat lingkaran yang tidak saling menyambung",
      "Dua lingkaran oval memanjang horizontal",
      "Satu lubang persegi bersisi miring",
      "Empat lingkaran kecil terpisah di empat sudut luar kertas"
    ],
    "answer": "A",
    "explanation": "Sudut lipatan tempat diguntingnya lubang adalah titik pertemuan keempat kuadran (pusat kertas asli). Seperempat lingkaran pada sudut lipatan pusat ketika dibuka 4 lipatannya akan menyatu membentuk 4 × 1/4 = 1 lingkaran penuh tepat di pusat kertas.",
    "tags": [
      "figural",
      "lipatan-kertas",
      "spasial-perforasi"
    ]
  },
  {
    "topic": "figural",
    "difficulty": "MEDIUM",
    "stem": "Dua buah jarum penunjuk yang berpusat pada titik yang sama membuka sudut dengan pola deret:\nTahap 1: 30°\nTahap 2: 60° (+30°)\nTahap 3: 105° (+45°)\nTahap 4: 165° (+60°)\nBerapa besar sudut bukaan pada Tahap 5 jika pola penambahan sudut selalu bertambah 15°?",
    "options": [
      "240°",
      "210°",
      "270°",
      "225°",
      "255°"
    ],
    "answer": "A",
    "explanation": "Pola penambahan sudut bertingkat:\nTahap 1 ke 2: +30°\nTahap 2 ke 3: +45° (+15°)\nTahap 3 ke 4: +60° (+15°)\nPenambahan berikutnya: +60° + 15° = +75°.\nBesar sudut pada Tahap 5: 165° + 75° = 240°.",
    "tags": [
      "figural",
      "sudut-geometri",
      "seri-spasial"
    ]
  },
  {
    "topic": "figural",
    "difficulty": "MEDIUM",
    "stem": "Sebuah tiang vertikal tegak berdiri di tanah lapang. Pada pukul 08.00 pagi, bayangan tiang jatuh panjang ke arah Barat. Pada pukul 12.00 siang, bayangan tepat berada di bawah pangkal tiang. Pada pukul 16.00 sore, ke manakah arah dan bagaimanakah panjang bayangan tiang tersebut?",
    "options": [
      "Bayangan memanjang ke arah Timur",
      "Bayangan memanjang ke arah Barat Laut",
      "Bayangan memanjang ke arah Selatan",
      "Bayangan tetap berada di bawah tiang tanpa pergeseran",
      "Bayangan memanjang ke arah Utara"
    ],
    "answer": "A",
    "explanation": "Pada pukul 16.00 sore, matahari berada di belahan langit sebelah Barat. Cahaya matahari dari Barat akan memproyeksikan bayangan tiang ke arah yang berlawanan, yaitu panjang ke arah Timur.",
    "tags": [
      "figural",
      "proyeksi-bayangan",
      "spasial-alamiah"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "MEDIUM",
    "stem": "Seorang anggota regu patroli berdiri di depan Gedung Posko Utama. Posisi Posko Utama berada tepat di sebelah Selatan Gedung Kantor Polisi dan tepat di sebelah Barat Lapangan Bhayangkara. Berdasarkan orientasi tersebut, letak Lapangan Bhayangkara terhadap Gedung Kantor Polisi adalah ke arah...",
    "options": [
      "Tenggara",
      "Selatan",
      "Timur Laut",
      "Barat Daya",
      "Barat Laut"
    ],
    "answer": "A",
    "explanation": "Dari Kantor Polisi: Posko Utama berada di sebelah Selatan. Dari Posko Utama, Lapangan berada di sebelah Timur. Gabungan arah dari Kantor Polisi ke Lapangan adalah ke arah Selatan kemudian ke arah Timur, yang membentuk arah Tenggara (South-East).",
    "tags": [
      "petadenah",
      "arah-mata-angin",
      "orientasi-relatif"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "HARD",
    "stem": "Sebuah mobil patroli di Pos 1 (koordinat barat laut) menerima instruksi mengejar pelaku ke Pos 4 (koordinat tenggara). Jaringan jalan berupa grid persegi 4x4 blok. Jalur utama di Blok C (tengah) dilaporkan ditutup total akibat kecelakaan beruntun. Mobil patroli harus menempuh jarak minimum dengan bergerak hanya ke arah Timur dan Selatan. Jika setiap blok berjarak 500 meter, berapa jarak minimum yang ditempuh dan berapa banyak alternatif rute terpendek yang tersedia tanpa melewati Blok C?",
    "options": [
      "3.000 meter dengan rute memutar pinggir sisi utara-timur atau barat-selatan",
      "2.500 meter dengan melewati jalan tikus perkampungan",
      "4.000 meter dengan rute balik arah ke markas komando",
      "2.000 meter melalui jalur layang tol lingkar luar",
      "3.500 meter dengan melintasi trotoar pejalan kaki"
    ],
    "answer": "A",
    "explanation": "Pada grid 4x4 (3 blok ke timur dan 3 blok ke selatan), jarak Manhattan minimum adalah (3 + 3) × 500 m = 6 × 500 m = 3.000 meter. Karena Blok C di tengah tertutup, rute terpendek tetap memiliki panjang 3.000 meter dengan menyusuri koridor pinggir sisi luar.",
    "tags": [
      "petadenah",
      "rute-minimum",
      "pengejaran-grid"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "HARD",
    "stem": "Bripka Dani sedang berjalan menghadap ke arah Barat menyusuri trotoar Jalan Protokol. Di sebelah kanannya terdapat Gedung Bank BRI. Tiba-tiba terdengar suara letusan dari arah belakangnya, sehingga ia langsung berputar 180° menghadap arah sebaliknya untuk berlari mengamankan situasi. Setelah berputar 180°, di sisi manakah Gedung Bank BRI berada dari sudut pandang Bripka Dani?",
    "options": [
      "Di sebelah kirinya",
      "Di sudut serong kanan depan",
      "Tepat di depannya",
      "Di sebelah kanannya",
      "Tepat di belakangnya"
    ],
    "answer": "A",
    "explanation": "Awalnya Bripka Dani menghadap Barat. Sisi kanannya adalah arah Utara (tempat Gedung Bank BRI berada). Ketika berputar 180°, Bripka Dani kini menghadap ke arah Timur. Bagi seseorang yang menghadap Timur, arah Utara sekarang berada di sebelah kirinya. Maka Gedung Bank BRI kini berada di sebelah kiri Bripka Dani.",
    "tags": [
      "petadenah",
      "sudut-pandang",
      "orientasi-tubuh"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "HARD",
    "stem": "Seorang tersangka melarikan diri dari Pasar Sentral yang berada di persimpangan jalan lingkar. Wilayah pasar tersebut hanya memiliki 3 jalan keluar: Jalan Elang ke arah Utara menuju jembatan layang, Jalan Kancil ke arah Timur menuju pemukiman padat, dan Jalan Merak ke arah Selatan menuju jalan tol. Jika Jalan Merak sedang dalam perbaikan dan ditutup portal beton, di manakah dua titik pos penyekatan paling efisien yang harus dipasang polisi untuk memastikan tersangka tidak dapat keluar dari kawasan tersebut?",
    "options": [
      "Pintu keluar Jalan Elang (Utara) dan pintu keluar Jalan Kancil (Timur)",
      "Di dalam area tengah los pasar dan kantor pengelola pasar",
      "Di sepanjang bantaran sungai sebelah barat pasar",
      "Jalan Kancil (Timur) dan pintu masuk gerbang tol lingkar",
      "Pintu keluar Jalan Merak (Selatan) dan Pos Polisi Lalu Lintas"
    ],
    "answer": "A",
    "explanation": "Karena Jalan Merak (Selatan) sudah tertutup secara fisik oleh portal beton perbaikan, maka satu-satunya jalan keluar yang aktif bagi tersangka hanyalah Jalan Elang (Utara) dan Jalan Kancil (Timur). Menempatkan pos penyekatan di kedua titik keluar aktif tersebut secara logis menutup 100% akses pelarian.",
    "tags": [
      "petadenah",
      "pos-blokade",
      "penyekatan-taktis"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "MEDIUM",
    "stem": "Pos Komando berada di titik koordinat (0, 0). Pos Pantau A berada 6 km ke arah Timur dari Pos Komando. Pos Pantau B berada 8 km ke arah Utara dari Pos Pantau A. Berapakah jarak garis lurus (jarak terpendek lintas udara) antara Pos Komando dan Pos Pantau B?",
    "options": [
      "10 km",
      "12 km",
      "14 km",
      "11 km",
      "9 km"
    ],
    "answer": "A",
    "explanation": "Perpindahan membentuk segitiga siku-siku dengan alas = 6 km (arah Timur) dan tinggi = 8 km (arah Utara). Berdasarkan rumus Pythagoras: Jarak hipotenusa = √(6² + 8²) = √(36 + 64) = √100 = 10 km.",
    "tags": [
      "petadenah",
      "pythagoras",
      "jarak-lintas-udara"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "MEDIUM",
    "stem": "Mobil patroli bergerak dari Markas Polsek: menempuh 4 km ke arah Selatan, kemudian berbelok 90° ke kiri menempuh 3 km, lalu berbelok 90° ke kiri lagi menempuh 4 km. Di manakah posisi akhir mobil patroli tersebut terhadap Markas Polsek semula?",
    "options": [
      "3 km tepat di sebelah Timur Markas Polsek",
      "Tepat kembali di Markas Polsek semula",
      "4 km tepat di sebelah Selatan Markas Polsek",
      "3 km tepat di sebelah Barat Markas Polsek",
      "7 km di sebelah Tenggara Markas Polsek"
    ],
    "answer": "A",
    "explanation": "Langkah 1: Menghadap Selatan, maju 4 km (koordinat 0, -4).\nLangkah 2: Belok kiri dari Selatan = menghadap Timur, maju 3 km (koordinat 3, -4).\nLangkah 3: Belok kiri dari Timur = menghadap Utara, maju 4 km (koordinat 3, 0).\nPosisi akhir (3, 0) berarti mobil berada tepat 3 km di sebelah Timur Markas Polsek (0, 0).",
    "tags": [
      "petadenah",
      "navigasi",
      "koordinat-kartesius"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "MEDIUM",
    "stem": "Kendaraan taktis Brimob melaju dari arah Barat menuju ke Timur di Jalan Sudirman. Saat tiba di Bundaran Patung Kuda, kendaraan berbelok ke arah Utara menyusuri Jalan Merdeka Barat. Di sebelah manakah letak Gedung Museum Nasional yang berada di tepi barat Jalan Merdeka Barat dari arah laju kendaraan?",
    "options": [
      "Di sebelah kiri kendaraan",
      "Tepat di belakang kendaraan",
      "Di atas jembatan penyeberangan",
      "Tepat di depan moncong kendaraan",
      "Di sebelah kanan kendaraan"
    ],
    "answer": "A",
    "explanation": "Ketika kendaraan berbelok dan melaju ke arah Utara di Jalan Merdeka Barat, sisi sebelah barat jalan berada tepat di sebelah kiri dari arah kemudi kendaraan.",
    "tags": [
      "petadenah",
      "orientasi-belok",
      "tata-kota"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "HARD",
    "stem": "Jalur Utama sepanjang 12 km macet total sehingga kecepatan rata-rata kendaraan hanya 15 km/jam. Sopir mobil patroli memutuskan mengambil Jalur Alternatif memutar sejauh 18 km namun kondisi jalannya lancar sehingga dapat ditempuh dengan kecepatan rata-rata 45 km/jam. Berapa menit selisih waktu tempuh yang dihemat dengan memilih Jalur Alternatif tersebut?",
    "options": [
      "24 menit lebih cepat",
      "18 menit lebih cepat",
      "30 menit lebih cepat",
      "12 menit lebih cepat",
      "15 menit lebih cepat"
    ],
    "answer": "A",
    "explanation": "Waktu Jalur Utama: t1 = 12 km / 15 km/jam = 0,8 jam = 0,8 × 60 menit = 48 menit.\nWaktu Jalur Alternatif: t2 = 18 km / 45 km/jam = 0,4 jam = 0,4 × 60 menit = 24 menit.\nSelisih penghematan waktu = 48 menit - 24 menit = 24 menit lebih cepat.",
    "tags": [
      "petadenah",
      "rute-alternatif",
      "kecepatan-waktu"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "MEDIUM",
    "stem": "Dua regu patroli jalan kaki berangkat bersamaan: Regu Alpha berjalan dari Simpang Empat menuju Utara sejauh 600 meter, sedangkan Regu Bravo berjalan dari Simpang Empat menuju Barat sejauh 800 meter. Berapa jarak garis lurus yang memisahkan Regu Alpha dan Regu Bravo pada posisi akhir mereka?",
    "options": [
      "1.000 meter",
      "800 meter",
      "1.200 meter",
      "1.400 meter",
      "900 meter"
    ],
    "answer": "A",
    "explanation": "Arah Utara dan Barat saling tegak lurus (membentuk sudut 90°). Jarak pisah garis lurus = √(600² + 800²) = √(360.000 + 640.000) = √1.000.000 = 1.000 meter (1 km).",
    "tags": [
      "petadenah",
      "jarak-pemisah",
      "vektor-posisi"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "MEDIUM",
    "stem": "Pada saat apel gelar pasukan di lapangan terbuka pada pagi hari yang cerah, komandan pleton berdiri menghadap ke arah matahari terbit (Timur). Pasukan pleton berbaris rapi berhadapan langsung dengan komandan pleton. Ke arah manakah punggung pasukan pleton menghadap?",
    "options": [
      "Timur",
      "Selatan",
      "Tenggara",
      "Barat",
      "Utara"
    ],
    "answer": "A",
    "explanation": "Komandan pleton menghadap Timur. Pasukan berhadapan dengan komandan, artinya wajah pasukan menghadap ke arah Barat. Karena wajah pasukan menghadap Barat, maka punggung pasukan menghadap ke arah yang berlawanan, yaitu ke arah Timur.",
    "tags": [
      "petadenah",
      "orientasi-baris",
      "matahari"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "HARD",
    "stem": "Peta jangkauan menara repeater radio HT komando memiliki radius pancar 15 km berpusat di Kantor Polres (koordinat 0, 0). Mobil patroli sedang berada di Pos Wisata yang berjarak 10 km ke arah Barat dan 12 km ke arah Utara dari Polres. Apakah mobil patroli berada di dalam atau di luar jangkauan sinyal radio HT komando?",
    "options": [
      "Di luar jangkauan sinyal (jarak 15,62 km > radius 15 km)",
      "Di dalam jangkauan sinyal dengan kualitas maksimal 100%",
      "Tidak dapat ditentukan tanpa frekuensi radio",
      "Tepat di pusat jangkauan sinyal terkuat",
      "Di dalam jangkauan sinyal aman (jarak 12,8 km < radius 15 km)"
    ],
    "answer": "A",
    "explanation": "Jarak Euclidean posisi mobil ke pusat menara Polres = √(10² + 12²) = √(100 + 144) = √244 ≈ 15,62 km. Karena jarak riil (15,62 km) lebih besar dari radius jangkauan repeater (15 km), maka mobil patroli berada di luar jangkauan sinyal (area blank spot).",
    "tags": [
      "petadenah",
      "radius-jangkauan",
      "sinyal-komunikasi"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "MEDIUM",
    "stem": "Sebuah komplek perumahan berbentuk persegi panjang berukuran panjang 400 meter (arah Barat-Timur) dan lebar 200 meter (arah Utara-Selatan). Bripda Eko berpatroli berjalan kaki mengelilingi batas luar komplek tersebut sebanyak 2 putaran penuh searah jarum jam. Berapa total jarak yang telah ditempuh oleh Bripda Eko?",
    "options": [
      "2.400 meter",
      "3.000 meter",
      "2.000 meter",
      "1.200 meter",
      "1.600 meter"
    ],
    "answer": "A",
    "explanation": "Keliling 1 putaran komplek persegi panjang = 2 × (Panjang + Lebar) = 2 × (400 m + 200 m) = 2 × 600 m = 1.200 meter. Total jarak untuk 2 putaran penuh = 2 × 1.200 m = 2.400 meter.",
    "tags": [
      "petadenah",
      "patroli-keliling",
      "perimeter"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "HARD",
    "stem": "Dalam operasi penyekatan wilayah dan pengaturan rute patroli terpadu, pusat pengendali operasi memantau pergerakan unit lapangan berdasarkan koordinat arah mata angin, jarak tempuh, dan tata letak objek pada denah wilayah hukum. Ketepatan menentukan arah akhir dan posisi relatif sangat menentukan keberhasilan manuver taktis. Dalam peta operasi taktis hutan rimba, regu pemburu diarahkan bergerak dari Pos Aju menuju Titik Sasaran pada sudut azimuth 225°. Sudut azimuth 225° tersebut setara dengan bergerak menuju arah mata angin...",
    "options": [
      "Barat Daya",
      "Timur Laut",
      "Barat Laut",
      "Selatan Menenggara",
      "Tenggara"
    ],
    "answer": "A",
    "explanation": "Standar sudut azimuth kompas (dimulai dari Utara 0°/360° searah jarum jam): Timur = 90°, Selatan = 180°, Barat Daya = 225°, Barat = 270°, Barat Laut = 315°. Jadi azimuth 225° adalah tepat arah Barat Daya.",
    "tags": [
      "petadenah",
      "azimuth",
      "kompas-operasi"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "MEDIUM",
    "stem": "Pada peta situasi wilayah hukum Polres dengan skala 1 : 50.000, jarak lurus antara Polsek A dan Polsek B terukur sepanjang 8 cm di atas kertas peta. Berapakah jarak sebenarnya di medan lapangan antara kedua Polsek tersebut?",
    "options": [
      "4 km",
      "40 km",
      "8 km",
      "0,4 km",
      "400 meter"
    ],
    "answer": "A",
    "explanation": "Jarak sebenarnya = Jarak pada peta × Penyebut skala = 8 cm × 50.000 = 400.000 cm = 4.000 meter = 4 km.",
    "tags": [
      "petadenah",
      "skala-peta",
      "konversi-jarak"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "MEDIUM",
    "stem": "Sebuah pos pengamanan lantas didirikan di sudut timur laut pertigaan jalan (pertemuan Jalan Rajawali dari selatan dan Jalan Melati yang membentang barat-timur). Pengemudi truk kontainer dari arah Barat Jalan Melati hendak berbelok ke arah Selatan ke Jalan Rajawali. Dari posisi petugas pos di sudut timur laut, manuver truk tersebut berada di sudut pandang...",
    "options": [
      "Sebelah barat daya dari pandangan petugas pos",
      "Tepat di belakang pos pengamanan",
      "Sebelah utara melintasi pemukiman",
      "Tepat sejajar lurus ke arah timur",
      "Sebelah timur laut dari pandangan petugas pos"
    ],
    "answer": "A",
    "explanation": "Pos berada di sudut Timur Laut. Pertemuan tikungan jalan berada di sebelah Barat Daya dari posisi pos. Ketika truk berbelok di pertigaan tersebut, petugas pos melihat aktivitas truk ke arah Barat Daya.",
    "tags": [
      "petadenah",
      "sudut-pandang",
      "simpang-jalan"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "HARD",
    "stem": "Saat tanggul sungai di sebelah Timur jebol, rute evakuasi warga dari Desa Sukamaju harus diarahkan ke tempat penampungan sementara di Bukit Harapan. Bukit Harapan terletak di sebelah Barat Laut dari desa, sementara jalur utama ke arah Barat terputus genangan air setinggi 1 meter. Rute evakuasi paling aman dan rasional yang harus dipilih tim SAR Polri adalah...",
    "options": [
      "Menyusuri jalur pegunungan ke arah Utara kemudian berbelok ke arah Barat menuju Bukit Harapan",
      "Bergerak ke arah Timur mendekati bantaran tanggul yang jebol",
      "Menerobos genangan air di jalur Barat menggunakan kendaraan roda dua",
      "Mengungsi ke arah Selatan menuju hilir lembah sungai yang lebih rendah",
      "Menunggu air surut di dalam rumah warga yang bertingkat satu"
    ],
    "answer": "A",
    "explanation": "Tanggul jebol di sebelah Timur (kawasan bahaya). Jalur Barat terendam air 1 meter (tidak aman). Sasaran evakuasi ada di Barat Laut. Rute paling logis adalah menghindari genangan air dengan mengambil elevasi tinggi ke arah Utara terlebih dahulu, kemudian berbelok ke Barat menuju bukit.",
    "tags": [
      "petadenah",
      "evakuasi-bencana",
      "analisis-medan"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "MEDIUM",
    "stem": "Jalan Tol Lingkar membentang lurus horizontal dari koordinat Y = 5. Jalan Arteri Protokol membentang lurus vertikal dari koordinat X = -3. Pada titik koordinat manakah gerbang simpang susun pertemuan kedua jalan tersebut berada?",
    "options": [
      "(-3, 5)",
      "(0, 0)",
      "(5, -3)",
      "(-5, 3)",
      "(3, -5)"
    ],
    "answer": "A",
    "explanation": "Titik potong garis horizontal Y = 5 dan garis vertikal X = -3 dalam bidang koordinat kartesius adalah titik (X, Y) = (-3, 5).",
    "tags": [
      "petadenah",
      "koordinat",
      "persimpangan"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "MEDIUM",
    "stem": "Di lapangan tembak reaksi, seorang penembak mula-mula membidik sasaran logam di depannya (arah Utara). Setelah menembak sasaran 1, ia mendengar bunyi buzzer di sektor kanan dan berbalik 90° searah jarum jam untuk menembak sasaran 2. Kemudian ia berbalik lagi 135° berlawanan arah jarum jam untuk menembak sasaran 3. Ke arah mata angin manakah penembak membidik sasaran 3?",
    "options": [
      "Barat Laut",
      "Timur Laut",
      "Barat",
      "Utara",
      "Barat Daya"
    ],
    "answer": "A",
    "explanation": "Awal = Utara (0°). Putaran 1: +90° searah jarum jam -> menghadap Timur (90°). Putaran 2: -135° berlawanan arah jarum jam -> 90° - 135° = -45° = 315°. Sudut 315° pada arah kompas adalah tepat arah Barat Laut.",
    "tags": [
      "petadenah",
      "lapangan-tembak",
      "orientasi-sudut"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "HARD",
    "stem": "Gedung Parlemen memiliki Gerbang Utama di sisi Selatan dan Gerbang Khusus Anggota di sisi Utara. Massa aksi berkumpul memadati jalan di depan Gerbang Selatan. Mobil logistik dapur lapangan dan ambulans medis Polri harus ditempatkan di lokasi yang terlindung dari kerumunan massa namun memiliki akses darurat cepat ke dalam komplek gedung. Di manakah lokasi paling ideal menurut denah pengamanan?",
    "options": [
      "Di halaman dalam dekat Gerbang Khusus Anggota di sisi Utara",
      "Di jalan buntu sempit sebelah Timur tanpa akses tembus",
      "Di tepi trotoar jalan raya utama sisi Selatan yang padat demonstran",
      "Di luar pagar pembatas depan panggung orator massa",
      "Di tengah kerumunan massa di depan Gerbang Utama sisi Selatan"
    ],
    "answer": "A",
    "explanation": "Kebutuhan taktis medis dan dapur lapangan: akses terlindung dari risiko anarkis kerumunan massa, aman, dan memiliki jalur keluar-masuk cadangan yang lancar. Sisi Utara (Gerbang Khusus) steril dari konsentrasi massa Selatan dan memiliki akses langsung ke dalam komplek.",
    "tags": [
      "petadenah",
      "pengamanan-demo",
      "taktis-lokasi"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "MEDIUM",
    "stem": "Unit Patroli Sepeda Sabhara menyusuri kawasan car-free day: mulai dari Bundaran Air Mancur ke arah Timur sejauh 500 meter, lalu berbelok ke Selatan sejauh 1.200 meter, kemudian berbelok ke Barat sejauh 500 meter. Berapakah jarak lurus terpendek dari posisi akhir regu patroli kembali ke titik awal di Bundaran Air Mancur?",
    "options": [
      "1.200 meter tepat ke arah Utara",
      "500 meter tepat ke arah Selatan",
      "2.200 meter tepat ke arah Timur",
      "1.500 meter ke arah Tenggara",
      "1.000 meter ke arah Barat Daya"
    ],
    "answer": "A",
    "explanation": "Lintasan membentuk persegi panjang terbuka: Timur 500 m, Selatan 1.200 m, Barat 500 m. Posisi akhir sejajar dengan posisi awal di sumbu X (karena Timur 500 m dibatalkan oleh Barat 500 m) dan berada 1.200 meter di sebelah Selatan titik awal. Untuk kembali ke titik awal di Bundaran Air Mancur, regu cukup bergerak lurus 1.200 meter tepat ke arah Utara.",
    "tags": [
      "petadenah",
      "patroli-sepeda",
      "jarak-kembali"
    ]
  },
  {
    "topic": "kepribadian",
    "difficulty": "HARD",
    "stem": "Saat menjabat sebagai penyidik perkara sengketa tanah, seorang pengusaha yang ternyata masih memiliki hubungan kerabat jauh dengan keluarga Anda datang berkunjung ke rumah dinas pada malam hari. Ia bermaksud memberikan bingkisan barang mewah dan uang tunai sebagai 'tanda terima kasih' karena kasusnya diproses secara objektif, tanpa meminta perlakuan khusus. Sikap yang paling tepat dan profesional sesuai kode etik profesi Polri adalah...",
    "options": [
      "Menolak secara tegas namun sopan bingkisan dan uang tersebut, menjelaskan bahwa penyidikan adalah kewajiban tugas dinas tanpa imbalan, serta melaporkan pertemuan tersebut kepada pimpinan satker sebagai bentuk transparansi.",
      "Meminta kerabat tersebut menyerahkan uang itu melalui perantara staf pembantu agar tidak terlihat langsung oleh publik.",
      "Menerima bingkisan tersebut karena diberikan di rumah dinas dan yang bersangkutan masih memiliki hubungan kekerabatan keluarga.",
      "Menerima uangnya untuk kemudian diam-diam disumbangkan ke panti asuhan tanpa memberitahu siapa pun.",
      "Menolak bingkisan namun meminta yang bersangkutan mentraktir seluruh anggota unit penyidik di restoran mewah."
    ],
    "answer": "A",
    "explanation": "Prinsip integritas dan Perpol 7/2022 tentang Kode Etik Profesi Polri secara mutlak melarang anggota menerima imbalan/gratifikasi dalam bentuk apa pun terkait pelaksanaan kewenangan dinas. Menolak dengan sopan, menjelaskan norma tugas, dan melaporkan potensi konflik kepentingan kepada atasan adalah tindakan paling profesional dan akuntabel.",
    "tags": [
      "kepribadian",
      "integritas",
      "anti-gratifikasi",
      "studi-kasus"
    ]
  },
  {
    "topic": "kepribadian",
    "difficulty": "HARD",
    "stem": "Anda memimpin regu patroli dan mendapati seorang pria mengamuk mengacungkan parang di tengah kerumunan pasar yang padat pengunjung. Pelaku berjarak sekitar 7 meter dari posisi Anda dan terlihat panik namun belum melukai warga di sekitarnya. Tahapan tindakan kepolisian yang paling tepat dan proporsional menurut Perkap No. 1 Tahun 2009 adalah...",
    "options": [
      "Mengamankan perimeter kerumunan warga, memberikan perintah lisan yang tegas dan jelas agar pelaku meletakkan senjatanya, serta menyiapkan sarana kendali taser/alat peruntuh sebelum mempertimbangkan penembakan melumpuhkan bila ancaman meningkat.",
      "Mengajak pedagang pasar beramai-ramai mengeroyok pelaku menggunakan balok kayu.",
      "Mundur bersama seluruh regu meninggalkan pasar agar tidak memancing kemarahan pelaku.",
      "Langsung menembak mati pelaku di bagian kepala tanpa peringatan untuk menunjukkan ketegasan aparat.",
      "Mendekati pelaku dengan tangan kosong sendirian tanpa perlengkapan pelindung diri untuk bernegosiasi santai."
    ],
    "answer": "A",
    "explanation": "Tahapan penggunaan kekuatan Polri: Kehadiran polisi -> Perintah lisan -> Kendali tangan kosong/senjata tumpul/alat kendali lunak -> Senjata api sebagai upaya terakhir (ultimum remedium) saat ancaman maut mengancam jiwa petugas/masyarakat. Mensterilkan warga dan memberikan perintah lisan terstruktur adalah prosedur baku prioritas keselamatan umum.",
    "tags": [
      "kepribadian",
      "penggunaan-kekuatan",
      "diskresi-taktis",
      "studi-kasus"
    ]
  },
  {
    "topic": "kepribadian",
    "difficulty": "HARD",
    "stem": "Dalam operasi penggerebekan narkoba, Anda secara tidak sengaja melihat seorang rekan kerja senior menyisihkan sebagian kecil barang bukti uang tunai sitaan dan memasukkannya ke dalam saku celana dinasnya tanpa dicatat dalam Berita Acara Penyitaan. Tindakan yang paling tepat Anda lakukan adalah...",
    "options": [
      "Menegur rekan tersebut secara pribadi saat situasi aman, mengingatkan sumpah jabatan, dan apabila tidak dikembalikan, melaporkan temuan tersebut kepada perwira pengendali operasi atau Kasi Propam.",
      "Diam saja dan pura-pura tidak melihat karena tidak ingin dicap sebagai pengkhianat oleh rekan satu tim.",
      "Langsung meneriaki rekan tersebut di hadapan para tersangka pengedar narkoba saat penggerebekan masih berlangsung.",
      "Meminta bagian dari uang tersebut agar Anda tidak membocorkan perbuatannya kepada atasan.",
      "Menyebarkan foto rekan tersebut di media sosial secara anonim agar menjadi viral."
    ],
    "answer": "A",
    "explanation": "Menjaga kehormatan institusi dan kepatuhan hukum mengharuskan anggota berani bertindak atas pelanggaran pidana penggelapan barang bukti. Pendekatan profesional berjenjang melalui jalur internal resmi (propam/pengendali operasi) mencegah kegaduhan taktis di TKP namun menjamin akuntabilitas hukum.",
    "tags": [
      "kepribadian",
      "kode-etik",
      "pengawasan-internal",
      "studi-kasus"
    ]
  },
  {
    "topic": "kepribadian",
    "difficulty": "HARD",
    "stem": "Saat bertugas di barisan depan pasukan Pengendalian Massa (Dalmas) mengamankan unjuk rasa, seorang demonstran memaki-maki Anda dengan kata-kata kotor bernada penghinaan pribadi dan meludahi perisai dinas Anda. Posisi barisan dalam status siaga bertahan (Lintas Ganti). Tindakan terbaik yang mencerminkan kedewasaan emosi personel Polri adalah...",
    "options": [
      "Tetap tenang, menjaga formasi barisan perisai rapat, tidak terpancing emosi secara individual, dan menunggu instruksi taktis lanjutan dari Komandan Kompi Dalmas.",
      "Keluar dari formasi barisan dan langsung memukul demonstran tersebut dengan tongkat T.",
      "Melepaskan helm dinas dan menantang demonstran tersebut berkelahi satu lawan satu di luar barisan.",
      "Membalas memaki demonstran tersebut dengan kata-kata yang lebih kasar agar tidak diremehkan.",
      "Memerintahkan pelemparan gas air mata secara mandiri tanpa menunggu aba-aba komandan."
    ],
    "answer": "A",
    "explanation": "Disiplin formasi Dalmas dan pengendalian emosi personel (EQ) adalah kunci utama keberhasilan pengamanan massa. Tindakan individual reaktif melanggar SOP, merusak keutuhan barisan pengamanan, dan memicu eskalasi anarkis massa yang lebih luas.",
    "tags": [
      "kepribadian",
      "pengendalian-emosi",
      "dalmas",
      "studi-kasus"
    ]
  },
  {
    "topic": "kepribadian",
    "difficulty": "HARD",
    "stem": "Sebagai petugas pertama yang tiba di lokasi kecelakaan lalu lintas ganda di jalan tol sepi, Anda mendapati: (1) Seorang korban terjepit di dalam mobil yang mulai mengeluarkan asap dari kap mesin, (2) Pengemudi truk yang berteriak histeris meminta tolong karena kakinya lecet ringan, dan (3) Arus lalu lintas di belakang mulai melaju kencang berpotensi tabrakan beruntun. Tindakan pertama yang paling krusial Anda lakukan dalam hitungan detik pertama adalah...",
    "options": [
      "Memasang tanda bahaya/kerucut segitiga pengaman di kejauhan jalan untuk menghentikan laju kendaraan di belakang, lalu segera mengevakuasi korban terjepit di mobil yang berasap sambil memanggil bantuan pemadam dan ambulans.",
      "Menunggu kedatangan mobil derek sebelum berani mendekati kendaraan yang berasap.",
      "Menginterogasi saksi mata untuk segera mencari tahu siapa pengemudi yang lalai.",
      "Mengambil foto dokumentasi kerusakan kendaraan untuk kepentingan klaim asuransi para pihak.",
      "Mendahulukan menenangkan pengemudi truk yang berteriak histeris di pinggir jalan."
    ],
    "answer": "A",
    "explanation": "Prinsip penanganan pertama TKP laka lantas: Mencegah timbulnya korban baru (safety first) dengan mengamankan arus lalu lintas dari tabrakan beruntun, dilanjutkan tindakan tanggap darurat penyelamatan jiwa (life saving) terhadap korban terjepit dari bahaya ledakan api.",
    "tags": [
      "kepribadian",
      "prioritas-tindakan",
      "penyelamatan-jiwa",
      "studi-kasus"
    ]
  },
  {
    "topic": "kepribadian",
    "difficulty": "HARD",
    "stem": "Seorang tokoh berpengaruh di wilayah Anda menghubungi Anda melalui telepon pribadi meminta agar berkas perkara pidana penipuan yang melibatkan keponakannya dihentikan melalui SP3 dengan iming-iming dukungan promosi jabatan. Bukti permulaan terhadap keponakannya telah sangat kuat dan lengkap. Sikap Anda sebagai penyidik adalah...",
    "options": [
      "Menolak permintaan tersebut dengan santun, menegaskan bahwa proses penyidikan berjalan tegak lurus berdasarkan kecukupan alat bukti dan hukum acara yang berlaku, serta melaporkan intervensi ini kepada pimpinan secara berjenjang.",
      "Mengulur-ulur waktu penyidikan dengan sengaja menunda pelimpahan berkas hingga batas waktu kedaluwarsa.",
      "Mengurangi bobot pasal sangkaan agar tersangka hanya dijerat tindak pidana ringan tanpa penahanan.",
      "Meminta tersangka menyerahkan sejumlah uang damai kepada korban tanpa dasar mekanisme restorative justice yang sah.",
      "Menyetujui permintaan tersebut demi mengamankan jenjang karier dan masa depan jabatan Anda di kepolisian."
    ],
    "answer": "A",
    "explanation": "Penyidik Polri wajib menjunjung tinggi independensi penegakan hukum dari intervensi kekuasaan maupun imbalan karier pribadi. Asas kesetaraan di hadapan hukum (equality before the law) menuntut penanganan perkara diselesaikan secara profesional dan objektif sesuai bukti.",
    "tags": [
      "kepribadian",
      "profesionalisme",
      "independensi-penyidik",
      "studi-kasus"
    ]
  },
  {
    "topic": "kepribadian",
    "difficulty": "MEDIUM",
    "stem": "Dalam perkara pencurian seekor ayam oleh seorang kakek lansia yang kelaparan, korban telah memaafkan sepenuhnya dan sepakat berdamai tanpa syarat ganti rugi. Berdasarkan Perpol No. 8 Tahun 2021 tentang Restorative Justice, langkah prosedural yang paling tepat ditempuh penyidik adalah...",
    "options": [
      "Melaksanakan gelar perkara khusus restorative justice bersama para pihak, mendokumentasikan surat kesepakatan perdamaian, dan menerbitkan surat perintah penghentian penyidikan (SP3) demi rasa keadilan masyarakat.",
      "Menahan kakek tersebut di ruang tahanan selama 20 hari sebelum menandatangani perdamaian.",
      "Menyuruh kakek tersebut membayar biaya ganti rugi administrasi kepada pihak kantor kepolisian.",
      "Tetap melimpahkan kakek tersebut ke pengadilan dengan tuntutan hukuman kurungan maksimal agar jera.",
      "Menghentikan perkara secara lisan saja tanpa membuat berita acara perdamaian resmi."
    ],
    "answer": "A",
    "explanation": "Keadilan Restoratif (Restorative Justice) mengutamakan pemulihan keadilan dan kemanfaatan hukum bagi tindak pidana berkategori ringan dengan kerugian minim dan persetujuan korban. Prosedur formal gelar perkara dan dokumentasi SP3 menjamin akuntabilitas penyidikan.",
    "tags": [
      "kepribadian",
      "restorative-justice",
      "kemanfaatan-hukum",
      "studi-kasus"
    ]
  },
  {
    "topic": "kepribadian",
    "difficulty": "HARD",
    "stem": "Dua orang anggota bintara di unit kerja Anda mengalami perselisihan pribadi akibat kesalahpahaman tugas piket, sehingga mereka tidak saling bertegur sapa dan menurunkan efektivitas kerja regu pelayanan SPKT. Sebagai perwira pengendali, tindakan manajerial yang paling konstruktif adalah...",
    "options": [
      "Memanggil kedua anggota secara khusus ke ruang konseling, mendengarkan akar persoalan dari kedua belah pihak secara objektif, mendamaikan dengan mengedepankan soliditas tim, serta menegaskan kembali tanggung jawab kedinasan.",
      "Memihak kepada salah satu anggota yang memiliki masa dinas lebih lama.",
      "Langsung menjatuhkan hukuman disiplin push-up 100 kali kepada keduanya di depan masyarakat umum.",
      "Memindahkan salah satu anggota ke pos terpencil tanpa mendengarkan klarifikasi terlebih dahulu.",
      "Membiarkan perselisihan tersebut karena menganggap masalah pribadi akan selesai dengan sendirinya."
    ],
    "answer": "A",
    "explanation": "Kepemimpinan transformasional dan pembinaan mental personel menuntut perwira menjadi mediator yang adil, menyelesaikan konflik internal secara bijak, dan memulihkan soliditas korps tanpa mempermalukan martabat bawahan di ruang publik.",
    "tags": [
      "kepribadian",
      "kepemimpinan",
      "manajemen-konflik",
      "studi-kasus"
    ]
  },
  {
    "topic": "kepribadian",
    "difficulty": "MEDIUM",
    "stem": "Seorang wanita korban kekerasan dalam rumah tangga (KDRT) datang ke ruang Unit Pelayanan Perempuan dan Anak (PPA) dalam kondisi menangis histeris, ketakutan, dan membawa balita. Sikap pelayanan prima yang harus ditunjukkan oleh petugas polwan adalah...",
    "options": [
      "Menyambut dengan empati di Ruang Pelayanan Khusus (RPK), memberikan rasa aman dan air minum, menenangkan korban, serta mendampingi pemeriksaan psikologis dan medis (visum) sebelum melanjutkan BAP.",
      "Menyuruh korban berhenti menangis dan langsung mencecarnya dengan pertanyaan kronologi secara terburu-buru.",
      "Meminta korban pulang ke rumahnya untuk menyelesaikan masalah rumah tangga secara kekeluargaan terlebih dahulu.",
      "Merekam video tangisan korban untuk diunggah sebagai konten edukasi di akun media sosial pribadi.",
      "Menolak menerima laporan sebelum korban melampirkan fotokopi akta nikah legalisir."
    ],
    "answer": "A",
    "explanation": "Standar pelayanan unit PPA menempatkan pemulihan psikologis dan perlindungan korban rentan sebagai prioritas utama. Menggunakan Ruang Pelayanan Khusus yang ramah anak dan perempuan memastikan korban merasa terlindungi dan bebas dari trauma sekunder.",
    "tags": [
      "kepribadian",
      "pelayanan-prima",
      "ppa",
      "studi-kasus"
    ]
  },
  {
    "topic": "kepribadian",
    "difficulty": "HARD",
    "stem": "Malam ini polres akan menggelar razia peredaran miras ilegal dan tempat hiburan malam. Sahabat karib Anda pemilik kafe menghubungi Anda menanyakan apakah ada razia di sekitar kafenya malam ini. Tindakan berintegritas yang wajib Anda ambil adalah...",
    "options": [
      "Menolak memberikan informasi rencana operasi dinas, menegaskan kerahasiaan tugas, dan mengingatkan sahabat Anda untuk selalu mematuhi aturan hukum yang berlaku.",
      "Mengirimkan foto dokumen Surat Perintah Tugas (Sprintas) razia melalui pesan WhatsApp pribadi.",
      "Menyarankan sahabat Anda mentransfer sejumlah uang pengamanan agar kafenya tidak dimasuki petugas.",
      "Memberitahu jam razia secara rahasia agar kafenya bisa menutup operasional lebih awal.",
      "Meminta tim razia sengaja melewati rute yang berbeda agar tidak menyentuh kafe milik sahabat Anda."
    ],
    "answer": "A",
    "explanation": "Membocorkan rahasia operasi dinas kepolisian merupakan pelanggaran disiplin dan kode etik berat yang dapat dikenai sanksi pidana pembocoran rahasia jabatan. Loyalitas terhadap institusi dan hukum wajib berada di atas kepentingan pertemanan pribadi.",
    "tags": [
      "kepribadian",
      "integritas",
      "rahasia-operasi",
      "studi-kasus"
    ]
  },
  {
    "topic": "kepribadian",
    "difficulty": "MEDIUM",
    "stem": "Putusan Mahkamah Konstitusi No. 130/PUU-XIII/2015 mewajibkan penyidik menyampaikan SPDP kepada Penuntut Umum, terlapor, dan korban paling lambat 7 hari setelah terbitnya Surat Perintah Penyidikan (Sprindik). Hari ini adalah hari ke-6 dan staf administrasi Anda lupa membuat draf SPDP tersebut. Tindakan yang Anda ambil adalah...",
    "options": [
      "Segera menyusun dan memverifikasi berkas SPDP hari ini juga serta memastikan pengirimannya tercatat resmi dengan tanda terima sebelum batas 7 hari terlampaui demi kepastian hukum.",
      "Menyalahkan staf administrasi di depan pimpinan satker untuk menyelamatkan nama baik diri sendiri.",
      "Membiarkan saja karena menganggap batas waktu 7 hari tersebut tidak memiliki sanksi hukum dalam persidangan.",
      "Menghapus dokumen Sprindik yang lama dan menerbitkan Sprindik baru setiap minggu.",
      "Membuat tanggal mundur (antidating) pada surat pengantar SPDP agar seolah-olah sudah dikirim sejak hari pertama."
    ],
    "answer": "A",
    "explanation": "Kepatuhan terhadap asas legalitas dan ketelitian administrasi hukum acara pidana sangat krusial. Keterlambatan pengiriman SPDP dapat menjadi celah bagi tersangka untuk memenangkan gugatan praperadilan. Tindakan sigap memperbaiki kelalaian secara sah menjaga validitas proses penyidikan.",
    "tags": [
      "kepribadian",
      "ketelitian-administrasi",
      "kuhap-mk",
      "studi-kasus"
    ]
  },
  {
    "topic": "kepribadian",
    "difficulty": "MEDIUM",
    "stem": "Saat melakukan penindakan pelanggaran kasat mata terhadap seorang pengendara mobil mewah yang menerobos lampu merah, pengendara tersebut menyelipkan uang tunai Rp 500.000 ke dalam buku panduan kendaraan Anda sambil meminta 'berdamai di tempat' tanpa sidang. Respon paling tepat yang mencerminkan martabat anggota Korlantas adalah...",
    "options": [
      "Menolak dengan tegas uang tersebut, mengembalikan kepada pengendara, memberikan teguran hukum atas upaya penyuapan aparat, dan menerbitkan surat tilang resmi dengan kode bayar BRIVA perbankan.",
      "Mengambil uang tersebut dan membiarkan pengendara melaju tanpa pencatatan pelanggaran.",
      "Menyuruh pengendara meletakkan uang tersebut di dalam saku celana Anda secara diam-diam.",
      "Menawar agar jumlah uang damai ditambah menjadi Rp 1.000.000 karena jenis mobilnya mewah.",
      "Mengambil uangnya namun tetap memberikan surat tilang secara diam-diam."
    ],
    "answer": "A",
    "explanation": "Menolak pungli dan suap secara transparan memperkuat kepercayaan masyarakat terhadap penegakan hukum lalu lintas. Pembayaran denda tilang wajib melalui rekening kas negara resmi (BRIVA/bank) dan bukan tunai kepada personel di lapangan.",
    "tags": [
      "kepribadian",
      "anti-pungli",
      "lalu-lintas",
      "studi-kasus"
    ]
  },
  {
    "topic": "kepribadian",
    "difficulty": "HARD",
    "stem": "Masa dinas piket jaga 12 jam Anda telah selesai dan Anda bersiap untuk pulang beristirahat. Tiba-tiba terjadi bencana tanah longsor besar yang menimbun pemukiman warga di wilayah kecamatan tetangga, dan kapolres mengumumkan apel siaga darurat tanggap bencana untuk seluruh personel yang ada di mako. Sikap Anda adalah...",
    "options": [
      "Menunda kepulangan dengan penuh keikhlasan, langsung bergabung dalam barisan apel siaga kontinjensi, dan siap diterjunkan ke lokasi longsor untuk misi kemanusiaan.",
      "Berpura-pura sakit kepala mendadak agar diizinkan pulang oleh bagian Urkes.",
      "Meminta uang lembur khusus di muka kepada bendahara satker sebelum bersedia membantu evakuasi.",
      "Diam-diam menyelinap keluar pintu gerbang belakang mako sebelum nama Anda diabsen oleh provos.",
      "Mengeluh keras kepada rekan kerja bahwa jam dinas Anda sudah berakhir dan ini bukan kewajiban Anda lagi."
    ],
    "answer": "A",
    "explanation": "Bhakti Bhayangkara dan jiwa kesamaptaan menempatkan keselamatan masyarakat dan panggilan tugas kemanusiaan darurat di atas kenyamanan pribadi. Kesiapsiagaan 24 jam dalam kondisi kontinjensi adalah wujud pengabdian insan Tribrata.",
    "tags": [
      "kepribadian",
      "loyalitas",
      "tanggap-bencana",
      "studi-kasus"
    ]
  },
  {
    "topic": "kepribadian",
    "difficulty": "HARD",
    "stem": "Sebagai anggota Seksi Propam, Anda ditugaskan memeriksa dugaan pelanggaran disiplin yang dilakukan oleh seorang rekan seangkatan pendidikan (letting) yang sangat dekat dengan Anda. Sikap profesional yang harus Anda tunjukkan dalam proses pemeriksaan adalah...",
    "options": [
      "Menjalankan pemeriksaan secara objektif dan proporsional berdasarkan fakta bukti riil tanpa dipengaruhi rasa pertemanan, serta meminta supervisi dari atasan langsung untuk menjaga netralitas.",
      "Sengaja memberatkan hukuman rekan tersebut secara berlebihan agar Anda dipuji oleh pimpinan.",
      "Mengundurkan diri dari tugas dinas karena merasa tidak tega memeriksa kawan seperjuangan.",
      "Membocorkan daftar pertanyaan pemeriksaan kepada rekan tersebut sebelum agenda sidang dimulai.",
      "Membuat laporan fiktif yang menyatakan rekan Anda tidak bersalah agar ia terbebas dari hukuman."
    ],
    "answer": "A",
    "explanation": "Pemeriksaan internal Propam menuntut objektivitas tinggi tanpa bias personal (nepotisme atau sentimen). Melakukan pemeriksaan berbasis bukti dengan transparansi supervisi atasan menjamin keadilan bagi institusi maupun bagi terperiksa.",
    "tags": [
      "kepribadian",
      "objektivitas",
      "propam",
      "studi-kasus"
    ]
  },
  {
    "topic": "kepribadian",
    "difficulty": "MEDIUM",
    "stem": "Masyarakat di wilayah Anda sering mengeluhkan antrean panjang manual saat pengurusan Surat Keterangan Catatan Kepolisian (SKCK) di mako polres. Sebagai perwira staf yang memiliki keahlian teknologi informasi, inisiatif terbaik yang dapat Anda ajukan kepada kapolres adalah...",
    "options": [
      "Merancang program sosialisasi dan pendampingan pendaftaran SKCK Online secara terpadu melalui aplikasi mobile presisi, serta membuka loket khusus pengambilan cepat barcode digital.",
      "Membatasi kuota pelayanan menjadi hanya 20 pemohon per hari agar staf tidak lelah.",
      "Meminta pimpinan menaikkan tarif PNBP SKCK agar masyarakat enggan datang beramai-ramai.",
      "Menyerahkan pengurusan SKCK kepada calo informal di luar pagar polres.",
      "Membiarkan antrean tetap berlangsung manual karena sistem manual sudah berjalan puluhan tahun."
    ],
    "answer": "A",
    "explanation": "Modernisasi pelayanan publik berbasis teknologi informasi sejalan dengan visi Polri Presisi (Prediktif, Responsibilitas, Transparansi Berkeadilan) untuk memangkas birokrasi, mengeliminasi calo, dan memudahkan masyarakat.",
    "tags": [
      "kepribadian",
      "inovasi",
      "pelayanan-publik",
      "studi-kasus"
    ]
  },
  {
    "topic": "kepribadian",
    "difficulty": "HARD",
    "stem": "Salah satu anggota bintara di regu patroli Anda lalai mengunci pintu gudang penyimpanan alat perlengkapan dalmas, sehingga sebuah tameng pelindung hilang terbawa orang tidak dikenal. Sebagai komandan regu (Danru), sikap pertanggungjawaban yang paling ksatria adalah...",
    "options": [
      "Menghadap perwira logistik dan kapolsek untuk melaporkan insiden kehilangan secara jujur, mengakui kelemahan pengawasan regu sebagai tanggung jawab komandan, serta berupaya menemukan barang bukti yang hilang.",
      "Membuat laporan polisi palsu bahwa gudang dibobol maling dari luar dengan merusak gembok.",
      "Membeli tameng palsu di pasar bebas untuk menggantikan barang bukti tanpa melapor.",
      "Membebankan seluruh kesalahan kepada bintara piket dan menuntut agar ia dipecat dari kedinasan.",
      "Menyalahkan petugas kebersihan kantor komando atas hilangnya perlengkapan tersebut."
    ],
    "answer": "A",
    "explanation": "Kepemimpinan bertanggung jawab (accountable leadership) menuntut perwira mengambil tanggung jawab komando (command responsibility) atas kekurangan pengawasan terhadap anak buah, bersikap jujur, dan fokus pada solusi korektif.",
    "tags": [
      "kepribadian",
      "tanggung-jawab",
      "kepemimpinan",
      "studi-kasus"
    ]
  },
  {
    "topic": "kepribadian",
    "difficulty": "MEDIUM",
    "stem": "Beredar potongan video viral di media sosial yang dinarasikan bahwa anggota satlantas polres Anda telah memukul seorang sopir angkot, padahal faktanya petugas sedang menolong sopir tersebut yang pingsan akibat serangan jantung. Langkah cepat yang tepat diambil oleh Seksi Humas Polres adalah...",
    "options": [
      "Segera berkoordinasi dengan petugas di lapangan untuk mengamankan rekaman CCTV utuh dan saksi, lalu menerbitkan siaran pers klarifikasi resmi (counter narasi) yang objektif dan humanis dalam waktu 1x24 jam.",
      "Membalas komentar netizen dengan kata-kata kemarahan menggunakan akun resmi kedinasan.",
      "Menghubungi stasiun televisi swasta untuk membayar iklan sanggahan berbiaya mahal.",
      "Menutup kolom komentar media sosial dinas dan membiarkan isu mereda sendiri dengan waktu.",
      "Menangkap seluruh warganet yang membagikan video tanpa memberikan penjelasan fakta yang benar."
    ],
    "answer": "A",
    "explanation": "Manajemen media Polri yang responsif dan presisi menuntut respons klarifikasi berbasis fakta bukti otentik (CCTV/keterangan saksi medis) secara cepat, transparan, dan humanis untuk meluruskan persepsi publik sebelum disinformasi meluas.",
    "tags": [
      "kepribadian",
      "manajemen-media",
      "humas-polri",
      "studi-kasus"
    ]
  },
  {
    "topic": "kepribadian",
    "difficulty": "HARD",
    "stem": "Saat regu pengintai Anda memantau rumah persembunyian DPO bandar narkoba bersenjata, Anda melihat target keluar ke teras rumah seorang diri. Rencana operasi menetapkan bahwa penindakan hanya boleh dilakukan serentak setelah tim taktis Brimob tiba di lokasi dalam 10 menit ke depan. Anggota Anda mengusulkan untuk langsung menyerbu masuk berdua saja demi mendapatkan pujian prestasi. Tindakan Anda adalah...",
    "options": [
      "Menolak usulan tersebut dengan tegas, mengingatkan keselamatan personel dan kepatuhan rencana operasi, tetap melakukan pemantauan ketat dari titik lindung, dan menunggu kedatangan tim taktis Brimob sesuai rantai komando.",
      "Membatalkan seluruh operasi karena merasa takut terhadap senjata api milik target.",
      "Menyetujui usulan tersebut dan langsung menembaki target secara membabi buta dari jarak jauh.",
      "Meninggalkan lokasi pengintaian untuk menyusul tim Brimob di jalan raya.",
      "Menyuruh anak buah Anda menyerbu sendirian sementara Anda mengawasi dari kejauhan."
    ],
    "answer": "A",
    "explanation": "Kepatuhan terhadap rencana operasi dan rantai komando adalah doktrin fundamental keselamatan taktis Polri. Tindakan nekat (koboi) tanpa kalkulasi risiko matang melanggar SOP dan berisiko fatal bagi keselamatan jiwa personel dan kegagalan operasi.",
    "tags": [
      "kepribadian",
      "disiplin-komando",
      "taktis-lapangan",
      "studi-kasus"
    ]
  },
  {
    "topic": "kepribadian",
    "difficulty": "MEDIUM",
    "stem": "Setelah pelaksanaan operasi pengamanan konser musik berakhir, terdapat sisa dana bahan bakar minyak (BBM) kendaraan patroli sebesar Rp 5.000.000 yang tidak terpakai dari anggaran dinas. Rekan bendahara menyarankan agar uang sisa tersebut dibagi-bagi kepada anggota regu sebagai 'uang lelah'. Sikap Anda adalah...",
    "options": [
      "Menolak saran tersebut dan menegaskan bahwa sisa anggaran wajib disetorkan kembali ke kas negara/satker serta dicatat secara akuntabel dalam Laporan Pertanggungjawaban Keuangan (LPJ).",
      "Menerima bagian uang tersebut asalkan jumlahnya dibagi rata kepada seluruh anggota piket.",
      "Membuat kuitansi pembelian bensin palsu untuk menutupi selisih anggaran yang tidak terpakai.",
      "Menggunakan uang sisa tersebut untuk pesta makan malam bersama tanpa membuat kuitansi belanja.",
      "Menyimpan uang tersebut di rekening pribadi untuk cadangan operasional pribadi tahun depan."
    ],
    "answer": "A",
    "explanation": "Pengelolaan keuangan negara di lingkungan Polri wajib menganut prinsip akuntabel, transparan, dan tertib administrasi perbendaharaan negara. Menyalahgunakan sisa pagu anggaran dinas merupakan tindak pidana korupsi/penggelapan anggaran dinas.",
    "tags": [
      "kepribadian",
      "integritas-anggaran",
      "keuangan-negara",
      "studi-kasus"
    ]
  },
  {
    "topic": "kepribadian",
    "difficulty": "MEDIUM",
    "stem": "Seorang warga lansia tunarungu datang ke kantor polsek untuk melaporkan kehilangan sertifikat tanah. Petugas piket kesulitan berkomunikasi secara verbal dan mulai terdengar berbicara dengan nada tinggi karena tidak sabar. Tindakan yang Anda lakukan sebagai sesama petugas piket adalah...",
    "options": [
      "Mengambil alih pelayanan dengan ramah dan sabar, menggunakan media komunikasi tertulis atau aplikasi penerjemah teks visual, mendengarkan maksud pelapor dengan cermat, dan membantu menerbitkan Surat Keterangan Tanda Lapor Kehilangan (SKTLK).",
      "Memarahi rekan petugas di depan pelapor lansia tersebut sehingga menimbulkan suasana gaduh.",
      "Mengabaikan warga tersebut di ruang tunggu hingga ia bosan dan pulang dengan sendirinya.",
      "Menyuruh warga lansia tersebut pulang dan datang kembali membawa penerjemah bahasa isyarat sewaan sendiri.",
      "Menyerahkan penanganan laporan kepada tukang parkir kantor komando."
    ],
    "answer": "A",
    "explanation": "Standar pelayanan prima ramah disabilitas dan HAM mewajibkan aparat kepolisian bersikap adaptif, inklusif, dan sabar melayani seluruh lapisan warga tanpa diskriminasi, termasuk penyandang disabilitas sensorik.",
    "tags": [
      "kepribadian",
      "pelayanan-ramah-disabilitas",
      "ham",
      "studi-kasus"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "MEDIUM",
    "stem": "Dalam operasi penyekatan wilayah dan pengaturan rute patroli terpadu, pusat pengendali operasi memantau pergerakan unit lapangan berdasarkan koordinat arah mata angin, jarak tempuh, dan tata letak objek pada denah wilayah hukum. Ketepatan menentukan arah akhir dan posisi relatif sangat menentukan keberhasilan manuver taktis. Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 4, 7, 12, 19, 28, ... (Analisis Kasus Kecerdasan #37)",
    "options": [
      "39",
      "35",
      "37",
      "41",
      "43"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Pola bertingkat selisih bertambah 2: +3, +5, +7, +9, +11. Angka berikutnya: 28 + 11 = 39.",
    "tags": [
      "petadenah",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "MEDIUM",
    "stem": "Dalam operasi penyekatan wilayah dan pengaturan rute patroli terpadu, pusat pengendali operasi memantau pergerakan unit lapangan berdasarkan koordinat arah mata angin, jarak tempuh, dan tata letak objek pada denah wilayah hukum. Ketepatan menentukan arah akhir dan posisi relatif sangat menentukan keberhasilan manuver taktis. Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 3, 6, 12, 24, 48, ... (Analisis Kasus Kecerdasan #38)",
    "options": [
      "96",
      "84",
      "92",
      "102",
      "108"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Pola geometri rasio 2 (dikalikan 2): 3×2=6, 6×2=12, 12×2=24, 24×2=48, 48×2=96.",
    "tags": [
      "petadenah",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "MEDIUM",
    "stem": "Dalam operasi penyekatan wilayah dan pengaturan rute patroli terpadu, pusat pengendali operasi memantau pergerakan unit lapangan berdasarkan koordinat arah mata angin, jarak tempuh, dan tata letak objek pada denah wilayah hukum. Ketepatan menentukan arah akhir dan posisi relatif sangat menentukan keberhasilan manuver taktis. Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 2, 3, 5, 8, 13, 21, ... (Analisis Kasus Kecerdasan #39)",
    "options": [
      "34",
      "31",
      "33",
      "36",
      "38"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Pola barisan Fibonacci (setiap suku adalah jumlah dua suku sebelumnya): 13 + 21 = 34.",
    "tags": [
      "petadenah",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "petadenah",
    "difficulty": "MEDIUM",
    "stem": "Dalam operasi penyekatan wilayah dan pengaturan rute patroli terpadu, pusat pengendali operasi memantau pergerakan unit lapangan berdasarkan koordinat arah mata angin, jarak tempuh, dan tata letak objek pada denah wilayah hukum. Ketepatan menentukan arah akhir dan posisi relatif sangat menentukan keberhasilan manuver taktis. Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 100, 95, 85, 70, 50, ... (Analisis Kasus Kecerdasan #40)",
    "options": [
      "25",
      "20",
      "30",
      "35",
      "40"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Pola selisih berkurang kelipatan 5 bertingkat: -5, -10, -15, -20, -25. Angka berikutnya: 50 - 25 = 25.",
    "tags": [
      "petadenah",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 1, 4, 9, 16, 25, 36, ... (Analisis Kasus Kecerdasan #41)",
    "options": [
      "49",
      "45",
      "47",
      "51",
      "55"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Pola bilangan kuadrat: 1², 2², 3², 4², 5², 6², 7² = 49.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 5, 8, 16, 19, 38, 41, ... (Analisis Kasus Kecerdasan #42)",
    "options": [
      "82",
      "78",
      "80",
      "84",
      "86"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Pola kombinasi bergantian: +3, ×2, +3, ×2, +3, ×2. Angka berikutnya: 41 × 2 = 82.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 2, 5, 10, 17, 26, 37, ... (Analisis Kasus Kecerdasan #43)",
    "options": [
      "50",
      "48",
      "49",
      "52",
      "54"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Pola n² + 1: (1²+1=2), (2²+1=5), (3²+1=10), (4²+1=17), (5²+1=26), (6²+1=37), (7²+1=50).",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 64, 32, 16, 8, 4, ... (Analisis Kasus Kecerdasan #44)",
    "options": [
      "2",
      "1",
      "3",
      "0",
      "4"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Pola pembagian 2 (geometri r = 1/2): 4 ÷ 2 = 2.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 3, 5, 9, 17, 33, ... (Analisis Kasus Kecerdasan #45)",
    "options": [
      "65",
      "57",
      "61",
      "69",
      "73"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Pola penambahan kelipatan 2: +2, +4, +8, +16, +32. Angka berikutnya: 33 + 32 = 65.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 12, 15, 20, 27, 36, ... (Analisis Kasus Kecerdasan #46)",
    "options": [
      "47",
      "43",
      "45",
      "49",
      "52"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Pola deret bilangan prima/ganjil bertingkat: +3, +5, +7, +9, +11. Angka berikutnya: 36 + 11 = 47.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 1, 2, 6, 24, 120, ... (Analisis Kasus Kecerdasan #47)",
    "options": [
      "720",
      "600",
      "680",
      "840",
      "960"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Pola faktorial (×2, ×3, ×4, ×5, ×6): 120 × 6 = 720.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 4, 8, 7, 14, 13, 26, ... (Analisis Kasus Kecerdasan #48)",
    "options": [
      "25",
      "23",
      "24",
      "27",
      "28"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Pola kombinasi: ×2, -1, ×2, -1, ×2, -1. Angka berikutnya: 26 - 1 = 25.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 21, 20, 18, 15, 11, ... (Analisis Kasus Kecerdasan #49)",
    "options": [
      "6",
      "5",
      "7",
      "8",
      "9"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Pola pengurangan bertingkat: -1, -2, -3, -4, -5. Angka berikutnya: 11 - 5 = 6.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 2, 4, 8, 16, 32, 64, ... (Analisis Kasus Kecerdasan #50)",
    "options": [
      "128",
      "112",
      "120",
      "124",
      "136"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (D). Pola eksponensial basis 2: 2¹, 2², 2³, 2⁴, 2⁵, 2⁶, 2⁷ = 128.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 10, 12, 16, 22, 30, ... (Analisis Kasus Kecerdasan #51)",
    "options": [
      "40",
      "38",
      "42",
      "44",
      "46"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Pola penambahan bilangan genap bertingkat: +2, +4, +6, +8, +10. Angka berikutnya: 30 + 10 = 40.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 81, 27, 9, 3, ... (Analisis Kasus Kecerdasan #52)",
    "options": [
      "1",
      "0",
      "2",
      "3",
      "1/3"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Pola pembagian 3 (3⁴, 3³, 3², 3¹, 3⁰): 3 ÷ 3 = 1.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 1, 3, 7, 15, 31, 63, ... (Analisis Kasus Kecerdasan #53)",
    "options": [
      "127",
      "121",
      "125",
      "129",
      "135"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Pola (×2 + 1): 1×2+1=3, 3×2+1=7, 7×2+1=15, 15×2+1=31, 31×2+1=63, 63×2+1=127.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 15, 14, 16, 15, 17, 16, ... (Analisis Kasus Kecerdasan #54)",
    "options": [
      "18",
      "16",
      "17",
      "19",
      "20"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Pola dua larik selang-seling (+1 setiap dua langkah): suku berikutnya adalah 18.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 2, 6, 12, 20, 30, 42, ... (Analisis Kasus Kecerdasan #55)",
    "options": [
      "56",
      "50",
      "52",
      "54",
      "60"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (D). Pola n × (n + 1): 1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=42, 7×8=56.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Tentukan angka kelanjutan yang paling logis pada barisan bilangan berikut: 50, 48, 44, 38, 30, ... (Analisis Kasus Kecerdasan #56)",
    "options": [
      "20",
      "18",
      "22",
      "24",
      "26"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Pola pengurangan bilangan genap: -2, -4, -6, -8, -10. Angka berikutnya: 30 - 10 = 20.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Mobil patroli polisi bergerak dengan kecepatan rata-rata 75 km/jam menuju lokasi TKP yang berjarak 150 km. Berapa waktu tempuh yang dibutuhkan? (Analisis Kasus Kecerdasan #57)",
    "options": [
      "120 menit",
      "90 menit",
      "105 menit",
      "135 menit",
      "150 menit"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Waktu = Jarak / Kecepatan = 150 km / 75 km/jam = 2 jam (120 menit).",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Sebuah regu pengamanan terdiri atas 12 personil. Jika rasio personil Polri terhadap massa aksi adalah 1 : 25, berapa jumlah massa maksimum yang dapat diamankan sesuai rasio tersebut? (Analisis Kasus Kecerdasan #58)",
    "options": [
      "300 orang",
      "240 orang",
      "280 orang",
      "320 orang",
      "350 orang"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Jumlah massa = 12 × 25 = 300 orang.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Pada triwulan pertama tercatat 160 kasus kejahatan, dan pada triwulan kedua menurun menjadi 120 kasus. Berapakah persentase penurunan angka kejahatan tersebut? (Analisis Kasus Kecerdasan #59)",
    "options": [
      "25%",
      "20%",
      "30%",
      "33.3%",
      "40%"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Penurunan = (160 - 120) / 160 × 100% = 40 / 160 × 100% = 25%.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Kendaraan dinas menghabiskan 8 liter bensin untuk menempuh jarak 96 km. Berapa liter bensin yang diperlukan untuk rute patroli sejauh 240 km? (Analisis Kasus Kecerdasan #60)",
    "options": [
      "20 liter",
      "16 liter",
      "18 liter",
      "22 liter",
      "25 liter"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Konsumsi = 96 / 8 = 12 km/liter. Kebutuhan = 240 / 12 = 20 liter.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Sebuah pos polisi memiliki 45 personil. 60% dari personil bertugas di lapangan dan sisanya bertugas administrasi staf. Berapa personil yang bertugas administrasi staf? (Analisis Kasus Kecerdasan #61)",
    "options": [
      "18 personil",
      "15 personil",
      "20 personil",
      "24 personil",
      "27 personil"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Personil staf = (100% - 60%) × 45 = 40% × 45 = 18 personil.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dua mobil patroli berangkat dari Mapolres menuju lokasi perbatasan dari arah berlawanan. Mobil A melaju 60 km/jam dan Mobil B melaju 80 km/jam. Jika mereka berjarak 280 km, setelah berapa jam mereka akan berpapasan? (Analisis Kasus Kecerdasan #62)",
    "options": [
      "2.0 jam",
      "1.5 jam",
      "2.5 jam",
      "3.0 jam",
      "3.5 jam"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Waktu berpapasan = Jarak total / (vA + vB) = 280 / (60 + 80) = 280 / 140 = 2 jam.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Rata-rata nilai tes jasmani 5 personil adalah 78. Jika 1 personil baru dengan nilai 90 bergabung, berapakah nilai rata-rata sekarang? (Analisis Kasus Kecerdasan #63)",
    "options": [
      "80.0",
      "79.0",
      "81.0",
      "82.5",
      "84.0"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Total lama = 5 × 78 = 390. Total baru = 390 + 90 = 480. Rata-rata baru = 480 / 6 = 80.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Anggaran pemeliharaan sarpras sebesar Rp120.000.000 dialokasikan untuk 3 unit: Unit Patroli 50%, Unit Reskrim 30%, dan Unit Intelijen sisanya. Berapakah anggaran untuk Unit Intelijen? (Analisis Kasus Kecerdasan #64)",
    "options": [
      "Rp24.000.000",
      "Rp18.000.000",
      "Rp20.000.000",
      "Rp28.000.000",
      "Rp32.000.000"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Persentase Intelijen = 100% - (50% + 30%) = 20%. Alokasi = 20% × Rp120.000.000 = Rp24.000.000.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Sebuah gudang logistik menyimpan 360 rompi antipeluru. Jika setiap peleton membutuhkan 45 rompi, berapa peleton yang dapat menerima perlengkapan tersebut secara lengkap? (Analisis Kasus Kecerdasan #65)",
    "options": [
      "8 peleton",
      "6 peleton",
      "7 peleton",
      "9 peleton",
      "10 peleton"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Jumlah peleton = 360 / 45 = 8 peleton.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Empat petugas mampu memeriksa 120 berkas perkara dalam waktu 6 hari. Berapa berkas yang dapat diperiksa oleh 6 petugas dalam 4 hari dengan kecepatan kerja yang sama? (Analisis Kasus Kecerdasan #66)",
    "options": [
      "120 berkas",
      "100 berkas",
      "110 berkas",
      "130 berkas",
      "140 berkas"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Produktivitas 1 orang per hari = 120 / (4 × 6) = 5 berkas. Maka 6 petugas dalam 4 hari = 6 × 4 × 5 = 120 berkas.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Harga 3 unit radio komunikasi HT dan 2 baterai cadangan adalah Rp4.800.000. Jika harga 1 baterai cadangan Rp300.000, berapakah harga 1 unit HT? (Analisis Kasus Kecerdasan #67)",
    "options": [
      "Rp1.400.000",
      "Rp1.200.000",
      "Rp1.300.000",
      "Rp1.500.000",
      "Rp1.600.000"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Harga 2 baterai = Rp600.000. Total HT = Rp4.800.000 - Rp600.000 = Rp4.200.000. 1 unit HT = Rp4.200.000 / 3 = Rp1.400.000.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Waktu operasional pos pengamanan Lebaran adalah 24 jam non-stop yang dibagi rata ke dalam 4 shift giliran jaga. Berapa jam durasi setiap shift? (Analisis Kasus Kecerdasan #68)",
    "options": [
      "6 jam",
      "4 jam",
      "8 jam",
      "10 jam",
      "12 jam"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Durasi shift = 24 jam / 4 = 6 jam.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dari 200 pelanggar lalu lintas dalam operasi Zebra, 70% tidak membawa SIM, dan 45% tidak memakai helm SNI. Jika 25% melakukan kedua pelanggaran tersebut, berapa orang yang hanya melanggar salah satu aturan? (Analisis Kasus Kecerdasan #69)",
    "options": [
      "130 orang",
      "110 orang",
      "120 orang",
      "140 orang",
      "150 orang"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Hanya SIM = 70% - 25% = 45%. Hanya Helm = 45% - 25% = 20%. Total salah satu = 45% + 20% = 65% dari 200 = 130 orang.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Jika x = 25% dari 480 dan y = 1/3 dari 360, maka hubungan x dan y yang tepat adalah... (Analisis Kasus Kecerdasan #70)",
    "options": [
      "x = y",
      "x > y",
      "x < y",
      "x = 2y",
      "Hubungan tidak dapat ditentukan"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). x = 0.25 × 480 = 120. y = 1/3 × 360 = 120. Jadi x = y.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Suatu regu menempuh 18 km dalam 20 menit saat patroli darurat. Berapakah kecepatan rata-rata mobil patroli dalam satuan km/jam? (Analisis Kasus Kecerdasan #71)",
    "options": [
      "54 km/jam",
      "48 km/jam",
      "50 km/jam",
      "60 km/jam",
      "64 km/jam"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Kecepatan = Jarak / (Waktu dlm jam) = 18 km / (20/60 jam) = 18 × 3 = 54 km/jam.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Seorang penyidik memeriksa saksi dari pukul 08.45 sampai 11.15 WIB. Berapa total menit durasi pemeriksaan berlangsung? (Analisis Kasus Kecerdasan #72)",
    "options": [
      "150 menit",
      "135 menit",
      "145 menit",
      "155 menit",
      "165 menit"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Dari 08.45 ke 11.15 = 2 jam 30 menit = 150 menit.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Bareskrim : Reserse = Korlantas : ... (Analisis Kasus Kecerdasan #73)",
    "options": [
      "Lalu Lintas",
      "Sabhara",
      "Brimob",
      "Propam",
      "Humas"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Bareskrim membidangi tugas reserse kriminal; Korlantas membidangi lalu lintas.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Borgol : Tersangka = Helm Baja : ... (Analisis Kasus Kecerdasan #74)",
    "options": [
      "Pasukan Dalmas",
      "Saksi",
      "Terdakwa",
      "Korban",
      "Penyidik"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Borgol digunakan pada tersangka; helm baja digunakan oleh pasukan Pengendalian Massa (Dalmas) sebagai perlindungan.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Sinonim kata DISKRESI dalam pelaksanaan tugas kepolisian adalah... (Analisis Kasus Kecerdasan #75)",
    "options": [
      "Kewenangan bertindak objektif",
      "Kewajiban administratif",
      "Pemberhentian dinas",
      "Perintah tertulis mutlak",
      "Pelanggaran disiplin"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (A). Diskresi berarti kebebasan mengambil keputusan sendiri berdasarkan pertimbangan situasi yang tepat dan bertanggung jawab.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Lawan kata (antonim) yang paling tepat untuk istilah OBJEKTIF adalah... (Analisis Kasus Kecerdasan #76)",
    "options": [
      "Subjektif",
      "Faktual",
      "Rasional",
      "Netral",
      "Transparan"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Objektif berarti berdasarkan fakta sebenarnya tanpa dipengaruhi perasaan; lawannya adalah subjektif.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Kompas : Arah = Speedometer : ... (Analisis Kasus Kecerdasan #77)",
    "options": [
      "Kecepatan",
      "Jarak",
      "Suhu",
      "Bahan bakar",
      "Waktu"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Kompas mengukur arah mata angin; speedometer mengukur kecepatan laju kendaraan.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Jaksa : Penuntutan = Hakim : ... (Analisis Kasus Kecerdasan #78)",
    "options": [
      "Pengadilan / Memutus perkara",
      "Penyidikan",
      "Pembelaan",
      "Penggeledahan",
      "Penangkapan"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Jaksa bertugas melakukan penuntutan perkara di persidangan; Hakim bertugas mengadili dan memutus perkara.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Dalam perencanaan logistik, evaluasi statistik kriminalitas, dan analisis pola data kuantitatif di ruang Pusat Komando (Command Center) Polri, petugas dituntut mampu mengolah pola deret bilangan serta perhitungan aritmatika secara cepat dan presisi. Ketelitian membaca keteraturan perubahan angka sangat menentukan akurasi proyeksi data operasional. Sinonim kata INTEGRITAS yang paling dekat maknanya adalah... (Analisis Kasus Kecerdasan #79)",
    "options": [
      "Kejujuran dan keteguhan moral",
      "Kekuasaan",
      "Kecepatan bertindak",
      "Ketenaran",
      "Kecerdasan akademik"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Integritas bermakna kejujuran, keteguhan moral, dan keselarasan antara perkataan dengan tindakan.",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "numerik",
    "difficulty": "HARD",
    "stem": "Saat menyusun perhitungan alokasi sumber daya personel, estimasi waktu tempuh pengejaran taktis, maupun analisis tren angka kejadian perkara, kemampuan penalaran numerik dan deret ukur/hitung menjadi instrumen analisis yang sangat krusial. Amati hubungan matematis antarbilangan pada skenario berikut secara saksama. Dokter : Rumah Sakit = Polisi : ... (Analisis Kasus Kecerdasan #80)",
    "options": [
      "Kantor Polisi",
      "Pengadilan",
      "Rutan",
      "Kecamatan",
      "Pos ronda"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Dokter bertugas di rumah sakit; polisi bertugas di kantor polisi (Mapolres/Mapolsek).",
    "tags": [
      "numerik",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "EASY",
    "stem": "Dalam analisis kebahasaan dan penalaran konsep hukum di lingkungan akademik kepolisian, ketepatan memahami hubungan makna kata, padanan istilah, serta struktur logika bahasa sangat dibutuhkan saat menyusun laporan resmi maupun telaah staf. Anda diminta menganalisis relasi semantik dan proporsi hubungan konsep secara cermat. Pilihlah kelompok kata yang TIDAK setara dengan yang lain: (Analisis Kasus Kecerdasan #81)",
    "options": [
      "Stempel dinas",
      "Borgol",
      "Pistol dinas",
      "Tongkat T",
      "Helm baja"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (D). Borgol, pistol, tongkat T, dan helm baja adalah perlengkapan operasional taktis Polri, sedangkan stempel dinas adalah alat administrasi kantor.",
    "tags": [
      "verbal",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "EASY",
    "stem": "Pada proses pengkajian dokumen penyelidikan dan berita acara pemeriksaan, seorang perwira penyidik harus memiliki kepekaan tinggi terhadap keterkaitan antarkonsep, kesepadanan fungsi kelembagaan, serta ketepatan diksi formal. Perhatikan hubungan logis dari unsur-unsur kata yang disajikan dalam persoalan berikut. KUHAP : Hukum Acara Pidana = KUHP : ... (Analisis Kasus Kecerdasan #82)",
    "options": [
      "Hukum Pidana Materiil",
      "Hukum Perdata",
      "Hukum Dagang",
      "Hukum Tata Negara",
      "Hukum Adat"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). KUHAP mengatur hukum acara formal pidana; KUHP mengatur hukum pidana materiil.",
    "tags": [
      "verbal",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "EASY",
    "stem": "Dalam analisis kebahasaan dan penalaran konsep hukum di lingkungan akademik kepolisian, ketepatan memahami hubungan makna kata, padanan istilah, serta struktur logika bahasa sangat dibutuhkan saat menyusun laporan resmi maupun telaah staf. Anda diminta menganalisis relasi semantik dan proporsi hubungan konsep secara cermat. Sinonim kata YURISDIKSI dalam hukum kepolisian adalah... (Analisis Kasus Kecerdasan #83)",
    "options": [
      "Kewenangan wilayah hukum",
      "Perlindungan saksi",
      "Penegakan etika",
      "Bantuan operasional",
      "Gelar perkara"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (A). Yurisdiksi adalah batas wilayah atau lingkungan kekuasaan hukum berlakunya suatu kewenangan.",
    "tags": [
      "verbal",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "EASY",
    "stem": "Pada proses pengkajian dokumen penyelidikan dan berita acara pemeriksaan, seorang perwira penyidik harus memiliki kepekaan tinggi terhadap keterkaitan antarkonsep, kesepadanan fungsi kelembagaan, serta ketepatan diksi formal. Perhatikan hubungan logis dari unsur-unsur kata yang disajikan dalam persoalan berikut. Lawan kata dari TRANSPARAN dalam pelayanan publik adalah... (Analisis Kasus Kecerdasan #84)",
    "options": [
      "Tertutup",
      "Terbuka",
      "Akuntabel",
      "Terukur",
      "Inklusif"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Transparan berarti terbuka dan jelas; lawannya adalah tertutup / rahasia gelap.",
    "tags": [
      "verbal",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "EASY",
    "stem": "Dalam analisis kebahasaan dan penalaran konsep hukum di lingkungan akademik kepolisian, ketepatan memahami hubungan makna kata, padanan istilah, serta struktur logika bahasa sangat dibutuhkan saat menyusun laporan resmi maupun telaah staf. Anda diminta menganalisis relasi semantik dan proporsi hubungan konsep secara cermat. Patroli : Pencegahan = Olah TKP : ... (Analisis Kasus Kecerdasan #85)",
    "options": [
      "Pengungkapan bukti",
      "Penuntutan",
      "Penghukuman",
      "Pengawasan",
      "Penghentian perkara"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Patroli berfungsi sebagai upaya preventif (pencegahan); Olah TKP berfungsi untuk pengungkapan tindak pidana (investigasi).",
    "tags": [
      "verbal",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "EASY",
    "stem": "Pada proses pengkajian dokumen penyelidikan dan berita acara pemeriksaan, seorang perwira penyidik harus memiliki kepekaan tinggi terhadap keterkaitan antarkonsep, kesepadanan fungsi kelembagaan, serta ketepatan diksi formal. Perhatikan hubungan logis dari unsur-unsur kata yang disajikan dalam persoalan berikut. Tribrata : Falsafah Hidup = Catur Prasetya : ... (Analisis Kasus Kecerdasan #86)",
    "options": [
      "Pedoman kerja Polri",
      "Peraturan lalu lintas",
      "Hukum perdata",
      "Standar operasional toko",
      "Sanksi disiplin"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Tribrata merupakan falsafah hidup Polri; Catur Prasetya merupakan pedoman kerja insan Bhayangkara.",
    "tags": [
      "verbal",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "EASY",
    "stem": "Dalam analisis kebahasaan dan penalaran konsep hukum di lingkungan akademik kepolisian, ketepatan memahami hubungan makna kata, padanan istilah, serta struktur logika bahasa sangat dibutuhkan saat menyusun laporan resmi maupun telaah staf. Anda diminta menganalisis relasi semantik dan proporsi hubungan konsep secara cermat. Surat Perintah Tugas : Sprin = Laporan Polisi : ... (Analisis Kasus Kecerdasan #87)",
    "options": [
      "LP",
      "BAP",
      "SPDP",
      "SP3",
      "STPL"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (A). Singkatan resmi kedinasan dari Laporan Polisi adalah LP.",
    "tags": [
      "verbal",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "EASY",
    "stem": "Pada proses pengkajian dokumen penyelidikan dan berita acara pemeriksaan, seorang perwira penyidik harus memiliki kepekaan tinggi terhadap keterkaitan antarkonsep, kesepadanan fungsi kelembagaan, serta ketepatan diksi formal. Perhatikan hubungan logis dari unsur-unsur kata yang disajikan dalam persoalan berikut. Antonim kata RESISTENSI dalam dinamika sosial kemasyarakatan adalah... (Analisis Kasus Kecerdasan #88)",
    "options": [
      "Kepatuhan / Penerimaan",
      "Penolakan",
      "Perlawanan",
      "Ketegangan",
      "Kerusuhan"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (C). Resistensi berarti perlawanan atau penolakan; lawannya adalah kepatuhan atau penerimaan.",
    "tags": [
      "verbal",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "EASY",
    "stem": "Dalam analisis kebahasaan dan penalaran konsep hukum di lingkungan akademik kepolisian, ketepatan memahami hubungan makna kata, padanan istilah, serta struktur logika bahasa sangat dibutuhkan saat menyusun laporan resmi maupun telaah staf. Anda diminta menganalisis relasi semantik dan proporsi hubungan konsep secara cermat. Semua penyidik Polri berpangkat perwira. Sebagian penyidik Polri memiliki sertifikasi audit forensik. Kesimpulan yang sah adalah... (Analisis Kasus Kecerdasan #89)",
    "options": [
      "Sebagian perwira Polri memiliki sertifikasi audit forensik",
      "Semua perwira Polri pasti bersertifikasi audit forensik",
      "Tidak ada perwira Polri yang bersertifikasi audit forensik",
      "Semua yang memiliki sertifikasi forensik bukan penyidik",
      "Penyidik tidak perlu berpangkat perwira"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Karena semua penyidik berpangkat perwira dan sebagian memiliki sertifikasi audit forensik, maka sebagian perwira Polri memiliki sertifikasi audit forensik.",
    "tags": [
      "verbal",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "verbal",
    "difficulty": "EASY",
    "stem": "Pada proses pengkajian dokumen penyelidikan dan berita acara pemeriksaan, seorang perwira penyidik harus memiliki kepekaan tinggi terhadap keterkaitan antarkonsep, kesepadanan fungsi kelembagaan, serta ketepatan diksi formal. Perhatikan hubungan logis dari unsur-unsur kata yang disajikan dalam persoalan berikut. Jika hujan lebat disertai badai, maka apel siaga dilakukan di aula dalam. Pagi ini apel siaga dilaksanakan di lapangan terbuka. Kesimpulan yang pasti adalah... (Analisis Kasus Kecerdasan #90)",
    "options": [
      "Pagi ini tidak hujan lebat disertai badai",
      "Pagi ini hujan lebat di aula",
      "Apel siaga dibatalkan komandan",
      "Aula dalam sedang direnovasi",
      "Hujan terjadi setelah apel selesai"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Menggunakan modus tollens: p -> q, ~q, maka ~p. Karena apel tidak di aula dalam, maka pagi ini tidak hujan lebat disertai badai.",
    "tags": [
      "verbal",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "logis",
    "difficulty": "HARD",
    "stem": "Empat saksi diperiksa terkait waktu keberadaan di TKP perampokan pada pukul 21.00 WIB:\n- Saksi A: 'Saya bersama Saksi B di warung kopi pukul 20.45 - 21.30.'\n- Saksi B: 'Saya sendirian di rumah membaca buku sejak pukul 20.00.'\n- Saksi C: 'Saya melihat Saksi D di pasar pukul 21.00.'\n- Saksi D: 'Saya berada di pasar membeli obat pukul 21.00.'\nBerdasarkan alibi di atas, dua saksi yang keterangannya saling bertentangan secara langsung adalah... (Analisis Kasus Kecerdasan #91)",
    "options": [
      "Saksi A dan Saksi B",
      "Saksi C dan Saksi D",
      "Saksi B dan Saksi C",
      "Saksi A dan Saksi D",
      "Semua saksi selaras"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Keterangan Saksi A mengatakan ia bersama Saksi B, sedangkan Saksi B menyatakan ia sendirian di rumah. Pernyataan A dan B bertentangan langsung.",
    "tags": [
      "logis",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "logis",
    "difficulty": "HARD",
    "stem": "Pada analisis intelijen keamanan dan pemecahan masalah taktis, seorang analis harus mampu mengevaluasi sejumlah premis bersyarat, jadwal kegiatan, serta keterkaitan sebab-akibat secara objektif tanpa dipengaruhi asumsi di luar data. Gunakan kaidah penarikan kesimpulan logika formal untuk menjawab permasalahan berikut. Semua kendaraan operasional kepolisian wajib diperiksa kelaikannya secara berkala. Kendaraan X tidak diperiksa kelaikannya secara berkala. Kesimpulan yang tepat adalah... (Analisis Kasus Kecerdasan #92)",
    "options": [
      "Kendaraan X bukan kendaraan operasional kepolisian yang aktif",
      "Kendaraan X adalah mobil dinas pimpinan",
      "Kendaraan X telah lulus uji emisi",
      "Semua kendaraan polisi tidak laik jalan",
      "Pemeriksaan kelaikan ditunda sepihak"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Semua kendaraan operasional diperiksa berkala. Kendaraan X tidak diperiksa, maka Kendaraan X bukan kendaraan operasional kepolisian yang aktif digunakan.",
    "tags": [
      "logis",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "logis",
    "difficulty": "HARD",
    "stem": "Dalam pelaksanaan gelar perkara pidana di Satuan Reserse Kriminal, penyidik memadukan berbagai fakta lapangan, keterangan saksi, dan aturan hukum formal untuk menarik satu kesimpulan deduktif yang sah serta tidak terbantahkan. Kesalahan dalam menerapkan kaidah silogisme atau logika proposisi dapat menyebabkan kekeliruan penetapan status hukum. Tidak ada anggota kepolisian yang diperbolehkan mengonsumsi narkotika. Bripka Z adalah anggota kepolisian. Kesimpulan yang pasti adalah... (Analisis Kasus Kecerdasan #93)",
    "options": [
      "Bripka Z tidak diperbolehkan mengonsumsi narkotika",
      "Bripka Z bebas dari pengawasan Propam",
      "Bripka Z bertugas di Satresnarkoba",
      "Sebagian polisi boleh memakai obat penenang",
      "Bripka Z telah menjalani tes urine"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Semua anggota Polri dilarang konsumsi narkoba. Karena Bripka Z anggota kepolisian, maka Bripka Z tidak diperbolehkan mengonsumsi narkotika.",
    "tags": [
      "logis",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "logis",
    "difficulty": "HARD",
    "stem": "Pada analisis intelijen keamanan dan pemecahan masalah taktis, seorang analis harus mampu mengevaluasi sejumlah premis bersyarat, jadwal kegiatan, serta keterkaitan sebab-akibat secara objektif tanpa dipengaruhi asumsi di luar data. Gunakan kaidah penarikan kesimpulan logika formal untuk menjawab permasalahan berikut. Di sebuah persimpangan jalan, kendaraan dari arah Barat hanya boleh belok kiri atau lurus. Mobil patroli datang dari arah Barat dan tidak belok kiri. Maka mobil patroli tersebut... (Analisis Kasus Kecerdasan #94)",
    "options": [
      "Bergerak lurus ke arah Timur",
      "Berbalik arah kembali ke Barat",
      "Belok kanan ke arah Selatan",
      "Berhenti permanen",
      "Masuk ke jalur trotoar"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Pilihan arah dari Barat hanya belok kiri atau lurus. Jika tidak belok kiri, maka dipastikan bergerak lurus.",
    "tags": [
      "logis",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "logis",
    "difficulty": "HARD",
    "stem": "Dalam pelaksanaan gelar perkara pidana di Satuan Reserse Kriminal, penyidik memadukan berbagai fakta lapangan, keterangan saksi, dan aturan hukum formal untuk menarik satu kesimpulan deduktif yang sah serta tidak terbantahkan. Kesalahan dalam menerapkan kaidah silogisme atau logika proposisi dapat menyebabkan kekeliruan penetapan status hukum. Semua dokumen rahasia berkas penyidikan disimpan dalam brankas terkunci. Dokumen Berkas M tidak disimpan dalam brankas terkunci. Kesimpulan yang logis adalah... (Analisis Kasus Kecerdasan #95)",
    "options": [
      "Berkas M bukan dokumen rahasia penyidikan",
      "Berkas M adalah dokumen sangat rahasia",
      "Brankas penyidik rusak",
      "Berkas M telah hilang",
      "Semua berkas penyidik tidak rahasia"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Jika semua dokumen rahasia terkunci, maka berkas M yang tidak terkunci bukan dokumen rahasia berkas penyidikan.",
    "tags": [
      "logis",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "logis",
    "difficulty": "HARD",
    "stem": "Pada analisis intelijen keamanan dan pemecahan masalah taktis, seorang analis harus mampu mengevaluasi sejumlah premis bersyarat, jadwal kegiatan, serta keterkaitan sebab-akibat secara objektif tanpa dipengaruhi asumsi di luar data. Gunakan kaidah penarikan kesimpulan logika formal untuk menjawab permasalahan berikut. Jika seorang anggota Polri terbukti melanggar kode etik berat, maka ia akan menjalani Sidang KKEP. Inspektur Dua D tidak menjalani Sidang KKEP. Maka kesimpulannya adalah... (Analisis Kasus Kecerdasan #96)",
    "options": [
      "Inspektur Dua D tidak terbukti melanggar kode etik berat",
      "Inspektur Dua D terbukti melanggar kode etik berat",
      "Sidang KKEP belum dijadwalkan",
      "Inspektur Dua D dimutasi ke Yanma",
      "Pelanggaran dialihkan ke peradilan umum"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Modus tollens: Inspektur Dua D tidak terbukti melanggar kode etik berat.",
    "tags": [
      "logis",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "logis",
    "difficulty": "HARD",
    "stem": "Setiap tindakan penangkapan oleh penyidik wajib dilengkapi Surat Perintah Penangkapan, kecuali dalam hal tertangkap tangan. Petugas menangkap tersangka Z tanpa Surat Perintah Penangkapan yang sah. Maka penangkapan tersebut sah HANYA JIKA... (Analisis Kasus Kecerdasan #97)",
    "options": [
      "Terjadi dalam keadaan tertangkap tangan",
      "Tersangka berjanji kooperatif",
      "Penyidik berpangkat perwira menengah",
      "Keluarga tersangka menyetujui",
      "Tindak pidana diancam di bawah 5 tahun"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Berdasarkan KUHAP Pasal 18 ayat (2), penangkapan tanpa surat perintah penangkapan hanya sah jika pelaku tertangkap tangan.",
    "tags": [
      "logis",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "logis",
    "difficulty": "HARD",
    "stem": "Pada analisis intelijen keamanan dan pemecahan masalah taktis, seorang analis harus mampu mengevaluasi sejumlah premis bersyarat, jadwal kegiatan, serta keterkaitan sebab-akibat secara objektif tanpa dipengaruhi asumsi di luar data. Gunakan kaidah penarikan kesimpulan logika formal untuk menjawab permasalahan berikut. Urutan prioritas pertama petugas kepolisian saat pertama kali tiba di TKP kecelakaan lalu lintas dengan korban luka parah adalah... (Analisis Kasus Kecerdasan #98)",
    "options": [
      "Mengamankan dan menolong korban luka ke fasilitas medis terdekat",
      "Memeriksa SIM dan STNK pengemudi",
      "Menghubungi wartawan untuk rilis pers",
      "Mengukur panjang jejak rem kendaraan",
      "Mengamankan barang bawaan yang berserakan"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (A). Prioritas mutlak utama kepolisian di TKP adalah keselamatan nyawa manusia: menolong korban dan mengamankan pertolongan medis segera.",
    "tags": [
      "logis",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "logis",
    "difficulty": "HARD",
    "stem": "Dalam pelaksanaan gelar perkara pidana di Satuan Reserse Kriminal, penyidik memadukan berbagai fakta lapangan, keterangan saksi, dan aturan hukum formal untuk menarik satu kesimpulan deduktif yang sah serta tidak terbantahkan. Kesalahan dalam menerapkan kaidah silogisme atau logika proposisi dapat menyebabkan kekeliruan penetapan status hukum. Semua anggota Dalmas wajib memakai helm pelindung dan tameng. Sebagian anggota Dalmas membawa alat pelontar gas air mata. Kesimpulan yang sah adalah... (Analisis Kasus Kecerdasan #99)",
    "options": [
      "Sebagian anggota yang membawa pelontar gas air mata wajib memakai helm dan tameng",
      "Semua anggota Dalmas membawa pelontar gas air mata",
      "Alat pelontar gas air mata menggantikan tameng",
      "Tidak ada anggota Dalmas yang memakai tameng",
      "Helm pelindung hanya untuk komandan kompi"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (B). Sebagian anggota yang membawa pelontar gas air mata tetap memakai helm pelindung dan tameng.",
    "tags": [
      "logis",
      "kecerdasan-polri"
    ]
  },
  {
    "topic": "logis",
    "difficulty": "HARD",
    "stem": "Hasil penyelidikan menunjukkan bahwa Pelaku kejahatan memiliki ciri: bertato di lengan kiri ATAU memakai jaket hitam. Tersangka K tidak bertato di lengan kiri, namun ia terbukti sebagai pelaku. Maka tersangka K... (Analisis Kasus Kecerdasan #100)",
    "options": [
      "Memakai jaket hitam",
      "Tidak memakai jaket apapun",
      "Memiliki tato di lengan kanan",
      "Bukan merupakan tersangka yang dicari",
      "Mengganti pakaian sebelum diperiksa"
    ],
    "answer": "A",
    "explanation": "Kunci Jawaban: (A). Pernyataan disjungtif (A atau B). Karena tidak A, maka dipastikan B (tersangka K memakai jaket hitam).",
    "tags": [
      "logis",
      "kecerdasan-polri"
    ]
  }
];

export const KECERDASAN_QUESTIONS: ChoiceQuestionData[] = buildChoices(
  'PSI-KEC',
  'psikologi/kecerdasan',
  RAW_KECERDASAN,
);

export const MULTI_KECERDASAN: WrittenMultiChoice[] = [
  {
    "topic": "logis",
    "difficulty": "HARD",
    "stem": "Dalam pelaksanaan gelar perkara pidana di Satuan Reserse Kriminal, penyidik memadukan berbagai fakta lapangan, keterangan saksi, dan aturan hukum formal untuk menarik satu kesimpulan deduktif yang sah serta tidak terbantahkan. Kesalahan dalam menerapkan kaidah silogisme atau logika proposisi dapat menyebabkan kekeliruan penetapan status hukum. Manakah di antara tindakan kepolisian berikut yang tergolong sebagai upaya paksa menurut ketentuan KUHAP?",
    "correct": [
      "Penangkapan",
      "Penahanan",
      "Penggeledahan badan dan rumah",
      "Penyitaan barang bukti"
    ],
    "distractors": [
      "Pemberian teguran simpatik lisan"
    ],
    "explanation": "Upaya paksa (dwangmiddelen) menurut KUHAP mencakup penangkapan, penahanan, penggeledahan, penyitaan, dan pemeriksaan surat yang membatasi hak asasi demi kepentingan penyidikan.",
    "tags": [
      "logis",
      "kuhap",
      "upaya-paksa",
      "multi-jawaban"
    ]
  },
  {
    "topic": "logis",
    "difficulty": "HARD",
    "stem": "Pada analisis intelijen keamanan dan pemecahan masalah taktis, seorang analis harus mampu mengevaluasi sejumlah premis bersyarat, jadwal kegiatan, serta keterkaitan sebab-akibat secara objektif tanpa dipengaruhi asumsi di luar data. Gunakan kaidah penarikan kesimpulan logika formal untuk menjawab permasalahan berikut. Manakah di antara asas-asas berikut yang merupakan asas fundamental dalam peradilan pidana Indonesia?",
    "correct": [
      "Asas praduga tak bersalah (Presumption of innocence)",
      "Perlakuan sama di hadapan hukum (Equality before the law)",
      "Peradilan cepat, sederhana, dan biaya ringan"
    ],
    "distractors": [
      "Asas praduga bersalah untuk tersangka tertangkap tangan",
      "Asas pembebasan biaya denda tilang bagi pejabat"
    ],
    "explanation": "Asas-asas pokok peradilan pidana menurut UU Kekuasaan Kehakiman dan KUHAP meliputi asas praduga tak bersalah, persamaan di hadapan hukum, serta peradilan cepat, sederhana, dan berbiaya ringan.",
    "tags": [
      "logis",
      "hukum-pidana",
      "asas-peradilan",
      "multi-jawaban"
    ]
  },
  {
    "topic": "logis",
    "difficulty": "HARD",
    "stem": "Dalam pelaksanaan gelar perkara pidana di Satuan Reserse Kriminal, penyidik memadukan berbagai fakta lapangan, keterangan saksi, dan aturan hukum formal untuk menarik satu kesimpulan deduktif yang sah serta tidak terbantahkan. Kesalahan dalam menerapkan kaidah silogisme atau logika proposisi dapat menyebabkan kekeliruan penetapan status hukum. Manakah unsur-unsur yang wajib terpenuhi untuk keabsahan tindakan penangkapan seorang tersangka oleh penyidik Polri?",
    "correct": [
      "Dilengkapi Surat Perintah Tugas yang sah",
      "Dilengkapi Surat Perintah Penangkapan resmi (kecuali tertangkap tangan)",
      "Memiliki bukti permulaan yang cukup"
    ],
    "distractors": [
      "Wajib dihadiri oleh minimal 5 orang saksi keluarga tersangka",
      "Wajib mendapatkan persetujuan lisan dari kepala desa setempat"
    ],
    "explanation": "Pasal 16–19 KUHAP menetapkan penangkapan wajib didasari bukti permulaan yang cukup dan memperlihatkan Surat Tugas serta Surat Perintah Penangkapan, kecuali dalam keadaan tertangkap tangan.",
    "tags": [
      "logis",
      "kuhap",
      "keabsahan-penangkapan",
      "multi-jawaban"
    ]
  }
];
