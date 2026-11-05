<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
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
  import { formatDate, formatDateTime, formatIdr } from '$lib/format';
  import {
    examSummaryLine,
    formatScore,
    paymentSummaryLine,
    remainingDaysLabel,
    sessionStatus,
    subscriptionStatus,
    transactionStatus,
    userStatus,
  } from '$lib/admin/user-detail';
  import type { AdminUserOverview } from '@webcat/contracts';

  const id = $derived(page.params.id ?? '');

  let overview = $state<AdminUserOverview | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Form perbaikan data profil. Email tidak diubah dari sini karena dipakai
  // sebagai identitas login (lihat adminUpdateUserSchema di contracts).
  let editName = $state('');
  let editPhone = $state('');
  let editReason = $state('');
  let savingProfile = $state(false);
  let profileError = $state<string | null>(null);
  let profileSaved = $state(false);

  let deleteReason = $state('');
  let deleting = $state(false);
  let deleteError = $state<string | null>(null);

  async function load() {
    loading = true;
    error = null;

    try {
      overview = await apiRequest<AdminUserOverview>(`/admin/users/${id}/overview`, {
        token: session.accessToken,
        cacheTtlMs: 0,
      });
      editName = overview.profile.fullName;
      editPhone = overview.profile.phone ?? '';
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      loading = false;
    }
  }

  async function saveProfile(event: SubmitEvent) {
    event.preventDefault();
    if (savingProfile) return;

    savingProfile = true;
    profileError = null;
    profileSaved = false;

    try {
      await apiRequest(`/admin/users/${id}`, {
        method: 'PATCH',
        token: session.accessToken,
        body: {
          fullName: editName.trim(),
          phone: editPhone.trim() ? editPhone.trim() : null,
          ...(editReason.trim() ? { reason: editReason.trim() } : {}),
        },
      });
      profileSaved = true;
      editReason = '';
      await load();
    } catch (cause) {
      profileError = apiErrorMessage(cause);
    } finally {
      savingProfile = false;
    }
  }

  async function removeUser(event: SubmitEvent) {
    event.preventDefault();
    if (deleting) return;

    deleting = true;
    deleteError = null;

    try {
      await apiRequest(`/admin/users/${id}`, {
        method: 'DELETE',
        token: session.accessToken,
        body: { reason: deleteReason.trim() },
      });
      await goto(`${adminBase()}/users`);
    } catch (cause) {
      deleteError = apiErrorMessage(cause);
      deleting = false;
    }
  }

  onMount(() => {
    void load();
  });
</script>

<svelte:head>
  <title>Detail pengguna — Admin TES CAT</title>
</svelte:head>

