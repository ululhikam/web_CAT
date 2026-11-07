<script lang="ts">
  import { onMount } from 'svelte';
  import AdminIcon from '$lib/components/admin/AdminIcon.svelte';
  import { examPreferences } from '$lib/stores/examPreferences.svelte';
  import {
    SIMULATION_PACKETS,
    SIMULATION_POOL_STATS,
    buildRandomizedPacket,
    type SimPacket,
    type SimQuestion,
    type SimBenchmarkItem,
  } from './simulation-packets';
  import {
    evaluatePsikotesExam,
    getOptionWeight,
    type PsikotesEvaluationResult,
  } from './psikotes-scoring';

  // Alur 3 Tahap: 'selection' (Daftar Card Tes) -> 'working' (Halaman Mengerjakan Soal) -> 'result' (Hasil Rekapan Ujian)
  type ViewState = 'selection' | 'working' | 'result';

  let viewState = $state<ViewState>('selection');
  let activePacketId = $state<string>('psikotes-kecerdasan');
  let activePacket = $state<SimPacket>(buildRandomizedPacket('psikotes-kecerdasan'));

  // State Pengerjaan Soal
  let currentIndex = $state<number>(0);
  let answers = $state<Record<number, string>>({});
  let doubts = $state<Record<number, boolean>>({});
  let confirmFinishModal = $state<boolean>(false);
  let reviewFilter = $state<'ALL' | 'CORRECT' | 'WRONG'>('ALL');
  let advanceTimer: ReturnType<typeof setTimeout> | null = null;

  // Timer per Kolom Kecermatan (60 detik/kolom, identik dengan TES CAT)
  let kecermatanColRemaining = $state<number>(60);
  let kecermatanInterval: ReturnType<typeof setInterval> | null = null;

  // Urutan Card Tes yang Ditampilkan di Halaman Utama Pretest CAT
  const TEST_CARDS: Array<{
    packetId: string;
    categoryLabel: string;
    icon: 'brain' | 'shield' | 'zap' | 'devices' | 'book' | 'questions' | 'globe';
    accent: 'indigo' | 'emerald' | 'amber' | 'sky' | 'blue' | 'slate';
    highlights: string[];
  }> = [
    {
      packetId: 'psikotes-kecerdasan',
      categoryLabel: 'PSIKOTES POLRI • 100 POIN (60 MENIT)',
      icon: 'brain',
      accent: 'indigo',
      highlights: [
        'Verbal (30 Soal • 30 Poin): Sinonim, antonim, analogi kata, pengelompokan kata',
        'Praktis / Numerik / Aritmatika Dasar (35 Soal • 35 Poin): Deret angka, hitung cepat, persentase, jarak-kecepatan-waktu, soal cerita & analisis peta/denah',
        'Logis (35 Soal • 35 Poin): Penarikan kesimpulan, penalaran gambar & pola gambar/bentuk hitam-putih',
        `Diacak proporsional dari ${SIMULATION_POOL_STATS.KECERDASAN} Bank Soal`,
      ],
    },
    {
      packetId: 'psikotes-kepribadian',
      categoryLabel: 'PSIKOTES POLRI • 45 MENIT',
      icon: 'shield',
      accent: 'emerald',
      highlights: [
        `Diacak dari ${SIMULATION_POOL_STATS.KEPRIBADIAN} Bank Soal`,
        'Narasi Studi Kasus Kedinasan',
        'Opsi Huruf A–E (Sangat Setuju s.d. Sangat Tidak Setuju)',
        'Evaluasi Bobot Poin 1–5',
      ],
    },
    {
      packetId: 'psikotes-kecermatan',
      categoryLabel: 'PSIKOTES POLRI • 10 MENIT',
      icon: 'zap',
      accent: 'amber',
      highlights: [
        'Kolom 1–3: Kecermatan Huruf (150 Soal)',
        'Kolom 4–6: Kecermatan Angka (150 Soal)',
        'Kolom 7–9: Kecermatan Simbol (150 Soal)',
        'Kolom 10: Campuran Angka, Simbol & Huruf (50 Soal)',
      ],
    },
    {
      packetId: 'tkk',
      categoryLabel: 'KOMPETENSI TEKNIS',
      icon: 'devices',
      accent: 'sky',
      highlights: [
        `Diacak dari ${SIMULATION_POOL_STATS.TKK} Bank Soal`,
        'Microsoft Office & Shortcut',
        'Jaringan & Internet Polri',
        'Informatika & Keamanan Siber',
      ],
    },
    {
      packetId: 'tpk',
      categoryLabel: 'PENGETAHUAN KEPOLISIAN',
      icon: 'book',
      accent: 'blue',
      highlights: [
        `Diacak dari ${SIMULATION_POOL_STATS.TPK} Bank Soal`,
        'Dasar Hukum UU No. 2/2002',
        'KUHP, KUHAP & Wewenang Polri',
        'Kode Etik Profesi & HAM',
      ],
    },
    {
      packetId: 'psikotes-all',
      categoryLabel: 'PAKET GABUNGAN PSIKOTES',
      icon: 'questions',
      accent: 'indigo',
      highlights: [
        '100 Soal Kecerdasan Acak',
        '100 Soal Kepribadian Acak',
        '500 Soal Kecermatan (10 Kolom)',
        'Skor Komposit Psikotes Polri',
      ],
    },
    {
      packetId: 'cat-all',
      categoryLabel: 'SIMULASI LENGKAP SIP',
      icon: 'globe',
      accent: 'slate',
      highlights: [
        `Diacak dari ${SIMULATION_POOL_STATS.TOTAL} Bank Soal`,
        'Seluruh Subtes Psikotes (700)',
        'Kemampuan Komputer TKK (100)',
        'Pengetahuan Kepolisian TPK (100)',
      ],
    },
  ];

  const currentPacket = $derived<SimPacket>(activePacket);

  const questions = $derived<SimQuestion[]>(currentPacket.questions);
  const currentQuestion = $derived<SimQuestion | undefined>(questions[currentIndex]);
  const isKecermatan = $derived<boolean>(Boolean(currentQuestion?.isKecermatan));
  const isKepribadian = $derived<boolean>(currentQuestion?.subtest === 'KEPRIBADIAN');

  const kecermatanFirstIndex = $derived<number>(
    questions.findIndex((q) => Boolean(q.isKecermatan)),
  );
  const kecermatanColumnIndex = $derived<number>(
    isKecermatan ? Math.max(0, (currentQuestion?.columnNumber ?? 1) - 1) : 0,
  );
  const kecermatanInColIndex = $derived<number>(
    isKecermatan && kecermatanFirstIndex >= 0
      ? (currentIndex - kecermatanFirstIndex) % 50
      : 0,
  );

  const currentBenchmark = $derived<SimBenchmarkItem[]>(
    currentQuestion?.benchmark ?? [
      { char: 'A', label: 'A' },
      { char: 'B', label: 'B' },
      { char: 'C', label: 'C' },
      { char: 'D', label: 'D' },
      { char: 'E', label: 'E' },
    ],
  );

  const currentQuestionChars = $derived<string[]>(
    currentQuestion?.questionChars ?? ['?', '?', '?', '?'],
  );

  // Statistik Pengerjaan
  const answeredCount = $derived<number>(Object.keys(answers).length);
  const doubtCount = $derived<number>(
    Object.values(doubts).filter(Boolean).length,
  );
  const unansweredCount = $derived<number>(
    Math.max(0, questions.length - answeredCount),
  );
  const progressPercent = $derived<number>(
    questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0,
  );

  // Evaluasi Hasil Rekapan (Dihitung saat selesai)
  const correctCount = $derived<number>(
    questions.filter((q, idx) => answers[idx] === q.correctKey).length,
  );
  const wrongCount = $derived<number>(
    questions.filter((q, idx) => answers[idx] !== undefined && answers[idx] !== q.correctKey).length,
  );

  const psikotesResult = $derived<PsikotesEvaluationResult>(
    evaluatePsikotesExam(currentPacket, questions, answers),
  );

  const finalScore = $derived<number>(
    psikotesResult.isPsikotes
      ? psikotesResult.finalScore
      : questions.length > 0
        ? Number(((correctCount / questions.length) * 100).toFixed(2))
        : 0,
  );

  const isPassed = $derived<boolean>(
    psikotesResult.isPsikotes ? psikotesResult.passed : finalScore >= 61,
  );

  // Filter daftar soal pada halaman rekapan hasil
  const filteredReviewItems = $derived.by(() => {
    return questions
      .map((q, idx) => ({
        question: q,
        index: idx,
        userKey: answers[idx],
        isCorrect: answers[idx] === q.correctKey,
        weight: q.subtest === 'KEPRIBADIAN' && answers[idx] ? getOptionWeight(q, answers[idx]) : null,
      }))
      .filter((item) => {
        if (reviewFilter === 'CORRECT') return item.isCorrect;
        if (reviewFilter === 'WRONG') return !item.isCorrect;
        return true;
      });
  });

  function stopKecermatanTimer() {
    if (kecermatanInterval) {
      clearInterval(kecermatanInterval);
      kecermatanInterval = null;
    }
  }

  function startKecermatanTimer() {
    stopKecermatanTimer();
    kecermatanColRemaining = 60;
    kecermatanInterval = setInterval(() => {
      if (viewState !== 'working' || !isKecermatan) return;
      if (kecermatanColRemaining > 1) {
        kecermatanColRemaining -= 1;
      } else {
        advanceKecermatanColumn();
      }
    }, 1000);
  }

  function advanceKecermatanColumn() {
    if (kecermatanFirstIndex < 0) return;
    kecermatanColRemaining = 60;
    if (kecermatanColumnIndex < 9) {
      const nextColFirstIdx = kecermatanFirstIndex + (kecermatanColumnIndex + 1) * 50;
      if (nextColFirstIdx < questions.length) {
        currentIndex = nextColFirstIdx;
        return;
      }
    }
    // Kolom ke-10 selesai: cek apakah masih ada subtes berikutnya (mis. TKK/TPK di cat-all)
    const afterKecermatanIdx = kecermatanFirstIndex + 500;
    if (afterKecermatanIdx < questions.length) {
      currentIndex = afterKecermatanIdx;
      return;
    }
    confirmFinishExam();
  }

  // Navigasi & Aksi
  function startTest(packetId: string) {
    if (advanceTimer) {
      clearTimeout(advanceTimer);
      advanceTimer = null;
    }
    activePacketId = packetId;
    activePacket = buildRandomizedPacket(packetId);
    currentIndex = 0;
    answers = {};
    doubts = {};
    confirmFinishModal = false;
    reviewFilter = 'ALL';
    viewState = 'working';
    startKecermatanTimer();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function backToSelection() {
    if (advanceTimer) {
      clearTimeout(advanceTimer);
      advanceTimer = null;
    }
    stopKecermatanTimer();
    confirmFinishModal = false;
    viewState = 'selection';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function selectOption(key: string) {
    if (viewState !== 'working') return;
    answers[currentIndex] = key;

    if (isKecermatan) {
      if (kecermatanInColIndex < 49 && currentIndex < questions.length - 1) {
        currentIndex += 1;
      } else {
        advanceKecermatanColumn();
      }
      return;
    }

    if (examPreferences.mode === 'auto') {
      if (advanceTimer) clearTimeout(advanceTimer);
      advanceTimer = setTimeout(() => {
        advanceTimer = null;
        if (currentIndex < questions.length - 1) {
          const nextQ = questions[currentIndex + 1];
          if (nextQ?.isKecermatan && !isKecermatan) {
            kecermatanColRemaining = 60;
          }
          currentIndex += 1;
        }
      }, 200);
    }
  }

  function toggleDoubt() {
    if (viewState !== 'working' || isKecermatan) return;
    doubts[currentIndex] = !doubts[currentIndex];
  }

  function clearCurrentAnswer() {
    if (viewState !== 'working' || isKecermatan) return;
    delete answers[currentIndex];
  }

  function goPrev() {
    if (isKecermatan) return;
    if (currentIndex > 0) {
      currentIndex -= 1;
    }
  }

  function goNext() {
    if (isKecermatan) {
      if (kecermatanInColIndex < 49 && currentIndex < questions.length - 1) {
        currentIndex += 1;
      } else {
        advanceKecermatanColumn();
      }
      return;
    }
    if (currentIndex < questions.length - 1) {
      const nextQ = questions[currentIndex + 1];
      if (nextQ?.isKecermatan && !isKecermatan) {
        kecermatanColRemaining = 60;
      }
      currentIndex += 1;
    }
  }

  function goToQuestion(idx: number) {
    if (isKecermatan) return;
    if (idx >= 0 && idx < questions.length) {
      const targetQ = questions[idx];
      if (targetQ?.isKecermatan && !isKecermatan) {
        kecermatanColRemaining = 60;
      }
      currentIndex = idx;
    }
  }

  function requestFinish() {
    confirmFinishModal = true;
  }

  function confirmFinishExam() {
    if (advanceTimer) {
      clearTimeout(advanceTimer);
      advanceTimer = null;
    }
    stopKecermatanTimer();
    confirmFinishModal = false;
    viewState = 'result';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (viewState !== 'working' || confirmFinishModal) return;

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

    const num = Number(event.key);
    if (num >= 1 && num <= 5) {
      event.preventDefault();
      const mapped = ['A', 'B', 'C', 'D', 'E'][num - 1];
      if (mapped) selectOption(mapped);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goPrev();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      if (advanceTimer) clearTimeout(advanceTimer);
      stopKecermatanTimer();
    };
  });
</script>

<svelte:head>
  <title>Pretest CAT Polri — Simulasi &amp; Latihan Mandiri</title>
</svelte:head>

<div class="pretest-container">
  {#if viewState === 'selection'}
    <!-- ===================================================================== -->
    <!-- TAHAP 1: DAFTAR CARD TES PRETEST CAT                                  -->
    <!-- ===================================================================== -->
    <header class="selection-header">
      <div class="selection-header__eyebrow">
        <AdminIcon name="shield" size={15} />
        <span>MODUL PRETEST CAT POLRI • SELEKSI SIP &amp; BINTARA</span>
      </div>
      <h1 class="selection-header__title">Daftar Paket Pretest CAT</h1>
      <p class="selection-header__subtitle">
        Pilih salah satu paket tes di bawah ini dan klik tombol <strong>Kerjakan Pretest</strong> untuk memulai pengerjaan soal yang diacak per subtes dari bank soal terpusat. Hasil evaluasi dan rekapan nilai akan ditampilkan setelah Anda menyelesaikan sesi pengerjaan.
      </p>
    </header>

    <div class="cards-grid">
      {#each TEST_CARDS as card (card.packetId)}
        {@const packet = SIMULATION_PACKETS.find((p) => p.id === card.packetId)}
        {#if packet}
          <article class="test-card test-card--{card.accent}">
            <div class="test-card__top">
              <div class="test-card__icon-box test-card__icon-box--{card.accent}">
                <AdminIcon name={card.icon} size={22} />
              </div>
              <div class="test-card__badges">
                <span class="test-card__cat-tag">{card.categoryLabel}</span>
                <span class="test-card__count-tag">{packet.badge}</span>
              </div>
            </div>

            <div class="test-card__body">
              <h2 class="test-card__title">{packet.title.replace('Pretest CAT ', '')}</h2>
              <p class="test-card__desc">{packet.description}</p>

              <ul class="test-card__highlights">
                {#each card.highlights as item}
                  <li>
                    <AdminIcon name="check" size={14} />
                    <span>{item}</span>
                  </li>
                {/each}
              </ul>
            </div>

            <div class="test-card__footer">
              <button
                type="button"
                class="btn-start-test"
                onclick={() => startTest(packet.id)}
              >
                <span>Kerjakan Pretest</span>
                <AdminIcon name="arrow-right" size={16} />
              </button>
            </div>
          </article>
        {/if}
      {/each}
    </div>
  {:else if viewState === 'working'}
    <!-- ===================================================================== -->
    <!-- TAHAP 2: HALAMAN PENGERJAAN SOAL (TANPA KUNCI & TANPA PEMBAHASAN)      -->
    <!-- ===================================================================== -->
    <header class="exam-topbar">
      <div class="exam-topbar__left">
        <button
          type="button"
          class="btn-back"
          onclick={backToSelection}
          title="Kembali ke daftar paket Pretest CAT"
        >
          <AdminIcon name="arrow-left" size={16} />
          <span>Kembali</span>
        </button>
        <div class="exam-topbar__divider"></div>
        <div class="exam-topbar__titles">
          <h1 class="exam-topbar__title">{currentPacket.title}</h1>
          <p class="exam-topbar__subtitle">
            Terjawab {answeredCount} dari {questions.length} Soal ({progressPercent}%)
          </p>
        </div>
      </div>

      <div class="exam-topbar__right">
        {#if !isKecermatan}
          <button
            type="button"
            class="mode-switch-btn"
            onclick={() =>
              examPreferences.setMode(
                examPreferences.mode === 'auto' ? 'manual' : 'auto',
              )}
            title="Ubah mode perpindahan soal setelah memilih opsi"
          >
            <span class="mode-dot" class:mode-dot--active={examPreferences.mode === 'auto'}></span>
            <span>{examPreferences.mode === 'auto' ? 'Auto Next: Aktif' : 'Mode Manual'}</span>
          </button>
        {/if}

        <button
          type="button"
          class="btn-finish-top"
          onclick={requestFinish}
        >
          <AdminIcon name="check" size={16} />
          <span>Selesaikan Pretest</span>
        </button>
      </div>
    </header>

    <div class="workspace-grid">
      <!-- AREA KIRI: SOAL & OPSI JAWABAN -->
      <main class="question-pane">
        {#if currentQuestion}
          <article class="question-card">
            <!-- Baris Informasi Nomor Soal -->
            <div class="question-card__head">
              <div class="question-card__badges">
                {#if isKecermatan}
                  <span class="q-num-pill">
                    Kolom {kecermatanColumnIndex + 1} dari 10
                  </span>
                  <span class="q-subcat-pill">
                    Soal {kecermatanInColIndex + 1} / 50
                  </span>
                {:else}
                  <span class="q-num-pill">
                    Soal No. {currentIndex + 1} / {questions.length}
                  </span>
                  {#if currentQuestion.subCategory}
                    <span class="q-subcat-pill">{currentQuestion.subCategory}</span>
                  {/if}
                {/if}
              </div>

              {#if !isKecermatan}
                <div class="question-card__actions">
                  {#if answers[currentIndex] !== undefined}
                    <button
                      type="button"
                      class="btn-action-subtle"
                      onclick={clearCurrentAnswer}
                    >
                      <AdminIcon name="close" size={14} />
                      <span>Batal Jawab</span>
                    </button>
                  {/if}
                  <button
                    type="button"
                    class="btn-doubt"
                    class:btn-doubt--active={Boolean(doubts[currentIndex])}
                    onclick={toggleDoubt}
                  >
                    <AdminIcon name="flag" size={14} />
                    <span>{doubts[currentIndex] ? 'Ditandai Ragu-ragu' : 'Ragu-ragu'}</span>
                  </button>
                </div>
              {/if}
            </div>

            {#if isKecermatan}
              <!-- TAMPILAN KECERMATAN MONOKROM IDENTIK DENGAN TES CAT -->
              <div class="kecermatan-flow">
                <div class="kecermatan-timer-badge" class:kecermatan-timer-badge--critical={kecermatanColRemaining <= 10}>
                  <span class="kecermatan-timer-badge__label">Durasi:</span>
                  <span class="kecermatan-timer-badge__value">
                    00:00:{String(kecermatanColRemaining).padStart(2, '0')}
                  </span>
                </div>

                <!-- TABEL ACUAN / SAMPEL PATOKAN KOLOM -->
                <div class="kecermatan-sample-box">
                  <div class="kecermatan-sample-header">
                    Kolom {kecermatanColumnIndex + 1}
                  </div>
                  <div class="kecermatan-sample-grid">
                    <div class="kecermatan-sample-row kecermatan-sample-row--chars">
                      {#each currentBenchmark as item}
                        <div class="kecermatan-sample-cell kecermatan-sample-cell--char">
                          {item.char}
                        </div>
                      {/each}
                    </div>
                    <div class="kecermatan-sample-row kecermatan-sample-row--labels">
                      {#each currentBenchmark as item}
                        <div class="kecermatan-sample-cell kecermatan-sample-cell--label">
                          {item.label}
                        </div>
                      {/each}
                    </div>
                  </div>
                </div>

                <!-- KOTAK SOAL AKTIF (4 KARAKTER DARI SAMPEL) -->
                <div class="kecermatan-question-card">
                  <div class="kecermatan-question-grid">
                    {#each currentQuestionChars as ch}
                      <div class="kecermatan-question-cell">
                        {ch}
                      </div>
                    {/each}
                  </div>
                </div>

                <!-- PILIHAN JAWABAN (TOMBOL A B C D E) -->
                <div class="kecermatan-choices-row" role="group" aria-label="Pilih huruf yang hilang">
                  {#each currentQuestion.options as option (option.key)}
                    {@const isSelected = answers[currentIndex] === option.key}
                    <button
                      type="button"
                      class="kecermatan-choice-key"
                      class:kecermatan-choice-key--active={isSelected}
                      onclick={() => selectOption(option.key)}
                    >
                      <span>{option.key}</span>
                    </button>
                  {/each}
                </div>
              </div>

              <!-- Footer Khusus Kecermatan (Identik TES CAT) -->
              <footer class="question-card__footer">
                <span class="q-subcat-pill">
                  Kolom {kecermatanColumnIndex + 1} dari 10
                </span>

                <span class="keyboard-hint">
                  Soal <strong>{kecermatanInColIndex + 1}</strong> / 50 • Pintasan Tombol <strong>A–E</strong>
                </span>

                {#if kecermatanInColIndex < 49 && currentIndex < questions.length - 1}
                  <button
                    type="button"
                    class="btn-nav btn-nav--next"
                    onclick={goNext}
                  >
                    <span>Lewati (Soal Berikutnya)</span>
                    <AdminIcon name="arrow-right" size={16} />
                  </button>
                {:else if kecermatanColumnIndex < 9}
                  <button
                    type="button"
                    class="btn-nav btn-nav--next"
                    onclick={advanceKecermatanColumn}
                  >
                    <span>Lanjut Kolom {kecermatanColumnIndex + 2}</span>
                    <AdminIcon name="arrow-right" size={16} />
                  </button>
                {:else}
                  <button
                    type="button"
                    class="btn-nav btn-nav--finish"
                    onclick={requestFinish}
                  >
                    <AdminIcon name="check" size={16} />
                    <span>Selesaikan Ujian</span>
                  </button>
                {/if}
              </footer>
            {:else}
              <!-- Narasi Pertanyaan & Gambar Ilustrasi -->
              <div class="question-stem">
                <p class="question-stem__text">{currentQuestion.stem}</p>

                {#if currentQuestion.image}
                  <div class="question-stem__figure">
                    <img
                      src={currentQuestion.image}
                      alt="Ilustrasi Soal {currentIndex + 1}"
                      class="question-stem__img"
                      loading="lazy"
                    />
                  </div>
                {/if}
              </div>

              <!-- Opsi Pilihan Jawaban (A - E) Tanpa Kunci & Tanpa Pembahasan -->
              <div
                class="options-list"
                class:options-list--images={currentQuestion.options.some((o) => Boolean(o.image))}
                role="radiogroup"
                aria-label="Pilihan Jawaban"
              >
                {#each currentQuestion.options as option (option.key)}
                  {@const isSelected = answers[currentIndex] === option.key}
                  <button
                    type="button"
                    class="option-btn"
                    class:option-btn--selected={isSelected}
                    class:option-btn--image={Boolean(option.image)}
                    onclick={() => selectOption(option.key)}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    <span class="option-btn__key">{option.key}</span>
                    {#if option.image}
                      <img
                        src={option.image}
                        alt={option.text}
                        class="option-btn__img"
                        loading="lazy"
                      />
                    {:else}
                      <span class="option-btn__label">{option.text}</span>
                    {/if}
                    {#if isSelected}
                      <span class="option-btn__check">
                        <AdminIcon name="check" size={15} />
                      </span>
                    {/if}
                  </button>
                {/each}
              </div>

              <!-- Baris Navigasi Bawah: Sebelumnya & Selanjutnya -->
              <footer class="question-card__footer">
                <button
                  type="button"
                  class="btn-nav btn-nav--prev"
                  disabled={currentIndex === 0}
                  onclick={goPrev}
                >
                  <AdminIcon name="arrow-left" size={16} />
                  <span>Sebelumnya</span>
                </button>

                <span class="keyboard-hint">
                  Pintasan: Tombol <strong>A–E</strong> untuk memilih • Panah <strong>← / →</strong> untuk navigasi
                </span>

                {#if currentIndex < questions.length - 1}
                  <button
                    type="button"
                    class="btn-nav btn-nav--next"
                    onclick={goNext}
                  >
                    <span>Selanjutnya</span>
                    <AdminIcon name="arrow-right" size={16} />
                  </button>
                {:else}
                  <button
                    type="button"
                    class="btn-nav btn-nav--finish"
                    onclick={requestFinish}
                  >
                    <AdminIcon name="check" size={16} />
                    <span>Selesaikan Ujian</span>
                  </button>
                {/if}
              </footer>
            {/if}
          </article>
        {/if}
      </main>

      <!-- AREA KANAN: DAFTAR NOMOR SOAL ATAU PROGRES KOLOM KECERMATAN -->
      <aside class="palette-pane">
        {#if isKecermatan}
          <div class="palette-card">
            <div class="palette-card__header">
              <div>
                <h2 class="palette-card__title">Progres Kolom Kecermatan</h2>
                <span class="palette-stat__lbl">10 Kolom · 1 Menit per Kolom</span>
              </div>
            </div>

            <div class="kecermatan-column-list">
              {#each Array.from({ length: 10 }, (_, colIdx) => colIdx) as colIdx}
                {@const isCurrent = colIdx === kecermatanColumnIndex}
                {@const isDone = colIdx < kecermatanColumnIndex}
                {@const colStart = (kecermatanFirstIndex >= 0 ? kecermatanFirstIndex : 0) + colIdx * 50}
                {@const colAnswered = Array.from({ length: 50 }, (_, k) => colStart + k).filter(
                  (qIdx) => answers[qIdx] !== undefined,
                ).length}
                <div
                  class="kecermatan-col-item"
                  class:kecermatan-col-item--active={isCurrent}
                  class:kecermatan-col-item--done={isDone}
                >
                  <div class="kecermatan-col-item__info">
                    <span class="kecermatan-col-item__name">Kolom {colIdx + 1}</span>
                    <span class="kecermatan-col-item__count">{colAnswered} / 50 terjawab</span>
                  </div>
                  {#if isCurrent}
                    <span class="col-status-badge col-status-badge--active">Sedang Aktif</span>
                  {:else if isDone}
                    <span class="col-status-badge col-status-badge--done">Selesai</span>
                  {:else}
                    <span class="col-status-badge col-status-badge--wait">Menunggu</span>
                  {/if}
                </div>
              {/each}
            </div>

            <button
              type="button"
              class="btn-submit-all"
              onclick={requestFinish}
            >
              <AdminIcon name="check" size={16} />
              <span>Selesaikan &amp; Lihat Hasil</span>
            </button>
          </div>
        {:else}
          <div class="palette-card">
            <div class="palette-card__header">
              <h2 class="palette-card__title">Daftar Nomor Soal</h2>
              <span class="palette-card__badge">{answeredCount}/{questions.length}</span>
            </div>

            <!-- Ringkasan Status Pengerjaan -->
            <div class="palette-stats">
              <div class="palette-stat palette-stat--answered">
                <span class="palette-stat__val">{answeredCount}</span>
                <span class="palette-stat__lbl">Dijawab</span>
              </div>
              <div class="palette-stat palette-stat--doubt">
                <span class="palette-stat__val">{doubtCount}</span>
                <span class="palette-stat__lbl">Ragu</span>
              </div>
              <div class="palette-stat palette-stat--empty">
                <span class="palette-stat__val">{unansweredCount}</span>
                <span class="palette-stat__lbl">Kosong</span>
              </div>
            </div>

            <div class="palette-progress">
              <div class="palette-progress__bar" style="width: {progressPercent}%"></div>
            </div>

            <!-- Grid Nomor Soal -->
            <div class="palette-numbers">
              {#each questions as q, idx (q.id)}
                {@const isCurrent = idx === currentIndex}
                {@const isAnswered = answers[idx] !== undefined}
                {@const isDoubt = Boolean(doubts[idx])}
                <button
                  type="button"
                  class="num-btn"
                  class:num-btn--current={isCurrent}
                  class:num-btn--answered={isAnswered && !isDoubt}
                  class:num-btn--doubt={isDoubt}
                  onclick={() => goToQuestion(idx)}
                  title="Soal Nomor {idx + 1}{answers[idx] ? ` (Dijawab: ${answers[idx]})` : ''}"
                >
                  <span class="num-btn__idx">{idx + 1}</span>
                  {#if answers[idx]}
                    <span class="num-btn__ans">{answers[idx]}</span>
                  {/if}
                </button>
              {/each}
            </div>

            <div class="palette-legend">
              <span class="legend-chip"><i class="dot dot--answered"></i> Terjawab</span>
              <span class="legend-chip"><i class="dot dot--doubt"></i> Ragu-ragu</span>
              <span class="legend-chip"><i class="dot dot--empty"></i> Belum</span>
            </div>

            <button
              type="button"
              class="btn-submit-all"
              onclick={requestFinish}
            >
              <AdminIcon name="check" size={16} />
              <span>Selesaikan &amp; Lihat Hasil</span>
            </button>
          </div>
        {/if}
      </aside>
    </div>

    <!-- MODAL KONFIRMASI SELESAI MENGERJAKAN -->
    {#if confirmFinishModal}
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="finish-modal-title">
        <div class="modal-dialog">
          <div class="modal-dialog__icon">
            <AdminIcon name="award" size={26} />
          </div>
          <h3 id="finish-modal-title" class="modal-dialog__title">
            Selesaikan Pretest Sekarang?
          </h3>
          <p class="modal-dialog__desc">
            Anda telah menjawab <strong>{answeredCount}</strong> dari <strong>{questions.length}</strong> butir soal.
            {#if unansweredCount > 0}
              Masih terdapat <strong>{unansweredCount} soal</strong> yang belum dijawab.
            {/if}
            {#if doubtCount > 0}
              Terdapat <strong>{doubtCount} soal</strong> yang ditandai ragu-ragu.
            {/if}
          </p>
          <div class="modal-dialog__actions">
            <button
              type="button"
              class="btn-modal-cancel"
              onclick={() => (confirmFinishModal = false)}
            >
              Kembali Periksa Soal
            </button>
            <button
              type="button"
              class="btn-modal-confirm"
              onclick={confirmFinishExam}
            >
              <AdminIcon name="check" size={16} />
              <span>Ya, Selesaikan &amp; Lihat Rekapan</span>
            </button>
          </div>
        </div>
      </div>
    {/if}
  {:else if viewState === 'result'}
    <!-- ===================================================================== -->
    <!-- TAHAP 3: HASIL REKAPAN UJIAN PRETEST CAT                              -->
    <!-- ===================================================================== -->
    <header class="exam-topbar">
      <div class="exam-topbar__left">
        <button
          type="button"
          class="btn-back"
          onclick={backToSelection}
        >
          <AdminIcon name="arrow-left" size={16} />
          <span>Kembali ke Daftar Pretest</span>
        </button>
        <div class="exam-topbar__divider"></div>
        <div class="exam-topbar__titles">
          <h1 class="exam-topbar__title">Hasil Rekapan Ujian: {currentPacket.title}</h1>
          <p class="exam-topbar__subtitle">Evaluasi akhir pengerjaan dan ulasan jawaban</p>
        </div>
      </div>

      <div class="exam-topbar__right">
        <button
          type="button"
          class="btn-restart"
          onclick={() => startTest(activePacketId)}
        >
          <AdminIcon name="refresh" size={16} />
          <span>Ulangi Tes Ini</span>
        </button>
      </div>
    </header>

    <!-- KARTU UTAMA SKOR AKHIR & STATUS KELULUSAN -->
    <section class="recap-hero" class:recap-hero--pass={isPassed} class:recap-hero--fail={!isPassed}>
      <div class="recap-hero__left">
        <div class="recap-hero__badge-row">
          <span class="recap-eyebrow">
            <AdminIcon name="award" size={14} />
            <span>REKAPAN NILAI PRETEST CAT POLRI</span>
          </span>
          <span class="verdict-pill" class:verdict-pill--pass={isPassed} class:verdict-pill--fail={!isPassed}>
            {isPassed ? 'MEMENUHI SYARAT (MS)' : 'BELUM MEMENUHI SYARAT (TMS)'}
          </span>
        </div>

        <div class="recap-score-box">
          <span class="recap-score-box__val">{finalScore.toFixed(2)}</span>
          <div class="recap-score-box__meta">
            <span class="recap-score-box__max">Skala 100.00</span>
            <span class="recap-score-box__pass">Ambang Batas Minimal: 61.00</span>
          </div>
        </div>

        <p class="recap-hero__summary">
          {psikotesResult.isPsikotes
            ? psikotesResult.summaryExplanation
            : isPassed
              ? 'Selamat! Akumulasi nilai Anda telah melampaui ambang batas minimal kelulusan standar seleksi CAT Polri.'
              : 'Nilai Anda masih berada di bawah ambang batas minimal 61.00. Tinjau kembali rekapan jawaban di bawah untuk memperkuat penguasaan materi.'}
        </p>
      </div>

      <!-- Statistik Ringkas -->
      <div class="recap-metrics">
        <div class="metric-box">
          <span class="metric-box__label">Total Soal</span>
          <strong class="metric-box__val">{questions.length}</strong>
        </div>
        <div class="metric-box">
          <span class="metric-box__label">Terjawab</span>
          <strong class="metric-box__val">{answeredCount}</strong>
        </div>
        {#if psikotesResult.kepribadian && !psikotesResult.isMixed}
          <div class="metric-box metric-box--success">
            <span class="metric-box__label">Total Poin Sikap</span>
            <strong class="metric-box__val">
              {psikotesResult.kepribadian.totalScoreEarned} / {psikotesResult.kepribadian.maxPossibleScore}
            </strong>
          </div>
          <div class="metric-box">
            <span class="metric-box__label">Rata-rata Bobot</span>
            <strong class="metric-box__val">{psikotesResult.kepribadian.averageWeight.toFixed(2)} / 5.00</strong>
          </div>
        {:else}
          <div class="metric-box metric-box--success">
            <span class="metric-box__label">Jawaban Benar</span>
            <strong class="metric-box__val">{correctCount}</strong>
          </div>
          <div class="metric-box metric-box--danger">
            <span class="metric-box__label">Salah / Kosong</span>
            <strong class="metric-box__val">{questions.length - correctCount}</strong>
          </div>
        {/if}
      </div>
    </section>

    <!-- RINCIAN REKAPAN JAWABAN PER SOAL -->
    <section class="review-section">
      <div class="review-section__header">
        <div>
          <h2 class="review-section__title">Rincian Jawaban &amp; Evaluasi</h2>
          <p class="review-section__subtitle">
            Periksa kembali setiap butir soal beserta jawaban yang Anda pilih dan kunci pembahasannya
          </p>
        </div>

        <div class="review-filters">
          <button
            type="button"
            class="filter-pill"
            class:filter-pill--active={reviewFilter === 'ALL'}
            onclick={() => (reviewFilter = 'ALL')}
          >
            Semua ({questions.length})
          </button>
          <button
            type="button"
            class="filter-pill"
            class:filter-pill--active={reviewFilter === 'CORRECT'}
            onclick={() => (reviewFilter = 'CORRECT')}
          >
            Tepat ({correctCount})
          </button>
          <button
            type="button"
            class="filter-pill"
            class:filter-pill--active={reviewFilter === 'WRONG'}
            onclick={() => (reviewFilter = 'WRONG')}
          >
            Perlu Evaluasi ({questions.length - correctCount})
          </button>
        </div>
      </div>

      <div class="review-list">
        {#each filteredReviewItems as item (item.question.id)}
          <article class="review-item" class:review-item--correct={item.isCorrect} class:review-item--wrong={!item.isCorrect}>
            <div class="review-item__head">
              <div class="review-item__badges">
                <span class="review-item__num">Soal #{item.index + 1}</span>
                {#if item.question.subCategory}
                  <span class="review-item__cat">{item.question.subCategory}</span>
                {/if}
              </div>

              <div class="review-item__verdict">
                {#if item.question.subtest === 'KEPRIBADIAN'}
                  <span class="verdict-tag" class:verdict-tag--ok={item.weight === 5} class:verdict-tag--warn={item.weight !== 5}>
                    {item.userKey
                      ? `Jawaban Anda: ${item.userKey} (Bobot ${item.weight ?? 0}/5)`
                      : 'Tidak Dijawab (0 Poin)'}
                  </span>
                {:else}
                  <span class="verdict-tag" class:verdict-tag--ok={item.isCorrect} class:verdict-tag--warn={!item.isCorrect}>
                    {item.isCorrect
                      ? `Benar (${item.userKey})`
                      : item.userKey
                        ? `Salah (Dijawab: ${item.userKey} • Kunci: ${item.question.correctKey})`
                        : `Kosong (Kunci: ${item.question.correctKey})`}
                  </span>
                {/if}
              </div>
            </div>

            <p class="review-item__stem">{item.question.stem}</p>

            {#if item.question.image}
              <div class="question-stem__figure" style="margin-bottom: 0.85rem;">
                <img
                  src={item.question.image}
                  alt="Ilustrasi Soal #{item.index + 1}"
                  class="question-stem__img"
                  style="max-height: 210px;"
                  loading="lazy"
                />
              </div>
            {/if}

            <div class="review-item__options">
              {#each item.question.options as opt (opt.key)}
                {@const isUserChoice = item.userKey === opt.key}
                {@const isKey = item.question.correctKey === opt.key}
                <div
                  class="review-opt"
                  class:review-opt--key={isKey}
                  class:review-opt--user-wrong={isUserChoice && !isKey}
                >
                  <span class="review-opt__key">{opt.key}</span>
                  {#if opt.image}
                    <img
                      src={opt.image}
                      alt={opt.text}
                      style="width: 72px; height: 72px; object-fit: contain; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff;"
                      loading="lazy"
                    />
                  {/if}
                  <span class="review-opt__text">{opt.text}</span>
                  {#if isKey}
                    <span class="review-opt__badge review-opt__badge--key">Kunci Utama</span>
                  {:else if isUserChoice}
                    <span class="review-opt__badge review-opt__badge--user">Pilihan Anda</span>
                  {/if}
                </div>
              {/each}
            </div>

            <div class="review-item__explanation">
              <strong>Evaluasi:</strong> {item.question.explanation}
            </div>
          </article>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .pretest-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
    max-width: 1240px;
    margin: 0 auto;
    padding-bottom: 3.5rem;
  }

  /* =========================================================================
   * TAHAP 1: SELECTION SCREEN (CARD-CARD TES)
   * ========================================================================= */
  .selection-header {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    padding: 1.5rem 1.75rem;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  }

  .selection-header__eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    width: fit-content;
    padding: 0.3rem 0.7rem;
    border-radius: 999px;
    background: rgba(2, 132, 199, 0.1);
    color: #0284c7;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .selection-header__title {
    margin: 0;
    font-size: clamp(1.45rem, 3vw, 2rem);
    font-weight: 800;
    color: var(--color-text, #0f172a);
    letter-spacing: -0.02em;
  }

  .selection-header__subtitle {
    margin: 0;
    max-width: 78ch;
    font-size: 0.925rem;
    line-height: 1.6;
    color: var(--color-text-muted, #475569);
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 1.25rem;
  }

  .test-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 1.25rem;
    padding: 1.5rem;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 16px;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }

  .test-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 24px -6px rgba(15, 23, 42, 0.08);
    border-color: #0284c7;
  }

  .test-card__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .test-card__icon-box {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border-radius: 12px;
    flex-shrink: 0;
  }

  .test-card__icon-box--indigo {
    background: rgba(79, 70, 229, 0.1);
    color: #4f46e5;
  }

  .test-card__icon-box--emerald {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
  }

  .test-card__icon-box--amber {
    background: rgba(245, 158, 11, 0.12);
    color: #d97706;
  }

  .test-card__icon-box--sky {
    background: rgba(2, 132, 199, 0.1);
    color: #0284c7;
  }

  .test-card__icon-box--blue {
    background: rgba(37, 99, 235, 0.1);
    color: #2563eb;
  }

  .test-card__icon-box--slate {
    background: rgba(15, 23, 42, 0.08);
    color: var(--color-text, #0f172a);
  }

  .test-card__badges {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
  }

  .test-card__cat-tag {
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    background: var(--color-bg, #f1f5f9);
    color: var(--color-text-muted, #475569);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .test-card__count-tag {
    padding: 0.25rem 0.65rem;
    border-radius: 6px;
    background: rgba(2, 132, 199, 0.1);
    color: #0284c7;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .test-card__body {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
  }

  .test-card__title {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--color-text, #0f172a);
    line-height: 1.35;
  }

  .test-card__desc {
    margin: 0;
    font-size: 0.86rem;
    line-height: 1.55;
    color: var(--color-text-muted, #475569);
  }

  .test-card__highlights {
    list-style: none;
    margin: 0.25rem 0 0;
    padding: 0.75rem 0 0;
    border-top: 1px solid var(--color-border, #f1f5f9);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.45rem 0.75rem;
  }

  .test-card__highlights li {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--color-text, #334155);
  }

  .test-card__highlights li :global(svg) {
    color: #10b981;
    flex-shrink: 0;
  }

  .test-card__footer {
    padding-top: 0.5rem;
  }

  .btn-start-test {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.15rem;
    border-radius: 10px;
    border: none;
    background: #0f172a;
    color: #ffffff;
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.1s ease;
  }

  .btn-start-test:hover {
    background: #0284c7;
  }

  :global([data-theme='dark']) .btn-start-test {
    background: #0284c7;
  }

  :global([data-theme='dark']) .btn-start-test:hover {
    background: #0369a1;
  }

  /* =========================================================================
   * TAHAP 2: WORKSPACE PENGERJAAN SOAL
   * ========================================================================= */
  .exam-topbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  }

  .exam-topbar__left {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    min-width: 0;
  }

  .btn-back {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.55rem 0.9rem;
    border-radius: 9px;
    border: 1px solid var(--color-border, #cbd5e1);
    background: var(--color-bg, #f8fafc);
    color: var(--color-text, #0f172a);
    font-size: 0.825rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .btn-back:hover {
    border-color: #0284c7;
    color: #0284c7;
    background: rgba(2, 132, 199, 0.06);
  }

  .exam-topbar__divider {
    width: 1px;
    height: 28px;
    background: var(--color-border, #e2e8f0);
    flex-shrink: 0;
  }

  .exam-topbar__titles {
    min-width: 0;
  }

  .exam-topbar__title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 800;
    color: var(--color-text, #0f172a);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .exam-topbar__subtitle {
    margin: 0.15rem 0 0;
    font-size: 0.78rem;
    color: var(--color-text-muted, #64748b);
  }

  .exam-topbar__right {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .mode-switch-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.8rem;
    border-radius: 8px;
    border: 1px solid var(--color-border, #cbd5e1);
    background: var(--color-surface, #ffffff);
    color: var(--color-text, #334155);
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
  }

  .mode-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #94a3b8;
  }

  .mode-dot--active {
    background: #10b981;
  }

  .btn-finish-top {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 1rem;
    border-radius: 9px;
    border: none;
    background: #0284c7;
    color: #ffffff;
    font-size: 0.825rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .btn-finish-top:hover {
    background: #0369a1;
  }

  /* Grid 2 Kolom: Kiri Soal, Kanan Daftar Nomor */
  .workspace-grid {
    display: grid;
    grid-template-columns: 1fr 330px;
    gap: 1.25rem;
    align-items: start;
  }

  @media (max-width: 960px) {
    .workspace-grid {
      grid-template-columns: 1fr;
    }
  }

  .question-pane {
    min-width: 0;
  }

  .question-card {
    display: flex;
    flex-direction: column;
    gap: 1.35rem;
    padding: 1.65rem;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 16px;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
  }

  .question-card__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border, #f1f5f9);
  }

  .question-card__badges {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  .q-num-pill {
    padding: 0.35rem 0.8rem;
    border-radius: 8px;
    background: #0f172a;
    color: #ffffff;
    font-size: 0.85rem;
    font-weight: 700;
  }

  :global([data-theme='dark']) .q-num-pill {
    background: #0284c7;
  }

  .q-subcat-pill {
    padding: 0.3rem 0.7rem;
    border-radius: 999px;
    background: rgba(2, 132, 199, 0.1);
    color: #0284c7;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .question-card__actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-action-subtle {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.4rem 0.7rem;
    border-radius: 8px;
    border: 1px solid var(--color-border, #cbd5e1);
    background: transparent;
    color: var(--color-text-muted, #64748b);
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-action-subtle:hover {
    color: #dc2626;
    border-color: #fca5a5;
  }

  .btn-doubt {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.75rem;
    border-radius: 8px;
    border: 1px solid var(--color-border, #cbd5e1);
    background: var(--color-bg, #f8fafc);
    color: var(--color-text, #334155);
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-doubt--active {
    background: rgba(245, 158, 11, 0.15);
    border-color: #f59e0b;
    color: #b45309;
  }

  /* Kecermatan Flow (Monokrom CAT Polri - Identik dengan TES CAT) */
  .kecermatan-flow {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.9rem;
    width: 100%;
    max-width: 520px;
    margin: 0 auto;
    padding: 0.5rem 0;
  }

  .kecermatan-timer-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: clamp(1.2rem, 3vw, 1.45rem);
    font-weight: 800;
    color: #0f172a;
    background: #f1f5f9;
    border: 1.5px solid #cbd5e1;
    padding: 6px 18px;
    border-radius: 999px;
    text-align: center;
    letter-spacing: 0.05em;
    font-family: monospace;
  }

  .kecermatan-timer-badge--critical {
    background: #fef2f2;
    border-color: #ef4444;
    color: #dc2626;
  }

  .kecermatan-sample-box {
    width: 100%;
    background: #ffffff;
    color: #0f172a;
    border: 2px solid #0f172a;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  }

  .kecermatan-sample-header {
    background: #f8fafc;
    color: #0f172a;
    font-size: 0.95rem;
    font-weight: 800;
    text-align: center;
    padding: 6px 12px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    border-bottom: 2px solid #0f172a;
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
    border-bottom: 1px solid #cbd5e1;
    background: #ffffff;
  }

  .kecermatan-sample-row--labels {
    background: #f8fafc;
  }

  .kecermatan-sample-cell {
    display: grid;
    place-items: center;
    padding: 8px 4px;
    font-family: monospace;
    border-right: 1px solid #cbd5e1;
  }

  .kecermatan-sample-cell:last-child {
    border-right: none;
  }

  .kecermatan-sample-cell--char {
    font-size: clamp(1.4rem, 3.2vw, 1.8rem);
    font-weight: 900;
    color: #0f172a;
    line-height: 1.1;
  }

  .kecermatan-sample-cell--label {
    font-size: clamp(0.85rem, 1.8vw, 1rem);
    font-weight: 700;
    color: #475569;
    line-height: 1;
  }

  .kecermatan-question-card {
    width: 100%;
    background: #ffffff;
    border: 2px solid #0f172a;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  }

  .kecermatan-question-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }

  .kecermatan-question-cell {
    display: grid;
    place-items: center;
    padding: 12px 6px;
    font-family: monospace;
    font-size: clamp(1.6rem, 3.8vw, 2.1rem);
    font-weight: 900;
    color: #0f172a;
    border-right: 1px solid #cbd5e1;
    line-height: 1;
  }

  .kecermatan-question-cell:last-child {
    border-right: none;
  }

  .kecermatan-choices-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    width: 100%;
  }

  .kecermatan-choice-key {
    display: grid;
    place-items: center;
    height: 48px;
    background: #ffffff;
    color: #0f172a;
    border: 2px solid #0f172a;
    border-radius: 6px;
    font-family: monospace;
    font-size: 1.25rem;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.12s ease;
  }

  .kecermatan-choice-key:hover {
    background: #0f172a;
    color: #ffffff;
  }

  .kecermatan-choice-key:active,
  .kecermatan-choice-key--active {
    background: #0f172a;
    color: #ffffff;
    box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.35);
  }

  .kecermatan-column-list {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .kecermatan-col-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.55rem 0.75rem;
    border-radius: 10px;
    border: 1px solid var(--color-border, #e2e8f0);
    background: var(--color-bg, #f8fafc);
    transition: all 0.15s ease;
  }

  .kecermatan-col-item--active {
    border-color: #0284c7;
    background: rgba(2, 132, 199, 0.08);
    box-shadow: 0 0 0 1px #0284c7;
  }

  .kecermatan-col-item--done {
    opacity: 0.8;
  }

  .kecermatan-col-item__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .kecermatan-col-item__name {
    font-weight: 700;
    font-size: 0.825rem;
    color: var(--color-text, #0f172a);
  }

  .kecermatan-col-item__count {
    font-size: 0.72rem;
    color: var(--color-text-muted, #64748b);
  }

  .col-status-badge {
    padding: 0.2rem 0.55rem;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .col-status-badge--active {
    background: #0284c7;
    color: #ffffff;
  }

  .col-status-badge--done {
    background: rgba(16, 185, 129, 0.15);
    color: #059669;
  }

  .col-status-badge--wait {
    background: var(--color-border, #e2e8f0);
    color: var(--color-text-muted, #64748b);
  }

  /* Narasi Soal */
  .question-stem {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .question-stem__text {
    margin: 0;
    font-size: clamp(1rem, 1.6vw, 1.1rem);
    line-height: 1.75;
    color: var(--color-text, #0f172a);
    font-weight: 500;
    text-align: justify;
  }

  .question-stem__figure {
    max-width: 500px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--color-border, #cbd5e1);
    background: #ffffff;
    padding: 0.5rem;
  }

  .question-stem__img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: contain;
  }

  /* Opsi Jawaban */
  .options-list {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .options-list--images {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 0.85rem;
  }

  .option-btn {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    width: 100%;
    padding: 0.9rem 1.15rem;
    border-radius: 12px;
    border: 1.5px solid var(--color-border, #e2e8f0);
    background: var(--color-surface, #ffffff);
    color: var(--color-text, #0f172a);
    text-align: left;
    cursor: pointer;
    transition: all 0.14s ease;
  }

  .option-btn--image {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .option-btn__img {
    width: 150px;
    height: 150px;
    object-fit: contain;
    border-radius: 8px;
    background: #ffffff;
  }

  .option-btn:hover {
    border-color: #0284c7;
    background: rgba(2, 132, 199, 0.04);
  }

  .option-btn--selected {
    border-color: #0284c7;
    background: rgba(2, 132, 199, 0.1);
    box-shadow: 0 0 0 1px #0284c7;
  }

  .option-btn__key {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: var(--color-bg, #f1f5f9);
    border: 1px solid var(--color-border, #cbd5e1);
    font-size: 0.85rem;
    font-weight: 800;
    color: var(--color-text, #0f172a);
    flex-shrink: 0;
  }

  .option-btn--selected .option-btn__key {
    background: #0284c7;
    border-color: #0284c7;
    color: #ffffff;
  }

  .option-btn__label {
    flex: 1;
    font-size: 0.95rem;
    line-height: 1.5;
    font-weight: 500;
  }

  .option-btn__check {
    display: grid;
    place-items: center;
    color: #0284c7;
    flex-shrink: 0;
  }

  /* Navigasi Bawah Soal (Sebelumnya & Selanjutnya) */
  .question-card__footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-top: 1.15rem;
    border-top: 1px solid var(--color-border, #f1f5f9);
  }

  .btn-nav {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1.2rem;
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-nav:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .btn-nav--prev {
    border: 1px solid var(--color-border, #cbd5e1);
    background: var(--color-bg, #f8fafc);
    color: var(--color-text, #0f172a);
  }

  .btn-nav--prev:not(:disabled):hover {
    border-color: #0284c7;
    color: #0284c7;
  }

  .btn-nav--next {
    border: none;
    background: #0f172a;
    color: #ffffff;
  }

  .btn-nav--next:hover {
    background: #0284c7;
  }

  :global([data-theme='dark']) .btn-nav--next {
    background: #0284c7;
  }

  .btn-nav--finish {
    border: none;
    background: #059669;
    color: #ffffff;
  }

  .btn-nav--finish:hover {
    background: #047857;
  }

  .keyboard-hint {
    font-size: 0.775rem;
    color: var(--color-text-muted, #64748b);
  }

  /* Palet Daftar Nomor Soal (Sebelah Kanan) */
  .palette-pane {
    position: sticky;
    top: 1rem;
  }

  .palette-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.35rem;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 16px;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
  }

  .palette-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .palette-card__title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 800;
    color: var(--color-text, #0f172a);
  }

  .palette-card__badge {
    padding: 0.2rem 0.55rem;
    border-radius: 6px;
    background: rgba(2, 132, 199, 0.1);
    color: #0284c7;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .palette-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }

  .palette-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem;
    border-radius: 10px;
    background: var(--color-bg, #f8fafc);
    border: 1px solid var(--color-border, #e2e8f0);
  }

  .palette-stat__val {
    font-size: 1rem;
    font-weight: 800;
    color: var(--color-text, #0f172a);
  }

  .palette-stat__lbl {
    font-size: 0.7rem;
    color: var(--color-text-muted, #64748b);
    font-weight: 600;
  }

  .palette-progress {
    width: 100%;
    height: 7px;
    border-radius: 999px;
    background: var(--color-bg, #f1f5f9);
    overflow: hidden;
  }

  .palette-progress__bar {
    height: 100%;
    background: linear-gradient(90deg, #0284c7, #10b981);
    transition: width 0.2s ease;
  }

  .palette-numbers {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.4rem;
    max-height: 360px;
    overflow-y: auto;
    padding: 0.15rem;
  }

  .num-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 42px;
    border-radius: 8px;
    border: 1px solid var(--color-border, #cbd5e1);
    background: var(--color-bg, #f8fafc);
    color: var(--color-text, #334155);
    cursor: pointer;
    transition: all 0.12s ease;
    padding: 2px;
  }

  .num-btn:hover {
    border-color: #0284c7;
  }

  .num-btn__idx {
    font-size: 0.78rem;
    font-weight: 700;
    line-height: 1.1;
  }

  .num-btn__ans {
    font-size: 0.65rem;
    font-weight: 800;
    opacity: 0.9;
  }

  .num-btn--answered {
    background: #0284c7;
    border-color: #0284c7;
    color: #ffffff;
  }

  .num-btn--doubt {
    background: #f59e0b;
    border-color: #d97706;
    color: #ffffff;
  }

  .num-btn--current {
    box-shadow: 0 0 0 2px #0f172a;
  }

  :global([data-theme='dark']) .num-btn--current {
    box-shadow: 0 0 0 2px #38bdf8;
  }

  .palette-legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.5rem;
    padding-top: 0.25rem;
    font-size: 0.72rem;
    color: var(--color-text-muted, #64748b);
  }

  .legend-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .dot--answered {
    background: #0284c7;
  }

  .dot--doubt {
    background: #f59e0b;
  }

  .dot--empty {
    background: #cbd5e1;
  }

  .btn-submit-all {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    border: none;
    background: #059669;
    color: #ffffff;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .btn-submit-all:hover {
    background: #047857;
  }

  /* Modal Konfirmasi Selesai */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 60;
    background: rgba(15, 23, 42, 0.55);
    backdrop-filter: blur(3px);
    display: grid;
    place-items: center;
    padding: 1rem;
  }

  .modal-dialog {
    width: 100%;
    max-width: 440px;
    padding: 1.75rem;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.85rem;
  }

  .modal-dialog__icon {
    display: grid;
    place-items: center;
    width: 54px;
    height: 54px;
    border-radius: 50%;
    background: rgba(2, 132, 199, 0.12);
    color: #0284c7;
  }

  .modal-dialog__title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--color-text, #0f172a);
  }

  .modal-dialog__desc {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.55;
    color: var(--color-text-muted, #475569);
  }

  .modal-dialog__actions {
    display: flex;
    gap: 0.65rem;
    width: 100%;
    margin-top: 0.5rem;
  }

  .btn-modal-cancel {
    flex: 1;
    padding: 0.7rem 0.9rem;
    border-radius: 10px;
    border: 1px solid var(--color-border, #cbd5e1);
    background: var(--color-bg, #f8fafc);
    color: var(--color-text, #334155);
    font-size: 0.825rem;
    font-weight: 700;
    cursor: pointer;
  }

  .btn-modal-confirm {
    flex: 1.3;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.7rem 0.9rem;
    border-radius: 10px;
    border: none;
    background: #0284c7;
    color: #ffffff;
    font-size: 0.825rem;
    font-weight: 700;
    cursor: pointer;
  }

  /* =========================================================================
   * TAHAP 3: HASIL REKAPAN UJIAN
   * ========================================================================= */
  .btn-restart {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.55rem 1rem;
    border-radius: 9px;
    border: none;
    background: #0f172a;
    color: #ffffff;
    font-size: 0.825rem;
    font-weight: 700;
    cursor: pointer;
  }

  .recap-hero {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: 1.5rem;
    padding: 1.75rem;
    background: var(--color-surface, #ffffff);
    border: 1.5px solid var(--color-border, #e2e8f0);
    border-radius: 16px;
    align-items: center;
  }

  .recap-hero--pass {
    border-color: rgba(16, 185, 129, 0.4);
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(2, 132, 199, 0.04) 100%);
  }

  .recap-hero--fail {
    border-color: rgba(245, 158, 11, 0.4);
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(239, 68, 68, 0.04) 100%);
  }

  @media (max-width: 860px) {
    .recap-hero {
      grid-template-columns: 1fr;
    }
  }

  .recap-hero__left {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .recap-hero__badge-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  .recap-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    font-weight: 800;
    color: var(--color-text-muted, #475569);
    letter-spacing: 0.04em;
  }

  .verdict-pill {
    padding: 0.3rem 0.7rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 800;
  }

  .verdict-pill--pass {
    background: rgba(16, 185, 129, 0.15);
    color: #059669;
  }

  .verdict-pill--fail {
    background: rgba(239, 68, 68, 0.15);
    color: #dc2626;
  }

  .recap-score-box {
    display: flex;
    align-items: baseline;
    gap: 1rem;
  }

  .recap-score-box__val {
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    font-weight: 900;
    color: var(--color-text, #0f172a);
    line-height: 1;
  }

  .recap-score-box__meta {
    display: flex;
    flex-direction: column;
    font-size: 0.8rem;
    color: var(--color-text-muted, #64748b);
  }

  .recap-score-box__pass {
    font-weight: 700;
    color: #0284c7;
  }

  .recap-hero__summary {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--color-text, #334155);
  }

  .recap-metrics {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .metric-box {
    padding: 1rem;
    border-radius: 12px;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #e2e8f0);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .metric-box__label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted, #64748b);
  }

  .metric-box__val {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--color-text, #0f172a);
  }

  .metric-box--success .metric-box__val {
    color: #059669;
  }

  .metric-box--danger .metric-box__val {
    color: #dc2626;
  }

  /* Review Section */
  .review-section {
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
  }

  .review-section__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .review-section__title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--color-text, #0f172a);
  }

  .review-section__subtitle {
    margin: 0.2rem 0 0;
    font-size: 0.85rem;
    color: var(--color-text-muted, #64748b);
  }

  .review-filters {
    display: flex;
    gap: 0.45rem;
  }

  .filter-pill {
    padding: 0.45rem 0.85rem;
    border-radius: 999px;
    border: 1px solid var(--color-border, #cbd5e1);
    background: var(--color-surface, #ffffff);
    color: var(--color-text, #334155);
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
  }

  .filter-pill--active {
    background: #0284c7;
    border-color: #0284c7;
    color: #ffffff;
  }

  .review-list {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .review-item {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 1.35rem;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 14px;
  }

  .review-item__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .review-item__badges {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .review-item__num {
    padding: 0.25rem 0.65rem;
    border-radius: 6px;
    background: #0f172a;
    color: #ffffff;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .review-item__cat {
    font-size: 0.78rem;
    font-weight: 700;
    color: #0284c7;
  }

  .verdict-tag {
    padding: 0.25rem 0.65rem;
    border-radius: 6px;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .verdict-tag--ok {
    background: rgba(16, 185, 129, 0.12);
    color: #059669;
  }

  .verdict-tag--warn {
    background: rgba(245, 158, 11, 0.14);
    color: #b45309;
  }

  .review-item__stem {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.65;
    color: var(--color-text, #0f172a);
  }

  .review-item__options {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .review-opt {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.55rem 0.85rem;
    border-radius: 8px;
    border: 1px solid var(--color-border, #e2e8f0);
    font-size: 0.85rem;
  }

  .review-opt--key {
    background: rgba(16, 185, 129, 0.08);
    border-color: #10b981;
  }

  .review-opt--user-wrong {
    background: rgba(245, 158, 11, 0.08);
    border-color: #f59e0b;
  }

  .review-opt__key {
    font-weight: 800;
    width: 22px;
  }

  .review-opt__text {
    flex: 1;
  }

  .review-opt__badge {
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .review-opt__badge--key {
    background: #10b981;
    color: #ffffff;
  }

  .review-opt__badge--user {
    background: #f59e0b;
    color: #ffffff;
  }

  .review-item__explanation {
    padding: 0.85rem 1rem;
    border-radius: 8px;
    background: rgba(2, 132, 199, 0.06);
    border-left: 3px solid #0284c7;
    font-size: 0.85rem;
    line-height: 1.55;
    color: var(--color-text, #334155);
  }
</style>
