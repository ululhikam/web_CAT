<script lang="ts">
  import Button from '@webcat/ui/components/Button.svelte';

  // State for interactive Hero CAT exam previewer
  let heroSelectedOption = $state<string | null>('B');
  let heroQuestionIndex = $state(0);

  const heroQuestions = [
    {
      subtest: 'Tes Psikologi — Penalaran Logis',
      question:
        'Semua perwira Polri wajib menjunjung tinggi etika profesi dan integritas. Inspektur Polisi Dua Arya adalah seorang perwira Polri. Kesimpulan yang paling tepat adalah...',
      options: [
        { key: 'A', text: 'Inspektur Polisi Dua Arya tidak terikat kode etik kepolisian.' },
        { key: 'B', text: 'Inspektur Polisi Dua Arya wajib menjunjung tinggi etika profesi dan integritas.' },
        { key: 'C', text: 'Sebagian perwira Polri boleh mengabaikan etika profesi.' },
        { key: 'D', text: 'Inspektur Polisi Dua Arya hanya terikat aturan administrasi biasa.' },
      ],
      correctKey: 'B',
      explanation: 'Silogisme kategorik premis mayor & minor mutlak.',
    },
    {
      subtest: 'Tes Kemampuan Komputer — Perangkat Keras',
      question:
        'Komponen komputer yang bertugas memproses seluruh instruksi program dan menjadi pusat kendali sistem disebut...',
      options: [
        { key: 'A', text: 'Central Processing Unit (CPU)' },
        { key: 'B', text: 'Monitor' },
        { key: 'C', text: 'Keyboard' },
        { key: 'D', text: 'Printer' },
      ],
      correctKey: 'A',
      explanation: 'CPU adalah unit pemroses utama yang mengeksekusi instruksi program.',
    },
  ];

  // State for Interactive Structure Tabs
  let activeTab = $state<'psi' | 'tkk' | 'tpk'>('psi');

  const tabData = {
    psi: {
      title: 'Tes Psikologi (4 Subtes Terpisah)',
      duration: 'Waktu per subtes • Total ~180 menit',
      passingGrade: '61.00 (Ambang Batas Minimal)',
      subtests: [
        { name: 'Kecerdasan Umum', count: '90 Soal', time: '45 Menit', rule: 'Timer terpisah' },
        { name: 'Kepribadian & Karakteristik', count: '60 Soal', time: '35 Menit', rule: 'Konsistensi jawaban' },
        { name: 'Tes Kecermatan (Angka/Huruf Hilang)', count: '10 Kolom', time: '10 Menit', rule: 'Ketahanan tempo' },
        { name: 'Pass Hand & Stabilitas Emosi', count: '60 Soal', time: '30 Menit', rule: 'Penentu profil klinis' },
      ],
      desc: 'Setiap subtes psikologi memiliki pengatur waktu otomatis dari server. Kehabisan waktu pada satu subtes langsung mengunci berkas dan melanjutkan ke subtes berikutnya.',
    },
    tkk: {
      title: 'Tes Kemampuan Komputer (TKK)',
      duration: '90 Menit • 100 Butir Soal',
      passingGrade: 'Sistem Ranking Komparatif',
      subtests: [
        { name: 'Perangkat Keras (Hardware)', count: '25 Soal', time: 'Terpadu', rule: 'Komponen CPU, memori, dan periferal' },
        { name: 'Perangkat Lunak & Sistem Operasi', count: '30 Soal', time: 'Terpadu', rule: 'Instalasi, konfigurasi, dan troubleshooting' },
        { name: 'Jaringan Komputer', count: '25 Soal', time: 'Terpadu', rule: 'Topologi, alamat IP, dan protokol dasar' },
        { name: 'Keamanan & Aplikasi Perkantoran', count: '20 Soal', time: 'Terpadu', rule: 'Malware, enkripsi, pengolah kata & angka' },
      ],
      desc: 'Mengukur pemahaman dasar teknologi informasi: perangkat keras, perangkat lunak, jaringan komputer, keamanan siber, serta aplikasi perkantoran yang dipakai sehari-hari.',
    },
    tpk: {
      title: 'Tes Pengetahuan Kepolisian (TPK)',
      duration: '60 Menit • 100 Butir Soal',
      passingGrade: 'Penentu Kelulusan Tahap Akhir',
      subtests: [
        { name: 'UU No. 2 Tahun 2002 Kepolisian Negara RI', count: '35 Soal', time: 'Terpadu', rule: 'Tupoksi & wewenang Polri' },
        { name: 'Etika Profesi & Hukum Acara Pidana', count: '25 Soal', time: 'Terpadu', rule: 'Perkap & tata laksana dinas' },
        { name: 'Wawasan Kebangsaan & Pancasila', count: '20 Soal', time: 'Terpadu', rule: 'UUD 1945 & NKRI' },
        { name: 'Pengetahuan Umum Kepolisian Terkini', count: '20 Soal', time: 'Terpadu', rule: 'Isu nasional & institusi' },
      ],
      desc: 'Pengujian substansi regulasi, struktur kedinasan, hukum pidana formil, dan integritas dasar kepolisian.',
    },
  };

  // State for Interactive Passing Grade Calculator
  let calcPsi = $state(72);
  let calcTkk = $state(68);
  let calcTpk = $state(75);

  const calcFinalScore = $derived(
    Number((calcPsi * 0.35 + calcTkk * 0.35 + calcTpk * 0.3).toFixed(2))
  );

  const isEliminated = $derived(
    calcPsi < 61.0 || calcTkk < 60.0 || calcTpk < 60.0
  );

  const tracks = [
    'AKADEMI KEPOLISIAN (AKPOL)',
    'BINTARA PTU & BRIMOB',
    'BINTARA KOMPETENSI KHUSUS',
    'TAMTAMA BRIMOB & POLAIR',
    'SIPSS SUMBER SARJANA',
    'SEKOLAH KEDINASAN',
  ];

  const faqs = [
    {
      q: 'Bagaimana timer ujian berjalan?',
      a: 'Waktu ujian dihitung secara server-authoritative di backend. Mengubah jam laptop, mematikan jaringan sementara, atau melakukan refresh browser tidak akan memperlambat atau menambah sisa detik ujian Anda.',
    },
    {
      q: 'Apakah benar subtes yang habis waktunya terkunci permanen?',
      a: 'Benar. Begitu waktu subtes habis, sistem secara otomatis melakukan submit otomatis (hard-lock) dan Anda tidak dapat membuka kembali lembar soal tersebut. Hal ini dirancang agar TES CAT memberikan tekanan mental yang otentik.',
    },
    {
      q: 'Dapatkah ujian dikerjakan bersamaan di laptop dan ponsel?',
      a: 'Tidak. Sistem menerapkan kebijakan 1 sesi perangkat tunggal. Jika Anda login di perangkat lain, sesi aktif di perangkat pertama langsung diputus secara otomatis.',
    },
    {
      q: 'Bagaimana cara memperoleh akses akun peserta?',
      a: 'Akun dibuat dan diverifikasi oleh Administrator penyelenggara latihan atau panitia instansi. Anda akan menerima undangan email untuk mengaktifkan kata sandi.',
    },
  ];
