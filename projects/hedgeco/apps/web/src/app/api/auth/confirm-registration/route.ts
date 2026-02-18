import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    if (!token || !userId) {
      return NextResponse.redirect(
        new URL('/auth/error?error=Invalid confirmation link', request.url)
      );
    }

    // Find user with matching token
    const user = await prisma.user.findUnique({
      where: { 
        id: userId,
        emailVerificationToken: token,
        emailVerified: null, // Only if not already verified
      },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL('/auth/error?error=Invalid or expired confirmation link', request.url)
      );
    }

    // Update user as email verified
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        status: 'PENDING_APPROVAL', // Move to pending approval status
      },
    });

    // Log the confirmation
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EMAIL_CONFIRMED',
        entityType: 'USER',
        entityId: user.id,
        details: {
          email: user.email,
          role: user.role,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/auth/registration-confirmed', request.url)
    );
  } catch (error) {
    console.error('Registration confirmation error:', error);
    return NextResponse.redirect(
      new URL('/auth/error?error=Confirmation failed', request.url)
    );
  }
}