// GET /api/auth/verify-email - Verify user's email address
// POST /api/auth/verify-email - Resend verification email

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail, sendAdminNewUserNotification } from '@/lib/email';
import crypto from 'crypto';

/**
 * GET - Verify email with token (clicked from email link)
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/register/pending?error=missing_token', request.url)
      );
    }

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL('/register/pending?error=invalid_token', request.url)
      );
    }

    // Check if token is expired
    if (verificationToken.expiresAt < new Date()) {
      return NextResponse.redirect(
        new URL('/register/pending?error=expired_token', request.url)
      );
    }

    // Check if token was already used
    if (verificationToken.usedAt) {
      return NextResponse.redirect(
        new URL('/register/pending?error=already_used', request.url)
      );
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: verificationToken.userId },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL('/register/pending?error=user_not_found', request.url)
      );
    }

    // Mark email as verified
    await prisma.$transaction([
      // Update user's emailVerified
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      }),
      // Mark token as used
      prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
      // Create a notification for the user
      prisma.notification.create({
        data: {
          userId: user.id,
          type: 'SYSTEM',
          title: 'Email Verified',
          message: 'Your email has been verified. An admin will review your account shortly.',
        },
      }),
    ]);

    // Notify admin users about the new verified user
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        active: true,
      },
      select: { id: true, email: true },
    });

    const userName = user.profile 
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : user.email;

    // Send email notification to all admins
    for (const admin of admins) {
      await sendAdminNewUserNotification(admin.email, {
        id: user.id,
        email: user.email,
        name: userName,
        role: user.role,
        company: user.profile?.company || undefined,
      });
    }

    // Also create in-app notifications for admins
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'SYSTEM' as const,
          title: 'New User Needs Review',
          message: `${userName} (${user.role}) has verified their email and needs accredited status review.`,
          link: `/admin/users/${user.id}`,
        })),
      });
    }

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/register/pending?step=accredited&verified=true', request.url)
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(
      new URL('/register/pending?error=verification_failed', request.url)
    );
  }
}

/**
 * POST - Resend verification email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: { message: 'Email is required' } },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a verification link will be sent.',
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Your email is already verified.',
      });
    }

    // Invalidate any existing tokens
    await prisma.verificationToken.updateMany({
      where: {
        userId: user.id,
        type: 'EMAIL',
        usedAt: null,
      },
      data: { usedAt: new Date() }, // Mark as used to invalidate
    });

    // Create new verification token
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: 'EMAIL',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send verification email
    const userName = user.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : user.email;

    await sendVerificationEmail(
      { email: user.email, name: userName },
      token
    );

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to send verification email' } },
      { status: 500 }
    );
  }
}
