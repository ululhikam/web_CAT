/** 3 role final. Bersifat aditif: SUPER_ADMIN punya semua izin ADMIN. */
export const ROLES = ['USER', 'ADMIN', 'SUPER_ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  'exam.take',
  'questions.read',
  'questions.write',
  'questions.import',
  'questions.publish',
  'exams.config',
  'exams.monitor',
  'exams.recompute',
  'exams.force_unlock',
  'users.read',
  'users.create',
  'users.suspend',
  'users.password.reset',
  'subscriptions.manage',
  'roles.manage',
  'settings.write',
  'audit.read',
  'system.impersonate',
  'billing.read',
  'billing.write',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Matriks permission default. Disimpan juga di DB (roles/permissions)
 * agar SUPER_ADMIN dapat mengubahnya lewat UI tanpa deploy.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  USER: ['exam.take'],
  ADMIN: [
    'exam.take',
    'questions.read',
    'questions.write',
    'questions.import',
    'questions.publish',
    'exams.config',
    'exams.monitor',
    'exams.recompute',
    'users.read',
    'users.create',
    'users.suspend',
    'users.password.reset',
    'subscriptions.manage',
    'billing.read',
    'billing.write',
  ],
  SUPER_ADMIN: [...PERMISSIONS],
};

export const ROLE_RANK: Record<Role, number> = {
  USER: 0,
  ADMIN: 1,
  SUPER_ADMIN: 2,
};

/** True bila `actor` boleh mengelola `target` (tidak boleh mengelola role setara/lebih tinggi kecuali diri sendiri). */
export function canManageRole(actor: Role, target: Role): boolean {
  if (actor === 'SUPER_ADMIN') return true;
  return ROLE_RANK[actor] > ROLE_RANK[target];
}
