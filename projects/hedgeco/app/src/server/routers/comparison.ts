/**
 * Fund Comparison Router
 * Sprint 7: HedgeCo.Net
 *
 * tRPC router for fund comparison operations including
 * side-by-side comparisons, correlation analysis, and exports.
 */

import { z } from 'zod';
import { router, protectedProcedure, investorProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { FundStatus } from '@prisma/client';
import {
  compareFunds,
  calculateCorrelationMatrix,
  getRiskAdjustedMetrics,
  getPerformanceAttribution,
  generateComparisonReport,
  findSimilarFunds,
  type FundData,
  type FundReturns,
} from '@/lib/fund-comparison';
import { generateComparisonPDF, generatePDFBase64 } from '@/lib/pdf';
import { exportToCSV } from '@/lib/export';
import { cacheGet, cacheSet, CacheTTL } from '@/lib/cache';

// ============================================================
// SCHEMAS
// ============================================================

const fundIdsSchema = z.array(z.string().uuid()).min(2).max(10);

const metricsSchema = z.array(z.enum([
  'ytdReturn',
  'oneYearReturn',
  'threeYearReturn',
  'fiveYearReturn',
  'inceptionReturn',
  'cagr',
  'volatility',
  'maxDrawdown',
  'sharpeRatio',
  'sortinoRatio',
  'beta',
  'alpha',
  'aum',
  'managementFee',
  'performanceFee',
  'minInvestment',
])).optional();

const exportFormatSchema = z.enum(['pdf', 'csv']);

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Fetch funds with their returns from database
 */
async function getFundsWithReturns(
  prisma: typeof import('@prisma/client').PrismaClient.prototype,
  fundIds: string[]
): Promise<{ funds: FundData[]; fundsReturns: FundReturns[] }> {
  const dbFunds = await prisma.fund.findMany({
    where: {
      id: { in: fundIds },
      status: FundStatus.APPROVED,
      visible: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      strategy: true,
      subStrategy: true,
      aum: true,
      inceptionDate: true,
      managementFee: true,
      performanceFee: true,
      minInvestment: true,
      returns: {
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
        select: {
          year: true,
          month: true,
          netReturn: true,
        },
      },
    },
  });

  // Map to our types
  const funds: FundData[] = dbFunds.map(f => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    type: f.type,
    strategy: f.strategy,
    subStrategy: f.subStrategy,
    aum: f.aum ? Number(f.aum) : null,
    inceptionDate: f.inceptionDate,
    managementFee: f.managementFee ? Number(f.managementFee) : null,
    performanceFee: f.performanceFee ? Number(f.performanceFee) : null,
    minInvestment: f.minInvestment ? Number(f.minInvestment) : null,
  }));

  const fundsReturns: FundReturns[] = dbFunds.map(f => {
    const returns = f.returns.map(r => Number(r.netReturn)); // Already decimal in DB
    const years = returns.length / 12;
    return {
      fundId: f.id,
      returns,
      years,
    };
  });

  return { funds, fundsReturns };
}

/**
 * Verify all requested funds exist
 */
