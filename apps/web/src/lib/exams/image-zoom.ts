/**
 * F5-12 — matematika murni viewer gambar figural.
 *
 * Soal figural (jaring-jaring kubus, pola kompleks) kadang butuh dilihat lebih
 * dekat. Komponen viewer hanya mengurus DOM; semua perhitungan zoom dan geser
 * ada di sini supaya bisa diuji tanpa browser dan dipakai ulang oleh pratinjau
 * admin.
 *
 * Model transformasi: `translate(tx, ty) scale(scale)` dengan titik asal di
 * tengah wadah. Posisi gambar dihitung relatif terhadap pusat wadah, sehingga
 * rumus "jaga titik di bawah kursor" cukup satu bentuk.
 */

/** Zoom minimum 100%: gambar tampil apa adanya. */
export const MIN_ZOOM = 1;

/**
 * Zoom maksimum 400%.
 *
 * Kriteria runbook meminta gambar 200×200 bisa diperbesar sampai 400%, jadi
 * angka itulah yang dipakai. Di atas 400% detail gambar sumber sudah habis.
 */
export const MAX_ZOOM = 4;

/** Satu ketukan tombol zoom mengubah skala 50%. */
export const ZOOM_STEP = 0.5;

/** Keadaan transformasi viewer. */
export interface ZoomState {
  scale: number;
  tx: number;
  ty: number;
}

/** Keadaan awal: pas di layar, tanpa geser. */
export const IDENTITY_ZOOM: ZoomState = { scale: MIN_ZOOM, tx: 0, ty: 0 };

/** Batasi skala ke rentang yang didukung; nilai rusak jatuh ke 100%. */
export function clampZoom(value: number): number {
  if (!Number.isFinite(value)) return MIN_ZOOM;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

/** Satu langkah zoom naik/turun, selalu di dalam batas. */
export function nextZoom(current: number, direction: 1 | -1): number {
  return clampZoom(clampZoom(current) + direction * ZOOM_STEP);
}

/**
 * Konversi `deltaY` roda tetikus menjadi skala baru.
 *
 * `deltaY` negatif berarti gulir ke atas — lazim berarti memperbesar. Satu
 * notifikasi roda dihitung satu langkah, berapa pun besarnya `deltaY`, supaya
 * tetikus dan trackpad terasa sama cepatnya.
 */
export function zoomFromWheel(current: number, deltaY: number): number {
  if (!Number.isFinite(deltaY) || deltaY === 0) return clampZoom(current);
  return nextZoom(current, deltaY < 0 ? 1 : -1);
}

/** Persentase untuk label toolbar ("100%", "400%"). */
export function zoomPercent(scale: number): number {
  return Math.round(clampZoom(scale) * 100);
}

/** Apakah masih bisa memperbesar. */
export function canZoomIn(scale: number): boolean {
  return clampZoom(scale) < MAX_ZOOM;
}

/** Apakah masih bisa memperkecil. */
export function canZoomOut(scale: number): boolean {
  return clampZoom(scale) > MIN_ZOOM;
}

/**
 * Batas geser satu sumbu.
 *
 * Saat `scale` 1 gambar tidak boleh digeser sama sekali. Saat diperbesar,
 * gambar boleh keluar wadah paling banyak setengah selisih ukuran — cukup
 * untuk melihat pinggir, tapi tepi gambar tidak pernah hilang dari layar.
 */
export function clampAxis(
  value: number,
  contentSize: number,
  viewportSize: number,
  scale: number,
): number {
  if (!Number.isFinite(value)) return 0;
  if (!Number.isFinite(contentSize) || !Number.isFinite(viewportSize)) return 0;
  const limit = Math.max(0, (contentSize * clampZoom(scale) - viewportSize) / 2);
  if (!Number.isFinite(limit)) return 0;
  return Math.min(limit, Math.max(-limit, value));
}

/** Jepit `tx`/`ty` agar gambar tetap terlihat di dalam wadah. */
export function clampPan(
  state: ZoomState,
  content: { width: number; height: number },
  viewport: { width: number; height: number },
): ZoomState {
  return {
    scale: clampZoom(state.scale),
    tx: clampAxis(state.tx, content.width, viewport.width, state.scale),
    ty: clampAxis(state.ty, content.height, viewport.height, state.scale),
  };
}

/**
 * Ubah skala sambil menjaga titik di bawah kursor tetap di tempatnya.
 *
 * `anchorX`/`anchorY` adalah koordinat kursor relatif terhadap pusat wadah.
 * Tanpa koreksi ini, zoom dengan roda akan "melempar" gambar ke pojok dan
 * peserta harus menggeser ulang setiap kali memperbesar.
 */
export function zoomAtPoint(
  state: ZoomState,
  nextScale: number,
  anchorX: number,
  anchorY: number,
): ZoomState {
  const scale = clampZoom(nextScale);
  if (scale === clampZoom(state.scale)) {
    return { ...state, scale };
  }
  const ratio = scale / clampZoom(state.scale);
  return {
    scale,
    tx: anchorX - (anchorX - state.tx) * ratio,
    ty: anchorY - (anchorY - state.ty) * ratio,
  };
}

/** Geser gambar sejauh `dx`/`dy` piksel layar. */
export function panBy(state: ZoomState, dx: number, dy: number): ZoomState {
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return state;
  return { ...state, tx: state.tx + dx, ty: state.ty + dy };
}

/**
 * Skala hasil cubit dua jari, relatif terhadap jarak saat cubit dimulai.
 *
 * Menghitung dari titik awal (bukan menumpuk per frame) membuat cubitan stabil
 * walau `pointermove` datang tidak beraturan.
 */
export function zoomFromPinch(startScale: number, startDistance: number, distance: number): number {
  if (!Number.isFinite(startDistance) || startDistance <= 0) return clampZoom(startScale);
  if (!Number.isFinite(distance) || distance <= 0) return clampZoom(startScale);
  return clampZoom(startScale * (distance / startDistance));
}

/** Jarak dua titik sentuh — dipakai untuk cubit. */
export function pointerDistance(
  first: { x: number; y: number },
  second: { x: number; y: number },
): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

/** Titik tengah dua sentuhan; dipakai sebagai jangkar saat cubit. */
export function pointerMidpoint(
  first: { x: number; y: number },
  second: { x: number; y: number },
): { x: number; y: number } {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}
