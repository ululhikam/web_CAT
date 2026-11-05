<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import AdminPageHeader from '$lib/components/admin/AdminPageHeader.svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import { adminBase } from '$lib/panel-route';
  import { session } from '$lib/stores/session.svelte';
  import { formatDateTime } from '$lib/format';
  import type { AuditLogItem, CursorPage } from '@webcat/contracts';

  let items = $state<AuditLogItem[]>([]);
  let loading = $state(true);
  let loadingMore = $state(false);
  let error = $state<string | null>(null);
  let nextCursor = $state<string | null>(null);
  let hasMore = $state(false);

  let action = $state('');
  let entityType = $state('');

  function query(cursor?: string): string {
    const params = new URLSearchParams({ limit: '25' });
    if (action.trim()) params.set('action', action.trim());
    if (entityType.trim()) params.set('entityType', entityType.trim());
    if (cursor) params.set('cursor', cursor);
    return `/admin/audit-logs?${params.toString()}`;
  }

  async function load(reset = true) {
    if (reset) {
      loading = true;
      items = [];
      nextCursor = null;
      hasMore = false;
    } else {
      loadingMore = true;
    }
    error = null;

    try {
      const page = await apiRequest<CursorPage<AuditLogItem>>(
        query(reset ? undefined : (nextCursor ?? undefined)),
        { token: session.accessToken, cacheTtlMs: 15000 },
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
    void (async () => {
      await session.restore();

      // Audit log khusus SUPER_ADMIN: ADMIN dikembalikan ke ringkasan panelnya.
      if (!session.isSuperAdmin) {
        await goto(adminBase(), { replaceState: true });
        return;
      }

      if (session.can('audit.read')) await load();
      else loading = false;
    })();
  });

  function metadataText(metadata: unknown): string {
    if (metadata === null || metadata === undefined) return '—';
    try {
      const text = JSON.stringify(metadata);
      return text.length > 120 ? `${text.slice(0, 117)}…` : text;
    } catch {
      return '—';
    }
  }
</script>

<svelte:head>
  <title>Audit Log — Admin Web CAT</title>
</svelte:head>

<div class="adm-page">
  <AdminPageHeader
    title="Audit log"
    description="Jejak perubahan akun, langganan, dan pengaturan platform."
  />

  {#if !session.can('audit.read')}
    <Alert tone="warning" title="Akses terbatas">
      Hanya SUPER_ADMIN yang dapat membaca audit log.
    </Alert>
  {:else}
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
        placeholder="Filter aksi, mis. user.role_changed"
        bind:value={action}
        aria-label="Filter aksi"
      />
      <input
        class="filters__input"
        type="search"
        placeholder="Filter entitas, mis. user"
        bind:value={entityType}
        aria-label="Filter entitas"
      />
      <Button type="submit" variant="secondary">Terapkan</Button>
      <Button
        variant="ghost"
        onclick={() => {
          action = '';
          entityType = '';
          void load();
        }}>Reset</Button
      >
    </form>

    {#if error}<Alert tone="danger" title="Gagal memuat audit log">{error}</Alert>{/if}

    {#if loading}
      <div class="adm-center"><Spinner size={26} label="Memuat audit log" /></div>
    {:else if items.length === 0}
      <Card title="Belum ada catatan">
        <p class="adm-muted">Aktivitas admin akan tercatat otomatis di sini.</p>
      </Card>
    {:else}
      <div class="adm-panel adm-scroll">
        <table class="adm-table">
          <caption class="sr-only">Daftar audit log</caption>
          <thead>
            <tr>
              <th scope="col">Waktu</th>
              <th scope="col">Aktor</th>
              <th scope="col">Aksi</th>
              <th scope="col">Entitas</th>
              <th scope="col">Metadata</th>
              <th scope="col">IP</th>
            </tr>
          </thead>
          <tbody>
            {#each items as item (item.id)}
              <tr>
                <td class="nowrap">{formatDateTime(item.createdAt)}</td>
                <td>
                  {#if item.actorEmail}
                    <span class="actor">{item.actorEmail}</span>
                  {:else}
                    <span class="adm-muted">sistem</span>
                  {/if}
                </td>
                <td><Badge tone="neutral">{item.action}</Badge></td>
                <td>
                  <span class="entity">{item.entityType}</span>
                  <span class="mono">{item.entityId}</span>
                </td>
                <td class="metadata" title={metadataText(item.metadata)}>
                  {metadataText(item.metadata)}
                </td>
                <td class="adm-nowrap adm-muted">{item.ip ?? '—'}</td>
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
  {/if}
</div>

<style>
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .filters__input {
    flex: 1 1 240px;
    min-width: 0;
    padding: 0.55rem 0.75rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font-size: var(--text-sm);
  }

  .actor {
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .entity {
    display: block;
    font-weight: 600;
  }

  .mono {
    display: block;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--color-text-subtle);
    overflow-wrap: anywhere;
  }

  .metadata {
    max-width: 320px;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--color-text-muted);
    overflow-wrap: anywhere;
  }

  .nowrap {
    white-space: nowrap;
  }

  .more {
    display: flex;
    justify-content: center;
  }
</style>
