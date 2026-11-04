<script lang="ts">
  import type { QuestionRendererProps } from './types';

  let { question, showAnswerKey = false, selected = [], onselect }: QuestionRendererProps = $props();

  function toggle(label: string) {
    const next = selected.includes(label)
      ? selected.filter((item) => item !== label)
      : [...selected, label];
    onselect?.(next);
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

<p class="hint">Pilih semua jawaban yang benar.</p>

<div class="options" role="group" aria-label="Pilih satu atau lebih jawaban">
  {#each question.options as option (option.label)}
    <label
      class="option"
      class:option--active={selected.includes(option.label)}
      class:option--correct={showAnswerKey && option.isCorrect}
    >
      <input
        type="checkbox"
        checked={selected.includes(option.label)}
        onchange={() => toggle(option.label)}
      />
      <span class="option__label">{option.label}</span>
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
      {#if showAnswerKey && option.isCorrect}
        <span class="option__key" aria-label="Kunci jawaban">✓</span>
      {/if}
    </label>
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

  .hint {
    margin-top: var(--space-3);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-top: var(--space-3);
  }

  .option {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3);
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
    background: color-mix(in srgb, var(--color-success) 6%, var(--color-surface));
  }

  .option__label {
    font-weight: 700;
    font-size: var(--text-sm);
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
