import { q } from './mcq';
import { numericDistractors } from './rng';
import type { SeedDifficulty, WrittenMultiChoice, WrittenQuestion } from './types';

/**
 * Bank soal Tes Kemampuan Komputer (TKK).
 *
 * Komposisi:
 *
 *   perangkat-keras   20 soal — komponen PC, media penyimpanan, port, biner
 *   perangkat-lunak   18 soal — sistem operasi, aplikasi, format berkas, perintah
 *   jaringan          18 soal — perangkat jaringan, protokol, IP, subnet
 *   keamanan          17 soal — malware, kata sandi, serangan, enkripsi
 *   penalaran         14 soal — logika, algoritma, troubleshooting
 *                     + 3 soal `MULTI_CHOICE` (banyak jawaban benar)
 *
 * Ditambah 15 soal figural (`TKK-FIG-*`, lihat `figural.ts`), subtes TKK
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
 * Skala pengecoh mengikuti besaran jawaban: jawaban ribuan (mis. kapasitas
 * `2048`) diberi pengecoh kelipatan 1.000 agar tidak tampak seperti salah
 * ketik.
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

/* ------------------------------------------------------- perangkat keras 20 */

const PERANGKAT_KERAS: WrittenQuestion[] = [
  q(
    'perangkat-keras',
    'EASY',
    'Komponen komputer yang berfungsi sebagai otak untuk memproses instruksi adalah ...',
    'CPU',
    ['RAM', 'Hard disk', 'Monitor', 'Power supply'],
    'CPU (Central Processing Unit) menjalankan instruksi program dan mengolah data; komponen lain menyimpan, menampilkan, atau memberi daya.',
    ['tkk', 'perangkat-keras', 'cpu'],
  ),
  q(
    'perangkat-keras',
    'EASY',
    'Perangkat berikut yang termasuk perangkat masukan (input device) adalah ...',
    'Keyboard',
    ['Monitor', 'Printer', 'Speaker', 'Proyektor'],
    'Keyboard memasukkan data ke komputer. Monitor, printer, speaker, dan proyektor adalah perangkat keluaran.',
    ['tkk', 'perangkat-keras', 'input-device'],
  ),
  q(
    'perangkat-keras',
    'EASY',
    'Media penyimpanan yang menggunakan piringan magnetik berputar adalah ...',
    'HDD',
    ['SSD', 'Flashdisk', 'RAM', 'ROM'],
    'HDD (hard disk drive) menyimpan data pada piringan magnetik yang berputar, sedangkan SSD dan flashdisk memakai memori flash.',
    ['tkk', 'perangkat-keras', 'penyimpanan'],
  ),
  q(
    'perangkat-keras',
    'EASY',
    'Satuan kapasitas memori terkecil di antara pilihan berikut adalah ...',
    'Byte',
    ['Kilobyte', 'Megabyte', 'Gigabyte', 'Terabyte'],
    'Urutan satuan dari kecil ke besar: byte, kilobyte, megabyte, gigabyte, terabyte.',
    ['tkk', 'perangkat-keras', 'satuan-data'],
  ),
  q(
    'perangkat-keras',
    'MEDIUM',
    'Satu kilobyte (KB) secara konvensional sama dengan ... byte',
    '1.024',
    ['1.000', '512', '2.048', '1.024.000'],
    'Dalam penghitungan biner, 1 KB = 2^10 byte = 1.024 byte.',
    ['tkk', 'perangkat-keras', 'satuan-data'],
  ),
  n(
    'perangkat-keras',
    'MEDIUM',
    'Empat modul RAM masing-masing berkapasitas 8 GB dipasang pada satu komputer. Kapasitas totalnya adalah ... GB',
    32,
    'Kapasitas total = 4 × 8 GB = 32 GB.',
    ['tkk', 'perangkat-keras', 'ram'],
  ),
  q(
    'perangkat-keras',
    'MEDIUM',
    'Firmware BIOS pada motherboard disimpan di dalam chip ...',
    'ROM',
    ['RAM', 'Cache', 'Register', 'VRAM'],
    'BIOS disimpan pada chip ROM (atau flash ROM) agar tetap tersedia saat komputer dimatikan.',
    ['tkk', 'perangkat-keras', 'bios'],
  ),
  q(
    'perangkat-keras',
    'MEDIUM',
    'Fungsi utama RAM adalah ...',
    'Menyimpan data sementara saat komputer menyala',
    [
      'Menyimpan data secara permanen',
      'Memproses grafis tiga dimensi',
      'Mengubah arus AC menjadi DC',
      'Menghubungkan komputer ke jaringan',
    ],
    'RAM adalah memori kerja yang bersifat volatil: isinya hilang saat daya dimatikan.',
    ['tkk', 'perangkat-keras', 'ram'],
  ),
  q(
    'perangkat-keras',
    'MEDIUM',
    'Perangkat yang mengubah arus listrik AC menjadi DC untuk komponen komputer adalah ...',
    'Power supply',
    ['Motherboard', 'Processor', 'VGA card', 'Heatsink'],
    'Power supply (PSU) mengubah tegangan AC dari stopkontak menjadi tegangan DC yang dibutuhkan komponen komputer.',
    ['tkk', 'perangkat-keras', 'power-supply'],
  ),
  q(
    'perangkat-keras',
    'MEDIUM',
    'Port yang umum digunakan untuk menghubungkan monitor digital adalah ...',
    'HDMI',
    ['RJ45', 'USB-A', 'Audio 3,5 mm', 'PS/2'],
    'HDMI mengirim sinyal video dan audio digital ke monitor. RJ45 untuk jaringan, USB-A untuk periferal, dan PS/2 untuk keyboard atau mouse lama.',
    ['tkk', 'perangkat-keras', 'port'],
  ),
  n(
    'perangkat-keras',
    'HARD',
    'Berapakah nilai desimal dari bilangan biner 1011?',
    11,
    '1011 = 1×8 + 0×4 + 1×2 + 1×1 = 8 + 2 + 1 = 11.',
    ['tkk', 'perangkat-keras', 'biner'],
  ),
  q(
    'perangkat-keras',
    'HARD',
    'Bilangan desimal 13 jika ditulis dalam biner adalah ...',
    '1101',
    ['1011', '1110', '1001', '1010'],
    '13 = 8 + 4 + 1, sehingga bit untuk 8, 4, dan 1 bernilai 1: 1101.',
    ['tkk', 'perangkat-keras', 'biner'],
  ),
  q(
    'perangkat-keras',
    'MEDIUM',
    'Komponen yang bertugas mengolah data grafis adalah ...',
    'GPU',
    ['CPU', 'RAM', 'NIC', 'PSU'],
    'GPU (Graphics Processing Unit) mengolah perhitungan grafis dan sering dipakai untuk komputasi paralel.',
    ['tkk', 'perangkat-keras', 'gpu'],
  ),
  q(
    'perangkat-keras',
    'MEDIUM',
    'Slot pada motherboard tempat memasang prosesor disebut ...',
    'Socket CPU',
    ['Slot RAM', 'Slot PCIe', 'Port SATA', 'Header USB'],
    'Prosesor dipasang pada socket CPU yang jenisnya harus sesuai dengan prosesor yang digunakan.',
    ['tkk', 'perangkat-keras', 'motherboard'],
  ),
  q(
    'perangkat-keras',
    'MEDIUM',
    'Antarmuka penyimpanan modern berkecepatan tinggi yang menghubungkan SSD langsung ke jalur PCIe adalah ...',
    'NVMe',
    ['IDE', 'AGP', 'VGA', 'RJ11'],
    'NVMe dirancang untuk memori flash dan memakai jalur PCIe, sehingga jauh lebih cepat daripada antarmuka lama seperti IDE.',
    ['tkk', 'perangkat-keras', 'ssd'],
  ),
  q(
    'perangkat-keras',
    'EASY',
    'Perangkat keras yang berfungsi mencetak dokumen ke kertas adalah ...',
    'Printer',
    ['Scanner', 'Monitor', 'Speaker', 'Proyektor'],
    'Printer menghasilkan cetakan pada kertas; scanner justru memindai dokumen menjadi data digital.',
    ['tkk', 'perangkat-keras', 'printer'],
  ),
  q(
    'perangkat-keras',
    'MEDIUM',
    'Kecepatan transfer teoretis antarmuka USB 3.0 adalah ...',
    '5 Gbps',
    ['480 Mbps', '10 Gbps', '12 Mbps', '1 Gbps'],
    'USB 3.0 memiliki kecepatan sinyal 5 Gbps, sedangkan USB 2.0 hanya 480 Mbps.',
    ['tkk', 'perangkat-keras', 'usb'],
  ),
  q(
    'perangkat-keras',
    'MEDIUM',
    'Komponen pendingin yang menempel langsung pada prosesor umumnya berupa ...',
    'Heatsink dan kipas',
    ['Power supply', 'Baterai CMOS', 'Kartu jaringan', 'Modul RAM'],
    'Heatsink menyerap panas prosesor dan kipas mengalirkannya keluar; sebagian sistem memakai pendingin cair.',
    ['tkk', 'perangkat-keras', 'pendingin'],
  ),
  q(
    'perangkat-keras',
    'HARD',
    'Sebuah hard disk berkapasitas 2 TB. Jika 1 TB = 1.024 GB, kapasitasnya dalam GB adalah ...',
    '2.048',
    ['2.000', '1.024', '2.400', '1.048'],
    '2 × 1.024 GB = 2.048 GB.',
    ['tkk', 'perangkat-keras', 'penyimpanan'],
  ),
  n(
    'perangkat-keras',
    'HARD',
    'Konektor SATA data memiliki ... pin',
    7,
    'Konektor SATA data berisi 7 pin, sedangkan konektor daya SATA berisi 15 pin.',
    ['tkk', 'perangkat-keras', 'sata'],
  ),
];

