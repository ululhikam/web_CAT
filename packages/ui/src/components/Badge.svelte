<script lang="ts">
  import type { Snippet } from 'svelte';

  type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

  interface Props {
    tone?: Tone;
    /** Varian solid lebih tegas, dipakai untuk label harga/highlight. */
    solid?: boolean;
    size?: 'sm' | 'md';
    children: Snippet;
  }

  let { tone = 'neutral', solid = false, size = 'sm', children }: Props = $props();
</script>

<span
  class="badge badge--{tone} badge--{size}"
  class:badge--solid={solid}
  data-testid="badge"
>
  {@render children()}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    border-radius: var(--radius-full);
    border: 1px solid transparent;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
  }

  .badge--sm {
    padding: 0.25rem 0.55rem;
    font-size: var(--text-xs);
  }

  .badge--md {
    padding: 0.35rem 0.7rem;
    font-size: var(--text-sm);
  }

  .badge--neutral {
    background: var(--color-surface-muted);
    color: var(--color-text-muted);
    border-color: var(--color-border);
  }

  .badge--brand {
    background: var(--color-primary-soft);
    color: var(--color-primary);
    border-color: var(--brand-200);
  }

  .badge--success {
    background: var(--color-success-soft);
    color: var(--color-success);
  }

  .badge--warning {
    background: var(--color-warning-soft);
    color: var(--color-warning);
  }

  .badge--danger {
    background: var(--color-danger-soft);
    color: var(--color-danger);
  }

  .badge--info {
    background: var(--color-info-soft);
    color: var(--color-info);
  }

  .badge--solid {
    border-color: transparent;
    color: #fff;
  }

  .badge--solid.badge--brand {
    background: var(--color-primary);
  }
  .badge--solid.badge--neutral {
    background: var(--neutral-600);
  }
  .badge--solid.badge--success {
    background: var(--color-success);
  }
  .badge--solid.badge--warning {
    background: var(--color-warning);
  }
  .badge--solid.badge--danger {
    background: var(--color-danger);
  }
  .badge--solid.badge--info {
    background: var(--color-info);
  }
</style>
