<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import AdminPageHeader from '$lib/components/admin/AdminPageHeader.svelte';
  import { apiErrorMessage, apiRequest } from '$lib/api/client';
  import { adminBase } from '$lib/panel-route';
  import { session } from '$lib/stores/session.svelte';
  import { formatDateTime } from '$lib/format';
  import type {
    BulkQuestionActionResult,
    QuestionListItem,
    QuestionListResponse,
    QuestionStatsResponse,
    QuestionType,
  } from '@webcat/contracts';

  const TYPE_LABELS: Record<QuestionType, string> = {
    SINGLE_CHOICE: 'Pilihan tunggal',
    MULTI_CHOICE: 'Pilihan ganda',
    IMAGE_CHOICE: 'Pilihan gambar',
    LIKERT_STATEMENT: 'Likert',
    MISSING_ELEMENT: 'Elemen hilang',
    PASS_HAND_COLUMN: 'Pass Hand',
  };

  let rows = $state<QuestionListItem[]>([]);
  let stats = $state<QuestionStatsResponse | null>(null);
  let loading = $state(true);
  let busy = $state(false);
  let error = $state<string | null>(null);
  let notice = $state<string | null>(null);
  let nextCursor = $state<string | null>(null);

  let q = $state('');
  let stageCode = $state('');
  let subtestCode = $state('');
  let type = $state('');
  let status = $state('');
  let difficulty = $state('');
  /** Filter dari tautan "hasil impor": hanya soal yang lahir dari job tertentu. */
  let sourceImportId = $state('');

  let selected = $state<string[]>([]);

  function queryString(cursor?: string | null): string {
    const params = new URLSearchParams({ limit: '25' });
    if (q.trim()) params.set('q', q.trim());
    if (stageCode) params.set('stageCode', stageCode);
    if (subtestCode) params.set('subtestCode', subtestCode);
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    if (difficulty) params.set('difficulty', difficulty);
    if (sourceImportId) params.set('sourceImportId', sourceImportId);
    if (cursor) params.set('cursor', cursor);
    return params.toString();
  }

  async function load(reset = true) {
    if (reset) {
      loading = true;
      selected = [];
      nextCursor = null;
    }
    error = null;
    try {
      const result = await apiRequest<QuestionListResponse>(
        `/admin/questions?${queryString(reset ? null : nextCursor)}`,
        { token: session.accessToken, cacheTtlMs: 15000 },
      );
      rows = reset ? result.rows : [...rows, ...result.rows];
      nextCursor = result.nextCursor;
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      loading = false;
    }
  }

  async function loadStats() {
    try {
      stats = await apiRequest<QuestionStatsResponse>('/admin/questions/stats', {
        token: session.accessToken,
      });
    } catch {
      // statistik tidak krusial
    }
  }

  onMount(() => {
    const importedFrom = page.url.searchParams.get('sourceImportId');
    if (importedFrom) sourceImportId = importedFrom;
    void load();
    void loadStats();
  });

  function clearImportFilter() {
    sourceImportId = '';
    void goto(`${adminBase()}/questions`, { replaceState: true, keepFocus: true, noScroll: true });
    void load();
  }

  function toggle(id: string) {
    selected = selected.includes(id) ? selected.filter((row) => row !== id) : [...selected, id];
  }

  function toggleAll() {
    selected = selected.length === rows.length ? [] : rows.map((row) => row.id);
  }

  async function bulk(action: 'PUBLISH' | 'ARCHIVE' | 'DELETE' | 'RESTORE') {
    if (selected.length === 0 || busy) return;
    if (action === 'DELETE' && !confirm(`Hapus ${selected.length} soal?`)) return;

    busy = true;
    error = null;
    notice = null;
    try {
      const result = await apiRequest<BulkQuestionActionResult>('/admin/questions/bulk-action', {
        method: 'POST',
        body: { ids: selected, action },
        token: session.accessToken,
      });
      notice = `${result.affected} soal diproses (${action.toLowerCase()}).`;
      await load();
      await loadStats();
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      busy = false;
    }
  }

  async function publish(id: string) {
    busy = true;
    error = null;
    notice = null;
    try {
      await apiRequest(`/admin/questions/${id}/publish`, {
        method: 'POST',
        token: session.accessToken,
      });
      notice = 'Soal dipublikasikan.';
      await load();
      await loadStats();
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      busy = false;
    }
  }

  const toneFor = (value: string) =>
    value === 'PUBLISHED'
      ? 'success'
      : value === 'REVIEW'
        ? 'warning'
        : value === 'ARCHIVED'
          ? 'danger'
          : 'neutral';
