/**
 * Report Generator Service
 * Sprint 8: HedgeCo.Net
 * 
 * Generates PDF and Excel reports from data
 * Note: PDF templates temporarily disabled pending @react-pdf/renderer type fixes
 */

import { exportToExcel, exportToCSV } from './export';
import { prisma } from './prisma';

// ============================================================
// TYPES
// ============================================================

export type ReportType = 
  | 'portfolio-summary'
  | 'performance-analysis'
  | 'risk-metrics'
  | 'quarterly-review'
  | 'fund-comparison'
  | 'fund-tearsheet';

export type ReportFormat = 'pdf' | 'excel' | 'csv';

export interface ReportFilters {
  fundIds?: string[];
  userId?: string;
  portfolioId?: string;
  startDate?: Date;
  endDate?: Date;
  quarter?: string;
  year?: number;
  includeArchived?: boolean;
}

export interface GeneratedReport {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
}

// ============================================================
// REPORT GENERATOR
// ============================================================

/**
 * Generate a report in the specified format
 */
export async function generateReport(
  type: ReportType,
  filters: ReportFilters,
  format: ReportFormat = 'pdf'
): Promise<GeneratedReport> {
  // Get report data
  const data = await getReportData(type, filters);
  
  // Generate based on format
  switch (format) {
    case 'pdf':
      return generatePDFReport(type, data);
    case 'excel':
      return generateExcelReport(type, data);
    case 'csv':
      return generateCSVReport(type, data);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Fetch data for a specific report type
 */
async function getReportData(type: ReportType, filters: ReportFilters): Promise<unknown> {
  const { fundIds, userId, startDate, endDate } = filters;
  
  switch (type) {
    case 'portfolio-summary':
      return getPortfolioSummaryData(userId || '', fundIds);
      
    case 'performance-analysis':
      return getPerformanceData(fundIds || [], startDate, endDate);
      
    case 'risk-metrics':
      return getRiskMetricsData(fundIds || []);
      
    case 'quarterly-review':
      return getQuarterlyReviewData(filters);
      
    case 'fund-comparison':
      return getFundComparisonData(fundIds || []);
      
    case 'fund-tearsheet':
      if (!fundIds || fundIds.length !== 1) {
        throw new Error('Fund tearsheet requires exactly one fund');
      }
      return getFundTearsheetData(fundIds[0]);
      
    default:
      throw new Error(`Unknown report type: ${type}`);
  }
}

// ============================================================
// PDF GENERATION (Temporarily disabled)
// ============================================================

async function generatePDFReport(type: ReportType, data: unknown): Promise<GeneratedReport> {
  // PDF generation temporarily disabled
  // TODO: Re-enable once @react-pdf/renderer type issues are fixed
  throw new Error(
    `PDF report generation temporarily disabled. ` +
    `Please use Excel or CSV format instead.`
  );
}

// ============================================================
// EXCEL GENERATION
// ============================================================

async function generateExcelReport(type: ReportType, data: unknown): Promise<GeneratedReport> {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${type}-report-${timestamp}.xlsx`;
  
  // Format data for export - convert to array if needed
  const exportData = Array.isArray(data) ? data : [data];
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content = exportToExcel(exportData as any);
  const buffer = Buffer.from(content, 'utf-8');
  
  return {
    buffer,
    filename,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: buffer.length,
  };
}

// ============================================================
// CSV GENERATION
// ============================================================

async function generateCSVReport(type: ReportType, data: unknown): Promise<GeneratedReport> {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${type}-report-${timestamp}.csv`;
  
  // Format data for export - convert to array if needed
  const exportData = Array.isArray(data) ? data : [data];
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content = exportToCSV(exportData as any);
  const buffer = Buffer.from(content, 'utf-8');
  
  return {
    buffer,
    filename,
    mimeType: 'text/csv',
    size: buffer.length,
  };
}

// ============================================================
// DATA FETCHING HELPERS
// ============================================================

async function getPortfolioSummaryData(userId: string, fundIds?: string[]) {
  const watchlist = await prisma.watchlist.findMany({
    where: { 
      userId,
      ...(fundIds && { fundId: { in: fundIds } }),
    },
    include: {
      fund: {
        include: {
          statistics: true,
          manager: { include: { profile: true } },
        },
      },
    },
  });
  
  return {
    generatedAt: new Date(),
    userId,
    funds: watchlist.map(w => ({
      id: w.fund.id,
      name: w.fund.name,
      strategy: w.fund.strategy,
      aum: w.fund.aum,
      statistics: w.fund.statistics,
      manager: w.fund.manager?.profile?.displayName || 'Unknown',
    })),
  };
}

async function getPerformanceData(fundIds: string[], startDate?: Date, endDate?: Date) {
  const funds = await prisma.fund.findMany({
    where: { id: { in: fundIds } },
    include: {
      statistics: true,
      returns: {
        where: {
          ...(startDate && endDate && {
            year: { gte: startDate.getFullYear(), lte: endDate.getFullYear() },
          }),
        },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      },
    },
  });
  
  return {
    generatedAt: new Date(),
    dateRange: { startDate, endDate },
    funds: funds.map(f => ({
      id: f.id,
      name: f.name,
      statistics: f.statistics,
      returns: f.returns,
    })),
  };
}

async function getRiskMetricsData(fundIds: string[]) {
  const funds = await prisma.fund.findMany({
    where: { id: { in: fundIds } },
    include: { statistics: true },
  });
  
  return {
    generatedAt: new Date(),
    funds: funds.map(f => ({
      id: f.id,
      name: f.name,
      sharpeRatio: f.statistics?.sharpeRatio,
      sortinoRatio: f.statistics?.sortinoRatio,
      maxDrawdown: f.statistics?.maxDrawdown,
      volatility: f.statistics?.volatility,
      beta: f.statistics?.beta,
    })),
  };
}

async function getQuarterlyReviewData(filters: ReportFilters) {
  const { fundIds, quarter, year } = filters;
  
  const funds = await prisma.fund.findMany({
    where: { id: { in: fundIds || [] } },
    include: {
      statistics: true,
      returns: {
        where: year ? { year } : undefined,
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      },
    },
  });
  
  return {
    generatedAt: new Date(),
    quarter,
    year,
    funds: funds.map(f => ({
      id: f.id,
      name: f.name,
      statistics: f.statistics,
      returns: f.returns,
    })),
  };
}

async function getFundComparisonData(fundIds: string[]) {
  const funds = await prisma.fund.findMany({
    where: { id: { in: fundIds } },
    include: {
      statistics: true,
      returns: {
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 36, // Last 3 years
      },
    },
  });
  
  return {
    generatedAt: new Date(),
    funds: funds.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      strategy: f.strategy,
      aum: f.aum,
      statistics: f.statistics,
      returns: f.returns,
    })),
  };
}

async function getFundTearsheetData(fundId: string) {
  const fund = await prisma.fund.findUnique({
    where: { id: fundId },
    include: {
      statistics: true,
      manager: { include: { profile: true } },
      returns: {
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 60, // Last 5 years
      },
    },
  });
  
  if (!fund) {
    throw new Error(`Fund not found: ${fundId}`);
  }
  
  return {
    generatedAt: new Date(),
    fund: {
      id: fund.id,
      name: fund.name,
      type: fund.type,
      strategy: fund.strategy,
      description: fund.description,
      aum: fund.aum,
      minimumInvestment: fund.minInvestment,
      statistics: fund.statistics,
      manager: fund.manager?.profile?.displayName || 'Unknown',
      returns: fund.returns,
    },
  };
}

// ============================================================
// UTILITIES
// ============================================================

function formatReportTitle(type: ReportType): string {
  const titles: Record<ReportType, string> = {
    'portfolio-summary': 'Portfolio Summary',
    'performance-analysis': 'Performance Analysis',
    'risk-metrics': 'Risk Metrics',
    'quarterly-review': 'Quarterly Review',
    'fund-comparison': 'Fund Comparison',
    'fund-tearsheet': 'Fund Tearsheet',
  };
  return titles[type] || type;
}
