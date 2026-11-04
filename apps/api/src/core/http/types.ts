export interface ResponseMeta extends Record<string, unknown> {
  requestId: string;
  timestamp: string;
  nextCursor?: string | null;
  hasMore?: boolean;
  total?: number;
}

export interface RequestWithContext {
  requestId: string;
  user?: {
    id: string;
    sessionId: string;
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
    permissions: string[];
    emailVerified: boolean;
    mustChangePassword: boolean;
  };
  ip?: string;
  userAgent?: string;
}
