<script lang="ts">
  import { onMount } from 'svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import AdminPageHeader from '$lib/components/admin/AdminPageHeader.svelte';
  import { apiErrorMessage, apiRequest, apiUpload } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import type { MediaAssetView, MediaListResponse } from '@webcat/contracts';

  let assets = $state<MediaAssetView[]>([]);
  let loading = $state(true);
  let uploading = $state(false);
  let error = $state<string | null>(null);
  let notice = $state<string | null>(null);
  let query = $state('');
  let unusedOnly = $state(false);
  let cursor: string | null = null;
  let hasMore = $state(false);

  async function load(reset = true) {
    if (reset) {
      loading = true;
      assets = [];
      cursor = null;
    }
    error = null;

    try {
      const params = new URLSearchParams({ limit: '30', unusedOnly: String(unusedOnly) });
      if (query.trim()) params.set('q', query.trim());
      if (!reset && cursor) params.set('cursor', cursor);

      const result = await apiRequest<MediaListResponse>(`/admin/media?${params}`, {
        token: session.accessToken,
      });
      assets = reset ? result.rows : [...assets, ...result.rows];
      cursor = result.nextCursor;
      hasMore = result.hasMore;
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void load();
  });

  async function upload(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || uploading) return;

    uploading = true;
    error = null;
    notice = null;

    const form = new FormData();
    form.set('file', file);

    try {
      await apiUpload<MediaAssetView>('/admin/media/upload', form, {
        token: session.accessToken,
      });
      notice = 'Media diunggah dan dikonversi ke WebP.';
      input.value = '';
      await load();
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      uploading = false;
    }
  }

  async function remove(asset: MediaAssetView) {
    if (!confirm('Hapus media ini? Soal yang memakainya akan kehilangan gambar.')) return;

    error = null;
    notice = null;
    try {
      await apiRequest(`/admin/media/${asset.id}`, {
        method: 'DELETE',
        token: session.accessToken,
      });
      notice = 'Media dihapus.';
      assets = assets.filter((row) => row.id !== asset.id);
    } catch (cause) {
      error = apiErrorMessage(cause);
    }
  }

  function formatSize(bytes: number | null): string {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
</script>

<svelte:head>
  <title>Media Library — Admin TES CAT</title>
</svelte:head>

<div class="adm-page">
  <AdminPageHeader
    title="Media library"
    description="Gambar soal disimpan sebagai WebP dan dideduplikasi lewat checksum SHA-256."
  >
    {#snippet actions()}
      <label class="upload">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          class="upload__input"
          onchange={upload}
          disabled={uploading}
        />
        <span class="upload__button" class:is-busy={uploading}>
          {uploading ? 'Mengunggah…' : 'Unggah gambar'}
        </span>
      </label>
    {/snippet}
  </AdminPageHeader>

  {#if error}
    <Alert tone="danger" title="Gagal memproses media">{error}</Alert>
  {/if}
  {#if notice}
    <Alert tone="success">{notice}</Alert>
  {/if}

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
      placeholder="Cari nama berkas atau checksum"
      bind:value={query}
      aria-label="Cari media"
    />
    <label class="toggle">
      <input type="checkbox" bind:checked={unusedOnly} onchange={() => load()} />
      <span>Hanya yang belum dipakai</span>
    </label>
    <Button type="submit" variant="secondary">Cari</Button>
  </form>

  {#if loading}
    <div class="adm-center"><Spinner size={26} label="Memuat media" /></div>
  {:else if assets.length === 0}
    <Card title="Belum ada media">
      <p class="adm-muted">Unggah gambar PNG/JPEG/WebP (maksimal 5 MB per berkas).</p>
    </Card>
  {:else}
    <ul class="grid">
      {#each assets as asset (asset.id)}
        <li class="asset">
          <div class="asset__preview">
            <img src={asset.thumbUrl} alt="" loading="lazy" />
          </div>
          <div class="asset__body">
            <p class="asset__name" title={asset.storagePath}>
              {asset.storagePath.split('/').pop()}
            </p>
            <p class="asset__meta">
              {asset.mime} · {formatSize(asset.sizeBytes)}
              {#if asset.width && asset.height}
                · {asset.width}×{asset.height}
              {/if}
            </p>
            <p class="asset__meta">Dipakai {asset.usageCount} soal</p>
          </div>
          <div class="asset__actions">
            <button class="link link--danger" type="button" onclick={() => remove(asset)}>
              Hapus
            </button>
          </div>
        </li>
      {/each}
    </ul>

    {#if hasMore}
      <div class="more">
        <Button variant="secondary" onclick={() => load(false)}>Muat lebih banyak</Button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .upload {
    position: relative;
    display: inline-flex;
  }

  .upload__input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  .upload__button {
    display: inline-flex;
    align-items: center;
    padding: 0.55rem 1rem;
    border-radius: var(--radius-md);
    background: var(--color-primary);
    color: #fff;
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
  }

  .upload__button.is-busy {
    opacity: 0.7;
    pointer-events: none;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
  }

  .filters__input {
    flex: 1;
    min-width: 200px;
    padding: 0.55rem 0.75rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font-size: var(--text-sm);
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--space-4);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .asset {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    overflow: hidden;
  }

  .asset__preview {
    display: grid;
    place-items: center;
    aspect-ratio: 4 / 3;
    background: var(--color-surface-muted);
  }

  .asset__preview img {
    max-height: 100%;
    object-fit: contain;
  }

  .asset__body {
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .asset__name {
    font-size: var(--text-sm);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .asset__meta {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .asset__actions {
    padding: 0 var(--space-3) var(--space-3);
  }

  .link {
    border: 0;
    background: none;
    padding: 0;
    font-size: var(--text-xs);
    font-weight: 600;
    cursor: pointer;
    color: var(--color-primary);
  }

  .link--danger {
    color: var(--color-danger);
  }

  .more {
    display: flex;
    justify-content: center;
    padding-block: var(--space-4);
  }
</style>
