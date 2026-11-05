<script lang="ts">
  import { tick } from 'svelte';
  import {
    IDENTITY_ZOOM,
    MIN_ZOOM,
    canZoomIn,
    canZoomOut,
    clampPan,
    nextZoom,
    panBy,
    pointerDistance,
    pointerMidpoint,
    zoomAtPoint,
    zoomFromPinch,
    zoomFromWheel,
    zoomPercent,
    type ZoomState,
  } from '$lib/exams/image-zoom';

  /**
   * F5-12 — viewer gambar figural (modal layar penuh).
   *
   * Soal figural seperti jaring-jaring kubus atau pola kompleks sering butuh
   * dilihat lebih dekat. Viewer ini dibuka saat peserta mengklik gambar, lalu
   * menyediakan zoom (roda, cubit dua jari, tombol +/−), geser (drag atau
   * tombol panah), reset, dan tutup lewat `Esc`.
   *
   * Semua perhitungan ada di `$lib/exams/image-zoom.ts` supaya batas 100%–400%
   * dan batas geser bisa diuji tanpa browser.
   */
  interface Props {
    /** `null` berarti viewer tertutup. */
    src: string | null;
    alt?: string;
    onclose: () => void;
  }

  let { src, alt = 'Gambar soal', onclose }: Props = $props();

  let surface = $state<HTMLDivElement | null>(null);
  let stage = $state<HTMLDivElement | null>(null);
  let image = $state<HTMLImageElement | null>(null);
  let view = $state<ZoomState>({ ...IDENTITY_ZOOM });
  /** Ukuran gambar pada skala 1; dipakai menghitung batas geser. */
  let baseSize = $state({ width: 0, height: 0 });
  let viewport = $state({ width: 0, height: 0 });
  let dragging = $state(false);

  /** Pemicu yang harus menerima fokus lagi saat viewer ditutup. */
  let restoreFocusTo: HTMLElement | null = null;

  const pointers = new Map<number, { x: number; y: number }>();
  let pinchStartDistance = 0;
  let pinchStartScale = MIN_ZOOM;
  let dragOrigin = { x: 0, y: 0, tx: 0, ty: 0 };
  let lastSrc: string | null = null;

  const percent = $derived(zoomPercent(view.scale));
  const zoomInAllowed = $derived(canZoomIn(view.scale));
  const zoomOutAllowed = $derived(canZoomOut(view.scale));
  const atRest = $derived(view.scale === MIN_ZOOM && view.tx === 0 && view.ty === 0);

  /** Pemanggil menandai tombol/gambar pemicu agar fokus bisa dikembalikan. */
  export function rememberTrigger(element: HTMLElement | null): void {
    restoreFocusTo = element;
  }

  /** Ukur gambar (pada skala 1) dan wadah; aman dipanggil berulang. */
  function measure(): void {
    if (image && baseSize.width === 0 && view.scale === MIN_ZOOM) {
      const rect = image.getBoundingClientRect();
      if (rect.width > 0) baseSize = { width: rect.width, height: rect.height };
    }
    if (stage) {
      const rect = stage.getBoundingClientRect();
      if (rect.width > 0) viewport = { width: rect.width, height: rect.height };
    }
  }

  /** Terapkan keadaan baru lalu jepit agar gambar tetap terlihat. */
  function commit(next: ZoomState): void {
    view = clampPan(next, baseSize, viewport);
  }

  /** Koordinat titik layar relatif terhadap pusat wadah. */
  function anchorOf(clientX: number, clientY: number): { x: number; y: number } {
    const rect = stage?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: clientX - (rect.left + rect.width / 2),
      y: clientY - (rect.top + rect.height / 2),
    };
  }

  function reset(): void {
    view = { ...IDENTITY_ZOOM };
  }

  function close(): void {
    onclose();
  }

  function zoomBy(direction: 1 | -1, anchor = { x: 0, y: 0 }): void {
    measure();
    commit(zoomAtPoint(view, nextZoom(view.scale, direction), anchor.x, anchor.y));
  }

  /** Setiap gambar baru mulai dari keadaan pas di layar. */
  $effect(() => {
    if (src === lastSrc) return;
    lastSrc = src;
    view = { ...IDENTITY_ZOOM };
    baseSize = { width: 0, height: 0 };
    pointers.clear();
    dragging = false;
  });

  $effect(() => {
    if (!src) return;

    const fallbackFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Fokus awal ke tombol tutup supaya `Esc` dan Tab langsung mengenai dialog.
    void tick().then(() => {
      surface?.querySelector<HTMLButtonElement>('[data-viewer-close]')?.focus();
    });
    measure();

    // Ukur sekali lagi setelah browser menyelesaikan layout (gambar dari cache
    // bisa selesai sebelum `tick` sehingga `onload` tidak terpanggil lagi).
    const frame = requestAnimationFrame(() => measure());

    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        zoomBy(1);
        return;
      }
      if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        zoomBy(-1);
        return;
      }
      if (event.key === '0') {
        event.preventDefault();
        reset();
        return;
      }
      const step = event.shiftKey ? 80 : 30;
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [step, 0],
        ArrowRight: [-step, 0],
        ArrowUp: [0, step],
        ArrowDown: [0, -step],
      };
      const move = moves[event.key];
      if (move) {
        event.preventDefault();
        commit(panBy(view, move[0], move[1]));
      }
    };

    const onResize = (): void => {
      baseSize = { width: 0, height: 0 };
      measure();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeydown);
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKeydown);
      window.removeEventListener('resize', onResize);
      document.body.style.overflow = previousOverflow;
      (restoreFocusTo ?? fallbackFocus)?.focus?.();
    };
  });

  /** Roda tetikus ditangani manual karena `preventDefault` butuh non-passive. */
  $effect(() => {
    const element = surface;
    if (!element) return;

    const onWheel = (event: WheelEvent): void => {
      event.preventDefault();
      measure();
      const anchor = anchorOf(event.clientX, event.clientY);
      commit(zoomAtPoint(view, zoomFromWheel(view.scale, event.deltaY), anchor.x, anchor.y));
    };

    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  });

  function onPointerDown(event: PointerEvent): void {
    measure();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);

    if (pointers.size === 1) {
      dragOrigin = { x: event.clientX, y: event.clientY, tx: view.tx, ty: view.ty };
      dragging = view.scale > MIN_ZOOM;
      return;
    }

    if (pointers.size === 2) {
      const [first, second] = [...pointers.values()];
      pinchStartDistance = pointerDistance(first!, second!);
      pinchStartScale = view.scale;
      dragging = false;
    }
  }

  function onPointerMove(event: PointerEvent): void {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size >= 2) {
      const [first, second] = [...pointers.values()];
      const distance = pointerDistance(first!, second!);
      const midpoint = pointerMidpoint(first!, second!);
      const anchor = anchorOf(midpoint.x, midpoint.y);
      commit(
        zoomAtPoint(
          { ...view, scale: pinchStartScale },
          zoomFromPinch(pinchStartScale, pinchStartDistance, distance),
          anchor.x,
          anchor.y,
        ),
      );
      return;
    }

    if (!dragging) return;
    commit(
      panBy(
        { ...view, tx: dragOrigin.tx, ty: dragOrigin.ty },
        event.clientX - dragOrigin.x,
        event.clientY - dragOrigin.y,
      ),
    );
  }

  function onPointerUp(event: PointerEvent): void {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchStartDistance = 0;
    if (pointers.size === 0) dragging = false;
  }
