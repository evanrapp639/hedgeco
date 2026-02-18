/**
 * Bulk Export Service
 * Sprint 8: HedgeCo.Net
 * 
 * Provides bulk export functionality for funds, users, and analytics data
 */

import { prisma } from './prisma';
import { exportToCSV, exportToExcel } from './export';

// ============================================================
// TYPES
// ============================================================

export interface FundExportFilters {
  status?: string[];
  strategies?: string[];
  minAum?: number;
  maxAum?: number;
  country?: string;
  inceptionAfter?: Date;
  inceptionBefore?: Date;
  managerId?: string;
  includeStatistics?: boolean;
  includeReturns?: boolean;
}

export interface UserExportFilters {
  roles?: string[];
  active?: boolean;
  verified?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  accredited?: boolean;
}

export interface AnalyticsExportFilters {
  startDate: Date;
  endDate: Date;
  fundIds?: string[];
  metrics?: string[];
}

export interface ExportResult {
  data: string;
  filename: string;
  mimeType: string;
  rowCount: number;
}

// ============================================================
// FUND EXPORTS
// ============================================================

/**
 * Export all fund data to CSV
 */
export async function exportFundsToCSV(
  filters: FundExportFilters = {}
): Promise<ExportResult> {
  const funds = await fetchFundsForExport(filters);
  
  const rows = funds.map(fund => ({
    'Fund ID': fund.id,
    'Name': fund.name,
    'Slug': fund.slug,
    'Type': fund.type,
    'Strategy': fund.strategy || '',
    'Sub-Strategy': fund.subStrategy || '',
    'Status': fund.status,
    'Manager ID': fund.managerId,
    'AUM': fund.aum ? Number(fund.aum) : '',
    'AUM Date': fund.aumDate?.toISOString().split('T')[0] || '',
    'Inception Date': fund.inceptionDate?.toISOString().split('T')[0] || '',
    'Management Fee': fund.managementFee ? Number(fund.managementFee) : '',
    'Performance Fee': fund.performanceFee ? Number(fund.performanceFee) : '',
    'Min Investment': fund.minInvestment ? Number(fund.minInvestment) : '',
    'Lockup Period': fund.lockupPeriod || '',
    'Redemption Terms': fund.redemptionTerms || '',
    'Country': fund.country || '',
    'State': fund.state || '',
    'City': fund.city || '',
    'Domicile': fund.domicile || '',
    'Legal Structure': fund.legalStructure || '',
    'Visible': fund.visible ? 'Yes' : 'No',
    'Featured': fund.featured ? 'Yes' : 'No',
    'Created At': fund.createdAt.toISOString(),
    'Updated At': fund.updatedAt.toISOString(),
    // Statistics if included
    ...(fund.statistics ? {
      'YTD Return': fund.statistics.ytdReturn ? Number(fund.statistics.ytdReturn) : '',
      '1 Year Return': fund.statistics.oneYearReturn ? Number(fund.statistics.oneYearReturn) : '',
      '3 Year Return': fund.statistics.threeYearReturn ? Number(fund.statistics.threeYearReturn) : '',
      'Volatility': fund.statistics.volatility ? Number(fund.statistics.volatility) : '',
      'Sharpe Ratio': fund.statistics.sharpeRatio ? Number(fund.statistics.sharpeRatio) : '',
      'Max Drawdown': fund.statistics.maxDrawdown ? Number(fund.statistics.maxDrawdown) : '',
    } : {}),
  }));

  const csv = exportToCSV(rows);
  const filename = `funds-export-${formatDate(new Date())}.csv`;

  return {
    data: csv,
    filename,
    mimeType: 'text/csv',
    rowCount: rows.length,
  };
}

/**
 * Export fund data to Excel with multiple sheets
 */
