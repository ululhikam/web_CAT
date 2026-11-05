<script lang="ts">
  import { onMount } from 'svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Field from '@webcat/ui/components/Field.svelte';
  import Input from '@webcat/ui/components/Input.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import { formatDate } from '$lib/format';
  import type { AdminUserSummary, AvatarUploadResponse, MessageResult } from '@webcat/contracts';

  let profile = $state<AdminUserSummary | null>(null);
  let loading = $state(!session.user);
  let loadError = $state<string | null>(null);

  let fullName = $state(session.user?.fullName ?? '');
  let phone = $state(session.user?.phone ?? '');
  let saving = $state(false);
  let saveError = $state<string | null>(null);
  let saveNotice = $state<string | null>(null);

  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let passwordSaving = $state(false);
  let passwordError = $state<string | null>(null);
  let passwordNotice = $state<string | null>(null);

  let avatarBusy = $state(false);
  let avatarError = $state<string | null>(null);
  let avatarNotice = $state<string | null>(null);

  async function load() {
    if (!profile && !session.user) loading = true;
    loadError = null;
    try {
      profile = await apiRequest<AdminUserSummary>('/users/me', { token: session.accessToken });
      fullName = profile.fullName;
      phone = profile.phone ?? '';
    } catch (cause) {
      loadError = apiErrorMessage(cause);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void (async () => {
      await session.restore();
      await load();
    })();
  });

  async function saveProfile(event: SubmitEvent) {
    event.preventDefault();
    saving = true;
    saveError = null;
    saveNotice = null;

    try {
      const updated = await apiRequest<AdminUserSummary>('/users/me', {
        method: 'PATCH',
        token: session.accessToken,
        body: { fullName, phone: phone.trim() ? phone.trim() : null },
      });
      profile = updated;
      if (session.user) session.user.fullName = updated.fullName;
      saveNotice = 'Profil tersimpan.';
    } catch (cause) {
      saveError = apiErrorMessage(cause);
    } finally {
      saving = false;
    }
  }

  async function changePassword(event: SubmitEvent) {
    event.preventDefault();
    passwordError = null;
    passwordNotice = null;

    if (newPassword !== confirmPassword) {
      passwordError = 'Konfirmasi password tidak sama.';
      return;
    }

    passwordSaving = true;
    try {
      await apiRequest<MessageResult>('/users/me/password', {
        method: 'PATCH',
        token: session.accessToken,
        body: { currentPassword, newPassword },
      });
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
      passwordNotice = 'Password berhasil diubah.';
    } catch (cause) {
      passwordError = apiErrorMessage(cause);
    } finally {
      passwordSaving = false;
    }
  }

  async function uploadAvatar(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    avatarBusy = true;
    avatarError = null;
    avatarNotice = null;

    try {
      const upload = await apiRequest<AvatarUploadResponse>('/users/me/avatar', {
        method: 'POST',
        token: session.accessToken,
        body: { contentType: file.type, sizeBytes: file.size },
      });

      // Signed upload langsung ke storage; API hanya menyimpan path.
      const response = await fetch(upload.signedUrl, {
        method: 'PUT',
        headers: { 'content-type': file.type, 'x-upsert': 'true' },
        body: file,
      });

      const isDevStorage = upload.signedUrl.includes('/dev-storage/');
      if (!response.ok && !isDevStorage) {
        throw new Error('Berkas gagal diunggah ke storage.');
      }

      avatarNotice = isDevStorage
        ? 'Mode dev: metadata avatar tersimpan, berkas tidak diunggah ke storage nyata.'
        : 'Avatar berhasil diunggah.';
      await load();
    } catch (cause) {
      avatarError = apiErrorMessage(cause);
    } finally {
      avatarBusy = false;
      input.value = '';
    }
  }
</script>

