<script lang="ts">
  import { onMount } from 'svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import { formatDateTime } from '$lib/format';
  import type { PlatformSettingsView } from '@webcat/contracts';

  let view = $state<PlatformSettingsView | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let notice = $state<string | null>(null);
  let saving = $state(false);

  let registrationEnabled = $state(false);
  let maintenanceMode = $state(false);
  let announcement = $state('');

  async function load() {
    loading = true;
    error = null;
    try {
      view = await apiRequest<PlatformSettingsView>('/admin/settings', {
        token: session.accessToken,
      });
      registrationEnabled = view.values['auth.registration_enabled'];
      maintenanceMode = view.values['platform.maintenance_mode'];
      announcement = view.values['platform.announcement'];
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void (async () => {
      await session.restore();
      if (session.can('settings.write')) await load();
      else loading = false;
    })();
  });

  async function save(event: SubmitEvent) {
    event.preventDefault();
    saving = true;
    error = null;
    notice = null;

    try {
      view = await apiRequest<PlatformSettingsView>('/admin/settings', {
        method: 'PATCH',
        token: session.accessToken,
        body: {
          'auth.registration_enabled': registrationEnabled,
          'platform.maintenance_mode': maintenanceMode,
          'platform.announcement': announcement,
        },
      });
      notice = 'Pengaturan tersimpan.';
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Pengaturan — Admin Web CAT</title>
</svelte:head>

<div class="page">
  <header>
    <h1 class="page__title">Pengaturan platform</h1>
    <p class="muted">Perubahan langsung berlaku tanpa deploy ulang.</p>
  </header>

  {#if !session.can('settings.write')}
    <Alert tone="warning" title="Akses terbatas">
      Hanya SUPER_ADMIN yang dapat mengubah pengaturan platform.
    </Alert>
  {:else if loading}
    <div class="center"><Spinner size={26} label="Memuat pengaturan" /></div>
  {:else}
    {#if error}<Alert tone="danger" title="Gagal menyimpan">{error}</Alert>{/if}
    {#if notice}<Alert tone="success">{notice}</Alert>{/if}

    <form class="stack" onsubmit={save}>
      <Card title="Pendaftaran publik" description="Default mati: akun peserta dibuat admin.">
        <label class="toggle">
          <input type="checkbox" bind:checked={registrationEnabled} />
          <span>
            <strong>Izinkan pendaftaran mandiri</strong>
            <span class="muted">
              Bila aktif, siapa pun dapat membuat akun lewat halaman daftar. Tidak disarankan
              untuk operasional ujian.
            </span>
          </span>
        </label>
        {#if view?.updated['auth.registration_enabled']}
          <p class="stamp">
            Terakhir diubah {formatDateTime(view.updated['auth.registration_enabled']?.updatedAt)}
          </p>
        {/if}
      </Card>

      <Card title="Mode pemeliharaan" description="Menampilkan pesan pemeliharaan pada klien.">
        <label class="toggle">
          <input type="checkbox" bind:checked={maintenanceMode} />
          <span>
            <strong>Aktifkan mode pemeliharaan</strong>
            <span class="muted">Gunakan saat deploy besar atau perbaikan database.</span>
          </span>
        </label>
        {#if view?.updated['platform.maintenance_mode']}
          <p class="stamp">
            Terakhir diubah {formatDateTime(view.updated['platform.maintenance_mode']?.updatedAt)}
          </p>
        {/if}
      </Card>

      <Card title="Pengumuman" description="Ditampilkan di dashboard peserta (maks. 500 karakter).">
        <label class="announcement">
          <span class="label">Teks pengumuman</span>
          <textarea
            bind:value={announcement}
            maxlength={500}
            rows="4"
            placeholder="Contoh: Ujian serentak dimulai Senin pukul 08.00 WIB."
          ></textarea>
          <span class="counter">{announcement.length}/500</span>
        </label>
        {#if view?.updated['platform.announcement']}
          <p class="stamp">
            Terakhir diubah {formatDateTime(view.updated['platform.announcement']?.updatedAt)}
          </p>
        {/if}
      </Card>

      <div class="actions">
        <Button type="submit" loading={saving}>Simpan pengaturan</Button>
      </div>
    </form>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    max-width: 760px;
  }

  .page__title {
    font-size: var(--text-2xl);
  }

  .stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .center {
    display: grid;
    place-items: center;
    min-height: 200px;
  }

  .toggle {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    cursor: pointer;
  }

  .toggle input {
    margin-top: 3px;
    width: 18px;
    height: 18px;
    accent-color: var(--color-primary);
  }

  .toggle span {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font-size: var(--text-sm);
  }

  .announcement {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .label {
    font-size: var(--text-sm);
    font-weight: 600;
  }

  textarea {
    width: 100%;
    resize: vertical;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font: inherit;
    font-size: var(--text-sm);
  }

  .counter {
    align-self: flex-end;
    font-size: var(--text-xs);
    color: var(--color-text-subtle);
  }

  .stamp {
    margin-top: var(--space-3);
    font-size: var(--text-xs);
    color: var(--color-text-subtle);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
  }
</style>
