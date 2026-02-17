/**
 * Advanced Fund Comparison Utilities
 * Sprint 7: HedgeCo.Net
 *
 * Provides functions for comparing multiple funds side-by-side,
 * calculating correlations, and generating comparison reports.
 */

import {
  calculateSharpeRatio,
  calculateSortino,
  calculateVolatility,
  calculateMaxDrawdown,
  calculateCAGR,
  calculateBeta,
  calculateAlpha,
  toCumulativeReturns,
  totalReturn,
  mean,
  standardDeviation,
  covariance,
  type MonthlyReturn,
} from './statistics';

// ============================================================
// TYPES
// ============================================================

export interface FundData {
  id: string;
  name: string;
  slug: string;
  type: string;
  strategy: string | null;
  subStrategy: string | null;
  aum: number | null;
  inceptionDate: Date | null;
  managementFee: number | null;
  performanceFee: number | null;
  minInvestment: number | null;
}

export interface FundReturns {
  fundId: string;
  returns: MonthlyReturn[];
  years: number;
}

export interface RiskAdjustedMetrics {
  fundId: string;
  sharpeRatio: number | null;
  sortinoRatio: number | null;
  calmarRatio: number | null;
  treynorRatio: number | null;
  informationRatio: number | null;
  omega: number | null;
  beta: number | null;
  alpha: number | null;
  volatility: number | null;
  maxDrawdown: number | null;
  downCaptureRatio: number | null;
  upCaptureRatio: number | null;
}

export interface PerformanceAttribution {
  fundId: string;
  marketExposure: number | null;    // Beta contribution
  alphaReturn: number | null;       // Skill/selection contribution
  timingReturn: number | null;      // Market timing contribution
  residualReturn: number | null;    // Unexplained return
  factorExposures: {
    factor: string;
    exposure: number;
    contribution: number;
  }[];
}

export interface FundComparison {
  fundId: string;
  fundName: string;
  metrics: {
    // Returns
    ytdReturn: number | null;
    oneYearReturn: number | null;
    threeYearReturn: number | null;
    fiveYearReturn: number | null;
    inceptionReturn: number | null;
    cagr: number | null;
    
    // Risk metrics
    volatility: number | null;
    maxDrawdown: number | null;
    sharpeRatio: number | null;
    sortinoRatio: number | null;
    beta: number | null;
    alpha: number | null;
    
    // Fund info
    aum: number | null;
    managementFee: number | null;
    performanceFee: number | null;
    minInvestment: number | null;
  };
}

export interface ComparisonReport {
  generatedAt: Date;
  funds: FundComparison[];
  correlationMatrix: number[][];
  rankings: {
    metric: string;
    rankings: { fundId: string; value: number | null; rank: number }[];
  }[];
  insights: string[];
}

export interface SimilarFund {
  fundId: string;
  fundName: string;
  similarityScore: number;
  matchReasons: string[];
}

// Default risk-free rate (4% annual, typical Treasury rate)
const DEFAULT_RISK_FREE_RATE = 0.04;

// ============================================================
// CORE COMPARISON FUNCTIONS
// ============================================================

/**
 * Compare multiple funds side-by-side
 * 
 * @param funds - Array of fund data objects
 * @param fundsReturns - Array of return data for each fund
 * @param selectedMetrics - Optional list of metrics to include
 * @returns Array of fund comparison objects
 */
