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
    quotaSummaryLine,
    remainingDaysLabel,
    roleLabel,
    sessionStatus,
    subscriptionStatus,
    transactionStatus,
    userStatus,
  } from '$lib/admin/user-detail';
  import type {
    AdminPlan,
    AdminUserOverview,
    QuotaResetResponse,
    Role,
  } from '@webcat/contracts';

  const id = $derived(page.params.id ?? '');

  let overview = $state<AdminUserOverview | null>(null);
  let plans = $state<AdminPlan[]>([]);
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

  // --- aktivasi akun -------------------------------------------------------
  let statusReason = $state('');
  let savingStatus = $state(false);
  let statusError = $state<string | null>(null);
  let statusNotice = $state<string | null>(null);

  // --- role ----------------------------------------------------------------
  let roleValue = $state<Role>('USER');
  let roleReason = $state('');
  let savingRole = $state(false);
  let roleError = $state<string | null>(null);
  let roleNotice = $state<string | null>(null);

  // --- kuota harian --------------------------------------------------------
  let quotaReason = $state('');
  let resettingQuota = $state(false);
  let quotaError = $state<string | null>(null);
  let quotaNotice = $state<string | null>(null);

  // --- langganan -----------------------------------------------------------
  let subPlanCode = $state('');
  let subDays = $state(30);
  let subMode = $state<'STACK' | 'REPLACE'>('STACK');
  let subReason = $state('');
  let savingSub = $state(false);
  let subError = $state<string | null>(null);
  let subNotice = $state<string | null>(null);

  let revokeReason = $state('');
  let revokingSub = $state(false);
  let revokeError = $state<string | null>(null);

  const isSelf = $derived(Boolean(overview && session.user && overview.profile.id === session.user.id));
  const canManageSubscription = $derived(session.can('subscriptions.manage'));

  async function load() {
    loading = true;
    error = null;

    try {
      // Layout memulihkan sesi secara asinkron; tunggu agar token dan daftar
      // permission sudah siap sebelum memutuskan panel mana yang dirender.
      if (!session.accessToken) {
        await session.restore();
      }

      const token = session.accessToken;
      overview = await apiRequest<AdminUserOverview>(`/admin/users/${id}/overview`, {
        token,
        cacheTtlMs: 0,
      });
      editName = overview.profile.fullName;
      editPhone = overview.profile.phone ?? '';
      roleValue = overview.profile.role;

      // Daftar paket hanya dibutuhkan tombol "Beri langganan"; kegagalannya
      // tidak boleh menggagalkan seluruh halaman.
      if (canManageSubscription && plans.length === 0) {
        try {
          plans = await apiRequest<AdminPlan[]>('/admin/plans', {
            token,
            cacheTtlMs: 60000,
          });
        } catch {
          plans = [];
        }
      }
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

  async function changeStatus(status: 'ACTIVE' | 'SUSPENDED') {
    if (savingStatus) return;

    savingStatus = true;
    statusError = null;
    statusNotice = null;

    try {
      await apiRequest(`/admin/users/${id}/status`, {
        method: 'PATCH',
        token: session.accessToken,
        body: {
          status,
          ...(statusReason.trim() ? { reason: statusReason.trim() } : {}),
        },
      });
      statusNotice = status === 'ACTIVE' ? 'Akun diaktifkan.' : 'Akun ditangguhkan.';
      statusReason = '';
      await load();
    } catch (cause) {
      statusError = apiErrorMessage(cause);
    } finally {
      savingStatus = false;
    }
  }

  async function saveRole(event: SubmitEvent) {
    event.preventDefault();
    if (savingRole) return;

    savingRole = true;
    roleError = null;
    roleNotice = null;

    try {
      await apiRequest(`/admin/users/${id}/role`, {
        method: 'PATCH',
        token: session.accessToken,
        body: {
          role: roleValue,
          ...(roleReason.trim() ? { reason: roleReason.trim() } : {}),
        },
      });
      roleNotice = `Role diubah menjadi ${roleLabel(roleValue)}.`;
      roleReason = '';
      await load();
    } catch (cause) {
      roleError = apiErrorMessage(cause);
    } finally {
      savingRole = false;
    }
  }

  async function resetDailyQuota(event: SubmitEvent) {
    event.preventDefault();
    if (resettingQuota) return;

    resettingQuota = true;
    quotaError = null;
    quotaNotice = null;

    try {
      const result = await apiRequest<QuotaResetResponse>(`/admin/users/${id}/quota-reset`, {
        method: 'POST',
        token: session.accessToken,
        body: { reason: quotaReason.trim() },
      });
      quotaNotice = result.message;
      quotaReason = '';
      await load();
    } catch (cause) {
      quotaError = apiErrorMessage(cause);
    } finally {
      resettingQuota = false;
    }
  }

  /**
   * Satu formulir untuk dua niat: memberi langganan baru (bila belum ada yang
   * aktif) atau memperpanjang yang sedang berjalan. Endpoint-nya berbeda, jadi
   * pemilihan dilakukan di sini agar UI tetap satu tombol.
   */
  async function saveSubscription(event: SubmitEvent) {
    event.preventDefault();
    if (savingSub) return;

    savingSub = true;
    subError = null;
    subNotice = null;

    try {
      const active = overview?.subscription ?? null;

      if (active) {
        await apiRequest(`/admin/subscriptions/${active.id}`, {
          method: 'PATCH',
          token: session.accessToken,
          body: { extendDays: subDays, reason: subReason.trim() },
        });
        subNotice = `Langganan diperpanjang ${subDays} hari.`;
      } else {
        await apiRequest('/admin/subscriptions', {
          method: 'POST',
          token: session.accessToken,
          body: {
            userId: id,
            mode: subMode,
            ...(subPlanCode ? { planCode: subPlanCode } : { durationDays: subDays }),
            reason: subReason.trim(),
          },
        });
        subNotice = 'Langganan diberikan.';
      }

      subReason = '';
      await load();
    } catch (cause) {
      subError = apiErrorMessage(cause);
    } finally {
      savingSub = false;
    }
  }

  async function revokeSubscription(event: SubmitEvent) {
    event.preventDefault();
    const active = overview?.subscription;
    if (!active || revokingSub) return;

    revokingSub = true;
    revokeError = null;
    subNotice = null;

    try {
      await apiRequest(`/admin/subscriptions/${active.id}`, {
        method: 'PATCH',
        token: session.accessToken,
        body: { status: 'REVOKED', reason: revokeReason.trim() },
      });
      revokeReason = '';
      subNotice = 'Langganan dicabut.';
      await load();
    } catch (cause) {
      revokeError = apiErrorMessage(cause);
    } finally {
      revokingSub = false;
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
            <dd><Badge tone={profile.role === 'USER' ? 'neutral' : 'brand'}>{roleLabel(profile.role)}</Badge></dd>
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
            Peserta ini tidak punya langganan yang sedang berjalan. Beri masa langganan lewat
            formulir di bawah.
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

        {#if canManageSubscription}
          <h4 class="subhead">
            {overview.subscription ? 'Perpanjang langganan' : 'Beri langganan'}
          </h4>
          <form class="form" onsubmit={saveSubscription}>
            {#if !overview.subscription}
              <Field
                label="Paket"
                for="subPlan"
                hint="Pilih “Durasi manual” bila ingin menentukan jumlah hari sendiri."
              >
                <select id="subPlan" class="adm-select adm-select--full" bind:value={subPlanCode}>
                  <option value="">Durasi manual</option>
                  {#each plans.filter((plan) => plan.status !== 'ARCHIVED') as plan (plan.id)}
                    <option value={plan.code}>{plan.name} ({plan.durationDays} hari)</option>
                  {/each}
                </select>
              </Field>
            {/if}

            {#if overview.subscription || !subPlanCode}
              <Field
                label={overview.subscription ? 'Tambah hari' : 'Durasi (hari)'}
                for="subDays"
                required
                hint={overview.subscription ? 'Ditambahkan setelah tanggal berakhir saat ini.' : '1–3650 hari.'}
              >
                <Input id="subDays" type="number" min={1} max={3650} bind:value={subDays} required />
              </Field>
            {/if}

            {#if !overview.subscription}
              <Field label="Mode" for="subMode" hint="STACK menambah setelah paket lain berakhir; REPLACE menimpa.">
                <select id="subMode" class="adm-select adm-select--full" bind:value={subMode}>
                  <option value="STACK">STACK — tambahkan setelah langganan berakhir</option>
                  <option value="REPLACE">REPLACE — timpa langganan yang ada</option>
                </select>
              </Field>
            {/if}

            <Field label="Alasan" for="subReason" required hint="Minimal 3 karakter. Tercatat di audit log.">
              <Input id="subReason" bind:value={subReason} required />
            </Field>

            {#if subError}
              <Alert tone="danger" title="Gagal menyimpan langganan">{subError}</Alert>
            {/if}
            {#if subNotice}
              <Alert tone="success" title="Tersimpan">{subNotice}</Alert>
            {/if}

            <div class="actions">
              <Button
                type="submit"
                loading={savingSub}
                disabled={subReason.trim().length < 3 || (!overview.subscription && !subPlanCode && subDays < 1)}
              >
                {overview.subscription ? 'Perpanjang' : 'Beri langganan'}
              </Button>
            </div>
          </form>

          {#if overview.subscription}
            <form class="form form--danger" onsubmit={revokeSubscription}>
              <h4 class="subhead">Cabut langganan</h4>
              <Field label="Alasan pencabutan" for="revokeReason" required hint="Minimal 3 karakter.">
                <Input id="revokeReason" bind:value={revokeReason} required />
              </Field>
              {#if revokeError}
                <Alert tone="danger" title="Gagal mencabut langganan">{revokeError}</Alert>
              {/if}
              <div class="actions">
                <Button
                  type="submit"
                  variant="danger"
                  loading={revokingSub}
                  disabled={revokeReason.trim().length < 3}
                >
                  Cabut langganan
                </Button>
              </div>
            </form>
          {/if}
        {/if}
      </Card>
    </div>

    <!-- ------------------------------------------------------------ kelola -->
    <h2 class="section-title">Kelola akun</h2>
    <div class="adm-grid-2">
      <!-- -------------------------------------------------------- aktivasi -->
      {#if session.can('users.suspend')}
        <Card title="Aktivasi akun" description="Aktifkan atau tangguhkan akses masuk peserta." padding="md">
          <p class="adm-muted">
            Status saat ini:
            <Badge tone={userStatus(profile.status).tone}>{userStatus(profile.status).label}</Badge>
          </p>

          <Field label="Alasan" for="statusReason" hint="Opsional, tetapi dianjurkan untuk penangguhan.">
            <Input id="statusReason" bind:value={statusReason} />
          </Field>

          {#if statusError}
            <Alert tone="danger" title="Gagal mengubah status akun">{statusError}</Alert>
          {/if}
          {#if statusNotice}
            <Alert tone="success" title="Berhasil">{statusNotice}</Alert>
          {/if}

          {#if isSelf}
            <Alert tone="info" title="Ini akun Anda">
              Anda tidak dapat menonaktifkan akun sendiri.
            </Alert>
          {/if}

          <div class="actions">
            {#if profile.status !== 'ACTIVE'}
              <Button
                variant="success"
                loading={savingStatus}
                onclick={() => void changeStatus('ACTIVE')}
              >
                Aktifkan akun
              </Button>
            {/if}
            {#if profile.status === 'ACTIVE'}
              <Button
                variant="danger"
                loading={savingStatus}
                disabled={isSelf}
                onclick={() => void changeStatus('SUSPENDED')}
              >
                Tangguhkan
              </Button>
            {/if}
          </div>
        </Card>
      {/if}

      <!-- ------------------------------------------------------ kuota harian -->
      {#if session.can('exams.recompute')}
        <Card
          title="Kuota ujian harian"
          description={quotaSummaryLine(overview.quota)}
          padding="md"
        >
          <dl class="facts">
            <div class="facts__row">
              <dt>Tanggal (WIB)</dt>
              <dd>{formatDate(overview.quota.examDate)}</dd>
            </div>
            <div class="facts__row">
              <dt>Terpakai hari ini</dt>
              <dd>{overview.quota.usedToday} dari {overview.quota.dailyLimit} sesi</dd>
            </div>
            <div class="facts__row">
              <dt>Sisa kuota</dt>
              <dd>
                {#if overview.quota.remainingToday > 0}
                  <Badge tone="success">{overview.quota.remainingToday} sesi</Badge>
                {:else}
                  <Badge tone="danger">Habis</Badge>
                {/if}
              </dd>
            </div>
            {#if overview.quota.voidedToday > 0}
              <div class="facts__row">
                <dt>Dibatalkan admin</dt>
                <dd>{overview.quota.voidedToday} sesi hari ini</dd>
              </div>
            {/if}
          </dl>

          <form class="form" onsubmit={resetDailyQuota}>
            <Field
              label="Alasan reset"
              for="quotaReason"
              required
              hint="Minimal 10 karakter. Sesi hari ini akan di-void dan peserta bisa mencoba lagi."
            >
              <Input id="quotaReason" bind:value={quotaReason} required />
            </Field>

            {#if quotaError}
              <Alert tone="danger" title="Gagal mereset kuota">{quotaError}</Alert>
            {/if}
            {#if quotaNotice}
              <Alert tone="success" title="Kuota direset">{quotaNotice}</Alert>
            {/if}

            <div class="actions">
              <Button
                type="submit"
                variant="secondary"
                loading={resettingQuota}
                disabled={quotaReason.trim().length < 10 || overview.quota.usedToday === 0}
              >
                Reset kuota hari ini
              </Button>
            </div>
          </form>
        </Card>
      {/if}

      <!-- ------------------------------------------------------------- role -->
      {#if session.can('roles.manage')}
        <Card title="Role dan izin" description="Hanya SUPER_ADMIN yang dapat mengubah role." padding="md">
          <form class="form" onsubmit={saveRole}>
            <Field label="Role" for="roleValue" required>
              <select id="roleValue" class="adm-select adm-select--full" bind:value={roleValue}>
                <option value="USER">USER — peserta</option>
                <option value="ADMIN">ADMIN — staf operator</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN — akses penuh</option>
              </select>
            </Field>
            <Field label="Alasan perubahan" for="roleReason" hint="Opsional, tercatat di audit log.">
              <Input id="roleReason" bind:value={roleReason} />
            </Field>

            {#if roleError}
              <Alert tone="danger" title="Gagal mengubah role">{roleError}</Alert>
            {/if}
            {#if roleNotice}
              <Alert tone="success" title="Berhasil">{roleNotice}</Alert>
            {/if}
            {#if isSelf}
              <Alert tone="info" title="Ini akun Anda">
                Menurunkan role sendiri dapat menghilangkan akses panel ini.
              </Alert>
            {/if}

            <div class="actions">
              <Button
                type="submit"
                loading={savingRole}
                disabled={roleValue === profile.role}
              >
                Simpan role
              </Button>
            </div>
          </form>
        </Card>
      {/if}

      <!-- ------------------------------------------------------------ profil edit -->
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

      <!-- ------------------------------------------------------------- hapus -->
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
                disabled={deleteReason.trim().length < 3 || isSelf}
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

  .form--danger {
    margin-top: var(--space-5);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }

  .section-title {
    font-size: var(--text-lg);
    font-weight: 700;
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
