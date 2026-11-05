<script lang="ts">
  import { onMount } from 'svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import AdminPageHeader from '$lib/components/admin/AdminPageHeader.svelte';
  import { apiErrorMessage, apiRequest, apiUpload } from '$lib/api/client';
  import { adminBase } from '$lib/panel-route';
  import { session } from '$lib/stores/session.svelte';
  import {
    applyResultLines,
    applySuggestions,
    buildDraftRows,
    canApply,
    draftIssues,
    formatBytes,
    mappingRowsFromDraft,
    mergeQuestions,
    selectQuestion,
    statusLabel,
    statusTone,
    suggestedCodes,
    summarizeDraft,
    type MediaZipDraftRow,
  } from '$lib/admin/media-zip-draft';
  import {
    MEDIA_ZIP_EXTENSIONS,
    MEDIA_ZIP_MAX_BYTES,
    MEDIA_ZIP_MAX_ENTRIES,
    type MediaRole,
    type MediaZipApplyResult,
    type MediaZipFile,
    type MediaZipPreviewResponse,
    type MediaZipQuestionRef,
  } from '@webcat/contracts';

  /**
   * F5-14 — layar pemetaan ZIP gambar.
   *
   * Tiga tahap: unggah → petakan → ringkasan. Arsip tetap dipegang di memori
   * setelah pratinjau sehingga tombol "Terapkan" tidak perlu mengunggah ulang;
   * server tetap memvalidasi sendiri karena laporan pratinjau bukan otoritas.
   */

  type Step = 'upload' | 'mapping' | 'done';

  const ROLE_LABELS: Record<MediaRole, string> = {
    STEM: 'Gambar soal',
    OPTION: 'Gambar opsi',
    EXPLANATION: 'Gambar pembahasan',
  };

  const ROLES: MediaRole[] = ['STEM', 'OPTION', 'EXPLANATION'];

  let step = $state<Step>('upload');
  let busy = $state(false);
  let error = $state<string | null>(null);
  let notice = $state<string | null>(null);

  let archive = $state<File | null>(null);
  let preview = $state<MediaZipPreviewResponse | null>(null);
  let files = $state<MediaZipFile[]>([]);
  let rows = $state<MediaZipDraftRow[]>([]);
  let result = $state<MediaZipApplyResult | null>(null);

  let candidates = $state<MediaZipQuestionRef[]>([]);
  let searchQuery = $state('');
  let searching = $state(false);

  const summary = $derived(summarizeDraft(rows));
  const issues = $derived(draftIssues(rows, files, candidates));
  const ready = $derived(canApply(rows, files, candidates));
  const canWrite = $derived(session.can('questions.import'));

  const limits = $derived({
    megabytes: Math.round(MEDIA_ZIP_MAX_BYTES / (1024 * 1024)),
    perFile: 5,
    entries: MEDIA_ZIP_MAX_ENTRIES,
    formats: MEDIA_ZIP_EXTENSIONS.join(', ').toUpperCase(),
  });

  onMount(() => {
    void session.restore();
  });

  function reset() {
    step = 'upload';
    archive = null;
    preview = null;
    files = [];
    rows = [];
    result = null;
    error = null;
    notice = null;
    searchQuery = '';
  }

  function patchRow(index: number, patch: Partial<MediaZipDraftRow>) {
    rows = rows.map((row, position) => (position === index ? { ...row, ...patch } : row));
  }

  /** Ganti peran: label opsi hanya relevan untuk peran OPTION. */
  function changeRole(index: number, role: MediaRole) {
    const row = rows[index];
    if (!row) return;
    patchRow(index, { role, optionLabel: role === 'OPTION' ? row.optionLabel : '' });
  }

  /** Pilih soal lewat daftar kandidat; label opsi ikut disegarkan. */
  function pickQuestion(index: number, questionId: string) {
    const row = rows[index];
    if (!row) return;

    if (!questionId) {
      patchRow(index, { questionId: '', publicCode: '', optionLabels: [] });
      return;
    }

    const question = candidates.find((item) => item.id === questionId);
    if (question) rows = rows.map((item, i) => (i === index ? selectQuestion(item, question) : item));
  }

  /**
   * Isi target dari kode soal yang ditulis manual (mis. `FIG-016`).
   *
   * Kode yang belum pernah dimuat lewat pencarian tetap dicoba diresolusi ke
   * server: admin biasanya menyalin kode langsung dari spreadsheet, dan tanpa
   * ini validasi klien akan menandainya "tidak ditemukan" hanya karena
   * kandidatnya belum ada di daftar.
   */
  async function setPublicCode(index: number, value: string) {
    const code = value.trim().toUpperCase();
    const match = candidates.find((item) => item.publicCode.toUpperCase() === code);

    if (match) {
      rows = rows.map((item, i) => (i === index ? selectQuestion(item, match) : item));
      return;
    }

    patchRow(index, { questionId: '', publicCode: code, optionLabels: [] });
    if (!code) return;

    try {
      const found = await apiRequest<MediaZipQuestionRef[]>(
        '/admin/media/import/questions/resolve',
        {
          method: 'POST',
          body: { codes: [code] },
          token: session.accessToken,
        },
      );
      if (found.length === 0) return;

      candidates = mergeQuestions(candidates, found);
      rows = rows.map((item, i) =>
        i === index && item.publicCode === code ? selectQuestion(item, found[0]!) : item,
      );
    } catch {
      // Pencarian manual tetap tersedia; kegagalan di sini hanya membuat kode
      // belum tervalidasi, bukan menggagalkan pemetaan.
    }
  }

  async function loadQuestions(query: string) {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      candidates = [];
      return;
    }

    searching = true;
    try {
      const found = await apiRequest<MediaZipQuestionRef[]>(
        `/admin/media/import/questions?q=${encodeURIComponent(trimmed)}`,
        { token: session.accessToken, cacheTtlMs: 0 },
      );

      // Gabungkan agar soal yang sudah dipilih tidak hilang dari daftar saat
      // admin mencari soal lain untuk baris berikutnya.
      candidates = mergeQuestions(candidates, found);
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      searching = false;
    }
  }

  async function onFileChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || busy) return;

    busy = true;
    error = null;
    notice = null;

    const form = new FormData();
    form.set('file', file);

    try {
      const scan = await apiUpload<MediaZipPreviewResponse>('/admin/media/import/preview', form, {
        token: session.accessToken,
      });
      archive = file;
      preview = scan;
      files = scan.files;
      rows = buildDraftRows(scan.files);
      step = 'mapping';

      if (scan.summary.unsupported > 0 || scan.summary.tooLarge > 0) {
        notice = 'Sebagian berkas tidak bisa diimpor; lihat status di tabel.';
      }

      await resolveSuggested();
    } catch (cause) {
      error = apiErrorMessage(cause);
      reset();
    } finally {
      busy = false;
      input.value = '';
    }
  }

  /**
   * Muat soal yang namanya tersirat dari nama berkas, lalu isi target otomatis.
   *
   * Satu permintaan batch: `fig-001`, `fig-002`, … bisa puluhan kode. Kode yang
   * tidak ditemukan cukup tidak muncul di daftar kandidat; admin tetap bisa
   * mencarinya manual.
   */
  async function resolveSuggested() {
    const codes = suggestedCodes(rows).filter((code) => code.length <= 60);
    if (codes.length === 0) return;

    try {
      const found = await apiRequest<MediaZipQuestionRef[]>(
        '/admin/media/import/questions/resolve',
        {
          method: 'POST',
          body: { codes: codes.slice(0, MEDIA_ZIP_MAX_ENTRIES) },
          token: session.accessToken,
        },
      );

      candidates = mergeQuestions(candidates, found);
      if (candidates.length > 0) rows = applySuggestions(rows, candidates);
    } catch {
      // Saran bersifat kenyamanan; kegagalan lookup tidak boleh menggagalkan
      // pratinjau. Admin memetakan manual lewat pencarian.
    }
  }

  /** Cocokkan semua baris dengan kandidat yang sudah dimuat. */
  function fillSuggestions() {
    rows = applySuggestions(rows, candidates);
  }

  async function applyMappings() {
    if (!archive || busy || !ready) return;

    busy = true;
    error = null;
    notice = null;

    const form = new FormData();
    form.set('file', archive);
    form.set('mapping', JSON.stringify({ mappings: mappingRowsFromDraft(rows) }));

    try {
      result = await apiUpload<MediaZipApplyResult>('/admin/media/import/apply', form, {
        token: session.accessToken,
      });
      step = 'done';
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      busy = false;
    }
  }

  function draftRowsFor(index: number): MediaZipDraftRow | undefined {
    return rows[index];
  }
  /** Kandidat yang cocok dengan saran slug baris ini. */
  function suggestionsFor(index: number): MediaZipQuestionRef[] {
    const row = draftRowsFor(index);
    if (!row) return [];
    const slug = row.suggestion.slug.toUpperCase();
    return candidates.filter((item) => item.publicCode.toUpperCase() === slug);
  }
