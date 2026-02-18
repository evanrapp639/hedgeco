// Stats router - Fund performance calculations and platform statistics

import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { FundStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Risk-free rate assumption (5% annualized)
const RISK_FREE_RATE = 0.05;

// Performance period enum
const PerformancePeriod = z.enum(['YTD', '1Y', '3Y', '5Y', 'INCEPTION']);
type PerformancePeriodType = z.infer<typeof PerformancePeriod>;

/**
 * Helper: Convert Decimal to number safely
 */
function toNumber(val: Decimal | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  return val.toNumber();
}

/**
 * Calculate standard deviation of an array of numbers
 */
function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
  
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Calculate annualized volatility from monthly returns
 */
function calculateVolatility(monthlyReturns: number[]): number {
  if (monthlyReturns.length < 2) return 0;
  return standardDeviation(monthlyReturns) * Math.sqrt(12);
}

/**
 * Calculate CAGR from monthly returns
 */
function calculateCAGR(monthlyReturns: number[]): number {
  if (monthlyReturns.length === 0) return 0;
  
  // Compound the returns to get total return
  const totalReturn = monthlyReturns.reduce((acc, r) => acc * (1 + r), 1) - 1;
  
  // Convert months to years
  const years = monthlyReturns.length / 12;
  
  if (years === 0) return totalReturn;
  
  // CAGR = (1 + totalReturn)^(1/years) - 1
  return Math.pow(1 + totalReturn, 1 / years) - 1;
}

/**
 * Calculate Sharpe Ratio
 * (Annualized Return - Risk Free Rate) / Annualized Volatility
 */
function calculateSharpeRatio(monthlyReturns: number[], riskFreeRate: number = RISK_FREE_RATE): number {
  if (monthlyReturns.length < 12) return 0;
  
  const annualizedReturn = calculateCAGR(monthlyReturns);
  const volatility = calculateVolatility(monthlyReturns);
  
  if (volatility === 0) return 0;
  
  return (annualizedReturn - riskFreeRate) / volatility;
}

/**
 * Calculate maximum drawdown from monthly returns
 */
function calculateMaxDrawdown(monthlyReturns: number[]): { maxDrawdown: number; drawdownDate: Date | null } {
  if (monthlyReturns.length === 0) return { maxDrawdown: 0, drawdownDate: null };
  
  let peak = 1;
  let maxDrawdown = 0;
  let cumulativeValue = 1;
  
  for (let i = 0; i < monthlyReturns.length; i++) {
    cumulativeValue *= (1 + monthlyReturns[i]);
    
    if (cumulativeValue > peak) {
      peak = cumulativeValue;
    }
    
    const drawdown = (peak - cumulativeValue) / peak;
    
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return { maxDrawdown, drawdownDate: null }; // Date would need return data context
}

/**
 * Calculate cumulative return for a period
 */
function calculateCumulativeReturn(monthlyReturns: number[]): number {
  if (monthlyReturns.length === 0) return 0;
  return monthlyReturns.reduce((acc, r) => acc * (1 + r), 1) - 1;
}

/**
 * Get returns for a specific period relative to current date
 */
function filterReturnsByPeriod(
  returns: { year: number; month: number; netReturn: Decimal }[],
  period: PerformancePeriodType
): number[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  let filtered: typeof returns;
  
  switch (period) {
    case 'YTD':
      filtered = returns.filter(r => r.year === currentYear && r.month <= currentMonth);
      break;
    case '1Y':
      filtered = returns.filter(r => {
        const returnDate = new Date(r.year, r.month - 1);
        const oneYearAgo = new Date(currentYear - 1, currentMonth - 1);
        return returnDate >= oneYearAgo;
      });
      break;
    case '3Y':
      filtered = returns.filter(r => {
        const returnDate = new Date(r.year, r.month - 1);
        const threeYearsAgo = new Date(currentYear - 3, currentMonth - 1);
        return returnDate >= threeYearsAgo;
      });
      break;
    case '5Y':
      filtered = returns.filter(r => {
        const returnDate = new Date(r.year, r.month - 1);
        const fiveYearsAgo = new Date(currentYear - 5, currentMonth - 1);
        return returnDate >= fiveYearsAgo;
      });
      break;
    case 'INCEPTION':
    default:
      filtered = returns;
  }
  
  // Sort by date ascending and convert to numbers
  return filtered
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .map(r => r.netReturn.toNumber());
}

export const statsRouter = router({
  /**
   * Get comprehensive fund statistics
   * Calculates AUM, returns, volatility, Sharpe ratio, drawdown
   */
  getFundStats: protectedProcedure
    .input(z.object({ fundId: z.string() }))
    .query(async ({ ctx, input }) => {
      const fund = await ctx.prisma.fund.findUnique({
        where: { 
          id: input.fundId,
          status: FundStatus.APPROVED,
          visible: true,
        },
        include: {
          returns: {
            orderBy: [
              { year: 'asc' },
              { month: 'asc' },
            ],
          },
        },
      });

      if (!fund) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fund not found',
        });
      }

      // Extract monthly returns as numbers
      const monthlyReturns = fund.returns.map(r => r.netReturn.toNumber());
      
      if (monthlyReturns.length === 0) {
        return {
          fundId: fund.id,
          fundName: fund.name,
          aum: toNumber(fund.aum),
          aumDate: fund.aumDate,
          inceptionDate: fund.inceptionDate,
          monthsOfData: 0,
          stats: null,
        };
      }

      // Calculate all statistics
      const totalReturn = calculateCumulativeReturn(monthlyReturns);
      const cagr = calculateCAGR(monthlyReturns);
      const volatility = calculateVolatility(monthlyReturns);
      const sharpeRatio = calculateSharpeRatio(monthlyReturns, RISK_FREE_RATE);
      const { maxDrawdown } = calculateMaxDrawdown(monthlyReturns);
      
      // Period returns
      const ytdReturns = filterReturnsByPeriod(fund.returns, 'YTD');
      const oneYearReturns = filterReturnsByPeriod(fund.returns, '1Y');
      const threeYearReturns = filterReturnsByPeriod(fund.returns, '3Y');
      const fiveYearReturns = filterReturnsByPeriod(fund.returns, '5Y');
      
      // Distribution stats
      const positiveMonths = monthlyReturns.filter(r => r > 0).length;
      const negativeMonths = monthlyReturns.filter(r => r < 0).length;
      const avgMonthlyReturn = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
      const bestMonth = Math.max(...monthlyReturns);
      const worstMonth = Math.min(...monthlyReturns);
      const winRate = positiveMonths / monthlyReturns.length;

      // Current drawdown
      let currentDrawdown = 0;
      let cumulativeValue = 1;
      let peak = 1;
      for (const r of monthlyReturns) {
        cumulativeValue *= (1 + r);
        if (cumulativeValue > peak) peak = cumulativeValue;
      }
      currentDrawdown = peak > 0 ? (peak - cumulativeValue) / peak : 0;

      // Data date range
      const sortedReturns = [...fund.returns].sort((a, b) => a.year - b.year || a.month - b.month);
      const firstReturn = sortedReturns[0];
      const lastReturn = sortedReturns[sortedReturns.length - 1];
      
      return {
        fundId: fund.id,
        fundName: fund.name,
        aum: toNumber(fund.aum),
        aumDate: fund.aumDate,
        inceptionDate: fund.inceptionDate,
        monthsOfData: monthlyReturns.length,
        dataStartDate: new Date(firstReturn.year, firstReturn.month - 1, 1),
        dataEndDate: new Date(lastReturn.year, lastReturn.month - 1, 1),
        stats: {
          // Return metrics
          totalReturn,
          cagr,
          ytdReturn: ytdReturns.length > 0 ? calculateCumulativeReturn(ytdReturns) : null,
          oneYearReturn: oneYearReturns.length >= 12 ? calculateCumulativeReturn(oneYearReturns) : null,
          threeYearReturn: threeYearReturns.length >= 36 ? calculateCAGR(threeYearReturns) : null,
          fiveYearReturn: fiveYearReturns.length >= 60 ? calculateCAGR(fiveYearReturns) : null,
          
          // Risk metrics
          volatility,
          sharpeRatio,
          riskFreeRate: RISK_FREE_RATE,
          
          // Drawdown
          maxDrawdown,
          currentDrawdown,
          
          // Distribution
          bestMonth,
          worstMonth,
          avgMonthlyReturn,
          positiveMonths,
          negativeMonths,
          winRate,
        },
      };
    }),

  /**
   * Get aggregate platform statistics
   */
  getMarketStats: publicProcedure.query(async ({ ctx }) => {
    // Count funds by status
    const [
      totalFunds,
      activeFunds,
      fundsByType,
      totalAum,
      avgStats,
      recentReturns,
    ] = await Promise.all([
      // Total approved funds
      ctx.prisma.fund.count({
        where: { status: FundStatus.APPROVED },
      }),
      
      // Visible active funds
      ctx.prisma.fund.count({
        where: { status: FundStatus.APPROVED, visible: true },
      }),
      
      // Funds grouped by type
      ctx.prisma.fund.groupBy({
        by: ['type'],
        where: { status: FundStatus.APPROVED, visible: true },
        _count: true,
      }),
      
      // Total platform AUM
      ctx.prisma.fund.aggregate({
        where: { status: FundStatus.APPROVED, visible: true },
        _sum: { aum: true },
        _avg: { aum: true },
      }),
      
      // Average statistics across all funds
      ctx.prisma.fundStatistics.aggregate({
        _avg: {
          ytdReturn: true,
          oneYearReturn: true,
          volatility: true,
          sharpeRatio: true,
        },
      }),
      
      // Most recent month's returns (for market pulse)
      ctx.prisma.fundReturn.findMany({
        orderBy: [
          { year: 'desc' },
          { month: 'desc' },
        ],
        take: 100,
        distinct: ['fundId'],
      }),
    ]);

    // Calculate market pulse from recent returns
    const recentReturnValues = recentReturns.map(r => r.netReturn.toNumber());
    const avgRecentReturn = recentReturnValues.length > 0
      ? recentReturnValues.reduce((a, b) => a + b, 0) / recentReturnValues.length
      : 0;
    const positiveReturnsCount = recentReturnValues.filter(r => r > 0).length;

    return {
      platform: {
        totalFunds,
        activeFunds,
        totalAum: toNumber(totalAum._sum.aum),
        avgAum: toNumber(totalAum._avg.aum),
      },
      fundsByType: fundsByType.map(f => ({
        type: f.type,
        count: f._count,
      })),
      averageMetrics: {
        ytdReturn: toNumber(avgStats._avg.ytdReturn),
        oneYearReturn: toNumber(avgStats._avg.oneYearReturn),
        volatility: toNumber(avgStats._avg.volatility),
        sharpeRatio: toNumber(avgStats._avg.sharpeRatio),
      },
      marketPulse: {
        fundsReporting: recentReturns.length,
        avgMonthlyReturn: avgRecentReturn,
        positivePerformers: positiveReturnsCount,
        negativePerformers: recentReturnValues.length - positiveReturnsCount,
        winRate: recentReturnValues.length > 0 
          ? positiveReturnsCount / recentReturnValues.length 
          : 0,
      },
    };
  }),

  /**
   * Calculate performance for specific periods
   * Returns YTD, 1Y, 3Y, 5Y, or inception returns
   */
  calculatePerformance: protectedProcedure
    .input(
      z.object({
        fundId: z.string(),
        period: PerformancePeriod,
      })
    )
    .query(async ({ ctx, input }) => {
      const fund = await ctx.prisma.fund.findUnique({
        where: { 
          id: input.fundId,
          status: FundStatus.APPROVED,
          visible: true,
        },
        include: {
          returns: {
            orderBy: [
              { year: 'asc' },
              { month: 'asc' },
            ],
          },
        },
      });

      if (!fund) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fund not found',
        });
      }

      const periodReturns = filterReturnsByPeriod(fund.returns, input.period);
      
      if (periodReturns.length === 0) {
        return {
          fundId: fund.id,
          fundName: fund.name,
          period: input.period,
          hasData: false,
          monthsAvailable: 0,
          monthsRequired: getRequiredMonths(input.period),
          performance: null,
        };
      }

      const requiredMonths = getRequiredMonths(input.period);
      const hasEnoughData = input.period === 'YTD' || input.period === 'INCEPTION' 
        || periodReturns.length >= requiredMonths;

      // For multi-year periods, use CAGR (annualized). For YTD/1Y, use cumulative.
      const isAnnualized = input.period === '3Y' || input.period === '5Y';
      const returnValue = isAnnualized
        ? calculateCAGR(periodReturns)
        : calculateCumulativeReturn(periodReturns);

      const volatility = calculateVolatility(periodReturns);
      const sharpeRatio = periodReturns.length >= 12 
        ? calculateSharpeRatio(periodReturns, RISK_FREE_RATE)
        : null;
      const { maxDrawdown } = calculateMaxDrawdown(periodReturns);

      return {
        fundId: fund.id,
        fundName: fund.name,
        period: input.period,
        hasData: true,
        hasEnoughData,
        monthsAvailable: periodReturns.length,
        monthsRequired: requiredMonths,
        performance: {
          return: returnValue,
          isAnnualized,
          volatility,
          sharpeRatio,
          maxDrawdown,
          bestMonth: Math.max(...periodReturns),
          worstMonth: Math.min(...periodReturns),
          positiveMonths: periodReturns.filter(r => r > 0).length,
          negativeMonths: periodReturns.filter(r => r < 0).length,
        },
      };
    }),

  /**
   * Batch calculate all period performances for a fund
   * Convenience endpoint to get all periods at once
   */
  getAllPeriodPerformance: protectedProcedure
    .input(z.object({ fundId: z.string() }))
    .query(async ({ ctx, input }) => {
      const fund = await ctx.prisma.fund.findUnique({
        where: { 
          id: input.fundId,
          status: FundStatus.APPROVED,
          visible: true,
        },
        include: {
          returns: {
            orderBy: [
              { year: 'asc' },
              { month: 'asc' },
            ],
          },
        },
      });

      if (!fund) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fund not found',
        });
      }

      const periods: PerformancePeriodType[] = ['YTD', '1Y', '3Y', '5Y', 'INCEPTION'];
      
      const results = periods.map(period => {
        const periodReturns = filterReturnsByPeriod(fund.returns, period);
        const requiredMonths = getRequiredMonths(period);
        const hasEnoughData = period === 'YTD' || period === 'INCEPTION' 
          || periodReturns.length >= requiredMonths;
        
        if (periodReturns.length === 0) {
          return {
            period,
            return: null,
            isAnnualized: false,
            hasEnoughData: false,
          };
        }

        const isAnnualized = period === '3Y' || period === '5Y';
        const returnValue = isAnnualized
          ? calculateCAGR(periodReturns)
          : calculateCumulativeReturn(periodReturns);

        return {
          period,
          return: returnValue,
          isAnnualized,
          hasEnoughData,
          monthsOfData: periodReturns.length,
        };
      });

      return {
        fundId: fund.id,
        fundName: fund.name,
        performances: results,
      };
    }),

  /**
   * Recalculate and persist fund statistics to database
   * Admin endpoint to refresh FundStatistics table
   */
  recalculateStats: protectedProcedure
    .input(z.object({ fundId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Only managers (own fund) or admins can trigger recalculation
      const fund = await ctx.prisma.fund.findUnique({
        where: { id: input.fundId },
        include: {
          returns: {
            orderBy: [
              { year: 'asc' },
              { month: 'asc' },
            ],
          },
        },
      });

      if (!fund) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fund not found',
        });
      }

      if (fund.managerId !== ctx.user.sub && ctx.user.role !== 'ADMIN' && ctx.user.role !== 'SUPER_ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only recalculate stats for your own funds',
        });
      }

      const monthlyReturns = fund.returns.map(r => r.netReturn.toNumber());
      
      if (monthlyReturns.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No return data available for this fund',
        });
      }

      // Calculate all metrics
      const totalReturn = calculateCumulativeReturn(monthlyReturns);
      const cagr = calculateCAGR(monthlyReturns);
      const volatility = calculateVolatility(monthlyReturns);
      const sharpeRatio = calculateSharpeRatio(monthlyReturns, RISK_FREE_RATE);
      const { maxDrawdown } = calculateMaxDrawdown(monthlyReturns);
      
      // Period returns
      const ytdReturns = filterReturnsByPeriod(fund.returns, 'YTD');
      const oneYearReturns = filterReturnsByPeriod(fund.returns, '1Y');
      const threeYearReturns = filterReturnsByPeriod(fund.returns, '3Y');
      const fiveYearReturns = filterReturnsByPeriod(fund.returns, '5Y');

      // Distribution
      const positiveMonths = monthlyReturns.filter(r => r > 0).length;
      const negativeMonths = monthlyReturns.filter(r => r < 0).length;
      const avgMonthlyReturn = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
      const bestMonth = Math.max(...monthlyReturns);
      const worstMonth = Math.min(...monthlyReturns);
      const winRate = positiveMonths / monthlyReturns.length;

      // Current drawdown
      let cumulativeValue = 1;
      let peak = 1;
      for (const r of monthlyReturns) {
        cumulativeValue *= (1 + r);
        if (cumulativeValue > peak) peak = cumulativeValue;
      }
      const currentDrawdown = peak > 0 ? (peak - cumulativeValue) / peak : 0;

      // Data range
      const sortedReturns = [...fund.returns].sort((a, b) => a.year - b.year || a.month - b.month);
      const firstReturn = sortedReturns[0];
      const lastReturn = sortedReturns[sortedReturns.length - 1];

      // Upsert statistics
      const statistics = await ctx.prisma.fundStatistics.upsert({
        where: { fundId: input.fundId },
        create: {
          fundId: input.fundId,
          totalReturn,
          cagr,
          ytdReturn: ytdReturns.length > 0 ? calculateCumulativeReturn(ytdReturns) : null,
          oneYearReturn: oneYearReturns.length >= 12 ? calculateCumulativeReturn(oneYearReturns) : null,
          threeYearReturn: threeYearReturns.length >= 36 ? calculateCAGR(threeYearReturns) : null,
          fiveYearReturn: fiveYearReturns.length >= 60 ? calculateCAGR(fiveYearReturns) : null,
          volatility,
          sharpeRatio,
          maxDrawdown,
          currentDrawdown,
          bestMonth,
          worstMonth,
          avgMonthlyReturn,
          positiveMonths,
          negativeMonths,
          winRate,
          monthsOfData: monthlyReturns.length,
          dataStartDate: new Date(firstReturn.year, firstReturn.month - 1, 1),
          dataEndDate: new Date(lastReturn.year, lastReturn.month - 1, 1),
          riskFreeRate: RISK_FREE_RATE,
          calculatedAt: new Date(),
        },
        update: {
          totalReturn,
          cagr,
          ytdReturn: ytdReturns.length > 0 ? calculateCumulativeReturn(ytdReturns) : null,
          oneYearReturn: oneYearReturns.length >= 12 ? calculateCumulativeReturn(oneYearReturns) : null,
          threeYearReturn: threeYearReturns.length >= 36 ? calculateCAGR(threeYearReturns) : null,
          fiveYearReturn: fiveYearReturns.length >= 60 ? calculateCAGR(fiveYearReturns) : null,
          volatility,
          sharpeRatio,
          maxDrawdown,
          currentDrawdown,
          bestMonth,
          worstMonth,
          avgMonthlyReturn,
          positiveMonths,
          negativeMonths,
          winRate,
          monthsOfData: monthlyReturns.length,
          dataStartDate: new Date(firstReturn.year, firstReturn.month - 1, 1),
          dataEndDate: new Date(lastReturn.year, lastReturn.month - 1, 1),
          riskFreeRate: RISK_FREE_RATE,
          calculatedAt: new Date(),
        },
      });

      return {
        fundId: fund.id,
        fundName: fund.name,
        statistics,
        calculatedAt: new Date(),
      };
    }),
});

/**
 * Get required months for a performance period
 */
function getRequiredMonths(period: PerformancePeriodType): number {
  switch (period) {
    case 'YTD': return 1;
    case '1Y': return 12;
    case '3Y': return 36;
    case '5Y': return 60;
    case 'INCEPTION': return 1;
    default: return 1;
  }
}
