export interface DenahQuestion {
  code: string;
  stem: string;
  options: readonly [string, string, string, string, string];
  answer: 'A' | 'B' | 'C' | 'D' | 'E';
  explanation: string;
  tags: readonly string[];
}

export const DENAH_LOKASI_QUESTIONS: DenahQuestion[] = [
  {
    "code": "PSI-KEC-DENAH-01",
    "stem": "Dalam kegiatan orientasi wilayah hukum dan pemetaan rute patroli dialogis, regu Samapta menggunakan denah tata letak bangunan serta jaringan jalan di atas sebagai panduan navigasi taktis di lapangan. Ketepatan membaca posisi relatif antar-objek dan arah mata angin sangat diperlukan agar pergerakan unit patroli berlangsung cepat serta akurat. Berdasarkan denah di atas, bangunan yang berada tepat di sebelah utara R. Budi adalah...",
    "options": [
      "R. Ahmad",
      "Kantor Polisi",
      "KUA",
      "Gd. Serbaguna",
      "Balai Desa"
    ],
    "answer": "C",
    "explanation": "R. Budi terletak di utara Jln. Kusuma Raya. Di sebelah utara R. Budi (seberang Jln. Madukara ke arah atas) terdapat bangunan KUA.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-02",
    "stem": "Saat melaksanakan simulasi pengamanan kawasan pemukiman dan fasilitas umum, perwira pengendali meminta seluruh personel mengamati struktur persimpangan jalan serta letak gedung pada peta acuan wilayah. Analisis spasial yang cermat terhadap denah tersebut menjadi dasar penentuan titik sekat dan jalur respons cepat kepolisian. Bangunan yang terletak di sudut antara Jln. Kusuma Raya dan Jln. Rambutan di sebelah utara jalan adalah...",
    "options": [
      "Gd. Serbaguna",
      "Kantor Polisi",
      "R. Ahmad",
      "KUD",
      "R. Budi"
    ],
    "answer": "B",
    "explanation": "Kantor Polisi terletak di tepi barat Jln. Kusuma Raya dan berada di sebelah timur Jln. Rambutan (di sebelah utara Jln. Kusuma Raya).",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-03",
    "stem": "Pada tahap perencanaan gelar kekuatan pengamanan kegiatan masyarakat, tim operasional memetakan jalur lintasan dan posisi bangunan vital berdasarkan gambar denah wilayah yang tersedia. Setiap anggota wajib menguasai orientasi arah Utara, Timur, Selatan, dan Barat pada peta guna menghindari kesalahan pergerakan di lapangan. Masjid terletak di sebelah... dari Lapangan.",
    "options": [
      "Barat",
      "Timur",
      "Utara",
      "Selatan",
      "Barat Daya"
    ],
    "answer": "B",
    "explanation": "Lapangan dibatasi oleh Jln. Merdeka di sebelah timurnya. Di sebelah timur Jln. Merdeka terdapat Masjid. Jadi Masjid berada di sebelah timur Lapangan.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-04",
    "stem": "Dalam kegiatan orientasi wilayah hukum dan pemetaan rute patroli dialogis, regu Samapta menggunakan denah tata letak bangunan serta jaringan jalan di atas sebagai panduan navigasi taktis di lapangan. Ketepatan membaca posisi relatif antar-objek dan arah mata angin sangat diperlukan agar pergerakan unit patroli berlangsung cepat serta akurat. Jika seseorang berada di Balai Desa dan berjalan ke arah barat menyusuri Jln. Kusuma Raya, bangunan pertama di sebelah kanan jalan yang ditemuinya adalah...",
    "options": [
      "R. Sinta",
      "KUA",
      "R. Andi",
      "R. Budi",
      "Kantor Polisi"
    ],
    "answer": "C",
    "explanation": "Balai Desa terletak di timur Jln. Madukara. Berjalan ke barat melintasi pertigaan Jln. Madukara, di sebelah kanan (utara jalan) akan mendapati R. Andi.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-05",
    "stem": "Saat melaksanakan simulasi pengamanan kawasan pemukiman dan fasilitas umum, perwira pengendali meminta seluruh personel mengamati struktur persimpangan jalan serta letak gedung pada peta acuan wilayah. Analisis spasial yang cermat terhadap denah tersebut menjadi dasar penentuan titik sekat dan jalur respons cepat kepolisian. Bangunan yang berada paling selatan pada wilayah yang dibatasi Jln. Pemuda adalah...",
    "options": [
      "R. Bayu",
      "Lapangan",
      "R. Anita",
      "KUD",
      "R. Bagas"
    ],
    "answer": "C",
    "explanation": "Di sepanjang Jln. Pemuda bagian timur, terdapat R. Bayu di utara dan R. Anita di posisi paling selatan.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-06",
    "stem": "Pada tahap perencanaan gelar kekuatan pengamanan kegiatan masyarakat, tim operasional memetakan jalur lintasan dan posisi bangunan vital berdasarkan gambar denah wilayah yang tersedia. Setiap anggota wajib menguasai orientasi arah Utara, Timur, Selatan, dan Barat pada peta guna menghindari kesalahan pergerakan di lapangan. Rumah warga yang terletak tepat di sebelah timur Kantor Polisi adalah...",
    "options": [
      "R. Budi",
      "R. Ahmad",
      "R. Andi",
      "R. Sinta",
      "R. Sari"
    ],
    "answer": "A",
    "explanation": "Berderet di sebelah utara Jln. Kusuma Raya dari barat ke timur: Kantor Polisi, R. Budi, R. Andi. Jadi di sebelah timur Kantor Polisi adalah R. Budi.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-07",
    "stem": "Dalam kegiatan orientasi wilayah hukum dan pemetaan rute patroli dialogis, regu Samapta menggunakan denah tata letak bangunan serta jaringan jalan di atas sebagai panduan navigasi taktis di lapangan. Ketepatan membaca posisi relatif antar-objek dan arah mata angin sangat diperlukan agar pergerakan unit patroli berlangsung cepat serta akurat. Bangunan SD Brlian Jaya terletak di sebelah... Jln. Majapahit.",
    "options": [
      "Barat",
      "Timur",
      "Utara",
      "Selatan",
      "Tenggara"
    ],
    "answer": "B",
    "explanation": "SD Brlian Jaya terletak di sisi timur Jln. Majapahit dan di sebelah utara Jln. Kusuma Raya.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-08",
    "stem": "Saat melaksanakan simulasi pengamanan kawasan pemukiman dan fasilitas umum, perwira pengendali meminta seluruh personel mengamati struktur persimpangan jalan serta letak gedung pada peta acuan wilayah. Analisis spasial yang cermat terhadap denah tersebut menjadi dasar penentuan titik sekat dan jalur respons cepat kepolisian. Di sebelah selatan R. Budi, dipisahkan oleh Jln. Kusuma Raya, berdiri bangunan...",
    "options": [
      "Gd. Serbaguna",
      "R. Ahmad",
      "KUD",
      "R. Bayu",
      "R. Anita"
    ],
    "answer": "B",
    "explanation": "R. Budi berada di sisi utara Jln. Kusuma Raya. Tepat di seberang selatannya terdapat R. Ahmad.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-09",
    "stem": "Pada tahap perencanaan gelar kekuatan pengamanan kegiatan masyarakat, tim operasional memetakan jalur lintasan dan posisi bangunan vital berdasarkan gambar denah wilayah yang tersedia. Setiap anggota wajib menguasai orientasi arah Utara, Timur, Selatan, dan Barat pada peta guna menghindari kesalahan pergerakan di lapangan. Posisi R. Bagas terletak pada sudut persimpangan antara jalan...",
    "options": [
      "Jln. Pemuda dan Jln. Sentosa",
      "Jln. Merdeka dan Jln. Sentosa",
      "Jln. Majapahit dan Jln. Kusuma Raya",
      "Jln. Madukara dan Jln. Kusuma Raya",
      "Jln. Rambutan dan Jln. Kusuma Raya"
    ],
    "answer": "B",
    "explanation": "R. Bagas terletak di sebelah timur Jln. Merdeka dan di sebelah utara Jln. Sentosa (persimpangan Jln. Merdeka &amp; Sentosa).",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-10",
    "stem": "Dalam kegiatan orientasi wilayah hukum dan pemetaan rute patroli dialogis, regu Samapta menggunakan denah tata letak bangunan serta jaringan jalan di atas sebagai panduan navigasi taktis di lapangan. Ketepatan membaca posisi relatif antar-objek dan arah mata angin sangat diperlukan agar pergerakan unit patroli berlangsung cepat serta akurat. Rumah warga yang berdekatan langsung dengan batas utara Balai Desa adalah...",
    "options": [
      "R. Sinta",
      "R. Sari",
      "R. Andi",
      "R. Bayu",
      "R. Anita"
    ],
    "answer": "A",
    "explanation": "R. Sinta terletak di utara Balai Desa (dipisahkan oleh kawasan permukiman/Jln. Madukara bagian utara).",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-11",
    "stem": "Saat melaksanakan simulasi pengamanan kawasan pemukiman dan fasilitas umum, perwira pengendali meminta seluruh personel mengamati struktur persimpangan jalan serta letak gedung pada peta acuan wilayah. Analisis spasial yang cermat terhadap denah tersebut menjadi dasar penentuan titik sekat dan jalur respons cepat kepolisian. Petugas patroli berangkat dari Kantor Polisi menuju Masjid. Rute jalan paling efisien yang dilalui adalah...",
    "options": [
      "Jln. Rambutan -&gt; Jln. Pemuda -&gt; Jln. Sentosa",
      "Jln. Kusuma Raya lurus ke timur -&gt; belok kanan ke Jln. Merdeka -&gt; belok kiri ke Jln. Sentosa",
      "Jln. Kusuma Raya lurus ke timur -&gt; belok kiri ke Jln. Majapahit -&gt; belok kanan ke Jln. Sentosa",
      "Jln. Kusuma Raya lurus ke timur -&gt; belok kanan ke Jln. Pemuda -&gt; belok kiri ke Jln. Sentosa",
      "Jln. Madukara -&gt; Jln. Majapahit -&gt; Jln. Merdeka"
    ],
    "answer": "B",
    "explanation": "Kantor Polisi berada di Jln. Kusuma Raya barat. Menyusuri Jln. Kusuma Raya ke timur hingga persimpangan Jln. Merdeka, belok kanan (selatan) lalu belok kiri (timur) ke Jln. Sentosa menuju Masjid.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-12",
    "stem": "Pada tahap perencanaan gelar kekuatan pengamanan kegiatan masyarakat, tim operasional memetakan jalur lintasan dan posisi bangunan vital berdasarkan gambar denah wilayah yang tersedia. Setiap anggota wajib menguasai orientasi arah Utara, Timur, Selatan, dan Barat pada peta guna menghindari kesalahan pergerakan di lapangan. Seorang murid dari R. Anita ingin pergi ke SD Brlian Jaya. Jalur yang paling tepat adalah berjalan ke utara menyusuri...",
    "options": [
      "Jln. Pemuda -&gt; belok timur ke Jln. Kusuma Raya -&gt; belok utara ke Jln. Majapahit",
      "Jln. Rambutan -&gt; Jln. Madukara -&gt; Jln. Majapahit",
      "Jln. Merdeka -&gt; Jln. Sentosa -&gt; Jln. Pemuda",
      "Jln. Sentosa -&gt; Jln. Rambutan -&gt; Jln. Kusuma Raya",
      "Jln. Pemuda -&gt; Jln. Sentosa -&gt; Jln. Merdeka"
    ],
    "answer": "A",
    "explanation": "R. Anita berada di Jln. Pemuda. Berjalan ke utara menyusuri Jln. Pemuda, tiba di perempatan Jln. Kusuma Raya belok kanan (timur), lalu belok kiri (utara) ke Jln. Majapahit menuju SD Brlian Jaya.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-13",
    "stem": "Dalam kegiatan orientasi wilayah hukum dan pemetaan rute patroli dialogis, regu Samapta menggunakan denah tata letak bangunan serta jaringan jalan di atas sebagai panduan navigasi taktis di lapangan. Ketepatan membaca posisi relatif antar-objek dan arah mata angin sangat diperlukan agar pergerakan unit patroli berlangsung cepat serta akurat. Apabila Jln. Madukara ditutup total karena perbaikan, warga dari R. Sinta yang akan ke KUD harus berputar melalui...",
    "options": [
      "Jln. Majapahit -&gt; Jln. Kusuma Raya -&gt; Jln. Pemuda",
      "Jln. Rambutan -&gt; Jln. Sentosa -&gt; Jln. Merdeka",
      "Jln. Merdeka -&gt; Jln. Sentosa -&gt; Jln. Rambutan",
      "Langsung menyeberang Lapangan",
      "Jln. Kusuma Raya -&gt; Jln. Rambutan -&gt; Jln. Sentosa"
    ],
    "answer": "A",
    "explanation": "Jika Jln. Madukara ditutup, dari R. Sinta bergerak ke timur ke Jln. Majapahit, turun ke selatan ke Jln. Kusuma Raya, lalu menuju kawasan persimpangan Jln. Pemuda di mana KUD berada.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-14",
    "stem": "Saat melaksanakan simulasi pengamanan kawasan pemukiman dan fasilitas umum, perwira pengendali meminta seluruh personel mengamati struktur persimpangan jalan serta letak gedung pada peta acuan wilayah. Analisis spasial yang cermat terhadap denah tersebut menjadi dasar penentuan titik sekat dan jalur respons cepat kepolisian. Kurir mengantar paket dari KUA ke R. Bagas. Jalan yang TIDAK perlu dilalui adalah...",
    "options": [
      "Jln. Madukara",
      "Jln. Kusuma Raya",
      "Jln. Merdeka",
      "Jln. Sentosa",
      "Jln. Rambutan"
    ],
    "answer": "E",
    "explanation": "KUA berada di Jln. Madukara, R. Bagas berada di Jln. Sentosa/Merdeka. Jalur tercepat melalui Jln. Madukara -&gt; Jln. Kusuma Raya -&gt; Jln. Merdeka -&gt; Jln. Sentosa. Jln. Rambutan ada di ujung barat sehingga tidak perlu dilalui.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-15",
    "stem": "Pada tahap perencanaan gelar kekuatan pengamanan kegiatan masyarakat, tim operasional memetakan jalur lintasan dan posisi bangunan vital berdasarkan gambar denah wilayah yang tersedia. Setiap anggota wajib menguasai orientasi arah Utara, Timur, Selatan, dan Barat pada peta guna menghindari kesalahan pergerakan di lapangan. Jalan yang membatasi antara Balai Desa dan SD Brlian Jaya adalah...",
    "options": [
      "Jln. Madukara",
      "Jln. Majapahit",
      "Jln. Merdeka",
      "Jln. Pemuda",
      "Jln. Kusuma Raya"
    ],
    "answer": "B",
    "explanation": "Balai Desa terletak di sebelah barat Jln. Majapahit, sedangkan SD Brlian Jaya terletak di sebelah timur Jln. Majapahit.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-16",
    "stem": "Dalam kegiatan orientasi wilayah hukum dan pemetaan rute patroli dialogis, regu Samapta menggunakan denah tata letak bangunan serta jaringan jalan di atas sebagai panduan navigasi taktis di lapangan. Ketepatan membaca posisi relatif antar-objek dan arah mata angin sangat diperlukan agar pergerakan unit patroli berlangsung cepat serta akurat. Untuk memindahkan barang dari Gd. Serbaguna ke KUD, rute paling lurus adalah menyusuri...",
    "options": [
      "Jln. Rambutan ke utara",
      "Jln. Kusuma Raya bagian selatan ke arah timur",
      "Jln. Pemuda ke selatan",
      "Jln. Merdeka ke utara",
      "Jln. Majapahit ke selatan"
    ],
    "answer": "B",
    "explanation": "Gd. Serbaguna dan KUD berada di deretan bangunan selatan Jln. Kusuma Raya. Bergerak dari barat ke timur menyusuri Jln. Kusuma Raya.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-17",
    "stem": "Saat melaksanakan simulasi pengamanan kawasan pemukiman dan fasilitas umum, perwira pengendali meminta seluruh personel mengamati struktur persimpangan jalan serta letak gedung pada peta acuan wilayah. Analisis spasial yang cermat terhadap denah tersebut menjadi dasar penentuan titik sekat dan jalur respons cepat kepolisian. Jika seorang warga berencana pergi dari R. Ahmad ke Balai Desa, berapakah persimpangan jalan utama yang harus dilewatinya?",
    "options": [
      "1 persimpangan",
      "2 persimpangan",
      "3 persimpangan",
      "4 persimpangan",
      "Tanpa persimpangan"
    ],
    "answer": "B",
    "explanation": "Dari R. Ahmad menyusuri Jln. Kusuma Raya ke timur: melintasi persimpangan Jln. Pemuda/Madukara (1), lalu melintasi persimpangan Jln. Majapahit (2) untuk sampai ke Balai Desa.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-18",
    "stem": "Pada tahap perencanaan gelar kekuatan pengamanan kegiatan masyarakat, tim operasional memetakan jalur lintasan dan posisi bangunan vital berdasarkan gambar denah wilayah yang tersedia. Setiap anggota wajib menguasai orientasi arah Utara, Timur, Selatan, dan Barat pada peta guna menghindari kesalahan pergerakan di lapangan. Mobil polisi dari Kantor Polisi ingin menuju lokasi R. Bayu. Arah belokan pertama setelah menyusuri Jln. Kusuma Raya ke timur adalah belok...",
    "options": [
      "Kiri masuk Jln. Madukara",
      "Kanan masuk Jln. Pemuda",
      "Kiri masuk Jln. Majapahit",
      "Kanan masuk Jln. Merdeka",
      "Putar balik ke Jln. Rambutan"
    ],
    "answer": "B",
    "explanation": "R. Bayu berada di sebelah timur Jln. Pemuda (selatan Jln. Kusuma Raya). Dari Kantor Polisi ke timur di Jln. Kusuma Raya, lalu belok kanan (selatan) masuk ke Jln. Pemuda.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-19",
    "stem": "Dalam kegiatan orientasi wilayah hukum dan pemetaan rute patroli dialogis, regu Samapta menggunakan denah tata letak bangunan serta jaringan jalan di atas sebagai panduan navigasi taktis di lapangan. Ketepatan membaca posisi relatif antar-objek dan arah mata angin sangat diperlukan agar pergerakan unit patroli berlangsung cepat serta akurat. Akses jalan tercepat dari R. Sari menuju Masjid adalah menyusuri...",
    "options": [
      "Jln. Majapahit ke selatan -&gt; belok timur ke Jln. Kusuma Raya -&gt; belok selatan ke Jln. Merdeka",
      "Jln. Rambutan -&gt; Jln. Pemuda",
      "Jln. Madukara -&gt; Jln. Sentosa",
      "Jln. Kusuma Raya -&gt; Jln. Pemuda",
      "Jln. Pemuda -&gt; Jln. Merdeka"
    ],
    "answer": "A",
    "explanation": "Dari R. Sari (utara Jln. Majapahit), bergerak ke selatan di Jln. Majapahit, belok timur di Jln. Kusuma Raya, lalu belok selatan di Jln. Merdeka langsung menuju Masjid.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-20",
    "stem": "Saat melaksanakan simulasi pengamanan kawasan pemukiman dan fasilitas umum, perwira pengendali meminta seluruh personel mengamati struktur persimpangan jalan serta letak gedung pada peta acuan wilayah. Analisis spasial yang cermat terhadap denah tersebut menjadi dasar penentuan titik sekat dan jalur respons cepat kepolisian. Di manakah posisi Lapangan terhadap Jln. Pemuda dan Jln. Merdeka?",
    "options": [
      "Di antara Jln. Pemuda (barat) dan Jln. Merdeka (timur)",
      "Di sebelah utara Jln. Pemuda",
      "Di sebelah timur Jln. Merdeka",
      "Di sebelah selatan Jln. Sentosa",
      "Di sebelah barat Jln. Rambutan"
    ],
    "answer": "A",
    "explanation": "Lapangan membentang secara vertikal di antara Jln. Pemuda di sebelah baratnya dan Jln. Merdeka di sebelah timurnya.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-21",
    "stem": "Pada tahap perencanaan gelar kekuatan pengamanan kegiatan masyarakat, tim operasional memetakan jalur lintasan dan posisi bangunan vital berdasarkan gambar denah wilayah yang tersedia. Setiap anggota wajib menguasai orientasi arah Utara, Timur, Selatan, dan Barat pada peta guna menghindari kesalahan pergerakan di lapangan. Bangunan publik/fasilitas umum berikut ini yang terletak di utara Jln. Kusuma Raya adalah...",
    "options": [
      "KUD dan Gd. Serbaguna",
      "Kantor Polisi, KUA, Balai Desa, dan SD Brlian Jaya",
      "Masjid dan Lapangan",
      "R. Bayu dan R. Anita",
      "R. Ahmad dan KUD"
    ],
    "answer": "B",
    "explanation": "Fasilitas umum di utara Jln. Kusuma Raya mencakup Kantor Polisi, KUA, Balai Desa, dan SD Brlian Jaya. KUD &amp; Gd. Serbaguna ada di selatan.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-22",
    "stem": "Dalam kegiatan orientasi wilayah hukum dan pemetaan rute patroli dialogis, regu Samapta menggunakan denah tata letak bangunan serta jaringan jalan di atas sebagai panduan navigasi taktis di lapangan. Ketepatan membaca posisi relatif antar-objek dan arah mata angin sangat diperlukan agar pergerakan unit patroli berlangsung cepat serta akurat. Bangunan pelayanan masyarakat yang berada paling barat pada denah adalah...",
    "options": [
      "KUA",
      "Balai Desa",
      "Kantor Polisi",
      "SD Brlian Jaya",
      "Gd. Serbaguna"
    ],
    "answer": "C",
    "explanation": "Kantor Polisi dan Gd. Serbaguna ada di posisi paling barat. Di antara keduanya yang merupakan instansi utama di utara Jln. Kusuma Raya paling barat adalah Kantor Polisi.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-23",
    "stem": "Saat melaksanakan simulasi pengamanan kawasan pemukiman dan fasilitas umum, perwira pengendali meminta seluruh personel mengamati struktur persimpangan jalan serta letak gedung pada peta acuan wilayah. Analisis spasial yang cermat terhadap denah tersebut menjadi dasar penentuan titik sekat dan jalur respons cepat kepolisian. Manakah kelompok rumah warga berikut yang semuanya berada di SELATAN Jln. Kusuma Raya?",
    "options": [
      "R. Budi, R. Andi, R. Sinta",
      "R. Ahmad, R. Bayu, R. Anita",
      "R. Sari, R. Bagas, R. Sinta",
      "R. Budi, R. Bayu, R. Sari",
      "R. Andi, R. Ahmad, R. Bagas"
    ],
    "answer": "B",
    "explanation": "Rumah warga di selatan Jln. Kusuma Raya adalah R. Ahmad, R. Bayu, R. Anita, dan R. Bagas. Pilihan B mencantumkan R. Ahmad, R. Bayu, R. Anita.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-24",
    "stem": "Pada tahap perencanaan gelar kekuatan pengamanan kegiatan masyarakat, tim operasional memetakan jalur lintasan dan posisi bangunan vital berdasarkan gambar denah wilayah yang tersedia. Setiap anggota wajib menguasai orientasi arah Utara, Timur, Selatan, dan Barat pada peta guna menghindari kesalahan pergerakan di lapangan. Manakah kelompok rumah warga berikut yang semuanya berada di UTARA Jln. Kusuma Raya?",
    "options": [
      "R. Ahmad, R. Bayu, R. Anita",
      "R. Budi, R. Andi, R. Sinta, R. Sari",
      "R. Bagas, R. Anita, R. Bayu",
      "R. Ahmad, R. Budi, R. Andi",
      "R. Sinta, R. Bayu, R. Sari"
    ],
    "answer": "B",
    "explanation": "Rumah warga di utara Jln. Kusuma Raya adalah R. Budi, R. Andi, R. Sinta, dan R. Sari.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-25",
    "stem": "Dalam kegiatan orientasi wilayah hukum dan pemetaan rute patroli dialogis, regu Samapta menggunakan denah tata letak bangunan serta jaringan jalan di atas sebagai panduan navigasi taktis di lapangan. Ketepatan membaca posisi relatif antar-objek dan arah mata angin sangat diperlukan agar pergerakan unit patroli berlangsung cepat serta akurat. Bangunan bertingkat tinggi (ikon gedung bertingkat) pada denah tersebut adalah...",
    "options": [
      "Balai Desa, Kantor Polisi, SD Brlian Jaya",
      "KUA, Gd. Serbaguna, KUD",
      "R. Sinta, R. Sari, R. Budi",
      "Masjid, Balai Desa, Kantor Polisi",
      "R. Bayu, R. Anita, R. Bagas"
    ],
    "answer": "B",
    "explanation": "Ikon gedung bertingkat/kompleks komersial digunakan pada KUA, Gd. Serbaguna, dan KUD.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-26",
    "stem": "Saat melaksanakan simulasi pengamanan kawasan pemukiman dan fasilitas umum, perwira pengendali meminta seluruh personel mengamati struktur persimpangan jalan serta letak gedung pada peta acuan wilayah. Analisis spasial yang cermat terhadap denah tersebut menjadi dasar penentuan titik sekat dan jalur respons cepat kepolisian. Rumah warga yang posisinya paling dekat dengan fasilitas ibadah (Masjid) adalah...",
    "options": [
      "R. Anita",
      "R. Bayu",
      "R. Bagas",
      "R. Sari",
      "R. Ahmad"
    ],
    "answer": "C",
    "explanation": "R. Bagas terletak di sebelah tenggara Masjid di sepanjang Jln. Sentosa, berjarak paling dekat dibanding rumah lainnya.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-27",
    "stem": "Pada tahap perencanaan gelar kekuatan pengamanan kegiatan masyarakat, tim operasional memetakan jalur lintasan dan posisi bangunan vital berdasarkan gambar denah wilayah yang tersedia. Setiap anggota wajib menguasai orientasi arah Utara, Timur, Selatan, dan Barat pada peta guna menghindari kesalahan pergerakan di lapangan. Apabila diukur dari arah barat ke timur di sepanjang Jln. Kusuma Raya utara, urutan bangunan yang benar adalah...",
    "options": [
      "Kantor Polisi -&gt; R. Budi -&gt; R. Andi -&gt; Balai Desa -&gt; SD Brlian Jaya",
      "KUA -&gt; R. Sinta -&gt; R. Sari -&gt; SD Brlian Jaya",
      "Gd. Serbaguna -&gt; R. Ahmad -&gt; KUD -&gt; R. Bayu",
      "R. Budi -&gt; Kantor Polisi -&gt; Balai Desa -&gt; SD Brlian Jaya",
      "Kantor Polisi -&gt; KUA -&gt; Balai Desa -&gt; R. Sinta"
    ],
    "answer": "A",
    "explanation": "Dari barat ke timur di utara Jln. Kusuma Raya: Kantor Polisi -&gt; R. Budi -&gt; R. Andi -&gt; (Jln. Madukara) -&gt; Balai Desa -&gt; (Jln. Majapahit) -&gt; SD Brlian Jaya.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-28",
    "stem": "Dalam kegiatan orientasi wilayah hukum dan pemetaan rute patroli dialogis, regu Samapta menggunakan denah tata letak bangunan serta jaringan jalan di atas sebagai panduan navigasi taktis di lapangan. Ketepatan membaca posisi relatif antar-objek dan arah mata angin sangat diperlukan agar pergerakan unit patroli berlangsung cepat serta akurat. Manakah bangunan yang diapit oleh Jln. Madukara di barat dan Jln. Majapahit di timur?",
    "options": [
      "KUA dan R. Sinta",
      "Balai Desa",
      "SD Brlian Jaya",
      "R. Sari",
      "R. Andi"
    ],
    "answer": "B",
    "explanation": "Balai Desa terletak di blok antara Jln. Madukara (barat) dan Jln. Majapahit (timur).",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-29",
    "stem": "Saat melaksanakan simulasi pengamanan kawasan pemukiman dan fasilitas umum, perwira pengendali meminta seluruh personel mengamati struktur persimpangan jalan serta letak gedung pada peta acuan wilayah. Analisis spasial yang cermat terhadap denah tersebut menjadi dasar penentuan titik sekat dan jalur respons cepat kepolisian. Jika R. Bayu dipandang dari R. Anita, maka R. Bayu berada di arah...",
    "options": [
      "Selatan",
      "Utara",
      "Timur",
      "Barat",
      "Tenggara"
    ],
    "answer": "B",
    "explanation": "R. Anita berada di selatan Jln. Pemuda, sedangkan R. Bayu berada di utara Jln. Pemuda (sebelah barat Lapangan). Berarti R. Bayu berada di utara R. Anita.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-30",
    "stem": "Pada tahap perencanaan gelar kekuatan pengamanan kegiatan masyarakat, tim operasional memetakan jalur lintasan dan posisi bangunan vital berdasarkan gambar denah wilayah yang tersedia. Setiap anggota wajib menguasai orientasi arah Utara, Timur, Selatan, dan Barat pada peta guna menghindari kesalahan pergerakan di lapangan. Di sebelah barat daya persimpangan Jln. Kusuma Raya dan Jln. Pemuda terdapat bangunan...",
    "options": [
      "KUD",
      "R. Ahmad",
      "R. Bayu",
      "Balai Desa",
      "KUA"
    ],
    "answer": "A",
    "explanation": "Persimpangan Jln. Kusuma Raya dan Jln. Pemuda/Madukara: sudut barat daya (kiri bawah perempatan) diisi oleh KUD.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-31",
    "stem": "Dalam kegiatan orientasi wilayah hukum dan pemetaan rute patroli dialogis, regu Samapta menggunakan denah tata letak bangunan serta jaringan jalan di atas sebagai panduan navigasi taktis di lapangan. Ketepatan membaca posisi relatif antar-objek dan arah mata angin sangat diperlukan agar pergerakan unit patroli berlangsung cepat serta akurat. Terjadi unjuk rasa di Balai Desa. Kapolsek memerintahkan penempatan personel untuk memblokade arus lalu lintas dari arah timur. Jalan yang harus ditutup adalah...",
    "options": [
      "Jln. Rambutan",
      "Jln. Madukara",
      "Jln. Majapahit",
      "Jln. Pemuda",
      "Jln. Sentosa"
    ],
    "answer": "C",
    "explanation": "Balai Desa berada di barat Jln. Majapahit. Arus lalu lintas dari timur menuju Balai Desa melalui Jln. Majapahit, sehingga Jln. Majapahit perlu diblokade.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-32",
    "stem": "Saat melaksanakan simulasi pengamanan kawasan pemukiman dan fasilitas umum, perwira pengendali meminta seluruh personel mengamati struktur persimpangan jalan serta letak gedung pada peta acuan wilayah. Analisis spasial yang cermat terhadap denah tersebut menjadi dasar penentuan titik sekat dan jalur respons cepat kepolisian. Apabila terjadi kebakaran di KUA, unit pemadam kebakaran yang meluncur dari Kantor Polisi paling cepat menjangkau lokasi dengan melintasi...",
    "options": [
      "Jln. Kusuma Raya -&gt; belok kiri ke Jln. Madukara ke arah utara",
      "Jln. Rambutan -&gt; Jln. Sentosa",
      "Jln. Majapahit -&gt; Jln. Sentosa",
      "Jln. Pemuda -&gt; Jln. Merdeka",
      "Jln. Kusuma Raya -&gt; Jln. Majapahit"
    ],
    "answer": "A",
    "explanation": "KUA berada di Jln. Madukara bagian utara. Dari Kantor Polisi di Jln. Kusuma Raya, bergerak ke timur lalu belok kiri (utara) masuk Jln. Madukara.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-33",
    "stem": "Pada tahap perencanaan gelar kekuatan pengamanan kegiatan masyarakat, tim operasional memetakan jalur lintasan dan posisi bangunan vital berdasarkan gambar denah wilayah yang tersedia. Setiap anggota wajib menguasai orientasi arah Utara, Timur, Selatan, dan Barat pada peta guna menghindari kesalahan pergerakan di lapangan. Petugas pos pengamanan (Pospam) akan didirikan di titik paling strategis untuk memantau pergerakan warga dari SD Brlian Jaya dan Masjid. Lokasi pertigaan/perempatan terbaik adalah persimpangan...",
    "options": [
      "Jln. Rambutan dan Jln. Kusuma Raya",
      "Jln. Majapahit, Jln. Merdeka, dan Jln. Kusuma Raya",
      "Jln. Madukara dan Jln. Pemuda",
      "Jln. Sentosa dan Jln. Pemuda",
      "Jln. Rambutan dan Jln. Sentosa"
    ],
    "answer": "B",
    "explanation": "Persimpangan Jln. Kusuma Raya dengan Jln. Majapahit / Jln. Merdeka menghubungkan akses langsung ke SD Brlian Jaya (utara) dan Masjid (selatan).",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-34",
    "stem": "Dalam kegiatan orientasi wilayah hukum dan pemetaan rute patroli dialogis, regu Samapta menggunakan denah tata letak bangunan serta jaringan jalan di atas sebagai panduan navigasi taktis di lapangan. Ketepatan membaca posisi relatif antar-objek dan arah mata angin sangat diperlukan agar pergerakan unit patroli berlangsung cepat serta akurat. Seseorang dicurigai melarikan diri dari KUD menuju arah tenggara. Kemungkinan area pemukiman yang dituju pelaku adalah...",
    "options": [
      "R. Sinta",
      "R. Budi",
      "R. Anita atau R. Bagas",
      "Kantor Polisi",
      "Gd. Serbaguna"
    ],
    "answer": "C",
    "explanation": "KUD berada di tengah kawasan. Arah tenggara (bawah kanan) dari KUD mengarah ke kawasan R. Anita, Lapangan, dan R. Bagas.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-35",
    "stem": "Saat melaksanakan simulasi pengamanan kawasan pemukiman dan fasilitas umum, perwira pengendali meminta seluruh personel mengamati struktur persimpangan jalan serta letak gedung pada peta acuan wilayah. Analisis spasial yang cermat terhadap denah tersebut menjadi dasar penentuan titik sekat dan jalur respons cepat kepolisian. Dalam rangka pengamanan kegiatan olahraga serentak di Lapangan, kendaraan penonton yang datang dari barat (Kantor Polisi) dapat diparkir di gedung terdekat sebelum Lapangan, yaitu di...",
    "options": [
      "SD Brlian Jaya",
      "KUD atau Gd. Serbaguna",
      "R. Sari",
      "R. Sinta",
      "KUA"
    ],
    "answer": "B",
    "explanation": "Gedung fasilitas di dekat perempatan Jln. Pemuda sebelum menuju Lapangan adalah KUD dan Gd. Serbaguna di selatan Jln. Kusuma Raya.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-36",
    "stem": "Pada tahap perencanaan gelar kekuatan pengamanan kegiatan masyarakat, tim operasional memetakan jalur lintasan dan posisi bangunan vital berdasarkan gambar denah wilayah yang tersedia. Setiap anggota wajib menguasai orientasi arah Utara, Timur, Selatan, dan Barat pada peta guna menghindari kesalahan pergerakan di lapangan. Seorang anak hilang dilaporkan terakhir terlihat di dekat SD Brlian Jaya. Polisi melakukan penyisiran ke rumah-rumah di utara sekolah tersebut. Rumah yang dituju adalah...",
    "options": [
      "R. Sari",
      "R. Sinta",
      "R. Andi",
      "R. Budi",
      "R. Bagas"
    ],
    "answer": "A",
    "explanation": "R. Sari terletak tepat di sebelah utara kompleks SD Brlian Jaya.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-37",
    "stem": "Dalam kegiatan orientasi wilayah hukum dan pemetaan rute patroli dialogis, regu Samapta menggunakan denah tata letak bangunan serta jaringan jalan di atas sebagai panduan navigasi taktis di lapangan. Ketepatan membaca posisi relatif antar-objek dan arah mata angin sangat diperlukan agar pergerakan unit patroli berlangsung cepat serta akurat. Jika Jln. Kusuma Raya di depan R. Ahmad ditutup karena ada pembetulan gorong-gorong, akses alternatif dari Gd. Serbaguna menuju KUD dapat menempuh jalur...",
    "options": [
      "Gang di belakang R. Ahmad (sisi selatan)",
      "Jln. Rambutan -&gt; Jln. Madukara -&gt; Jln. Pemuda",
      "Jln. Majapahit -&gt; Jln. Merdeka",
      "Jln. Sentosa -&gt; Jln. Majapahit",
      "Jln. Pemuda -&gt; Jln. Rambutan"
    ],
    "answer": "A",
    "explanation": "Gd. Serbaguna dan KUD berada sejajar di sebelah selatan Jln. Kusuma Raya dan dipisahkan oleh R. Ahmad. Jalur alternatif tercepat adalah area belakang/selatan permukiman R. Ahmad.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-38",
    "stem": "Saat melaksanakan simulasi pengamanan kawasan pemukiman dan fasilitas umum, perwira pengendali meminta seluruh personel mengamati struktur persimpangan jalan serta letak gedung pada peta acuan wilayah. Analisis spasial yang cermat terhadap denah tersebut menjadi dasar penentuan titik sekat dan jalur respons cepat kepolisian. Patroli jalan kaki regu Polwan melintasi rute: KUA -&gt; R. Sinta -&gt; Balai Desa -&gt; Lapangan. Arah pergerakan umum regu tersebut adalah...",
    "options": [
      "Dari utara menuju ke tenggara/selatan",
      "Dari selatan menuju utara",
      "Dari timur menuju barat",
      "Melingkar ke barat daya",
      "Dari barat menuju utara"
    ],
    "answer": "A",
    "explanation": "KUA dan R. Sinta berada di utara. Bergerak ke Balai Desa (selatan/utara Kusuma Raya) lalu ke Lapangan (selatan Kusuma Raya). Pergerakan dominan adalah dari utara ke selatan.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-39",
    "stem": "Pada tahap perencanaan gelar kekuatan pengamanan kegiatan masyarakat, tim operasional memetakan jalur lintasan dan posisi bangunan vital berdasarkan gambar denah wilayah yang tersedia. Setiap anggota wajib menguasai orientasi arah Utara, Timur, Selatan, dan Barat pada peta guna menghindari kesalahan pergerakan di lapangan. Persimpangan jalan manakah yang mempertemukan empat jalan berbeda (perempatan utama)?",
    "options": [
      "Pertemuan Jln. Kusuma Raya, Jln. Madukara, dan Jln. Pemuda",
      "Pertemuan Jln. Rambutan dan Jln. Sentosa",
      "Pertemuan Jln. Majapahit dan Jln. Sentosa",
      "Pertemuan Jln. Merdeka dan Jln. Madukara",
      "Pertemuan Jln. Rambutan dan Jln. Majapahit"
    ],
    "answer": "A",
    "explanation": "Perempatan tengah utama terbentuk dari persilangan antara Jln. Kusuma Raya (barat-timur) dengan Jln. Madukara (utara) dan Jln. Pemuda (selatan).",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-40",
    "stem": "Dalam kegiatan orientasi wilayah hukum dan pemetaan rute patroli dialogis, regu Samapta menggunakan denah tata letak bangunan serta jaringan jalan di atas sebagai panduan navigasi taktis di lapangan. Ketepatan membaca posisi relatif antar-objek dan arah mata angin sangat diperlukan agar pergerakan unit patroli berlangsung cepat serta akurat. Bangunan yang berhadapan langsung secara diagonal (berlawanan sudut) dengan Kantor Polisi pada persimpangan Jln. Kusuma Raya - Jln. Rambutan adalah...",
    "options": [
      "Gd. Serbaguna",
      "R. Ahmad",
      "KUA",
      "KUD",
      "R. Budi"
    ],
    "answer": "A",
    "explanation": "Kantor Polisi berada di sudut timur-utara persimpangan Jln. Rambutan, sedangkan Gd. Serbaguna berada di sebelah selatannya (seberang jalan).",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-41",
    "stem": "Saat melaksanakan simulasi pengamanan kawasan pemukiman dan fasilitas umum, perwira pengendali meminta seluruh personel mengamati struktur persimpangan jalan serta letak gedung pada peta acuan wilayah. Analisis spasial yang cermat terhadap denah tersebut menjadi dasar penentuan titik sekat dan jalur respons cepat kepolisian. Berapakah jumlah total rumah tinggal pribadi (berlabel R. [Nama]) yang tercantum dalam denah?",
    "options": [
      "6 rumah",
      "7 rumah",
      "8 rumah",
      "9 rumah",
      "10 rumah"
    ],
    "answer": "C",
    "explanation": "Rumah warga (R.): 1. R. Budi, 2. R. Andi, 3. R. Sinta, 4. R. Sari, 5. R. Ahmad, 6. R. Bayu, 7. R. Anita, 8. R. Bagas. Total = 8 rumah.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-42",
    "stem": "Pada tahap perencanaan gelar kekuatan pengamanan kegiatan masyarakat, tim operasional memetakan jalur lintasan dan posisi bangunan vital berdasarkan gambar denah wilayah yang tersedia. Setiap anggota wajib menguasai orientasi arah Utara, Timur, Selatan, dan Barat pada peta guna menghindari kesalahan pergerakan di lapangan. Berapakah jumlah fasilitas umum / instansi / gedung non-rumah tinggal yang ada pada denah?",
    "options": [
      "4 gedung",
      "5 gedung",
      "6 gedung",
      "7 gedung/fasilitas",
      "8 gedung"
    ],
    "answer": "D",
    "explanation": "Gedung/Fasilitas umum: 1. Kantor Polisi, 2. KUA, 3. Gd. Serbaguna, 4. KUD, 5. Balai Desa, 6. SD Brlian Jaya, 7. Masjid (ditambah Lapangan sebagai fasilitas terbuka). Jika gedung fisik = 7.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-43",
    "stem": "Dalam kegiatan orientasi wilayah hukum dan pemetaan rute patroli dialogis, regu Samapta menggunakan denah tata letak bangunan serta jaringan jalan di atas sebagai panduan navigasi taktis di lapangan. Ketepatan membaca posisi relatif antar-objek dan arah mata angin sangat diperlukan agar pergerakan unit patroli berlangsung cepat serta akurat. Pernyataan berikut yang BENAR mengenai posisi Jln. Sentosa adalah...",
    "options": [
      "Membentang di sebelah utara Kantor Polisi",
      "Membentang di sebelah selatan Masjid dan R. Bagas",
      "Berada di antara KUA dan Balai Desa",
      "Berada di sebelah barat Jln. Rambutan",
      "Memotong Jln. Madukara"
    ],
    "answer": "B",
    "explanation": "Jln. Sentosa terletak di bagian tenggara denah, membentang di sebelah selatan Masjid dan R. Bagas.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-44",
    "stem": "Saat melaksanakan simulasi pengamanan kawasan pemukiman dan fasilitas umum, perwira pengendali meminta seluruh personel mengamati struktur persimpangan jalan serta letak gedung pada peta acuan wilayah. Analisis spasial yang cermat terhadap denah tersebut menjadi dasar penentuan titik sekat dan jalur respons cepat kepolisian. Jika Anda berdiri di tengah Lapangan menghadap ke arah Barat, maka di hadapan Anda terdapat...",
    "options": [
      "Jln. Merdeka dan Masjid",
      "Jln. Pemuda, R. Bayu, dan R. Anita",
      "Balai Desa dan SD Brlian Jaya",
      "KUA dan R. Sinta",
      "Jln. Sentosa dan R. Bagas"
    ],
    "answer": "B",
    "explanation": "Di sebelah barat Lapangan membentang Jln. Pemuda. Di sebelah barat Jln. Pemuda berdiri R. Bayu dan R. Anita.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-45",
    "stem": "Pada tahap perencanaan gelar kekuatan pengamanan kegiatan masyarakat, tim operasional memetakan jalur lintasan dan posisi bangunan vital berdasarkan gambar denah wilayah yang tersedia. Setiap anggota wajib menguasai orientasi arah Utara, Timur, Selatan, dan Barat pada peta guna menghindari kesalahan pergerakan di lapangan. Bangunan R. Andi diapit oleh...",
    "options": [
      "R. Budi di barat dan Jln. Madukara di timur",
      "Kantor Polisi di barat dan KUA di utara",
      "Gd. Serbaguna di barat dan R. Ahmad di timur",
      "Balai Desa di timur dan SD Brlian Jaya di barat",
      "KUD di barat dan Lapangan di timur"
    ],
    "answer": "A",
    "explanation": "Di utara Jln. Kusuma Raya: R. Andi terletak di antara R. Budi (barat) dan persimpangan Jln. Madukara (timur).",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-46",
    "stem": "Dalam kegiatan orientasi wilayah hukum dan pemetaan rute patroli dialogis, regu Samapta menggunakan denah tata letak bangunan serta jaringan jalan di atas sebagai panduan navigasi taktis di lapangan. Ketepatan membaca posisi relatif antar-objek dan arah mata angin sangat diperlukan agar pergerakan unit patroli berlangsung cepat serta akurat. Manakah di antara jalan berikut yang membentang secara horizontal (Barat - Timur)?",
    "options": [
      "Jln. Rambutan",
      "Jln. Madukara",
      "Jln. Pemuda",
      "Jln. Kusuma Raya",
      "Jln. Majapahit"
    ],
    "answer": "D",
    "explanation": "Jln. Kusuma Raya dan Jln. Sentosa membentang secara horizontal (barat-timur). Jalan lainnya membentang vertikal (utara-selatan).",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-47",
    "stem": "Saat melaksanakan simulasi pengamanan kawasan pemukiman dan fasilitas umum, perwira pengendali meminta seluruh personel mengamati struktur persimpangan jalan serta letak gedung pada peta acuan wilayah. Analisis spasial yang cermat terhadap denah tersebut menjadi dasar penentuan titik sekat dan jalur respons cepat kepolisian. Manakah di antara jalan berikut yang membentang secara vertikal (Utara - Selatan)?",
    "options": [
      "Jln. Kusuma Raya",
      "Jln. Sentosa",
      "Jln. Madukara, Jln. Pemuda, Jln. Majapahit, Jln. Merdeka, Jln. Rambutan",
      "Hanya Jln. Kusuma Raya dan Jln. Sentosa",
      "Hanya Jln. Rambutan"
    ],
    "answer": "C",
    "explanation": "Jln. Rambutan, Jln. Madukara, Jln. Pemuda, Jln. Majapahit, dan Jln. Merdeka seluruhnya membentang tegak lurus (utara-selatan).",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-48",
    "stem": "Pada tahap perencanaan gelar kekuatan pengamanan kegiatan masyarakat, tim operasional memetakan jalur lintasan dan posisi bangunan vital berdasarkan gambar denah wilayah yang tersedia. Setiap anggota wajib menguasai orientasi arah Utara, Timur, Selatan, dan Barat pada peta guna menghindari kesalahan pergerakan di lapangan. Jika seorang warga berjalan dari R. Ahmad lurus ke timur melintasi KUD, lalu menyeberangi Jln. Pemuda, maka bangunan tempat tinggal pertama yang dijumpainya di timur Jln. Pemuda adalah...",
    "options": [
      "R. Anita",
      "R. Bayu",
      "Lapangan",
      "R. Bagas",
      "Masjid"
    ],
    "answer": "B",
    "explanation": "R. Ahmad berada di barat KUD. Berjalan ke timur menyeberangi Jln. Pemuda akan langsung mendapati R. Bayu (sebelah utara Lapangan).",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-49",
    "stem": "Dalam kegiatan orientasi wilayah hukum dan pemetaan rute patroli dialogis, regu Samapta menggunakan denah tata letak bangunan serta jaringan jalan di atas sebagai panduan navigasi taktis di lapangan. Ketepatan membaca posisi relatif antar-objek dan arah mata angin sangat diperlukan agar pergerakan unit patroli berlangsung cepat serta akurat. Pernyataan di bawah ini yang TIDAK SESUAI dengan isi denah adalah...",
    "options": [
      "SD Brlian Jaya terletak di sebelah timur Jln. Majapahit",
      "Gd. Serbaguna berada di sebelah barat R. Ahmad",
      "KUA berada di sebelah utara Jln. Kusuma Raya",
      "R. Bagas berada di sebelah barat Jln. Rambutan",
      "Balai Desa berada di sebelah timur Jln. Madukara"
    ],
    "answer": "D",
    "explanation": "Pernyataan D SALAH karena R. Bagas berada di bagian paling tenggara (Jln. Sentosa/Merdeka), bukan di barat Jln. Rambutan.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  },
  {
    "code": "PSI-KEC-DENAH-50",
    "stem": "Saat melaksanakan simulasi pengamanan kawasan pemukiman dan fasilitas umum, perwira pengendali meminta seluruh personel mengamati struktur persimpangan jalan serta letak gedung pada peta acuan wilayah. Analisis spasial yang cermat terhadap denah tersebut menjadi dasar penentuan titik sekat dan jalur respons cepat kepolisian. Seseorang keluar dari Masjid, berjalan ke arah selatan menyusuri Jln. Merdeka, lalu belok ke timur di Jln. Sentosa. Tujuan akhirnya berada di bangunan...",
    "options": [
      "R. Anita",
      "Lapangan",
      "R. Bagas",
      "SD Brlian Jaya",
      "Balai Desa"
    ],
    "answer": "C",
    "explanation": "Dari Masjid keluar ke Jln. Merdeka arah selatan, belok timur (kanan) menyusuri Jln. Sentosa akan langsung sampai di R. Bagas.",
    "tags": [
      "kecerdasan",
      "spasial",
      "denah-lokasi",
      "petadenah"
    ]
  }
];
