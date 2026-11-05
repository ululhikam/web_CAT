<script lang="ts">
  import { goto } from '$app/navigation';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import Field from '@webcat/ui/components/Field.svelte';
  import Input from '@webcat/ui/components/Input.svelte';
  import { apiRequest, apiErrorMessage } from '$lib/api/client';
  import { adminBase } from '$lib/panel-route';
  import AdminPageHeader from '$lib/components/admin/AdminPageHeader.svelte';
  import { session } from '$lib/stores/session.svelte';
  import type { AdminCreateUserResponse, AdminCreateUserInput } from '@webcat/contracts';

  let fullName = $state('');
  let email = $state('');
  let phone = $state('');
  let role = $state<'USER' | 'ADMIN' | 'SUPER_ADMIN'>('USER');
  let durationDays = $state<number>(30);
  let submitting = $state(false);
  let error = $state<string | null>(null);
  let result = $state<AdminCreateUserResponse | null>(null);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (submitting) return;

    submitting = true;
    error = null;

    try {
      const body: AdminCreateUserInput = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        role,
        activation: 'INVITE_EMAIL',
        ...(durationDays > 0 ? { subscription: { durationDays } } : {}),
      } as AdminCreateUserInput;

      result = await apiRequest<AdminCreateUserResponse>('/admin/users', {
        method: 'POST',
        token: session.accessToken,
        body,
      });

      fullName = '';
      email = '';
      phone = '';
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Tambah Pengguna — Admin Web CAT</title>
</svelte:head>

<div class="adm-page adm-page--narrow">
  <AdminPageHeader
    title="Tambah pengguna"
    description="Akun dibuat tanpa pendaftaran mandiri. Peserta menerima email undangan untuk membuat password."
  >
    {#snippet actions()}
      <Button variant="ghost" onclick={() => goto(`${adminBase()}/users`)}>Kembali</Button>
    {/snippet}
  </AdminPageHeader>

  {#if result}
    <Alert tone="success" title="Akun dibuat">
      <p>{result.user.fullName} — {result.user.email}</p>
      {#if result.inviteUrl}
        <p class="invite">
          Tautan undangan: <code>{result.inviteUrl}</code>
        </p>
        <p class="muted text-sm">Teruskan tautan ini bila email tidak sampai. Berlaku 7 hari.</p>
      {/if}
    </Alert>
  {/if}

  {#if error}
    <Alert tone="danger" title="Gagal membuat akun">{error}</Alert>
  {/if}

  <Card title="Data peserta" elevated>
    <form class="form" onsubmit={submit}>
      <Field label="Nama lengkap" for="fullName" required>
        <Input id="fullName" bind:value={fullName} required autocomplete="name" />
      </Field>

      <Field label="Email" for="email" required hint="Email ini menerima tautan aktivasi.">
        <Input id="email" type="email" bind:value={email} required autocomplete="email" />
      </Field>

      <Field label="Nomor WhatsApp" for="phone" hint="Format 62xxxxxxxxxx (opsional).">
        <Input id="phone" type="tel" bind:value={phone} placeholder="6281234567890" />
      </Field>

      <div class="grid-2">
        <Field
          label="Role"
          for="role"
          hint={session.isSuperAdmin ? undefined : 'ADMIN hanya dapat membuat akun USER.'}
        >
          <select id="role" class="select" bind:value={role}>
            <option value="USER">USER</option>
            {#if session.isSuperAdmin}
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            {/if}
          </select>
        </Field>

        <Field
          label="Masa langganan (hari)"
          for="durationDays"
          hint="1–3650 hari. Kosongkan untuk tanpa langganan."
        >
          <Input id="durationDays" type="number" min={0} max={3650} bind:value={durationDays} />
        </Field>
      </div>

      <div class="actions">
        <Button type="submit" loading={submitting} disabled={!fullName || !email}>
          Buat akun &amp; kirim undangan
        </Button>
      </div>
    </form>
  </Card>
</div>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .grid-2 {
    display: grid;
    gap: var(--space-4);
  }

  .select {
    width: 100%;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font-size: var(--text-sm);
  }

  .actions {
    margin-top: var(--space-2);
  }

  .invite code {
    display: inline-block;
    margin-top: var(--space-1);
    padding: 0.2rem 0.4rem;
    background: var(--color-surface-muted);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    word-break: break-all;
  }

  @media (min-width: 640px) {
    .grid-2 {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
