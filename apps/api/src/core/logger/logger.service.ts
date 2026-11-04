import { Injectable } from '@nestjs/common';
import type { Logger } from 'pino';
import { getLogger } from './logger';

@Injectable()
export class LoggerService {
  private readonly logger: Logger = getLogger();

  child(bindings: Record<string, unknown>): Logger {
    return this.logger.child(bindings);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.logger.info(data ?? {}, message);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.logger.warn(data ?? {}, message);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.logger.error(data ?? {}, message);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.logger.debug(data ?? {}, message);
  }
}
