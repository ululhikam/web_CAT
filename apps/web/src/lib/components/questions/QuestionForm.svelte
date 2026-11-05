<script lang="ts">
  import type { MediaRole, QuestionDifficulty, QuestionStatus, StageCode, QuestionType, SubtestCode } from '@webcat/contracts';
  import { untrack } from 'svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Field from '@webcat/ui/components/Field.svelte';
  import Input from '@webcat/ui/components/Input.svelte';
  import QuestionRenderer from './QuestionRenderer.svelte';
  import {
    draftMediaIssues,
    emptyDraft,
    singleCorrect,
    usesOptions,
    type OptionDraft,
    type QuestionDraft,
  } from './draft';

  export interface MediaChoice {
    id: string;
    url: string;
    /** Turunan kecil untuk grid; jatuh ke `url` bila belum tersedia (F5-15). */
    thumbUrl?: string;
    altText: string | null;
  }

  interface Props {
    initial?: QuestionDraft;
    categories: Array<{ id: string; path: string }>;
    mediaLibrary?: MediaChoice[];
    saving?: boolean;
    error?: string | null;
    submitLabel?: string;
    onsubmit: (draft: QuestionDraft) => void;
    oncancel?: () => void;
  }

  let {
    initial,
    categories,
    mediaLibrary = [],
    saving = false,
    error = null,
    submitLabel = 'Simpan soal',
    onsubmit,
    oncancel,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  let draft = $state<QuestionDraft>(untrack(() => structuredClone(initial ?? emptyDraft())));
  let showKey = $state(true);

  const STAGE_OPTIONS: Array<{ value: StageCode; label: string }> = [
    { value: 'PSIKOLOGI', label: 'Psikologi' },
    { value: 'TPA', label: 'TPA' },
    { value: 'TPK', label: 'TPK' },
  ];

  const SUBTESTS: Record<StageCode, Array<{ value: SubtestCode; label: string }>> = {
    PSIKOLOGI: [
      { value: 'KECERDASAN', label: 'Kecerdasan' },
      { value: 'KEPRIBADIAN', label: 'Kepribadian' },
      { value: 'KECERMATAN', label: 'Kecermatan' },
      { value: 'PASS_HAND', label: 'Pass Hand' },
    ],
    TPA: [{ value: 'TPA', label: 'TPA' }],
    TPK: [{ value: 'TPK', label: 'TPK' }],
  };

  const TYPES: Array<{ value: QuestionType; label: string }> = [
    { value: 'SINGLE_CHOICE', label: 'Pilihan tunggal' },
    { value: 'MULTI_CHOICE', label: 'Pilihan ganda' },
    { value: 'IMAGE_CHOICE', label: 'Pilihan gambar' },
    { value: 'LIKERT_STATEMENT', label: 'Pernyataan Likert' },
    { value: 'MISSING_ELEMENT', label: 'Elemen hilang' },
    { value: 'PASS_HAND_COLUMN', label: 'Kolom Pass Hand' },
  ];

  const STATUSES: Array<{ value: QuestionStatus; label: string }> = [
    { value: 'DRAFT', label: 'Draf' },
    { value: 'REVIEW', label: 'Review' },
    { value: 'PUBLISHED', label: 'Terbit' },
    { value: 'ARCHIVED', label: 'Arsip' },
  ];

  const DIFFICULTIES: Array<{ value: QuestionDifficulty; label: string }> = [
    { value: 'EASY', label: 'Mudah' },
    { value: 'MEDIUM', label: 'Sedang' },
    { value: 'HARD', label: 'Sulit' },
  ];

  const optionsUsed = $derived(usesOptions(draft.type));
  const oneCorrect = $derived(singleCorrect(draft.type));

  /**
   * Kelengkapan media soal bergambar (F3-29).
   *
   * Server tetap menolak soal yang tidak lengkap (`questionShapeIssues`), tetapi
   * admin perlu tahu lebih awal — sebelum menekan Simpan — opsi mana yang
   * masih kosong.
   */
  const mediaIssues = $derived(draftMediaIssues(draft));
  const missingMediaLabels = $derived(new Set(mediaIssues.labelsWithoutMedia));

  $effect(() => {
    const allowed = SUBTESTS[draft.stageCode] ?? [];
    if (!allowed.some((item) => item.value === draft.subtestCode)) {
      draft.subtestCode = allowed[0]?.value ?? 'TPA';
    }
  });

  function addOption() {
    if (draft.options.length >= 10) return;
    const used = new Set(draft.options.map((option) => option.label));
    const label = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].find(
      (candidate) => !used.has(candidate),
    );
    if (!label) return;
    draft.options = [...draft.options, { label, contentText: '', isCorrect: false, scoreValue: 0 }];
  }

  function removeOption(index: number) {
    draft.options = draft.options.filter((_, position) => position !== index);
  }

  function setCorrect(index: number, checked: boolean) {
    draft.options = draft.options.map((option: OptionDraft, position: number) => ({
      ...option,
      isCorrect: oneCorrect ? position === index && checked : position === index ? checked : option.isCorrect,
    }));
  }

  function toggleMedia(id: string, role: MediaRole, optionLabel = '') {
    const existing = draft.media.find(
      (media) => media.mediaAssetId === id && media.role === role,
    );
    if (existing) {
      draft.media = draft.media.filter((media) => media !== existing);
      return;
    }
    if (role === 'OPTION' && !optionLabel) return;
    draft.media = [...draft.media, { mediaAssetId: id, role, optionLabel }];
  }

  function mediaFor(id: string, role: MediaRole): boolean {
    return draft.media.some((media) => media.mediaAssetId === id && media.role === role);
  }

  const previewQuestion = $derived({
    type: draft.type,
    stemText: draft.stemText || 'Teks soal tampil di sini.',
    stemFormat: draft.stemFormat,
    columnIndex: draft.columnIndex,
    pairGroup: draft.pairGroup || null,
    options: optionsUsed
      ? draft.options
          .filter((option) => option.contentText.trim() || draft.media.some((m) => m.role === 'OPTION' && m.optionLabel === option.label))
          .map((option) => ({
            label: option.label,
            contentText: option.contentText || null,
            isCorrect: option.isCorrect,
            scoreValue: option.scoreValue,
            media: draft.media
              .filter((m) => m.role === 'OPTION' && m.optionLabel === option.label)
              .map((m) => {
                const asset = mediaLibrary.find((item) => item.id === m.mediaAssetId);
                return {
                  id: m.mediaAssetId,
                  url: asset?.url ?? '',
                  altText: asset?.altText ?? null,
                };
              })
              .filter((m) => m.url),
          }))
      : [],
    media: draft.media
      .filter((m) => m.role !== 'OPTION')
      .map((m) => {
        const asset = mediaLibrary.find((item) => item.id === m.mediaAssetId);
        return {
          id: m.mediaAssetId,
          url: asset?.url ?? '',
          altText: asset?.altText ?? null,
          role: m.role,
        };
      })
      .filter((m) => m.url),
  });
