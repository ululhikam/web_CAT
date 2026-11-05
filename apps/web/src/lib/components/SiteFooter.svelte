<script lang="ts">
  const year = new Date().getFullYear();
</script>

<footer class="footer">
  <div class="container footer__grid">
    <div>
      <div class="footer__brand-row">
        <img src="/logo-mark.png" alt="" width="40" height="40" />
        <p class="footer__brand">TES CAT</p>
      </div>
      <p class="footer__note">
        Latihan TES CAT ujian Polri: Psikologi, TKK, dan TPK dengan sistem gugur seperti seleksi
        sebenarnya. Bukan situs resmi Polri.
      </p>
    </div>

    <nav aria-label="Produk">
      <p class="footer__title">Produk</p>
      <ul>
        <li><a href="/#tes">Struktur tes</a></li>
        <li><a href="/#alur">Cara kerja</a></li>
        <li><a href="/#faq">FAQ</a></li>
      </ul>
    </nav>

    <nav aria-label="Bantuan">
      <p class="footer__title">Bantuan</p>
      <ul>
        <li><a href="/login">Masuk</a></li>
        <li><a href="mailto:support@webcat.id">support@webcat.id</a></li>
      </ul>
    </nav>
  </div>

  <div class="container footer__bottom">
    <p>&copy; {year} TES CAT. Semua hak dilindungi.</p>
    <p>Dibuat untuk persiapan seleksi Polri.</p>
  </div>
</footer>

<style>
  .footer {
    margin-top: var(--space-24);
    padding-block: var(--space-12) var(--space-8);
    background: var(--neutral-900);
    color: var(--neutral-200);
  }

  .footer__grid {
    display: grid;
    gap: var(--space-8);
  }

  .footer__brand-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .footer__brand-row img {
    display: block;
    width: 40px;
    height: 40px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .footer__brand {
    font-size: var(--text-lg);
    font-weight: 700;
    color: #fff;
  }

  .footer__note {
    margin-top: var(--space-2);
    max-width: 40ch;
    font-size: var(--text-sm);
    color: var(--neutral-400);
  }

  .footer__title {
    margin-bottom: var(--space-3);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--neutral-400);
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
    color: var(--neutral-200);
    text-decoration: none;
  }

  a:hover {
    color: #fff;
    text-decoration: underline;
  }

  .footer__bottom {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--space-3);
    margin-top: var(--space-10);
    padding-top: var(--space-5);
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    font-size: var(--text-xs);
    color: var(--neutral-400);
  }

  @media (min-width: 768px) {
    .footer__grid {
      grid-template-columns: 2fr 1fr 1fr;
    }
  }
</style>
