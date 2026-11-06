import type { AuthUser } from '@webcat/contracts';
import {
  apiRequest,
  ApiError,
  setTokenRefreshListener,
  setTokenGetter,
  setRestoreWaiter,
} from '$lib/api/client';

const USER_CACHE_KEY = 'webcat_cached_user';

function readCachedUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function writeCachedUser(user: AuthUser | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(USER_CACHE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

function parseJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    const parsed = JSON.parse(json) as { exp?: number };
    return typeof parsed.exp === 'number' ? parsed.exp : null;
  } catch {
    return null;
  }
}

/**
 * Sesi peserta di sisi klien.
 *
 * Dioptimalkan untuk kecepatan pemuatan:
 *  - Profil pengguna di-cache di sessionStorage untuk render instan (0ms delay).
 *  - Access token tetap hanya disimpan di memori untuk keamanan XSS.
 *  - Pemanggilan restore() dideduplikasi sehingga tidak terjadi double-request.
 *  - Proactive background refresh memperbarui access token sebelum kedaluwarsa.
 */
class SessionStore {
  user = $state<AuthUser | null>(readCachedUser());
  accessToken = $state<string | null>(null);
  /** `true` selama percobaan pemulihan sesi pertama jika belum ada cache. */
  loading = $state(!readCachedUser());

  private restorePromise: Promise<void> | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    setTokenRefreshListener((token) => {
      this.accessToken = token;
      this.scheduleProactiveRefresh(token);
    });
    setTokenGetter(() => this.accessToken);
    setRestoreWaiter(() => this.restore());
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
    if (this.isSuperAdmin) return true;
    return this.user?.permissions?.includes(permission) ?? false;
  }

  /**
   * Memulihkan sesi pengguna.
   * Dideduplikasi sehingga bila layout dan page memanggil bersamaan, hanya 1 request yang berjalan.
   */
  async restore(): Promise<void> {
    if (this.accessToken && this.user) {
      this.loading = false;
      return;
    }

    if (this.restorePromise) {
      return this.restorePromise;
    }

    this.restorePromise = (async () => {
      try {
        const result = await apiRequest<{ accessToken: string; user: AuthUser }>('/auth/refresh', {
          method: 'POST',
          token: undefined,
          skipRefresh: true,
        });
        this.applyAuth(result);
      } catch (error) {
        if (error instanceof ApiError) {
          // Hanya hapus sesi bila token benar-benar ditolak oleh server (401).
          // Error 500/502/network tidak boleh membatalkan sesi pengguna secara prematur.
          if (error.status === 401) {
            this.clearSession();
          }
        }
      } finally {
        this.loading = false;
        this.restorePromise = null;
      }
    })();

    return this.restorePromise;
  }

  async login(email: string, password: string): Promise<AuthUser> {
    const result = await apiRequest<{ accessToken: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: { email: email.trim().toLowerCase(), password },
      token: undefined,
      skipRefresh: true,
    });

    this.applyAuth(result);
    return result.user;
  }

  /**
   * Aktivasi undangan sekaligus menerapkan sesi login yang dibuat API.
   * User hanya perlu membuat password; refresh cookie sudah dipasang respons.
   */
  async activateInvite(token: string, password: string): Promise<AuthUser> {
    const result = await apiRequest<{ accessToken: string; user: AuthUser }>(
      '/auth/activate-invite',
      {
        method: 'POST',
        body: { token, password },
        token: undefined,
        skipRefresh: true,
      },
    );

    this.applyAuth(result);
    return result.user;
  }

  private applyAuth(result: { accessToken: string; user: AuthUser }): void {
    this.accessToken = result.accessToken;
    this.user = result.user;
    writeCachedUser(result.user);
    this.scheduleProactiveRefresh(result.accessToken);
  }

  private clearSession(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.user = null;
    this.accessToken = null;
    writeCachedUser(null);
  }

  private scheduleProactiveRefresh(token: string): void {
    if (typeof window === 'undefined') return;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    const exp = parseJwtExp(token);
    let delayMs = 10 * 60 * 1000; // fallback 10 menit
    if (exp) {
      const expMs = exp * 1000;
      // Perbarui 2 menit sebelum token kedaluwarsa (minimal 10 detik dari sekarang)
      delayMs = Math.max(10_000, expMs - Date.now() - 2 * 60 * 1000);
    }

    this.refreshTimer = setTimeout(() => {
      void this.refreshSilently();
    }, delayMs);
  }

  private async refreshSilently(): Promise<void> {
    if (typeof window === 'undefined' || !this.user) return;
    try {
      const result = await apiRequest<{ accessToken: string; user: AuthUser }>('/auth/refresh', {
        method: 'POST',
        token: undefined,
        skipRefresh: true,
      });
      this.applyAuth(result);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        this.clearSession();
      }
    }
  }

  async logout(): Promise<void> {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
        token: this.accessToken,
        skipRefresh: true,
      });
    } finally {
      this.clearSession();
    }
  }
}

export const session = new SessionStore();
