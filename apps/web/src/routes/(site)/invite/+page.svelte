<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Field from '@webcat/ui/components/Field.svelte';
  import Input from '@webcat/ui/components/Input.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';

  let password = $state('');
  let confirm = $state('');
  let fullName = $state('');
  let submitting = $state(false);
  let error = $state<string | null>(null);

  const token = $derived($page.url.searchParams.get('token') ?? '');
  const mismatch = $derived(confirm.length > 0 && password !== confirm);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (submitting || mismatch) return;

    submitting = true;
    error = null;

    try {
      await apiRequest('/auth/activate-invite', {
        method: 'POST',
        body: { token, password, ...(fullName.trim() ? { fullName: fullName.trim() } : {}) },
        token: undefined,
        skipRefresh: true,
      });
      await goto('/login');
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Aktivasi Akun — Web CAT</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="auth container">
  <div class="auth__card">
    <h1 class="auth__title">Aktivasi akun</h1>

    {#if !token}
      <Alert tone="danger" title="Tautan tidak valid">
        Undangan ini tidak memuat token. Hubungi admin untuk mendapatkan undangan baru.
      </Alert>
    {:else}
      <p class="auth__lede">
        Buat password untuk mengaktifkan akun Anda. Setelah aktif, Anda bisa masuk dan memilih paket
        latihan.
      </p>

      {#if error}
        <Alert tone="danger">{error}</Alert>
      {/if}

      <form class="auth__form" onsubmit={submit} novalidate>
        <Field label="Nama lengkap" for="fullName" hint="Kosongkan bila sudah benar.">
          <Input id="fullName" bind:value={fullName} autocomplete="name" />
        </Field>

        <Field label="Password" for="password" required hint="Minimal 10 karakter, ada huruf besar/kecil dan angka.">
          <Input
            id="password"
            type="password"
            autocomplete="new-password"
            bind:value={password}
            required
          />
        </Field>

        <Field
          label="Ulangi password"
          for="confirm"
          required
          error={mismatch ? 'Password tidak sama' : null}
        >
          <Input
            id="confirm"
            type="password"
            autocomplete="new-password"
            bind:value={confirm}
            required
          />
        </Field>

        <Button type="submit" fullWidth loading={submitting} disabled={!password || mismatch}>
          Aktifkan akun
        </Button>
      </form>
    {/if}
  </div>
</div>

<style>
  .auth {
    display: grid;
    place-items: center;
    min-height: calc(100dvh - var(--header-height) - 200px);
    padding-block: var(--space-12);
  }

  .auth__card {
    width: min(100%, 440px);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-8);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-sm);
  }

  .auth__title { font-size: var(--text-2xl); }

  .auth__lede {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .auth__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
</style>
