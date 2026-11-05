<script lang="ts">
  import { renderQuestionTileView } from '$lib/exams/render-adapter';
  import ImageChoiceTiles from './ImageChoiceTiles.svelte';
  import type { QuestionRendererProps } from './types';

  let { question, showAnswerKey = false, selected = [], onselect }: QuestionRendererProps = $props();

  /**
   * Pratinjau admin untuk soal bergambar.
   *
   * Data dibaca lewat `renderQuestionTileView()` — adapter yang sama dipakai
   * runner — lalu digambar oleh `ImageChoiceTiles` yang juga dipakai runner.
   * Jadi pratinjau tidak bisa lagi menampilkan hal berbeda dari ujian (F3-15).
   */
  const view = $derived(renderQuestionTileView(question));

  function toggle(label: string) {
    onselect?.(selected.includes(label) ? selected.filter((item) => item !== label) : [label]);
  }
</script>

<div class="stem">{question.stemText}</div>

{#if view.stemMedia.length > 0}
  <div class="media">
    {#each view.stemMedia as media (media.url)}
      <figure class="media__item">
        <img src={media.url} alt={media.alt || 'Gambar soal'} loading="lazy" />
      </figure>
    {/each}
  </div>
{/if}

<ImageChoiceTiles
  options={view.options}
  {showAnswerKey}
  isActive={(option) => selected.includes(option.label)}
  onselect={(option) => toggle(option.label)}
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

  .media__item img {
    max-height: 240px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
  }
</style>
