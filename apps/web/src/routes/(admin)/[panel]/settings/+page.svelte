<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import AdminPageHeader from '$lib/components/admin/AdminPageHeader.svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import { adminBase } from '$lib/panel-route';
  import { session } from '$lib/stores/session.svelte';
  import { formatDateTime } from '$lib/format';
  import type { PlatformSettingsView } from '@webcat/contracts';

  let view = $state<PlatformSettingsView | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let notice = $state<string | null>(null);
  let saving = $state(false);

  let registrationEnabled = $state(false);
  let sessionPolicy = $state<'replace' | 'reject'>('replace');
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
      sessionPolicy = view.values['auth.session_policy'];
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

      // Pengaturan platform khusus SUPER_ADMIN: ADMIN dikembalikan ke panelnya.
      if (!session.isSuperAdmin) {
        await goto(adminBase(), { replaceState: true });
        return;
      }

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
          'auth.session_policy': sessionPolicy,
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

<div class="adm-page adm-page--narrow">
  <AdminPageHeader
    title="Pengaturan platform"
    description="Perubahan langsung berlaku tanpa deploy ulang."
  />

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
              Bila aktif, siapa pun dapat membuat akun lewat halaman daftar. Tidak disarankan untuk
              operasional ujian.
            </span>
          </span>
        </label>
        {#if view?.updated['auth.registration_enabled']}
          <p class="stamp">
            Terakhir diubah {formatDateTime(view.updated['auth.registration_enabled']?.updatedAt)}
          </p>
        {/if}
      </Card>

      <Card title="Kebijakan sesi" description="Satu akun hanya boleh punya satu sesi login aktif.">
        <div class="policy" role="radiogroup" aria-label="Kebijakan sesi">
          <label class="toggle">
            <input type="radio" name="sessionPolicy" value="replace" bind:group={sessionPolicy} />
            <span>
              <strong>Ganti sesi lama (default)</strong>
              <span class="muted">Login baru otomatis mengeluarkan perangkat yang masih aktif.</span
              >
            </span>
          </label>
          <label class="toggle">
            <input type="radio" name="sessionPolicy" value="reject" bind:group={sessionPolicy} />
            <span>
              <strong>Tolak login baru</strong>
              <span class="muted">
                Login ditolak selama sesi aktif masih ada; pengguna harus logout lebih dulu.
              </span>
            </span>
          </label>
        </div>
        {#if view?.updated['auth.session_policy']}
          <p class="stamp">
            Terakhir diubah {formatDateTime(view.updated['auth.session_policy']?.updatedAt)}
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
