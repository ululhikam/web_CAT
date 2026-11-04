<script lang="ts">
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Spinner from '@webcat/ui/components/Spinner.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';
  import { formatIdr } from '$lib/format';
  import { onMount } from 'svelte';
  import type { Plan } from '@webcat/contracts';

  let plans = $state<Plan[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  onMount(() => {
    void (async () => {
      try {
        plans = await apiRequest<Plan[]>('/plans', { token: session.accessToken });
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

<div class="page">
  <header class="page__header">
    <div>
      <h1 class="page__title">Paket &amp; harga</h1>
      <p class="muted">
        Halaman ini adalah sumber data halaman <code>/pricing</code>. Mengubah data paket akan
        langsung mengubah tampilan publik tanpa deploy ulang.
      </p>
    </div>
  </header>

  <Alert tone="info" title="Pengeditan aktif pada B4">
    Pada Phase 0 daftar ini bersifat baca-saja. CRUD paket (harga, urutan, badge, publikasi)
    dijadwalkan pada B4 bersama integrasi Midtrans.
  </Alert>

  {#if error}
    <Alert tone="danger" title="Gagal memuat paket">{error}</Alert>
  {/if}

  {#if loading}
    <div class="center"><Spinner size={26} label="Memuat paket" /></div>
  {:else if plans.length === 0}
    <Card title="Belum ada paket">
      <p class="muted">Jalankan seed untuk mengisi paket default.</p>
    </Card>
  {:else}
    <div class="table-wrap">
      <table class="table">
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
              <td>{formatIdr(plan.priceIdr)}</td>
              <td>{plan.durationDays} hari</td>
              <td class="muted">{formatIdr(plan.pricePerDayIdr)}</td>
              <td>{plan.isPublic ? 'Ya' : 'Tidak'}</td>
              <td class="muted">{plan.sortOrder}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <div class="foot">
    <Button href="/pricing" variant="secondary">Lihat halaman publik</Button>
  </div>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .page__title {
    font-size: var(--text-2xl);
  }

  .page__header .muted {
    max-width: 70ch;
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
  }

  .foot {
    display: flex;
    gap: var(--space-3);
  }

  code {
    font-family: var(--font-mono);
    font-size: 0.92em;
  }
</style>
