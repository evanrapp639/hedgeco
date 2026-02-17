// NextAuth.js configuration for Google OAuth
// Integrates with existing auth system while adding OAuth support

import NextAuth, { type NextAuthConfig, type DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Adapter } from 'next-auth/adapters';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { UserRole, UserStatus } from '@prisma/client';

// Extended user type for our app
declare module 'next-auth' {
  interface User {
    role: UserRole;
    status: UserStatus;
    accredited: boolean;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      status: UserStatus;
      accredited: boolean;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role: UserRole;
    status: UserStatus;
    accredited: boolean;
  }
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
    newUser: '/register/pending',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { profile: true },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        // Check if account is locked
        if (user.locked) {
          throw new Error('ACCOUNT_LOCKED');
        }

        // Check if account is active
        if (!user.active) {
          throw new Error('ACCOUNT_INACTIVE');
        }

        // Check if account is pending approval
        if (user.status === 'PENDING') {
          throw new Error('ACCOUNT_PENDING');
        }

        // Check if account was rejected
        if (user.status === 'REJECTED') {
          throw new Error('ACCOUNT_REJECTED');
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email,
          role: user.role,
          status: user.status,
          accredited: user.profile?.accredited || false,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth sign-ins, check/create user
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { profile: true },
        });

        if (existingUser) {
          // Check if locked or inactive
          if (existingUser.locked) {
            return '/login?error=ACCOUNT_LOCKED';
          }
          if (!existingUser.active) {
            return '/login?error=ACCOUNT_INACTIVE';
          }
          // Check approval status
          if (existingUser.status === 'PENDING') {
            return '/register/pending';
          }
          if (existingUser.status === 'REJECTED') {
            return '/login?error=ACCOUNT_REJECTED';
          }
        } else {
          // New OAuth user - will be created by adapter with PENDING status
          // The user will be redirected to pending page
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      // On initial sign in
      if (user) {
        token.role = (user.role || 'INVESTOR') as UserRole;
        token.status = (user.status || 'PENDING') as UserStatus;
        token.accredited = Boolean(user.accredited);
      }

      // On subsequent requests, refresh user data from DB
      if (trigger === 'update' || !user) {
        if (token.sub) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            include: { profile: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.status = dbUser.status;
            token.accredited = dbUser.profile?.accredited || false;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.status = token.status as UserStatus;
        session.user.accredited = Boolean(token.accredited);
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // When a new OAuth user is created, set them to PENDING and create profile
      if (user.id && user.email) {
        // Check if profile exists (shouldn't for OAuth users)
        const existingProfile = await prisma.profile.findUnique({
          where: { userId: user.id },
        });

        if (!existingProfile) {
          // Extract name parts from OAuth data
          const nameParts = (user.name || '').split(' ');
          const firstName = nameParts[0] || 'User';
          const lastName = nameParts.slice(1).join(' ') || '';

          await prisma.profile.create({
            data: {
              userId: user.id,
              firstName,
              lastName,
              avatarUrl: user.image || undefined,
            },
          });
        }

        // Ensure status is PENDING (should be by default)
        await prisma.user.update({
          where: { id: user.id },
          data: { status: 'PENDING' },
        });
      }
    },
    async signIn({ user }) {
      // Update last login for OAuth users
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      }
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
