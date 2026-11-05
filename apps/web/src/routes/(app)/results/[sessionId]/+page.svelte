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
        <p class="eyebrow">Hasil ujian</p>
        <h1 class="page__title">{formatDateTime(result.startedAt)}</h1>
        <p class="muted">Sesi {result.sessionId}</p>
      </div>
      <div class="score">
        <Badge tone={statusTone} size="md">{statusLabel(result.status)}</Badge>
        <p class="score__value" class:score__value--label={result.totalScore === null}>
          {#if result.totalScore === null}
            {scoreHeadline(result.status)}
          {:else}
            {percent(result.totalScore)}
          {/if}
        </p>
        <p class="score__caption">
          {#if result.status === 'ELIMINATED'}
            Nilai total tidak dihitung{result.eliminatedSubtestCode
              ? `, gugur pada subtes ${result.eliminatedSubtestCode}`
              : ''}
          {:else if result.passed === true}
            Lulus
          {:else if result.passed === false}
            Belum lulus
          {:else}
            Menunggu penilaian
          {/if}
        </p>
      </div>
    </header>

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
            <dd>{percent(result.totalPassingScore)}</dd>
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

                      {#if subtest.metrics.columnSeries && subtest.metrics.columnSeries.length > 0}
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

  .score {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--space-1);
  }

  .score__value {
    font-size: var(--text-3xl);
    font-weight: 750;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  /* Label status (GUGUR/KEDALUWARSA) lebih panjang dari angka, jadi dikecilkan
     agar tidak meluber di layar sempit. */
  .score__value--label {
    font-size: var(--text-xl);
    letter-spacing: 0.02em;
  }

  .score__caption {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
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

  @media (min-width: 900px) {
    .summary-grid {
      grid-template-columns: 1.1fr 1fr;
    }
  }
</style>
