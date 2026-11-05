<script lang="ts">
  import { onMount } from 'svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Field from '@webcat/ui/components/Field.svelte';
  import Input from '@webcat/ui/components/Input.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import AdminPageHeader from '$lib/components/admin/AdminPageHeader.svelte';
  import { apiErrorMessage, apiRequest } from '$lib/api/client';
  import { adminBase } from '$lib/panel-route';
  import { session } from '$lib/stores/session.svelte';
  import { formatIdr, formatDateTime } from '$lib/format';
  import {
    buildCreatePayload,
    buildUpdatePayload,
    describePlanChange,
    draftFromPlan,
    emptyDraft,
    splitPlans,
    validateDraft,
    type PlanDraft,
  } from '$lib/admin/plans-draft';
  import { PLAN_STATUSES, type AdminPlan, type PlanDeleteResult, type PlanFeature } from '@webcat/contracts';

  let plans = $state<AdminPlan[]>([]);
  let loading = $state(true);
  let busy = $state(false);
  let error = $state<string | null>(null);
  let notice = $state<string | null>(null);
  let tab = $state<'live' | 'archived'>('live');

  let editingId = $state<string | null>(null);
  let draft = $state<PlanDraft>(emptyDraft());
  /**
   * Harga coret opsional: `<input type="number">` tidak bisa menyatakan
   * "kosong" sebagai `null`, jadi nilai mentah disimpan sebagai string dan
   * diterjemahkan ke `number | null` saat berpindah ke draft.
   */
  let compareAtText = $state('');
  let issues = $state<string[]>([]);
  let deleteTarget = $state<AdminPlan | null>(null);
  let deleteReason = $state('');

  const canWrite = $derived(session.can('billing.write'));
  const groups = $derived(splitPlans(plans));
  const rows = $derived(tab === 'live' ? groups.live : groups.archived);
  const editingPlan = $derived(plans.find((plan) => plan.id === editingId) ?? null);

  async function load() {
    loading = true;
    error = null;
    try {
      // `includeDeleted=true` agar tab "Arsip" terisi; paket terhapus tidak
      // pernah dipakai halaman publik, hanya panel ini.
      plans = await apiRequest<AdminPlan[]>('/admin/plans?includeDeleted=true', {
        token: session.accessToken,
        cacheTtlMs: 0,
      });
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void load();
  });

  function resetForm(status: PlanDraft['status'] = 'DRAFT') {
    editingId = null;
    draft = emptyDraft(status);
    compareAtText = '';
    issues = [];
  }

  function startEdit(plan: AdminPlan) {
    editingId = plan.id;
    draft = draftFromPlan(plan);
    compareAtText = plan.compareAtPriceIdr === null ? '' : String(plan.compareAtPriceIdr);
    issues = [];
    notice = null;
  }

  /** Sinkronkan input teks harga coret ke draft (`null` bila dikosongkan). */
  function onCompareInput(event: Event) {
    const raw = (event.currentTarget as HTMLInputElement).value.trim();
    compareAtText = raw;
    draft.compareAtPriceIdr = raw === '' ? null : Number(raw);
  }

  function addFeature() {
    draft.features = [...draft.features, { label: '', included: true }];
  }

  function updateFeature(index: number, patch: Partial<PlanFeature>) {
    draft.features = draft.features.map((feature, position) =>
      position === index ? { ...feature, ...patch } : feature,
    );
  }

  function removeFeature(index: number) {
    draft.features = draft.features.filter((_, position) => position !== index);
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (busy || !canWrite) return;

    const found = validateDraft(draft, editingId ? 'update' : 'create');
    issues = found;
    if (found.length > 0) return;

    busy = true;
    error = null;
    notice = null;
    const before = editingPlan;
    try {
      const saved = editingId
        ? await apiRequest<AdminPlan>(`/admin/plans/${editingId}`, {
            method: 'PATCH',
            body: buildUpdatePayload(draft),
            token: session.accessToken,
          })
        : await apiRequest<AdminPlan>('/admin/plans', {
            method: 'POST',
            body: buildCreatePayload(draft),
            token: session.accessToken,
          });

      notice = describePlanChange(before, saved);
      resetForm(saved.status);
      tab = 'live';
      await load();
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      busy = false;
    }
  }

  function askDelete(plan: AdminPlan) {
    deleteTarget = plan;
    deleteReason = '';
    notice = null;
  }

  function cancelDelete() {
    deleteTarget = null;
    deleteReason = '';
  }

  async function confirmDelete() {
    if (!deleteTarget || busy) return;
    if (deleteReason.trim().length < 3) {
      error = 'Alasan wajib diisi (minimal 3 karakter).';
      return;
    }

    busy = true;
    error = null;
    try {
      const result = await apiRequest<PlanDeleteResult>(`/admin/plans/${deleteTarget.id}`, {
        method: 'DELETE',
        body: { reason: deleteReason.trim() },
        token: session.accessToken,
      });
      notice = `Paket ${result.code} dihapus pada ${formatDateTime(result.deletedAt)}. Riwayat transaksi tetap utuh.`;
      if (editingId === deleteTarget.id) resetForm();
      cancelDelete();
      await load();
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      busy = false;
    }
  }

  async function restore(plan: AdminPlan) {
    const reason = prompt(`Alasan memulihkan paket ${plan.code}:`)?.trim();
    if (!reason || reason.length < 3) return;

    busy = true;
    error = null;
    try {
      const restored = await apiRequest<AdminPlan>(`/admin/plans/${plan.id}/restore`, {
        method: 'POST',
        body: { reason },
        token: session.accessToken,
      });
      notice = `Paket ${restored.code} dipulihkan (status ${restored.status}).`;
      tab = 'live';
      await load();
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      busy = false;
    }
  }

  function statusTone(status: AdminPlan['status']): 'success' | 'warning' | 'neutral' {
    if (status === 'ACTIVE') return 'success';
    if (status === 'DRAFT') return 'warning';
    return 'neutral';
  }