export function compareFunds(
  funds: FundData[],
  fundsReturns: FundReturns[],
  selectedMetrics?: string[]
): FundComparison[] {
  const returnsMap = new Map(fundsReturns.map(fr => [fr.fundId, fr]));
  
  return funds.map(fund => {
    const returnData = returnsMap.get(fund.id);
    const returns = returnData?.returns ?? [];
    const years = returnData?.years ?? 0;
    
    // Calculate cumulative returns for drawdown
    const cumulative = returns.length > 0 ? toCumulativeReturns(returns) : [];
    
    // Calculate period returns
    const ytdReturn = returns.length >= 1 ? totalReturn(returns.slice(-getMonthsYTD())) : null;
    const oneYearReturn = returns.length >= 12 ? totalReturn(returns.slice(-12)) : null;
    const threeYearReturn = returns.length >= 36 ? totalReturn(returns.slice(-36)) : null;
    const fiveYearReturn = returns.length >= 60 ? totalReturn(returns.slice(-60)) : null;
    const inceptionReturn = returns.length > 0 ? totalReturn(returns) : null;
    
    const metrics = {
      // Returns
      ytdReturn,
      oneYearReturn,
      threeYearReturn,
      fiveYearReturn,
      inceptionReturn,
      cagr: calculateCAGR(returns, years),
      
      // Risk metrics
      volatility: calculateVolatility(returns),
      maxDrawdown: cumulative.length > 0 ? calculateMaxDrawdown(cumulative) : null,
      sharpeRatio: calculateSharpeRatio(returns, DEFAULT_RISK_FREE_RATE),
      sortinoRatio: calculateSortino(returns, DEFAULT_RISK_FREE_RATE),
      beta: null, // Requires benchmark data
      alpha: null, // Requires benchmark data
      
      // Fund info
      aum: fund.aum,
      managementFee: fund.managementFee,
      performanceFee: fund.performanceFee,
      minInvestment: fund.minInvestment,
    };
    
    // Filter metrics if specified
    if (selectedMetrics) {
      const filteredMetrics = {} as typeof metrics;
      for (const key of selectedMetrics) {
        if (key in metrics) {
          (filteredMetrics as Record<string, unknown>)[key] = (metrics as Record<string, unknown>)[key];
        }
      }
      return {
        fundId: fund.id,
        fundName: fund.name,
        metrics: filteredMetrics,
      };
    }
    
    return {
      fundId: fund.id,
      fundName: fund.name,
      metrics,
    };
  });
}

/**
 * Calculate correlation between two funds' returns
 * 
 * @param returns1 - Monthly returns for fund 1
 * @param returns2 - Monthly returns for fund 2
 * @returns Correlation coefficient (-1 to 1), or null if insufficient data
 */
export function calculateCorrelation(
  returns1: MonthlyReturn[],
  returns2: MonthlyReturn[]
): number | null {
  // Need same length arrays with at least 2 values
  const minLength = Math.min(returns1.length, returns2.length);
  if (minLength < 2) return null;
  
  // Align to same period (most recent)
  const aligned1 = returns1.slice(-minLength);
  const aligned2 = returns2.slice(-minLength);
  
  const cov = covariance(aligned1, aligned2);
  const std1 = standardDeviation(aligned1);
  const std2 = standardDeviation(aligned2);
  
  if (cov === null || std1 === null || std2 === null || std1 === 0 || std2 === 0) {
    return null;
  }
  
  return cov / (std1 * std2);
}

/**
 * Calculate correlation matrix for multiple funds
 * 
 * @param fundsReturns - Array of return data for each fund
 * @returns Object with fund IDs and correlation matrix
 */
export function calculateCorrelationMatrix(
  fundsReturns: FundReturns[]
): { fundIds: string[]; matrix: number[][] } {
  const n = fundsReturns.length;
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1; // Perfect correlation with self
      } else if (j > i) {
        const corr = calculateCorrelation(
          fundsReturns[i].returns,
          fundsReturns[j].returns
        );
        matrix[i][j] = corr ?? 0;
        matrix[j][i] = corr ?? 0; // Symmetric
      }
    }
  }
  
  return {
    fundIds: fundsReturns.map(fr => fr.fundId),
    matrix,
  };
}

/**
 * Calculate comprehensive risk-adjusted metrics for a fund
 * 
 * @param fundId - Fund identifier
 * @param returns - Monthly returns
 * @param benchmarkReturns - Optional benchmark returns for relative metrics
 * @param riskFreeRate - Annual risk-free rate (default 4%)
 * @returns Risk-adjusted metrics object
 */
