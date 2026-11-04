<script lang="ts">
  import type { QuestionRendererProps } from './types';

  let { question, showAnswerKey = false, selected = [], onselect }: QuestionRendererProps = $props();

  function choose(label: string) {
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

<div class="options" role="radiogroup" aria-label="Pilih elemen yang hilang">
  {#each question.options as option (option.label)}
    <button
      type="button"
      class="chip"
      class:chip--active={selected.includes(option.label)}
      class:chip--correct={showAnswerKey && option.isCorrect}
      aria-pressed={selected.includes(option.label)}
      onclick={() => choose(option.label)}
    >
      {#if option.media && option.media.length > 0}
        <img
          class="chip__image"
          src={option.media[0]!.url}
          alt={option.media[0]!.altText ?? `Opsi ${option.label}`}
          loading="lazy"
        />
      {/if}
      {#if option.contentText}
        <span>{option.contentText}</span>
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

  .options {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-4);
  }

  .chip {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    cursor: pointer;
  }

  .chip:hover {
    border-color: var(--color-primary);
  }

  .chip--active {
    border-color: var(--color-primary);
    box-shadow: inset 0 0 0 1px var(--color-primary);
  }

  .chip--correct {
    border-color: var(--color-success);
  }

  .chip__image {
    max-height: 64px;
    border-radius: var(--radius-sm);
  }
</style>
