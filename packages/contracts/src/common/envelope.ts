import type { ErrorCode } from './error-codes';

/** Meta pagination. `nextCursor` null berarti sudah halaman terakhir. */
export interface PageMeta {
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

export interface ResponseMeta extends Partial<PageMeta> {
  requestId: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface ApiErrorBody {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
  error: null;
  requestId: string;
}

export interface ApiFailure {
  success: false;
  data: null;
  meta: ResponseMeta;
  error: ApiErrorBody;
  requestId: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function isApiSuccess<T>(res: ApiResponse<T>): res is ApiSuccess<T> {
  return res.success === true;
}
