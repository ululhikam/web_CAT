<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    description?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    elevated?: boolean;
    children: Snippet;
    footer?: Snippet;
  }

  let { title, description, padding = 'md', elevated = false, children, footer }: Props = $props();
</script>

<section class="card card--{padding}" class:card--elevated={elevated}>
  {#if title || description}
    <header class="card__header">
      {#if title}<h3 class="card__title">{title}</h3>{/if}
      {#if description}<p class="card__description">{description}</p>{/if}
    </header>
  {/if}

  <div class="card__body">
    {@render children()}
  </div>

  {#if footer}
    <footer class="card__footer">
      {@render footer()}
    </footer>
  {/if}
</section>

<style>
  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .card--elevated {
    box-shadow: var(--shadow-sm);
  }

  .card--none {
    padding: 0;
  }
  .card--sm {
    padding: var(--space-4);
  }
  .card--md {
    padding: var(--space-5);
  }
  .card--lg {
    padding: var(--space-8);
  }

  .card__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin-bottom: var(--space-4);
  }

  .card__title {
    font-size: var(--text-lg);
  }

  .card__description {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  .card__footer {
    margin-top: var(--space-5);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
  }
</style>
