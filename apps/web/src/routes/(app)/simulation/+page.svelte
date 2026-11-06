<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import AdminIcon from '$lib/components/admin/AdminIcon.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import { examPreferences } from '$lib/stores/examPreferences.svelte';
  import {
    SIMULATION_PACKETS,
    type SimPacket,
    type SimQuestion,
    type SimBenchmarkItem,
  } from './simulation-packets';
  import {
    evaluatePsikotesExam,
    getOptionWeight,
    getWeightGradeLabel,
    type PsikotesEvaluationResult,
  } from './psikotes-scoring';

  let selectedCategoryId = $state<'PSIKOTES' | 'TKK' | 'TPK' | 'ALL'>('PSIKOTES');
  let selectedSubtestId = $state<'ALL' | 'KECERDASAN' | 'KEPRIBADIAN' | 'KECERMATAN'>('ALL');
  let isStarted = $state(false);

  const currentPacket = $derived.by<SimPacket>(() => {
    if (selectedCategoryId === 'PSIKOTES') {
      return (
        SIMULATION_PACKETS.find(
          (p) => p.category === 'PSIKOTES' && p.subtest === selectedSubtestId,
        ) ?? SIMULATION_PACKETS[0]
      );
    }
    return (
      SIMULATION_PACKETS.find((p) => p.category === selectedCategoryId) ??
      SIMULATION_PACKETS[0]
    );
  });

  const questions = $derived(currentPacket.questions);

  let currentIndex = $state(0);
  let answers = $state<Record<number, string>>({});
  let doubts = $state<Record<number, boolean>>({});
  let finished = $state(false);
  let remaining = $state(600);
  let columnRemaining = $state(60);
  let timer: ReturnType<typeof setInterval> | null = null;
  let columnTimer: ReturnType<typeof setInterval> | null = null;
  let advanceTimer: ReturnType<typeof setTimeout> | null = null;

  const current = $derived(questions[currentIndex] ?? questions[0]);
  const isKecermatan = $derived(Boolean(current?.isKecermatan));
  const isKecermatanOnly = $derived(Boolean(currentPacket?.isKecermatanOnly));

  // Indeks Kolom aktif (1-indexed for display, 0-indexed for logic)
  const activeColumnNumber = $derived(current?.columnNumber ?? 1);
  const activeColumnIndex = $derived(activeColumnNumber - 1);

  // Soal-soal dalam kolom aktif (untuk paket khusus kecermatan)
  const currentColumnQuestions = $derived(
    isKecermatanOnly
      ? questions.filter((q) => q.columnNumber === activeColumnNumber)
      : [],
  );
  const currentColumnStartIndex = $derived(
    isKecermatanOnly
      ? questions.findIndex((q) => q.columnNumber === activeColumnNumber)
      : 0,
  );
  const indexInColumn = $derived(
    isKecermatanOnly ? currentIndex - currentColumnStartIndex : currentIndex,
  );

  const currentBenchmark = $derived<SimBenchmarkItem[]>(
    current?.benchmark ?? [
      { char: 'A', label: 'A' },
      { char: 'B', label: 'B' },
      { char: 'C', label: 'C' },
      { char: 'D', label: 'D' },
      { char: 'E', label: 'E' },
    ],
  );

  const currentQuestionChars = $derived<string[]>(
    current?.questionChars ?? ['?', '?', '?', '?'],
  );

  const answeredCount = $derived(Object.keys(answers).length);
  const formattedTime = $derived(
    `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`,
  );
  const formattedColumnTime = $derived(
    `00:00:${String(Math.max(0, columnRemaining)).padStart(2, '0')}`,
  );

  const progress = $derived(
    questions.length ? Math.round((answeredCount / questions.length) * 100) : 0,
  );

  const correctCount = $derived(
    questions.filter((question, index) => answers[index] === question.correctKey).length,
  );

  const psikotesResult = $derived<PsikotesEvaluationResult>(
    evaluatePsikotesExam(currentPacket, questions, answers),
  );

  const score = $derived(
    psikotesResult.isPsikotes
      ? psikotesResult.finalScore
      : (questions.length ? Math.round((correctCount / questions.length) * 100) : 0),
  );
  const passed = $derived(
    psikotesResult.isPsikotes ? psikotesResult.passed : score >= 61,
  );

  // Daftar seluruh nomor kolom pada paket kecermatan
  const totalColumns = $derived.by(() => {
    if (!isKecermatanOnly) return 1;
    const colSet = new Set(questions.map((q) => q.columnNumber ?? 1));
    return colSet.size;
  });

  function startGlobalTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (remaining > 0) {
        remaining -= 1;
      } else {
        finish();
      }
    }, 1000);
  }

  function startColumnTimer() {
    if (columnTimer) clearInterval(columnTimer);
    columnRemaining = currentPacket.columnDurationSeconds ?? 60;
    columnTimer = setInterval(() => {
      if (columnRemaining > 0) {
        columnRemaining -= 1;
      } else {
        // Waktu 60 detik kolom habis: otomatis pindah ke kolom berikutnya
        advanceColumn();
      }
    }, 1000);
  }

  function advanceColumn() {
    if (activeColumnNumber < totalColumns) {
      // Pindah ke kolom berikutnya
      const nextColNumber = activeColumnNumber + 1;
      const nextColIdx = questions.findIndex((q) => q.columnNumber === nextColNumber);
      if (nextColIdx !== -1) {
        currentIndex = nextColIdx;
        startColumnTimer();
      }
    } else {
      // Kolom terakhir selesai
      finish();
    }
  }

  function startSimulation() {
    answers = {};
    doubts = {};
    currentIndex = 0;
    remaining = currentPacket.durationSeconds;
    finished = false;
    isStarted = true;

    if (currentPacket.isKecermatanOnly) {
      startColumnTimer();
    } else {
      startGlobalTimer();
    }
  }

  function selectOption(key: string) {
    if (finished) return;
    answers[currentIndex] = key;

    // Di Kecermatan: selalu auto-next seketika karena merupakan tes kecepatan per kolom
    if (isKecermatan || examPreferences.mode === 'auto') {
      if (advanceTimer) clearTimeout(advanceTimer);
      const delayMs = isKecermatan ? 120 : 230;

      advanceTimer = setTimeout(() => {
        advanceTimer = null;
        if (isKecermatanOnly) {
          // Cek apakah soal ini adalah soal terakhir di kolom aktif
          const nextIdx = currentIndex + 1;
          const nextQuestion = questions[nextIdx];
          if (nextQuestion && nextQuestion.columnNumber === activeColumnNumber) {
            currentIndex = nextIdx;
          } else {
            // Soal di kolom ini telah selesai: langsung lanjut ke kolom selanjutnya dan reset waktu kolom
            advanceColumn();
          }
        } else {
          if (currentIndex < questions.length - 1) {
            currentIndex += 1;
          }
        }
      }, delayMs);
    }
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
    if (columnTimer) {
      clearInterval(columnTimer);
      columnTimer = null;
    }
    if (advanceTimer) {
      clearTimeout(advanceTimer);
      advanceTimer = null;
    }
    finished = true;
  }

  function restart() {
    startSimulation();
  }

  function exitToSelection() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (columnTimer) {
      clearInterval(columnTimer);
      columnTimer = null;
    }
    if (advanceTimer) {
      clearTimeout(advanceTimer);
      advanceTimer = null;
    }
    finished = false;
    isStarted = false;
    answers = {};
    doubts = {};
    currentIndex = 0;
  }

  // KEYBOARD SHORTCUT: A B C D E atau 1 2 3 4 5
  function handleKeydown(event: KeyboardEvent) {
    if (!isStarted || finished) return;

    // Jangan tangkap jika fokus di input / textarea
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return;
    }

    const key = event.key.toUpperCase();
    if (['A', 'B', 'C', 'D', 'E'].includes(key)) {
      event.preventDefault();
      selectOption(key);
      return;
    }

    // Number keys 1-5 mapping to A-E
    const num = Number(event.key);
    if (num >= 1 && num <= 5) {
      event.preventDefault();
      const mapped = ['A', 'B', 'C', 'D', 'E'][num - 1];
      if (mapped) selectOption(mapped);
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });

  onDestroy(() => {
    if (timer) clearInterval(timer);
    if (columnTimer) clearInterval(columnTimer);
    if (advanceTimer) clearTimeout(advanceTimer);
  });
