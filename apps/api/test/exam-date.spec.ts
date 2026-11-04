import { describe, expect, it } from 'vitest';
import { examDateOnly } from '../src/core/time/exam-date';

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

describe('examDateOnly (WIB)', () => {
  it('tetap tanggal yang sama sebelum tengah malam WIB', () => {
    expect(iso(examDateOnly(new Date('2026-01-01T16:59:00.000Z')))).toBe('2026-01-01');
    expect(iso(examDateOnly(new Date('2026-01-01T00:00:00.000Z')))).toBe('2026-01-01');
  });

  it('berpindah tanggal tepat pukul 00:00 WIB (17:00 UTC)', () => {
    expect(iso(examDateOnly(new Date('2026-01-01T17:00:00.000Z')))).toBe('2026-01-02');
  });

  it('mengembalikan pukul 00:00 UTC untuk komponen DATE Prisma', () => {
    const value = examDateOnly(new Date('2026-03-15T03:00:00.000Z'));
    expect(value.toISOString()).toBe('2026-03-15T00:00:00.000Z');
  });
});
