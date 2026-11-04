import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ZodError, type ZodSchema } from 'zod';

/**
 * Validasi request dengan Zod. Dipakai lewat `@Body(zodBody(schema))` atau
 * `@Query(zodQuery(schema))`; pesan error dipetakan ke field path.
 */
export function zodPipe<T>(schema: ZodSchema<T>) {
  return new ZodValidationPipe(schema);
}

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    try {
      return this.schema.parse(value ?? {});
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
