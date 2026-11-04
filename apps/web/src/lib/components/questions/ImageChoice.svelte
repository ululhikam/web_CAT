<script lang="ts">
  import type { QuestionRendererProps } from './types';

  let { question, showAnswerKey = false, selected = [], onselect }: QuestionRendererProps = $props();

  function toggle(label: string) {
    onselect?.(selected.includes(label) ? selected.filter((item) => item !== label) : [label]);
  }
</script>

<div class="stem">{question.stemText}</div>

{#if question.media && question.media.length > 0}
  <div class="media">
    {#each question.media as media (media.id ?? media.url)}
      <figure class="media__item">
        <img src={media.url} alt={media.altText ?? 'Gambar soal'} loading="lazy" />
      </figure>
    {/each}
  </div>
{/if}

<div class="grid" role="radiogroup" aria-label="Pilih satu gambar">
  {#each question.options as option (option.label)}
    <button
      type="button"
      class="tile"
      class:tile--active={selected.includes(option.label)}
      class:tile--correct={showAnswerKey && option.isCorrect}
      aria-pressed={selected.includes(option.label)}
      onclick={() => toggle(option.label)}
    >
      <span class="tile__label">{option.label}</span>
      {#if option.media && option.media.length > 0}
        <img
          class="tile__image"
          src={option.media[0]!.url}
          alt={option.media[0]!.altText ?? `Opsi ${option.label}`}
          loading="lazy"
        />
      {:else}
        <span class="tile__empty">Gambar belum tersedia</span>
      {/if}
      {#if option.contentText}
        <span class="tile__caption">{option.contentText}</span>
      {/if}
      {#if showAnswerKey && option.isCorrect}
        <span class="tile__key">kunci</span>
      {/if}
    </button>
  {/each}
</div>

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

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--space-3);
    margin-top: var(--space-4);
  }

  .tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    cursor: pointer;
    position: relative;
  }

  .tile:hover {
    border-color: var(--color-primary);
  }

  .tile--active {
    border-color: var(--color-primary);
    box-shadow: inset 0 0 0 1px var(--color-primary);
  }

  .tile--correct {
    border-color: var(--color-success);
  }

  .tile__label {
    position: absolute;
    top: var(--space-2);
    left: var(--space-2);
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: var(--radius-full);
    background: var(--color-surface-muted);
    font-weight: 700;
    font-size: var(--text-xs);
  }

  .tile__image {
    width: 100%;
    max-height: 180px;
    object-fit: contain;
  }

  .tile__empty {
    display: grid;
    place-items: center;
    width: 100%;
    min-height: 120px;
    background: var(--color-surface-muted);
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .tile__caption {
    font-size: var(--text-sm);
    text-align: center;
  }

  .tile__key {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-success);
  }
</style>
