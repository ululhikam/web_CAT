<script lang="ts">
  import RevenueWidget from './RevenueWidget.svelte';
</script>

<svelte:head>
  <title>Dashboard — Admin TES CAT</title>
</svelte:head>

<div class="page">
  <header>
    <h1 class="page__title">Dashboard</h1>
    <p class="muted">Ringkasan pendapatan dan kesehatan langganan.</p>
  </header>

  <RevenueWidget />
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .page__title {
    font-size: var(--text-2xl);
  }
</style>
