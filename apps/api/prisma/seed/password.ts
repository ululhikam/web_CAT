import type { PrismaClient } from '@prisma/client';
import { randomBytes, scrypt } from 'node:crypto';

const PARAMS = { N: 16384, r: 8, p: 1, keyLen: 64 };

function deriveKey(plain: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      plain,
      salt,
      PARAMS.keyLen,
      { N: PARAMS.N, r: PARAMS.r, p: PARAMS.p, maxmem: 64 * 1024 * 1024 },
      (error, derived) => {
        if (error) reject(error);
        else resolve(derived);
      },
    );
  });
}

/**
 * Hash password untuk seed. Sengaja menduplikasi logika PasswordService
 * (bukan mengimpornya) agar seed tidak bergantung pada bootstrap Nest.
 * Format HARUS identik: `scrypt$N$r$p$salt$hash`.
 */
export async function hashSeedPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await deriveKey(plain, salt);

  return [
    'scrypt',
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString('base64'),
    derived.toString('base64'),
  ].join('$');
}
