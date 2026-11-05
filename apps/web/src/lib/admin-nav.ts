import type { Permission } from '@webcat/contracts';
import { panelBase, panelCrumbLabel, type AdminPanel } from '$lib/panel';

/**
 * Struktur navigasi panel admin.
 *
 * Satu sumber kebenaran untuk sidebar, breadcrumb, dan pintasan pada halaman
 * ringkasan. Semua `href` dibangun dari basis panel, sehingga pohon rute yang
 * sama dipakai bersama oleh `/admin` dan `/super-admin`.
 *
 * `permission` hanya menyembunyikan tautan di UI — otorisasi sebenarnya tetap
 * diperiksa API pada setiap request.
 */

export type AdminIconName =
  | 'dashboard'
  | 'users'
  | 'questions'
  | 'import'
  | 'categories'
  | 'media'
  | 'plans'
  | 'audit'
  | 'settings';

export interface AdminNavItem {
  /** Href absolut, sudah memperhitungkan basis panel. */
  href: string;
  /** Path relatif terhadap basis panel; string kosong berarti ringkasan. */
  path: string;
  label: string;
  description: string;
  icon: AdminIconName;
  permission?: Permission;
  /** Hanya muncul di panel SUPER_ADMIN. */
  platformOnly?: boolean;
}

export interface AdminNavGroup {
  label: string;
  items: readonly AdminNavItem[];
}

interface NavSeed {
  group: string;
  path: string;
  label: string;
  description: string;
  icon: AdminIconName;
  permission?: Permission;
  platformOnly?: boolean;
}

const NAV_SEEDS: readonly NavSeed[] = [
  {
    group: 'Ikhtisar',
    path: '',
    label: 'Ringkasan',
    description: 'Kondisi bank soal dan pintasan kerja harian.',
    icon: 'dashboard',
  },
  {
    group: 'Peserta',
    path: '/users',
    label: 'Pengguna',
    description: 'Buat akun peserta, atur role, dan pantau masa langganan.',
    icon: 'users',
    permission: 'users.read',
  },
  {
    group: 'Bank soal',
    path: '/questions',
    label: 'Soal',
    description: 'Cari, saring, publikasikan, dan arsipkan soal.',
    icon: 'questions',
    permission: 'questions.read',
  },
  {
    group: 'Bank soal',
    path: '/questions/import',
    label: 'Impor soal',
    description: 'Unggah CSV, PDF, atau DOCX lalu tinjau hasilnya.',
    icon: 'import',
    permission: 'questions.import',
  },
  {
    group: 'Bank soal',
    path: '/categories',
    label: 'Kategori',
    description: 'Kelola taksonomi hierarkis untuk bank soal.',
    icon: 'categories',
    permission: 'questions.read',
  },
  {
    group: 'Bank soal',
    path: '/media',
    label: 'Media',
    description: 'Pustaka gambar soal dan jumlah pemakaiannya.',
    icon: 'media',
    permission: 'questions.read',
  },
  {
    group: 'Langganan',
    path: '/plans',
    label: 'Paket & harga',
    description: 'Daftar paket yang dipakai untuk aktivasi manual.',
    icon: 'plans',
    permission: 'billing.read',
  },
  {
    group: 'Platform',
    path: '/audit',
    label: 'Audit log',
    description: 'Jejak aksi sensitif yang dilakukan admin.',
    icon: 'audit',
    permission: 'audit.read',
    platformOnly: true,
  },
  {
    group: 'Platform',
    path: '/settings',
    label: 'Pengaturan',
    description: 'Kebijakan sesi, pendaftaran, dan pengumuman platform.',
    icon: 'settings',
    permission: 'settings.write',
    platformOnly: true,
  },
];

const GROUP_ORDER = ['Ikhtisar', 'Peserta', 'Bank soal', 'Langganan', 'Platform'] as const;

/** Path yang hanya tersedia di panel SUPER_ADMIN. */
export const PLATFORM_ONLY_PATHS = ['/audit', '/settings'] as const;

