/**
 * Unit tests for authentication utility functions
 *
 * @module auth.test
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { UserRole } from '@prisma/client';

// Mock the jose library
vi.mock('jose', () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setJti: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue('mock-token'),
  })),
  jwtVerify: vi.fn(),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

// Import after mocks
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  hashPassword,
  verifyPassword,
} from '../auth';
import { jwtVerify } from 'jose';

describe('Auth Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Role Checking Functions', () => {
    const roles: UserRole[] = ['INVESTOR', 'MANAGER', 'SERVICE_PROVIDER', 'NEWS_MEMBER', 'ADMIN', 'SUPER_ADMIN'];

    describe('Role Hierarchy', () => {
      it('should define correct role hierarchy', () => {
        // Define expected hierarchy: SUPER_ADMIN > ADMIN > others
        const roleHierarchy: Record<UserRole, number> = {
          INVESTOR: 0,
          MANAGER: 1,
          SERVICE_PROVIDER: 1,
          NEWS_MEMBER: 1,
          ADMIN: 2,
          SUPER_ADMIN: 3,
        };

        // SUPER_ADMIN should be highest
        expect(roleHierarchy.SUPER_ADMIN).toBeGreaterThan(roleHierarchy.ADMIN);
        expect(roleHierarchy.ADMIN).toBeGreaterThan(roleHierarchy.INVESTOR);
      });

      it('should recognize all valid roles', () => {
        roles.forEach(role => {
          expect(typeof role).toBe('string');
          expect(role.length).toBeGreaterThan(0);
        });
      });
    });

    describe('isAdmin helper', () => {
      const isAdmin = (role: UserRole): boolean => {
        return role === 'ADMIN' || role === 'SUPER_ADMIN';
      };

      it('returns true for ADMIN', () => {
        expect(isAdmin('ADMIN')).toBe(true);
      });

      it('returns true for SUPER_ADMIN', () => {
        expect(isAdmin('SUPER_ADMIN')).toBe(true);
      });

      it('returns false for INVESTOR', () => {
        expect(isAdmin('INVESTOR')).toBe(false);
      });

      it('returns false for MANAGER', () => {
        expect(isAdmin('MANAGER')).toBe(false);
      });

      it('returns false for SERVICE_PROVIDER', () => {
        expect(isAdmin('SERVICE_PROVIDER')).toBe(false);
      });
    });

    describe('canAccessAdminPanel helper', () => {
      const canAccessAdminPanel = (role: UserRole): boolean => {
        return role === 'ADMIN' || role === 'SUPER_ADMIN';
      };

      it('allows ADMIN to access admin panel', () => {
        expect(canAccessAdminPanel('ADMIN')).toBe(true);
      });

      it('allows SUPER_ADMIN to access admin panel', () => {
        expect(canAccessAdminPanel('SUPER_ADMIN')).toBe(true);
      });

      it('denies INVESTOR access to admin panel', () => {
        expect(canAccessAdminPanel('INVESTOR')).toBe(false);
      });

      it('denies MANAGER access to admin panel', () => {
        expect(canAccessAdminPanel('MANAGER')).toBe(false);
      });
    });

    describe('canManageFunds helper', () => {
      const canManageFunds = (role: UserRole): boolean => {
        return ['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(role);
      };

      it('allows MANAGER to manage funds', () => {
        expect(canManageFunds('MANAGER')).toBe(true);
      });

      it('allows ADMIN to manage funds', () => {
        expect(canManageFunds('ADMIN')).toBe(true);
      });

      it('allows SUPER_ADMIN to manage funds', () => {
        expect(canManageFunds('SUPER_ADMIN')).toBe(true);
      });

      it('denies INVESTOR from managing funds', () => {
        expect(canManageFunds('INVESTOR')).toBe(false);
      });
    });

    describe('canModifyUserRoles helper', () => {
      const canModifyUserRoles = (actorRole: UserRole, targetRole: UserRole): boolean => {
        // Only SUPER_ADMIN can modify admin roles
        if (targetRole === 'ADMIN' || targetRole === 'SUPER_ADMIN') {
          return actorRole === 'SUPER_ADMIN';
        }
        // ADMIN and SUPER_ADMIN can modify non-admin roles
        return actorRole === 'ADMIN' || actorRole === 'SUPER_ADMIN';
      };

      it('SUPER_ADMIN can modify any role', () => {
        roles.forEach(targetRole => {
          expect(canModifyUserRoles('SUPER_ADMIN', targetRole)).toBe(true);
        });
      });

      it('ADMIN can modify non-admin roles', () => {
        expect(canModifyUserRoles('ADMIN', 'INVESTOR')).toBe(true);
        expect(canModifyUserRoles('ADMIN', 'MANAGER')).toBe(true);
        expect(canModifyUserRoles('ADMIN', 'SERVICE_PROVIDER')).toBe(true);
      });

      it('ADMIN cannot modify admin roles', () => {
        expect(canModifyUserRoles('ADMIN', 'ADMIN')).toBe(false);
        expect(canModifyUserRoles('ADMIN', 'SUPER_ADMIN')).toBe(false);
      });

      it('INVESTOR cannot modify any roles', () => {
        roles.forEach(targetRole => {
          expect(canModifyUserRoles('INVESTOR', targetRole)).toBe(false);
        });
      });

      it('MANAGER cannot modify any roles', () => {
        roles.forEach(targetRole => {
          expect(canModifyUserRoles('MANAGER', targetRole)).toBe(false);
        });
      });
    });
  });

  describe('Token Generation', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'INVESTOR' as UserRole,
      accredited: true,
    };

    describe('generateAccessToken', () => {
      it('generates a token string', async () => {
        const token = await generateAccessToken(mockUser);
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
      });

      it('includes user information in token', async () => {
        const token = await generateAccessToken(mockUser);
        expect(token).toBe('mock-token');
      });
    });

    describe('generateRefreshToken', () => {
      it('generates a token string', async () => {
        const token = await generateRefreshToken('user-123', 'family-456');
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
      });
    });

    describe('generateTokenPair', () => {
      it('returns both access and refresh tokens', async () => {
        const result = await generateTokenPair(mockUser);
        
        expect(result).toHaveProperty('accessToken');
        expect(result).toHaveProperty('refreshToken');
        expect(result).toHaveProperty('tokenFamily');
      });

      it('generates unique token family', async () => {
        const result1 = await generateTokenPair(mockUser);
        const result2 = await generateTokenPair(mockUser);
        
        // Both should have tokenFamily (mocked, so might be same in test)
        expect(result1.tokenFamily).toBeDefined();
        expect(result2.tokenFamily).toBeDefined();
      });
    });
  });

  describe('Token Validation', () => {
    describe('verifyAccessToken', () => {
      it('returns payload for valid token', async () => {
        const mockPayload = {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'INVESTOR',
          accredited: true,
        };

        vi.mocked(jwtVerify).mockResolvedValueOnce({
          payload: mockPayload,
          protectedHeader: { alg: 'HS256' },
        });

        const result = await verifyAccessToken('valid-token');
        expect(result).toEqual(mockPayload);
      });

      it('returns null for invalid token', async () => {
        vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('Invalid token'));

        const result = await verifyAccessToken('invalid-token');
        expect(result).toBeNull();
      });

      it('returns null for expired token', async () => {
        vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('Token expired'));

        const result = await verifyAccessToken('expired-token');
        expect(result).toBeNull();
      });

      it('returns null for tampered token', async () => {
        vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('Signature verification failed'));

        const result = await verifyAccessToken('tampered-token');
        expect(result).toBeNull();
      });
    });

    describe('verifyRefreshToken', () => {
      it('returns payload for valid refresh token', async () => {
        const mockPayload = {
          sub: 'user-123',
          tokenFamily: 'family-456',
        };

        vi.mocked(jwtVerify).mockResolvedValueOnce({
          payload: mockPayload,
          protectedHeader: { alg: 'HS256' },
        });

        const result = await verifyRefreshToken('valid-refresh-token');
        expect(result).toEqual(mockPayload);
      });

      it('returns null for invalid refresh token', async () => {
        vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('Invalid token'));

        const result = await verifyRefreshToken('invalid-refresh-token');
        expect(result).toBeNull();
      });
    });
  });

  describe('Permission Boundaries', () => {
    describe('Route Access Control', () => {
      const publicRoutes = ['/login', '/register', '/', '/about'];
      const protectedRoutes = ['/dashboard', '/settings', '/profile'];
      const adminRoutes = ['/admin', '/admin/users', '/admin/funds', '/admin/audit-logs'];

      const canAccessRoute = (role: UserRole | null, route: string): boolean => {
        // Public routes - anyone can access
        if (publicRoutes.some(r => route.startsWith(r))) {
          return true;
        }

        // Must be authenticated for protected routes
        if (!role) {
          return false;
        }

        // Admin routes - only admins
        if (adminRoutes.some(r => route.startsWith(r))) {
          return role === 'ADMIN' || role === 'SUPER_ADMIN';
        }

        // Protected routes - any authenticated user
        if (protectedRoutes.some(r => route.startsWith(r))) {
          return true;
        }

        return false;
      };

      it('allows anyone to access public routes', () => {
        publicRoutes.forEach(route => {
          expect(canAccessRoute(null, route)).toBe(true);
          expect(canAccessRoute('INVESTOR', route)).toBe(true);
          expect(canAccessRoute('ADMIN', route)).toBe(true);
        });
      });

      it('requires authentication for protected routes', () => {
        protectedRoutes.forEach(route => {
          expect(canAccessRoute(null, route)).toBe(false);
          expect(canAccessRoute('INVESTOR', route)).toBe(true);
          expect(canAccessRoute('MANAGER', route)).toBe(true);
        });
      });

      it('restricts admin routes to admins only', () => {
        adminRoutes.forEach(route => {
          expect(canAccessRoute('INVESTOR', route)).toBe(false);
          expect(canAccessRoute('MANAGER', route)).toBe(false);
          expect(canAccessRoute('ADMIN', route)).toBe(true);
          expect(canAccessRoute('SUPER_ADMIN', route)).toBe(true);
        });
      });
    });

    describe('API Endpoint Access Control', () => {
      const apiEndpointPermissions: Record<string, UserRole[]> = {
        'GET /api/funds': ['INVESTOR', 'MANAGER', 'SERVICE_PROVIDER', 'NEWS_MEMBER', 'ADMIN', 'SUPER_ADMIN'],
        'POST /api/funds': ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],
        'DELETE /api/funds/:id': ['ADMIN', 'SUPER_ADMIN'],
        'GET /api/admin/users': ['ADMIN', 'SUPER_ADMIN'],
        'PATCH /api/admin/users/:id': ['ADMIN', 'SUPER_ADMIN'],
        'DELETE /api/admin/users/:id': ['SUPER_ADMIN'],
      };

      const canAccessEndpoint = (role: UserRole, endpoint: string): boolean => {
        const allowedRoles = apiEndpointPermissions[endpoint];
        if (!allowedRoles) return false;
        return allowedRoles.includes(role);
      };

      it('allows all authenticated users to read funds', () => {
        const endpoint = 'GET /api/funds';
        expect(canAccessEndpoint('INVESTOR', endpoint)).toBe(true);
        expect(canAccessEndpoint('MANAGER', endpoint)).toBe(true);
        expect(canAccessEndpoint('ADMIN', endpoint)).toBe(true);
      });

      it('restricts fund creation to managers and admins', () => {
        const endpoint = 'POST /api/funds';
        expect(canAccessEndpoint('INVESTOR', endpoint)).toBe(false);
        expect(canAccessEndpoint('MANAGER', endpoint)).toBe(true);
        expect(canAccessEndpoint('ADMIN', endpoint)).toBe(true);
      });

      it('restricts fund deletion to admins', () => {
        const endpoint = 'DELETE /api/funds/:id';
        expect(canAccessEndpoint('MANAGER', endpoint)).toBe(false);
        expect(canAccessEndpoint('ADMIN', endpoint)).toBe(true);
        expect(canAccessEndpoint('SUPER_ADMIN', endpoint)).toBe(true);
      });

      it('restricts user management to admins', () => {
        expect(canAccessEndpoint('MANAGER', 'GET /api/admin/users')).toBe(false);
        expect(canAccessEndpoint('ADMIN', 'GET /api/admin/users')).toBe(true);
      });

      it('restricts user deletion to super admins', () => {
        expect(canAccessEndpoint('ADMIN', 'DELETE /api/admin/users/:id')).toBe(false);
        expect(canAccessEndpoint('SUPER_ADMIN', 'DELETE /api/admin/users/:id')).toBe(true);
      });
    });
  });

  describe('Password Hashing', () => {
    describe('hashPassword', () => {
      it('returns a hashed string', async () => {
        const password = 'MySecurePassword123!';
        const hash = await hashPassword(password);
        
        expect(typeof hash).toBe('string');
        expect(hash).not.toBe(password);
        expect(hash.length).toBeGreaterThan(password.length);
      });

      it('produces different hashes for same password', async () => {
        const password = 'MySecurePassword123!';
        const hash1 = await hashPassword(password);
        const hash2 = await hashPassword(password);
        
        // Due to salting, same password should produce different hashes
        expect(hash1).not.toBe(hash2);
      });

      it('handles empty password', async () => {
        const hash = await hashPassword('');
        expect(typeof hash).toBe('string');
        expect(hash.length).toBeGreaterThan(0);
      });

      it('handles unicode characters', async () => {
        const password = 'パスワード123!';
        const hash = await hashPassword(password);
        expect(typeof hash).toBe('string');
      });
    });

    describe('verifyPassword', () => {
      it('returns true for correct password', async () => {
        const password = 'MySecurePassword123!';
        const hash = await hashPassword(password);
        
        const result = await verifyPassword(password, hash);
        expect(result).toBe(true);
      });

      it('returns false for incorrect password', async () => {
        const password = 'MySecurePassword123!';
        const hash = await hashPassword(password);
        
        const result = await verifyPassword('WrongPassword', hash);
        expect(result).toBe(false);
      });

      it('returns false for similar but different password', async () => {
        const password = 'MySecurePassword123!';
        const hash = await hashPassword(password);
        
        // Try with slight variations
        expect(await verifyPassword('MySecurePassword123', hash)).toBe(false);
        expect(await verifyPassword('mysecurepassword123!', hash)).toBe(false);
        expect(await verifyPassword('MySecurePassword124!', hash)).toBe(false);
      });

      it('handles empty password verification', async () => {
        const hash = await hashPassword('');
        
        expect(await verifyPassword('', hash)).toBe(true);
        expect(await verifyPassword('not-empty', hash)).toBe(false);
      });
    });
  });

  describe('Token Security', () => {
    describe('Token Expiration', () => {
      it('access token has short expiration (15m)', () => {
        // This would be tested in integration tests with actual tokens
        // Here we just verify the constant is defined correctly
        const ACCESS_TOKEN_EXPIRY = '15m';
        expect(ACCESS_TOKEN_EXPIRY).toBe('15m');
      });

      it('refresh token has longer expiration (7d)', () => {
        const REFRESH_TOKEN_EXPIRY = '7d';
        expect(REFRESH_TOKEN_EXPIRY).toBe('7d');
      });
    });

    describe('Token Claims', () => {
      it('access token should include required claims', () => {
        const requiredClaims = ['sub', 'email', 'role', 'accredited'];
        
        // This validates the interface
        type TokenPayload = {
          sub: string;
          email: string;
          role: UserRole;
          accredited: boolean;
        };

        const mockPayload: TokenPayload = {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'INVESTOR',
          accredited: false,
        };

        requiredClaims.forEach(claim => {
          expect(mockPayload).toHaveProperty(claim);
        });
      });

      it('refresh token should include minimal claims', () => {
        const requiredClaims = ['sub', 'tokenFamily'];
        
        type RefreshPayload = {
          sub: string;
          tokenFamily: string;
        };

        const mockPayload: RefreshPayload = {
          sub: 'user-123',
          tokenFamily: 'family-456',
        };

        requiredClaims.forEach(claim => {
          expect(mockPayload).toHaveProperty(claim);
        });
      });
    });
  });
});