</script>

<svelte:head>
  <title>Bank Soal — Admin TES CAT</title>
</svelte:head>

<div class="adm-page">
  <AdminPageHeader
    title="Bank soal"
    description="Kelola soal, publikasi, dan pantau kecukupan soal per subtes."
  >
    {#snippet actions()}
      <Button variant="secondary" href={`${adminBase()}/questions/import`}>Impor soal</Button>
      <Button href={`${adminBase()}/questions/new`}>Soal baru</Button>
    {/snippet}
  </AdminPageHeader>

  {#if error}
    <Alert tone="danger" title="Gagal memuat soal">{error}</Alert>
  {/if}
  {#if notice}
    <Alert tone="success">{notice}</Alert>
  {/if}

  {#if sourceImportId}
    <Alert tone="info" title="Filter hasil impor">
      Menampilkan hanya soal yang dibuat oleh job impor
      <code class="adm-mono">{sourceImportId}</code>.
      <div class="adm-actions">
        <Button size="sm" variant="secondary" onclick={clearImportFilter}>Hapus filter</Button>
        <Button size="sm" variant="ghost" href={`${adminBase()}/questions/import`}>Buka impor</Button>
      </div>
    </Alert>
  {/if}

  {#if stats}
    <section class="stats" aria-label="Coverage subtes">
      {#each stats.items as item (item.subtestCode)}
        <div class="stat" class:stat--ready={item.ready}>
          <div class="stat__head">
            <span class="stat__name">{item.subtestName}</span>
            <Badge tone={item.ready ? 'success' : 'warning'}>
              {item.published}/{item.required}
            </Badge>
          </div>
          <div class="bar">
            <span
              style:width={`${item.required ? Math.min(100, (item.published / item.required) * 100) : 100}%`}
            ></span>
          </div>
          <p class="stat__meta">
            Draf {item.draft} · Review {item.review} · Arsip {item.archived}
            {#if item.shortage > 0}· kurang {item.shortage}{/if}
          </p>
        </div>
      {/each}
    </section>
  {/if}

  <form
    class="filters"
    onsubmit={(event) => {
      event.preventDefault();
      void load();
    }}
  >
    <input
      class="filters__search"
      type="search"
      placeholder="Cari kode atau teks soal"
      bind:value={q}
      aria-label="Cari soal"
    />
    <select class="select" bind:value={stageCode} aria-label="Stage">
      <option value="">Stage</option>
      <option value="PSIKOLOGI">Psikologi</option>
      <option value="TKK">TKK</option>
      <option value="TPK">TPK</option>
    </select>
    <select class="select" bind:value={subtestCode} aria-label="Subtes">
      <option value="">Subtes</option>
      <option value="KECERDASAN">Kecerdasan</option>
      <option value="KEPRIBADIAN">Kepribadian</option>
      <option value="KECERMATAN">Kecermatan</option>
      <option value="PASS_HAND">Pass Hand</option>
      <option value="TKK">TKK</option>
      <option value="TPK">TPK</option>
    </select>
    <select class="select" bind:value={type} aria-label="Tipe">
      <option value="">Tipe</option>
      {#each Object.entries(TYPE_LABELS) as [value, label] (value)}
        <option {value}>{label}</option>
      {/each}
    </select>
    <select class="select" bind:value={status} aria-label="Status">
      <option value="">Status</option>
      <option value="DRAFT">Draf</option>
      <option value="REVIEW">Review</option>
      <option value="PUBLISHED">Terbit</option>
      <option value="ARCHIVED">Arsip</option>
    </select>
    <select class="select" bind:value={difficulty} aria-label="Kesulitan">
      <option value="">Kesulitan</option>
      <option value="EASY">Mudah</option>
      <option value="MEDIUM">Sedang</option>
      <option value="HARD">Sulit</option>
    </select>
    <Button type="submit" variant="secondary">Terapkan</Button>
  </form>

  {#if selected.length > 0}
    <div class="bulk">
      <span>{selected.length} soal dipilih</span>
      <div class="bulk__actions">
        <Button size="sm" variant="success" loading={busy} onclick={() => bulk('PUBLISH')}>
          Publikasikan
        </Button>
        <Button size="sm" variant="secondary" loading={busy} onclick={() => bulk('ARCHIVE')}>
          Arsipkan
        </Button>
        <Button size="sm" variant="danger" loading={busy} onclick={() => bulk('DELETE')}>
          Hapus
        </Button>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="adm-center"><Spinner size={26} label="Memuat soal" /></div>
  {:else if rows.length === 0}
    <Card title="Tidak ada soal">
      <p class="adm-muted">Ubah filter, atau tambahkan soal baru / impor berkas.</p>
    </Card>
  {:else}
    <div class="adm-panel adm-scroll">
      <table class="adm-table">
        <caption class="sr-only">Daftar soal</caption>
        <thead>
          <tr>
            <th scope="col">
              <input
                type="checkbox"
                aria-label="Pilih semua"
                checked={selected.length === rows.length && rows.length > 0}
                onchange={toggleAll}
              />
            </th>
            <th scope="col">Kode</th>
            <th scope="col">Soal</th>
            <th scope="col">Subtes</th>
            <th scope="col">Tipe</th>
            <th scope="col">Status</th>
            <th scope="col">Diperbarui</th>
          </tr>
        </thead>
        <tbody>
          {#each rows as row (row.id)}
            <tr>
              <td>
                <input
                  type="checkbox"
                  aria-label={`Pilih ${row.publicCode}`}
                  checked={selected.includes(row.id)}
                  onchange={() => toggle(row.id)}
                />
              </td>
              <td><code class="code">{row.publicCode}</code></td>
              <td>
                <a class="stem" href={`${adminBase()}/questions/${row.id}`}>{row.stemPreview}</a>
                <div class="chips">
                  {#if row.mediaCount > 0}<span class="chip">Media {row.mediaCount}</span>{/if}
                  {#if row.categoryName}<span class="chip">{row.categoryName}</span>{/if}
                  <span class="chip chip--muted">{row.difficulty}</span>
                </div>
              </td>
              <td>{row.subtestCode}</td>
              <td>{TYPE_LABELS[row.type]}</td>
              <td><Badge tone={toneFor(row.status)}>{row.status}</Badge></td>
              <td class="adm-muted adm-nowrap">{formatDateTime(row.updatedAt)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if nextCursor}
      <div class="more">
        <Button variant="secondary" onclick={() => load(false)}>Muat lebih banyak</Button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .stats {
    display: grid;
    gap: var(--space-3);
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }

  .stat {
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
  }

  .stat__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
  }

  .stat__name {
    font-weight: 600;
    font-size: var(--text-sm);
  }

  .bar {
    height: 6px;
    border-radius: var(--radius-full);
    background: var(--color-surface-muted);
    overflow: hidden;
  }

  .bar span {
    display: block;
    height: 100%;
    background: var(--color-warning, #d69e2e);
  }

  .stat--ready .bar span {
    background: var(--color-success);
  }

  .stat__meta {
    margin-top: var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
  }

  .filters__search {
    flex: 1;
    min-width: 200px;
    padding: 0.55rem 0.75rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font-size: var(--text-sm);
  }

  .select {
    padding: 0.55rem 0.6rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font-size: var(--text-sm);
  }

  .bulk {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface));
    font-size: var(--text-sm);
    font-weight: 600;
  }

  .bulk__actions {
    display: flex;
    gap: var(--space-2);
  }

  .code {
    font-size: var(--text-xs);
    white-space: nowrap;
  }

  .stem {
    display: block;
    max-width: 460px;
    color: var(--color-text);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    margin-top: var(--space-1);
  }

  .chip {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: var(--radius-full);
    background: var(--color-surface-muted);
    color: var(--color-text-muted);
  }

  .chip--muted {
    opacity: 0.8;
  }

  .more {
    display: flex;
    justify-content: center;
    padding-block: var(--space-4);
  }
</style>
