<script lang="ts">
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { session } from '$lib/stores/session.svelte';
  import { examRunner } from '$lib/stores/examRunner.svelte';
  import { formatDateTime } from '$lib/format';
  import type { ExamQuestion, ExamQuestionOption } from '@webcat/contracts';

  const sessionId = page.params.sessionId ?? '';

  let booted = false;
  let index = $state(0);
  let confirmFinish = $state(false);
  let passHandValues = $state<string[]>([]);
  let textAnswer = $state('');
  let jumpTo = $state('');
  let showPalette = $state(false);
  let loadedQuestionId: string | null = null;
  let questionShownAt = Date.now();
  let advanceTimer: ReturnType<typeof setTimeout> | null = null;

  const question = $derived(examRunner.questions[index] ?? null);
  const subtest = $derived(examRunner.currentSubtest);
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

  onDestroy(() => {
    if (advanceTimer) clearTimeout(advanceTimer);
  });

  async function boot(): Promise<void> {
    if (!sessionId) return;
    try {
      const result = await examRunner.loadSession(sessionId);
      examRunner.startTicker();
      attachProctoring();
      if (result.currentSubtest?.status === 'ACTIVE') {
        await examRunner.loadQuestions();
      }
    } catch {
      // error sudah dipetakan store
    }
  }

  async function openSubtest(): Promise<void> {
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

  function jump(): void {
    const target = Number(jumpTo);
    if (Number.isInteger(target) && target >= 1 && target <= examRunner.questions.length) {
      index = target - 1;
      jumpTo = '';
    }
  }

  async function finish(force = false): Promise<void> {
    const result = await examRunner.finishSubtest(force);
    if (!result) return;
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

    const onVisibility = () => {
      examRunner.pushEvent(document.hidden ? 'TAB_BLUR' : 'TAB_FOCUS');
    };
    const onCopy = () => examRunner.pushEvent('COPY');
    const onPaste = () => examRunner.pushEvent('PASTE');
    const onCut = () => examRunner.pushEvent('CUT');
    const onContext = (event: MouseEvent) => {
      event.preventDefault();
      examRunner.pushEvent('CONTEXT_MENU');
    };
    const onFullscreen = () => {
      examRunner.pushEvent(document.fullscreenElement ? 'FULLSCREEN_ENTER' : 'FULLSCREEN_EXIT');
    };
    const onResize = () => examRunner.pushEvent('WINDOW_RESIZED');
    const onKeydown = (event: KeyboardEvent) => {
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

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    document.addEventListener('cut', onCut);
    document.addEventListener('contextmenu', onContext);
    document.addEventListener('fullscreenchange', onFullscreen);
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKeydown);
    window.addEventListener('beforeunload', onBeforeUnload);

    detach = () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('contextmenu', onContext);
      document.removeEventListener('fullscreenchange', onFullscreen);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeydown);
      window.removeEventListener('beforeunload', onBeforeUnload);
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
  <title>{subtest?.name ?? 'Ujian'} -" Web CAT</title>
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
      <header class="runner__header">
        <div class="runner__identity">
          <p class="runner__stage">{examRunner.active?.currentStageCode ?? 'UJIAN'}</p>
          <h1 class="runner__title">{subtest.name}</h1>
          <p class="muted">
            Soal {Math.min(index + 1, examRunner.totalQuestions)} dari {examRunner.totalQuestions} · terjawab
            {examRunner.answeredCount}
          </p>
        </div>

        <div class="runner__timer" class:runner__timer--critical={timerCritical} aria-live="polite">
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
            <Badge tone="brand">Soal {index + 1}</Badge>
            <Badge tone="neutral">{question.type.replaceAll('_', ' ')}</Badge>
            {#if question.columnIndex !== null}
              <Badge tone="info">Kolom {question.columnIndex + 1}</Badge>
            {/if}
          </header>

          {#if question.stemFormat === 'HTML'}
            <div class="question__stem">{@html question.stem}</div>
          {:else}
            <p class="question__stem">{question.stem}</p>
          {/if}

          {#each question.media as media (media.url)}
            {#if media.role === 'STEM'}
              <img class="question__media" src={media.url} alt={media.alt ?? 'Gambar soal'} />
            {/if}
          {/each}

          {#if question.type === 'PASS_HAND_COLUMN'}
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
                  <span class="option__text">{optionText(option)}</span>
                </label>
              {/each}
            </div>
            <div class="actions">
              <Button variant="secondary" onclick={advance}>Simpan &amp; lanjut</Button>
            </div>
          {:else if question.type === 'MISSING_ELEMENT' && question.options.length > 0}
            <div class="missing">
              <p class="missing__arrays">
                <span class="mono">{question.missingElement?.left}</span>
                <span class="muted">menjadi</span>
                <span class="mono">{question.missingElement?.right}?</span>
              </p>
              <div
                class="options options--compact"
                role="group"
                aria-label="Pilih karakter yang hilang"
              >
                {#each question.options as option, optionIndex (option.id)}
                  <button
                    type="button"
                    class="option option--button"
                    class:option--active={isChosen(question, option.id)}
                    onclick={() => chooseOption(question, option)}
                  >
                    <span class="option__key">{optionLetters[optionIndex] ?? option.label}</span>
                    <span class="option__text mono">{optionText(option)}</span>
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
                  <span class="option__text">{optionText(option)}</span>
                </button>
              {/each}
            </div>
          {/if}
        </article>

        <footer class="runner__footer">
          <div class="nav">
            <Button variant="secondary" disabled={index === 0} onclick={goBack}>Sebelumnya</Button>
            <Button
              variant="secondary"
              disabled={index >= examRunner.questions.length - 1}
              onclick={advance}
            >
              Berikutnya
            </Button>
            {#if examRunner.questions.length > 40}
              <form
                class="jump"
                onsubmit={(event) => {
                  event.preventDefault();
                  jump();
                }}
              >
                <input
                  class="input jump__input"
                  type="number"
                  min="1"
                  max={examRunner.questions.length}
                  value={jumpTo}
                  oninput={(event) => (jumpTo = event.currentTarget.value)}
                  aria-label="Lompat ke nomor soal"
                  placeholder="No."
                />
                <Button type="submit" variant="ghost">Lompat</Button>
              </form>
            {/if}
          </div>

          <div class="nav">
            {#if examRunner.questions.length <= 120}
              <Button variant="ghost" onclick={() => (showPalette = !showPalette)}>
                {showPalette ? 'Sembunyikan daftar' : 'Daftar soal'}
              </Button>
            {/if}
            <Button variant="danger" onclick={() => (confirmFinish = true)}
              >Selesaikan subtes</Button
            >
          </div>
        </footer>

        {#if showPalette}
          <div class="palette" aria-label="Daftar soal">
            {#each examRunner.questions as entry, entryIndex (entry.id)}
              <button
                type="button"
                class="palette__item"
                class:palette__item--current={entryIndex === index}
                class:palette__item--answered={examRunner.answerOf(entry.id) !== null}
                onclick={() => (index = entryIndex)}
              >
                {entryIndex + 1}
              </button>
            {/each}
          </div>
        {/if}
      {/if}
    {/if}
  </div>

  {#if confirmFinish}
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="finish-title">
      <div class="modal__panel">
        <h2 id="finish-title">Selesaikan subtes?</h2>
        <p class="muted">
          Subtes akan dinilai sekarang dan tidak dapat dibuka kembali. Pastikan semua jawaban sudah
          terkirim.
        </p>
        {#if examRunner.pendingCount > 0}
          <Alert tone="warning" title="Masih ada jawaban menunggu">
            {examRunner.pendingCount} jawaban belum ter-ACK server. Coba kirim ulang terlebih dahulu.
          </Alert>
        {/if}
        <div class="actions">
          <Button variant="secondary" onclick={() => (confirmFinish = false)}>Batal</Button>
          <Button
            variant="danger"
            loading={examRunner.finishing}
            onclick={() => void finish(false)}
          >
            Ya, selesaikan
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

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    max-width: 860px;
    margin-inline: auto;
  }

  .page--wide {
    max-width: 1040px;
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
    height: auto;
    margin-bottom: var(--space-4);
    border-radius: var(--radius-md);
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

  .runner__footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .nav {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  .jump {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .jump__input {
    width: 5rem;
  }

  .palette {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(2.4rem, 1fr));
    gap: var(--space-1);
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    max-height: 220px;
    overflow-y: auto;
  }

  .palette__item {
    padding: 0.35rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-text-muted);
    font-size: var(--text-xs);
    cursor: pointer;
  }

  .palette__item--answered {
    background: var(--color-success-soft);
    border-color: var(--color-success);
    color: var(--color-success);
  }

  .palette__item--current {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
    font-weight: 700;
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
</style>
