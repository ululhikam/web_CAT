<script lang="ts">
  import { onDestroy } from 'svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import AdminIcon from '$lib/components/admin/AdminIcon.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import type { SubscriptionSummary } from '@webcat/contracts';

  const SUB_CACHE_KEY = 'webcat_sub_cache';

  function readCachedSub(): SubscriptionSummary | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(SUB_CACHE_KEY);
      return raw ? (JSON.parse(raw) as SubscriptionSummary) : null;
    } catch {
      return null;
    }
  }

  const cachedSub = readCachedSub();
  let subscription = $state<SubscriptionSummary | null>(cachedSub);
  let loading = $state(!cachedSub);
  let error = $state<string | null>(null);

  $effect(() => {
    if (!session.user || !session.accessToken) return;

    let cancelled = false;

    void (async () => {
      if (!subscription) loading = true;
      error = null;
      try {
        const result = await apiRequest<SubscriptionSummary | null>('/subscriptions/me', {
          token: session.accessToken,
          cacheTtlMs: 20000,
        });
        if (!cancelled) {
          subscription = result;
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(SUB_CACHE_KEY, JSON.stringify(result));
          }
        }
      } catch (cause) {
        if (!cancelled && !subscription) error = apiErrorMessage(cause);
      } finally {
        if (!cancelled) loading = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  });

  const isActive = $derived(subscription?.status === 'ACTIVE');

  // Progress Bar items (mirroring "Products Sold" from referensdashboard.png)
  const subtestProgress = [
    { name: 'Psikologi - Kecerdasan', current: 76, total: 90, color: '#f6c23e' },
    { name: 'Psikologi - Kepribadian', current: 52, total: 60, color: '#1cc88a' },
    { name: 'TPA - Potensi Akademik', current: 85, total: 100, color: '#e74a3b' },
    { name: 'TPK - Pengetahuan Kepolisian', current: 78, total: 100, color: '#36b9cc' },
    { name: 'Kecermatan & Pass Hand', current: 10, total: 10, color: '#4e73df' },
  ];

  // Invoice / Exam Sessions Table
  const recentSessions = [
    {
      id: 'RA-5821',
      title: 'Tryout Akbar Bintara PTU #1',
      module: 'Psikologi + TPA + TPK',
      score: '78.50',
      status: 'Lulus (MS)',
      statusTone: 'success' as const,
      date: '04 Nov 2026',
      duration: '180 Menit',
      correct: '157 dari 200',
    },
    {
      id: 'RA-5820',
      title: 'Simulasi Mandiri Akpol #4',
      module: 'Tes Potensi Akademik',
      score: '84.00',
      status: 'Lulus (MS)',
      statusTone: 'success' as const,
      date: '02 Nov 2026',
      duration: '90 Menit',
      correct: '84 dari 100',
    },
    {
      id: 'RA-5819',
      title: 'Latihan Kilat Kecermatan',
      module: 'Kecermatan Kolom 1-10',
      score: '71.20',
      status: 'Lulus (MS)',
      statusTone: 'success' as const,
      date: '31 Okt 2026',
      duration: '10 Menit',
      correct: '450 dari 500',
    },
    {
      id: 'RA-5818',
      title: 'Simulasi Pengetahuan Kepolisian',
      module: 'UU No. 2/2002 & Etika',
      score: '58.00',
      status: 'Gugur (TMS)',
      statusTone: 'danger' as const,
      date: '28 Okt 2026',
      duration: '60 Menit',
      correct: '58 dari 100',
    },
    {
      id: 'RA-5817',
      title: 'Diagnostic Test Awal',
      module: 'Paket Lengkap 3 Modul',
      score: '62.40',
      status: 'Selesai',
      statusTone: 'info' as const,
      date: '25 Okt 2026',
      duration: '180 Menit',
      correct: '125 dari 200',
    },
  ];

  // Notices
  const notices = [
    {
      sender: 'Panitia Seleksi Polri',
      badge: 'Resmi',
      text: 'Ambang batas nilai kelulusan minimal Tes Psikologi ditetapkan 61.00.',
      time: '12m ago',
    },
    {
      sender: 'Sistem Keamanan Server',
      badge: 'Sesi',
      text: 'Sesi login tunggal aktif pada peramban ini. Jangan membagikan token akses.',
      time: '1h ago',
    },
    {
      sender: 'Pengawas Simulasi CAT',
      badge: 'Info',
      text: 'Timer per subtes bersifat otomatis dan langsung mengunci ketika waktu berakhir.',
      time: '3h ago',
    },
  ];

  /* ------------------------------------------------------------------ INTERACTIVE SIMULATOR */
  let simulasiModalOpen = $state(false);
  let detailModalOpen = $state(false);
  let selectedSession = $state<(typeof recentSessions)[number] | null>(null);

  // Bank Soal CAT Polri untuk Simulasi Interaktif
  const catExamQuestions = [
    {
      id: 1,
      module: 'Tes Psikologi — Penalaran Logis',
      stem: 'Semua perwira Polri wajib menjunjung tinggi etika profesi dan integritas dinas. Inspektur Polisi Dua Arya adalah seorang perwira Polri. Kesimpulan yang sah adalah...',
      options: [
        { key: 'A', text: 'Inspektur Polisi Dua Arya tidak terikat kode etik kepolisian.' },
        { key: 'B', text: 'Inspektur Polisi Dua Arya wajib menjunjung tinggi etika profesi dan integritas dinas.' },
        { key: 'C', text: 'Sebagian perwira Polri diperbolehkan mengabaikan integritas bila mendesak.' },
        { key: 'D', text: 'Inspektur Polisi Dua Arya hanya terikat aturan administrasi biasa.' },
      ],
      correctKey: 'B',
      explanation: 'Silogisme kategorik premis mayor dan minor mutlak: Semua P adalah Q; X adalah P; maka X adalah Q.',
    },
    {
      id: 2,
      module: 'Tes Potensi Akademik — Hubungan Kata (Analogi)',
      stem: 'POLISI : HUKUM = HAKIM : ...',
      options: [
        { key: 'A', text: 'Pengadilan' },
        { key: 'B', text: 'Keadilan' },
        { key: 'C', text: 'Terdakwa' },
        { key: 'D', text: 'Vonis' },
      ],
      correctKey: 'B',
      explanation: 'Polisi bertugas menegakkan hukum; Hakim bertugas menegakkan keadilan.',
    },
    {
      id: 3,
      module: 'Tes Pengetahuan Kepolisian (TPK)',
      stem: 'Berdasarkan Undang-Undang No. 2 Tahun 2002 Pasal 13, tugas pokok Kepolisian Negara Republik Indonesia adalah...',
      options: [
        { key: 'A', text: 'Memelihara keamanan dan ketertiban masyarakat, menegakkan hukum, serta memberikan perlindungan, pengayoman, dan pelayanan kepada masyarakat.' },
        { key: 'B', text: 'Menjaga pertahanan teritorial kedaulatan negara dari ancaman invasi militer asing.' },
        { key: 'C', text: 'Melakukan penuntutan perkara pidana umum di hadapan majelis persidangan pengadilan negeri.' },
        { key: 'D', text: 'Menetapkan vonis dan putusan hukum terhadap setiap pelaku pelanggaran tindak pidana.' },
      ],
      correctKey: 'A',
      explanation: 'Pasal 13 UU No. 2 Tahun 2002 tegas menyebutkan tiga tupoksi pokok Polri.',
    },
    {
      id: 4,
      module: 'Tes Psikologi — Deret Logika Numerik',
      stem: 'Tentukan angka kelanjutan dari pola deret berikut: 3, 7, 15, 31, 63, ...',
      options: [
        { key: 'A', text: '125' },
        { key: 'B', text: '127' },
        { key: 'C', text: '129' },
        { key: 'D', text: '131' },
      ],
      correctKey: 'B',
      explanation: 'Pola: (n × 2) + 1. Jadi 63 × 2 + 1 = 126 + 1 = 127.',
    },
    {
      id: 5,
      module: 'Tes Pengetahuan Kepolisian — Wewenang Polri',
      stem: 'Tindakan kepolisian yang dilakukan demi kepentingan umum berdasarkan penilaian perwira atau anggota Polri di lapangan dinamakan kewenangan...',
      options: [
        { key: 'A', text: 'Diskresi Kepolisian' },
        { key: 'B', text: 'Imunitas Hukum' },
        { key: 'C', text: 'Hak Prerogatif' },
        { key: 'D', text: 'Penyelidikan Tertutup' },
      ],
      correctKey: 'A',
      explanation: 'Pasal 18 ayat (1) UU No. 2/2002 mengatur kewenangan diskresi demi kepentingan umum.',
    },
  ];

  let currentQuestionIndex = $state(0);
  let answers = $state<Record<number, string>>({});
  let doubts = $state<Record<number, boolean>>({});
  let examFinished = $state(false);
  let timeRemaining = $state(600); // 10 menit
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  function startExam() {
    currentQuestionIndex = 0;
    answers = {};
    doubts = {};
    examFinished = false;
    timeRemaining = 600;
    simulasiModalOpen = true;

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (timeRemaining > 0) {
        timeRemaining -= 1;
      } else {
        finishExam();
      }
    }, 1000);
  }

  function finishExam() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    examFinished = true;
  }

  function closeExamModal() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    simulasiModalOpen = false;
  }

  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
  });

  const formattedTime = $derived(() => {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  const currentQ = $derived(catExamQuestions[currentQuestionIndex]);
  const answeredCount = $derived(Object.keys(answers).length);

  const examScore = $derived(() => {
    let correct = 0;
    catExamQuestions.forEach((q, idx) => {
      if (answers[idx] === q.correctKey) correct += 1;
    });
    return Math.round((correct / catExamQuestions.length) * 100);
  });

  const isPassing = $derived(examScore() >= 61);

  function openDetailModal(sess: (typeof recentSessions)[number]) {
    selectedSession = sess;
    detailModalOpen = true;
  }
</script>

<svelte:head>
  <title>Dashboard Peserta — Web CAT POLRI</title>
</svelte:head>

<div class="dashboard-page">
  <!-- PAGE HEADER & BREADCRUMB -->
  <div class="page-header">
    <div>
      <h1 class="page-title">Dashboard Peserta</h1>
      <p class="page-subtitle">Portal latihan dan evaluasi terpadu berbasis Computer Assisted Test (CAT) Polri.</p>
    </div>
    <div class="header-actions">
      <button class="btn-start-cat" type="button" onclick={startExam}>
        <AdminIcon name="shield" size={17} />
        <span>Mulai Ujian CAT</span>
      </button>
    </div>
  </div>

  {#if error}
    <Alert tone="danger" title="Gagal memuat status langganan">{error}</Alert>
  {/if}

  <!-- 4 STAT CARDS (RuangAdmin Exact 4-Column Metric Grid) -->
  <section class="stat-grid" aria-label="Ringkasan Statistik Akun">
    <!-- Card 1: STATUS LANGGANAN -->
    <div class="stat-card">
      <div class="stat-card__left">
        <span class="stat-label">STATUS LANGGANAN</span>
        <div class="stat-value">
          {#if loading}
            <Spinner size={16} />
          {:else}
            {isActive ? 'Aktif' : 'Kedaluwarsa'}
          {/if}
        </div>
        <div class="stat-trend stat-trend--up">
          <span>↑ 3.48%</span>
          <span class="trend-text">Terverifikasi sistem</span>
        </div>
      </div>
      <div class="stat-card__right stat-icon--blue">
        <AdminIcon name="calendar" size={26} />
      </div>
    </div>

    <!-- Card 2: SISA MASA AKTIF -->
    <div class="stat-card">
      <div class="stat-card__left">
        <span class="stat-label">SISA MASA AKTIF</span>
        <div class="stat-value">
          {#if loading}
            <Spinner size={16} />
          {:else}
            {isActive ? `${subscription?.remainingDays ?? 0} Hari` : '0 Hari'}
          {/if}
        </div>
        <div class="stat-trend stat-trend--up">
          <span>↑ 12%</span>
          <span class="trend-text">Akses penuh modul</span>
        </div>
      </div>
      <div class="stat-card__right stat-icon--green">
        <AdminIcon name="clock" size={26} />
      </div>
    </div>

    <!-- Card 3: TAHAPAN SIMULASI -->
    <div class="stat-card">
      <div class="stat-card__left">
        <span class="stat-label">TAHAPAN SIMULASI</span>
        <div class="stat-value">3 Modul (6 Subtes)</div>
        <div class="stat-trend stat-trend--up">
          <span>↑ 20.4%</span>
          <span class="trend-text">Standar resmi Mabes</span>
        </div>
      </div>
      <div class="stat-card__right stat-icon--cyan">
        <AdminIcon name="users" size={26} />
      </div>
    </div>

    <!-- Card 4: KEAMANAN SESI -->
    <div class="stat-card">
      <div class="stat-card__left">
        <span class="stat-label">KEAMANAN SESI</span>
        <div class="stat-value">1 Perangkat</div>
        <div class="stat-trend stat-trend--down">
          <span>🛡 Aktif</span>
          <span class="trend-text">Proteksi anti-curang</span>
        </div>
      </div>
      <div class="stat-card__right stat-icon--orange">
        <AdminIcon name="shield" size={26} />
      </div>
    </div>
  </section>

  <!-- TRYOUT FAST-LAUNCH BANNER (Interactive Section) -->
  <section class="banner-tryout" id="tryout" aria-label="Akses Cepat Tryout">
    <div class="banner-tryout__content">
      <span class="banner-tag">SIMULASI MANDIRI &amp; TRYOUT AKBAR</span>
      <h2 class="banner-title">Uji Kesiapan Seleksi Anda dengan Sistem CAT Asli</h2>
      <p class="banner-desc">
        Dilengkapi pengatur waktu terpisah per subtes, bobot penilaian resmi, serta pendeteksi ambang batas kelulusan Memenuhi Syarat (MS) minimal 61.00.
      </p>
      <div class="banner-buttons">
        <button class="btn-primary-launch" type="button" onclick={startExam}>
          <AdminIcon name="shield" size={17} />
          <span>Mulai Simulasi CAT Sekarang</span>
        </button>
        <a href="#riwayat" class="btn-secondary-launch">
          <AdminIcon name="list" size={17} />
          <span>Lihat Riwayat Nilai</span>
        </a>
      </div>
    </div>
  </section>

  <!-- MAIN SECTION ROW: 70% Monthly Recap Report (Chart) & 30% Products Sold (Progress Bars) -->
  <div class="content-row" id="latihan">
    <!-- LEFT CARD: Monthly Recap Report (Area Chart with SVG gradient) -->
    <div class="card-box card-box--chart">
      <div class="card-box__header">
        <h2 class="card-box__title">Monthly Recap Report (Skor Perkembangan)</h2>
        <span class="header-badge">Target MS: 61.00</span>
      </div>

      <div class="chart-container">
        <svg viewBox="0 0 650 280" class="chart-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#4e73df" stop-opacity="0.45" />
              <stop offset="100%" stop-color="#4e73df" stop-opacity="0.02" />
            </linearGradient>
          </defs>

          <!-- Horizontal Grid Lines -->
          <line x1="50" y1="40" x2="620" y2="40" stroke="#eaecf4" stroke-dasharray="3,3" />
          <line x1="50" y1="95" x2="620" y2="95" stroke="#eaecf4" stroke-dasharray="3,3" />
          <line x1="50" y1="150" x2="620" y2="150" stroke="#eaecf4" stroke-dasharray="3,3" />
          <line x1="50" y1="205" x2="620" y2="205" stroke="#eaecf4" stroke-dasharray="3,3" />
          <line x1="50" y1="250" x2="620" y2="250" stroke="#eaecf4" />

          <!-- Y-Axis Labels -->
          <text x="40" y="45" class="axis-label" text-anchor="end">100</text>
          <text x="40" y="100" class="axis-label" text-anchor="end">75</text>
          <text x="40" y="155" class="axis-label" text-anchor="end">50</text>
          <text x="40" y="210" class="axis-label" text-anchor="end">25</text>
          <text x="40" y="254" class="axis-label" text-anchor="end">0</text>

          <!-- Passing Grade Threshold Line at 61 (Y: 125) -->
          <line x1="50" y1="125" x2="620" y2="125" stroke="#e74a3b" stroke-dasharray="4,4" stroke-width="1.5" />
          <text x="615" y="120" class="threshold-label" text-anchor="end">Batas Lulus MS: 61.00</text>

          <!-- Chart Area Path -->
          <path
            d="M 60 240
               C 100 210, 110 180, 140 185
               C 170 190, 190 220, 220 170
               C 250 120, 280 160, 310 135
               C 340 110, 360 170, 400 150
               C 440 130, 460 70, 500 85
               C 540 100, 550 120, 580 50
               L 580 250 L 60 250 Z"
            fill="url(#areaGrad)"
          />

          <!-- Chart Line -->
          <path
            d="M 60 240
               C 100 210, 110 180, 140 185
               C 170 190, 190 220, 220 170
               C 250 120, 280 160, 310 135
               C 340 110, 360 170, 400 150
               C 440 130, 460 70, 500 85
               C 540 100, 550 120, 580 50"
            fill="none"
            stroke="#4e73df"
            stroke-width="3.5"
            stroke-linecap="round"
          />

          <!-- Dot Markers -->
          <circle cx="60" cy="240" r="4.5" fill="#4e73df" stroke="#ffffff" stroke-width="2" />
          <circle cx="140" cy="185" r="4.5" fill="#4e73df" stroke="#ffffff" stroke-width="2" />
          <circle cx="220" cy="170" r="4.5" fill="#4e73df" stroke="#ffffff" stroke-width="2" />
          <circle cx="310" cy="135" r="4.5" fill="#4e73df" stroke="#ffffff" stroke-width="2" />
          <circle cx="400" cy="150" r="4.5" fill="#4e73df" stroke="#ffffff" stroke-width="2" />
          <circle cx="500" cy="85" r="4.5" fill="#4e73df" stroke="#ffffff" stroke-width="2" />
          <circle cx="580" cy="50" r="5" fill="#4e73df" stroke="#ffffff" stroke-width="2" />

          <!-- X-Axis Labels -->
          <text x="60" y="270" class="axis-label" text-anchor="middle">Jan</text>
          <text x="170" y="270" class="axis-label" text-anchor="middle">Mar</text>
          <text x="280" y="270" class="axis-label" text-anchor="middle">Mei</text>
          <text x="400" y="270" class="axis-label" text-anchor="middle">Jul</text>
          <text x="500" y="270" class="axis-label" text-anchor="middle">Sep</text>
          <text x="580" y="270" class="axis-label" text-anchor="middle">Nov</text>
        </svg>
      </div>
    </div>

    <!-- RIGHT CARD: Products Sold / Cakupan Modul Soal -->
    <div class="card-box card-box--progress">
      <div class="card-box__header">
        <h2 class="card-box__title">Cakupan Modul</h2>
        <span class="btn-filter-pill">Standar Mabes</span>
      </div>

      <div class="progress-list">
        {#each subtestProgress as item (item.name)}
          <div class="progress-item">
            <div class="progress-item__header">
              <span class="progress-item__name">{item.name}</span>
              <span class="progress-item__count">{item.current} of {item.total} Soal</span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                style="width: {(item.current / item.total) * 100}%; background-color: {item.color};"
              ></div>
            </div>
          </div>
        {/each}
      </div>

      <div class="card-box__footer">
        <button class="link-view-more" type="button" onclick={startExam}>Uji Kemampuan Sekarang &gt;</button>
      </div>
    </div>
  </div>

  <!-- BOTTOM SECTION ROW: Invoice Table & Notices -->
  <div class="content-row" id="riwayat">
    <!-- LEFT: Invoice / Riwayat Sesi Ujian Table -->
    <div class="card-box card-box--table">
      <div class="card-box__header">
        <h2 class="card-box__title">Riwayat Sesi Ujian (Tryout History)</h2>
        <button class="btn-action-red" type="button" onclick={startExam}>Mulai Ujian Baru &gt;</button>
      </div>

      <div class="table-responsive">
        <table class="ruang-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Nama Simulasi</th>
              <th>Cakupan Modul</th>
              <th>Nilai</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {#each recentSessions as sess (sess.id)}
              <tr>
                <td class="col-id">#{sess.id}</td>
                <td class="col-name">{sess.title}</td>
                <td class="col-meta">{sess.module}</td>
                <td class="col-score"><strong>{sess.score}</strong></td>
                <td>
                  <Badge tone={sess.statusTone}>{sess.status}</Badge>
                </td>
                <td>
                  <button class="btn-table-action" type="button" onclick={() => openDetailModal(sess)}>
                    Detail
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- RIGHT: Message From Customer / Petunjuk & Pengumuman -->
    <div class="card-box card-box--notices">
      <div class="notice-header">
        <h2 class="notice-title">Pengumuman &amp; Petunjuk</h2>
      </div>

      <div class="notice-list">
        {#each notices as n (n.sender)}
          <div class="notice-item">
            <div class="notice-avatar">P</div>
            <div class="notice-content">
              <div class="notice-top">
                <span class="notice-sender">{n.sender}</span>
                <span class="notice-time">{n.time}</span>
              </div>
              <p class="notice-text">{n.text}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<!-- ================================================================== CAT EXAM SIMULATOR MODAL -->
{#if simulasiModalOpen}
  <div class="modal-backdrop" onclick={closeExamModal} role="dialog" aria-modal="true">
    <div class="modal-dialog" onclick={(e) => e.stopPropagation()} role="document">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="exam-title-wrap">
          <div class="exam-badge-cat">SIMULASI CAT POLRI</div>
          <h2 class="exam-title">{currentQ.module}</h2>
        </div>
        <div class="exam-timer-wrap">
          <div class="timer-box">
            <AdminIcon name="clock" size={17} />
            <span class="timer-digits">{formattedTime()}</span>
          </div>
          <button class="btn-close-modal" type="button" onclick={closeExamModal} aria-label="Tutup">
            <AdminIcon name="close" size={20} />
          </button>
        </div>
      </div>

      <!-- Modal Body -->
      {#if !examFinished}
        <div class="modal-body">
          <div class="exam-layout">
            <!-- Left: Question Panel -->
            <div class="question-panel">
              <div class="question-meta">
                <span class="q-number">Soal Nomor {currentQuestionIndex + 1} dari {catExamQuestions.length}</span>
                <label class="q-doubt-check">
                  <input
                    type="checkbox"
                    checked={doubts[currentQuestionIndex] ?? false}
                    onchange={(e) => {
                      doubts[currentQuestionIndex] = (e.target as HTMLInputElement).checked;
                    }}
                  />
                  <span>Tandai Ragu-Ragu</span>
                </label>
              </div>

              <div class="question-stem">
                {currentQ.stem}
              </div>

              <div class="options-list">
                {#each currentQ.options as opt (opt.key)}
                  {@const isSelected = answers[currentQuestionIndex] === opt.key}
                  <button
                    class="opt-card"
                    class:opt-card--selected={isSelected}
                    type="button"
                    onclick={() => {
                      answers[currentQuestionIndex] = opt.key;
                    }}
                  >
                    <div class="opt-key">{opt.key}</div>
                    <div class="opt-text">{opt.text}</div>
                  </button>
                {/each}
              </div>

              <!-- Question Action Buttons -->
              <div class="question-nav-buttons">
                <button
                  class="btn-nav-prev"
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onclick={() => {
                    if (currentQuestionIndex > 0) currentQuestionIndex -= 1;
                  }}
                >
                  ← Soal Sebelumnya
                </button>

                {#if currentQuestionIndex < catExamQuestions.length - 1}
                  <button
                    class="btn-nav-next"
                    type="button"
                    onclick={() => {
                      currentQuestionIndex += 1;
                    }}
                  >
                    Soal Berikutnya →
                  </button>
                {:else}
                  <button class="btn-finish-exam" type="button" onclick={finishExam}>
                    Selesai &amp; Kumpulkan Ujian
                  </button>
                {/if}
              </div>
            </div>

            <!-- Right: Palette Navigator -->
            <aside class="palette-panel">
              <div class="palette-heading">NAVIGASI SOAL</div>
              <div class="palette-grid">
                {#each catExamQuestions as _, idx (idx)}
                  {@const isAnswered = answers[idx] !== undefined}
                  {@const isDoubt = doubts[idx] === true}
                  {@const isCurrent = idx === currentQuestionIndex}
                  <button
                    class="palette-btn"
                    class:palette-btn--current={isCurrent}
                    class:palette-btn--answered={isAnswered && !isDoubt}
                    class:palette-btn--doubt={isDoubt}
                    type="button"
                    onclick={() => {
                      currentQuestionIndex = idx;
                    }}
                  >
                    {idx + 1}
                  </button>
                {/each}
              </div>

              <div class="palette-legend">
                <div class="legend-item">
                  <span class="legend-dot dot--answered"></span>
                  <span>Sudah dijawab ({answeredCount})</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot dot--doubt"></span>
                  <span>Ragu-ragu ({Object.values(doubts).filter(Boolean).length})</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot dot--empty"></span>
                  <span>Belum dijawab ({catExamQuestions.length - answeredCount})</span>
                </div>
              </div>

              <button class="btn-finish-sidebar" type="button" onclick={finishExam}>
                Selesai Ujian
              </button>
            </aside>
          </div>
        </div>
      {:else}
        <!-- SCORECARD / HASIL EVALUASI -->
        <div class="modal-body">
          <div class="result-scorecard">
            <div class="result-score-circle" class:result-score-circle--pass={isPassing}>
              <span class="score-number">{examScore()}</span>
              <span class="score-label">NILAI AKHIR</span>
            </div>

            <h3 class="result-status-title">
              {isPassing ? 'MEMENUHI SYARAT (MS)' : 'TIDAK MEMENUHI SYARAT (TMS)'}
            </h3>
            <p class="result-status-desc">
              {isPassing
                ? 'Selamat! Nilai Anda berada di atas ambang batas minimal kelulusan Polri (61.00).'
                : 'Nilai Anda belum mencapai batas minimal 61.00. Perbanyak latihan subtes yang belum dikuasai.'}
            </p>

            <div class="review-box">
              <div class="review-title">PEMBAHASAN BUTIR SOAL:</div>
              {#each catExamQuestions as q, idx (q.id)}
                {@const userAns = answers[idx]}
                {@const isRight = userAns === q.correctKey}
                <div class="review-item" class:review-item--correct={isRight} class:review-item--wrong={!isRight}>
                  <div class="review-item__header">
                    <span class="review-num">Soal #{idx + 1} • {q.module}</span>
                    <span class="review-badge">{isRight ? 'Benar (+1)' : 'Salah (0)'}</span>
                  </div>
                  <div class="review-stem">{q.stem}</div>
                  <div class="review-ans">
                    Jawaban Anda: <strong>{userAns ?? 'Tidak dijawab'}</strong> • Kunci Resmi: <strong>{q.correctKey}</strong>
                  </div>
                  <div class="review-exp">Penjelasan: {q.explanation}</div>
                </div>
              {/each}
            </div>

            <div class="result-actions">
              <button class="btn-finish-exam" type="button" onclick={startExam}>Ulangi Simulasi</button>
              <button class="btn-nav-prev" type="button" onclick={closeExamModal}>Kembali ke Dashboard</button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- ================================================================== SESSION DETAIL MODAL -->
{#if detailModalOpen && selectedSession}
  <div class="modal-backdrop" onclick={() => (detailModalOpen = false)} role="dialog" aria-modal="true">
    <div class="modal-dialog modal-dialog--sm" onclick={(e) => e.stopPropagation()} role="document">
      <div class="modal-header">
        <div class="exam-title-wrap">
          <div class="exam-badge-cat">SCORECARD RIWAYAT #{selectedSession.id}</div>
          <h2 class="exam-title">{selectedSession.title}</h2>
        </div>
        <button class="btn-close-modal" type="button" onclick={() => (detailModalOpen = false)} aria-label="Tutup">
          <AdminIcon name="close" size={20} />
        </button>
      </div>

      <div class="modal-body">
        <div class="detail-summary-card">
          <div class="detail-score-box">
            <span class="detail-score-val">{selectedSession.score}</span>
            <span class="detail-score-lbl">Skor Kumulatif</span>
          </div>
          <div class="detail-meta-list">
            <div class="meta-row">
              <span class="meta-key">Status Kelulusan:</span>
              <Badge tone={selectedSession.statusTone}>{selectedSession.status}</Badge>
            </div>
            <div class="meta-row">
              <span class="meta-key">Tanggal Pengerjaan:</span>
              <span class="meta-val">{selectedSession.date}</span>
            </div>
            <div class="meta-row">
              <span class="meta-key">Durasi Ujian:</span>
              <span class="meta-val">{selectedSession.duration}</span>
            </div>
            <div class="meta-row">
              <span class="meta-key">Jawaban Tepat:</span>
              <span class="meta-val">{selectedSession.correct}</span>
            </div>
          </div>
        </div>

        <div class="detail-recommendation">
          <div class="rec-title">Rekomendasi Pelatih:</div>
          <p class="rec-desc">
            Pertahankan akurasi pada subtes Kecerdasan dan TPA. Tingkatkan kecepatan kerja pada subtes Kecermatan kolom angka hilang untuk mengamankan perangkingan kuota daerah.
          </p>
        </div>

        <div class="detail-actions">
          <button class="btn-finish-exam" type="button" onclick={() => { detailModalOpen = false; startExam(); }}>
            Latihan Simulasi Serupa
          </button>
          <button class="btn-nav-prev" type="button" onclick={() => (detailModalOpen = false)}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .dashboard-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* PAGE HEADER */
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .page-title {
    font-size: 1.65rem;
    font-weight: 850;
    color: #2c3e50;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .page-subtitle {
    margin: 4px 0 0;
    font-size: 0.875rem;
    color: #718096;
  }

  .btn-start-cat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #4e73df;
    color: #ffffff;
    border: none;
    padding: 0.65rem 1.25rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(78, 115, 223, 0.3);
    transition: all 0.15s ease;
  }

  .btn-start-cat:hover {
    background: #2e59d9;
    transform: translateY(-1px);
  }

  /* BANNER TRYOUT */
  .banner-tryout {
    background: #ffffff;
    border: 1px solid #e3e6f0;
    border-left: 5px solid #4e73df;
    border-radius: 10px;
    padding: 1.5rem 1.75rem;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  }

  .banner-tag {
    font-size: 10.5px;
    font-weight: 850;
    color: #4e73df;
    letter-spacing: 0.06em;
  }

  .banner-title {
    font-size: 1.35rem;
    font-weight: 850;
    color: #2e384d;
    margin: 0.35rem 0 0.5rem;
    letter-spacing: -0.02em;
  }

  .banner-desc {
    color: #6c757d;
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0 0 1.25rem;
    max-width: 850px;
  }

  .banner-buttons {
    display: flex;
    gap: 0.85rem;
    flex-wrap: wrap;
  }

  .btn-primary-launch {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #4e73df;
    color: #ffffff;
    border: none;
    padding: 0.6rem 1.25rem;
    border-radius: 7px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .btn-primary-launch:hover {
    background: #2e59d9;
  }

  .btn-secondary-launch {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #f8f9fc;
    color: #4e73df;
    border: 1px solid #d1d3e2;
    padding: 0.6rem 1.25rem;
    border-radius: 7px;
    font-size: 0.85rem;
    font-weight: 700;
    text-decoration: none;
    transition: background 0.15s ease;
  }

  .btn-secondary-launch:hover {
    background: #eaecf4;
  }

  /* 4 STAT CARDS GRID */
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
  }

  @media (max-width: 1100px) {
    .stat-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 580px) {
    .stat-grid {
      grid-template-columns: 1fr;
    }
  }

  .stat-card {
    background: #ffffff;
    border: 1px solid #eaecf4;
    border-radius: 8px;
    padding: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  }

  .stat-label {
    font-size: 11px;
    font-weight: 850;
    color: #b7b9cc;
    letter-spacing: 0.05em;
  }

  .stat-value {
    font-size: 1.35rem;
    font-weight: 800;
    color: #5a5c69;
    margin: 0.25rem 0;
  }

  .stat-trend {
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .stat-trend--up { color: #1cc88a; }
  .stat-trend--down { color: #4e73df; }
  .trend-text { color: #858796; font-weight: 500; }

  .stat-card__right {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: grid;
    place-items: center;
  }

  .stat-icon--blue { background: #eaecf4; color: #4e73df; }
  .stat-icon--green { background: #e8f9f2; color: #1cc88a; }
  .stat-icon--cyan { background: #e5f7f9; color: #36b9cc; }
  .stat-icon--orange { background: #fef7e7; color: #f6c23e; }

  /* CONTENT ROW */
  .content-row {
    display: grid;
    grid-template-columns: 7fr 3fr;
    gap: 1.5rem;
  }

  @media (max-width: 992px) {
    .content-row {
      grid-template-columns: 1fr;
    }
  }

  .card-box {
    background: #ffffff;
    border: 1px solid #e3e6f0;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
  }

  .card-box__header {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #eaecf4;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-box__title {
    font-size: 0.95rem;
    font-weight: 800;
    color: #4e73df;
    margin: 0;
  }

  .header-badge {
    font-size: 11px;
    font-weight: 750;
    background: #fee2e2;
    color: #dc2626;
    padding: 3px 8px;
    border-radius: 6px;
  }

  .chart-container {
    padding: 1.25rem;
    height: 300px;
  }

  .chart-svg {
    width: 100%;
    height: 100%;
  }

  .axis-label {
    font-size: 11px;
    fill: #b7b9cc;
    font-weight: 600;
  }

  .threshold-label {
    font-size: 10px;
    fill: #e74a3b;
    font-weight: 800;
  }

  .btn-filter-pill {
    font-size: 11px;
    font-weight: 700;
    background: #eaecf4;
    color: #5a5c69;
    padding: 3px 8px;
    border-radius: 4px;
  }

  .progress-list {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
    flex: 1;
  }

  .progress-item__header {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 700;
    color: #5a5c69;
    margin-bottom: 0.35rem;
  }

  .progress-item__count {
    color: #b7b9cc;
    font-weight: 600;
  }

  .progress-track {
    height: 12px;
    background: #eaecf4;
    border-radius: 999px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 999px;
  }

  .card-box__footer {
    padding: 0.85rem 1.25rem;
    border-top: 1px solid #eaecf4;
    background: #f8f9fc;
    text-align: center;
    border-radius: 0 0 8px 8px;
  }

  .link-view-more {
    font-size: 12.5px;
    font-weight: 750;
    color: #4e73df;
    background: none;
    border: none;
    cursor: pointer;
  }

  .link-view-more:hover {
    text-decoration: underline;
  }

  .btn-action-red {
    background: #e74a3b;
    color: #ffffff;
    border: none;
    padding: 0.45rem 0.85rem;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 750;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .btn-action-red:hover {
    background: #c0392b;
  }

  .table-responsive {
    overflow-x: auto;
  }

  .ruang-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .ruang-table th {
    background: #f8f9fc;
    color: #4e73df;
    font-weight: 800;
    font-size: 11.5px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.85rem 1.25rem;
    border-bottom: 1px solid #eaecf4;
    text-align: left;
  }

  .ruang-table td {
    padding: 0.95rem 1.25rem;
    border-bottom: 1px solid #eaecf4;
    color: #5a5c69;
  }

  .col-id {
    font-weight: 750;
    color: #4e73df;
  }

  .col-name {
    font-weight: 700;
    color: #2e384d;
  }

  .col-meta {
    font-size: 12px;
    color: #858796;
  }

  .btn-table-action {
    background: #4e73df;
    color: #ffffff;
    border: none;
    padding: 0.35rem 0.75rem;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
  }

  .btn-table-action:hover {
    background: #2e59d9;
  }

  /* NOTICES */
  .notice-header {
    background: #4e73df;
    color: #ffffff;
    padding: 1rem 1.25rem;
    border-radius: 7px 7px 0 0;
  }

  .notice-title {
    font-size: 0.95rem;
    font-weight: 800;
    margin: 0;
  }

  .notice-list {
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .notice-item {
    display: flex;
    gap: 0.75rem;
    padding-bottom: 0.85rem;
    border-bottom: 1px solid #f1f3f9;
  }

  .notice-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #4e73df;
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .notice-content {
    flex: 1;
  }

  .notice-top {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-bottom: 2px;
  }

  .notice-sender {
    font-weight: 750;
    color: #2e384d;
  }

  .notice-time {
    color: #b7b9cc;
    font-size: 11px;
  }

  .notice-text {
    margin: 0;
    font-size: 12px;
    color: #6c757d;
    line-height: 1.4;
  }

  /* MODALS */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    z-index: 1000;
    display: grid;
    place-items: center;
    padding: 1rem;
    backdrop-filter: blur(3px);
  }

  .modal-dialog {
    background: #ffffff;
    width: 100%;
    max-width: 950px;
    max-height: 90vh;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-dialog--sm {
    max-width: 580px;
  }

  .modal-header {
    background: #4e73df;
    color: #ffffff;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .exam-badge-cat {
    font-size: 10.5px;
    font-weight: 850;
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 7px;
    border-radius: 4px;
    display: inline-block;
  }

  .exam-title {
    margin: 4px 0 0;
    font-size: 1.15rem;
    font-weight: 850;
  }

  .exam-timer-wrap {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .timer-box {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(0, 0, 0, 0.25);
    padding: 0.4rem 0.85rem;
    border-radius: 6px;
    font-family: monospace;
    font-size: 1.15rem;
    font-weight: 850;
  }

  .btn-close-modal {
    background: none;
    border: none;
    color: #ffffff;
    cursor: pointer;
    display: grid;
    place-items: center;
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .exam-layout {
    display: grid;
    grid-template-columns: 7fr 3fr;
    gap: 1.5rem;
  }

  @media (max-width: 768px) {
    .exam-layout {
      grid-template-columns: 1fr;
    }
  }

  .question-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .question-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #eaecf4;
  }

  .q-number {
    font-size: 0.875rem;
    font-weight: 800;
    color: #4e73df;
  }

  .q-doubt-check {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    font-weight: 700;
    color: #f6c23e;
    cursor: pointer;
  }

  .question-stem {
    font-size: 1.05rem;
    font-weight: 600;
    color: #2c3e50;
    line-height: 1.6;
    background: #f8f9fc;
    padding: 1.25rem;
    border-radius: 8px;
    border: 1px solid #eaecf4;
  }

  .options-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .opt-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.85rem 1.15rem;
    border: 1px solid #eaecf4;
    border-radius: 8px;
    background: #ffffff;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;
  }

  .opt-card:hover {
    border-color: #4e73df;
    background: #f8f9fc;
  }

  .opt-card--selected {
    border-color: #4e73df;
    background: #f0f4ff;
    box-shadow: 0 0 0 2px rgba(78, 115, 223, 0.2);
  }

  .opt-key {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #eaecf4;
    color: #4e73df;
    font-weight: 850;
    display: grid;
    place-items: center;
    font-size: 12px;
    flex-shrink: 0;
  }

  .opt-card--selected .opt-key {
    background: #4e73df;
    color: #ffffff;
  }

  .opt-text {
    font-size: 0.95rem;
    color: #2e384d;
    line-height: 1.4;
  }

  .question-nav-buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 1rem;
  }

  .btn-nav-prev {
    background: #eaecf4;
    color: #4e73df;
    border: none;
    padding: 0.6rem 1.15rem;
    border-radius: 6px;
    font-weight: 750;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .btn-nav-prev:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-nav-next {
    background: #4e73df;
    color: #ffffff;
    border: none;
    padding: 0.6rem 1.15rem;
    border-radius: 6px;
    font-weight: 750;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .btn-finish-exam {
    background: #1cc88a;
    color: #ffffff;
    border: none;
    padding: 0.6rem 1.25rem;
    border-radius: 6px;
    font-weight: 800;
    font-size: 0.85rem;
    cursor: pointer;
  }

  /* PALETTE */
  .palette-panel {
    background: #f8f9fc;
    border: 1px solid #eaecf4;
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .palette-heading {
    font-size: 11px;
    font-weight: 850;
    color: #4e73df;
    letter-spacing: 0.05em;
  }

  .palette-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.5rem;
  }

  .palette-btn {
    height: 38px;
    border: 1px solid #d1d3e2;
    background: #ffffff;
    color: #4e73df;
    font-weight: 800;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.12s ease;
  }

  .palette-btn--current {
    box-shadow: 0 0 0 2px #4e73df;
  }

  .palette-btn--answered {
    background: #1cc88a;
    color: #ffffff;
    border-color: #1cc88a;
  }

  .palette-btn--doubt {
    background: #f6c23e;
    color: #ffffff;
    border-color: #f6c23e;
  }

  .palette-legend {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    font-size: 11.5px;
    color: #5a5c69;
    padding-top: 0.5rem;
    border-top: 1px solid #eaecf4;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .dot--answered { background: #1cc88a; }
  .dot--doubt { background: #f6c23e; }
  .dot--empty { background: #ffffff; border: 1px solid #d1d3e2; }

  .btn-finish-sidebar {
    width: 100%;
    background: #e74a3b;
    color: #ffffff;
    border: none;
    padding: 0.65rem;
    border-radius: 6px;
    font-weight: 800;
    font-size: 0.85rem;
    cursor: pointer;
    margin-top: auto;
  }

  /* RESULT SCORECARD */
  .result-scorecard {
    text-align: center;
    padding: 1rem 0;
  }

  .result-score-circle {
    width: 130px;
    height: 130px;
    border-radius: 50%;
    margin: 0 auto 1.25rem;
    background: #e74a3b;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 20px rgba(231, 74, 59, 0.35);
  }

  .result-score-circle--pass {
    background: #1cc88a;
    box-shadow: 0 8px 20px rgba(28, 200, 138, 0.35);
  }

  .score-number {
    font-size: 2.5rem;
    font-weight: 900;
    line-height: 1;
  }

  .score-label {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.05em;
    opacity: 0.9;
  }

  .result-status-title {
    font-size: 1.4rem;
    font-weight: 850;
    color: #2e384d;
    margin: 0 0 0.4rem;
  }

  .result-status-desc {
    color: #718096;
    max-width: 600px;
    margin: 0 auto 1.5rem;
    font-size: 0.95rem;
  }

  .review-box {
    text-align: left;
    margin: 1.5rem 0;
    max-height: 350px;
    overflow-y: auto;
    border: 1px solid #eaecf4;
    border-radius: 8px;
    padding: 1rem;
    background: #f8f9fc;
  }

  .review-title {
    font-size: 12px;
    font-weight: 850;
    color: #4e73df;
    margin-bottom: 0.85rem;
  }

  .review-item {
    background: #ffffff;
    border-radius: 6px;
    padding: 0.85rem;
    margin-bottom: 0.85rem;
    border-left: 4px solid #d1d3e2;
  }

  .review-item--correct { border-left-color: #1cc88a; }
  .review-item--wrong { border-left-color: #e74a3b; }

  .review-item__header {
    display: flex;
    justify-content: space-between;
    font-size: 11.5px;
    font-weight: 750;
    color: #5a5c69;
    margin-bottom: 0.35rem;
  }

  .review-stem {
    font-weight: 600;
    font-size: 0.9rem;
    color: #2e384d;
    margin-bottom: 0.4rem;
  }

  .review-ans {
    font-size: 12px;
    color: #4a5568;
    margin-bottom: 0.35rem;
  }

  .review-exp {
    font-size: 12px;
    color: #2b6cb0;
    background: #ebf8ff;
    padding: 0.5rem;
    border-radius: 4px;
  }

  .result-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }

  /* DETAIL MODAL */
  .detail-summary-card {
    background: #f8f9fc;
    border: 1px solid #eaecf4;
    border-radius: 8px;
    padding: 1.25rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1.25rem;
  }

  .detail-score-box {
    background: #4e73df;
    color: #ffffff;
    padding: 1rem 1.25rem;
    border-radius: 8px;
    text-align: center;
    min-width: 110px;
  }

  .detail-score-val {
    display: block;
    font-size: 1.85rem;
    font-weight: 900;
    line-height: 1;
  }

  .detail-score-lbl {
    font-size: 9.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .detail-meta-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 12.5px;
  }

  .meta-key { color: #718096; }
  .meta-val { font-weight: 750; color: #2e384d; }

  .detail-recommendation {
    background: #ebf8ff;
    border-left: 4px solid #3182ce;
    padding: 0.85rem 1rem;
    border-radius: 0 6px 6px 0;
    margin-bottom: 1.5rem;
  }

  .rec-title {
    font-size: 12px;
    font-weight: 800;
    color: #2b6cb0;
    margin-bottom: 0.25rem;
  }

  .rec-desc {
    margin: 0;
    font-size: 12.5px;
    color: #2d3748;
    line-height: 1.5;
  }

  .detail-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }
</style>