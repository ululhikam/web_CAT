<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import { formatDateTime, formatIdr } from '$lib/format';
  import type { TransactionSummary } from '@webcat/contracts';

  /**
   * Invoice HTML yang bisa dicetak (Ctrl/Cmd+P → Simpan sebagai PDF).
   * Fase 1 sengaja tidak memakai pustaka PDF agar tidak menambah beban bundle.
   */

  let transaction = $state<TransactionSummary | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  async function load(id: string): Promise<void> {
    if (!session.accessToken) return;
    loading = true;
    error = null;
    try {
      transaction = await apiRequest<TransactionSummary>(
        `/transactions/${encodeURIComponent(id)}`,
        { token: session.accessToken },
      );
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void load($page.params.id ?? '');
  });

  const paid = $derived(transaction?.status === 'SUCCESS');
</script>

<svelte:head>
  <title>
    {transaction?.invoiceNumber ?? 'Invoice'} — Web CAT
  </title>
</svelte:head>

<div class="page">
  <div class="toolbar no-print">
    <Button variant="ghost" href="/transactions">Kembali</Button>
    {#if transaction}
      <Button onclick={() => window.print()}>Cetak / simpan PDF</Button>
    {/if}
  </div>

  {#if error}
    <Alert tone="danger" title="Gagal memuat invoice">{error}</Alert>
  {:else if loading}
    <div class="center-block"><Spinner size={26} label="Memuat invoice" /></div>
  {:else if transaction}
    <article class="invoice">
      <header class="invoice__header">
        <div>
          <p class="brand">Web CAT</p>
          <p class="muted text-sm">Platform simulasi ujian Polri</p>
        </div>
        <div class="invoice__meta">
          <p class="invoice__title">Invoice</p>
          <p class="mono">{transaction.invoiceNumber ?? '—'}</p>
          <Badge tone={paid ? 'success' : transaction.status === 'PENDING' ? 'warning' : 'danger'}>
            {transaction.status}
          </Badge>
        </div>
      </header>

      <section class="grid">
        <div>
          <h2 class="label">Ditagihkan kepada</h2>
          <p class="strong">{session.user?.fullName ?? '—'}</p>
          <p class="muted text-sm">{session.user?.email ?? '—'}</p>
        </div>
        <div>
          <h2 class="label">Detail</h2>
          <dl class="details">
            <dt>Order ID</dt>
            <dd class="mono">{transaction.orderId}</dd>
            <dt>Dibuat</dt>
            <dd>{formatDateTime(transaction.createdAt)}</dd>
            {#if transaction.paidAt}
              <dt>Dibayar</dt>
              <dd>{formatDateTime(transaction.paidAt)}</dd>
            {/if}
            <dt>Gateway</dt>
            <dd>{transaction.provider}</dd>
          </dl>
        </div>
      </section>

      <table class="items">
        <thead>
          <tr>
            <th scope="col">Paket</th>
            <th scope="col" class="right">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <p class="strong">{transaction.planName ?? transaction.planCode ?? 'Paket'}</p>
              <p class="muted text-sm">{transaction.planCode ?? '—'}</p>
            </td>
            <td class="right">{formatIdr(transaction.amountIdr)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td class="right strong">{formatIdr(transaction.amountIdr)}</td>
          </tr>
        </tfoot>
      </table>

      <footer class="invoice__footer">
        <p class="muted text-sm">
          Status pembayaran: <strong>{transaction.status}</strong>. Invoice ini dibuat otomatis
          oleh sistem dan sah tanpa tanda tangan basah.
        </p>
        {#if !paid}
          <p class="notice">
            Dokumen ini bukan bukti pembayaran sampai status transaksi berubah menjadi SUCCESS.
          </p>
        {/if}
      </footer>
    </article>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    max-width: 820px;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .invoice {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-8);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .invoice__header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--space-4);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--space-4);
  }

  .invoice__meta {
    text-align: right;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--space-1);
  }

  .invoice__title {
    font-size: var(--text-xl);
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .brand {
    font-size: var(--text-xl);
    font-weight: 700;
  }

  .grid {
    display: grid;
    gap: var(--space-5);
  }

  .label {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    margin-bottom: var(--space-2);
  }

  .details {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--space-1) var(--space-4);
    font-size: var(--text-sm);
    margin: 0;
  }

  .details dt {
    color: var(--color-text-muted);
  }

  .details dd {
    margin: 0;
    text-align: right;
  }

  .items {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
  }

  .items th,
  .items td {
    padding: var(--space-3) 0;
    border-bottom: 1px solid var(--color-border);
    text-align: left;
    vertical-align: top;
  }

  .items thead th {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .items tfoot th,
  .items tfoot td {
    border-bottom: 0;
    padding-top: var(--space-4);
  }

  .right {
    text-align: right;
  }

  .strong {
    font-weight: 600;
  }

  .mono {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }

  .notice {
    margin-top: var(--space-2);
    padding: var(--space-3);
    border-radius: var(--radius-md);
    background: var(--color-warning-soft, #fef3c7);
    color: var(--color-warning-strong, #92400e);
    font-size: var(--text-sm);
  }

  .center-block {
    display: grid;
    place-items: center;
    padding-block: var(--space-12);
  }

  @media (min-width: 640px) {
    .grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media print {
    .no-print {
      display: none;
    }

    .invoice {
      border: 0;
      padding: 0;
    }
  }
</style>
