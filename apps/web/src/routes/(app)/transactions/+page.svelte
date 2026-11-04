<script lang="ts">
  import { onMount } from 'svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiErrorMessage } from '$lib/api/client';
  import { apiPage } from '$lib/billing/api';
  import { session } from '$lib/stores/session.svelte';
  import { formatDateTime, formatIdr } from '$lib/format';
  import type { TransactionStatus, TransactionSummary } from '@webcat/contracts';

  const statuses: Array<{ value: '' | TransactionStatus; label: string }> = [
    { value: '', label: 'Semua status' },
    { value: 'PENDING', label: 'Menunggu' },
    { value: 'SUCCESS', label: 'Berhasil' },
    { value: 'EXPIRED', label: 'Kedaluwarsa' },
    { value: 'FAILED', label: 'Gagal' },
    { value: 'CANCELLED', label: 'Dibatalkan' },
    { value: 'REFUNDED', label: 'Refund' },
  ];

  let items = $state<TransactionSummary[]>([]);
  let nextCursor = $state<string | null>(null);
  let hasMore = $state(false);
  let status = $state<'' | TransactionStatus>('');
  let loading = $state(true);
  let loadingMore = $state(false);
  let error = $state<string | null>(null);

  async function load(reset = true): Promise<void> {
    if (!session.accessToken) return;

    if (reset) {
      loading = true;
      items = [];
      nextCursor = null;
    } else {
      loadingMore = true;
    }
    error = null;

    try {
      const params = new URLSearchParams({ limit: '20' });
      if (status) params.set('status', status);
      if (!reset && nextCursor) params.set('cursor', nextCursor);

      const page = await apiPage<TransactionSummary>(`/transactions?${params}`, session.accessToken);
      items = reset ? page.items : [...items, ...page.items];
      nextCursor = page.nextCursor;
      hasMore = page.hasMore;
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      loading = false;
      loadingMore = false;
    }
  }

  onMount(() => {
    void load();
  });

  function statusTone(value: TransactionStatus) {
    if (value === 'SUCCESS') return 'success';
    if (value === 'PENDING') return 'warning';
    if (value === 'REFUNDED') return 'brand';
    return 'danger';
  }
</script>

<svelte:head>
  <title>Riwayat transaksi — Web CAT</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">Riwayat transaksi</h1>
      <p class="muted">Semua tagihan dan pembayaran akun Anda.</p>
    </div>
    <Button href="/pricing" size="sm">Beli paket</Button>
  </header>

  <div class="filters">
    <label class="filters__label" for="status">Status</label>
    <select
      id="status"
      class="filters__select"
      bind:value={status}
      onchange={() => void load()}
    >
      {#each statuses as option (option.value)}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  </div>

  {#if error}
    <Alert tone="danger" title="Gagal memuat transaksi">{error}</Alert>
  {/if}

  {#if loading}
    <div class="center-block"><Spinner size={26} label="Memuat transaksi" /></div>
  {:else if items.length === 0}
    <Card title="Belum ada transaksi">
      <p class="muted">Transaksi akan muncul di sini setelah Anda memilih paket.</p>
      <div class="actions">
        <Button href="/pricing">Lihat paket</Button>
      </div>
    </Card>
  {:else}
    <div class="table-wrap">
      <table class="table">
        <caption class="sr-only">Daftar transaksi</caption>
        <thead>
          <tr>
            <th scope="col">Tanggal</th>
            <th scope="col">Invoice / Order</th>
            <th scope="col">Paket</th>
            <th scope="col">Total</th>
            <th scope="col">Status</th>
            <th scope="col"><span class="sr-only">Aksi</span></th>
          </tr>
        </thead>
        <tbody>
          {#each items as item (item.id)}
            <tr>
              <td class="muted">{formatDateTime(item.createdAt)}</td>
              <td>
                <p class="mono">{item.invoiceNumber ?? '—'}</p>
                <p class="order">{item.orderId}</p>
              </td>
              <td>{item.planName ?? item.planCode ?? '—'}</td>
              <td>{formatIdr(item.amountIdr)}</td>
              <td><Badge tone={statusTone(item.status)}>{item.status}</Badge></td>
              <td class="actions-cell">
                <div class="row-actions">
                  {#if item.status === 'PENDING'}
                    <Button
                      size="sm"
                      variant="secondary"
                      href={`/checkout?orderId=${encodeURIComponent(item.orderId)}`}
                    >
                      Lanjutkan
                    </Button>
                  {:else if item.paidAt}
                    <span class="muted">{formatDateTime(item.paidAt)}</span>
                  {/if}
                  {#if item.invoiceNumber}
                    <Button size="sm" variant="ghost" href={`/transactions/${item.id}`}>
                      Invoice
                    </Button>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if hasMore}
      <div class="more">
        <Button variant="secondary" loading={loadingMore} onclick={() => void load(false)}>
          Muat lebih banyak
        </Button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    max-width: 960px;
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

  .filters {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .filters__label {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .filters__select {
    padding: 0.45rem 0.7rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font-size: var(--text-sm);
  }

  .table-wrap {
    overflow-x: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
  }

  .table th,
  .table td {
    padding: var(--space-3) var(--space-4);
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

  .mono {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }

  .order {
    margin-top: 2px;
    font-size: var(--text-xs);
    color: var(--color-text-subtle);
  }

  .actions-cell {
    text-align: right;
  }

  .row-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-2);
  }

  .actions {
    margin-top: var(--space-4);
  }

  .more {
    display: flex;
    justify-content: center;
  }

  .center-block {
    display: grid;
    place-items: center;
    padding-block: var(--space-12);
  }
</style>
