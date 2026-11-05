import { afterAll, describe, expect, it } from 'vitest';
import { createTestPrisma, integrationEnabled, resetTestData } from './setup';

/**
 * F0-07 — bukti bahwa helper integrasi benar-benar bisa:
 *   1. connect ke database uji,
 *   2. menjalankan `resetTestData` (TRUNCATE) tanpa error FK.
 *
 * Bila `DATABASE_URL_TEST` kosong, seluruh blok di-skip sehingga
 * `pnpm test:integration` tetap exit 0 di mesin tanpa database.
 */
describe.skipIf(!integrationEnabled)('helper integration test', () => {
  const prisma = createTestPrisma();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('terhubung ke database uji', async () => {
    const rows = await prisma.$queryRaw<Array<{ current_database: string }>>`SELECT current_database()`;
    const name = rows[0]?.current_database ?? '';
    expect(name).toContain('test');
  });

  it('resetTestData mengosongkan tabel transaksional', async () => {
    await resetTestData(prisma);

    const [users, sessions, examSessions] = await Promise.all([
      prisma.user.count(),
      prisma.session.count(),
      prisma.examSession.count(),
    ]);

    expect(users).toBe(0);
    expect(sessions).toBe(0);
    expect(examSessions).toBe(0);
  });
});
