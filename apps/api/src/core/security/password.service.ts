import { createHash, randomBytes, randomInt, scrypt } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Password hashing.
 *
 * Target produksi: Argon2id (OWASP: m=19 MiB, t=2, p=1).
 * Phase 0 memakai scrypt bawaan Node (N=16384, r=8, p=1) agar tidak ada
 * native dependency yang rapuh saat build di Windows/Vercel.
 *
 * Format tersimpan: `scrypt$N$r$p$<salt-b64>$<hash-b64>`.
 * Parameter dibaca dari string itu sendiri, sehingga parameter bisa
 * dinaikkan tanpa memaksa user reset password.
 */
const PARAMS = { N: 16384, r: 8, p: 1, keyLen: 64 };

function deriveKey(
  plain: string,
  salt: Buffer,
  keyLen: number,
  options: { N: number; r: number; p: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      plain,
      salt,
      keyLen,
      { N: options.N, r: options.r, p: options.p, maxmem: 64 * 1024 * 1024 },
      (error, derived) => {
        if (error) reject(error);
        else resolve(derived);
      },
    );
  });
}

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);

  async hash(plain: string): Promise<string> {
    const salt = randomBytes(16);
    const derived = await deriveKey(plain, salt, PARAMS.keyLen, PARAMS);

    return [
      'scrypt',
      PARAMS.N,
      PARAMS.r,
      PARAMS.p,
      salt.toString('base64'),
      derived.toString('base64'),
    ].join('$');
  }

  async verify(stored: string, plain: string): Promise<boolean> {
    try {
      const [scheme, n, r, p, saltB64, hashB64] = stored.split('$');
      if (scheme !== 'scrypt' || !n || !r || !p || !saltB64 || !hashB64) return false;

      const expected = Buffer.from(hashB64, 'base64');
      if (expected.length === 0) return false;

      const derived = await deriveKey(plain, Buffer.from(saltB64, 'base64'), expected.length, {
        N: Number(n),
        r: Number(r),
        p: Number(p),
      });

      return derived.equals(expected);
    } catch (error) {
      this.logger.warn(
        `Verifikasi password gagal: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /** Hash deterministik untuk token (OTP, refresh token, undangan). */
  static sha256(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex');
  }

  /** Kode OTP numerik aman (bukan Math.random). */
  static numericCode(digits = 6): string {
    return String(randomInt(0, 10 ** digits)).padStart(digits, '0');
  }
}
