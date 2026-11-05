<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import AdminPageHeader from '$lib/components/admin/AdminPageHeader.svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Field from '@webcat/ui/components/Field.svelte';
  import Input from '@webcat/ui/components/Input.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiDownload, apiErrorMessage, apiRequest, apiUpload, saveBlob } from '$lib/api/client';
  import { adminBase } from '$lib/panel-route';
  import { session } from '$lib/stores/session.svelte';
  import { formatDateTime } from '$lib/format';
  import type {
    CategoryNode,
    ImportCommitResult,
    ImportItemStatus,
    ImportItemView,
    ImportJobListResponse,
    ImportJobStatus,
    ImportJobView,
    ImportPreviewResponse,
  } from '@webcat/contracts';

  type Step = 'upload' | 'review' | 'done';

  let step = $state<Step>('upload');
  let busy = $state(false);
  let error = $state<string | null>(null);
  let notice = $state<string | null>(null);

  // ---------------------------------------------------------------- unggah
  let file = $state<File | null>(null);
  let assets = $state<File | null>(null);
  let targetStageCode = $state('');
  let targetSubtestCode = $state('');
  let categoryId = $state('');
  let defaultType = $state('SINGLE_CHOICE');
  let defaultDifficulty = $state('MEDIUM');
  let dedupeMode = $state('SKIP');
  let autoDetect = $state(true);

  let categories = $state<Array<{ id: string; path: string }>>([]);

  // ---------------------------------------------------------------- riwayat
  let jobs = $state<ImportJobView[]>([]);
  let jobsLoading = $state(false);
  let jobsError = $state<string | null>(null);

  // ---------------------------------------------------------------- review
  let job = $state<ImportJobView | null>(null);
  let rows = $state<ImportItemView[]>([]);
  let cursor = $state<number | null>(null);
  let hasMore = $state(false);
  let statusFilter = $state<'' | ImportItemStatus>('');

  let active = $state<ImportItemView | null>(null);
  let draftStem = $state('');
  let draftExplanation = $state('');
  let draftOptions = $state<
    Array<{
      label: string;
      contentText: string;
      isCorrect: boolean;
      scoreValue: number;
      dimensionMap?: Record<string, number>;
    }>
  >([]);
  let draftTags = $state('');
  let draftCorrect = $state<string[]>([]);

  let targetStatus = $state<'DRAFT' | 'REVIEW'>('DRAFT');
  let result = $state<ImportCommitResult | null>(null);

  const roleLabel = $derived(session.isSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN');

  const SUBTESTS_BY_STAGE: Record<string, ReadonlyArray<{ code: string; label: string }>> = {
    PSIKOLOGI: [
      { code: 'KECERDASAN', label: 'Kecerdasan' },
      { code: 'KEPRIBADIAN', label: 'Kepribadian' },
      { code: 'KECERMATAN', label: 'Kecermatan' },
      { code: 'PASS_HAND', label: 'Pass Hand' },
    ],
    TPA: [{ code: 'TPA', label: 'TPA' }],
    TPK: [{ code: 'TPK', label: 'TPK' }],
  };

  const subtestOptions = $derived(
    targetStageCode
      ? (SUBTESTS_BY_STAGE[targetStageCode] ?? [])
      : [
          ...(SUBTESTS_BY_STAGE.PSIKOLOGI ?? []),
          ...(SUBTESTS_BY_STAGE.TPA ?? []),
          ...(SUBTESTS_BY_STAGE.TPK ?? []),
        ],
  );

  function onStageChange() {
    if (targetSubtestCode && !subtestOptions.some((item) => item.code === targetSubtestCode)) {
      targetSubtestCode = '';
    }
  }

  function flatten(nodes: CategoryNode[]): Array<{ id: string; path: string }> {
    return nodes.flatMap((node) => [
      { id: node.id, path: node.path },
      ...flatten(node.children ?? []),
    ]);
  }

  onMount(() => {
    void (async () => {
      await session.restore();
      await Promise.all([loadCategories(), loadJobs()]);

      const resumeId = page.url.searchParams.get('job');
      if (resumeId) await openJob(resumeId);
    })();
  });

  async function loadCategories() {
    try {
      const tree = await apiRequest<CategoryNode[]>('/admin/categories?includeEmpty=true', {
        token: session.accessToken,
      });
      categories = flatten(tree);
    } catch {
      // kategori opsional saat impor
    }
  }

  async function loadJobs() {
    jobsLoading = true;
    jobsError = null;
    try {
      const list = await apiRequest<ImportJobListResponse>('/admin/imports?limit=12', {
        token: session.accessToken,
      });
      jobs = list.rows;
    } catch (cause) {
      jobsError = apiErrorMessage(cause);
    } finally {
      jobsLoading = false;
    }
  }

  function isResumable(status: ImportJobStatus): boolean {
    return status === 'PARSED' || status === 'REVIEWING' || status === 'COMMITTING';
  }

  async function openJob(id: string) {
    if (busy) return;
    busy = true;
    error = null;
    notice = null;
    try {
      const found = await apiRequest<ImportJobView>(`/admin/imports/${id}`, {
        token: session.accessToken,
      });
      job = found;
      active = null;
      cursor = null;
      result = null;

      if (isResumable(found.status)) {
        statusFilter = '';
        await loadPreview(true);
        step = 'review';
      } else {
        rows = [];
        step = 'done';
      }
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      busy = false;
    }
  }

  async function downloadTemplate() {
    error = null;
    try {
      const { blob, filename } = await apiDownload('/admin/imports/template.xlsx', {
        token: session.accessToken,
      });
      saveBlob(blob, filename ?? 'template-import-soal.xlsx');
    } catch (cause) {
      error = apiErrorMessage(cause);
    }
  }

  async function upload(event: SubmitEvent) {
    event.preventDefault();
    if (busy || !file) return;

    busy = true;
    error = null;
    notice = null;

    const form = new FormData();
    form.set('file', file);
    if (assets) form.set('assets', assets);
    if (targetStageCode) form.set('targetStageCode', targetStageCode);
    if (targetSubtestCode) form.set('targetSubtestCode', targetSubtestCode);
    if (categoryId) form.set('categoryId', categoryId);
    form.set('defaultType', defaultType);
    form.set('defaultDifficulty', defaultDifficulty);
    form.set('dedupeMode', dedupeMode);
    form.set('autoDetect', autoDetect ? 'true' : 'false');

    try {
      const created = await apiUpload<ImportJobView>('/admin/imports', form, {
        token: session.accessToken,
      });
      job = created;
      await loadPreview(true);
      step = 'review';
      notice = `${created.totalRows} baris terbaca dari ${created.originalName}.`;
      await loadJobs();
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      busy = false;
    }
  }

  async function loadPreview(reset: boolean) {
    if (!job) return;
    const params = new URLSearchParams({ limit: '50' });
    if (statusFilter) params.set('status', statusFilter);
    if (!reset && cursor) params.set('cursor', String(cursor));
    const preview = await apiRequest<ImportPreviewResponse>(
      `/admin/imports/${job.id}/preview?${params.toString()}`,
      { token: session.accessToken },
    );
    rows = reset ? preview.rows : [...rows, ...preview.rows];
    cursor = preview.nextCursor;
    hasMore = preview.hasMore;
    job = preview.job;
  }

  async function reload() {
    busy = true;
    error = null;
    try {
      cursor = null;
      await loadPreview(true);
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      busy = false;
    }
  }

  async function loadMore() {
    if (busy) return;
    busy = true;
    error = null;
    try {
      await loadPreview(false);
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      busy = false;
    }
  }

  function open(item: ImportItemView) {
    const payload = item.payload;
    active = item;
    draftStem = payload?.stemText ?? item.rawText ?? '';
    draftExplanation = payload?.explanation ?? '';
    draftOptions = (payload?.options ?? []).map((option) => ({
      label: option.label,
      contentText: option.contentText ?? '',
      isCorrect: option.isCorrect,
      scoreValue: option.scoreValue ?? 0,
      dimensionMap: option.dimensionMap,
    }));
    draftCorrect = payload?.correctLabels ?? [];
    draftTags = (payload?.tags ?? []).join(', ');
  }

  function syncOptions() {
    draftCorrect = draftOptions.filter((option) => option.isCorrect).map((option) => option.label);
  }

  async function saveActive(skip = false) {
    if (!job || !active || busy) return;
    busy = true;
    error = null;
    try {
      const payload = skip
        ? undefined
        : {
            ...(active.payload ?? {}),
            weight: active.payload?.weight ?? 1,
            stemText: draftStem.trim(),
            explanation: draftExplanation.trim() ? draftExplanation.trim() : null,
            tags: draftTags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean),
            options: draftOptions.map((option, index) => ({
              label: option.label,
              contentText: option.contentText,
              isCorrect: option.isCorrect,
              // Pertahankan skor khusus (mis. Likert) bila sudah ada.
              scoreValue: option.isCorrect ? option.scoreValue || 1 : option.scoreValue || 0,
              dimensionMap: option.dimensionMap,
              sortOrder: index,
            })),
            correctLabels: draftCorrect,
          };

      const updated = await apiRequest<ImportItemView>(
        `/admin/imports/${job.id}/items/${active.id}`,
        { method: 'PATCH', body: skip ? { skip: true } : { payload }, token: session.accessToken },
      );
      rows = rows.map((row) => (row.id === updated.id ? updated : row));
      if (!skip) open(updated);
      notice = skip
        ? `Baris ${updated.rowNumber} dilewati.`
        : `Baris ${updated.rowNumber} disimpan.`;
      await loadPreview(true);
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      busy = false;
    }
  }

  async function commit() {
    if (!job || busy) return;
    if (!confirm('Impor baris yang valid sekarang? Soal tidak akan dipublikasikan otomatis.'))
      return;

    busy = true;
    error = null;
    notice = null;
    try {
      result = await apiRequest<ImportCommitResult>(`/admin/imports/${job.id}/commit`, {
        method: 'POST',
        body: { targetStatus, dedupeMode },
        token: session.accessToken,
      });
      job = result.job;
      step = 'done';
      active = null;
      rows = [];
      await loadJobs();
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      busy = false;
    }
  }

  async function downloadErrors() {
    if (!job) return;
    error = null;
    try {
      const { blob, filename } = await apiDownload(`/admin/imports/${job.id}/errors.csv`, {
        token: session.accessToken,
      });
      saveBlob(blob, filename ?? `import-${job.id}-errors.csv`);
    } catch (cause) {
      error = apiErrorMessage(cause);
    }
  }

  async function cancel() {
    if (!job || busy) return;
    if (!confirm('Batalkan job impor ini?')) return;
    busy = true;
    error = null;
    try {
      job = await apiRequest<ImportJobView>(`/admin/imports/${job.id}/cancel`, {
        method: 'POST',
        token: session.accessToken,
      });
      step = 'upload';
      rows = [];
      active = null;
      await loadJobs();
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      busy = false;
    }
  }

  function reset() {
    step = 'upload';
    job = null;
    rows = [];
    cursor = null;
    hasMore = false;
    active = null;
    result = null;
    file = null;
    assets = null;
    notice = null;
    void loadJobs();
    if (page.url.searchParams.has('job')) {
      void goto(`${adminBase()}/questions/import`, { replaceState: true });
    }
  }

  const tone = (value: string) =>
    value === 'VALID' || value === 'IMPORTED'
      ? 'success'
      : value === 'DUPLICATE'
        ? 'warning'
        : value === 'INVALID'
          ? 'danger'
          : 'neutral';

  const jobTone = (value: ImportJobStatus) =>
    value === 'COMPLETED'
      ? 'success'
      : value === 'FAILED' || value === 'CANCELLED'
        ? 'danger'
        : value === 'PARSED' || value === 'REVIEWING' || value === 'COMMITTING'
          ? 'warning'
          : 'neutral';

  const JOB_STATUS_LABELS: Record<ImportJobStatus, string> = {
    UPLOADED: 'Menunggu',
    PARSING: 'Mengurai',
    PARSED: 'Siap review',
    REVIEWING: 'Review',
    COMMITTING: 'Menyimpan',
    COMPLETED: 'Selesai',
    FAILED: 'Gagal',
    CANCELLED: 'Dibatalkan',
  };

  const counts = $derived.by(() => {
    const base = { total: 0, valid: 0, invalid: 0, duplicate: 0, skipped: 0, imported: 0 };
    if (job) {
      return {
        ...base,
        ...job.stats,
        total: job.stats.total || job.totalRows,
      };
    }
    for (const row of rows) {
      base.total += 1;
      if (row.status === 'INVALID') base.invalid += 1;
      else if (row.status === 'DUPLICATE') base.duplicate += 1;
      else if (row.status === 'SKIPPED') base.skipped += 1;
      else if (row.status === 'IMPORTED') base.imported += 1;
      else base.valid += 1;
    }
    return base;
  });
