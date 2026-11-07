<script lang="ts">
  import { goto } from '$app/navigation';
  import { PRICING_ENABLED } from '$lib/features';
  import { homePathFor } from '$lib/panel';
  import { session } from '$lib/stores/session.svelte';

  const nav: ReadonlyArray<{ href: string; label: string }> = [
    { href: '/#tes-cat', label: 'TES CAT Interaktif' },
    { href: '/#struktur', label: 'Struktur Seleksi' },
    { href: '/#kalkulator', label: 'Kalkulator Ambang Batas' },
    { href: '/#faq', label: 'FAQ' },
  ];

  const home = $derived(homePathFor(session.user?.role));

  async function logout() {
    await session.logout();
    await goto('/');
  }
</script>

<header class="header">
  <div class="header__inner">
    <a class="brand" href="/" aria-label="TES CAT — Beranda">
      <img
        class="brand__logo"
        src="/logo-badge.png"
        alt=""
        width="36"
        height="36"
        aria-hidden="true"
      />
      <div class="brand__text">
        <span class="brand__title">TES CAT</span>
        <span class="brand__sub">Portal Seleksi Polri</span>
      </div>
    </a>

    <nav class="nav" aria-label="Navigasi utama">
      {#each nav as item (item.href)}
        <a class="nav__link" href={item.href}>{item.label}</a>
      {/each}
    </nav>

    <div class="actions">
      {#if session.loading && !session.user}
        <span class="actions__skeleton" aria-hidden="true"></span>
      {:else if session.user}
        <a class="btn btn--outline" href={home}>Buka Dashboard</a>
        <button class="btn btn--ghost" type="button" onclick={logout}>Keluar</button>
      {:else}
        <a class="btn btn--secondary" href="/login">Masuk Akun</a>
        <a class="btn btn--primary" href="/login">Mulai Ujian</a>
      {/if}
    </div>
  </div>
</header>

<style>
  .header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
  }

  .header__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0.85rem 1.5rem;
    gap: 1.5rem;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    color: #0f172a;
  }

  .brand__logo {
    display: block;
    width: 36px;
    height: 36px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .brand__text {
    display: flex;
    flex-direction: column;
  }

  .brand__title {
    font-size: 1rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #0f172a;
    line-height: 1.2;
  }

  .brand__sub {
    font-size: 11px;
    color: #64748b;
    font-weight: 500;
  }

  .nav {
    display: none;
    align-items: center;
    gap: 1.5rem;
  }

  @media (min-width: 860px) {
    .nav {
      display: flex;
    }
  }

  .nav__link {
    font-size: 0.875rem;
    font-weight: 600;
    color: #475569;
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .nav__link:hover {
    color: #1e3a8a;
    text-decoration: none;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .actions__skeleton {
    display: block;
    width: 80px;
    height: 36px;
    border-radius: 6px;
    background: #f1f5f9;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.55rem 1.15rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 650;
    text-decoration: none;
    transition: all 0.15s ease;
    cursor: pointer;
    border: 1px solid transparent;
  }

  .btn--primary {
    background: #1e3a8a;
    color: #ffffff;
  }

  .btn--primary:hover {
    background: #172554;
    text-decoration: none;
  }

  .btn--secondary {
    background: #ffffff;
    color: #0f172a;
    border-color: #cbd5e1;
  }

  .btn--secondary:hover {
    background: #f8fafc;
    border-color: #94a3b8;
    text-decoration: none;
  }

  .btn--outline {
    background: #ffffff;
    color: #1e3a8a;
    border-color: #cbd5e1;
  }

  .btn--outline:hover {
    background: #f1f5f9;
    border-color: #1e3a8a;
    text-decoration: none;
  }

  .btn--ghost {
    background: transparent;
    color: #64748b;
    padding-inline: 0.75rem;
  }

  .btn--ghost:hover {
    color: #dc2626;
    text-decoration: none;
  }
</style>
