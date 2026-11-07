<script lang="ts">
  /**
   * Lonceng "pendaftar baru" untuk topbar panel admin.
   *
   * Angkanya berasal dari API (`/admin/users/new-signups`), bukan konstanta —
   * badge palsu sebelumnya membuat admin tidak bisa membedakan notifikasi asli
   * dan hiasan. Klik badge membuka daftar akun yang baru mendaftar.
   */
  import AdminIcon from '$lib/components/admin/AdminIcon.svelte';
  import { apiRequest } from '$lib/api/client';
  import { adminBase } from '$lib/panel-route';
  import { session } from '$lib/stores/session.svelte';
  import { formatDate } from '$lib/format';
  import type { NewSignupsSummary } from '@webcat/contracts';

  const WINDOW_DAYS = 7;

  let summary = $state<NewSignupsSummary | null>(null);
  let open = $state(false);
  /** Penjaga non-reaktif: satu request per token, bukan per render. */
  let loadedFor = '';

  const count = $derived(summary?.total ?? 0);
  const badge = $derived(count > 9 ? '9+' : String(count));

  async function load(token: string) {
    try {
      summary = await apiRequest<NewSignupsSummary>(
        `/admin/users/new-signups?days=${WINDOW_DAYS}&limit=5`,
        { token, cacheTtlMs: 60000 },
      );
    } catch {
      // Notifikasi bersifat tambahan: kegagalan muat tidak boleh mengganggu panel.
      summary = null;
    }
  }

  /**
   * Dimuat saat token siap, bukan di `onMount`: layout memulihkan sesi secara
   * asinkron, sehingga pada saat mount token masih `null`.
   */
  $effect(() => {
    const token = session.accessToken;
    if (!token || !session.can('users.read') || loadedFor === token) return;
    loadedFor = token;
    void load(token);
  });

  function toggle() {
    open = !open;
  }

  $effect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') open = false;
    };
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (root && target && !root.contains(target)) open = false;
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  });

  let root = $state<HTMLDivElement | null>(null);
</script>

<div class="bell" bind:this={root}>
  <button
    class="topbar-icon-btn"
    type="button"
    aria-label={count > 0 ? `${count} pendaftar baru dalam ${WINDOW_DAYS} hari` : 'Tidak ada pendaftar baru'}
    aria-expanded={open}
    onclick={toggle}
  >
    <AdminIcon name="bell" size={17} />
    {#if count > 0}
      <span class="badge-count badge-count--red">{badge}</span>
    {/if}
  </button>

  {#if open}
    <div class="dropdown" role="dialog" aria-label="Pendaftar baru">
      <div class="dropdown__head">
        <strong>Pendaftar baru</strong>
        <span class="dropdown__window">{WINDOW_DAYS} hari terakhir</span>
      </div>

      {#if !summary}
        <p class="dropdown__empty">Memuat…</p>
      {:else if summary.total === 0}
        <p class="dropdown__empty">Belum ada pendaftar baru.</p>
      {:else}
        <ul class="dropdown__list">
          {#each summary.items as user (user.id)}
            <li>
              <a class="item" href={`${adminBase()}/users/${user.id}`}>
                <span class="item__name">{user.fullName}</span>
                <span class="item__meta">
                  {user.email} · {formatDate(user.createdAt)}
                </span>
                {#if !user.emailVerified}
                  <span class="item__tag">Belum verifikasi email</span>
                {/if}
              </a>
            </li>
          {/each}
        </ul>

        <a class="dropdown__foot" href={`${adminBase()}/users?registeredWithinDays=${WINDOW_DAYS}`}>
          Lihat semua {summary.total} pendaftar ›
        </a>
      {/if}
    </div>
  {/if}
</div>

<style>
  .bell {
    position: relative;
  }

  .topbar-icon-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: #ffffff;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .topbar-icon-btn:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .badge-count {
    position: absolute;
    top: -2px;
    right: -2px;
    min-width: 17px;
    padding: 1px 4px;
    border: 1.5px solid #4e73df;
    border-radius: 999px;
    color: #ffffff;
    font-size: 9.5px;
    font-weight: 850;
    line-height: 1.2;
    text-align: center;
  }

  .badge-count--red {
    background: #e74a3b;
  }

  /* Panel super-admin memakai topbar ungu; cincin badge ikut menyesuaikan. */
  :global(.shell--super) .badge-count {
    border-color: #6d28d9;
  }

  .dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 200;
    width: 320px;
    max-width: calc(100vw - 2rem);
    overflow: hidden;
    border: 1px solid #eaecf4;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
  }

  .dropdown__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #eaecf4;
    font-size: var(--text-sm);
  }

  .dropdown__window {
    color: var(--color-text-muted);
    font-size: var(--text-xs);
  }

  .dropdown__empty {
    margin: 0;
    padding: 1rem;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  .dropdown__list {
    margin: 0;
    padding: 0;
    list-style: none;
    max-height: 320px;
    overflow-y: auto;
  }

  .item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0.65rem 1rem;
    color: inherit;
    text-decoration: none;
    border-bottom: 1px solid #f2f4f8;
  }

  .item:hover {
    background: #f8f9fc;
  }

  .item__name {
    font-size: var(--text-sm);
    font-weight: 600;
  }

  .item__meta {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    overflow-wrap: anywhere;
  }

  .item__tag {
    width: fit-content;
    margin-top: 2px;
    padding: 1px 6px;
    border-radius: var(--radius-full);
    background: #fffbeb;
    color: #92400e;
    font-size: 10px;
    font-weight: 600;
  }

  .dropdown__foot {
    display: block;
    padding: 0.7rem 1rem;
    border-top: 1px solid #eaecf4;
    color: #4e73df;
    font-size: var(--text-xs);
    font-weight: 600;
    text-align: center;
    text-decoration: none;
  }

  .dropdown__foot:hover {
    background: #f8f9fc;
  }
</style>