export function getRiskAdjustedMetrics(
  fundId: string,
  returns: MonthlyReturn[],
  benchmarkReturns?: MonthlyReturn[],
  riskFreeRate: number = DEFAULT_RISK_FREE_RATE
): RiskAdjustedMetrics {
  const cumulative = toCumulativeReturns(returns);
  const maxDD = calculateMaxDrawdown(cumulative);
  const annualReturn = returns.length >= 12 
    ? (mean(returns) ?? 0) * 12 
    : null;
  const volatility = calculateVolatility(returns);
  
  // Calmar Ratio = CAGR / |Max Drawdown|
  const years = returns.length / 12;
  const cagr = calculateCAGR(returns, years);
  const calmarRatio = (cagr !== null && maxDD !== null && maxDD !== 0)
    ? cagr / Math.abs(maxDD)
    : null;
  
  // Beta and Alpha (if benchmark provided)
  let beta: number | null = null;
  let alpha: number | null = null;
  let treynorRatio: number | null = null;
  let informationRatio: number | null = null;
  let downCaptureRatio: number | null = null;
  let upCaptureRatio: number | null = null;
  
  if (benchmarkReturns && benchmarkReturns.length > 0) {
    beta = calculateBeta(returns, benchmarkReturns);
    
    const benchmarkAnnualReturn = (mean(benchmarkReturns) ?? 0) * 12;
    if (beta !== null && annualReturn !== null) {
      alpha = calculateAlpha(annualReturn, beta, benchmarkAnnualReturn, riskFreeRate);
    }
    
    // Treynor Ratio = (Return - Risk-free) / Beta
    if (beta !== null && beta !== 0 && annualReturn !== null) {
      treynorRatio = (annualReturn - riskFreeRate) / beta;
    }
    
    // Information Ratio = (Fund Return - Benchmark Return) / Tracking Error
    const excessReturns = returns.slice(-Math.min(returns.length, benchmarkReturns.length))
      .map((r, i) => r - (benchmarkReturns[benchmarkReturns.length - returns.length + i] ?? 0));
    const trackingError = standardDeviation(excessReturns);
    const avgExcess = mean(excessReturns);
    if (avgExcess !== null && trackingError !== null && trackingError !== 0) {
      informationRatio = (avgExcess * 12) / (trackingError * Math.sqrt(12));
    }
    
    // Capture ratios
    const captureRatios = calculateCaptureRatios(returns, benchmarkReturns);
    downCaptureRatio = captureRatios.down;
    upCaptureRatio = captureRatios.up;
  }
  
  // Omega Ratio (threshold = 0)
  const omega = calculateOmega(returns, 0);
  
  return {
    fundId,
    sharpeRatio: calculateSharpeRatio(returns, riskFreeRate),
    sortinoRatio: calculateSortino(returns, riskFreeRate),
    calmarRatio,
    treynorRatio,
    informationRatio,
    omega,
    beta,
    alpha,
    volatility,
    maxDrawdown: maxDD,
    downCaptureRatio,
    upCaptureRatio,
  };
}

/**
 * Perform simple performance attribution analysis
 * 
 * @param fundId - Fund identifier
 * @param returns - Monthly returns
 * @param benchmarkReturns - Benchmark returns
 * @returns Performance attribution breakdown
 */
export function getPerformanceAttribution(
  fundId: string,
  returns: MonthlyReturn[],
  benchmarkReturns?: MonthlyReturn[]
): PerformanceAttribution {
  const totalFundReturn = (mean(returns) ?? 0) * 12;
  
  if (!benchmarkReturns || benchmarkReturns.length === 0) {
    return {
      fundId,
      marketExposure: null,
      alphaReturn: null,
      timingReturn: null,
      residualReturn: null,
      factorExposures: [],
    };
  }
  
  const beta = calculateBeta(returns, benchmarkReturns);
  const benchmarkReturn = (mean(benchmarkReturns) ?? 0) * 12;
  
  // Market exposure contribution (beta * benchmark return)
  const marketExposure = beta !== null ? beta * benchmarkReturn : null;
  
  // Alpha contribution (actual - expected based on beta)
  const expectedReturn = beta !== null 
    ? DEFAULT_RISK_FREE_RATE + beta * (benchmarkReturn - DEFAULT_RISK_FREE_RATE)
    : null;
  const alphaReturn = expectedReturn !== null ? totalFundReturn - expectedReturn : null;
  
  // Simplified timing estimate (correlation changes)
  // In a real implementation, this would use rolling windows
  const timingReturn = 0; // Placeholder
  
  // Residual
  const residualReturn = totalFundReturn 
    - (marketExposure ?? 0) 
    - (alphaReturn ?? 0) 
    - timingReturn;
  
  return {
    fundId,
    marketExposure,
    alphaReturn,
    timingReturn,
    residualReturn,
    factorExposures: [
      {
        factor: 'Market',
        exposure: beta ?? 0,
        contribution: marketExposure ?? 0,
      },
    ],
  };
}

/**
 * Generate a comprehensive comparison report
 * 
 * @param funds - Array of fund data
 * @param fundsReturns - Array of return data
 * @returns Full comparison report with rankings and insights
 */