/* -------------------------------------------------------- perangkat lunak 18 */

const PERANGKAT_LUNAK: WrittenQuestion[] = [
  q(
    'perangkat-lunak',
    'EASY',
    'Perangkat lunak yang menjadi penghubung antara pengguna dan perangkat keras adalah ...',
    'Sistem operasi',
    ['Aplikasi pengolah kata', 'Peramban web', 'Antivirus', 'Driver printer'],
    'Sistem operasi mengelola perangkat keras dan menyediakan layanan bagi aplikasi serta pengguna.',
    ['tkk', 'perangkat-lunak', 'sistem-operasi'],
  ),
  q(
    'perangkat-lunak',
    'EASY',
    'Berikut yang termasuk sistem operasi adalah ...',
    'Linux',
    ['Microsoft Word', 'Google Chrome', 'Adobe Photoshop', 'WinRAR'],
    'Linux adalah sistem operasi; pilihan lain merupakan aplikasi pengguna.',
    ['tkk', 'perangkat-lunak', 'sistem-operasi'],
  ),
  q(
    'perangkat-lunak',
    'EASY',
    'Perangkat lunak pengolah kata pada paket Microsoft Office adalah ...',
    'Microsoft Word',
    ['Microsoft Excel', 'Microsoft PowerPoint', 'Microsoft Access', 'Microsoft Outlook'],
    'Microsoft Word dipakai mengolah dokumen teks; Excel untuk spreadsheet dan PowerPoint untuk presentasi.',
    ['tkk', 'perangkat-lunak', 'aplikasi-perkantoran'],
  ),
  q(
    'perangkat-lunak',
    'EASY',
    'Aplikasi yang digunakan untuk membuat presentasi adalah ...',
    'Microsoft PowerPoint',
    ['Microsoft Word', 'Microsoft Excel', 'Notepad', 'Paint'],
    'Microsoft PowerPoint menyediakan slide untuk menyusun bahan presentasi.',
    ['tkk', 'perangkat-lunak', 'aplikasi-perkantoran'],
  ),
  q(
    'perangkat-lunak',
    'MEDIUM',
    'Ekstensi berkas dokumen Microsoft Word 2007 ke atas adalah ...',
    '.docx',
    ['.xlsx', '.pptx', '.pdf', '.txt'],
    'Word 2007 memperkenalkan format .docx; .xlsx untuk Excel dan .pptx untuk PowerPoint.',
    ['tkk', 'perangkat-lunak', 'format-berkas'],
  ),
  q(
    'perangkat-lunak',
    'MEDIUM',
    'Format berkas yang umum dipakai agar tampilan dokumen konsisten di berbagai perangkat adalah ...',
    'PDF',
    ['DOCX', 'XLSX', 'TXT', 'CSV'],
    'PDF menyimpan tata letak sehingga dokumen tampil sama di berbagai aplikasi dan perangkat.',
    ['tkk', 'perangkat-lunak', 'format-berkas'],
  ),
  q(
    'perangkat-lunak',
    'MEDIUM',
    'Bagian inti sistem operasi yang mengelola memori, proses, dan perangkat keras disebut ...',
    'Kernel',
    ['Shell', 'Driver', 'Firmware', 'Bootloader'],
    'Kernel adalah inti sistem operasi yang berjalan dengan hak istimewa dan mengelola sumber daya sistem.',
    ['tkk', 'perangkat-lunak', 'sistem-operasi'],
  ),
  q(
    'perangkat-lunak',
    'MEDIUM',
    'Perintah pada sistem operasi Linux untuk menampilkan isi direktori adalah ...',
    'ls',
    ['cd', 'mkdir', 'rm', 'pwd'],
    'ls menampilkan daftar berkas dan direktori; cd berpindah direktori dan mkdir membuat direktori baru.',
    ['tkk', 'perangkat-lunak', 'linux'],
  ),
  q(
    'perangkat-lunak',
    'MEDIUM',
    'Perintah Windows untuk menampilkan konfigurasi alamat IP komputer adalah ...',
    'ipconfig',
    ['ping', 'dir', 'tasklist', 'type'],
    'ipconfig menampilkan konfigurasi jaringan, termasuk alamat IP; ping menguji konektivitas.',
    ['tkk', 'perangkat-lunak', 'windows'],
  ),
  q(
    'perangkat-lunak',
    'MEDIUM',
    'Perangkat lunak open source berarti ...',
    'Kode sumbernya dapat dipelajari dan dimodifikasi',
    [
      'Selalu gratis untuk penggunaan komersial',
      'Tidak memiliki lisensi',
      'Hanya dapat berjalan di Linux',
      'Tidak boleh diubah oleh pengguna',
    ],
    'Open source memberi akses ke kode sumber beserta hak memodifikasinya sesuai lisensi, bukan berarti tanpa lisensi.',
    ['tkk', 'perangkat-lunak', 'lisensi'],
  ),
  q(
    'perangkat-lunak',
    'MEDIUM',
    'Fungsi utama perangkat lunak antivirus adalah ...',
    'Mendeteksi dan menangani program berbahaya',
    [
      'Mempercepat koneksi internet',
      'Mengompres ukuran berkas',
      'Mengelola basis data',
      'Mengubah format dokumen',
    ],
    'Antivirus memindai berkas dan aktivitas sistem untuk mendeteksi serta menangani malware.',
    ['tkk', 'perangkat-lunak', 'antivirus'],
  ),
  q(
    'perangkat-lunak',
    'MEDIUM',
    'Program yang menerjemahkan seluruh kode sumber menjadi kode mesin sebelum program dijalankan disebut ...',
    'Compiler',
    ['Interpreter', 'Debugger', 'Editor', 'Loader'],
    'Compiler menerjemahkan program secara keseluruhan lebih dahulu, sedangkan interpreter menerjemahkan baris demi baris saat dijalankan.',
    ['tkk', 'perangkat-lunak', 'pemrograman'],
  ),
  q(
    'perangkat-lunak',
    'HARD',
    'Perbedaan utama perangkat lunak sistem dan perangkat lunak aplikasi adalah ...',
    'Perangkat lunak sistem mengelola perangkat keras, aplikasi menjalankan tugas pengguna',
    [
      'Perangkat lunak sistem selalu berbayar',
      'Aplikasi tidak membutuhkan sistem operasi',
      'Perangkat lunak sistem hanya untuk server',
      'Aplikasi tidak dapat diinstal di komputer',
    ],
    'Perangkat lunak sistem menjadi fondasi kerja komputer, sedangkan aplikasi dipakai untuk tugas tertentu seperti menulis atau menghitung.',
    ['tkk', 'perangkat-lunak', 'jenis-perangkat-lunak'],
  ),
  n(
    'perangkat-lunak',
    'MEDIUM',
    'Lima ratus berkas berukuran 4 MB akan disimpan. Ruang penyimpanan yang dibutuhkan adalah ... MB',
    2000,
    '500 × 4 MB = 2.000 MB (setara 2 GB).',
    ['tkk', 'perangkat-lunak', 'penyimpanan'],
  ),
  q(
    'perangkat-lunak',
    'MEDIUM',
    'Format berkas spreadsheet yang menyimpan data sebagai teks dipisahkan koma adalah ...',
    'CSV',
    ['PDF', 'DOCX', 'MP4', 'EXE'],
    'CSV (comma-separated values) menyimpan tabel sebagai teks biasa dengan pemisah koma.',
    ['tkk', 'perangkat-lunak', 'format-berkas'],
  ),
  q(
    'perangkat-lunak',
    'HARD',
    'Pada sistem operasi Windows, ekstensi berkas .exe menunjukkan ...',
    'Berkas program yang dapat dijalankan',
    [
      'Berkas gambar',
      'Berkas dokumen teks',
      'Berkas arsip terkompresi',
      'Berkas konfigurasi sistem',
    ],
    'Berkas .exe adalah executable yang dapat dijalankan langsung oleh sistem operasi Windows.',
    ['tkk', 'perangkat-lunak', 'format-berkas'],
  ),
  q(
    'perangkat-lunak',
    'MEDIUM',
    'Salah satu fungsi utama sistem operasi adalah ...',
    'Mengatur pembagian memori antarprogram',
    [
      'Menggambar ilustrasi vektor',
      'Mengedit video profesional',
      'Mengelola transaksi toko',
      'Mendesain situs web',
    ],
    'Sistem operasi mengalokasikan memori, waktu prosesor, dan perangkat lain agar program berjalan tertib.',
    ['tkk', 'perangkat-lunak', 'sistem-operasi'],
  ),
  n(
    'perangkat-lunak',
    'HARD',
    'Sebuah berkas berukuran 800 MB dikompresi hingga 50% dari ukuran aslinya. Ukuran berkas hasil kompresi adalah ... MB',
    400,
    '50% × 800 MB = 400 MB.',
    ['tkk', 'perangkat-lunak', 'kompresi'],
  ),
];

