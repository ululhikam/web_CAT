import type { ResponseMeta } from './types';

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
  error: null;
  requestId: string;
}

export interface FailureEnvelope {
  success: false;
  data: null;
  meta: ResponseMeta;
  error: { code: string; message: string; details?: unknown };
  requestId: string;
}

export function successEnvelope<T>(
  data: T,
  requestId: string,
  meta: Partial<ResponseMeta> = {},
): SuccessEnvelope<T> {
  return {
    success: true,
    data,
    meta: { requestId, timestamp: new Date().toISOString(), ...meta },
    error: null,
    requestId,
  };
}

export function failureEnvelope(
  code: string,
  message: string,
  requestId: string,
  details?: unknown,
  meta: Partial<ResponseMeta> = {},
): FailureEnvelope {
  return {
    success: false,
    data: null,
    meta: { requestId, timestamp: new Date().toISOString(), ...meta },
    error: { code, message, ...(details === undefined ? {} : { details }) },
    requestId,
  };
}
