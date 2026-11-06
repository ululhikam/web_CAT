<script lang="ts">
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import AdminIcon from '$lib/components/admin/AdminIcon.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import { formatDate } from '$lib/format';
  import {
    buildDashboardSummary,
    buildTrendPoints,
    formatExamDate,
    formatScore,
    sessionBadge,
    type SessionRow,
  } from '$lib/dashboard/summary';
  import type { ExamHistoryItem, ExamStatsView, SubscriptionSummary } from '@webcat/contracts';

  interface HistoryPage {
    items: ExamHistoryItem[];
    nextCursor: string | null;
    hasMore: boolean;
  }

  const SUB_CACHE_KEY = 'webcat_sub_cache';

  function readCachedSub(): SubscriptionSummary | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(SUB_CACHE_KEY);
      return raw ? (JSON.parse(raw) as SubscriptionSummary) : null;
    } catch {
      return null;
    }
  }

  const cachedSub = readCachedSub();
  let subscription = $state<SubscriptionSummary | null>(cachedSub);
  let stats = $state<ExamStatsView | null>(null);
  let history = $state<ExamHistoryItem[]>([]);
  let loading = $state(!cachedSub);
  // Data ujian selalu diambil ulang; pisahkan agar kartu langganan yang sudah
  // ter-cache tidak menampilkan "0 sesi" sebelum respons API tiba.
  let examsLoading = $state(true);
  let error = $state<string | null>(null);

  $effect(() => {
    const user = session.user;
    const token = session.accessToken;
    if (!user || !token) return;

    let cancelled = false;

    void (async () => {
      // Baca `subscription` tanpa melacaknya sebagai dependency. Tanpa ini,
      // assignment `subscription = result` memicu effect yang sama berulang
      // terus (fetch loop) dan membuat browser hang.
      if (untrack(() => !subscription)) loading = true;
      error = null;
      try {
        const [sub, statsResult, historyPage] = await Promise.all([
          apiRequest<SubscriptionSummary | null>('/subscriptions/me', {
            token,
            cacheTtlMs: 0,
          }),
          apiRequest<ExamStatsView>('/exams/stats', { token, cacheTtlMs: 0 }),
          apiRequest<HistoryPage>('/exams/history?limit=5', { token, cacheTtlMs: 0 }),
        ]);
        if (cancelled) return;
        subscription = sub;
        stats = statsResult;
        history = historyPage.items;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(SUB_CACHE_KEY, JSON.stringify(sub));
        }
      } catch (cause) {
        if (!cancelled && untrack(() => !subscription)) error = apiErrorMessage(cause);
      } finally {
        if (!cancelled) {
          loading = false;
          examsLoading = false;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  });

  const isActive = $derived(subscription?.status === 'ACTIVE' && (subscription?.remainingDays ?? 0) > 0);
  const summary = $derived(buildDashboardSummary(stats, history));
  const trendPoints = $derived(buildTrendPoints(summary.trend));
  const trendPolyline = $derived(trendPoints.map((point) => `${point.x},${point.y}`).join(' '));
  const trendArea = $derived(
    trendPoints.length === 0
      ? ''
      : `${trendPoints[0]?.x ?? 0},250 ${trendPolyline} ${trendPoints.at(-1)?.x ?? 0},250`,
  );
  // Garis ambang lulus mengikuti `exam_settings` dari API, bukan angka hardcode.
  const thresholdY = $derived(
    250 - (Math.min(100, Math.max(0, summary.totalPassingScore)) / 100) * 210,
  );

  /* ------------------------------------------------------------------ DETAIL MODAL */
  let detailModalOpen = $state(false);
  let selectedSession = $state<SessionRow | null>(null);

  function openDetailModal(row: SessionRow) {
    selectedSession = row;
    detailModalOpen = true;
  }
</script>

<svelte:head>
  <title>Dashboard Peserta - TES CAT POLRI</title>
</svelte:head>

<div class="dashboard-page">
  <!-- PAGE HEADER & BREADCRUMB -->
  <div class="page-header">
    <div>
      <h1 class="page-title">Dashboard Peserta</h1>
      <p class="page-subtitle">Portal latihan dan evaluasi terpadu berbasis Computer Assisted Test (CAT) Polri.</p>
    </div>
    <div class="header-actions">
      <button class="btn-start-cat" type="button" onclick={() => goto('/exam')}>
        <AdminIcon name="shield" size={17} />
        <span>Mulai TES CAT</span>
      </button>
    </div>
  </div>

  {#if error}
    <Alert tone="danger" title="Gagal memuat status langganan">{error}</Alert>
  {/if}

  <!-- 4 STAT CARDS (RuangAdmin Exact 4-Column Metric Grid) -->
  <section class="stat-grid" aria-label="Ringkasan Statistik Akun">
    <!-- Card 1: STATUS LANGGANAN -->
    <div class="stat-card">
      <div class="stat-card__left">
        <span class="stat-label">STATUS LANGGANAN</span>
        <div class="stat-value">
          {#if loading}
            <Spinner size={16} />
          {:else if isActive}
            Aktif
          {:else if subscription}
            Berakhir
          {:else}
            Belum berlangganan
          {/if}
        </div>
        <div class="stat-trend stat-trend--up">
          <span>{subscription?.planName ?? 'Paket trial / manual'}</span>
          <span class="trend-text">dari server</span>
        </div>
      </div>
      <div class="stat-card__right stat-icon--blue">
        <AdminIcon name="calendar" size={26} />
      </div>
    </div>

    <!-- Card 2: SISA MASA AKTIF -->
    <div class="stat-card">
      <div class="stat-card__left">
        <span class="stat-label">SISA MASA AKTIF</span>
        <div class="stat-value">
          {#if loading}
            <Spinner size={16} />
          {:else}
            {isActive ? `${subscription?.remainingDays ?? 0} Hari` : '0 Hari'}
          {/if}
        </div>
        <div class="stat-trend stat-trend--up">
          <span>{subscription ? formatDate(subscription.endsAt) : '—'}</span>
          <span class="trend-text">berakhir</span>
        </div>
      </div>
      <div class="stat-card__right stat-icon--green">
        <AdminIcon name="clock" size={26} />
      </div>
    </div>

    <!-- Card 3: TOTAL SESI -->
    <div class="stat-card">
      <div class="stat-card__left">
        <span class="stat-label">TOTAL SESI</span>
        <div class="stat-value">
          {#if examsLoading}
            <Spinner size={16} />
          {:else}
            {summary.totalSessions}
          {/if}
        </div>
        <div class="stat-trend stat-trend--up">
          <span>{summary.completedSessions} selesai · {summary.eliminatedSessions} gugur</span>
          <span class="trend-text">dari /exams/stats</span>
        </div>
      </div>
      <div class="stat-card__right stat-icon--cyan">
        <AdminIcon name="users" size={26} />
      </div>
    </div>

    <!-- Card 4: SKOR TERBAIK -->
    <div class="stat-card">
      <div class="stat-card__left">
        <span class="stat-label">SKOR TERBAIK</span>
        <div class="stat-value">
          {#if examsLoading}
            <Spinner size={16} />
          {:else}
            {formatScore(summary.bestScore)}
          {/if}
        </div>
        <div class="stat-trend stat-trend--down">
          <span>rata-rata {formatScore(summary.averageScore)}</span>
          <span class="trend-text">skala 0–100</span>
        </div>
      </div>
      <div class="stat-card__right stat-icon--orange">
        <AdminIcon name="shield" size={26} />
      </div>
    </div>
  </section>

  <!-- TRYOUT FAST-LAUNCH BANNER (Interactive Section) -->
  <section class="banner-tryout" id="tryout" aria-label="Akses Cepat Tryout">
    <div class="banner-tryout__content">
      <span class="banner-tag">TES CAT MANDIRI &amp; TRYOUT AKBAR</span>
      <h2 class="banner-title">Uji Kesiapan Seleksi Anda dengan Sistem CAT Lulus SIP (Sekolah Inspektur Polisi)</h2>
      <p class="banner-desc">
        Dilengkapi pengatur waktu terpisah per subtes, bobot penilaian resmi, serta pendeteksi ambang batas kelulusan Memenuhi Syarat (MS) sesuai pengaturan ujian.
      </p>
      <div class="banner-buttons">
        <button class="btn-primary-launch" type="button" onclick={() => goto('/simulation')}>
          <AdminIcon name="sparkles" size={17} />
          <span>Mulai Pretest CAT Mandiri</span>
        </button>
        <button class="btn-secondary-launch" type="button" onclick={() => goto('/exam')}>
          <AdminIcon name="shield" size={17} />
          <span>Ujian Terjadwal</span>
        </button>
      </div>
    </div>
  </section>

  <!-- MAIN SECTION ROW: 70% Monthly Recap Report (Chart) & 30% Products Sold (Progress Bars) -->
  <div class="content-row" id="latihan">
    <!-- LEFT CARD: Skor perkembangan dari /exams/stats -->
    <div class="card-box card-box--chart">
      <div class="card-box__header">
        <h2 class="card-box__title">Perkembangan Skor</h2>
        {#if stats}
          <span class="header-badge">Ambang lulus {formatScore(summary.totalPassingScore)}</span>
        {/if}
      </div>

      <div class="chart-container">
        {#if examsLoading}
          <div class="chart-empty"><Spinner size={22} label="Memuat grafik" /></div>
        {:else if trendPoints.length === 0}
          <div class="chart-empty">Belum ada skor. Selesaikan satu sesi untuk melihat tren.</div>
        {:else}
          <svg viewBox="0 0 650 280" class="chart-svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#4e73df" stop-opacity="0.45" />
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
            <text x="40" y="45" class="axis-label" text-anchor="end">100</text>
            <text x="40" y="100" class="axis-label" text-anchor="end">75</text>
            <text x="40" y="155" class="axis-label" text-anchor="end">50</text>
            <text x="40" y="210" class="axis-label" text-anchor="end">25</text>
            <text x="40" y="254" class="axis-label" text-anchor="end">0</text>

            <!-- Garis ambang lulus dari `exam_settings` -->
            <line
              x1="50"
              y1={thresholdY}
              x2="620"
              y2={thresholdY}
              stroke="#e74a3b"
              stroke-dasharray="4,4"
              stroke-width="1.5"
            />
            <text x="615" y={thresholdY - 5} class="threshold-label" text-anchor="end">
              Batas lulus: {formatScore(summary.totalPassingScore)}
            </text>

            <!-- Area & garis dari data nyata -->
            <polygon points={trendArea} fill="url(#areaGrad)" />
            <polyline
              points={trendPolyline}
              fill="none"
              stroke="#4e73df"
              stroke-width="3.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- Titik + skor -->
            {#each trendPoints as point (point.examDate + point.score)}
              <circle cx={point.x} cy={point.y} r="4.5" fill="#4e73df" stroke="#ffffff" stroke-width="2" />
              <text x={point.x} y={point.y - 12} class="point-label" text-anchor="middle">
                {formatScore(point.score)}
              </text>
            {/each}

            <!-- X-Axis Labels (maks 6 tanggal) -->
            {#each trendPoints.filter((_, index) => trendPoints.length <= 6 || index % Math.ceil(trendPoints.length / 6) === 0) as point (point.examDate + 'x')}
              <text x={point.x} y="270" class="axis-label" text-anchor="middle">
                {formatExamDate(point.examDate).split(' ').slice(0, 2).join(' ')}
              </text>
            {/each}
          </svg>
        {/if}
      </div>
    </div>

    <!-- RIGHT CARD: Cakupan subtes dari /exams/stats -->
    <div class="card-box card-box--progress">
      <div class="card-box__header">
        <h2 class="card-box__title">Cakupan Modul</h2>
        <span class="btn-filter-pill">Rata-rata per subtes</span>
      </div>

      <div class="progress-list">
        {#if examsLoading}
          <div class="chart-empty"><Spinner size={20} label="Memuat subtes" /></div>
        {:else if summary.perSubtest.length === 0}
          <p class="empty-note">Belum ada jawaban yang dinilai.</p>
        {:else}
          {#each summary.perSubtest as item (item.code)}
            <div class="progress-item">
              <div class="progress-item__header">
                <span class="progress-item__name">{item.label}</span>
                <span class="progress-item__count">
                  {item.averagePercentage === null ? '—' : `${item.averagePercentage.toFixed(2)}%`}
                  · {item.attempts}×
                </span>
              </div>
              <div class="progress-track">
                <div
                  class="progress-fill"
                  style="width: {Math.min(100, Math.max(0, item.averagePercentage ?? 0))}%;"
                  class:progress-fill--weak={summary.weakestSubtest?.code === item.code}
                ></div>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <div class="card-box__footer">
        {#if summary.weakestSubtest}
          <span class="weakest">
            Terlemah: {summary.weakestSubtest.label}
            ({summary.weakestSubtest.averagePercentage?.toFixed(2)}%)
          </span>
        {:else}
          <button class="link-view-more" type="button" onclick={() => goto('/exam')}>
            Uji Kemampuan Sekarang &gt;
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- BOTTOM SECTION ROW: Riwayat sesi & ringkasan -->
  <div class="content-row" id="riwayat">
    <!-- LEFT: Riwayat Sesi Ujian dari /exams/history -->
    <div class="card-box card-box--table">
      <div class="card-box__header">
        <h2 class="card-box__title">Riwayat Sesi Ujian</h2>
        <button class="btn-action-red" type="button" onclick={() => goto('/exam')}>
          Mulai Ujian Baru &gt;
        </button>
      </div>

      {#if examsLoading}
        <div class="chart-empty"><Spinner size={20} label="Memuat riwayat" /></div>
      {:else if summary.sessions.length === 0}
        <div class="chart-empty">
          <p>Belum ada sesi ujian.</p>
          <button class="btn-table-action" type="button" onclick={() => goto('/exam')}>
            Mulai sesi pertama
          </button>
        </div>
      {:else}
        <div class="table-responsive">
          <table class="ruang-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Nilai</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {#each summary.sessions as sess (sess.sessionId)}
                <tr>
                  <td class="col-name">{formatExamDate(sess.examDate)}</td>
                  <td class="col-score"><strong>{formatScore(sess.score)}</strong></td>
                  <td>
                    <Badge tone={sessionBadge(sess.status, sess.passed).tone}>
                      {sessionBadge(sess.status, sess.passed).label}
                    </Badge>
                  </td>
                  <td>
                    <button class="btn-table-action" type="button" onclick={() => openDetailModal(sess)}>
                      Detail
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <div class="card-box__footer">
          <button class="link-view-more" type="button" onclick={() => goto('/history')}>
            Lihat semua riwayat &gt;
          </button>
        </div>
      {/if}
    </div>

    <!-- RIGHT: ringkasan akun -->
    <div class="card-box card-box--notices">
      <div class="notice-header">
        <h2 class="notice-title">Ringkasan Akun</h2>
      </div>

      <div class="notice-list">
        <div class="notice-item">
          <div class="notice-avatar">{(session.user?.fullName ?? '?').slice(0, 1).toUpperCase()}</div>
          <div class="notice-content">
            <div class="notice-top">
              <span class="notice-sender">{session.user?.fullName ?? 'Peserta'}</span>
            </div>
            <p class="notice-text">{session.user?.email ?? '—'}</p>
          </div>
        </div>
        <div class="notice-item">
          <div class="notice-avatar">S</div>
          <div class="notice-content">
            <div class="notice-top">
              <span class="notice-sender">Tingkat kelulusan</span>
            </div>
            <p class="notice-text">
              {summary.passRate.toFixed(2)}% dari {summary.completedSessions} sesi selesai.
            </p>
          </div>
        </div>
        <div class="notice-item">
          <div class="notice-avatar">T</div>
          <div class="notice-content">
            <div class="notice-top">
              <span class="notice-sender">Skor terakhir</span>
            </div>
            <p class="notice-text">{formatScore(summary.lastScore)} (skala 0–100).</p>
          </div>
        </div>
        <div class="notice-item">
          <div class="notice-avatar">A</div>
          <div class="notice-content">
            <div class="notice-top">
              <span class="notice-sender">Aturan ujian</span>
            </div>
            <p class="notice-text">
              Timer per subtes berjalan otomatis; subtes terkunci saat waktu habis.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ================================================================== SESSION DETAIL MODAL -->
{#if detailModalOpen && selectedSession}
  <div
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onclick={(e) => {
      if (e.target === e.currentTarget) detailModalOpen = false;
    }}
    onkeydown={(e) => {
      if (e.key === 'Escape') detailModalOpen = false;
    }}
  >
    <div class="modal-dialog modal-dialog--sm" role="document">
      <div class="modal-header">
        <div class="exam-title-wrap">
          <div class="exam-badge-cat">SESI #{selectedSession.sessionId.slice(0, 8)}</div>
          <h2 class="exam-title">{formatExamDate(selectedSession.examDate)}</h2>
        </div>
        <button class="btn-close-modal" type="button" onclick={() => (detailModalOpen = false)} aria-label="Tutup">
          <AdminIcon name="close" size={20} />
        </button>
      </div>

      <div class="modal-body">
        <div class="detail-summary-card">
          <div class="detail-score-box">
            <span class="detail-score-val">{formatScore(selectedSession.score)}</span>
            <span class="detail-score-lbl">Skor Total</span>
          </div>
          <div class="detail-meta-list">
            <div class="meta-row">
              <span class="meta-key">Status:</span>
              <Badge tone={sessionBadge(selectedSession.status, selectedSession.passed).tone}>
                {sessionBadge(selectedSession.status, selectedSession.passed).label}
              </Badge>
            </div>
            <div class="meta-row">
              <span class="meta-key">Tanggal:</span>
              <span class="meta-val">{formatExamDate(selectedSession.examDate)}</span>
            </div>
            {#if selectedSession.eliminatedSubtestCode}
              <div class="meta-row">
                <span class="meta-key">Gugur di subtes:</span>
                <span class="meta-val">{selectedSession.eliminatedSubtestCode}</span>
              </div>
            {/if}
          </div>
        </div>

        <div class="detail-actions">
          <button
            class="btn-finish-exam"
            type="button"
            onclick={() => {
              detailModalOpen = false;
              if (selectedSession) goto(`/results/${selectedSession.sessionId}`);
            }}
          >
            Lihat hasil lengkap
          </button>
          <button class="btn-nav-prev" type="button" onclick={() => (detailModalOpen = false)}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .dashboard-page {
    display: flex;
    flex-direction: column;
    gap: clamp(0.9rem, 3dvh, 1.5rem);
    min-width: 0;
    overflow-x: clip;
  }

  /* PAGE HEADER */
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .page-title {
    font-size: clamp(1.25rem, 2.2vw + 0.7rem, 1.65rem);
    font-weight: 850;
    color: #2c3e50;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .page-subtitle {
    margin: 4px 0 0;
    font-size: 0.875rem;
    color: #718096;
  }

  .btn-start-cat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #4e73df;
    color: #ffffff;
    border: none;
    padding: 0.65rem 1.25rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(78, 115, 223, 0.3);
    transition: all 0.15s ease;
  }

  .btn-start-cat:hover {
    background: #2e59d9;
    transform: translateY(-1px);
  }

  /* BANNER TRYOUT */
  .banner-tryout {
    background: #ffffff;
    border: 1px solid #e3e6f0;
    border-left: 5px solid #4e73df;
    border-radius: 10px;
    padding: 1.5rem 1.75rem;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  }

  .banner-tag {
    font-size: 10.5px;
    font-weight: 850;
    color: #4e73df;
    letter-spacing: 0.06em;
  }

  .banner-title {
    font-size: 1.35rem;
    font-weight: 850;
    color: #2e384d;
    margin: 0.35rem 0 0.5rem;
    letter-spacing: -0.02em;
  }

  .banner-desc {
    color: #6c757d;
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0 0 1.25rem;
    max-width: 850px;
  }

  .banner-buttons {
    display: flex;
    gap: 0.85rem;
    flex-wrap: wrap;
  }

  .btn-primary-launch {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #4e73df;
    color: #ffffff;
    border: none;
    padding: 0.6rem 1.25rem;
    border-radius: 7px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .btn-primary-launch:hover {
    background: #2e59d9;
  }

  .btn-secondary-launch {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #f8f9fc;
    color: #4e73df;
    border: 1px solid #d1d3e2;
    padding: 0.6rem 1.25rem;
    border-radius: 7px;
    font-size: 0.85rem;
    font-weight: 700;
    text-decoration: none;
    transition: background 0.15s ease;
  }

  .btn-secondary-launch:hover {
    background: #eaecf4;
  }

  /* 4 STAT CARDS GRID */
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: clamp(0.85rem, 2.5vw, 1.5rem);
  }

  @media (max-width: 1100px) {
    .stat-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 580px) {
    .stat-grid {
      grid-template-columns: 1fr;
    }
  }

  .stat-card {
    background: #ffffff;
    border: 1px solid #eaecf4;
    border-radius: 8px;
    padding: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  }

  .stat-label {
    font-size: 11px;
    font-weight: 850;
    color: #b7b9cc;
    letter-spacing: 0.05em;
  }

  .stat-value {
    font-size: 1.35rem;
    font-weight: 800;
    color: #5a5c69;
    margin: 0.25rem 0;
  }

  .stat-trend {
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .stat-trend--up { color: #1cc88a; }
  .stat-trend--down { color: #4e73df; }
  .trend-text { color: #858796; font-weight: 500; }

  .stat-card__right {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: grid;
    place-items: center;
  }

  .stat-icon--blue { background: #eaecf4; color: #4e73df; }
  .stat-icon--green { background: #e8f9f2; color: #1cc88a; }
  .stat-icon--cyan { background: #e5f7f9; color: #36b9cc; }
  .stat-icon--orange { background: #fef7e7; color: #f6c23e; }

  /* CONTENT ROW */
  .content-row {
    display: grid;
    grid-template-columns: 7fr 3fr;
    gap: 1.5rem;
  }

  @media (max-width: 992px) {
    .content-row {
      grid-template-columns: 1fr;
    }
  }

  .card-box {
    background: #ffffff;
    border: 1px solid #e3e6f0;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
  }

  .card-box__header {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #eaecf4;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-box__title {
    font-size: 0.95rem;
    font-weight: 800;
    color: #4e73df;
    margin: 0;
  }

  .header-badge {
    font-size: 11px;
    font-weight: 750;
    background: #fee2e2;
    color: #dc2626;
    padding: 3px 8px;
    border-radius: 6px;
  }

  .chart-container {
    padding: clamp(0.65rem, 2vw, 1.25rem);
    height: clamp(11rem, 34dvh, 18.75rem);
  }

  .chart-svg {
    width: 100%;
    height: 100%;
  }

  .axis-label {
    font-size: 11px;
    fill: #b7b9cc;
    font-weight: 600;
  }

  .point-label {
    font-size: 10.5px;
    fill: #4e73df;
    font-weight: 800;
  }

  .chart-empty {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    text-align: center;
    color: #858796;
    font-size: 13px;
    font-weight: 600;
    padding: 1.5rem;
  }

  .empty-note {
    margin: 0;
    color: #858796;
    font-size: 13px;
    font-weight: 600;
  }

  .weakest {
    font-size: 12.5px;
    font-weight: 750;
    color: #e74a3b;
  }

  .threshold-label {
    font-size: 10px;
    fill: #e74a3b;
    font-weight: 800;
  }

  .btn-filter-pill {
    font-size: 11px;
    font-weight: 700;
    background: #eaecf4;
    color: #5a5c69;
    padding: 3px 8px;
    border-radius: 4px;
  }

  .progress-list {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
    flex: 1;
  }

  .progress-item__header {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 700;
    color: #5a5c69;
    margin-bottom: 0.35rem;
  }

  .progress-item__count {
    color: #b7b9cc;
    font-weight: 600;
  }

  .progress-track {
    height: 12px;
    background: #eaecf4;
    border-radius: 999px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 999px;
    background: #4e73df;
  }

  .progress-fill--weak {
    background: #e74a3b;
  }

  .card-box__footer {
    padding: 0.85rem 1.25rem;
    border-top: 1px solid #eaecf4;
    background: #f8f9fc;
    text-align: center;
    border-radius: 0 0 8px 8px;
  }

  .link-view-more {
    font-size: 12.5px;
    font-weight: 750;
    color: #4e73df;
    background: none;
    border: none;
    cursor: pointer;
  }

  .link-view-more:hover {
    text-decoration: underline;
  }

  .btn-action-red {
    background: #e74a3b;
    color: #ffffff;
    border: none;
    padding: 0.45rem 0.85rem;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 750;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .btn-action-red:hover {
    background: #c0392b;
  }

  .table-responsive {
    overflow-x: auto;
  }

  .ruang-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .ruang-table th {
    background: #f8f9fc;
    color: #4e73df;
    font-weight: 800;
    font-size: 11.5px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.85rem 1.25rem;
    border-bottom: 1px solid #eaecf4;
    text-align: left;
  }

  .ruang-table td {
    padding: 0.95rem 1.25rem;
    border-bottom: 1px solid #eaecf4;
    color: #5a5c69;
  }

  .col-name {
    font-weight: 700;
    color: #2e384d;
  }

  .btn-table-action {
    background: #4e73df;
    color: #ffffff;
    border: none;
    padding: 0.35rem 0.75rem;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
  }

  .btn-table-action:hover {
    background: #2e59d9;
  }

  /* NOTICES */
  .notice-header {
    background: #4e73df;
    color: #ffffff;
    padding: 1rem 1.25rem;
    border-radius: 7px 7px 0 0;
  }

  .notice-title {
    font-size: 0.95rem;
    font-weight: 800;
    margin: 0;
  }

  .notice-list {
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .notice-item {
    display: flex;
    gap: 0.75rem;
    padding-bottom: 0.85rem;
    border-bottom: 1px solid #f1f3f9;
  }

  .notice-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #4e73df;
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .notice-content {
    flex: 1;
  }

  .notice-top {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-bottom: 2px;
  }

  .notice-sender {
    font-weight: 750;
    color: #2e384d;
  }

  .notice-text {
    margin: 0;
    font-size: 12px;
    color: #6c757d;
    line-height: 1.4;
  }

  /* MODALS */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    z-index: 1000;
    display: grid;
    place-items: center;
    padding: 1rem;
    backdrop-filter: blur(3px);
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    z-index: 1000;
    display: grid;
    place-items: center;
    padding: max(0.75rem, env(safe-area-inset-top)) max(0.75rem, env(safe-area-inset-right))
      max(0.75rem, env(safe-area-inset-bottom)) max(0.75rem, env(safe-area-inset-left));
    backdrop-filter: blur(3px);
  }

  .modal-dialog {
    background: #ffffff;
    width: 100%;
    max-width: min(950px, 100%);
    max-height: 90vh;
    max-height: 90dvh;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-dialog--sm {
    max-width: 580px;
  }

  .modal-header {
    background: #4e73df;
    color: #ffffff;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .exam-badge-cat {
    font-size: 10.5px;
    font-weight: 850;
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 7px;
    border-radius: 4px;
    display: inline-block;
  }

  .exam-title {
    margin: 4px 0 0;
    font-size: 1.15rem;
    font-weight: 850;
  }

  .btn-close-modal {
    background: none;
    border: none;
    color: #ffffff;
    cursor: pointer;
    display: grid;
    place-items: center;
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .btn-nav-prev {
    background: #eaecf4;
    color: #4e73df;
    border: none;
    padding: 0.6rem 1.15rem;
    border-radius: 6px;
    font-weight: 750;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .btn-nav-prev:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-finish-exam {
    background: #1cc88a;
    color: #ffffff;
    border: none;
    padding: 0.6rem 1.25rem;
    border-radius: 6px;
    font-weight: 800;
    font-size: 0.85rem;
    cursor: pointer;
  }

  /* DETAIL MODAL */
  .detail-summary-card {
    background: #f8f9fc;
    border: 1px solid #eaecf4;
    border-radius: 8px;
    padding: 1.25rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1.25rem;
  }

  .detail-score-box {
    background: #4e73df;
    color: #ffffff;
    padding: 1rem 1.25rem;
    border-radius: 8px;
    text-align: center;
    min-width: 110px;
  }

  .detail-score-val {
    display: block;
    font-size: 1.85rem;
    font-weight: 900;
    line-height: 1;
  }

  .detail-score-lbl {
    font-size: 9.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .detail-meta-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 12.5px;
  }

  .meta-key { color: #718096; }
  .meta-val { font-weight: 750; color: #2e384d; }

  .detail-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }
  /* RESPONSIVE MOBILE */
  @media (max-width: 640px) {
    .page-header {
      flex-direction: column;
      align-items: stretch;
    }

    .header-actions,
    .btn-start-cat {
      width: 100%;
    }

    .btn-start-cat,
    .btn-primary-launch,
    .btn-secondary-launch,
    .btn-finish-exam,
    .btn-nav-prev {
      justify-content: center;
      min-height: clamp(2.75rem, 6dvh, 3rem);
    }

    .banner-tryout {
      padding: clamp(0.9rem, 3.5vw, 1.25rem);
    }

    .banner-title {
      font-size: clamp(1rem, 4vw, 1.15rem);
    }

    .banner-buttons {
      flex-direction: column;
    }

    .banner-buttons > * {
      width: 100%;
      justify-content: center;
    }

    .card-box__header {
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .chart-container {
      height: clamp(10rem, 28dvh, 14rem);
      padding: 0.75rem;
    }

    .detail-actions {
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .modal-body {
      padding: clamp(0.8rem, 2.5vw, 1rem);
    }

    .modal-dialog {
      max-height: 94vh;
      max-height: 94dvh;
    }
  }
</style>
