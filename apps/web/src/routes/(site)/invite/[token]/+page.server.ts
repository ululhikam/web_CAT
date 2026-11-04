import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * Tautan undangan yang dikirim email berbentuk `/invite/<token>`.
 * Halaman aktivasi membaca token dari query; redirect ini menjaga kedua
 * bentuk URL tetap bekerja tanpa menduplikasi form.
 */
export const load: PageServerLoad = ({ params }) => {
  redirect(307, `/invite?token=${encodeURIComponent(params.token)}`);
};
