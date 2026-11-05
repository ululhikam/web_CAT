<script lang="ts">
  import { page } from '$app/state';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiErrorMessage, apiRequest } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import { formatDateTime } from '$lib/format';
  import type { AdminSessionDetail, SessionSubtestSummary } from '@webcat/contracts';

  const sessionId = page.params.id ?? '';

  let detail = $state<AdminSessionDetail | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let actionError = $state<string | null>(null);
  let actionSuccess = $state<string | null>(null);
  let acting = $state<string | null>(null);

  let voidReason = $state('');
  let unlockReason = $state('');
  let selectedSubtestId = $state('');

  const canVoid = $derived(session.can('exams.monitor'));
  const canRecompute = $derived(session.can('exams.recompute'));
  const canUnlock = $derived(session.can('exams.force_unlock'));

  const subtests = $derived(
    detail?.session.stages.flatMap((stage) =>
      stage.subtests.map((subtest) => ({ ...subtest, stageCode: stage.stageCode })),
    ) ?? [],
  );
  const unlockable = $derived(subtests.filter((subtest) => subtest.status !== 'ACTIVE'));

  $effect(() => {
    if (!session.user || !session.accessToken || !sessionId) return;
    void load();
  });

  async function load(): Promise<void> {
    loading = true;
    error = null;
    try {
      detail = await apiRequest<AdminSessionDetail>(`/admin/exam-sessions/${sessionId}`, {
        token: session.accessToken,
      });
      if (!selectedSubtestId && unlockable.length > 0) {
        selectedSubtestId = unlockable[0]!.id;
      }
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      loading = false;
    }
  }

  async function voidSession(): Promise<void> {
    if (voidReason.trim().length < 3) return;
    acting = 'void';
    actionError = null;
    actionSuccess = null;
    try {
      await apiRequest(`/admin/exam-sessions/${sessionId}/void`, {
        method: 'POST',
        token: session.accessToken,
        body: { reason: voidReason.trim() },
      });
      actionSuccess = 'Sesi dibatalkan (VOIDED). Data tetap tersimpan.';
      voidReason = '';
      await load();
    } catch (cause) {
      actionError = apiErrorMessage(cause);
    } finally {
      acting = null;
    }
  }

  async function recompute(): Promise<void> {
    acting = 'recompute';
    actionError = null;
    actionSuccess = null;
    try {
      const result = await apiRequest<{ sessionId: string; scoringVersion: number }>(
        `/admin/exam-sessions/${sessionId}/recompute`,
        { method: 'POST', token: session.accessToken },
      );
      actionSuccess = `Skor dihitung ulang dari snapshot (versi ${result.scoringVersion}).`;
      await load();
    } catch (cause) {
      actionError = apiErrorMessage(cause);
    } finally {
      acting = null;
    }
  }

  async function unlock(): Promise<void> {
    if (!selectedSubtestId || unlockReason.trim().length < 3) return;
    acting = 'unlock';
    actionError = null;
    actionSuccess = null;
    try {
      const result = await apiRequest<{ endsAt: string }>(
        `/admin/exam-sessions/${sessionId}/subtests/${selectedSubtestId}/unlock`,
        {
          method: 'POST',
          token: session.accessToken,
          body: { reason: unlockReason.trim() },
        },
      );
      actionSuccess = `Subtes dibuka kembali. Timer baru berakhir ${formatDateTime(result.endsAt)}.`;
      unlockReason = '';
      await load();
    } catch (cause) {
      actionError = apiErrorMessage(cause);
    } finally {
      acting = null;
    }
  }

  function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
    if (status === 'COMPLETED') return 'success';
    if (status === 'ELIMINATED' || status === 'EXPIRED') return 'danger';
    if (status === 'ACTIVE' || status === 'IN_PROGRESS') return 'info';
    return 'neutral';
  }

  function statusLabel(status: string | null | undefined): string {
    return status ? status.replaceAll('_', ' ') : '-';
  }

  function percent(value: number | null | undefined): string {
    return value === null || value === undefined ? '-' : `${value.toFixed(2)}%`;
  }

  function subtestLabel(subtest: SessionSubtestSummary): string {
    return `${subtest.subtestCode} · ${statusLabel(subtest.status)}`;
  }
</script>

