<script lang="ts">
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiErrorMessage, apiRequest } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import { formatDateTime } from '$lib/format';
  import type { ExamHistoryItem, ExamStatsView } from '@webcat/contracts';

  interface HistoryPage {
    items: ExamHistoryItem[];
    nextCursor: string | null;
    hasMore: boolean;
  }

  let items = $state<ExamHistoryItem[]>([]);
  let stats = $state<ExamStatsView | null>(null);
  let nextCursor = $state<string | null>(null);
  let loading = $state(true);
  let loadingMore = $state(false);
  let error = $state<string | null>(null);

  $effect(() => {
    if (!session.user || !session.accessToken) return;
    let cancelled = false;

    void (async () => {
      loading = true;
      error = null;
      try {
        const [page, statsResult] = await Promise.all([
          apiRequest<HistoryPage>('/exams/history?limit=20', { token: session.accessToken }),
          apiRequest<ExamStatsView>('/exams/stats', { token: session.accessToken }),
        ]);
        if (cancelled) return;
        items = page.items;
        nextCursor = page.nextCursor;
        stats = statsResult;
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

  async function loadMore(): Promise<void> {
    if (!nextCursor || loadingMore) return;
    loadingMore = true;
    error = null;
    try {
      const page = await apiRequest<HistoryPage>(
        `/exams/history?limit=20&cursor=${encodeURIComponent(nextCursor)}`,
        { token: session.accessToken },
      );
      items = [...items, ...page.items];
      nextCursor = page.nextCursor;
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      loadingMore = false;
    }
  }

  function statusTone(
    item: ExamHistoryItem,
  ): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
    if (item.status === 'COMPLETED') return item.passed ? 'success' : 'warning';
    if (item.status === 'ELIMINATED' || item.status === 'EXPIRED') return 'danger';
    if (item.status === 'IN_PROGRESS' || item.status === 'CREATED') return 'info';
    return 'neutral';
  }

  function statusLabel(status: string): string {
    return status.replaceAll('_', ' ');
  }

  function percent(value: number | null | undefined): string {
    return value === null || value === undefined ? '-' : `${value.toFixed(2)}%`;
  }

  function number(value: number | null | undefined): string {
    return value === null || value === undefined ? '-' : String(value);
  }

  const maxTrend = $derived(
    Math.max(1, ...(stats?.trend.map((entry) => entry.totalScore ?? 0) ?? [0])),
  );
</script>

<svelte:head>
  <title>Riwayat ujian -" Web CAT</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">Riwayat ujian</h1>
      <p class="muted">Statistik dihitung server dari sesi yang tersimpan.</p>
    </div>
    <Button href="/exam">Halaman ujian</Button>
  </header>

  {#if error}
    <Alert tone="danger" title="Gagal memuat riwayat">{error}</Alert>
  {/if}

  {#if loading}
    <div class="center"><Spinner size={26} label="Memuat riwayat" /></div>
  {:else}
    {#if stats}
      <div class="stats">
        <Card title="Total sesi">
          <p class="stat__value">{stats.totalSessions}</p>
          <p class="stat__caption">
            {stats.completedSessions} selesai · {stats.eliminatedSessions} gugur
          </p>
        </Card>
        <Card title="Tingkat lulus">
          <p class="stat__value">{percent(stats.passRate)}</p>
          <p class="stat__caption">dari sesi selesai</p>
        </Card>
        <Card title="Rata-rata skor">
          <p class="stat__value">{percent(stats.averageScore)}</p>
          <p class="stat__caption">
            terbaik {percent(stats.bestScore)} · terakhir {percent(stats.lastScore)}
          </p>
        </Card>
      </div>

      {#if stats.trend.length > 0}
        <Card title="Tren skor" description="Sepuluh sesi terakhir, lama ke baru.">
          <div class="trend">
            {#each stats.trend as entry, index (index)}
              <div class="trend__item">
                <div class="trend__track">
                  <span
                    class="trend__bar"
                    class:trend__bar--pass={entry.passed === true}
                    class:trend__bar--fail={entry.passed === false}
                    style={`height:${Math.max(4, ((entry.totalScore ?? 0) / maxTrend) * 100)}%`}
                    title={`${entry.examDate}: ${percent(entry.totalScore)}`}
                  ></span>
                </div>
                <span class="trend__label">{entry.examDate.slice(5)}</span>
              </div>
            {/each}
          </div>
        </Card>
      {/if}

      {#if stats.perSubtest.length > 0}
        <Card title="Rata-rata per subtes">
          <div class="subtests">
            {#each stats.perSubtest as entry (entry.subtestCode)}
              <div class="subtest">
                <span class="subtest__name">{entry.subtestCode}</span>
                <div class="subtest__track">
                  <span
                    class="subtest__fill"
                    style={`width:${Math.max(0, Math.min(100, entry.averagePercentage ?? 0))}%`}
                  ></span>
                </div>
                <span class="subtest__value">{percent(entry.averagePercentage)}</span>
                <span class="subtest__attempts">{entry.attempts}x</span>
              </div>
            {/each}
          </div>
        </Card>
      {/if}
    {/if}

    <Card title="Daftar sesi" description="Klik sesi untuk melihat rincian hasil.">
      {#if items.length === 0}
        <p class="muted">Belum ada sesi ujian.</p>
        <Button href="/exam">Mulai ujian</Button>
      {:else}
        <div class="table-wrap">
          <table class="table">
            <caption class="sr-only">Riwayat sesi ujian</caption>
            <thead>
              <tr>
                <th scope="col">Tanggal ujian</th>
                <th scope="col">Status</th>
                <th scope="col">Skor total</th>
                <th scope="col">Mulai</th>
                <th scope="col">Selesai</th>
                <th scope="col">Catatan</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {#each items as item (item.sessionId)}
                <tr>
                  <td><strong>{item.examDate}</strong></td>
                  <td><Badge tone={statusTone(item)}>{statusLabel(item.status)}</Badge></td>
                  <td>{percent(item.totalScore)}</td>
                  <td class="muted">{formatDateTime(item.startedAt)}</td>
                  <td class="muted">{formatDateTime(item.finishedAt)}</td>
                  <td class="muted">
                    {#if item.eliminatedSubtestCode}
                      Gugur pada {item.eliminatedSubtestCode}
                    {:else if item.status === 'IN_PROGRESS' || item.status === 'CREATED'}
                      Sesi masih berjalan
                    {:else if item.passed === true}
                      Lulus
                    {:else if item.passed === false}
                      Belum lulus
                    {:else}
                      -
                    {/if}
                  </td>
                  <td>
                    {#if item.status === 'IN_PROGRESS' || item.status === 'CREATED'}
                      <Button size="sm" href={`/exam/${item.sessionId}`}>Lanjutkan</Button>
                    {:else}
                      <Button size="sm" variant="secondary" href={`/results/${item.sessionId}`}>
                        Hasil
                      </Button>
                    {/if}
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
    max-width: 1040px;
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

  .center {
    display: grid;
    place-items: center;
    padding-block: var(--space-12);
  }

  .stats {
    display: grid;
    gap: var(--space-4);
  }

  .stat__value {
    font-size: var(--text-3xl);
    font-weight: 750;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }

  .stat__caption {
    margin-top: var(--space-1);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .trend {
    display: flex;
    align-items: flex-end;
    gap: var(--space-2);
    height: 140px;
    padding-top: var(--space-2);
  }

  .trend__item {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
    height: 100%;
  }

  .trend__track {
    display: flex;
    align-items: flex-end;
    width: 100%;
    height: 100%;
    border-radius: var(--radius-sm);
    background: var(--color-surface-muted);
    overflow: hidden;
  }

  .trend__bar {
    width: 100%;
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    background: var(--color-primary);
    opacity: 0.7;
  }

  .trend__bar--pass {
    background: var(--color-success);
    opacity: 0.85;
  }

  .trend__bar--fail {
    background: var(--color-warning);
    opacity: 0.85;
  }

  .trend__label {
    font-size: 0.65rem;
    color: var(--color-text-subtle);
    white-space: nowrap;
  }

  .subtests {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .subtest {
    display: grid;
    grid-template-columns: 110px 1fr 60px 40px;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
  }

  .subtest__name {
    font-weight: 600;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }

  .subtest__track {
    height: 10px;
    border-radius: var(--radius-full);
    background: var(--color-border);
    overflow: hidden;
  }

  .subtest__fill {
    display: block;
    height: 100%;
    background: var(--color-primary);
  }

  .subtest__value {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .subtest__attempts {
    color: var(--color-text-subtle);
    text-align: right;
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

  .more {
    display: flex;
    justify-content: center;
    margin-top: var(--space-4);
  }

  @media (min-width: 768px) {
    .stats {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
