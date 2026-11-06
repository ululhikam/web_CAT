<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Field from '@webcat/ui/components/Field.svelte';
  import Input from '@webcat/ui/components/Input.svelte';
  import { apiErrorMessage } from '$lib/api/client';
  import { homePathFor } from '$lib/panel';
  import { session } from '$lib/stores/session.svelte';

  let password = $state('');
  let confirm = $state('');
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
      const user = await session.activateInvite(token, password);
      await goto(homePathFor(user.role), { replaceState: true });
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Aktivasi Akun — TES CAT</title>
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
        Akun Anda sudah dibuat oleh admin. Cukup buat password di bawah ini; setelah aktif Anda
        otomatis masuk dan bisa memilih paket latihan.
      </p>

      {#if error}
        <Alert tone="danger">{error}</Alert>
      {/if}

      <form class="auth__form" onsubmit={submit} novalidate>
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

        <Button
          type="submit"
          fullWidth
          loading={submitting}
          disabled={!password || !confirm || mismatch}
        >
          Aktifkan akun &amp; masuk
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
