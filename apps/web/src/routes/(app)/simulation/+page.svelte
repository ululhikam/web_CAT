<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import AdminIcon from '$lib/components/admin/AdminIcon.svelte';

  interface Question {
    id: number;
    module: string;
    stem: string;
    options: { key: string; text: string }[];
    correctKey: string;
    explanation: string;
  }

  const questions: Question[] = [
    /* --------------------------------------------------- 1. TES PSIKOLOGI (PSIKOTES) */
    {
      id: 1,
      module: 'Tes Psikologi — Kecerdasan (Verbal & Analogi)',
      stem: 'POLISI : HUKUM = HAKIM : ...',
      options: [
        { key: 'A', text: 'Pengadilan' },
        { key: 'B', text: 'Keadilan' },
        { key: 'C', text: 'Terdakwa' },
        { key: 'D', text: 'Penjara' },
        { key: 'E', text: 'Undang-Undang' },
      ],
      correctKey: 'B',
      explanation: 'Analogi fungsi/tujuan tugas: Polisi bertugas menegakkan hukum; Hakim bertugas menegakkan keadilan di persidangan.',
    },
    {
      id: 2,
      module: 'Tes Psikologi — Kecerdasan (Numerik & Deret)',
      stem: 'Tentukan bilangan kelanjutan dari deret berikut: 3, 7, 15, 31, 63, ...',
      options: [
        { key: 'A', text: '125' },
        { key: 'B', text: '127' },
        { key: 'C', text: '129' },
        { key: 'D', text: '131' },
        { key: 'E', text: '135' },
      ],
      correctKey: 'B',
      explanation: 'Pola deret adalah (angka × 2) + 1. Perhitungannya: 3×2+1=7; 7×2+1=15; 15×2+1=31; 31×2+1=63; 63×2+1 = 127.',
    },
    {
      id: 3,
      module: 'Tes Psikologi — Kecerdasan (Logika Silogisme)',
      stem: 'Semua perwira Polri wajib menjunjung tinggi etika profesi dan integritas dinas. Inspektur Polisi Arya adalah seorang perwira Polri. Kesimpulan yang tepat adalah...',
      options: [
        { key: 'A', text: 'Inspektur Polisi Arya tidak terikat kode etik kepolisian.' },
        { key: 'B', text: 'Inspektur Polisi Arya wajib menjunjung tinggi etika profesi dan integritas dinas.' },
        { key: 'C', text: 'Sebagian perwira Polri diperbolehkan mengabaikan integritas bila situasi darurat.' },
        { key: 'D', text: 'Inspektur Polisi Arya hanya terikat aturan administrasi biasa.' },
        { key: 'E', text: 'Integritas hanya diwajibkan bagi perwira menengah ke atas.' },
      ],
      correctKey: 'B',
      explanation: 'Silogisme kategorik standar: Semua A adalah B; C adalah A; maka C adalah B (Inspektur Polisi Arya wajib menjunjung tinggi etika profesi dan integritas).',
    },
    {
      id: 4,
      module: 'Tes Psikologi — Kecerdasan (Peta & Denah Lokasi)',
      stem: 'Pada denah penugasan: Pos Polisi berada di sebelah barat Lapangan Kota, sedangkan Rumah Sakit berada tepat di sebelah utara Pos Polisi. Arah Rumah Sakit jika dilihat dari Lapangan Kota adalah...',
      options: [
        { key: 'A', text: 'Barat Laut' },
        { key: 'B', text: 'Barat Daya' },
        { key: 'C', text: 'Timur Laut' },
        { key: 'D', text: 'Tenggara' },
        { key: 'E', text: 'Utara' },
      ],
      correctKey: 'A',
      explanation: 'Dari Lapangan Kota, Pos Polisi berada di arah Barat. Dari Pos Polisi bergerak ke arah Utara menuju Rumah Sakit. Maka posisi Rumah Sakit dari Lapangan Kota adalah arah Barat Laut.',
    },
    {
      id: 5,
      module: 'Tes Psikologi — Mental Kepribadian (Integritas)',
      stem: 'Seorang rekan kerja satu angkatan meminta Anda untuk tidak mencatat pelanggaran disiplin ringan yang dilakukannya saat bertugas jaga. Sikap Anda adalah...',
      options: [
        { key: 'A', text: 'Mengabulkan permintaannya demi menjaga solidaritas pertemanan satu angkatan.' },
        { key: 'B', text: 'Menolak dengan santun namun tegas dan tetap mencatat serta melaporkan sesuai prosedur kedinasan.' },
        { key: 'C', text: 'Membiarkannya tanpa membuat catatan apa pun dan pura-pura tidak tahu.' },
        { key: 'D', text: 'Meminta imbalan tertentu jika rekan tersebut ingin dibantu penghapusan catatan.' },
        { key: 'E', text: 'Menyebarkan pelanggaran rekan tersebut kepada anggota tim lain agar menjadi bahan pembicaraan.' },
      ],
      correctKey: 'B',
      explanation: 'Integritas profesi menuntut ketaatan pada prosedur tanpa kompromi, dengan tetap menjaga kesantunan dan profesionalitas komunikasi.',
    },
    {
      id: 6,
      module: 'Tes Psikologi — Mental Kepribadian (Pengendalian Emosi)',
      stem: 'Ketika Anda sedang melayani masyarakat di loket pelayanan kedinasan, seorang warga datang dengan nada marah dan mencela kinerja unit. Tindakan Anda adalah...',
      options: [
        { key: 'A', text: 'Membalas membentak warga tersebut agar menyadari bahwa kantor kepolisian harus dihormati.' },
        { key: 'B', text: 'Meninggalkan loket dan menyuruh petugas keamanan mengusir warga tersebut keluar.' },
        { key: 'C', text: 'Tetap tenang, mendengarkan keluhan dengan sabar tanpa terpancing emosi, lalu memberikan penjelasan aturan dan solusi secara runtut.' },
        { key: 'D', text: 'Mengabaikan keluhannya dan melayani warga berikutnya tanpa menanggapi.' },
        { key: 'E', text: 'Menutup loket pelayanan secara sepihak sampai warga tersebut tenang.' },
      ],
      correctKey: 'C',
      explanation: 'Pengendalian diri, empati, dan orientasi pelayanan prima adalah karakteristik utama perwira Polri dalam menyelesaikan komplain masyarakat secara elegan.',
    },
    {
      id: 7,
      module: 'Tes Psikologi — Kecermatan (Huruf Hilang)',
      stem: 'Tentukan huruf yang HILANG dari kelompok huruf patokan:\n\nPatokan: [ K   M   P   R   T ]\n\nSoal: [ P   R   K   T ]',
      options: [
        { key: 'A', text: 'K' },
        { key: 'B', text: 'M' },
        { key: 'C', text: 'P' },
        { key: 'D', text: 'R' },
        { key: 'E', text: 'T' },
      ],
      correctKey: 'B',
      explanation: 'Kelompok patokan memuat {K, M, P, R, T}. Pada soal terdapat {P, R, K, T}. Huruf yang hilang adalah "M" (opsi B).',
    },

    /* --------------------------------------------------- 2. TES KEMAMPUAN KOMPUTER (TKK) */
    {
      id: 8,
      module: 'Tes Kemampuan Komputer (TKK) — Perangkat Keras',
      stem: 'Komponen perangkat keras komputer yang berfungsi sebagai otak utama untuk memproses seluruh instruksi logika dan perhitungan data adalah...',
      options: [
        { key: 'A', text: 'Central Processing Unit (CPU)' },
        { key: 'B', text: 'Random Access Memory (RAM)' },
        { key: 'C', text: 'Hard Disk Drive (HDD)' },
        { key: 'D', text: 'Power Supply Unit (PSU)' },
        { key: 'E', text: 'Solid State Drive (SSD)' },
      ],
      correctKey: 'A',
      explanation: 'CPU (Central Processing Unit) atau prosesor adalah unit pengolah pusat yang menjalankan seluruh komputasi dan instruksi program.',
    },
    {
      id: 9,
      module: 'Tes Kemampuan Komputer (TKK) — Perangkat Lunak',
      stem: 'Perangkat lunak sistem yang berfungsi mengelola sumber daya perangkat keras dan menyediakan antarmuka bagi pengguna serta aplikasi komputer disebut...',
      options: [
        { key: 'A', text: 'Sistem Operasi (Operating System)' },
        { key: 'B', text: 'Peramban Web (Web Browser)' },
        { key: 'C', text: 'Database Management System (DBMS)' },
        { key: 'D', text: 'Program Utilitas Grafis' },
        { key: 'E', text: 'Compiler Pemrograman' },
      ],
      correctKey: 'A',
      explanation: 'Sistem Operasi (seperti Windows, Linux, macOS) bertanggung jawab menjembatani interaksi perangkat keras dan aplikasi perangkat lunak.',
    },
    {
      id: 10,
      module: 'Tes Kemampuan Komputer (TKK) — Jaringan Komputer',
      stem: 'Alamat unik berbasis numerik (seperti 192.168.1.1) yang digunakan untuk mengidentifikasi perangkat komputer di dalam sebuah jaringan komunikasi dinamakan...',
      options: [
        { key: 'A', text: 'MAC Address' },
        { key: 'B', text: 'IP Address (Internet Protocol Address)' },
        { key: 'C', text: 'Subnet Mask' },
        { key: 'D', text: 'Default Gateway' },
        { key: 'E', text: 'Domain Name' },
      ],
      correctKey: 'B',
      explanation: 'IP Address adalah alamat protokol internet logis yang mengidentifikasi setiap host atau perangkat dalam jaringan TCP/IP.',
    },
    {
      id: 11,
      module: 'Tes Kemampuan Komputer (TKK) — Keamanan Informasi',
      stem: 'Upaya penipuan digital di mana pelaku menyamar sebagai instansi resmi melalui pesan email atau tautan palsu untuk mencuri data rahasia/kata sandi pengguna disebut...',
      options: [
        { key: 'A', text: 'Phishing' },
        { key: 'B', text: 'DDoS Attack' },
        { key: 'C', text: 'Defacing' },
        { key: 'D', text: 'Brute Force' },
        { key: 'E', text: 'Spyware' },
      ],
      correctKey: 'A',
      explanation: 'Phishing adalah rekayasa sosial (social engineering) dengan membuat pesan atau situs tiruan untuk mengelabui korban agar menyerahkan data sensitif.',
    },
    {
      id: 12,
      module: 'Tes Kemampuan Komputer (TKK) — Etika & Keamanan Digital',
      stem: 'Langkah pengamanan paling efektif untuk mencegah akses ilegal ke akun kedinasan digital selain menggunakan kata sandi yang kuat adalah...',
      options: [
        { key: 'A', text: 'Menyimpan kata sandi di kertas catatan dekat monitor komputer kantor' },
        { key: 'B', text: 'Mengaktifkan Autentikasi Dua Faktor (Two-Factor Authentication / 2FA)' },
        { key: 'C', text: 'Menggunakan tanggal lahir sebagai kombinasi kata sandi' },
        { key: 'D', text: 'Membagikan kata sandi kepada rekan satu regu piket' },
        { key: 'E', text: 'Tidak pernah keluar (logout) dari komputer dinas bersama' },
      ],
      correctKey: 'B',
      explanation: 'Two-Factor Authentication (2FA) memberikan lapisan keamanan ganda sehingga akun tetap aman meskipun kata sandi diketahui pihak lain.',
    },

    /* --------------------------------------------------- 3. TES PENGETAHUAN KEPOLISIAN (TPK) */
    {
      id: 13,
      module: 'Tes Pengetahuan Kepolisian (TPK) — Tugas Pokok Polri',
      stem: 'Berdasarkan Undang-Undang No. 2 Tahun 2002 Pasal 13, tugas pokok Kepolisian Negara Republik Indonesia adalah...',
      options: [
        { key: 'A', text: 'Memelihara keamanan dan ketertiban masyarakat, menegakkan hukum, serta memberikan perlindungan, pengayoman, dan pelayanan kepada masyarakat.' },
        { key: 'B', text: 'Menjaga pertahanan kedaulatan negara dari ancaman agresi militer luar negeri.' },
        { key: 'C', text: 'Melakukan penuntutan perkara pidana umum di persidangan pengadilan negeri.' },
        { key: 'D', text: 'Menjatuhkan vonis sanksi hukum kepada tersangka tindak pidana.' },
        { key: 'E', text: 'Mengelola dan mengatur anggaran keuangan pemerintah daerah.' },
      ],
      correctKey: 'A',
      explanation: 'Pasal 13 UU No. 2 Tahun 2002 menegaskan tiga pilar tugas pokok Polri: harkamtibmas, penegakan hukum, dan perlindungan, pengayoman, serta pelayanan masyarakat.',
    },
    {
      id: 14,
      module: 'Tes Pengetahuan Kepolisian (TPK) — Kewenangan & Diskresi',
      stem: 'Tindakan perwira/anggota Polri yang dilakukan demi kepentingan umum berdasarkan penilaiannya sendiri saat menghadapi situasi mendesak di lapangan merupakan perwujudan dari...',
      options: [
        { key: 'A', text: 'Diskresi Kepolisian (Pasal 18 UU No. 2 Tahun 2002)' },
        { key: 'B', text: 'Hak Kekebalan Hukum Mutlak' },
        { key: 'C', text: 'Kewenangan Yudikatif' },
        { key: 'D', text: 'Hak Prerogatif Pribadi' },
        { key: 'E', text: 'Instruksi Khusus Pemerintah' },
      ],
      correctKey: 'A',
      explanation: 'Pasal 18 ayat (1) UU No. 2 Tahun 2002 mengatur bahwa untuk kepentingan umum, pejabat Polri dalam melaksanakan tugas dan wewenangnya dapat bertindak menurut penilaiannya sendiri (diskresi) yang dapat dipertanggungjawabkan.',
    },
    {
      id: 15,
      module: 'Tes Pengetahuan Kepolisian (TPK) — Hukum Acara Pidana',
      stem: 'Berdasarkan Pasal 184 Kitab Undang-Undang Hukum Acara Pidana (KUHAP), yang termasuk ke dalam alat bukti yang sah dalam persidangan adalah...',
      options: [
        { key: 'A', text: 'Keterangan saksi, keterangan ahli, surat, petunjuk, dan keterangan terdakwa' },
        { key: 'B', text: 'Opini publik, hasil jajak pendapat, dan rekaman percakapan pribadi' },
        { key: 'C', text: 'Keterangan satu saksi saja tanpa didukung alat bukti lain apa pun' },
        { key: 'D', text: 'Pengakuan sepihak dari keluarga korban tindak pidana' },
        { key: 'E', text: 'Laporan desas-desus masyarakat di media sosial' },
      ],
      correctKey: 'A',
      explanation: 'Pasal 184 ayat (1) KUHAP menyebutkan 5 alat bukti yang sah: (a) keterangan saksi, (b) keterangan ahli, (c) surat, (d) petunjuk, dan (e) keterangan terdakwa.',
    },
    {
      id: 16,
      module: 'Tes Pengetahuan Kepolisian (TPK) — Doktrin & Etika Polri',
      stem: 'Pedoman hidup anggota Polri yang menjadi falsafah pengabdian insan Bhayangkara kepada nusa dan bangsa adalah...',
      options: [
        { key: 'A', text: 'Tribrata' },
        { key: 'B', text: 'Sapta Marga' },
        { key: 'C', text: 'Panca Dharma Usadha' },
        { key: 'D', text: 'Dasa Darma' },
        { key: 'E', text: 'Tri Krama Adhyaksa' },
      ],
      correctKey: 'A',
      explanation: 'Tribrata merupakan pedoman hidup Polri, sedangkan Catur Prasetya merupakan pedoman kerja kesatuan Polri.',
    },
  ];

  const DURATION_SECONDS = 900;

  let currentIndex = $state(0);
  let answers = $state<Record<number, string>>({});
  let doubts = $state<Record<number, boolean>>({});
  let finished = $state(false);
  let remaining = $state(DURATION_SECONDS);
  let timer: ReturnType<typeof setInterval> | null = null;

  const current = $derived(questions[currentIndex]);
  const answeredCount = $derived(Object.keys(answers).length);
  const formattedTime = $derived(
    `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`,
  );
  const progress = $derived(Math.round((answeredCount / questions.length) * 100));

  const score = $derived(
    Math.round(
      (questions.filter((question, index) => answers[index] === question.correctKey).length /
        questions.length) *
        100,
    ),
  );
  const passed = $derived(score >= 61);

  onMount(() => {
    timer = setInterval(() => {
      if (remaining > 0) {
        remaining -= 1;
      } else {
        finish();
      }
    }, 1000);

    return () => {
      if (timer) clearInterval(timer);
    };
  });

  onDestroy(() => {
    if (timer) clearInterval(timer);
  });

  function selectOption(key: string) {
    if (finished) return;
    answers[currentIndex] = key;
  }

  function toggleDoubt() {
    doubts[currentIndex] = !doubts[currentIndex];
  }

  function goTo(index: number) {
    if (index < 0 || index >= questions.length) return;
    currentIndex = index;
  }

  function finish() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    finished = true;
  }

  function restart() {
    answers = {};
    doubts = {};
    currentIndex = 0;
    remaining = DURATION_SECONDS;
    finished = false;
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (remaining > 0) {
        remaining -= 1;
      } else {
        finish();
      }
    }, 1000);
  }
