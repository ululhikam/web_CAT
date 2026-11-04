<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Field from '@webcat/ui/components/Field.svelte';
  import Input from '@webcat/ui/components/Input.svelte';
  import { apiErrorMessage } from '$lib/api/client';
  import { session } from '$lib/stores/session.svelte';

  let email = $state('');
  let password = $state('');
  let submitting = $state(false);
  let error = $state<string | null>(null);

  const redirectTo = $derived($page.url.searchParams.get('redirect') ?? '/dashboard');
  const oauthError = $derived($page.url.searchParams.get('error'));

  const oauthMessage = $derived(
    oauthError === 'oauth_state'
      ? 'Sesi login Google kedaluwarsa atau tidak valid. Silakan coba lagi.'
      : oauthError === 'AUTH_OAUTH_ACCOUNT_NOT_FOUND'
        ? 'Akun Google ini belum terdaftar. Hubungi admin untuk dibuatkan akun.'
        : oauthError === 'AUTH_OAUTH_NOT_CONFIGURED'
          ? 'Login Google belum dikonfigurasi oleh admin.'
          : oauthError
            ? 'Login Google gagal. Silakan coba lagi atau masuk dengan password.'
            : null,
  );

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (submitting) return;

    submitting = true;
    error = null;

    try {
      await session.login(email, password);
      await goto(redirectTo);
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Masuk — Web CAT</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="auth container">
  <div class="auth__card">
    <h1 class="auth__title">Masuk</h1>
    <p class="auth__lede">
      Akun peserta dibuat oleh admin. Gunakan email dan password yang Anda terima, atau tautan
      undangan di email.
    </p>

    {#if error}
      <Alert tone="danger">{error}</Alert>
    {/if}

    {#if oauthMessage}
      <Alert tone="danger">{oauthMessage}</Alert>
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

      <Field label="Password" for="password" required>
        <Input
          id="password"
          name="password"
          type="password"
          autocomplete="current-password"
          placeholder="Password Anda"
          bind:value={password}
          required
        />
      </Field>

      <div class="auth__row">
        <a href="/forgot-password">Lupa password?</a>
      </div>

      <Button type="submit" fullWidth loading={submitting} disabled={!email || !password}>
        Masuk
      </Button>
    </form>

    <div class="auth__divider"><span>atau</span></div>

    <Button href="/api/v1/auth/google" variant="secondary" fullWidth>
      Masuk dengan Google
    </Button>

    <p class="auth__alt">
      Belum punya akun? <a href="/register">Daftar</a> · <a href="/pricing">Lihat harga &amp; paket</a>
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

  .auth__row {
    display: flex;
    justify-content: flex-end;
    font-size: var(--text-sm);
  }

  .auth__divider {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-size: var(--text-xs);
    color: var(--color-text-subtle);
  }

  .auth__divider::before,
  .auth__divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--color-border);
  }

  .auth__alt {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    text-align: center;
  }
</style>
