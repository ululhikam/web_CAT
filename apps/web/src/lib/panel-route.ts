import { page } from '$app/state';
import { panelBase, type AdminPanel } from '$lib/panel';

/**
 * Panel aktif untuk halaman yang sedang dibuka.
 *
 * Nilai `[panel]` sudah divalidasi di `(admin)/[panel]/+layout.ts`, tetapi
 * tipe di sini tetap dijaga agar aman bila dipakai di luar konteks tersebut.
 */
export function currentPanel(): AdminPanel {
  return page.params.panel === 'super-admin' ? 'super-admin' : 'admin';
}

/**
 * Basis URL panel aktif: `/admin` atau `/super-admin`.
 *
 * Dipakai untuk membangun tautan antar-halaman di dalam panel, sehingga satu
 * pohon rute bisa melayani kedua panel tanpa URL yang tertukar.
 */
export function adminBase(): `/admin` | `/super-admin` {
  return panelBase(currentPanel());
}