</script>

<svelte:head>
  <title>TES CAT — Seleksi Berstandar Resmi Polri</title>
  <meta
    name="description"
    content="Platform TES CAT (Computer Assisted Test) seleksi penerimaan Polri. Timer server mandiri, sistem gugur, dan analisis ambang batas nilai real-time."
  />
</svelte:head>

<!-- =========================================================================
     HERO SECTION
     ========================================================================= -->
<section class="hero-section">
  <div class="site-container hero-grid">
    <!-- Left Copy -->
    <div class="hero-copy">
      <div class="status-pill">
        <span class="status-pill__dot"></span>
        <span class="status-pill__text">STANDAR SELEKSI MABES POLRI</span>
      </div>

      <h1 class="hero-headline">
        Latihan Ujian CAT Polri.<br />
        Fokus Lolos Seleksi Asli.
      </h1>

      <p class="hero-lead">
        TES CAT (Computer Assisted Test) resmi untuk Akpol, Bintara, dan Tamtama. Dilengkapi
        timer server anti-curang, sistem gugur bertahap, dan kalkulasi nilai ambang batas otomatis.
      </p>

      <div class="hero-cta-group">
        <Button href="/login" size="lg">Mulai Latihan Sekarang</Button>
        <a href="#tes-cat" class="btn-text-link">Coba TES CAT Interaktif ↓</a>
      </div>

      <!-- Trust Metrics Strip -->
      <div class="hero-metrics">
        <div class="metric-unit">
          <span class="metric-number">1.090+</span>
          <span class="metric-caption">Bank Soal Terverifikasi</span>
        </div>
        <div class="metric-divider"></div>
        <div class="metric-unit">
          <span class="metric-number">6 Subtes</span>
          <span class="metric-caption">Struktur Seleksi Lengkap</span>
        </div>
        <div class="metric-divider"></div>
        <div class="metric-unit">
          <span class="metric-number">100%</span>
          <span class="metric-caption">Sistem Gugur Hard-Lock</span>
        </div>
      </div>
    </div>

    <!-- Right: Interactive Live CAT Exam Preview Widget -->
    <div class="hero-preview" id="tes-cat">
      <div class="cat-widget">
        <!-- Widget Header -->
        <div class="cat-widget__head">
          <div class="cat-widget__subtest">
            <span class="subtest-badge">UJIAN AKTIF</span>
            <span class="subtest-title">{heroQuestions[heroQuestionIndex]?.subtest}</span>
          </div>
          <div class="cat-widget__timer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>42:15</span>
          </div>
        </div>

        <!-- Question Body -->
        <div class="cat-widget__body">
          <div class="q-meta">
            <span class="q-num">SOAL NO. {heroQuestionIndex + 1} / {heroQuestions.length}</span>
            <span class="q-status">PILIH JAWABAN TEPAT</span>
          </div>
          <p class="q-text">
            {heroQuestions[heroQuestionIndex]?.question}
          </p>

          <!-- Clickable Options -->
          <div class="q-options">
            {#each heroQuestions[heroQuestionIndex]?.options ?? [] as opt (opt.key)}
              <button
                class="option-btn"
                class:option-btn--selected={heroSelectedOption === opt.key}
                type="button"
                onclick={() => (heroSelectedOption = opt.key)}
              >
                <span class="option-key">{opt.key}</span>
                <span class="option-text">{opt.text}</span>
              </button>
            {/each}
          </div>
        </div>

        <!-- Widget Footer with interactive controls -->
        <div class="cat-widget__foot">
          <div class="cat-feedback">
            {#if heroSelectedOption === heroQuestions[heroQuestionIndex]?.correctKey}
              <span class="feedback-badge feedback-badge--correct">
                ✓ Jawaban Tepat (+1.0 Poin)
              </span>
            {:else if heroSelectedOption}
              <span class="feedback-badge feedback-badge--note">
                Jawaban Tersimpan
              </span>
            {/if}
          </div>

          <div class="cat-controls">
            <button
              class="btn-widget-nav"
              type="button"
              disabled={heroQuestionIndex === 0}
              onclick={() => {
                heroQuestionIndex = Math.max(0, heroQuestionIndex - 1);
                heroSelectedOption = null;
              }}
            >
              Sebelumnya
            </button>
            <button
              class="btn-widget-nav btn-widget-nav--next"
              type="button"
              onclick={() => {
                heroQuestionIndex = (heroQuestionIndex + 1) % heroQuestions.length;
                heroSelectedOption = null;
              }}
            >
              Selanjutnya →
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- =========================================================================
     TRACKS STRIP (No gradients, crisp borders)
     ========================================================================= -->
<section class="tracks-strip" aria-label="Jalur penerimaan yang didukung">
  <div class="site-container tracks-inner">
    <span class="tracks-label">JALUR SELEKSI PENERIMAAN:</span>
    <div class="tracks-list">
      {#each tracks as tr (tr)}
        <span class="track-tag">{tr}</span>
      {/each}
    </div>
  </div>
</section>

<!-- =========================================================================
     INTERACTIVE STRUCTURE SECTION (Tabbed Navigation)
     ========================================================================= -->
<section class="section-block" id="struktur">
  <div class="site-container">
    <div class="section-title-wrap">
      <span class="section-kicker">STRUKTUR SELEKSI KEDINASAN</span>
      <h2 class="section-heading">Tiga Tahapan Pengujian Komprehensif</h2>
      <p class="section-subheading">
        Alur ujian berurutan dengan sistem gugur bertahap. Klik masing-masing tahapan untuk melihat
        rincian materi dan aturan passing grade.
      </p>
    </div>

    <!-- Tab Selector -->
    <div class="tabs-nav" role="tablist">
      <button
        class="tab-btn"
        class:tab-btn--active={activeTab === 'psi'}
        role="tab"
        aria-selected={activeTab === 'psi'}
        onclick={() => (activeTab = 'psi')}
      >
        <span class="tab-btn__num">01</span>
        <span class="tab-btn__name">Tes Psikologi</span>
      </button>

      <button
        class="tab-btn"
        class:tab-btn--active={activeTab === 'tkk'}
        role="tab"
        aria-selected={activeTab === 'tkk'}
        onclick={() => (activeTab = 'tkk')}
      >
        <span class="tab-btn__num">02</span>
        <span class="tab-btn__name">Tes Kemampuan Komputer (TKK)</span>
      </button>

      <button
        class="tab-btn"
        class:tab-btn--active={activeTab === 'tpk'}
        role="tab"
        aria-selected={activeTab === 'tpk'}
        onclick={() => (activeTab = 'tpk')}
      >
        <span class="tab-btn__num">03</span>
        <span class="tab-btn__name">Pengetahuan Kepolisian (TPK)</span>
      </button>
    </div>

    <!-- Tab Content Pane -->
    <div class="tab-pane">
      <div class="tab-pane__left">
        <h3 class="pane-title">{tabData[activeTab].title}</h3>
        <p class="pane-desc">{tabData[activeTab].desc}</p>

        <div class="pane-meta-strip">
          <div class="meta-box">
            <span class="meta-box__lbl">DURASI & WAKTU</span>
            <strong class="meta-box__val">{tabData[activeTab].duration}</strong>
          </div>
          <div class="meta-box">
            <span class="meta-box__lbl">AMBANG BATAS</span>
            <strong class="meta-box__val text-primary">{tabData[activeTab].passingGrade}</strong>
          </div>
        </div>

        <div class="pane-action">
          <Button href="/login">Mulai Modul Ini</Button>
        </div>
      </div>

      <div class="tab-pane__right">
        <span class="subtest-list-header">KOMPOSISI SUBTES & DISTRIBUSI SOAL</span>
        <div class="subtest-table">
          {#each tabData[activeTab].subtests as sub (sub.name)}
            <div class="subtest-row">
              <div class="subtest-row__title">
                <strong>{sub.name}</strong>
                <span>{sub.rule}</span>
              </div>
              <div class="subtest-row__badges">
                <span class="spec-pill">{sub.count}</span>
                <span class="spec-pill spec-pill--time">{sub.time}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</section>

<!-- =========================================================================
     INTERACTIVE PASSING GRADE CALCULATOR
     ========================================================================= -->
<section class="section-block section-block--alt" id="kalkulator">
  <div class="site-container">
    <div class="section-title-wrap">
      <span class="section-kicker">KALKULASI AMBANG BATAS (PASSING GRADE)</span>
      <h2 class="section-heading">Kalkulator Kelulusan Sistem Gugur</h2>
      <p class="section-subheading">
        Geser nilai di bawah ini untuk melihat bagaimana sistem gugur Polri mendeteksi kelulusan
        Memenuhi Syarat (MS) atau Tidak Memenuhi Syarat (TMS).
      </p>
    </div>

    <div class="calc-layout">
      <!-- Input Sliders -->
      <div class="calc-card">
        <h3 class="calc-card__title">Estimasi Perolehan Nilai</h3>

        <div class="slider-group">
          <div class="slider-header">
            <label for="psi-range" class="slider-label">1. Nilai Tes Psikologi (Bobot 35%)</label>
            <span class="slider-val" class:text-danger={calcPsi < 61.0}>{calcPsi.toFixed(1)}</span>
          </div>
          <input
            id="psi-range"
            type="range"
            min="40"
            max="100"
            step="1"
            bind:value={calcPsi}
            class="range-slider"
          />
          <span class="slider-hint">Batas kelulusan minimal: 61.00</span>
        </div>

        <div class="slider-group">
          <div class="slider-header">
            <label for="tkk-range" class="slider-label">2. Nilai Kemampuan Komputer (Bobot 35%)</label>
            <span class="slider-val" class:text-danger={calcTkk < 60.0}>{calcTkk.toFixed(1)}</span>
          </div>
          <input
            id="tkk-range"
            type="range"
            min="40"
            max="100"
            step="1"
            bind:value={calcTkk}
            class="range-slider"
          />
          <span class="slider-hint">Batas kelulusan minimal: 60.00</span>
        </div>

        <div class="slider-group">
          <div class="slider-header">
            <label for="tpk-range" class="slider-label">3. Nilai Pengetahuan Kepolisian (Bobot 30%)</label>
            <span class="slider-val" class:text-danger={calcTpk < 60.0}>{calcTpk.toFixed(1)}</span>
          </div>
          <input
            id="tpk-range"
            type="range"
            min="40"
            max="100"
            step="1"
            bind:value={calcTpk}
            class="range-slider"
          />
          <span class="slider-hint">Batas kelulusan minimal: 60.00</span>
        </div>
      </div>

      <!-- Result Card -->
      <div class="calc-result" class:calc-result--eliminated={isEliminated}>
        <span class="result-kicker">HASIL TES CAT AKHIR</span>

        <div class="result-number-wrap">
          <span class="result-number">{calcFinalScore}</span>
          <span class="result-scale">/ 100</span>
        </div>

        {#if isEliminated}
          <div class="status-banner status-banner--danger">
            <strong>TIDAK MEMENUHI SYARAT (TMS)</strong>
            <p>
              Terdapat subtes yang nilainya di bawah ambang batas minimal. Pada seleksi nyata, sesi
              langsung dihentikan.
            </p>
          </div>
        {:else}
          <div class="status-banner status-banner--success">
            <strong>MEMENUHI SYARAT (MS)</strong>
            <p>
              Seluruh subtes melampaui ambang batas minimal kelulusan. Anda berhak mengikuti tahapan
              pemeringkatan kuota.
            </p>
          </div>
        {/if}

        <div class="result-footer">
          <Button href="/login" size="lg">Uji Kemampuan Anda Sekarang</Button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- =========================================================================
     FOUR PILLARS OF INTEGRITY (No emojis, crisp SVGs)
     ========================================================================= -->
<section class="section-block">
  <div class="site-container">
    <div class="section-title-wrap">
      <span class="section-kicker">INFRASTRUKTUR SISTEM</span>
      <h2 class="section-heading">Arsitektur Tanpa Celah Manipulasi</h2>
      <p class="section-subheading">
        Setiap parameter ujian dikunci secara terpusat untuk menjaga kejujuran dan validitas
        evaluasi peserta.
      </p>
    </div>

    <div class="features-grid">
      <div class="feat-card">
        <div class="feat-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <h3 class="feat-title">Server-Authoritative Clock</h3>
        <p class="feat-desc">
          Perhitungan detik waktu ujian sepenuhnya dikelola oleh backend API. Mengubah konfigurasi jam
          pada laptop atau refresh peramban tidak dapat memanipulasi sisa waktu.
        </p>
      </div>

      <div class="feat-card">
        <div class="feat-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h3 class="feat-title">Hard-Lock Sistem Gugur</h3>
        <p class="feat-desc">
          Begitu waktu subtes habis, sistem secara otomatis mengunci seluruh pilihan jawaban. Tidak
          ada toleransi penambahan waktu di luar alokasi resmi seleksi.
        </p>
      </div>

      <div class="feat-card">
        <div class="feat-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="4" width="16" height="12" rx="2"></rect>
            <line x1="8" y1="20" x2="16" y2="20"></line>
            <line x1="12" y1="16" x2="12" y2="20"></line>
          </svg>
        </div>
        <h3 class="feat-title">Proteksi Perangkat Tunggal</h3>
        <p class="feat-desc">
          Hanya satu sesi login yang diizinkan aktif secara bersamaan. Upaya membuka tes di dua
          peramban atau membagikan token login akan memutus sesi sebelumnya.
        </p>
      </div>

      <div class="feat-card">
        <div class="feat-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        </div>
        <h3 class="feat-title">Audit Log & Rekapitulasi</h3>
        <p class="feat-desc">
          Seluruh riwayat klik, waktu submit, dan perubahan status terdata dalam audit trail untuk
          kebutuhan verifikasi pengawas dan panitia penerimaan.
        </p>
      </div>
    </div>
  </div>
</section>

<!-- =========================================================================
     FAQ ACCORDION
     ========================================================================= -->
<section class="section-block section-block--alt" id="faq">
  <div class="site-container">
    <div class="section-title-wrap">
      <span class="section-kicker">INFORMASI TEKNIS</span>
      <h2 class="section-heading">Pertanyaan yang Sering Diajukan</h2>
    </div>

    <div class="faq-accordion">
      {#each faqs as item (item.q)}
        <details class="faq-item">
          <summary class="faq-trigger">
            <span>{item.q}</span>
            <span class="faq-icon" aria-hidden="true">+</span>
          </summary>
          <div class="faq-content">
            <p>{item.a}</p>
          </div>
        </details>
      {/each}
    </div>
  </div>
</section>

<!-- =========================================================================
     BOTTOM CALL TO ACTION
     ========================================================================= -->
<section class="bottom-cta">
  <div class="site-container">
    <div class="cta-panel">
      <div class="cta-copy">
        <h2 class="cta-heading">Siap Menguji Kesiapan Seleksi Anda?</h2>
        <p class="cta-sub">
          Masuk ke akun peserta Anda untuk memulai TES CAT terintegrasi dengan timer resmi dan
          analisis ambang batas.
        </p>
      </div>
      <div class="cta-btns">
        <a href="/login" class="btn-cta-solid">Masuk ke Portal CAT</a>
        <a href="mailto:support@webcat.id" class="btn-cta-outline">Bantuan & Informasi</a>
      </div>
    </div>
  </div>
</section>

<style>
  /* =========================================================================
     BASE LAYOUT & TYPOGRAPHY
     ========================================================================= */
  .site-container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
  }

  .section-block {
    padding: 5.5rem 0;
    background: #ffffff;
  }

  .section-block--alt {
    background: #f8fafc;
    border-block: 1px solid #e2e8f0;
  }

  .section-title-wrap {
    max-width: 680px;
    margin: 0 auto 3.5rem;
    text-align: center;
  }

  .section-kicker {
    display: inline-block;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #1e3a8a;
    margin-bottom: 0.65rem;
  }

  .section-heading {
    font-size: clamp(1.85rem, 3.2vw, 2.5rem);
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.03em;
    line-height: 1.2;
    margin: 0 0 1rem;
  }

  .section-subheading {
    font-size: 1.05rem;
    color: #64748b;
    line-height: 1.6;
    margin: 0;
  }

  /* =========================================================================
     HERO SECTION
     ========================================================================= */
  .hero-section {
    padding: 4.5rem 0 5rem;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
  }

  .hero-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 3.5rem;
    align-items: center;
  }

  @media (min-width: 960px) {
    .hero-grid {
      grid-template-columns: 1.1fr 0.9fr;
    }
  }

  .hero-copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.85rem;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }

  .status-pill__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #1e3a8a;
  }

  .status-pill__text {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.06em;
    color: #1e3a8a;
  }

  .hero-headline {
    font-size: clamp(2.25rem, 4.6vw, 3.5rem);
    font-weight: 850;
    letter-spacing: -0.035em;
    color: #0f172a;
    line-height: 1.1;
    margin: 0 0 1.25rem;
  }

  .hero-lead {
    font-size: 1.1rem;
    color: #475569;
    line-height: 1.65;
    margin: 0 0 2rem;
    max-width: 520px;
  }

  .hero-cta-group {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 2.75rem;
  }

  .btn-text-link {
    font-size: 0.95rem;
    font-weight: 650;
    color: #1e3a8a;
    text-decoration: none;
    padding: 0.65rem 0.5rem;
    transition: color 0.15s ease;
  }

  .btn-text-link:hover {
    color: #0f172a;
    text-decoration: underline;
  }

  .hero-metrics {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding-top: 2rem;
    border-top: 1px solid #e2e8f0;
    width: 100%;
  }

  @media (max-width: 600px) {
    .hero-metrics {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    .metric-divider {
      display: none;
    }
  }

  .metric-unit {
    display: flex;
    flex-direction: column;
  }

  .metric-number {
    font-size: 1.5rem;
    font-weight: 850;
    color: #0f172a;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  .metric-caption {
    font-size: 11.5px;
    font-weight: 600;
    color: #64748b;
  }

  .metric-divider {
    width: 1px;
    height: 34px;
    background: #cbd5e1;
  }

  /* =========================================================================
     INTERACTIVE CAT EXAM WIDGET IN HERO
     ========================================================================= */
  .hero-preview {
    display: flex;
    justify-content: center;
  }

  .cat-widget {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
    width: 100%;
    max-width: 480px;
    overflow: hidden;
  }

  .cat-widget__head {
    background: #0f172a;
    padding: 0.85rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #ffffff;
  }

  .cat-widget__subtest {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .subtest-badge {
    background: #1e3a8a;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.05em;
    padding: 2px 6px;
    border-radius: 4px;
    color: #ffffff;
  }

  .subtest-title {
    font-size: 12px;
    font-weight: 600;
    color: #cbd5e1;
  }

  .cat-widget__timer {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-family: monospace;
    font-size: 13px;
    font-weight: 700;
    color: #38bdf8;
  }

  .cat-widget__body {
    padding: 1.5rem;
  }

  .q-meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    font-size: 11px;
    font-weight: 750;
    color: #64748b;
  }

  .q-num {
    color: #1e3a8a;
  }

  .q-text {
    font-size: 0.95rem;
    font-weight: 600;
    color: #0f172a;
    line-height: 1.55;
    margin: 0 0 1.25rem;
  }

  .q-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .option-btn {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.7rem 0.85rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;
  }

  .option-btn:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
  }

  .option-btn--selected {
    border-color: #1e3a8a;
    background: #f0f7ff;
  }

  .option-key {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 4px;
    background: #f1f5f9;
    font-size: 11px;
    font-weight: 800;
    color: #334155;
    flex-shrink: 0;
  }

  .option-btn--selected .option-key {
    background: #1e3a8a;
    color: #ffffff;
  }

  .option-text {
    font-size: 0.85rem;
    color: #1e293b;
    line-height: 1.4;
  }

  .cat-widget__foot {
    padding: 0.85rem 1.25rem;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .feedback-badge {
    font-size: 11px;
    font-weight: 750;
    padding: 3px 8px;
    border-radius: 4px;
  }

  .feedback-badge--correct {
    background: #dcfce7;
    color: #15803d;
  }

  .feedback-badge--note {
    background: #e2e8f0;
    color: #334155;
  }

  .cat-controls {
    display: flex;
    gap: 0.5rem;
  }

  .btn-widget-nav {
    padding: 0.4rem 0.75rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    font-size: 11.5px;
    font-weight: 650;
    color: #334155;
    cursor: pointer;
  }

  .btn-widget-nav:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #94a3b8;
  }

  .btn-widget-nav:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-widget-nav--next {
    background: #1e3a8a;
    color: #ffffff;
    border-color: #1e3a8a;
  }

  .btn-widget-nav--next:hover {
    background: #172554;
  }

  /* =========================================================================
     TRACKS STRIP
     ========================================================================= */
  .tracks-strip {
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 1.5rem 0;
  }

  .tracks-inner {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    flex-wrap: wrap;
  }

  .tracks-label {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #64748b;
    white-space: nowrap;
  }

  .tracks-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .track-tag {
    padding: 0.35rem 0.75rem;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 750;
    color: #1e293b;
    letter-spacing: 0.04em;
  }

  /* =========================================================================
     INTERACTIVE TABS FOR EXAM STRUCTURE
     ========================================================================= */
  .tabs-nav {
    display: flex;
    gap: 0.5rem;
    border-bottom: 1px solid #cbd5e1;
    margin-bottom: 2rem;
    overflow-x: auto;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.85rem 1.5rem;
    border: none;
    background: transparent;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    color: #64748b;
    font-size: 0.95rem;
    font-weight: 650;
    white-space: nowrap;
    transition: all 0.15s ease;
  }

  .tab-btn:hover {
    color: #0f172a;
  }

  .tab-btn--active {
    color: #1e3a8a;
    border-bottom-color: #1e3a8a;
  }

  .tab-btn__num {
    font-size: 11px;
    font-weight: 800;
    font-family: monospace;
    padding: 2px 6px;
    border-radius: 4px;
    background: #f1f5f9;
  }

  .tab-btn--active .tab-btn__num {
    background: #e0f2fe;
    color: #0369a1;
  }

  .tab-pane {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 2.5rem;
    display: grid;
    grid-template-columns: 1fr;
    gap: 3rem;
  }

  @media (min-width: 900px) {
    .tab-pane {
      grid-template-columns: 1fr 1fr;
    }
  }

  .tab-pane__left {
    display: flex;
    flex-direction: column;
  }

  .pane-title {
    font-size: 1.5rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
    margin: 0 0 0.85rem;
  }

  .pane-desc {
    font-size: 1rem;
    color: #475569;
    line-height: 1.6;
    margin: 0 0 2rem;
  }

  .pane-meta-strip {
    display: flex;
    gap: 1.5rem;
    padding: 1.25rem 0;
    border-top: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 2rem;
  }

  .meta-box {
    display: flex;
    flex-direction: column;
  }

  .meta-box__lbl {
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 0.06em;
    color: #64748b;
    margin-bottom: 0.25rem;
  }

  .meta-box__val {
    font-size: 0.95rem;
    color: #0f172a;
  }

  .text-primary {
    color: #1e3a8a;
  }

  .subtest-list-header {
    display: block;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #64748b;
    margin-bottom: 1rem;
  }

  .subtest-table {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .subtest-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.95rem 1.15rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }

  .subtest-row__title {
    display: flex;
    flex-direction: column;
  }

  .subtest-row__title strong {
    font-size: 0.92rem;
    color: #0f172a;
  }

  .subtest-row__title span {
    font-size: 11.5px;
    color: #64748b;
  }

  .subtest-row__badges {
    display: flex;
    gap: 0.4rem;
  }

  .spec-pill {
    font-size: 11px;
    font-weight: 750;
    padding: 2px 7px;
    border-radius: 4px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #334155;
  }

  .spec-pill--time {
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #1e3a8a;
  }

  /* =========================================================================
     INTERACTIVE CALCULATOR
     ========================================================================= */
  .calc-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  @media (min-width: 900px) {
    .calc-layout {
      grid-template-columns: 1.1fr 0.9fr;
    }
  }

  .calc-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 2.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  .calc-card__title {
    font-size: 1.25rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
  }

  .slider-group {
    display: flex;
    flex-direction: column;
  }

  .slider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .slider-label {
    font-size: 0.9rem;
    font-weight: 700;
    color: #334155;
  }

  .slider-val {
    font-size: 1.15rem;
    font-weight: 850;
    color: #0f172a;
    font-family: monospace;
  }

  .text-danger {
    color: #b91c1c;
  }

  .range-slider {
    width: 100%;
    accent-color: #1e3a8a;
    cursor: pointer;
  }

  .slider-hint {
    font-size: 11.5px;
    color: #64748b;
    margin-top: 0.35rem;
  }

  .calc-result {
    background: #ffffff;
    border: 2px solid #16a34a;
    border-radius: 12px;
    padding: 2.25rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .calc-result--eliminated {
    border-color: #dc2626;
  }

  .result-kicker {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #64748b;
  }

  .result-number-wrap {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin: 1rem 0;
  }

  .result-number {
    font-size: 3.5rem;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: -0.04em;
    line-height: 1;
  }

  .result-scale {
    font-size: 1.25rem;
    font-weight: 700;
    color: #64748b;
  }

  .status-banner {
    padding: 1.15rem;
    border-radius: 8px;
    margin-bottom: 2rem;
  }

  .status-banner strong {
    display: block;
    font-size: 1rem;
    margin-bottom: 0.35rem;
  }

  .status-banner p {
    font-size: 0.88rem;
    margin: 0;
    line-height: 1.5;
  }

  .status-banner--success {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
  }

  .status-banner--danger {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
  }

  .result-footer {
    display: flex;
  }

  /* =========================================================================
     FOUR PILLARS OF INTEGRITY
     ========================================================================= */
  .features-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 640px) {
    .features-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .features-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .feat-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 1.75rem;
    display: flex;
    flex-direction: column;
  }

  .feat-icon {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    background: #f1f5f9;
    color: #1e3a8a;
    display: grid;
    place-items: center;
    margin-bottom: 1.25rem;
  }

  .feat-title {
    font-size: 1.05rem;
    font-weight: 750;
    color: #0f172a;
    margin: 0 0 0.65rem;
  }

  .feat-desc {
    font-size: 0.88rem;
    color: #64748b;
    line-height: 1.6;
    margin: 0;
  }

  /* =========================================================================
     FAQ ACCORDION
     ========================================================================= */
  .faq-accordion {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .faq-item {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
  }

  .faq-item[open] {
    border-color: #cbd5e1;
  }

  .faq-trigger {
    padding: 1.25rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1rem;
    font-weight: 750;
    color: #0f172a;
    cursor: pointer;
    list-style: none;
  }

  .faq-trigger::-webkit-details-marker {
    display: none;
  }

  .faq-icon {
    font-size: 1.25rem;
    color: #1e3a8a;
    font-weight: 600;
    transition: transform 0.15s ease;
  }

  .faq-item[open] .faq-icon {
    transform: rotate(45deg);
  }

  .faq-content {
    padding: 0 1.5rem 1.25rem;
    font-size: 0.92rem;
    color: #475569;
    line-height: 1.6;
  }

  .faq-content p {
    margin: 0;
  }

  /* =========================================================================
     BOTTOM CTA
     ========================================================================= */
  .bottom-cta {
    padding: 5rem 0;
    background: #ffffff;
  }

  .cta-panel {
    background: #0f172a;
    border-radius: 16px;
    padding: 4rem 3.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 2rem;
  }

  .cta-copy {
    max-width: 580px;
  }

  .cta-heading {
    font-size: clamp(1.85rem, 3.2vw, 2.5rem);
    font-weight: 850;
    color: #ffffff;
    letter-spacing: -0.03em;
    margin: 0 0 0.85rem;
    line-height: 1.2;
  }

  .cta-sub {
    font-size: 1.05rem;
    color: #94a3b8;
    margin: 0;
    line-height: 1.6;
  }

  .cta-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 0.85rem;
  }

  .btn-cta-solid {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.85rem 1.75rem;
    border-radius: 6px;
    background: #ffffff;
    color: #0f172a;
    font-size: 0.95rem;
    font-weight: 750;
    text-decoration: none;
    transition: all 0.15s ease;
  }

  .btn-cta-solid:hover {
    background: #f1f5f9;
    text-decoration: none;
  }

  .btn-cta-outline {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.85rem 1.75rem;
    border-radius: 6px;
    border: 1px solid #475569;
    color: #ffffff;
    font-size: 0.95rem;
    font-weight: 650;
    text-decoration: none;
    transition: all 0.15s ease;
  }

  .btn-cta-outline:hover {
    background: #1e293b;
    border-color: #64748b;
    text-decoration: none;
  }
</style>
