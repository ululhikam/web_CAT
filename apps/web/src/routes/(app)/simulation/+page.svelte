<script lang="ts">
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import AdminIcon from '$lib/components/admin/AdminIcon.svelte';
  import { examPreferences } from '$lib/stores/examPreferences.svelte';
  import {
    SIMULATION_PACKETS,
    type SimPacket,
    type SimQuestion,
  } from './simulation-packets';

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
  let timer: ReturnType<typeof setInterval> | null = null;
  let advanceTimer: ReturnType<typeof setTimeout> | null = null;

  const current = $derived(questions[currentIndex]);
  const answeredCount = $derived(Object.keys(answers).length);
  const formattedTime = $derived(
    `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`,
  );
  const progress = $derived(
    questions.length ? Math.round((answeredCount / questions.length) * 100) : 0,
  );

  const correctCount = $derived(
    questions.filter((question, index) => answers[index] === question.correctKey).length,
  );

  const score = $derived(
    questions.length ? Math.round((correctCount / questions.length) * 100) : 0,
  );
  const passed = $derived(score >= 61);

  function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (remaining > 0) {
        remaining -= 1;
      } else {
        finish();
      }
    }, 1000);
  }

  function startSimulation() {
    answers = {};
    doubts = {};
    currentIndex = 0;
    remaining = currentPacket.durationSeconds;
    finished = false;
    isStarted = true;
    startTimer();
  }

  function selectOption(key: string) {
    if (finished) return;
    answers[currentIndex] = key;

    // Sesuai preferensi user di pengaturan: jika mode 'auto', otomatis lanjut ke soal berikutnya
    if (examPreferences.mode === 'auto') {
      if (advanceTimer) clearTimeout(advanceTimer);
      advanceTimer = setTimeout(() => {
        advanceTimer = null;
        if (currentIndex < questions.length - 1) {
          currentIndex += 1;
        }
      }, 230);
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

  onDestroy(() => {
    if (timer) clearInterval(timer);
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
                Kecerdasan (verbal, numerik, denah), Mental Kepribadian (integritas &amp; emosi), serta Kecermatan kolom hilang.
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
                <strong>Kecermatan</strong>
                <span>8 butir (Persepsi visual huruf/angka kolom hilang)</span>
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

        <div class="timer-card" class:timer-card--danger={remaining <= 60 && !finished}>
          <AdminIcon name="clock" size={18} />
          <div>
            <span>Sisa waktu</span>
            <strong>{finished ? 'Selesai' : formattedTime}</strong>
          </div>
        </div>
      </div>
    </header>

    {#if finished}
      <!-- HASIL SIMULASI -->
      <section class="result-card">
        <div class="result-copy">
          <span class="eyebrow">Hasil Simulasi CAT</span>
          <h2>{score >= 61 ? 'Memenuhi Syarat (MS)' : 'Perlu Pendalaman (TMS)'}</h2>
          <p>
            Skor akhir Anda <strong>{score}</strong> dari 100. Ambang batas kelulusan seleksi adalah <strong>61.00</strong>.
          </p>
          <div class="result-stats">
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
              <strong class={passed ? 'text-success' : 'text-danger'}>{passed ? 'MS (Lulus)' : 'TMS (Gugur)'}</strong>
            </div>
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

      <!-- PEMBAHASAN LENGKAP -->
      <section class="review-card">
        <div class="review-card__header">
          <h2>Kunci Jawaban &amp; Pembahasan Soal</h2>
          <p class="muted">Pelajari rasionalisasi setiap butir soal untuk meningkatkan pemahaman pada tes sebenarnya.</p>
        </div>
        <div class="review-list">
          {#each questions as question, index (question.id)}
            {@const selected = answers[index]}
            <article class="review-item" class:review-item--correct={selected === question.correctKey}>
              <div class="review-item__head">
                <span class="review-number">{index + 1}</span>
                <div>
                  <span class="review-module">{question.module}</span>
                  <p class="review-stem">{question.stem}</p>
                </div>
                <span class="review-status" class:review-status--ok={selected === question.correctKey}>
                  {selected === question.correctKey ? 'Benar' : 'Salah'}
                </span>
              </div>
              <div class="review-answer">
                <span>Jawaban Anda: <strong class:text-danger={selected !== question.correctKey}>{selected ?? 'Kosong'}</strong></span>
                <span>Kunci Resmi: <strong class="text-success">{question.correctKey}</strong></span>
              </div>
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
              <button class="button button--primary" type="button" onclick={finish}>Selesai Ujian</button>
            {:else}
              <button class="button button--primary" type="button" onclick={() => goTo(currentIndex + 1)}>
                Berikutnya
              </button>
            {/if}
          </div>
        </section>

        <aside class="palette-card">
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
