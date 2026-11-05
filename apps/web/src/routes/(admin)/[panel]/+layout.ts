import { error } from '@sveltejs/kit';
import { isAdminPanel } from '$lib/panel';
import type { LayoutLoad } from './$types';

/**
 * Dua panel admin berbagi satu pohon rute:
 *
 *   /admin/...       → panel ADMIN
 *   /super-admin/... → panel SUPER_ADMIN
 *
 * Segmen `[panel]` divalidasi di sini agar URL lain yang tidak dikenal
 * tidak ikut merender shell admin. Pemeriksaan role dilakukan di layout
 * klien karena sesi hanya hidup di memori browser.
 */
export const load: LayoutLoad = ({ params }) => {
  if (!isAdminPanel(params.panel)) {
    error(404, 'Panel tidak ditemukan');
  }

  return { panel: params.panel };
};
