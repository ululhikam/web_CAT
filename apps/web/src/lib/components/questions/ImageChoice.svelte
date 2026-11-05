<script lang="ts">
  import { renderQuestionTileView } from '$lib/exams/render-adapter';
  import type { TileMedia } from '$lib/exams/render-adapter';
  import MediaViewer from '$lib/components/media/MediaViewer.svelte';
  import ImageChoiceTiles from './ImageChoiceTiles.svelte';
  import type { QuestionRendererProps } from './types';

  let { question, showAnswerKey = false, selected = [], onselect }: QuestionRendererProps = $props();

  /**
   * Pratinjau admin untuk soal bergambar.
   *
   * Data dibaca lewat `renderQuestionTileView()` — adapter yang sama dipakai
   * runner — lalu digambar oleh `ImageChoiceTiles` yang juga dipakai runner.
   * Jadi pratinjau tidak bisa lagi menampilkan hal berbeda dari ujian (F3-15).
   *
   * F5-12: pratinjau ikut bisa memperbesar gambar, supaya admin bisa memeriksa
   * detail figural dari layar yang sama dengan peserta.
   */
  const view = $derived(renderQuestionTileView(question));

  let viewerSrc = $state<string | null>(null);
  let viewerAlt = $state('Gambar soal');
  let viewer = $state<{ rememberTrigger: (element: HTMLElement | null) => void } | null>(null);

  function openViewer(media: TileMedia, trigger?: HTMLElement | null): void {
    viewer?.rememberTrigger(trigger ?? null);
    viewerAlt = media.alt || 'Gambar soal';
    viewerSrc = media.url;
  }

  function toggle(label: string) {
    onselect?.(selected.includes(label) ? selected.filter((item) => item !== label) : [label]);
  }
</script>

<div class="stem">{question.stemText}</div>

{#if view.stemMedia.length > 0}
  <div class="media">
    {#each view.stemMedia as media (media.url)}
      <figure class="media__item">
        <button
          type="button"
          class="media__button"
          aria-label={`Perbesar gambar: ${media.alt || 'Gambar soal'}`}
          onclick={(event) => openViewer(media, event.currentTarget)}
        >
          <img src={media.url} alt={media.alt || 'Gambar soal'} loading="lazy" />
        </button>
      </figure>
    {/each}
  </div>
{/if}

<ImageChoiceTiles
  options={view.options}
  {showAnswerKey}
  isActive={(option) => selected.includes(option.label)}
  onselect={(option) => toggle(option.label)}
  onzoom={(media, trigger) => openViewer(media, trigger)}
/>

<MediaViewer
  bind:this={viewer}
  src={viewerSrc}
  alt={viewerAlt}
  onclose={() => (viewerSrc = null)}
/>

<style>
  .stem {
    white-space: pre-wrap;
    line-height: 1.6;
  }

  .media {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-top: var(--space-3);
  }

  .media__item {
    margin: 0;
  }

  .media__button {
    padding: 0;
    border: 0;
    background: transparent;
    cursor: zoom-in;
  }

  .media__button img {
    display: block;
    max-height: 240px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
  }

  .media__button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
</style>
