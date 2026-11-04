<script lang="ts">
  interface Props {
    size?: number;
    label?: string;
  }

  let { size = 20, label = 'Memuat…' }: Props = $props();
</script>

<span class="spinner-wrap" role="status" aria-live="polite">
  <span class="spinner" style="width:{size}px;height:{size}px" aria-hidden="true"></span>
  <span class="sr-only">{label}</span>
</span>

<style>
  .spinner-wrap {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }

  .spinner {
    display: inline-block;
    border: 2px solid var(--color-border-strong);
    border-top-color: var(--color-primary);
    border-radius: var(--radius-full);
    animation: spinner-rotate 0.7s linear infinite;
  }

  @keyframes spinner-rotate {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation-duration: 2s;
    }
  }
</style>
