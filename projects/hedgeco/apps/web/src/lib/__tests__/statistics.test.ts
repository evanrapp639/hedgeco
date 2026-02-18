/**
 * Unit tests for fund statistics utility functions
 *
 * @module statistics.test
 */

import { describe, expect, it } from 'vitest';
import {
  mean,
  standardDeviation,
  covariance,
  calculateCAGR,
  calculateVolatility,
  calculateSharpeRatio,
  calculateMaxDrawdown,
  calculateSortino,
  calculateBeta,
  calculateAlpha,
  toCumulativeReturns,
  totalReturn,
  annualizeMonthlyReturn,
  toMonthlyReturn,
} from '../statistics';

// Helper to check approximate equality for floating point
const approx = (value: number | null, expected: number, precision = 6) => {
  if (value === null) {
    throw new Error(`Expected ${expected} but got null`);
  }
  expect(value).toBeCloseTo(expected, precision);
};

describe('Helper Functions', () => {
  describe('mean', () => {
    it('calculates mean correctly', () => {
      approx(mean([1, 2, 3, 4, 5]), 3);
      approx(mean([10, 20, 30]), 20);
      approx(mean([-1, 0, 1]), 0);
    });

    it('returns null for empty array', () => {
      expect(mean([])).toBeNull();
    });

    it('handles single value', () => {
      approx(mean([42]), 42);
    });

    it('handles decimals', () => {
      approx(mean([0.01, 0.02, 0.03]), 0.02);
    });
  });

  describe('standardDeviation', () => {
    it('calculates sample std dev correctly', () => {
      // Known values: [2, 4, 4, 4, 5, 5, 7, 9] has sample std dev ≈ 2.138
      approx(standardDeviation([2, 4, 4, 4, 5, 5, 7, 9]), 2.138, 3);
    });

    it('returns null for single value', () => {
      expect(standardDeviation([5])).toBeNull();
    });

    it('returns null for empty array', () => {
      expect(standardDeviation([])).toBeNull();
    });

    it('handles identical values (zero variance)', () => {
      approx(standardDeviation([5, 5, 5, 5]), 0);
    });
  });

  describe('covariance', () => {
    it('calculates covariance correctly', () => {
      // Perfect positive correlation
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      approx(covariance(x, y), 5); // Cov = 5
    });

    it('returns null for mismatched lengths', () => {
      expect(covariance([1, 2, 3], [1, 2])).toBeNull();
    });

    it('returns null for single values', () => {
      expect(covariance([1], [2])).toBeNull();
    });

    it('handles negative covariance', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [10, 8, 6, 4, 2]; // Negative relationship
      expect(covariance(x, y)).toBeLessThan(0);
    });
  });
});

describe('calculateCAGR', () => {
  it('calculates CAGR for positive returns', () => {
    // 100% gain over 2 years = ~41.4% CAGR
    // (1 + 1.0)^(1/2) - 1 = 0.414
    const returns = [0.5, 0.333333]; // 50% then 33.33% ≈ 100% total
    approx(calculateCAGR(returns, 2), 0.414, 2);
  });

  it('calculates CAGR for monthly returns', () => {
    // 12 months of 1% returns
    const monthlyReturns = Array(12).fill(0.01);
    const cagr = calculateCAGR(monthlyReturns, 1);
    // (1.01)^12 - 1 ≈ 0.1268
    approx(cagr, 0.1268, 4);
  });

  it('handles mixed positive and negative returns', () => {
    // +10%, -5%, +8% over 1 year
    const returns = [0.10, -0.05, 0.08];
    const cagr = calculateCAGR(returns, 1);
    // Total = 1.1 * 0.95 * 1.08 = 1.1286, CAGR = 12.86%
    approx(cagr, 0.1286, 4);
  });

  it('returns null for empty returns', () => {
    expect(calculateCAGR([], 1)).toBeNull();
  });

  it('returns null for zero years', () => {
    expect(calculateCAGR([0.1, 0.2], 0)).toBeNull();
  });

  it('returns null for negative cumulative (total loss)', () => {
    // -100% return wipes out investment
    expect(calculateCAGR([-1.0], 1)).toBeNull();
  });
});

