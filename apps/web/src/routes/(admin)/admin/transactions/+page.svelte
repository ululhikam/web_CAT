<script lang="ts">
  import { onMount } from 'svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import { apiPage } from '$lib/billing/api';
  import { session } from '$lib/stores/session.svelte';
  import { formatDateTime, formatIdr } from '$lib/format';
  import type {
    AdminTransactionSummary,
    TransactionStatus,
  } from '@webcat/contracts';

  const statusOptions: Array<{ value: '' | TransactionStatus; label: string }> = [
    { value: '', label: 'Semua status' },
    { value: 'PENDING', label: 'Menunggu' },
    { value: 'SUCCESS', label: 'Berhasil' },
    { value: 'EXPIRED', label: 'Kedaluwarsa' },
    { value: 'FAILED', label: 'Gagal' },
    { value: 'CANCELLED', label: 'Dibatalkan' },
    { value: 'REFUNDED', label: 'Refund' },
  ];

  let items = $state<AdminTransactionSummary[]>([]);
  let nextCursor = $state<string | null>(null);
  let hasMore = $state(false);
  let loading = $state(true);
  let loadingMore = $state(false);
  let error = $state<string | null>(null);
  let notice = $state<string | null>(null);

  let status = $state<'' | TransactionStatus>('');
  let query = $state('');
  let planCode = $state('');
  let from = $state('');
  let to = $state('');

  let actionId = $state<string | null>(null);
  let actionKind = $state<'mark-paid' | 'refund' | null>(null);
  let reason = $state('');
  let acting = $state(false);

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
      if (query.trim()) params.set('q', query.trim());
      if (planCode.trim()) params.set('planCode', planCode.trim().toUpperCase());
      if (from) params.set('from', new Date(`${from}T00:00:00+07:00`).toISOString());
      if (to) params.set('to', new Date(`${to}T23:59:59+07:00`).toISOString());
      if (!reset && nextCursor) params.set('cursor', nextCursor);

      const page = await apiPage<AdminTransactionSummary>(
        `/admin/transactions?${params}`,
        session.accessToken,
      );
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

  function startAction(item: AdminTransactionSummary, kind: 'mark-paid' | 'refund'): void {
    actionId = item.id;
    actionKind = kind;
    reason = '';
    notice = null;
    error = null;
  }

  function cancelAction(): void {
    actionId = null;
    actionKind = null;
    reason = '';
  }

  async function submitAction(): Promise<void> {
    if (!actionId || !actionKind) return;
    acting = true;
    error = null;
    notice = null;

    try {
      await apiRequest<AdminTransactionSummary>(`/admin/transactions/${actionId}/${actionKind}`, {
        method: 'POST',
        token: session.accessToken,
        body:
          actionKind === 'refund'
            ? { reason: reason.trim(), revokeSubscription: true }
            : { reason: reason.trim() },
      });
      notice =
        actionKind === 'refund'
          ? 'Refund dicatat dan langganan terkait dicabut.'
          : 'Transaksi ditandai lunas dan langganan diaktifkan.';
      cancelAction();
      await load();
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      acting = false;
    }
  }

  function statusTone(value: TransactionStatus) {
    if (value === 'SUCCESS') return 'success';
    if (value === 'PENDING') return 'warning';
    if (value === 'REFUNDED') return 'brand';
    return 'danger';
  }
</script>

