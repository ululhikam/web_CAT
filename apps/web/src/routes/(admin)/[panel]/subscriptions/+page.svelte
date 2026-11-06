<script lang="ts">
  import { onMount } from 'svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import { apiPage } from '$lib/billing/api';
  import { session } from '$lib/stores/session.svelte';
  import { formatDate } from '$lib/format';
  import type {
    AdminPlan,
    AdminSubscriptionSummary,
    SubscriptionSummary,
  } from '@webcat/contracts';

  let rows = $state<AdminSubscriptionSummary[]>([]);
  let plans = $state<AdminPlan[]>([]);
  let nextCursor = $state<string | null>(null);
  let hasMore = $state(false);
  let loading = $state(true);
  let loadingMore = $state(false);
  let error = $state<string | null>(null);
  let notice = $state<string | null>(null);

  let status = $state('');
  let query = $state('');
  let expiringDays = $state('');

  let grantOpen = $state(false);
  let grantUserId = $state('');
  let grantPlanCode = $state('');
  let grantDuration = $state('');
  let grantMode = $state<'STACK' | 'REPLACE'>('STACK');
  let grantStartsAt = $state('');
  let grantReason = $state('');
  let granting = $state(false);

  let actionId = $state<string | null>(null);
  let actionKind = $state<'extend' | 'revoke' | null>(null);
  let actionDays = $state('30');
  let actionReason = $state('');
  let acting = $state(false);

  async function load(reset = true): Promise<void> {
    if (!session.accessToken) return;

    if (reset) {
      loading = true;
      rows = [];
      nextCursor = null;
    } else {
      loadingMore = true;
    }
    error = null;

    try {
      const params = new URLSearchParams({ limit: '20' });
      if (status) params.set('status', status);
      if (query.trim()) params.set('q', query.trim());
      if (expiringDays) params.set('expiringDays', expiringDays);
      if (!reset && nextCursor) params.set('cursor', nextCursor);

      const page = await apiPage<AdminSubscriptionSummary>(
        `/admin/subscriptions?${params}`,
        session.accessToken,
      );
      rows = reset ? page.items : [...rows, ...page.items];
      nextCursor = page.nextCursor;
      hasMore = page.hasMore;
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      loading = false;
      loadingMore = false;
    }
  }

  async function loadPlans(): Promise<void> {
    try {
      plans = await apiRequest<AdminPlan[]>('/admin/plans', { token: session.accessToken });
    } catch {
      plans = [];
    }
  }

  onMount(() => {
    void load();
    void loadPlans();
  });

  async function submitGrant(): Promise<void> {
    granting = true;
    error = null;
    notice = null;

    try {
      await apiRequest<SubscriptionSummary>('/admin/subscriptions', {
        method: 'POST',
        token: session.accessToken,
        body: {
          userId: grantUserId.trim(),
          ...(grantPlanCode ? { planCode: grantPlanCode } : { durationDays: Number(grantDuration) }),
          ...(grantStartsAt
            ? { startsAt: new Date(`${grantStartsAt}T00:00:00+07:00`).toISOString() }
            : {}),
          mode: grantMode,
          reason: grantReason.trim(),
        },
      });
      notice = 'Langganan berhasil diberikan.';
      grantOpen = false;
      grantUserId = '';
      grantPlanCode = '';
      grantDuration = '';
      grantReason = '';
      grantStartsAt = '';
      await load();
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      granting = false;
    }
  }

  function startAction(id: string, kind: 'extend' | 'revoke'): void {
    actionId = id;
    actionKind = kind;
    actionReason = '';
    actionDays = '30';
    notice = null;
    error = null;
  }

  async function submitAction(): Promise<void> {
    if (!actionId || !actionKind) return;
    acting = true;
    error = null;
    notice = null;

    try {
      await apiRequest<SubscriptionSummary>(`/admin/subscriptions/${actionId}`, {
        method: 'PATCH',
        token: session.accessToken,
        body:
          actionKind === 'extend'
            ? { extendDays: Number(actionDays), reason: actionReason.trim() }
            : { status: 'REVOKED', reason: actionReason.trim() },
      });
      notice = actionKind === 'extend' ? 'Masa aktif diperpanjang.' : 'Langganan dicabut.';
      actionId = null;
      actionKind = null;
      await load();
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      acting = false;
    }
  }

  const statusTone = (value: string) =>
    value === 'ACTIVE' ? 'success' : value === 'PENDING' ? 'warning' : 'neutral';
