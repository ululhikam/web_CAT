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
  import type { ExamEligibility } from '@webcat/contracts';

  let eligibility = $state<ExamEligibility | null>(null);
  let loading = $state(true);
  let starting = $state(false);
  let acknowledged = $state(false);
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
  const canStart = $derived(
    Boolean(eligibility?.canStart) && !activeSessionId && acknowledged && !starting,
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

  async function startExam(): Promise<void> {
    if (!canStart) return;
    starting = true;
    error = null;
    try {
      const result = await examRunner.startSession();
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
  <title>Ujian -" Web CAT</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">Ujian seleksi</h1>
      <p class="muted">
        Tiga tes berurutan: Psikologi, TPA, dan TPK. Setiap subtes memiliki timer server dan tidak
        dapat dibuka ulang setelah berakhir.
      </p>
    </div>
    {#if activeSessionId}
      <Badge tone="warning">Sesi berjalan</Badge>
    {:else if eligibility?.canStart}
      <Badge tone="success">Siap dimulai</Badge>
    {:else}
      <Badge tone="neutral">Belum dapat dimulai</Badge>
    {/if}
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
    <div class="grid">
      <Card title="Aturan penting" description="Baca sebelum memulai.">
        <ul class="rules">
          <li>
            <strong>Hard lock waktu.</strong> Begitu timer subtes habis, semua jawaban berikutnya ditolak
            server. Jawaban yang sudah terkirim tetap dinilai.
          </li>
          <li>
            <strong>Berurutan.</strong> Subtes berikutnya hanya terbuka setelah subtes sebelumnya selesai.
            Timer subtes baru mulai penuh saat Anda membukanya.
          </li>
          <li>
            <strong>Sistem gugur.</strong> Nilai subtes di bawah ambang gugur dapat mengakhiri sesi. Data
            subtes yang sudah dikerjakan tetap tersimpan.
          </li>
          <li>
            <strong>Anti-kecurangan.</strong> Perpindahan tab, salin-tempel, keluar layar penuh, dan sinyal
            mencurigakan dicatat server. Pelanggaran berulang dapat mengunci subtes atau menggugurkan
            sesi.
          </li>
          <li>
            <strong>Autosave.</strong> Setiap jawaban disimpan di perangkat lebih dulu, lalu dikirim ke
            server. Jangan menutup tab saat indikator masih menyimpan.
          </li>
        </ul>
      </Card>

      <Card title="Kelayakan" description="Pemeriksaan otomatis dari server.">
        {#if eligibility}
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

          {#if eligibility.reasons.length > 0}
            <Alert tone="warning" title="Anda belum dapat memulai">
              <ul class="reasons">
                {#each eligibility.reasons as reason (reason)}
                  <li>{REASON_LABELS[reason] ?? reason}</li>
                {/each}
              </ul>
            </Alert>
          {:else}
            <label class="ack">
              <input type="checkbox" bind:checked={acknowledged} />
              <span>
                Saya sudah membaca aturan, memahami hard lock waktu, dan siap memulai sesi.
              </span>
            </label>
            <div class="actions">
              <Button loading={starting} disabled={!canStart} onclick={startExam}>
                Mulai ujian sekarang
              </Button>
              <Button variant="secondary" href="/dashboard">Kembali ke ringkasan</Button>
            </div>
          {/if}
        {:else}
          <p class="muted">Kelayakan tidak tersedia. Muat ulang halaman.</p>
        {/if}
      </Card>
    </div>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    max-width: 980px;
  }

  .page__header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .page__title {
    font-size: var(--text-2xl);
  }

  .grid {
    display: grid;
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
    margin-top: var(--space-2);
  }

  .facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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
    margin-top: var(--space-4);
  }

  .center-block {
    display: grid;
    place-items: center;
    padding-block: var(--space-12);
  }

  .mono {
    font-family: var(--font-mono);
  }

  @media (min-width: 900px) {
    .grid {
      grid-template-columns: 1.2fr 1fr;
      align-items: start;
    }
  }
</style>
