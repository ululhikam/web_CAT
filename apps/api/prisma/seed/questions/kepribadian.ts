import type { LikertSeedRow } from './types';

/**
 * Tes Kepribadian — 140 pernyataan Likert (skala 1–5).
 *
 * Tiga dimensi mengikuti `scoringConfig` subtes di `exam.seed.ts`
 * (KEPEMIMPINAN, KERJASAMA, STABILITAS). Sepuluh pasangan pernyataan
 * positif/terbalik dipakai sebagai penanda konsistensi jawaban.
 */

function l(
  dimension: string,
  polarity: 'POSITIVE' | 'REVERSE',
  statement: string,
  pairGroup: string | null,
  tags: readonly string[],
): LikertSeedRow {
  return {
    dimension,
    polarity,
    statement,
    pairGroup: pairGroup ?? undefined,
    difficulty: 'MEDIUM',
    tags,
  };
}

export const KEPRIBADIAN_QUESTIONS: LikertSeedRow[] = [
  /* ------------------------------------------------------- KEPEMIMPINAN (47) */
  l(
    'KEPEMIMPINAN',
    'POSITIVE',
    'Saya berani mengambil keputusan sulit meski informasi belum lengkap.',
    'LEAD-01',
    ['kepemimpinan', 'pengambilan-keputusan'],
  ),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya menunda keputusan sulit sampai orang lain memutuskan.',
    'LEAD-01',
    ['kepemimpinan', 'pengambilan-keputusan'],
  ),
  l(
    'KEPEMIMPINAN',
    'POSITIVE',
    'Saya memberi arahan yang jelas ketika tim kehilangan fokus.',
    null,
    ['kepemimpinan', 'pengarahan'],
  ),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya membiarkan tim bingung tanpa arahan saat situasi mendesak.',
    null,
    ['kepemimpinan', 'pengarahan'],
  ),
  l(
    'KEPEMIMPINAN',
    'POSITIVE',
    'Saya bersedia memikul tanggung jawab atas kesalahan anggota tim.',
    'LEAD-02',
    ['kepemimpinan', 'tanggung-jawab'],
  ),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya menyalahkan anggota lain ketika hasil kerja tim tidak memuaskan.',
    'LEAD-02',
    ['kepemimpinan', 'tanggung-jawab'],
  ),
  l(
    'KEPEMIMPINAN',
    'POSITIVE',
    'Saya mendorong anggota tim menyampaikan ide tanpa rasa takut.',
    'LEAD-03',
    ['kepemimpinan', 'partisipasi'],
  ),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya lebih suka semua keputusan diambil sendiri tanpa berdiskusi.',
    'LEAD-03',
    ['kepemimpinan', 'partisipasi'],
  ),
  l(
    'KEPEMIMPINAN',
    'POSITIVE',
    'Saya menetapkan contoh perilaku yang saya harapkan dari tim.',
    null,
    ['kepemimpinan', 'keteladanan'],
  ),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya meminta orang lain mematuhi aturan yang saya sendiri langgar.',
    null,
    ['kepemimpinan', 'keteladanan'],
  ),
  l(
    'KEPEMIMPINAN',
    'POSITIVE',
    'Saya berani menegur rekan yang melanggar prosedur kerja.',
    'LEAD-04',
    ['kepemimpinan', 'disiplin'],
  ),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya membiarkan pelanggaran kecil terjadi agar tidak terjadi konflik.',
    'LEAD-04',
    ['kepemimpinan', 'disiplin'],
  ),
  l(
    'KEPEMIMPINAN',
    'POSITIVE',
    'Saya mampu memprioritaskan tugas ketika beberapa tenggat datang bersamaan.',
    null,
    ['kepemimpinan', 'prioritas'],
  ),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya mengerjakan semua tugas sekaligus sehingga tidak ada yang selesai.',
    null,
    ['kepemimpinan', 'prioritas'],
  ),
  l(
    'KEPEMIMPINAN',
    'POSITIVE',
    'Saya mengambil inisiatif saat melihat masalah yang belum ditangani.',
    null,
    ['kepemimpinan', 'inisiatif'],
  ),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya menunggu perintah atasan sebelum bertindak meski masalah mendesak.',
    null,
    ['kepemimpinan', 'inisiatif'],
  ),
  l(
    'KEPEMIMPINAN',
    'POSITIVE',
    'Saya menjelaskan alasan keputusan agar tim memahami arah kerja.',
    null,
    ['kepemimpinan', 'komunikasi'],
  ),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya merahasiakan alasan keputusan agar tim bergantung pada saya.',
    null,
    ['kepemimpinan', 'komunikasi'],
  ),
  l('KEPEMIMPINAN', 'POSITIVE', 'Saya membagi tugas sesuai kemampuan anggota tim.', null, [
    'kepemimpinan',
    'delegasi',
  ]),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya membagi tugas secara sembarang tanpa melihat kemampuan.',
    null,
    ['kepemimpinan', 'delegasi'],
  ),
  l('KEPEMIMPINAN', 'POSITIVE', 'Saya tetap fokus pada tujuan meski menghadapi kritik.', null, [
    'kepemimpinan',
    'keteguhan',
  ]),
  l('KEPEMIMPINAN', 'REVERSE', 'Saya meninggalkan rencana begitu mendapat kritik.', null, [
    'kepemimpinan',
    'keteguhan',
  ]),
  l(
    'KEPEMIMPINAN',
    'POSITIVE',
    'Saya membangun kesepakatan sebelum mengambil keputusan penting.',
    null,
    ['kepemimpinan', 'musyawarah'],
  ),
  l('KEPEMIMPINAN', 'REVERSE', 'Saya memaksakan pendapat meski seluruh tim tidak setuju.', null, [
    'kepemimpinan',
    'musyawarah',
  ]),
  l(
    'KEPEMIMPINAN',
    'POSITIVE',
    'Saya memberi umpan balik yang jelas dan membangun kepada anggota tim.',
    null,
    ['kepemimpinan', 'umpan-balik'],
  ),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya hanya memberi tahu kesalahan tanpa memberi saran perbaikan.',
    null,
    ['kepemimpinan', 'umpan-balik'],
  ),
  l(
    'KEPEMIMPINAN',
    'POSITIVE',
    'Saya berani mengambil keputusan tidak populer demi kepentingan tugas.',
    null,
    ['kepemimpinan', 'integritas'],
  ),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya memilih keputusan yang disukai banyak orang meski merugikan tugas.',
    null,
    ['kepemimpinan', 'integritas'],
  ),
  l('KEPEMIMPINAN', 'POSITIVE', 'Saya memantau kemajuan pekerjaan secara berkala.', null, [
    'kepemimpinan',
    'pengawasan',
  ]),
  l('KEPEMIMPINAN', 'REVERSE', 'Saya baru memeriksa pekerjaan setelah tenggat terlewat.', null, [
    'kepemimpinan',
    'pengawasan',
  ]),
  l(
    'KEPEMIMPINAN',
    'POSITIVE',
    'Saya menempatkan kepentingan organisasi di atas kepentingan pribadi.',
    null,
    ['kepemimpinan', 'loyalitas'],
  ),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya mendahulukan kenyamanan pribadi meski mengorbankan tugas.',
    null,
    ['kepemimpinan', 'loyalitas'],
  ),
  l('KEPEMIMPINAN', 'POSITIVE', 'Saya melatih anggota tim agar mampu bekerja mandiri.', null, [
    'kepemimpinan',
    'pembinaan',
  ]),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya sengaja menyimpan pengetahuan agar posisi saya tidak tergantikan.',
    null,
    ['kepemimpinan', 'pembinaan'],
  ),
  l('KEPEMIMPINAN', 'POSITIVE', 'Saya menyampaikan target dengan jelas dan terukur.', null, [
    'kepemimpinan',
    'perencanaan',
  ]),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya menyampaikan target secara samar sehingga tim menebak-nebak.',
    null,
    ['kepemimpinan', 'perencanaan'],
  ),
  l(
    'KEPEMIMPINAN',
    'POSITIVE',
    'Saya menghindari mencari kambing hitam ketika keputusan berujung buruk.',
    null,
    ['kepemimpinan', 'tanggung-jawab'],
  ),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya menghindari tanggung jawab ketika keputusan berujung buruk.',
    null,
    ['kepemimpinan', 'tanggung-jawab'],
  ),
  l(
    'KEPEMIMPINAN',
    'POSITIVE',
    'Saya mengakui keterbatasan diri dan meminta bantuan bila perlu.',
    null,
    ['kepemimpinan', 'kerendahan-hati'],
  ),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya berpura-pura memahami hal yang sebenarnya tidak saya kuasai.',
    null,
    ['kepemimpinan', 'kerendahan-hati'],
  ),
  l(
    'KEPEMIMPINAN',
    'POSITIVE',
    'Saya konsisten menegakkan aturan kepada semua anggota tim.',
    null,
    ['kepemimpinan', 'keadilan'],
  ),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya memberi pengecualian aturan kepada orang yang dekat dengan saya.',
    null,
    ['kepemimpinan', 'keadilan'],
  ),
  l(
    'KEPEMIMPINAN',
    'POSITIVE',
    'Saya menyusun rencana cadangan sebelum melaksanakan tugas penting.',
    null,
    ['kepemimpinan', 'perencanaan'],
  ),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya bekerja tanpa rencana cadangan meski risiko kegagalan tinggi.',
    null,
    ['kepemimpinan', 'perencanaan'],
  ),
  l('KEPEMIMPINAN', 'POSITIVE', 'Saya memberi apresiasi atas keberhasilan anggota tim.', null, [
    'kepemimpinan',
    'apresiasi',
  ]),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya menganggap keberhasilan tim sebagai keberhasilan saya sendiri.',
    null,
    ['kepemimpinan', 'apresiasi'],
  ),
  l(
    'KEPEMIMPINAN',
    'POSITIVE',
    'Saya berani menyampaikan informasi yang tidak menyenangkan kepada atasan.',
    null,
    ['kepemimpinan', 'kejujuran'],
  ),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya menyembunyikan masalah agar tidak dianggap tidak kompeten.',
    null,
    ['kepemimpinan', 'kejujuran'],
  ),
  l(
    'KEPEMIMPINAN',
    'POSITIVE',
    'Saya menetapkan standar kerja yang tinggi bagi diri sendiri dan tim.',
    null,
    ['kepemimpinan', 'standar'],
  ),
  l(
    'KEPEMIMPINAN',
    'REVERSE',
    'Saya membiarkan standar kerja rendah agar tidak dianggap menuntut.',
    null,
    ['kepemimpinan', 'standar'],
  ),

  /* ------------------------------------------------------------ KERJASAMA (47) */
  l(
    'KERJASAMA',
    'POSITIVE',
    'Saya mendengarkan pendapat rekan sebelum menyimpulkan sesuatu.',
    'TEAM-01',
    ['kerjasama', 'mendengarkan'],
  ),
  l(
    'KERJASAMA',
    'REVERSE',
    'Saya memotong pembicaraan rekan karena merasa pendapat saya lebih benar.',
    'TEAM-01',
    ['kerjasama', 'mendengarkan'],
  ),
  l('KERJASAMA', 'POSITIVE', 'Saya berbagi informasi yang dibutuhkan rekan kerja.', null, [
    'kerjasama',
    'berbagi-informasi',
  ]),
  l(
    'KERJASAMA',
    'REVERSE',
    'Saya menyimpan informasi penting agar lebih unggul dari rekan.',
    null,
    ['kerjasama', 'berbagi-informasi'],
  ),
  l('KERJASAMA', 'POSITIVE', 'Saya menyesuaikan cara kerja dengan kebutuhan tim.', 'TEAM-02', [
    'kerjasama',
    'adaptasi',
  ]),
  l(
    'KERJASAMA',
    'REVERSE',
    'Saya memaksakan cara kerja saya meski tim kesulitan mengikutinya.',
    'TEAM-02',
    ['kerjasama', 'adaptasi'],
  ),
  l('KERJASAMA', 'POSITIVE', 'Saya membantu rekan yang kesulitan menyelesaikan tugas.', null, [
    'kerjasama',
    'tolong-menolong',
  ]),
  l('KERJASAMA', 'REVERSE', 'Saya menolak membantu rekan karena itu bukan tugas saya.', null, [
    'kerjasama',
    'tolong-menolong',
  ]),
  l('KERJASAMA', 'POSITIVE', 'Saya terbuka menerima kritik dari rekan kerja.', 'TEAM-03', [
    'kerjasama',
    'keterbukaan',
  ]),
  l('KERJASAMA', 'REVERSE', 'Saya tersinggung ketika rekan mengoreksi pekerjaan saya.', 'TEAM-03', [
    'kerjasama',
    'keterbukaan',
  ]),
  l('KERJASAMA', 'POSITIVE', 'Saya menghargai perbedaan pendapat dalam diskusi tim.', null, [
    'kerjasama',
    'toleransi',
  ]),
  l(
    'KERJASAMA',
    'REVERSE',
    'Saya menganggap pendapat yang berbeda sebagai bentuk perlawanan.',
    null,
    ['kerjasama', 'toleransi'],
  ),
  l(
    'KERJASAMA',
    'POSITIVE',
    'Saya menyelesaikan bagian tugas saya tepat waktu agar tim tidak tertahan.',
    null,
    ['kerjasama', 'tanggung-jawab'],
  ),
  l('KERJASAMA', 'REVERSE', 'Saya menunda pekerjaan sehingga rekan harus menunggu.', null, [
    'kerjasama',
    'tanggung-jawab',
  ]),
  l('KERJASAMA', 'POSITIVE', 'Saya berbagi keberhasilan dengan anggota tim.', null, [
    'kerjasama',
    'apresiasi',
  ]),
  l('KERJASAMA', 'REVERSE', 'Saya mengambil seluruh pujian atas hasil kerja kelompok.', null, [
    'kerjasama',
    'apresiasi',
  ]),
  l(
    'KERJASAMA',
    'POSITIVE',
    'Saya meminta masukan sebelum mengambil keputusan yang memengaruhi tim.',
    null,
    ['kerjasama', 'musyawarah'],
  ),
  l(
    'KERJASAMA',
    'REVERSE',
    'Saya mengambil keputusan sendiri meski berdampak pada beban rekan.',
    null,
    ['kerjasama', 'musyawarah'],
  ),
  l(
    'KERJASAMA',
    'POSITIVE',
    'Saya menjaga komunikasi yang sopan meski sedang berbeda pendapat.',
    null,
    ['kerjasama', 'sopan-santun'],
  ),
  l('KERJASAMA', 'REVERSE', 'Saya menggunakan nada keras agar pendapat saya diikuti.', null, [
    'kerjasama',
    'sopan-santun',
  ]),
  l(
    'KERJASAMA',
    'POSITIVE',
    'Saya mengenali suasana hati rekan dan menyesuaikan cara berkomunikasi.',
    null,
    ['kerjasama', 'empati'],
  ),
  l('KERJASAMA', 'REVERSE', 'Saya mengabaikan perasaan rekan asalkan target tercapai.', null, [
    'kerjasama',
    'empati',
  ]),
  l('KERJASAMA', 'POSITIVE', 'Saya bersedia menggantikan tugas rekan yang berhalangan.', null, [
    'kerjasama',
    'solidaritas',
  ]),
  l('KERJASAMA', 'REVERSE', 'Saya menolak menggantikan tugas rekan meski mampu.', null, [
    'kerjasama',
    'solidaritas',
  ]),
  l('KERJASAMA', 'POSITIVE', 'Saya membangun kepercayaan dengan menepati janji kepada tim.', null, [
    'kerjasama',
    'kepercayaan',
  ]),
  l('KERJASAMA', 'REVERSE', 'Saya sering membatalkan janji kepada rekan tanpa penjelasan.', null, [
    'kerjasama',
    'kepercayaan',
  ]),
  l('KERJASAMA', 'POSITIVE', 'Saya menyampaikan keberatan secara langsung dan terbuka.', null, [
    'kerjasama',
    'komunikasi',
  ]),
  l(
    'KERJASAMA',
    'REVERSE',
    'Saya menyimpan ketidaksetujuan lalu menjelekkan rekan di belakang.',
    null,
    ['kerjasama', 'komunikasi'],
  ),
  l('KERJASAMA', 'POSITIVE', 'Saya meminta maaf ketika menyadari kesalahan saya.', null, [
    'kerjasama',
    'kejujuran',
  ]),
  l('KERJASAMA', 'REVERSE', 'Saya sulit mengakui kesalahan kepada rekan kerja.', null, [
    'kerjasama',
    'kejujuran',
  ]),
  l(
    'KERJASAMA',
    'POSITIVE',
    'Saya berkoordinasi sebelum mengambil tindakan yang menyangkut tim.',
    null,
    ['kerjasama', 'koordinasi'],
  ),
  l('KERJASAMA', 'REVERSE', 'Saya bertindak sendiri tanpa memberi tahu rekan satu tim.', null, [
    'kerjasama',
    'koordinasi',
  ]),
  l('KERJASAMA', 'POSITIVE', 'Saya menghargai waktu rekan dengan datang tepat waktu.', null, [
    'kerjasama',
    'disiplin',
  ]),
  l('KERJASAMA', 'REVERSE', 'Saya sering terlambat sehingga rekan harus menunggu.', null, [
    'kerjasama',
    'disiplin',
  ]),
  l('KERJASAMA', 'POSITIVE', 'Saya berbagi beban kerja secara adil dengan anggota tim.', null, [
    'kerjasama',
    'keadilan',
  ]),
  l(
    'KERJASAMA',
    'REVERSE',
    'Saya memilih pekerjaan ringan dan meninggalkan yang sulit bagi rekan.',
    null,
    ['kerjasama', 'keadilan'],
  ),
  l(
    'KERJASAMA',
    'POSITIVE',
    'Saya mendukung keputusan tim meski pendapat saya tidak dipilih.',
    null,
    ['kerjasama', 'loyalitas'],
  ),
  l('KERJASAMA', 'REVERSE', 'Saya bersikap pasif ketika pendapat saya tidak diterima.', null, [
    'kerjasama',
    'loyalitas',
  ]),
  l(
    'KERJASAMA',
    'POSITIVE',
    'Saya mencari solusi bersama ketika terjadi perbedaan pendapat.',
    null,
    ['kerjasama', 'penyelesaian-konflik'],
  ),
  l('KERJASAMA', 'REVERSE', 'Saya mempertahankan pendapat sampai rekan menyerah.', null, [
    'kerjasama',
    'penyelesaian-konflik',
  ]),
  l(
    'KERJASAMA',
    'POSITIVE',
    'Saya menyampaikan informasi dengan jelas agar tidak terjadi salah paham.',
    null,
    ['kerjasama', 'komunikasi'],
  ),
  l('KERJASAMA', 'REVERSE', 'Saya memberi instruksi yang membingungkan kepada rekan.', null, [
    'kerjasama',
    'komunikasi',
  ]),
  l('KERJASAMA', 'POSITIVE', 'Saya menghormati pembagian peran yang telah disepakati.', null, [
    'kerjasama',
    'peran',
  ]),
  l('KERJASAMA', 'REVERSE', 'Saya mengambil alih tugas rekan tanpa berdiskusi.', null, [
    'kerjasama',
    'peran',
  ]),
  l('KERJASAMA', 'POSITIVE', 'Saya memuji kontribusi rekan di depan tim.', null, [
    'kerjasama',
    'apresiasi',
  ]),
  l('KERJASAMA', 'REVERSE', 'Saya jarang mengakui bantuan rekan dalam pekerjaan.', null, [
    'kerjasama',
    'apresiasi',
  ]),
  l('KERJASAMA', 'POSITIVE', 'Saya menjaga rahasia tim yang dipercayakan kepada saya.', null, [
    'kerjasama',
    'kepercayaan',
  ]),

  /* ------------------------------------------------------------ STABILITAS (46) */
  l('STABILITAS', 'POSITIVE', 'Saya tetap tenang ketika menghadapi tekanan waktu.', 'CALM-01', [
    'stabilitas',
    'pengendalian-emosi',
  ]),
  l('STABILITAS', 'REVERSE', 'Saya mudah panik ketika tenggat waktu mendesak.', 'CALM-01', [
    'stabilitas',
    'pengendalian-emosi',
  ]),
  l(
    'STABILITAS',
    'POSITIVE',
    'Saya menahan emosi saat menerima kritik di depan orang lain.',
    'CALM-02',
    ['stabilitas', 'pengendalian-emosi'],
  ),
  l('STABILITAS', 'REVERSE', 'Saya mudah tersinggung ketika dikritik di depan umum.', 'CALM-02', [
    'stabilitas',
    'pengendalian-emosi',
  ]),
  l(
    'STABILITAS',
    'POSITIVE',
    'Saya tetap fokus pada pekerjaan meski suasana tidak nyaman.',
    'CALM-03',
    ['stabilitas', 'fokus'],
  ),
  l('STABILITAS', 'REVERSE', 'Saya kehilangan fokus karena hal kecil yang mengganggu.', 'CALM-03', [
    'stabilitas',
    'fokus',
  ]),
  l('STABILITAS', 'POSITIVE', 'Saya mengendalikan nada bicara saat merasa kesal.', null, [
    'stabilitas',
    'pengendalian-emosi',
  ]),
  l('STABILITAS', 'REVERSE', 'Saya meninggikan suara ketika tidak setuju.', null, [
    'stabilitas',
    'pengendalian-emosi',
  ]),
  l(
    'STABILITAS',
    'POSITIVE',
    'Saya memikirkan akibat sebelum bertindak saat emosi memuncak.',
    null,
    ['stabilitas', 'pengendalian-emosi'],
  ),
  l('STABILITAS', 'REVERSE', 'Saya bertindak terburu-buru ketika sedang marah.', null, [
    'stabilitas',
    'pengendalian-emosi',
  ]),
  l('STABILITAS', 'POSITIVE', 'Saya mampu bekerja konsisten dari awal hingga akhir tugas.', null, [
    'stabilitas',
    'konsistensi',
  ]),
  l(
    'STABILITAS',
    'REVERSE',
    'Saya bersemangat di awal tetapi kehilangan motivasi di tengah.',
    null,
    ['stabilitas', 'konsistensi'],
  ),
  l('STABILITAS', 'POSITIVE', 'Saya menerima kegagalan sebagai bahan perbaikan.', null, [
    'stabilitas',
    'ketahanan',
  ]),
  l('STABILITAS', 'REVERSE', 'Saya menyerah setelah mengalami kegagalan.', null, [
    'stabilitas',
    'ketahanan',
  ]),
  l('STABILITAS', 'POSITIVE', 'Saya menjaga rutinitas kerja meski tidak ada pengawasan.', null, [
    'stabilitas',
    'disiplin',
  ]),
  l('STABILITAS', 'REVERSE', 'Saya hanya bekerja serius ketika diawasi atasan.', null, [
    'stabilitas',
    'disiplin',
  ]),
  l('STABILITAS', 'POSITIVE', 'Saya menyesuaikan diri dengan perubahan aturan kerja.', null, [
    'stabilitas',
    'adaptasi',
  ]),
  l('STABILITAS', 'REVERSE', 'Saya menolak perubahan cara kerja meski diperlukan.', null, [
    'stabilitas',
    'adaptasi',
  ]),
  l('STABILITAS', 'POSITIVE', 'Saya tidur cukup dan menjaga kondisi agar siap bertugas.', null, [
    'stabilitas',
    'kebugaran',
  ]),
  l(
    'STABILITAS',
    'REVERSE',
    'Saya mengabaikan kesehatan sehingga mudah lelah saat bertugas.',
    null,
    ['stabilitas', 'kebugaran'],
  ),
  l('STABILITAS', 'POSITIVE', 'Saya mengelola waktu istirahat agar tetap produktif.', null, [
    'stabilitas',
    'kebugaran',
  ]),
  l('STABILITAS', 'REVERSE', 'Saya begadang tanpa alasan sehingga sulit berkonsentrasi.', null, [
    'stabilitas',
    'kebugaran',
  ]),
  l(
    'STABILITAS',
    'POSITIVE',
    'Saya menyelesaikan masalah satu per satu saat banyak masalah muncul.',
    null,
    ['stabilitas', 'pengelolaan-stres'],
  ),
  l('STABILITAS', 'REVERSE', 'Saya kewalahan dan berhenti bekerja saat masalah menumpuk.', null, [
    'stabilitas',
    'pengelolaan-stres',
  ]),
  l(
    'STABILITAS',
    'POSITIVE',
    'Saya bersikap tenang ketika rekan kerja bersikap tidak menyenangkan.',
    null,
    ['stabilitas', 'pengendalian-emosi'],
  ),
  l('STABILITAS', 'REVERSE', 'Saya membalas sikap tidak menyenangkan dengan emosi.', null, [
    'stabilitas',
    'pengendalian-emosi',
  ]),
  l('STABILITAS', 'POSITIVE', 'Saya mempertahankan standar kerja meski sedang lelah.', null, [
    'stabilitas',
    'konsistensi',
  ]),
  l('STABILITAS', 'REVERSE', 'Saya menurunkan kualitas kerja saat merasa lelah.', null, [
    'stabilitas',
    'konsistensi',
  ]),
  l(
    'STABILITAS',
    'POSITIVE',
    'Saya meminta waktu sejenak untuk menenangkan diri sebelum mengambil keputusan penting.',
    null,
    ['stabilitas', 'pengendalian-emosi'],
  ),
  l('STABILITAS', 'REVERSE', 'Saya mengambil keputusan penting saat emosi masih memuncak.', null, [
    'stabilitas',
    'pengendalian-emosi',
  ]),
  l('STABILITAS', 'POSITIVE', 'Saya menerima hasil penilaian atasan dengan sikap terbuka.', null, [
    'stabilitas',
    'keterbukaan',
  ]),
  l(
    'STABILITAS',
    'REVERSE',
    'Saya menyalahkan atasan atas penilaian yang tidak sesuai harapan.',
    null,
    ['stabilitas', 'keterbukaan'],
  ),
  l('STABILITAS', 'POSITIVE', 'Saya tetap sopan kepada orang yang tidak menyetujui saya.', null, [
    'stabilitas',
    'sopan-santun',
  ]),
  l('STABILITAS', 'REVERSE', 'Saya bersikap dingin kepada orang yang berbeda pendapat.', null, [
    'stabilitas',
    'sopan-santun',
  ]),
  l(
    'STABILITAS',
    'POSITIVE',
    'Saya fokus pada hal yang dapat saya kendalikan saat situasi sulit.',
    null,
    ['stabilitas', 'pengelolaan-stres'],
  ),
  l('STABILITAS', 'REVERSE', 'Saya terus memikirkan hal yang tidak dapat saya ubah.', null, [
    'stabilitas',
    'pengelolaan-stres',
  ]),
  l('STABILITAS', 'POSITIVE', 'Saya bangkit kembali setelah menerima teguran.', null, [
    'stabilitas',
    'ketahanan',
  ]),
  l('STABILITAS', 'REVERSE', 'Saya kehilangan semangat setelah ditegur.', null, [
    'stabilitas',
    'ketahanan',
  ]),
  l('STABILITAS', 'POSITIVE', 'Saya menjaga janji meski menghadapi banyak gangguan.', null, [
    'stabilitas',
    'integritas',
  ]),
  l(
    'STABILITAS',
    'REVERSE',
    'Saya mudah teralihkan dari tugas oleh hal yang tidak penting.',
    null,
    ['stabilitas', 'fokus'],
  ),
  l('STABILITAS', 'POSITIVE', 'Saya sabar menunggu proses yang memerlukan waktu.', null, [
    'stabilitas',
    'kesabaran',
  ]),
  l('STABILITAS', 'REVERSE', 'Saya ingin semuanya selesai segera tanpa sabar.', null, [
    'stabilitas',
    'kesabaran',
  ]),
  l('STABILITAS', 'POSITIVE', 'Saya menyampaikan keluhan melalui saluran yang tepat.', null, [
    'stabilitas',
    'komunikasi',
  ]),
  l('STABILITAS', 'REVERSE', 'Saya melampiaskan keluhan kepada rekan yang tidak berkaitan.', null, [
    'stabilitas',
    'komunikasi',
  ]),
  l(
    'STABILITAS',
    'POSITIVE',
    'Saya menjaga pikiran tetap jernih ketika menghadapi tuduhan.',
    null,
    ['stabilitas', 'pengendalian-emosi'],
  ),
  l('STABILITAS', 'REVERSE', 'Saya langsung membela diri dengan emosi saat dituduh.', null, [
    'stabilitas',
    'pengendalian-emosi',
  ]),
];
