import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { failureEnvelope } from './envelope';
import { AppError } from './app-error';

/**
 * Semua error keluar dalam bentuk envelope yang sama. Error tak terduga
 * TIDAK membocorkan stack trace atau pesan internal.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { requestId?: string }>();
    const requestId = req.requestId ?? 'unknown';

    if (exception instanceof AppError) {
      res
        .status(exception.status)
        .json(
          failureEnvelope(
            exception.code,
            exception.expose ? exception.message : 'Terjadi kesalahan',
            requestId,
            exception.details,
          ),
        );
      return;
    }

    if (exception instanceof ZodError) {
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(
        failureEnvelope('COMMON_VALIDATION_FAILED', 'Data yang dikirim tidak valid', requestId, {
          issues: exception.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        }),
      );
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const record = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
      const code =
        typeof record.code === 'string'
          ? record.code
          : this.statusToCode(status);
      const message =
        typeof record.message === 'string'
          ? record.message
          : Array.isArray(record.message)
            ? (record.message as string[]).join('; ')
            : exception.message;

      if (status >= 500) {
        this.logger.error(`[${requestId}] ${message}`, exception.stack);
      }

      res
        .status(status)
        .json(failureEnvelope(code, message, requestId, record.details));
      return;
    }

    this.logger.error(
      `[${requestId}] Unhandled exception`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(
        failureEnvelope(
          'COMMON_INTERNAL_ERROR',
          'Terjadi kesalahan pada server. Silakan coba lagi.',
          requestId,
        ),
      );
  }

  private statusToCode(status: number): string {
    switch (status) {
      case 400:
        return 'COMMON_BAD_REQUEST';
      case 401:
        return 'COMMON_UNAUTHORIZED';
      case 403:
        return 'COMMON_FORBIDDEN';
      case 404:
        return 'COMMON_NOT_FOUND';
      case 409:
        return 'COMMON_CONFLICT';
      case 422:
        return 'COMMON_VALIDATION_FAILED';
      case 429:
        return 'COMMON_RATE_LIMITED';
      case 501:
        return 'COMMON_NOT_IMPLEMENTED';
      case 503:
        return 'COMMON_MAINTENANCE';
      default:
        return status >= 500 ? 'COMMON_INTERNAL_ERROR' : 'COMMON_BAD_REQUEST';
    }
  }
}
