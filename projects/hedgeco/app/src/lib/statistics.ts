/**
 * HedgeCo.Net v2 - Fund Statistics Utility Functions
 *
 * Pure calculation functions for fund performance metrics.
 * These functions operate on arrays of returns (as decimals, e.g., 0.05 = 5%)
 * and do not make any database calls.
 *
 * @module statistics
 */

// ============================================================
// TYPES
// ============================================================

/** Monthly return as a decimal (e.g., 0.05 = 5%) */
export type MonthlyReturn = number;

/** Annualized return as a decimal */
export type AnnualizedReturn = number;

/** Risk-free rate as a decimal (e.g., 0.04 = 4% annual) */
export type RiskFreeRate = number;

/** Result of a statistical calculation, or null if insufficient data */
export type StatResult = number | null;

/** Options for Sharpe ratio calculation */
export interface SharpeOptions {
  /** Whether returns are already annualized (default: false, assumes monthly) */
  annualized?: boolean;
}

/** Options for Sortino ratio calculation */
export interface SortinoOptions {
  /** Whether returns are already annualized (default: false, assumes monthly) */
  annualized?: boolean;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Calculates the arithmetic mean of an array of numbers.
 *
 * @param values - Array of numbers
 * @returns Mean value, or null if array is empty
 */
export function mean(values: number[]): StatResult {
  if (values.length === 0) return null;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculates the standard deviation of an array of numbers.
 * Uses sample standard deviation (n-1 denominator).
 *
 * @param values - Array of numbers
 * @returns Standard deviation, or null if fewer than 2 values
 */
export function standardDeviation(values: number[]): StatResult {
  if (values.length < 2) return null;

  const avg = mean(values);
  if (avg === null) return null;

  const squaredDiffs = values.map((val) => Math.pow(val - avg, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1);

  return Math.sqrt(variance);
}

/**
 * Calculates the covariance between two arrays of numbers.
 *
 * @param x - First array of numbers
 * @param y - Second array of numbers
 * @returns Covariance, or null if arrays have different lengths or fewer than 2 values
 */
export function covariance(x: number[], y: number[]): StatResult {
  if (x.length !== y.length || x.length < 2) return null;

  const meanX = mean(x);
  const meanY = mean(y);
  if (meanX === null || meanY === null) return null;

  const products = x.map((xi, i) => (xi - meanX) * (y[i] - meanY));
  return products.reduce((sum, val) => sum + val, 0) / (x.length - 1);
}

// ============================================================
// MAIN STATISTICS FUNCTIONS
// ============================================================

/**
 * Calculates Compound Annual Growth Rate (CAGR).
 *
 * CAGR represents the mean annual growth rate of an investment over a specified
 * period longer than one year. It describes the rate at which an investment
 * would have grown if it had grown at a steady rate.
 *
 * Formula: CAGR = (EndValue / StartValue)^(1/years) - 1
 *
 * For return series: CAGR = ((1 + r₁)(1 + r₂)...(1 + rₙ))^(1/years) - 1
 *
 * @param returns - Array of periodic returns as decimals (e.g., [0.05, -0.02, 0.03])
 * @param years - Number of years the returns span
 * @returns CAGR as a decimal, or null if insufficient data
 *
 * @example
 * // Fund with 3 years of monthly returns
 * const monthlyReturns = [0.02, -0.01, 0.015, ...]; // 36 months
 * const cagr = calculateCAGR(monthlyReturns, 3);
 * // Returns annualized growth rate
 */
export function calculateCAGR(returns: MonthlyReturn[], years: number): StatResult {
  if (returns.length === 0 || years <= 0) return null;

  // Calculate cumulative growth factor: (1 + r₁)(1 + r₂)...(1 + rₙ)
  const cumulativeGrowth = returns.reduce((product, r) => product * (1 + r), 1);

  // Handle case where cumulative growth is negative or zero
  if (cumulativeGrowth <= 0) return null;

  // CAGR = growth^(1/years) - 1
  return Math.pow(cumulativeGrowth, 1 / years) - 1;
}

/**
 * Calculates annualized volatility from monthly returns.
 *
 * Volatility measures the dispersion of returns and is a common proxy for risk.
 * This function calculates the standard deviation of monthly returns and
 * annualizes it using the square root of time rule.
 *
 * Formula: σ_annual = σ_monthly × √12
 *
 * @param monthlyReturns - Array of monthly returns as decimals
 * @returns Annualized volatility as a decimal, or null if fewer than 2 returns
 *
 * @example
 * const monthlyReturns = [0.02, -0.01, 0.015, 0.03, -0.005, 0.01];
 * const vol = calculateVolatility(monthlyReturns);
 * // Returns annualized standard deviation (e.g., 0.15 = 15%)
 */
export function calculateVolatility(monthlyReturns: MonthlyReturn[]): StatResult {
  const monthlyStdDev = standardDeviation(monthlyReturns);
  if (monthlyStdDev === null) return null;

  // Annualize: multiply by √12 (12 months in a year)
  return monthlyStdDev * Math.sqrt(12);
}

/**
 * Calculates the Sharpe Ratio.
 *
 * The Sharpe ratio measures risk-adjusted return by dividing excess return
 * (return above the risk-free rate) by volatility. Higher values indicate
 * better risk-adjusted performance.
 *
 * Formula: Sharpe = (R_portfolio - R_f) / σ_portfolio
 *
 * For monthly returns:
 * - Annualize mean return: μ_annual = μ_monthly × 12
 * - Annualize volatility: σ_annual = σ_monthly × √12
 * - Sharpe = (μ_annual - R_f) / σ_annual
 *
 * @param returns - Array of monthly returns as decimals
 * @param riskFreeRate - Annual risk-free rate as a decimal (e.g., 0.04 = 4%)
 * @param options - Calculation options
 * @returns Sharpe ratio, or null if insufficient data or zero volatility
 *
 * @example
 * const monthlyReturns = [0.02, -0.01, 0.015, 0.03, -0.005, 0.01];
 * const riskFreeRate = 0.04; // 4% annual
 * const sharpe = calculateSharpeRatio(monthlyReturns, riskFreeRate);
 * // Returns Sharpe ratio (e.g., 1.5)
 */
export function calculateSharpeRatio(
  returns: MonthlyReturn[],
  riskFreeRate: RiskFreeRate,
  options: SharpeOptions = {}
): StatResult {
  const { annualized = false } = options;

  if (returns.length < 2) return null;

  const avgReturn = mean(returns);
  const stdDev = standardDeviation(returns);

  if (avgReturn === null || stdDev === null || stdDev === 0) return null;

  if (annualized) {
    // Returns are already annualized
    return (avgReturn - riskFreeRate) / stdDev;
  }

  // Annualize monthly returns
  const annualizedReturn = avgReturn * 12;
  const annualizedStdDev = stdDev * Math.sqrt(12);

  return (annualizedReturn - riskFreeRate) / annualizedStdDev;
}

/**
 * Calculates Maximum Drawdown.
 *
 * Maximum drawdown measures the largest peak-to-trough decline in portfolio
 * value. It represents the worst loss an investor could have experienced
 * during the period if they bought at the peak and sold at the trough.
 *
 * Formula: MDD = min((Trough - Peak) / Peak) for all peak-trough pairs
 *
 * Note: This function expects cumulative returns (growth factors), not
 * periodic returns. Convert periodic returns using:
 * cumulative[i] = (1 + r₁)(1 + r₂)...(1 + rᵢ)
 *
 * @param cumulativeReturns - Array of cumulative return values (growth factors)
 *                            Starting value should be 1.0 (or the initial NAV)
 * @returns Maximum drawdown as a negative decimal (e.g., -0.25 = 25% loss),
 *          or null if insufficient data. Returns 0 if no drawdown occurred.
 *
 * @example
 * // Convert monthly returns to cumulative
 * const monthlyReturns = [0.05, -0.10, 0.03, -0.15, 0.08];
 * let cumulative = 1;
 * const cumulativeReturns = monthlyReturns.map(r => cumulative *= (1 + r));
 * // [1.05, 0.945, 0.97335, 0.827, 0.893]
 *
 * const maxDD = calculateMaxDrawdown([1, ...cumulativeReturns]);
 * // Returns the worst peak-to-trough decline
 */
export function calculateMaxDrawdown(cumulativeReturns: number[]): StatResult {
  if (cumulativeReturns.length < 2) return null;

  let maxDrawdown = 0;
  let peak = cumulativeReturns[0];

  for (const value of cumulativeReturns) {
    if (value > peak) {
      peak = value;
    }

    const drawdown = (value - peak) / peak;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

/**
 * Calculates the Sortino Ratio.
 *
 * The Sortino ratio is similar to the Sharpe ratio but only penalizes
 * downside volatility (returns below the target). This is often preferred
 * because investors typically don't mind upside volatility.
 *
 * Formula: Sortino = (R_portfolio - R_target) / σ_downside
 *
 * Where σ_downside is the standard deviation of returns below the target.
 *
 * @param returns - Array of monthly returns as decimals
 * @param targetReturn - Annual target/minimum acceptable return as a decimal
 *                       (often the risk-free rate or 0)
 * @param options - Calculation options
 * @returns Sortino ratio, or null if insufficient data or zero downside deviation
 *
 * @example
 * const monthlyReturns = [0.02, -0.01, 0.015, 0.03, -0.005, 0.01];
 * const targetReturn = 0.04; // 4% annual minimum acceptable return
 * const sortino = calculateSortino(monthlyReturns, targetReturn);
 */
export function calculateSortino(
  returns: MonthlyReturn[],
  targetReturn: number,
  options: SortinoOptions = {}
): StatResult {
  const { annualized = false } = options;

  if (returns.length < 2) return null;

  // Convert annual target to monthly for comparison
  const monthlyTarget = annualized ? targetReturn : targetReturn / 12;

  // Calculate downside returns (returns below target)
  const downsideReturns = returns
    .map((r) => Math.min(0, r - monthlyTarget))
    .filter((r) => r < 0);

  if (downsideReturns.length === 0) {
    // No downside returns - infinite Sortino (return Infinity or a large number)
    // Following convention, we return null to indicate undefined
    return null;
  }

  // Downside deviation: sqrt of mean of squared downside returns
  const downsideSquares = returns.map((r) => Math.pow(Math.min(0, r - monthlyTarget), 2));
  const meanDownsideSquare = downsideSquares.reduce((sum, val) => sum + val, 0) / returns.length;
  const downsideDeviation = Math.sqrt(meanDownsideSquare);

  if (downsideDeviation === 0) return null;

  const avgReturn = mean(returns);
  if (avgReturn === null) return null;

  if (annualized) {
    return (avgReturn - targetReturn) / downsideDeviation;
  }

  // Annualize
  const annualizedReturn = avgReturn * 12;
  const annualizedDownside = downsideDeviation * Math.sqrt(12);

  return (annualizedReturn - targetReturn) / annualizedDownside;
}

/**
 * Calculates Beta.
 *
 * Beta measures the sensitivity of a fund's returns to benchmark returns.
 * A beta of 1 means the fund moves with the market, >1 means more volatile,
 * <1 means less volatile, and negative means inverse correlation.
 *
 * Formula: β = Cov(R_fund, R_benchmark) / Var(R_benchmark)
 *
 * @param fundReturns - Array of fund returns as decimals
 * @param benchmarkReturns - Array of benchmark returns as decimals (same period)
 * @returns Beta coefficient, or null if insufficient/mismatched data
 *
 * @example
 * const fundReturns = [0.02, -0.01, 0.03, 0.015, -0.02];
 * const spyReturns = [0.015, -0.005, 0.02, 0.01, -0.015];
 * const beta = calculateBeta(fundReturns, spyReturns);
 * // Returns beta (e.g., 1.2 means 20% more volatile than benchmark)
 */
export function calculateBeta(
  fundReturns: MonthlyReturn[],
  benchmarkReturns: MonthlyReturn[]
): StatResult {
  if (fundReturns.length !== benchmarkReturns.length || fundReturns.length < 2) {
    return null;
  }

  const cov = covariance(fundReturns, benchmarkReturns);
  const benchmarkStdDev = standardDeviation(benchmarkReturns);

  if (cov === null || benchmarkStdDev === null || benchmarkStdDev === 0) {
    return null;
  }

  // Variance = stdDev²
  const benchmarkVariance = Math.pow(benchmarkStdDev, 2);

  return cov / benchmarkVariance;
}

/**
 * Calculates Jensen's Alpha.
 *
 * Alpha measures the excess return of a fund compared to what would be
 * expected given its beta (systematic risk). Positive alpha indicates
 * the manager added value beyond market exposure.
 *
 * Formula: α = R_fund - [R_f + β × (R_benchmark - R_f)]
 *
 * This simplifies to: α = R_fund - R_f - β × (R_benchmark - R_f)
 *
 * @param fundReturn - Fund's return for the period (annualized, as decimal)
 * @param beta - Fund's beta coefficient
 * @param benchmarkReturn - Benchmark return for the period (annualized, as decimal)
 * @param riskFreeRate - Risk-free rate for the period (annualized, as decimal)
 * @returns Alpha as a decimal, or null if beta is null
 *
 * @example
 * const fundReturn = 0.12; // 12% annual return
 * const beta = 1.2;
 * const benchmarkReturn = 0.10; // 10% S&P 500 return
 * const riskFreeRate = 0.04; // 4% Treasury rate
 * const alpha = calculateAlpha(fundReturn, beta, benchmarkReturn, riskFreeRate);
 * // Returns alpha (e.g., 0.008 = 0.8% excess return)
 */
export function calculateAlpha(
  fundReturn: AnnualizedReturn,
  beta: number,
  benchmarkReturn: AnnualizedReturn,
  riskFreeRate: RiskFreeRate
): StatResult {
  if (beta === null || !isFinite(beta)) return null;

  // Expected return using CAPM
  const expectedReturn = riskFreeRate + beta * (benchmarkReturn - riskFreeRate);

  // Alpha = actual return - expected return
  return fundReturn - expectedReturn;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Converts an array of periodic returns to cumulative returns (growth factors).
 *
 * Useful for preparing data for calculateMaxDrawdown.
 *
 * @param returns - Array of periodic returns as decimals
 * @param startValue - Starting value (default: 1)
 * @returns Array of cumulative values
 *
 * @example
 * const monthly = [0.05, -0.10, 0.03];
 * const cumulative = toCumulativeReturns(monthly);
 * // [1, 1.05, 0.945, 0.97335]
 */
export function toCumulativeReturns(returns: MonthlyReturn[], startValue: number = 1): number[] {
  const cumulative: number[] = [startValue];
  let current = startValue;

  for (const r of returns) {
    current = current * (1 + r);
    cumulative.push(current);
  }

  return cumulative;
}

/**
 * Calculates total return from an array of periodic returns.
 *
 * @param returns - Array of periodic returns as decimals
 * @returns Total return as a decimal
 *
 * @example
 * const monthly = [0.05, -0.10, 0.03];
 * const total = totalReturn(monthly);
 * // Returns -0.02665 (-2.665%)
 */
export function totalReturn(returns: MonthlyReturn[]): number {
  if (returns.length === 0) return 0;
  return returns.reduce((product, r) => product * (1 + r), 1) - 1;
}

/**
 * Annualizes a monthly return using compound formula.
 *
 * Formula: (1 + r_monthly)^12 - 1
 *
 * @param monthlyReturn - Monthly return as a decimal
 * @returns Annualized return as a decimal
 */
export function annualizeMonthlyReturn(monthlyReturn: MonthlyReturn): AnnualizedReturn {
  return Math.pow(1 + monthlyReturn, 12) - 1;
}

/**
 * Converts annual return to equivalent monthly return.
 *
 * Formula: (1 + r_annual)^(1/12) - 1
 *
 * @param annualReturn - Annual return as a decimal
 * @returns Equivalent monthly return as a decimal
 */
export function toMonthlyReturn(annualReturn: AnnualizedReturn): MonthlyReturn {
  return Math.pow(1 + annualReturn, 1 / 12) - 1;
}
