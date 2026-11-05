<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { goto, afterNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import AdminIcon from '$lib/components/admin/AdminIcon.svelte';
  import { homePathFor } from '$lib/panel';
  import { session } from '$lib/stores/session.svelte';

  let { children }: { children: Snippet } = $props();

  let sidebarCollapsed = $state(false);
  let mobileDrawerOpen = $state(false);
  let userMenuOpen = $state(false);
  let notifMenuOpen = $state(false);
  let messageMenuOpen = $state(false);
  let signingOut = $state(false);

  const navPrimary = [
    { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' as const },
    { href: '/exam', label: 'Ujian CAT', icon: 'shield' as const, badge: 'B3' },
    { href: '/history', label: 'Riwayat Ujian', icon: 'list' as const },
    { href: '/dashboard#tryout', label: 'Simulasi CAT Ujian', icon: 'shield' as const, badge: 'Aktif' },
    { href: '/dashboard#latihan', label: 'Bank Soal Subtes', icon: 'questions' as const },
    { href: '/dashboard#riwayat', label: 'Riwayat & Nilai (MS/TMS)', icon: 'list' as const },
  ];

  const navBilling = [
    { href: '/subscription', label: 'Paket Langganan', icon: 'card' as const },
    { href: '/transactions', label: 'Riwayat Transaksi', icon: 'list' as const },
  ];

  const navAccount = [
    { href: '/profile', label: 'Profil Peserta', icon: 'profile' as const },
    { href: '/devices', label: 'Perangkat Aktif', icon: 'devices' as const },
  ];

  let currentPath = $derived(page.url.pathname);
  let currentHash = $derived(page.url.hash);

  const initials = $derived(
    (session.user?.fullName ?? 'P')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join(''),
  );

  afterNavigate(() => {
    mobileDrawerOpen = false;
    userMenuOpen = false;
    notifMenuOpen = false;
    messageMenuOpen = false;
  });

  onMount(() => {
    void (async () => {
      await session.restore();

      if (!session.user) {
        const target = page.url.pathname + page.url.search;
        await goto(`/login?redirect=${encodeURIComponent(target)}`);
      }
    })();
  });

  $effect(() => {
    if (session.loading || !session.user) return;

    if (session.isAdmin) {
      void goto(homePathFor(session.user.role), { replaceState: true });
    }
  });

  function toggleSidebar() {
    if (typeof window !== 'undefined' && window.innerWidth >= 900) {
      sidebarCollapsed = !sidebarCollapsed;
    } else {
      mobileDrawerOpen = !mobileDrawerOpen;
    }
  }

  function closeAllMenus() {
    userMenuOpen = false;
    notifMenuOpen = false;
    messageMenuOpen = false;
  }

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

<svelte:window onclick={closeAllMenus} />

{#if !session.user || session.isAdmin}
  <div class="loading"><Spinner size={32} label="Memeriksa status sesi" /></div>
{:else}
  <!-- Backdrop Mobile -->
  {#if mobileDrawerOpen}
    <button
      class="backdrop"
      type="button"
      aria-label="Tutup navigasi"
      onclick={() => (mobileDrawerOpen = false)}
    ></button>
  {/if}

  <div class="app-layout" class:app-layout--collapsed={sidebarCollapsed}>
    <!-- SIDEBAR (RuangAdmin Style: White bg, Purple/Blue header, section titles, chevron arrows) -->
    <aside
      class="sidebar"
      class:sidebar--open={mobileDrawerOpen}
      class:sidebar--collapsed={sidebarCollapsed}
      aria-label="Sidebar Navigasi"
    >
      <div class="sidebar__brand">
        <a class="brand-link" href="/dashboard" onclick={() => (mobileDrawerOpen = false)}>
          <div class="brand-icon">
            <span>RA</span>
          </div>
          {#if !sidebarCollapsed}
            <div class="brand-info">
              <span class="brand-title">Web CAT</span>
              <span class="brand-sub">Portal Peserta</span>
            </div>
          {/if}
        </a>

        <button
          class="sidebar__close"
          type="button"
          aria-label="Tutup navigasi"
          onclick={() => (mobileDrawerOpen = false)}
        >
          <AdminIcon name="close" size={20} />
        </button>
      </div>

      <nav class="sidebar__nav" aria-label="Menu navigasi">
        {#if !sidebarCollapsed}
          <div class="nav-heading">MENU UTAMA</div>
        {/if}
        {#each navPrimary as item (item.href)}
          {@const isActive = item.href.includes('#')
            ? currentPath === '/dashboard' && currentHash === item.href.slice(item.href.indexOf('#'))
            : currentPath === item.href && !currentHash}
          <a
            class="nav-link"
            class:nav-link--active={isActive}
            href={item.href}
            onclick={() => (mobileDrawerOpen = false)}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <div class="nav-link__icon">
              <AdminIcon name={item.icon} size={17} />
            </div>
            {#if !sidebarCollapsed}
              <span class="nav-link__label">{item.label}</span>
              {#if item.badge}
                <span class="nav-badge">{item.badge}</span>
              {:else}
                <span class="nav-link__arrow">›</span>
              {/if}
            {/if}
          </a>
        {/each}

        {#if !sidebarCollapsed}
          <div class="nav-heading">PAKET &amp; AKSES</div>
        {/if}
        {#each navBilling as item (item.href)}
          <a
            class="nav-link"
            class:nav-link--active={currentPath === item.href}
            href={item.href}
            onclick={() => (mobileDrawerOpen = false)}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <div class="nav-link__icon">
              <AdminIcon name={item.icon} size={17} />
            </div>
            {#if !sidebarCollapsed}
              <span class="nav-link__label">{item.label}</span>
              <span class="nav-link__arrow">›</span>
            {/if}
          </a>
        {/each}

        {#if !sidebarCollapsed}
          <div class="nav-heading">PENGATURAN AKUN</div>
        {/if}
        {#each navAccount as item (item.href)}
          <a
            class="nav-link"
            class:nav-link--active={currentPath === item.href}
            href={item.href}
            onclick={() => (mobileDrawerOpen = false)}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <div class="nav-link__icon">
              <AdminIcon name={item.icon} size={17} />
            </div>
            {#if !sidebarCollapsed}
              <span class="nav-link__label">{item.label}</span>
              <span class="nav-link__arrow">›</span>
            {/if}
          </a>
        {/each}
      </nav>

      <div class="sidebar__footer">
        {#if !sidebarCollapsed}
          <span class="version-tag">Web CAT v1.1 • RuangAdmin</span>
        {/if}
        <button
          class="btn-sidebar-logout"
          type="button"
          disabled={signingOut}
          onclick={signOut}
          title={sidebarCollapsed ? 'Keluar Akun' : undefined}
        >
          <AdminIcon name="logout" size={15} />
          {#if !sidebarCollapsed}
            <span>{signingOut ? 'Keluar…' : 'Keluar Akun'}</span>
          {/if}
        </button>
      </div>
    </aside>

    <!-- MAIN BODY -->
    <div class="main-wrapper">
      <!-- TOPBAR (RuangAdmin Style: Royal Blue / Indigo gradient banner with icons & profile) -->
      <header class="topbar">
        <div class="topbar__left">
          <button
            class="topbar-toggle"
            type="button"
            aria-label="Toggle navigasi sidebar"
            onclick={(e) => {
              e.stopPropagation();
              toggleSidebar();
            }}
          >
            <AdminIcon name="menu" size={20} />
          </button>
        </div>

        <div class="topbar__right">
          <!-- Notification Bell with Red Badge -->
          <div class="dropdown-wrapper">
            <button
              class="topbar-btn"
              type="button"
              aria-label="Notifikasi"
              onclick={(e) => {
                e.stopPropagation();
                notifMenuOpen = !notifMenuOpen;
                userMenuOpen = false;
                messageMenuOpen = false;
              }}
            >
              <AdminIcon name="bell" size={17} />
              <span class="badge-count badge-count--red">3</span>
            </button>

            {#if notifMenuOpen}
              <div
                class="dropdown-panel dropdown-panel--notif"
                onclick={(e) => e.stopPropagation()}
                role="region"
                aria-label="Daftar Notifikasi"
              >
                <div class="dropdown-header">
                  <span class="dropdown-title">Pemberitahuan Sistem</span>
                  <span class="badge-soft">3 Baru</span>
                </div>
                <div class="dropdown-list">
                  <div class="dropdown-item">
                    <div class="dropdown-item__dot dot--red"></div>
                    <div>
                      <div class="dropdown-item__text">Ambang Batas Kelulusan Minimal 61.00 untuk Psikologi Polri.</div>
                      <div class="dropdown-item__time">Hari ini • 09:00 WIB</div>
                    </div>
                  </div>
                  <div class="dropdown-item">
                    <div class="dropdown-item__dot dot--blue"></div>
                    <div>
                      <div class="dropdown-item__text">Simulasi Tryout Akbar #1 sudah dibuka untuk semua peserta aktif.</div>
                      <div class="dropdown-item__time">Kemarin • 14:30 WIB</div>
                    </div>
                  </div>
                  <div class="dropdown-item">
                    <div class="dropdown-item__dot dot--green"></div>
                    <div>
                      <div class="dropdown-item__text">Sistem auto-save per butir soal aktif dengan perlindungan anti-putus.</div>
                      <div class="dropdown-item__time">2 hari lalu</div>
                    </div>
                  </div>
                </div>
              </div>
            {/if}
          </div>

          <!-- Envelope with Orange Badge -->
          <div class="dropdown-wrapper">
            <button
              class="topbar-btn"
              type="button"
              aria-label="Pesan Masuk"
              onclick={(e) => {
                e.stopPropagation();
                messageMenuOpen = !messageMenuOpen;
                userMenuOpen = false;
                notifMenuOpen = false;
              }}
            >
              <AdminIcon name="envelope" size={17} />
              <span class="badge-count badge-count--orange">2</span>
            </button>

            {#if messageMenuOpen}
              <div
                class="dropdown-panel dropdown-panel--message"
                onclick={(e) => e.stopPropagation()}
                role="region"
                aria-label="Pesan Masuk"
              >
                <div class="dropdown-header">
                  <span class="dropdown-title">Pesan Panitia Seleksi</span>
                  <span class="badge-soft">2 Pesan</span>
                </div>
                <div class="dropdown-list">
                  <div class="dropdown-item">
                    <div class="dropdown-item__dot dot--orange"></div>
                    <div>
                      <div class="dropdown-item__title">Pengawas Ujian CAT</div>
                      <div class="dropdown-item__text">Pastikan koneksi stabil saat memulai subtes kecermatan 10 kolom.</div>
                      <div class="dropdown-item__time">30 menit lalu</div>
                    </div>
                  </div>
                  <div class="dropdown-item">
                    <div class="dropdown-item__dot dot--blue"></div>
                    <div>
                      <div class="dropdown-item__title">Tim Administrasi</div>
                      <div class="dropdown-item__text">Paket langganan Anda aktif. Gunakan kesempatan simulasi sebaik mungkin.</div>
                      <div class="dropdown-item__time">3 jam lalu</div>
                    </div>
                  </div>
                </div>
              </div>
            {/if}
          </div>

          <div class="topbar-divider"></div>

          <!-- User Profile Dropdown in Topbar (RuangAdmin "Maman Ketoprak" style) -->
          <div class="dropdown-wrapper">
            <button
              class="topbar-user-btn"
              type="button"
              aria-label="Menu Profil Pengguna"
              onclick={(e) => {
                e.stopPropagation();
                userMenuOpen = !userMenuOpen;
                notifMenuOpen = false;
                messageMenuOpen = false;
              }}
            >
              <div class="user-avatar-wrap">
                <span class="topbar-avatar">{initials}</span>
                <span class="online-indicator"></span>
              </div>
              <span class="topbar-username">{session.user.fullName}</span>
              <span class="topbar-caret">▾</span>
            </button>

            {#if userMenuOpen}
              <div
                class="dropdown-panel dropdown-panel--user"
                onclick={(e) => e.stopPropagation()}
                role="region"
                aria-label="Menu Pengguna"
              >
                <div class="user-dropdown-header">
                  <div class="user-dropdown-name">{session.user.fullName}</div>
                  <div class="user-dropdown-email">{session.user.email}</div>
                  <div class="user-dropdown-role">Peserta Ujian CAT • Aktif</div>
                </div>
                <div class="user-dropdown-nav">
                  <a href="/profile" class="user-nav-link" onclick={() => (userMenuOpen = false)}>
                    <AdminIcon name="profile" size={15} />
                    <span>Profil Peserta</span>
                  </a>
                  <a href="/subscription" class="user-nav-link" onclick={() => (userMenuOpen = false)}>
                    <AdminIcon name="card" size={15} />
                    <span>Paket Langganan</span>
                  </a>
                  <a href="/devices" class="user-nav-link" onclick={() => (userMenuOpen = false)}>
                    <AdminIcon name="devices" size={15} />
                    <span>Perangkat Aktif</span>
                  </a>
                  <div class="dropdown-divider"></div>
                  <button type="button" class="user-nav-logout" onclick={signOut} disabled={signingOut}>
                    <AdminIcon name="logout" size={15} />
                    <span>{signingOut ? 'Keluar…' : 'Keluar Akun'}</span>
                  </button>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </header>

      <!-- CONTENT BODY -->
      <main class="page-content">
        {@render children()}
      </main>
    </div>
  </div>
{/if}

<style>
  .loading {
    display: grid;
    place-items: center;
    min-height: 80dvh;
  }

  /* LAYOUT SHELL */
  .app-layout {
    display: flex;
    min-height: 100vh;
    min-height: 100dvh;
    background: #f8f9fc;
    font-family: inherit;
    overflow-x: clip;
  }

  /* BACKDROP */
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(2px);
    z-index: 90;
    border: none;
    cursor: pointer;
  }

  @media (min-width: 900px) {
    .backdrop {
      display: none;
    }
  }

  /* SIDEBAR (RuangAdmin Pure White with Blue Brand Header) */
  .sidebar {
    width: clamp(15rem, 24vw, 17.5rem);
    background: #ffffff;
    border-right: 1px solid #eaecf4;
    display: flex;
    flex-direction: column;
    z-index: 100;
    flex-shrink: 0;
    transition: width 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @media (max-width: 899px) {
    .sidebar {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      width: min(86vw, 20rem);
      height: 100vh;
      height: 100dvh;
      overflow-y: auto;
      padding-bottom: env(safe-area-inset-bottom);
      transform: translateX(-100%);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    }

    .sidebar--open {
      transform: translateX(0);
    }
  }

  @media (min-width: 900px) {
    .sidebar {
      position: sticky;
      top: 0;
      height: 100dvh;
    }

    .sidebar--collapsed {
      width: 72px;
    }

    .sidebar--collapsed .nav-link {
      justify-content: center;
      padding: 0.85rem 0.5rem;
    }

    .sidebar--collapsed .sidebar__brand {
      padding: 0;
      justify-content: center;
    }

    .sidebar--collapsed .btn-sidebar-logout {
      padding: 0.65rem 0;
      justify-content: center;
    }
  }

  .sidebar__brand {
    min-height: clamp(3.25rem, 8.5dvh, 4.5rem);
    background: #4e73df;
    padding: 0 clamp(0.85rem, 2.5vw, 1.25rem);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .brand-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
  }

  .brand-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: #ffffff;
    display: grid;
    place-items: center;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  .brand-icon span {
    font-size: 1.15rem;
    font-weight: 900;
    color: #4e73df;
    letter-spacing: -0.04em;
  }

  .brand-info {
    display: flex;
    flex-direction: column;
    color: #ffffff;
  }

  .brand-title {
    font-size: 1.05rem;
    font-weight: 850;
    line-height: 1.15;
    letter-spacing: -0.02em;
  }

  .brand-sub {
    font-size: 10.5px;
    font-weight: 500;
    opacity: 0.9;
  }

  .sidebar__close {
    background: none;
    border: none;
    color: #ffffff;
    cursor: pointer;
    padding: 0.25rem;
    display: grid;
    place-items: center;
  }

  @media (min-width: 900px) {
    .sidebar__close {
      display: none;
    }
  }

  .sidebar__nav {
    flex: 1;
    padding: 1.25rem 0.85rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .nav-heading {
    font-size: 10.5px;
    font-weight: 800;
    color: #b7b9cc;
    letter-spacing: 0.08em;
    padding: 0.85rem 0.75rem 0.35rem;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.7rem 0.85rem;
    border-radius: 8px;
    text-decoration: none;
    color: #6e707e;
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.15s ease;
  }

  .nav-link:hover {
    background: #f8f9fc;
    color: #4e73df;
    text-decoration: none;
  }

  .nav-link--active {
    background: #f4f6fd;
    color: #4e73df;
    font-weight: 750;
    border-left: 3px solid #4e73df;
    border-radius: 0 8px 8px 0;
  }

  .nav-link__icon {
    color: inherit;
    display: grid;
    place-items: center;
  }

  .nav-link__label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nav-link__arrow {
    color: #b7b9cc;
    font-size: 1.15rem;
    font-weight: 700;
  }

  .nav-link--active .nav-link__arrow {
    color: #4e73df;
  }

  .nav-badge {
    font-size: 10px;
    font-weight: 800;
    background: #1cc88a;
    color: #ffffff;
    padding: 1px 6px;
    border-radius: 999px;
    text-transform: uppercase;
  }

  .sidebar__footer {
    padding: 1rem 0.85rem 1.25rem;
    border-top: 1px solid #eaecf4;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .version-tag {
    font-size: 11px;
    color: #b7b9cc;
    text-align: center;
  }

  .btn-sidebar-logout {
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

  .btn-sidebar-logout:hover {
    background: #fff5f5;
    border-color: #feb2b2;
  }

  /* MAIN WRAPPER */
  .main-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow-x: clip;
  }

  /* TOPBAR (RuangAdmin Indigo Banner) */
  .topbar {
    min-height: clamp(3.25rem, 8.5dvh, 4.5rem);
    background: #4e73df;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 clamp(0.75rem, 2.5vw, 1.5rem);
    position: sticky;
    top: 0;
    z-index: 80;
  }

  .topbar-toggle {
    background: none;
    border: none;
    color: #ffffff;
    cursor: pointer;
    padding: 0.5rem;
    display: grid;
    place-items: center;
    border-radius: 6px;
    transition: background 0.15s ease;
  }

  .topbar-toggle:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .topbar__right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .dropdown-wrapper {
    position: relative;
  }

  .topbar-btn {
    position: relative;
    background: none;
    border: none;
    color: #ffffff;
    padding: 0.5rem;
    cursor: pointer;
    display: grid;
    place-items: center;
    border-radius: 6px;
    transition: background 0.15s ease;
  }

  .topbar-btn:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .badge-count {
    position: absolute;
    top: -2px;
    right: -2px;
    font-size: 9.5px;
    font-weight: 850;
    color: #ffffff;
    padding: 1px 4.5px;
    border-radius: 999px;
    line-height: 1.2;
    border: 1.5px solid #4e73df;
  }

  .badge-count--red { background: #e74a3b; }
  .badge-count--orange { background: #f6c23e; }

  .topbar-divider {
    width: 1px;
    height: 30px;
    background: rgba(255, 255, 255, 0.25);
    margin: 0 0.25rem;
  }

  /* RuangAdmin Profile Button in Topbar */
  .topbar-user-btn {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    color: #ffffff;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.35rem 0.6rem;
    border-radius: 8px;
    transition: background 0.15s ease;
  }

  .topbar-user-btn:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .user-avatar-wrap {
    position: relative;
  }

  .topbar-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #ffffff;
    color: #4e73df;
    font-size: 13px;
    font-weight: 850;
    display: grid;
    place-items: center;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }

  .online-indicator {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #1cc88a;
    border: 2px solid #4e73df;
  }

  .topbar-username {
    font-size: 0.875rem;
    font-weight: 700;
    color: #ffffff;
    white-space: nowrap;
  }

  .topbar-caret {
    font-size: 0.75rem;
    opacity: 0.8;
  }

  @media (max-width: 600px) {
    .topbar-username {
      display: none;
    }
  }

  /* DROPDOWN PANELS */
  .dropdown-panel {
    position: absolute;
    top: calc(100% + 0.6rem);
    right: 0;
    max-height: calc(100dvh - 5.5rem);
    background: #ffffff;
    border: 1px solid #e3e6f0;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    z-index: 120;
    animation: fadeIn 0.15s ease;
    overflow: hidden;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .dropdown-panel--notif,
  .dropdown-panel--message {
    width: min(92vw, 330px);
  }

  .dropdown-panel--user {
    width: min(88vw, 250px);
  }

  .dropdown-header {
    background: #4e73df;
    color: #ffffff;
    padding: 0.85rem 1rem;
    border-radius: 7px 7px 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .dropdown-title {
    font-size: 12.5px;
    font-weight: 750;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .badge-soft {
    font-size: 10px;
    font-weight: 750;
    background: rgba(255, 255, 255, 0.25);
    padding: 2px 7px;
    border-radius: 999px;
  }

  .dropdown-list {
    max-height: min(42dvh, 17.5rem);
    overflow-y: auto;
  }

  .dropdown-item {
    display: flex;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    border-bottom: 1px solid #f1f3f9;
    font-size: 12.5px;
    color: #4a5568;
  }

  .dropdown-item:last-child {
    border-bottom: none;
  }

  .dropdown-item__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-top: 5px;
    flex-shrink: 0;
  }

  .dot--red { background: #e74a3b; }
  .dot--blue { background: #4e73df; }
  .dot--green { background: #1cc88a; }
  .dot--orange { background: #f6c23e; }

  .dropdown-item__title {
    font-weight: 750;
    color: #2d3748;
    margin-bottom: 2px;
  }

  .dropdown-item__text {
    line-height: 1.4;
  }

  .dropdown-item__time {
    font-size: 10.5px;
    color: #a0aec0;
    margin-top: 3px;
  }

  .user-dropdown-header {
    padding: 1rem;
    border-bottom: 1px solid #e3e6f0;
    background: #f8f9fc;
    border-radius: 7px 7px 0 0;
  }

  .user-dropdown-name {
    font-size: 14px;
    font-weight: 750;
    color: #2e384d;
  }

  .user-dropdown-email {
    font-size: 11.5px;
    color: #718096;
    margin-top: 1px;
  }

  .user-dropdown-role {
    font-size: 10.5px;
    font-weight: 700;
    color: #1cc88a;
    margin-top: 4px;
  }

  .user-dropdown-nav {
    padding: 0.5rem 0;
  }

  .user-nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 1rem;
    color: #4a5568;
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
    transition: background 0.15s ease;
  }

  .user-nav-link:hover {
    background: #f4f6fd;
    color: #4e73df;
  }

  .dropdown-divider {
    height: 1px;
    background: #e3e6f0;
    margin: 0.35rem 0;
  }

  .user-nav-logout {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 1rem;
    color: #e74a3b;
    background: none;
    border: none;
    font-size: 13px;
    font-weight: 650;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s ease;
  }

  .user-nav-logout:hover {
    background: #fff5f5;
  }

  /* PAGE CONTENT */
  .page-content {
    flex: 1;
    padding: clamp(0.85rem, 3.5vw, 1.75rem);
    max-width: 1350px;
    width: 100%;
    margin: 0 auto;
    overflow-x: clip;
  }

  @media (max-width: 640px) {
    .page-content {
      padding: clamp(0.65rem, 2.5vw, 1rem);
      padding-bottom: max(1rem, env(safe-area-inset-bottom));
    }

    .topbar {
      padding: 0 clamp(0.6rem, 2.5vw, 0.85rem);
    }

    .topbar__right {
      gap: 0.35rem;
    }

    .dropdown-panel--notif,
    .dropdown-panel--message,
    .dropdown-panel--user {
      width: min(92vw, 330px);
    }
  }
</style>