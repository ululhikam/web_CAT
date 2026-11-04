<script lang="ts">
  import type { Snippet } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { session } from '$lib/stores/session.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';

  let { children }: { children: Snippet } = $props();

  /**
   * Guard admin sisi klien (Phase 0). Cek dilakukan setelah `restore()`.
   * Bukan pengganti otorisasi server: setiap endpoint admin tetap memeriksa
   * permission di API.
   */
  $effect(() => {
    if (session.loading) return;

    if (!session.user) {
      const target = page.url.pathname + page.url.search;
      void goto(`/login?redirect=${encodeURIComponent(target)}`, { replaceState: true });
      return;
    }

    if (!session.isAdmin) {
      void goto('/dashboard', { replaceState: true });
    }
  });
</script>

<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if session.loading || !session.isAdmin}
  <div class="loading"><Spinner size={28} label="Memeriksa hak akses" /></div>
{:else}
  <div class="admin">
    <header class="admin__bar">
      <a class="admin__brand" href="/admin/users">Web CAT Admin</a>
      <nav aria-label="Navigasi admin">
        <a href="/admin/users" class:is-active={page.url.pathname.startsWith('/admin/users')}>
          Pengguna
        </a>
        <a href="/admin/questions" class:is-active={page.url.pathname.startsWith('/admin/questions')}>
          Soal
        </a>
        <a
          href="/admin/categories"
          class:is-active={page.url.pathname.startsWith('/admin/categories')}
        >
          Kategori
        </a>
        <a href="/admin/media" class:is-active={page.url.pathname.startsWith('/admin/media')}>
          Media
        </a>
        <a href="/admin/plans" class:is-active={page.url.pathname.startsWith('/admin/plans')}>
          Paket
        </a>
        {#if session.isSuperAdmin}
          <a href="/admin/audit" class:is-active={page.url.pathname.startsWith('/admin/audit')}>
            Audit
          </a>
          <a
            href="/admin/settings"
            class:is-active={page.url.pathname.startsWith('/admin/settings')}
          >
            Pengaturan
          </a>
        {/if}
        <a href="/dashboard">Ke dashboard</a>
      </nav>
    </header>

    <main class="admin__content">
      {@render children()}
    </main>
  </div>
{/if}

<style>
  .loading {
    display: grid;
    place-items: center;
    min-height: 60dvh;
  }

  .admin {
    min-height: 100dvh;
    background: var(--color-bg);
  }

  .admin__bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-6);
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
  }

  .admin__brand {
    font-weight: 750;
    color: var(--color-text);
    text-decoration: none;
  }

  nav {
    display: flex;
    gap: var(--space-4);
    font-size: var(--text-sm);
  }

  nav a {
    color: var(--color-text-muted);
    text-decoration: none;
    padding-block: var(--space-1);
    border-bottom: 2px solid transparent;
  }

  nav a:hover {
    color: var(--color-text);
    text-decoration: none;
  }

  nav a.is-active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
    font-weight: 600;
  }

  .admin__content {
    padding: var(--space-6);
    max-width: 1160px;
    margin-inline: auto;
  }

  @media (min-width: 768px) {
    .admin__content {
      padding: var(--space-8);
    }
  }
</style>
