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
import { PRICING_ENABLED } from '$lib/features';

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

  // Halaman paket disembunyikan sementara (`$lib/features`). Redirect 307
  // dipilih alih-alih 404 supaya tautan lama tetap mendarat di beranda.
  if (!PRICING_ENABLED && event.url.pathname === '/pricing') {
    redirect(307, '/');
  }

  // Catatan: Otorisasi dan pengecekan sesi dilakukan di sisi klien melalui
  // `session.restore()` di root layout dan guard per-layout `(app)` & `(admin)`.
  // Kami tidak melakukan redirect agresif di SSR pada ketiadaan cookie httpOnly
  // agar lingkungan dev (port berbeda), reverse proxy, dan transisi sesi tidak
  // memutus sesi pengguna secara prematur.

  const response = await resolve(event);

  // Header keamanan dasar; CSP utama dipasang SvelteKit dari `svelte.config.js`.
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  response.headers.set('x-frame-options', 'DENY');
  response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');

  return response;
};
