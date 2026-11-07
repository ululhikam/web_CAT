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
      <div class="brand__logo-wrap">
        <img
          class="brand__logo"
          src="/logo-badge.png"
          alt="Logo TES CAT"
          width="38"
          height="38"
          aria-hidden="true"
        />
      </div>
      <div class="brand__text">
        <span class="brand__title">TES CAT</span>
        <span class="brand__sub">Portal Resmi Seleksi Polri</span>
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
        <a class="btn btn--outline" href={home}>Dashboard</a>
        <button class="btn btn--ghost" type="button" onclick={logout}>Keluar</button>
      {:else}
        <a class="btn btn--secondary" href="/login">Masuk</a>
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
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--color-border);
    transition: all 0.2s ease;
  }

  .header__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1240px;
    margin: 0 auto;
    padding: 0.85rem 1.5rem;
    gap: 1.5rem;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    text-decoration: none;
    color: var(--color-text);
  }

  .brand__logo-wrap {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: #ffffff;
    display: grid;
    place-items: center;
    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);
    flex-shrink: 0;
    border: 1px solid rgba(226, 232, 240, 0.8);
    transition: transform 0.2s ease;
  }

  .brand:hover .brand__logo-wrap {
    transform: scale(1.04);
  }

  .brand__logo {
    display: block;
    width: 38px;
    height: 38px;
    object-fit: contain;
    border-radius: 8px;
  }

  .brand__text {
    display: flex;
    flex-direction: column;
  }

  .brand__title {
    font-size: 1.05rem;
    font-weight: 850;
    letter-spacing: -0.025em;
    background: linear-gradient(135deg, var(--brand-950) 0%, var(--brand-700) 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1.15;
  }

  .brand__sub {
    font-size: 10.5px;
    color: var(--color-text-muted);
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .nav {
    display: none;
    align-items: center;
    gap: 1.75rem;
  }

  @media (min-width: 860px) {
    .nav {
      display: flex;
    }
  }

  .nav__link {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-decoration: none;
    position: relative;
    padding: 4px 0;
    transition: color 0.15s ease;
  }

  .nav__link:hover {
    color: var(--color-primary);
    text-decoration: none;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .actions__skeleton {
    display: block;
    width: 80px;
    height: 36px;
    border-radius: 8px;
    background: var(--neutral-100);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.55rem 1.2rem;
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
    font-weight: 650;
    text-decoration: none;
    transition: all 0.15s ease;
    cursor: pointer;
    border: 1px solid transparent;
    line-height: 1;
  }

  .btn--primary {
    background: linear-gradient(135deg, var(--brand-600) 0%, var(--brand-700) 100%);
    color: #ffffff;
    box-shadow: 0 2px 6px rgba(79, 70, 229, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .btn--primary:hover {
    background: linear-gradient(135deg, var(--brand-700) 0%, var(--brand-800) 100%);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
    text-decoration: none;
    transform: translateY(-1px);
  }

  .btn--secondary {
    background: #ffffff;
    color: var(--color-text);
    border-color: var(--color-border);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .btn--secondary:hover {
    background: var(--neutral-50);
    border-color: var(--brand-300);
    color: var(--color-primary);
    text-decoration: none;
  }

  .btn--outline {
    background: #ffffff;
    color: var(--color-primary);
    border-color: var(--brand-200);
  }

  .btn--outline:hover {
    background: var(--brand-50);
    border-color: var(--color-primary);
    text-decoration: none;
  }

  .btn--ghost {
    background: transparent;
    color: var(--color-text-muted);
    padding-inline: 0.75rem;
  }

  .btn--ghost:hover {
    color: var(--color-danger);
    background: var(--color-danger-soft);
    text-decoration: none;
  }
</style>
