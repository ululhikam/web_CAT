<script lang="ts">
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiErrorMessage, apiRequest } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import { formatDateTime } from '$lib/format';
  import type {
    AdminSessionPage,
    AdminSessionRow,
    ExamDashboardStats,
    SessionStatus,
  } from '@webcat/contracts';
  import { SESSION_STATUSES } from '@webcat/contracts';

  let rows = $state<AdminSessionRow[]>([]);
  let dashboard = $state<ExamDashboardStats | null>(null);
  let nextCursor = $state<string | null>(null);
  let statusFilter = $state<SessionStatus | ''>('');
  let search = $state('');
  let loading = $state(true);
  let loadingMore = $state(false);
  let error = $state<string | null>(null);
  let initialized = false;

  const canMonitor = $derived(session.can('exams.monitor'));

  $effect(() => {
    if (!session.user || !session.accessToken || !canMonitor || initialized) return;
    initialized = true;
    void loadFirst();
  });

  function queryString(cursor?: string | null): string {
    const params = new URLSearchParams({ limit: '25' });
    if (statusFilter) params.set('status', statusFilter);
    if (search.trim()) params.set('q', search.trim());
    if (cursor) params.set('cursor', cursor);
    return params.toString();
  }

  async function loadFirst(): Promise<void> {
    loading = true;
    error = null;
    try {
      const [page, stats] = await Promise.all([
        apiRequest<AdminSessionPage>(`/admin/exam-sessions?${queryString()}`, {
          token: session.accessToken,
        }),
        apiRequest<ExamDashboardStats>('/admin/dashboard/exams', {
          token: session.accessToken,
        }),
      ]);
      rows = page.items;
      nextCursor = page.nextCursor;
      dashboard = stats;
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      loading = false;
    }
  }

  async function loadMore(): Promise<void> {
    if (!nextCursor || loadingMore) return;
    loadingMore = true;
    error = null;
    try {
      const page = await apiRequest<AdminSessionPage>(
        `/admin/exam-sessions?${queryString(nextCursor)}`,
        { token: session.accessToken },
      );
      rows = [...rows, ...page.items];
      nextCursor = page.nextCursor;
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      loadingMore = false;
    }
  }

  function statusTone(
    status: SessionStatus,
  ): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
    if (status === 'COMPLETED') return 'success';
    if (status === 'ELIMINATED' || status === 'EXPIRED') return 'danger';
    if (status === 'IN_PROGRESS' || status === 'CREATED') return 'info';
    return 'neutral';
  }

  function statusLabel(status: string): string {
    return status.replaceAll('_', ' ');
  }

  function percent(value: number | null | undefined): string {
    return value === null || value === undefined ? '-' : `${value.toFixed(2)}%`;
  }

  function remaining(value: number | null): string {
    if (value === null) return '-';
    const totalSeconds = Math.max(0, Math.ceil(value / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
</script>

<svelte:head>
  <title>Monitoring ujian -" Admin Web CAT</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">Monitoring ujian</h1>
      <p class="muted">
        Pantau sesi berjalan, pelanggaran, dan hasil. Aksi void/recompute/unlock tersedia di detail
        sesi.
      </p>
    </div>
    <Button variant="secondary" onclick={loadFirst}>Muat ulang</Button>
  </header>

  {#if !canMonitor}
    <Alert tone="danger" title="Akses ditolak">
      Akun Anda tidak memiliki permission <code>exams.monitor</code>.
    </Alert>
  {:else}
    {#if error}
      <Alert tone="danger" title="Gagal memuat data" onclose={() => (error = null)}>{error}</Alert>
    {/if}

    {#if dashboard}
      <div class="stats">
        <Card title="Total sesi">
          <p class="stat__value">{dashboard.totalSessions}</p>
        </Card>
        <Card title="Berjalan">
          <p class="stat__value">{dashboard.inProgress}</p>
        </Card>
        <Card title="Selesai">
          <p class="stat__value">{dashboard.completed}</p>
        </Card>
        <Card title="Gugur">
          <p class="stat__value stat__value--danger">{dashboard.eliminated}</p>
        </Card>
        <Card title="Tingkat lulus">
          <p class="stat__value">{percent(dashboard.passRate)}</p>
        </Card>
      </div>

      {#if dashboard.perSubtest.length > 0}
        <Card title="Ringkasan per subtes">
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">Subtes</th>
                  <th scope="col">Percobaan</th>
                  <th scope="col">Rata-rata</th>
                  <th scope="col">Lulus</th>
                  <th scope="col">Gugur</th>
                </tr>
              </thead>
              <tbody>
                {#each dashboard.perSubtest as entry (entry.subtestCode)}
                  <tr>
                    <td class="mono">{entry.subtestCode}</td>
                    <td>{entry.attempts}</td>
                    <td>{percent(entry.averagePercentage)}</td>
                    <td>{percent(entry.passRate)}</td>
                    <td>{entry.eliminationCount}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </Card>
      {/if}
    {/if}

    <Card title="Daftar sesi" description="Filter berdasarkan status atau cari email/nama peserta.">
      <form
        class="filters"
        onsubmit={(event) => {
          event.preventDefault();
          void loadFirst();
        }}
      >
        <label class="field">
          <span class="field__label">Status</span>
          <select class="input" bind:value={statusFilter}>
            <option value="">Semua</option>
            {#each SESSION_STATUSES as status (status)}
              <option value={status}>{status}</option>
            {/each}
          </select>
        </label>
        <label class="field field--grow">
          <span class="field__label">Cari peserta</span>
          <input class="input" bind:value={search} placeholder="Email atau nama" maxlength="120" />
        </label>
        <Button type="submit" {loading}>Terapkan</Button>
      </form>

      {#if loading}
        <div class="center"><Spinner size={24} label="Memuat sesi" /></div>
      {:else if rows.length === 0}
        <p class="muted">Tidak ada sesi yang cocok.</p>
      {:else}
        <div class="table-wrap">
          <table class="table">
            <caption class="sr-only">Daftar sesi ujian</caption>
            <thead>
              <tr>
                <th scope="col">Peserta</th>
                <th scope="col">Tanggal</th>
                <th scope="col">Status</th>
                <th scope="col">Subtes aktif</th>
                <th scope="col">Sisa</th>
                <th scope="col">Skor</th>
                <th scope="col">Pelanggaran</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {#each rows as row (row.id)}
                <tr>
                  <td>
                    <p class="cell-title">{row.userFullName}</p>
                    <p class="cell-sub">{row.userEmail}</p>
                  </td>
                  <td>
                    <p>{row.examDate}</p>
                    <p class="cell-sub">{formatDateTime(row.startedAt)}</p>
                  </td>
                  <td><Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge></td>
                  <td>
                    {#if row.currentSubtestCode}
                      <p class="mono">{row.currentSubtestCode}</p>
                      <p class="cell-sub">{statusLabel(row.currentSubtestStatus ?? '-')}</p>
                    {:else}
                      -
                    {/if}
                  </td>
                  <td class="mono">{remaining(row.remainingMs)}</td>
                  <td>{percent(row.totalScore)}</td>
                  <td>
                    {#if row.violationCount > 0}
                      <Badge tone="warning">{row.violationCount}</Badge>
                    {:else}
                      <span class="muted">0</span>
                    {/if}
                  </td>
                  <td>
                    <Button size="sm" variant="secondary" href={`/admin/monitoring/${row.id}`}>
                      Detail
                    </Button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        {#if nextCursor}
          <div class="more">
            <Button variant="secondary" loading={loadingMore} onclick={loadMore}>Muat lagi</Button>
          </div>
        {/if}
      {/if}
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

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--space-3);
  }

  .stat__value {
    font-size: var(--text-2xl);
    font-weight: 750;
    font-variant-numeric: tabular-nums;
  }

  .stat__value--danger {
    color: var(--color-danger);
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 160px;
  }

  .field--grow {
    flex: 1;
    min-width: 220px;
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

  .center {
    display: grid;
    place-items: center;
    padding-block: var(--space-10);
  }

  .more {
    display: flex;
    justify-content: center;
    margin-top: var(--space-4);
  }

  .mono {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }

  code {
    font-family: var(--font-mono);
    font-size: 0.92em;
  }
</style>
