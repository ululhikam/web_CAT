<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import { formatIdr } from '$lib/format';
  import type { AdminPlan, PlanFeatureInput, PlanStatusValue } from '@webcat/contracts';

  interface PlanForm {
    id: string | null;
    code: string;
    name: string;
    tagline: string;
    priceIdr: string;
    compareAtPriceIdr: string;
    durationDays: string;
    badge: string;
    sortOrder: string;
    status: PlanStatusValue;
    isPublic: boolean;
    isPopular: boolean;
    featuresText: string;
  }

  const emptyForm = (): PlanForm => ({
    id: null,
    code: '',
    name: '',
    tagline: '',
    priceIdr: '0',
    compareAtPriceIdr: '',
    durationDays: '30',
    badge: '',
    sortOrder: '0',
    status: 'DRAFT',
    isPublic: true,
    isPopular: false,
    featuresText: '',
  });

  let plans = $state<AdminPlan[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let saving = $state(false);
  let form = $state<PlanForm>(emptyForm());
  let formOpen = $state(false);

  async function load(): Promise<void> {
    loading = true;
    error = null;
    try {
      plans = await apiRequest<AdminPlan[]>('/admin/plans', { token: session.accessToken });
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void load();
  });

  function openCreate(): void {
    form = emptyForm();
    formOpen = true;
  }

  function openEdit(plan: AdminPlan): void {
    form = {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      tagline: plan.tagline ?? '',
      priceIdr: String(plan.priceIdr),
      compareAtPriceIdr: plan.compareAtPriceIdr === null ? '' : String(plan.compareAtPriceIdr),
      durationDays: String(plan.durationDays),
      badge: plan.badge ?? '',
      sortOrder: String(plan.sortOrder),
      status: plan.status,
      isPublic: plan.isPublic,
      isPopular: plan.isPopular,
      featuresText: plan.features.map((feature) => `${feature.label}|${feature.included}`).join('\n'),
    };
    formOpen = true;
  }

  function parseFeatures(value: string): PlanFeatureInput[] {
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, included] = line.split('|');
        return {
          label: (label ?? '').trim(),
          included: included === undefined ? true : included.trim().toLowerCase() !== 'false',
        };
      });
  }

  async function save(): Promise<void> {
    saving = true;
    error = null;

    const payload = {
      name: form.name.trim(),
      tagline: form.tagline.trim() || null,
      priceIdr: Number(form.priceIdr),
      compareAtPriceIdr: form.compareAtPriceIdr ? Number(form.compareAtPriceIdr) : null,
      durationDays: Number(form.durationDays),
      features: parseFeatures(form.featuresText),
      badge: form.badge.trim() || null,
      isPopular: form.isPopular,
      isPublic: form.isPublic,
      sortOrder: Number(form.sortOrder),
      status: form.status,
    };

    try {
      if (form.id) {
        await apiRequest<AdminPlan>(`/admin/plans/${form.id}`, {
          method: 'PATCH',
          token: session.accessToken,
          body: payload,
        });
      } else {
        await apiRequest<AdminPlan>('/admin/plans', {
          method: 'POST',
          token: session.accessToken,
          body: { ...payload, code: form.code.trim().toUpperCase() },
        });
      }
      formOpen = false;
      await load();
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Paket &amp; Harga — Admin Web CAT</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">Paket &amp; harga</h1>
      <p class="muted">
        Sumber data halaman <code>/pricing</code>. Perubahan langsung berlaku tanpa deploy ulang.
      </p>
    </div>
    <Button onclick={openCreate}>Tambah paket</Button>
  </header>

  {#if error}
    <Alert tone="danger" title="Operasi gagal">{error}</Alert>
  {/if}

  {#if formOpen}
    <Card title={form.id ? `Ubah ${form.code}` : 'Paket baru'}>
      <form
        class="form"
        onsubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <label class="field">
          <span class="field__label">Kode</span>
          <input
            class="field__input"
            bind:value={form.code}
            disabled={Boolean(form.id)}
            required
            pattern={"[A-Z0-9_]{2,50}"}
            placeholder="BULANAN"
          />
          <span class="field__hint">Huruf besar, angka, garis bawah. Tidak bisa diubah.</span>
        </label>

        <label class="field">
          <span class="field__label">Nama</span>
          <input class="field__input" bind:value={form.name} required maxlength="80" />
        </label>

        <label class="field field--wide">
          <span class="field__label">Tagline</span>
          <input class="field__input" bind:value={form.tagline} maxlength="160" />
        </label>

        <label class="field">
          <span class="field__label">Harga (Rp)</span>
          <input class="field__input" type="number" min="0" bind:value={form.priceIdr} required />
        </label>

        <label class="field">
          <span class="field__label">Harga coret (Rp)</span>
          <input class="field__input" type="number" min="0" bind:value={form.compareAtPriceIdr} />
        </label>

        <label class="field">
          <span class="field__label">Durasi (hari)</span>
          <input
            class="field__input"
            type="number"
            min="1"
            max="3650"
            bind:value={form.durationDays}
            required
          />
        </label>

        <label class="field">
          <span class="field__label">Urutan</span>
          <input class="field__input" type="number" min="0" bind:value={form.sortOrder} />
        </label>

        <label class="field">
          <span class="field__label">Badge</span>
          <input class="field__input" bind:value={form.badge} maxlength="40" />
        </label>

        <label class="field">
          <span class="field__label">Status</span>
          <select class="field__input" bind:value={form.status}>
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </label>

        <label class="check">
          <input type="checkbox" bind:checked={form.isPublic} />
          <span>Tampil di halaman publik</span>
        </label>

        <label class="check">
          <input type="checkbox" bind:checked={form.isPopular} />
          <span>Tandai populer</span>
        </label>

        <label class="field field--wide">
          <span class="field__label">Fitur</span>
          <textarea
            class="field__input field__textarea"
            bind:value={form.featuresText}
            rows="6"
            placeholder={'1 sesi per hari|true\nPembahasan lengkap|true\nAnalisis per subtes|false'}
          ></textarea>
          <span class="field__hint">Satu fitur per baris: <code>label|true</code> atau <code>label|false</code>.</span>
        </label>

        <div class="form__actions">
          <Button type="submit" loading={saving}>Simpan</Button>
          <Button variant="secondary" onclick={() => (formOpen = false)}>Batal</Button>
        </div>
      </form>
    </Card>
  {/if}

  {#if loading}
    <div class="center"><Spinner size={26} label="Memuat paket" /></div>
  {:else if plans.length === 0}
    <Card title="Belum ada paket">
      <p class="muted">Tambahkan paket pertama untuk mengisi halaman pricing.</p>
    </Card>
  {:else}
    <div class="table-wrap">
      <table class="table">
        <caption class="sr-only">Daftar paket langganan</caption>
        <thead>
          <tr>
            <th scope="col">Kode</th>
            <th scope="col">Nama</th>
            <th scope="col">Harga</th>
            <th scope="col">Durasi</th>
            <th scope="col">Status</th>
            <th scope="col">Publik</th>
            <th scope="col"><span class="sr-only">Aksi</span></th>
          </tr>
        </thead>
        <tbody>
          {#each plans as plan (plan.id)}
            <tr>
              <td class="mono">{plan.code}</td>
              <td>
                <p class="plan__name">{plan.name}</p>
                {#if plan.badge}<p class="plan__badge">{plan.badge}</p>{/if}
              </td>
              <td>
                {formatIdr(plan.priceIdr)}
                {#if plan.compareAtPriceIdr}
                  <s class="compare">{formatIdr(plan.compareAtPriceIdr)}</s>
                {/if}
              </td>
              <td>{plan.durationDays} hari</td>
              <td>{plan.status}</td>
              <td>{plan.isPublic ? 'Ya' : 'Tidak'}</td>
              <td class="cell-actions">
                <Button size="sm" variant="secondary" onclick={() => openEdit(plan)}>Ubah</Button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <div class="foot">
    <Button href="/pricing" variant="secondary">Lihat halaman publik</Button>
  </div>
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

  .center {
    display: grid;
    place-items: center;
    padding-block: var(--space-12);
  }

  .form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--space-4);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .field--wide {
    grid-column: 1 / -1;
  }

  .field__label {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .field__input {
    padding: 0.5rem 0.7rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font-size: var(--text-sm);
  }

  .field__input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: var(--shadow-ring);
  }

  .field__textarea {
    resize: vertical;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }

  .field__hint {
    font-size: var(--text-xs);
    color: var(--color-text-subtle);
  }

  .check {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
  }

  .form__actions {
    display: flex;
    gap: var(--space-3);
    grid-column: 1 / -1;
  }

  .table-wrap {
    overflow-x: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
  }

  .table th,
  .table td {
    padding: var(--space-3) var(--space-4);
    text-align: left;
    border-bottom: 1px solid var(--color-border);
    white-space: nowrap;
  }

  .table thead th {
    background: var(--color-surface-muted);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .table tbody tr:last-child td {
    border-bottom: 0;
  }

  .plan__name {
    font-weight: 600;
  }

  .plan__badge {
    font-size: var(--text-xs);
    color: var(--color-primary);
  }

  .compare {
    margin-left: var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-text-subtle);
  }

  .mono {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }

  .cell-actions {
    text-align: right;
  }

  .foot {
    display: flex;
    gap: var(--space-3);
  }

  code {
    font-family: var(--font-mono);
    font-size: 0.92em;
  }
</style>
