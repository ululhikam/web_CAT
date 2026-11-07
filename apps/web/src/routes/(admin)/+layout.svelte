<script lang="ts">
  import '$lib/styles/admin.css';

  import { onMount, type Snippet } from 'svelte';
  import { goto, afterNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import AdminIcon from '$lib/components/admin/AdminIcon.svelte';
  import NewSignupsBell from '$lib/components/admin/NewSignupsBell.svelte';
  import {
    activeAdminHref,
    adminBreadcrumbs,
    adminNavFor,
    type AdminNavGroup,
  } from '$lib/admin-nav';
  import { panelBase, panelLabel, type AdminPanel } from '$lib/panel';
  import { session } from '$lib/stores/session.svelte';

  let { children }: { children: Snippet } = $props();

  let drawerOpen = $state(false);
  let signingOut = $state(false);

  const panel: AdminPanel = $derived(
    page.params.panel === 'super-admin' ? 'super-admin' : 'admin',
  );
  const base = $derived(panelBase(panel));
  const panelTitle = $derived(panelLabel(panel));

  const navGroups: AdminNavGroup[] = $derived(
    adminNavFor(panel, (permission) => session.can(permission)),
  );
  const activeHref = $derived(activeAdminHref(panel, page.url.pathname));
  const crumbs = $derived(adminBreadcrumbs(panel, page.url.pathname));
  const roleLabel = $derived(session.isSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN');

  /** Panel yang boleh dibuka role saat ini — dinding penuh antar-role. */
  const authorized = $derived(
    !session.loading &&
      session.isAdmin &&
      (panel === 'super-admin') === session.isSuperAdmin,
  );
  const initials = $derived(
    (session.user?.fullName ?? '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join(''),
  );

  afterNavigate(() => {
    drawerOpen = false;
  });

  /**
   * Guard sisi klien. Otorisasi sebenarnya tetap di API; guard ini hanya
   * mencegah kilasan UI admin untuk pengguna yang tidak berhak.
   *
   * Dinding peran: peserta tidak pernah masuk panel, dan panel ADMIN hanya
   * untuk ADMIN sedangkan panel SUPER_ADMIN hanya untuk SUPER_ADMIN.
   */
  $effect(() => {
    if (session.loading) return;

    const target = page.url.pathname + page.url.search;
    /** Sisa path setelah basis panel, agar redirect mempertahankan halaman. */
    const rest = page.url.pathname.slice(base.length);

    if (!session.user) {
      void goto(`/login?redirect=${encodeURIComponent(target)}`, { replaceState: true });
      return;
    }

    if (!session.isAdmin) {
      void goto('/dashboard', { replaceState: true });
      return;
    }

    if (panel === 'super-admin' && !session.isSuperAdmin) {
      void goto(`/admin${rest}`, { replaceState: true });
      return;
    }

    if (panel === 'admin' && session.isSuperAdmin) {
      void goto(`/super-admin${rest}`, { replaceState: true });
    }
  });

  onMount(() => {
    void session.restore();
  });

  $effect(() => {
    if (!drawerOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') drawerOpen = false;
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  async function signOut() {
    if (signingOut) return;
    signingOut = true;
    try {
      await session.logout();
      await goto('/login');
    } finally {
      signingOut = false;
    }
  }
</script>

<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if !authorized}
  <div class="boot"><Spinner size={32} label="Memeriksa hak akses" /></div>
{:else}
  <a class="skip" href="#admin-content">Lewati ke konten</a>

  <div class="shell" class:shell--super={session.isSuperAdmin}>
    {#if drawerOpen}
      <button
        class="backdrop"
        type="button"
        aria-label="Tutup navigasi"
        onclick={() => (drawerOpen = false)}
      ></button>
    {/if}

    <!-- SIDEBAR (RuangAdmin White Background & Blue/Purple Top Header) -->
    <aside class="sidebar" class:sidebar--open={drawerOpen} aria-label="Navigasi admin">
      <div class="sidebar__top">
        <a class="brand" href={base} onclick={() => (drawerOpen = false)}>
          <img
            class="brand__mark"
            src="/logo-badge.png"
            alt=""
            width="38"
            height="38"
            aria-hidden="true"
          />
          <span class="brand__text">
            <span class="brand__name">TES CAT</span>
            <span class="brand__tag">{panelTitle}</span>
          </span>
        </a>

        <button
          class="sidebar__close"
          type="button"
          aria-label="Tutup navigasi"
          onclick={() => (drawerOpen = false)}
        >
          <AdminIcon name="close" size={20} />
        </button>
      </div>

      <nav class="nav" aria-label="Menu navigasi admin">
        {#each navGroups as group (group.label)}
          <p class="nav__label">{group.label}</p>
          <ul class="nav__list">
            {#each group.items as item (item.href)}
              <li>
                <a
                  class="nav__link"
                  class:nav__link--active={activeHref === item.href}
                  href={item.href}
                  aria-current={activeHref === item.href ? 'page' : undefined}
                  onclick={() => (drawerOpen = false)}
                >
                  <div class="nav__icon">
                    <AdminIcon name={item.icon} size={16} />
                  </div>
                  <span class="nav__label-text">{item.label}</span>
                  <span class="nav__chevron">›</span>
                </a>
              </li>
            {/each}
          </ul>
        {/each}
      </nav>

      <div class="sidebar__footer">
        <div class="footer-version">TES CAT v1.1 • RuangAdmin</div>
        <button class="side-action" type="button" disabled={signingOut} onclick={signOut}>
          <AdminIcon name="logout" size={15} />
          <span>{signingOut ? 'Keluar…' : 'Keluar Panel'}</span>
        </button>
      </div>
    </aside>

    <div class="main">
      <!-- TOPBAR (RuangAdmin Indigo Banner) -->
      <header class="topbar">
        <button
          class="menu"
          type="button"
          aria-label="Buka navigasi"
          aria-expanded={drawerOpen}
          onclick={() => (drawerOpen = true)}
        >
          <AdminIcon name="menu" size={20} />
        </button>

        <nav class="crumbs" aria-label="Breadcrumb">
          {#each crumbs as crumb, index (crumb.label)}
            {#if index > 0}
              <span class="crumb-sep">/</span>
            {/if}
            {#if crumb.href && index < crumbs.length - 1}
              <a href={crumb.href} class="crumb-link">{crumb.label}</a>
            {:else}
              <span aria-current="page" class="crumb-active">{crumb.label}</span>
            {/if}
          {/each}
        </nav>

        <div class="topbar__right">
          <button class="topbar-icon-btn" type="button" aria-label="Cari">
            <AdminIcon name="search" size={17} />
          </button>

          <NewSignupsBell />

          <div class="topbar-divider"></div>

          <!-- User profile with role badge in topbar -->
          <div class="topbar-account">
            <div class="avatar-wrap">
              <span class="account-avatar">{initials}</span>
              <span class="online-dot"></span>
            </div>
            <div class="account-info">
              <span class="account-name">{session.user?.fullName}</span>
              <span class="role-pill" class:role-pill--super={session.isSuperAdmin}>{roleLabel}</span>
            </div>
          </div>
        </div>
      </header>

      <main id="admin-content" class="content">
        {@render children()}
      </main>
    </div>
  </div>
{/if}

<style>
  .boot {
    display: grid;
    place-items: center;
    min-height: 80dvh;
  }

  .skip {
    position: absolute;
    left: var(--space-4);
    top: -100px;
    z-index: var(--z-toast);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    background: var(--color-primary, #4f46e5);
    color: #fff;
    font-size: var(--text-sm);
  }

  .skip:focus {
    top: var(--space-4);
  }

  /* LAYOUT SHELL */
  .shell {
    display: flex;
    min-height: 100dvh;
    background: #f8f9fc;
  }

  /* SIDEBAR (RuangAdmin White with Purple/Blue Header) */
  .sidebar {
    width: 260px;
    background: #ffffff;
    border-right: 1px solid #eaecf4;
    display: flex;
    flex-direction: column;
    z-index: 100;
    flex-shrink: 0;
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @media (max-width: 1023px) {
    .sidebar {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      transform: translateX(-100%);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    }

    .sidebar--open {
      transform: translateX(0);
    }
  }

  @media (min-width: 1024px) {
    .sidebar {
      position: sticky;
      top: 0;
      height: 100dvh;
    }
  }

  .sidebar__top {
    height: 70px;
    background: linear-gradient(135deg, var(--brand-950) 0%, var(--brand-900) 60%, #312e81 100%);
    padding: 0 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .shell--super .sidebar__top {
    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
  }

  .brand__mark {
    width: 38px;
    height: 38px;
    object-fit: contain;
    flex-shrink: 0;
    display: block;
  }

  .brand__text {
    display: flex;
    flex-direction: column;
  }

  .brand__name {
    color: #ffffff;
    font-size: 1.05rem;
    font-weight: 800;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }

  .brand__tag {
    color: rgba(255, 255, 255, 0.75);
    font-size: 10.5px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .sidebar__close {
    background: none;
    border: none;
    color: #ffffff;
    cursor: pointer;
    padding: 0.25rem;
  }

  @media (min-width: 1024px) {
    .sidebar__close {
      display: none;
    }
  }

  .nav {
    flex: 1;
    padding: 1.25rem 0.85rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .nav__label {
    font-size: 10.5px;
    font-weight: 800;
    color: #b7b9cc;
    letter-spacing: 0.08em;
    padding: 0.85rem 0.75rem 0.35rem;
    text-transform: uppercase;
    margin: 0;
  }

  .nav__list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .nav__link {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.65rem 0.85rem;
    border-radius: 8px;
    text-decoration: none;
    color: #6e707e;
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.15s ease;
  }

  .nav__link:hover {
    background: #f8f9fc;
    color: var(--color-primary, #4f46e5);
    text-decoration: none;
  }

  .nav__link--active {
    background: #f4f6fd;
    color: var(--color-primary, #4f46e5);
    font-weight: 750;
    border-left: 3px solid var(--color-primary, #4f46e5);
    border-radius: 0 8px 8px 0;
  }

  .shell--super .nav__link--active {
    background: #fbf7ff;
    color: #7c3aed;
    border-left-color: #7c3aed;
  }

  .nav__icon {
    display: grid;
    place-items: center;
    color: inherit;
  }

  .nav__label-text {
    flex: 1;
  }

  .nav__chevron {
    color: #b7b9cc;
    font-size: 1.15rem;
    font-weight: 700;
  }

  .nav__link--active .nav__chevron {
    color: var(--color-primary, #4f46e5);
  }

  .shell--super .nav__link--active .nav__chevron {
    color: #7c3aed;
  }

  .sidebar__footer {
    padding: 1rem 1rem 1.25rem;
    border-top: 1px solid #eaecf4;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .footer-version {
    font-size: 11px;
    color: #b7b9cc;
    text-align: center;
  }

  .side-action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.55rem;
    border: 1px solid #eaecf4;
    border-radius: 6px;
    background: #ffffff;
    color: #e74a3b;
    font-size: 12px;
    font-weight: 650;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .side-action:hover {
    background: #fff5f5;
    border-color: #feb2b2;
  }

  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(2px);
    z-index: 90;
    border: none;
    cursor: pointer;
  }

  @media (min-width: 1024px) {
    .backdrop {
      display: none;
    }
  }

  /* MAIN WRAPPER */
  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  /* TOPBAR (RuangAdmin Indigo Banner) */
  .topbar {
    height: 70px;
    background: linear-gradient(135deg, var(--brand-950) 0%, var(--brand-900) 60%, #312e81 100%);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;
    position: sticky;
    top: 0;
    z-index: 80;
  }

  .shell--super .topbar {
    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  }

  .menu {
    background: none;
    border: none;
    color: #ffffff;
    cursor: pointer;
    padding: 0.5rem;
    display: grid;
    place-items: center;
    border-radius: 6px;
  }

  @media (min-width: 1024px) {
    .menu {
      display: none;
    }
  }

  .crumbs {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.85);
  }

  .crumb-link {
    color: rgba(255, 255, 255, 0.9);
    text-decoration: none;
    font-weight: 600;
  }

  .crumb-link:hover {
    text-decoration: underline;
  }

  .crumb-sep {
    color: rgba(255, 255, 255, 0.5);
  }

  .crumb-active {
    color: #ffffff;
    font-weight: 750;
  }

  .topbar__right {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    margin-left: auto;
  }

  .topbar-icon-btn {
    position: relative;
    background: none;
    border: none;
    color: #ffffff;
    padding: 0.45rem;
    cursor: pointer;
    display: grid;
    place-items: center;
    border-radius: 6px;
    transition: background 0.15s ease;
  }

  .topbar-icon-btn:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .topbar-divider {
    width: 1px;
    height: 30px;
    background: rgba(255, 255, 255, 0.25);
    margin: 0 0.35rem;
  }

  .topbar-account {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    color: #ffffff;
  }

  .avatar-wrap {
    position: relative;
  }

  .account-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #ffffff;
    color: var(--color-primary, #4f46e5);
    font-size: 13px;
    font-weight: 850;
    display: grid;
    place-items: center;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }

  .shell--super .account-avatar {
    color: #6d28d9;
  }

  .online-dot {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #1cc88a;
    border: 2px solid var(--color-primary, #4f46e5);
  }

  .shell--super .online-dot {
    border-color: #6d28d9;
  }

  .account-info {
    display: flex;
    flex-direction: column;
  }

  .account-name {
    font-size: 0.85rem;
    font-weight: 700;
    color: #ffffff;
    white-space: nowrap;
    line-height: 1.2;
  }

  .role-pill {
    font-size: 9px;
    font-weight: 800;
    padding: 1px 5px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    align-self: flex-start;
  }

  .role-pill--super {
    background: #fef08a;
    color: #713f12;
  }

  @media (max-width: 600px) {
    .account-info {
      display: none;
    }
  }

  .content {
    flex: 1;
    padding: 1.75rem;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
  }
</style>
