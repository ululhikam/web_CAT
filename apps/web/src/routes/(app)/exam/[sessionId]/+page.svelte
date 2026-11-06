<script lang="ts">
  import { onDestroy } from 'svelte';
  import { goto, beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { session } from '$lib/stores/session.svelte';
  import { examRunner } from '$lib/stores/examRunner.svelte';
  import { formatDateTime } from '$lib/format';
  import { examQuestionTileView } from '$lib/exams/render-adapter';
  import type { TileMedia } from '$lib/exams/render-adapter';
  import { MediaPrefetcher, planMediaPreload } from '$lib/exams/media-preload';
  import ImageChoiceTiles from '$lib/components/questions/ImageChoiceTiles.svelte';
  import MediaViewer from '$lib/components/media/MediaViewer.svelte';
  import type { ExamQuestion, ExamQuestionOption } from '@webcat/contracts';

  const sessionId = page.params.sessionId ?? '';

  let booted = false;
  let index = $state(0);
  let confirmFinish = $state(false);
  let isFinishing = $state(false);
  let passHandValues = $state<string[]>([]);
  let textAnswer = $state('');
  /** Soal yang ditandai "ragu-ragu" agar mudah ditinjau ulang. */
  let flagged = $state<Set<string>>(new Set());
  let isFullscreen = $state(false);
  let loadedQuestionId: string | null = null;
  let questionShownAt = Date.now();
  let advanceTimer: ReturnType<typeof setTimeout> | null = null;

  // Jeda istirahat antar subtes (5 - 10 Menit)
  let breakMinutes = $state(10);
  let breakRemainingSeconds = $state(10 * 60);
  let breakTimerId: ReturnType<typeof setInterval> | null = null;
  let breakTimerStarted = $state(false);

  function startBreakTimer(minutes: number): void {
    breakMinutes = minutes;
    breakRemainingSeconds = minutes * 60;
    breakTimerStarted = true;
    if (breakTimerId) clearInterval(breakTimerId);
    breakTimerId = setInterval(() => {
      if (breakRemainingSeconds > 0) {
        breakRemainingSeconds -= 1;
      } else {
        if (breakTimerId) {
          clearInterval(breakTimerId);
          breakTimerId = null;
        }
      }
    }, 1000);
  }

  function formatTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /** F5-12 — gambar yang sedang diperbesar; `null` berarti viewer tertutup. */
  let viewerSrc = $state<string | null>(null);
  let viewerAlt = $state('Gambar soal');
  let viewer = $state<{ rememberTrigger: (element: HTMLElement | null) => void } | null>(null);

  /** Buka viewer dari gambar soal/opsi; fokus dikembalikan ke pemicunya. */
  function openViewer(media: TileMedia, trigger?: HTMLElement | null): void {
    viewer?.rememberTrigger(trigger ?? null);
    viewerAlt = media.alt || 'Gambar soal';
    viewerSrc = media.url;
  }

  const question = $derived(examRunner.questions[index] ?? null);
  const subtest = $derived(examRunner.currentSubtest);
  const isKecermatan = $derived(subtest?.subtestCode === 'KECERMATAN');
  const activeColumnIndex = $derived(
    question?.columnIndex !== null && question?.columnIndex !== undefined
      ? question.columnIndex
      : (isKecermatan ? Math.floor(index / 50) : null)
  );
  const activeQuestionInColumn = $derived(
    isKecermatan ? (index % 50) + 1 : null
  );

  const benchmarkLetters = $derived(() => {
    if (!question) return [];
    if (question.options && question.options.length === 5) {
      return question.options.map((opt, i) => ({
        label: optionLetters[i] ?? opt.label,
        char: opt.text || opt.label,
      }));
    }
    const leftStr = (question.missingElement?.left ?? '').replace(/\s+/g, '');
    return leftStr.split('').map((char, i) => ({
      label: optionLetters[i] ?? String.fromCharCode(65 + i),
      char,
    }));
  });

  const questionLetters = $derived(() => {
    if (!question) return [];
    const rightStr = (question.missingElement?.right ?? '').replace(/\s+/g, '');
    return rightStr.split('');
  });

  const isSpeedTest = $derived(
    subtest?.subtestCode === 'KECERMATAN' || subtest?.subtestCode === 'PASS_HAND',
  );
  const timerCritical = $derived(
    examRunner.remainingMs !== null && examRunner.remainingMs <= 60_000,
  );
  const progress = $derived(
    examRunner.totalQuestions === 0
      ? 0
      : Math.round((examRunner.answeredCount / examRunner.totalQuestions) * 100),
  );
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  const currentAnswer = $derived(question ? examRunner.answerOf(question.id) : null);
  const hasAnswer = $derived(
    currentAnswer !== null &&
      ((currentAnswer.optionIds && currentAnswer.optionIds.length > 0) ||
        typeof currentAnswer.value === 'number' ||
        (typeof currentAnswer.text === 'string' && currentAnswer.text.trim().length > 0) ||
        (currentAnswer.values && currentAnswer.values.some((v) => v.trim().length > 0)))
  );

  function clearCurrentAnswer(): void {
    if (!question || examRunner.isLocked) return;
    examRunner.clearAnswer(question.id, elapsed());
    textAnswer = '';
    if (question.type === 'PASS_HAND_COLUMN') {
      passHandValues = Array.from(
        { length: passHandPairCount(question) },
        () => '',
      );
    }
  }

  beforeNavigate(({ cancel, to }) => {
    if (isFinishing || examRunner.isTerminal) return;
    if (to?.url.pathname.startsWith('/results/')) return;
    if (subtest?.status === 'ACTIVE' || subtest?.status === 'READY') {
      cancel();
      alert('Ujian sedang berlangsung! Anda tidak dapat meninggalkan halaman ini sebelum menyelesaikan sesi ujian.');
    }
  });

  /**
   * F3-15 — media soal dibaca lewat adapter yang sama dengan pratinjau admin,
   * lalu digambar oleh `ImageChoiceTiles` yang juga dipakai pratinjau.
   */
  const questionView = $derived(question ? examQuestionTileView(question) : null);

  /**
   * F5-11 — teks seluruh soal sudah ada di memori (`loadQuestions()` mengambil
   * semua halaman saat subtes dibuka), jadi yang masih bisa membuat navigasi
   * berhenti hanya unduhan gambar. Prefetcher menghangatkan media dua soal
   * berikutnya sebelum peserta sampai ke sana.
   */
  const mediaPrefetcher = new MediaPrefetcher();

  $effect(() => {
    if (!session.user || !session.accessToken || booted) return;
    booted = true;
    void boot();
    return () => {
      examRunner.dispose();
    };
  });

  $effect(() => {
    const current = question;
    if (!current || current.id === loadedQuestionId) return;
    loadedQuestionId = current.id;
    questionShownAt = Date.now();
    textAnswer = examRunner.answerOf(current.id)?.text ?? '';
    const saved = examRunner.answerOf(current.id);
    if (current.type === 'PASS_HAND_COLUMN') {
      const count = current.rowCount ?? 0;
      passHandValues = Array.from(
        { length: count },
        (_, position) => saved?.values?.[position] ?? '',
      );
    } else {
      passHandValues = [];
    }
  });

  $effect(() => {
    if (!examRunner.currentSubtest) index = 0;
  });

  /**
   * F5-11: hangatkan gambar soal `index+1` dan `index+2` setiap kali soal
   * berganti. `EXPLANATION` tidak pernah ikut (lihat adapter F3-09), dan URL
   * yang sudah pernah diminta tidak diulang oleh `MediaPrefetcher`.
   */
  let prefetchedSubtestId: string | null = null;
  $effect(() => {
    const subtestId = examRunner.currentSubtest?.id ?? null;
    if (subtestId !== prefetchedSubtestId) {
      prefetchedSubtestId = subtestId;
      mediaPrefetcher.reset();
    }
    mediaPrefetcher.prefetch(planMediaPreload(examRunner.questions, index));
  });

  $effect(() => {
    if (
      subtest?.status === 'READY' &&
      (subtest.subtestCode === 'KECERMATAN' || subtest.orderIndex > 1) &&
      !breakTimerStarted
    ) {
      startBreakTimer(10);
    }
  });

  $effect(() => {
    if (examRunner.sessionStatus === 'COMPLETED' && sessionId && !isFinishing) {
      void goto(`/results/${sessionId}`);
    }
  });

  onDestroy(() => {
    if (advanceTimer) clearTimeout(advanceTimer);
    if (breakTimerId) clearInterval(breakTimerId);
    mediaPrefetcher.reset();
  });

  async function boot(): Promise<void> {
    if (!sessionId) return;
    restoreFlags();
    try {
      const result = await examRunner.loadSession(sessionId);
      examRunner.startTicker();
      attachProctoring();
      if (result.currentSubtest?.status === 'ACTIVE') {
        await examRunner.loadQuestions();
        // Browser hanya mengizinkan fullscreen dari gestur pengguna, jadi
        // permintaan otomatis ini boleh gagal — banner "Layar penuh" tetap
        // tampil sampai peserta menekannya.
        if (!document.fullscreenElement) void enterFullscreen();
      }
    } catch {
      // error sudah dipetakan store
    }
  }

  const flagKey = `exam-flags:${sessionId}`;

  function restoreFlags(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(flagKey);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        flagged = new Set(parsed.filter((entry): entry is string => typeof entry === 'string'));
      }
    } catch {
      // data lokal rusak — abaikan, flag hanya alat bantu peserta
    }
  }

  function persistFlags(next: Set<string>): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(flagKey, JSON.stringify([...next]));
    } catch {
      // penyimpanan penuh/diblokir — tidak menghalangi ujian
    }
  }

  async function openSubtest(): Promise<void> {
    if (breakTimerId) {
      clearInterval(breakTimerId);
      breakTimerId = null;
    }
    breakTimerStarted = false;
    // Anti-kecurangan: layar penuh diminta langsung dari gestur klik peserta,
    // satu-satunya saat browser mengizinkannya.
    await enterFullscreen();
    const result = await examRunner.openCurrentSubtest();
    if (result) index = 0;
  }

  function elapsed(): number {
    return Math.max(0, Date.now() - questionShownAt);
  }

  function advance(): void {
    if (index < examRunner.questions.length - 1) {
      index += 1;
    }
  }

  function goBack(): void {
    if (index > 0) index -= 1;
  }

  function advanceSoon(delay = 120): void {
    if (advanceTimer) clearTimeout(advanceTimer);
    advanceTimer = setTimeout(() => {
      advanceTimer = null;
      advance();
    }, delay);
  }

  function chooseOption(questionItem: ExamQuestion, option: ExamQuestionOption): void {
    if (examRunner.isLocked) return;
    examRunner.recordAnswer(questionItem.id, { optionIds: [option.id] }, elapsed());
    if (
      questionItem.type === 'MISSING_ELEMENT' ||
      questionItem.type === 'LIKERT_STATEMENT' ||
      (isSpeedTest && questionItem.type !== 'PASS_HAND_COLUMN')
    ) {
      advanceSoon();
    }
  }

  function toggleMulti(questionItem: ExamQuestion, option: ExamQuestionOption): void {
    if (examRunner.isLocked) return;
    const selected = new Set(examRunner.answerOf(questionItem.id)?.optionIds ?? []);
    if (selected.has(option.id)) selected.delete(option.id);
    else selected.add(option.id);
    if (selected.size === 0) return;
    examRunner.recordAnswer(questionItem.id, { optionIds: [...selected] }, elapsed());
  }

  function chooseLikert(questionItem: ExamQuestion, value: number): void {
    if (examRunner.isLocked) return;
    examRunner.recordAnswer(questionItem.id, { value }, elapsed());
    advanceSoon();
  }

  function submitMissingText(questionItem: ExamQuestion): void {
    const text = textAnswer.trim();
    if (!text || examRunner.isLocked) return;
    examRunner.recordAnswer(questionItem.id, { text }, elapsed());
    advanceSoon();
  }

  function isChosen(questionItem: ExamQuestion, optionId: string): boolean {
    return examRunner.answerOf(questionItem.id)?.optionIds?.includes(optionId) ?? false;
  }

  function optionText(option: ExamQuestionOption): string {
    return option.text ?? option.label;
  }

  function passHandPairCount(questionItem: ExamQuestion): number {
    return questionItem.rowCount ?? Math.floor(questionItem.rows?.[0]?.length ?? 0);
  }

  function onPassHandInput(questionItem: ExamQuestion, position: number, event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(-1);
    input.value = value;
    const next = [...passHandValues];
    next[position] = value;
    passHandValues = next;

    if (value && position < passHandPairCount(questionItem) - 1) {
      const nextInput = document.getElementById(`ph-${questionItem.id}-${position + 1}`);
      nextInput?.focus();
    }

    if (next.length > 0 && next.every((entry) => entry !== '')) {
      examRunner.recordAnswer(questionItem.id, { values: next }, elapsed());
      advanceSoon(160);
    }
  }

  function toggleFlag(): void {
    if (!question) return;
    const next = new Set(flagged);
    if (next.has(question.id)) next.delete(question.id);
    else next.add(question.id);
    flagged = next;
    persistFlags(next);
  }

  async function finish(force = false): Promise<void> {
    isFinishing = true;
    const result = await examRunner.finishSubtest(force);
    if (!result) {
      isFinishing = false;
      return;
    }
    confirmFinish = false;
    index = 0;
    if (!result.session) return;
    if (
      result.session.status === 'COMPLETED' ||
      result.session.status === 'ELIMINATED' ||
      result.session.status === 'EXPIRED' ||
      result.session.status === 'ABANDONED'
    ) {
      await goto(`/results/${result.session.id}`);
      return;
    }
    if (!result.currentSubtest) {
      await goto(`/results/${result.session.id}`);
    }
  }

  async function enterFullscreen(): Promise<void> {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    } catch {
      // browser menolak; bukan kegagalan ujian
    }
  }

  /* --------------------------------------------------------------- proctoring */

  let detach: (() => void) | null = null;

  function attachProctoring(): void {
    if (detach) return;

    isFullscreen = Boolean(document.fullscreenElement);

    const onVisibility = () => {
      examRunner.pushEvent(document.hidden ? 'TAB_BLUR' : 'TAB_FOCUS');
      // F5-10: saat tab disembunyikan, kirim antrean lebih dulu — tab bisa
      // dibuang OS tanpa sempat memicu `beforeunload`.
      if (document.hidden) void examRunner.flush();
    };
    // Anti-kecurangan: salin/tempel/ potong benar-benar diblokir, bukan hanya
    // dicatat. Event tetap dikirim server agar pelanggaran terlihat di
    // monitoring.
    const onCopy = (event: Event) => {
      event.preventDefault();
      examRunner.pushEvent('COPY');
    };
    const onPaste = (event: Event) => {
      event.preventDefault();
      examRunner.pushEvent('PASTE');
    };
    const onCut = (event: Event) => {
      event.preventDefault();
      examRunner.pushEvent('CUT');
    };
    const onDragStart = (event: DragEvent) => {
      event.preventDefault();
    };
    const onContext = (event: MouseEvent) => {
      event.preventDefault();
      examRunner.pushEvent('CONTEXT_MENU');
    };
    const onFullscreen = () => {
      isFullscreen = Boolean(document.fullscreenElement);
      examRunner.pushEvent(isFullscreen ? 'FULLSCREEN_ENTER' : 'FULLSCREEN_EXIT');
    };
    const onResize = () => examRunner.pushEvent('WINDOW_RESIZED');
    const onKeydown = (event: KeyboardEvent) => {
      // Blokir pintasan salin/tempel/cetak meskipun fokus ada di input.
      const accel = event.ctrlKey || event.metaKey;
      if (accel && ['c', 'v', 'x'].includes(event.key.toLowerCase())) {
        event.preventDefault();
        examRunner.pushEvent(
          event.key.toLowerCase() === 'v'
            ? 'PASTE'
            : event.key.toLowerCase() === 'c'
              ? 'COPY'
              : 'CUT',
        );
        return;
      }
      if (event.key === 'PrintScreen') {
        // Sebagian besar browser mengabaikan preventDefault di sini, tetapi
        // pencatatan tetap berguna untuk monitoring.
        examRunner.pushEvent('COPY');
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        advance();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goBack();
        return;
      }
      if (event.key === 'Delete') {
        event.preventDefault();
        clearCurrentAnswer();
        return;
      }
      if (!question || examRunner.isLocked) return;

      if (question.type === 'LIKERT_STATEMENT' && /^[1-5]$/.test(event.key)) {
        event.preventDefault();
        chooseLikert(question, Number(event.key));
        return;
      }

      if (
        question.type === 'SINGLE_CHOICE' ||
        question.type === 'IMAGE_CHOICE' ||
        question.type === 'MULTI_CHOICE' ||
        question.type === 'MISSING_ELEMENT'
      ) {
        const upper = event.key.toUpperCase();
        const byLabel = question.options.find((option) => option.label.toUpperCase() === upper);
        const byIndex = question.options[Number(event.key) - 1];
        const option = byLabel ?? byIndex;
        if (option) {
          event.preventDefault();
          if (question.type === 'MULTI_CHOICE') toggleMulti(question, option);
          else chooseOption(question, option);
        }
      }
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      examRunner.keepaliveFlush();
      if (!examRunner.isLocked && !examRunner.isTerminal) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    // F5-10: `beforeunload` tidak selalu jalan di mobile (Safari/Chrome Android).
    // `pagehide` dipakai sebagai jalur kedua agar antrean tetap dikirim.
    const onPageHide = () => {
      examRunner.keepaliveFlush();
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    document.addEventListener('cut', onCut);
    document.addEventListener('dragstart', onDragStart);
    document.addEventListener('contextmenu', onContext);
    document.addEventListener('fullscreenchange', onFullscreen);
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKeydown);
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('pagehide', onPageHide);

    detach = () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('dragstart', onDragStart);
      document.removeEventListener('contextmenu', onContext);
      document.removeEventListener('fullscreenchange', onFullscreen);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeydown);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('pagehide', onPageHide);
    };
  }

  const LOCK_LABELS: Record<string, string> = {
    TIME_EXPIRED: 'Waktu subtes habis',
    ELIMINATED: 'Sesi dinyatakan gugur',
    VIOLATION: 'Subtes dikunci karena pelanggaran',
    MANUAL_SUPER_ADMIN: 'Subtes dikunci oleh admin',
    PREVIOUS_FAILED: 'Subtes sebelumnya tidak lulus',
  };
