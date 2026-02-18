// Re-export from kernel types
export * from '../../apps/kernel/src/shared/types';

// Additional shared types
export enum AuditAction {
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  MEMBERSHIP_CREATED = 'MEMBERSHIP_CREATED',
  MEMBERSHIP_APPROVED = 'MEMBERSHIP_APPROVED',
  MEMBERSHIP_REJECTED = 'MEMBERSHIP_REJECTED',
  FUND_CREATED = 'FUND_CREATED',
  FUND_VERIFIED = 'FUND_VERIFIED',
  FUND_UPDATED = 'FUND_UPDATED',
  EMAIL_SENT = 'EMAIL_SENT',
  NEWS_PUBLISHED = 'NEWS_PUBLISHED',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  EMAIL_CONFIRMED = 'EMAIL_CONFIRMED',
  NEWS_MEMBER_ACTIVATED = 'NEWS_MEMBER_ACTIVATED',
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SearchFilters {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}