</script>

<svelte:head>
  <title>Simulasi CAT — Seleksi Sekolah Inspektur Polisi</title>
</svelte:head>

<div class="sim-page">
  {#if !isStarted}
    <!-- LAYAR PILIH TES & SUBTES SIMULASI -->
    <header class="sim-header">
      <div class="sim-header__left">
        <button class="back-link" type="button" onclick={() => goto('/dashboard')}>
          <AdminIcon name="chevron" size={16} />
          <span>Kembali ke dashboard</span>
        </button>
        <div>
          <h1>Simulasi CAT Bebas Latihan</h1>
          <p>
            Pilih jenis tes dan subtes yang ingin Anda uji coba. Latihan mandiri tanpa mengurangi limit tes harian, lengkap dengan timer resmi dan pembahasan jawaban.
          </p>
        </div>
      </div>
    </header>

    <div class="selection-container">
      <!-- 1. KATEGORI UTAMA TES -->
      <section class="selection-section">
        <div class="section-title-wrap">
          <span class="step-badge">1</span>
          <div>
            <h2 class="section-title">Pilih Materi Tes CAT</h2>
            <p class="section-subtitle">Pilih modul ujian yang ingin Anda latih saat ini</p>
          </div>
        </div>

        <div class="category-grid">
          <!-- Opsi 1: PSIKOTES -->
          <button
            type="button"
            class="category-card"
            class:category-card--active={selectedCategoryId === 'PSIKOTES'}
            onclick={() => {
              selectedCategoryId = 'PSIKOTES';
            }}
          >
            <div class="category-card__icon">
              <AdminIcon name="questions" size={24} />
            </div>
            <div class="category-card__body">
              <div class="category-card__tag">3 Subtes Tersedia</div>
              <h3 class="category-card__name">Tes Psikologi (Psikotes)</h3>
              <p class="category-card__desc">
                Kecerdasan (verbal, numerik, denah), Mental Kepribadian (integritas &amp; emosi), serta Kecermatan kolom hilang format CAT.
              </p>
            </div>
            <span class="category-radio" class:category-radio--active={selectedCategoryId === 'PSIKOTES'}></span>
          </button>

          <!-- Opsi 2: TKK -->
          <button
            type="button"
            class="category-card"
            class:category-card--active={selectedCategoryId === 'TKK'}
            onclick={() => {
              selectedCategoryId = 'TKK';
            }}
          >
            <div class="category-card__icon">
              <AdminIcon name="devices" size={24} />
            </div>
            <div class="category-card__body">
              <div class="category-card__tag">10 Butir Soal</div>
              <h3 class="category-card__name">Tes Kemampuan Komputer (TKK)</h3>
              <p class="category-card__desc">
                Hardware, jaringan komputer, keamanan siber/phishing, 2FA, data kedinasan, dan etika digital UU ITE.
              </p>
            </div>
            <span class="category-radio" class:category-radio--active={selectedCategoryId === 'TKK'}></span>
          </button>

          <!-- Opsi 3: TPK -->
          <button
            type="button"
            class="category-card"
            class:category-card--active={selectedCategoryId === 'TPK'}
            onclick={() => {
              selectedCategoryId = 'TPK';
            }}
          >
            <div class="category-card__icon">
              <AdminIcon name="shield" size={24} />
            </div>
            <div class="category-card__body">
              <div class="category-card__tag">10 Butir Soal</div>
              <h3 class="category-card__name">Tes Pengetahuan Kepolisian (TPK)</h3>
              <p class="category-card__desc">
                UU No. 2/2002, diskresi kepolisian, KUHAP Pasal 184 alat bukti, falsafah Tribrata, serta Perpol kode etik.
              </p>
            </div>
            <span class="category-radio" class:category-radio--active={selectedCategoryId === 'TPK'}></span>
          </button>

          <!-- Opsi 4: ALL (LENGKAP) -->
          <button
            type="button"
            class="category-card"
            class:category-card--active={selectedCategoryId === 'ALL'}
            onclick={() => {
              selectedCategoryId = 'ALL';
            }}
          >
            <div class="category-card__icon">
              <AdminIcon name="sparkles" size={24} />
            </div>
            <div class="category-card__body">
              <div class="category-card__tag">16 Butir Campuran</div>
              <h3 class="category-card__name">Simulasi Lengkap CAT SIP</h3>
              <p class="category-card__desc">
                Paket komprehensif gabungan seluruh modul (Psikotes, TKK, dan TPK) untuk mengukur kesiapan menyeluruh.
              </p>
            </div>
            <span class="category-radio" class:category-radio--active={selectedCategoryId === 'ALL'}></span>
          </button>
        </div>
      </section>

      <!-- 2. SUBTES (HANYA MUNCUL JIKA MEMILIH PSIKOTES) -->
      {#if selectedCategoryId === 'PSIKOTES'}
        <section class="selection-section">
          <div class="section-title-wrap">
            <span class="step-badge">2</span>
            <div>
              <h2 class="section-title">Pilih Subtes Psikologi</h2>
              <p class="section-subtitle">Pilih subtes spesifik atau latih seluruh subtes psikotes sekaligus</p>
            </div>
          </div>

          <div class="subtest-grid">
            <button
              type="button"
              class="subtest-chip"
              class:subtest-chip--active={selectedSubtestId === 'ALL'}
              onclick={() => (selectedSubtestId = 'ALL')}
            >
              <div class="subtest-chip__icon">✦</div>
              <div>
                <strong>Semua Subtes Psikotes</strong>
                <span>Campuran 12 butir (Kecerdasan + Kepribadian + Kecermatan)</span>
              </div>
            </button>

            <button
              type="button"
              class="subtest-chip"
              class:subtest-chip--active={selectedSubtestId === 'KECERDASAN'}
              onclick={() => (selectedSubtestId = 'KECERDASAN')}
            >
              <div class="subtest-chip__icon">🧠</div>
              <div>
                <strong>Kecerdasan</strong>
                <span>10 butir (Analogi, deret, silogisme &amp; denah lokasi)</span>
              </div>
            </button>

            <button
              type="button"
              class="subtest-chip"
              class:subtest-chip--active={selectedSubtestId === 'KEPRIBADIAN'}
              onclick={() => (selectedSubtestId = 'KEPRIBADIAN')}
            >
              <div class="subtest-chip__icon">⚖️</div>
              <div>
                <strong>Mental Kepribadian</strong>
                <span>10 butir (Integritas, emosi, loyalitas &amp; disiplin)</span>
              </div>
            </button>

            <button
              type="button"
              class="subtest-chip"
              class:subtest-chip--active={selectedSubtestId === 'KECERMATAN'}
              onclick={() => (selectedSubtestId = 'KECERMATAN')}
            >
              <div class="subtest-chip__icon">🎯</div>
              <div>
                <strong>Kecermatan (Format CAT)</strong>
                <span>3 Kolom • 30 butir (Tabel patokan acuan, tombol A-E, 60s/kolom)</span>
              </div>
            </button>
          </div>
        </section>
      {/if}

      <!-- 3. DETAIL PAKET & PENGATURAN MODE PENGERJAAN -->
      <section class="overview-box">
        <div class="overview-left">
          <div class="overview-eyebrow">Paket Simulasi Terpilih</div>
          <h3 class="overview-title">{currentPacket.title}</h3>
          <p class="overview-sub">{currentPacket.subtitle}</p>
          <p class="overview-desc">{currentPacket.description}</p>

          <div class="overview-metrics">
            <div class="metric-item">
              <span class="metric-label">Jumlah Soal</span>
              <strong class="metric-val">{currentPacket.questions.length} Butir</strong>
            </div>
            <div class="metric-item">
              <span class="metric-label">Alokasi Waktu</span>
              <strong class="metric-val">{Math.round(currentPacket.durationSeconds / 60)} Menit</strong>
            </div>
            <div class="metric-item">
              <span class="metric-label">Ambang Kelulusan</span>
              <strong class="metric-val text-brand">61.00 (MS)</strong>
            </div>
          </div>
        </div>

        <div class="overview-right">
          <div class="mode-control-card">
            <div class="mode-control-head">
              <span>Pengaturan Pengerjaan</span>
              <a href="/profile" class="mode-setting-link" title="Buka pengaturan profil">Ubah di Profil ↗</a>
            </div>
            <div class="mode-current">
              <div class="mode-badge" class:mode-badge--auto={examPreferences.mode === 'auto'}>
                {#if examPreferences.mode === 'auto'}
                  ⚡ Otomatis Lanjut (Auto Next)
                {:else}
                  ✋ Manual (Klik Berikutnya)
                {/if}
              </div>
              <p class="mode-hint">
                {#if examPreferences.mode === 'auto'}
                  Pindah ke butir berikutnya otomatis saat memilih opsi.
                {:else}
                  Nomor soal tetap diam setelah memilih sampai Anda klik tombol Berikutnya.
                {/if}
              </p>
            </div>
            <!-- Quick toggle -->
            <button
              type="button"
              class="quick-toggle-btn"
              onclick={() =>
                examPreferences.setMode(
                  examPreferences.mode === 'auto' ? 'manual' : 'auto',
                )}
            >
              Ganti ke mode {examPreferences.mode === 'auto' ? 'Manual' : 'Auto Next'}
            </button>
          </div>

          <button class="button button--primary button--lg start-btn" type="button" onclick={startSimulation}>
            <span>Mulai Simulasi Sekarang</span>
            <AdminIcon name="arrow-right" size={18} />
          </button>
        </div>
      </section>
    </div>
  {:else}
    <!-- SIMULASI SEDANG BERJALAN ATAU SELESAI -->
    <header class="sim-header">
      <div class="sim-header__left">
        <button class="back-link" type="button" onclick={exitToSelection}>
          <AdminIcon name="chevron" size={16} />
          <span>Ganti Materi Simulasi</span>
        </button>
        <div>
          <h1>{currentPacket.title}</h1>
          <p>{currentPacket.subtitle}</p>
        </div>
      </div>

      <div class="header-right-tools">
        <!-- Pill mode pengerjaan aktif -->
        <button
          type="button"
          class="mode-pill"
          title="Klik untuk beralih mode pengerjaan"
          onclick={() =>
            examPreferences.setMode(
              examPreferences.mode === 'auto' ? 'manual' : 'auto',
            )}
        >
          <span class="mode-pill__dot" class:mode-pill__dot--auto={examPreferences.mode === 'auto'}></span>
          <span>{examPreferences.mode === 'auto' ? 'Auto Next' : 'Manual Next'}</span>
        </button>

        <!-- Timer Card -->
        <div class="timer-card" class:timer-card--danger={(isKecermatanOnly ? columnRemaining : remaining) <= 15 && !finished}>
          <AdminIcon name="clock" size={18} />
          <div>
            <span>{isKecermatanOnly ? `Waktu Kolom ${activeColumnNumber}` : 'Sisa waktu'}</span>
            <strong>{finished ? 'Selesai' : (isKecermatanOnly ? `${columnRemaining}s` : formattedTime)}</strong>
          </div>
        </div>
      </div>
    </header>

    {#if finished}
      <!-- HASIL SIMULASI -->
      <section class="result-card">
        <div class="result-copy">
          <span class="eyebrow">
            {psikotesResult.isPsikotes
              ? 'Hasil Penilaian Khusus Psikotes (Standar CAT Polri)'
              : 'Hasil Simulasi CAT'}
          </span>
          <h2>{score >= 61 ? 'Memenuhi Syarat (MS)' : 'Perlu Pendalaman (TMS)'}</h2>
          <p>
            Skor akhir Anda <strong>{score}</strong> dari 100. Ambang batas kelulusan seleksi adalah <strong>61.00</strong>.
          </p>
          {#if psikotesResult.isPsikotes}
            <p class="psikotes-summary-note">{psikotesResult.summaryExplanation}</p>
          {/if}

          <!-- Metrik Hasil Terstruktur -->
          <div class="result-stats">
            {#if psikotesResult.kepribadian && !psikotesResult.isMixed}
              <div>
                <span>Rata-Rata Bobot</span>
                <strong class="text-primary">{psikotesResult.kepribadian.averageWeight} / 5.00</strong>
              </div>
              <div>
                <span>Total Poin Bobot</span>
                <strong class="text-success">{psikotesResult.kepribadian.totalScoreEarned} / {psikotesResult.kepribadian.maxPossibleScore}</strong>
              </div>
              <div>
                <span>Terjawab</span>
                <strong>{psikotesResult.kepribadian.attempted}/{questions.length}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong class={passed ? 'text-success' : 'text-danger'}>
                  {passed ? 'MS (Lulus)' : 'TMS (Gugur)'}
                </strong>
              </div>
            {:else if psikotesResult.kecermatan && !psikotesResult.isMixed}
              <div>
                <span>Kecepatan (40%)</span>
                <strong>{psikotesResult.kecermatan.speedScore}%</strong>
              </div>
              <div>
                <span>Ketelitian (40%)</span>
                <strong class="text-success">{psikotesResult.kecermatan.accuracyScore}%</strong>
              </div>
              <div>
                <span>Kestabilan (20%)</span>
                <strong class="text-primary">{psikotesResult.kecermatan.stabilityScore}%</strong>
              </div>
              <div>
                <span>Status</span>
                <strong class={passed ? 'text-success' : 'text-danger'}>
                  {passed ? 'MS (Lulus)' : 'TMS (Gugur)'}
                </strong>
              </div>
            {:else}
              <div>
                <span>Benar</span>
                <strong class="text-success">{correctCount}/{questions.length}</strong>
              </div>
              <div>
                <span>Salah / Kosong</span>
                <strong class="text-danger">{questions.length - correctCount}/{questions.length}</strong>
              </div>
              <div>
                <span>Terjawab</span>
                <strong>{answeredCount}/{questions.length}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong class={passed ? 'text-success' : 'text-danger'}>
                  {passed ? 'MS (Lulus)' : 'TMS (Gugur)'}
                </strong>
              </div>
            {/if}
          </div>

          <div class="result-actions">
            <button class="button button--primary" type="button" onclick={restart}>Ulangi Simulasi Ini</button>
            <button class="button button--ghost" type="button" onclick={exitToSelection}>Pilih Materi Lain</button>
            <button class="button button--ghost" type="button" onclick={() => goto('/dashboard')}>
              Ke Dashboard
            </button>
          </div>
        </div>

        <div class="score-ring" class:score-ring--pass={passed}>
          <strong>{score}</strong>
          <span>dari 100</span>
        </div>
      </section>

      {#if psikotesResult.isPsikotes && psikotesResult.isMixed}
        <!-- PANEL RINCIAN 3 SUBTES PSIKOTES (CAMPURAN) -->
        <section class="psikotes-subtests-panel">
          <div class="psikotes-subtests-panel__head">
            <h3>Rincian Pembobotan 3 Subtes Psikotes</h3>
            <p>Penggabungan nilai Kecerdasan (40%), Mental Kepribadian (30%), dan Kecermatan (30%).</p>
          </div>
          <div class="psikotes-subtests-grid">
            {#if psikotesResult.kecerdasan}
              <div class="subtest-score-card">
                <div class="subtest-score-card__top">
                  <span class="subtest-badge">Kecerdasan (Bobot 40%)</span>
                  <strong class="subtest-score-val" class:text-success={psikotesResult.kecerdasan.passed} class:text-danger={!psikotesResult.kecerdasan.passed}>
                    {psikotesResult.kecerdasan.score}
                  </strong>
                </div>
                <div class="subtest-score-card__body">
                  <div class="subtest-metric">
                    <span>Ketepatan / Akurasi:</span>
                    <strong>{psikotesResult.kecerdasan.accuracy}%</strong>
                  </div>
                  <div class="subtest-metric">
                    <span>Benar / Total:</span>
                    <strong>{psikotesResult.kecerdasan.correct} dari {psikotesResult.kecerdasan.totalQuestions} butir</strong>
                  </div>
                  <div class="subtest-metric">
                    <span>Status Subtes:</span>
                    <strong class={psikotesResult.kecerdasan.passed ? 'text-success' : 'text-danger'}>
                      {psikotesResult.kecerdasan.passed ? 'Memenuhi Syarat' : 'Perlu Pendalaman'}
                    </strong>
                  </div>
                </div>
              </div>
            {/if}

            {#if psikotesResult.kepribadian}
              <div class="subtest-score-card">
                <div class="subtest-score-card__top">
                  <span class="subtest-badge">Kepribadian (Bobot 30%)</span>
                  <strong class="subtest-score-val" class:text-success={psikotesResult.kepribadian.passed} class:text-danger={!psikotesResult.kepribadian.passed}>
                    {psikotesResult.kepribadian.score}
                  </strong>
                </div>
                <div class="subtest-score-card__body">
                  <div class="subtest-metric">
                    <span>Rata-rata Bobot Jawaban:</span>
                    <strong>{psikotesResult.kepribadian.averageWeight} / 5.00</strong>
                  </div>
                  <div class="subtest-metric">
                    <span>Total Poin Terkumpul:</span>
                    <strong>{psikotesResult.kepribadian.totalScoreEarned} dari {psikotesResult.kepribadian.maxPossibleScore}</strong>
                  </div>
                  <div class="subtest-metric">
                    <span>Profil Sikap:</span>
                    <strong class="text-primary">{psikotesResult.kepribadian.interpretation}</strong>
                  </div>
                </div>
              </div>
            {/if}

            {#if psikotesResult.kecermatan}
              <div class="subtest-score-card">
                <div class="subtest-score-card__top">
                  <span class="subtest-badge">Kecermatan (Bobot 30%)</span>
                  <strong class="subtest-score-val" class:text-success={psikotesResult.kecermatan.passed} class:text-danger={!psikotesResult.kecermatan.passed}>
                    {psikotesResult.kecermatan.score}
                  </strong>
                </div>
                <div class="subtest-score-card__body">
                  <div class="subtest-metric">
                    <span>Kecepatan (40%):</span>
                    <strong>{psikotesResult.kecermatan.speedScore}%</strong>
                  </div>
                  <div class="subtest-metric">
                    <span>Ketelitian (40%):</span>
                    <strong>{psikotesResult.kecermatan.accuracyScore}%</strong>
                  </div>
                  <div class="subtest-metric">
                    <span>Kestabilan (20%):</span>
                    <strong>{psikotesResult.kecermatan.stabilityScore}%</strong>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </section>
      {/if}

      {#if psikotesResult.kepribadian && !psikotesResult.isMixed}
        <!-- PANEL DISTRIBUSI BOBOT JAWABAN KEPRIBADIAN -->
        <section class="psikotes-detail-card">
          <div class="psikotes-detail-card__header">
            <h3>Distribusi Bobot Nilai Jawaban Peserta</h3>
            <p>Setiap pilihan jawaban Anda dinilai dengan bobot 1 (sangat kurang) hingga 5 (sangat ideal).</p>
          </div>
          <div class="kepribadian-weights-grid">
            <div class="weight-stat-item weight-stat-item--5">
              <span class="weight-stat-tag">Bobot 5 (Sangat Baik)</span>
              <strong>{psikotesResult.kepribadian.distribution.sangatBaik} butir</strong>
            </div>
            <div class="weight-stat-item weight-stat-item--4">
              <span class="weight-stat-tag">Bobot 4 (Baik)</span>
              <strong>{psikotesResult.kepribadian.distribution.baik} butir</strong>
            </div>
            <div class="weight-stat-item weight-stat-item--3">
              <span class="weight-stat-tag">Bobot 3 (Cukup / Netral)</span>
              <strong>{psikotesResult.kepribadian.distribution.cukup} butir</strong>
            </div>
            <div class="weight-stat-item weight-stat-item--2">
              <span class="weight-stat-tag">Bobot 2 (Kurang Tepat)</span>
              <strong>{psikotesResult.kepribadian.distribution.kurang} butir</strong>
            </div>
            <div class="weight-stat-item weight-stat-item--1">
              <span class="weight-stat-tag">Bobot 1 (Tidak Tepat)</span>
              <strong>{psikotesResult.kepribadian.distribution.sangatKurang} butir</strong>
            </div>
          </div>
        </section>
      {/if}

      {#if psikotesResult.kecermatan && !psikotesResult.isMixed}
        <!-- PANEL TABEL STATISTIK KOLOM KECERMATAN -->
        <section class="psikotes-detail-card">
          <div class="psikotes-detail-card__header">
            <h3>Analisis Performa Kerja per Kolom</h3>
            <p>Evaluasi konsistensi kecepatan, akurasi, dan ketahanan ritme kerja di setiap kolom.</p>
          </div>
          <div class="kecermatan-table-wrap">
            <table class="kecermatan-stats-table">
              <thead>
                <tr>
                  <th>Kolom</th>
                  <th>Target Soal</th>
                  <th>Terjawab</th>
                  <th>Benar</th>
                  <th>Salah</th>
                  <th>Ketelitian</th>
                </tr>
              </thead>
              <tbody>
                {#each psikotesResult.kecermatan.columns as col}
                  <tr>
                    <td><strong>Kolom {col.columnNumber}</strong></td>
                    <td>{col.total} butir</td>
                    <td>{col.attempted}</td>
                    <td class="text-success">{col.correct}</td>
                    <td class="text-danger">{col.wrong}</td>
                    <td><strong>{col.accuracy}%</strong></td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </section>
      {/if}

      <!-- PEMBAHASAN LENGKAP -->
      <section class="review-card">
        <div class="review-card__header">
          <h2>Kunci Jawaban &amp; Pembahasan Soal</h2>
          <p class="muted">Pelajari rasionalisasi setiap butir soal untuk meningkatkan pemahaman pada tes sebenarnya.</p>
        </div>
        <div class="review-list">
          {#each questions as question, index (question.id)}
            {@const selected = answers[index]}
            {@const isKepribadian = question.subtest === 'KEPRIBADIAN' || Boolean(question.optionWeights)}
            {@const selectedWeight = getOptionWeight(question, selected)}
            {@const gradeInfo = getWeightGradeLabel(selectedWeight)}
            <article class="review-item" class:review-item--correct={isKepribadian ? selectedWeight >= 4 : selected === question.correctKey}>
              <div class="review-item__head">
                <span class="review-number">{index + 1}</span>
                <div>
                  <span class="review-module">{question.module}</span>
                  {#if question.isKecermatan}
                    <!-- Review Kecermatan dengan Patokan & Kotak Soal -->
                    <div class="review-kecermatan-preview">
                      <div class="review-benchmark-strip">
                        <span class="review-bench-label">Patokan:</span>
                        <div class="review-bench-chars">
                          {#each question.benchmark ?? [] as b}
                            <span><strong>{b.char}</strong>({b.label})</span>
                          {/each}
                        </div>
                      </div>
                      <div class="review-question-strip">
                        <span class="review-bench-label">Kotak Soal:</span>
                        <div class="review-qchars">
                          {#each question.questionChars ?? [] as c}
                            <span class="qchar-cell">{c}</span>
                          {/each}
                        </div>
                      </div>
                    </div>
                  {:else}
                    <p class="review-stem">{question.stem}</p>
                  {/if}
                </div>
                {#if isKepribadian}
                  <span class="review-status review-status--weight" class:review-status--ok={selectedWeight >= 4} class:review-status--mid={selectedWeight === 3} class:review-status--low={selectedWeight < 3}>
                    {gradeInfo.label}
                  </span>
                {:else}
                  <span class="review-status" class:review-status--ok={selected === question.correctKey}>
                    {selected === question.correctKey ? 'Benar' : 'Salah'}
                  </span>
                {/if}
              </div>

              {#if isKepribadian}
                <div class="review-answer">
                  <span>
                    Jawaban Anda:
                    <strong class:text-success={selectedWeight >= 4} class:text-warning={selectedWeight === 3} class:text-danger={selectedWeight < 3}>
                      {selected ?? 'Kosong'} (Bobot: {selectedWeight}/5 poin)
                    </strong>
                  </span>
                  <span>
                    Pilihan Ideal:
                    <strong class="text-success">{question.correctKey} (Bobot 5/5 poin)</strong>
                  </span>
                </div>

                <!-- Peta Bobot Semua Pilihan Jawaban -->
                <div class="review-weights-map">
                  <span class="review-weights-map__title">Bobot Seluruh Pilihan Jawaban:</span>
                  <div class="review-weights-pills">
                    {#each question.options as opt}
                      {@const w = getOptionWeight(question, opt.key)}
                      <span
                        class="weight-pill"
                        class:weight-pill--selected={selected === opt.key}
                        class:weight-pill--best={w === 5}
                      >
                        <strong>{opt.key}</strong>: Bobot {w}
                        {#if selected === opt.key}
                          <small>(Dipilih)</small>
                        {/if}
                      </span>
                    {/each}
                  </div>
                </div>
              {:else}
                <div class="review-answer">
                  <span>Jawaban Anda: <strong class:text-danger={selected !== question.correctKey}>{selected ?? 'Kosong'}</strong></span>
                  <span>Kunci Resmi: <strong class="text-success">{question.correctKey}</strong></span>
                </div>
              {/if}

              <div class="review-explanation-box">
                <strong>Pembahasan:</strong>
                <p>{question.explanation}</p>
              </div>
            </article>
          {/each}
        </div>
      </section>
    {:else}
      <!-- PROGRESS BAR -->
      <div class="progress-strip">
        <div class="progress-strip__label">
          <span>Progres pengerjaan ({currentPacket.title})</span>
          <strong>{answeredCount}/{questions.length} terjawab</strong>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style:width={`${progress}%`}></div>
        </div>
      </div>

      <div class="sim-grid" class:sim-grid--kecermatan={isKecermatanOnly}>
        <!-- KARTU SOAL AKTIF -->
        <section class="question-card" class:question-card--kecermatan={isKecermatan}>
          {#if isKecermatan}
            <!-- ============================================================= -->
            <!-- TAMPILAN FORMAT ASLI KECERMATAN CAT POLRI                     -->
            <!-- ============================================================= -->
            <div class="kecermatan-flow">
              <!-- TIMER BESAR DI ATAS SESUAI CONTOH CAT -->
              <div class="kecermatan-timer-badge">
                <span class="kecermatan-timer-badge__label">Durasi:</span>
                <span class="kecermatan-timer-badge__value mono">
                  {formattedColumnTime}
                </span>
              </div>

              <!-- TABEL ACUAN / SAMPEL PATOKAN KOLOM -->
              <div class="kecermatan-sample-box">
                <div class="kecermatan-sample-header">
                  Kolom {activeColumnNumber}
                </div>
                <div class="kecermatan-sample-grid">
                  <!-- Baris 1: 5 Huruf/Karakter Patokan -->
                  <div class="kecermatan-sample-row kecermatan-sample-row--chars">
                    {#each currentBenchmark as item}
                      <div class="kecermatan-sample-cell kecermatan-sample-cell--char">
                        {item.char}
                      </div>
                    {/each}
                  </div>
                  <!-- Baris 2: Label Pilihan A B C D E -->
                  <div class="kecermatan-sample-row kecermatan-sample-row--labels">
                    {#each currentBenchmark as item}
                      <div class="kecermatan-sample-cell kecermatan-sample-cell--label">
                        {item.label}
                      </div>
                    {/each}
                  </div>
                </div>
              </div>

              <!-- KOTAK SOAL AKTIF (4 HURUF DARI SAMPEL) -->
              <div class="kecermatan-question-card">
                <div class="kecermatan-question-grid">
                  {#each currentQuestionChars as char}
                    <div class="kecermatan-question-cell">
                      {char}
                    </div>
                  {/each}
                </div>
              </div>

              <!-- PILIHAN JAWABAN (TOMBOL BESAR A B C D E) -->
              <div class="kecermatan-choices-row" role="group" aria-label="Pilih huruf yang hilang">
                {#each ['A', 'B', 'C', 'D', 'E'] as label}
                  <button
                    type="button"
                    class="kecermatan-choice-key"
                    class:kecermatan-choice-key--active={answers[currentIndex] === label}
                    onclick={() => selectOption(label)}
                  >
                    <span>{label}</span>
                  </button>
                {/each}
              </div>

              <!-- HINT TOMBOL KEYBOARD -->
              <p class="kecermatan-keyboard-hint">
                💡 Anda juga dapat menekan tombol <strong>A, B, C, D, E</strong> atau <strong>1, 2, 3, 4, 5</strong> pada keyboard untuk menjawab secara instan.
              </p>
            </div>
          {:else}
            <!-- ============================================================= -->
            <!-- TAMPILAN SOAL STANDAR (PILIHAN GANDA BIASA)                   -->
            <!-- ============================================================= -->
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
                <button class="button button--primary" type="button" onclick={finish}>Selesai Ujian</button>
              {:else}
                <button class="button button--primary" type="button" onclick={() => goTo(currentIndex + 1)}>
                  Berikutnya
                </button>
              {/if}
            </div>
          {/if}
        </section>

        <!-- PALET NAVIGASI / SIDEBAR KOLOM KECERMATAN -->
        <aside class="palette-card">
          {#if isKecermatanOnly}
            <!-- SIDEBAR PROGRES KOLOM KECERMATAN (SAMA SEPERTI CAT EXAM) -->
            <header class="palette-head">
              <div>
                <h2>Progres Kolom Kecermatan</h2>
                <span class="palette-sub">{totalColumns} Kolom • 60 Detik per Kolom</span>
              </div>
            </header>

            <div class="kecermatan-column-list">
              {#each Array.from({ length: totalColumns }, (_, cIdx) => cIdx + 1) as colNum}
                {@const isCurrentCol = colNum === activeColumnNumber}
                {@const isPastCol = colNum < activeColumnNumber}
                {@const colQs = questions.filter((q) => q.columnNumber === colNum)}
                {@const colAnswered = colQs.filter((_, idx) => {
                  const absoluteIdx = questions.findIndex((q) => q.columnNumber === colNum) + idx;
                  return answers[absoluteIdx] !== undefined;
                }).length}

                <div
                  class="kecermatan-col-item"
                  class:kecermatan-col-item--active={isCurrentCol}
                  class:kecermatan-col-item--done={isPastCol}
                >
                  <div class="kecermatan-col-item__info">
                    <span class="kecermatan-col-item__name">Kolom {colNum}</span>
                    <span class="kecermatan-col-item__count">{colAnswered} / {colQs.length} terjawab</span>
                  </div>
                  {#if isCurrentCol}
                    <Badge tone="brand">Sedang Ujian ({columnRemaining}s)</Badge>
                  {:else if isPastCol}
                    <Badge tone="success">Selesai</Badge>
                  {:else}
                    <Badge tone="neutral">Menunggu</Badge>
                  {/if}
                </div>
              {/each}
            </div>

            <!-- Kisi nomor soal dalam kolom aktif -->
            <div class="col-active-progress">
              <div class="col-active-label">
                <span>Soal dalam Kolom {activeColumnNumber}</span>
                <strong>{indexInColumn + 1} / {currentColumnQuestions.length}</strong>
              </div>
              <div class="palette-grid palette-grid--small">
                {#each currentColumnQuestions as _, qInColIdx}
                  {@const absoluteQIdx = currentColumnStartIndex + qInColIdx}
                  <button
                    class="palette-button"
                    class:palette-button--active={absoluteQIdx === currentIndex}
                    class:palette-button--answered={answers[absoluteQIdx] !== undefined}
                    type="button"
                    onclick={() => goTo(absoluteQIdx)}
                    aria-label={`Soal ${qInColIdx + 1}`}
                  >
                    {qInColIdx + 1}
                  </button>
                {/each}
              </div>
            </div>

            <button class="button button--primary palette-finish" type="button" onclick={finish}>
              Selesai Ujian
            </button>
            <p class="palette-note">⚡ Waktu per kolom tereset otomatis saat berganti kolom.</p>
          {:else}
            <!-- SIDEBAR NAVIGASI SOAL STANDAR -->
            <div class="palette-head">
              <h2>Navigasi Soal</h2>
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
              Akhiri Simulasi
            </button>
            <p class="palette-note">Mode: {examPreferences.mode === 'auto' ? 'Auto Next' : 'Manual'}. Timer berjalan otomatis.</p>
          {/if}
        </aside>
      </div>
    {/if}
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
    max-width: 65ch;
  }

  .header-right-tools {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .mode-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.5rem 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    font-size: var(--text-xs);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .mode-pill:hover {
    border-color: var(--color-primary);
  }

  .mode-pill__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #94a3b8;
  }

  .mode-pill__dot--auto {
    background: #10b981;
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

  /* ------------------- SELECTION VIEW STYLES ------------------- */
  .selection-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .selection-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .section-title-wrap {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .step-badge {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--color-primary);
    color: #fff;
    font-size: var(--text-sm);
    font-weight: 700;
    flex-shrink: 0;
  }

  .section-title {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 700;
  }

  .section-subtitle {
    margin: 0.15rem 0 0;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--space-4);
  }

  .category-card {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    cursor: pointer;
    text-align: left;
    font: inherit;
    position: relative;
    transition: all 0.2s ease;
  }

  .category-card:hover {
    border-color: var(--color-primary-soft, #93c5fd);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .category-card--active {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface));
    box-shadow: 0 0 0 1px var(--color-primary);
  }

  .category-card__icon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
    color: var(--color-primary);
    flex-shrink: 0;
  }

  .category-card__body {
    flex: 1;
    min-width: 0;
  }

  .category-card__tag {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }

  .category-card__name {
    margin: 0 0 0.35rem;
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text);
  }

  .category-card__desc {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    line-height: 1.45;
  }

  .category-radio {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid var(--color-border);
    flex-shrink: 0;
    margin-top: 0.25rem;
  }

  .category-radio--active {
    border-color: var(--color-primary);
    background: var(--color-primary);
    box-shadow: inset 0 0 0 3px #fff;
  }

  /* Subtest selector chips */
  .subtest-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: var(--space-3);
  }

  .subtest-chip {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    cursor: pointer;
    text-align: left;
    font: inherit;
    transition: all 0.15s ease;
  }

  .subtest-chip:hover {
    border-color: var(--color-primary);
  }

  .subtest-chip--active {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
  }

  .subtest-chip__icon {
    font-size: 1.35rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .subtest-chip strong {
    display: block;
    font-size: var(--text-sm);
    color: var(--color-text);
  }

  .subtest-chip span {
    display: block;
    font-size: 0.72rem;
    color: var(--color-text-muted);
  }

  /* Overview & Control Box */
  .overview-box {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-5);
    padding: clamp(1.2rem, 3vw, 1.8rem);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
  }

  @media (min-width: 860px) {
    .overview-box {
      grid-template-columns: 1.4fr 1fr;
      align-items: center;
    }
  }

  .overview-eyebrow {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-primary);
  }

  .overview-title {
    margin: 0.3rem 0 0.2rem;
    font-size: clamp(1.2rem, 2.5vw, 1.5rem);
    font-weight: 700;
  }

  .overview-sub {
    margin: 0 0 0.6rem;
    font-size: var(--text-sm);
    color: var(--color-primary);
    font-weight: 600;
  }

  .overview-desc {
    margin: 0 0 var(--space-4);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    line-height: 1.5;
  }

  .overview-metrics {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
  }

  .metric-item {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .metric-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .metric-val {
    font-size: 1.15rem;
    font-weight: 700;
  }

  .text-brand {
    color: var(--color-primary);
  }

  .text-success {
    color: #10b981;
  }

  .text-danger {
    color: #ef4444;
  }

  .overview-right {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .mode-control-card {
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface-muted, #f8fafc);
  }

  .mode-control-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    margin-bottom: 0.4rem;
  }

  .mode-setting-link {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 600;
  }

  .mode-setting-link:hover {
    text-decoration: underline;
  }

  .mode-badge {
    display: inline-block;
    padding: 0.25rem 0.6rem;
    border-radius: var(--radius-sm);
    background: #e2e8f0;
    color: #334155;
    font-size: var(--text-xs);
    font-weight: 700;
    margin-bottom: 0.35rem;
  }

  .mode-badge--auto {
    background: #dcfce7;
    color: #15803d;
  }

  .mode-hint {
    margin: 0 0 0.5rem;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    line-height: 1.4;
  }

  .quick-toggle-btn {
    padding: 0.35rem 0.65rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    font-size: 0.72rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .quick-toggle-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .start-btn {
    width: 100%;
    padding: 0.85rem 1.4rem;
    font-size: 1rem;
    border-radius: var(--radius-md);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  }

  /* ------------------- RUNNING SIMULATION STYLES ------------------- */
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

  .question-card--kecermatan {
    background: #0f172a;
    border-color: #1e3a8a;
    color: #ffffff;
    padding: clamp(1.2rem, 3vw, 2rem);
  }

  /* ============================================================== */
  /* KECERMATAN ASLI FORMAT CAT POLRI                               */
  /* ============================================================== */
  .kecermatan-flow {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
  }

  .kecermatan-timer-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    font-size: clamp(1.7rem, 4.5vw, 2.3rem);
    font-weight: 800;
    color: #60a5fa;
    text-align: center;
    letter-spacing: 0.05em;
  }

  .kecermatan-timer-badge__label {
    font-size: clamp(1rem, 2.5vw, 1.2rem);
    color: #94a3b8;
    font-weight: 600;
  }

  .mono {
    font-family: var(--font-mono, monospace);
    font-variant-numeric: tabular-nums;
  }

  /* Kotak Sampel Patokan Kolom */
  .kecermatan-sample-box {
    width: 100%;
    background: #0b1329;
    color: #ffffff;
    border: 3px solid #3b82f6;
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.45);
  }

  .kecermatan-sample-header {
    background: #1e3a8a;
    color: #ffffff;
    font-size: clamp(1.2rem, 2.8vw, 1.45rem);
    font-weight: 800;
    text-align: center;
    padding: var(--space-2) var(--space-4);
    letter-spacing: 0.05em;
    border-bottom: 2px solid #3b82f6;
  }

  .kecermatan-sample-grid {
    display: flex;
    flex-direction: column;
  }

  .kecermatan-sample-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
  }

  .kecermatan-sample-row--chars {
    border-bottom: 2px solid #334155;
    background: rgba(15, 23, 42, 0.95);
  }

  .kecermatan-sample-row--labels {
    background: #1e293b;
  }

  .kecermatan-sample-cell {
    display: grid;
    place-items: center;
    padding: var(--space-3) var(--space-1);
    font-family: var(--font-mono, monospace);
    border-right: 2px solid #334155;
  }

  .kecermatan-sample-cell:last-child {
    border-right: none;
  }

  .kecermatan-sample-cell--char {
    font-size: clamp(2rem, 5.5vw, 2.8rem);
    font-weight: 900;
    color: #ffffff;
    line-height: 1;
  }

  .kecermatan-sample-cell--label {
    font-size: clamp(1.2rem, 3.2vw, 1.55rem);
    font-weight: 800;
    color: #93c5fd;
    line-height: 1;
  }

  /* Kotak Soal Aktif (4 Karakter) */
  .kecermatan-question-card {
    width: 100%;
    background: #0b1329;
    border: 3px solid #3b82f6;
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.35);
  }

  .kecermatan-question-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }

  .kecermatan-question-cell {
    display: grid;
    place-items: center;
    padding: var(--space-4) var(--space-2);
    font-family: var(--font-mono, monospace);
    font-size: clamp(2.2rem, 6vw, 3rem);
    font-weight: 900;
    color: #ffffff;
    border-right: 2px solid #334155;
    line-height: 1;
  }

  .kecermatan-question-cell:last-child {
    border-right: none;
  }

  /* Tombol Pilihan Jawaban A B C D E */
  .kecermatan-choices-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--space-2);
    width: 100%;
  }

  .kecermatan-choice-key {
    display: grid;
    place-items: center;
    height: clamp(56px, 10vw, 76px);
    background: #1e293b;
    color: #ffffff;
    border: 2px solid #3b82f6;
    border-radius: var(--radius-md);
    font-family: var(--font-mono, monospace);
    font-size: clamp(1.5rem, 4vw, 2.2rem);
    font-weight: 900;
    cursor: pointer;
    transition: all 0.12s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }

  .kecermatan-choice-key:hover {
    background: #2563eb;
    color: #ffffff;
    transform: translateY(-2px);
    border-color: #60a5fa;
  }

  .kecermatan-choice-key:active,
  .kecermatan-choice-key--active {
    background: #1d4ed8;
    color: #ffffff;
    transform: translateY(1px);
    border-color: #93c5fd;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
  }

  .kecermatan-keyboard-hint {
    margin: var(--space-1) 0 0;
    font-size: 0.76rem;
    color: #94a3b8;
    text-align: center;
    line-height: 1.4;
  }

  .kecermatan-keyboard-hint strong {
    color: #60a5fa;
  }

  /* Sidebar Kolom Kecermatan */
  .kecermatan-column-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }

  .kecermatan-col-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-3);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    transition: all 0.15s ease;
  }

  .kecermatan-col-item--active {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  }

  .kecermatan-col-item--done {
    opacity: 0.75;
    background: var(--color-surface-muted);
  }

  .kecermatan-col-item__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .kecermatan-col-item__name {
    font-weight: 700;
    font-size: var(--text-sm);
  }

  .kecermatan-col-item__count {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .col-active-progress {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-3);
    background: var(--color-surface-muted, #f8fafc);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    margin-bottom: var(--space-4);
  }

  .col-active-label {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .col-active-label strong {
    color: var(--color-text);
  }

  .palette-grid--small {
    grid-template-columns: repeat(5, 1fr);
  }

  /* Review Kecermatan */
  .review-kecermatan-preview {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0.4rem 0;
  }

  .review-benchmark-strip,
  .review-question-strip {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
  }

  .review-bench-label {
    color: var(--color-text-muted);
    font-weight: 600;
    width: 70px;
    flex-shrink: 0;
  }

  .review-bench-chars {
    display: flex;
    gap: var(--space-2);
    font-family: var(--font-mono, monospace);
  }

  .review-bench-chars span {
    padding: 2px 6px;
    background: var(--color-surface-muted);
    border-radius: 4px;
    border: 1px solid var(--color-border);
  }

  .review-qchars {
    display: flex;
    gap: 4px;
    font-family: var(--font-mono, monospace);
  }

  .qchar-cell {
    padding: 3px 8px;
    background: #1e293b;
    color: #fff;
    font-weight: 800;
    border-radius: 4px;
  }

  /* Standard Question Styles */
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

  .palette-head span,
  .palette-sub {
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
    transition: all 0.15s ease;
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button--primary {
    background: var(--color-primary);
    color: white;
  }

  .button--primary:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-primary) 90%, black);
  }

  .button--ghost {
    border-color: var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
  }

  .button--ghost:hover:not(:disabled) {
    background: var(--color-surface-muted);
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

  .review-card__header {
    margin-bottom: var(--space-4);
  }

  .review-card__header h2 {
    margin: 0;
    font-size: var(--text-lg);
  }

  .review-card__header p {
    margin: 0.25rem 0 0;
    font-size: var(--text-sm);
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
    background: var(--color-surface);
  }

  .review-item--correct {
    border-left: 4px solid #10b981;
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

  .review-stem {
    margin: 0.25rem 0 0;
    font-size: var(--text-sm);
    font-weight: 600;
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
    padding-top: var(--space-2);
    border-top: 1px dashed var(--color-border);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .review-explanation-box {
    margin-top: var(--space-2);
    padding: var(--space-3);
    border-radius: var(--radius-sm);
    background: var(--color-surface-muted, #f8fafc);
    font-size: var(--text-sm);
    line-height: 1.5;
  }

  .review-explanation-box strong {
    color: var(--color-text);
    display: block;
    margin-bottom: 0.2rem;
  }

  .review-explanation-box p {
    margin: 0;
    color: var(--color-text-muted);
  }

  .psikotes-summary-note {
    font-size: var(--text-sm);
    color: var(--color-primary, #1e3a8a);
    background: color-mix(in srgb, var(--color-primary, #1e3a8a) 8%, transparent);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    border-left: 3px solid var(--color-primary, #1e3a8a);
    margin-top: 0.25rem;
  }

  .psikotes-subtests-panel {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    padding: clamp(1rem, 3vw, 1.5rem);
    box-shadow: var(--shadow-sm);
  }

  .psikotes-subtests-panel__head h3 {
    margin: 0;
    font-size: var(--text-base);
    font-weight: 700;
  }

  .psikotes-subtests-panel__head p {
    margin: 0.25rem 0 1rem;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .psikotes-subtests-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    gap: var(--space-4);
  }

  .subtest-score-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface-muted, #f8fafc);
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .subtest-score-card__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--color-border);
  }

  .subtest-badge {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .subtest-score-val {
    font-size: 1.4rem;
    font-weight: 800;
  }

  .subtest-score-card__body {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .subtest-metric {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-xs);
  }

  .subtest-metric span {
    color: var(--color-text-muted);
  }

  .psikotes-detail-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    padding: clamp(1rem, 3vw, 1.5rem);
    box-shadow: var(--shadow-sm);
  }

  .psikotes-detail-card__header h3 {
    margin: 0;
    font-size: var(--text-base);
    font-weight: 700;
  }

  .psikotes-detail-card__header p {
    margin: 0.25rem 0 1rem;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .kepribadian-weights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
    gap: var(--space-3);
  }

  .weight-stat-item {
    padding: var(--space-3);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: var(--color-surface-muted, #f8fafc);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .weight-stat-item--5 {
    border-color: #10b981;
    background: #ecfdf5;
  }

  .weight-stat-item--4 {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  .weight-stat-item--3 {
    border-color: #f59e0b;
    background: #fffbeb;
  }

  .weight-stat-item--2 {
    border-color: #f97316;
    background: #fff7ed;
  }

  .weight-stat-item--1 {
    border-color: #ef4444;
    background: #fef2f2;
  }

  .weight-stat-tag {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-muted);
  }

  .weight-stat-item strong {
    font-size: 1.1rem;
  }

  .kecermatan-table-wrap {
    overflow-x: auto;
  }

  .kecermatan-stats-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
  }

  .kecermatan-stats-table th,
  .kecermatan-stats-table td {
    padding: 0.55rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
  }

  .kecermatan-stats-table th {
    background: var(--color-surface-muted, #f8fafc);
    font-size: var(--text-xs);
    text-transform: uppercase;
    color: var(--color-text-muted);
    font-weight: 700;
  }

  .review-status--weight {
    border: 1px solid currentColor;
  }

  .review-status--mid {
    background: color-mix(in srgb, var(--color-warning) 14%, var(--color-surface));
    color: var(--color-warning);
  }

  .review-status--low {
    background: color-mix(in srgb, var(--color-danger) 14%, var(--color-surface));
    color: var(--color-danger);
  }

  .review-weights-map {
    margin-top: var(--space-2);
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .review-weights-map__title {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-muted);
  }

  .review-weights-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .weight-pill {
    font-size: var(--text-xs);
    padding: 0.2rem 0.5rem;
    border-radius: var(--radius-sm);
    background: var(--color-surface-muted, #f1f5f9);
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
  }

  .weight-pill--best {
    border-color: #10b981;
    background: #ecfdf5;
    color: #065f46;
    font-weight: 600;
  }

  .weight-pill--selected {
    outline: 2px solid var(--color-primary);
    font-weight: 700;
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

    .header-right-tools {
      flex-direction: column;
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
