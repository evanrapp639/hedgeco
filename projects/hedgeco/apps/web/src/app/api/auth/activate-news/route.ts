import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    if (!token || !userId) {
      return NextResponse.redirect(
        new URL('/auth/error?error=Invalid activation link', request.url)
      );
    }

    // Find user with matching token (news members only)
    const user = await prisma.user.findUnique({
      where: { 
        id: userId,
        emailVerificationToken: token,
        role: 'NEWS_MEMBER',
        emailVerified: null, // Only if not already verified
      },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL('/auth/error?error=Invalid or expired activation link', request.url)
      );
    }

    // Update user as email verified and active (news members don't need approval)
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        status: 'ACTIVE', // News members are active immediately
      },
    });

    // Log the activation
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'NEWS_MEMBER_ACTIVATED',
        entityType: 'USER',
        entityId: user.id,
        details: {
          email: user.email,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/auth/news-activated', request.url)
    );
  } catch (error) {
    console.error('News activation error:', error);
    return NextResponse.redirect(
      new URL('/auth/error?error=Activation failed', request.url)
    );
  }
}