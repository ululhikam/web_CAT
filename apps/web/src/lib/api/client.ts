/**
 * Klien API tunggal untuk web.
 *
 * Aturan yang tidak boleh dilanggar:
 *  - Klien TIDAK pernah mengirim nominal harga; hanya `planCode`.
 *  - Access token hanya di memori (bukan cookie/localStorage).
 *  - Semua respons memakai envelope; kegagalan dilempar sebagai `ApiError`.
 *  - Pada 401, coba satu kali refresh (cookie httpOnly) lalu ulangi request.
 */

export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  meta?: (Record<string, unknown> & { total?: number; nextCursor?: string | null }) | null;
  error?: { code: string; message: string; details?: unknown } | null;
  requestId?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** `undefined` = jangan kirim header Authorization. */
  token?: string | null;
  /** Wajib pada SSR: pakai `event.fetch` agar cookie pengguna ikut terkirim. */
  fetchImpl?: typeof fetch;
  /** Cegah loop refresh untuk endpoint /auth/*. */
  skipRefresh?: boolean;
  signal?: AbortSignal;
}

/** Basis relatif: browser memakai proxy/rewrite, SSR memakai origin sendiri. */
const BASE = '/api/v1';

let refreshPromise: Promise<string | null> | null = null;
let onTokenRefreshed: ((token: string) => void) | null = null;

export function setTokenRefreshListener(listener: ((token: string) => void) | null): void {
  onTokenRefreshed = listener;
}

async function refreshAccessToken(doFetch: typeof fetch): Promise<string | null> {
  refreshPromise ??= (async () => {
    try {
      const response = await doFetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { accept: 'application/json' },
      });

      if (!response.ok) return null;

      const payload = (await response.json()) as ApiEnvelope<{ accessToken: string }>;
      const token = payload.data?.accessToken ?? null;
      if (token) onTokenRefreshed?.(token);
      return token;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const doFetch = options.fetchImpl ?? fetch;
  const url = path.startsWith('http') ? path : `${BASE}${path}`;

  const send = (token: string | null) =>
    doFetch(url, {
      method: options.method ?? 'GET',
      credentials: 'include',
      headers: {
        accept: 'application/json',
        ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });

  let response = await send(options.token ?? null);

  if (response.status === 401 && !options.skipRefresh && options.token) {
    const fresh = await refreshAccessToken(doFetch);
    if (fresh) response = await send(fresh);
  }

  const text = await response.text();
  let envelope: ApiEnvelope<T> | null = null;

  if (text) {
    try {
      envelope = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      throw new ApiError(response.status, 'COMMON_INVALID_RESPONSE', 'Respons server tidak valid.');
    }
  }

  if (!response.ok || !envelope || envelope.success !== true) {
    const body = envelope?.error;
    throw new ApiError(
      response.status,
      body?.code ?? 'COMMON_INTERNAL_ERROR',
      body?.message ?? `Permintaan gagal (HTTP ${response.status}).`,
      body?.details,
    );
  }

  return envelope.data as T;
}

/**
 * Kirim `FormData` (multipart) ke API.
 *
 * Dipakai unggah media dan impor soal. `content-type` sengaja tidak diisi agar
 * browser menambahkan boundary sendiri.
 */
export async function apiUpload<T>(
  path: string,
  form: FormData,
  options: Omit<RequestOptions, 'body'> = {},
): Promise<T> {
  const doFetch = options.fetchImpl ?? fetch;
  const url = path.startsWith('http') ? path : `${BASE}${path}`;

  const send = (token: string | null) =>
    doFetch(url, {
      method: options.method ?? 'POST',
      credentials: 'include',
      headers: {
        accept: 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: form,
      signal: options.signal,
    });

  let response = await send(options.token ?? null);
  if (response.status === 401 && !options.skipRefresh && options.token) {
    const fresh = await refreshAccessToken(doFetch);
    if (fresh) response = await send(fresh);
  }

  const text = await response.text();
  let envelope: ApiEnvelope<T> | null = null;
  if (text) {
    try {
      envelope = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      throw new ApiError(response.status, 'COMMON_INVALID_RESPONSE', 'Respons server tidak valid.');
    }
  }

  if (!response.ok || !envelope || envelope.success !== true) {
    const body = envelope?.error;
    throw new ApiError(
      response.status,
      body?.code ?? 'COMMON_INTERNAL_ERROR',
      body?.message ?? `Permintaan gagal (HTTP ${response.status}).`,
      body?.details,
    );
  }

  return envelope.data as T;
}

/**
 * Unduh berkas biner (template XLSX, laporan error CSV, konten media).
 *
 * Endpoint biner tidak memakai envelope, jadi kegagalan tetap dipetakan ke
 * `ApiError` bila server mengembalikan JSON.
 */
export async function apiDownload(
  path: string,
  options: Omit<RequestOptions, 'body'> = {},
): Promise<{ blob: Blob; filename: string | null }> {
  const doFetch = options.fetchImpl ?? fetch;
  const url = path.startsWith('http') ? path : `${BASE}${path}`;

  const send = (token: string | null) =>
    doFetch(url, {
      method: options.method ?? 'GET',
      credentials: 'include',
      headers: {
        accept: '*/*',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      signal: options.signal,
    });

  let response = await send(options.token ?? null);
  if (response.status === 401 && !options.skipRefresh && options.token) {
    const fresh = await refreshAccessToken(doFetch);
    if (fresh) response = await send(fresh);
  }

  if (!response.ok) {
    const text = await response.text();
    let message = `Unduhan gagal (HTTP ${response.status}).`;
    let code = 'COMMON_INTERNAL_ERROR';
    try {
      const envelope = JSON.parse(text) as ApiEnvelope<unknown>;
      message = envelope.error?.message ?? message;
      code = envelope.error?.code ?? code;
    } catch {
      // bukan JSON: pakai pesan umum
    }
    throw new ApiError(response.status, code, message);
  }

  return {
    blob: await response.blob(),
    filename: filenameFromDisposition(response.headers.get('content-disposition')),
  };
}

function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/** Simpan blob ke disk lewat elemen `<a>` sementara. */
export function saveBlob(blob: Blob, filename: string): void {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Pesan siap tampil untuk pengguna; tidak pernah membocorkan detail internal. */
export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Terjadi kesalahan. Coba lagi.';
}