describe('calculateVolatility', () => {
  it('calculates annualized volatility', () => {
    // Monthly returns with known std dev
    const monthlyReturns = [0.02, -0.01, 0.03, -0.02, 0.01, 0.02];
    const vol = calculateVolatility(monthlyReturns);

    // Manual: mean = 0.00833, variance calc, std * sqrt(12)
    expect(vol).not.toBeNull();
    expect(vol!).toBeGreaterThan(0);
  });

  it('returns higher volatility for more volatile returns', () => {
    const stable = [0.01, 0.01, 0.01, 0.01, 0.01, 0.01];
    const volatile = [0.10, -0.08, 0.12, -0.10, 0.08, -0.06];

    const stableVol = calculateVolatility(stable)!;
    const volatileVol = calculateVolatility(volatile)!;

    expect(volatileVol).toBeGreaterThan(stableVol);
  });

  it('returns null for single return', () => {
    expect(calculateVolatility([0.05])).toBeNull();
  });

  it('returns 0 for identical returns', () => {
    approx(calculateVolatility([0.02, 0.02, 0.02, 0.02]), 0);
  });
});

describe('calculateSharpeRatio', () => {
  it('calculates Sharpe ratio correctly', () => {
    // 12 months of 1% monthly returns = ~12% annual
    // Std dev = 0 for identical returns, but let's use varied returns
    const monthlyReturns = [0.02, 0.01, 0.015, 0.025, 0.01, 0.02, 0.015, 0.02, 0.01, 0.025, 0.02, 0.015];
    const riskFreeRate = 0.04; // 4% annual

    const sharpe = calculateSharpeRatio(monthlyReturns, riskFreeRate);
    expect(sharpe).not.toBeNull();
    // Should be positive (returns > risk-free rate)
    expect(sharpe!).toBeGreaterThan(0);
  });

  it('returns negative Sharpe for underperforming fund', () => {
    // Returns below risk-free rate
    const monthlyReturns = [0.001, 0.002, 0.001, 0.003, 0.001, 0.002];
    const riskFreeRate = 0.05; // 5% annual

    const sharpe = calculateSharpeRatio(monthlyReturns, riskFreeRate);
    expect(sharpe).not.toBeNull();
    expect(sharpe!).toBeLessThan(0);
  });

  it('returns null for single return', () => {
    expect(calculateSharpeRatio([0.05], 0.04)).toBeNull();
  });

  it('handles annualized returns option', () => {
    const annualReturns = [0.12, 0.08, 0.15, 0.10]; // Already annual
    const sharpe = calculateSharpeRatio(annualReturns, 0.04, { annualized: true });
    expect(sharpe).not.toBeNull();
  });
});

describe('calculateMaxDrawdown', () => {
  it('calculates max drawdown correctly', () => {
    // Peak at 1.2, trough at 0.9 = -25% drawdown
    const cumulative = [1.0, 1.1, 1.2, 1.0, 0.9, 1.0, 1.1];
    const mdd = calculateMaxDrawdown(cumulative);
    approx(mdd, -0.25, 4);
  });

  it('returns 0 for always increasing values', () => {
    const cumulative = [1.0, 1.1, 1.2, 1.3, 1.4];
    approx(calculateMaxDrawdown(cumulative), 0);
  });

  it('handles severe drawdowns', () => {
    // 50% crash
    const cumulative = [1.0, 1.2, 0.6, 0.7, 0.8];
    const mdd = calculateMaxDrawdown(cumulative);
    approx(mdd, -0.5, 4);
  });

  it('returns null for single value', () => {
    expect(calculateMaxDrawdown([1.0])).toBeNull();
  });

  it('finds worst drawdown even if later drawdowns are smaller', () => {
    // First drawdown: 1.5 -> 1.0 = -33%
    // Second drawdown: 2.0 -> 1.8 = -10%
    const cumulative = [1.0, 1.5, 1.0, 1.5, 2.0, 1.8];
    const mdd = calculateMaxDrawdown(cumulative);
    approx(mdd, -0.3333, 3);
  });
});

describe('calculateSortino', () => {
  it('calculates Sortino ratio correctly', () => {
    // Mix of positive and negative returns
    const monthlyReturns = [0.03, -0.02, 0.04, -0.01, 0.02, -0.03, 0.05, 0.01];
    const targetReturn = 0.04; // 4% annual target

    const sortino = calculateSortino(monthlyReturns, targetReturn);
    expect(sortino).not.toBeNull();
  });

  it('returns higher ratio than Sharpe when downside is limited', () => {
    // Mostly positive returns with small negatives
    const returns = [0.03, 0.02, 0.04, -0.005, 0.03, 0.025, 0.04, -0.002, 0.03, 0.035, 0.02, 0.03];
    const riskFreeRate = 0.04;

    const sharpe = calculateSharpeRatio(returns, riskFreeRate);
    const sortino = calculateSortino(returns, riskFreeRate);

    // Sortino should be higher because it ignores upside volatility
    if (sharpe !== null && sortino !== null) {
      expect(sortino).toBeGreaterThan(sharpe);
    }
  });

  it('returns null for single return', () => {
    expect(calculateSortino([0.05], 0.04)).toBeNull();
  });

  it('returns null when no downside returns exist', () => {
    // All returns above target
    const returns = [0.05, 0.06, 0.07, 0.08];
    expect(calculateSortino(returns, 0.0)).toBeNull();
  });
});

