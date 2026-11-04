<script lang="ts">
  import Button from '@webcat/ui/components/Button.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import { formatIdr } from '$lib/format';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const stages = [
    {
      title: 'Tes Psikologi',
      detail: 'Kecerdasan 100 soal · Kepribadian 140 · Kecermatan 500 · Pass Hand 150 kolom',
      duration: '4 subtes, timer terpisah',
    },
    {
      title: 'Tes Potensi Akademik',
      detail: 'Verbal, numerik, dan penalaran logis',
      duration: '90 menit',
    },
    {
      title: 'Tes Pengetahuan Kepolisian',
      detail: 'Struktur organisasi, hukum kepolisian, etika profesi',
      duration: '60 menit',
    },
  ] as const;

  const steps = [
    {
      title: 'Pilih paket',
      body: 'Tentukan masa aktif sesuai kebutuhan persiapan. Harga selalu diambil dari data terbaru.',
    },
    {
      title: 'Kerjakan tiga tes berurutan',
      body: 'Psikologi → TPA → TPK. Setiap subtes punya timer sendiri dan tidak bisa dibuka ulang setelah habis.',
    },
    {
      title: 'Baca hasil per subtes',
      body: 'Lihat skor, waktu pengerjaan, dan posisi Anda terhadap ambang batas setiap subtes.',
    },
  ] as const;

  const faqs = [
    {
      q: 'Apakah ini ujian resmi Polri?',
      a: 'Tidak. Web CAT adalah alat latihan mandiri. Hasil latihan tidak menjamin kelulusan seleksi sebenarnya.',
    },
    {
      q: 'Bagaimana sistem gugurnya bekerja?',
      a: 'Bila Anda tidak mencapai ambang batas pada satu subtes, sesi berstatus gugur dan subtes berikutnya terkunci. Ini meniru seleksi sebenarnya agar latihan terasa realistis.',
    },
    {
      q: 'Apakah timer bisa dijeda?',
      a: 'Tidak. Waktu berjalan sejak subtes dimulai. Kehabisan waktu mengunci subtes secara permanen.',
    },
  ] as const;
</script>

<svelte:head>
  <title>Web CAT — Simulasi Ujian Polri dengan Sistem Gugur</title>
  <meta
    name="description"
    content="Latihan simulasi ujian Polri: Tes Psikologi, TPA, dan TPK dengan timer per subtes dan sistem gugur seperti seleksi sebenarnya."
  />
</svelte:head>

<section class="hero">
  <div class="container hero__inner">
    <Badge tone="brand">Simulasi 3 tes · sistem gugur</Badge>
    <h1 class="hero__title">
      Latihan ujian Polri yang<br />
      <span class="hero__accent">terasa seperti seleksi asli</span>
    </h1>
    <p class="hero__lede">
      Psikologi, TPA, dan TPK dalam satu alur. Timer per subtes, kunci permanen saat waktu habis,
      dan hasil per subtes — supaya Anda tahu persis di mana masih bocor.
    </p>

    <div class="hero__actions">
      <Button href="/pricing" size="lg">Lihat harga &amp; paket</Button>
      <Button href="#cara-kerja" variant="secondary" size="lg">Cara kerja</Button>
    </div>

    <dl class="hero__stats">
      <div><dt>Total soal</dt><dd>1.090</dd></div>
      <div><dt>Subtes</dt><dd>6</dd></div>
      <div><dt>Ambang batas</dt><dd>Per subtes</dd></div>
    </dl>
  </div>
</section>

