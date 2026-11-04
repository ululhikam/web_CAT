<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    label: string;
    for?: string;
    hint?: string;
    error?: string | null;
    required?: boolean;
    children: Snippet;
  }

  let { label, for: htmlFor, hint, error, required = false, children }: Props = $props();
</script>

<div class="field" class:field--error={Boolean(error)}>
  <label class="field__label" for={htmlFor}>
    {label}
    {#if required}<span class="field__required" aria-hidden="true">*</span>{/if}
  </label>

  {@render children()}

  {#if error}
    <p class="field__error" role="alert">{error}</p>
  {:else if hint}
    <p class="field__hint">{hint}</p>
  {/if}
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .field__label {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text);
  }

  .field__required {
    color: var(--color-danger);
    margin-left: 2px;
  }

  .field__hint {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .field__error {
    font-size: var(--text-xs);
    color: var(--color-danger);
    font-weight: 500;
  }
</style>