</script>

<svelte:head>
  <title>{subtest?.name ?? 'Ujian'} - TES CAT</title>
</svelte:head>

{#if !session.user}
  <div class="center"><Spinner size={28} label="Memeriksa sesi" /></div>
{:else if examRunner.loading && !examRunner.active}
  <div class="center"><Spinner size={28} label="Memuat sesi ujian" /></div>
{:else if !examRunner.active}
  <div class="page">
    <Alert tone="danger" title="Sesi tidak dapat dimuat">
      {examRunner.error ?? 'Sesi ujian tidak ditemukan.'}
    </Alert>
    <Button href="/exam">Kembali ke halaman ujian</Button>
  </div>
{:else}
  <div class="page" class:page--wide={subtest?.status === 'ACTIVE'}>
    <!-- TOPBAR UJIAN CAT (Mandiri & Fokus Penuh) -->
    <header class="cat-exam-bar">
      <div class="cat-exam-bar__left">
        <div class="cat-exam-badge">TES CAT</div>
        <div class="cat-exam-title">
          <span class="cat-exam-title__main">SISTEM UJIAN CAT TERPADU</span>
          <span class="cat-exam-title__sub">
            {examRunner.active?.currentStageCode ?? 'SIMULASI'} • {subtest?.name ?? 'Sesi Ujian'}
          </span>
        </div>
      </div>

      <div class="cat-exam-bar__right">
        <div class="cat-exam-user">
          <span class="cat-exam-user__label">Peserta:</span>
          <span class="cat-exam-user__name">{session.user?.fullName ?? 'Peserta'}</span>
        </div>
        <button
          type="button"
          class="cat-exam-btn-fullscreen"
          onclick={enterFullscreen}
          title="Beralih ke mode layar penuh"
        >
          {isFullscreen ? '⤢ Layar Penuh' : '⛶ Layar Penuh'}
        </button>
      </div>
    </header>
    {#if examRunner.error}
      <Alert tone="danger" title="Perhatian" onclose={() => (examRunner.error = null)}>
        {examRunner.error}
      </Alert>
    {/if}

    {#if examRunner.notice}
      <Alert
        tone="warning"
        title="Sebagian jawaban ditolak"
        onclose={() => (examRunner.notice = null)}
      >
        {examRunner.notice}
      </Alert>
    {/if}

    {#if examRunner.warning}
      <Alert
        tone="warning"
        title="Peringatan proctoring"
        onclose={() => (examRunner.warning = null)}
      >
        {examRunner.warning}
      </Alert>
    {/if}

    {#if examRunner.isTerminal}
      <Card title="Sesi ujian selesai" elevated>
        <p class="muted">
          Status sesi: <strong>{examRunner.sessionStatus}</strong>. Hasil lengkap dan catatan
          pelanggaran tersedia di halaman hasil.
        </p>
        <div class="actions">
          <Button href={`/results/${examRunner.sessionId}`}>Lihat hasil</Button>
          <Button variant="secondary" href="/history">Riwayat ujian</Button>
        </div>
      </Card>
    {:else if !subtest}
      <Card title="Semua subtes sudah diproses" elevated>
        <p class="muted">
          Tidak ada subtes aktif. Bila sesi belum selesai, server sedang menyelesaikan penilaian.
        </p>
        <div class="actions">
          <Button href={`/results/${examRunner.sessionId}`}>Lihat hasil</Button>
          <Button variant="secondary" onclick={() => void examRunner.loadSession(sessionId)}>
            Muat ulang
          </Button>
        </div>
      </Card>
    {:else if subtest.status === 'READY'}
      {#if isKecermatan || subtest.orderIndex > 1}
        <div class="jeda-card">
          <div class="jeda-card__badge">
            <span class="jeda-badge-pulse"></span>
            WAKTU JEDA ISTIRAHAT
          </div>
          <h2 class="jeda-card__title">Istirahat Antar Subtes (5 - 10 Menit)</h2>
          <p class="jeda-card__subtitle">
            Subtes 1 telah selesai. Gunakan waktu jeda ini untuk mengistirahatkan mata dan melemaskan otot tangan sebelum memulai subtes berikutnya. Anda dapat memilih waktu jeda 5–10 menit atau langsung menekan tombol <strong>Kerjakan Sekarang</strong> bila sudah siap.
          </p>

          <div class="jeda-timer-box">
            <div class="jeda-timer-label">Sisa Waktu Istirahat</div>
            <div
              class="jeda-timer-display"
              class:jeda-timer-display--ended={breakRemainingSeconds === 0}
            >
              {formatTime(breakRemainingSeconds)}
            </div>
            <div class="jeda-timer-options">
              <span class="jeda-timer-opt-title">Pilihan Durasi Jeda:</span>
              <button
                type="button"
                class="jeda-opt-btn"
                class:jeda-opt-btn--active={breakMinutes === 5}
                onclick={() => startBreakTimer(5)}
              >
                5 Menit
              </button>
              <button
                type="button"
                class="jeda-opt-btn"
                class:jeda-opt-btn--active={breakMinutes === 10}
                onclick={() => startBreakTimer(10)}
              >
                10 Menit
              </button>
            </div>
          </div>

          <div class="jeda-briefing">
            <h3 class="jeda-briefing__title">
              📋 Petunjuk Subtes Berikutnya: {subtest.name}
            </h3>
            <div class="jeda-briefing__grid">
              <div class="jeda-briefing__item">
                <span class="jeda-briefing__lbl">Total Soal</span>
                <span class="jeda-briefing__val">500 Soal (10 Kolom × 50 Soal)</span>
              </div>
              <div class="jeda-briefing__item">
                <span class="jeda-briefing__lbl">Alokasi Waktu</span>
                <span class="jeda-briefing__val">10 Menit (1 Menit per Kolom)</span>
              </div>
              <div class="jeda-briefing__item">
                <span class="jeda-briefing__lbl">Karakter</span>
                <span class="jeda-briefing__val">Huruf Kapital (A - Z)</span>
              </div>
              <div class="jeda-briefing__item">
                <span class="jeda-briefing__lbl">Format Tes</span>
                <span class="jeda-briefing__val">Kecermatan Huruf Hilang</span>
              </div>
            </div>
            <ul class="jeda-briefing__list">
              <li>Terdapat <strong>10 kolom</strong>, masing-masing berdurasi <strong>1 menit</strong> dengan <strong>50 soal</strong> per kolom.</li>
              <li>Setiap kolom memiliki <strong>5 huruf rujukan (A, B, C, D, E)</strong>.</li>
              <li>Perhatikan 4 huruf pada setiap soal, lalu pilih <strong>1 huruf yang hilang</strong> dari kelompok rujukan secepat mungkin.</li>
              <li>Anda dapat menggunakan tombol mouse atau tombol keyboard <strong>A, B, C, D, E</strong> (atau angka <strong>1 - 5</strong>) untuk menjawab cepat.</li>
              <li>Setelah subtes kecermatan ini selesai, hasil akhir ujian akan langsung ditampilkan.</li>
            </ul>
          </div>

          <div class="jeda-actions">
            <Button size="lg" loading={examRunner.loading} onclick={openSubtest}>
              ⚡ Kerjakan Sekarang (Mulai Subtes Kecermatan)
            </Button>
            <Button variant="secondary" onclick={enterFullscreen}>
              {isFullscreen ? 'Mode Layar Penuh Aktif' : 'Masuk Layar Penuh'}
            </Button>
          </div>
        </div>
      {:else}
        <Card
          title={`Siap memulai: ${subtest.name}`}
          description="Timer belum berjalan sampai Anda membuka subtes."
          elevated
        >
          <dl class="facts">
            <div>
              <dt>Jumlah soal</dt>
              <dd>{subtest.questionCount}</dd>
            </div>
            <div>
              <dt>Strategi penilaian</dt>
              <dd class="mono">{subtest.scoringStrategy}</dd>
            </div>
            <div>
              <dt>Subtes ke</dt>
              <dd>{subtest.orderIndex}</dd>
            </div>
          </dl>
          <p class="muted">
            Setelah dibuka, timer berjalan di server dan tidak dapat dijeda. Pastikan koneksi stabil
            dan Anda siap mengerjakan seluruh subtes ini.
          </p>
          <div class="actions">
            <Button loading={examRunner.loading} onclick={openSubtest}
              >Buka subtes &amp; mulai timer</Button
            >
            <Button variant="secondary" onclick={enterFullscreen}>Masuk layar penuh</Button>
          </div>
        </Card>
      {/if}
    {:else if examRunner.isLocked || examRunner.isExpired}
      <Card
        title={LOCK_LABELS[examRunner.lockedReason ?? 'TIME_EXPIRED'] ?? 'Subtes terkunci'}
        elevated
      >
        <p class="muted">
          Jawaban berikutnya tidak diterima server. Jawaban yang sudah tersimpan tetap dinilai.
        </p>
        {#if examRunner.nextSubtest}
          <p class="muted">
            Subtes berikutnya: <strong>{examRunner.nextSubtest.name}</strong>.
          </p>
          <div class="actions">
            <Button onclick={() => void examRunner.loadSession(sessionId)}
              >Muat status terbaru</Button
            >
            <Button variant="secondary" href={`/results/${examRunner.sessionId}`}
              >Hasil sementara</Button
            >
          </div>
        {:else}
          <div class="actions">
            <Button onclick={() => void examRunner.loadSession(sessionId)}
              >Muat status terbaru</Button
            >
            <Button variant="secondary" href={`/results/${examRunner.sessionId}`}
              >Lihat hasil</Button
            >
          </div>
        {/if}
      </Card>
    {:else if subtest.status === 'ACTIVE'}
      <div class="runner">
        <!-- KIRI / UTAMA: soal + jawaban + navigasi bawah -->
        <main class="runner__main">
          <header class="runner__header">
            <div class="runner__identity">
              <p class="runner__stage">{examRunner.active?.currentStageCode ?? 'UJIAN'}</p>
              <h1 class="runner__title">{subtest.name}</h1>
              <p class="muted">
                Soal {Math.min(index + 1, examRunner.totalQuestions)} dari {examRunner
                  .totalQuestions} · terjawab
                {examRunner.answeredCount}
              </p>
            </div>

            <div
              class="runner__timer"
              class:runner__timer--critical={timerCritical}
              aria-live="polite"
            >
              <span class="runner__timer-label">Sisa waktu</span>
              <span class="runner__timer-value">{examRunner.remainingLabel}</span>
            </div>
          </header>

          <div
            class="progress"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={progress}
          >
            <span class="progress__bar" style={`width:${progress}%`}></span>
          </div>

          <div class="statusline">
            <span class:statusline__offline={!examRunner.connected}>
              {#if examRunner.saving}
                Menyimpan...
              {:else if examRunner.pendingCount > 0}
                {examRunner.pendingCount} jawaban menunggu terkirim
              {:else if examRunner.lastSavedAt}
                Tersimpan {formatDateTime(new Date(examRunner.lastSavedAt).toISOString())}
              {:else}
                Autosave aktif
              {/if}
            </span>
            <span>{examRunner.connected ? 'Terhubung' : 'Offline'}</span>
          </div>

          {#if !isFullscreen}
            <div class="fullscreen-note">
              <span>Ujian sebaiknya dikerjakan dalam mode layar penuh.</span>
              <Button variant="secondary" size="sm" onclick={enterFullscreen}>Layar penuh</Button>
            </div>
          {/if}

          {#if examRunner.restoredCount > 0 && examRunner.pendingCount > 0}
            <!--
              F5-10: jawaban dari IndexedDB sudah tampil lagi setelah halaman
              dimuat ulang. Indikator hilang sendiri setelah semua ter-ACK.
            -->
            <p class="muted restored">
              {examRunner.restoredCount} jawaban dipulihkan dari perangkat dan sedang dikirim ulang.
            </p>
          {/if}

      {#if examRunner.loadingQuestions}
        <div class="center"><Spinner size={26} label="Memuat soal" /></div>
      {:else if !question}
        <Card title="Soal tidak tersedia">
          <p class="muted">Server belum mengirim soal untuk subtes ini.</p>
          <Button onclick={() => void examRunner.loadQuestions()}>Muat soal</Button>
        </Card>
      {:else}
        <article class="question" aria-live="polite">
          <header class="question__header">
            <Badge tone="brand">Soal {index + 1} / {examRunner.totalQuestions}</Badge>
            {#if isKecermatan}
              <Badge tone="info">Kolom {(activeColumnIndex ?? 0) + 1} dari 10</Badge>
              {#if activeQuestionInColumn}
                <Badge tone="neutral">Soal {activeQuestionInColumn} / 50 di Kolom Ini</Badge>
              {/if}
            {:else}
              <Badge tone="neutral">{question.type.replaceAll('_', ' ')}</Badge>
              {#if question.columnIndex !== null}
                <Badge tone="info">Kolom {question.columnIndex + 1}</Badge>
              {/if}
            {/if}
          </header>

          {#if question.stemFormat === 'HTML'}
            <div class="question__stem">{@html question.stem}</div>
          {:else}
            <p class="question__stem">{question.stem}</p>
          {/if}

          {#each questionView?.stemMedia ?? [] as media (media.url)}
            <!-- F5-12: klik gambar membuka viewer zoom/pan layar penuh. -->
            <button
              type="button"
              class="question__media"
              aria-label={`Perbesar gambar: ${media.alt || 'Gambar soal'}`}
              title="Klik untuk memperbesar"
              onclick={(event) => openViewer(media, event.currentTarget)}
            >
              <img src={media.url} alt={media.alt || 'Gambar soal'} />
            </button>
          {/each}

          {#if question.type === 'IMAGE_CHOICE'}
            <!--
              Soal figural: peserta memilih GAMBAR, bukan teks. Komponen tile
              dipakai bersama pratinjau admin (F3-15) sehingga placeholder dan
              tata letaknya tidak bisa berbeda antar layar.
            -->
            <ImageChoiceTiles
              options={questionView?.options ?? []}
              letters={optionLetters}
              isActive={(option) => option.id !== null && isChosen(question, option.id)}
              onselect={(option) => {
                const target = question.options.find((entry) => entry.label === option.label);
                if (target) chooseOption(question, target);
              }}
              onzoom={(media, trigger) => openViewer(media, trigger)}
            />
          {:else if question.type === 'PASS_HAND_COLUMN'}
            <div class="passhand">
              <p class="passhand__hint">
                Jumlahkan angka atas dan bawah, lalu tulis digit terakhir (0-9).
              </p>
              <div class="passhand__grid" style={`--rows:${passHandPairCount(question)}`}>
                {#each Array.from({ length: passHandPairCount(question) }, (_, position) => position) as position (position)}
                  <div class="passhand__cell">
                    <span class="passhand__top">{question.rows?.[0]?.[position] ?? '-'}</span>
                    <span class="passhand__bottom">{question.rows?.[1]?.[position] ?? '-'}</span>
                    <input
                      id={`ph-${question.id}-${position}`}
                      class="passhand__input"
                      inputmode="numeric"
                      autocomplete="off"
                      maxlength="1"
                      aria-label={`Jawaban pasangan ${position + 1}`}
                      value={passHandValues[position] ?? ''}
                      oninput={(event) => onPassHandInput(question, position, event)}
                    />
                  </div>
                {/each}
              </div>
            </div>
          {:else if question.type === 'LIKERT_STATEMENT'}
            <div class="likert" role="group" aria-label="Skala jawaban">
              {#each question.options as option (option.id)}
                <button
                  type="button"
                  class="likert__option"
                  class:likert__option--active={examRunner.answerOf(question.id)?.value ===
                    Number(option.label)}
                  onclick={() => chooseLikert(question, Number(option.label))}
                >
                  <span class="likert__value">{option.label}</span>
                  <span class="likert__label">
                    {option.label === '1'
                      ? 'Sangat tidak setuju'
                      : option.label === '2'
                        ? 'Tidak setuju'
                        : option.label === '3'
                          ? 'Netral'
                          : option.label === '4'
                            ? 'Setuju'
                            : 'Sangat setuju'}
                  </span>
                </button>
              {/each}
            </div>
          {:else if question.type === 'MULTI_CHOICE'}
            <div class="options" role="group" aria-label="Pilih satu atau lebih jawaban">
              {#each question.options as option, optionIndex (option.id)}
                <label class="option" class:option--active={isChosen(question, option.id)}>
                  <input
                    type="checkbox"
                    checked={isChosen(question, option.id)}
                    onchange={() => toggleMulti(question, option)}
                  />
                  <span class="option__key">{optionLetters[optionIndex] ?? option.label}</span>
                  <span class="option__text">
                    {optionText(option)}
                    {#each option.media as media (media.url)}
                      <img
                        class="option__media"
                        src={media.url}
                        alt={media.alt ?? `Gambar opsi ${option.label}`}
                        loading="lazy"
                      />
                    {/each}
                  </span>
                </label>
              {/each}
            </div>
            <div class="actions">
              <Button variant="secondary" onclick={advance}>Simpan &amp; lanjut</Button>
            </div>
          {:else if question.type === 'MISSING_ELEMENT' && question.options.length > 0}
            <div class="kecermatan-container">
              <!-- TABEL RUJUKAN HURUF KOLOM -->
              <div class="kecermatan-benchmark">
                <div class="kecermatan-benchmark__header">
                  <span class="kecermatan-benchmark__col-title">
                    HURUF RUJUKAN KOLOM {(activeColumnIndex ?? 0) + 1}
                  </span>
                </div>
                <div class="kecermatan-benchmark__grid">
                  {#each benchmarkLetters() as item}
                    <div class="kecermatan-benchmark__cell">
                      <span class="kecermatan-benchmark__opt">{item.label}</span>
                      <span class="kecermatan-benchmark__char">{item.char}</span>
                    </div>
                  {/each}
                </div>
              </div>

              <!-- SOAL: HURUF YANG HILANG -->
              <div class="kecermatan-question-box">
                <span class="kecermatan-question-label">Soal: Tentukan 1 Huruf yang Hilang</span>
                <div class="kecermatan-question-row">
                  {#each questionLetters() as char}
                    <span class="kecermatan-char-tile">{char}</span>
                  {/each}
                  <span class="kecermatan-char-tile kecermatan-char-tile--missing">?</span>
                </div>
              </div>

              <!-- PILIHAN JAWABAN (A, B, C, D, E) -->
              <div
                class="options options--compact kecermatan-options-grid"
                role="group"
                aria-label="Pilih karakter yang hilang"
              >
                {#each question.options as option, optionIndex (option.id)}
                  <button
                    type="button"
                    class="option option--button kecermatan-opt-btn"
                    class:option--active={isChosen(question, option.id)}
                    onclick={() => chooseOption(question, option)}
                  >
                    <span class="option__key">{optionLetters[optionIndex] ?? option.label}</span>
                    <span class="option__text mono kecermatan-opt-char">
                      {optionText(option)}
                    </span>
                  </button>
                {/each}
              </div>
            </div>
          {:else if question.type === 'MISSING_ELEMENT'}
            <div class="missing">
              <p class="missing__arrays">
                <span class="mono">{question.missingElement?.left}</span>
                <span class="muted">menjadi</span>
                <span class="mono">{question.missingElement?.right}?</span>
              </p>
              <form
                class="missing__form"
                onsubmit={(event) => {
                  event.preventDefault();
                  submitMissingText(question);
                }}
              >
                <input
                  class="input"
                  bind:value={textAnswer}
                  maxlength="4"
                  autocomplete="off"
                  aria-label="Karakter yang hilang"
                  placeholder="Karakter"
                />
                <Button type="submit" disabled={!textAnswer.trim()}>Simpan &amp; lanjut</Button>
              </form>
            </div>
          {:else}
            <div class="options" role="group" aria-label="Pilih jawaban">
              {#each question.options as option, optionIndex (option.id)}
                <button
                  type="button"
                  class="option option--button"
                  class:option--active={isChosen(question, option.id)}
                  onclick={() => chooseOption(question, option)}
                >
                  <span class="option__key">{optionLetters[optionIndex] ?? option.label}</span>
                  <span class="option__text">
                    {optionText(option)}
                    {#each option.media as media (media.url)}
                      <img
                        class="option__media"
                        src={media.url}
                        alt={media.alt ?? `Gambar opsi ${option.label}`}
                        loading="lazy"
                      />
                    {/each}
                  </span>
                </button>
              {/each}
            </div>
          {/if}
        </article>

          <footer class="runner__footer">
            <div class="runner__nav runner__nav--start">
              <Button variant="secondary" disabled={index === 0} onclick={goBack}>Sebelumnya</Button>
            </div>
            <div class="runner__nav runner__nav--center">
              <Button
                variant={question && flagged.has(question.id) ? 'success' : 'ghost'}
                onclick={toggleFlag}
                title="Tandai soal ini untuk ditinjau ulang"
              >
                {question && flagged.has(question.id) ? 'Ragu-ragu ✓' : 'Ragu-ragu'}
              </Button>
              <Button
                variant="danger"
                disabled={!hasAnswer}
                onclick={clearCurrentAnswer}
                title="Hapus jawaban yang dipilih pada nomor ini"
              >
                Hapus Jawaban
              </Button>
            </div>
            <div class="runner__nav runner__nav--end">
              {#if index < examRunner.questions.length - 1}
                <Button
                  variant="secondary"
                  onclick={advance}
                >
                  Selanjutnya
                </Button>
              {:else if examRunner.nextSubtest}
                <Button
                  variant="primary"
                  onclick={() => (confirmFinish = true)}
                >
                  Lanjut ke {examRunner.nextSubtest.name} →
                </Button>
              {:else}
                <Button
                  variant="danger"
                  onclick={() => (confirmFinish = true)}
                >
                  Selesaikan Ujian
                </Button>
              {/if}
            </div>
          </footer>
        {/if}
        </main>

        <!-- KANAN: Daftar nomor soal + Akhiri sesi + Urutan tes -->
        <aside class="runner__side runner__side--right" aria-label="Daftar soal dan info ujian">
          <div class="palette-card">
            <header class="palette-card__head">
              <div>
                <h2 class="palette-card__title">Daftar Soal</h2>
                <span class="palette-card__sub">Pilih nomor untuk membuka soal</span>
              </div>
              <span class="palette-card__count">
                {examRunner.answeredCount}/{examRunner.totalQuestions}
              </span>
            </header>
            <div class="palette">
              {#each examRunner.questions as entry, entryIndex (entry.id)}
                {@const isAns = examRunner.answerOf(entry.id) !== null}
                {@const isCur = entryIndex === index}
                {@const isFlg = flagged.has(entry.id)}
                <button
                  type="button"
                  class="palette__item"
                  class:palette__item--current={isCur}
                  class:palette__item--answered={isAns}
                  class:palette__item--flagged={isFlg}
                  aria-current={isCur ? 'true' : undefined}
                  onclick={() => (index = entryIndex)}
                  title={`Soal nomor ${entryIndex + 1}${isAns ? ' (Sudah dijawab)' : ''}${isFlg ? ' (Ragu-ragu)' : ''}`}
                >
                  {entryIndex + 1}
                </button>
              {/each}
            </div>
            <ul class="legend">
              <li><span class="dot dot--current"></span>Dikerjakan sekarang</li>
              <li><span class="dot dot--answered"></span>Sudah dijawab</li>
              <li><span class="dot dot--flagged"></span>Ragu-ragu</li>
              <li><span class="dot dot--unanswered"></span>Belum dijawab</li>
            </ul>
          </div>

          {#if examRunner.nextSubtest}
            <Button variant="primary" fullWidth onclick={() => (confirmFinish = true)}>
              Lanjut ke {examRunner.nextSubtest.name} →
            </Button>
          {:else}
            <Button variant="danger" fullWidth onclick={() => (confirmFinish = true)}>
              Selesaikan Ujian
            </Button>
          {/if}

          <div class="sequence-card">
            <h2 class="sequence-card__title">Urutan tes</h2>
            <ol class="sequence">
              {#each examRunner.active?.session?.stages ?? [] as stage (stage.id)}
                <li
                  class="sequence__stage"
                  class:sequence__stage--current={stage.stageCode === examRunner.active?.currentStageCode}
                >
                  <p class="sequence__stage-name">{stage.name}</p>
                  <ul class="sequence__subtests">
                    {#each stage.subtests as entry (entry.id)}
                      <li
                        class="sequence__subtest"
                        class:sequence__subtest--active={entry.id === subtest.id}
                        class:sequence__subtest--done={['COMPLETED', 'EXPIRED', 'ELIMINATED'].includes(
                          entry.status,
                        )}
                      >
                        <span class="sequence__dot"></span>
                        <span class="sequence__name">{entry.name}</span>
                        <span class="sequence__status">{entry.status}</span>
                      </li>
                    {/each}
                  </ul>
                </li>
              {/each}
            </ol>
          </div>

          {#if examRunner.nextSubtest}
            <div class="sequence-card sequence-card--next">
              <p class="sequence-card__label">Berikutnya</p>
              <p class="sequence-card__next">{examRunner.nextSubtest.name}</p>
            </div>
          {/if}
        </aside>
      </div>
    {/if}
  </div>

  {#if confirmFinish}
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="finish-title">
      <div class="modal__panel">
        {#if examRunner.nextSubtest}
          <h2 id="finish-title">Lanjut ke {examRunner.nextSubtest.name}?</h2>
          <p class="muted">
            Subtes <strong>{subtest?.name ?? 'Kecerdasan & Kepribadian'}</strong> akan dinilai sekarang dan <strong>tidak dapat dibuka kembali</strong>.
            Setelah berpindah, Anda akan diarahkan ke halaman jeda istirahat (5–10 menit) sebelum memulai tes berikutnya.
          </p>
        {:else}
          <h2 id="finish-title">Selesaikan ujian ini?</h2>
          <p class="muted">
            Seluruh soal telah dikerjakan. Hasil ujian akan dihitung dan langsung ditampilkan. Pastikan semua jawaban sudah tersimpan.
          </p>
        {/if}
        {#if examRunner.pendingCount > 0}
          <Alert tone="warning" title="Masih ada jawaban menunggu">
            {examRunner.pendingCount} jawaban belum ter-ACK server. Coba kirim ulang terlebih dahulu.
          </Alert>
        {/if}
        <div class="actions">
          <Button variant="secondary" onclick={() => (confirmFinish = false)}>Batal</Button>
          <Button
            variant={examRunner.nextSubtest ? 'primary' : 'danger'}
            loading={examRunner.finishing}
            onclick={() => void finish(false)}
          >
            {examRunner.nextSubtest ? `Ya, Lanjut ke ${examRunner.nextSubtest.name}` : 'Ya, selesaikan'}
          </Button>
          {#if examRunner.pendingCount > 0}
            <Button
              variant="ghost"
              loading={examRunner.finishing}
              onclick={() => void finish(true)}
            >
              Selesaikan tanpa menunggu
            </Button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
{/if}

<!--
  F5-12 — satu viewer untuk semua gambar soal. `Esc` menutup, zoom 100%–400%,
  drag untuk geser. Diletakkan di luar alur utama agar tumpang tindih halaman.
-->
<MediaViewer
  bind:this={viewer}
  src={viewerSrc}
  alt={viewerAlt}
  onclose={() => (viewerSrc = null)}
/>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    max-width: 860px;
    margin-inline: auto;
  }

  .page--wide {
    max-width: 1440px;
    width: 100%;
    padding: var(--space-3) var(--space-4);
  }

  /* ---------------------------------------------- cat exam topbar */

  .cat-exam-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: 0.75rem 1.25rem;
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    color: #ffffff;
    border-radius: var(--radius-lg);
    box-shadow: 0 4px 14px rgba(30, 58, 138, 0.18);
  }

  .cat-exam-bar__left {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .cat-exam-badge {
    padding: 0.25rem 0.6rem;
    background: #f59e0b;
    color: #0f172a;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    border-radius: var(--radius-sm);
  }

  .cat-exam-title {
    display: flex;
    flex-direction: column;
  }

  .cat-exam-title__main {
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .cat-exam-title__sub {
    font-size: 0.75rem;
    opacity: 0.85;
  }

  .cat-exam-bar__right {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .cat-exam-user {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
  }

  .cat-exam-user__label {
    opacity: 0.8;
  }

  .cat-exam-user__name {
    font-weight: 700;
  }

  .cat-exam-btn-fullscreen {
    padding: 0.35rem 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: var(--radius-md);
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }

  .cat-exam-btn-fullscreen:hover {
    background: rgba(255, 255, 255, 0.22);
  }

  /* ---------------------------------------------- runner: soal | palet */

  .runner {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-4);
    align-items: start;
  }

  .runner__main {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    min-width: 0;
  }

  .runner__side {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-width: 0;
  }

  @media (min-width: 960px) {
    .runner {
      grid-template-columns: minmax(0, 1fr) 320px;
    }

    .runner__side--right {
      position: sticky;
      top: var(--space-3);
    }
  }

  @media (min-width: 1200px) {
    .runner {
      grid-template-columns: minmax(0, 1fr) 350px;
    }
  }

  .palette-card,
  .sequence-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
  }

  .palette-card__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .palette-card__title,
  .sequence-card__title {
    margin: 0;
    font-size: var(--text-sm);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-subtle);
  }

  .palette-card__sub {
    display: block;
    font-size: 0.72rem;
    color: var(--color-text-muted);
    font-weight: normal;
    text-transform: none;
    letter-spacing: normal;
    margin-top: 2px;
  }

  .palette-card__count {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .legend {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .legend li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .dot {
    width: 0.7rem;
    height: 0.7rem;
    border-radius: var(--radius-full);
    background: var(--color-surface-muted);
    border: 1px solid var(--color-border-strong);
  }

  .dot--current {
    background: #2563eb;
    border-color: #2563eb;
  }

  .dot--answered {
    background: #16a34a;
    border-color: #16a34a;
  }

  .dot--flagged {
    background: #f59e0b;
    border-color: #f59e0b;
  }

  .dot--unanswered {
    background: #ffffff;
    border: 1.5px solid #94a3b8;
  }

  .sequence {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .sequence__stage-name {
    margin: 0;
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .sequence__stage--current .sequence__stage-name {
    color: var(--color-primary);
  }

  .sequence__subtests {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin: var(--space-1) 0 0;
    padding: 0;
    list-style: none;
  }

  .sequence__subtest {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .sequence__dot {
    width: 0.45rem;
    height: 0.45rem;
    flex: none;
    border-radius: var(--radius-full);
    background: var(--color-border-strong);
  }

  .sequence__name {
    flex: 1;
    min-width: 0;
  }

  .sequence__status {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-subtle);
  }

  .sequence__subtest--active {
    color: var(--color-primary);
    font-weight: 700;
  }

  .sequence__subtest--active .sequence__dot {
    background: var(--color-primary);
  }

  .sequence__subtest--done {
    color: var(--color-success);
  }

  .sequence__subtest--done .sequence__dot {
    background: var(--color-success);
  }

  .sequence-card--next {
    gap: var(--space-1);
  }

  .sequence-card__label {
    margin: 0;
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .sequence-card__next {
    margin: 0;
    font-weight: 600;
  }

  .fullscreen-note {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface-muted);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .runner__footer {
    position: sticky;
    bottom: var(--space-3);
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: 0 6px 20px rgb(15 23 42 / 8%);
  }

  .runner__nav {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .runner__nav--center {
    flex: 1;
    justify-content: center;
  }

  .runner__nav--end {
    justify-content: flex-end;
  }

  .center {
    display: grid;
    place-items: center;
    padding-block: var(--space-12);
  }

  .runner__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .runner__stage {
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-subtle);
  }

  .runner__title {
    font-size: var(--text-xl);
  }

  .runner__timer {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font-variant-numeric: tabular-nums;
  }

  .runner__timer--critical {
    border-color: var(--color-danger);
    background: var(--color-danger-soft);
    color: var(--color-danger);
  }

  .runner__timer-label {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted);
  }

  .runner__timer-value {
    font-family: var(--font-mono);
    font-size: var(--text-2xl);
    font-weight: 700;
    line-height: 1.1;
  }

  .progress {
    height: 8px;
    border-radius: var(--radius-full);
    background: var(--color-surface-muted);
    overflow: hidden;
  }

  .progress__bar {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--color-primary);
    transition: width var(--duration-fast) var(--ease-out);
  }

  .statusline {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .statusline__offline {
    color: var(--color-warning);
    font-weight: 600;
  }

  .question {
    padding: var(--space-5);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    /* Anti-kecurangan: teks soal tidak dapat disorot/ditarik keluar. */
    user-select: none;
    -webkit-user-select: none;
  }

  .question__header {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }

  .question__stem {
    font-size: var(--text-lg);
    line-height: 1.55;
    margin-bottom: var(--space-4);
    white-space: pre-wrap;
  }

  .question__media {
    display: block;
    max-width: 100%;
    margin-bottom: var(--space-4);
    padding: 0;
    border: 0;
    background: transparent;
    border-radius: var(--radius-md);
    cursor: zoom-in;
  }

  .question__media img {
    display: block;
    max-width: 100%;
    height: auto;
    border-radius: var(--radius-md);
  }

  .question__media:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .options {
    display: grid;
    gap: var(--space-2);
  }

  .options--compact {
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  }

  .option {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: var(--text-base);
    text-align: left;
    cursor: pointer;
    transition:
      border-color var(--duration-fast) var(--ease-out),
      background var(--duration-fast) var(--ease-out);
  }

  .option:hover {
    background: var(--color-surface-muted);
  }

  .option--active {
    border-color: var(--color-primary);
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-weight: 600;
  }

  .option--button {
    width: 100%;
  }

  .option__key {
    display: grid;
    place-items: center;
    flex: none;
    width: 1.8rem;
    height: 1.8rem;
    border-radius: var(--radius-sm);
    background: var(--color-surface-muted);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 700;
  }

  .option--active .option__key {
    background: var(--color-primary);
    color: #fff;
  }

  .option__text {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  /* Media kecil di dalam opsi teks (soal bergambar pada SINGLE/MULTI/MISSING). */
  .option__media {
    display: block;
    max-width: 100%;
    max-height: 120px;
    margin-top: var(--space-2);
    object-fit: contain;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
  }

  /* Soal figural: grid tile gambar (IMAGE_CHOICE) — lihat ImageChoiceTiles.svelte. */

  .likert {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--space-2);
  }

  .likert__option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-3) var(--space-1);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    cursor: pointer;
    color: var(--color-text);
  }

  .likert__option:hover {
    background: var(--color-surface-muted);
  }

  .likert__option--active {
    border-color: var(--color-primary);
    background: var(--color-primary-soft);
    color: var(--color-primary);
  }

  .likert__value {
    font-family: var(--font-mono);
    font-size: var(--text-xl);
    font-weight: 700;
  }

  .likert__label {
    font-size: 0.68rem;
    line-height: 1.2;
    text-align: center;
  }

  .missing__arrays {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    font-size: var(--text-2xl);
    letter-spacing: 0.18em;
    margin-bottom: var(--space-4);
  }

  .missing__form {
    display: flex;
    gap: var(--space-3);
    align-items: center;
  }

  .passhand__hint {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    margin-bottom: var(--space-3);
  }

  .passhand__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(58px, 1fr));
    gap: var(--space-2);
  }

  .passhand__cell {
    display: grid;
    grid-template-rows: auto auto auto;
    justify-items: center;
    gap: 2px;
    padding: var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface-muted);
    font-family: var(--font-mono);
  }

  .passhand__top,
  .passhand__bottom {
    font-size: var(--text-base);
    line-height: 1;
  }

  .passhand__bottom {
    color: var(--color-text-muted);
  }

  .passhand__input {
    width: 2.4rem;
    padding: 0.2rem;
    text-align: center;
    font-family: var(--font-mono);
    font-size: var(--text-lg);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-text);
  }

  .passhand__input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: var(--shadow-ring);
  }

  .palette {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    padding: var(--space-3);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-md);
    background: #f8fafc;
    /* Terlihat semua nomornya, kapasitas tinggi dan nyaman */
    max-height: min(72vh, 650px);
    overflow-y: auto;
  }

  .palette__item {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    min-width: 44px;
    padding: 4px;
    border: 1.5px solid #cbd5e1;
    border-radius: var(--radius-md);
    background: #ffffff;
    color: #1e293b;
    font-family: var(--font-mono);
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease-out;
  }

  .palette__item:hover {
    border-color: var(--color-primary);
    background: #f1f5f9;
  }

  .palette__item--current {
    border-color: #2563eb !important;
    background: #eff6ff !important;
    color: #2563eb !important;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.25);
    font-weight: 800;
  }

  .palette__item--answered {
    background: #16a34a !important;
    border-color: #15803d !important;
    color: #ffffff !important;
  }

  .palette__item--flagged {
    background: #f59e0b !important;
    border-color: #d97706 !important;
    color: #ffffff !important;
  }

  .palette__item--current.palette__item--answered {
    box-shadow: 0 0 0 3px #2563eb, inset 0 0 0 1px #ffffff;
  }

  .palette__item--current.palette__item--flagged {
    box-shadow: 0 0 0 3px #2563eb, inset 0 0 0 1px #ffffff;
  }

  .facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--space-4);
    margin: 0 0 var(--space-4);
  }

  .facts dt {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .facts dd {
    margin: var(--space-1) 0 0;
    font-weight: 600;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-top: var(--space-4);
  }

  .input {
    width: 100%;
    padding: 0.6rem 0.75rem;
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
  }

  .input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: var(--shadow-ring);
  }

  .modal {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: grid;
    place-items: center;
    padding: var(--space-4);
    background: rgba(15, 23, 42, 0.55);
  }

  .modal__panel {
    width: min(520px, 100%);
    padding: var(--space-6);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-lg);
  }

  .modal__panel h2 {
    font-size: var(--text-xl);
    margin-bottom: var(--space-2);
  }

  .mono {
    font-family: var(--font-mono);
  }

  @media (max-width: 640px) {
    .likert {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }

    .likert__label {
      display: none;
    }

    .runner__timer {
      align-items: flex-start;
    }
  }

  /* ------------------------------------------------------------- JEDA CARD */
  .jeda-card {
    max-width: 800px;
    margin: var(--space-6) auto;
    padding: var(--space-8);
    background: var(--color-surface);
    border: 2px solid var(--color-brand, #3b82f6);
    border-radius: var(--radius-xl, 16px);
    box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 8px 10px -6px rgba(59, 130, 246, 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .jeda-card__badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: 6px 14px;
    background: rgba(59, 130, 246, 0.12);
    color: var(--color-primary);
    border-radius: 9999px;
    font-size: var(--text-sm);
    font-weight: 700;
    letter-spacing: 0.05em;
    margin-bottom: var(--space-3);
  }

  .jeda-badge-pulse {
    width: 8px;
    height: 8px;
    background: var(--color-primary);
    border-radius: 50%;
    animation: jedaPulse 1.5s infinite;
  }

  @keyframes jedaPulse {
    0% { transform: scale(0.95); opacity: 0.8; }
    50% { transform: scale(1.3); opacity: 1; }
    100% { transform: scale(0.95); opacity: 0.8; }
  }

  .jeda-card__title {
    font-size: var(--text-2xl);
    font-weight: 800;
    color: var(--color-text);
    margin: 0 0 var(--space-2);
  }

  .jeda-card__subtitle {
    font-size: var(--text-base);
    color: var(--color-text-muted);
    max-width: 620px;
    line-height: 1.5;
    margin: 0 0 var(--space-6);
  }

  .jeda-timer-box {
    width: 100%;
    max-width: 480px;
    padding: var(--space-5);
    background: var(--color-surface-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-6);
  }

  .jeda-timer-label {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--space-2);
  }

  .jeda-timer-display {
    font-family: var(--font-mono);
    font-size: clamp(2.5rem, 6vw, 3.5rem);
    font-weight: 800;
    color: var(--color-primary);
    line-height: 1;
    margin-bottom: var(--space-4);
  }

  .jeda-timer-display--ended {
    color: var(--color-danger, #ef4444);
  }

  .jeda-timer-options {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
  }

  .jeda-timer-opt-title {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .jeda-opt-btn {
    padding: 4px 12px;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .jeda-opt-btn:hover {
    background: var(--color-surface-hover, rgba(0, 0, 0, 0.05));
  }

  .jeda-opt-btn--active {
    background: var(--color-primary);
    color: #ffffff;
    border-color: var(--color-primary);
  }

  .jeda-briefing {
    width: 100%;
    text-align: left;
    background: var(--color-surface-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    margin-bottom: var(--space-6);
  }

  .jeda-briefing__title {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 var(--space-4);
  }

  .jeda-briefing__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }

  .jeda-briefing__item {
    display: flex;
    flex-direction: column;
    padding: var(--space-3);
    background: var(--color-surface);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
  }

  .jeda-briefing__lbl {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .jeda-briefing__val {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text);
  }

  .jeda-briefing__list {
    margin: 0;
    padding-left: var(--space-5);
    font-size: var(--text-sm);
    color: var(--color-text);
    line-height: 1.6;
  }

  .jeda-briefing__list li + li {
    margin-top: var(--space-2);
  }

  .jeda-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-3);
  }

  /* -------------------------------------------------------- KECERMATAN RUNNER */
  .kecermatan-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    width: 100%;
  }

  .kecermatan-benchmark {
    background: var(--color-surface-muted);
    border: 2px solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }

  .kecermatan-benchmark__header {
    margin-bottom: var(--space-3);
    text-align: center;
  }

  .kecermatan-benchmark__col-title {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .kecermatan-benchmark__grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--space-2);
  }

  .kecermatan-benchmark__cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-1);
    box-shadow: var(--shadow-sm);
  }

  .kecermatan-benchmark__opt {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-text-muted);
    background: var(--color-surface-muted);
    border-radius: var(--radius-sm);
    padding: 1px 6px;
    margin-bottom: 2px;
  }

  .kecermatan-benchmark__char {
    font-family: var(--font-mono);
    font-size: clamp(1.4rem, 3.5vw, 2.2rem);
    font-weight: 800;
    color: var(--color-text);
    line-height: 1.1;
  }

  .kecermatan-question-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-5);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }

  .kecermatan-question-label {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-muted);
    margin-bottom: var(--space-3);
  }

  .kecermatan-question-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
  }

  .kecermatan-char-tile {
    display: grid;
    place-items: center;
    width: clamp(52px, 8vw, 68px);
    height: clamp(52px, 8vw, 68px);
    background: var(--color-surface-muted);
    border: 2px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    font-family: var(--font-mono);
    font-size: clamp(1.6rem, 4vw, 2.4rem);
    font-weight: 800;
    color: var(--color-text);
    box-shadow: var(--shadow-sm);
  }

  .kecermatan-char-tile--missing {
    border-style: dashed;
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-primary-soft);
  }

  .kecermatan-options-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr) !important;
    gap: var(--space-2);
  }

  .kecermatan-opt-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-3) var(--space-1);
    min-height: 72px;
  }

  .kecermatan-opt-char {
    font-size: clamp(1.4rem, 3.5vw, 2.2rem) !important;
    font-weight: 800;
    margin-top: 2px;
  }
</style>