function validateFundsExist(fundIds: string[], foundFunds: { id: string }[]) {
  const foundIds = new Set(foundFunds.map(f => f.id));
  const missingIds = fundIds.filter(id => !foundIds.has(id));
  
  if (missingIds.length > 0) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Funds not found: ${missingIds.join(', ')}`,
    });
  }
}

// ============================================================
// ROUTER
// ============================================================

export const comparisonRouter = router({
  /**
   * Compare multiple funds side-by-side
   */
  compare: protectedProcedure
    .input(z.object({
      fundIds: fundIdsSchema,
      metrics: metricsSchema,
    }))
    .query(async ({ ctx, input }) => {
      const { fundIds, metrics } = input;

      // Check cache
      const cacheKey = `comparison:${fundIds.sort().join(':')}:${metrics?.join(',') ?? 'all'}`;
      const cached = await cacheGet<ReturnType<typeof compareFunds>>(cacheKey);
      if (cached) return cached;

      // Fetch data
      const { funds, fundsReturns } = await getFundsWithReturns(ctx.prisma, fundIds);
      validateFundsExist(fundIds, funds);

      // Compare
      const comparison = compareFunds(funds, fundsReturns, metrics);

      // Cache for 5 minutes
      await cacheSet(cacheKey, comparison, CacheTTL.FUND);

      // Log activity
      await ctx.prisma.userActivity.create({
        data: {
          userId: ctx.user.sub,
          action: 'COMPARE',
          entityType: 'FUND',
          entityId: fundIds.join(','),
          metadata: { fundCount: fundIds.length },
        },
      });

      return comparison;
    }),

  /**
   * Get correlation matrix for multiple funds
   */
  getCorrelationMatrix: protectedProcedure
    .input(z.object({
      fundIds: fundIdsSchema,
    }))
    .query(async ({ ctx, input }) => {
      const { fundIds } = input;

      // Check cache
      const cacheKey = `correlation:${fundIds.sort().join(':')}`;
      const cached = await cacheGet<ReturnType<typeof calculateCorrelationMatrix>>(cacheKey);
      if (cached) return cached;

      // Fetch returns
      const { funds, fundsReturns } = await getFundsWithReturns(ctx.prisma, fundIds);
      validateFundsExist(fundIds, funds);

      // Calculate matrix
      const result = calculateCorrelationMatrix(fundsReturns);

      // Include fund names for easier consumption
      const enrichedResult = {
        ...result,
        fundNames: funds.map(f => f.name),
      };

      // Cache for 5 minutes
      await cacheSet(cacheKey, enrichedResult, CacheTTL.FUND);

      return enrichedResult;
    }),

  /**
   * Export comparison data as PDF or CSV
   */
  exportComparison: investorProcedure
    .input(z.object({
      fundIds: fundIdsSchema,
      format: exportFormatSchema,
      includeCorrelation: z.boolean().default(true),
      includeRankings: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const { fundIds, format, includeCorrelation, includeRankings } = input;

      // Fetch data
      const { funds, fundsReturns } = await getFundsWithReturns(ctx.prisma, fundIds);
      validateFundsExist(fundIds, funds);

      // Generate full report
      const report = generateComparisonReport(funds, fundsReturns);

      // Log activity
      await ctx.prisma.userActivity.create({
        data: {
          userId: ctx.user.sub,
          action: 'DOWNLOAD',
          entityType: 'FUND',
          entityId: fundIds.join(','),
          metadata: { format, fundCount: fundIds.length },
        },
      });

      if (format === 'pdf') {
        // Generate PDF
        const pdfDoc = await generateComparisonPDF(report);
        const pdfBase64 = await generatePDFBase64(pdfDoc);

        return {
          data: pdfBase64,
          filename: `fund-comparison-${new Date().toISOString().split('T')[0]}.pdf`,
          mimeType: 'application/pdf',
        };
      } else {
        // Generate CSV
        const csvData = exportToCSV(report.funds.map(f => ({
          'Fund Name': f.fundName,
          'Fund ID': f.fundId,
          'YTD Return': formatPercent(f.metrics.ytdReturn),
          '1Y Return': formatPercent(f.metrics.oneYearReturn),
          '3Y Return': formatPercent(f.metrics.threeYearReturn),
          '5Y Return': formatPercent(f.metrics.fiveYearReturn),
          'CAGR': formatPercent(f.metrics.cagr),
          'Volatility': formatPercent(f.metrics.volatility),
          'Max Drawdown': formatPercent(f.metrics.maxDrawdown),
          'Sharpe Ratio': f.metrics.sharpeRatio?.toFixed(2) ?? 'N/A',
          'Sortino Ratio': f.metrics.sortinoRatio?.toFixed(2) ?? 'N/A',
          'AUM': f.metrics.aum ? `$${(f.metrics.aum / 1e6).toFixed(0)}M` : 'N/A',
          'Mgmt Fee': formatPercent(f.metrics.managementFee),
          'Perf Fee': formatPercent(f.metrics.performanceFee),
        })));

        return {
          data: Buffer.from(csvData).toString('base64'),
          filename: `fund-comparison-${new Date().toISOString().split('T')[0]}.csv`,
          mimeType: 'text/csv',
        };
      }
    }),

  /**
   * Find funds similar to a given fund
   */
  getSimilarFunds: protectedProcedure
    .input(z.object({
      fundId: z.string().uuid(),
      limit: z.number().min(1).max(20).default(5),
    }))
    .query(async ({ ctx, input }) => {
      const { fundId, limit } = input;

      // Check cache
      const cacheKey = `similar:${fundId}:${limit}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return cached;

      // Fetch target fund
      const targetFund = await ctx.prisma.fund.findUnique({
        where: {
          id: fundId,
          status: FundStatus.APPROVED,
          visible: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          strategy: true,
          subStrategy: true,
          aum: true,
          inceptionDate: true,
          managementFee: true,
          performanceFee: true,
          minInvestment: true,
          returns: {
            orderBy: [{ year: 'asc' }, { month: 'asc' }],
            select: { netReturn: true, year: true, month: true },
          },
        },
      });

      if (!targetFund) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fund not found',
        });
      }

      // Fetch candidate funds (same type or strategy)
      const candidates = await ctx.prisma.fund.findMany({
        where: {
          id: { not: fundId },
          status: FundStatus.APPROVED,
          visible: true,
          OR: [
            { type: targetFund.type },
            { strategy: targetFund.strategy },
          ],
        },
        take: 50, // Get more than limit for better scoring
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          strategy: true,
          subStrategy: true,
          aum: true,
          inceptionDate: true,
          managementFee: true,
          performanceFee: true,
          minInvestment: true,
          returns: {
            orderBy: [{ year: 'asc' }, { month: 'asc' }],
            select: { netReturn: true },
          },
        },
      });

      // Map to our types
      const targetFundData: FundData = {
        id: targetFund.id,
        name: targetFund.name,
        slug: targetFund.slug,
        type: targetFund.type,
        strategy: targetFund.strategy,
        subStrategy: targetFund.subStrategy,
        aum: targetFund.aum ? Number(targetFund.aum) : null,
        inceptionDate: targetFund.inceptionDate,
        managementFee: targetFund.managementFee ? Number(targetFund.managementFee) : null,
        performanceFee: targetFund.performanceFee ? Number(targetFund.performanceFee) : null,
        minInvestment: targetFund.minInvestment ? Number(targetFund.minInvestment) : null,
      };

      const targetReturns = targetFund.returns.map(r => Number(r.netReturn));

      const candidateFunds: FundData[] = candidates.map(f => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        type: f.type,
        strategy: f.strategy,
        subStrategy: f.subStrategy,
        aum: f.aum ? Number(f.aum) : null,
        inceptionDate: f.inceptionDate,
        managementFee: f.managementFee ? Number(f.managementFee) : null,
        performanceFee: f.performanceFee ? Number(f.performanceFee) : null,
        minInvestment: f.minInvestment ? Number(f.minInvestment) : null,
      }));

      const candidateReturns: FundReturns[] = candidates.map(f => ({
        fundId: f.id,
        returns: f.returns.map(r => Number(r.netReturn)),
        years: f.returns.length / 12,
      }));

      // Find similar funds
      const similarFunds = findSimilarFunds(
        targetFundData,
        targetReturns,
        candidateFunds,
        candidateReturns,
        limit
      );

      // Enrich with additional data
      const enriched = similarFunds.map(sf => {
        const fund = candidates.find(c => c.id === sf.fundId);
        return {
          ...sf,
          slug: fund?.slug,
          type: fund?.type,
          strategy: fund?.strategy,
        };
      });

      // Cache for 15 minutes
      await cacheSet(cacheKey, enriched, CacheTTL.RECOMMENDATIONS);

      return enriched;
    }),

  /**
   * Get risk-adjusted metrics for a fund
   */
  getRiskMetrics: protectedProcedure
    .input(z.object({
      fundId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const { fundId } = input;

      // Check cache
      const cacheKey = `risk-metrics:${fundId}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return cached;

      // Fetch fund returns
      const fund = await ctx.prisma.fund.findUnique({
        where: {
          id: fundId,
          status: FundStatus.APPROVED,
          visible: true,
        },
        select: {
          id: true,
          returns: {
            orderBy: [{ year: 'asc' }, { month: 'asc' }],
            select: { netReturn: true },
          },
        },
      });

      if (!fund) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fund not found',
        });
      }

      const returns = fund.returns.map(r => Number(r.netReturn));
      const metrics = getRiskAdjustedMetrics(fundId, returns);

      // Cache for 1 minute (stats can change)
      await cacheSet(cacheKey, metrics, CacheTTL.FUND_STATS);

      return metrics;
    }),

  /**
   * Get performance attribution for a fund
   */
  getAttribution: protectedProcedure
    .input(z.object({
      fundId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const { fundId } = input;

      // Fetch fund returns
      const fund = await ctx.prisma.fund.findUnique({
        where: {
          id: fundId,
          status: FundStatus.APPROVED,
          visible: true,
        },
        select: {
          id: true,
          returns: {
            orderBy: [{ year: 'asc' }, { month: 'asc' }],
            select: { netReturn: true },
          },
        },
      });

      if (!fund) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fund not found',
        });
      }

      const returns = fund.returns.map(r => Number(r.netReturn));
      
      // In production, you'd fetch actual benchmark data
      // For now, return attribution without benchmark
      const attribution = getPerformanceAttribution(fundId, returns);

      return attribution;
    }),

  /**
   * Generate full comparison report
   */
  generateReport: investorProcedure
    .input(z.object({
      fundIds: fundIdsSchema,
    }))
    .query(async ({ ctx, input }) => {
      const { fundIds } = input;

      // Fetch data
      const { funds, fundsReturns } = await getFundsWithReturns(ctx.prisma, fundIds);
      validateFundsExist(fundIds, funds);

      // Generate report
      const report = generateComparisonReport(funds, fundsReturns);

      // Log activity
      await ctx.prisma.userActivity.create({
        data: {
          userId: ctx.user.sub,
          action: 'COMPARE',
          entityType: 'FUND',
          entityId: fundIds.join(','),
          metadata: { fundCount: fundIds.length },
        },
      });

      return report;
    }),
});

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return `${(value * 100).toFixed(2)}%`;
}