export async function exportFundsToExcel(
  filters: FundExportFilters = {}
): Promise<ExportResult> {
  const funds = await fetchFundsForExport({ ...filters, includeStatistics: true, includeReturns: true });

  // Sheet 1: Fund Overview
  const overviewSheet = funds.map(fund => ({
    'Fund ID': fund.id,
    'Name': fund.name,
    'Type': fund.type,
    'Strategy': fund.strategy || '',
    'Status': fund.status,
    'AUM': fund.aum ? Number(fund.aum) : '',
    'Inception Date': fund.inceptionDate?.toISOString().split('T')[0] || '',
    'Management Fee': fund.managementFee ? Number(fund.managementFee) : '',
    'Performance Fee': fund.performanceFee ? Number(fund.performanceFee) : '',
    'Country': fund.country || '',
  }));

  // Sheet 2: Performance Statistics
  const statsSheet = funds
    .filter(f => f.statistics)
    .map(fund => ({
      'Fund ID': fund.id,
      'Fund Name': fund.name,
      'YTD Return': fund.statistics?.ytdReturn ? Number(fund.statistics.ytdReturn) : '',
      '1 Year Return': fund.statistics?.oneYearReturn ? Number(fund.statistics.oneYearReturn) : '',
      '3 Year Return': fund.statistics?.threeYearReturn ? Number(fund.statistics.threeYearReturn) : '',
      '5 Year Return': fund.statistics?.fiveYearReturn ? Number(fund.statistics.fiveYearReturn) : '',
      'CAGR': fund.statistics?.cagr ? Number(fund.statistics.cagr) : '',
      'Volatility': fund.statistics?.volatility ? Number(fund.statistics.volatility) : '',
      'Sharpe Ratio': fund.statistics?.sharpeRatio ? Number(fund.statistics.sharpeRatio) : '',
      'Sortino Ratio': fund.statistics?.sortinoRatio ? Number(fund.statistics.sortinoRatio) : '',
      'Max Drawdown': fund.statistics?.maxDrawdown ? Number(fund.statistics.maxDrawdown) : '',
      'Best Month': fund.statistics?.bestMonth ? Number(fund.statistics.bestMonth) : '',
      'Worst Month': fund.statistics?.worstMonth ? Number(fund.statistics.worstMonth) : '',
      'Win Rate': fund.statistics?.winRate ? Number(fund.statistics.winRate) : '',
    }));

  // Sheet 3: Monthly Returns (flattened)
  const returnsSheet: Record<string, string | number>[] = [];
  for (const fund of funds) {
    if (fund.returns) {
      for (const ret of fund.returns) {
        returnsSheet.push({
          'Fund ID': fund.id,
          'Fund Name': fund.name,
          'Year': ret.year,
          'Month': ret.month,
          'Net Return': Number(ret.netReturn),
          'Gross Return': ret.grossReturn ? Number(ret.grossReturn) : '',
          'YTD Return': ret.ytdReturn ? Number(ret.ytdReturn) : '',
        });
      }
    }
  }

  const sheets = [
    { name: 'Overview', data: overviewSheet },
    { name: 'Statistics', data: statsSheet },
    { name: 'Monthly Returns', data: returnsSheet },
  ];

  const excel = exportToExcel(sheets);
  const filename = `funds-export-${formatDate(new Date())}.xls`;

  return {
    data: excel,
    filename,
    mimeType: 'application/vnd.ms-excel',
    rowCount: funds.length,
  };
}

// ============================================================
// USER EXPORTS (Admin Only)
// ============================================================

/**
 * Export user data to CSV (admin only)
 */
export async function exportUsersToCSV(
  filters: UserExportFilters = {}
): Promise<ExportResult> {
  const users = await fetchUsersForExport(filters);

  const rows = users.map(user => ({
    'User ID': user.id,
    'Email': user.email,
    'Role': user.role,
    'Active': user.active ? 'Yes' : 'No',
    'Email Verified': user.emailVerified ? 'Yes' : 'No',
    'First Name': user.profile?.firstName || '',
    'Last Name': user.profile?.lastName || '',
    'Company': user.profile?.company || '',
    'Title': user.profile?.title || '',
    'Phone': user.profile?.phone || '',
    'City': user.profile?.city || '',
    'State': user.profile?.state || '',
    'Country': user.profile?.country || '',
    'Accredited': user.profile?.accredited ? 'Yes' : 'No',
    'Accredited At': user.profile?.accreditedAt?.toISOString().split('T')[0] || '',
    'Investor Type': user.profile?.investorType || '',
    'Subscription Plan': user.subscription?.plan || 'FREE',
    'Subscription Status': user.subscription?.status || '',
    'Last Login': user.lastLoginAt?.toISOString() || '',
    'Created At': user.createdAt.toISOString(),
  }));

  const csv = exportToCSV(rows);
  const filename = `users-export-${formatDate(new Date())}.csv`;

  return {
    data: csv,
    filename,
    mimeType: 'text/csv',
    rowCount: rows.length,
  };
}

// ============================================================
// ANALYTICS EXPORTS
// ============================================================

/**
 * Export analytics data to Excel
 */
