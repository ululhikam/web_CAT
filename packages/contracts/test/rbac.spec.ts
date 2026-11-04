import { describe, expect, it } from 'vitest';
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLE_RANK,
  ROLES,
  canManageRole,
  type Role,
} from '../src/common/rbac';

describe('RBAC', () => {
  it('hanya punya tiga role dengan peringkat unik', () => {
    expect(ROLES).toEqual(['USER', 'ADMIN', 'SUPER_ADMIN']);

    const ranks = ROLES.map((role) => ROLE_RANK[role]);
    expect(new Set(ranks).size).toBe(ROLES.length);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it('matriks permission bersifat aditif (USER ⊂ ADMIN ⊂ SUPER_ADMIN)', () => {
    for (const role of ROLES) {
      for (const permission of ROLE_PERMISSIONS[role]) {
        expect(PERMISSIONS).toContain(permission);
      }
    }

    const user = new Set(ROLE_PERMISSIONS.USER);
    for (const permission of ROLE_PERMISSIONS.ADMIN) {
      if (permission === 'exam.take') continue;
      expect(user.has(permission)).toBe(false);
    }

    expect([...ROLE_PERMISSIONS.SUPER_ADMIN].sort()).toEqual([...PERMISSIONS].sort());
  });

  it('SUPER_ADMIN selalu dapat mengelola role lain, ADMIN tidak dapat mengelola setara', () => {
    expect(canManageRole('SUPER_ADMIN', 'SUPER_ADMIN')).toBe(true);
    expect(canManageRole('SUPER_ADMIN', 'ADMIN')).toBe(true);
    expect(canManageRole('SUPER_ADMIN', 'USER')).toBe(true);

    expect(canManageRole('ADMIN', 'USER')).toBe(true);
    expect(canManageRole('ADMIN', 'ADMIN')).toBe(false);
    expect(canManageRole('ADMIN', 'SUPER_ADMIN')).toBe(false);

    expect(canManageRole('USER', 'USER')).toBe(false);
    expect(canManageRole('USER', 'ADMIN')).toBe(false);
  });

  it('setiap role punya minimal satu permission dan USER hanya boleh mengerjakan ujian', () => {
    for (const role of ROLES) {
      expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
    }

    expect([...ROLE_PERMISSIONS.USER]).toEqual(['exam.take']);
    expect(ROLE_PERMISSIONS.ADMIN).not.toContain('roles.manage');
    expect(ROLE_PERMISSIONS.ADMIN).toContain('subscriptions.manage');
  });

  it('tidak ada permission duplikat dalam satu role', () => {
    for (const role of ROLES) {
      const list = ROLE_PERMISSIONS[role as Role];
      expect(new Set(list).size).toBe(list.length);
    }
  });
});
