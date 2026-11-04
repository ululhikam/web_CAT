import { ApiError, type ApiEnvelope } from '$lib/api/client';

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Membaca endpoint berpaginasi tanpa membuang `meta`.
 *
 * `apiRequest` sengaja hanya mengembalikan `data`; halaman riwayat butuh
 * `nextCursor` untuk "muat lebih banyak".
 */
export async function apiPage<T>(path: string, token: string | null): Promise<Page<T>> {
  const response = await fetch(`/api/v1${path}`, {
    credentials: 'include',
    headers: {
      accept: 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });

  const envelope = (await response.json().catch(() => null)) as ApiEnvelope<T[]> | null;

  if (!response.ok || !envelope || envelope.success !== true) {
    throw new ApiError(
      response.status,
      envelope?.error?.code ?? 'COMMON_INTERNAL_ERROR',
      envelope?.error?.message ?? `Permintaan gagal (HTTP ${response.status}).`,
      envelope?.error?.details,
    );
  }

  return {
    items: envelope.data ?? [],
    nextCursor: (envelope.meta?.nextCursor as string | null | undefined) ?? null,
    hasMore: envelope.meta?.hasMore === true,
  };
}
