<script lang="ts">
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Field from '@webcat/ui/components/Field.svelte';
  import Input from '@webcat/ui/components/Input.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import type { MessageResult } from '@webcat/contracts';

  let fullName = $state('');
  let email = $state('');
  let phone = $state('');
  let password = $state('');
  let confirm = $state('');
  let submitting = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);

  const mismatch = $derived(confirm.length > 0 && password !== confirm);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (submitting || mismatch) return;

    submitting = true;
    error = null;
    success = null;

    try {
      const result = await apiRequest<MessageResult>('/auth/register', {
        method: 'POST',
        body: {
          email,
          password,
          fullName,
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        },
        token: undefined,
        skipRefresh: true,
      });
      success = result.message;
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Daftar — Web CAT</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="auth container">
  <div class="auth__card">
    <h1 class="auth__title">Daftar akun</h1>
    <p class="auth__lede">
      Pendaftaran mandiri hanya aktif bila diizinkan admin. Untuk peserta ujian, minta admin
      membuatkan akun agar paket langganan langsung terhubung.
    </p>

    {#if error}<Alert tone="danger">{error}</Alert>{/if}

    {#if success}
      <Alert tone="success" title="Pendaftaran berhasil">
        {success}
        <p class="auth__after">
          <a href={`/verify?email=${encodeURIComponent(email)}`}>Verifikasi email sekarang</a>
        </p>
      </Alert>
    {:else}
      <form class="auth__form" onsubmit={submit} novalidate>
        <Field label="Nama lengkap" for="fullName" required>
          <Input
            id="fullName"
            name="fullName"
            autocomplete="name"
            placeholder="Nama sesuai identitas"
            maxlength={120}
            bind:value={fullName}
            required
          />
        </Field>

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

        <Field label="Nomor WhatsApp" for="phone" hint="Opsional, format 62xxxxxxxxxx.">
          <Input
            id="phone"
            name="phone"
            type="tel"
            autocomplete="tel"
            placeholder="6281234567890"
            bind:value={phone}
          />
        </Field>

        <Field
          label="Password"
          for="password"
          required
          hint="Minimal 10 karakter, mengandung huruf besar, huruf kecil, dan angka."
        >
          <Input
            id="password"
            name="password"
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
          error={mismatch ? 'Konfirmasi password tidak sama.' : undefined}
        >
          <Input
            id="confirm"
            name="confirm"
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
          disabled={!fullName || !email || !password || mismatch}
        >
          Daftar
        </Button>
      </form>
    {/if}

    <p class="auth__alt">
      Sudah punya akun? <a href="/login">Masuk</a>
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
    width: min(100%, 460px);
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
