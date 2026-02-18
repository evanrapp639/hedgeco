// Return router - Fund performance returns management

import { z } from 'zod';
import { router, protectedProcedure, managerProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { FundStatus } from '@prisma/client';

export const returnRouter = router({
  /**
   * Get returns for a fund by year range
   */
  getByFund: protectedProcedure
    .input(
      z.object({
        fundId: z.string(),
        years: z.number().min(1).max(20).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const { fundId, years } = input;

      // Verify fund exists and is visible
      const fund = await ctx.prisma.fund.findUnique({
        where: { id: fundId },
        select: { 
          id: true, 
          name: true,
          status: true, 
          visible: true,
          managerId: true,
        },
      });

      if (!fund) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fund not found',
        });
      }

      // Only show returns for approved visible funds, or if user is the manager
      const isManager = fund.managerId === ctx.user.sub;
      const isAdmin = ctx.user.role === 'ADMIN' || ctx.user.role === 'SUPER_ADMIN';
      
      if (!isManager && !isAdmin) {
        if (fund.status !== FundStatus.APPROVED || !fund.visible) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Fund returns not available',
          });
        }
      }

      const currentYear = new Date().getFullYear();
      const startYear = currentYear - years + 1;

      const returns = await ctx.prisma.fundReturn.findMany({
        where: {
          fundId,
          year: { gte: startYear },
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        select: {
          id: true,
          year: true,
          month: true,
          netReturn: true,
          grossReturn: true,
          ytdReturn: true,
          periodAum: true,
          provisional: true,
          source: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Log view activity
      await ctx.prisma.userActivity.create({
        data: {
          userId: ctx.user.sub,
          action: 'VIEW',
          entityType: 'FUND',
          entityId: fundId,
          metadata: { viewed: 'returns' },
        },
      });

      return {
        fundId,
        fundName: fund.name,
        returns,
      };
    }),

  /**
   * Get annual summary for a fund
   */
  getAnnualSummary: protectedProcedure
    .input(
      z.object({
        fundId: z.string(),
        years: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const { fundId, years } = input;
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - years + 1;

      const returns = await ctx.prisma.fundReturn.findMany({
        where: {
          fundId,
          year: { gte: startYear },
        },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      });

      // Group by year and calculate annual returns
      const yearlyData = new Map<number, { returns: number[]; ytd: number | null }>();

      for (const ret of returns) {
        if (!yearlyData.has(ret.year)) {
          yearlyData.set(ret.year, { returns: [], ytd: null });
        }
        const yearData = yearlyData.get(ret.year)!;
        yearData.returns.push(Number(ret.netReturn));
        
        // Use December's YTD as the annual return, or the latest available
        if (ret.month === 12 || !yearData.ytd) {
          yearData.ytd = ret.ytdReturn ? Number(ret.ytdReturn) : null;
        }
      }

      // Calculate annual returns using compound formula if YTD not available
      const annualReturns = Array.from(yearlyData.entries())
        .map(([year, data]) => {
          let annualReturn = data.ytd;
          
          if (!annualReturn && data.returns.length > 0) {
            // Compound the monthly returns: (1 + r1) * (1 + r2) * ... - 1
            annualReturn = data.returns.reduce((acc, r) => acc * (1 + r), 1) - 1;
          }

          return {
            year,
            annualReturn,
            monthsReported: data.returns.length,
          };
        })
        .sort((a, b) => b.year - a.year);

      return annualReturns;
    }),

  /**
   * Submit monthly returns (manager submits for their fund)
   */
  submit: managerProcedure
    .input(
      z.object({
        fundId: z.string(),
        year: z.number().min(1990).max(2100),
        month: z.number().min(1).max(12),
        netReturn: z.number(),
        grossReturn: z.number().optional(),
        periodAum: z.number().optional(),
        provisional: z.boolean().default(false),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { fundId, year, month, netReturn, grossReturn, periodAum, provisional, source } = input;

      // Verify ownership
      const fund = await ctx.prisma.fund.findUnique({
        where: { id: fundId },
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
          message: 'You can only submit returns for your own funds',
        });
      }

      // Check if return already exists
      const existing = await ctx.prisma.fundReturn.findUnique({
        where: {
          fundId_year_month: { fundId, year, month },
        },
      });

      let result;

      if (existing) {
        // Update existing
        result = await ctx.prisma.fundReturn.update({
          where: { id: existing.id },
          data: {
            netReturn,
            grossReturn,
            periodAum,
            provisional,
            source,
          },
        });
      } else {
        // Create new
        result = await ctx.prisma.fundReturn.create({
          data: {
            fundId,
            year,
            month,
            netReturn,
            grossReturn,
            periodAum,
            provisional,
            source,
          },
        });
      }

      // Recalculate YTD for this and subsequent months
      await recalculateYTD(ctx.prisma, fundId, year);

      return result;
    }),

  /**
   * Bulk import returns (manager submits multiple months)
   */
  bulkImport: managerProcedure
    .input(
      z.object({
        fundId: z.string(),
        data: z.array(
          z.object({
            year: z.number().min(1990).max(2100),
            month: z.number().min(1).max(12),
            netReturn: z.number(),
            grossReturn: z.number().optional(),
            periodAum: z.number().optional(),
          })
        ),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { fundId, data, source } = input;

      // Verify ownership
      const fund = await ctx.prisma.fund.findUnique({
        where: { id: fundId },
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
          message: 'You can only import returns for your own funds',
        });
      }

      // Validate data
      if (data.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No data to import',
        });
      }

      if (data.length > 120) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Maximum 120 months (10 years) per import',
        });
      }

      // Upsert all returns
      const results = await ctx.prisma.$transaction(
        data.map((item) =>
          ctx.prisma.fundReturn.upsert({
            where: {
              fundId_year_month: { fundId, year: item.year, month: item.month },
            },
            update: {
              netReturn: item.netReturn,
              grossReturn: item.grossReturn,
              periodAum: item.periodAum,
              source,
            },
            create: {
              fundId,
              year: item.year,
              month: item.month,
              netReturn: item.netReturn,
              grossReturn: item.grossReturn,
              periodAum: item.periodAum,
              source,
            },
          })
        )
      );

      // Get unique years and recalculate YTD
      const years = Array.from(new Set(data.map((d) => d.year)));
      for (const year of years) {
        await recalculateYTD(ctx.prisma, fundId, year);
      }

      return {
        imported: results.length,
        fundId,
      };
    }),

  /**
   * Get pending returns awaiting review (admin)
   */
  getPending: adminProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;

      // Get provisional returns
      const returns = await ctx.prisma.fundReturn.findMany({
        where: {
          provisional: true,
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          fund: {
            select: {
              id: true,
              name: true,
              slug: true,
              manager: {
                select: {
                  email: true,
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true,
                      company: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (returns.length > limit) {
        const nextItem = returns.pop();
        nextCursor = nextItem!.id;
      }

      return {
        returns,
        nextCursor,
      };
    }),

  /**
   * Approve provisional return (admin)
   */
  approve: adminProcedure
    .input(z.object({ returnId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const fundReturn = await ctx.prisma.fundReturn.findUnique({
        where: { id: input.returnId },
      });

      if (!fundReturn) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Return not found',
        });
      }

      const updated = await ctx.prisma.fundReturn.update({
        where: { id: input.returnId },
        data: { provisional: false },
      });

      return updated;
    }),

  /**
   * Delete a return entry (manager or admin)
   */
  delete: managerProcedure
    .input(z.object({ returnId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const fundReturn = await ctx.prisma.fundReturn.findUnique({
        where: { id: input.returnId },
        include: { fund: true },
      });

      if (!fundReturn) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Return not found',
        });
      }

      const isAdmin = ctx.user.role === 'ADMIN' || ctx.user.role === 'SUPER_ADMIN';
      if (fundReturn.fund.managerId !== ctx.user.sub && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete returns for your own funds',
        });
      }

      await ctx.prisma.fundReturn.delete({
        where: { id: input.returnId },
      });

      // Recalculate YTD
      await recalculateYTD(ctx.prisma, fundReturn.fundId, fundReturn.year);

      return { success: true };
    }),

  /**
   * Get manager's funds with return status
   */
  getManagerFunds: managerProcedure.query(async ({ ctx }) => {
    const funds = await ctx.prisma.fund.findMany({
      where: { managerId: ctx.user.sub },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        returns: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 1,
          select: {
            year: true,
            month: true,
            provisional: true,
          },
        },
      },
    });

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    return funds.map((fund) => {
      const latestReturn = fund.returns[0];
      let returnStatus = 'no_returns';
      let missingMonths = 0;

      if (latestReturn) {
        // Calculate how many months behind
        const monthsDiff =
          (currentYear - latestReturn.year) * 12 + (currentMonth - latestReturn.month);

        if (monthsDiff <= 1) {
          returnStatus = latestReturn.provisional ? 'pending' : 'current';
        } else {
          returnStatus = 'behind';
          missingMonths = monthsDiff - 1;
        }
      }

      return {
        id: fund.id,
        name: fund.name,
        slug: fund.slug,
        status: fund.status,
        returnStatus,
        latestReturn: latestReturn
          ? { year: latestReturn.year, month: latestReturn.month }
          : null,
        missingMonths,
      };
    });
  }),
});

/**
 * Helper: Recalculate YTD returns for a fund/year
 */
async function recalculateYTD(
  prisma: typeof import("@prisma/client").PrismaClient.prototype,
  fundId: string,
  year: number
): Promise<void> {
  const returns = await prisma.fundReturn.findMany({
    where: { fundId, year },
    orderBy: { month: 'asc' },
  });

  let ytd = 0;
  for (const ret of returns) {
    // Compound: (1 + ytd) * (1 + monthly) - 1
    ytd = (1 + ytd) * (1 + Number(ret.netReturn)) - 1;

    await prisma.fundReturn.update({
      where: { id: ret.id },
      data: { ytdReturn: ytd },
    });
  }
}