<svelte:head>
  <title>Profil — TES CAT</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">Profil</h1>
      <p class="muted">Kelola data akun, avatar, dan password Anda.</p>
    </div>
    <Button href="/devices" variant="secondary">Perangkat & sesi</Button>
  </header>

  {#if loadError}
    <Alert tone="danger" title="Gagal memuat profil">{loadError}</Alert>
  {/if}

  {#if loading}
    <div class="center"><Spinner size={26} label="Memuat profil" /></div>
  {:else if profile}
    <div class="grid">
      <Card title="Data akun" description="Email tidak dapat diubah sendiri; hubungi admin bila perlu.">
        <div class="identity">
          <div class="identity__row">
            <span class="identity__label">Email</span>
            <span>{profile.email}</span>
          </div>
          <div class="identity__row">
            <span class="identity__label">Role</span>
            <Badge tone={profile.role === 'USER' ? 'neutral' : 'brand'}>{profile.role}</Badge>
          </div>
          <div class="identity__row">
            <span class="identity__label">Status</span>
            <Badge tone={profile.status === 'ACTIVE' ? 'success' : 'warning'}>{profile.status}</Badge>
          </div>
          <div class="identity__row">
            <span class="identity__label">Terdaftar</span>
            <span>{formatDate(profile.createdAt)}</span>
          </div>
        </div>

        <form class="form" onsubmit={saveProfile}>
          {#if saveError}<Alert tone="danger">{saveError}</Alert>{/if}
          {#if saveNotice}<Alert tone="success">{saveNotice}</Alert>{/if}

          <Field label="Nama lengkap" for="fullName" required>
            <Input id="fullName" bind:value={fullName} autocomplete="name" maxlength={120} required />
          </Field>

          <Field
            label="Nomor WhatsApp"
            for="phone"
            hint="Format 62xxxxxxxxxx. Kosongkan bila tidak ingin mencantumkan nomor."
          >
            <Input id="phone" type="tel" bind:value={phone} autocomplete="tel" placeholder="6281234567890" />
          </Field>

          <div class="actions">
            <Button type="submit" loading={saving}>Simpan profil</Button>
          </div>
        </form>
      </Card>

      <Card title="Avatar" description="JPEG, PNG, atau WebP maksimal 2 MB. Berkas diunggah langsung ke storage.">
        {#if avatarError}<Alert tone="danger">{avatarError}</Alert>{/if}
        {#if avatarNotice}<Alert tone="success">{avatarNotice}</Alert>{/if}

        <div class="avatar">
          <div class="avatar__preview" aria-hidden="true">
            {#if profile.fullName}
              {profile.fullName.slice(0, 1).toUpperCase()}
            {:else}?{/if}
          </div>
          <div class="avatar__body">
            <p class="muted">
              {profile.avatarPath ? 'Avatar sudah tercatat.' : 'Belum ada avatar.'}
            </p>
            <input
              class="file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onchange={uploadAvatar}
              disabled={avatarBusy}
              aria-label="Pilih berkas avatar"
            />
            {#if avatarBusy}<Spinner size={20} label="Mengunggah avatar" />{/if}
          </div>
        </div>
      </Card>

      <Card title="Ubah password" description="Semua perangkat lain akan tetap aktif; cabut manual bila perlu.">
        <form class="form" onsubmit={changePassword}>
          {#if passwordError}<Alert tone="danger">{passwordError}</Alert>{/if}
          {#if passwordNotice}<Alert tone="success">{passwordNotice}</Alert>{/if}

          <Field label="Password saat ini" for="currentPassword" required>
            <Input
              id="currentPassword"
              type="password"
              bind:value={currentPassword}
              autocomplete="current-password"
              required
            />
          </Field>

          <Field
            label="Password baru"
            for="newPassword"
            required
            hint="Minimal 10 karakter, mengandung huruf besar, huruf kecil, dan angka."
          >
            <Input
              id="newPassword"
              type="password"
              bind:value={newPassword}
              autocomplete="new-password"
              required
            />
          </Field>

          <Field label="Ulangi password baru" for="confirmPassword" required>
            <Input
              id="confirmPassword"
              type="password"
              bind:value={confirmPassword}
              autocomplete="new-password"
              required
            />
          </Field>

          <div class="actions">
            <Button type="submit" loading={passwordSaving}>Ubah password</Button>
          </div>
        </form>
      </Card>
    </div>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    max-width: 920px;
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

  .grid {
    display: grid;
    gap: var(--space-5);
  }

  .center {
    display: grid;
    place-items: center;
    min-height: 200px;
  }

  .identity {
    display: grid;
    gap: var(--space-2);
    margin-bottom: var(--space-5);
    padding-bottom: var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  .identity__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    font-size: var(--text-sm);
  }

  .identity__label {
    color: var(--color-text-muted);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
  }

  .avatar {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .avatar__preview {
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    border-radius: var(--radius-full);
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-size: var(--text-2xl);
    font-weight: 700;
  }

  .avatar__body {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
  }

  .file {
    font-size: var(--text-sm);
  }

  @media (min-width: 900px) {
    .grid {
      grid-template-columns: 1fr 1fr;
    }

    .grid > :first-child {
      grid-column: 1 / -1;
    }
  }
</style>
