<script lang="ts">
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import { discountPercent, formatIdr, formatPerDay } from '$lib/format';
  import type { Plan } from '@webcat/contracts';

  interface Props {
    plan: Plan;
    selected?: boolean;
    onselect?: (plan: Plan) => void;
  }

  let { plan, selected = false, onselect }: Props = $props();

  const discount = $derived(discountPercent(plan.priceIdr, plan.compareAtPriceIdr));
  const isFree = $derived(plan.priceIdr === 0);
</script>

<article
  class="plan"
  class:plan--popular={plan.isPopular}
  class:plan--selected={selected}
  aria-labelledby="plan-{plan.code}"
>
  <header class="plan__header">
    {#if plan.isPopular || plan.badge}
      <p class="plan__badge">{plan.badge ?? 'Paling populer'}</p>
    {/if}

    <h3 class="plan__name" id="plan-{plan.code}">{plan.name}</h3>
    {#if plan.tagline}<p class="plan__tagline">{plan.tagline}</p>{/if}
  </header>

  <div class="plan__price">
    <span class="plan__amount">{isFree ? 'Gratis' : formatIdr(plan.priceIdr)}</span>
    {#if plan.compareAtPriceIdr}
      <s class="plan__compare">{formatIdr(plan.compareAtPriceIdr)}</s>
    {/if}
    {#if discount !== null}
      <span class="plan__discount">-{discount}%</span>
    {/if}
  </div>

  <p class="plan__meta">
    {plan.durationDays} hari{#if !isFree} · {formatPerDay(plan.pricePerDayIdr)}{/if}
  </p>

  <ul class="plan__features">
    {#each plan.features as feature (feature.label)}
      <li class:plan__feature--off={!feature.included}>
        <span class="plan__check" aria-hidden="true">{feature.included ? '✓' : '–'}</span>
        <span>{feature.label}</span>
      </li>
    {/each}
  </ul>

  <Button
    variant={plan.isPopular ? 'primary' : 'secondary'}
    fullWidth
    onclick={() => onselect?.(plan)}
    title={`Pilih paket ${plan.name}`}
  >
    {isFree ? 'Coba gratis' : 'Pilih paket'}
  </Button>
</article>

<style>
  .plan {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-5);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    transition: box-shadow var(--duration-fast) var(--ease-out);
  }

  .plan:hover { box-shadow: var(--shadow-md); }

  .plan--popular {
    border-color: var(--color-primary);
    border-width: 2px;
  }

  .plan--selected {
    box-shadow: var(--shadow-ring);
    border-color: var(--color-primary);
  }

  .plan__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .plan__badge {
    align-self: flex-start;
    padding: 0.2rem 0.55rem;
    border-radius: var(--radius-full);
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .plan__name { font-size: var(--text-lg); }

  .plan__tagline {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .plan__price {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .plan__amount {
    font-size: var(--text-3xl);
    font-weight: 750;
    letter-spacing: -0.03em;
  }

  .plan__compare {
    font-size: var(--text-sm);
    color: var(--color-text-subtle);
  }

  .plan__discount {
    padding: 0.1rem 0.4rem;
    border-radius: var(--radius-full);
    background: var(--color-danger-soft);
    color: var(--color-danger);
    font-size: var(--text-xs);
    font-weight: 700;
  }

  .plan__meta {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .plan__features {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--text-sm);
  }

  .plan__features li {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .plan__check {
    flex: none;
    width: 1.1em;
    font-weight: 700;
    color: var(--color-success);
  }

  .plan__feature--off { color: var(--color-text-subtle); }
  .plan__feature--off .plan__check { color: var(--color-text-subtle); }
</style>
