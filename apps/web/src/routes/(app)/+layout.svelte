<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { session } from '$lib/stores/session.svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  onMount(() => {
    void (async () => {
      await session.restore();
      if (!session.user) {
        const target = $page.url.pathname + $page.url.search;
        await goto(`/login?redirect=${encodeURIComponent(target)}`);
      }
    })();
  });

  const nav = [
    { href: '/dashboard', label: 'Ringkasan' },
    { href: '/subscription', label: 'Langganan' },
    { href: '/profile', label: 'Profil' },
    { href: '/devices', label: 'Perangkat' },
  ] as const;

  let current = $derived($page.url.pathname);
</script>

<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if !session.user}
  <div class="loading"><Spinner size={28} label="Memeriksa sesi" /></div>
{:else}
  <div class="shell">
    <aside class="sidebar">
      <a class="sidebar__brand" href="/">
        <span class="sidebar__mark" aria-hidden="true">W</span>
        <span>Web CAT</span>
      </a>

      <nav aria-label="Navigasi peserta">
        {#each nav as item (item.href)}
          <a
            class="sidebar__link"
            class:sidebar__link--active={current === item.href}
            href={item.href}>{item.label}</a
          >
        {/each}

        {#if session.isAdmin}
          <p class="sidebar__section">Admin</p>
          <a class="sidebar__link" href="/admin/users">Pengguna</a>
          <a class="sidebar__link" href="/admin/plans">Paket</a>
        {/if}
      </nav>

      <div class="sidebar__user">
        <p class="sidebar__name">{session.user.fullName}</p>
        <p class="sidebar__email">{session.user.email}</p>
        <p class="sidebar__role">{session.user.role}</p>
      </div>
    </aside>

    <main class="content">{@render children()}</main>
  </div>
{/if}

<style>
  .loading {
    display: grid;
    place-items: center;
    min-height: 60dvh;
  }

  .shell {
    display: grid;
    grid-template-columns: 1fr;
    min-height: 100dvh;
  }

  .sidebar {
    display: none;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-5);
    background: var(--color-surface);
    border-right: 1px solid var(--color-border);
  }

  .sidebar__brand {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-weight: 750;
    color: var(--color-text);
    text-decoration: none;
  }

  .sidebar__mark {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: var(--color-primary);
    color: #fff;
    font-size: var(--text-xs);
  }

  .sidebar nav {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    flex: 1;
  }

  .sidebar__link {
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-text-muted);
    text-decoration: none;
  }

  .sidebar__link:hover {
    background: var(--color-surface-muted);
    color: var(--color-text);
    text-decoration: none;
  }

  .sidebar__link--active {
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-weight: 600;
  }

  .sidebar__section {
    margin-top: var(--space-5);
    margin-bottom: var(--space-1);
    padding-inline: var(--space-3);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--color-text-subtle);
  }

  .sidebar__user {
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
  }

  .sidebar__name {
    font-size: var(--text-sm);
    font-weight: 600;
  }

  .sidebar__email {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    overflow-wrap: anywhere;
  }

  .sidebar__role {
    margin-top: var(--space-1);
    font-size: var(--text-xs);
    color: var(--color-text-subtle);
  }

  .content {
    min-width: 0;
    padding: var(--space-6) var(--space-5) var(--space-16);
  }

  @media (min-width: 900px) {
    .shell { grid-template-columns: 260px 1fr; }

    .sidebar {
      display: flex;
      position: sticky;
      top: 0;
      height: 100dvh;
    }

    .content { padding: var(--space-8) var(--space-10); }
  }
</style>
