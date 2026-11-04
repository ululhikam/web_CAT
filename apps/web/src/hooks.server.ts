/**
 * Hook global SvelteKit.
 *
 * Phase 0 memakai SSR "tanpa sesi": access token hidup di memori browser,
 * jadi `locals.user` selalu `null` dan guard halaman dilakukan di klien
 * (`(app)/+layout.svelte`, `(admin)/+layout.svelte`).
 *
 * B1 akan memindahkan verifikasi sesi ke sini memakai cookie refresh,
 * sehingga guard berjalan di server tanpa kilasan konten.
 */
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = null;

  const response = await resolve(event);

  // Header keamanan dasar. CSP penuh menyusul saat aset produksi dibekukan.
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  response.headers.set('x-frame-options', 'SAMEORIGIN');
  response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');

  return response;
};
