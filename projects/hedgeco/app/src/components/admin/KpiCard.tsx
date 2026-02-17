"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
  format?: "number" | "currency" | "percent";
  loading?: boolean;
}

export function KpiCard({
  title,
  value,
  change,
  changeLabel = "vs last period",
  icon,
  trend,
  className,
  loading = false,
}: KpiCardProps) {
  const calculatedTrend = trend ?? (change !== undefined ? (change > 0 ? "up" : change < 0 ? "down" : "neutral") : undefined);
  
  const TrendIcon = calculatedTrend === "up" 
    ? TrendingUp 
    : calculatedTrend === "down" 
    ? TrendingDown 
    : Minus;

  const trendColor = calculatedTrend === "up" 
    ? "text-emerald-600 bg-emerald-50" 
    : calculatedTrend === "down" 
    ? "text-red-600 bg-red-50" 
    : "text-slate-500 bg-slate-50";

  if (loading) {
    return (
      <Card className={cn("relative overflow-hidden", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-8 w-32 bg-slate-200 rounded" />
            <div className="h-3 w-20 bg-slate-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("relative overflow-hidden group hover:shadow-lg transition-all duration-300", className)}>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                {icon}
              </div>
            )}
            <span className="text-sm font-medium text-slate-500">{title}</span>
          </div>
          {calculatedTrend && (
            <div className={cn("p-1.5 rounded-full", trendColor)}>
              <TrendIcon className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
        
        <div className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
          {value}
        </div>
        
        {change !== undefined && (
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm font-medium",
              calculatedTrend === "up" ? "text-emerald-600" : 
              calculatedTrend === "down" ? "text-red-600" : "text-slate-500"
            )}>
              {change > 0 ? "+" : ""}{change.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400">{changeLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default KpiCard;
