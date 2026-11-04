<script lang="ts">
  import type { QuestionRendererProps } from './types';

  let { question, showAnswerKey = false, selected = [], onselect }: QuestionRendererProps = $props();

  function toggle(label: string) {
    onselect?.(selected.includes(label) ? [] : [label]);
  }
</script>

<div class="header">
  <span class="badge">Pass Hand</span>
  {#if question.pairGroup}
    <span class="meta">Grup {question.pairGroup}</span>
  {/if}
  <span class="meta">Kolom {(question.columnIndex ?? 0) + 1}</span>
</div>

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

{#if question.options.length > 0}
  <div class="options" role="radiogroup" aria-label="Pilih jawaban">
    {#each question.options as option (option.label)}
      <button
        type="button"
        class="option"
        class:option--active={selected.includes(option.label)}
        class:option--correct={showAnswerKey && option.isCorrect}
        aria-pressed={selected.includes(option.label)}
        onclick={() => toggle(option.label)}
      >
        <span class="option__label">{option.label}</span>
        {#if option.contentText}
          <span>{option.contentText}</span>
        {/if}
      </button>
    {/each}
  </div>
{/if}

<style>
  .header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .badge {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    background: var(--color-surface-muted);
    color: var(--color-text-muted);
  }

  .meta {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

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
    max-height: 200px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-top: var(--space-4);
  }

  .option {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    cursor: pointer;
  }

  .option--active {
    border-color: var(--color-primary);
    box-shadow: inset 0 0 0 1px var(--color-primary);
  }

  .option--correct {
    border-color: var(--color-success);
  }

  .option__label {
    font-weight: 700;
  }
</style>
