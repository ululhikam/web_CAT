/**
 * Logika form paket admin (F5-02), dipisah dari komponen agar bisa diuji
 * tanpa DOM.
 *
 * Semua aturan di sini mencerminkan `createPlanSchema`/`updatePlanSchema`
 * di `@webcat/contracts`. Duplikasi kecil ini disengaja: server tetap
 * memvalidasi, klien hanya mencegah admin menunggu round-trip untuk kesalahan
 * yang jelas.
 */
import {
  PLAN_STATUSES,
  type AdminPlan,
  type CreatePlanInput,
  type PlanFeature,
  type PlanStatus,
  type UpdatePlanInput,
} from '@webcat/contracts';

export interface PlanDraft {
  code: string;
  name: string;
  tagline: string;
  priceIdr: number;
  compareAtPriceIdr: number | null;
  durationDays: number;
  badge: string;
  isPopular: boolean;
  isPublic: boolean;
  sortOrder: number;
  status: PlanStatus;
  features: PlanFeature[];
}

export const PLAN_CODE_PATTERN = /^[A-Z0-9_]{2,50}$/;

export function emptyDraft(status: PlanStatus = 'DRAFT'): PlanDraft {
  return {
    code: '',
    name: '',
    tagline: '',
    priceIdr: 0,
    compareAtPriceIdr: null,
    durationDays: 30,
    badge: '',
    isPopular: false,
    isPublic: true,
    sortOrder: 0,
    status,
    features: [],
  };
}

export function draftFromPlan(plan: AdminPlan): PlanDraft {
  return {
    code: plan.code,
    name: plan.name,
    tagline: plan.tagline ?? '',
    priceIdr: plan.priceIdr,
    compareAtPriceIdr: plan.compareAtPriceIdr,
    durationDays: plan.durationDays,
    badge: plan.badge ?? '',
    isPopular: plan.isPopular,
    isPublic: plan.isPublic,
    sortOrder: plan.sortOrder,
    status: plan.status,
    features: plan.features.map((feature) => ({ ...feature })),
  };
}

/** Pisahkan paket hidup dan terarsip untuk dua tab panel. */
export function splitPlans(plans: AdminPlan[]): {
  live: AdminPlan[];
  archived: AdminPlan[];
} {
  return {
    live: plans.filter((plan) => plan.deletedAt === null),
    archived: plans.filter((plan) => plan.deletedAt !== null),
  };
}

function isPositiveInt(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

/**
 * Validasi lokal. Mengembalikan daftar pesan; kosong berarti aman dikirim.
 * Kode paket hanya divalidasi saat membuat (tidak bisa diubah saat update).
 */
export function validateDraft(draft: PlanDraft, mode: 'create' | 'update'): string[] {
  const issues: string[] = [];

  if (mode === 'create' && !PLAN_CODE_PATTERN.test(draft.code.trim().toUpperCase())) {
    issues.push('Kode paket 2–50 karakter: huruf besar, angka, atau garis bawah.');
  }
  if (draft.name.trim().length < 2) {
    issues.push('Nama paket minimal 2 karakter.');
  } else if (draft.name.trim().length > 80) {
    issues.push('Nama paket maksimal 80 karakter.');
  }
  if (draft.tagline.trim().length > 160) {
    issues.push('Tagline maksimal 160 karakter.');
  }
  if (!isPositiveInt(draft.priceIdr, 0, 1_000_000_000)) {
    issues.push('Harga harus bilangan bulat 0 atau lebih.');
  }
  if (draft.compareAtPriceIdr !== null) {
    if (!isPositiveInt(draft.compareAtPriceIdr, 0, 1_000_000_000)) {
      issues.push('Harga coret harus bilangan bulat 0 atau lebih.');
    } else if (draft.compareAtPriceIdr <= draft.priceIdr) {
      issues.push('Harga coret harus lebih besar dari harga jual.');
    }
  }
  if (!isPositiveInt(draft.durationDays, 1, 3650)) {
    issues.push('Durasi 1–3650 hari.');
  }
  if (draft.badge.trim().length > 40) {
    issues.push('Badge maksimal 40 karakter.');
  }
  if (!isPositiveInt(draft.sortOrder, 0, 10_000)) {
    issues.push('Urutan 0–10000.');
  }
  if (!PLAN_STATUSES.includes(draft.status)) {
    issues.push('Status paket tidak dikenal.');
  }
  if (draft.features.length > 30) {
    issues.push('Maksimal 30 fitur.');
  }
  for (const feature of draft.features) {
    if (feature.label.trim().length === 0) {
      issues.push('Setiap fitur harus punya label.');
      break;
    }
  }

  return issues;
}

function normalizeFeatures(features: PlanFeature[]): PlanFeature[] {
  return features
    .map((feature) => ({ label: feature.label.trim(), included: feature.included }))
    .filter((feature) => feature.label.length > 0);
}

/** Payload `POST /admin/plans`. */
export function buildCreatePayload(draft: PlanDraft): CreatePlanInput {
  return {
    code: draft.code.trim().toUpperCase(),
    name: draft.name.trim(),
    tagline: draft.tagline.trim() ? draft.tagline.trim() : null,
    priceIdr: draft.priceIdr,
    compareAtPriceIdr: draft.compareAtPriceIdr,
    durationDays: draft.durationDays,
    features: normalizeFeatures(draft.features),
    badge: draft.badge.trim() ? draft.badge.trim() : null,
    isPopular: draft.isPopular,
    isPublic: draft.isPublic,
    sortOrder: draft.sortOrder,
    status: draft.status,
  };
}

/** Payload `PATCH /admin/plans/:id` — `code` sengaja tidak ikut. */
export function buildUpdatePayload(draft: PlanDraft): UpdatePlanInput {
  return {
    name: draft.name.trim(),
    tagline: draft.tagline.trim() ? draft.tagline.trim() : null,
    priceIdr: draft.priceIdr,
    compareAtPriceIdr: draft.compareAtPriceIdr,
    durationDays: draft.durationDays,
    features: normalizeFeatures(draft.features),
    badge: draft.badge.trim() ? draft.badge.trim() : null,
    isPopular: draft.isPopular,
    isPublic: draft.isPublic,
    sortOrder: draft.sortOrder,
    status: draft.status,
  };
}

/**
 * Ringkasan perubahan untuk ditampilkan setelah simpan. Admin perlu melihat
 * akibat nyata (harga/publikasi/status) tanpa membandingkan sendiri.
 */
export function describePlanChange(before: AdminPlan | null, after: AdminPlan): string {
  if (!before) return `Paket ${after.code} dibuat.`;

  const changes: string[] = [];
  if (before.priceIdr !== after.priceIdr) {
    changes.push(`harga ${before.priceIdr} → ${after.priceIdr}`);
  }
  if (before.isPublic !== after.isPublic) {
    changes.push(after.isPublic ? 'kini tampil di /pricing' : 'disembunyikan dari /pricing');
  }
  if (before.status !== after.status) {
    changes.push(`status ${before.status} → ${after.status}`);
  }
  if (before.name !== after.name) {
    changes.push(`nama "${before.name}" → "${after.name}"`);
  }
  return changes.length > 0 ? changes.join('; ') : 'Tidak ada perubahan yang terdeteksi.';
}
