<script lang="ts">
  import { onMount } from 'svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import { formatDateTime } from '$lib/format';
  import type { AuthSessionSummary, MessageResult } from '@webcat/contracts';

  let sessions = $state<AuthSessionSummary[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let notice = $state<string | null>(null);
  let revoking = $state<string | null>(null);

  async function load() {
    loading = true;
    error = null;
    try {
      sessions = await apiRequest<AuthSessionSummary[]>('/auth/sessions', {
        token: session.accessToken,
      });
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void (async () => {
      await session.restore();
      await load();
    })();
  });

  async function revoke(target: AuthSessionSummary) {
    if (!confirm('Cabut sesi ini? Perangkat tersebut harus login ulang.')) return;

    revoking = target.id;
    error = null;
    notice = null;
    try {
      await apiRequest<MessageResult>(`/auth/sessions/${target.id}`, {
        method: 'DELETE',
        token: session.accessToken,
      });
      notice = 'Sesi berhasil dicabut.';
      await load();
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      revoking = null;
    }
  }

  function deviceLabel(userAgent: string | null): string {
    if (!userAgent) return 'Perangkat tidak dikenal';
    if (/edg\//i.test(userAgent)) return 'Microsoft Edge';
    if (/chrome\//i.test(userAgent)) return 'Google Chrome';
    if (/firefox\//i.test(userAgent)) return 'Mozilla Firefox';
    if (/safari\//i.test(userAgent)) return 'Safari';
    return userAgent.slice(0, 80);
  }
</script>

<svelte:head>
  <title>Perangkat — Web CAT</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">Perangkat & sesi</h1>
      <p class="muted">
        Daftar perangkat yang sedang login. Cabut sesi yang tidak Anda kenali.
      </p>
    </div>
    <Button href="/profile" variant="secondary">Kembali ke profil</Button>
  </header>

  {#if error}<Alert tone="danger" title="Gagal memuat sesi">{error}</Alert>{/if}
  {#if notice}<Alert tone="success">{notice}</Alert>{/if}

  {#if loading}
    <div class="center"><Spinner size={26} label="Memuat sesi" /></div>
  {:else if sessions.length === 0}
    <Card title="Tidak ada sesi aktif">
      <p class="muted">Sesi akan muncul di sini setelah Anda login dari perangkat lain.</p>
    </Card>
  {:else}
    <Card padding="none">
      <ul class="sessions">
        {#each sessions as item (item.id)}
          <li class="session">
            <div class="session__main">
              <p class="session__device">
                {deviceLabel(item.userAgent)}
                {#if item.current}<Badge tone="success">Perangkat ini</Badge>{/if}
              </p>
              <p class="session__meta">
                IP {item.ip ?? '—'} · Terakhir aktif {formatDateTime(item.lastSeenAt)}
              </p>
              <p class="session__meta">
                Login {formatDateTime(item.createdAt)} · Berakhir {formatDateTime(item.expiresAt)}
              </p>
            </div>

            {#if !item.current}
              <Button
                variant="danger"
                size="sm"
                loading={revoking === item.id}
                onclick={() => void revoke(item)}
              >
                Cabut
              </Button>
            {:else}
              <span class="session__current">Sesi aktif</span>
            {/if}
          </li>
        {/each}
      </ul>
    </Card>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    max-width: 920px;
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
    min-height: 200px;
  }

  .sessions {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .session {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--color-border);
  }

  .session:last-child {
    border-bottom: 0;
  }

  .session__device {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-weight: 600;
  }

  .session__meta {
    margin-top: var(--space-1);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .session__current {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-success);
  }
</style>
