// POST /api/auth/login - Authenticate user and return tokens

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateTokenPair, setAuthCookies } from '@/lib/auth';
import { z } from 'zod';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid input',
            details: result.error.flatten().fieldErrors,
          } 
        },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_CREDENTIALS', 
            message: 'Invalid email or password' 
          } 
        },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (user.locked) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'ACCOUNT_LOCKED', 
            message: 'Your account has been locked. Please contact support.' 
          } 
        },
        { status: 403 }
      );
    }

    // Check if account is active
    if (!user.active) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'ACCOUNT_INACTIVE', 
            message: 'Your account is inactive. Please contact support.' 
          } 
        },
        { status: 403 }
      );
    }

    // Note: We allow login even if accreditedStatus is PENDING or REJECTED
    // Users can access the platform but will see limited fund data until approved
    
    // Check if user has a password (OAuth users won't)
    if (!user.passwordHash) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'OAUTH_USER', 
            message: 'This account uses Google sign-in. Please use the "Sign in with Google" button.' 
          } 
        },
        { status: 400 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_CREDENTIALS', 
            message: 'Invalid email or password' 
          } 
        },
        { status: 401 }
      );
    }

    // Generate tokens
    const tokens = await generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
      accredited: user.profile?.accredited || false,
    });

    // Set cookies
    await setAuthCookies(tokens.accessToken, tokens.refreshToken);

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: tokens.refreshToken.slice(-32),
        tokenFamily: tokens.tokenFamily,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: !!user.emailVerified,
          accreditedStatus: user.accreditedStatus,
          profile: {
            firstName: user.profile?.firstName,
            lastName: user.profile?.lastName,
            company: user.profile?.company,
          },
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'An error occurred during login' 
        } 
      },
      { status: 500 }
    );
  }
}
