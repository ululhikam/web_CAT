<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import { formatDateTime, formatIdr } from '$lib/format';
  import type { CheckoutResult, TransactionStatus, TransactionSummary } from '@webcat/contracts';

  /**
   * Halaman checkout.
   *
   * Status TIDAK pernah dipercaya dari query string gateway. Semua hasil
   * pembayaran dibaca ulang dari API (`GET /checkout/transactions/:orderId`).
   */

  const POLL_INTERVAL_MS = 5_000;
  const POLL_TIMEOUT_MS = 10 * 60_000;

  let orderId = $state<string | null>(null);
  let planCode = $state<string | null>(null);
  let transaction = $state<TransactionSummary | null>(null);
  let simulated = $state(false);
  let loading = $state(true);
  let paying = $state(false);
  let error = $state<string | null>(null);
  let timedOut = $state(false);

  const finalStatuses: TransactionStatus[] = [
    'SUCCESS',
    'EXPIRED',
    'FAILED',
    'CANCELLED',
    'REFUNDED',
  ];

  const isFinal = $derived(transaction ? finalStatuses.includes(transaction.status) : false);
  const isPending = $derived(transaction?.status === 'PENDING');

  const statusTone = $derived(
    transaction?.status === 'SUCCESS'
      ? 'success'
      : transaction?.status === 'PENDING'
        ? 'warning'
        : 'danger',
  );

  /** Membuat tagihan baru dari kode paket (`/checkout?plan=CODE`). */
  async function startCheckout(code: string): Promise<void> {
    if (!session.accessToken) return;
    loading = true;
    error = null;
    try {
      const result = await apiRequest<CheckoutResult>('/checkout/transactions', {
        method: 'POST',
        token: session.accessToken,
        body: { planCode: code },
      });
      simulated = result.simulated;
      transaction = result.transaction;

      if (result.subscription) {
        await goto('/subscription?status=success');
        return;
      }

      if (result.redirectUrl && !result.simulated) {
        window.location.href = result.redirectUrl;
        return;
      }

      orderId = result.transaction.orderId;
      await goto(`/checkout?orderId=${encodeURIComponent(orderId)}`, { replaceState: true });
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      loading = false;
    }
  }

  async function loadStatus(id: string): Promise<void> {
    if (!session.accessToken) return;
    try {
      transaction = await apiRequest<TransactionSummary>(
        `/checkout/transactions/${encodeURIComponent(id)}`,
        { token: session.accessToken },
      );
      // Tombol simulasi hanya relevan saat transaksi dibuat oleh provider fake.
      simulated = transaction.provider === 'fake';
      error = null;
    } catch (cause) {
      error = apiErrorMessage(cause);
    }
  }

  /** Simulasi pembayaran (hanya muncul saat provider fake). */
  async function settle(): Promise<void> {
    if (!orderId) return;
    paying = true;
    error = null;
    try {
      await apiRequest('/payments/fake/settle', {
        method: 'POST',
        token: null,
        body: { orderId },
      });
      await loadStatus(orderId);
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      paying = false;
    }
  }

  $effect(() => {
    const params = $page.url.searchParams;
    const id = params.get('orderId');
    const plan = params.get('plan');

    orderId = id;
    planCode = plan ? plan.toUpperCase() : null;
    loading = true;
    error = null;
    timedOut = false;

    if (id) {
      void loadStatus(id).finally(() => {
        loading = false;
      });
      return;
    }

    if (plan) {
      void startCheckout(plan.toUpperCase());
      return;
    }

    loading = false;
  });

  /** Polling berhenti saat status final atau setelah 10 menit. */
  $effect(() => {
    if (!orderId || !isPending || timedOut) return;

    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
        timedOut = true;
        clearInterval(timer);
        return;
      }
      void loadStatus(orderId as string);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  });

  function statusLabel(status: TransactionStatus): string {
    switch (status) {
      case 'PENDING':
        return 'Menunggu pembayaran';
      case 'SUCCESS':
        return 'Pembayaran berhasil';
      case 'EXPIRED':
        return 'Tagihan kedaluwarsa';
      case 'FAILED':
        return 'Pembayaran gagal';
      case 'CANCELLED':
        return 'Dibatalkan';
      default:
        return 'Dana dikembalikan';
    }
  }
