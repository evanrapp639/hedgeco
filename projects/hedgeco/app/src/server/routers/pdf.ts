// PDF Generation Router
// tRPC endpoints for generating PDF reports

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { generatePDFBuffer } from '@/lib/pdf';
import { FundTearsheet, type FundData, type PerformanceData, type ContactInfo } from '@/lib/pdf/FundTearsheet';
import React from 'react';

// Helper to calculate performance metrics from monthly returns
function calculatePerformance(returns: Array<{ date: Date; netReturn: number }>): PerformanceData {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Sort returns by date descending
  const sorted = [...returns].sort((a, b) => b.date.getTime() - a.date.getTime());

  // MTD - current month
  const mtdReturn = sorted.find(
    (r) => r.date.getFullYear() === currentYear && r.date.getMonth() + 1 === currentMonth
  )?.netReturn ?? 0;

  // YTD - all returns this year
  const ytdReturns = sorted.filter((r) => r.date.getFullYear() === currentYear);
  const ytd = ytdReturns.length > 0
    ? (ytdReturns.reduce((acc, r) => acc * (1 + r.netReturn / 100), 1) - 1) * 100
    : 0;

  // 1 Year - last 12 months
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearReturns = sorted.filter((r) => r.date >= oneYearAgo);
  const oneYear = oneYearReturns.length >= 12
    ? (oneYearReturns.reduce((acc, r) => acc * (1 + r.netReturn / 100), 1) - 1) * 100
    : undefined;

  // Since Inception
  const sinceInception = sorted.length > 0
    ? (sorted.reduce((acc, r) => acc * (1 + r.netReturn / 100), 1) - 1) * 100
    : 0;

  // Calculate risk metrics
  const monthlyReturns = sorted.map((r) => r.netReturn);
  const avgReturn = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
  const variance =
    monthlyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
    monthlyReturns.length;
  const volatility = Math.sqrt(variance * 12); // Annualized

  // Sharpe Ratio (assuming 0% risk-free rate for simplicity)
  const annualizedReturn = avgReturn * 12;
  const sharpeRatio = volatility > 0 ? annualizedReturn / volatility : undefined;

  // Max Drawdown
  let peak = 100;
  let maxDrawdown = 0;
  let cumulative = 100;
  for (const ret of [...sorted].reverse()) {
    cumulative *= 1 + ret.netReturn / 100;
    if (cumulative > peak) peak = cumulative;
    const drawdown = ((peak - cumulative) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  return {
    mtd: mtdReturn,
    ytd,
    oneYear,
    sinceInception,
    sharpeRatio,
    volatility,
    maxDrawdown: -maxDrawdown,
  };
}

export const pdfRouter = router({
  /**
   * Generate a fund tearsheet PDF
   */
  generateTearsheet: protectedProcedure
    .input(z.object({ fundId: z.string() }))
    .mutation(async ({ input }) => {
      const { fundId } = input;

      // Fetch fund with all related data
      const fund = await prisma.fund.findUnique({
        where: { id: fundId },
        include: {
          manager: {
            include: {
              profile: true,
            },
          },
          returns: {
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
            take: 60, // 5 years of monthly data
          },
        },
      });

      if (!fund) {
        throw new Error('Fund not found');
      }

      // Prepare fund data
      const fundData: FundData = {
        id: fund.id,
        name: fund.name,
        strategy: fund.strategy ?? 'Hedge Fund',
        description: fund.description ?? undefined,
        inceptionDate: fund.inceptionDate ?? new Date(),
        aum: fund.aum ? Number(fund.aum) : undefined,
        minimumInvestment: fund.minInvestment ? Number(fund.minInvestment) : undefined,
        managementFee: fund.managementFee ? Number(fund.managementFee) * 100 : undefined, // Convert to percentage
        performanceFee: fund.performanceFee ? Number(fund.performanceFee) * 100 : undefined, // Convert to percentage
        lockupPeriod: fund.lockupPeriod ?? undefined,
        redemptionNotice: fund.redemptionTerms ?? undefined,
      };

      // Calculate performance - convert year/month to date for calculation
      const performance = calculatePerformance(
        fund.returns.map((r) => ({
          date: new Date(r.year, r.month - 1, 1),
          netReturn: Number(r.netReturn) * 100, // Convert from decimal to percentage
        }))
      );

      // Prepare monthly returns for table
      const monthlyReturns = fund.returns.map((r) => ({
        year: r.year,
        month: r.month,
        return: Number(r.netReturn) * 100, // Convert from decimal to percentage
      }));

      // Contact info - use manager's profile info
      const contact: ContactInfo = {
        firmName: fund.manager.profile?.company ?? fund.name,
        email: fund.manager.email,
        website: undefined,
      };

      // Create the document
      const document = React.createElement(FundTearsheet, {
        fund: fundData,
        performance,
        monthlyReturns,
        contact,
        asOfDate: new Date(),
      });

      // Generate PDF
      const pdfBuffer = await generatePDFBuffer(document);
      const base64 = pdfBuffer.toString('base64');

      return {
        pdf: base64,
        filename: `${fund.name.replace(/[^a-zA-Z0-9]/g, '_')}_Tearsheet_${new Date().toISOString().split('T')[0]}.pdf`,
        contentType: 'application/pdf',
      };
    }),

  /**
   * Generate a detailed performance report PDF
   */
  generatePerformanceReport: protectedProcedure
    .input(
      z.object({
        fundId: z.string(),
        period: z.enum(['1m', '3m', '6m', '1y', '3y', '5y', 'all']).default('1y'),
      })
    )
    .mutation(async ({ input }) => {
      const { fundId, period } = input;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (period) {
        case '1m':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3m':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case '3y':
          startDate.setFullYear(startDate.getFullYear() - 3);
          break;
        case '5y':
          startDate.setFullYear(startDate.getFullYear() - 5);
          break;
        case 'all':
          startDate.setFullYear(2000); // Far enough back
          break;
      }

      // Fetch fund with returns for the period
      const fund = await prisma.fund.findUnique({
        where: { id: fundId },
        include: {
          manager: {
            include: {
              profile: true,
            },
          },
          returns: {
            where: {
              OR: [
                // Returns within the date range based on year/month
                { year: { gte: startDate.getFullYear(), lte: endDate.getFullYear() } },
              ],
            },
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
          },
        },
      });

      if (!fund) {
        throw new Error('Fund not found');
      }

      // For now, use the same tearsheet template
      // In a real app, you'd create a dedicated PerformanceReport template
      const fundData: FundData = {
        id: fund.id,
        name: fund.name,
        strategy: fund.strategy ?? 'Hedge Fund',
        description: fund.description ?? undefined,
        inceptionDate: fund.inceptionDate ?? new Date(),
        aum: fund.aum ? Number(fund.aum) : undefined,
        minimumInvestment: fund.minInvestment ? Number(fund.minInvestment) : undefined,
        managementFee: fund.managementFee ? Number(fund.managementFee) * 100 : undefined,
        performanceFee: fund.performanceFee ? Number(fund.performanceFee) * 100 : undefined,
        lockupPeriod: fund.lockupPeriod ?? undefined,
        redemptionNotice: fund.redemptionTerms ?? undefined,
      };

      // Filter returns to the actual date range
      const filteredReturns = fund.returns.filter((r) => {
        const retDate = new Date(r.year, r.month - 1, 1);
        return retDate >= startDate && retDate <= endDate;
      });

      const performance = calculatePerformance(
        filteredReturns.map((r) => ({
          date: new Date(r.year, r.month - 1, 1),
          netReturn: Number(r.netReturn) * 100,
        }))
      );

      const monthlyReturns = filteredReturns.map((r) => ({
        year: r.year,
        month: r.month,
        return: Number(r.netReturn) * 100,
      }));

      const contact: ContactInfo = {
        firmName: fund.manager.profile?.company ?? fund.name,
        email: fund.manager.email,
        website: undefined,
      };

      const document = React.createElement(FundTearsheet, {
        fund: fundData,
        performance,
        monthlyReturns,
        contact,
        asOfDate: new Date(),
      });

      const pdfBuffer = await generatePDFBuffer(document);
      const base64 = pdfBuffer.toString('base64');

      const periodLabel = {
        '1m': '1_Month',
        '3m': '3_Month',
        '6m': '6_Month',
        '1y': '1_Year',
        '3y': '3_Year',
        '5y': '5_Year',
        all: 'All_Time',
      }[period];

      return {
        pdf: base64,
        filename: `${fund.name.replace(/[^a-zA-Z0-9]/g, '_')}_Performance_${periodLabel}_${new Date().toISOString().split('T')[0]}.pdf`,
        contentType: 'application/pdf',
      };
    }),
});
