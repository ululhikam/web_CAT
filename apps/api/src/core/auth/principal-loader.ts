import type { AuthPrincipal } from './auth.types';

/** Injection token — diimplementasikan oleh modul users (B1). */
export const PRINCIPAL_LOADER = Symbol('PRINCIPAL_LOADER');

export interface PrincipalLoader {
  /**
   * Memuat principal dari `sub` + `sid` + `ver`.
   * Mengembalikan null bila sesi dicabut, user suspended, atau token_version
   * tidak cocok (password direset / role berubah).
   */
  load(input: { sub: string; sid: string; ver: number }): Promise<AuthPrincipal | null>;
}
