import { describe, expect, it } from 'vitest';
import {
  IDENTITY_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_STEP,
  canZoomIn,
  canZoomOut,
  clampAxis,
  clampPan,
  clampZoom,
  nextZoom,
  panBy,
  pointerDistance,
  pointerMidpoint,
  zoomAtPoint,
  zoomFromPinch,
  zoomFromWheel,
  zoomPercent,
} from './image-zoom';

/**
 * F5-12 — batas zoom/geser viewer gambar figural.
 *
 * Kriteria runbook: gambar 200×200 bisa diperbesar sampai 400% dan `Esc`
 * menutup viewer. Bagian `Esc` diuji lewat komponen; di sini dibuktikan bahwa
 * 400% memang tercapai dan gambar tidak bisa "lepas" dari layar saat digeser.
 */

describe('clampZoom (F5-12)', () => {
  it('menjepit ke rentang 100%–400%', () => {
    expect(clampZoom(0.5)).toBe(MIN_ZOOM);
    expect(clampZoom(2.5)).toBe(2.5);
    expect(clampZoom(9)).toBe(MAX_ZOOM);
  });

  it('nilai rusak jatuh ke 100%, bukan NaN', () => {
    expect(clampZoom(Number.NaN)).toBe(MIN_ZOOM);
    expect(clampZoom(Number.POSITIVE_INFINITY)).toBe(MIN_ZOOM);
  });

  it('batas atas tepat 400% sesuai kriteria', () => {
    expect(MAX_ZOOM).toBe(4);
    expect(zoomPercent(MAX_ZOOM)).toBe(400);
  });
});

describe('nextZoom (F5-12)', () => {
  it('naik dan turun satu langkah 50%', () => {
    expect(ZOOM_STEP).toBe(0.5);
    expect(nextZoom(1, 1)).toBe(1.5);
    expect(nextZoom(1.5, -1)).toBe(1);
  });

  it('tidak pernah melewati batas', () => {
    expect(nextZoom(MAX_ZOOM, 1)).toBe(MAX_ZOOM);
    expect(nextZoom(MIN_ZOOM, -1)).toBe(MIN_ZOOM);
    expect(nextZoom(3.8, 1)).toBe(MAX_ZOOM);
  });

  it('dari 100% perlu enam langkah untuk mencapai 400%', () => {
    let scale = 1;
    for (let step = 0; step < 6; step += 1) scale = nextZoom(scale, 1);
    expect(scale).toBe(MAX_ZOOM);
  });
});

describe('zoomFromWheel (F5-12)', () => {
  it('gulir ke atas memperbesar, ke bawah memperkecil', () => {
    expect(zoomFromWheel(2, -100)).toBe(2.5);
    expect(zoomFromWheel(2, 100)).toBe(1.5);
  });

  it('besar deltaY tidak mengubah jumlah langkah', () => {
    expect(zoomFromWheel(2, -1)).toBe(zoomFromWheel(2, -1000));
    expect(zoomFromWheel(2, 1)).toBe(zoomFromWheel(2, 1000));
  });

  it('delta nol atau rusak mempertahankan skala', () => {
    expect(zoomFromWheel(2, 0)).toBe(2);
    expect(zoomFromWheel(2, Number.NaN)).toBe(2);
  });
});

describe('zoomAtPoint (F5-12)', () => {
  it('titik di bawah kursor tidak bergeser saat zoom dari pojok', () => {
    // Gambar 200 px, kursor 50 px dari pusat, zoom 1 → 2.
    const before = { scale: 1, tx: 0, ty: 0 };
    const after = zoomAtPoint(before, 2, 50, -30);

    // Titik konten di bawah kursor sebelum zoom: (50, -30) karena tx=0.
    const contentX = (50 - before.tx) / before.scale;
    const contentY = (-30 - before.ty) / before.scale;

    expect(after.tx + contentX * after.scale).toBeCloseTo(50);
    expect(after.ty + contentY * after.scale).toBeCloseTo(-30);
  });

  it('skala tidak berubah → posisi juga tidak berubah', () => {
    const state = { scale: 2, tx: 30, ty: -15 };
    expect(zoomAtPoint(state, 2, 100, 100)).toEqual(state);
  });
});

