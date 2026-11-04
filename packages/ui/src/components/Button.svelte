<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  type Size = 'sm' | 'md' | 'lg';

  interface Props {
    variant?: Variant;
    size?: Size;
    type?: 'button' | 'submit' | 'reset';
    href?: string;
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    title?: string;
    onclick?: (event: MouseEvent) => void;
    children: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    type = 'button',
    href,
    disabled = false,
    loading = false,
    fullWidth = false,
    title,
    onclick,
    children,
  }: Props = $props();

  const isDisabled = $derived(disabled || loading);
</script>

{#if href && !isDisabled}
  <a
    class="btn btn--{variant} btn--{size}"
    class:btn--full={fullWidth}
    {href}
    {title}
    data-testid="button"
  >
    {#if loading}<span class="btn__spinner" aria-hidden="true"></span>{/if}
    {@render children()}
  </a>
{:else}
  <button
    class="btn btn--{variant} btn--{size}"
    class:btn--full={fullWidth}
    {type}
    {title}
    disabled={isDisabled}
    aria-busy={loading}
    {onclick}
    data-testid="button"
  >
    {#if loading}<span class="btn__spinner" aria-hidden="true"></span>{/if}
    {@render children()}
  </button>
{/if}

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
    text-decoration: none;
    transition:
      background var(--duration-fast) var(--ease-out),
      border-color var(--duration-fast) var(--ease-out),
      transform var(--duration-fast) var(--ease-out),
      box-shadow var(--duration-fast) var(--ease-out);
    white-space: nowrap;
  }

  .btn:hover {
    text-decoration: none;
  }

  .btn:active:not(:disabled) {
    transform: translateY(1px);
  }

  .btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .btn--sm {
    padding: 0.4rem 0.7rem;
    font-size: var(--text-xs);
    border-radius: var(--radius-sm);
  }

  .btn--md {
    padding: 0.62rem 1rem;
    font-size: var(--text-sm);
  }

  .btn--lg {
    padding: 0.85rem 1.4rem;
    font-size: var(--text-base);
  }

  .btn--full {
    width: 100%;
  }

  .btn--primary {
    background: var(--color-primary);
    color: #fff;
    box-shadow: var(--shadow-xs);
  }

  .btn--primary:hover:not(:disabled) {
    background: var(--color-primary-hover);
    box-shadow: var(--shadow-sm);
  }

  .btn--secondary {
    background: var(--color-surface);
    color: var(--color-text);
    border-color: var(--color-border-strong);
  }

  .btn--secondary:hover:not(:disabled) {
    background: var(--color-surface-muted);
  }

  .btn--ghost {
    background: transparent;
    color: var(--color-text-muted);
  }

  .btn--ghost:hover:not(:disabled) {
    background: var(--color-surface-muted);
    color: var(--color-text);
  }

  .btn--danger {
    background: var(--color-danger);
    color: #fff;
  }

  .btn--success {
    background: var(--color-success);
    color: #fff;
  }

  .btn__spinner {
    width: 0.9em;
    height: 0.9em;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: var(--radius-full);
    animation: btn-spin 0.6s linear infinite;
  }

  @keyframes btn-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