describe('calculateBeta', () => {
  it('calculates beta = 1 for identical returns', () => {
    const returns = [0.02, -0.01, 0.03, -0.02, 0.01];
    approx(calculateBeta(returns, returns), 1.0);
  });

  it('calculates beta > 1 for more volatile fund', () => {
    const benchmark = [0.01, -0.01, 0.02, -0.02, 0.01];
    const fund = [0.02, -0.02, 0.04, -0.04, 0.02]; // 2x the benchmark moves
    const beta = calculateBeta(fund, benchmark);
    approx(beta, 2.0);
  });

  it('calculates beta < 1 for less volatile fund', () => {
    const benchmark = [0.02, -0.02, 0.04, -0.04, 0.02];
    const fund = [0.01, -0.01, 0.02, -0.02, 0.01]; // Half the benchmark moves
    const beta = calculateBeta(fund, benchmark);
    approx(beta, 0.5);
  });

  it('calculates negative beta for inverse correlation', () => {
    const benchmark = [0.02, -0.01, 0.03, -0.02, 0.01];
    const fund = [-0.02, 0.01, -0.03, 0.02, -0.01]; // Inverse
    const beta = calculateBeta(fund, benchmark);
    expect(beta).toBeLessThan(0);
  });

  it('returns null for mismatched lengths', () => {
    expect(calculateBeta([0.01, 0.02], [0.01])).toBeNull();
  });

  it('returns null for single value', () => {
    expect(calculateBeta([0.01], [0.01])).toBeNull();
  });
});

describe('calculateAlpha', () => {
  it('calculates positive alpha for outperforming fund', () => {
    // Fund: 15%, Benchmark: 10%, Beta: 1.0, Rf: 4%
    // Expected = 4% + 1.0 * (10% - 4%) = 10%
    // Alpha = 15% - 10% = 5%
    const alpha = calculateAlpha(0.15, 1.0, 0.10, 0.04);
    approx(alpha, 0.05);
  });

  it('calculates negative alpha for underperforming fund', () => {
    // Fund: 8%, Benchmark: 10%, Beta: 1.0, Rf: 4%
    // Expected = 10%, Alpha = 8% - 10% = -2%
    const alpha = calculateAlpha(0.08, 1.0, 0.10, 0.04);
    approx(alpha, -0.02);
  });

  it('accounts for beta in expected return', () => {
    // Fund: 15%, Benchmark: 10%, Beta: 1.5, Rf: 4%
    // Expected = 4% + 1.5 * (10% - 4%) = 4% + 9% = 13%
    // Alpha = 15% - 13% = 2%
    const alpha = calculateAlpha(0.15, 1.5, 0.10, 0.04);
    approx(alpha, 0.02);
  });

  it('handles low beta funds', () => {
    // Fund: 8%, Benchmark: 10%, Beta: 0.5, Rf: 4%
    // Expected = 4% + 0.5 * (10% - 4%) = 4% + 3% = 7%
    // Alpha = 8% - 7% = 1%
    const alpha = calculateAlpha(0.08, 0.5, 0.10, 0.04);
    approx(alpha, 0.01);
  });

  it('returns null for invalid beta', () => {
    expect(calculateAlpha(0.10, NaN, 0.10, 0.04)).toBeNull();
    expect(calculateAlpha(0.10, Infinity, 0.10, 0.04)).toBeNull();
  });
});