<section class="section container" aria-labelledby="tes-title">
  <header class="section__header">
    <h2 id="tes-title">Tiga tes, enam subtes, satu alur</h2>
    <p class="muted">Urutan dan durasi mengikuti struktur seleksi.</p>
  </header>

  <div class="grid grid--3">
    {#each stages as stage (stage.title)}
      <Card title={stage.title} description={stage.duration} elevated>
        <p class="stage__detail">{stage.detail}</p>
      </Card>
    {/each}
  </div>
</section>

<section class="section section--muted" id="cara-kerja" aria-labelledby="cara-title">
  <div class="container">
    <header class="section__header">
      <h2 id="cara-title">Cara kerja</h2>
      <p class="muted">Tiga langkah, tanpa kejutan.</p>
    </header>

    <ol class="steps">
      {#each steps as step, index (step.title)}
        <li class="step">
          <span class="step__num" aria-hidden="true">{index + 1}</span>
          <h3 class="step__title">{step.title}</h3>
          <p class="step__body">{step.body}</p>
        </li>
      {/each}
    </ol>
  </div>
</section>

{#if data.cheapest}
  <section class="section container" aria-labelledby="harga-title">
    <div class="pricing-teaser">
      <div>
        <h2 id="harga-title">Mulai dari {formatIdr(data.cheapest.priceIdr)}</h2>
        <p class="muted">
          {data.planCount} paket tersedia, dari {data.cheapest.durationDays} hari sampai 3 bulan.
        </p>
      </div>
      <Button href="/pricing" size="lg">Bandingkan paket</Button>
    </div>
  </section>
{/if}

<section class="section container" id="faq" aria-labelledby="faq-title">
  <header class="section__header">
    <h2 id="faq-title">Pertanyaan yang sering diajukan</h2>
  </header>

  <div class="faq">
    {#each faqs as item (item.q)}
      <details class="faq__item">
        <summary class="faq__question">{item.q}</summary>
        <p class="faq__answer">{item.a}</p>
      </details>
    {/each}
  </div>
</section>

<style>
  .hero {
    padding-block: var(--space-16) var(--space-20);
    background:
      radial-gradient(120% 140% at 10% 0%, var(--brand-100) 0%, transparent 55%),
      radial-gradient(100% 120% at 90% 10%, var(--brand-50) 0%, transparent 50%);
  }

  .hero__inner {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-4);
    max-width: var(--container-md);
  }

  .hero__title {
    font-size: clamp(2rem, 5vw, var(--text-5xl));
    letter-spacing: -0.035em;
    line-height: 1.08;
  }

  .hero__accent { color: var(--color-primary); }

  .hero__lede {
    max-width: 62ch;
    font-size: var(--text-lg);
    color: var(--color-text-muted);
    line-height: var(--leading-relaxed);
  }

  .hero__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-top: var(--space-2);
  }

  .hero__stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-8);
    margin: var(--space-6) 0 0;
    padding-top: var(--space-5);
    border-top: 1px solid var(--color-border);
    width: 100%;
  }

  .hero__stats dt {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted);
  }

  .hero__stats dd {
    margin: var(--space-1) 0 0;
    font-size: var(--text-2xl);
    font-weight: 700;
  }

  .section { padding-block: var(--space-16); }

  .section--muted {
    background: var(--color-surface-muted);
    padding-block: var(--space-16);
  }

  .section__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    max-width: 62ch;
    margin-bottom: var(--space-8);
  }

  .section__header h2 {
    font-size: var(--text-3xl);
    letter-spacing: -0.02em;
  }

  .grid--3 { grid-template-columns: 1fr; }

  .stage__detail {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .steps {
    display: grid;
    gap: var(--space-6);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .step {
    padding: var(--space-5);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }

  .step__num {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    margin-bottom: var(--space-3);
    border-radius: var(--radius-full);
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-weight: 700;
    font-size: var(--text-sm);
  }

  .step__title {
    font-size: var(--text-lg);
    margin-bottom: var(--space-2);
  }

  .step__body {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .pricing-teaser {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-5);
    padding: var(--space-8);
    background: var(--color-primary-soft);
    border-radius: var(--radius-xl);
  }

  .pricing-teaser h2 {
    font-size: var(--text-3xl);
    letter-spacing: -0.02em;
  }

  .pricing-teaser .muted {
    max-width: 55ch;
    margin-top: var(--space-2);
  }

  .faq {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    max-width: var(--container-md);
  }

  .faq__item {
    padding: var(--space-4) var(--space-5);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .faq__question {
    cursor: pointer;
    font-weight: 600;
  }

  .faq__answer {
    margin-top: var(--space-3);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    line-height: var(--leading-relaxed);
  }

  @media (min-width: 768px) {
    .grid--3 { grid-template-columns: repeat(3, 1fr); }
    .steps { grid-template-columns: repeat(3, 1fr); }
  }
</style>
