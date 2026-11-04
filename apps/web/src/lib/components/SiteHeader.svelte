<script lang="ts">
  import { page } from '$app/stores';
  import { session } from '$lib/stores/session.svelte';

  const nav = [
    { href: '/pricing', label: 'Harga' },
    { href: '/#cara-kerja', label: 'Cara kerja' },
    { href: '/#faq', label: 'FAQ' },
  ] as const;

  let current = $derived($page.url.pathname);

  async function logout() {
    await session.logout();
    await goto('/');
  }

  import { goto } from '$app/navigation';
</script>

<header class="header">
  <div class="container header__inner">
    <a class="brand" href="/" aria-label="Web CAT — beranda">
      <span class="brand__mark" aria-hidden="true">W</span>
      <span class="brand__name">Web CAT</span>
    </a>

    <nav class="nav" aria-label="Navigasi utama">
      {#each nav as item (item.href)}
        <a
          class="nav__link"
          class:nav__link--active={current === item.href}
          href={item.href}>{item.label}</a
        >
      {/each}
    </nav>

    <div class="actions">
      {#if session.loading && !session.user}
        <span class="actions__skeleton" aria-hidden="true"></span>
      {:else if session.user}
        {#if session.isAdmin}
          <a class="btn btn--ghost" href="/admin/users">Admin</a>
        {/if}
        <a class="btn btn--secondary" href="/dashboard">Dashboard</a>
        <button class="btn btn--ghost" type="button" onclick={logout}>Keluar</button>
      {:else}
        <a class="btn btn--ghost" href="/login">Masuk</a>
        <a class="btn btn--primary" href="/pricing">Pilih Paket</a>
      {/if}
    </div>
  </div>
</header>

<style>
  .header {
    position: sticky;
    top: 0;
    z-index: var(--z-header);
    background: color-mix(in srgb, var(--color-surface) 92%, transparent);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--color-border);
  }

  .header__inner {
    display: flex;
    align-items: center;
    gap: var(--space-6);
    min-height: var(--header-height);
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-weight: 750;
    letter-spacing: -0.02em;
    color: var(--color-text);
    text-decoration: none;
  }

  .brand__mark {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 9px;
    background: var(--color-primary);
    color: #fff;
    font-size: var(--text-sm);
  }

  .nav {
    display: none;
    gap: var(--space-5);
    margin-inline-start: var(--space-4);
  }

  .nav__link {
    padding-block: var(--space-2);
    font-size: var(--text-sm);
    font-weight: 550;
    color: var(--color-text-muted);
    text-decoration: none;
    border-bottom: 2px solid transparent;
  }

  .nav__link:hover {
    color: var(--color-text);
    text-decoration: none;
  }

  .nav__link--active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-inline-start: auto;
  }

  .actions__skeleton {
    display: block;
    width: 72px;
    height: 28px;
    border-radius: var(--radius-md);
    background: var(--color-surface-muted);
  }

  /* Tombol lokal ringan untuk header (tidak menarik komponen penuh). */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 0.75rem;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    font-size: var(--text-xs);
    font-weight: 600;
    line-height: 1;
    text-decoration: none;
    cursor: pointer;
  }

  .btn--primary { background: var(--color-primary); color: #fff; }
  .btn--primary:hover { background: var(--color-primary-hover); text-decoration: none; }
  .btn--secondary {
    background: var(--color-surface);
    color: var(--color-text);
    border-color: var(--color-border-strong);
  }
  .btn--secondary:hover { background: var(--color-surface-muted); text-decoration: none; }
  .btn--ghost { background: transparent; color: var(--color-text-muted); }
  .btn--ghost:hover { background: var(--color-surface-muted); text-decoration: none; }

  @media (min-width: 768px) {
    .nav { display: flex; }
  }
</style>