</script>

{#if src}
  <div
    class="viewer"
    role="dialog"
    aria-modal="true"
    aria-label="Pratinjau gambar soal"
    bind:this={surface}
    data-testid="media-viewer"
  >
    <!-- Latar gelap; klik di luar gambar menutup viewer. -->
    <button class="viewer__backdrop" type="button" aria-label="Tutup pratinjau" onclick={close}
    ></button>

    <div
      class="viewer__stage"
      class:viewer__stage--grabbing={dragging}
      bind:this={stage}
      role="presentation"
      onpointerdown={onPointerDown}
      onpointermove={onPointerMove}
      onpointerup={onPointerUp}
      onpointercancel={onPointerUp}
    >
      <img
        class="viewer__image"
        bind:this={image}
        {src}
        {alt}
        draggable="false"
        onload={measure}
        style={`transform: translate(${view.tx}px, ${view.ty}px) scale(${view.scale});`}
      />
    </div>

    <div class="viewer__toolbar" role="toolbar" aria-label="Kontrol pratinjau">
      <button
        class="viewer__button"
        type="button"
        aria-label="Perkecil"
        disabled={!zoomOutAllowed}
        onclick={() => zoomBy(-1)}
      >
        −
      </button>
      <span class="viewer__percent" aria-live="polite">{percent}%</span>
      <button
        class="viewer__button"
        type="button"
        aria-label="Perbesar"
        disabled={!zoomInAllowed}
        onclick={() => zoomBy(1)}
      >
        +
      </button>
      <button
        class="viewer__button viewer__button--text"
        type="button"
        disabled={atRest}
        onclick={reset}
      >
        Reset
      </button>
      <button
        class="viewer__button viewer__button--text"
        type="button"
        data-viewer-close
        onclick={close}
      >
        Tutup
      </button>
    </div>
  </div>
{/if}

<style>
  .viewer {
    position: fixed;
    inset: 0;
    z-index: 120;
    display: flex;
    flex-direction: column;
    background: rgb(6 10 20 / 92%);
    color: #fff;
  }

  .viewer__backdrop {
    position: absolute;
    inset: 0;
    border: 0;
    background: transparent;
    cursor: zoom-out;
  }

  .viewer__stage {
    position: relative;
    display: grid;
    place-items: center;
    flex: 1;
    min-height: 0;
    padding: var(--space-5);
    /* Ruang untuk toolbar supaya gambar tidak tertutup tombol. */
    padding-bottom: 5.5rem;
    overflow: hidden;
    touch-action: none;
    cursor: grab;
  }

  .viewer__stage--grabbing {
    cursor: grabbing;
  }

  .viewer__image {
    max-width: 100%;
    max-height: 100%;
    user-select: none;
    transform-origin: center;
    transition: transform 120ms var(--ease-out);
    /* Biarkan browser menginterpolasi: gambar 200 px pada 400% tetap terbaca. */
    image-rendering: auto;
  }

  .viewer__stage--grabbing .viewer__image {
    transition: none;
  }

  .viewer__toolbar {
    position: absolute;
    left: 50%;
    bottom: 1.25rem;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-lg);
    background: rgb(15 23 42 / 92%);
    box-shadow: 0 8px 30px rgb(0 0 0 / 45%);
    transform: translateX(-50%);
  }

  .viewer__button {
    min-width: 2.25rem;
    height: 2.25rem;
    padding: 0 var(--space-2);
    border: 1px solid rgb(255 255 255 / 25%);
    border-radius: var(--radius-md);
    background: transparent;
    color: inherit;
    font-size: var(--text-lg);
    line-height: 1;
    cursor: pointer;
  }

  .viewer__button:hover:not(:disabled) {
    background: rgb(255 255 255 / 12%);
  }

  .viewer__button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .viewer__button--text {
    font-size: var(--text-sm);
  }

  .viewer__percent {
    min-width: 3.5rem;
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    text-align: center;
  }

  @media (max-width: 640px) {
    .viewer__stage {
      padding: var(--space-2);
      padding-bottom: 5rem;
    }

    .viewer__toolbar {
      gap: var(--space-1);
    }
  }
</style>
