"use client";

import { useEffect, useState } from "react";
import { useOnlineStatus, getCacheAge } from "@/hooks/useOnlineStatus";
import { WifiOff, RefreshCw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfflineBannerProps {
  className?: string;
  showCacheAge?: boolean;
  cacheKey?: string;
}

export function OfflineBanner({ className, showCacheAge, cacheKey }: OfflineBannerProps) {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [isVisible, setIsVisible] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setIsVisible(true);
      setShowReconnected(false);
    } else if (wasOffline) {
      // Show "Back online" message briefly
      setShowReconnected(true);
      setIsVisible(true);
      
      const timer = setTimeout(() => {
        setIsVisible(false);
        setShowReconnected(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  const cacheAge = cacheKey ? getCacheAge(cacheKey) : null;
  const cacheAgeText = cacheAge ? formatCacheAge(cacheAge) : null;

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-transform duration-300",
        "safe-area-inset-top",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium",
          showReconnected
            ? "bg-emerald-500 text-white"
            : "bg-amber-500 text-white"
        )}
      >
        {showReconnected ? (
          <>
            <RefreshCw className="h-4 w-4" />
            <span>Back online! Refreshing data...</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>You&apos;re offline</span>
            {showCacheAge && cacheAgeText && (
              <span className="flex items-center gap-1 text-amber-100 text-xs">
                <Clock className="h-3 w-3" />
                Showing data from {cacheAgeText}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function formatCacheAge(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

/**
 * Component to show cached data indicator
 */
interface CachedDataIndicatorProps {
  isFromCache: boolean;
  cacheKey?: string;
  className?: string;
}

export function CachedDataIndicator({ isFromCache, cacheKey, className }: CachedDataIndicatorProps) {
  if (!isFromCache) return null;

  const cacheAge = cacheKey ? getCacheAge(cacheKey) : null;
  const cacheAgeText = cacheAge ? formatCacheAge(cacheAge) : null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md",
        className
      )}
    >
      <Clock className="h-3 w-3" />
      <span>Cached{cacheAgeText && ` (${cacheAgeText})`}</span>
    </div>
  );
}

export default OfflineBanner;
