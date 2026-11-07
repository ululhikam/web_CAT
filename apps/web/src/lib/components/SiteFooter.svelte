<script lang="ts">
  const year = new Date().getFullYear();
</script>

<footer class="footer">
  <div class="container footer__grid">
    <div>
      <div class="footer__brand-row">
        <div class="footer__logo-wrap">
          <img src="/logo-badge.png" alt="Logo TES CAT" width="40" height="40" />
        </div>
        <div>
          <p class="footer__brand">TES CAT POLRI</p>
          <span class="footer__brand-sub">Sistem Simulasi CAT Lulus SIP & Akpol</span>
        </div>
      </div>
      <p class="footer__note">
        Platform simulasi ujian CAT Polri terintegrasi: Psikotes (Kecerdasan, Kepribadian, Kecermatan),
        Tes Kemampuan Komputer (TKK), dan Tes Pengetahuan Kepolisian (TPK) standar seleksi dinas.
      </p>
    </div>

    <nav aria-label="Materi Ujian">
      <p class="footer__title">Materi Ujian</p>
      <ul>
        <li><a href="/#struktur">Psikotes Kecerdasan (100 Soal)</a></li>
        <li><a href="/#struktur">Mental Kepribadian (100 Soal)</a></li>
        <li><a href="/#struktur">Kecermatan Monokrom (500 Kolom)</a></li>
        <li><a href="/#struktur">TKK Komputer & TI (100 Soal)</a></li>
        <li><a href="/#struktur">TPK Regulasi & Hukum (100 Soal)</a></li>
      </ul>
    </nav>

    <nav aria-label="Akses & Bantuan">
      <p class="footer__title">Akses Peserta</p>
      <ul>
        <li><a href="/login">Masuk ke Sistem CAT</a></li>
        <li><a href="/#kalkulator">Kalkulator Ambang Batas</a></li>
        <li><a href="/#faq">Pusat Bantuan & FAQ</a></li>
        <li><a href="mailto:support@webcat.id">support@webcat.id</a></li>
      </ul>
    </nav>
  </div>

  <div class="container footer__bottom">
    <p>&copy; {year} TES CAT Polri. Seluruh materi latihan terstandarisasi seleksi kedinasan.</p>
    <p class="footer__badge-text">Sistem CAT Lulus SIP • Presisi & Akuntabel</p>
  </div>
</footer>

<style>
  .footer {
    margin-top: var(--space-20);
    padding-block: var(--space-16) var(--space-8);
    background: linear-gradient(180deg, var(--brand-950) 0%, #0d0038 100%);
    color: var(--neutral-300);
    border-top: 1px solid rgba(129, 140, 248, 0.2);
  }

  .footer__grid {
    display: grid;
    gap: var(--space-10);
  }

  .footer__brand-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .footer__logo-wrap {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: #ffffff;
    display: grid;
    place-items: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    flex-shrink: 0;
  }

  .footer__logo-wrap img {
    display: block;
    width: 38px;
    height: 38px;
    object-fit: contain;
    border-radius: 8px;
  }

  .footer__brand {
    font-size: var(--text-lg);
    font-weight: 850;
    color: #ffffff;
    letter-spacing: -0.02em;
    line-height: 1.1;
  }

  .footer__brand-sub {
    font-size: 11px;
    color: var(--accent-cyan);
    font-weight: 600;
  }

  .footer__note {
    margin-top: var(--space-3);
    max-width: 44ch;
    font-size: var(--text-sm);
    color: var(--neutral-400);
    line-height: 1.6;
  }

  .footer__title {
    margin-bottom: var(--space-4);
    font-size: var(--text-xs);
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #ffffff;
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--text-sm);
  }

  a {
    color: var(--neutral-300);
    text-decoration: none;
    transition: color 0.15s ease;
  }

  a:hover {
    color: var(--accent-cyan);
    text-decoration: none;
  }

  .footer__bottom {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-3);
    margin-top: var(--space-12);
    padding-top: var(--space-6);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-size: var(--text-xs);
    color: var(--neutral-400);
  }

  .footer__badge-text {
    color: var(--brand-300);
    font-weight: 600;
  }

  @media (min-width: 768px) {
    .footer__grid {
      grid-template-columns: 2fr 1fr 1fr;
    }
  }
</style>
