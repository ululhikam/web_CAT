<script lang="ts">
  import { onMount } from 'svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import { formatDate, formatIdr } from '$lib/format';
  import type { RevenueKpi } from '@webcat/contracts';

  /**
   * Widget revenue dashboard admin (§9.7).
   *
   * Read-only: angka berasal dari snapshot transaksi, bukan harga paket saat
   * ini, sehingga laporan lama tidak berubah ketika harga dinaikkan.
   */

  let days = $state(30);
  let data = $state<RevenueKpi | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  async function load(): Promise<void> {
    if (!session.accessToken) return;
    loading = true;
    error = null;
    try {
      data = await apiRequest<RevenueKpi>(`/admin/dashboard/revenue?days=${days}`, {
        token: session.accessToken,
      });
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void load();
  });

  const maxDaily = $derived(
    Math.max(1, ...(data?.daily.map((row) => row.revenueIdr) ?? [0])),
  );

  function barHeight(value: number): string {
    return `${Math.max(2, Math.round((value / maxDaily) * 100))}%`;
  }
</script>

<section class="widget" aria-labelledby="revenue-title">
  <header class="widget__head">
    <div>
      <h2 id="revenue-title" class="widget__title">Revenue</h2>
      <p class="muted">
        {data ? `${formatDate(data.from)} — ${formatDate(data.to)}` : 'Memuat rentang…'}
      </p>
    </div>
    <label class="range">
      <span class="range__label">Rentang</span>
      <select
        class="range__select"
        bind:value={days}
        onchange={() => void load()}
      >
        <option value={7}>7 hari</option>
        <option value={30}>30 hari</option>
        <option value={90}>90 hari</option>
        <option value={365}>1 tahun</option>
      </select>
    </label>
  </header>

  {#if error}
    <Alert tone="danger" title="Gagal memuat revenue">{error}</Alert>
  {:else if loading}
    <div class="center"><Spinner size={24} label="Memuat revenue" /></div>
  {:else if data}
    <div class="kpis">
      <div class="kpi">
        <p class="kpi__label">Pendapatan bersih</p>
        <p class="kpi__value">{formatIdr(data.netRevenueIdr)}</p>
        <p class="kpi__hint">Bruto {formatIdr(data.grossRevenueIdr)} · refund {formatIdr(data.refundedIdr)}</p>
      </div>
      <div class="kpi">
        <p class="kpi__label">Transaksi lunas</p>
        <p class="kpi__value">{data.paidCount}</p>
        <p class="kpi__hint">dari {data.transactionCount} transaksi</p>
      </div>
      <div class="kpi">
        <p class="kpi__label">Konversi</p>
        <p class="kpi__value">{data.conversionRate}%</p>
        <p class="kpi__hint">{data.pendingCount} masih menunggu</p>
      </div>
      <div class="kpi">
        <p class="kpi__label">Rata-rata order</p>
        <p class="kpi__value">{formatIdr(data.averageOrderValueIdr)}</p>
        <p class="kpi__hint">{data.activeSubscriptions} langganan aktif</p>
      </div>
    </div>

    <div class="split">
      <Card title="Pendapatan harian" description="Zona waktu Asia/Jakarta">
        <div class="chart" role="img" aria-label="Grafik pendapatan harian">
          {#each data.daily as row (row.date)}
            <div class="chart__col" title={`${row.date}: ${formatIdr(row.revenueIdr)}`}>
              <div class="chart__bar" style={`height:${barHeight(row.revenueIdr)}`}></div>
            </div>
          {/each}
        </div>
        <p class="chart__hint">
          Puncak: {formatIdr(maxDaily)} · {data.expiringCount} langganan berakhir dalam 7 hari
        </p>
      </Card>

      <Card title="Per paket" description="Berdasarkan snapshot harga saat transaksi">
        {#if data.byPlan.length === 0}
          <p class="muted">Belum ada transaksi lunas pada rentang ini.</p>
        {:else}
          <ul class="plans">
            {#each data.byPlan as plan (plan.planCode ?? plan.planName)}
              <li class="plans__item">
                <div>
                  <p class="plans__name">{plan.planName}</p>
                  <p class="plans__code">{plan.planCode ?? '—'}</p>
                </div>
                <div class="plans__numbers">
                  <p class="plans__revenue">{formatIdr(plan.revenueIdr)}</p>
                  <p class="plans__count">{plan.paidCount} lunas</p>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </Card>
    </div>
  {/if}
</section>

<style>
  .widget {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .widget__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .widget__title {
    font-size: var(--text-xl);
  }

  .range {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .range__label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .range__select {
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font-size: var(--text-sm);
  }

  .kpis {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: var(--space-3);
  }

  .kpi {
    padding: var(--space-4);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }

  .kpi__label {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .kpi__value {
    margin-top: var(--space-1);
    font-size: var(--text-xl);
    font-weight: 700;
  }

  .kpi__hint {
    margin-top: var(--space-1);
    font-size: var(--text-xs);
    color: var(--color-text-subtle);
  }

  .split {
    display: grid;
    gap: var(--space-4);
  }

  .chart {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 140px;
    padding-top: var(--space-2);
  }

  .chart__col {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: flex-end;
    min-width: 2px;
  }

  .chart__bar {
    width: 100%;
    border-radius: 2px 2px 0 0;
    background: var(--color-primary);
    opacity: 0.85;
  }

  .chart__hint {
    margin-top: var(--space-3);
    font-size: var(--text-xs);
    color: var(--color-text-subtle);
  }

  .plans {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .plans__item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
    padding-block: var(--space-2);
    border-bottom: 1px dashed var(--color-border);
  }

  .plans__item:last-child {
    border-bottom: 0;
  }

  .plans__name {
    font-weight: 600;
    font-size: var(--text-sm);
  }

  .plans__code {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--color-text-subtle);
  }

  .plans__numbers {
    text-align: right;
  }

  .plans__revenue {
    font-weight: 600;
    font-size: var(--text-sm);
  }

  .plans__count {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .center {
    display: grid;
    place-items: center;
    padding-block: var(--space-10);
  }

  @media (min-width: 900px) {
    .split {
      grid-template-columns: 1.4fr 1fr;
    }
  }
</style>
