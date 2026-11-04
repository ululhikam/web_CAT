<script lang="ts">
  import type { QuestionRendererProps } from './types';

  let { question, showAnswerKey = false, selected = [], onselect }: QuestionRendererProps = $props();

  /** Skala default 1–5 bila bank soal tidak menyimpan opsi eksplisit. */
  const DEFAULT_SCALE = [
    { label: '1', contentText: 'Sangat tidak setuju' },
    { label: '2', contentText: 'Tidak setuju' },
    { label: '3', contentText: 'Netral' },
    { label: '4', contentText: 'Setuju' },
    { label: '5', contentText: 'Sangat setuju' },
  ];

  const options = $derived(
    question.options.length > 0
      ? question.options.map((option) => ({
          label: option.label,
          contentText: option.contentText,
          dimensionMap: option.dimensionMap,
        }))
      : DEFAULT_SCALE.map((option) => ({ ...option, dimensionMap: null })),
  );

  function choose(label: string) {
    onselect?.([label]);
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

<div class="scale" role="radiogroup" aria-label="Tingkat kesetujuan">
  {#each options as option (option.label)}
    <button
      type="button"
      class="pill"
      class:pill--active={selected.includes(option.label)}
      aria-pressed={selected.includes(option.label)}
      onclick={() => choose(option.label)}
    >
      <span class="pill__label">{option.label}</span>
      {#if option.contentText}
        <span class="pill__text">{option.contentText}</span>
      {/if}
    </button>
  {/each}
</div>

{#if showAnswerKey && question.options.some((option) => option.dimensionMap)}
  <div class="key">
    {#each question.options as option (option.label)}
      {#if option.dimensionMap}
        <span class="key__item">
          {option.label}:
          <code>
            {Object.entries(option.dimensionMap)
              .map(([dimension, value]) => `${dimension} ${value > 0 ? '+' : ''}${value}`)
              .join(', ')}
          </code>
        </span>
      {/if}
    {/each}
  </div>
{/if}

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
    max-height: 220px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
  }

  .scale {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-4);
  }

  .pill {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
    min-width: 84px;
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    cursor: pointer;
    transition: border-color var(--duration-fast) var(--ease-out);
  }

  .pill:hover {
    border-color: var(--color-primary);
  }

  .pill--active {
    border-color: var(--color-primary);
    box-shadow: inset 0 0 0 1px var(--color-primary);
  }

  .pill__label {
    font-weight: 700;
  }

  .pill__text {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-align: center;
  }

  .key {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-top: var(--space-4);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }
</style>
