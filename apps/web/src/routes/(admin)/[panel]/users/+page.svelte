<script lang="ts">
  import { onMount } from 'svelte';
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
  import type { AdminUserSummary, CursorPage } from '@webcat/contracts';

  let users = $state<AdminUserSummary[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let query = $state('');

  async function load() {
    loading = true;
    error = null;

    try {
      const params = new URLSearchParams({ limit: '50' });
      if (query.trim()) params.set('q', query.trim());

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

  onMount(() => {
    void load();
  });

  const statusTone = (status: string) =>
    status === 'ACTIVE' ? 'success' : status === 'PENDING_INVITE' ? 'warning' : 'danger';
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

  <form
    class="adm-toolbar"
    role="search"
    onsubmit={(event) => {
      event.preventDefault();
      void load();
    }}
  >
    <input
      class="adm-input adm-input--grow"
      type="search"
      placeholder="Cari nama atau email"
      bind:value={query}
      aria-label="Cari pengguna"
    />
    <Button type="submit" variant="secondary">Cari</Button>
  </form>

  {#if error}
    <Alert tone="danger" title="Gagal memuat pengguna">{error}</Alert>
  {/if}

  {#if loading}
    <div class="adm-center"><Spinner size={26} label="Memuat pengguna" /></div>
  {:else if users.length === 0}
    <Card title="Belum ada pengguna">
      <p class="adm-muted">Tambahkan peserta pertama lewat tombol “Tambah pengguna”.</p>
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
              <td><Badge tone={user.role === 'USER' ? 'neutral' : 'brand'}>{user.role}</Badge></td>
              <td><Badge tone={statusTone(user.status)}>{user.status}</Badge></td>
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
