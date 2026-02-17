"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Trash2, Star, ExternalLink } from "lucide-react";

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon: React.ReactNode;
    label: string;
    color: string;
  };
  rightAction?: {
    icon: React.ReactNode;
    label: string;
    color: string;
  };
  className?: string;
  disabled?: boolean;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = { icon: <Trash2 className="h-5 w-5" />, label: "Delete", color: "bg-red-500" },
  rightAction = { icon: <Star className="h-5 w-5" />, label: "Save", color: "bg-green-500" },
  className,
  disabled = false,
}: SwipeableCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [startX, setStartX] = React.useState(0);
  const [currentX, setCurrentX] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 100;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    const diff = e.touches[0].clientX - startX;
    const clampedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff));
    setCurrentX(clampedDiff);
  };

  const handleTouchEnd = () => {
    if (!isDragging || disabled) return;
    
    if (currentX > SWIPE_THRESHOLD && onSwipeRight) {
      onSwipeRight();
    } else if (currentX < -SWIPE_THRESHOLD && onSwipeLeft) {
      onSwipeLeft();
    }
    
    setCurrentX(0);
    setIsDragging(false);
  };

  const translateX = currentX;
  const leftOpacity = Math.min(1, -currentX / SWIPE_THRESHOLD);
  const rightOpacity = Math.min(1, currentX / SWIPE_THRESHOLD);

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      {/* Left action background (swipe right to reveal) */}
      {onSwipeRight && (
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex items-center justify-start px-4 text-white",
            rightAction.color
          )}
          style={{
            opacity: rightOpacity,
            width: `${Math.abs(translateX)}px`,
          }}
        >
          <div className="flex items-center gap-2">
            {rightAction.icon}
            <span className="text-sm font-medium">{rightAction.label}</span>
          </div>
        </div>
      )}

      {/* Right action background (swipe left to reveal) */}
      {onSwipeLeft && (
        <div
          className={cn(
            "absolute inset-y-0 right-0 flex items-center justify-end px-4 text-white",
            leftAction.color
          )}
          style={{
            opacity: leftOpacity,
            width: `${Math.abs(translateX)}px`,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{leftAction.label}</span>
            {leftAction.icon}
          </div>
        </div>
      )}

      {/* Main card content */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "relative bg-white border border-slate-200 rounded-lg transition-transform duration-150",
          !isDragging && "transition-transform duration-300",
          isDragging && "cursor-grabbing"
        )}
        style={{
          transform: `translateX(${translateX}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Helper component for mobile fund cards with swipe actions
interface SwipeableFundCardProps {
  id: string;
  name: string;
  strategy: string;
  ytdReturn: number;
  mtdReturn: number;
  aum: number;
  onRemove?: () => void;
  onAddToWatchlist?: () => void;
  onClick?: () => void;
}

export function SwipeableFundCard({
  // id - passed in props but not directly used here
  name,
  strategy,
  ytdReturn,
  mtdReturn,
  aum,
  onRemove,
  onAddToWatchlist,
  onClick,
}: SwipeableFundCardProps) {
  return (
    <SwipeableCard
      onSwipeLeft={onRemove}
      onSwipeRight={onAddToWatchlist}
      leftAction={{ icon: <Trash2 className="h-5 w-5" />, label: "Remove", color: "bg-red-500" }}
      rightAction={{ icon: <Star className="h-5 w-5" />, label: "Watchlist", color: "bg-amber-500" }}
    >
      <div
        onClick={onClick}
        className="p-4 cursor-pointer active:bg-slate-50 touch-manipulation"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">{name}</h3>
            <p className="text-sm text-slate-500">{strategy}</p>
          </div>
          <ExternalLink className="h-4 w-4 text-slate-400" />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-500">YTD</p>
            <p className={cn(
              "font-semibold",
              ytdReturn >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {ytdReturn >= 0 ? "+" : ""}{ytdReturn}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">MTD</p>
            <p className={cn(
              "font-semibold",
              mtdReturn >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {mtdReturn >= 0 ? "+" : ""}{mtdReturn}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">AUM</p>
            <p className="font-semibold">${aum}M</p>
          </div>
        </div>
      </div>
    </SwipeableCard>
  );
}