describe('clampAxis (F5-12)', () => {
  it('tidak bisa digeser saat gambar lebih kecil dari wadah', () => {
    expect(clampAxis(50, 200, 800, 1)).toBe(0);
    expect(clampAxis(50, 200, 800, 2)).toBe(0);
  });

  it('batas geser setengah selisih ukuran', () => {
    // 200 px pada 400% = 800 px; wadah 400 px → selisih 400 → batas ±200.
    expect(clampAxis(999, 200, 400, 4)).toBe(200);
    expect(clampAxis(-999, 200, 400, 4)).toBe(-200);
    expect(clampAxis(120, 200, 400, 4)).toBe(120);
  });

  it('gambar 200×200 pada 400% terlihat utuh di wadah 200×200', () => {
    // 800 px pada wadah 200 px → batas ±300 sehingga tiap tepi bisa dicapai.
    expect(clampAxis(999, 200, 200, 4)).toBe(300);
  });

  it('nilai rusak dianggap tanpa geser', () => {
    expect(clampAxis(Number.NaN, 200, 400, 4)).toBe(0);
    expect(clampAxis(10, Number.NaN, 400, 4)).toBe(0);
  });
});

describe('clampPan (F5-12)', () => {
  it('menjepit dua sumbu secara terpisah', () => {
    const state = clampPan(
      { scale: 4, tx: 999, ty: -999 },
      { width: 200, height: 200 },
      { width: 400, height: 600 },
    );
    // 200 px × 400% = 800 px; x: (800-400)/2 = 200, y: (800-600)/2 = 100.
    expect(state).toEqual({ scale: 4, tx: 200, ty: -100 });
  });

  it('skala di luar batas ikut dijepit', () => {
    const state = clampPan(
      { scale: 99, tx: 0, ty: 0 },
      { width: 200, height: 200 },
      { width: 400, height: 400 },
    );
    expect(state.scale).toBe(MAX_ZOOM);
  });
});

describe('panBy (F5-12)', () => {
  it('menggeser relatif terhadap posisi sekarang', () => {
    expect(panBy({ scale: 2, tx: 10, ty: 20 }, 5, -5)).toEqual({ scale: 2, tx: 15, ty: 15 });
  });

  it('delta rusak tidak merusak keadaan', () => {
    const state = { scale: 2, tx: 10, ty: 20 };
    expect(panBy(state, Number.NaN, 0)).toBe(state);
  });
});

describe('zoomFromPinch (F5-12)', () => {
  it('menskalakan relatif terhadap jarak awal', () => {
    // Dua jari merenggang 2× dari 100 px ke 200 px → skala 2× lipat.
    expect(zoomFromPinch(1, 100, 200)).toBe(2);
    expect(zoomFromPinch(1.5, 100, 100)).toBe(1.5);
  });

  it('tetap dijepit di batas', () => {
    expect(zoomFromPinch(1, 100, 1000)).toBe(MAX_ZOOM);
    expect(zoomFromPinch(2, 100, 10)).toBe(MIN_ZOOM);
  });

  it('jarak nol/rusak tidak mengubah skala', () => {
    expect(zoomFromPinch(2, 0, 100)).toBe(2);
    expect(zoomFromPinch(2, 100, 0)).toBe(2);
    expect(zoomFromPinch(2, Number.NaN, 100)).toBe(2);
  });
});

describe('pointerDistance / pointerMidpoint (F5-12)', () => {
  it('jarak dua sentuhan mengikuti Pythagoras', () => {
    expect(pointerDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('titik tengah dipakai sebagai jangkar cubit', () => {
    expect(pointerMidpoint({ x: 10, y: 20 }, { x: 30, y: 0 })).toEqual({ x: 20, y: 10 });
  });
});

describe('canZoomIn / canZoomOut (F5-12)', () => {
  it('tombol nonaktif di ujung rentang', () => {
    expect(canZoomIn(MAX_ZOOM)).toBe(false);
    expect(canZoomIn(MAX_ZOOM - 0.1)).toBe(true);
    expect(canZoomOut(MIN_ZOOM)).toBe(false);
    expect(canZoomOut(MIN_ZOOM + 0.1)).toBe(true);
  });
});

describe('IDENTITY_ZOOM (F5-12)', () => {
  it('keadaan awal pas di layar tanpa geser', () => {
    expect(IDENTITY_ZOOM).toEqual({ scale: MIN_ZOOM, tx: 0, ty: 0 });
  });
});
