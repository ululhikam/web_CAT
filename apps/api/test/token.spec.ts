import { describe, expect, it } from 'vitest';
import { generateNumericCode, generateOpaqueToken, sha256 } from '../src/core/security/token.util';

describe('token.util', () => {
  it('token opaque memakai base64url dan tidak berulang', () => {
    const samples = new Set(Array.from({ length: 50 }, () => generateOpaqueToken()));

    expect(samples.size).toBe(50);
    for (const token of samples) {
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
      // 32 byte → 43 karakter base64url tanpa padding.
      expect(token.length).toBe(43);
    }
  });

  it('panjang token mengikuti jumlah byte yang diminta', () => {
    expect(generateOpaqueToken(16).length).toBe(22);
    expect(generateOpaqueToken(64).length).toBe(86);
  });

  it('kode OTP selalu 6 digit dan berisi angka saja', () => {
    for (let i = 0; i < 200; i += 1) {
      const code = generateNumericCode();
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it('kode OTP menghormati jumlah digit yang diminta', () => {
    expect(generateNumericCode(4)).toMatch(/^\d{4}$/);
    expect(generateNumericCode(8)).toMatch(/^\d{8}$/);
  });

  it('sha256 deterministik dan berbeda untuk input berbeda', () => {
    expect(sha256('rahasia')).toBe(sha256('rahasia'));
    expect(sha256('rahasia')).not.toBe(sha256('rahasia '));
    expect(sha256('')).toHaveLength(64);
    expect(sha256('rahasia')).toMatch(/^[0-9a-f]{64}$/);
  });
});
