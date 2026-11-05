<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import AdminPageHeader from '$lib/components/admin/AdminPageHeader.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import { adminBase } from '$lib/panel-route';
  import { session } from '$lib/stores/session.svelte';
  import { formatIdr } from '$lib/format';
  import type { Plan } from '@webcat/contracts';

  let plans = $state<Plan[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  onMount(() => {
    void (async () => {
      try {
        plans = await apiRequest<Plan[]>('/plans', { token: session.accessToken, cacheTtlMs: 60000 });
      } catch (cause) {
        error = apiErrorMessage(cause);
      } finally {
        loading = false;
      }
    })();
  });
</script>

<svelte:head>
  <title>Paket &amp; Harga — Admin Web CAT</title>
</svelte:head>

<div class="adm-page">
  <AdminPageHeader
    title="Paket &amp; harga"
    description="Daftar paket internal yang dipakai untuk aktivasi manual. Tidak ada halaman harga publik; peserta mendapat akses dari admin."
  >
    {#snippet actions()}
      <Button variant="secondary" href={`${adminBase()}/users/new`}>Buat akun peserta</Button>
    {/snippet}
  </AdminPageHeader>

  <Alert tone="info" title="Baca-saja pada tahap ini">
    CRUD paket (harga, urutan, badge, publikasi) dijadwalkan bersama integrasi pembayaran. Untuk
    sementara, perubahan harga dilakukan lewat seed/DB oleh SUPER_ADMIN.
  </Alert>

  {#if error}
    <Alert tone="danger" title="Gagal memuat paket">{error}</Alert>
  {/if}

  {#if loading}
    <div class="adm-center"><Spinner size={26} label="Memuat paket" /></div>
  {:else if plans.length === 0}
    <Card title="Belum ada paket">
      <p class="adm-muted">Jalankan seed untuk mengisi paket default.</p>
    </Card>
  {:else}
    <div class="adm-panel adm-scroll">
      <table class="adm-table">
        <caption class="sr-only">Daftar paket langganan</caption>
        <thead>
          <tr>
            <th scope="col">Kode</th>
            <th scope="col">Nama</th>
            <th scope="col">Harga</th>
            <th scope="col">Durasi</th>
            <th scope="col">per hari</th>
            <th scope="col">Publik</th>
            <th scope="col">Urutan</th>
          </tr>
        </thead>
        <tbody>
          {#each plans as plan (plan.code)}
            <tr>
              <td class="mono">{plan.code}</td>
              <td>
                <p class="plan__name">{plan.name}</p>
                {#if plan.badge}<p class="plan__badge">{plan.badge}</p>{/if}
              </td>
              <td class="adm-nowrap">{formatIdr(plan.priceIdr)}</td>
              <td class="adm-nowrap">{plan.durationDays} hari</td>
              <td class="adm-nowrap adm-muted">{formatIdr(plan.pricePerDayIdr)}</td>
              <td>
                <Badge tone={plan.isPublic ? 'success' : 'neutral'}>
                  {plan.isPublic ? 'Ya' : 'Tidak'}
                </Badge>
              </td>
              <td class="adm-muted">{plan.sortOrder}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .plan__name {
    font-weight: 600;
  }

  .plan__badge {
    font-size: var(--text-xs);
    color: var(--color-primary);
  }

  .mono {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    white-space: nowrap;
  }
</style>
