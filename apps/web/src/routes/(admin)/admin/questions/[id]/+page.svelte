<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import QuestionForm from '$lib/components/questions/QuestionForm.svelte';
  import { toPayload, type QuestionDraft } from '$lib/components/questions/draft';
  import { apiErrorMessage, apiRequest } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import { formatDateTime } from '$lib/format';
  import type {
    CategoryNode,
    MediaAssetView,
    MediaListResponse,
    QuestionView,
  } from '@webcat/contracts';

  const id = $derived(page.params.id ?? '');

  let question = $state<QuestionView | null>(null);
  let categories = $state<Array<{ id: string; path: string }>>([]);
  let media = $state<Array<{ id: string; url: string; altText: string | null }>>([]);
  let loading = $state(true);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let notice = $state<string | null>(null);

  function flatten(nodes: CategoryNode[]): Array<{ id: string; path: string }> {
    return nodes.flatMap((node) => [
      { id: node.id, path: node.path },
      ...flatten(node.children ?? []),
    ]);
  }

  function toDraft(view: QuestionView): QuestionDraft {
    return {
      publicCode: view.publicCode,
      stageCode: view.stageCode,
      subtestCode: view.subtestCode,
      categoryId: view.categoryId ?? '',
      type: view.type,
      status: view.status,
      difficulty: view.difficulty,
      stemText: view.stemText,
      stemFormat: view.stemFormat,
      explanation: view.explanation ?? '',
      pairGroup: view.pairGroup ?? '',
      columnIndex: view.columnIndex,
      tags: view.tags.join(', '),
      options: view.options.map((option) => ({
        label: option.label,
        contentText: option.contentText ?? '',
        isCorrect: option.isCorrect,
        scoreValue: option.scoreValue,
      })),
      media: view.media.map((item) => ({
        mediaAssetId: item.mediaAssetId,
        role: item.role,
        optionLabel: item.optionLabel ?? '',
      })),
    };
  }

  async function load() {
    loading = true;
    error = null;

    try {
      const [view, tree, library] = await Promise.all([
        apiRequest<QuestionView>(`/admin/questions/${id}`, { token: session.accessToken }),
        apiRequest<CategoryNode[]>('/admin/categories?includeEmpty=true', {
          token: session.accessToken,
        }),
        apiRequest<MediaListResponse>('/admin/media?limit=60', { token: session.accessToken }),
      ]);
      question = view;
      categories = flatten(tree);
      media = library.rows.map((asset: MediaAssetView) => ({
        id: asset.id,
        url: asset.url,
        altText: null,
      }));
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    if (id) void load();
  });

  async function submit(draft: QuestionDraft) {
    if (saving) return;
    saving = true;
    error = null;
    notice = null;

    try {
      question = await apiRequest<QuestionView>(`/admin/questions/${id}`, {
        method: 'PATCH',
        body: toPayload(draft),
        token: session.accessToken,
      });
      notice = 'Perubahan tersimpan.';
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      saving = false;
    }
  }

  async function publish() {
    saving = true;
    error = null;
    notice = null;
    try {
      question = await apiRequest<QuestionView>(`/admin/questions/${id}/publish`, {
        method: 'POST',
        token: session.accessToken,
      });
      notice = 'Soal dipublikasikan.';
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      saving = false;
    }
  }

  async function remove() {
    if (!confirm('Hapus soal ini?')) return;
    saving = true;
    error = null;
    try {
      await apiRequest(`/admin/questions/${id}`, {
        method: 'DELETE',
        token: session.accessToken,
      });
      await goto('/admin/questions');
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Ubah Soal — Admin Web CAT</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">{question?.publicCode ?? 'Ubah soal'}</h1>
      <p class="muted">
        {#if question}
          {question.stageCode} · {question.subtestCode} · diperbarui
          {formatDateTime(question.updatedAt)}
        {/if}
      </p>
    </div>
    <div class="header-actions">
      <Button variant="secondary" href="/admin/questions">Kembali</Button>
      <Button variant="success" loading={saving} onclick={publish}>Publikasikan</Button>
      <Button variant="danger" loading={saving} onclick={remove}>Hapus</Button>
    </div>
  </header>

  {#if error}
    <Alert tone="danger" title="Gagal memproses soal">{error}</Alert>
  {/if}
  {#if notice}
    <Alert tone="success">{notice}</Alert>
  {/if}

  {#if loading}
    <div class="center"><Spinner size={26} label="Memuat soal" /></div>
  {:else if question}
    <QuestionForm
      initial={toDraft(question)}
      {categories}
      mediaLibrary={media}
      {saving}
      submitLabel="Simpan perubahan"
      onsubmit={submit}
      oncancel={() => goto('/admin/questions')}
    />
  {:else}
    <Alert tone="warning" title="Soal tidak ditemukan">
      Soal mungkin sudah dihapus atau tautannya salah.
    </Alert>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
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
    word-break: break-all;
  }

  .header-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .center {
    display: grid;
    place-items: center;
    padding-block: var(--space-12);
  }
</style>
