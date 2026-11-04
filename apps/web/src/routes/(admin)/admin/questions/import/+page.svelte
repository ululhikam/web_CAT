<script lang="ts">
  import { onMount } from 'svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Field from '@webcat/ui/components/Field.svelte';
  import Input from '@webcat/ui/components/Input.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiDownload, apiErrorMessage, apiRequest, apiUpload, saveBlob } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import type {
    CategoryNode,
    ImportCommitResult,
    ImportItemStatus,
    ImportItemView,
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

  // ---------------------------------------------------------------- review
  let job = $state<ImportJobView | null>(null);
  let rows = $state<ImportItemView[]>([]);
  let cursor = $state<number | null>(null);
  let hasMore = $state(false);
  let statusFilter = $state<'' | ImportItemStatus>('');

  let active = $state<ImportItemView | null>(null);
  let draftStem = $state('');
  let draftExplanation = $state('');
  let draftOptions = $state<Array<{ label: string; contentText: string; isCorrect: boolean }>>([]);
  let draftTags = $state('');
  let draftCorrect = $state<string[]>([]);

  let targetStatus = $state<'DRAFT' | 'REVIEW'>('DRAFT');
  let result = $state<ImportCommitResult | null>(null);

  function flatten(nodes: CategoryNode[]): Array<{ id: string; path: string }> {
    return nodes.flatMap((node) => [
      { id: node.id, path: node.path },
      ...flatten(node.children ?? []),
    ]);
  }

  onMount(() => {
    void (async () => {
      try {
        const tree = await apiRequest<CategoryNode[]>('/admin/categories?includeEmpty=true', {
          token: session.accessToken,
        });
        categories = flatten(tree);
      } catch {
        // kategori opsional saat impor
      }
    })();
  });

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
              scoreValue: option.isCorrect ? 1 : 0,
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
      notice = skip ? `Baris ${updated.rowNumber} dilewati.` : `Baris ${updated.rowNumber} disimpan.`;
      await loadPreview(true);
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      busy = false;
    }
  }

  async function commit() {
    if (!job || busy) return;
    if (!confirm('Impor baris yang valid sekarang? Soal tidak akan dipublikasikan otomatis.')) return;

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
  }

  const tone = (value: string) =>
    value === 'VALID' || value === 'IMPORTED'
      ? 'success'
      : value === 'DUPLICATE'
        ? 'warning'
        : value === 'INVALID'
          ? 'danger'
          : 'neutral';

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

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">Impor soal</h1>
      <p class="muted">
        Unggah XLSX/CSV, PDF, atau DOCX. Hasil impor maksimal berstatus Review — tidak ada
        publikasi otomatis.
      </p>
    </div>
    <div class="header-actions">
      <Button variant="secondary" href="/admin/questions">Kembali</Button>
      <Button variant="ghost" onclick={downloadTemplate}>Unduh template</Button>
    </div>
  </header>

  {#if error}
    <Alert tone="danger" title="Impor gagal">{error}</Alert>
  {/if}
  {#if notice}
    <Alert tone="success">{notice}</Alert>
  {/if}

  {#if step === 'upload'}
    <Card title="1. Unggah berkas" description="Maksimal 10 MB untuk berkas utama.">
      <form class="form" onsubmit={upload}>
        <Field label="Berkas soal" for="import-file" required hint="XLSX, CSV, PDF, atau DOCX">
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
            <select id="import-stage" class="select" bind:value={targetStageCode}>
              <option value="">Deteksi otomatis</option>
              <option value="PSIKOLOGI">Psikologi</option>
              <option value="TPA">TPA</option>
              <option value="TPK">TPK</option>
            </select>
          </Field>

          <Field label="Subtes tujuan" for="import-subtest">
            <select id="import-subtest" class="select" bind:value={targetSubtestCode}>
              <option value="">Deteksi otomatis</option>
              <option value="KECERDASAN">Kecerdasan</option>
              <option value="KEPRIBADIAN">Kepribadian</option>
              <option value="KECERMATAN">Kecermatan</option>
              <option value="PASS_HAND">Pass Hand</option>
              <option value="TPA">TPA</option>
              <option value="TPK">TPK</option>
            </select>
          </Field>

          <Field label="Kategori" for="import-category" hint="Dipakai bila berkas tidak memuat kategori.">
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
              <option value="WARN">Tandai peringatan</option>
              <option value="OVERRIDE">Izinkan duplikat</option>
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
  {:else if step === 'review' && job}
    <div class="summary">
      <div class="summary__head">
        <div>
          <h2 class="summary__title">{job.originalName}</h2>
          <p class="muted">
            {job.totalRows} baris · {job.sourceKind} · status {job.status}
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
    </div>

    <div class="review">
      <Card title="2. Review baris" description="Perbaiki teks lalu simpan. Klik baris untuk mengedit.">
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
              <textarea id="edit-explanation" class="textarea" rows="3" bind:value={draftExplanation}
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
                      { label: next, contentText: '', isCorrect: false },
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
  {:else if step === 'done' && result}
    <Card title="Impor selesai">
      <div class="result">
        <p><strong>{result.created}</strong> soal dibuat</p>
        <p><strong>{result.skipped}</strong> baris dilewati</p>
        <p><strong>{result.failed}</strong> baris gagal</p>
      </div>

      {#if result.errors.length > 0}
        <div class="errors">
          <h3 class="errors__title">Kesalahan</h3>
          <ul class="issues">
            {#each result.errors as entry (entry.rowNumber + entry.code)}
              <li>Baris {entry.rowNumber}: {entry.code} — {entry.message}</li>
            {/each}
          </ul>
        </div>
      {/if}

      <div class="form__actions">
        <Button href="/admin/questions">Lihat bank soal</Button>
        <Button variant="secondary" onclick={downloadErrors}>Unduh errors.csv</Button>
        <Button variant="ghost" onclick={reset}>Impor lagi</Button>
      </div>
    </Card>
  {:else}
    <div class="center"><Spinner size={26} label="Memuat impor" /></div>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .page__header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .page__title {
    font-size: var(--text-2xl);
  }

  .header-actions {
    display: flex;
    gap: var(--space-2);
  }

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
</style>
