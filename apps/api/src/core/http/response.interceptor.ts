import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { map, type Observable } from 'rxjs';
import { successEnvelope } from './envelope';

export interface PaginatedPayload<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

function isPaginated<T>(value: unknown): value is PaginatedPayload<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as PaginatedPayload<T>).items) &&
    'nextCursor' in (value as object) &&
    'hasMore' in (value as object)
  );
}

/**
 * Membungkus semua respons sukses ke envelope standar. Controller cukup
 * mengembalikan data mentah; bila mengembalikan `{ items, nextCursor, hasMore }`
 * meta pagination otomatis diisi.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { requestId?: string }>();
    const requestId = req.requestId ?? 'unknown';

    return next.handle().pipe(
      map((data) => {
        if (isPaginated<T>(data)) {
          return successEnvelope(data.items, requestId, {
            nextCursor: data.nextCursor,
            hasMore: data.hasMore,
            ...(data.total === undefined ? {} : { total: data.total }),
          });
        }
        return successEnvelope(data ?? null, requestId);
      }),
    );
  }
}