/* ---------------------------------------------------------------- jaringan 18 */

const JARINGAN: WrittenQuestion[] = [
  q(
    'jaringan',
    'EASY',
    'Perangkat yang menghubungkan beberapa komputer dalam jaringan lokal dan meneruskan data berdasarkan alamat MAC adalah ...',
    'Switch',
    ['Router', 'Modem', 'Hub', 'Repeater'],
    'Switch meneruskan frame hanya ke port tujuan berdasarkan tabel alamat MAC, sedangkan hub menyiarkan ke semua port.',
    ['tkk', 'jaringan', 'perangkat-jaringan'],
  ),
  q(
    'jaringan',
    'EASY',
    'Perangkat yang menghubungkan jaringan lokal ke internet melalui penyedia layanan adalah ...',
    'Router',
    ['Switch', 'Hub', 'Printer', 'Scanner'],
    'Router meneruskan paket antarjaringan, termasuk dari LAN menuju jaringan penyedia layanan internet.',
    ['tkk', 'jaringan', 'perangkat-jaringan'],
  ),
  q(
    'jaringan',
    'EASY',
    'Alamat logis yang digunakan untuk mengidentifikasi perangkat dalam jaringan IP adalah ...',
    'Alamat IP',
    ['Alamat MAC', 'Nomor port', 'Nama domain', 'Subnet mask'],
    'Alamat IP adalah alamat logis pada lapisan jaringan; alamat MAC bersifat fisik pada kartu jaringan.',
    ['tkk', 'jaringan', 'alamat-ip'],
  ),
  n(
    'jaringan',
    'MEDIUM',
    'Jumlah host yang dapat digunakan pada satu subnet /24 adalah ...',
    254,
    'Subnet /24 memiliki 2^8 = 256 alamat; dua di antaranya dipakai sebagai alamat jaringan dan broadcast, sehingga 254 host.',
    ['tkk', 'jaringan', 'subnet'],
  ),
  q(
    'jaringan',
    'MEDIUM',
    'Alamat IP 192.168.1.1 termasuk alamat kelas ...',
    'C',
    ['A', 'B', 'D', 'E'],
    'Oktet pertama 192 berada pada rentang 192–223, yaitu kelas C.',
    ['tkk', 'jaringan', 'alamat-ip'],
  ),
  q(
    'jaringan',
    'MEDIUM',
    'Protokol yang digunakan untuk mentransfer halaman web adalah ...',
    'HTTP',
    ['FTP', 'SMTP', 'DNS', 'SSH'],
    'HTTP mengangkut permintaan dan respons halaman web; FTP untuk berkas dan SMTP untuk surel.',
    ['tkk', 'jaringan', 'protokol'],
  ),
  q(
    'jaringan',
    'MEDIUM',
    'Protokol yang menerjemahkan nama domain menjadi alamat IP adalah ...',
    'DNS',
    ['DHCP', 'FTP', 'HTTP', 'ARP'],
    'DNS (Domain Name System) memetakan nama seperti contoh.com ke alamat IP-nya.',
    ['tkk', 'jaringan', 'protokol'],
  ),
  q(
    'jaringan',
    'MEDIUM',
    'Layanan yang memberikan alamat IP secara otomatis kepada perangkat dalam jaringan adalah ...',
    'DHCP',
    ['DNS', 'NAT', 'VPN', 'FTP'],
    'DHCP menetapkan alamat IP, gateway, dan DNS secara otomatis sehingga konfigurasi manual tidak diperlukan.',
    ['tkk', 'jaringan', 'protokol'],
  ),
  q(
    'jaringan',
    'MEDIUM',
    'Kepanjangan dari LAN adalah ...',
    'Local Area Network',
    ['Long Access Network', 'Local Access Node', 'Linked Area Network', 'Large Area Network'],
    'LAN adalah jaringan area lokal yang mencakup ruang terbatas seperti kantor atau sekolah.',
    ['tkk', 'jaringan', 'istilah'],
  ),
  n(
    'jaringan',
    'MEDIUM',
    'Bandwidth 80 Mbps dipakai untuk mengunduh berkas. Kecepatan unduh maksimum dalam MB per detik adalah ...',
    10,
    '1 byte = 8 bit, sehingga 80 Mbps ÷ 8 = 10 MB/detik.',
    ['tkk', 'jaringan', 'bandwidth'],
  ),
  q(
    'jaringan',
    'MEDIUM',
    'Perangkat yang mengubah sinyal digital menjadi analog dan sebaliknya pada jalur komunikasi adalah ...',
    'Modem',
    ['Switch', 'Router', 'Hub', 'Access point'],
    'Modem (modulator-demodulator) menyesuaikan sinyal digital komputer dengan media transmisi seperti kabel telepon atau kabel koaksial.',
    ['tkk', 'jaringan', 'perangkat-jaringan'],
  ),
  n(
    'jaringan',
    'HARD',
    'Jumlah seluruh alamat IP dalam satu subnet /26 adalah ...',
    64,
    'Subnet /26 menyisakan 32 − 26 = 6 bit host, sehingga 2^6 = 64 alamat.',
    ['tkk', 'jaringan', 'subnet'],
  ),
  q(
    'jaringan',
    'MEDIUM',
    'Topologi jaringan yang menghubungkan semua perangkat ke satu perangkat pusat disebut ...',
    'Topologi bintang',
    ['Topologi bus', 'Topologi cincin', 'Topologi mesh', 'Topologi pohon'],
    'Pada topologi bintang setiap perangkat terhubung langsung ke switch atau hub pusat.',
    ['tkk', 'jaringan', 'topologi'],
  ),
  q(
    'jaringan',
    'MEDIUM',
    'Alamat IP 127.0.0.1 dikenal sebagai ...',
    'Alamat loopback',
    ['Alamat broadcast', 'Alamat gateway', 'Alamat publik', 'Alamat multicast'],
    '127.0.0.1 adalah alamat loopback yang mengarah ke komputer itu sendiri untuk pengujian lokal.',
    ['tkk', 'jaringan', 'alamat-ip'],
  ),
  n(
    'jaringan',
    'HARD',
    'Oktet terakhir subnet mask 255.255.255.192 bernilai ...',
    192,
    'Subnet mask 255.255.255.192 setara dengan prefix /26 (dua bit teratas oktet terakhir bernilai 1).',
    ['tkk', 'jaringan', 'subnet'],
  ),
  q(
    'jaringan',
    'MEDIUM',
    'Protokol aman yang dipakai untuk menjelajah web dengan enkripsi adalah ...',
    'HTTPS',
    ['HTTP', 'FTP', 'Telnet', 'SMTP'],
    'HTTPS membungkus HTTP dengan TLS sehingga lalu lintas web terenkripsi dan server dapat diverifikasi.',
    ['tkk', 'jaringan', 'protokol'],
  ),
  q(
    'jaringan',
    'MEDIUM',
    'Fungsi utama firewall dalam jaringan adalah ...',
    'Menyaring lalu lintas data berdasarkan aturan keamanan',
    [
      'Memperluas jangkauan sinyal Wi-Fi',
      'Menyimpan cadangan data',
      'Mengalokasikan alamat IP otomatis',
      'Mempercepat prosesor',
    ],
    'Firewall memeriksa paket yang masuk dan keluar, lalu menolak atau mengizinkannya sesuai kebijakan.',
    ['tkk', 'jaringan', 'keamanan-jaringan'],
  ),
  q(
    'jaringan',
    'EASY',
    'Jaringan yang mencakup area kecil seperti kantor atau sekolah disebut ...',
    'LAN',
    ['WAN', 'MAN', 'VPN', 'Internet'],
    'LAN mencakup area terbatas, sedangkan MAN mencakup satu kota dan WAN mencakup wilayah yang jauh lebih luas.',
    ['tkk', 'jaringan', 'istilah'],
  ),
];

