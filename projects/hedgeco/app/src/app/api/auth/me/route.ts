// GET /api/auth/me - Get current authenticated user

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    // Get user from token
    const tokenPayload = await getCurrentUser();

    if (!tokenPayload) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'AUTH_REQUIRED', 
            message: 'Not authenticated' 
          } 
        },
        { status: 401 }
      );
    }

    // Fetch full user data from database
    const user = await prisma.user.findUnique({
      where: { id: tokenPayload.sub },
      include: {
        profile: true,
        serviceProvider: {
          select: {
            id: true,
            companyName: true,
            slug: true,
            tier: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'USER_NOT_FOUND', 
            message: 'User not found' 
          } 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: !!user.emailVerified,
          profile: user.profile ? {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            displayName: user.profile.displayName,
            avatarUrl: user.profile.avatarUrl,
            company: user.profile.company,
            title: user.profile.title,
            phone: user.profile.phone,
            city: user.profile.city,
            state: user.profile.state,
            country: user.profile.country,
            accredited: user.profile.accredited,
            accreditedAt: user.profile.accreditedAt,
            accreditationExpires: user.profile.accreditationExpires,
            investorType: user.profile.investorType,
          } : null,
          serviceProvider: user.serviceProvider,
        },
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'An error occurred' 
        } 
      },
      { status: 500 }
    );
  }
}
