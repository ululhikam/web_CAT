import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ZodError, type ZodTypeAny, type z } from 'zod';

/**
 * Validasi request dengan Zod. Dipakai lewat `@Body(zodBody(schema))` atau
 * `@Query(zodQuery(schema))`; pesan error dipetakan ke field path.
 *
 * Generic mengikuti tipe skema (bukan hanya output) agar skema dengan
 * `default`/`transform` — yang tipe input dan output-nya berbeda — tetap
 * diterima.
 */
export function zodPipe<S extends ZodTypeAny>(schema: S) {
  return new ZodValidationPipe<z.infer<S>>(schema);
}

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodTypeAny) {}

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    try {
      return this.schema.parse(value ?? {}) as T;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new UnprocessableEntityException({
          code: 'COMMON_VALIDATION_FAILED',
          message: 'Data yang dikirim tidak valid',
          details: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      throw error;
    }
  }
}