</script>

<form
  class="editor"
  onsubmit={(event) => {
    event.preventDefault();
    onsubmit(draft);
  }}
>
  <div class="editor__main">
    <Card title="Informasi soal">
      <div class="grid">
        <Field label="Stage" for="stage" required>
          <select id="stage" class="select" bind:value={draft.stageCode}>
            {#each STAGE_OPTIONS as option (option.value)}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </Field>

        <Field label="Subtes" for="subtest" required>
          <select id="subtest" class="select" bind:value={draft.subtestCode}>
            {#each SUBTESTS[draft.stageCode] as option (option.value)}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </Field>

        <Field label="Tipe soal" for="type" required>
          <select id="type" class="select" bind:value={draft.type}>
            {#each TYPES as option (option.value)}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </Field>

        <Field label="Kesulitan" for="difficulty">
          <select id="difficulty" class="select" bind:value={draft.difficulty}>
            {#each DIFFICULTIES as option (option.value)}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </Field>

        <Field label="Status" for="status">
          <select id="status" class="select" bind:value={draft.status}>
            {#each STATUSES as option (option.value)}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </Field>

        <Field label="Kategori" for="category">
          <select id="category" class="select" bind:value={draft.categoryId}>
            <option value="">— Tanpa kategori —</option>
            {#each categories as category (category.id)}
              <option value={category.id}>{category.path}</option>
            {/each}
          </select>
        </Field>

        <Field label="Kode soal" for="publicCode" hint="Kosongkan agar dibuat otomatis.">
          <Input id="publicCode" bind:value={draft.publicCode} maxlength={60} />
        </Field>

        <Field label="Tag" for="tags" hint="Pisahkan dengan koma.">
          <Input id="tags" bind:value={draft.tags} />
        </Field>
      </div>
    </Card>

    <Card title="Teks soal">
      <div class="stack">
        <Field label="Teks soal" for="stem" required>
          <textarea
            id="stem"
            class="textarea"
            rows="5"
            maxlength={20000}
            bind:value={draft.stemText}
            required
          ></textarea>
        </Field>

        <Field label="Pembahasan" for="explanation" hint="Opsional; tidak tampil saat ujian.">
          <textarea
            id="explanation"
            class="textarea"
            rows="3"
            maxlength={20000}
            bind:value={draft.explanation}
          ></textarea>
        </Field>

        <div class="grid">
          <Field label="Grup pasangan" for="pairGroup" hint="Untuk soal berpasangan.">
            <Input id="pairGroup" bind:value={draft.pairGroup} maxlength={40} />
          </Field>
          {#if draft.type === 'PASS_HAND_COLUMN'}
            <Field label="Indeks kolom" for="columnIndex" required>
              <Input
                id="columnIndex"
                type="number"
                min={0}
                max={999}
                value={draft.columnIndex ?? ''}
                oninput={(event) => {
                  const value = (event.currentTarget as HTMLInputElement).value;
                  draft.columnIndex = value === '' ? null : Number(value);
                }}
              />
            </Field>
          {/if}
        </div>
      </div>
    </Card>

    {#if optionsUsed}
      <Card title="Opsi jawaban" description={oneCorrect ? 'Tandai tepat satu kunci.' : draft.type === 'LIKERT_STATEMENT' ? 'Skala 1–5 dengan bobot dimensi.' : 'Tandai semua kunci yang benar.'}>
        {#if draft.type === 'IMAGE_CHOICE'}
          <Alert tone="info" title="Soal bergambar">
            Setiap opsi wajib punya gambar. Pasang gambar pada bagian Media di bawah
            menggunakan tombol label opsi.
          </Alert>
        {/if}
        <div class="options">
          {#each draft.options as option, index (option.label)}
            <div class="option" class:option--missing-media={missingMediaLabels.has(option.label)}>
              <span class="option__label">{option.label}</span>
              <input
                class="option__input"
                type="text"
                placeholder={draft.type === 'LIKERT_STATEMENT' ? 'Label skala, mis. Sangat setuju' : draft.type === 'IMAGE_CHOICE' ? 'Teks opsi (opsional)' : 'Teks opsi'}
                value={option.contentText}
                oninput={(event) => {
                  const value = (event.currentTarget as HTMLInputElement).value;
                  draft.options = draft.options.map((item, position) =>
                    position === index ? { ...item, contentText: value } : item,
                  );
                }}
              />
              {#if missingMediaLabels.has(option.label)}
                <span class="option__media-warning" title="Opsi ini belum punya gambar">
                  ⚠ belum bergambar
                </span>
              {/if}
              {#if draft.type !== 'LIKERT_STATEMENT'}
                <label class="option__correct">
                  <input
                    type={oneCorrect ? 'radio' : 'checkbox'}
                    name="correct"
                    checked={option.isCorrect}
                    onchange={(event) =>
                      setCorrect(index, (event.currentTarget as HTMLInputElement).checked)}
                  />
                  <span>Kunci</span>
                </label>
              {/if}
              <button
                type="button"
                class="option__remove"
                aria-label={`Hapus opsi ${option.label}`}
                onclick={() => removeOption(index)}
              >
                ✕
              </button>
            </div>
          {/each}
        </div>
        <div class="options__actions">
          <Button type="button" variant="secondary" size="sm" onclick={addOption}>
            Tambah opsi
          </Button>
        </div>
      </Card>
    {/if}

    {#if draft.type === 'IMAGE_CHOICE' && (mediaIssues.stemMissing || mediaIssues.labelsWithoutMedia.length > 0)}
      <Card title="Kelengkapan gambar" description="Soal bergambar wajib lengkap sebelum bisa diterbitkan.">
        {#if mediaIssues.stemMissing}
          <Alert tone="warning" title="Gambar stem belum dipasang">
            Soal bergambar wajib punya minimal satu gambar pada stem.
          </Alert>
        {/if}
        {#if mediaIssues.labelsWithoutMedia.length > 0}
          <Alert tone="warning" title="Opsi belum bergambar">
            Opsi {mediaIssues.labelsWithoutMedia.join(', ')} belum memiliki gambar.
          </Alert>
        {/if}
        {#if mediaLibrary.length === 0}
          <Alert tone="info" title="Belum ada gambar di pustaka">
            Unggah gambar terlebih dahulu di menu Media, lalu kembali ke form ini.
          </Alert>
        {/if}
      </Card>
    {/if}

    {#if mediaLibrary.length > 0}
      <Card title="Media" description="Klik untuk memasang gambar pada stem atau opsi.">
        <div class="media-grid">
          {#each mediaLibrary as asset (asset.id)}
            <div class="media-card">
              <img src={asset.thumbUrl ?? asset.url} alt={asset.altText ?? ''} loading="lazy" />
              <div class="media-card__actions">
                <button
                  type="button"
                  class="chip"
                  class:chip--active={mediaFor(asset.id, 'STEM')}
                  onclick={() => toggleMedia(asset.id, 'STEM')}
                >
                  Stem
                </button>
                {#if optionsUsed}
                  {#each draft.options as option (option.label)}
                    <button
                      type="button"
                      class="chip"
                      class:chip--active={draft.media.some((m) => m.mediaAssetId === asset.id && m.role === 'OPTION' && m.optionLabel === option.label)}
                      onclick={() => toggleMedia(asset.id, 'OPTION', option.label)}
                    >
                      {option.label}
                    </button>
                  {/each}
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </Card>
    {/if}

    {#if error}
      <Alert tone="danger" title="Gagal menyimpan">{error}</Alert>
    {/if}

    <div class="actions">
      <Button type="submit" loading={saving} disabled={draft.stemText.trim().length === 0}>
        {submitLabel}
      </Button>
      {#if oncancel}
        <Button type="button" variant="ghost" onclick={oncancel}>Batal</Button>
      {/if}
    </div>
  </div>

  <aside class="editor__aside">
    <Card title="Pratinjau">
      <label class="toggle">
        <input type="checkbox" bind:checked={showKey} />
        <span>Tampilkan kunci</span>
      </label>
      <div class="preview">
        <QuestionRenderer question={previewQuestion} showAnswerKey={showKey} />
      </div>
    </Card>
  </aside>
</form>

<style>
  .editor {
    display: grid;
    gap: var(--space-5);
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
  }

  @media (min-width: 1080px) {
    .editor {
      grid-template-columns: minmax(0, 1fr) 380px;
    }

    .editor__aside {
      position: sticky;
      top: var(--space-5);
    }
  }

  .editor__main {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .grid {
    display: grid;
    gap: var(--space-4);
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  .stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
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
    line-height: 1.6;
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .option {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .option__label {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    flex: none;
    border-radius: var(--radius-full);
    background: var(--color-surface-muted);
    font-weight: 700;
    font-size: var(--text-sm);
  }

  .option__input {
    flex: 1;
    padding: 0.55rem 0.7rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font-size: var(--text-sm);
  }

  .option__correct {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  /* F3-29: opsi yang belum punya gambar ditandai agar admin tahu apa yang
     kurang sebelum menekan Simpan. */
  .option--missing-media {
    padding: 0.35rem 0.5rem;
    border: 1px dashed var(--color-warning, #b45309);
    border-radius: var(--radius-md);
    background: var(--color-warning-soft, #fffbeb);
  }

  .option__media-warning {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-warning, #b45309);
    white-space: nowrap;
  }

  .option__remove {
    border: 0;
    background: none;
    color: var(--color-text-subtle);
    cursor: pointer;
    font-size: var(--text-sm);
  }

  .options__actions {
    margin-top: var(--space-3);
  }

  .media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--space-3);
  }

  .media-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .media-card img {
    width: 100%;
    height: 84px;
    object-fit: cover;
    background: var(--color-surface-muted);
  }

  .media-card__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 6px;
  }

  .chip {
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-full);
    background: var(--color-surface);
    padding: 2px 8px;
    font-size: 10px;
    cursor: pointer;
  }

  .chip--active {
    border-color: var(--color-primary);
    color: var(--color-primary);
    font-weight: 700;
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin-bottom: var(--space-3);
  }

  .preview {
    padding: var(--space-3);
    border: 1px dashed var(--color-border-strong);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
  }

  .actions {
    display: flex;
    gap: var(--space-2);
  }
</style>
