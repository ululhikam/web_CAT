<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import AdminIcon from '$lib/components/admin/AdminIcon.svelte';
  import { apiErrorMessage, apiRequest } from '$lib/api/client';
  import { adminNavFor } from '$lib/admin-nav';
  import { panelBase, panelLabel, type AdminPanel } from '$lib/panel';
  import { session } from '$lib/stores/session.svelte';
  import { formatDate, formatDateTime } from '$lib/format';
  import type {
    AdminUserSummary,
    AuditLogItem,
    CursorPage,
    QuestionStatsResponse,
  } from '@webcat/contracts';

  const STATS_CACHE_KEY = 'webcat_admin_stats_cache';

  function readCachedStats(): QuestionStatsResponse | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(STATS_CACHE_KEY);
      return raw ? (JSON.parse(raw) as QuestionStatsResponse) : null;
    } catch {
      return null;
    }
  }

  const initialStats = readCachedStats();
  let stats = $state<QuestionStatsResponse | null>(initialStats);
  let recentUsers = $state<AdminUserSummary[]>([]);
  let recentAudit = $state<AuditLogItem[]>([]);
  let loading = $state(!initialStats);
  let error = $state<string | null>(null);

  const panel: AdminPanel = $derived(
    page.params.panel === 'super-admin' ? 'super-admin' : 'admin',
  );
  const base = $derived(panelBase(panel));
  const panelTitle = $derived(panelLabel(panel));

  const roleLabel = $derived(session.isSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN');
  const firstName = $derived(session.user?.fullName?.split(' ')[0] ?? 'Admin');
  const shortcutGroups = $derived(
    adminNavFor(panel, (permission) => session.can(permission))
      .flatMap((group) => group.items)
      .filter((item) => item.path !== ''),
  );

  const publishedTotal = $derived(stats?.totals.published ?? 0);
  const requiredTotal = $derived(stats?.totals.required ?? 0);
  const readySubtests = $derived(stats?.totals.readySubtests ?? 0);
  const totalSubtests = $derived(stats?.totals.totalSubtests ?? 0);

  onMount(() => {
    void load();
  });

  async function load() {
    if (!stats) loading = true;
    error = null;

    if (!session.accessToken) {
      try {
        await session.restore();
      } catch {
        // Handled by layout guard
      }
    }

    const token = session.accessToken;
    const jobs: Promise<void>[] = [];

    if (session.can('questions.read')) {
      jobs.push(
        apiRequest<QuestionStatsResponse>('/admin/questions/stats', {
          token,
          cacheTtlMs: 15000,
        }).then((result) => {
          stats = result;
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(STATS_CACHE_KEY, JSON.stringify(result));
          }
        }),
      );
    }

    if (session.can('users.read')) {
      jobs.push(
        apiRequest<CursorPage<AdminUserSummary>>('/admin/users?limit=6', {
          token,
          cacheTtlMs: 15000,
        }).then((result) => {
          recentUsers = result.items;
        }),
      );
    }

    if (session.can('audit.read')) {
      jobs.push(
        apiRequest<CursorPage<AuditLogItem>>('/admin/audit-logs?limit=5', {
          token,
          cacheTtlMs: 15000,
        }).then((result) => {
          recentAudit = result.items;
        }),
      );
    }

    const results = await Promise.allSettled(jobs);
    const failure = results.find((result) => result.status === 'rejected');
    if (failure?.status === 'rejected' && !stats) {
      error = apiErrorMessage(failure.reason);
    }

    loading = false;
  }
</script>

<svelte:head>
  <title>Dashboard — {panelTitle} TES CAT</title>
</svelte:head>

