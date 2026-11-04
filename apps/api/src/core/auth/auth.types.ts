import type { Permission, Role } from '@webcat/contracts';

export interface AuthPrincipal {
  id: string;
  sessionId: string;
  role: Role;
  permissions: Permission[];
  emailVerified: boolean;
  mustChangePassword: boolean;
}

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  role: Role;
  ver: number;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Express.Request {
  user?: AuthPrincipal;
  requestId?: string;
}
