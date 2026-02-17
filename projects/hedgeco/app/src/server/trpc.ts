// tRPC server configuration
// Sets up the base router, middleware, and context

import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, type AccessTokenPayload } from '@/lib/auth';

/**
 * Context passed to all tRPC procedures
 */
export interface Context {
  prisma: typeof prisma;
  user: AccessTokenPayload | null;
}

/**
 * Create context for each request
 */
export async function createContext(): Promise<Context> {
  const user = await getCurrentUser();
  
  return {
    prisma,
    user,
  };
}

/**
 * Initialize tRPC
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication only (no verification requirements)
 * Use for basic authenticated operations like updating profile
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  
  // Check basic account status
  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.user.sub },
    select: { locked: true, active: true },
  });
  
  if (!user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'User not found',
    });
  }
  
  if (user.locked) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Your account has been locked. Please contact support.',
    });
  }
  
  if (!user.active) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Your account is inactive. Please contact support.',
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/**
 * Verified procedure - requires email verification (Step 1)
 * Use for operations that require verified email but not accredited status
 */
export const verifiedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.user.sub },
    select: { emailVerified: true },
  });
  
  if (!user?.emailVerified) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Please verify your email address to access this resource.',
    });
  }
  
  return next({ ctx });
});

/**
 * Accredited procedure - requires BOTH email verification AND admin approval (Step 1 + Step 2)
 * Use for accessing full fund/SPV details
 */
export const accreditedProcedure = verifiedProcedure.use(async ({ ctx, next }) => {
  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.user.sub },
    select: { accreditedStatus: true },
  });
  
  if (!user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'User not found',
    });
  }
  
  if (user.accreditedStatus === 'PENDING') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Your accredited investor status is pending admin approval. You can view limited fund information.',
    });
  }
  
  if (user.accreditedStatus === 'REJECTED') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Your accredited investor application was not approved. Please contact support.',
    });
  }
  
  return next({ ctx });
});

/**
 * Investor procedure - requires investor role
 */
export const investorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'INVESTOR' && ctx.user.role !== 'ADMIN' && ctx.user.role !== 'SUPER_ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only investors can access this resource',
    });
  }
  return next({ ctx });
});

/**
 * Manager procedure - requires manager role
 */
export const managerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'MANAGER' && ctx.user.role !== 'ADMIN' && ctx.user.role !== 'SUPER_ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only fund managers can access this resource',
    });
  }
  return next({ ctx });
});

/**
 * Admin procedure - requires admin role
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'ADMIN' && ctx.user.role !== 'SUPER_ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only admins can access this resource',
    });
  }
  return next({ ctx });
});
