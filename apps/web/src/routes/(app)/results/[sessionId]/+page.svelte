<script lang="ts">
  import { page } from '$app/state';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiErrorMessage, apiRequest } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import { formatDateTime } from '$lib/format';
  import type { ExamResultView, SubtestResultView } from '@webcat/contracts';

  const sessionId = page.params.sessionId ?? '';

  let result = $state<ExamResultView | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  $effect(() => {
    if (!session.user || !session.accessToken || !sessionId) return;
    let cancelled = false;

    void (async () => {
      loading = true;
      error = null;
      try {
        const data = await apiRequest<ExamResultView>(`/exams/sessions/${sessionId}/result`, {
          token: session.accessToken,
        });
        if (!cancelled) result = data;
      } catch (cause) {
        if (cancelled) return;
        error = apiErrorMessage(cause);
      } finally {
        if (!cancelled) loading = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  });

  const statusTone = $derived(
    result?.status === 'COMPLETED'
      ? result.passed
        ? 'success'
        : 'warning'
      : result?.status === 'ELIMINATED'
        ? 'danger'
        : 'neutral',
  );

  function statusLabel(status: string | null | undefined): string {
    if (!status) return '-';
    return status.replaceAll('_', ' ');
  }

  function percent(value: number | null | undefined): string {
    return value === null || value === undefined ? '-' : `${value.toFixed(2)}%`;
  }

  function formatScore(value: number | null | undefined): string {
    return value === null || value === undefined ? '-' : value.toFixed(2);
  }

  /**
   * Sesi yang gugur/kedaluwarsa tidak punya nilai total. Menampilkan `-` sebagai
   * angka besar terlihat seperti data rusak, jadi pakai label status yang jelas.
   */
  function scoreHeadline(status: string | null | undefined): string {
    if (status === 'ELIMINATED') return 'GUGUR';
    if (status === 'EXPIRED') return 'KEDALUWARSA';
    if (status === 'VIOLATION') return 'DIBATALKAN';
    return 'TANPA NILAI';
  }

  function number(value: number | null | undefined): string {
    return value === null || value === undefined ? '-' : String(value);
  }

  function barWidth(value: number | null | undefined, max: number): string {
    if (value === null || value === undefined || max <= 0) return '0%';
    return `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
  }

  function subtestTone(subtest: SubtestResultView): 'success' | 'danger' | 'warning' | 'neutral' {
    if (subtest.passed === true) return 'success';
    if (subtest.status === 'ELIMINATED' || subtest.status === 'EXPIRED') return 'danger';
    if (subtest.passed === false) return 'warning';
    return 'neutral';
  }

  function kecermatanPoints(series: number[] | null | undefined): string {
    if (!series || series.length === 0) return '';
    return series.map((val, colIdx) => `${55 + colIdx * 58},${170 - (val / 50) * 140}`).join(' ');
  }
</script>

<svelte:head>
  <title>Hasil ujian - TES CAT</title>
</svelte:head>

<div class="page">
  {#if loading}
    <div class="center"><Spinner size={28} label="Memuat hasil" /></div>
  {:else if error || !result}
    <Alert tone="danger" title="Hasil belum tersedia">{error ?? 'Sesi tidak ditemukan.'}</Alert>
    <div class="actions">
      <Button href={`/exam/${sessionId}`}>Kembali ke ujian</Button>
      <Button variant="secondary" href="/history">Riwayat ujian</Button>
    </div>
  {:else}
    <header class="page__header">
      <div>
        <p class="eyebrow">Hasil Ujian Sesi</p>
        <h1 class="page__title">{formatDateTime(result.startedAt)}</h1>
        <p class="muted">Sesi Ujian: {result.sessionId}</p>
      </div>
      <div class="actions">
        <Button variant="secondary" href="/history">Riwayat Ujian</Button>
        <Button href="/exam">Ujian Baru</Button>
      </div>
    </header>

    <!-- HIGHLIGHT UTAMA AKUMULASI NILAI AKHIR (TANPA PERSENTASE) -->
    <section
      class="score-highlight-card"
      class:score-highlight-card--pass={result.passed}
      class:score-highlight-card--fail={result.passed === false || result.status === 'ELIMINATED'}
    >
      <div class="score-highlight-card__head">
        <div class="score-highlight-tag">
          <span class="badge-dot"></span>
          <span>AKUMULASI NILAI AKHIR TES CAT POLRI</span>
        </div>
        <Badge tone={statusTone} size="md">
          {result.passed === true
            ? '✓ MEMENUHI SYARAT (MS)'
            : result.status === 'ELIMINATED'
              ? '✗ GUGUR / TMS'
              : result.passed === false
                ? '✗ TIDAK MEMENUHI SYARAT (TMS)'
                : statusLabel(result.status)}
        </Badge>
      </div>

      <div class="score-highlight-card__main">
        <div class="score-highlight-val-block">
          <span class="score-highlight-val__number" class:text-success={result.passed} class:text-danger={result.passed === false || result.status === 'ELIMINATED'}>
            {#if result.totalScore === null}
              {scoreHeadline(result.status)}
            {:else}
              {formatScore(result.totalScore)}
            {/if}
          </span>
          {#if result.totalScore !== null}
            <span class="score-highlight-val__scale">/ 100</span>
          {/if}
        </div>

        <div class="score-highlight-meta-block">
          <div class="score-highlight-threshold">
            Ambang Batas Kelulusan Minimal: <strong>{formatScore(result.totalPassingScore ?? 61)}</strong>
          </div>
          {#if result.totalScore !== null}
            <div class="score-highlight-gauge">
              <div
                class="score-highlight-gauge-fill"
                class:score-highlight-gauge-fill--pass={result.passed}
                class:score-highlight-gauge-fill--fail={!result.passed}
                style:width={`${Math.min(100, Math.max(0, result.totalScore))}%`}
              ></div>
              <div
                class="score-highlight-gauge-marker"
                style:left={`${result.totalPassingScore ?? 61}%`}
                title="Batas Minimal 61.00"
              ></div>
            </div>
          {/if}
          <p class="score-highlight-caption">
            {#if result.status === 'ELIMINATED'}
              Sesi dinyatakan gugur{result.eliminatedSubtestCode ? ` pada subtes ${result.eliminatedSubtestCode}` : ''}.
            {:else if result.passed === true}
              Selamat! Akumulasi skor memenuhi syarat kelulusan seleksi Polri (di atas ambang batas kelulusan minimal tanpa persentase).
            {:else if result.passed === false}
              Perhatian: Akumulasi skor berada di bawah ambang batas minimal kelulusan. Tingkatkan latihan Anda.
            {:else}
              Hasil evaluasi akhir tersimpan resmi di basis data sistem CAT.
            {/if}
          </p>
        </div>
      </div>
    </section>

    {#if result.status === 'ELIMINATED'}
      <Alert tone="danger" title="Sesi dinyatakan gugur">
        {result.eliminationReason ?? 'Nilai subtes berada di bawah ambang gugur.'}
        Data jawaban dan skor subtes yang sudah dikerjakan tetap tersimpan.
      </Alert>
    {:else if result.status === 'VOIDED'}
      <Alert tone="warning" title="Sesi dibatalkan admin">
        Hasil sesi ini tidak dipakai untuk penilaian.
      </Alert>
    {/if}

    <div class="summary-grid">
      <Card title="Ringkasan">
        <dl class="facts">
          <div>
            <dt>Tanggal ujian</dt>
            <dd>{result.examDate}</dd>
          </div>
          <div>
            <dt>Mulai</dt>
            <dd>{formatDateTime(result.startedAt)}</dd>
          </div>
          <div>
            <dt>Selesai</dt>
            <dd>{formatDateTime(result.finishedAt)}</dd>
          </div>
          <div>
            <dt>Ambang total</dt>
            <dd>{formatScore(result.totalPassingScore)}</dd>
          </div>
          <div>
            <dt>Versi penilaian</dt>
            <dd>v{result.scoringVersion}</dd>
          </div>
        </dl>
      </Card>

      <Card title="Catatan pelanggaran" description="Terekam otomatis oleh server.">
        {#if result.violations.length === 0}
          <p class="muted">Tidak ada pelanggaran yang tercatat.</p>
        {:else}
          <ul class="violations">
            {#each result.violations as violation (violation.type)}
              <li>
                <span class="mono">{violation.type}</span>
                <Badge tone="warning">{violation.count}x</Badge>
                <span class="muted">{formatDateTime(violation.lastAt)}</span>
              </li>
            {/each}
          </ul>
        {/if}
      </Card>
    </div>

    {#each result.stages as stage (stage.id)}
      <Card
        title={`${stage.stageCode} - ${stage.name}`}
        description={`Bobot ${stage.weight}% · status ${statusLabel(stage.status)}`}
      >
        <div class="stage-head">
          <div>
            <p class="stage-head__label">Persentase stage</p>
            <p class="stage-head__value">{percent(stage.percentage)}</p>
          </div>
          <Badge
            tone={stage.passed === true
              ? 'success'
              : stage.passed === false
                ? 'warning'
                : 'neutral'}
          >
            {stage.passed === true
              ? 'Lulus stage'
              : stage.passed === false
                ? 'Tidak lulus'
                : 'Belum final'}
          </Badge>
        </div>

        <div class="table-wrap">
          <table class="table">
            <caption class="sr-only">Hasil subtes {stage.name}</caption>
            <thead>
              <tr>
                <th scope="col">Subtes</th>
                <th scope="col">Status</th>
                <th scope="col">Benar / salah / kosong</th>
                <th scope="col">Skor</th>
                <th scope="col">Persentase</th>
                <th scope="col">Ambang</th>
                <th scope="col">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {#each stage.subtests as subtest (subtest.id)}
                <tr>
                  <td>
                    <p class="cell-title">{subtest.name}</p>
                    <p class="cell-sub mono">{subtest.subtestCode} · {subtest.scoringStrategy}</p>
                  </td>
                  <td><Badge tone={subtestTone(subtest)}>{statusLabel(subtest.status)}</Badge></td>
                  <td>
                    {#if subtest.metrics}
                      {subtest.metrics.correct} / {subtest.metrics.wrong} / {subtest.metrics.blank}
                    {:else}
                      -
                    {/if}
                  </td>
                  <td>
                    {number(subtest.rawScore)} / {number(subtest.maxScore)}
                  </td>
                  <td><strong>{percent(subtest.percentage)}</strong></td>
                  <td
                    >{subtest.passed === true
                      ? 'Lulus'
                      : subtest.passed === false
                        ? 'Tidak lulus'
                        : '-'}</td
                  >
                  <td class="cell-note">
                    {#if subtest.lockReason}
                      <span class="mono">{subtest.lockReason}</span>
                    {:else if subtest.metrics?.reviewFlagged}
                      Perlu review admin
                    {:else if subtest.metrics?.consistencyFlagged}
                      Konsistensi rendah
                    {:else}
                      -
                    {/if}
                  </td>
                </tr>
                {#if subtest.metrics}
                  <tr class="metrics-row">
                    <td colspan="7">
                      <div class="metrics">
                        <span
                          >Akurasi: <strong
                            >{percent(
                              subtest.metrics.accuracy === null
                                ? null
                                : subtest.metrics.accuracy * 100,
                            )}</strong
                          ></span
                        >
                        <span
                          >Throughput: <strong>{number(subtest.metrics.throughput)}</strong></span
                        >
                        <span
                          >Stabilitas: <strong>{percent(subtest.metrics.stability)}</strong></span
                        >
                        <span
                          >Konsistensi: <strong>{percent(subtest.metrics.consistencyIndex)}</strong
                          ></span
                        >
                        <span>Tren: <strong>{number(subtest.metrics.trend)}</strong></span>
                      </div>

                      {#if subtest.subtestCode === 'KECERMATAN' && subtest.metrics?.columnSeries && subtest.metrics.columnSeries.length > 0}
                        <div class="kecermatan-result-block">
                          <div class="kecermatan-result-head">
                            <div>
                              <h4 class="kecermatan-result-title">Grafik Kecermatan (Kurva Kerja 10 Kolom)</h4>
                              <p class="kecermatan-result-sub">
                                Jumlah soal benar per kolom (kecepatan &amp; ketahanan ritme kerja)
                              </p>
                            </div>
                            <Badge tone="brand" size="sm">10 Kolom × 50 Soal</Badge>
                          </div>

                          <div class="kecermatan-chart-svg-wrap">
                            <svg class="kecermatan-chart-svg" viewBox="0 0 640 210" preserveAspectRatio="none">
                              <!-- Garis horizontal 0, 10, 20, 30, 40, 50 -->
                              {#each [0, 10, 20, 30, 40, 50] as yLevel}
                                {@const yPos = 170 - (yLevel / 50) * 140}
                                <line x1="32" y1={yPos} x2="630" y2={yPos} stroke="var(--color-border)" stroke-dasharray="3 3" stroke-width="1" />
                                <text x="26" y={yPos + 4} font-size="10" text-anchor="end" fill="var(--color-text-muted)">{yLevel}</text>
                              {/each}

                              <!-- Batang Tiap Kolom -->
                              {#each subtest.metrics.columnSeries as val, colIdx}
                                {@const x = 55 + colIdx * 58}
                                {@const barH = Math.max(0, Math.min(140, (val / 50) * 140))}
                                {@const yTop = 170 - barH}
                                <rect
                                  x={x - 14}
                                  y={yTop}
                                  width="28"
                                  height={barH}
                                  rx="4"
                                  fill="var(--color-primary)"
                                  opacity="0.25"
                                />
                                <!-- Label Kolom X -->
                                <text x={x} y="195" font-size="11" font-weight="600" text-anchor="middle" fill="var(--color-text-muted)">
                                  K{colIdx + 1}
                                </text>
                                <!-- Nilai di atas titik -->
                                <text x={x} y={Math.max(14, yTop - 8)} font-size="11" font-weight="700" text-anchor="middle" fill="var(--color-primary)">
                                  {val}
                                </text>
                              {/each}

                              <!-- Garis Kurva Poliline Penghubung Titik -->
                              <polyline
                                fill="none"
                                stroke="var(--color-primary)"
                                stroke-width="3"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                points={kecermatanPoints(subtest.metrics.columnSeries)}
                              />

                              <!-- Bulatan Titik di Puncak Kurva -->
                              {#each subtest.metrics.columnSeries as val, colIdx}
                                {@const cx = 55 + colIdx * 58}
                                {@const cy = 170 - (val / 50) * 140}
                                <circle cx={cx} cy={cy} r="4.5" fill="var(--color-surface)" stroke="var(--color-primary)" stroke-width="2.5" />
                              {/each}
                            </svg>
                          </div>

                          <!-- 4 INDIKATOR HASIL KECERMATAN POLRI -->
                          <div class="kecermatan-pillars-grid">
                            <div class="pillar-card">
                              <span class="pillar-card__label">Kecepatan (Throughput)</span>
                              <span class="pillar-card__value">{number(subtest.metrics.throughput)} <small>soal/menit</small></span>
                              <span class="pillar-card__desc">Rata-rata kecepatan penyelesaian soal per kolom</span>
                            </div>
                            <div class="pillar-card">
                              <span class="pillar-card__label">Ketelitian (Akurasi)</span>
                              <span class="pillar-card__value">{percent(subtest.metrics.accuracy ? subtest.metrics.accuracy * 100 : 0)}</span>
                              <span class="pillar-card__desc">Persentase ketepatan jawaban benar</span>
                            </div>
                            <div class="pillar-card">
                              <span class="pillar-card__label">Kestabilan (Konsistensi)</span>
                              <span class="pillar-card__value">{percent(subtest.metrics.stability)}</span>
                              <span class="pillar-card__desc">Konsistensi ritme antar kolom 1 s/d 10</span>
                            </div>
                            <div class="pillar-card">
                              <span class="pillar-card__label">Ketahanan (Daya Tahan)</span>
                              <span class="pillar-card__value">
                                {#if (subtest.metrics.trend ?? 0) >= 0.2}
                                  Meningkat ↗
                                {:else if (subtest.metrics.trend ?? 0) <= -0.2}
                                  Menurun ↘
                                {:else}
                                  Stabil ➔
                                {/if}
                              </span>
                              <span class="pillar-card__desc">Tren ketahanan kerja dari kolom 1 ke 10</span>
                            </div>
                          </div>
                        </div>
                      {:else if subtest.metrics.columnSeries && subtest.metrics.columnSeries.length > 0}
                        <div class="chart" aria-label="Waktu per kolom Pass Hand">
                          {#each subtest.metrics.columnSeries as value, columnIndex (columnIndex)}
                            <span
                              class="chart__bar"
                              style={`height:${barWidth(value, Math.max(...(subtest.metrics?.columnSeries ?? [1])))}%`}
                              title={`Kolom ${columnIndex + 1}: ${value} ms`}
                            ></span>
                          {/each}
                        </div>
                      {/if}

                      {#if subtest.metrics.dimensionProfile}
                        <div class="dimensions">
                          {#each Object.entries(subtest.metrics.dimensionProfile) as [dimension, value] (dimension)}
                            <div class="dimension">
                              <span class="dimension__label">{dimension}</span>
                              <div class="dimension__track">
                                <span
                                  class="dimension__fill"
                                  style={`width:${Math.max(0, Math.min(100, value))}%`}
                                ></span>
                              </div>
                              <span class="dimension__value">{value}</span>
                            </div>
                          {/each}
                        </div>
                      {/if}
                    </td>
                  </tr>
                {/if}
              {/each}
            </tbody>
          </table>
        </div>
      </Card>
    {/each}

    <div class="actions">
      <Button href="/history">Riwayat ujian</Button>
      <Button variant="secondary" href="/exam">Halaman ujian</Button>
      <Button variant="ghost" href="/dashboard">Dashboard</Button>
    </div>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    max-width: 1040px;
  }

  .page__header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .eyebrow {
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-subtle);
  }

  .page__title {
    font-size: var(--text-2xl);
  }

  /* ========================================================================== */
  /* HIGHLIGHT BESAR AKUMULASI NILAI AKHIR (TANPA PERSENTASE)                   */
  /* ========================================================================== */

  .score-highlight-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-5);
    border-radius: var(--radius-lg);
    border: 2px solid var(--color-border);
    background: var(--color-surface);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
  }

  .score-highlight-card--pass {
    border-color: rgba(16, 185, 129, 0.45);
    background: linear-gradient(135deg, var(--color-surface) 0%, rgba(16, 185, 129, 0.05) 100%);
  }

  .score-highlight-card--fail {
    border-color: rgba(239, 68, 68, 0.45);
    background: linear-gradient(135deg, var(--color-surface) 0%, rgba(239, 68, 68, 0.05) 100%);
  }

  .score-highlight-card__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .score-highlight-tag {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--text-xs);
    font-weight: 800;
    letter-spacing: 0.08em;
    color: var(--color-text-subtle);
  }

  .badge-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-primary);
  }

  .score-highlight-card__main {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-5);
  }

  .score-highlight-val-block {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .score-highlight-val__number {
    font-size: clamp(3.2rem, 7vw, 4.8rem);
    font-weight: 900;
    line-height: 1;
    font-family: var(--font-mono, monospace);
    letter-spacing: -0.03em;
  }

  .score-highlight-val__scale {
    font-size: var(--text-base);
    color: var(--color-text-muted);
    font-weight: 700;
  }

  .score-highlight-meta-block {
    flex: 1;
    min-width: 260px;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .score-highlight-threshold {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .score-highlight-gauge {
    position: relative;
    width: 100%;
    height: 12px;
    background: #e2e8f0;
    border-radius: 999px;
    overflow: hidden;
  }

  .score-highlight-gauge-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .score-highlight-gauge-fill--pass {
    background: linear-gradient(90deg, #10b981, #059669);
  }

  .score-highlight-gauge-fill--fail {
    background: linear-gradient(90deg, #ef4444, #dc2626);
  }

  .score-highlight-gauge-marker {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #0f172a;
    z-index: 2;
  }

  .score-highlight-caption {
    margin: 0;
    font-size: var(--text-xs);
    line-height: 1.45;
    color: var(--color-text-muted);
  }

  .text-success {
    color: #10b981 !important;
  }

  .text-danger {
    color: #ef4444 !important;
  }

  .summary-grid {
    display: grid;
    gap: var(--space-5);
  }

  .facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: var(--space-4);
    margin: 0;
  }

  .facts dt {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .facts dd {
    margin: var(--space-1) 0 0;
    font-weight: 600;
  }

  .violations {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .violations li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
  }

  .stage-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }

  .stage-head__label {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .stage-head__value {
    font-size: var(--text-xl);
    font-weight: 700;
  }

  .table-wrap {
    overflow-x: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
  }

  .table th,
  .table td {
    padding: var(--space-3);
    text-align: left;
    border-bottom: 1px solid var(--color-border);
    vertical-align: top;
  }

  .table thead th {
    background: var(--color-surface-muted);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .table tbody tr:last-child td {
    border-bottom: 0;
  }

  .cell-title {
    font-weight: 600;
  }

  .cell-sub {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .cell-note {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .metrics-row td {
    background: var(--color-surface-muted);
  }

  .metrics {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .metrics strong {
    color: var(--color-text);
  }

  .chart {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 56px;
    margin-top: var(--space-3);
    padding: var(--space-1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
  }

  .chart__bar {
    flex: 1;
    min-width: 2px;
    border-radius: 2px 2px 0 0;
    background: var(--color-primary);
    opacity: 0.75;
  }

  .dimensions {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-top: var(--space-3);
  }

  .dimension {
    display: grid;
    grid-template-columns: 140px 1fr 40px;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
  }

  .dimension__label {
    color: var(--color-text-muted);
  }

  .dimension__track {
    height: 8px;
    border-radius: var(--radius-full);
    background: var(--color-border);
    overflow: hidden;
  }

  .dimension__fill {
    display: block;
    height: 100%;
    background: var(--color-primary);
  }

  .dimension__value {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .center {
    display: grid;
    place-items: center;
    padding-block: var(--space-12);
  }

  .mono {
    font-family: var(--font-mono);
  }

  /* ------------------------------------------- GRAFIK KECERMATAN HASIL */
  .kecermatan-result-block {
    margin-top: var(--space-4);
    padding: var(--space-4);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }

  .kecermatan-result-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }

  .kecermatan-result-title {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .kecermatan-result-sub {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin: var(--space-1) 0 0 0;
  }

  .kecermatan-chart-svg-wrap {
    width: 100%;
    overflow-x: auto;
    background: var(--color-surface-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3);
  }

  .kecermatan-chart-svg {
    width: 100%;
    min-width: 520px;
    height: 190px;
  }

  .kecermatan-pillars-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: var(--space-3);
    margin-top: var(--space-4);
  }

  .pillar-card {
    display: flex;
    flex-direction: column;
    padding: var(--space-3);
    background: var(--color-surface-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .pillar-card__label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-muted);
  }

  .pillar-card__value {
    font-size: var(--text-base);
    font-weight: 800;
    color: var(--color-primary);
    margin: var(--space-1) 0;
  }

  .pillar-card__value small {
    font-size: var(--text-xs);
    font-weight: normal;
    color: var(--color-text-muted);
  }

  .pillar-card__desc {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    line-height: 1.3;
  }

  @media (min-width: 900px) {
    /* ========================================================================== */
  /* HIGHLIGHT BESAR AKUMULASI NILAI AKHIR (TANPA PERSENTASE)                   */
  /* ========================================================================== */

  .score-highlight-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-5);
    border-radius: var(--radius-lg);
    border: 2px solid var(--color-border);
    background: var(--color-surface);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
  }

  .score-highlight-card--pass {
    border-color: rgba(16, 185, 129, 0.45);
    background: linear-gradient(135deg, var(--color-surface) 0%, rgba(16, 185, 129, 0.05) 100%);
  }

  .score-highlight-card--fail {
    border-color: rgba(239, 68, 68, 0.45);
    background: linear-gradient(135deg, var(--color-surface) 0%, rgba(239, 68, 68, 0.05) 100%);
  }

  .score-highlight-card__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .score-highlight-tag {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--text-xs);
    font-weight: 800;
    letter-spacing: 0.08em;
    color: var(--color-text-subtle);
  }

  .badge-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-primary);
  }

  .score-highlight-card__main {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-5);
  }

  .score-highlight-val-block {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .score-highlight-val__number {
    font-size: clamp(3.2rem, 7vw, 4.8rem);
    font-weight: 900;
    line-height: 1;
    font-family: var(--font-mono, monospace);
    letter-spacing: -0.03em;
  }

  .score-highlight-val__scale {
    font-size: var(--text-base);
    color: var(--color-text-muted);
    font-weight: 700;
  }

  .score-highlight-meta-block {
    flex: 1;
    min-width: 260px;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .score-highlight-threshold {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .score-highlight-gauge {
    position: relative;
    width: 100%;
    height: 12px;
    background: #e2e8f0;
    border-radius: 999px;
    overflow: hidden;
  }

  .score-highlight-gauge-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .score-highlight-gauge-fill--pass {
    background: linear-gradient(90deg, #10b981, #059669);
  }

  .score-highlight-gauge-fill--fail {
    background: linear-gradient(90deg, #ef4444, #dc2626);
  }

  .score-highlight-gauge-marker {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #0f172a;
    z-index: 2;
  }

  .score-highlight-caption {
    margin: 0;
    font-size: var(--text-xs);
    line-height: 1.45;
    color: var(--color-text-muted);
  }

  .text-success {
    color: #10b981 !important;
  }

  .text-danger {
    color: #ef4444 !important;
  }

  .summary-grid {
      grid-template-columns: 1.1fr 1fr;
    }
  }
</style>
