import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  decodeCursor,
  encodeCursor,
  paginationQuerySchema,
} from '../src/common/pagination';

describe('pagination query', () => {
  it('memakai default limit bila tidak diisi', () => {
    const parsed = paginationQuerySchema.parse({});
    expect(parsed.limit).toBe(DEFAULT_PAGE_SIZE);
    expect(parsed.cursor).toBeUndefined();
  });

  it('mengubah limit string menjadi angka dan memangkas cursor', () => {
    const parsed = paginationQuerySchema.parse({ limit: '25', cursor: '  abc  ' });
    expect(parsed).toEqual({ limit: 25, cursor: 'abc' });
  });

  it('menolak limit di luar batas', () => {
    expect(paginationQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ limit: MAX_PAGE_SIZE + 1 }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ limit: 'abc' }).success).toBe(false);
  });

  it('menerima limit tepat di batas', () => {
    expect(paginationQuerySchema.parse({ limit: 1 }).limit).toBe(1);
    expect(paginationQuerySchema.parse({ limit: MAX_PAGE_SIZE }).limit).toBe(MAX_PAGE_SIZE);
  });
});

describe('cursor opaque', () => {
  it('round-trip mempertahankan payload', () => {
    const payload = { createdAt: '2026-01-01T00:00:00.000Z', id: 'usr_123' };
    const encoded = encodeCursor(payload);
    expect(decodeCursor(encoded)).toEqual(payload);
  });

  it('aman untuk URL (tanpa +, /, =)', () => {
    const encoded = encodeCursor({ emoji: '🛈', text: 'a+b/c=' });
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeCursor(encoded)).toEqual({ emoji: '🛈', text: 'a+b/c=' });
  });

  it('menghasilkan base64url yang berbeda untuk payload berbeda', () => {
    expect(encodeCursor({ id: 'a' })).not.toBe(encodeCursor({ id: 'b' }));
  });

  it('melempar error untuk cursor tidak valid', () => {
    expect(() => decodeCursor('bukan-json')).toThrow();
  });
});
