<script lang="ts">
  import { page } from '$app/stores';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import { formatDate, formatDateTime } from '$lib/format';
  import type {
    SubscriptionEventSummary,
    SubscriptionHistoryItem,
    SubscriptionSummary,
  } from '@webcat/contracts';

  const SUB_CACHE_KEY = 'webcat_sub_cache';

  function readCachedSub(): SubscriptionSummary | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(SUB_CACHE_KEY);
      return raw ? (JSON.parse(raw) as SubscriptionSummary) : null;
    } catch {
      return null;
    }
  }

  const initialSub = readCachedSub();
  let subscription = $state<SubscriptionSummary | null>(initialSub);
  let history = $state<SubscriptionHistoryItem[]>([]);
  let loading = $state(!initialSub);
  let error = $state<string | null>(null);

  $effect(() => {
    if (!session.accessToken) return;
    let cancelled = false;

    void (async () => {
      if (!subscription) loading = true;
      error = null;
      try {
        const [active, rows] = await Promise.all([
          apiRequest<SubscriptionSummary | null>('/subscriptions/me', {
            token: session.accessToken,
            cacheTtlMs: 20000,
          }),
          apiRequest<SubscriptionHistoryItem[]>('/subscriptions/me/history', {
            token: session.accessToken,
            cacheTtlMs: 20000,
          }),
        ]);
        if (!cancelled) {
          subscription = active;
          history = rows;
          if (typeof window !== 'undefined' && active) sessionStorage.setItem(SUB_CACHE_KEY, JSON.stringify(active));
        }
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

  const statusMessage = $derived($page.url.searchParams.get('status'));

  const eventLabels: Record<SubscriptionEventSummary['type'], string> = {
    CREATED: 'Dibuat',
    ACTIVATED: 'Diaktifkan',
    EXTENDED: 'Diperpanjang',
    REVOKED: 'Dicabut',
    EXPIRED: 'Kedaluwarsa',
    RENEWED: 'Ditumpuk',
  };

  const sourceLabels: Record<SubscriptionSummary['source'], string> = {
    PURCHASE: 'Pembelian',
    MANUAL_GRANT: 'Pemberian admin',
    TRIAL: 'Uji coba',
  };
</script>

<svelte:head>
  <title>Langganan — TES CAT</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">Langganan</h1>
      <p class="muted">Status akses, masa aktif, dan riwayat pemberian.</p>
    </div>
    <Button href="mailto:support@webcat.id" size="sm">Perpanjang</Button>
  </header>

  {#if statusMessage === 'success'}
    <Alert tone="success" title="Pembayaran berhasil">
      Masa aktif sudah ditambahkan. Terima kasih!
    </Alert>
  {:else if statusMessage === 'failed'}
    <Alert tone="danger" title="Pembayaran belum berhasil">
      Tagihan tidak selesai. Anda dapat mencoba lagi dari halaman paket.
    </Alert>
  {/if}

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
          <dd>{sourceLabels[subscription.source]}</dd>
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
          <dd>{subscription.planName ?? subscription.planCode ?? '—'}</dd>
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
        <Button href="mailto:support@webcat.id">Hubungi admin</Button>
      </div>
    </Card>
  {/if}

  {#if !loading && history.length > 0}
    <section aria-labelledby="history-title">
      <h2 id="history-title" class="section__title">Riwayat langganan</h2>
      <div class="history">
        {#each history as row (row.id)}
          <article class="history__item">
            <header class="history__head">
              <div>
                <p class="history__plan">
                  {row.planName ?? row.planCode ?? 'Tanpa paket'}
                  <Badge tone={row.status === 'ACTIVE' ? 'success' : 'neutral'}>
                    {row.status}
                  </Badge>
                </p>
                <p class="history__range">
                  {formatDate(row.startsAt)} — {formatDate(row.endsAt)}
                </p>
              </div>
              <span class="history__source">{sourceLabels[row.source]}</span>
            </header>

            {#if row.revokeReason}
              <p class="history__reason">Alasan pencabutan: {row.revokeReason}</p>
            {/if}

            {#if row.events.length > 0}
              <ol class="events">
                {#each row.events as event (event.id)}
                  <li class="events__item">
                    <span class="events__type">{eventLabels[event.type]}</span>
                    <span class="events__date">{formatDateTime(event.createdAt)}</span>
                    {#if event.note}<span class="events__note">{event.note}</span>{/if}
                  </li>
                {/each}
              </ol>
            {/if}
          </article>
        {/each}
      </div>
    </section>
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

  .section__title {
    font-size: var(--text-lg);
    margin-bottom: var(--space-3);
  }

  .history {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .history__item {
    padding: var(--space-4) var(--space-5);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }

  .history__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .history__plan {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-weight: 600;
  }

  .history__range {
    margin-top: var(--space-1);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .history__source {
    font-size: var(--text-xs);
    color: var(--color-text-subtle);
  }

  .history__reason {
    margin-top: var(--space-2);
    font-size: var(--text-sm);
    color: var(--color-danger);
  }

  .events {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin: var(--space-3) 0 0;
    padding: var(--space-3) 0 0;
    border-top: 1px dashed var(--color-border);
    list-style: none;
  }

  .events__item {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .events__type {
    min-width: 96px;
    font-weight: 600;
    color: var(--color-text);
  }

  .events__note {
    flex-basis: 100%;
    color: var(--color-text-subtle);
  }

  .center-block {
    display: grid;
    place-items: center;
    padding-block: var(--space-12);
  }
</style>
