<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Alert from '@webcat/ui/components/Alert.svelte';
  import Badge from '@webcat/ui/components/Badge.svelte';
  import Button from '@webcat/ui/components/Button.svelte';
  import Card from '@webcat/ui/components/Card.svelte';
  import PlanCard from '$lib/components/PlanCard.svelte';
  import { formatIdr } from '$lib/format';
  import { session } from '$lib/stores/session.svelte';
  import type { Plan } from '@webcat/contracts';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const selectedCode = $derived($page.url.searchParams.get('plan')?.toUpperCase() ?? null);

  /** Semua label fitur unik, urut kemunculan pertama (stabil antar render). */
  const featureLabels = $derived.by(() => {
    const seen = new Set<string>();
    for (const plan of data.cards) {
      for (const feature of plan.features) seen.add(feature.label);
    }
    return [...seen];
  });

  function hasFeature(plan: Plan, label: string): boolean {
    return plan.features.some((feature) => feature.label === label && feature.included);
  }

  /** CTA hanya mengirim `planCode`; nominal tidak pernah berasal dari klien. */
  function choosePlan(plan: Plan) {
    if (!session.user) {
      const redirect = `/pricing?plan=${encodeURIComponent(plan.code)}`;
      void goto(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    void goto(`/subscription?plan=${encodeURIComponent(plan.code)}`);
  }

  const faqs = [
    {
      q: 'Apakah semua paket mendapat tiga tes sekaligus?',
      a: 'Ya. Setiap paket membuka alur lengkap: Tes Psikologi (4 subtes), TPA, dan TPK, dengan aturan sistem gugur yang sama.',
    },
    {
      q: 'Bagaimana masa aktif dihitung?',
      a: 'Masa aktif dimulai saat pembayaran dikonfirmasi dan berakhir sesuai durasi paket, zona waktu Asia/Jakarta.',
    },
    {
      q: 'Apakah masa aktif bisa ditumpuk?',
      a: 'Bisa. Membeli paket baru saat langganan masih aktif akan menambahkan durasinya setelah tanggal berakhir.',
    },
    {
      q: 'Apa yang terjadi kalau saya gugur pada satu subtes?',
      a: 'Sesi ditandai gugur dan subtes berikutnya terkunci permanen untuk sesi tersebut. Anda tetap dapat memulai sesi baru selama langganan aktif.',
    },
    {
      q: 'Bisakah saya melihat pembahasan jawaban?',
      a: 'Pembahasan tersedia pada paket yang mencantumkannya di daftar fitur. Paket gratis hanya memberi satu sesi tanpa pembahasan.',
    },
    {
      q: 'Metode pembayaran apa saja yang didukung?',
      a: 'QRIS, Virtual Account (BCA, BNI, BRI, Mandiri, Permata), GoPay, OVO, DANA, ShopeePay, dan kartu kredit/debit melalui Midtrans.',
    },
  ] as const;

  const structuredData = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Paket latihan Web CAT',
      itemListElement: data.cards.map((plan, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: `Web CAT ${plan.name}`,
          description:
            plan.tagline ?? `Akses latihan simulasi ujian Polri selama ${plan.durationDays} hari`,
          offers: {
            '@type': 'Offer',
            price: plan.priceIdr,
            priceCurrency: 'IDR',
            availability: 'https://schema.org/InStock',
            url: `/pricing?plan=${plan.code}`,
          },
        },
      })),
    }),
  );
</script>

<svelte:head>
  <title>Harga &amp; Paket Latihan Ujian — Web CAT</title>
  <meta
    name="description"
    content="Pilih paket latihan simulasi ujian Polri: Psikologi, TPA, dan TPK. Harga transparan, masa aktif fleksibel, tanpa biaya tersembunyi."
  />
  <link rel="canonical" href={$page.url.origin + '/pricing'} />
  <meta property="og:title" content="Harga & Paket Latihan Ujian — Web CAT" />
  <meta
    property="og:description"
    content="Psikologi, TPA, dan TPK dalam satu alur latihan. Bandingkan paket dan mulai hari ini."
  />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={$page.url.origin + '/pricing'} />
  {@html `<script type="application/ld+json">${structuredData}</script>`}
