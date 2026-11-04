<script lang="ts">
  import type { QuestionType } from '@webcat/contracts';
  import SingleChoice from './SingleChoice.svelte';
  import MultiChoice from './MultiChoice.svelte';
  import ImageChoice from './ImageChoice.svelte';
  import LikertStatement from './LikertStatement.svelte';
  import MissingElement from './MissingElement.svelte';
  import PassHandColumn from './PassHandColumn.svelte';
  import type { QuestionRendererProps } from './types';

  type Renderer = typeof SingleChoice;

  /**
   * Satu-satunya titik render soal.
   *
   * Pratinjau admin dan runner ujian memakai komponen yang sama sehingga
   * tampilan soal tidak bisa berbeda antar layar. Kunci jawaban hanya muncul
   * bila `showAnswerKey` diminta eksplisit (default `false`).
   */
  const RENDERERS: Record<QuestionType, Renderer> = {
    SINGLE_CHOICE: SingleChoice,
    MULTI_CHOICE: MultiChoice,
    IMAGE_CHOICE: ImageChoice,
    LIKERT_STATEMENT: LikertStatement,
    MISSING_ELEMENT: MissingElement,
    PASS_HAND_COLUMN: PassHandColumn,
  };

  let { question, showAnswerKey = false, selected = [], onselect }: QuestionRendererProps = $props();

  const Renderer = $derived(RENDERERS[question.type]);
</script>

{#if Renderer}
  <Renderer {question} {showAnswerKey} {selected} {onselect} />
{:else}
  <p class="unknown">Tipe soal {question.type} belum memiliki renderer.</p>
{/if}

<style>
  .unknown {
    padding: var(--space-3);
    border: 1px dashed var(--color-border-strong);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }
</style>