<svelte:head>
  <title>Transaksi — Admin TES CAT</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">Transaksi</h1>
      <p class="muted">Pantau pembayaran dan lakukan rekonsiliasi manual dengan alasan tercatat.</p>
    </div>
  </header>

  <form
    class="filters"
    onsubmit={(event) => {
      event.preventDefault();
      void load();
    }}
  >
    <input
      class="filters__input"
      type="search"
      placeholder="Cari order, invoice, nama, atau email"
      aria-label="Cari transaksi"
      bind:value={query}
    />
    <select class="filters__input" aria-label="Filter status" bind:value={status}>
      {#each statusOptions as option (option.value)}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
    <input
      class="filters__input filters__input--short"
      type="text"
      placeholder="Kode paket"
      aria-label="Filter paket"
      bind:value={planCode}
    />
    <input class="filters__input filters__input--short" type="date" aria-label="Dari tanggal" bind:value={from} />
    <input class="filters__input filters__input--short" type="date" aria-label="Sampai tanggal" bind:value={to} />
    <Button type="submit" variant="secondary">Terapkan</Button>
  </form>

  {#if error}
    <Alert tone="danger" title="Operasi gagal">{error}</Alert>
  {/if}

  {#if notice}
    <Alert tone="success" title="Berhasil">{notice}</Alert>
  {/if}

  {#if loading}
    <div class="center"><Spinner size={26} label="Memuat transaksi" /></div>
  {:else if items.length === 0}
    <Card title="Tidak ada transaksi">
      <p class="muted">Ubah filter atau tunggu transaksi pertama masuk.</p>
    </Card>
  {:else}
    <div class="table-wrap">
      <table class="table">
        <caption class="sr-only">Daftar transaksi</caption>
        <thead>
          <tr>
            <th scope="col">Tanggal</th>
            <th scope="col">Pemesan</th>
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
                <p class="user__name">{item.userFullName}</p>
                <p class="user__email">{item.userEmail}</p>
              </td>
              <td>
                <p class="mono">{item.invoiceNumber ?? '—'}</p>
                <p class="order">{item.orderId}</p>
              </td>
              <td>{item.planName ?? item.planCode ?? '—'}</td>
              <td>{formatIdr(item.amountIdr)}</td>
              <td>
                <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                {#if item.refundReason}
                  <p class="reason">{item.refundReason}</p>
                {/if}
              </td>
              <td class="cell-actions">
                {#if item.status === 'PENDING'}
                  <Button size="sm" variant="secondary" onclick={() => startAction(item, 'mark-paid')}>
                    Tandai lunas
                  </Button>
                {:else if item.status === 'SUCCESS'}
                  <Button size="sm" variant="danger" onclick={() => startAction(item, 'refund')}>
                    Refund
                  </Button>
                {/if}
              </td>
            </tr>

            {#if actionId === item.id && actionKind}
              <tr class="action-row">
                <td colspan="7">
                  <form
                    class="action"
                    onsubmit={(event) => {
                      event.preventDefault();
                      void submitAction();
                    }}
                  >
                    <p class="action__title">
                      {actionKind === 'refund' ? 'Refund transaksi' : 'Tandai lunas'} — {item.orderId}
                    </p>
                    <label class="action__field">
                      <span>Alasan (wajib, minimal 3 karakter)</span>
                      <textarea
                        bind:value={reason}
                        rows="2"
                        minlength="3"
                        maxlength="500"
                        required
                      ></textarea>
                    </label>
                    {#if actionKind === 'refund'}
                      <p class="action__hint">
                        Refund akan mencabut langganan yang berasal dari transaksi ini. Riwayat tetap
                        tersimpan.
                      </p>
                    {/if}
                    <div class="action__buttons">
                      <Button type="submit" variant={actionKind === 'refund' ? 'danger' : 'primary'} loading={acting}>
                        Konfirmasi
                      </Button>
                      <Button variant="secondary" onclick={cancelAction}>Batal</Button>
                    </div>
                  </form>
                </td>
              </tr>
            {/if}
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
  }

  .page__title {
    font-size: var(--text-2xl);
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .filters__input {
    padding: 0.5rem 0.7rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font-size: var(--text-sm);
  }

  .filters__input--short {
    width: 9.5rem;
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

  .user__name {
    font-weight: 600;
  }

  .user__email,
  .order {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .mono {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }

  .reason {
    max-width: 22ch;
    margin-top: var(--space-1);
    font-size: var(--text-xs);
    color: var(--color-danger);
    white-space: normal;
  }

  .cell-actions {
    text-align: right;
  }

  .action-row td {
    background: var(--color-surface-muted);
  }

  .action {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    max-width: 520px;
    white-space: normal;
  }

  .action__title {
    font-weight: 600;
  }

  .action__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font-size: var(--text-sm);
  }

  .action__field textarea {
    padding: 0.5rem 0.7rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    font: inherit;
  }

  .action__hint {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .action__buttons {
    display: flex;
    gap: var(--space-2);
  }

  .more {
    display: flex;
    justify-content: center;
  }

  .center {
    display: grid;
    place-items: center;
    padding-block: var(--space-12);
  }
</style>
