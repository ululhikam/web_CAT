<script lang="ts">
  import { page } from '$app/stores';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Field from '@webcat/ui/components/Field.svelte';
  import Input from '@webcat/ui/components/Input.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import type { MessageResult } from '@webcat/contracts';

  let email = $state($page.url.searchParams.get('email') ?? '');
  let code = $state('');
  let submitting = $state(false);
  let resending = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);
  let notice = $state<string | null>(null);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (submitting) return;

    submitting = true;
    error = null;
    success = null;
    notice = null;

    try {
      const result = await apiRequest<MessageResult>('/auth/verify-email', {
        method: 'POST',
        body: { email, code },
        token: undefined,
        skipRefresh: true,
      });
      success = result.message;
      code = '';
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      submitting = false;
    }
  }

  async function resend() {
    if (resending || !email) return;

    resending = true;
    error = null;
    notice = null;

    try {
      const result = await apiRequest<MessageResult>('/auth/resend-verification', {
        method: 'POST',
        body: { email },
        token: undefined,
        skipRefresh: true,
      });
      notice = result.message;
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      resending = false;
    }
  }
</script>

<svelte:head>
  <title>Verifikasi email — Web CAT</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="auth container">
  <div class="auth__card">
    <h1 class="auth__title">Verifikasi email</h1>
    <p class="auth__lede">
      Masukkan 6 digit kode yang dikirim ke email Anda. Kode berlaku terbatas; minta kode baru
      bila sudah kedaluwarsa.
    </p>

    {#if error}<Alert tone="danger">{error}</Alert>{/if}
    {#if notice}<Alert tone="info">{notice}</Alert>{/if}
    {#if success}
      <Alert tone="success" title="Email terverifikasi">
        {success}
        <p class="auth__after"><a href="/login">Lanjut ke halaman masuk</a></p>
      </Alert>
    {:else}
      <form class="auth__form" onsubmit={submit} novalidate>
        <Field label="Email" for="email" required>
          <Input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            bind:value={email}
            required
          />
        </Field>

        <Field label="Kode verifikasi" for="code" required>
          <Input
            id="code"
            name="code"
            autocomplete="one-time-code"
            placeholder="123456"
            maxlength={6}
            bind:value={code}
            required
          />
        </Field>

        <Button
          type="submit"
          fullWidth
          loading={submitting}
          disabled={!email || code.length !== 6}
        >
          Verifikasi
        </Button>
      </form>

      <div class="auth__row">
        <Button variant="ghost" size="sm" loading={resending} disabled={!email} onclick={resend}>
          Kirim ulang kode
        </Button>
      </div>
    {/if}

    <p class="auth__alt">
      <a href="/login">Kembali ke halaman masuk</a>
    </p>
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

  .auth__title {
    font-size: var(--text-2xl);
  }

  .auth__lede {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .auth__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .auth__row {
    display: flex;
    justify-content: center;
    font-size: var(--text-sm);
  }

  .auth__after {
    margin-top: var(--space-2);
    font-size: var(--text-sm);
  }

  .auth__alt {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    text-align: center;
  }
</style>