</script>

<svelte:head>
  <title>Langganan — Admin TES CAT</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">Langganan</h1>
      <p class="muted">
        Beri masa aktif tanpa pembayaran, perpanjang, atau cabut. Setiap aksi wajib alasan dan
        tercatat di audit log.
      </p>
    </div>
    <Button onclick={() => (grantOpen = !grantOpen)}>Grant manual</Button>
  </header>

  {#if error}
    <Alert tone="danger" title="Operasi gagal">{error}</Alert>
  {/if}

  {#if notice}
    <Alert tone="success" title="Berhasil">{notice}</Alert>
  {/if}

  {#if grantOpen}
    <Card title="Grant manual">
      <form
        class="form"
        onsubmit={(event) => {
          event.preventDefault();
          void submitGrant();
        }}
      >
        <label class="field">
          <span class="field__label">User ID</span>
          <input class="field__input" bind:value={grantUserId} required placeholder="UUID pengguna" />
        </label>

        <label class="field">
          <span class="field__label">Paket (opsional)</span>
          <select class="field__input" bind:value={grantPlanCode}>
            <option value="">— Durasi bebas —</option>
            {#each plans as plan (plan.id)}
              <option value={plan.code}>{plan.code} · {plan.name}</option>
            {/each}
          </select>
        </label>

        <label class="field">
          <span class="field__label">Durasi (hari)</span>
          <input
            class="field__input"
            type="number"
            min="1"
            max="3650"
            bind:value={grantDuration}
            disabled={Boolean(grantPlanCode)}
            required={!grantPlanCode}
          />
          <span class="field__hint">1–3650 hari. Kosongkan bila memilih paket.</span>
        </label>

        <label class="field">
          <span class="field__label">Mode</span>
          <select class="field__input" bind:value={grantMode}>
            <option value="STACK">STACK — tambahkan setelah masa aktif</option>
            <option value="REPLACE">REPLACE — cabut lalu mulai baru</option>
          </select>
        </label>

        <label class="field">
          <span class="field__label">Mulai (opsional)</span>
          <input class="field__input" type="date" bind:value={grantStartsAt} />
        </label>

        <label class="field field--wide">
          <span class="field__label">Alasan</span>
          <input class="field__input" bind:value={grantReason} required minlength="3" maxlength="500" />
        </label>

        <div class="form__actions">
          <Button type="submit" loading={granting}>Simpan grant</Button>
          <Button variant="secondary" onclick={() => (grantOpen = false)}>Batal</Button>
        </div>
      </form>
    </Card>
  {/if}

  <form
    class="filters"
    onsubmit={(event) => {
      event.preventDefault();
      void load();
    }}
  >
    <input
      class="filters__input"
      type="search"
      placeholder="Cari nama atau email"
      aria-label="Cari langganan"
      bind:value={query}
    />
    <select class="filters__input" aria-label="Filter status" bind:value={status}>
      <option value="">Semua status</option>
      <option value="ACTIVE">ACTIVE</option>
      <option value="PENDING">PENDING</option>
      <option value="EXPIRED">EXPIRED</option>
      <option value="REVOKED">REVOKED</option>
    </select>
    <input
      class="filters__input filters__input--short"
      type="number"
      min="0"
      max="365"
      placeholder="Akan habis (hari)"
      aria-label="Akan habis dalam hari"
      bind:value={expiringDays}
    />
    <Button type="submit" variant="secondary">Terapkan</Button>
  </form>

  {#if loading}
    <div class="center"><Spinner size={26} label="Memuat langganan" /></div>
  {:else if rows.length === 0}
    <Card title="Tidak ada langganan">
      <p class="muted">Ubah filter atau berikan langganan manual lewat tombol di atas.</p>
    </Card>
  {:else}
    <div class="table-wrap">
      <table class="table">
        <caption class="sr-only">Daftar langganan</caption>
        <thead>
          <tr>
            <th scope="col">Pengguna</th>
            <th scope="col">Paket</th>
            <th scope="col">Periode</th>
            <th scope="col">Status</th>
            <th scope="col">Sumber</th>
            <th scope="col"><span class="sr-only">Aksi</span></th>
          </tr>
        </thead>
        <tbody>
          {#each rows as row (row.id)}
            <tr>
              <td>
                <p class="user__name">{row.userFullName}</p>
                <p class="user__email">{row.userEmail}</p>
              </td>
              <td>{row.planName ?? row.planCode ?? '—'}</td>
              <td>
                <p>{formatDate(row.startsAt)}</p>
                <p class="muted">s/d {formatDate(row.endsAt)}</p>
              </td>
              <td><Badge tone={statusTone(row.status)}>{row.status}</Badge></td>
              <td class="muted">
                {row.source === 'MANUAL_GRANT' ? 'Grant admin' : row.source === 'TRIAL' ? 'Uji coba' : 'Pembelian'}
              </td>
              <td class="cell-actions">
                {#if row.status === 'ACTIVE' || row.status === 'PENDING'}
                  <Button size="sm" variant="secondary" onclick={() => startAction(row.id, 'extend')}>
                    Perpanjang
                  </Button>
                  <Button size="sm" variant="danger" onclick={() => startAction(row.id, 'revoke')}>
                    Cabut
                  </Button>
                {/if}
              </td>
            </tr>

            {#if actionId === row.id && actionKind}
              <tr class="action-row">
                <td colspan="6">
                  <form
                    class="action"
                    onsubmit={(event) => {
                      event.preventDefault();
                      void submitAction();
                    }}
                  >
                    <p class="action__title">
                      {actionKind === 'extend' ? 'Perpanjang masa aktif' : 'Cabut langganan'} — {row.userEmail}
                    </p>
                    {#if actionKind === 'extend'}
                      <label class="action__field">
                        <span>Tambah berapa hari?</span>
                        <input
                          class="filters__input"
                          type="number"
                          min="1"
                          max="3650"
                          bind:value={actionDays}
                          required
                        />
                      </label>
                    {/if}
                    <label class="action__field">
                      <span>Alasan (wajib)</span>
                      <textarea bind:value={actionReason} rows="2" minlength="3" maxlength="500" required></textarea>
                    </label>
                    <div class="action__buttons">
                      <Button type="submit" variant={actionKind === 'revoke' ? 'danger' : 'primary'} loading={acting}>
                        Konfirmasi
                      </Button>
                      <Button variant="secondary" onclick={() => (actionKind = null)}>Batal</Button>
                    </div>
                  </form>
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>

    {#if hasMore}
      <div class="more">
        <Button variant="secondary" loading={loadingMore} onclick={() => void load(false)}>
          Muat lebih banyak
        </Button>
      </div>
    {/if}
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

  .field__hint {
    font-size: var(--text-xs);
    color: var(--color-text-subtle);
  }

  .form__actions {
    display: flex;
    gap: var(--space-3);
    grid-column: 1 / -1;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .filters__input {
    padding: 0.5rem 0.7rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font-size: var(--text-sm);
  }

  .filters__input--short {
    width: 11rem;
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
    vertical-align: top;
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

  .user__name {
    font-weight: 600;
  }

  .user__email {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .cell-actions {
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
  }

  .action-row td {
    background: var(--color-surface-muted);
  }

  .action {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    max-width: 520px;
    white-space: normal;
  }

  .action__title {
    font-weight: 600;
  }

  .action__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font-size: var(--text-sm);
  }

  .action__field textarea {
    padding: 0.5rem 0.7rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    font: inherit;
  }

  .action__buttons {
    display: flex;
    gap: var(--space-2);
  }

  .more {
    display: flex;
    justify-content: center;
  }

  .center {
    display: grid;
    place-items: center;
    padding-block: var(--space-12);
  }
</style>
