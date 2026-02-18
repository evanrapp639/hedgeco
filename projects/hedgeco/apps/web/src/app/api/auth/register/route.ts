// POST /api/auth/register - Create a new user account

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { 
  sendVerificationEmail,
  sendInvestorManagerRegistrationEmail,
  sendServiceProviderRegistrationEmail,
  sendNewsMemberRegistrationEmail,
  sendAdminNewRegistrationNotification 
} from '@/lib/email';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import crypto from 'crypto';

// Validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['INVESTOR', 'MANAGER', 'SERVICE_PROVIDER', 'NEWS_MEMBER']),
  company: z.string().optional(),
  title: z.string().optional(),
  // Role-specific fields
  investorType: z.string().optional(),
  fundType: z.string().optional(),
  category: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = registerSchema.safeParse(body);
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

    const data = result.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'EMAIL_EXISTS', 
            message: 'An account with this email already exists' 
          } 
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user with profile
    // accreditedStatus defaults to PENDING (requires admin approval to view full fund details)
    // emailVerified will be null until user verifies email (Step 1)
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        role: data.role as UserRole,
        // accreditedStatus defaults to PENDING in schema
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            company: data.company,
            title: data.title,
            phone: data.phone,
            investorType: data.investorType as "INDIVIDUAL" | "FAMILY_OFFICE" | "INSTITUTIONAL" | "FUND_OF_FUNDS" | "ENDOWMENT" | "PENSION" | "RIA" | "BANK" | "INSURANCE" | undefined,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Create service provider record if applicable
    if (data.role === 'SERVICE_PROVIDER' && data.company) {
      await prisma.serviceProvider.create({
        data: {
          userId: user.id,
          companyName: data.company,
          slug: data.company.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          category: data.category || 'other',
          description: data.description,
          website: data.website || null,
        },
      });
    }

    // Create email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        type: 'EMAIL',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send appropriate registration autoresponder based on role
    const userName = `${data.firstName} ${data.lastName}`;
    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://hedgeco.vercel.app'}/api/auth/confirm-registration?token=${verificationToken}&userId=${user.id}`;
    const activateUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://hedgeco.vercel.app'}/api/auth/activate-news?token=${verificationToken}&userId=${user.id}`;

    switch (data.role) {
      case 'INVESTOR':
        await sendInvestorManagerRegistrationEmail(
          { email: user.email, firstName: data.firstName },
          'investor',
          confirmUrl
        );
        break;
      case 'MANAGER':
        await sendInvestorManagerRegistrationEmail(
          { email: user.email, firstName: data.firstName },
          'manager',
          confirmUrl
        );
        break;
      case 'SERVICE_PROVIDER':
        await sendServiceProviderRegistrationEmail(
          { email: user.email, firstName: data.firstName },
          confirmUrl
        );
        break;
      case 'NEWS_MEMBER':
        await sendNewsMemberRegistrationEmail(
          { email: user.email, firstName: data.firstName },
          activateUrl
        );
        break;
    }

    // Send admin notification
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'support@hedgeco.net';
    await sendAdminNewRegistrationNotification(
      adminEmail,
      {
        id: user.id,
        email: user.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        company: data.company,
      }
    );

    // Return success - user needs to:
    // 1. Check email for registration confirmation (autoresponder sent)
    // 2. Click confirmation link to verify email
    // 3. Wait for admin to approve accredited investor status (if applicable)
    return NextResponse.json({
      success: true,
      data: {
        requiresEmailVerification: true,
        message: 'Your account has been created! Please check your email for the registration confirmation. Click the link in the email to verify your address and continue the approval process.',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: false,
          accreditedStatus: 'PENDING',
          profile: {
            firstName: user.profile?.firstName,
            lastName: user.profile?.lastName,
            company: user.profile?.company,
          },
        },
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'An error occurred during registration' 
        } 
      },
      { status: 500 }
    );
  }
}
