<script lang="ts">
  import { page } from '$app/state';
  import Button from '@webcat/ui/components/Button.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import AdminPageHeader from '$lib/components/admin/AdminPageHeader.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import { adminBase } from '$lib/panel-route';
  import { session } from '$lib/stores/session.svelte';
  import { formatDate } from '$lib/format';
  import { roleLabel, userStatus } from '$lib/admin/user-detail';
  import type { AdminUserSummary, CursorPage } from '@webcat/contracts';

  interface Filters {
    q: string;
    status: string;
    role: string;
    /** Jendela "pendaftar baru" dalam hari; 0 berarti tanpa filter. */
    days: number;
  }

  let users = $state<AdminUserSummary[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Filter adalah state form. Daftar hanya dimuat saat tombol Terapkan ditekan
  // atau saat URL berubah, sehingga mengetik di kolom cari tidak memicu request.
  let query = $state('');
  let status = $state('');
  let role = $state('');
  let newDays = $state(0);

  function filtersFromUrl(): Filters {
    const params = page.url.searchParams;
    return {
      q: params.get('q') ?? '',
      status: params.get('status') ?? '',
      role: params.get('role') ?? '',
      days: Number(params.get('registeredWithinDays') ?? 0) || 0,
    };
  }

  function filtersFromForm(): Filters {
    return { q: query.trim(), status, role, days: newDays };
  }

  /**
   * Memuat daftar dari nilai filter eksplisit.
   *
   * Sengaja tidak membaca state form: fungsi ini juga dipanggil dari `$effect`
   * pemantau URL, dan membaca state reaktif di sana akan membuat effect ikut
   * berjalan setiap kali pengguna mengetik.
   */
  async function loadWith(filters: Filters) {
    loading = true;
    error = null;

    try {
      if (!session.accessToken) {
        await session.restore();
      }

      const params = new URLSearchParams({ limit: '50' });
      if (filters.q) params.set('q', filters.q);
      if (filters.status) params.set('status', filters.status);
      if (filters.role) params.set('role', filters.role);
      if (filters.days > 0) params.set('registeredWithinDays', String(filters.days));

      const result = await apiRequest<CursorPage<AdminUserSummary>>(`/admin/users?${params}`, {
        token: session.accessToken,
      });
      users = result.items;
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      loading = false;
    }
  }

  function applyFilters(filters: Filters) {
    query = filters.q;
    status = filters.status;
    role = filters.role;
    newDays = filters.days;
    void loadWith(filters);
  }

  /**
   * Sinkron dengan URL setiap kali navigasi berubah, sehingga tautan dari
   * lonceng (`?registeredWithinDays=7`) langsung membuka daftar terfilter —
   * termasuk bila halaman ini sudah terbuka.
   */
  let lastSearch: string | null = null;
  $effect(() => {
    const search = page.url.search;
    if (search === lastSearch) return;
    lastSearch = search;
    applyFilters(filtersFromUrl());
  });

  function submitSearch(event: SubmitEvent) {
    event.preventDefault();
    applyFilters(filtersFromForm());
  }

  function resetFilters() {
    applyFilters({ q: '', status: '', role: '', days: 0 });
  }
</script>

<svelte:head>
  <title>Pengguna — Admin TES CAT</title>
</svelte:head>

<div class="adm-page">
  <AdminPageHeader
    title="Pengguna"
    description="Buat akun manual, atur role, dan beri masa langganan."
  >
    {#snippet actions()}
      <Button href={`${adminBase()}/users/new`}>Tambah pengguna</Button>
    {/snippet}
  </AdminPageHeader>

  {#if newDays > 0}
    <Alert tone="info" title={`Menampilkan pendaftar ${newDays} hari terakhir`}>
      Daftar ini difilter dari notifikasi pendaftar baru.
    </Alert>
  {/if}

  <form class="adm-toolbar" role="search" onsubmit={submitSearch}>
    <input
      class="adm-input adm-input--grow"
      type="search"
      placeholder="Cari nama atau email"
      bind:value={query}
      aria-label="Cari pengguna"
    />
    <select class="adm-select" bind:value={status} aria-label="Filter status">
      <option value="">Semua status</option>
      <option value="ACTIVE">Aktif</option>
      <option value="PENDING_INVITE">Menunggu undangan</option>
      <option value="SUSPENDED">Ditangguhkan</option>
    </select>
    <select class="adm-select" bind:value={role} aria-label="Filter role">
      <option value="">Semua role</option>
      <option value="USER">Peserta</option>
      <option value="ADMIN">Admin</option>
      <option value="SUPER_ADMIN">Super Admin</option>
    </select>
    <Button type="submit" variant="secondary">Terapkan</Button>
    {#if query || status || role || newDays > 0}
      <Button variant="ghost" onclick={resetFilters}>Reset</Button>
    {/if}
  </form>

  {#if error}
    <Alert tone="danger" title="Gagal memuat pengguna">{error}</Alert>
  {/if}

  {#if loading}
    <div class="adm-center"><Spinner size={26} label="Memuat pengguna" /></div>
  {:else if users.length === 0}
    <Card title="Tidak ada pengguna">
      <p class="adm-muted">
        {#if query || status || role || newDays > 0}
          Tidak ada akun yang cocok dengan filter ini.
        {:else}
          Tambahkan peserta pertama lewat tombol “Tambah pengguna”.
        {/if}
      </p>
    </Card>
  {:else}
    <div class="adm-panel adm-scroll">
      <table class="adm-table">
        <caption class="sr-only">Daftar pengguna</caption>
        <thead>
          <tr>
            <th scope="col">Nama / Email</th>
            <th scope="col">Role</th>
            <th scope="col">Status</th>
            <th scope="col">Langganan</th>
            <th scope="col">Dibuat</th>
            <th scope="col"><span class="sr-only">Aksi</span></th>
          </tr>
        </thead>
        <tbody>
          {#each users as user (user.id)}
            <tr>
              <td>
                <a class="user__link" href={`${adminBase()}/users/${user.id}`}>
                  <span class="user__name">{user.fullName}</span>
                  <span class="user__email">{user.email}</span>
                </a>
              </td>
              <td>
                <Badge tone={user.role === 'USER' ? 'neutral' : 'brand'}>
                  {roleLabel(user.role)}
                </Badge>
              </td>
              <td>
                <Badge tone={userStatus(user.status).tone}>{userStatus(user.status).label}</Badge>
              </td>
              <td>
                {#if user.subscription && user.subscription.status === 'ACTIVE'}
                  <span class="sub sub--active">
                    Aktif · {user.subscription.remainingDays} hari
                  </span>
                  <span class="sub__date">s/d {formatDate(user.subscription.endsAt)}</span>
                {:else}
                  <span class="sub sub--none">Tidak aktif</span>
                {/if}
              </td>
              <td class="adm-muted adm-nowrap">{formatDate(user.createdAt)}</td>
              <td class="adm-nowrap">
                <a class="adm-link" href={`${adminBase()}/users/${user.id}`}>Kelola</a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .user__link {
    display: block;
    color: inherit;
    text-decoration: none;
  }

  .user__link:hover .user__name {
    text-decoration: underline;
  }

  .user__name {
    display: block;
    font-weight: 600;
  }

  .user__email {
    display: block;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    overflow-wrap: anywhere;
  }

  .sub {
    display: block;
    font-weight: 600;
  }

  .sub--active {
    color: var(--color-success);
  }

  .sub--none {
    color: var(--color-text-subtle);
  }

  .sub__date {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }
</style>
