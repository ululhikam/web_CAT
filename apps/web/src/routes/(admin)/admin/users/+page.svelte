<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import { formatDate } from '$lib/format';
  import type { AdminUserSummary } from '@webcat/contracts';

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

      const result = await apiRequest<AdminUserSummary[]>(`/admin/users?${params}`, {
        token: session.accessToken,
      });
      users = result;
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
  <title>Pengguna — Admin Web CAT</title>
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">Pengguna</h1>
      <p class="muted">Buat akun manual, atur role, dan beri masa langganan.</p>
    </div>
    <Button href="/admin/users/new">Tambah pengguna</Button>
  </header>

  <form
    class="search"
    onsubmit={(event) => {
      event.preventDefault();
      void load();
    }}
  >
    <input
      class="search__input"
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
    <div class="center"><Spinner size={26} label="Memuat pengguna" /></div>
  {:else if users.length === 0}
    <Card title="Belum ada pengguna">
      <p class="muted">Tambahkan peserta pertama lewat tombol “Tambah pengguna”.</p>
    </Card>
  {:else}
    <div class="table-wrap">
      <table class="table">
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
                <p class="user__name">{user.fullName}</p>
                <p class="user__email">{user.email}</p>
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
              <td class="muted">{formatDate(user.createdAt)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
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

  .search {
    display: flex;
    gap: var(--space-2);
    max-width: 460px;
  }

  .search__input {
    flex: 1;
    padding: 0.55rem 0.75rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font-size: var(--text-sm);
  }

  .search__input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: var(--shadow-ring);
  }

  .center {
    display: grid;
    place-items: center;
    padding-block: var(--space-12);
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
  }

  .table thead th {
    background: var(--color-surface-muted);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    white-space: nowrap;
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