<svelte:head>
  <title>Detail sesi - Admin TES CAT</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <p class="eyebrow">Monitoring sesi</p>
      <h1 class="page__title">{detail?.user.fullName ?? 'Detail sesi'}</h1>
      <p class="muted mono">{sessionId}</p>
    </div>
    <div class="header-actions">
      <Button variant="secondary" href="/admin/monitoring">Kembali</Button>
      <Button variant="secondary" onclick={load}>Muat ulang</Button>
    </div>
  </header>

  {#if error}
    <Alert tone="danger" title="Gagal memuat sesi">{error}</Alert>
  {:else if loading && !detail}
    <div class="center"><Spinner size={26} label="Memuat detail sesi" /></div>
  {:else if detail}
    {#if actionError}
      <Alert tone="danger" title="Aksi gagal" onclose={() => (actionError = null)}
        >{actionError}</Alert
      >
    {/if}
    {#if actionSuccess}
      <Alert tone="success" title="Berhasil" onclose={() => (actionSuccess = null)}
        >{actionSuccess}</Alert
      >
    {/if}

    <div class="grid">
      <Card title="Ringkasan sesi">
        <dl class="facts">
          <div>
            <dt>Status</dt>
            <dd>
              <Badge tone={statusTone(detail.session.status)}
                >{statusLabel(detail.session.status)}</Badge
              >
            </dd>
          </div>
          <div>
            <dt>Tanggal ujian</dt>
            <dd>{detail.session.examDate}</dd>
          </div>
          <div>
            <dt>Mulai</dt>
            <dd>{formatDateTime(detail.session.startedAt)}</dd>
          </div>
          <div>
            <dt>Selesai</dt>
            <dd>{formatDateTime(detail.session.finishedAt)}</dd>
          </div>
          <div>
            <dt>Skor total</dt>
            <dd>{percent(detail.session.totalScore)}</dd>
          </div>
          <div>
            <dt>Lulus</dt>
            <dd>{detail.session.passed === null ? '-' : detail.session.passed ? 'Ya' : 'Tidak'}</dd>
          </div>
          <div>
            <dt>Versi penilaian</dt>
            <dd>v{detail.session.scoringVersion}</dd>
          </div>
          {#if detail.session.eliminatedSubtestCode}
            <div>
              <dt>Gugur pada</dt>
              <dd class="mono">{detail.session.eliminatedSubtestCode}</dd>
            </div>
          {/if}
        </dl>
      </Card>

      <Card title="Peserta">
        <dl class="facts">
          <div>
            <dt>Nama</dt>
            <dd>{detail.user.fullName}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd class="wrap">{detail.user.email}</dd>
          </div>
          <div>
            <dt>User ID</dt>
            <dd class="mono wrap">{detail.user.id}</dd>
          </div>
        </dl>
      </Card>
    </div>

    <Card title="Subtes">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th scope="col">Stage</th>
              <th scope="col">Subtes</th>
              <th scope="col">Status</th>
              <th scope="col">Jawaban</th>
              <th scope="col">Skor</th>
              <th scope="col">Persentase</th>
              <th scope="col">Kunci</th>
              <th scope="col">Mulai</th>
              <th scope="col">Selesai</th>
            </tr>
          </thead>
          <tbody>
            {#each subtests as subtest (subtest.id)}
              <tr>
                <td class="mono">{subtest.stageCode}</td>
                <td>
                  <p class="cell-title">{subtest.name}</p>
                  <p class="cell-sub mono">{subtest.subtestCode}</p>
                </td>
                <td
                  ><Badge tone={statusTone(subtest.status)}>{statusLabel(subtest.status)}</Badge
                  ></td
                >
                <td>{subtest.answeredCount} / {subtest.questionCount}</td>
                <td>{subtest.percentage === null ? '-' : percent(subtest.percentage)}</td>
                <td>{subtest.passed === null ? '-' : subtest.passed ? 'Lulus' : 'Tidak lulus'}</td>
                <td class="mono">{subtest.lockReason ?? '-'}</td>
                <td class="cell-sub">{formatDateTime(subtest.startedAt)}</td>
                <td class="cell-sub">{formatDateTime(subtest.finishedAt)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </Card>

    <div class="grid">
      <Card title="Pelanggaran" description="Dikelompokkan per jenis oleh server.">
        {#if detail.violations.length === 0}
          <p class="muted">Tidak ada pelanggaran tercatat.</p>
        {:else}
          <ul class="list">
            {#each detail.violations as violation (violation.type)}
              <li>
                <div>
                  <p class="mono">{violation.type}</p>
                  <p class="cell-sub">{formatDateTime(violation.lastAt)}</p>
                </div>
                <div class="list__right">
                  <Badge tone="warning">{violation.count}x</Badge>
                  {#if violation.actionTaken}
                    <Badge tone="danger">{violation.actionTaken}</Badge>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </Card>

      <Card title="Sinyal proctoring" description="100 sinyal terakhir.">
        {#if detail.proctoring.length === 0}
          <p class="muted">Belum ada sinyal proctoring.</p>
        {:else}
          <ul class="list list--scroll">
            {#each detail.proctoring as event, index (index)}
              <li>
                <div>
                  <p class="mono">{event.type}</p>
                  <p class="cell-sub">{formatDateTime(event.occurredAt)}</p>
                </div>
                <div class="list__right">
                  <Badge
                    tone={event.severity === 'high'
                      ? 'danger'
                      : event.severity === 'medium'
                        ? 'warning'
                        : 'neutral'}
                  >
                    {event.severity}
                  </Badge>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </Card>
    </div>

    <Card title="Tindakan admin" description="Semua tindakan diaudit dengan alasan wajib.">
      <div class="actions-grid">
        <div class="action-box">
          <h3 class="action-box__title">Void sesi</h3>
          <p class="muted">
            Membatalkan sesi tanpa menghapus data. Peserta tidak dapat melanjutkan.
          </p>
          <label class="field">
            <span class="field__label">Alasan</span>
            <input
              class="input"
              bind:value={voidReason}
              maxlength="500"
              placeholder="Minimal 3 karakter"
            />
          </label>
          <Button
            variant="danger"
            disabled={!canVoid || voidReason.trim().length < 3}
            loading={acting === 'void'}
            onclick={voidSession}
          >
            Void sesi
          </Button>
        </div>

        <div class="action-box">
          <h3 class="action-box__title">Hitung ulang skor</h3>
          <p class="muted">
            Menilai ulang seluruh subtes dari snapshot. Hasil deterministik; versi penilaian naik.
          </p>
          <Button
            variant="secondary"
            disabled={!canRecompute}
            loading={acting === 'recompute'}
            onclick={recompute}
          >
            Recompute
          </Button>
        </div>

        <div class="action-box">
          <h3 class="action-box__title">Buka paksa subtes</h3>
          <p class="muted">Hanya SUPER_ADMIN. Timer baru dimulai penuh saat subtes dibuka.</p>
          {#if !canUnlock}
            <p class="muted">Permission <code>exams.force_unlock</code> diperlukan.</p>
          {:else if unlockable.length === 0}
            <p class="muted">Tidak ada subtes yang dapat dibuka.</p>
          {:else}
            <label class="field">
              <span class="field__label">Subtes</span>
              <select class="input" bind:value={selectedSubtestId}>
                {#each unlockable as subtest (subtest.id)}
                  <option value={subtest.id}>{subtestLabel(subtest)}</option>
                {/each}
              </select>
            </label>
            <label class="field">
              <span class="field__label">Alasan</span>
              <input
                class="input"
                bind:value={unlockReason}
                maxlength="500"
                placeholder="Minimal 3 karakter"
              />
            </label>
            <Button
              variant="secondary"
              disabled={!selectedSubtestId || unlockReason.trim().length < 3}
              loading={acting === 'unlock'}
              onclick={unlock}
            >
              Buka subtes
            </Button>
          {/if}
        </div>
      </div>
    </Card>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
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

  .eyebrow {
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-subtle);
  }

  .header-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .grid {
    display: grid;
    gap: var(--space-5);
  }

  .facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--space-4);
    margin: 0;
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

  .wrap {
    overflow-wrap: anywhere;
  }

  .table-wrap {
    overflow-x: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
  }

  .table th,
  .table td {
    padding: var(--space-3);
    text-align: left;
    border-bottom: 1px solid var(--color-border);
    vertical-align: top;
    white-space: nowrap;
  }

  .table thead th {
    background: var(--color-surface-muted);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .table tbody tr:last-child td {
    border-bottom: 0;
  }

  .cell-title {
    font-weight: 600;
  }

  .cell-sub {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .list--scroll {
    max-height: 280px;
    overflow-y: auto;
  }

  .list li {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--color-border);
  }

  .list li:last-child {
    border-bottom: 0;
  }

  .list__right {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--space-4);
  }

  .action-box {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface-muted);
  }

  .action-box__title {
    font-size: var(--text-base);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .field__label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-muted);
  }

  .input {
    width: 100%;
    padding: 0.55rem 0.7rem;
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

  .center {
    display: grid;
    place-items: center;
    padding-block: var(--space-12);
  }

  .mono {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }

  code {
    font-family: var(--font-mono);
    font-size: 0.92em;
  }

  @media (min-width: 900px) {
    .grid {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
