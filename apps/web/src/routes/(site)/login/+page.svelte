<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Field from '@webcat/ui/components/Field.svelte';
  import Input from '@webcat/ui/components/Input.svelte';
  import AdminIcon from '$lib/components/admin/AdminIcon.svelte';
  import { apiErrorMessage } from '$lib/api/client';
  import { canRoleAccessPath, homePathFor } from '$lib/panel';
  import { session } from '$lib/stores/session.svelte';

  let email = $state('');
  let password = $state('');
  let submitting = $state(false);
  let error = $state<string | null>(null);
  let selectedPreset = $state<string | null>(null);

  const redirectParam = $derived(page.url.searchParams.get('redirect'));
  const oauthError = $derived(page.url.searchParams.get('error'));

  const presets = [
    {
      id: 'super-admin',
      role: 'SUPER_ADMIN',
      label: 'Super Admin',
      badge: 'Akses Penuh',
      badgeTone: 'purple',
      email: 'admin@example.com',
      password: 'Narcissistic',
      dest: '/super-admin',
      desc: 'Platform, Audit Log & RBAC',
    },
    {
      id: 'admin',
      role: 'ADMIN',
      label: 'Admin Operasional',
      badge: 'Operasional',
      badgeTone: 'blue',
      email: 'operator@example.com',
      password: 'AdminOperator123',
      dest: '/admin',
      desc: 'Bank Soal & Manajemen Peserta',
    },
    {
      id: 'peserta',
      role: 'USER',
      label: 'Peserta Ujian',
      badge: 'Siswa Aktif',
      badgeTone: 'green',
      email: 'user@example.com',
      password: 'PesertaDemo123',
      dest: '/dashboard',
      desc: 'Dashboard Simulasi & Ujian CAT',
    },
  ] as const;

  function selectPreset(preset: (typeof presets)[number]) {
    email = preset.email;
    password = preset.password;
    selectedPreset = preset.id;
    error = null;
  }

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

      const role = session.user?.role;
      const requested = redirectParam;
      const allowed =
        requested && role && canRoleAccessPath(role, requested) ? requested : null;

      await goto(allowed ?? homePathFor(role));
    } catch (cause) {
      error = apiErrorMessage(cause);
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Masuk — Portal CAT POLRI Terpadu</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="auth-wrap">
  <div class="auth-container">
    <!-- Kolom Kiri: Branding & Informasi Ujian -->
    <div class="auth-hero">
      <div class="hero-badge">
        <span class="pulse-dot" aria-hidden="true"></span>
        <span>SISTEM SELEKSI CAT POLRI</span>
      </div>

      <h1 class="hero-title">
        Simulasi Ujian Berbasis Komputer Standar Nasional
      </h1>

      <p class="hero-desc">
        Platform latihan dan evaluasi resmi seleksi penerimaan Polri. Dilengkapi timer
        authoritative presisi tinggi, hard-lock per-subtes, dan sistem gugur real-time.
      </p>

      <div class="hero-features">
        <div class="feature-item">
          <div class="feature-icon feature-icon--blue">
            <AdminIcon name="shield" size={20} />
          </div>
          <div>
            <strong>Anti-Kecurangan Terstandar</strong>
            <p>1 akun 1 perangkat aktif dan proteksi perpindahan tab.</p>
          </div>
        </div>

        <div class="feature-item">
          <div class="feature-icon feature-icon--indigo">
            <AdminIcon name="clock" size={20} />
          </div>
          <div>
            <strong>3 Tahapan Ujian Berurutan</strong>
            <p>Psikologi (4 subtes), TPA (Akademik), dan TPK (Kepolisian).</p>
          </div>
        </div>

        <div class="feature-item">
          <div class="feature-icon feature-icon--emerald">
            <AdminIcon name="check" size={20} />
          </div>
          <div>
            <strong>Penilaian Real-Time & Transparan</strong>
            <p>Skor otomatis dan verifikasi ambang batas kelulusan.</p>
          </div>
        </div>
      </div>

      <div class="hero-footer">
        <span>Didukung oleh Teknologi CAT Modern</span>
        <span class="separator">•</span>
        <span>Enkripsi Sesi 256-bit</span>
      </div>
    </div>

    <!-- Kolom Kanan: Card Login & Presets Demo -->
    <div class="auth-panel">
      <!-- Helper Cepat untuk Demo / Role Testing -->
      <div class="preset-card">
        <div class="preset-header">
          <div class="preset-title-wrap">
            <AdminIcon name="sparkles" size={15} />
            <span class="preset-title">Pilih Akun Demo (1-Klik Isi)</span>
          </div>
          <span class="preset-tag">Role Router</span>
        </div>
        <p class="preset-sub">
          Klik tombol di bawah untuk langsung mencoba hak akses tiap peran:
        </p>

        <div class="preset-grid">
          {#each presets as p (p.id)}
            <button
              type="button"
              class="preset-btn"
              class:preset-btn--selected={selectedPreset === p.id}
              onclick={() => selectPreset(p)}
            >
              <div class="preset-btn-top">
                <span class="preset-btn-name">{p.label}</span>
                <span class="role-pill role-pill--{p.badgeTone}">{p.badge}</span>
              </div>
              <div class="preset-btn-dest">Tujuan: <code>{p.dest}</code></div>
              <div class="preset-btn-desc">{p.desc}</div>
            </button>
          {/each}
        </div>
      </div>

      <!-- Form Login -->
      <div class="login-card">
        <div class="login-header">
          <h2 class="login-title">Masuk ke Portal</h2>
          <p class="login-lede">
            Silakan masukkan kredensial akun Anda sesuai peran yang diberikan.
          </p>
        </div>

        {#if error}
          <Alert tone="danger">{error}</Alert>
        {/if}

        {#if oauthMessage}
          <Alert tone="danger">{oauthMessage}</Alert>
        {/if}

        <form class="login-form" onsubmit={submit} novalidate>
          <Field label="Alamat Email" for="email" required>
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

          <Field label="Kata Sandi (Password)" for="password" required>
            <Input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              placeholder="Masukkan password Anda"
              bind:value={password}
              required
            />
          </Field>

          <div class="login-row">
            <span class="role-hint">
              {#if email === 'admin@example.com'}
                Target: <span class="badge-role">Super Admin</span>
              {:else if email === 'operator@example.com'}
                Target: <span class="badge-role">Admin</span>
              {:else if email.includes('peserta') || email === 'user@example.com'}
                Target: <span class="badge-role">Peserta Ujian</span>
              {/if}
            </span>
            <a href="/forgot-password" class="forgot-link">Lupa password?</a>
          </div>

          <Button type="submit" fullWidth loading={submitting} disabled={!email || !password}>
            Masuk Sekarang
          </Button>
        </form>

        <div class="login-divider">
          <span>atau masuk via OAuth</span>
        </div>

        <Button href="/api/v1/auth/google" variant="secondary" fullWidth>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style="margin-right: 8px;">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.41 7.34 24 12 24Z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.59 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
          </svg>
          Masuk dengan Google
        </Button>

        <p class="login-footer">
          Butuh akun atau bantuan teknis? <a href="mailto:support@webcat.id">Hubungi Administrator</a>
        </p>
      </div>
    </div>
  </div>
</div>

<style>
  .auth-wrap {
    min-height: calc(100dvh - 140px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-8) var(--space-4);
    background: radial-gradient(circle at 10% 20%, rgba(56, 70, 214, 0.05) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(6, 185, 129, 0.04) 0%, transparent 40%),
                var(--color-bg);
  }

  .auth-container {
    width: 100%;
    max-width: 1100px;
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-8);
    align-items: start;
  }

  @media (min-width: 960px) {
    .auth-container {
      grid-template-columns: 1.1fr 1fr;
      gap: var(--space-10);
    }
  }

  /* --- Kolom Kiri: Hero --- */
  .auth-hero {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    padding: var(--space-4) 0;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    align-self: flex-start;
    padding: 0.35rem 0.85rem;
    border-radius: var(--radius-full);
    background: var(--brand-50);
    border: 1px solid var(--brand-200);
    color: var(--brand-700);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.06em;
  }

  .pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--brand-600);
    box-shadow: 0 0 0 0 rgba(74, 99, 240, 0.7);
    animation: pulse 1.8s infinite;
  }

  @keyframes pulse {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(74, 99, 240, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 7px rgba(74, 99, 240, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(74, 99, 240, 0); }
  }

  .hero-title {
    font-size: clamp(1.75rem, 3vw, 2.35rem);
    font-weight: 800;
    line-height: 1.25;
    color: var(--neutral-900);
    letter-spacing: -0.02em;
    margin: 0;
  }

  .hero-desc {
    font-size: var(--text-base);
    color: var(--color-text-muted);
    line-height: var(--leading-relaxed);
    margin: 0;
  }

  .hero-features {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin-top: var(--space-2);
  }

  .feature-item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .feature-item strong {
    display: block;
    font-size: var(--text-sm);
    color: var(--color-text);
  }

  .feature-item p {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin: 0.15rem 0 0;
  }

  .feature-icon {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    flex-shrink: 0;
  }

  .feature-icon--blue {
    background: #eef4ff;
    color: #3846d6;
  }

  .feature-icon--indigo {
    background: #f0fdf4;
    color: #15803d;
  }

  .feature-icon--emerald {
    background: #faf5ff;
    color: #7e22ce;
  }

  .hero-footer {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-text-subtle);
    margin-top: var(--space-4);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
  }

  .separator {
    color: var(--color-border-strong);
  }

  /* --- Kolom Kanan: Panel & Preset --- */
  .auth-panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  /* Preset Helper Box */
  .preset-card {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 1px solid #cbd5e1;
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .preset-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .preset-title-wrap {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--brand-700);
  }

  .preset-title {
    font-size: var(--text-xs);
    font-weight: 750;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .preset-tag {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: var(--radius-full);
    background: #e2e8f0;
    color: #475569;
  }

  .preset-sub {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin: var(--space-2) 0 var(--space-3);
  }

  .preset-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-2);
  }

  @media (min-width: 600px) {
    .preset-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .preset-btn {
    text-align: left;
    background: #ffffff;
    border: 1px solid var(--neutral-300);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .preset-btn:hover {
    border-color: var(--brand-500);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  .preset-btn--selected {
    border-color: var(--brand-600);
    background: #f4f7ff;
    box-shadow: 0 0 0 2px rgba(74, 99, 240, 0.2);
  }

  .preset-btn-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.25rem;
  }

  .preset-btn-name {
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--neutral-900);
  }

  .preset-btn-dest {
    font-size: 11px;
    color: var(--neutral-500);
  }

  .preset-btn-dest code {
    font-size: 10px;
    background: #f1f5f9;
    padding: 1px 3px;
    border-radius: 3px;
  }

  .preset-btn-desc {
    font-size: 10px;
    color: var(--neutral-400);
    line-height: 1.3;
  }

  .role-pill {
    font-size: 9px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 4px;
    text-transform: uppercase;
  }

  .role-pill--purple {
    background: #f3e8ff;
    color: #6b21a8;
  }

  .role-pill--blue {
    background: #dbeafe;
    color: #1e40af;
  }

  .role-pill--green {
    background: #dcfce7;
    color: #15803d;
  }

  /* Login Form Card */
  .login-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--space-8);
    box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .login-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .login-title {
    font-size: var(--text-xl);
    font-weight: 750;
    color: var(--neutral-900);
    margin: 0;
  }

  .login-lede {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .login-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--text-sm);
  }

  .role-hint {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .badge-role {
    font-weight: 700;
    color: var(--brand-700);
  }

  .forgot-link {
    color: var(--color-primary);
    text-decoration: none;
    font-size: var(--text-xs);
    font-weight: 600;
  }

  .forgot-link:hover {
    text-decoration: underline;
  }

  .login-divider {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-size: var(--text-xs);
    color: var(--color-text-subtle);
  }

  .login-divider::before,
  .login-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--color-border);
  }

  .login-footer {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-align: center;
    margin: 0;
  }

  .login-footer a {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 600;
  }

  .login-footer a:hover {
    text-decoration: underline;
  }
</style>
