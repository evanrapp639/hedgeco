"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

interface LazySectionProps {
  children: React.ReactNode;
  /** Custom skeleton component to show while loading */
  skeleton?: React.ReactNode;
  /** Threshold for intersection observer (0-1) */
  threshold?: number;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Minimum height to prevent layout shift */
  minHeight?: string | number;
  /** CSS class for the container */
  className?: string;
  /** Whether to keep the component mounted after it becomes visible */
  keepMounted?: boolean;
  /** Callback when section becomes visible */
  onVisible?: () => void;
}

interface LazyChartSkeletonProps {
  height?: number;
  className?: string;
}

interface LazyTableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

interface LazyImageSkeletonProps {
  aspectRatio?: "square" | "video" | "wide";
  className?: string;
}

/**
 * Lazy loading section using Intersection Observer
 * Only renders children when the section comes into view
 */
export function LazySection({
  children,
  skeleton,
  threshold = 0.1,
  rootMargin = "100px",
  minHeight = 200,
  className,
  keepMounted = true,
  onVisible,
}: LazySectionProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasBeenVisible, setHasBeenVisible] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Skip if already visible and keepMounted
    if (hasBeenVisible && keepMounted) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setHasBeenVisible(true);
            onVisible?.();
            
            if (keepMounted) {
              observer.disconnect();
            }
          } else if (!keepMounted) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, keepMounted, hasBeenVisible, onVisible]);

  const shouldRender = keepMounted ? hasBeenVisible : isVisible;

  const defaultSkeleton = (
    <div className="space-y-3 p-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-32 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      style={{ minHeight: shouldRender ? undefined : minHeight }}
    >
      {shouldRender ? children : (skeleton || defaultSkeleton)}
    </div>
  );
}

/**
 * Skeleton specifically for chart components
 */
export function LazyChartSkeleton({ height = 300, className }: LazyChartSkeletonProps) {
  return (
    <div className={cn("space-y-4 p-4", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-1/4" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <Skeleton className="w-full" style={{ height }} />
      <div className="flex justify-center gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

/**
 * Skeleton specifically for table components with virtual scrolling hint
 */
export function LazyTableSkeleton({ 
  rows = 5, 
  columns = 4, 
  className 
}: LazyTableSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex gap-4 p-3 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 p-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              className="h-4 flex-1" 
              style={{ 
                animationDelay: `${(rowIndex * columns + colIndex) * 50}ms` 
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for images with blur-up loading effect
 */
export function LazyImageSkeleton({ 
  aspectRatio = "video", 
  className 
}: LazyImageSkeletonProps) {
  const aspectRatioClass = {
    square: "aspect-square",
    video: "aspect-video",
    wide: "aspect-[21/9]",
  };

  return (
    <Skeleton 
      className={cn(
        "w-full rounded-lg",
        aspectRatioClass[aspectRatio],
        className
      )} 
    />
  );
}

/**
 * HOC to make any component lazy loadable
 */
export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<LazySectionProps, 'children'>
) {
  return function LazyComponent(props: P) {
    return (
      <LazySection {...options}>
        <Component {...props} />
      </LazySection>
    );
  };
}

export default LazySection;
