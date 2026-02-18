// POST /api/auth/logout - Clear auth cookies and invalidate refresh token

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { clearAuthCookies, verifyRefreshToken } from '@/lib/auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    // If we have a refresh token, invalidate it in the database
    if (refreshToken) {
      const payload = await verifyRefreshToken(refreshToken);
      if (payload) {
        // Revoke all tokens in this family (security measure)
        await prisma.refreshToken.updateMany({
          where: {
            userId: payload.sub,
            tokenFamily: payload.tokenFamily,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
          },
        });
      }
    }

    // Clear cookies
    await clearAuthCookies();

    return NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    console.error('Logout error:', error);
    
    // Still clear cookies even if there was an error
    await clearAuthCookies();

    return NextResponse.json({
      success: true,
      data: { message: 'Logged out' },
    });
  }
}