</script>

<svelte:head>
  <title>Checkout — Web CAT</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">Checkout</h1>
      <p class="muted">Selesaikan pembayaran untuk mengaktifkan masa aktif.</p>
    </div>
  </header>

  {#if error}
    <Alert tone="danger" title="Checkout gagal">{error}</Alert>
  {/if}

  {#if loading}
    <div class="center-block"><Spinner size={26} label="Menyiapkan pembayaran" /></div>
  {:else if !transaction}
    <Card title="Tidak ada transaksi">
      <p class="muted">Pilih paket terlebih dahulu untuk membuat tagihan.</p>
      <div class="actions">
        <Button href="/pricing">Lihat paket</Button>
      </div>
    </Card>
  {:else}
    <Card>
      <dl class="facts">
        <div>
          <dt>Status</dt>
          <dd><Badge tone={statusTone}>{statusLabel(transaction.status)}</Badge></dd>
        </div>
        <div>
          <dt>Order ID</dt>
          <dd class="mono">{transaction.orderId}</dd>
        </div>
        <div>
          <dt>Nomor invoice</dt>
          <dd>{transaction.invoiceNumber ?? '—'}</dd>
        </div>
        <div>
          <dt>Paket</dt>
          <dd>{transaction.planName ?? transaction.planCode ?? planCode ?? '—'}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{formatIdr(transaction.amountIdr)}</dd>
        </div>
        <div>
          <dt>Dibuat</dt>
          <dd>{formatDateTime(transaction.createdAt)}</dd>
        </div>
      </dl>

      {#if transaction.status === 'SUCCESS'}
        <p class="notice notice--success">
          Pembayaran diterima. Masa aktif sudah ditambahkan ke akun Anda.
        </p>
      {:else if transaction.status === 'PENDING'}
        <p class="notice">
          {#if timedOut}
            Status belum berubah. Buka tautan pembayaran di bawah, lalu muat ulang halaman ini.
          {:else}
            Menunggu konfirmasi pembayaran. Halaman ini memperbarui status secara otomatis.
          {/if}
        </p>
      {:else}
        <p class="notice notice--danger">
          Tagihan ini sudah final. Buat tagihan baru bila ingin melanjutkan pembelian.
        </p>
      {/if}

      <div class="actions">
        {#if isPending && transaction.redirectUrl}
          <Button href={transaction.redirectUrl}>Buka halaman pembayaran</Button>
        {/if}

        {#if isPending && simulated}
          <Button variant="secondary" loading={paying} onclick={settle}>
            Simulasikan pembayaran
          </Button>
        {/if}

        {#if isFinal}
          {#if transaction.status === 'SUCCESS'}
            <Button href="/subscription">Lihat langganan</Button>
          {:else}
            <Button href="/pricing">Coba lagi</Button>
          {/if}
          <Button variant="secondary" href="/transactions">Riwayat transaksi</Button>
        {/if}
      </div>

      {#if isPending && simulated}
        <p class="hint">
          Mode pengembangan: tombol simulasi memakai jalur webhook yang sama dengan pembayaran
          nyata, sehingga aktivasi langganan ikut teruji.
        </p>
      {/if}
    </Card>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    max-width: 720px;
  }

  .page__title {
    font-size: var(--text-2xl);
  }

  .facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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
    overflow-wrap: anywhere;
  }

  .mono {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }

  .notice {
    margin-top: var(--space-5);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    background: var(--color-surface-muted);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .notice--success {
    background: var(--color-success-soft);
    color: var(--color-success);
  }

  .notice--danger {
    background: var(--color-danger-soft);
    color: var(--color-danger);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-top: var(--space-5);
  }

  .hint {
    margin-top: var(--space-4);
    font-size: var(--text-xs);
    color: var(--color-text-subtle);
  }

  .center-block {
    display: grid;
    place-items: center;
    padding-block: var(--space-12);
  }
</style>
