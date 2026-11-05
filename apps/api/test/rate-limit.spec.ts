import { HttpException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { RateLimitGuard, type RateLimitRule } from '../src/core/ratelimit/rate-limit.guard';
import { RateLimitService } from '../src/core/ratelimit/rate-limit.service';

interface Scenario {
  rule?: RateLimitRule;
  user?: { id: string };
  ip?: string;
  forwarded?: string;
}

function makeContext({ user, ip = '1.2.3.4', forwarded }: Scenario) {
  const headers: Record<string, string> = {};
  if (forwarded) headers['x-forwarded-for'] = forwarded;

  const setHeader = vi.fn();
  const request = { user, ip, headers };
  const response = { setHeader };
  const context = {
    getHandler: () => function login() {},
    getClass: () => {
      class AuthController {}
      return AuthController;
    },
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  };

  return { context: context as never, setHeader };
}

function makeGuard(
  scenario: Scenario,
  consumeResult = { allowed: true, remaining: 1, retryAfterSeconds: 30 },
) {
  const consume = vi.fn(async () => consumeResult);
  const reflector = { getAllAndOverride: vi.fn(() => scenario.rule) };
  const config = { value: { RATE_LIMIT_GLOBAL_PER_MINUTE: 600 } };
  const guard = new RateLimitGuard(reflector as never, { consume } as never, config as never);

  return { guard, consume, reflector };
}

describe('RateLimitGuard', () => {
  it('memakai aturan eksplisit per rute dan scope IP', async () => {
    const scenario: Scenario = {
      rule: { limit: 10, windowSeconds: 900 },
      forwarded: '203.0.113.9, 10.0.0.1',
    };
    const { guard, consume } = makeGuard(scenario);
    const { context } = makeContext(scenario);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(consume).toHaveBeenCalledWith({
      bucket: 'AuthController.login:ip:203.0.113.9',
      limit: 10,
      windowSeconds: 900,
    });
  });

  it('default global memakai ID pengguna bila sudah login', async () => {
    const scenario: Scenario = { user: { id: 'user-1' }, forwarded: '203.0.113.10' };
    const { guard, consume } = makeGuard(scenario);
    const { context } = makeContext(scenario);

    await guard.canActivate(context);

    expect(consume).toHaveBeenCalledWith({
      bucket: 'global:user:user-1',
      limit: 600,
      windowSeconds: 60,
    });
  });

  it('default global memakai X-Forwarded-For untuk anonim', async () => {
    const scenario: Scenario = { forwarded: '198.51.100.7, 10.0.0.2' };
    const { guard, consume } = makeGuard(scenario);
    const { context } = makeContext(scenario);

    await guard.canActivate(context);

    expect(consume).toHaveBeenCalledWith({
      bucket: 'global:ip:198.51.100.7',
      limit: 600,
      windowSeconds: 60,
    });
  });

  it('menolak dengan 429 + Retry-After saat kuota habis', async () => {
    const scenario: Scenario = { user: { id: 'user-2' } };
    const { guard } = makeGuard(scenario, {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 42,
    });
    const { context, setHeader } = makeContext(scenario);

    let caught: unknown;
    try {
      await guard.canActivate(context);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(HttpException);
    expect((caught as HttpException).getStatus()).toBe(429);
    expect((caught as HttpException).getResponse()).toMatchObject({
      code: 'COMMON_RATE_LIMITED',
      details: { retryAfterSeconds: 42 },
    });
    expect(setHeader).toHaveBeenCalledWith('Retry-After', '42');
  });
});

describe('RateLimitService.consume', () => {
  function serviceWithHits(hits: number) {
    const prisma = { $queryRaw: vi.fn(async () => [{ hits }]) };
    return new RateLimitService(prisma as never);
  }

  it('mengizinkan selama hits <= limit dan menghitung sisa', async () => {
    const service = serviceWithHits(3);
    const result = await service.consume({ bucket: 'x', limit: 5, windowSeconds: 60 });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('menolak saat hits melewati limit', async () => {
    const service = serviceWithHits(6);
    const result = await service.consume({ bucket: 'x', limit: 5, windowSeconds: 60 });

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('menolak secara aman bila DB tidak mengembalikan baris', async () => {
    const prisma = { $queryRaw: vi.fn(async () => []) };
    const service = new RateLimitService(prisma as never);
    const result = await service.consume({ bucket: 'x', limit: 5, windowSeconds: 60 });

    expect(result.allowed).toBe(false);
  });
});
