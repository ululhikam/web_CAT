export interface AppErrorOptions {
  /** Kode stabil dari packages/contracts (ERROR_CODES). */
  code: string;
  status?: number;
  message?: string;
  details?: unknown;
  /** Bila true, pesan aman ditampilkan ke klien. Default true. */
  expose?: boolean;
}

/**
 * Satu-satunya cara melempar error yang terstruktur. Filter global
 * mengubahnya menjadi envelope `{ success: false, error: { code, ... } }`.
 */
export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  readonly expose: boolean;

  constructor(options: AppErrorOptions) {
    super(options.message ?? options.code);
    this.name = 'AppError';
    this.code = options.code;
    this.status = options.status ?? 400;
    this.details = options.details;
    this.expose = options.expose ?? true;
  }
}
