import type { AuthUser } from '@webcat/contracts';
import { apiRequest, ApiError, setTokenRefreshListener } from '$lib/api/client';

/**
 * Sesi peserta di sisi klien.
 *
 * Access token hanya disimpan di memori (tidak localStorage) untuk mengurangi
 * dampak XSS. Setelah reload halaman, `restore()` menukar cookie refresh
 * httpOnly menjadi access token baru.
 */
class SessionStore {
  user = $state<AuthUser | null>(null);
  accessToken = $state<string | null>(null);
  /** `true` selama percobaan pemulihan sesi pertama. */
  loading = $state(true);

  constructor() {
    setTokenRefreshListener((token) => {
      this.accessToken = token;
    });
  }

  get isAuthenticated(): boolean {
    return this.user !== null;
  }

  get isAdmin(): boolean {
    return this.user?.role === 'ADMIN' || this.user?.role === 'SUPER_ADMIN';
  }

  get isSuperAdmin(): boolean {
    return this.user?.role === 'SUPER_ADMIN';
  }

  can(permission: string): boolean {
    return this.user?.permissions?.includes(permission) ?? false;
  }

  /** Dipanggil sekali oleh layout. Tidak melempar: sesi tidak ada itu normal. */
  async restore(): Promise<void> {
    if (this.user) {
      this.loading = false;
      return;
    }

    try {
      const result = await apiRequest<{ accessToken: string; user: AuthUser }>('/auth/refresh', {
        method: 'POST',
        token: undefined,
        skipRefresh: true,
      });
      this.accessToken = result.accessToken;
      this.user = result.user;
    } catch (error) {
      // 401 berarti memang belum login; error lain juga tidak boleh
      // memblokir halaman publik.
      if (!(error instanceof ApiError)) throw error;
      this.user = null;
      this.accessToken = null;
    } finally {
      this.loading = false;
    }
  }

  async login(email: string, password: string): Promise<AuthUser> {
    const result = await apiRequest<{ accessToken: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: { email: email.trim().toLowerCase(), password },
      token: undefined,
      skipRefresh: true,
    });

    this.accessToken = result.accessToken;
    this.user = result.user;
    return result.user;
  }

  async logout(): Promise<void> {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
        token: this.accessToken,
        skipRefresh: true,
      });
    } finally {
      this.accessToken = null;
      this.user = null;
    }
  }
}

export const session = new SessionStore();