export function generateComparisonReport(
  funds: FundData[],
  fundsReturns: FundReturns[]
): ComparisonReport {
  const comparisons = compareFunds(funds, fundsReturns);
  const { matrix } = calculateCorrelationMatrix(fundsReturns);
  
  // Generate rankings for key metrics
  const metricsToRank = [
    'cagr',
    'sharpeRatio',
    'sortinoRatio',
    'maxDrawdown',
    'volatility',
  ];
  
  const rankings = metricsToRank.map(metric => {
    const values = comparisons.map(c => ({
      fundId: c.fundId,
      value: (c.metrics as Record<string, number | null>)[metric],
    }));
    
    // Sort (higher is better, except for maxDrawdown and volatility)
    const ascending = ['maxDrawdown', 'volatility'].includes(metric);
    values.sort((a, b) => {
      if (a.value === null) return 1;
      if (b.value === null) return -1;
      return ascending ? a.value - b.value : b.value - a.value;
    });
    
    return {
      metric,
      rankings: values.map((v, i) => ({ ...v, rank: i + 1 })),
    };
  });
  
  // Generate insights
  const insights = generateInsights(comparisons, matrix);
  
  return {
    generatedAt: new Date(),
    funds: comparisons,
    correlationMatrix: matrix,
    rankings,
    insights,
  };
}

/**
 * Find funds similar to a target fund
 * 
 * @param targetFund - Target fund data
 * @param targetReturns - Target fund returns
 * @param candidateFunds - Pool of candidate funds
 * @param candidateReturns - Returns for candidates
 * @param limit - Maximum number of results
 * @returns Array of similar funds with scores
 */
