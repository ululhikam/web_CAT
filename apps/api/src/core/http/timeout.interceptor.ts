import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, timeout } from 'rxjs';

/**
 * Guard terhadap handler yang menggantung. Default 15 detik; endpoint import
 * dokumen boleh menaikkan lewat @Timeout(ms).
 */
export const DEFAULT_TIMEOUT_MS = 15_000;

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly ms: number = DEFAULT_TIMEOUT_MS) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout({ each: this.ms, with: () => throwError(() => new RequestTimeoutException('Request melebihi batas waktu')) }),
    );
  }
}
