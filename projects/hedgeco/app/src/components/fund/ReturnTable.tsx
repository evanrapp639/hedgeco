"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

interface MonthlyReturn {
  year: number;
  month: number;
  return: number;
}

interface ReturnTableProps {
  monthlyReturns?: MonthlyReturn[];
  className?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Generate sample data for demonstration
function generateSampleData(): MonthlyReturn[] {
  const data: MonthlyReturn[] = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  for (let year = currentYear - 4; year <= currentYear; year++) {
    const maxMonth = year === currentYear ? currentDate.getMonth() : 11;
    for (let month = 0; month <= maxMonth; month++) {
      // Simulate realistic hedge fund monthly returns
      const baseReturn = Math.random() * 0.08 - 0.03; // -3% to +5%
      data.push({
        year,
        month: month + 1,
        return: baseReturn,
      });
    }
  }
  return data;
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const pct = value * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

function getHeatmapColor(value: number | null | undefined): string {
  if (value === null || value === undefined) return "bg-slate-50 text-slate-400";
  
  const pct = value * 100;
  
  // Positive returns - green scale
  if (pct >= 5) return "bg-emerald-500 text-white font-semibold";
  if (pct >= 3) return "bg-emerald-400 text-white";
  if (pct >= 2) return "bg-green-400 text-white";
  if (pct >= 1) return "bg-green-300 text-green-900";
  if (pct >= 0.5) return "bg-green-200 text-green-800";
  if (pct > 0) return "bg-green-100 text-green-700";
  
  // Zero
  if (pct === 0) return "bg-slate-100 text-slate-600";
  
  // Negative returns - red scale
  if (pct > -0.5) return "bg-red-100 text-red-700";
  if (pct > -1) return "bg-red-200 text-red-800";
  if (pct > -2) return "bg-red-300 text-red-900";
  if (pct > -3) return "bg-red-400 text-white";
  if (pct > -5) return "bg-red-500 text-white";
  return "bg-red-600 text-white font-semibold";
}

interface YearData {
  year: number;
  months: (number | null)[];
  ytd: number;
  annual: number | null;
}

function processData(returns: MonthlyReturn[]): YearData[] {
  const yearMap = new Map<number, (number | null)[]>();
  
  // Initialize with nulls
  returns.forEach((r) => {
    if (!yearMap.has(r.year)) {
      yearMap.set(r.year, Array(12).fill(null));
    }
    const months = yearMap.get(r.year)!;
    months[r.month - 1] = r.return;
  });

  // Convert to array and calculate YTD / annual
  const years = Array.from(yearMap.entries())
    .map(([year, months]) => {
      // Calculate cumulative return for non-null months
      let cumulative = 1;
      
      months.forEach((ret) => {
        if (ret !== null) {
          cumulative *= (1 + ret);
        }
      });

      const ytd = cumulative - 1;
      
      // Annual only if we have all 12 months
      const hasAllMonths = months.every((m) => m !== null);
      const annual = hasAllMonths ? ytd : null;

      return {
        year,
        months,
        ytd,
        annual,
      };
    })
    .sort((a, b) => b.year - a.year); // Most recent first

  return years;
}

export function ReturnTable({ monthlyReturns, className }: ReturnTableProps) {
  const data = monthlyReturns || generateSampleData();
  const yearData = useMemo(() => processData(data), [data]);

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Monthly Returns</CardTitle>
            <p className="text-sm text-slate-500">Heat map showing performance by month and year</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Year
                </th>
                {MONTHS.map((month) => (
                  <th
                    key={month}
                    className="px-2 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    {month}
                  </th>
                ))}
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-l border-slate-200">
                  YTD
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Annual
                </th>
              </tr>
            </thead>
            <tbody>
              {yearData.map((row, rowIdx) => (
                <tr
                  key={row.year}
                  className={`border-b border-slate-100 ${
                    rowIdx === 0 ? "bg-slate-50/30" : ""
                  } hover:bg-slate-50/50 transition-colors`}
                >
                  <td className="sticky left-0 z-10 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 border-r border-slate-100">
                    {row.year}
                    {rowIdx === 0 && (
                      <span className="ml-2 text-[10px] font-normal text-slate-400 uppercase">
                        Current
                      </span>
                    )}
                  </td>
                  {row.months.map((value, monthIdx) => (
                    <td key={monthIdx} className="px-1 py-1.5">
                      <div
                        className={`mx-auto w-full max-w-[52px] rounded-md px-1.5 py-1.5 text-center text-xs transition-all duration-200 hover:scale-105 ${getHeatmapColor(
                          value
                        )}`}
                      >
                        {value !== null ? formatPercent(value) : "—"}
                      </div>
                    </td>
                  ))}
                  <td className="px-1 py-1.5 border-l border-slate-200">
                    <div
                      className={`mx-auto w-full max-w-[60px] rounded-md px-2 py-1.5 text-center text-xs font-semibold ${getHeatmapColor(
                        row.ytd
                      )}`}
                    >
                      {formatPercent(row.ytd)}
                    </div>
                  </td>
                  <td className="px-1 py-1.5">
                    <div
                      className={`mx-auto w-full max-w-[60px] rounded-md px-2 py-1.5 text-center text-xs font-semibold ${
                        row.annual !== null
                          ? getHeatmapColor(row.annual)
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {row.annual !== null ? formatPercent(row.annual) : "—"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className="text-slate-500 font-medium">Legend:</span>
            <div className="flex items-center gap-1">
              <div className="w-6 h-5 rounded bg-red-500" />
              <span className="text-slate-600">&lt; -3%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-5 rounded bg-red-300" />
              <span className="text-slate-600">-3% to -1%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-5 rounded bg-red-100" />
              <span className="text-slate-600">-1% to 0%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-5 rounded bg-slate-100" />
              <span className="text-slate-600">0%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-5 rounded bg-green-100" />
              <span className="text-slate-600">0% to 1%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-5 rounded bg-green-300" />
              <span className="text-slate-600">1% to 3%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-5 rounded bg-emerald-500" />
              <span className="text-slate-600">&gt; 3%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ReturnTable;
