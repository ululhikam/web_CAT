import { describe, expect, it } from 'vitest';
import { failureEnvelope, successEnvelope } from '../src/core/http/envelope';

describe('envelope', () => {
  const requestId = 'req_test_1';

  it('sukses selalu punya data dan error null', () => {
    const envelope = successEnvelope({ hello: 'dunia' }, requestId);

    expect(envelope).toMatchObject({
      success: true,
      data: { hello: 'dunia' },
      error: null,
      requestId,
      meta: { requestId },
    });
    expect(typeof envelope.meta.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(envelope.meta.timestamp))).toBe(false);
  });

  it('meta tambahan menimpa nilai default dengan aman', () => {
    const envelope = successEnvelope([1, 2, 3], requestId, { total: 3, hasMore: false });

    expect(envelope.meta.total).toBe(3);
    expect(envelope.meta.hasMore).toBe(false);
    expect(envelope.meta.requestId).toBe(requestId);
  });

  it('gagal selalu punya data null dan kode error', () => {
    const envelope = failureEnvelope('AUTH_INVALID_CREDENTIALS', 'Email atau password salah', requestId);

    expect(envelope).toMatchObject({
      success: false,
      data: null,
      error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Email atau password salah' },
      requestId,
    });
    expect(envelope.meta.requestId).toBe(requestId);
  });

  it('details hanya disertakan bila diberikan', () => {
    const withoutDetails = failureEnvelope('COMMON_VALIDATION_ERROR', 'Data tidak valid', requestId);
    expect('details' in withoutDetails.error).toBe(false);

    const withDetails = failureEnvelope('COMMON_VALIDATION_ERROR', 'Data tidak valid', requestId, [
      { path: 'email', message: 'Format email tidak valid' },
    ]);
    expect(withDetails.error.details).toHaveLength(1);
  });
});