/* ---------------------------------------------------------------- keamanan 17 */

const KEAMANAN: WrittenQuestion[] = [
  q(
    'keamanan',
    'EASY',
    'Program berbahaya yang menyamar sebagai program sah agar pengguna menjalankannya disebut ...',
    'Trojan',
    ['Worm', 'Adware', 'Spyware', 'Rootkit'],
    'Trojan menyamar sebagai perangkat lunak sah untuk menipu pengguna; ia tidak menggandakan diri sendiri seperti worm.',
    ['tkk', 'keamanan', 'malware'],
  ),
  q(
    'keamanan',
    'EASY',
    'Perangkat lunak berbahaya yang dapat menggandakan diri dan menyebar melalui jaringan tanpa interaksi pengguna adalah ...',
    'Worm',
    ['Trojan', 'Virus', 'Adware', 'Keylogger'],
    'Worm menyebar otomatis antarsistem melalui jaringan, berbeda dengan virus yang butuh berkas inang dijalankan.',
    ['tkk', 'keamanan', 'malware'],
  ),
  q(
    'keamanan',
    'EASY',
    'Kata sandi yang kuat sebaiknya ...',
    'Menggabungkan huruf besar, huruf kecil, angka, dan simbol',
    [
      'Menggunakan tanggal lahir',
      'Sama untuk semua akun',
      'Kurang dari enam karakter',
      'Berisi nama depan saja',
    ],
    'Panjang dan keragaman karakter membuat kata sandi jauh lebih sulit ditebak atau dibobol.',
    ['tkk', 'keamanan', 'kata-sandi'],
  ),
  q(
    'keamanan',
    'MEDIUM',
    'Teknik penipuan yang mengelabui korban agar menyerahkan data pribadi melalui pesan atau situs palsu disebut ...',
    'Phishing',
    ['Spoofing', 'Sniffing', 'Brute force', 'Denial of service'],
    'Phishing meniru pihak tepercaya untuk memancing korban memasukkan data sensitif.',
    ['tkk', 'keamanan', 'phishing'],
  ),
  q(
    'keamanan',
    'MEDIUM',
    'Serangan yang membanjiri server dengan permintaan sehingga layanan tidak dapat diakses disebut ...',
    'DDoS',
    ['Phishing', 'SQL injection', 'Cross-site scripting', 'Brute force'],
    'DDoS (distributed denial of service) mengirim banjir permintaan dari banyak sumber agar server kehabisan sumber daya.',
    ['tkk', 'keamanan', 'serangan'],
  ),
  q(
    'keamanan',
    'MEDIUM',
    'Proses mengubah data menjadi bentuk yang tidak dapat dibaca pihak lain tanpa kunci disebut ...',
    'Enkripsi',
    ['Dekripsi', 'Kompresi', 'Hash', 'Backup'],
    'Enkripsi mengacak data dengan kunci sehingga hanya pemegang kunci yang dapat membacanya.',
    ['tkk', 'keamanan', 'enkripsi'],
  ),
  q(
    'keamanan',
    'MEDIUM',
    'Autentikasi dua faktor (2FA) meningkatkan keamanan karena ...',
    'Menambahkan faktor verifikasi selain kata sandi',
    [
      'Mengganti kata sandi secara otomatis',
      'Menghapus kebutuhan kata sandi',
      'Menyimpan kata sandi di peramban',
      'Mempercepat proses login',
    ],
    '2FA meminta bukti kedua, misalnya kode sekali pakai, sehingga kata sandi yang bocor saja tidak cukup untuk masuk.',
    ['tkk', 'keamanan', 'autentikasi'],
  ),
  q(
    'keamanan',
    'MEDIUM',
    'Ancaman yang mencuri data dengan memantau lalu lintas jaringan disebut ...',
    'Sniffing',
    ['Phishing', 'Spoofing', 'Defacing', 'Ransomware'],
    'Sniffing menyadap paket yang melintas di jaringan untuk memperoleh informasi sensitif.',
    ['tkk', 'keamanan', 'serangan'],
  ),
  q(
    'keamanan',
    'MEDIUM',
    'Program yang mengunci data korban lalu meminta tebusan agar data dapat dibuka kembali disebut ...',
    'Ransomware',
    ['Adware', 'Worm', 'Trojan', 'Spyware'],
    'Ransomware mengenkripsi berkas korban dan menuntut pembayaran untuk kunci dekripsinya.',
    ['tkk', 'keamanan', 'malware'],
  ),
  q(
    'keamanan',
    'MEDIUM',
    'Langkah pertama yang tepat saat menerima surel mencurigakan berisi lampiran adalah ...',
    'Tidak membuka lampiran dan memverifikasi pengirim',
    [
      'Langsung membuka lampiran',
      'Meneruskan ke semua rekan kerja',
      'Membalas dengan data pribadi',
      'Mengabaikan seluruh surel masuk',
    ],
    'Lampiran dari pengirim tak dikenal sering menjadi pembawa malware; verifikasi pengirim sebelum membuka apa pun.',
    ['tkk', 'keamanan', 'phishing'],
  ),
  q(
    'keamanan',
    'HARD',
    'SQL injection memanfaatkan kelemahan pada ...',
    'Validasi masukan yang diteruskan langsung ke kueri basis data',
    [
      'Kekuatan kata sandi pengguna',
      'Konfigurasi nama domain',
      'Kapasitas penyimpanan disk',
      'Kecepatan prosesor server',
    ],
    'SQL injection menyisipkan perintah SQL melalui masukan yang tidak divalidasi sehingga penyerang dapat membaca atau mengubah data.',
    ['tkk', 'keamanan', 'sql-injection'],
  ),
  n(
    'keamanan',
    'HARD',
    'Sebuah PIN terdiri atas 4 digit dan setiap percobaan memakan waktu 1 detik. Jika seluruh kombinasi dicoba, waktu yang dibutuhkan adalah ... detik',
    10000,
    'Jumlah kombinasi = 10^4 = 10.000, sehingga dengan 1 detik per percobaan dibutuhkan 10.000 detik.',
    ['tkk', 'keamanan', 'brute-force'],
  ),
  q(
    'keamanan',
    'MEDIUM',
    'Prinsip hak akses paling sedikit yang hanya diberikan sesuai kebutuhan disebut ...',
    'Least privilege',
    ['Deny all', 'Zero trust', 'Fail open', 'Open access'],
    'Least privilege membatasi hak setiap pengguna atau proses pada minimum yang diperlukan untuk tugasnya.',
    ['tkk', 'keamanan', 'hak-akses'],
  ),
  q(
    'keamanan',
    'MEDIUM',
    'Sertifikat SSL/TLS pada situs web berfungsi untuk ...',
    'Mengenkripsi komunikasi antara peramban dan server',
    [
      'Mempercepat pemuatan halaman',
      'Menghapus iklan',
      'Menyimpan kata sandi',
      'Mengunci berkas pengguna',
    ],
    'Sertifikat TLS memungkinkan peramban memverifikasi server sekaligus menyepakati kunci enkripsi untuk komunikasi.',
    ['tkk', 'keamanan', 'tls'],
  ),
  q(
    'keamanan',
    'MEDIUM',
    'Serangan yang mencoba semua kemungkinan kata sandi secara berulang disebut ...',
    'Brute force',
    ['Phishing', 'Sniffing', 'Spoofing', 'Ransomware'],
    'Brute force menguji kombinasi kata sandi satu per satu hingga menemukan yang benar.',
    ['tkk', 'keamanan', 'brute-force'],
  ),
  q(
    'keamanan',
    'HARD',
    'Fungsi hash kriptografis seperti SHA-256 bersifat satu arah, artinya ...',
    'Tidak dapat dikembalikan ke data aslinya',
    [
      'Dapat didekripsi dengan kunci publik',
      'Selalu menghasilkan teks yang dapat dibaca',
      'Menghapus data asli secara permanen',
      'Mengompresi berkas menjadi lebih kecil',
    ],
    'Hash menghasilkan sidik jari berukuran tetap dan dirancang agar tidak dapat dibalik menjadi data asal.',
    ['tkk', 'keamanan', 'hash'],
  ),
  q(
    'keamanan',
    'MEDIUM',
    'Pembaruan sistem operasi penting untuk keamanan karena ...',
    'Menutup celah keamanan yang sudah diketahui',
    [
      'Menambah kapasitas hard disk',
      'Mengganti seluruh perangkat keras',
      'Menghapus semua berkas pengguna',
      'Menonaktifkan firewall',
    ],
    'Pembaruan rutin menambal kerentanan yang sudah ditemukan sehingga tidak dapat dieksploitasi penyerang.',
    ['tkk', 'keamanan', 'patch'],
  ),
];

