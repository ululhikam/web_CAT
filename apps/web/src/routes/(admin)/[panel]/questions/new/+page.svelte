<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import QuestionForm from '$lib/components/questions/QuestionForm.svelte';
  import AdminPageHeader from '$lib/components/admin/AdminPageHeader.svelte';
  import { emptyDraft, toPayload, type QuestionDraft } from '$lib/components/questions/draft';
  import { apiErrorMessage, apiRequest } from '$lib/api/client';
  import { adminBase } from '$lib/panel-route';
  import { session } from '$lib/stores/session.svelte';
  import type {
    CategoryNode,
    MediaAssetView,
    MediaListResponse,
    QuestionView,
  } from '@webcat/contracts';

  let categories = $state<Array<{ id: string; path: string }>>([]);
  let media = $state<Array<{ id: string; url: string; altText: string | null }>>([]);
  let loading = $state(true);
  let saving = $state(false);
  let error = $state<string | null>(null);

  function flatten(nodes: CategoryNode[]): Array<{ id: string; path: string }> {
    return nodes.flatMap((node) => [
      { id: node.id, path: node.path },
      ...flatten(node.children ?? []),
    ]);
  }

  onMount(() => {
    void (async () => {
      try {
        const [tree, library] = await Promise.all([
          apiRequest<CategoryNode[]>('/admin/categories?includeEmpty=true', {
            token: session.accessToken,
          }),
          apiRequest<MediaListResponse>('/admin/media?limit=60', { token: session.accessToken }),
        ]);
        categories = flatten(tree);
        media = library.rows.map((asset: MediaAssetView) => ({
          id: asset.id,
          url: asset.url,
          thumbUrl: asset.thumbUrl,
          altText: null,
        }));
      } catch (cause) {
        error = apiErrorMessage(cause);
      } finally {
        loading = false;
      }
    })();
  });

  async function submit(draft: QuestionDraft) {
    if (saving) return;
    saving = true;
    error = null;

    try {
      const created = await apiRequest<QuestionView>('/admin/questions', {
        method: 'POST',
        body: toPayload(draft),
        token: session.accessToken,
      });
      await goto(`${adminBase()}/questions/${created.id}`);
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Tambah Soal — Admin Web CAT</title>
</svelte:head>

<div class="adm-page">
  <AdminPageHeader
    title="Tambah soal"
    description="Pratinjau memakai renderer yang sama dengan halaman ujian."
  />

  {#if loading}
    <div class="center"><Spinner size={26} label="Menyiapkan formulir" /></div>
  {:else}
    <QuestionForm
      initial={emptyDraft()}
      {categories}
      mediaLibrary={media}
      {saving}
      {error}
      onsubmit={submit}
      oncancel={() => goto(`${adminBase()}/questions`)}
    />
  {/if}
</div>

<style>
  .center {
    display: grid;
    place-items: center;
    padding-block: var(--space-12);
  }
</style>
