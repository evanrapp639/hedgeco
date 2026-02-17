"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsWidgetProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  format?: "number" | "currency" | "percent";
  loading?: boolean;
}

export function StatsWidget({
  label,
  value,
  change,
  changeLabel = "vs last period",
  icon,
  loading = false,
}: StatsWidgetProps) {
  const trend = change !== undefined 
    ? (change > 0 ? "up" : change < 0 ? "down" : "neutral") 
    : undefined;
    
  const TrendIcon = trend === "up" 
    ? TrendingUp 
    : trend === "down" 
    ? TrendingDown 
    : Minus;

  if (loading) {
    return (
      <div className="h-full flex flex-col justify-center">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-24 bg-slate-200 rounded" />
          <div className="h-10 w-32 bg-slate-200 rounded" />
          <div className="h-3 w-20 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-2">
        {icon && (
          <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
            {icon}
          </div>
        )}
        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>
      
      <div className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
        {value}
      </div>
      
      {change !== undefined && (
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            trend === "up" ? "text-emerald-600" : 
            trend === "down" ? "text-red-600" : "text-slate-500"
          )}>
            <TrendIcon className="h-3.5 w-3.5" />
            {change > 0 ? "+" : ""}{change.toFixed(1)}%
          </div>
          <span className="text-xs text-slate-400">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}

export default StatsWidget;
