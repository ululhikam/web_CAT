import type { Role } from '@webcat/contracts';

/**
 * Dua panel admin terpisah namun berbagi satu pohon rute.
 *
 *   /admin/...       → panel ADMIN (operasional harian)
 *   /super-admin/... → panel SUPER_ADMIN (operasional + platform)
 *
 * Modul ini menjadi satu sumber kebenaran untuk basis URL, label panel, dan
 * aturan "halaman mana boleh dibuka role mana". Aturan ini hanya lapisan UI:
 * otorisasi sebenarnya tetap ditegakkan API lewat `@RequirePermissions`.
 */

export const ADMIN_PANELS = ['admin', 'super-admin'] as const;

export type AdminPanel = (typeof ADMIN_PANELS)[number];

export function isAdminPanel(value: string | null | undefined): value is AdminPanel {
  return value === 'admin' || value === 'super-admin';
}

/** Basis URL panel, selalu diawali garis miring tanpa garis miring penutup. */
export function panelBase(panel: string | null | undefined): `/admin` | `/super-admin` {
  return panel === 'super-admin' ? '/super-admin' : '/admin';
}

/** Nama panel untuk badge, judul, dan breadcrumb root. */
export function panelLabel(panel: string | null | undefined): 'Panel admin' | 'Panel super admin' {
  return panel === 'super-admin' ? 'Panel super admin' : 'Panel admin';
}

/** Breadcrumb root singkat. */
export function panelCrumbLabel(panel: string | null | undefined): 'Admin' | 'Super admin' {
  return panel === 'super-admin' ? 'Super admin' : 'Admin';
}

const PARTICIPANT_PREFIXES = ['/dashboard', '/subscription', '/profile', '/devices'] as const;

/**
 * Halaman peserta yang juga boleh dibuka admin/super admin: layar pemilihan
 * tes, pengerjaan ujian, dan hasil. Dipakai menu "TES CAT" di panel.
 */
const SHARED_PREFIXES = ['/exam', '/results'] as const;

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Apakah path termasuk halaman ujian yang boleh diakses semua role. */
export function isSharedExamPath(pathname: string): boolean {
  return SHARED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

/** Halaman beranda sesuai role, dipakai setelah login dan saat redirect. */
export function homePathFor(role: Role | null | undefined): string {
  if (role === 'SUPER_ADMIN') return '/super-admin';
  if (role === 'ADMIN') return '/admin';
  return '/dashboard';
}

/**
 * Apakah `pathname` boleh dibuka role tertentu.
 *
 * Dipakai untuk membersihkan parameter `?redirect` setelah login: admin tidak
 * boleh dilempar ke situs peserta, peserta tidak boleh ke panel admin, dan
 * SUPER_ADMIN dipisahkan dari panel ADMIN.
 */
export function canRoleAccessPath(role: Role | null | undefined, pathname: string): boolean {
  if (!pathname.startsWith('/') || pathname.startsWith('//')) return false;

  // Halaman TES CAT & hasil dipakai bersama: admin boleh mengerjakan dan
  // memverifikasi tes tanpa keluar dari panel.
  if (isSharedExamPath(pathname)) return true;

  const isParticipantPath = PARTICIPANT_PREFIXES.some((prefix) =>
    matchesPrefix(pathname, prefix),
  );

  if (role === 'SUPER_ADMIN') {
    return !isParticipantPath && !matchesPrefix(pathname, '/admin');
  }

  if (role === 'ADMIN') {
    return !isParticipantPath && !matchesPrefix(pathname, '/super-admin');
  }

  return !matchesPrefix(pathname, '/admin') && !matchesPrefix(pathname, '/super-admin');
}
