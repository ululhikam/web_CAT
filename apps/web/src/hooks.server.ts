/**
 * Hook global SvelteKit.
 *
 * Guard SSR memeriksa keberadaan cookie refresh httpOnly sebelum halaman
 * terlindung dirender. Ini mencegah kilasan konten untuk pengunjung tanpa
 * sesi; validasi token tetap dilakukan API pada setiap request (otorisasi
 * sebenarnya tidak pernah bergantung pada guard ini).
 *
 * Access token tetap hanya hidup di memori browser, sehingga `locals.user`
 * tidak diisi dari sini. Bila cookie ada tetapi sudah kedaluwarsa/dicabut,
 * layout klien akan memulihkan sesi, gagal, lalu mengarahkan ke /login.
 */
import { redirect, type Handle } from '@sveltejs/kit';

/**
 * Harus sama dengan `REFRESH_COOKIE_NAME` di `@webcat/contracts/auth`.
 * Nilai ditulis ulang di sini karena web hanya mengimpor *type* dari
 * contracts (aturan bundel: kontrak berisi Zod dan tidak ikut ke klien).
 */
const REFRESH_COOKIE_NAME = 'webcat_rt';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/subscription',
  '/profile',
  '/devices',
  '/admin',
  '/super-admin',
] as const;

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = null;

  if (isProtected(event.url.pathname) && !event.cookies.get(REFRESH_COOKIE_NAME)) {
    const target = event.url.pathname + event.url.search;
    redirect(303, `/login?redirect=${encodeURIComponent(target)}`);
  }

  const response = await resolve(event);

  // Header keamanan dasar. CSP penuh menyusul saat aset produksi dibekukan.
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  response.headers.set('x-frame-options', 'SAMEORIGIN');
  response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');

  return response;
};