<div class="adm-dashboard">
  <!-- PAGE HEADER & BREADCRUMB (RuangAdmin Exact Style) -->
  <div class="page-top-bar">
    <div class="page-top-left">
      <h1 class="page-main-title">Dashboard {panelTitle}</h1>
      <p class="page-sub-title">Selamat datang kembali, {firstName}! Pantau statistik seleksi CAT.</p>
    </div>
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <a href={base} class="crumb-link">Home</a>
      <span class="crumb-sep">/</span>
      <span class="crumb-current">{panelTitle}</span>
    </nav>
  </div>

  {#if error}
    <Alert tone="danger" title="Sebagian data gagal dimuat">{error}</Alert>
  {/if}

  <!-- ROLE BANNER (RuangAdmin Notification Pill) -->
  {#if session.isSuperAdmin}
    <div class="role-banner role-banner--super">
      <div class="banner-icon"><AdminIcon name="shield" size={24} /></div>
      <div class="banner-body">
        <strong>Akses Sistem Penuh: SUPER_ADMINISTRATOR</strong>
        <p>Anda memiliki hak akses tertinggi untuk konfigurasi platform, audit log, manajemen staf admin, dan paket langganan.</p>
      </div>
      <span class="banner-pill banner-pill--super">ROOT PRIVILEGES</span>
    </div>
  {:else}
    <div class="role-banner role-banner--admin">
      <div class="banner-icon"><AdminIcon name="shield" size={24} /></div>
      <div class="banner-body">
        <strong>Akses Operasional: ADMINISTRATOR CAT</strong>
        <p>Fokus operasional harian: kurasi bank soal, import berkas, verifikasi data peserta, dan aktivasi paket ujian.</p>
      </div>
      <span class="banner-pill banner-pill--admin">OPERATIONAL</span>
    </div>
  {/if}

  <!-- QUICK ACTION BUTTONS -->
  <div class="action-bar">
    {#if session.can('users.create')}
      <Button href={`${base}/users/new`}>+ Tambah Pengguna</Button>
    {/if}
    {#if session.can('questions.write')}
      <Button variant="secondary" href={`${base}/questions/new`}>+ Soal Baru</Button>
    {/if}
    {#if session.can('questions.import')}
      <Button variant="ghost" href={`${base}/questions/import`}>Impor Dokumen Soal</Button>
    {/if}
  </div>

  {#if loading}
    <div class="loading-wrap"><Spinner size={32} label="Memuat ringkasan data" /></div>
  {:else}
    <!-- 4 STAT CARDS (RuangAdmin 4-Column Grid) -->
    <section class="stat-grid" aria-label="Statistik Utama">
      <!-- Card 1: Soal Terbit (Blue Calendar) -->
      <div class="stat-card">
        <div class="stat-card__left">
          <span class="stat-label">BANK SOAL TERBIT</span>
          <div class="stat-value">{publishedTotal.toLocaleString('id-ID')}</div>
          <div class="stat-trend stat-trend--up">
            <span>↑ {requiredTotal > 0 ? Math.round((publishedTotal / requiredTotal) * 100) : 100}%</span>
            <span class="trend-text">dari {requiredTotal} butir soal</span>
          </div>
        </div>
        <div class="stat-card__right stat-icon--blue">
          <AdminIcon name="questions" size={26} />
        </div>
      </div>

      <!-- Card 2: Subtes Siap (Green Clock) -->
      <div class="stat-card">
        <div class="stat-card__left">
          <span class="stat-label">SUBTES SIAP</span>
          <div class="stat-value">{readySubtests} / {totalSubtests}</div>
          <div class="stat-trend stat-trend--up">
            <span>↑ Siap Digunakan</span>
            <span class="trend-text">Kecukupan kuota</span>
          </div>
        </div>
        <div class="stat-card__right stat-icon--green">
          <AdminIcon name="check" size={26} />
        </div>
      </div>

      <!-- Card 3: Total Pengguna Baru (Cyan Users) -->
      <div class="stat-card">
        <div class="stat-card__left">
          <span class="stat-label">PENGGUNA TERBARU</span>
          <div class="stat-value">{recentUsers.length}</div>
          <div class="stat-trend stat-trend--up">
            <span>↑ Aktif Terdaftar</span>
            <span class="trend-text">Akun peserta & admin</span>
          </div>
        </div>
        <div class="stat-card__right stat-icon--cyan">
          <AdminIcon name="users" size={26} />
        </div>
      </div>

      <!-- Card 4: Status Otorisasi (Orange Shield) -->
      <div class="stat-card">
        <div class="stat-card__left">
          <span class="stat-label">OTORISASI ROLE</span>
          <div class="stat-value stat-value--role">{roleLabel}</div>
          <div class="stat-trend stat-trend--neutral">
            <span>Sesi Terenkripsi</span>
            <span class="trend-text">{session.isSuperAdmin ? 'Full control' : 'Staff level'}</span>
          </div>
        </div>
        <div class="stat-card__right stat-icon--orange">
          <AdminIcon name="shield" size={26} />
        </div>
      </div>
    </section>

    <!-- MAIN 2-COLUMN SECTION: Chart & Question Coverage (70% / 30%) -->
    <div class="content-row">
      <!-- LEFT: Monthly Recap Report (Chart Area) -->
      <div class="card-box">
        <div class="card-box__header">
          <h2 class="card-box__title">Aktivitas TES CAT & Bank Soal</h2>
          <button class="btn-more-dots" type="button" aria-label="Opsi">⋮</button>
        </div>

        <div class="chart-container">
          <svg viewBox="0 0 650 280" class="chart-svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="adminChartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#4e73df" stop-opacity="0.4" />
                <stop offset="100%" stop-color="#4e73df" stop-opacity="0.02" />
              </linearGradient>
            </defs>

            <!-- Horizontal Grid Lines -->
            <line x1="50" y1="40" x2="620" y2="40" stroke="#eaecf4" stroke-dasharray="3,3" />
            <line x1="50" y1="95" x2="620" y2="95" stroke="#eaecf4" stroke-dasharray="3,3" />
            <line x1="50" y1="150" x2="620" y2="150" stroke="#eaecf4" stroke-dasharray="3,3" />
            <line x1="50" y1="205" x2="620" y2="205" stroke="#eaecf4" stroke-dasharray="3,3" />
            <line x1="50" y1="250" x2="620" y2="250" stroke="#eaecf4" />

            <!-- Y-Axis Labels -->
            <text x="40" y="45" class="axis-label" text-anchor="end">1.200</text>
            <text x="40" y="100" class="axis-label" text-anchor="end">900</text>
            <text x="40" y="155" class="axis-label" text-anchor="end">600</text>
            <text x="40" y="210" class="axis-label" text-anchor="end">300</text>
            <text x="40" y="254" class="axis-label" text-anchor="end">0</text>

            <!-- Target line at 1.090 -->
            <line x1="50" y1="58" x2="620" y2="58" stroke="#1cc88a" stroke-dasharray="4,4" stroke-width="1.5" />
            <text x="615" y="52" class="target-label" text-anchor="end">Kebutuhan Kuota: 1.090</text>

            <!-- Chart Fill Area -->
            <path
              d="M 60 220
                 C 120 200, 150 170, 200 175
                 C 250 180, 270 140, 320 130
                 C 370 120, 390 100, 440 90
                 C 490 80, 520 65, 580 58
                 L 580 250 L 60 250 Z"
              fill="url(#adminChartGrad)"
            />

            <!-- Chart Line -->
            <path
              d="M 60 220
                 C 120 200, 150 170, 200 175
                 C 250 180, 270 140, 320 130
                 C 370 120, 390 100, 440 90
                 C 490 80, 520 65, 580 58"
              fill="none"
              stroke="#4e73df"
              stroke-width="3.5"
              stroke-linecap="round"
            />

            <!-- Dot markers -->
            <circle cx="60" cy="220" r="4.5" fill="#4e73df" stroke="#ffffff" stroke-width="2" />
            <circle cx="200" cy="175" r="4.5" fill="#4e73df" stroke="#ffffff" stroke-width="2" />
            <circle cx="320" cy="130" r="4.5" fill="#4e73df" stroke="#ffffff" stroke-width="2" />
            <circle cx="440" cy="90" r="4.5" fill="#4e73df" stroke="#ffffff" stroke-width="2" />
            <circle cx="580" cy="58" r="5" fill="#1cc88a" stroke="#ffffff" stroke-width="2" />

            <!-- X-Axis Labels -->
            <text x="60" y="270" class="axis-label" text-anchor="middle">Tahap 1</text>
            <text x="200" y="270" class="axis-label" text-anchor="middle">Tahap 2</text>
            <text x="320" y="270" class="axis-label" text-anchor="middle">Tahap 3</text>
            <text x="440" y="270" class="axis-label" text-anchor="middle">Tahap 4</text>
            <text x="580" y="270" class="axis-label" text-anchor="middle">Saat Ini</text>
          </svg>
        </div>
      </div>

      <!-- RIGHT: Question Coverage Per Subtest (Progress Bars) -->
      <div class="card-box">
        <div class="card-box__header">
          <h2 class="card-box__title">Kecukupan Bank Soal</h2>
          <a href={`${base}/questions`} class="btn-filter-pill">Kelola Soal &gt;</a>
        </div>

        <div class="progress-list">
          {#if !stats || stats.items.length === 0}
            <p class="empty-text">Statistik kecukupan belum tersedia.</p>
          {:else}
            {#each stats.items as item (item.subtestCode)}
              <div class="progress-item">
                <div class="progress-item__header">
                  <span class="progress-item__name">{item.subtestName}</span>
                  <span class="progress-item__count">{item.published} of {item.required} Soal</span>
                </div>
                <div class="progress-track">
                  <div
                    class="progress-fill"
                    class:progress-fill--ready={item.ready}
                    style="width: {item.required ? Math.min(100, (item.published / item.required) * 100) : 100}%;"
                  ></div>
                </div>
              </div>
            {/each}
          {/if}
        </div>

        <div class="card-box__footer">
          <a href={`${base}/questions`} class="link-view-more">Buka Seluruh Bank Soal &gt;</a>
        </div>
      </div>
    </div>

    <!-- BOTTOM 2-COLUMN SECTION: Recent Users & Shortcuts/Audit -->
    <div class="content-row">
      <!-- LEFT: Recent Users Table (RuangAdmin Style) -->
      <div class="card-box card-box--table">
        <div class="card-box__header">
          <h2 class="card-box__title">Pengguna & Peserta Terbaru</h2>
          {#if session.can('users.create')}
            <a href={`${base}/users/new`} class="btn-action-red">+ Pengguna Baru</a>
          {/if}
        </div>

        {#if recentUsers.length === 0}
          <div class="table-empty">Belum ada data pengguna yang terdaftar.</div>
        {:else}
          <div class="table-responsive">
            <table class="ruang-table">
              <thead>
                <tr>
                  <th>Nama / Email</th>
                  <th>Peran</th>
                  <th>Status</th>
                  <th>Langganan</th>
                  <th>Tanggal Dibuat</th>
                </tr>
              </thead>
              <tbody>
                {#each recentUsers as user (user.id)}
                  <tr>
                    <td>
                      <div class="user-row-name">{user.fullName}</div>
                      <div class="user-row-email">{user.email}</div>
                    </td>
                    <td>
                      <Badge tone={user.role === 'USER' ? 'neutral' : 'brand'}>{user.role}</Badge>
                    </td>
                    <td>
                      <Badge
                        tone={user.status === 'ACTIVE'
                          ? 'success'
                          : user.status === 'PENDING_INVITE'
                            ? 'warning'
                            : 'danger'}
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td>
                      {#if user.subscription?.status === 'ACTIVE'}
                        <span class="badge-sub-active">Aktif ({user.subscription.remainingDays} hari)</span>
                      {:else}
                        <span class="badge-sub-inactive">Tidak Aktif</span>
                      {/if}
                    </td>
                    <td class="col-date">{formatDate(user.createdAt)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>

      <!-- RIGHT: Shortcuts & Audit Log (Notice / List Style) -->
      <div class="card-box">
        <div class="notice-header" class:notice-header--super={session.isSuperAdmin}>
          <h2 class="notice-title">
            {session.isSuperAdmin ? 'Audit Log Terbaru' : 'Pintasan Operasional'}
          </h2>
        </div>

        {#if session.isSuperAdmin}
          {#if recentAudit.length === 0}
            <div class="empty-text">Belum ada catatan audit log.</div>
          {:else}
            <div class="audit-list">
              {#each recentAudit as item (item.id)}
                <div class="audit-item">
                  <div class="audit-avatar"><AdminIcon name="audit" size={18} /></div>
                  <div class="audit-body">
                    <div class="audit-top">
                      <strong class="audit-action">{item.action}</strong>
                      <span class="audit-time">{formatDateTime(item.createdAt)}</span>
                    </div>
                    <span class="audit-meta">{item.actorEmail ?? 'Sistem'} • {item.entityType}</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {:else}
          <div class="shortcut-list">
            {#each shortcutGroups as item (item.href)}
              <a href={item.href} class="shortcut-item">
                <div class="shortcut-icon">
                  <AdminIcon name={item.icon} size={16} />
                </div>
                <div class="shortcut-text">
                  <span class="shortcut-label">{item.label}</span>
                  <span class="shortcut-desc">{item.description}</span>
                </div>
                <span class="shortcut-arrow">›</span>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .adm-dashboard {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* PAGE TOP BAR (RuangAdmin Exact Layout) */
  .page-top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .page-main-title {
    font-size: 1.65rem;
    font-weight: 750;
    color: #2c3e50;
    margin: 0 0 0.25rem;
    letter-spacing: -0.02em;
  }

  .page-sub-title {
    font-size: 0.85rem;
    color: #858796;
    margin: 0;
  }

  .breadcrumb-nav {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .crumb-link {
    color: #4e73df;
    text-decoration: none;
  }

  .crumb-link:hover {
    text-decoration: underline;
  }

  .crumb-sep {
    color: #b7b9cc;
  }

  .crumb-current {
    color: #858796;
  }

  /* ROLE BANNER */
  .role-banner {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    border-radius: 0.75rem;
    box-shadow: 0 0.15rem 1rem rgba(0, 0, 0, 0.04);
  }

  .role-banner--super {
    background: #fdf4ff;
    border: 1px solid #f0abfc;
    color: #701a75;
  }

  .role-banner--admin {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1e40af;
  }

  .banner-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .banner-body {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .banner-body strong {
    font-size: 0.95rem;
    margin-bottom: 0.15rem;
  }

  .banner-body p {
    font-size: 12px;
    margin: 0;
    opacity: 0.85;
    line-height: 1.45;
  }

  .banner-pill {
    font-size: 10px;
    font-weight: 850;
    padding: 3px 8px;
    border-radius: 999px;
    white-space: nowrap;
  }

  .banner-pill--super {
    background: #a21caf;
    color: #ffffff;
  }

  .banner-pill--admin {
    background: #2563eb;
    color: #ffffff;
  }

  /* ACTION BAR */
  .action-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .loading-wrap {
    display: grid;
    place-items: center;
    min-height: 40dvh;
  }

  /* STAT GRID: 4 COLUMNS */
  .stat-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 600px) {
    .stat-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1080px) {
    .stat-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .stat-card {
    background: #ffffff;
    border-radius: 0.75rem;
    padding: 1.5rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.08);
    border: 1px solid #eaecf4;
  }

  .stat-card__left {
    display: flex;
    flex-direction: column;
  }

  .stat-label {
    font-size: 11px;
    font-weight: 800;
    color: #4e73df;
    letter-spacing: 0.05em;
    margin-bottom: 0.35rem;
    text-transform: uppercase;
  }

  .stat-value {
    font-size: 1.45rem;
    font-weight: 800;
    color: #2c3e50;
    line-height: 1.2;
    margin-bottom: 0.35rem;
  }

  .stat-value--role {
    font-size: 1.15rem;
    color: #4e73df;
  }

  .stat-trend {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 11.5px;
    font-weight: 700;
  }

  .stat-trend--up {
    color: #1cc88a;
  }

  .stat-trend--neutral {
    color: #4e73df;
  }

  .trend-text {
    color: #858796;
    font-weight: 500;
  }

  .stat-card__right {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .stat-icon--blue { background: #eaecf4; color: #4e73df; }
  .stat-icon--green { background: #e8f8f2; color: #1cc88a; }
  .stat-icon--cyan { background: #e4f7f9; color: #36b9cc; }
  .stat-icon--orange { background: #fdf5e6; color: #f6c23e; }

  /* CONTENT ROW: 2-COLUMN (70% and 30%) */
  .content-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 980px) {
    .content-row {
      grid-template-columns: minmax(0, 1.9fr) minmax(0, 1fr);
    }
  }

  /* CARD BOX GENERAL */
  .card-box {
    background: #ffffff;
    border: 1px solid #eaecf4;
    border-radius: 0.75rem;
    box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.08);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .card-box__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.15rem 1.5rem;
    border-bottom: 1px solid #eaecf4;
  }

  .card-box__title {
    font-size: 1.05rem;
    font-weight: 750;
    color: #4e73df;
    margin: 0;
  }

  .btn-more-dots {
    background: none;
    border: none;
    color: #b7b9cc;
    font-size: 1.25rem;
    cursor: pointer;
    line-height: 1;
  }

  .btn-filter-pill {
    font-size: 11.5px;
    font-weight: 700;
    padding: 0.3rem 0.75rem;
    background: #4e73df;
    color: #ffffff;
    border-radius: 6px;
    text-decoration: none;
  }

  /* CHART STYLES */
  .chart-container {
    padding: 1.25rem 1.5rem 1rem;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .chart-svg {
    width: 100%;
    height: 250px;
  }

  .axis-label {
    font-size: 10px;
    fill: #858796;
    font-family: inherit;
  }

  .target-label {
    font-size: 9.5px;
    font-weight: 700;
    fill: #1cc88a;
    font-family: inherit;
  }

  /* PROGRESS LIST */
  .progress-list {
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    flex: 1;
  }

  .progress-item__header {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-bottom: 0.4rem;
  }

  .progress-item__name {
    color: #5a5c69;
    font-weight: 650;
  }

  .progress-item__count {
    color: #858796;
    font-weight: 600;
    font-size: 11px;
  }

  .progress-track {
    height: 10px;
    background: #eaecf4;
    border-radius: 999px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 999px;
    background-color: #f6c23e;
    transition: width 0.4s ease;
  }

  .progress-fill--ready {
    background-color: #1cc88a;
  }

  .card-box__footer {
    padding: 0.95rem 1.5rem;
    border-top: 1px solid #eaecf4;
    text-align: center;
  }

  .link-view-more {
    font-size: 12px;
    font-weight: 750;
    color: #4e73df;
    text-decoration: none;
  }

  .link-view-more:hover {
    text-decoration: underline;
  }

  /* INVOICE TABLE STYLES */
  .btn-action-red {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.4rem 0.85rem;
    background: #e74a3b;
    color: #ffffff;
    border-radius: 6px;
    font-size: 11.5px;
    font-weight: 750;
    text-decoration: none;
    transition: background 0.15s ease;
  }

  .btn-action-red:hover {
    background: #c0392b;
    text-decoration: none;
  }

  .table-responsive {
    overflow-x: auto;
    width: 100%;
  }

  .ruang-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    text-align: left;
  }

  .ruang-table th {
    background: #f8f9fc;
    color: #4e73df;
    font-weight: 750;
    padding: 0.85rem 1.25rem;
    border-bottom: 1px solid #eaecf4;
    white-space: nowrap;
  }

  .ruang-table td {
    padding: 0.85rem 1.25rem;
    border-bottom: 1px solid #eaecf4;
    color: #5a5c69;
    vertical-align: middle;
  }

  .ruang-table tr:hover td {
    background: #fcfdfe;
  }

  .user-row-name {
    font-weight: 700;
    color: #2c3e50;
  }

  .user-row-email {
    font-size: 11.5px;
    color: #858796;
  }

  .badge-sub-active {
    font-size: 11px;
    font-weight: 700;
    color: #1cc88a;
  }

  .badge-sub-inactive {
    font-size: 11px;
    color: #858796;
  }

  .col-date {
    font-size: 12px;
    color: #858796;
    white-space: nowrap;
  }

  .table-empty, .empty-text {
    padding: 2rem;
    text-align: center;
    color: #858796;
    font-size: 0.9rem;
  }

  /* NOTICES / AUDIT LIST */
  .notice-header {
    background: #5a67d8;
    padding: 1.15rem 1.5rem;
  }

  .notice-header--super {
    background: #7c3aed;
  }

  .notice-title {
    font-size: 1.05rem;
    font-weight: 750;
    color: #ffffff;
    margin: 0;
  }

  .audit-list {
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
  }

  .audit-item {
    display: flex;
    align-items: flex-start;
    gap: 0.85rem;
  }

  .audit-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #f3e8ff;
    color: #7c3aed;
    font-weight: 850;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .audit-body {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .audit-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.15rem;
  }

  .audit-action {
    font-size: 12px;
    color: #2c3e50;
  }

  .audit-time {
    font-size: 10px;
    color: #858796;
  }

  .audit-meta {
    font-size: 11px;
    color: #6e707e;
  }

  /* SHORTCUTS */
  .shortcut-list {
    padding: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .shortcut-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 0.85rem;
    border-radius: 8px;
    text-decoration: none;
    color: #5a5c69;
    transition: background 0.15s ease;
  }

  .shortcut-item:hover {
    background: #f8f9fc;
    color: #4e73df;
    text-decoration: none;
  }

  .shortcut-icon {
    color: #4e73df;
    display: grid;
    place-items: center;
  }

  .shortcut-text {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .shortcut-label {
    font-size: 12.5px;
    font-weight: 750;
    color: #2c3e50;
  }

  .shortcut-desc {
    font-size: 11px;
    color: #858796;
  }

  .shortcut-arrow {
    font-size: 1.25rem;
    color: #b7b9cc;
    font-weight: 700;
  }
</style>
