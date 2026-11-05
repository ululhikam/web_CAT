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
  /** Durasi cache dalam milidetik (khusus GET). */
  cacheTtlMs?: number;
}

/** Basis relatif: browser memakai proxy/rewrite, SSR memakai origin sendiri. */
const BASE = '/api/v1';

let refreshPromise: Promise<string | null> | null = null;
let onTokenRefreshed: ((token: string) => void) | null = null;
let tokenGetter: (() => string | null) | null = null;
let restoreWaiter: (() => Promise<void>) | null = null;

// Cache in-memory dan deduplikasi in-flight untuk mempercepat load data
const inFlightRequests = new Map<string, Promise<unknown>>();
const memoryCache = new Map<string, { data: unknown; expiresAt: number }>();

export function apiClearCache(pathPrefix?: string): void {
  if (!pathPrefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(pathPrefix)) {
      memoryCache.delete(key);
    }
  }
}

export function setTokenRefreshListener(listener: ((token: string) => void) | null): void {
  onTokenRefreshed = listener;
}

export function setTokenGetter(getter: (() => string | null) | null): void {
  tokenGetter = getter;
}

export function setRestoreWaiter(waiter: (() => Promise<void>) | null): void {
  restoreWaiter = waiter;
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
  const method = options.method ?? 'GET';
  const isGet = method === 'GET';

  // Otomatis bersihkan cache bila melakukan mutasi
  if (!isGet) {
    apiClearCache();
  }

  // Selesaikan token otorisasi secara otomatis bila belum dipasok
  let token = options.token;
  if (token === undefined && tokenGetter) {
    token = tokenGetter();
    if (!token && restoreWaiter && !options.skipRefresh && typeof window !== 'undefined') {
      await restoreWaiter().catch(() => {});
      token = tokenGetter();
    }
  }

  const cacheKey = `${path}::${token ?? ''}`;
  const effectiveTtl = options.cacheTtlMs !== undefined ? options.cacheTtlMs : isGet ? 15000 : 0;

  // 1. Cek memory cache (Stale-While-Revalidate pattern)
  if (isGet && effectiveTtl > 0) {
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      const now = Date.now();
      // Jika data masih segar, langsung kembalikan (0ms latency)
      if (cached.expiresAt > now) {
        return cached.data as T;
      }
      // Jika data sedikit basi (< 60 detik kedaluwarsa), kembalikan data instan
      // dan jalankan revalidasi di latar belakang
      if (now - cached.expiresAt < 60000 && !inFlightRequests.has(cacheKey)) {
        void (async () => {
          try {
            const fresh = await executeRequest<T>(path, method, token, options);
            memoryCache.set(cacheKey, { data: fresh, expiresAt: Date.now() + effectiveTtl });
          } catch {
            // Abaikan kegagalan revalidasi di latar belakang
          }
        })();
        return cached.data as T;
      }
    }
  }

  // 2. Cek in-flight deduplication (cegah multiple request identik bersamaan)
  if (isGet && inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey) as Promise<T>;
  }

  const promise = executeRequest<T>(path, method, token, options).then((data) => {
    if (isGet && effectiveTtl > 0) {
      memoryCache.set(cacheKey, { data, expiresAt: Date.now() + effectiveTtl });
    }
    return data;
  });

  if (isGet) {
    inFlightRequests.set(cacheKey, promise);
    // Bersihkan dedup setelah selesai — baik sukses MAUPUN gagal. Memakai
    // `promise.finally()` di sini membuat promise turunan yang ditolak tanpa
    // penangan, sehingga kegagalan GET memunculkan unhandled rejection.
    const release = () => {
      inFlightRequests.delete(cacheKey);
    };
    void promise.then(release, release);
  }

  return promise;
}

async function executeRequest<T>(
  path: string,
  method: string,
  token: string | null | undefined,
  options: RequestOptions,
): Promise<T> {
  const doFetch = options.fetchImpl ?? fetch;
  const url = path.startsWith('http') ? path : `${BASE}${path}`;

  const send = (t: string | null | undefined) =>
    doFetch(url, {
      method,
      credentials: 'include',
      headers: {
        accept: 'application/json',
        ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(t ? { authorization: `Bearer ${t}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });

  let response = await send(token);

  if (response.status === 401 && !options.skipRefresh) {
    const fresh = await refreshAccessToken(doFetch);
    if (fresh) {
      response = await send(fresh);
    }
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

  // Endpoint berhalaman mengirim `data` sebagai array dan metadata pagination
  // di `meta` (lihat ResponseInterceptor API). Kembalikan bentuk `CursorPage`
  // agar pemanggil bisa memakai `items`, `nextCursor`, dan `hasMore`.
  if (
    Array.isArray(envelope.data) &&
    envelope.meta &&
    ('nextCursor' in envelope.meta || 'hasMore' in envelope.meta)
  ) {
    return {
      items: envelope.data,
      nextCursor: (envelope.meta.nextCursor as string | null | undefined) ?? null,
      hasMore: envelope.meta.hasMore === true,
      ...(typeof envelope.meta.total === 'number' ? { total: envelope.meta.total } : {}),
    } as T;
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
  apiClearCache();
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
