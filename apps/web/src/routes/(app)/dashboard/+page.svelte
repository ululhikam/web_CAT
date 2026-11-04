<script lang="ts">
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import { formatDate } from '$lib/format';
  import type { SubscriptionSummary } from '@webcat/contracts';

  let subscription = $state<SubscriptionSummary | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  $effect(() => {
    if (!session.user || !session.accessToken) return;

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

  const isActive = $derived(subscription?.status === 'ACTIVE');
</script>

<svelte:head>
  <title>Ringkasan — Web CAT</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">Halo, {session.user?.fullName ?? 'Peserta'}</h1>
      <p class="muted">Ini ringkasan akses dan langkah berikutnya.</p>
    </div>
    <Badge tone={session.user?.emailVerified ? 'success' : 'warning'}>
      {session.user?.emailVerified ? 'Email terverifikasi' : 'Email belum diverifikasi'}
    </Badge>
  </header>

  {#if error}
    <Alert tone="danger" title="Gagal memuat data">{error}</Alert>
  {/if}

  {#if loading}
    <div class="center-block"><Spinner size={26} /></div>
  {:else if isActive && subscription}
    <div class="grid">
      <Card title="Status langganan" description="Akses ujian mengikuti tanggal berakhir ini.">
        <dl class="facts">
          <div>
            <dt>Status</dt>
            <dd><Badge tone="success">AKTIF</Badge></dd>
          </div>
          <div>
            <dt>Berakhir pada</dt>
            <dd>{formatDate(subscription.endsAt)}</dd>
          </div>
          <div>
            <dt>Sisa hari</dt>
            <dd>{subscription.remainingDays} hari</dd>
          </div>
          <div>
            <dt>Paket</dt>
            <dd>{subscription.planCode ?? 'Pemberian admin'}</dd>
          </div>
        </dl>
      </Card>

      <Card title="Mulai simulasi" description="Tiga tes berurutan dengan sistem gugur.">
        <p class="muted">
          Sesi berikutnya akan tersedia pada fase B2 (mesin ujian). Saat ini Anda dapat memastikan
          langganan dan profil sudah benar.
        </p>
        <div class="actions">
          <Button variant="secondary" href="/subscription">Kelola langganan</Button>
        </div>
      </Card>
    </div>
  {:else}
    <Card title="Belum ada langganan aktif" elevated>
      <p class="muted">
        Anda belum memiliki akses ujian yang aktif. Pilih paket untuk mulai berlatih, atau hubungi
        admin bila akses Anda seharusnya sudah diberikan.
      </p>
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
    gap: var(--space-6);
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

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-top: var(--space-4);
  }

  .center-block {
    display: grid;
    place-items: center;
    padding-block: var(--space-12);
  }

  @media (min-width: 768px) {
    .grid {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