/* ---------------------------------------------------------------- penalaran 14 */

const PENALARAN: WrittenQuestion[] = [
  q(
    'penalaran',
    'EASY',
    'Komputer tidak menyala sama sekali saat tombol daya ditekan. Pemeriksaan pertama yang paling tepat adalah ...',
    'Memastikan kabel daya dan sakelar listrik tersambung',
    [
      'Mengganti prosesor',
      'Menginstal ulang sistem operasi',
      'Memformat hard disk',
      'Mengganti monitor',
    ],
    'Tidak ada tanda daya sama sekali mengarah pada pasokan listrik; periksa kabel, sakelar, dan stopkontak sebelum komponen lain.',
    ['tkk', 'penalaran', 'troubleshooting'],
  ),
  q(
    'penalaran',
    'EASY',
    'Monitor menampilkan pesan "No Signal" padahal komputer menyala. Kemungkinan penyebab paling awal adalah ...',
    'Kabel video tidak terpasang atau sumber masukan salah',
    [
      'Hard disk penuh',
      'RAM rusak total',
      'Sistem operasi belum diaktivasi',
      'Mouse tidak terdeteksi',
    ],
    'Pesan "No Signal" berarti monitor tidak menerima sinyal video, biasanya karena kabel atau pilihan sumber masukan.',
    ['tkk', 'penalaran', 'troubleshooting'],
  ),
  q(
    'penalaran',
    'MEDIUM',
    'Algoritma adalah ...',
    'Urutan langkah logis dan sistematis untuk menyelesaikan masalah',
    [
      'Bahasa pemrograman tingkat tinggi',
      'Basis data terstruktur',
      'Berkas konfigurasi sistem',
      'Perangkat keras jaringan',
    ],
    'Algoritma mendefinisikan langkah penyelesaian masalah secara jelas dan berhingga, terlepas dari bahasa pemrograman.',
    ['tkk', 'penalaran', 'algoritma'],
  ),
  q(
    'penalaran',
    'MEDIUM',
    'Komputer terasa sangat lambat dan penggunaan disk selalu 100%. Langkah diagnosis yang tepat adalah ...',
    'Memeriksa proses yang berjalan dan memindai malware',
    [
      'Membeli monitor baru',
      'Mengganti keyboard',
      'Menambah volume speaker',
      'Menghapus seluruh berkas sistem',
    ],
    'Penggunaan disk yang terus maksimal biasanya disebabkan proses berat atau malware; keduanya diperiksa lewat pengelola tugas dan pemindaian.',
    ['tkk', 'penalaran', 'troubleshooting'],
  ),
  n(
    'penalaran',
    'MEDIUM',
    'Sebuah program menerima tiga bilangan lalu menampilkan yang terbesar. Jika masukannya 7, 12, dan 9, keluaran yang benar adalah ...',
    12,
    'Bilangan terbesar di antara 7, 12, dan 9 adalah 12.',
    ['tkk', 'penalaran', 'algoritma'],
  ),
  n(
    'penalaran',
    'MEDIUM',
    'Berapa kali perulangan berjalan pada potongan kode "for i = 1 to 5"?',
    5,
    'Perulangan berjalan untuk i = 1, 2, 3, 4, dan 5, yaitu 5 kali.',
    ['tkk', 'penalaran', 'algoritma'],
  ),
  q(
    'penalaran',
    'HARD',
    'Perulangan "untuk i dari 1 sampai 4, jika i genap cetak i" menghasilkan keluaran ...',
    '2 dan 4',
    ['1 dan 3', '1, 2, 3, 4', '4 saja', '2, 3, 4'],
    'Dari 1 sampai 4, bilangan genap adalah 2 dan 4.',
    ['tkk', 'penalaran', 'algoritma'],
  ),
  q(
    'penalaran',
    'MEDIUM',
    'Lampu indikator daya menyala tetapi layar tetap gelap dan tidak ada bunyi. Setelah kabel video diperiksa, komponen yang paling perlu diperiksa adalah ...',
    'RAM',
    ['Printer', 'Speaker', 'Mouse', 'Scanner'],
    'RAM yang tidak terpasang benar sering membuat komputer gagal POST sehingga layar tetap gelap.',
    ['tkk', 'penalaran', 'troubleshooting'],
  ),
  q(
    'penalaran',
    'MEDIUM',
    'Berkas tidak dapat dibuka karena ekstensinya tidak dikenal. Langkah yang tepat adalah ...',
    'Memastikan aplikasi pembuka yang sesuai sudah terpasang',
    [
      'Menghapus seluruh berkas di folder',
      'Mengganti sistem operasi',
      'Mematikan komputer berulang kali',
      'Membeli perangkat keras baru',
    ],
    'Ekstensi menentukan aplikasi pembuka; memasang aplikasi yang sesuai biasanya menyelesaikan masalah.',
    ['tkk', 'penalaran', 'troubleshooting'],
  ),
  q(
    'penalaran',
    'HARD',
    'Sebuah algoritma memeriksa data satu per satu dari awal hingga akhir. Kompleksitas waktunya termasuk ...',
    'Linear',
    ['Konstan', 'Kuadratik', 'Logaritmik', 'Eksponensial'],
    'Jumlah langkah bertambah sebanding dengan banyaknya data, sehingga kompleksitasnya linear O(n).',
    ['tkk', 'penalaran', 'kompleksitas'],
  ),
  q(
    'penalaran',
    'MEDIUM',
    'Komputer dapat terhubung ke Wi-Fi tetapi tidak dapat membuka situs web. Pemeriksaan yang tepat adalah ...',
    'Koneksi internet dan pengaturan DNS',
    [
      'Mengganti baterai CMOS',
      'Memasang ulang prosesor',
      'Mengganti kabel keyboard',
      'Menghapus berkas sementara',
    ],
    'Perangkat yang terhubung ke Wi-Fi tetapi gagal membuka situs biasanya bermasalah pada jalur internet atau resolusi DNS.',
    ['tkk', 'penalaran', 'troubleshooting'],
  ),
  q(
    'penalaran',
    'HARD',
    'Algoritma pengurutan yang membandingkan dua elemen bersebelahan dan menukarnya bila urutannya salah disebut ...',
    'Bubble sort',
    ['Binary search', 'Linear search', 'Hash table', 'Stack'],
    'Bubble sort berulang kali menukar pasangan bersebelahan hingga seluruh data terurut.',
    ['tkk', 'penalaran', 'algoritma'],
  ),
  q(
    'penalaran',
    'MEDIUM',
    'Tiga komputer di kantor tidak dapat memakai printer jaringan, sedangkan komputer lain bisa. Pemeriksaan pertama yang tepat adalah ...',
    'Koneksi jaringan dan pengaturan printer pada komputer tersebut',
    [
      'Mengganti printer dengan yang baru',
      'Memformat seluruh hard disk',
      'Menginstal ulang semua aplikasi kantor',
      'Mengganti kabel listrik gedung',
    ],
    'Masalah hanya pada tiga komputer mengarah ke konfigurasi atau koneksi lokal, bukan kerusakan printer bersama.',
    ['tkk', 'penalaran', 'troubleshooting'],
  ),
  q(
    'penalaran',
    'HARD',
    'Sebuah proses berjalan terus-menerus dan menghabiskan CPU hingga komputer tidak responsif. Tindakan yang paling tepat adalah ...',
    'Menghentikan proses tersebut melalui pengelola tugas',
    [
      'Mencabut kabel jaringan',
      'Mengganti monitor',
      'Menghapus berkas sistem',
      'Mematikan printer',
    ],
    'Menghentikan proses yang memakan CPU lewat pengelola tugas memulihkan kendali sistem tanpa merusak data.',
    ['tkk', 'penalaran', 'troubleshooting'],
  ),
];