<div class="adm-page">
  <AdminPageHeader
    eyebrow="Pengguna"
    title={overview?.profile.fullName ?? 'Detail pengguna'}
    description={overview?.profile.email ?? 'Memuat data peserta…'}
  >
    {#snippet actions()}
      <Button variant="secondary" href={`${adminBase()}/users`}>Kembali ke daftar</Button>
      <Button
        variant="ghost"
        onclick={() => {
          void load();
        }}
        disabled={loading}
      >
        Muat ulang
      </Button>
    {/snippet}
  </AdminPageHeader>

  {#if error}
    <Alert tone="danger" title="Gagal memuat detail pengguna">{error}</Alert>
  {:else if loading}
    <div class="adm-center"><Spinner size={26} label="Memuat detail pengguna" /></div>
  {:else if overview}
    {@const profile = overview.profile}
    <div class="adm-grid-2">
      <!-- ------------------------------------------------------------ profil -->
      <Card title="Profil" padding="md">
        <dl class="facts">
          <div class="facts__row">
            <dt>Status akun</dt>
            <dd>
              <Badge tone={userStatus(profile.status).tone}>
                {userStatus(profile.status).label}
              </Badge>
            </dd>
          </div>
          <div class="facts__row">
            <dt>Role</dt>
            <dd><Badge tone={profile.role === 'USER' ? 'neutral' : 'brand'}>{profile.role}</Badge></dd>
          </div>
          <div class="facts__row">
            <dt>Verifikasi email</dt>
            <dd>
              {#if profile.emailVerified}
                <Badge tone="success">Terverifikasi</Badge>
              {:else}
                <Badge tone="warning">Belum terverifikasi</Badge>
              {/if}
            </dd>
          </div>
          <div class="facts__row">
            <dt>Telepon</dt>
            <dd>{profile.phone ?? '—'}</dd>
          </div>
          <div class="facts__row">
            <dt>Terdaftar</dt>
            <dd>{formatDate(profile.createdAt)}</dd>
          </div>
          <div class="facts__row">
            <dt>Dibuat oleh</dt>
            <dd class="adm-mono">{profile.createdBy ?? '—'}</dd>
          </div>
        </dl>
      </Card>

      <!-- -------------------------------------------------------- langganan -->
      <Card title="Langganan" padding="md">
        {#if overview.subscription}
          {@const active = overview.subscription}
          <p class="highlight">
            <strong>{active.planName ?? active.planCode ?? 'Paket khusus'}</strong>
          </p>
          <p class="adm-muted">
            Aktif sampai <strong>{formatDate(active.endsAt)}</strong>
            · {remainingDaysLabel(active.remainingDays)}
          </p>
          <p class="adm-muted">Sumber: {active.source}</p>
        {:else}
          <Alert tone="warning" title="Tidak ada langganan aktif">
            Peserta ini tidak punya langganan yang sedang berjalan. Perpanjang lewat
            menu Langganan bila perlu.
          </Alert>
        {/if}

        {#if overview.subscriptionHistory.length > 0}
          <h4 class="subhead">Riwayat</h4>
          <ul class="timeline">
            {#each overview.subscriptionHistory as row (row.id)}
              <li class="timeline__item">
                <div class="timeline__head">
                  <span>{row.planName ?? row.planCode ?? 'Paket khusus'}</span>
                  <Badge tone={subscriptionStatus(row.status).tone}>
                    {subscriptionStatus(row.status).label}
                  </Badge>
                </div>
                <p class="adm-muted">
                  {formatDate(row.startsAt)} — {formatDate(row.endsAt)}
                </p>
                {#if row.revokeReason}
                  <p class="adm-muted">Dicabut: {row.revokeReason}</p>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </Card>
    </div>

    <!-- ------------------------------------------------------------ kelola -->
    <div class="adm-grid-2">
      {#if session.can('users.update')}
        <Card title="Perbaiki data peserta" padding="md">
          <form class="form" onsubmit={saveProfile}>
            <Field label="Nama lengkap" for="editName" required>
              <Input id="editName" bind:value={editName} required autocomplete="name" />
            </Field>
            <Field
              label="Nomor WhatsApp"
              for="editPhone"
              hint="Kosongkan untuk menghapus nomor. Format 62xxxxxxxxxx."
            >
              <Input id="editPhone" type="tel" bind:value={editPhone} placeholder="6281234567890" />
            </Field>
            <Field label="Alasan perubahan" for="editReason" hint="Opsional, tercatat di audit log.">
              <Input id="editReason" bind:value={editReason} />
            </Field>

            {#if profileError}
              <Alert tone="danger" title="Gagal menyimpan perubahan">{profileError}</Alert>
            {/if}
            {#if profileSaved}
              <Alert tone="success" title="Tersimpan">Data peserta diperbarui.</Alert>
            {/if}

            <div class="actions">
              <Button type="submit" loading={savingProfile} disabled={!editName.trim()}>
                Simpan perubahan
              </Button>
            </div>
          </form>
        </Card>
      {/if}

      {#if session.can('users.delete')}
        <Card title="Hapus akun" padding="md">
          <Alert tone="warning" title="Tindakan permanen">
            Akun tidak bisa login lagi dan hilang dari daftar pengguna. Riwayat ujian, langganan,
            dan transaksi tetap tersimpan untuk audit.
          </Alert>

          <form class="form" onsubmit={removeUser}>
            <Field
              label="Alasan penghapusan"
              for="deleteReason"
              required
              hint="Minimal 3 karakter. Tercatat di audit log."
            >
              <Input id="deleteReason" bind:value={deleteReason} required />
            </Field>

            {#if deleteError}
              <Alert tone="danger" title="Gagal menghapus akun">{deleteError}</Alert>
            {/if}

            <div class="actions">
              <Button
                type="submit"
                variant="danger"
                loading={deleting}
                disabled={deleteReason.trim().length < 3}
              >
                Hapus akun
              </Button>
            </div>
          </form>
        </Card>
      {/if}
    </div>

    <!-- ------------------------------------------------------------- ujian -->
    <Card title="Riwayat ujian" description={examSummaryLine(overview.exams)} padding="none">
      {#if overview.exams.recent.length === 0}
        <p class="empty">Peserta ini belum pernah memulai sesi ujian.</p>
      {:else}
        <div class="adm-panel adm-scroll">
          <table class="adm-table">
            <caption class="sr-only">Riwayat sesi ujian peserta</caption>
            <thead>
              <tr>
                <th scope="col">Tanggal ujian</th>
                <th scope="col">Status</th>
                <th scope="col">Skor</th>
                <th scope="col">Hasil</th>
                <th scope="col">Mulai</th>
                <th scope="col">Selesai</th>
              </tr>
            </thead>
            <tbody>
              {#each overview.exams.recent as row (row.id)}
                <tr>
                  <td class="adm-nowrap">{formatDate(row.examDate)}</td>
                  <td>
                    <Badge tone={sessionStatus(row.status).tone}>
                      {sessionStatus(row.status).label}
                    </Badge>
                  </td>
                  <td class="adm-nowrap">{formatScore(row.totalScore)}</td>
                  <td>
                    {#if row.passed === true}
                      <Badge tone="success">Lulus</Badge>
                    {:else if row.passed === false}
                      <Badge tone="danger">
                        {row.eliminatedSubtestCode
                          ? `Gugur di ${row.eliminatedSubtestCode}`
                          : 'Tidak lulus'}
                      </Badge>
                    {:else}
                      <span class="adm-muted">—</span>
                    {/if}
                  </td>
                  <td class="adm-nowrap adm-muted">{formatDateTime(row.startedAt)}</td>
                  <td class="adm-nowrap adm-muted">{formatDateTime(row.finishedAt)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </Card>

    <!-- --------------------------------------------------------- pembayaran -->
    <Card title="Riwayat pembayaran" description={paymentSummaryLine(overview.payments, formatIdr)} padding="none">
      {#if overview.payments.recent.length === 0}
        <p class="empty">Belum ada transaksi untuk peserta ini.</p>
      {:else}
        <div class="adm-panel adm-scroll">
          <table class="adm-table">
            <caption class="sr-only">Riwayat transaksi peserta</caption>
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Paket</th>
                <th scope="col">Nominal</th>
                <th scope="col">Status</th>
                <th scope="col">Dibayar</th>
                <th scope="col">Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {#each overview.payments.recent as row (row.id)}
                <tr>
                  <td class="adm-mono">{row.orderId}</td>
                  <td>{row.planName ?? row.planCode ?? '—'}</td>
                  <td class="adm-nowrap">{formatIdr(row.amountIdr)}</td>
                  <td>
                    <Badge tone={transactionStatus(row.status).tone}>
                      {transactionStatus(row.status).label}
                    </Badge>
                  </td>
                  <td class="adm-nowrap adm-muted">{formatDateTime(row.paidAt)}</td>
                  <td class="adm-nowrap adm-muted">{formatDateTime(row.createdAt)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </Card>
  {/if}
</div>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }

  .facts {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .facts__row {
    display: grid;
    grid-template-columns: 10rem 1fr;
    gap: var(--space-2);
    align-items: baseline;
  }

  .facts__row dt {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .facts__row dd {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .highlight {
    font-size: var(--text-lg);
  }

  .subhead {
    margin-top: var(--space-4);
    margin-bottom: var(--space-2);
    font-size: var(--text-sm);
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-text-subtle);
  }

  .timeline {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .timeline__item {
    border-left: 2px solid var(--color-border);
    padding-left: var(--space-3);
  }

  .timeline__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    font-weight: 600;
  }

  .empty {
    padding: var(--space-4);
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }
</style>
