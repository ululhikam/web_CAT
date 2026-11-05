<script lang="ts">
  import type { TileOption } from '$lib/exams/render-adapter';

  /**
   * Grid tile gambar untuk soal `IMAGE_CHOICE` — dipakai BERSAMA oleh runner
   * ujian dan pratinjau admin (F3-15).
   *
   * Sebelumnya markup tile disalin di dua tempat, sehingga placeholder, ukuran
   * gambar, teks alternatif, dan tata letak mobile bisa menyimpang tanpa
   * ketahuan. Sekarang keduanya memakai komponen ini; perbedaan kebutuhan
   * hanya disalurkan lewat callback (`isActive`, `onselect`).
   */
  interface Props {
    options: TileOption[];
    /** Opsi yang sedang dipilih; runner memakai `id`, pratinjau admin `label`. */
    isActive?: (option: TileOption) => boolean;
    onselect?: (option: TileOption) => void;
    /** Hanya pratinjau admin: tandai opsi yang berkunci. */
    showAnswerKey?: boolean;
    /** Huruf tile; default memakai `label` opsi. */
    letters?: readonly string[];
  }

  let {
    options,
    isActive = () => false,
    onselect,
    showAnswerKey = false,
    letters = [],
  }: Props = $props();
</script>

<div class="tiles" role="radiogroup" aria-label="Pilih satu gambar">
  {#each options as option, optionIndex (option.id ?? option.label)}
    <button
      type="button"
      class="tile"
      class:tile--active={isActive(option)}
      class:tile--correct={showAnswerKey && option.isCorrect}
      aria-pressed={isActive(option)}
      onclick={() => onselect?.(option)}
    >
      <span class="tile__key">{letters[optionIndex] ?? option.label}</span>
      {#if option.media[0]}
        <img
          class="tile__image"
          src={option.media[0].url}
          alt={option.media[0].alt || `Opsi ${option.label}`}
          loading="lazy"
        />
      {:else}
        <span class="tile__empty">Gambar belum tersedia</span>
      {/if}
      {#if option.text}
        <span class="tile__caption">{option.text}</span>
      {/if}
      {#if showAnswerKey && option.isCorrect}
        <span class="tile__badge">kunci</span>
      {/if}
    </button>
  {/each}
</div>

<style>
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--space-3);
    margin-top: var(--space-4);
  }

  .tile {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
    transition:
      border-color var(--duration-fast) var(--ease-out),
      box-shadow var(--duration-fast) var(--ease-out);
  }

  .tile:hover {
    border-color: var(--color-primary);
  }

  .tile--active {
    border-color: var(--color-primary);
    box-shadow: inset 0 0 0 2px var(--color-primary);
  }

  .tile--correct {
    border-color: var(--color-success);
  }

  .tile__key {
    position: absolute;
    top: var(--space-2);
    left: var(--space-2);
    display: grid;
    place-items: center;
    width: 1.8rem;
    height: 1.8rem;
    border-radius: var(--radius-sm);
    background: var(--color-surface-muted);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 700;
  }

  .tile--active .tile__key {
    background: var(--color-primary);
    color: #fff;
  }

  .tile__image {
    width: 100%;
    max-height: 180px;
    object-fit: contain;
  }

  .tile__empty {
    display: grid;
    place-items: center;
    width: 100%;
    min-height: 120px;
    padding: var(--space-2);
    border-radius: var(--radius-sm);
    background: var(--color-surface-muted);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-align: center;
  }

  .tile__caption {
    font-size: var(--text-sm);
    text-align: center;
  }

  .tile__badge {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-success);
  }

  /* Di layar 360 px dua tile masih terbaca; satu kolom terlalu panjang. */
  @media (max-width: 640px) {
    .tiles {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--space-2);
    }

    .tile {
      padding: var(--space-2);
    }

    .tile__image {
      max-height: 120px;
    }
  }
</style>