</svelte:head>

<section class="hero">
  <div class="container hero__inner">
    <Badge tone="brand">Garansi akses sesuai masa aktif</Badge>
    <h1 class="hero__title">Pilih Paket Latihan Anda</h1>
    <p class="hero__lede">
      Latihan ujian Polri lengkap: Psikologi, TPA, dan TPK — dengan timer per subtes dan sistem
      gugur seperti seleksi sebenarnya.
    </p>
    <Button href="#perbandingan" variant="secondary" size="sm">Lihat perbandingan</Button>
  </div>
</section>

{#if data.error}
  <section class="container">
    <Alert tone="danger" title="Gagal memuat paket">
      {data.error}
    </Alert>
    <div class="retry">
      <Button onclick={() => location.reload()}>Coba lagi</Button>
    </div>
  </section>
{:else}
  {#if data.trial}
    <div class="container">
      <div class="trial">
        <div>
          <p class="trial__title">{data.trial.name}</p>
          <p class="trial__body">
            Satu sesi simulasi penuh tanpa biaya, tanpa pembahasan dan tanpa analisis per subtes.
          </p>
        </div>
        <Button variant="secondary" onclick={() => choosePlan(data.trial as Plan)}>
          Aktifkan {data.trial.name}
        </Button>
      </div>
    </div>
  {/if}

  <section class="container" aria-label="Daftar paket">
    {#if data.cards.length === 0}
      <Card title="Belum ada paket publik">
        <p class="muted">
          Saat ini belum ada paket yang dapat dibeli. Hubungi admin untuk mendapatkan akses.
        </p>
        <div class="empty-actions">
          <Button href="mailto:support@webcat.id" variant="secondary">Hubungi admin</Button>
        </div>
      </Card>
    {:else}
      <div class="plans">
        {#each data.cards as plan (plan.code)}
          <PlanCard {plan} selected={selectedCode === plan.code} onselect={choosePlan} />
        {/each}
      </div>
    {/if}
  </section>

  {#if featureLabels.length > 0 && data.cards.length > 0}
    <section class="container compare" id="perbandingan" aria-labelledby="compare-title">
      <h2 id="compare-title" class="compare__title">Perbandingan fitur</h2>

      <div class="compare__scroll">
        <table class="compare__table">
          <caption class="sr-only">Perbandingan fitur setiap paket</caption>
          <thead>
            <tr>
              <th scope="col">Fitur</th>
              {#each data.cards as plan (plan.code)}
                <th scope="col" class:compare__th--popular={plan.isPopular}>
                  {plan.name}{#if plan.isPopular}<span class="compare__star" aria-hidden="true">★</span>{/if}
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Durasi akses</th>
              {#each data.cards as plan (plan.code)}
                <td>{plan.durationDays} hari</td>
              {/each}
            </tr>
            {#each featureLabels as label (label)}
              <tr>
                <th scope="row">{label}</th>
                {#each data.cards as plan (plan.code)}
                  <td>
                    {#if hasFeature(plan, label)}
                      <span class="compare__yes" aria-label="Termasuk">✓</span>
                    {:else}
                      <span class="compare__no" aria-label="Tidak termasuk">—</span>
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
            <tr>
              <th scope="row">Harga</th>
              {#each data.cards as plan (plan.code)}
                <td class="compare__price">{formatIdr(plan.priceIdr)}</td>
              {/each}
            </tr>
          </tbody>
        </table>
      </div>

      <div class="compare__accordion">
        {#each data.cards as plan (plan.code)}
          <details class="compare__item">
            <summary>
              {plan.name}
              <span class="compare__price">{formatIdr(plan.priceIdr)}</span>
            </summary>
            <ul>
              <li>Durasi {plan.durationDays} hari</li>
              {#each plan.features as feature (feature.label)}
                <li class:compare__li--off={!feature.included}>
                  {feature.included ? '✓' : '—'} {feature.label}
                </li>
              {/each}
            </ul>
          </details>
        {/each}
      </div>
    </section>
  {/if}

  <section class="container faq" id="faq" aria-labelledby="faq-title">
    <h2 id="faq-title" class="faq__title">Pertanyaan yang sering diajukan</h2>
    <div class="faq__list">
      {#each faqs as item (item.q)}
        <details class="faq__item">
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      {/each}
    </div>
  </section>

  <section class="container payments" aria-labelledby="pay-title">
    <p class="payments__label" id="pay-title">Metode pembayaran</p>
    <ul class="payments__list">
      {#each ['QRIS', 'Virtual Account', 'GoPay', 'OVO', 'DANA', 'ShopeePay', 'Kartu'] as item (item)}
        <li>{item}</li>
      {/each}
    </ul>
    <p class="payments__note">
      Butuh paket institusi atau pembayaran manual? Hubungi
      <a href="mailto:support@webcat.id">support@webcat.id</a>.
    </p>
  </section>
{/if}

<style>
  .hero {
    padding-block: var(--space-16) var(--space-8);
    background: radial-gradient(120% 120% at 50% 0%, var(--brand-50) 0%, transparent 60%);
  }

  .hero__inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    text-align: center;
  }

  .hero__title {
    font-size: clamp(1.9rem, 4.5vw, var(--text-4xl));
    letter-spacing: -0.03em;
  }

  .hero__lede {
    max-width: 62ch;
    font-size: var(--text-lg);
    color: var(--color-text-muted);
  }

  .retry { margin-top: var(--space-4); }

  .trial {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    margin-block: var(--space-6);
    padding: var(--space-5);
    background: var(--color-surface);
    border: 1px dashed var(--color-border-strong);
    border-radius: var(--radius-lg);
  }

  .trial__title { font-weight: 700; }

  .trial__body {
    margin-top: var(--space-1);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .plans {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-5);
    padding-block: var(--space-6);
  }

  .empty-actions { margin-top: var(--space-4); }

  .compare { padding-block: var(--space-12); }

  .compare__title,
  .faq__title {
    font-size: var(--text-2xl);
    margin-bottom: var(--space-5);
  }

  .compare__scroll {
    display: none;
    overflow-x: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
  }

  .compare__table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
  }

  .compare__table th,
  .compare__table td {
    padding: var(--space-3) var(--space-4);
    text-align: left;
    border-bottom: 1px solid var(--color-border);
    white-space: nowrap;
  }

  .compare__table thead th {
    background: var(--color-surface-muted);
    font-size: var(--text-xs);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .compare__table tbody th {
    font-weight: 500;
    color: var(--color-text-muted);
    white-space: normal;
  }

  .compare__table td { text-align: center; }
  .compare__th--popular { color: var(--color-primary); }
  .compare__star { color: var(--color-primary); margin-left: 2px; }
  .compare__yes { color: var(--color-success); font-weight: 700; }
  .compare__no { color: var(--color-text-subtle); }
  .compare__price { font-weight: 650; }

  .compare__accordion {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .compare__item {
    padding: var(--space-4);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .compare__item summary {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
    cursor: pointer;
    font-weight: 600;
  }

  .compare__item ul {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin: var(--space-3) 0 0;
    padding: 0;
    list-style: none;
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .compare__li--off { color: var(--color-text-subtle); }

  .faq { padding-block: var(--space-8) var(--space-12); }

  .faq__list {
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

  .faq__item summary { cursor: pointer; font-weight: 600; }

  .faq__item p {
    margin-top: var(--space-3);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    line-height: var(--leading-relaxed);
  }

  .payments {
    padding-block: var(--space-6) var(--space-12);
    text-align: center;
  }

  .payments__label {
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-subtle);
  }

  .payments__list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-2);
    margin: var(--space-3) 0 0;
    padding: 0;
    list-style: none;
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .payments__list li {
    padding: 0.3rem 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    background: var(--color-surface);
  }

  .payments__note {
    margin-top: var(--space-4);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  @media (min-width: 640px) {
    .plans { grid-template-columns: repeat(2, 1fr); }
  }

  @media (min-width: 768px) {
    .compare__scroll { display: block; }
    .compare__accordion { display: none; }
  }

  @media (min-width: 1024px) {
    .plans { grid-template-columns: repeat(4, 1fr); }
  }
</style>