</script>

<svelte:head>
  <title>Simulasi CAT — Web CAT POLRI</title>
</svelte:head>

<div class="sim-page">
  <header class="sim-header">
    <div class="sim-header__left">
      <button class="back-link" type="button" onclick={() => goto('/dashboard')}>
        <AdminIcon name="chevron" size={16} />
        <span>Kembali ke dashboard</span>
      </button>
      <div>
        <h1>Simulasi CAT</h1>
        <p>Latihan mandiri dengan timer dan penilaian otomatis. Tidak memengaruhi sesi ujian resmi.</p>
      </div>
    </div>

    <div class="timer-card" class:timer-card--danger={remaining <= 60 && !finished}>
      <AdminIcon name="clock" size={18} />
      <div>
        <span>Sisa waktu</span>
        <strong>{finished ? 'Selesai' : formattedTime}</strong>
      </div>
    </div>
  </header>

  {#if finished}
    <section class="result-card">
      <div class="result-copy">
        <span class="eyebrow">Hasil simulasi</span>
        <h2>{score >= 61 ? 'Ambang batas tercapai' : 'Perlu latihan lagi'}</h2>
        <p>
          Skor akhir <strong>{score}</strong> dari 100. Ambang kelulusan simulasi adalah 61.
        </p>
        <div class="result-stats">
          <div>
            <span>Benar</span>
            <strong>{questions.filter((question, index) => answers[index] === question.correctKey).length}/{questions.length}</strong>
          </div>
          <div>
            <span>Terjawab</span>
            <strong>{answeredCount}/{questions.length}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{passed ? 'Lulus (MS)' : 'Gugur (TMS)'}</strong>
          </div>
        </div>
        <div class="result-actions">
          <button class="button button--primary" type="button" onclick={restart}>Ulangi simulasi</button>
          <button class="button button--ghost" type="button" onclick={() => goto('/dashboard')}>
            Kembali ke dashboard
          </button>
        </div>
      </div>
      <div class="score-ring" class:score-ring--pass={passed}>
        <strong>{score}</strong>
        <span>dari 100</span>
      </div>
    </section>

    <section class="review-card">
      <h2>Pembahasan</h2>
      <div class="review-list">
        {#each questions as question, index (question.id)}
          {@const selected = answers[index]}
          <article class="review-item">
            <div class="review-item__head">
              <span class="review-number">{index + 1}</span>
              <div>
                <span class="review-module">{question.module}</span>
                <p>{question.stem}</p>
              </div>
              <span class="review-status" class:review-status--ok={selected === question.correctKey}>
                {selected === question.correctKey ? 'Benar' : 'Salah'}
              </span>
            </div>
            <div class="review-answer">
              <span>Jawaban Anda: <strong>{selected ?? 'Tidak dijawab'}</strong></span>
              <span>Kunci: <strong>{question.correctKey}</strong></span>
            </div>
            <p class="review-explanation">{question.explanation}</p>
          </article>
        {/each}
      </div>
    </section>
  {:else}
    <div class="progress-strip">
      <div class="progress-strip__label">
        <span>Progres jawaban</span>
        <strong>{answeredCount}/{questions.length} terjawab</strong>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style:width={`${progress}%`}></div>
      </div>
    </div>

    <div class="sim-grid">
      <section class="question-card">
        <div class="question-meta">
          <span class="question-number">Soal {currentIndex + 1} dari {questions.length}</span>
          <span class="question-module">{current.module}</span>
        </div>

        <h2 class="question-stem">{current.stem}</h2>

        <div class="options">
          {#each current.options as option (option.key)}
            <button
              class="option"
              class:option--selected={answers[currentIndex] === option.key}
              type="button"
              onclick={() => selectOption(option.key)}
            >
              <span class="option-key">{option.key}</span>
              <span>{option.text}</span>
            </button>
          {/each}
        </div>

        <div class="question-actions">
          <button
            class="button button--ghost"
            type="button"
            disabled={currentIndex === 0}
            onclick={() => goTo(currentIndex - 1)}
          >
            Sebelumnya
          </button>
          <button
            class="doubt-button"
            class:doubt-button--active={doubts[currentIndex]}
            type="button"
            onclick={toggleDoubt}
          >
            {doubts[currentIndex] ? 'Tandai ragu' : 'Ragu-ragu'}
          </button>
          {#if currentIndex === questions.length - 1}
            <button class="button button--primary" type="button" onclick={finish}>Selesai</button>
          {:else}
            <button class="button button--primary" type="button" onclick={() => goTo(currentIndex + 1)}>
              Berikutnya
            </button>
          {/if}
        </div>
      </section>

      <aside class="palette-card">
        <div class="palette-head">
          <h2>Navigasi soal</h2>
          <span>{answeredCount} terjawab</span>
        </div>
        <div class="palette-grid">
          {#each questions as question, index (question.id)}
            <button
              class="palette-button"
              class:palette-button--active={index === currentIndex}
              class:palette-button--answered={answers[index] !== undefined}
              class:palette-button--doubt={doubts[index]}
              type="button"
              onclick={() => goTo(index)}
              aria-label={`Soal ${index + 1}`}
            >
              {index + 1}
            </button>
          {/each}
        </div>
        <div class="palette-legend">
          <span><i class="dot dot--answered"></i>Terjawab</span>
          <span><i class="dot dot--doubt"></i>Ragu</span>
          <span><i class="dot dot--empty"></i>Belum</span>
        </div>
        <button class="button button--primary palette-finish" type="button" onclick={finish}>
          Akhiri simulasi
        </button>
        <p class="palette-note">Timer berjalan otomatis. Simulasi berakhir saat waktu habis.</p>
      </aside>
    </div>
  {/if}
</div>

<style>
  .sim-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    width: 100%;
    max-width: 1120px;
    min-height: calc(100vh - 6rem);
    min-height: calc(100dvh - 6rem);
  }

  .sim-header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .sim-header__left {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-width: 0;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    width: fit-content;
    padding: 0;
    border: 0;
    background: none;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
  }

  .back-link :global(svg) {
    transform: rotate(180deg);
  }

  .back-link:hover {
    color: var(--color-primary);
  }

  .sim-header h1 {
    margin: 0;
    font-size: clamp(1.4rem, 4vw, 1.9rem);
  }

  .sim-header p {
    margin: 0.35rem 0 0;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    max-width: 62ch;
  }

  .timer-card {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: 0.7rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    color: var(--color-primary);
  }

  .timer-card--danger {
    color: var(--color-danger);
    border-color: color-mix(in srgb, var(--color-danger) 35%, transparent);
  }

  .timer-card span {
    display: block;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .timer-card strong {
    font-size: 1.2rem;
    font-variant-numeric: tabular-nums;
  }

  .progress-strip {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .progress-strip__label {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .progress-strip__label strong {
    color: var(--color-text);
  }

  .progress-track {
    height: 0.5rem;
    border-radius: var(--radius-full);
    background: var(--color-surface-muted);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: inherit;
    background: var(--color-primary);
    transition: width 0.2s ease;
  }

  .sim-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-5);
    align-items: start;
  }

  .question-card,
  .palette-card,
  .result-card,
  .review-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
  }

  .question-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: clamp(1rem, 3vw, 1.75rem);
    min-height: 28rem;
    min-height: 52dvh;
  }

  .question-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .question-number {
    font-weight: 700;
    color: var(--color-primary);
  }

  .question-module {
    padding: 0.2rem 0.55rem;
    border-radius: var(--radius-full);
    background: var(--color-surface-muted);
  }

  .question-stem {
    margin: 0;
    font-size: clamp(1rem, 2.6vw, 1.2rem);
    line-height: 1.55;
    white-space: pre-line;
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    flex: 1;
  }

  .option {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    width: 100%;
    padding: clamp(0.7rem, 2vw, 0.9rem) clamp(0.75rem, 2vw, 1rem);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      background 0.15s ease;
  }

  .option:hover {
    border-color: var(--color-primary);
    background: var(--color-surface-muted);
  }

  .option--selected {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
  }

  .option-key {
    display: grid;
    place-items: center;
    flex: 0 0 1.9rem;
    width: 1.9rem;
    height: 1.9rem;
    border-radius: 50%;
    background: var(--color-surface-muted);
    font-size: var(--text-sm);
    font-weight: 700;
  }

  .option--selected .option-key {
    background: var(--color-primary);
    color: white;
  }

  .question-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding-top: var(--space-3);
    border-top: 1px solid var(--color-border);
  }

  .doubt-button {
    padding: 0.55rem 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text-muted);
    font: inherit;
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
  }

  .doubt-button--active {
    border-color: var(--color-warning);
    color: var(--color-warning);
    background: color-mix(in srgb, var(--color-warning) 10%, var(--color-surface));
  }

  .palette-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-4);
    position: sticky;
    top: 5rem;
  }

  .palette-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .palette-head h2 {
    margin: 0;
    font-size: var(--text-base);
  }

  .palette-head span {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .palette-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(2.5rem, 1fr));
    gap: var(--space-2);
  }

  .palette-button {
    aspect-ratio: 1;
    min-height: 2.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .palette-button--answered {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
  }

  .palette-button--doubt {
    border-color: var(--color-warning);
    background: color-mix(in srgb, var(--color-warning) 16%, var(--color-surface));
  }

  .palette-button--active {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .palette-legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .palette-legend span {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .dot {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    border: 1px solid var(--color-border);
  }

  .dot--answered {
    background: var(--color-primary);
    border-color: var(--color-primary);
  }

  .dot--doubt {
    background: var(--color-warning);
    border-color: var(--color-warning);
  }

  .dot--empty {
    background: var(--color-surface);
  }

  .palette-finish {
    width: 100%;
  }

  .palette-note {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    min-height: 2.65rem;
    padding: 0.6rem 1rem;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    font: inherit;
    font-size: var(--text-sm);
    font-weight: 700;
    cursor: pointer;
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button--primary {
    background: var(--color-primary);
    color: white;
  }

  .button--ghost {
    border-color: var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
  }

  .result-card {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-5);
    padding: clamp(1.1rem, 4vw, 2rem);
  }

  .result-copy {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    flex: 1 1 18rem;
  }

  .eyebrow {
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-primary);
  }

  .result-copy h2 {
    margin: 0;
    font-size: clamp(1.25rem, 3vw, 1.6rem);
  }

  .result-copy p {
    margin: 0;
    color: var(--color-text-muted);
  }

  .result-stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-5);
  }

  .result-stats span {
    display: block;
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .result-stats strong {
    font-size: 1.05rem;
  }

  .result-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .score-ring {
    display: grid;
    place-items: center;
    align-content: center;
    width: clamp(7rem, 18vw, 9rem);
    height: clamp(7rem, 18vw, 9rem);
    border: 6px solid color-mix(in srgb, var(--color-danger) 35%, transparent);
    border-radius: 50%;
    color: var(--color-danger);
  }

  .score-ring--pass {
    border-color: color-mix(in srgb, var(--color-success) 45%, transparent);
    color: var(--color-success);
  }

  .score-ring strong {
    font-size: clamp(1.8rem, 5vw, 2.4rem);
    line-height: 1;
  }

  .score-ring span {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .review-card {
    padding: clamp(1rem, 3vw, 1.5rem);
  }

  .review-card h2 {
    margin: 0 0 var(--space-4);
    font-size: var(--text-lg);
  }

  .review-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .review-item {
    padding: var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .review-item__head {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .review-item__head > div {
    flex: 1;
    min-width: 0;
  }

  .review-item__head p {
    margin: 0.25rem 0 0;
    font-size: var(--text-sm);
    white-space: pre-line;
  }

  .review-number {
    display: grid;
    place-items: center;
    flex: 0 0 1.8rem;
    width: 1.8rem;
    height: 1.8rem;
    border-radius: 50%;
    background: var(--color-surface-muted);
    font-size: var(--text-xs);
    font-weight: 700;
  }

  .review-module {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .review-status {
    flex-shrink: 0;
    padding: 0.2rem 0.55rem;
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--color-danger) 12%, var(--color-surface));
    color: var(--color-danger);
    font-size: var(--text-xs);
    font-weight: 700;
  }

  .review-status--ok {
    background: color-mix(in srgb, var(--color-success) 14%, var(--color-surface));
    color: var(--color-success);
  }

  .review-answer {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    margin-top: var(--space-3);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .review-explanation {
    margin: var(--space-2) 0 0;
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  @media (min-width: 900px) {
    .sim-grid {
      grid-template-columns: minmax(0, 1fr) 18rem;
    }
  }

  @media (max-width: 899px) {
    .palette-card {
      position: static;
    }

    .palette-grid {
      grid-template-columns: repeat(auto-fill, minmax(2.75rem, 1fr));
    }

    .question-card {
      min-height: 0;
    }
  }

  @media (max-width: 560px) {
    .sim-header {
      align-items: stretch;
    }

    .timer-card {
      justify-content: center;
    }

    .question-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .question-actions .doubt-button {
      order: 3;
      grid-column: 1 / -1;
    }

    .result-card {
      flex-direction: column-reverse;
      align-items: flex-start;
    }

    .result-actions .button {
      flex: 1;
    }
  }
</style>