</script>

<svelte:head>
  <title>Impor ZIP gambar — Admin TES CAT</title>
</svelte:head>

<div class="adm-page">
  <AdminPageHeader
    title="Impor ZIP gambar"
    description="Unggah satu ZIP berisi gambar, lalu petakan setiap berkas ke soal, opsi, atau pembahasan. Tidak ada soal baru yang dibuat."
  >
    {#snippet actions()}
      {#if step !== 'upload'}
        <Button variant="secondary" onclick={reset} disabled={busy}>Impor arsip lain</Button>
      {/if}
    {/snippet}
  </AdminPageHeader>

  {#if error}
    <Alert tone="danger" title="Gagal memproses impor">{error}</Alert>
  {/if}
  {#if notice}
    <Alert tone="info">{notice}</Alert>
  {/if}
  {#if !canWrite}
    <Alert tone="warning" title="Izin kurang">
      Akun ini tidak punya izin <code>questions.import</code>. Hubungi super admin.
    </Alert>
  {/if}

  {#if step === 'upload'}
    <Card title="Berkas arsip">
      <div class="stack">
        <p class="adm-muted">
          Format gambar: {limits.formats}. Maksimal {limits.entries} berkas per arsip,
          {limits.megabytes} MB total, dan {limits.perFile} MB per gambar. Metadata sistem
          (<code>__MACOSX</code>, <code>.DS_Store</code>) diabaikan otomatis.
        </p>

        <label class="picker" class:is-busy={busy || !canWrite}>
          <input
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            class="picker__input"
            onchange={onFileChange}
            disabled={busy || !canWrite}
          />
          <span class="picker__label">
            {busy ? 'Memindai arsip…' : 'Pilih berkas ZIP'}
          </span>
        </label>

        {#if busy}
          <div class="adm-center"><Spinner size={24} label="Memindai arsip" /></div>
        {/if}
      </div>
    </Card>
  {:else if step === 'mapping' && preview}
    <Card title="Ringkasan arsip">
      <div class="stats">
        <span><strong>{preview.archiveName}</strong></span>
        <span>{preview.totalEntries} berkas</span>
        <span>{summary.importable} siap dipetakan</span>
        <span>{summary.mapped} sudah dipetakan</span>
        {#if summary.missingTarget > 0}
          <span class="stat--warn">{summary.missingTarget} belum bertarget</span>
        {/if}
        {#if summary.missingOptionLabel > 0}
          <span class="stat--warn">{summary.missingOptionLabel} opsi tanpa label</span>
        {/if}
      </div>

      {#if preview.issues.length > 0}
        <ul class="issues">
          {#each preview.issues as issue (issue.code + (issue.fileName ?? ''))}
            <li>{issue.message}</li>
          {/each}
        </ul>
      {/if}
    </Card>

    <Card title="Cari soal">
      <div class="stack">
        <form
          class="search"
          onsubmit={(event) => {
            event.preventDefault();
            void loadQuestions(searchQuery);
          }}
        >
          <input
            class="adm-input adm-input--grow"
            type="search"
            placeholder="Kode soal atau potongan teks, mis. FIG-016"
            bind:value={searchQuery}
            aria-label="Cari soal"
          />
          <Button type="submit" variant="secondary" disabled={searching}>
            {searching ? 'Mencari…' : 'Cari'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onclick={fillSuggestions}
            disabled={candidates.length === 0}
          >
            Isi otomatis dari nama berkas
          </Button>
        </form>
        <p class="hint">
          {#if candidates.length === 0}
            Belum ada kandidat soal. Cari minimal dua karakter untuk mulai memetakan.
          {:else}
            {candidates.length} soal tersedia sebagai pilihan target.
          {/if}
        </p>
      </div>
    </Card>

    <Card title="Petakan berkas">
      <div class="adm-scroll">
        <table class="adm-table">
          <thead>
            <tr>
              <th>Berkas</th>
              <th>Status</th>
              <th>Soal tujuan</th>
              <th>Peran</th>
              <th>Label opsi</th>
            </tr>
          </thead>
          <tbody>
            {#each rows as row, index (row.archivePath)}
              <tr class:row--blocked={row.status !== 'OK'}>
                <td>
                  <p class="file">{row.fileName}</p>
                  <p class="file__meta">{formatBytes(row.sizeBytes)}</p>
                  {#if row.message}
                    <p class="file__meta file__meta--warn">{row.message}</p>
                  {/if}
                </td>
                <td>
                  <Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge>
                </td>
                <td>
                  {#if row.status === 'OK'}
                    <select
                      class="adm-select"
                      aria-label={`Soal tujuan untuk ${row.fileName}`}
                      value={row.questionId}
                      onchange={(event) => pickQuestion(index, event.currentTarget.value)}
                    >
                      <option value="">— belum dipilih —</option>
                      {#each candidates as candidate (candidate.id)}
                        <option value={candidate.id}>{candidate.publicCode}</option>
                      {/each}
                    </select>

                    {#if !row.questionId}
                      <input
                        class="adm-input code-input"
                        type="text"
                        placeholder={row.suggestion.slug.toUpperCase()}
                        aria-label={`Kode soal untuk ${row.fileName}`}
                        value={row.publicCode}
                        onchange={(event) => setPublicCode(index, event.currentTarget.value)}
                      />
                      {#if suggestionsFor(index).length === 1}
                        <button
                          class="link"
                          type="button"
                          onclick={() => pickQuestion(index, suggestionsFor(index)[0]!.id)}
                        >
                          Pakai {suggestionsFor(index)[0]!.publicCode}
                        </button>
                      {/if}
                    {/if}
                  {:else}
                    <span class="adm-muted">—</span>
                  {/if}
                </td>
                <td>
                  {#if row.status === 'OK'}
                    <select
                      class="adm-select"
                      aria-label={`Peran media untuk ${row.fileName}`}
                      value={row.role}
                      onchange={(event) =>
                        changeRole(index, event.currentTarget.value as MediaRole)}
                    >
                      {#each ROLES as role (role)}
                        <option value={role}>{ROLE_LABELS[role]}</option>
                      {/each}
                    </select>
                  {:else}
                    <span class="adm-muted">—</span>
                  {/if}
                </td>
                <td>
                  {#if row.status === 'OK' && row.role === 'OPTION'}
                    <select
                      class="adm-select"
                      aria-label={`Label opsi untuk ${row.fileName}`}
                      value={row.optionLabel}
                      onchange={(event) =>
                        patchRow(index, { optionLabel: event.currentTarget.value })}
                    >
                      <option value="">— pilih label —</option>
                      {#each row.optionLabels as label (label)}
                        <option value={label}>{label}</option>
                      {/each}
                    </select>
                  {:else}
                    <span class="adm-muted">—</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if issues.errors.length > 0}
        <div class="report">
          <Alert tone="danger" title="Perlu diperbaiki sebelum menyimpan">
            <ul class="report__list">
              {#each issues.errors as issue, position (issue.code + position)}
                <li>
                  {#if issue.fileName}<strong>{issue.fileName}</strong> — {/if}{issue.message}
                  <span class="code">{issue.code}</span>
                </li>
              {/each}
            </ul>
          </Alert>
        </div>
      {/if}

      {#if issues.warnings.length > 0}
        <div class="report">
          <Alert tone="warning" title="Catatan">
            <ul class="report__list">
              {#each issues.warnings as warning, position (position)}
                <li>{warning}</li>
              {/each}
            </ul>
          </Alert>
        </div>
      {/if}

      <div class="report actions">
        <Button onclick={applyMappings} disabled={busy || !ready}>
          {busy ? 'Menyimpan…' : `Terapkan ${summary.mapped} pemetaan`}
        </Button>
        <p class="hint">
          Gambar yang sudah terpasang pada soal yang sama akan dilewati dan dihitung terpisah,
          bukan digandakan.
        </p>
      </div>
    </Card>
  {:else if step === 'done' && result}
    <Card title="Ringkasan hasil">
      <div class="stack">
        <ul class="report__list">
          {#each applyResultLines(result) as line (line)}
            <li>{line}</li>
          {/each}
        </ul>

        <div class="stats">
          <span>{result.totalEntries} berkas dibaca</span>
          <span>{result.importable} siap</span>
          <span>{result.mapped} dipetakan</span>
          <span>{result.imported} tersimpan</span>
          <span>{result.skipped} dilewati</span>
        </div>

        {#if result.errors.length > 0}
          <Alert tone="danger" title={`${result.errors.length} berkas gagal`}>
            <ul class="report__list">
              {#each result.errors as issue, position (issue.code + position)}
                <li>
                  {#if issue.fileName}<strong>{issue.fileName}</strong> — {/if}{issue.message}
                  <span class="code">{issue.code}</span>
                </li>
              {/each}
            </ul>
          </Alert>
        {/if}

        {#if result.warnings.length > 0}
          <Alert tone="warning" title="Catatan">
            <ul class="report__list">
              {#each result.warnings as warning, position (position)}
                <li>{warning}</li>
              {/each}
            </ul>
          </Alert>
        {/if}

        <div class="actions">
          <a class="button-link" href={`${adminBase()}/media`}>Buka pustaka media</a>
          <Button variant="secondary" onclick={reset}>Impor arsip lain</Button>
        </div>
      </div>
    </Card>
  {/if}
</div>

<style>
  .stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .stat--warn {
    color: var(--color-warning);
    font-weight: 600;
  }

  .issues {
    margin: var(--space-3) 0 0;
    padding-left: 1.1rem;
    font-size: var(--text-sm);
    color: var(--color-danger);
  }

  .picker {
    position: relative;
    display: inline-flex;
    align-self: flex-start;
  }

  .picker__input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  .picker__label {
    display: inline-flex;
    align-items: center;
    padding: 0.55rem 1rem;
    border-radius: var(--radius-md);
    background: var(--color-primary);
    color: #fff;
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
  }

  .picker.is-busy .picker__label {
    opacity: 0.7;
    pointer-events: none;
  }

  .search {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  .file {
    font-weight: 600;
    word-break: break-all;
  }

  .file__meta {
    font-size: var(--text-xs);
    color: var(--color-text-subtle);
  }

  .file__meta--warn {
    color: var(--color-danger);
  }

  .code-input {
    margin-top: var(--space-2);
    max-width: 12rem;
  }

  .row--blocked {
    opacity: 0.7;
  }

  .report {
    padding: var(--space-4);
  }

  .report__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin: 0;
    padding-left: 1.1rem;
    font-size: var(--text-sm);
  }

  .code {
    font-size: var(--text-xs);
    color: var(--color-text-subtle);
    margin-left: var(--space-2);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
  }

  .hint {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .link {
    display: block;
    margin-top: var(--space-2);
    border: 0;
    background: none;
    padding: 0;
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-primary);
    cursor: pointer;
  }

  .button-link {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-primary);
  }
</style>
