// Fund router - CRUD and search operations for funds

import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, verifiedProcedure, accreditedProcedure, managerProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { FundType, FundStatus, Prisma } from '@prisma/client';

// Helper to mask fund name for non-accredited users
function maskFundName(name: string): string {
  // Show first 3 chars + masked rest, e.g., "Acm*** Capital"
  const words = name.split(' ');
  return words.map(word => {
    if (word.length <= 3) return word;
    return word.slice(0, 3) + '***';
  }).join(' ');
}

// Fields to return for teaser view (non-accredited users)
const TEASER_FUND_SELECT = {
  id: true,
  slug: true,
  type: true,
  strategy: true,
  subStrategy: true,
  // Don't include: name, description, manager info, documents, etc.
  aum: true,
  aumDate: true,
  inceptionDate: true,
  minInvestment: true,
  managementFee: true,
  performanceFee: true,
  // Location is okay
  city: true,
  state: true,
  country: true,
  featured: true,
  // Basic stats only
  statistics: {
    select: {
      ytdReturn: true,
      oneYearReturn: true,
      threeYearReturn: true,
      sharpeRatio: true,
      cagr: true,
      volatility: true,
    },
  },
} as const;

export const fundRouter = router({
  /**
   * List funds with filters and pagination
   * Public: returns basic info
   * Authenticated: returns more details
   */
  list: publicProcedure
    .input(
      z.object({
        type: z.nativeEnum(FundType).optional(),
        strategy: z.string().optional(),
        minAum: z.number().optional(),
        maxAum: z.number().optional(),
        country: z.string().optional(),
        featured: z.boolean().optional(),
        search: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { type, strategy, minAum, maxAum, country, featured, search, cursor, limit } = input;

      // Build where clause
      const where: Prisma.FundWhereInput = {
        status: FundStatus.APPROVED,
        visible: true,
        ...(type && { type }),
        ...(strategy && { strategy: { contains: strategy, mode: 'insensitive' as const } }),
        ...(country && { country }),
        ...(featured && { featured }),
        ...((minAum || maxAum) && {
          aum: {
            ...(minAum && { gte: minAum }),
            ...(maxAum && { lte: maxAum }),
          },
        }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { strategy: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      const funds = await ctx.prisma.fund.findMany({
        where,
        take: limit + 1, // Take one extra to check if there's more
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: [
          { featured: 'desc' },
          { aum: 'desc' },
        ],
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          strategy: true,
          subStrategy: true,
          aum: true,
          aumDate: true,
          inceptionDate: true,
          minInvestment: true,
          city: true,
          state: true,
          country: true,
          featured: true,
          statistics: {
            select: {
              ytdReturn: true,
              oneYearReturn: true,
              sharpeRatio: true,
              cagr: true,
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (funds.length > limit) {
        const nextItem = funds.pop();
        nextCursor = nextItem!.id;
      }

      return {
        funds,
        nextCursor,
      };
    }),

  /**
   * Get fund by slug - TEASER view for non-accredited, full view for accredited
   * Non-accredited users see masked fund name and limited info
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if user is accredited (both email verified AND accredited approved)
      let isAccredited = false;
      if (ctx.user) {
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.user.sub },
          select: { emailVerified: true, accreditedStatus: true },
        });
        isAccredited = !!(user?.emailVerified && user?.accreditedStatus === 'APPROVED');
      }

      // Always fetch with the same shape for consistent typing
      const fund = await ctx.prisma.fund.findUnique({
        where: { 
          slug: input.slug,
          status: FundStatus.APPROVED,
          visible: true,
        },
        include: {
          statistics: true,
          manager: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  company: true,
                  title: true,
                  city: true,
                  state: true,
                },
              },
            },
          },
        },
      });

      if (!fund) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fund not found',
        });
      }

      // If not accredited, return teaser data with masked name
      if (!isAccredited) {
        return {
          ...fund,
          name: maskFundName(fund.name),
          description: fund.description 
            ? fund.description.slice(0, 100) + '... [Verify accredited status to see full details]'
            : null,
          isTeaser: true,
          // Hide manager details for non-accredited users
          manager: null as typeof fund.manager | null,
        };
      }

      return {
        ...fund,
        isTeaser: false,
      };
    }),

  /**
   * Get fund with full details including returns
   * REQUIRES: Email verified AND Accredited status approved
   */
  getFullDetails: accreditedProcedure
    .input(z.object({ fundId: z.string() }))
    .query(async ({ ctx, input }) => {
      const fund = await ctx.prisma.fund.findUnique({
        where: { 
          id: input.fundId,
          status: FundStatus.APPROVED,
          visible: true,
        },
        include: {
          statistics: true,
          returns: {
            orderBy: [
              { year: 'desc' },
              { month: 'desc' },
            ],
          },
          documents: {
            where: {
              accessLevel: {
                in: ['PUBLIC', 'REGISTERED', 'ACCREDITED'],
              },
            },
            select: {
              id: true,
              documentType: true,
              title: true,
              fileName: true,
              fileSize: true,
              accessLevel: true,
              uploadedAt: true,
            },
          },
          manager: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  company: true,
                  title: true,
                  phone: true,
                  city: true,
                  state: true,
                  country: true,
                },
              },
            },
          },
        },
      });

      if (!fund) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fund not found',
        });
      }

      // Log activity for recommendations
      await ctx.prisma.userActivity.create({
        data: {
          userId: ctx.user.sub,
          action: 'VIEW',
          entityType: 'FUND',
          entityId: fund.id,
        },
      });

      return fund;
    }),

  /**
   * Get featured funds for homepage
   */
  getFeatured: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(10).default(3) }))
    .query(async ({ ctx, input }) => {
      const funds = await ctx.prisma.fund.findMany({
        where: {
          status: FundStatus.APPROVED,
          visible: true,
          featured: true,
        },
        take: input.limit,
        orderBy: { aum: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          strategy: true,
          aum: true,
          statistics: {
            select: {
              ytdReturn: true,
            },
          },
        },
      });

      return funds;
    }),

  /**
   * Get fund types with counts
   */
  getTypeCounts: publicProcedure.query(async ({ ctx }) => {
    const counts = await ctx.prisma.fund.groupBy({
      by: ['type'],
      where: {
        status: FundStatus.APPROVED,
        visible: true,
      },
      _count: true,
    });

    return counts.map((c) => ({
      type: c.type,
      count: c._count,
    }));
  }),

  /**
   * Create a new fund (managers only)
   */
  create: managerProcedure
    .input(
      z.object({
        name: z.string().min(1),
        type: z.nativeEnum(FundType),
        strategy: z.string().optional(),
        subStrategy: z.string().optional(),
        description: z.string().optional(),
        aum: z.number().optional(),
        inceptionDate: z.date().optional(),
        managementFee: z.number().min(0).max(0.1).optional(),
        performanceFee: z.number().min(0).max(0.5).optional(),
        minInvestment: z.number().optional(),
        lockupPeriod: z.string().optional(),
        redemptionTerms: z.string().optional(),
        legalStructure: z.string().optional(),
        domicile: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate slug from name
      const slug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Check if slug exists
      const existing = await ctx.prisma.fund.findUnique({
        where: { slug },
      });

      const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

      const fund = await ctx.prisma.fund.create({
        data: {
          ...input,
          slug: finalSlug,
          managerId: ctx.user.sub,
          status: FundStatus.DRAFT,
          aumDate: input.aum ? new Date() : undefined,
        },
      });

      return fund;
    }),

  /**
   * Update fund (managers only, own funds)
   */
  update: managerProcedure
    .input(
      z.object({
        fundId: z.string(),
        data: z.object({
          name: z.string().min(1).optional(),
          strategy: z.string().optional(),
          subStrategy: z.string().optional(),
          description: z.string().optional(),
          aum: z.number().optional(),
          managementFee: z.number().min(0).max(0.1).optional(),
          performanceFee: z.number().min(0).max(0.5).optional(),
          minInvestment: z.number().optional(),
          lockupPeriod: z.string().optional(),
          redemptionTerms: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          country: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const fund = await ctx.prisma.fund.findUnique({
        where: { id: input.fundId },
      });

      if (!fund) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fund not found',
        });
      }

      if (fund.managerId !== ctx.user.sub && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own funds',
        });
      }

      const updated = await ctx.prisma.fund.update({
        where: { id: input.fundId },
        data: {
          ...input.data,
          aumDate: input.data.aum ? new Date() : undefined,
        },
      });

      return updated;
    }),

  /**
   * Submit fund for approval
   */
  submitForApproval: managerProcedure
    .input(z.object({ fundId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const fund = await ctx.prisma.fund.findUnique({
        where: { id: input.fundId },
      });

      if (!fund) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fund not found',
        });
      }

      if (fund.managerId !== ctx.user.sub) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only submit your own funds',
        });
      }

      if (fund.status !== FundStatus.DRAFT) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Fund has already been submitted',
        });
      }

      const updated = await ctx.prisma.fund.update({
        where: { id: input.fundId },
        data: { status: FundStatus.PENDING_REVIEW },
      });

      return updated;
    }),
});
