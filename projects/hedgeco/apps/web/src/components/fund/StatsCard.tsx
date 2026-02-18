"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  TrendingDown,
  HelpCircle,
  Activity,
  DollarSign,
  BarChart3,
  Target,
} from "lucide-react";

// Generic type to handle Prisma Decimal, number, string, or null
type NumericValue = number | string | { toString(): string } | null | undefined;

interface FundStatistics {
  ytdReturn?: NumericValue;
  volatility?: NumericValue;
  sharpeRatio?: NumericValue;
  sortinoRatio?: NumericValue;
  maxDrawdown?: NumericValue;
  cagr?: NumericValue;
  totalReturn?: NumericValue;
  oneYearReturn?: NumericValue;
  threeYearReturn?: NumericValue;
  alpha?: NumericValue;
  beta?: NumericValue;
  [key: string]: unknown; // Allow additional properties from Prisma
}

interface StatsCardProps {
  aum?: NumericValue;
  aumDate?: string | Date | null;
  statistics?: FundStatistics | null;
  className?: string;
}

const metricInfo = {
  aum: {
    label: "Assets Under Management",
    tooltip: "Total market value of assets the fund manages on behalf of investors.",
    icon: DollarSign,
  },
  ytdReturn: {
    label: "YTD Return",
    tooltip: "Year-to-date performance. The fund's total return from January 1st to today.",
    icon: TrendingUp,
  },
  volatility: {
    label: "Volatility",
    tooltip: "Annualized standard deviation of returns. Higher values indicate more risk and potential price swings.",
    icon: Activity,
  },
  sharpeRatio: {
    label: "Sharpe Ratio",
    tooltip: "Risk-adjusted return metric. Values > 1 are good, > 2 are very good, > 3 are excellent.",
    icon: Target,
  },
  maxDrawdown: {
    label: "Max Drawdown",
    tooltip: "The largest peak-to-trough decline in the fund's history. Indicates worst-case historical loss.",
    icon: BarChart3,
  },
  cagr: {
    label: "CAGR",
    tooltip: "Compound Annual Growth Rate. The mean annual growth rate over a specified period.",
    icon: TrendingUp,
  },
};

function toNumber(value: NumericValue): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  // Handle Prisma Decimal or any object with toString()
  if (typeof value === "object" && "toString" in value) {
    const num = parseFloat(value.toString());
    return isNaN(num) ? null : num;
  }
  return null;
}

function formatCurrency(amount: NumericValue): string {
  const num = toNumber(amount);
  if (num === null) return "—";
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(0)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
  return `$${num.toLocaleString()}`;
}

function formatPercent(value: NumericValue, includeSign = true): string {
  const num = toNumber(value);
  if (num === null) return "—";
  const sign = includeSign && num > 0 ? "+" : "";
  return `${sign}${(num * 100).toFixed(2)}%`;
}

function formatRatio(value: NumericValue): string {
  const num = toNumber(value);
  if (num === null) return "—";
  return num.toFixed(2);
}

function getReturnColor(value: NumericValue): string {
  const num = toNumber(value);
  if (num === null) return "text-slate-400";
  if (num > 0.1) return "text-emerald-500"; // > 10%
  if (num > 0) return "text-green-500";
  if (num < -0.1) return "text-red-600"; // < -10%
  if (num < 0) return "text-red-500";
  return "text-slate-600";
}

function getSharpeColor(value: NumericValue): string {
  const num = toNumber(value);
  if (num === null) return "text-slate-400";
  if (num >= 3) return "text-emerald-500";
  if (num >= 2) return "text-green-500";
  if (num >= 1) return "text-blue-500";
  if (num >= 0) return "text-slate-600";
  return "text-red-500";
}

interface StatItemProps {
  label: string;
  value: string;
  tooltip: string;
  colorClass?: string;
  subtext?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | null;
}

function StatItem({ label, value, tooltip, colorClass = "text-slate-900", subtext, icon: Icon, trend }: StatItemProps) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative p-4 rounded-xl border border-slate-100 bg-white/50 backdrop-blur-sm hover:border-slate-200 hover:shadow-sm transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
              <Icon className="h-4 w-4" />
            </div>
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <button className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
                    {label}
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px] text-sm">
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {trend && (
            <div className={`${trend === "up" ? "text-green-500" : "text-red-500"}`}>
              {trend === "up" ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </div>
          )}
        </div>
        <div className={`text-2xl font-bold tracking-tight ${colorClass}`}>
          {value}
        </div>
        {subtext && (
          <div className="text-xs text-slate-400 mt-1">{subtext}</div>
        )}
      </div>
    </div>
  );
}

export function StatsCard({ aum, aumDate, statistics, className }: StatsCardProps) {
  const ytdValue = statistics?.ytdReturn;
  const ytdNum = toNumber(ytdValue);
  const ytdTrend = ytdNum !== null ? (ytdNum >= 0 ? "up" : "down") : null;

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Key Metrics</h3>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
            Live Data
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatItem
            label={metricInfo.aum.label}
            value={formatCurrency(aum)}
            tooltip={metricInfo.aum.tooltip}
            icon={metricInfo.aum.icon}
            subtext={aumDate ? `as of ${new Date(aumDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : undefined}
          />
          <StatItem
            label={metricInfo.ytdReturn.label}
            value={formatPercent(ytdValue)}
            tooltip={metricInfo.ytdReturn.tooltip}
            colorClass={getReturnColor(ytdValue)}
            icon={metricInfo.ytdReturn.icon}
            trend={ytdTrend}
          />
          <StatItem
            label={metricInfo.volatility.label}
            value={formatPercent(statistics?.volatility, false)}
            tooltip={metricInfo.volatility.tooltip}
            icon={metricInfo.volatility.icon}
          />
          <StatItem
            label={metricInfo.sharpeRatio.label}
            value={formatRatio(statistics?.sharpeRatio)}
            tooltip={metricInfo.sharpeRatio.tooltip}
            colorClass={getSharpeColor(statistics?.sharpeRatio)}
            icon={metricInfo.sharpeRatio.icon}
          />
        </div>

        {/* Secondary metrics row */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Max Drawdown</div>
            <div className={`text-lg font-semibold ${statistics?.maxDrawdown ? "text-red-500" : "text-slate-400"}`}>
              {formatPercent(statistics?.maxDrawdown)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">CAGR</div>
            <div className={`text-lg font-semibold ${getReturnColor(statistics?.cagr)}`}>
              {formatPercent(statistics?.cagr)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Sortino Ratio</div>
            <div className={`text-lg font-semibold ${getSharpeColor(statistics?.sortinoRatio)}`}>
              {formatRatio(statistics?.sortinoRatio)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StatsCard;
