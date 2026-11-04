<script lang="ts">
  import type { Snippet } from 'svelte';
  import SiteHeader from '$lib/components/SiteHeader.svelte';
  import SiteFooter from '$lib/components/SiteFooter.svelte';

  let { children }: { children: Snippet } = $props();
</script>

<SiteHeader />
<main id="konten">{@render children()}</main>
<SiteFooter />
