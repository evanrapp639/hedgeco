"use client";

import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowerCountProps {
  count: number;
  label?: string;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "default" | "lg";
}

function formatCount(count: number): string {
  if (count >= 1e6) return `${(count / 1e6).toFixed(1)}M`;
  if (count >= 1e3) return `${(count / 1e3).toFixed(1)}K`;
  return count.toString();
}

export function FollowerCount({
  count,
  label = "followers",
  className,
  showIcon = true,
  size = "default",
}: FollowerCountProps) {
  const sizeClasses = {
    sm: "text-xs gap-1",
    default: "text-sm gap-1.5",
    lg: "text-base gap-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className={cn(
      "flex items-center text-slate-600",
      sizeClasses[size],
      className
    )}>
      {showIcon && <Users className={cn("text-slate-400", iconSizes[size])} />}
      <span className="font-semibold text-slate-900">{formatCount(count)}</span>
      <span>{label}</span>
    </div>
  );
}

export default FollowerCount;
