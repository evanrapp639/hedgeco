"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import { TrendingUp, Eye, EyeOff } from "lucide-react";

type TimePeriod = "1Y" | "3Y" | "5Y" | "MAX";

interface MonthlyReturn {
  year: number;
  month: number;
  return: number;
}

interface PerformanceChartProps {
  monthlyReturns?: MonthlyReturn[];
  fundName?: string;
  benchmarkName?: string;
  benchmarkReturns?: MonthlyReturn[];
  className?: string;
}

// Generate sample data for demonstration
function generateSampleData(years: number): MonthlyReturn[] {
  const data: MonthlyReturn[] = [];
  const currentDate = new Date();
  const startYear = currentDate.getFullYear() - years;
  
  for (let year = startYear; year <= currentDate.getFullYear(); year++) {
    const maxMonth = year === currentDate.getFullYear() ? currentDate.getMonth() : 11;
    for (let month = 0; month <= maxMonth; month++) {
      // Simulate realistic hedge fund returns
      const baseReturn = 0.005 + Math.random() * 0.02 - 0.01; // -1% to +1.5%
      data.push({
        year,
        month: month + 1,
        return: baseReturn,
      });
    }
  }
  return data;
}

function generateBenchmarkData(years: number): MonthlyReturn[] {
  const data: MonthlyReturn[] = [];
  const currentDate = new Date();
  const startYear = currentDate.getFullYear() - years;
  
  for (let year = startYear; year <= currentDate.getFullYear(); year++) {
    const maxMonth = year === currentDate.getFullYear() ? currentDate.getMonth() : 11;
    for (let month = 0; month <= maxMonth; month++) {
      // Simulate S&P 500 like returns
      const baseReturn = 0.008 + Math.random() * 0.03 - 0.015;
      data.push({
        year,
        month: month + 1,
        return: baseReturn,
      });
    }
  }
  return data;
}

function filterByPeriod(data: MonthlyReturn[], period: TimePeriod): MonthlyReturn[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  let yearsBack = 1;
  if (period === "3Y") yearsBack = 3;
  if (period === "5Y") yearsBack = 5;
  if (period === "MAX") yearsBack = 100;

  const cutoffYear = currentYear - yearsBack;
  const cutoffMonth = currentMonth;

  return data.filter((d) => {
    if (d.year > cutoffYear) return true;
    if (d.year === cutoffYear && d.month >= cutoffMonth) return true;
    return false;
  });
}

function calculateCumulativeReturns(data: MonthlyReturn[]): { date: string; fund: number; label: string }[] {
  let cumulative = 100;
  return data.map((d) => {
    cumulative = cumulative * (1 + d.return);
    const monthStr = new Date(d.year, d.month - 1).toLocaleDateString("en-US", { month: "short" });
    return {
      date: `${monthStr} ${d.year}`,
      label: `${monthStr} '${String(d.year).slice(2)}`,
      fund: cumulative,
    };
  });
}

function calculateCumulativeWithBenchmark(
  fundData: MonthlyReturn[],
  benchmarkData: MonthlyReturn[]
): { date: string; fund: number; benchmark: number; label: string }[] {
  let fundCum = 100;
  let benchCum = 100;
  
  // Create a map of benchmark returns by date
  const benchmarkMap = new Map<string, number>();
  benchmarkData.forEach((d) => {
    benchmarkMap.set(`${d.year}-${d.month}`, d.return);
  });

  return fundData.map((d) => {
    fundCum = fundCum * (1 + d.return);
    const benchReturn = benchmarkMap.get(`${d.year}-${d.month}`) || 0;
    benchCum = benchCum * (1 + benchReturn);
    
    const monthStr = new Date(d.year, d.month - 1).toLocaleDateString("en-US", { month: "short" });
    return {
      date: `${monthStr} ${d.year}`,
      label: `${monthStr} '${String(d.year).slice(2)}`,
      fund: fundCum,
      benchmark: benchCum,
    };
  });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg p-3 min-w-[160px]">
      <p className="text-xs font-medium text-slate-500 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-slate-600">{entry.name}</span>
          </div>
          <span className="text-sm font-semibold text-slate-900">
            {entry.value.toFixed(2)}
          </span>
        </div>
      ))}
      {payload.length > 1 && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Outperformance</span>
            <span className={`font-semibold ${
              payload[0].value > payload[1].value ? "text-green-600" : "text-red-600"
            }`}>
              {payload[0].value > payload[1].value ? "+" : ""}
              {(payload[0].value - payload[1].value).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function PerformanceChart({
  monthlyReturns,
  fundName = "Fund",
  benchmarkName = "S&P 500",
  benchmarkReturns,
  className,
}: PerformanceChartProps) {
  const [period, setPeriod] = useState<TimePeriod>("3Y");
  const [showBenchmark, setShowBenchmark] = useState(true);

  // Use sample data if no data provided
  const fundData = monthlyReturns || generateSampleData(5);
  const benchData = benchmarkReturns || generateBenchmarkData(5);

  const chartData = useMemo(() => {
    const filteredFund = filterByPeriod(fundData, period);
    const filteredBench = filterByPeriod(benchData, period);
    
    if (showBenchmark) {
      return calculateCumulativeWithBenchmark(filteredFund, filteredBench);
    }
    return calculateCumulativeReturns(filteredFund);
  }, [fundData, benchData, period, showBenchmark]);

  const periodButtons: TimePeriod[] = ["1Y", "3Y", "5Y", "MAX"];

  // Calculate performance metrics
  const totalReturn = chartData.length > 0 
    ? ((chartData[chartData.length - 1].fund / 100 - 1) * 100).toFixed(2)
    : "0";
  const isPositive = parseFloat(totalReturn) >= 0;

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Performance</CardTitle>
              <p className="text-sm text-slate-500">Cumulative returns (indexed to 100)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
              {isPositive ? "+" : ""}{totalReturn}%
            </span>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
              {period === "MAX" ? "All Time" : period}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          {/* Period selector */}
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50">
            {periodButtons.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  period === p
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          
          {/* Benchmark toggle */}
          <button
            onClick={() => setShowBenchmark(!showBenchmark)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all duration-200 ${
              showBenchmark
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700"
            }`}
          >
            {showBenchmark ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
            {benchmarkName}
          </button>
        </div>

        {/* Chart */}
        <div className="h-[320px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fundGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="benchmarkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e2e8f0" 
                vertical={false}
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v) => v.toFixed(0)}
                domain={["auto", "auto"]}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={100} 
                stroke="#cbd5e1" 
                strokeDasharray="5 5"
                label={{ value: "Start", position: "right", fill: "#94a3b8", fontSize: 10 }}
              />
              
              {showBenchmark && (
                <>
                  <Area
                    type="monotone"
                    dataKey="benchmark"
                    fill="url(#benchmarkGradient)"
                    stroke="transparent"
                  />
                  <Line
                    type="monotone"
                    dataKey="benchmark"
                    name={benchmarkName}
                    stroke="#94a3b8"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#94a3b8" }}
                  />
                </>
              )}
              
              <Area
                type="monotone"
                dataKey="fund"
                fill="url(#fundGradient)"
                stroke="transparent"
              />
              <Line
                type="monotone"
                dataKey="fund"
                name={fundName}
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
              />
              
              <Legend 
                verticalAlign="top" 
                align="right"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-sm text-slate-600">{value}</span>
                )}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Chart footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
          <span>Data shown reflects historical performance. Past results are not indicative of future returns.</span>
          <span>Updated: {new Date().toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default PerformanceChart;