/* --------------------------------------------- pilihan ganda banyak jawaban */

/**
 * Soal `MULTI_CHOICE` TKK.
 *
 * Catatan penilaian: `scoringStrategy` pada baris soal disimpan sebagai
 * metadata (`MULTI_CORRECT_PARTIAL`, sama dengan default admin), tetapi
 * perhitungan skor sesi memakai strategi **subtes** (`KEYED_CORRECT`). Strategi
 * itu menilai benar bila himpunan opsi terpilih sama persis dengan kunci —
 * tidak ada kredit parsial — sehingga perilakunya dapat diuji dan konsisten
 * dengan soal pilihan tunggal pada subtes yang sama.
 */
export const TKK_MULTI_CHOICE: WrittenMultiChoice[] = [
  {
    topic: 'keamanan',
    difficulty: 'EASY',
    stem: 'Manakah yang termasuk praktik keamanan kata sandi yang baik?',
    correct: [
      'Menggunakan kata sandi berbeda untuk setiap akun',
      'Mengaktifkan autentikasi dua faktor',
    ],
    distractors: [
      'Memakai tanggal lahir sebagai kata sandi',
      'Membagikan kata sandi kepada rekan kerja',
      'Menuliskan kata sandi pada catatan yang ditempel di monitor',
    ],
    explanation:
      'Kata sandi unik per akun mencegah satu kebocoran membuka akun lain, dan 2FA menambah lapisan verifikasi. Tanggal lahir, berbagi sandi, dan menempel catatan justru memperbesar risiko.',
    tags: ['tkk', 'keamanan', 'kata-sandi', 'multi-jawaban'],
  },
  {
    topic: 'keamanan',
    difficulty: 'MEDIUM',
    stem: 'Manakah yang termasuk perangkat lunak berbahaya (malware)?',
    correct: ['Virus', 'Worm', 'Ransomware'],
    distractors: ['Firewall', 'Antivirus'],
    explanation:
      'Virus, worm, dan ransomware adalah malware. Firewall dan antivirus justru dipakai untuk mencegah atau menangani malware.',
    tags: ['tkk', 'keamanan', 'malware', 'multi-jawaban'],
  },
  {
    topic: 'perangkat-lunak',
    difficulty: 'MEDIUM',
    stem: 'Manakah yang termasuk sistem operasi?',
    correct: ['Linux', 'Windows', 'macOS'],
    distractors: ['Microsoft Excel', 'Google Chrome'],
    explanation:
      'Linux, Windows, dan macOS adalah sistem operasi. Excel adalah aplikasi spreadsheet dan Chrome adalah peramban web.',
    tags: ['tkk', 'perangkat-lunak', 'sistem-operasi', 'multi-jawaban'],
  },
];

/* ----------------------------------------------------------------- ekspor */

/** 87 soal TKK tertulis (20 perangkat keras + 18 perangkat lunak + 18 jaringan + 17 keamanan + 14 penalaran). */
export const TKK_QUESTIONS: WrittenQuestion[] = [
  ...PERANGKAT_KERAS,
  ...PERANGKAT_LUNAK,
  ...JARINGAN,
  ...KEAMANAN,
  ...PENALARAN,
];
