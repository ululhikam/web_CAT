import type { AuthUser } from '@webcat/contracts';

declare global {
  namespace App {
    interface Error {
      message: string;
      code?: string;
      requestId?: string;
    }

    interface Locals {
      user: AuthUser | null;
    }

    interface PageData {
      user?: AuthUser | null;
    }
  }
}

export {};
