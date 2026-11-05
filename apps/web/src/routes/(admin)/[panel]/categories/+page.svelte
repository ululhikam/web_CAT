<script lang="ts">
  import { onMount } from 'svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Field from '@webcat/ui/components/Field.svelte';
  import Input from '@webcat/ui/components/Input.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import AdminPageHeader from '$lib/components/admin/AdminPageHeader.svelte';
  import { apiErrorMessage, apiRequest } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import type { CategoryDeleteResult, CategoryNode, CategoryUpdateInput } from '@webcat/contracts';

  let tree = $state<CategoryNode[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let busy = $state(false);

  let editing = $state<CategoryNode | null>(null);
  let name = $state('');
  let slug = $state('');
  let parentId = $state<string | null>(null);
  let sortOrder = $state(0);

  async function load() {
    loading = true;
    error = null;
    try {
      tree = await apiRequest<CategoryNode[]>('/admin/categories?includeEmpty=true', {
        token: session.accessToken,
      });
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void load();
  });

  function flatten(nodes: CategoryNode[], depth = 0): Array<{ node: CategoryNode; depth: number }> {
    return nodes.flatMap((node) => [{ node, depth }, ...flatten(node.children ?? [], depth + 1)]);
  }

  const flat = $derived(flatten(tree));

  function reset() {
    editing = null;
    name = '';
    slug = '';
    parentId = null;
    sortOrder = 0;
  }

  function startEdit(node: CategoryNode) {
    editing = node;
    name = node.name;
    slug = node.slug;
    parentId = node.parentId;
    sortOrder = node.sortOrder;
  }

  function startCreate(parent?: CategoryNode) {
    reset();
    parentId = parent?.id ?? null;
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (busy) return;

    busy = true;
    error = null;
    try {
      const body = {
        name: name.trim(),
        ...(slug.trim() ? { slug: slug.trim() } : {}),
        parentId,
        sortOrder,
      };

      if (editing) {
        await apiRequest<CategoryNode>(`/admin/categories/${editing.id}`, {
          method: 'PATCH',
          body: body as CategoryUpdateInput,
          token: session.accessToken,
        });
      } else {
        await apiRequest<CategoryNode>('/admin/categories', {
          method: 'POST',
          body,
          token: session.accessToken,
        });
      }
      reset();
      await load();
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      busy = false;
    }
  }

  async function remove(node: CategoryNode) {
    if (!confirm(`Hapus kategori "${node.name}"?`)) return;
    busy = true;
    error = null;
    try {
      const result = await apiRequest<CategoryDeleteResult>(`/admin/categories/${node.id}`, {
        method: 'DELETE',
        token: session.accessToken,
      });
      if (result.archived) {
        error = null;
        alert(
          `Kategori masih dipakai ${result.movedQuestions} soal, jadi diarsipkan alih-alih dihapus.`,
        );
      }
      if (editing?.id === node.id) reset();
      await load();
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head>
  <title>Kategori — Admin Web CAT</title>
</svelte:head>

<div class="adm-page">
  <AdminPageHeader
    title="Kategori soal"
    description="Taksonomi hierarkis dipakai filter bank soal dan laporan coverage."
  >
    {#snippet actions()}
      <Button onclick={() => startCreate()}>Kategori baru</Button>
    {/snippet}
  </AdminPageHeader>

  {#if error}
    <Alert tone="danger" title="Gagal memuat kategori">{error}</Alert>
  {/if}

  <div class="layout">
    <Card title={editing ? 'Ubah kategori' : 'Kategori baru'}>
      <form class="form" onsubmit={submit}>
        <Field label="Nama" for="cat-name" required>
          <Input id="cat-name" bind:value={name} maxlength={120} required />
        </Field>

        <Field label="Slug" for="cat-slug" hint="Kosongkan agar dibuat dari nama.">
          <Input id="cat-slug" bind:value={slug} placeholder="psikologi-verbal" maxlength={80} />
        </Field>

        <Field label="Induk" for="cat-parent" hint="Biarkan kosong untuk kategori akar.">
          <select id="cat-parent" class="select" bind:value={parentId}>
            <option value={null}>— Tidak ada induk —</option>
            {#each flat as entry (entry.node.id)}
              {#if editing?.id !== entry.node.id}
                <option value={entry.node.id}>
                  {'\u00a0\u00a0'.repeat(entry.depth)}{entry.node.name}
                </option>
              {/if}
            {/each}
          </select>
        </Field>

        <Field label="Urutan" for="cat-order">
          <Input id="cat-order" type="number" min={0} max={9999} bind:value={sortOrder} />
        </Field>

        <div class="form__actions">
          <Button type="submit" loading={busy} disabled={name.trim().length < 2}>
            {editing ? 'Simpan perubahan' : 'Tambahkan'}
          </Button>
          {#if editing}
            <Button variant="ghost" onclick={reset}>Batal</Button>
          {/if}
        </div>
      </form>
    </Card>

    <Card title="Struktur kategori" description={`${flat.length} kategori`}>
      {#if loading}
        <div class="adm-center"><Spinner size={24} label="Memuat kategori" /></div>
      {:else if flat.length === 0}
        <p class="adm-muted">Belum ada kategori. Tambahkan kategori akar terlebih dahulu.</p>
      {:else}
        <ul class="tree">
          {#each flat as entry (entry.node.id)}
            <li class="tree__item" style:padding-left={`${entry.depth * 24}px`}>
              <div class="tree__main">
                <span class="tree__name">{entry.node.name}</span>
                <code class="tree__path">{entry.node.path}</code>
                <span class="tree__meta">{entry.node.questionCount} soal</span>
              </div>
              <div class="tree__actions">
                <button type="button" class="link" onclick={() => startCreate(entry.node)}>
                  + Sub
                </button>
                <button type="button" class="link" onclick={() => startEdit(entry.node)}>
                  Ubah
                </button>
                <button
                  type="button"
                  class="link link--danger"
                  disabled={busy}
                  onclick={() => remove(entry.node)}
                >
                  Hapus
                </button>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </Card>
  </div>
</div>

<style>
  .layout {
    display: grid;
    gap: var(--space-5);
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
  }

  @media (min-width: 960px) {
    .layout {
      grid-template-columns: 360px minmax(0, 1fr);
    }
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .form__actions {
    display: flex;
    gap: var(--space-2);
  }

  .select {
    width: 100%;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font-size: var(--text-sm);
  }

  .tree {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .tree__item {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .tree__main {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }

  .tree__name {
    font-weight: 600;
    font-size: var(--text-sm);
  }

  .tree__path {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    background: var(--color-surface-muted);
    padding: 1px 6px;
    border-radius: var(--radius-sm);
  }

  .tree__meta {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .tree__actions {
    display: flex;
    gap: var(--space-3);
    font-size: var(--text-xs);
  }

  .link {
    border: 0;
    background: none;
    padding: 0;
    color: var(--color-primary);
    font-weight: 600;
    cursor: pointer;
  }

  .link--danger {
    color: var(--color-danger);
  }
</style>
