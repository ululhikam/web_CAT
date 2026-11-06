<script lang="ts">
  import type { FullAutoFill } from 'svelte/elements';

  type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'search' | 'date';

  interface Props {
    id?: string;
    name?: string;
    type?: InputType;
    value?: string | number;
    placeholder?: string;
    autocomplete?: FullAutoFill;
    required?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    min?: number;
    max?: number;
    step?: number;
    maxlength?: number;
    invalid?: boolean;
    ariaLabel?: string;
    showPasswordToggle?: boolean;
    oninput?: (event: Event) => void;
    onchange?: (event: Event) => void;
  }

  let {
    id,
    name,
    type = 'text',
    value = $bindable(''),
    placeholder,
    autocomplete,
    required = false,
    disabled = false,
    readonly = false,
    min,
    max,
    step,
    maxlength,
    invalid = false,
    ariaLabel,
    showPasswordToggle = true,
    oninput,
    onchange,
  }: Props = $props();

  let showPassword = $state(false);

  const effectiveType = $derived(
    type === 'password' && showPassword ? 'text' : type,
  );
</script>

{#if type === 'password' && showPasswordToggle}
  <div class="input-wrap">
    <input
      {id}
      {name}
      type={effectiveType}
      bind:value
      {placeholder}
      {autocomplete}
      {required}
      {disabled}
      {readonly}
      {min}
      {max}
      {step}
      {maxlength}
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      class="input input--with-toggle"
      class:input--invalid={invalid}
      {oninput}
      {onchange}
    />
    <button
      type="button"
      class="input-toggle"
      tabindex="-1"
      onclick={() => (showPassword = !showPassword)}
      aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
      title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
      {disabled}
    >
      {#if showPassword}
        <!-- Eye Off Icon -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      {:else}
        <!-- Eye Icon -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      {/if}
    </button>
  </div>
{:else}
  <input
    {id}
    {name}
    {type}
    bind:value
    {placeholder}
    {autocomplete}
    {required}
    {disabled}
    {readonly}
    {min}
    {max}
    {step}
    {maxlength}
    aria-label={ariaLabel}
    aria-invalid={invalid || undefined}
    class="input"
    class:input--invalid={invalid}
    {oninput}
    {onchange}
  />
{/if}

<style>
  .input-wrap {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
  }

  .input {
    width: 100%;
    padding: 0.6rem 0.75rem;
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    transition:
      border-color var(--duration-fast) var(--ease-out),
      box-shadow var(--duration-fast) var(--ease-out);
  }

  .input--with-toggle {
    padding-right: 2.75rem;
  }

  .input::placeholder {
    color: var(--color-text-subtle);
  }

  .input:hover:not(:disabled) {
    border-color: var(--color-text-subtle);
  }

  .input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: var(--shadow-ring);
  }

  .input:disabled {
    background: var(--color-surface-muted);
    color: var(--color-text-muted);
    cursor: not-allowed;
  }

  .input--invalid {
    border-color: var(--color-danger);
  }

  .input--invalid:focus {
    box-shadow: 0 0 0 3px rgba(192, 51, 43, 0.22);
  }

  .input-toggle {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    margin: 0;
    border: none;
    background: transparent;
    color: var(--color-text-subtle, #94a3b8);
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    transition:
      color var(--duration-fast, 150ms) ease,
      background-color var(--duration-fast, 150ms) ease;
  }

  .input-toggle:hover:not(:disabled) {
    color: var(--color-primary, #2563eb);
    background-color: var(--color-surface-muted, rgba(0, 0, 0, 0.05));
  }

  .input-toggle:focus-visible {
    outline: 2px solid var(--color-primary, #2563eb);
    outline-offset: 1px;
  }

  .input-toggle:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
