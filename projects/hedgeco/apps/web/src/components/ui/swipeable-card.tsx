"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Trash2, Star, MessageSquare, Bookmark, BookmarkCheck, Send, StarOff } from "lucide-react";

interface SwipeAction {
  icon: React.ReactNode;
  label: string;
  color: string;
  textColor?: string;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  className?: string;
  disabled?: boolean;
  swipeThreshold?: number;
  maxSwipe?: number;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = { 
    icon: <Trash2 className="h-5 w-5" />, 
    label: "Delete", 
    color: "bg-red-500",
    textColor: "text-white"
  },
  rightAction = { 
    icon: <Star className="h-5 w-5" />, 
    label: "Save", 
    color: "bg-green-500",
    textColor: "text-white"
  },
  className,
  disabled = false,
  swipeThreshold = 80,
  maxSwipe = 120,
}: SwipeableCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [startX, setStartX] = React.useState(0);
  const [currentX, setCurrentX] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isTriggered, setIsTriggered] = React.useState<"left" | "right" | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
    setIsTriggered(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    const diff = e.touches[0].clientX - startX;
    const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    setCurrentX(clampedDiff);

    // Haptic feedback when threshold is crossed
    if (Math.abs(clampedDiff) >= swipeThreshold) {
      if (clampedDiff > 0 && isTriggered !== "right") {
        setIsTriggered("right");
        vibrate();
      } else if (clampedDiff < 0 && isTriggered !== "left") {
        setIsTriggered("left");
        vibrate();
      }
    } else {
      setIsTriggered(null);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || disabled) return;

    if (currentX > swipeThreshold && onSwipeRight) {
      // Animate out before calling action
      animateOut("right", onSwipeRight);
    } else if (currentX < -swipeThreshold && onSwipeLeft) {
      animateOut("left", onSwipeLeft);
    } else {
      setCurrentX(0);
    }

    setIsDragging(false);
    setIsTriggered(null);
  };

  const animateOut = (direction: "left" | "right", callback: () => void) => {
    const card = cardRef.current;
    if (!card) {
      callback();
      return;
    }

    card.style.transition = "transform 0.2s ease-out, opacity 0.2s ease-out";
    card.style.transform = `translateX(${direction === "right" ? "100%" : "-100%"})`;
    card.style.opacity = "0";

    setTimeout(() => {
      callback();
      // Reset for potential re-render
      card.style.transition = "";
      card.style.transform = "";
      card.style.opacity = "";
      setCurrentX(0);
    }, 200);
  };

  const vibrate = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
  };

  const translateX = currentX;
  const leftOpacity = Math.min(1, -currentX / swipeThreshold);
  const rightOpacity = Math.min(1, currentX / swipeThreshold);
  const leftScale = 0.8 + Math.min(0.2, (-currentX / maxSwipe) * 0.2);
  const rightScale = 0.8 + Math.min(0.2, (currentX / maxSwipe) * 0.2);

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      {/* Left action background (swipe right to reveal - SAVE) */}
      {onSwipeRight && (
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex items-center justify-start px-6",
            rightAction.color,
            rightAction.textColor || "text-white"
          )}
          style={{
            opacity: rightOpacity,
            width: Math.max(0, translateX),
          }}
        >
          <div
            className="flex items-center gap-3 transition-transform"
            style={{ transform: `scale(${rightScale})` }}
          >
            {rightAction.icon}
            <span className="text-sm font-semibold whitespace-nowrap">
              {rightAction.label}
            </span>
          </div>
        </div>
      )}

      {/* Right action background (swipe left to reveal - INQUIRE) */}
      {onSwipeLeft && (
        <div
          className={cn(
            "absolute inset-y-0 right-0 flex items-center justify-end px-6",
            leftAction.color,
            leftAction.textColor || "text-white"
          )}
          style={{
            opacity: leftOpacity,
            width: Math.max(0, -translateX),
          }}
        >
          <div
            className="flex items-center gap-3 transition-transform"
            style={{ transform: `scale(${leftScale})` }}
          >
            <span className="text-sm font-semibold whitespace-nowrap">
              {leftAction.label}
            </span>
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
          "relative bg-white border border-slate-200 rounded-xl shadow-sm",
          !isDragging && "transition-transform duration-300 ease-out",
          isDragging && "cursor-grabbing select-none",
          isTriggered && "shadow-lg"
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

// Premium fund card with swipe actions for save/inquire
interface SwipeableFundCardProps {
  id: string;
  name: string;
  strategy: string;
  ytdReturn: number;
  mtdReturn: number;
  aum: number;
  isSaved?: boolean;
  onSave?: () => void;
  onUnsave?: () => void;
  onInquire?: () => void;
  onClick?: () => void;
}

export function SwipeableFundCard({
  id,
  name,
  strategy,
  ytdReturn,
  mtdReturn,
  aum,
  isSaved = false,
  onSave,
  onUnsave,
  onInquire,
  onClick,
}: SwipeableFundCardProps) {
  const formatAum = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}B`;
    return `$${value}M`;
  };

  return (
    <SwipeableCard
      onSwipeLeft={onInquire}
      onSwipeRight={isSaved ? onUnsave : onSave}
      leftAction={{
        icon: <Send className="h-5 w-5" />,
        label: "Inquire",
        color: "bg-blue-500",
      }}
      rightAction={{
        icon: isSaved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />,
        label: isSaved ? "Unsave" : "Save",
        color: isSaved ? "bg-amber-500" : "bg-emerald-500",
      }}
    >
      <div
        onClick={onClick}
        className="p-4 cursor-pointer active:bg-slate-50 touch-manipulation"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 truncate">{name}</h3>
              {isSaved && (
                <Bookmark className="h-4 w-4 text-amber-500 fill-amber-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-slate-500">{strategy}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400 font-medium">YTD</p>
            <p
              className={cn(
                "text-lg font-bold tabular-nums",
                ytdReturn >= 0 ? "text-emerald-600" : "text-red-600"
              )}
            >
              {ytdReturn >= 0 ? "+" : ""}
              {ytdReturn.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">MTD</p>
            <p
              className={cn(
                "text-lg font-bold tabular-nums",
                mtdReturn >= 0 ? "text-emerald-600" : "text-red-600"
              )}
            >
              {mtdReturn >= 0 ? "+" : ""}
              {mtdReturn.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">AUM</p>
            <p className="text-lg font-bold text-slate-900">{formatAum(aum)}</p>
          </div>
        </div>

        {/* Swipe hint */}
        <div className="flex justify-center mt-3 pt-3 border-t border-slate-100">
          <p className="text-[10px] text-slate-400">
            Swipe left to inquire • Swipe right to {isSaved ? "unsave" : "save"}
          </p>
        </div>
      </div>
    </SwipeableCard>
  );
}

// Pull to refresh component
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  threshold = 80,
}: PullToRefreshProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isPulling, setIsPulling] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const startY = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    if (scrollTop === 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = Math.max(0, (currentY - startY.current) * 0.5);
    const cappedDiff = Math.min(diff, threshold * 1.5);
    setPullDistance(cappedDiff);

    // Prevent default scroll when pulling
    if (diff > 0) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      // Haptic feedback
      if ("vibrate" in navigator) {
        navigator.vibrate(20);
      }
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    setIsPulling(false);
  };

  const rotation = Math.min(180, (pullDistance / threshold) * 180);
  const isTriggered = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn("relative overflow-auto touch-pan-y", className)}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center",
          "transition-opacity duration-200",
          (pullDistance > 10 || isRefreshing) ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: Math.max(8, pullDistance - 40),
        }}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center",
            "border border-slate-200"
          )}
        >
          <svg
            className={cn(
              "w-5 h-5 text-blue-600 transition-transform duration-200",
              isRefreshing && "animate-spin"
            )}
            style={{
              transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
            }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? "none" : "transform 0.3s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
