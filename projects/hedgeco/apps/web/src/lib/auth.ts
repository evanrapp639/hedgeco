// Authentication utilities
// JWT token generation and verification using jose

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { UserRole } from '@prisma/client';

// Environment variables (with defaults for development)
const ACCESS_TOKEN_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-production'
);
const REFRESH_TOKEN_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production'
);

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface AccessTokenPayload extends JWTPayload {
  sub: string;       // User ID
  email: string;
  role: UserRole;
  accredited: boolean;
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string;       // User ID
  tokenFamily: string;
}

/**
 * Generate an access token for a user
 */
export async function generateAccessToken(user: {
  id: string;
  email: string;
  role: UserRole;
  accredited?: boolean;
}): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    accredited: user.accredited || false,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setJti(crypto.randomUUID())
    .sign(ACCESS_TOKEN_SECRET);
}

/**
 * Generate a refresh token for a user
 */
export async function generateRefreshToken(
  userId: string,
  tokenFamily: string
): Promise<string> {
  return new SignJWT({
    sub: userId,
    tokenFamily,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setJti(crypto.randomUUID())
    .sign(REFRESH_TOKEN_SECRET);
}

/**
 * Generate both access and refresh tokens
 */
export async function generateTokenPair(user: {
  id: string;
  email: string;
  role: UserRole;
  accredited?: boolean;
}): Promise<{ accessToken: string; refreshToken: string; tokenFamily: string }> {
  const tokenFamily = crypto.randomUUID();
  
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(user),
    generateRefreshToken(user.id, tokenFamily),
  ]);

  return { accessToken, refreshToken, tokenFamily };
}

/**
 * Verify an access token and return its payload
 */
export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET);
    return payload as AccessTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Verify a refresh token and return its payload
 */
export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_TOKEN_SECRET);
    return payload as RefreshTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Set auth cookies after login
 */
export async function setAuthCookies(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const cookieStore = await cookies();
  
  // Access token - short-lived, httpOnly
  cookieStore.set('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
    path: '/',
  });

  // Refresh token - longer-lived, httpOnly, restricted path
  cookieStore.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/api/auth', // Only sent to auth endpoints
  });
}

/**
 * Clear auth cookies on logout
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
}

/**
 * Get the current user from cookies (server-side)
 */
export async function getCurrentUser(): Promise<AccessTokenPayload | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  
  if (!accessToken) {
    return null;
  }

  return verifyAccessToken(accessToken);
}

/**
 * Hash a password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}
