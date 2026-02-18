"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PerformanceData {
  date: string;
  value: number;
  benchmark?: number;
}

interface PerformanceWidgetProps {
  data: PerformanceData[];
  currentValue?: number;
  previousValue?: number;
  timeRange?: "1W" | "1M" | "3M" | "6M" | "1Y" | "YTD" | "ALL";
  onTimeRangeChange?: (range: string) => void;
  showBenchmark?: boolean;
  loading?: boolean;
  className?: string;
}

const timeRanges = ["1W", "1M", "3M", "6M", "1Y", "YTD", "ALL"];

export function PerformanceWidget({
  data,
  currentValue,
  previousValue,
  timeRange = "1M",
  onTimeRangeChange,
  showBenchmark = false,
  loading = false,
  className,
}: PerformanceWidgetProps) {
  const change = currentValue && previousValue
    ? ((currentValue - previousValue) / previousValue) * 100
    : undefined;

  const isPositive = change !== undefined ? change >= 0 : true;

  if (loading) {
    return (
      <div className={cn("h-full flex flex-col", className)}>
        <div className="animate-pulse mb-4">
          <div className="h-8 w-32 bg-slate-200 rounded mb-2" />
          <div className="h-4 w-20 bg-slate-200 rounded" />
        </div>
        <div className="flex-1 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header with value and change */}
      <div className="flex items-start justify-between mb-4">
        <div>
          {currentValue !== undefined && (
            <div className="text-2xl font-bold text-slate-900">
              ${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              isPositive ? "text-emerald-600" : "text-red-600"
            )}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {isPositive ? "+" : ""}{change.toFixed(2)}%
            </div>
          )}
        </div>
        
        {/* Time range selector */}
        <div className="flex gap-1">
          {timeRanges.map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onTimeRangeChange?.(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            No performance data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: "#64748B" }}
                axisLine={{ stroke: "#E2E8F0" }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: "#64748B" }}
                axisLine={{ stroke: "#E2E8F0" }}
                tickLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                }}
                formatter={(value) => [`$${(value ?? 0).toLocaleString()}`, "Portfolio"]}
              />
              <ReferenceLine y={previousValue} stroke="#94A3B8" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="value"
                stroke={isPositive ? "#10B981" : "#EF4444"}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              {showBenchmark && (
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  stroke="#94A3B8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default PerformanceWidget;