</script>

<svelte:head>
  <title>Paket &amp; Harga — Admin TES CAT</title>
</svelte:head>

<div class="adm-page">
  <AdminPageHeader
    title="Paket &amp; harga"
    description="Harga adalah data, bukan konstanta: perubahan di sini langsung dipakai halaman /pricing dan checkout berikutnya tanpa deploy."
  >
    {#snippet actions()}
      <Button href="/pricing" variant="secondary">Lihat /pricing</Button>
      {#if canWrite}
        <Button onclick={() => resetForm()}>Paket baru</Button>
      {/if}
    {/snippet}
  </AdminPageHeader>

  {#if !canWrite}
    <Alert tone="info" title="Hanya baca">
      Peran Anda tidak memiliki izin <code>billing.write</code>, jadi form dan aksi
      perubahan disembunyikan. Hubungi SUPER_ADMIN bila perlu mengubah harga.
    </Alert>
  {/if}

  {#if error}
    <Alert tone="danger" title="Gagal">{error}</Alert>
  {/if}

  {#if notice}
    <Alert tone="success" title="Tersimpan">{notice}</Alert>
  {/if}

  {#if deleteTarget}
    <Card title={`Hapus paket ${deleteTarget.code}?`}>
      <div class="delete">
        <p class="adm-muted">
          Paket tidak dihapus permanen: baris hanya ditandai <code>deleted_at</code> agar riwayat
          transaksi dan langganan lama tetap terbaca. Paket hilang dari /pricing dan tidak bisa
          dibeli lagi. Paket yang masih punya langganan <strong>ACTIVE</strong> akan ditolak server.
        </p>
        <Field label="Alasan" for="plan-delete-reason" required hint="Masuk ke audit log.">
          <Input
            id="plan-delete-reason"
            bind:value={deleteReason}
            maxlength={500}
            placeholder="mis. paket diganti promo kuartal baru"
          />
        </Field>
        <div class="delete__actions">
          <Button variant="danger" loading={busy} onclick={confirmDelete}>Hapus paket</Button>
          <Button variant="ghost" onclick={cancelDelete}>Batal</Button>
        </div>
      </div>
    </Card>
  {/if}

  <div class="layout">
    {#if canWrite}
      <Card title={editingId ? `Ubah ${editingPlan?.code ?? 'paket'}` : 'Paket baru'}>
        <form class="form" onsubmit={submit}>
          <Field
            label="Kode"
            for="plan-code"
            required
            hint={editingId ? 'Kode tidak bisa diubah setelah dibuat.' : 'Otomatis jadi huruf besar.'}
          >
            <Input
              id="plan-code"
              bind:value={draft.code}
              maxlength={50}
              disabled={Boolean(editingId)}
              placeholder="MONTHLY"
            />
          </Field>

          <Field label="Nama" for="plan-name" required>
            <Input id="plan-name" bind:value={draft.name} maxlength={80} required />
          </Field>

          <Field label="Tagline" for="plan-tagline" hint="Satu baris pemikat di kartu harga.">
            <Input id="plan-tagline" bind:value={draft.tagline} maxlength={160} />
          </Field>

          <div class="grid-2">
            <Field label="Harga (Rp)" for="plan-price" required>
              <Input id="plan-price" type="number" min={0} bind:value={draft.priceIdr} />
            </Field>
            <Field label="Harga coret (Rp)" for="plan-compare" hint="Kosongkan bila tidak ada.">
              <Input
                id="plan-compare"
                type="number"
                min={0}
                bind:value={compareAtText}
                oninput={onCompareInput}
              />
            </Field>
          </div>

          <div class="grid-2">
            <Field label="Durasi (hari)" for="plan-duration" required>
              <Input id="plan-duration" type="number" min={1} max={3650} bind:value={draft.durationDays} />
            </Field>
            <Field label="Urutan" for="plan-order" hint="Kecil tampil lebih dulu.">
              <Input id="plan-order" type="number" min={0} max={10000} bind:value={draft.sortOrder} />
            </Field>
          </div>

          <div class="grid-2">
            <Field label="Status" for="plan-status">
              <select id="plan-status" class="select" bind:value={draft.status}>
                {#each PLAN_STATUSES as value (value)}
                  <option {value}>{value}</option>
                {/each}
              </select>
            </Field>
            <Field label="Badge" for="plan-badge" hint="mis. Paling populer">
              <Input id="plan-badge" bind:value={draft.badge} maxlength={40} />
            </Field>
          </div>

          <div class="toggles">
            <label class="toggle">
              <input type="checkbox" bind:checked={draft.isPublic} />
              <span>Tampilkan di /pricing</span>
            </label>
            <label class="toggle">
              <input type="checkbox" bind:checked={draft.isPopular} />
              <span>Tandai populer</span>
            </label>
          </div>

          <fieldset class="features">
            <legend>Fitur</legend>
            {#if draft.features.length === 0}
              <p class="adm-muted">Belum ada fitur. Kartu harga akan tampil tanpa daftar fitur.</p>
            {:else}
              {#each draft.features as feature, index (index)}
                <div class="features__row">
                  <Input
                    ariaLabel={`Label fitur ${index + 1}`}
                    bind:value={feature.label}
                    maxlength={120}
                    placeholder="mis. Pembahasan lengkap"
                  />
                  <label class="toggle toggle--inline">
                    <input
                      type="checkbox"
                      checked={feature.included}
                      onchange={(event) =>
                        updateFeature(index, { included: event.currentTarget.checked })}
                    />
                    <span>Termasuk</span>
                  </label>
                  <Button variant="ghost" size="sm" onclick={() => removeFeature(index)}>
                    Hapus
                  </Button>
                </div>
              {/each}
            {/if}
            <Button variant="secondary" size="sm" onclick={addFeature}>Tambah fitur</Button>
          </fieldset>

          {#if issues.length > 0}
            <Alert tone="danger" title="Periksa isian">
              <ul class="issues">
                {#each issues as issue (issue)}
                  <li>{issue}</li>
                {/each}
              </ul>
            </Alert>
          {/if}

          <div class="form__actions">
            <Button type="submit" loading={busy}>
              {editingId ? 'Simpan perubahan' : 'Buat paket'}
            </Button>
            {#if editingId}
              <Button variant="ghost" onclick={() => resetForm()}>Batal</Button>
            {/if}
          </div>
        </form>
      </Card>
    {/if}

    <Card title="Daftar paket" description={`${groups.live.length} aktif · ${groups.archived.length} terarsip`}>
      <div class="tabs">
        <button
          type="button"
          class="tab"
          class:tab--active={tab === 'live'}
          onclick={() => (tab = 'live')}
        >
          Paket ({groups.live.length})
        </button>
        <button
          type="button"
          class="tab"
          class:tab--active={tab === 'archived'}
          onclick={() => (tab = 'archived')}
        >
          Arsip ({groups.archived.length})
        </button>
      </div>

      {#if loading}
        <div class="adm-center"><Spinner size={24} label="Memuat paket" /></div>
      {:else if rows.length === 0}
        <p class="adm-muted">
          {tab === 'live' ? 'Belum ada paket. Buat paket pertama lewat form.' : 'Tidak ada paket terarsip.'}
        </p>
      {:else}
        <div class="adm-scroll">
          <table class="adm-table">
            <caption class="sr-only">Daftar paket langganan</caption>
            <thead>
              <tr>
                <th scope="col">Kode</th>
                <th scope="col">Nama</th>
                <th scope="col">Harga</th>
                <th scope="col">Durasi</th>
                <th scope="col">Status</th>
                <th scope="col">Publik</th>
                <th scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {#each rows as plan (plan.id)}
                <tr class:row--muted={plan.deletedAt !== null}>
                  <td class="mono">{plan.code}</td>
                  <td>
                    <p class="plan__name">{plan.name}</p>
                    {#if plan.badge}<p class="plan__badge">{plan.badge}</p>{/if}
                    {#if plan.deletedAt}
                      <p class="plan__deleted">Dihapus {formatDateTime(plan.deletedAt)}</p>
                    {/if}
                  </td>
                  <td class="adm-nowrap">
                    {formatIdr(plan.priceIdr)}
                    {#if plan.compareAtPriceIdr}
                      <span class="plan__compare">{formatIdr(plan.compareAtPriceIdr)}</span>
                    {/if}
                  </td>
                  <td class="adm-nowrap">{plan.durationDays} hari</td>
                  <td><Badge tone={statusTone(plan.status)}>{plan.status}</Badge></td>
                  <td>
                    <Badge tone={plan.isPublic ? 'success' : 'neutral'}>
                      {plan.isPublic ? 'Ya' : 'Tidak'}
                    </Badge>
                  </td>
                  <td class="actions">
                    {#if plan.deletedAt}
                      {#if canWrite}
                        <Button variant="secondary" size="sm" disabled={busy} onclick={() => restore(plan)}>
                          Pulihkan
                        </Button>
                      {/if}
                    {:else if canWrite}
                      <Button variant="ghost" size="sm" onclick={() => startEdit(plan)}>Ubah</Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onclick={() => askDelete(plan)}
                      >
                        Hapus
                      </Button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </Card>
  </div>

  <p class="adm-muted footnote">
    Butuh riwayat perubahan? Setiap create/update/delete/restore ditulis ke
    <a href={`${adminBase()}/audit?action=plan.`}>audit log</a>.
  </p>
</div>

<style>
  .layout {
    display: grid;
    gap: var(--space-5);
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
  }

  @media (min-width: 1080px) {
    .layout {
      grid-template-columns: 400px minmax(0, 1fr);
    }
  }

  .form,
  .delete {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .form__actions,
  .delete__actions {
    display: flex;
    gap: var(--space-2);
  }

  .grid-2 {
    display: grid;
    gap: var(--space-3);
    grid-template-columns: minmax(0, 1fr);
  }

  @media (min-width: 520px) {
    .grid-2 {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
  }

  .select {
    width: 100%;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font-size: var(--text-sm);
  }

  .toggles {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    cursor: pointer;
  }

  .toggle--inline {
    white-space: nowrap;
  }

  .features {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .features legend {
    padding: 0 var(--space-1);
    font-size: var(--text-sm);
    font-weight: 600;
  }

  .features__row {
    display: grid;
    gap: var(--space-2);
    align-items: center;
    grid-template-columns: minmax(0, 1fr) auto auto;
  }

  .issues {
    margin: 0;
    padding-left: 1.1rem;
  }

  .tabs {
    display: flex;
    gap: var(--space-1);
    margin-bottom: var(--space-3);
    border-bottom: 1px solid var(--color-border);
  }

  .tab {
    padding: var(--space-2) var(--space-3);
    border: 0;
    border-bottom: 2px solid transparent;
    background: none;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
  }

  .tab--active {
    border-bottom-color: var(--color-primary);
    color: var(--color-primary);
  }

  .plan__name {
    font-weight: 600;
  }

  .plan__badge {
    font-size: var(--text-xs);
    color: var(--color-primary);
  }

  .plan__compare {
    display: block;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-decoration: line-through;
  }

  .plan__deleted {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .row--muted {
    opacity: 0.72;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }

  .mono {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    white-space: nowrap;
  }

  .footnote {
    font-size: var(--text-xs);
  }
</style>