export async function exportAnalyticsToExcel(
  filters: AnalyticsExportFilters
): Promise<ExportResult> {
  const { startDate, endDate, fundIds } = filters;

  // Fetch fund views
  const views = await prisma.fundView.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      ...(fundIds?.length ? { fundId: { in: fundIds } } : {}),
    },
    include: {
      fund: { select: { id: true, name: true, strategy: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch search events
  const searches = await prisma.searchEvent.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    orderBy: { createdAt: 'desc' },
    take: 10000,
  });

  // Sheet 1: Fund Views
  const viewsSheet = views.map(v => ({
    'View ID': v.id,
    'Fund ID': v.fundId,
    'Fund Name': v.fund.name,
    'Strategy': v.fund.strategy || '',
    'User ID': v.userId || 'Anonymous',
    'Session ID': v.sessionId || '',
    'Referrer': v.referrer || '',
    'Timestamp': v.createdAt.toISOString(),
    'Date': v.createdAt.toISOString().split('T')[0],
    'Hour': v.createdAt.getHours(),
  }));

  // Sheet 2: Search Events
  const searchSheet = searches.map(s => ({
    'Search ID': s.id,
    'Query': s.query,
    'Result Count': s.resultCount,
    'User ID': s.userId || 'Anonymous',
    'Clicked Fund': s.clickedFundId || '',
    'Timestamp': s.createdAt.toISOString(),
    'Date': s.createdAt.toISOString().split('T')[0],
  }));

  // Sheet 3: Daily Summary
  const dailyMap = new Map<string, { views: number; searches: number; uniqueUsers: Set<string> }>();
  
  for (const view of views) {
    const date = view.createdAt.toISOString().split('T')[0];
    const existing = dailyMap.get(date) || { views: 0, searches: 0, uniqueUsers: new Set() };
    existing.views++;
    if (view.userId) existing.uniqueUsers.add(view.userId);
    dailyMap.set(date, existing);
  }
  
  for (const search of searches) {
    const date = search.createdAt.toISOString().split('T')[0];
    const existing = dailyMap.get(date) || { views: 0, searches: 0, uniqueUsers: new Set() };
    existing.searches++;
    if (search.userId) existing.uniqueUsers.add(search.userId);
    dailyMap.set(date, existing);
  }

  const dailySheet = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      'Date': date,
      'Views': data.views,
      'Searches': data.searches,
      'Unique Users': data.uniqueUsers.size,
    }))
    .sort((a, b) => a.Date.localeCompare(b.Date));

  // Sheet 4: Top Funds by Views
  const fundViewCounts = new Map<string, { name: string; count: number }>();
  for (const view of views) {
    const existing = fundViewCounts.get(view.fundId) || { name: view.fund.name, count: 0 };
    existing.count++;
    fundViewCounts.set(view.fundId, existing);
  }

  const topFundsSheet = Array.from(fundViewCounts.entries())
    .map(([fundId, data]) => ({
      'Fund ID': fundId,
      'Fund Name': data.name,
      'View Count': data.count,
    }))
    .sort((a, b) => b['View Count'] - a['View Count'])
    .slice(0, 100);

  const sheets = [
    { name: 'Fund Views', data: viewsSheet },
    { name: 'Search Events', data: searchSheet },
    { name: 'Daily Summary', data: dailySheet },
    { name: 'Top Funds', data: topFundsSheet },
  ];

  const excel = exportToExcel(sheets);
  const filename = `analytics-export-${formatDate(startDate)}-to-${formatDate(endDate)}.xls`;

  return {
    data: excel,
    filename,
    mimeType: 'application/vnd.ms-excel',
    rowCount: views.length + searches.length,
  };
}

// ============================================================
// DATA FETCHERS
// ============================================================

async function fetchFundsForExport(filters: FundExportFilters) {
  const {
    status,
    strategies,
    minAum,
    maxAum,
    country,
    inceptionAfter,
    inceptionBefore,
    managerId,
    includeStatistics = false,
    includeReturns = false,
  } = filters;

  return prisma.fund.findMany({
    where: {
      ...(status?.length ? { status: { in: status as any[] } } : {}),
      ...(strategies?.length ? { strategy: { in: strategies } } : {}),
      ...(minAum !== undefined ? { aum: { gte: minAum } } : {}),
      ...(maxAum !== undefined ? { aum: { lte: maxAum } } : {}),
      ...(country ? { country } : {}),
      ...(inceptionAfter ? { inceptionDate: { gte: inceptionAfter } } : {}),
      ...(inceptionBefore ? { inceptionDate: { lte: inceptionBefore } } : {}),
      ...(managerId ? { managerId } : {}),
    },
    include: {
      statistics: includeStatistics,
      returns: includeReturns ? {
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      } : false,
    },
    orderBy: { name: 'asc' },
  });
}

async function fetchUsersForExport(filters: UserExportFilters) {
  const {
    roles,
    active,
    verified,
    createdAfter,
    createdBefore,
    accredited,
  } = filters;

  return prisma.user.findMany({
    where: {
      ...(roles?.length ? { role: { in: roles as any[] } } : {}),
      ...(active !== undefined ? { active } : {}),
      ...(verified !== undefined ? { emailVerified: verified ? { not: null } : null } : {}),
      ...(createdAfter ? { createdAt: { gte: createdAfter } } : {}),
      ...(createdBefore ? { createdAt: { lte: createdBefore } } : {}),
      ...(accredited !== undefined ? { profile: { accredited } } : {}),
    },
    include: {
      profile: true,
      subscription: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ============================================================
// HELPERS
// ============================================================

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default {
  exportFundsToCSV,
  exportFundsToExcel,
  exportUsersToCSV,
  exportAnalyticsToExcel,
};
