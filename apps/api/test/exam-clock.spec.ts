import { describe, expect, it } from 'vitest';
import {
  buildClock,
  canWrite,
  computeEndsAt,
  gracePeriodFor,
  isExpired,
  lockReasonFor,
  lockedReasonFor,
  nextSubtestStartedAt,
  remainingMs,
  writeDeadline,
} from '../src/modules/exams/exam-clock';

const start = new Date('2026-01-02T08:00:00.000Z');

describe('timer subtes', () => {
  it('ends_at = started_at + durasi', () => {
    expect(computeEndsAt(start, 10).toISOString()).toBe('2026-01-02T08:10:00.000Z');
    expect(computeEndsAt(start, 0).toISOString()).toBe('2026-01-02T08:01:00.000Z');
    expect(computeEndsAt(start, Number.NaN).toISOString()).toBe('2026-01-02T08:01:00.000Z');
  });

  it('sisa waktu tidak pernah negatif', () => {
    const endsAt = new Date('2026-01-02T08:10:00.000Z');
    expect(remainingMs(endsAt, new Date('2026-01-02T08:09:30.000Z'))).toBe(30_000);
    expect(remainingMs(endsAt, new Date('2026-01-02T08:11:00.000Z'))).toBe(0);
    expect(remainingMs(null, start)).toBeNull();
  });

  it('grace pendek untuk subtes <= 10 menit, panjang untuk sisanya', () => {
    expect(gracePeriodFor(10, 3_000, 8_000)).toBe(3_000);
    expect(gracePeriodFor(9, 3_000, 8_000)).toBe(3_000);
    expect(gracePeriodFor(11, 3_000, 8_000)).toBe(8_000);
    expect(gracePeriodFor(120, 3_000, 8_000)).toBe(8_000);
  });

  it('deadline tulis = ends_at + grace', () => {
    const endsAt = new Date('2026-01-02T08:10:00.000Z');
    expect(writeDeadline(endsAt, 10, 3_000, 8_000).toISOString()).toBe('2026-01-02T08:10:03.000Z');
    expect(writeDeadline(endsAt, 120, 3_000, 8_000).toISOString()).toBe('2026-01-02T08:10:08.000Z');
  });
});

describe('hard lock', () => {
  const state = {
    status: 'ACTIVE' as const,
    startedAt: start,
    endsAt: new Date('2026-01-02T08:10:00.000Z'),
  };

  it('kedaluwarsa tepat pada ends_at', () => {
    expect(isExpired(state, new Date('2026-01-02T08:09:59.999Z'))).toBe(false);
    expect(isExpired(state, new Date('2026-01-02T08:10:00.000Z'))).toBe(true);
    expect(isExpired({ ...state, status: 'COMPLETED' }, new Date('2026-01-02T09:00:00.000Z'))).toBe(
      false,
    );
  });

  it('penulisan ditolak setelah ends_at meski masih dalam grace', () => {
    expect(canWrite(state, new Date('2026-01-02T08:10:02.000Z'), 10, 3_000, 8_000)).toBe(false);
    expect(canWrite(state, new Date('2026-01-02T08:09:59.000Z'), 10, 3_000, 8_000)).toBe(true);
  });

  it('alasan kunci TIME_EXPIRED setelah batas', () => {
    expect(lockReasonFor(state, new Date('2026-01-02T08:10:00.000Z'))).toBe('TIME_EXPIRED');
    expect(lockReasonFor(state, new Date('2026-01-02T08:09:59.000Z'))).toBe('MANUAL_SUPER_ADMIN');
  });
});

describe('transisi subtes & payload jam', () => {
  it('on_open tidak memulai timer, immediate memulai dari akhir subtes sebelumnya', () => {
    const previousEnd = new Date('2026-01-02T09:00:00.000Z');
    expect(nextSubtestStartedAt('on_open', previousEnd, start)).toBeNull();
    expect(nextSubtestStartedAt('immediate', previousEnd, start)).toBe(previousEnd);
    expect(nextSubtestStartedAt('immediate', null, start)).toBeNull();
  });

  it('buildClock memakai waktu server', () => {
    const now = new Date('2026-01-02T08:05:00.000Z');
    expect(
      buildClock(
        {
          status: 'ACTIVE',
          startedAt: start,
          endsAt: new Date('2026-01-02T08:10:00.000Z'),
        },
        now,
      ),
    ).toEqual({
      serverTime: now.toISOString(),
      endsAt: '2026-01-02T08:10:00.000Z',
      remainingMs: 300_000,
      status: 'ACTIVE',
    });
  });

  it('lockedReasonFor mendahulukan status sesi gugur', () => {
    expect(
      lockedReasonFor({
        sessionStatus: 'ELIMINATED',
        subtest: { status: 'ACTIVE', lockReason: null },
      }),
    ).toBe('ELIMINATED');
    expect(
      lockedReasonFor({
        sessionStatus: 'IN_PROGRESS',
        subtest: { status: 'COMPLETED', lockReason: null },
      }),
    ).toBeNull();
    expect(
      lockedReasonFor({
        sessionStatus: 'IN_PROGRESS',
        subtest: { status: 'EXPIRED', lockReason: 'TIME_EXPIRED' },
      }),
    ).toBe('TIME_EXPIRED');
  });
});