export function findSimilarFunds(
  targetFund: FundData,
  targetReturns: MonthlyReturn[],
  candidateFunds: FundData[],
  candidateReturns: FundReturns[],
  limit: number = 5
): SimilarFund[] {
  const returnsMap = new Map(candidateReturns.map(cr => [cr.fundId, cr.returns]));
  
  const scored = candidateFunds
    .filter(f => f.id !== targetFund.id) // Exclude self
    .map(fund => {
      const returns = returnsMap.get(fund.id) ?? [];
      const matchReasons: string[] = [];
      let score = 0;
      
      // Strategy match (weight: 30%)
      if (fund.strategy && fund.strategy === targetFund.strategy) {
        score += 30;
        matchReasons.push('Same strategy');
      } else if (fund.subStrategy && fund.subStrategy === targetFund.subStrategy) {
        score += 20;
        matchReasons.push('Similar sub-strategy');
      }
      
      // Type match (weight: 20%)
      if (fund.type === targetFund.type) {
        score += 20;
        matchReasons.push('Same fund type');
      }
      
      // AUM similarity (weight: 15%)
      if (fund.aum && targetFund.aum) {
        const aumRatio = Math.min(fund.aum, targetFund.aum) / Math.max(fund.aum, targetFund.aum);
        if (aumRatio > 0.5) {
          score += 15 * aumRatio;
          matchReasons.push('Similar AUM');
        }
      }
      
      // Correlation (weight: 35%)
      const correlation = calculateCorrelation(targetReturns, returns);
      if (correlation !== null) {
        // High positive correlation indicates similar behavior
        const corrScore = Math.max(0, correlation) * 35;
        score += corrScore;
        if (correlation > 0.7) {
          matchReasons.push(`High correlation (${(correlation * 100).toFixed(0)}%)`);
        } else if (correlation > 0.4) {
          matchReasons.push(`Moderate correlation (${(correlation * 100).toFixed(0)}%)`);
        }
      }
      
      return {
        fundId: fund.id,
        fundName: fund.name,
        similarityScore: score,
        matchReasons,
      };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);
  
  return scored;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get number of months in current year up to current month
 */
function getMonthsYTD(): number {
  return new Date().getMonth() + 1;
}

/**
 * Calculate Omega ratio
 * Omega = Sum of gains above threshold / |Sum of losses below threshold|
 */
function calculateOmega(returns: MonthlyReturn[], threshold: number = 0): number | null {
  if (returns.length === 0) return null;
  
  const monthlyThreshold = threshold / 12;
  let gains = 0;
  let losses = 0;
  
  for (const r of returns) {
    const excess = r - monthlyThreshold;
    if (excess > 0) {
      gains += excess;
    } else {
      losses += Math.abs(excess);
    }
  }
  
  if (losses === 0) return null; // Would be infinite
  return gains / losses;
}

/**
 * Calculate up/down capture ratios
 */
function calculateCaptureRatios(
  fundReturns: MonthlyReturn[],
  benchmarkReturns: MonthlyReturn[]
): { up: number | null; down: number | null } {
  const minLength = Math.min(fundReturns.length, benchmarkReturns.length);
  if (minLength < 2) return { up: null, down: null };
  
  const alignedFund = fundReturns.slice(-minLength);
  const alignedBenchmark = benchmarkReturns.slice(-minLength);
  
  const upMonths: { fund: number[]; benchmark: number[] } = { fund: [], benchmark: [] };
  const downMonths: { fund: number[]; benchmark: number[] } = { fund: [], benchmark: [] };
  
  for (let i = 0; i < minLength; i++) {
    if (alignedBenchmark[i] >= 0) {
      upMonths.fund.push(alignedFund[i]);
      upMonths.benchmark.push(alignedBenchmark[i]);
    } else {
      downMonths.fund.push(alignedFund[i]);
      downMonths.benchmark.push(alignedBenchmark[i]);
    }
  }
  
  // Up capture = (fund up return / benchmark up return) * 100
  const upCapture = upMonths.benchmark.length > 0 && mean(upMonths.benchmark) !== 0
    ? ((mean(upMonths.fund) ?? 0) / (mean(upMonths.benchmark) ?? 1)) * 100
    : null;
  
  // Down capture = (fund down return / benchmark down return) * 100
  const downCapture = downMonths.benchmark.length > 0 && mean(downMonths.benchmark) !== 0
    ? ((mean(downMonths.fund) ?? 0) / (mean(downMonths.benchmark) ?? 1)) * 100
    : null;
  
  return { up: upCapture, down: downCapture };
}

/**
 * Generate textual insights from comparison data
 */
function generateInsights(
  comparisons: FundComparison[],
  correlationMatrix: number[][]
): string[] {
  const insights: string[] = [];
  
  if (comparisons.length === 0) return insights;
  
  // Best performer by CAGR
  const sortedByCAGR = [...comparisons]
    .filter(c => c.metrics.cagr !== null)
    .sort((a, b) => (b.metrics.cagr ?? 0) - (a.metrics.cagr ?? 0));
  
  if (sortedByCAGR.length > 0) {
    const best = sortedByCAGR[0];
    insights.push(
      `${best.fundName} has the highest annualized return (CAGR: ${((best.metrics.cagr ?? 0) * 100).toFixed(2)}%).`
    );
  }
  
  // Best risk-adjusted (Sharpe)
  const sortedBySharpe = [...comparisons]
    .filter(c => c.metrics.sharpeRatio !== null)
    .sort((a, b) => (b.metrics.sharpeRatio ?? 0) - (a.metrics.sharpeRatio ?? 0));
  
  if (sortedBySharpe.length > 0) {
    const best = sortedBySharpe[0];
    insights.push(
      `${best.fundName} offers the best risk-adjusted returns (Sharpe: ${(best.metrics.sharpeRatio ?? 0).toFixed(2)}).`
    );
  }
  
  // Lowest drawdown
  const sortedByDD = [...comparisons]
    .filter(c => c.metrics.maxDrawdown !== null)
    .sort((a, b) => (b.metrics.maxDrawdown ?? -1) - (a.metrics.maxDrawdown ?? -1));
  
  if (sortedByDD.length > 0) {
    const best = sortedByDD[0];
    insights.push(
      `${best.fundName} has experienced the smallest maximum drawdown (${((best.metrics.maxDrawdown ?? 0) * 100).toFixed(2)}%).`
    );
  }
  
  // Correlation insights
  if (correlationMatrix.length >= 2) {
    let highCorr = { i: 0, j: 1, value: correlationMatrix[0][1] };
    let lowCorr = { i: 0, j: 1, value: correlationMatrix[0][1] };
    
    for (let i = 0; i < correlationMatrix.length; i++) {
      for (let j = i + 1; j < correlationMatrix.length; j++) {
        const corr = correlationMatrix[i][j];
        if (corr > highCorr.value) highCorr = { i, j, value: corr };
        if (corr < lowCorr.value) lowCorr = { i, j, value: corr };
      }
    }
    
    if (highCorr.value > 0.7 && comparisons[highCorr.i] && comparisons[highCorr.j]) {
      insights.push(
        `${comparisons[highCorr.i].fundName} and ${comparisons[highCorr.j].fundName} are highly correlated (${(highCorr.value * 100).toFixed(0)}%), suggesting similar market exposure.`
      );
    }
    
    if (lowCorr.value < 0.3 && comparisons[lowCorr.i] && comparisons[lowCorr.j]) {
      insights.push(
        `${comparisons[lowCorr.i].fundName} and ${comparisons[lowCorr.j].fundName} have low correlation (${(lowCorr.value * 100).toFixed(0)}%), offering potential diversification benefits.`
      );
    }
  }
  
  return insights;
}
