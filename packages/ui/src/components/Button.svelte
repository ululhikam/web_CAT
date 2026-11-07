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
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .btn--primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }

  .btn--secondary {
    background: #ffffff;
    color: var(--color-text);
    border-color: var(--color-border-strong);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .btn--secondary:hover:not(:disabled) {
    background: var(--neutral-100);
    border-color: var(--neutral-400);
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
    background: linear-gradient(180deg, #f43f5e 0%, #e11d48 100%);
    color: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.18);
  }

  .btn--danger:hover:not(:disabled) {
    background: linear-gradient(180deg, #e11d48 0%, #be123c 100%);
    box-shadow: 0 4px 12px rgba(225, 29, 72, 0.25);
  }

  .btn--success {
    background: linear-gradient(180deg, #10b981 0%, #059669 100%);
    color: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.18);
  }

  .btn--success:hover:not(:disabled) {
    background: linear-gradient(180deg, #059669 0%, #047857 100%);
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
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
