<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Spinner from '@webcat/ui/components/Spinner.svelte';

  /**
   * Rute lama "Simulasi CAT" sudah digantikan layar pemilihan tes `/exam`.
   * Halaman ini hanya menjaga tautan lama tetap berfungsi.
   */
  onMount(() => {
    void goto('/exam', { replaceState: true });
  });
</script>

<svelte:head>
  <title>TES CAT</title>
</svelte:head>

<div class="center"><Spinner size={28} label="Membuka TES CAT" /></div>

<style>
  .center {
    display: grid;
    place-items: center;
    padding-block: var(--space-12);
  }
</style>