</script>

<svelte:head>
  <title>Impor Soal — Admin Web CAT</title>
</svelte:head>

<div class="adm-page">
  <AdminPageHeader
    title="Impor soal"
    eyebrow={`Panel ${roleLabel}`}
    description={session.isSuperAdmin
      ? 'Unggah XLSX/CSV, PDF, atau DOCX. Anda melihat job impor dari semua admin. Hasil impor maksimal berstatus Review — tidak ada publikasi otomatis.'
      : 'Unggah XLSX/CSV, PDF, atau DOCX. Anda melihat job impor milik Anda sendiri. Hasil impor maksimal berstatus Review — tidak ada publikasi otomatis.'}
  >
    {#snippet actions()}
      <Button variant="secondary" href={`${adminBase()}/questions`}>Kembali</Button>
      {#if session.can('audit.read')}
        <Button variant="ghost" href={`${adminBase()}/audit?entityType=import_job`}>Audit impor</Button>
      {/if}
      <Button variant="ghost" onclick={downloadTemplate}>Unduh template</Button>
    {/snippet}
  </AdminPageHeader>

  {#if error}
    <Alert tone="danger" title="Impor gagal">{error}</Alert>
  {/if}
  {#if notice}
    <Alert tone="success">{notice}</Alert>
  {/if}

  {#if step === 'upload'}
    <Card title="1. Unggah berkas" description="Maksimal 10 MB untuk berkas utama.">
      <form class="form" onsubmit={upload}>
        <Field
          label="Berkas soal"
          for="import-file"
          required
          hint="XLSX, CSV, PDF, atau DOCX. Format .doc lama harus disimpan ulang sebagai .docx."
        >
          <input
            id="import-file"
            class="file"
            type="file"
            accept=".xlsx,.csv,.pdf,.docx"
            onchange={(event) => {
              file = event.currentTarget.files?.[0] ?? null;
            }}
            required
          />
        </Field>

        <Field
          label="Arsip gambar (opsional)"
          for="import-assets"
          hint="ZIP berisi gambar yang dirujuk kolom image_stem_1 / image_opt_a."
        >
          <input
            id="import-assets"
            class="file"
            type="file"
            accept=".zip"
            onchange={(event) => {
              assets = event.currentTarget.files?.[0] ?? null;
            }}
          />
        </Field>

        <div class="grid">
          <Field label="Stage tujuan" for="import-stage">
            <select
              id="import-stage"
              class="select"
              bind:value={targetStageCode}
              onchange={onStageChange}
            >
              <option value="">Deteksi otomatis</option>
              <option value="PSIKOLOGI">Psikologi</option>
              <option value="TPA">TPA</option>
              <option value="TPK">TPK</option>
            </select>
          </Field>

          <Field label="Subtes tujuan" for="import-subtest">
            <select id="import-subtest" class="select" bind:value={targetSubtestCode}>
              <option value="">Deteksi otomatis</option>
              {#each subtestOptions as item (item.code)}
                <option value={item.code}>{item.label}</option>
              {/each}
            </select>
          </Field>

          <Field
            label="Kategori"
            for="import-category"
            hint="Dipakai bila berkas tidak memuat kategori."
          >
            <select id="import-category" class="select" bind:value={categoryId}>
              <option value="">Tanpa kategori</option>
              {#each categories as category (category.id)}
                <option value={category.id}>{category.path}</option>
              {/each}
            </select>
          </Field>

          <Field label="Tipe default" for="import-type">
            <select id="import-type" class="select" bind:value={defaultType}>
              <option value="SINGLE_CHOICE">Pilihan tunggal</option>
              <option value="MULTI_CHOICE">Pilihan ganda</option>
              <option value="IMAGE_CHOICE">Pilihan gambar</option>
              <option value="LIKERT_STATEMENT">Likert</option>
              <option value="MISSING_ELEMENT">Elemen hilang</option>
              <option value="PASS_HAND_COLUMN">Pass Hand</option>
            </select>
          </Field>

          <Field label="Kesulitan default" for="import-difficulty">
            <select id="import-difficulty" class="select" bind:value={defaultDifficulty}>
              <option value="EASY">Mudah</option>
              <option value="MEDIUM">Sedang</option>
              <option value="HARD">Sulit</option>
            </select>
          </Field>

          <Field label="Mode duplikat" for="import-dedupe">
            <select id="import-dedupe" class="select" bind:value={dedupeMode}>
              <option value="SKIP">Lewati duplikat</option>
              <option value="WARN">Impor dengan peringatan</option>
              {#if session.isSuperAdmin}
                <option value="OVERRIDE">Izinkan duplikat (SUPER_ADMIN)</option>
              {/if}
            </select>
          </Field>
        </div>

        <label class="check">
          <input type="checkbox" bind:checked={autoDetect} />
          Deteksi otomatis stage/subtes dari isi berkas
        </label>

        <div class="form__actions">
          <Button type="submit" loading={busy} disabled={!file}>Unggah dan urai</Button>
        </div>
      </form>
    </Card>

    <Card
      title="Riwayat impor"
      description={session.isSuperAdmin
        ? 'Semua job impor dari seluruh admin, terbaru lebih dulu.'
        : 'Job impor yang Anda buat, terbaru lebih dulu.'}
    >
      <div class="history__head">
        <p class="muted">
          {session.isSuperAdmin
            ? 'Anda dapat melanjutkan review atau membuka hasil job milik admin lain.'
            : 'Job milik admin lain tidak ditampilkan di panel ADMIN.'}
        </p>
        <Button size="sm" variant="ghost" loading={jobsLoading} onclick={() => void loadJobs()}>
          Muat ulang
        </Button>
      </div>

      {#if jobsError}
        <Alert tone="warning" title="Gagal memuat riwayat">{jobsError}</Alert>
      {:else if jobsLoading && jobs.length === 0}
        <div class="center"><Spinner size={20} label="Memuat riwayat impor" /></div>
      {:else if jobs.length === 0}
        <p class="muted">Belum ada job impor. Unggah berkas untuk memulai.</p>
      {:else}
        <ul class="history">
          {#each jobs as entry (entry.id)}
            <li class="history__row">
              <div class="history__main">
                <p class="history__name">{entry.originalName}</p>
                <p class="history__meta">
                  {entry.totalRows} baris · {formatDateTime(entry.createdAt)}
                  {#if session.isSuperAdmin && entry.adminEmail}
                    · {entry.adminEmail}
                  {/if}
                </p>
              </div>
              <Badge tone={jobTone(entry.status)}>{JOB_STATUS_LABELS[entry.status]}</Badge>
              <div class="history__actions">
                {#if isResumable(entry.status)}
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busy}
                    onclick={() => void openJob(entry.id)}
                  >
                    Lanjutkan review
                  </Button>
                {:else}
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={busy}
                    onclick={() => void openJob(entry.id)}
                  >
                    Lihat detail
                  </Button>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </Card>
  {:else if step === 'review' && job}
    <div class="summary">
      <div class="summary__head">
        <div>
          <h2 class="summary__title">{job.originalName}</h2>
          <p class="muted">
            {job.totalRows} baris · {job.sourceKind} · {JOB_STATUS_LABELS[job.status]}
            {#if session.isSuperAdmin && job.adminEmail}
              · diunggah oleh {job.adminEmail}
            {/if}
          </p>
        </div>
        <div class="summary__actions">
          <select class="select" bind:value={targetStatus} aria-label="Status hasil impor">
            <option value="DRAFT">Simpan sebagai Draf</option>
            <option value="REVIEW">Simpan sebagai Review</option>
          </select>
          <Button variant="success" loading={busy} onclick={commit}>Impor baris valid</Button>
          <Button variant="ghost" loading={busy} onclick={cancel}>Batalkan</Button>
        </div>
      </div>

      <div class="chips">
        <span class="chip chip--ok">Valid {counts.valid}</span>
        <span class="chip chip--warn">Duplikat {counts.duplicate}</span>
        <span class="chip chip--bad">Invalid {counts.invalid}</span>
        <span class="chip chip--muted">Dilewati {counts.skipped}</span>
      </div>

      {#if job.warnings.length > 0}
        <Alert tone="warning" title="Catatan ekstraksi berkas">
          <ul class="issues">
            {#each job.warnings as warning, index (index)}
              <li>{warning}</li>
            {/each}
          </ul>
        </Alert>
      {/if}
    </div>

    <div class="review">
      <Card
        title="2. Review baris"
        description="Perbaiki teks lalu simpan. Klik baris untuk mengedit."
      >
        <div class="filter-row">
          <select
            class="select"
            bind:value={statusFilter}
            onchange={() => void reload()}
            aria-label="Filter status baris"
          >
            <option value="">Semua status</option>
            <option value="VALID">Valid</option>
            <option value="DUPLICATE">Duplikat</option>
            <option value="INVALID">Invalid</option>
            <option value="SKIPPED">Dilewati</option>
          </select>
        </div>

        {#if rows.length === 0}
          <p class="muted">Tidak ada baris pada filter ini.</p>
        {:else}
          <ul class="rows">
            {#each rows as row (row.id)}
              <li>
                <button
                  type="button"
                  class="row"
                  class:row--active={active?.id === row.id}
                  onclick={() => open(row)}
                >
                  <span class="row__num">#{row.rowNumber}</span>
                  <Badge tone={tone(row.status)}>{row.status}</Badge>
                  <span class="row__stem">{row.payload?.stemText ?? row.rawText ?? '—'}</span>
                  {#if row.issues.length > 0}
                    <span class="row__issues">{row.issues[0]}</span>
                  {/if}
                </button>
              </li>
            {/each}
          </ul>

          {#if hasMore}
            <div class="more">
              <Button variant="secondary" loading={busy} onclick={() => void loadMore()}>
                Muat lebih banyak
              </Button>
            </div>
          {/if}
        {/if}
      </Card>

      <Card title="3. Sunting baris">
        {#if active}
          <form
            class="form"
            onsubmit={(event) => {
              event.preventDefault();
              void saveActive(false);
            }}
          >
            <Field label={`Teks soal (#${active.rowNumber})`} for="edit-stem" required>
              <textarea id="edit-stem" class="textarea" rows="5" bind:value={draftStem}></textarea>
            </Field>

            <Field label="Pembahasan" for="edit-explanation">
              <textarea
                id="edit-explanation"
                class="textarea"
                rows="3"
                bind:value={draftExplanation}
              ></textarea>
            </Field>

            <div class="options">
              {#each draftOptions as option, index (option.label)}
                <div class="option">
                  <label class="option__label">
                    <input
                      type="checkbox"
                      checked={option.isCorrect}
                      onchange={() => {
                        option.isCorrect = !option.isCorrect;
                        syncOptions();
                      }}
                    />
                    {option.label}
                  </label>
                  <input
                    class="option__text"
                    bind:value={option.contentText}
                    aria-label={`Teks opsi ${option.label}`}
                    placeholder={`Teks opsi ${option.label}`}
                  />
                  <button
                    type="button"
                    class="link link--danger"
                    onclick={() => {
                      draftOptions = draftOptions.filter((_, i) => i !== index);
                      syncOptions();
                    }}
                  >
                    Hapus
                  </button>
                </div>
              {/each}

              {#if draftOptions.length < 10}
                <Button
                  size="sm"
                  variant="ghost"
                  onclick={() => {
                    const next = String.fromCharCode(65 + draftOptions.length);
                    draftOptions = [
                      ...draftOptions,
                      { label: next, contentText: '', isCorrect: false, scoreValue: 0 },
                    ];
                  }}
                >
                  Tambah opsi
                </Button>
              {/if}
            </div>

            <Field label="Tag" for="edit-tags" hint="Pisahkan dengan koma.">
              <Input id="edit-tags" bind:value={draftTags} />
            </Field>

            {#if active.issues.length > 0}
              <Alert tone="warning" title="Catatan validator">
                <ul class="issues">
                  {#each active.issues as issue, index (index)}
                    <li>{issue}</li>
                  {/each}
                </ul>
              </Alert>
            {/if}

            <div class="form__actions">
              <Button type="submit" loading={busy}>Simpan baris</Button>
              <Button variant="secondary" loading={busy} onclick={() => void saveActive(true)}>
                Lewati baris
              </Button>
            </div>
          </form>
        {:else}
          <p class="muted">Pilih salah satu baris di kiri untuk mulai mengedit.</p>
        {/if}
      </Card>
    </div>
  {:else if step === 'done' && job}
    <Card
      title="Ringkasan impor"
      description={`Job ${job.originalName} — ${JOB_STATUS_LABELS[job.status]}.`}
    >
      <div class="result">
        <p><strong>{result?.created ?? job.stats.imported}</strong> soal dibuat</p>
        <p><strong>{result?.skipped ?? job.stats.skipped}</strong> baris dilewati</p>
        <p>
          <strong>{result?.failed ?? job.stats.invalid + job.stats.duplicate}</strong>
          baris gagal
        </p>
      </div>

      {#if result && result.errors.length > 0}
        <div class="errors">
          <h3 class="errors__title">Kesalahan</h3>
          <ul class="issues">
            {#each result.errors as entry (entry.rowNumber + entry.code)}
              <li>Baris {entry.rowNumber}: {entry.code} — {entry.message}</li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if job.warnings.length > 0}
        <Alert tone="warning" title="Catatan proses">
          <ul class="issues">
            {#each job.warnings as warning, index (index)}
              <li>{warning}</li>
            {/each}
          </ul>
        </Alert>
      {/if}

      <div class="form__actions">
        <Button href={`${adminBase()}/questions?sourceImportId=${job.id}`}>
          Lihat soal hasil impor ini
        </Button>
        <Button variant="secondary" href={`${adminBase()}/media`}>Media hasil ekstraksi</Button>
        <Button variant="secondary" onclick={downloadErrors}>Unduh errors.csv</Button>
        <Button variant="ghost" onclick={reset}>Impor lagi</Button>
      </div>
    </Card>
  {:else}
    <div class="center"><Spinner size={26} label="Memuat impor" /></div>
  {/if}
</div>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .form__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .grid {
    display: grid;
    gap: var(--space-4);
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .file {
    width: 100%;
    font-size: var(--text-sm);
  }

  .select,
  .textarea {
    width: 100%;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font-size: var(--text-sm);
    font-family: inherit;
  }

  .textarea {
    resize: vertical;
  }

  .check {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
  }

  .summary {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
  }

  .summary__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .summary__title {
    font-size: var(--text-lg);
    word-break: break-word;
  }

  .summary__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .chip {
    font-size: var(--text-xs);
    padding: 2px 8px;
    border-radius: var(--radius-full);
    background: var(--color-surface-muted);
  }

  .chip--ok {
    background: color-mix(in srgb, var(--color-success) 16%, transparent);
    color: var(--color-success);
  }

  .chip--warn {
    background: color-mix(in srgb, var(--color-warning, #d69e2e) 18%, transparent);
    color: var(--color-warning, #a16207);
  }

  .chip--bad {
    background: color-mix(in srgb, var(--color-danger) 14%, transparent);
    color: var(--color-danger);
  }

  .review {
    display: grid;
    gap: var(--space-5);
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
  }

  @media (min-width: 1100px) {
    .review {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
  }

  .filter-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: var(--space-3);
  }

  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    max-height: 540px;
    overflow-y: auto;
  }

  .row {
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr);
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-2);
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    background: none;
    text-align: left;
    cursor: pointer;
  }

  .row:hover {
    background: var(--color-surface-muted);
  }

  .row--active {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 6%, transparent);
  }

  .row__num {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .row__stem {
    font-size: var(--text-sm);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .row__issues {
    grid-column: 1 / -1;
    font-size: 11px;
    color: var(--color-danger);
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .option {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .option__label {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-weight: 600;
    font-size: var(--text-sm);
    min-width: 52px;
  }

  .option__text {
    flex: 1;
    padding: 0.45rem 0.6rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font-size: var(--text-sm);
  }

  .link {
    border: 0;
    background: none;
    padding: 0;
    color: var(--color-primary);
    font-weight: 600;
    cursor: pointer;
    font-size: var(--text-xs);
  }

  .link--danger {
    color: var(--color-danger);
  }

  .issues {
    margin: 0;
    padding-left: 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: var(--text-xs);
  }

  .result {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-5);
    margin-bottom: var(--space-4);
  }

  .errors {
    margin-bottom: var(--space-4);
  }

  .errors__title {
    font-size: var(--text-sm);
    margin-bottom: var(--space-2);
  }

  .more {
    display: flex;
    justify-content: center;
    padding-top: var(--space-3);
  }

  .center {
    display: grid;
    place-items: center;
    padding-block: var(--space-12);
  }

  .history__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }

  .history {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .history__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .history__main {
    flex: 1 1 220px;
    min-width: 0;
  }

  .history__name {
    font-weight: 600;
    font-size: var(--text-sm);
    word-break: break-word;
  }

  .history__meta {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .history__actions {
    margin-left: auto;
  }
</style>
