<script lang="ts">
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import { formatDate } from '$lib/format';
  import type { SubscriptionSummary } from '@webcat/contracts';

  let subscription = $state<SubscriptionSummary | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  $effect(() => {
    if (!session.accessToken) return;
    let cancelled = false;

    void (async () => {
      loading = true;
      error = null;
      try {
        const result = await apiRequest<SubscriptionSummary | null>('/me/subscription', {
          token: session.accessToken,
        });
        if (!cancelled) subscription = result;
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

  const statusTone = $derived(
    subscription?.status === 'ACTIVE'
      ? 'success'
      : subscription?.status === 'PENDING'
        ? 'warning'
        : 'neutral',
  );
</script>

<svelte:head>
  <title>Langganan — Web CAT</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">Langganan</h1>
      <p class="muted">Status akses, masa aktif, dan riwayat pemberian.</p>
    </div>
    <Button href="/pricing" size="sm">Perpanjang</Button>
  </header>

  {#if error}
    <Alert tone="danger" title="Gagal memuat langganan">{error}</Alert>
  {/if}

  {#if loading}
    <div class="center-block"><Spinner size={26} /></div>
  {:else if subscription}
    <Card>
      <dl class="facts">
        <div>
          <dt>Status</dt>
          <dd><Badge tone={statusTone}>{subscription.status}</Badge></dd>
        </div>
        <div>
          <dt>Sumber</dt>
          <dd>{subscription.source === 'MANUAL_GRANT' ? 'Pemberian admin' : 'Pembelian'}</dd>
        </div>
        <div>
          <dt>Mulai</dt>
          <dd>{formatDate(subscription.startsAt)}</dd>
        </div>
        <div>
          <dt>Berakhir</dt>
          <dd>{formatDate(subscription.endsAt)}</dd>
        </div>
        <div>
          <dt>Sisa hari</dt>
          <dd>{subscription.remainingDays}</dd>
        </div>
        <div>
          <dt>Paket</dt>
          <dd>{subscription.planCode ?? '—'}</dd>
        </div>
      </dl>

      {#if subscription.grantNote}
        <div class="note">
          <p class="note__label">Catatan admin</p>
          <p class="note__body">{subscription.grantNote}</p>
        </div>
      {/if}
    </Card>
  {:else}
    <Card>
      <p class="muted">Tidak ada langganan yang tercatat untuk akun ini.</p>
      <div class="actions">
        <Button href="/pricing">Lihat paket</Button>
      </div>
    </Card>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    max-width: 820px;
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

  .facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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

  .note {
    margin-top: var(--space-5);
    padding: var(--space-4);
    background: var(--color-surface-muted);
    border-radius: var(--radius-md);
  }

  .note__label {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .note__body {
    margin-top: var(--space-1);
    font-size: var(--text-sm);
  }

  .actions {
    margin-top: var(--space-4);
  }

  .center-block {
    display: grid;
    place-items: center;
    padding-block: var(--space-12);
  }
</style>