describe('Utility Functions', () => {
  describe('toCumulativeReturns', () => {
    it('converts periodic returns to cumulative', () => {
      const monthly = [0.05, -0.10, 0.03];
      const cumulative = toCumulativeReturns(monthly);

      expect(cumulative).toHaveLength(4);
      approx(cumulative[0], 1.0);
      approx(cumulative[1], 1.05);
      approx(cumulative[2], 0.945);
      approx(cumulative[3], 0.97335);
    });

    it('handles custom start value', () => {
      const monthly = [0.10];
      const cumulative = toCumulativeReturns(monthly, 100);

      expect(cumulative[0]).toBe(100);
      expect(cumulative[1]).toBeCloseTo(110);
    });

    it('handles empty array', () => {
      const cumulative = toCumulativeReturns([]);
      expect(cumulative).toEqual([1]);
    });
  });

  describe('totalReturn', () => {
    it('calculates total return correctly', () => {
      // 10%, -5%, 8% = 1.1 * 0.95 * 1.08 - 1 = 0.1286
      approx(totalReturn([0.10, -0.05, 0.08]), 0.1286, 4);
    });

    it('returns 0 for empty array', () => {
      expect(totalReturn([])).toBe(0);
    });

    it('handles single return', () => {
      approx(totalReturn([0.15]), 0.15);
    });
  });

  describe('annualizeMonthlyReturn', () => {
    it('annualizes monthly return correctly', () => {
      // 1% monthly = (1.01)^12 - 1 ≈ 12.68%
      approx(annualizeMonthlyReturn(0.01), 0.1268, 4);
    });

    it('handles 0% return', () => {
      approx(annualizeMonthlyReturn(0), 0);
    });

    it('handles negative returns', () => {
      // -1% monthly = (0.99)^12 - 1 ≈ -11.36%
      approx(annualizeMonthlyReturn(-0.01), -0.1136, 4);
    });
  });

  describe('toMonthlyReturn', () => {
    it('converts annual to monthly return', () => {
      // 12% annual = (1.12)^(1/12) - 1 ≈ 0.949%
      approx(toMonthlyReturn(0.12), 0.00949, 4);
    });

    it('is inverse of annualizeMonthlyReturn', () => {
      const monthly = 0.015;
      const annual = annualizeMonthlyReturn(monthly);
      const backToMonthly = toMonthlyReturn(annual);
      approx(backToMonthly, monthly, 10);
    });
  });
});

describe('Integration Tests', () => {
  it('calculates full fund statistics from monthly returns', () => {
    // Simulated 24 months of fund returns
    const fundReturns = [
      0.02, -0.01, 0.03, 0.015, -0.02, 0.025,
      0.01, -0.005, 0.02, 0.03, -0.015, 0.02,
      0.025, -0.01, 0.015, 0.02, -0.01, 0.03,
      0.01, 0.02, -0.02, 0.025, 0.015, 0.02,
    ];

    // Benchmark (S&P 500 proxy)
    const benchmarkReturns = [
      0.015, -0.005, 0.02, 0.01, -0.015, 0.02,
      0.008, -0.003, 0.015, 0.022, -0.01, 0.015,
      0.018, -0.008, 0.012, 0.015, -0.008, 0.022,
      0.008, 0.015, -0.015, 0.02, 0.01, 0.015,
    ];

    const riskFreeRate = 0.04; // 4% annual
    const years = 2;

    // Calculate all metrics
    const cagr = calculateCAGR(fundReturns, years);
    const volatility = calculateVolatility(fundReturns);
    const sharpe = calculateSharpeRatio(fundReturns, riskFreeRate);
    const cumulative = toCumulativeReturns(fundReturns);
    const maxDD = calculateMaxDrawdown(cumulative);
    const sortino = calculateSortino(fundReturns, riskFreeRate);
    const beta = calculateBeta(fundReturns, benchmarkReturns);
    // Verify total returns are calculable
    expect(totalReturn(fundReturns)).not.toBeNull();
    expect(totalReturn(benchmarkReturns)).not.toBeNull();
    const annualizedFund = calculateCAGR(fundReturns, years);
    const annualizedBenchmark = calculateCAGR(benchmarkReturns, years);

    let alpha: number | null = null;
    if (beta !== null && annualizedFund !== null && annualizedBenchmark !== null) {
      alpha = calculateAlpha(annualizedFund, beta, annualizedBenchmark, riskFreeRate);
    }

    // All metrics should be calculable
    expect(cagr).not.toBeNull();
    expect(volatility).not.toBeNull();
    expect(sharpe).not.toBeNull();
    expect(maxDD).not.toBeNull();
    expect(sortino).not.toBeNull();
    expect(beta).not.toBeNull();
    expect(alpha).not.toBeNull();

    // Sanity checks
    expect(cagr!).toBeGreaterThan(0); // Should have positive returns
    expect(volatility!).toBeGreaterThan(0); // Should have some volatility
    expect(volatility!).toBeLessThan(1); // But not 100% annual vol
    expect(maxDD!).toBeLessThanOrEqual(0); // Max drawdown is negative or zero
    expect(beta!).toBeGreaterThan(0); // Positive correlation with benchmark
  });
});
