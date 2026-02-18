"use client";

import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  maxCount?: number;
  showZero?: boolean;
}

export function NotificationBadge({
  count,
  className,
  maxCount = 99,
  showZero = false,
}: NotificationBadgeProps) {
  if (!showZero && count === 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <span
      className={cn(
        "absolute flex items-center justify-center",
        "min-w-[18px] h-[18px] px-1 -top-1 -right-1",
        "bg-red-500 text-white text-[10px] font-bold",
        "rounded-full animate-in zoom-in-50 duration-200",
        className
      )}
    >
      {displayCount}
    </span>
  );
}

// Dot variant for simpler indication
export function NotificationDot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "absolute top-0 right-0 w-2.5 h-2.5",
        "bg-red-500 rounded-full",
        "animate-pulse",
        className
      )}
    />
  );
}
