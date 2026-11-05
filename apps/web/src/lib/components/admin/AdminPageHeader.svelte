<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    description?: string;
    /** Di atas judul, mis. nama bagian. */
    eyebrow?: string;
    actions?: Snippet;
    children?: Snippet;
  }

  let { title, description, eyebrow, actions, children }: Props = $props();
</script>

<header class="head">
  <div class="head__text">
    {#if eyebrow}<p class="head__eyebrow">{eyebrow}</p>{/if}
    <h1 class="head__title">{title}</h1>
    {#if description}<p class="head__desc">{description}</p>{/if}
    {@render children?.()}
  </div>

  {#if actions}
    <div class="head__actions">{@render actions()}</div>
  {/if}
</header>

<style>
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .head__text {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
    max-width: 74ch;
  }

  .head__eyebrow {
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-subtle);
  }

  .head__title {
    font-size: var(--text-2xl);
    word-break: break-word;
  }

  .head__desc {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    line-height: var(--leading-relaxed);
  }

  .head__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
</style>
