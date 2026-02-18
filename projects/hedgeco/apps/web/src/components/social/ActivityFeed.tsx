"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ActivityItem, ActivityType } from "./ActivityItem";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  entityName: string;
  entityType: "fund" | "manager" | "provider";
  entityHref: string;
  entityImage?: string;
  timestamp: Date;
  metadata?: Record<string, string | number>;
  isNew?: boolean;
}

interface ActivityFeedProps {
  initialActivities?: Activity[];
  className?: string;
  onLoadMore?: () => Promise<Activity[]>;
  hasMore?: boolean;
  loading?: boolean;
  emptyMessage?: string;
}

export function ActivityFeed({
  initialActivities = [],
  className,
  onLoadMore,
  hasMore = true,
  loading = false,
  emptyMessage = "No activity yet. Follow some funds or managers to see updates here.",
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !onLoadMore) return;
    
    setIsLoadingMore(true);
    try {
      const newActivities = await onLoadMore();
      setActivities(prev => [...prev, ...newActivities]);
    } catch (error) {
      console.error("Failed to load more activities:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, onLoadMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore]);

  // Update activities when initialActivities changes
  useEffect(() => {
    setActivities(initialActivities);
  }, [initialActivities]);

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-4 p-4 border border-slate-100 rounded-lg">
              <div className="w-10 h-10 bg-slate-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-3 bg-slate-200 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <p className="text-slate-600 max-w-sm mx-auto">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {activities.map((activity) => (
        <ActivityItem
          key={activity.id}
          {...activity}
        />
      ))}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-4">
        {isLoadingMore && (
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading more...</span>
          </div>
        )}
        {!hasMore && activities.length > 0 && (
          <p className="text-center text-sm text-slate-400">
            You've reached the end
          </p>
        )}
      </div>
    </div>
  );
}

export default ActivityFeed;
