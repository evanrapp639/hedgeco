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
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // user is now non-null
    },
  });
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
