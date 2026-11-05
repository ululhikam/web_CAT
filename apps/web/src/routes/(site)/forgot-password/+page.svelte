<script lang="ts">
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Field from '@webcat/ui/components/Field.svelte';
  import Input from '@webcat/ui/components/Input.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';

  let email = $state('');
  let submitting = $state(false);
  let sent = $state(false);
  let error = $state<string | null>(null);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (submitting) return;

    submitting = true;
    error = null;

    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: { email: email.trim().toLowerCase() },
        token: undefined,
        skipRefresh: true,
      });
      sent = true;
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Lupa Password — TES CAT</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="auth container">
  <div class="auth__card">
    <h1 class="auth__title">Lupa password</h1>
    <p class="auth__lede">
      Masukkan email akun Anda. Bila terdaftar, kami mengirim tautan untuk membuat password baru.
    </p>

    {#if sent}
      <Alert tone="success" title="Periksa email Anda">
        Bila email tersebut terdaftar, tautan reset sudah dikirim. Tautan berlaku 60 menit.
      </Alert>
    {:else}
      {#if error}
        <Alert tone="danger">{error}</Alert>
      {/if}

      <form class="auth__form" onsubmit={submit} novalidate>
        <Field label="Email" for="email" required>
          <Input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            placeholder="nama@email.com"
            bind:value={email}
            required
          />
        </Field>

        <Button type="submit" fullWidth loading={submitting} disabled={!email}>
          Kirim tautan reset
        </Button>
      </form>
    {/if}

    <p class="auth__alt"><a href="/login">Kembali ke halaman masuk</a></p>
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
    width: min(100%, 420px);
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

  .auth__alt {
    font-size: var(--text-sm);
    text-align: center;
  }
</style>
