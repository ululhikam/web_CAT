<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import AdminIcon from '$lib/components/admin/AdminIcon.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import {
    SIMULATION_PACKETS,
    type SimPacket,
    type SimQuestion,
    type SimBenchmarkItem,
  } from './simulation-packets';
  import { getOptionWeight, getWeightGradeLabel } from './psikotes-scoring';

  // 1. Kategori & Modul Bank Soal
  type CategoryId = 'PSIKOTES' | 'TKK' | 'TPK' | 'ALL';
  type SubtestId = 'ALL' | 'KECERDASAN' | 'KEPRIBADIAN' | 'KECERMATAN';

  let selectedCategoryId = $state<CategoryId>('PSIKOTES');
  let selectedSubtestId = $state<SubtestId>('KECERDASAN');
  let selectedSubCategory = $state<string>('ALL');
  let selectedDifficulty = $state<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');
  let selectedStatus = $state<'ALL' | 'STUDIED' | 'UNSTUDIED' | 'BOOKMARKED'>('ALL');
  let searchQuery = $state<string>('');

  // 2. State Interaksi Pembelajaran (Tanpa Timer, Tanpa Gugur)
  let currentIndex = $state(0);
  let userAnswers = $state<Record<number, string>>({});
  let bookmarkedIds = $state<Record<number, boolean>>({});
  let showExplanationMap = $state<Record<number, boolean>>({});
  let autoShowExplanation = $state(true);

  // 3. Sumber Bank Soal Dasar
  const currentPacket = $derived.by<SimPacket>(() => {
    if (selectedCategoryId === 'PSIKOTES') {
      return (
        SIMULATION_PACKETS.find(
          (p) => p.category === 'PSIKOTES' && p.subtest === selectedSubtestId,
        ) ?? SIMULATION_PACKETS[1] // Kecerdasan default
      );
    }
    return (
      SIMULATION_PACKETS.find((p) => p.category === selectedCategoryId) ??
      SIMULATION_PACKETS[0]
    );
  });

  const baseQuestions = $derived(currentPacket.questions);

  // 4. Daftar Subkategori Unik dari Paket Aktif
  const availableSubCategories = $derived.by<string[]>(() => {
    const set = new Set<string>();
    for (const q of baseQuestions) {
      if (q.subCategory) set.add(q.subCategory);
    }
    return Array.from(set);
  });

  // 5. Soal Terfilter Sesuai Kriteria Pembelajaran
  const filteredQuestions = $derived.by<SimQuestion[]>(() => {
    let list = baseQuestions;

    if (selectedSubCategory !== 'ALL') {
      list = list.filter((q) => q.subCategory === selectedSubCategory);
    }

    if (selectedDifficulty !== 'ALL') {
      list = list.filter((q) => q.difficulty === selectedDifficulty);
    }

    if (selectedStatus === 'STUDIED') {
      list = list.filter((q) => userAnswers[q.id] !== undefined);
    } else if (selectedStatus === 'UNSTUDIED') {
      list = list.filter((q) => userAnswers[q.id] === undefined);
    } else if (selectedStatus === 'BOOKMARKED') {
      list = list.filter((q) => Boolean(bookmarkedIds[q.id]));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.stem.toLowerCase().includes(q) ||
          item.subCategory?.toLowerCase().includes(q) ||
          item.explanation.toLowerCase().includes(q) ||
          item.options.some((opt) => opt.text.toLowerCase().includes(q)),
      );
    }

    return list;
  });

  // Clamp index jika daftar filter berubah
  $effect(() => {
    if (currentIndex >= filteredQuestions.length) {
      currentIndex = Math.max(0, filteredQuestions.length - 1);
    }
  });

  const currentQuestion = $derived<SimQuestion | undefined>(
    filteredQuestions[currentIndex],
  );

  const isKecermatan = $derived(Boolean(currentQuestion?.isKecermatan));
  const isKepribadian = $derived(currentQuestion?.subtest === 'KEPRIBADIAN');

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

  // Metrik Progres Belajar
  const totalBaseQuestions = $derived(baseQuestions.length);
  const studiedBaseCount = $derived(
    baseQuestions.filter((q) => userAnswers[q.id] !== undefined).length,
  );
  const studiedProgressPercent = $derived(
    totalBaseQuestions > 0
      ? Math.round((studiedBaseCount / totalBaseQuestions) * 100)
      : 0,
  );

  const currentAnswer = $derived<string | undefined>(
    currentQuestion ? userAnswers[currentQuestion.id] : undefined,
  );
  const isCurrentBookmarked = $derived<boolean>(
    currentQuestion ? Boolean(bookmarkedIds[currentQuestion.id]) : false,
  );
  const isCurrentExplanationVisible = $derived<boolean>(
    currentQuestion
      ? Boolean(showExplanationMap[currentQuestion.id] || (autoShowExplanation && userAnswers[currentQuestion.id] !== undefined))
      : false,
  );

  // Aksi Pembelajaran
  function selectOption(key: string) {
    if (!currentQuestion) return;
    userAnswers[currentQuestion.id] = key;
    if (autoShowExplanation) {
      showExplanationMap[currentQuestion.id] = true;
    }
  }

  function toggleBookmark() {
    if (!currentQuestion) return;
    bookmarkedIds[currentQuestion.id] = !bookmarkedIds[currentQuestion.id];
  }

  function toggleExplanation() {
    if (!currentQuestion) return;
    showExplanationMap[currentQuestion.id] = !isCurrentExplanationVisible;
  }

  function nextQuestion() {
    if (currentIndex < filteredQuestions.length - 1) {
      currentIndex += 1;
    }
  }

  function prevQuestion() {
    if (currentIndex > 0) {
      currentIndex -= 1;
    }
  }

  function goToQuestion(idx: number) {
    if (idx >= 0 && idx < filteredQuestions.length) {
      currentIndex = idx;
    }
  }

  function resetProgress() {
    if (
      confirm(
        'Apakah Anda yakin ingin mengatur ulang progres belajar modul ini? Riwayat jawaban latihan akan dibersihkan.',
      )
    ) {
      for (const q of baseQuestions) {
        delete userAnswers[q.id];
        delete bookmarkedIds[q.id];
        delete showExplanationMap[q.id];
      }
      currentIndex = 0;
    }
  }

  function switchCategory(cat: CategoryId, sub?: SubtestId) {
    selectedCategoryId = cat;
    if (cat === 'PSIKOTES') {
      selectedSubtestId = sub ?? 'KECERDASAN';
    } else {
      selectedSubtestId = 'ALL';
    }
    selectedSubCategory = 'ALL';
    selectedDifficulty = 'ALL';
    selectedStatus = 'ALL';
    searchQuery = '';
    currentIndex = 0;
  }

  // Keyboard Navigation: A-E atau 1-5 untuk jawab, Arrow untuk navigasi
  function handleKeydown(event: KeyboardEvent) {
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
      nextQuestion();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prevQuestion();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<svelte:head>
  <title>Bank Soal & Pembelajaran CAT Polri — Pretest Mandiri</title>
</svelte:head>

<div class="bank-page">
  <!-- 1. HERO & BANNER UJIAN CAT RESMI -->
  <header class="bank-hero">
    <div class="bank-hero__main">
      <div class="bank-hero__badge-row">
        <span class="hub-badge hub-badge--primary">
          <AdminIcon name="questions" size={14} />
          <span>PRETEST CAT — BANK SOAL PEMBELAJARAN</span>
        </span>
        <span class="hub-badge hub-badge--outline">
          Tanpa Batas Waktu • Kunci &amp; Pembahasan Lengkap
        </span>
      </div>
      <h1 class="bank-hero__title">Bank Soal &amp; Pembelajaran CAT Polri</h1>
      <p class="bank-hero__desc">
        Pusat pembelajaran mandiri untuk mendalami tipe soal, pola figural, denah arah, penalaran numerik, skala sikap mental kepribadian, serta pengetahuan teknis. Dilengkapi kunci jawaban dan pembahasan komprehensif di setiap butir.
      </p>
    </div>

    <!-- BANNER CTA MENUNJUKKAN PERBEDAAN DENGAN TES CAT RESMI -->
    <div class="exam-cta-card">
      <div class="exam-cta-card__content">
        <div class="exam-cta-card__icon">
          <AdminIcon name="shield" size={24} />
        </div>
        <div class="exam-cta-card__text">
          <strong>Siap Menguji Diri dalam Simulasi Nyata?</strong>
          <p>
            Modul <b>TES CAT</b> menyajikan simulasi ujian sesungguhnya dengan batas waktu ketat, sistem gugur, dan penilaian passing grade kelulusan SIP Polri.
          </p>
        </div>
      </div>
      <a class="button button--primary exam-cta-button" href="/exam">
        <span>Masuk ke Simulasi TES CAT</span>
        <AdminIcon name="arrow-right" size={16} />
      </a>
    </div>
  </header>

  <!-- 2. NAVIGASI MODUL PEMBELAJARAN (TAB UTAMA) -->
  <nav class="module-nav" aria-label="Pilih Modul Pembelajaran">
    <button
      type="button"
      class="module-nav__tab"
      class:module-nav__tab--active={selectedCategoryId === 'PSIKOTES' && selectedSubtestId === 'KECERDASAN'}
      onclick={() => switchCategory('PSIKOTES', 'KECERDASAN')}
    >
      <span class="module-nav__icon">🧠</span>
      <div class="module-nav__meta">
        <span class="module-nav__title">Psikotes Kecerdasan</span>
        <span class="module-nav__sub">100 Soal • Figural, Deret, Denah</span>
      </div>
    </button>

    <button
      type="button"
      class="module-nav__tab"
      class:module-nav__tab--active={selectedCategoryId === 'PSIKOTES' && selectedSubtestId === 'KEPRIBADIAN'}
      onclick={() => switchCategory('PSIKOTES', 'KEPRIBADIAN')}
    >
      <span class="module-nav__icon">🛡️</span>
      <div class="module-nav__meta">
        <span class="module-nav__title">Mental Kepribadian</span>
        <span class="module-nav__sub">100 Soal • 10 Aspek Likert 5</span>
      </div>
    </button>

    <button
      type="button"
      class="module-nav__tab"
      class:module-nav__tab--active={selectedCategoryId === 'PSIKOTES' && selectedSubtestId === 'KECERMATAN'}
      onclick={() => switchCategory('PSIKOTES', 'KECERMATAN')}
    >
      <span class="module-nav__icon">⚡</span>
      <div class="module-nav__meta">
        <span class="module-nav__title">Psikotes Kecermatan</span>
        <span class="module-nav__sub">100 Soal • 5 Kolom Monokrom</span>
      </div>
    </button>

    <button
      type="button"
      class="module-nav__tab"
      class:module-nav__tab--active={selectedCategoryId === 'TKK'}
      onclick={() => switchCategory('TKK')}
    >
      <span class="module-nav__icon">💻</span>
      <div class="module-nav__meta">
        <span class="module-nav__title">Kemampuan Komputer (TKK)</span>
        <span class="module-nav__sub">100 Soal • IT &amp; Siber Polri</span>
      </div>
    </button>

    <button
      type="button"
      class="module-nav__tab"
      class:module-nav__tab--active={selectedCategoryId === 'TPK'}
      onclick={() => switchCategory('TPK')}
    >
      <span class="module-nav__icon">📜</span>
      <div class="module-nav__meta">
        <span class="module-nav__title">Pengetahuan Kepolisian (TPK)</span>
        <span class="module-nav__sub">100 Soal • UU 2/2002 &amp; KUHAP</span>
      </div>
    </button>

    <button
      type="button"
      class="module-nav__tab"
      class:module-nav__tab--active={selectedCategoryId === 'ALL'}
      onclick={() => switchCategory('ALL')}
    >
      <span class="module-nav__icon">🌐</span>
      <div class="module-nav__meta">
        <span class="module-nav__title">Semua Bank Soal</span>
        <span class="module-nav__sub">Total 500 Soal Lengkap</span>
      </div>
    </button>
  </nav>

  <!-- 3. FILTER BAR: SUBKATEGORI, KESULITAN, STATUS & PENCARIAN -->
  <section class="filter-panel" aria-label="Filter Bank Soal">
    <div class="filter-panel__top">
      <!-- Search Input -->
      <div class="search-wrap">
        <AdminIcon name="search" size={16} />
        <input
          type="search"
          placeholder="Cari kata kunci materi, pertanyaan, atau konsep..."
          bind:value={searchQuery}
          class="search-input"
        />
        {#if searchQuery}
          <button class="search-clear" type="button" onclick={() => (searchQuery = '')}>×</button>
        {/if}
      </div>

      <!-- Filter Kesulitan -->
      <div class="filter-group">
        <label for="diff-select" class="filter-label">Tingkat Kesulitan:</label>
        <select id="diff-select" bind:value={selectedDifficulty} class="filter-select">
          <option value="ALL">Semua Tingkat</option>
          <option value="EASY">Mudah (Dasar)</option>
          <option value="MEDIUM">Sedang (Menengah)</option>
          <option value="HARD">Sulit (Analisis Lanjut)</option>
        </select>
      </div>

      <!-- Filter Status Belajar -->
      <div class="filter-group">
        <label for="status-select" class="filter-label">Status Soal:</label>
        <select id="status-select" bind:value={selectedStatus} class="filter-select">
          <option value="ALL">Semua Soal ({totalBaseQuestions})</option>
          <option value="STUDIED">Sudah Dipelajari ({studiedBaseCount})</option>
          <option value="UNSTUDIED">Belum Dipelajari ({totalBaseQuestions - studiedBaseCount})</option>
          <option value="BOOKMARKED">Ditandai Bintang</option>
        </select>
      </div>

      <!-- Toggle Selalu Tampilkan Pembahasan -->
      <label class="toggle-control" title="Tampilkan penjelasan otomatis segera setelah menjawab">
        <input type="checkbox" bind:checked={autoShowExplanation} />
        <span class="toggle-slider"></span>
        <span class="toggle-text">Auto Buka Pembahasan</span>
      </label>
    </div>

    <!-- Subkategori Chips -->
    {#if availableSubCategories.length > 0}
      <div class="subcategory-chips">
        <span class="chips-label">Subkategori Materi:</span>
        <button
          type="button"
          class="chip"
          class:chip--active={selectedSubCategory === 'ALL'}
          onclick={() => {
            selectedSubCategory = 'ALL';
            currentIndex = 0;
          }}
        >
          Semua Materi ({baseQuestions.length})
        </button>
        {#each availableSubCategories as subCat}
          {@const count = baseQuestions.filter((q) => q.subCategory === subCat).length}
          <button
            type="button"
            class="chip"
            class:chip--active={selectedSubCategory === subCat}
            onclick={() => {
              selectedSubCategory = subCat;
              currentIndex = 0;
            }}
          >
            {subCat} <span class="chip-count">({count})</span>
          </button>
        {/each}
      </div>
    {/if}
  </section>

  <!-- 4. KONTEN PEMBELAJARAN UTAMA (GRID SOAL & PALET NAVIGASI) -->
  <div class="bank-grid">
    <!-- KOLOM KIRI: SOAL AKTIF & PEMBAHASAN -->
    <main class="question-column">
      {#if filteredQuestions.length === 0}
        <div class="empty-state">
          <div class="empty-state__icon">🔍</div>
          <h3>Tidak Ada Soal yang Sesuai Kriteria</h3>
          <p>Coba sesuaikan kata kunci pencarian atau ubah filter subkategori dan tingkat kesulitan Anda.</p>
          <button
            class="button button--secondary"
            type="button"
            onclick={() => {
              selectedSubCategory = 'ALL';
              selectedDifficulty = 'ALL';
              selectedStatus = 'ALL';
              searchQuery = '';
            }}
          >
            Reset Semua Filter
          </button>
        </div>
      {:else if currentQuestion}
        <article class="study-card">
          <!-- Header Soal: Nomor, Tag Subkategori, Kesulitan & Aksi -->
          <div class="study-card__header">
            <div class="study-card__meta">
              <span class="q-number-badge">
                Soal {currentIndex + 1} dari {filteredQuestions.length}
              </span>
              {#if currentQuestion.subCategory}
                <span class="q-tag-subcat">{currentQuestion.subCategory}</span>
              {/if}
              {#if currentQuestion.difficulty}
                <span
                  class="q-tag-diff"
                  class:q-tag-diff--easy={currentQuestion.difficulty === 'EASY'}
                  class:q-tag-diff--medium={currentQuestion.difficulty === 'MEDIUM'}
                  class:q-tag-diff--hard={currentQuestion.difficulty === 'HARD'}
                >
                  {currentQuestion.difficulty === 'EASY'
                    ? 'Mudah'
                    : currentQuestion.difficulty === 'MEDIUM'
                      ? 'Sedang'
                      : 'Sulit'}
                </span>
              {/if}
            </div>

            <div class="study-card__tools">
              <!-- Bookmark / Tandai Soal -->
              <button
                type="button"
                class="tool-btn"
                class:tool-btn--bookmarked={isCurrentBookmarked}
                onclick={toggleBookmark}
                title={isCurrentBookmarked ? 'Hapus tanda bintang' : 'Tandai soal ini untuk dipelajari lagi'}
              >
                <span>{isCurrentBookmarked ? '★ Ditandai' : '☆ Tandai'}</span>
              </button>

              <!-- Tombol Pembahasan Toggle -->
              <button
                type="button"
                class="tool-btn tool-btn--explanation"
                class:tool-btn--active={isCurrentExplanationVisible}
                onclick={toggleExplanation}
              >
                <AdminIcon name="sparkles" size={14} />
                <span>{isCurrentExplanationVisible ? 'Tutup Pembahasan' : 'Lihat Pembahasan'}</span>
              </button>
            </div>
          </div>

          <!-- TAMPILAN KHUSUS KECERMATAN (BENCHMARK TABLE & POLA TEST) -->
          {#if isKecermatan}
            <div class="kecermatan-study-box">
              <div class="kecermatan-study-box__header">
                <span class="study-badge">Pola Karakter Acuan Kolom {currentQuestion.columnNumber ?? 1}</span>
                <span class="study-note">Pilihlah huruf kolom (A, B, C, D, E) yang karakternya TIDAK terdapat pada baris soal</span>
              </div>

              <!-- Tabel Benchmark Karakter -->
              <div class="benchmark-grid">
                {#each currentBenchmark as item}
                  <div class="benchmark-cell">
                    <span class="benchmark-char">{item.char}</span>
                    <span class="benchmark-label">{item.label}</span>
                  </div>
                {/each}
              </div>

              <!-- Baris Soal yang Diuji -->
              <div class="question-chars-strip">
                <span class="strip-label">Karakter Yang Muncul:</span>
                <div class="strip-chars">
                  {#each currentQuestionChars as char}
                    <span class="char-box">{char}</span>
                  {/each}
                </div>
              </div>
            </div>
          {/if}

          <!-- Teks Pertanyaan / Kasus -->
          <div class="study-stem">
            <p>{currentQuestion.stem}</p>

            <!-- Gambar / Diagram (Jika Ada) -->
            {#if currentQuestion.image}
              <div class="study-image-wrap">
                <img
                  src={currentQuestion.image}
                  alt="Ilustrasi Soal Nomor {currentIndex + 1}"
                  class="study-image"
                  loading="lazy"
                />
              </div>
            {/if}
          </div>

          <!-- DAFTAR OPSI JAWABAN INTERAKTIF -->
          <div class="study-options" role="radiogroup" aria-label="Pilihan Jawaban">
            {#each currentQuestion.options as option}
              {@const isSelected = currentAnswer === option.key}
              {@const isCorrectKey = option.key === currentQuestion.correctKey}
              {@const weight = isKepribadian ? getOptionWeight(currentQuestion, option.key) : undefined}
              {@const revealCorrect = isCurrentExplanationVisible || currentAnswer !== undefined}

              <button
                type="button"
                class="option-row"
                class:option-row--selected={isSelected}
                class:option-row--correct={revealCorrect && isCorrectKey && !isKepribadian}
                class:option-row--wrong={revealCorrect && isSelected && !isCorrectKey && !isKepribadian}
                onclick={() => selectOption(option.key)}
              >
                <div class="option-row__indicator">
                  <span class="option-key">{option.key}</span>
                </div>

                <div class="option-row__text">
                  <span>{option.text}</span>
                  {#if isKepribadian && weight !== undefined && isCurrentExplanationVisible}
                    <span class="kepribadian-weight-pill" class:kepribadian-weight-pill--best={weight === 5}>
                      Bobot Nilai: {weight} dari 5
                    </span>
                  {/if}
                </div>

                <div class="option-row__status">
                  {#if isSelected}
                    <span class="status-pill status-pill--chosen">Pilihan Anda</span>
                  {/if}
                  {#if revealCorrect && isCorrectKey && !isKepribadian}
                    <span class="status-pill status-pill--key">✓ Kunci Resmi</span>
                  {/if}
                </div>
              </button>
            {/each}
          </div>

          <!-- KOTAK PEMBAHASAN MENDALAM (IN-DEPTH EXPLANATION) -->
          {#if isCurrentExplanationVisible}
            <div class="explanation-box" role="region" aria-label="Pembahasan Soal">
              <div class="explanation-box__header">
                <div class="explanation-box__title">
                  <AdminIcon name="sparkles" size={18} />
                  <strong>Pembahasan &amp; Bedah Materi Soal</strong>
                </div>
                <div class="explanation-box__key">
                  {#if isKepribadian}
                    <span class="key-label">Respons Ideal:</span>
                    <strong class="key-val">{currentQuestion.correctKey} (Bobot 5)</strong>
                  {:else}
                    <span class="key-label">Kunci Jawaban Resmi:</span>
                    <strong class="key-val">{currentQuestion.correctKey}</strong>
                  {/if}
                </div>
              </div>

              <div class="explanation-box__body">
                <p>{currentQuestion.explanation}</p>

                {#if isKepribadian && currentQuestion.dimension}
                  <div class="explanation-aspect-note">
                    <span class="aspect-label">Aspek Kompetensi:</span>
                    <strong>{currentQuestion.dimension}</strong>
                    <p class="aspect-desc">
                      Pernyataan ini menilai kematangan mental calon perwira Polri dalam menerapkan etika profesi, objektivitas hukum, dan keteladanan kepemimpinan.
                    </p>
                  </div>
                {/if}
              </div>
            </div>
          {/if}

          <!-- FOOTER NAVIGASI SOAL -->
          <footer class="study-card__footer">
            <button
              class="button button--secondary"
              type="button"
              disabled={currentIndex === 0}
              onclick={prevQuestion}
            >
              <AdminIcon name="chevron" size={16} />
              <span>Soal Sebelumnya</span>
            </button>

            <div class="shortcut-tip">
              Gunakan tombol <b>A–E</b> untuk menjawab • Panah <b>←/→</b> untuk berpindah
            </div>

            <button
              class="button button--primary"
              type="button"
              disabled={currentIndex === filteredQuestions.length - 1}
              onclick={nextQuestion}
            >
              <span>Soal Selanjutnya</span>
              <AdminIcon name="arrow-right" size={16} />
            </button>
          </footer>
        </article>
      {/if}
    </main>

    <!-- KOLOM KANAN: PALET SOAL & PROGRES BELAJAR -->
    <aside class="sidebar-column">
      <div class="sidebar-card">
        <div class="sidebar-card__header">
          <h2 class="sidebar-card__title">Palet Soal Pembelajaran</h2>
          <span class="palette-counter">
            {studiedBaseCount} / {totalBaseQuestions} Dipelajari
          </span>
        </div>

        <!-- Progres Bar Pembelajaran -->
        <div class="progress-wrap">
          <div class="progress-bar">
            <div
              class="progress-bar__fill"
              style="width: {studiedProgressPercent}%"
            ></div>
          </div>
          <div class="progress-text">
            <span>Kemajuan Belajar</span>
            <strong>{studiedProgressPercent}%</strong>
          </div>
        </div>

        <!-- Legenda Palet -->
        <div class="palette-legend">
          <span class="legend-item"><i class="legend-dot legend-dot--studied"></i> Terjawab</span>
          <span class="legend-item"><i class="legend-dot legend-dot--unstudied"></i> Belum</span>
          <span class="legend-item"><i class="legend-dot legend-dot--bookmarked"></i> Ditandai</span>
        </div>

        <!-- Grid Tombol Nomor Soal -->
        <div class="palette-grid">
          {#each filteredQuestions as q, idx (q.id)}
            {@const isAnswered = userAnswers[q.id] !== undefined}
            {@const isMarked = Boolean(bookmarkedIds[q.id])}
            {@const isActive = idx === currentIndex}

            <button
              type="button"
              class="palette-btn"
              class:palette-btn--active={isActive}
              class:palette-btn--studied={isAnswered}
              class:palette-btn--bookmarked={isMarked}
              onclick={() => goToQuestion(idx)}
              title="Soal {idx + 1}: {q.subCategory ?? ''} ({isAnswered ? 'Sudah Dipelajari' : 'Belum Dipelajari'})"
            >
              {idx + 1}
            </button>
          {/each}
        </div>

        <!-- Reset Progres Belajar -->
        <div class="sidebar-actions">
          <button
            type="button"
            class="button-text-danger"
            onclick={resetProgress}
          >
            Bersihkan Progres Belajar Modul Ini
          </button>
        </div>
      </div>

      <!-- KARTU INFORMASI PERBEDAAN PRETEST & TES CAT -->
      <div class="info-guide-card">
        <div class="info-guide-card__head">
          <AdminIcon name="shield" size={18} />
          <strong>Panduan Belajar CAT Polri</strong>
        </div>
        <ul class="info-guide-list">
          <li><b>Pretest CAT:</b> Bebas belajar tanpa batas waktu, ulas pembahasan lengkap, dan pelajari pola trik jawaban.</li>
          <li><b>TES CAT:</b> Simulasi riil CAT Polri dengan timer dinas resmi, sistem gugur, dan penilaian passing grade MS/TMS.</li>
        </ul>
        <a class="button button--secondary button--full" href="/exam">
          Buka Simulasi Ujian CAT →
        </a>
      </div>
    </aside>
  </div>
</div>

<style>
  /* Root Container */
  .bank-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5, 1.25rem);
    width: 100%;
    max-width: 1240px;
    margin: 0 auto;
    padding-bottom: 3rem;
  }

  /* 1. Hero & Banner */
  .bank-hero {
    display: flex;
    flex-direction: column;
    gap: var(--space-4, 1rem);
  }

  .bank-hero__main {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .bank-hero__badge-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  .hub-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.65rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .hub-badge--primary {
    background: rgba(14, 116, 144, 0.12);
    color: #0891b2;
    border: 1px solid rgba(14, 116, 144, 0.25);
  }

  :global([data-theme='dark']) .hub-badge--primary {
    background: rgba(6, 182, 212, 0.15);
    color: #38bdf8;
    border-color: rgba(6, 182, 212, 0.3);
  }

  .hub-badge--outline {
    background: var(--color-surface, #f8fafc);
    color: var(--color-text-muted, #64748b);
    border: 1px solid var(--color-border, #e2e8f0);
  }

  .bank-hero__title {
    margin: 0;
    font-size: clamp(1.5rem, 3.5vw, 2.15rem);
    font-weight: 800;
    color: var(--color-text, #0f172a);
    letter-spacing: -0.02em;
  }

  .bank-hero__desc {
    margin: 0;
    max-width: 78ch;
    font-size: var(--text-sm, 0.925rem);
    line-height: 1.6;
    color: var(--color-text-muted, #475569);
  }

  /* Exam CTA Card */
  .exam-cta-card {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.1rem 1.4rem;
    border-radius: var(--radius-lg, 12px);
    background: linear-gradient(135deg, rgba(30, 58, 138, 0.06) 0%, rgba(14, 116, 144, 0.08) 100%);
    border: 1px solid rgba(14, 116, 144, 0.2);
  }

  :global([data-theme='dark']) .exam-cta-card {
    background: linear-gradient(135deg, rgba(30, 58, 138, 0.25) 0%, rgba(14, 116, 144, 0.2) 100%);
    border-color: rgba(56, 189, 248, 0.25);
  }

  .exam-cta-card__content {
    display: flex;
    align-items: center;
    gap: 1rem;
    max-width: 75ch;
  }

  .exam-cta-card__icon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: #0284c7;
    color: #ffffff;
    flex-shrink: 0;
  }

  .exam-cta-card__text strong {
    display: block;
    font-size: 0.95rem;
    color: var(--color-text, #0f172a);
    margin-bottom: 0.2rem;
  }

  .exam-cta-card__text p {
    margin: 0;
    font-size: 0.85rem;
    color: var(--color-text-muted, #475569);
    line-height: 1.45;
  }

  .exam-cta-button {
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.65rem 1.1rem;
    font-size: 0.875rem;
    font-weight: 600;
  }

  /* 2. Module Nav Tabs */
  .module-nav {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.65rem;
  }

  .module-nav__tab {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: var(--radius-md, 10px);
    cursor: pointer;
    text-align: left;
    transition: all 0.18s ease;
  }

  .module-nav__tab:hover {
    border-color: #0284c7;
    background: var(--color-surface-hover, #f8fafc);
  }

  .module-nav__tab--active {
    border-color: #0284c7;
    background: rgba(2, 132, 199, 0.08);
    box-shadow: 0 0 0 1px #0284c7;
  }

  :global([data-theme='dark']) .module-nav__tab--active {
    background: rgba(2, 132, 199, 0.18);
  }

  .module-nav__icon {
    font-size: 1.5rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .module-nav__meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .module-nav__title {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-text, #0f172a);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .module-nav__sub {
    font-size: 0.75rem;
    color: var(--color-text-muted, #64748b);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* 3. Filter Panel */
  .filter-panel {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 1rem 1.25rem;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: var(--radius-lg, 12px);
  }

  .filter-panel__top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.85rem;
  }

  .search-wrap {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 240px;
    background: var(--color-bg, #f1f5f9);
    border: 1px solid var(--color-border, #cbd5e1);
    border-radius: var(--radius-md, 8px);
    padding: 0 0.75rem;
    color: var(--color-text-muted, #64748b);
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 0.55rem 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text, #0f172a);
    outline: none;
  }

  .search-clear {
    border: none;
    background: transparent;
    font-size: 1.15rem;
    cursor: pointer;
    color: var(--color-text-muted, #64748b);
    padding: 0 0.25rem;
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .filter-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text-muted, #64748b);
    white-space: nowrap;
  }

  .filter-select {
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius-md, 8px);
    border: 1px solid var(--color-border, #cbd5e1);
    background: var(--color-surface, #ffffff);
    color: var(--color-text, #0f172a);
    font-size: 0.825rem;
    font-weight: 500;
    cursor: pointer;
    outline: none;
  }

  /* Toggle Control */
  .toggle-control {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    user-select: none;
    margin-left: auto;
  }

  .toggle-control input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: relative;
    width: 36px;
    height: 20px;
    background-color: var(--color-border, #cbd5e1);
    border-radius: 20px;
    transition: background-color 0.2s ease;
  }

  .toggle-slider::before {
    content: '';
    position: absolute;
    width: 14px;
    height: 14px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.2s ease;
  }

  .toggle-control input:checked + .toggle-slider {
    background-color: #0284c7;
  }

  .toggle-control input:checked + .toggle-slider::before {
    transform: translateX(16px);
  }

  .toggle-text {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text, #0f172a);
  }

  /* Subcategory Chips */
  .subcategory-chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-border, #f1f5f9);
  }

  .chips-label {
    font-size: 0.775rem;
    font-weight: 700;
    color: var(--color-text-muted, #64748b);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-right: 0.25rem;
  }

  .chip {
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 500;
    background: var(--color-bg, #f8fafc);
    border: 1px solid var(--color-border, #e2e8f0);
    color: var(--color-text, #334155);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .chip:hover {
    border-color: #0284c7;
    color: #0284c7;
  }

  .chip--active {
    background: #0284c7;
    border-color: #0284c7;
    color: #ffffff;
    font-weight: 600;
  }

  .chip-count {
    opacity: 0.8;
    font-size: 0.725rem;
  }

  /* 4. Bank Grid Layout */
  .bank-grid {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: var(--space-5, 1.25rem);
    align-items: start;
  }

  @media (max-width: 960px) {
    .bank-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Question Column & Study Card */
  .question-column {
    min-width: 0;
  }

  .study-card {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.5rem;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: var(--radius-lg, 14px);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .study-card__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-bottom: 0.85rem;
    border-bottom: 1px solid var(--color-border, #f1f5f9);
  }

  .study-card__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  .q-number-badge {
    padding: 0.35rem 0.75rem;
    border-radius: var(--radius-md, 8px);
    background: #0f172a;
    color: #ffffff;
    font-size: 0.85rem;
    font-weight: 700;
  }

  :global([data-theme='dark']) .q-number-badge {
    background: #1e293b;
    border: 1px solid #334155;
  }

  .q-tag-subcat {
    padding: 0.3rem 0.65rem;
    border-radius: 999px;
    background: rgba(2, 132, 199, 0.1);
    color: #0284c7;
    font-size: 0.775rem;
    font-weight: 600;
  }

  .q-tag-diff {
    padding: 0.3rem 0.65rem;
    border-radius: 999px;
    font-size: 0.775rem;
    font-weight: 600;
  }

  .q-tag-diff--easy {
    background: rgba(16, 185, 129, 0.12);
    color: #059669;
  }

  .q-tag-diff--medium {
    background: rgba(245, 158, 11, 0.12);
    color: #d97706;
  }

  .q-tag-diff--hard {
    background: rgba(239, 68, 68, 0.12);
    color: #dc2626;
  }

  .study-card__tools {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tool-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.75rem;
    border-radius: var(--radius-md, 8px);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    background: var(--color-bg, #f8fafc);
    border: 1px solid var(--color-border, #cbd5e1);
    color: var(--color-text, #334155);
    transition: all 0.15s ease;
  }

  .tool-btn:hover {
    border-color: #0284c7;
    color: #0284c7;
  }

  .tool-btn--bookmarked {
    background: rgba(245, 158, 11, 0.15);
    border-color: #f59e0b;
    color: #d97706;
  }

  .tool-btn--explanation {
    background: rgba(14, 116, 144, 0.08);
    border-color: rgba(14, 116, 144, 0.25);
    color: #0891b2;
  }

  .tool-btn--explanation.tool-btn--active {
    background: #0891b2;
    border-color: #0891b2;
    color: #ffffff;
  }

  /* Kecermatan Box */
  .kecermatan-study-box {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 1.15rem;
    background: #ffffff;
    color: #000000;
    border: 2px solid #000000;
    border-radius: var(--radius-md, 10px);
  }

  .kecermatan-study-box__header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .study-badge {
    font-size: 0.8rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .study-note {
    font-size: 0.775rem;
    color: #555555;
  }

  .benchmark-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    border: 2px solid #000000;
    text-align: center;
  }

  .benchmark-cell {
    display: flex;
    flex-direction: column;
    border-right: 1px solid #000000;
  }

  .benchmark-cell:last-child {
    border-right: none;
  }

  .benchmark-char {
    padding: 0.5rem 0.25rem;
    font-size: 1.35rem;
    font-weight: 800;
    font-family: monospace;
    border-bottom: 1px solid #000000;
    background: #f8fafc;
  }

  .benchmark-label {
    padding: 0.35rem 0.25rem;
    font-size: 0.95rem;
    font-weight: 800;
    background: #000000;
    color: #ffffff;
  }

  .question-chars-strip {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #f1f5f9;
    border-radius: 8px;
  }

  .strip-label {
    font-size: 0.825rem;
    font-weight: 700;
    color: #000000;
  }

  .strip-chars {
    display: flex;
    gap: 0.5rem;
  }

  .char-box {
    display: inline-grid;
    place-items: center;
    width: 36px;
    height: 36px;
    background: #ffffff;
    border: 2px solid #000000;
    border-radius: 6px;
    font-size: 1.2rem;
    font-weight: 800;
    font-family: monospace;
  }

  /* Stem */
  .study-stem {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    font-size: clamp(1rem, 1.8vw, 1.125rem);
    line-height: 1.65;
    color: var(--color-text, #0f172a);
    font-weight: 500;
  }

  .study-image-wrap {
    max-width: 520px;
    border-radius: var(--radius-md, 10px);
    overflow: hidden;
    border: 1px solid var(--color-border, #cbd5e1);
    background: #ffffff;
  }

  .study-image {
    display: block;
    width: 100%;
    height: auto;
    object-fit: contain;
  }

  /* Options */
  .study-options {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .option-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.9rem 1.15rem;
    border-radius: var(--radius-md, 10px);
    background: var(--color-surface, #ffffff);
    border: 1.5px solid var(--color-border, #e2e8f0);
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;
  }

  .option-row:hover {
    border-color: #0284c7;
    background: var(--color-surface-hover, #f8fafc);
  }

  .option-row--selected {
    border-color: #0284c7;
    background: rgba(2, 132, 199, 0.08);
  }

  .option-row--correct {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.08);
  }

  .option-row--wrong {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.08);
  }

  .option-row__indicator {
    flex-shrink: 0;
  }

  .option-key {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--color-bg, #f1f5f9);
    border: 1px solid var(--color-border, #cbd5e1);
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-text, #0f172a);
  }

  .option-row--selected .option-key {
    background: #0284c7;
    color: #ffffff;
    border-color: #0284c7;
  }

  .option-row--correct .option-key {
    background: #10b981;
    color: #ffffff;
    border-color: #10b981;
  }

  .option-row__text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--color-text, #0f172a);
  }

  .kepribadian-weight-pill {
    display: inline-block;
    width: fit-content;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    background: var(--color-bg, #f1f5f9);
    color: var(--color-text-muted, #475569);
    font-size: 0.75rem;
    font-weight: 600;
  }

  .kepribadian-weight-pill--best {
    background: rgba(16, 185, 129, 0.15);
    color: #059669;
    font-weight: 700;
  }

  .option-row__status {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  .status-pill {
    padding: 0.25rem 0.55rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .status-pill--chosen {
    background: rgba(2, 132, 199, 0.15);
    color: #0284c7;
  }

  .status-pill--key {
    background: rgba(16, 185, 129, 0.15);
    color: #059669;
  }

  /* Explanation Box */
  .explanation-box {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 1.25rem;
    border-radius: var(--radius-md, 10px);
    background: rgba(14, 116, 144, 0.05);
    border: 1px solid rgba(14, 116, 144, 0.25);
  }

  :global([data-theme='dark']) .explanation-box {
    background: rgba(14, 116, 144, 0.15);
    border-color: rgba(56, 189, 248, 0.25);
  }

  .explanation-box__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding-bottom: 0.65rem;
    border-bottom: 1px solid rgba(14, 116, 144, 0.15);
  }

  .explanation-box__title {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    color: #0891b2;
    font-size: 0.95rem;
  }

  .explanation-box__key {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.9rem;
  }

  .key-label {
    color: var(--color-text-muted, #64748b);
  }

  .key-val {
    color: #059669;
    font-weight: 800;
  }

  .explanation-box__body {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    font-size: 0.925rem;
    line-height: 1.6;
    color: var(--color-text, #1e293b);
  }

  .explanation-aspect-note {
    padding: 0.75rem 0.9rem;
    border-radius: 8px;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #e2e8f0);
    font-size: 0.85rem;
  }

  .aspect-label {
    color: var(--color-text-muted, #64748b);
    font-size: 0.775rem;
    text-transform: uppercase;
    font-weight: 700;
    margin-right: 0.25rem;
  }

  .aspect-desc {
    margin: 0.35rem 0 0;
    color: var(--color-text-muted, #475569);
  }

  /* Footer Navigation */
  .study-card__footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border, #f1f5f9);
  }

  .shortcut-tip {
    font-size: 0.8rem;
    color: var(--color-text-muted, #64748b);
  }

  /* Sidebar Column */
  .sidebar-column {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .sidebar-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: var(--radius-lg, 14px);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .sidebar-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .sidebar-card__title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-text, #0f172a);
  }

  .palette-counter {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-primary, #0284c7);
  }

  .progress-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    border-radius: 999px;
    background: var(--color-bg, #f1f5f9);
    overflow: hidden;
  }

  .progress-bar__fill {
    height: 100%;
    background: linear-gradient(90deg, #0284c7 0%, #10b981 100%);
    border-radius: 999px;
    transition: width 0.25s ease;
  }

  .progress-text {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--color-text-muted, #64748b);
  }

  .palette-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0.5rem 0.65rem;
    background: var(--color-bg, #f8fafc);
    border-radius: 8px;
    font-size: 0.75rem;
    color: var(--color-text-muted, #475569);
  }

  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .legend-dot--studied {
    background: #0284c7;
  }

  .legend-dot--unstudied {
    background: #cbd5e1;
  }

  .legend-dot--bookmarked {
    background: #f59e0b;
  }

  /* Palette Grid */
  .palette-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.4rem;
    max-height: 380px;
    overflow-y: auto;
    padding-right: 0.25rem;
  }

  .palette-btn {
    display: grid;
    place-items: center;
    height: 36px;
    border-radius: var(--radius-md, 6px);
    background: var(--color-bg, #f8fafc);
    border: 1px solid var(--color-border, #cbd5e1);
    color: var(--color-text, #334155);
    font-size: 0.825rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.12s ease;
  }

  .palette-btn:hover {
    border-color: #0284c7;
    color: #0284c7;
  }

  .palette-btn--studied {
    background: rgba(2, 132, 199, 0.12);
    border-color: #0284c7;
    color: #0284c7;
  }

  .palette-btn--bookmarked {
    background: rgba(245, 158, 11, 0.18);
    border-color: #f59e0b;
    color: #b45309;
  }

  .palette-btn--active {
    box-shadow: 0 0 0 2px #0f172a;
    font-weight: 800;
  }

  :global([data-theme='dark']) .palette-btn--active {
    box-shadow: 0 0 0 2px #38bdf8;
  }

  .sidebar-actions {
    display: flex;
    justify-content: center;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-border, #f1f5f9);
  }

  .button-text-danger {
    border: none;
    background: transparent;
    color: #dc2626;
    font-size: 0.775rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0.3rem 0.5rem;
  }

  .button-text-danger:hover {
    text-decoration: underline;
  }

  /* Info Guide Card */
  .info-guide-card {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.15rem;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: var(--radius-lg, 12px);
  }

  .info-guide-card__head {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    color: #0284c7;
    font-size: 0.875rem;
  }

  .info-guide-list {
    margin: 0;
    padding-left: 1.15rem;
    font-size: 0.8rem;
    line-height: 1.5;
    color: var(--color-text-muted, #475569);
  }

  .info-guide-list li {
    margin-bottom: 0.45rem;
  }

  .button--full {
    width: 100%;
    justify-content: center;
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.75rem;
    padding: 3rem 1.5rem;
    background: var(--color-surface, #ffffff);
    border: 1px dashed var(--color-border, #cbd5e1);
    border-radius: var(--radius-lg, 14px);
  }

  .empty-state__icon {
    font-size: 2.5rem;
  }

  .empty-state h3 {
    margin: 0;
    font-size: 1.15rem;
  }

  .empty-state p {
    margin: 0;
    max-width: 45ch;
    font-size: 0.875rem;
    color: var(--color-text-muted, #64748b);
  }
</style>
