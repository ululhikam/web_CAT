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
    oninput,
    onchange,
  }: Props = $props();
</script>

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

<style>
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
</style>
