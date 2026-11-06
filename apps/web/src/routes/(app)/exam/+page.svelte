<script lang="ts">
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { goto } from '$app/navigation';
  import { apiErrorMessage, apiRequest } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import { examRunner } from '$lib/stores/examRunner.svelte';
  import { formatDateTime } from '$lib/format';
  import type { ExamEligibility, ExamStageOption, StageCode } from '@webcat/contracts';

  let eligibility = $state<ExamEligibility | null>(null);
  let loading = $state(true);
  let starting = $state(false);
  let acknowledged = $state(false);
  let selectedStage = $state<StageCode | null>(null);
  let error = $state<string | null>(null);

  $effect(() => {
    if (!session.user || !session.accessToken) return;

    let cancelled = false;

    void (async () => {
      loading = true;
      error = null;
      try {
        await examRunner.loadActive();
        if (cancelled) return;
        eligibility = await apiRequest<ExamEligibility>('/exams/eligibility', {
          token: session.accessToken,
        });
        // Bila hanya ada satu tes yang siap, langsung pilih agar peserta tidak
        // perlu klik dua kali.
        const available = (eligibility.stages ?? []).filter((stage) => stage.available);
        if (!selectedStage && available.length === 1) selectedStage = available[0]!.code;
      } catch (cause) {
        if (!cancelled) error = apiErrorMessage(cause);
      } finally {
        if (!cancelled) loading = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  });

  const activeSessionId = $derived(
    examRunner.active?.session?.id ?? eligibility?.activeSessionId ?? null,
  );
  const activeStatus = $derived(examRunner.active?.session?.status ?? null);
  const stages = $derived<ExamStageOption[]>(eligibility?.stages ?? []);
  const selected = $derived(stages.find((stage) => stage.code === selectedStage) ?? null);
  const canStart = $derived(Boolean(selected?.available) && acknowledged && !starting);

  /** Penghalang yang berlaku untuk seluruh tes (bukan kekurangan bank soal satu tes). */
  const blockers = $derived(
    (eligibility?.reasons ?? []).filter(
      (reason) =>
        reason !== 'EXAM_POOL_INSUFFICIENT' || !stages.some((stage) => stage.available),
    ),
  );

  const REASON_LABELS: Record<string, string> = {
    ACTIVE_SESSION_EXISTS: 'Masih ada sesi ujian yang berjalan. Lanjutkan sesi tersebut.',
    DAILY_LIMIT_REACHED: 'Kuota sesi ujian hari ini sudah habis.',
    EXAM_POOL_INSUFFICIENT: 'Bank soal belum mencukupi untuk memulai ujian.',
    SUBSCRIPTION_REQUIRED: 'Langganan aktif diperlukan untuk memulai ujian.',
    SUBSCRIPTION_EXPIRED: 'Langganan Anda sudah berakhir.',
    ACCOUNT_SUSPENDED: 'Akun Anda sedang ditangguhkan.',
    EMAIL_NOT_VERIFIED: 'Verifikasi email Anda terlebih dahulu.',
  };

  function selectStage(stage: ExamStageOption): void {
    if (!stage.available) return;
    selectedStage = stage.code;
    error = null;
  }

  async function startExam(): Promise<void> {
    if (!canStart || !selectedStage) return;
    starting = true;
    error = null;
    try {
      const result = await examRunner.startSession(selectedStage);
      const id = result.session?.id;
      if (id) await goto(`/exam/${id}`);
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      starting = false;
    }
  }
</script>

<svelte:head>
  <title>TES CAT - Ujian</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">Pilih tes</h1>
      <p class="muted">
        Pilih salah satu tes di bawah ini. Setiap tes memiliki timer server sendiri dan tidak dapat
        dibuka ulang setelah berakhir.
      </p>
    </div>
    <div class="page__header-actions">
      {#if eligibility}
        {@const maxQuota = eligibility.maxSessionsPerDay ?? 3}
        <Badge tone={maxQuota - (eligibility.sessionsToday ?? 0) > 0 ? 'brand' : 'danger'}>
          Sisa Kuota: {Math.max(0, maxQuota - (eligibility.sessionsToday ?? 0))} / {maxQuota} sesi hari ini
        </Badge>
      {/if}
      {#if activeSessionId}
        <Badge tone="warning">Sesi berjalan</Badge>
      {:else if stages.some((stage) => stage.available)}
        <Badge tone="success">Siap dimulai</Badge>
      {:else}
        <Badge tone="neutral">Belum dapat dimulai</Badge>
      {/if}
    </div>
  </header>

  {#if error}
    <Alert tone="danger" title="Terjadi kesalahan">{error}</Alert>
  {/if}

  {#if loading}
    <div class="center-block"><Spinner size={26} label="Memeriksa kelayakan ujian" /></div>
  {:else if activeSessionId}
    <Card
      title="Lanjutkan sesi yang sedang berjalan"
      description="Timer tetap berjalan di server. Segera lanjutkan sebelum waktu subtes habis."
      elevated
    >
      <dl class="facts">
        <div>
          <dt>Status sesi</dt>
          <dd><Badge tone="warning">{activeStatus ?? 'IN_PROGRESS'}</Badge></dd>
        </div>
        {#if examRunner.currentSubtest}
          <div>
            <dt>Subtes aktif</dt>
            <dd>{examRunner.currentSubtest.name}</dd>
          </div>
        {/if}
        {#if examRunner.remainingMs !== null}
          <div>
            <dt>Sisa waktu</dt>
            <dd class="mono">{examRunner.remainingLabel}</dd>
          </div>
        {/if}
      </dl>
      <div class="actions">
        <Button href={`/exam/${activeSessionId}`}>Lanjutkan ujian</Button>
        <Button variant="secondary" href={`/results/${activeSessionId}`}
          >Lihat hasil sementara</Button
        >
      </div>
    </Card>
  {:else}
    {#if blockers.length > 0}
      <Alert tone="warning" title="Anda belum dapat memulai">
        <ul class="reasons">
          {#each blockers as reason (reason)}
            <li>{REASON_LABELS[reason] ?? reason}</li>
          {/each}
        </ul>
      </Alert>
    {/if}

    <div class="layout">
      <section class="tests" aria-label="Daftar tes">
        {#if stages.length === 0}
          <Card title="Belum ada tes" description="Konfigurasi ujian belum tersedia.">
            <p class="muted">Hubungi admin untuk melengkapi konfigurasi tes.</p>
          </Card>
        {:else}
          <div class="tests__grid">
            {#each stages as stage (stage.code)}
              <button
                type="button"
                class="test-card"
                class:test-card--active={selectedStage === stage.code}
                class:test-card--disabled={!stage.available}
                aria-pressed={selectedStage === stage.code}
                disabled={!stage.available}
                onclick={() => selectStage(stage)}
              >
                <div class="test-card__head">
                  <h2 class="test-card__title">{stage.name}</h2>
                  {#if !stage.available}
                    <Badge tone="neutral">Belum siap</Badge>
                  {:else if selectedStage === stage.code}
                    <Badge tone="brand" solid>Dipilih</Badge>
                  {:else}
                    <Badge tone="info">Tersedia</Badge>
                  {/if}
                </div>
                {#if stage.description}
                  <p class="test-card__desc">{stage.description}</p>
                {/if}
                <dl class="test-card__meta">
                  <div>
                    <dt>Jumlah soal</dt>
                    <dd>{stage.questionCount}</dd>
                  </div>
                  <div>
                    <dt>Durasi</dt>
                    <dd>{stage.durationMinutes} menit</dd>
                  </div>
                </dl>
                {#if !stage.available}
                  <p class="test-card__note">Bank soal tes ini belum mencukupi.</p>
                {/if}
              </button>
            {/each}
          </div>

          <div class="start">
            <label class="ack">
              <input type="checkbox" bind:checked={acknowledged} />
              <span>
                Saya sudah membaca aturan, memahami hard lock waktu, dan siap memulai tes yang
                dipilih.
              </span>
            </label>
            <div class="actions">
              <Button loading={starting} disabled={!canStart} onclick={startExam}>
                Mulai tes sekarang
              </Button>
              <Button variant="secondary" href="/dashboard">Kembali ke ringkasan</Button>
            </div>
          </div>
        {/if}
      </section>

      <aside class="side">
        <Card title="Aturan penting" description="Baca sebelum memulai.">
          <ul class="rules">
            <li>
              <strong>Hard lock waktu.</strong> Begitu timer subtes habis, semua jawaban berikutnya
              ditolak server. Jawaban yang sudah terkirim tetap dinilai.
            </li>
            <li>
              <strong>Berurutan.</strong> Subtes berikutnya hanya terbuka setelah subtes sebelumnya
              selesai. Timer subtes baru mulai penuh saat Anda membukanya.
            </li>
            <li>
              <strong>Evaluasi Nilai Lengkap.</strong> Peserta mengerjakan seluruh tahapan subtes
              hingga tuntas. Rekapitulasi nilai dan status kelulusan (MS/TMS) ditampilkan lengkap di
              akhir ujian tanpa sistem gugur di tengah tes.
            </li>
            <li>
              <strong>Anti-kecurangan.</strong> Perpindahan tab, salin-tempel, keluar layar penuh, dan
              sinyal mencurigakan dicatat server. Pelanggaran berulang dapat mengunci subtes atau
              menggugurkan sesi.
            </li>
            <li>
              <strong>Autosave.</strong> Setiap jawaban disimpan di perangkat lebih dulu, lalu dikirim
              ke server. Jangan menutup tab saat indikator masih menyimpan.
            </li>
          </ul>
        </Card>

        {#if eligibility}
          <Card title="Kelayakan" description="Pemeriksaan otomatis dari server.">
            <dl class="facts">
              <div>
                <dt>Sesi hari ini</dt>
                <dd>{eligibility.sessionsToday}</dd>
              </div>
              <div>
                <dt>Langganan</dt>
                <dd>
                  {#if eligibility.activeSubscription}
                    {eligibility.activeSubscription.remainingDays} hari lagi
                  {:else}
                    -
                  {/if}
                </dd>
              </div>
              {#if eligibility.activeSubscription}
                <div>
                  <dt>Berakhir</dt>
                  <dd>{formatDateTime(eligibility.activeSubscription.endsAt)}</dd>
                </div>
              {/if}
              {#if eligibility.nextAvailableAt}
                <div>
                  <dt>Dapat memulai lagi</dt>
                  <dd>{formatDateTime(eligibility.nextAvailableAt)}</dd>
                </div>
              {/if}
            </dl>
            {#if selected}
              <p class="muted text-sm">
                Dipilih: <strong>{selected.name}</strong> — {selected.questionCount} soal, {selected
                  .durationMinutes} menit.
              </p>
            {/if}
          </Card>
        {/if}
      </aside>
    </div>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    max-width: 1180px;
  }

  .page__header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .page__header-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  .page__title {
    font-size: var(--text-2xl);
  }

  .layout {
    display: grid;
    gap: var(--space-5);
  }

  .tests {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .tests__grid {
    display: grid;
    gap: var(--space-4);
  }

  .test-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-5);
    text-align: left;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition:
      border-color 120ms ease,
      box-shadow 120ms ease,
      transform 120ms ease;
  }

  .test-card:hover:not(.test-card--disabled) {
    border-color: var(--color-primary);
    transform: translateY(-1px);
  }

  .test-card--active {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
  }

  .test-card--disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .test-card__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .test-card__title {
    font-size: var(--text-lg);
    margin: 0;
  }

  .test-card__desc {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  .test-card__meta {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-3);
    margin: 0;
  }

  .test-card__meta dt {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .test-card__meta dd {
    margin: var(--space-1) 0 0;
    font-weight: 600;
  }

  .test-card__note {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--color-danger, #b42318);
  }

  .start {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .side {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .rules,
  .reasons {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin: 0;
    padding-left: var(--space-5);
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  .rules strong {
    color: var(--color-text);
  }

  .reasons {
    margin: 0;
  }

  .facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--space-4);
    margin: 0 0 var(--space-3);
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

  .ack {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface-muted);
    font-size: var(--text-sm);
    cursor: pointer;
  }

  .ack input {
    margin-top: 0.2rem;
    width: 1rem;
    height: 1rem;
    accent-color: var(--color-primary);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-top: var(--space-1);
  }

  .center-block {
    display: grid;
    place-items: center;
    padding-block: var(--space-12);
  }

  .mono {
    font-family: var(--font-mono);
  }

  .text-sm {
    font-size: var(--text-sm);
  }

  @media (min-width: 760px) {
    .tests__grid {
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    }
  }

  @media (min-width: 1000px) {
    .layout {
      grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr);
      align-items: start;
    }
  }
</style>
