<script lang="ts">
  import type { QuestionRendererProps } from './types';

  let { question, showAnswerKey = false, selected = [], onselect }: QuestionRendererProps = $props();

  function choose(label: string) {
    onselect?.(selected.includes(label) ? [] : [label]);
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

<div class="options" role="radiogroup" aria-label="Pilih satu jawaban">
  {#each question.options as option (option.label)}
    <button
      type="button"
      class="option"
      class:option--active={selected.includes(option.label)}
      class:option--correct={showAnswerKey && option.isCorrect}
      aria-pressed={selected.includes(option.label)}
      onclick={() => choose(option.label)}
    >
      <span class="option__label">{option.label}</span>
      <span class="option__body">
        {#if option.media && option.media.length > 0}
          <span class="option__media">
            {#each option.media as media (media.id ?? media.url)}
              <img src={media.url} alt={media.altText ?? `Opsi ${option.label}`} loading="lazy" />
            {/each}
          </span>
        {/if}
        {#if option.contentText}
          <span class="option__text">{option.contentText}</span>
        {/if}
      </span>
      {#if showAnswerKey && option.isCorrect}
        <span class="option__key" aria-label="Kunci jawaban">✓</span>
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
    flex-direction: column;
    gap: var(--space-2);
    margin-top: var(--space-4);
  }

  .option {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    text-align: left;
    cursor: pointer;
    transition: border-color var(--duration-fast) var(--ease-out);
  }

  .option:hover {
    border-color: var(--color-primary);
  }

  .option--active {
    border-color: var(--color-primary);
    box-shadow: inset 0 0 0 1px var(--color-primary);
  }

  .option--correct {
    border-color: var(--color-success);
    background: color-mix(in srgb, var(--color-success) 6%, var(--color-surface));
  }

  .option__label {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    flex: none;
    border-radius: var(--radius-full);
    background: var(--color-surface-muted);
    font-weight: 700;
    font-size: var(--text-sm);
  }

  .option__body {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .option__media {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .option__media img {
    max-height: 120px;
    border-radius: var(--radius-sm);
  }

  .option__text {
    white-space: pre-wrap;
  }

  .option__key {
    margin-left: auto;
    color: var(--color-success);
    font-weight: 700;
  }
</style>
