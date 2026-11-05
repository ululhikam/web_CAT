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
    background: var(--neutral-100);
    color: var(--neutral-700);
    border-color: var(--neutral-200);
  }

  .badge--brand {
    background: var(--brand-50);
    color: var(--brand-700);
    border-color: var(--brand-200);
  }

  .badge--success {
    background: #ecfdf5;
    color: #065f46;
    border-color: #a7f3d0;
  }

  .badge--warning {
    background: #fffbeb;
    color: #92400e;
    border-color: #fde68a;
  }

  .badge--danger {
    background: #fff1f2;
    color: #9f1239;
    border-color: #fecdd3;
  }

  .badge--info {
    background: #f0f9ff;
    color: #0369a1;
    border-color: #bae6fd;
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