/** Apakah sebuah path relatif (terhadap basis panel) khusus SUPER_ADMIN. */
export function isPlatformOnlyPath(path: string): boolean {
  return PLATFORM_ONLY_PATHS.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

function buildNav(panel: AdminPanel): AdminNavGroup[] {
  const base = panelBase(panel);

  const items = NAV_SEEDS.filter((seed) => panel === 'super-admin' || !seed.platformOnly).map<
    AdminNavItem
  >((seed) => ({
    href: seed.path ? `${base}${seed.path}` : base,
    path: seed.path,
    label: seed.label,
    description: seed.description,
    icon: seed.icon,
    permission: seed.permission,
    platformOnly: seed.platformOnly,
  }));

  return GROUP_ORDER.flatMap((group) => {
    const grouped = items.filter((item) => NAV_SEEDS.find((s) => s.path === item.path)?.group === group);
    return grouped.length > 0 ? [{ label: group, items: grouped }] : [];
  });
}

/** Menu lengkap panel, tanpa filter permission. */
export function adminNav(panel: AdminPanel): AdminNavGroup[] {
  return buildNav(panel);
}

/** Item yang boleh dilihat sesuai permission pengguna saat ini. */
export function adminNavFor(
  panel: AdminPanel,
  can: (permission: Permission) => boolean,
): AdminNavGroup[] {
  return buildNav(panel)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || can(item.permission)),
    }))
    .filter((group) => group.items.length > 0);
}

/** Path relatif terhadap basis panel. */
export function panelRelativePath(panel: AdminPanel, pathname: string): string {
  const base = panelBase(panel);
  return pathname === base ? '' : pathname.slice(base.length);
}

/**
 * Tautan aktif dengan pencocokan prefix terpanjang, sehingga
 * `/admin/questions/import` menyorot "Impor soal" (bukan "Soal").
 */
export function activeAdminHref(panel: AdminPanel, pathname: string): string | null {
  const rest = panelRelativePath(panel, pathname);

  let best: AdminNavItem | null = null;

  for (const group of adminNav(panel)) {
    for (const item of group.items) {
      const matches =
        item.path === ''
          ? rest === '' || rest === '/'
          : rest === item.path || rest.startsWith(`${item.path}/`);

      if (matches && (!best || item.path.length > best.path.length)) {
        best = item;
      }
    }
  }

  return best?.href ?? null;
}

export interface AdminCrumb {
  label: string;
  href?: string;
}

const SECTIONS: Record<string, { label: string; path: string }> = {
  users: { label: 'Pengguna', path: '/users' },
  questions: { label: 'Bank soal', path: '/questions' },
  categories: { label: 'Kategori', path: '/categories' },
  media: { label: 'Media', path: '/media' },
  plans: { label: 'Paket & harga', path: '/plans' },
  audit: { label: 'Audit log', path: '/audit' },
  settings: { label: 'Pengaturan', path: '/settings' },
};

const CHILD_LABELS: Record<string, string> = {
  'users/new': 'Tambah pengguna',
  'questions/new': 'Soal baru',
  'questions/import': 'Impor soal',
};

/** Breadcrumb untuk topbar. */
export function adminBreadcrumbs(panel: AdminPanel, pathname: string): AdminCrumb[] {
  const base = panelBase(panel);
  const root: AdminCrumb = { label: panelCrumbLabel(panel), href: base };

  const segments = panelRelativePath(panel, pathname)
    .split('/')
    .filter(Boolean);

  if (segments.length === 0) return [{ label: 'Ringkasan' }];

  const [section, ...rest] = segments;
  const meta = section ? SECTIONS[section] : undefined;
  if (!meta) return [root];

  const crumbs: AdminCrumb[] = [root, { label: meta.label, href: `${base}${meta.path}` }];

  const child = rest.join('/');
  if (child) {
    crumbs.push({
      label:
        CHILD_LABELS[`${section}/${child}`] ??
        (section === 'questions' ? 'Ubah soal' : 'Detail'),
    });
  }

  return crumbs;
}
