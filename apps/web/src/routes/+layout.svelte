<script lang="ts">
  import '../app.css';
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import { session } from '$lib/stores/session.svelte';

  let { children }: { children: Snippet } = $props();

  /**
   * Pulihkan sesi sekali saat aplikasi dimuat: cookie refresh (httpOnly) →
   * access token baru di memori. Halaman privat menampilkan skeleton sampai
   * keadaan ini selesai (`session.loading`).
   */
  onMount(() => {
    void session.restore();
  });
</script>

<svelte:head>
  <meta charset="utf-8" />
</svelte:head>

{@render children()}
