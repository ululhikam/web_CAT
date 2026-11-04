<script lang="ts">
  import type { Snippet } from 'svelte';

  type Tone = 'info' | 'success' | 'warning' | 'danger';

  interface Props {
    tone?: Tone;
    title?: string;
    /** Bila diisi, tombol tutup ditampilkan. */
    onclose?: () => void;
    children: Snippet;
  }

  let { tone = 'info', title, onclose, children }: Props = $props();
</script>

<div class="alert alert--{tone}" role={tone === 'danger' ? 'alert' : 'status'}>
  <div class="alert__content">
    {#if title}<p class="alert__title">{title}</p>{/if}
    <div class="alert__body">{@render children()}</div>
  </div>

  {#if onclose}
    <button class="alert__close" type="button" aria-label="Tutup" onclick={onclose}>×</button>
  {/if}
</div>

<style>
  .alert {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
  }

  .alert__content {
    flex: 1;
    min-width: 0;
  }

  .alert__title {
    font-weight: 650;
    margin-bottom: var(--space-1);
  }

  .alert__body :global(p) {
    margin: 0;
  }

  .alert__close {
    flex: none;
    background: transparent;
    border: 0;
    font-size: var(--text-lg);
    line-height: 1;
    cursor: pointer;
    opacity: 0.6;
    padding: 0 0.2rem;
  }

  .alert__close:hover {
    opacity: 1;
  }

  .alert--info {
    background: var(--color-info-soft);
    border-color: var(--color-info);
    color: var(--color-info);
  }

  .alert--success {
    background: var(--color-success-soft);
    border-color: var(--color-success);
    color: var(--color-success);
  }

  .alert--warning {
    background: var(--color-warning-soft);
    border-color: var(--color-warning);
    color: var(--color-warning);
  }

  .alert--danger {
    background: var(--color-danger-soft);
    border-color: var(--color-danger);
    color: var(--color-danger);
  }
</style>
