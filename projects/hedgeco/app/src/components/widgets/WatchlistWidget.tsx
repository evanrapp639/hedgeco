"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Eye, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WatchedFund {
  id: string;
  name: string;
  slug: string;
  type: string;
  ytdReturn?: number;
  lastUpdated?: string;
}

interface WatchlistWidgetProps {
  funds: WatchedFund[];
  loading?: boolean;
  maxItems?: number;
  onViewAll?: () => void;
  className?: string;
}

export function WatchlistWidget({
  funds,
  loading = false,
  maxItems = 5,
  onViewAll,
  className,
}: WatchlistWidgetProps) {
  if (loading) {
    return (
      <div className={cn("h-full flex flex-col", className)}>
        <div className="space-y-3 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center justify-between">
              <div>
                <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-20 bg-slate-200 rounded" />
              </div>
              <div className="h-6 w-16 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (funds.length === 0) {
    return (
      <div className={cn("h-full flex flex-col items-center justify-center text-center", className)}>
        <Eye className="h-8 w-8 text-slate-300 mb-2" />
        <p className="text-sm text-slate-500 mb-3">No funds in watchlist</p>
        <Link href="/funds">
          <Button variant="outline" size="sm">
            Browse Funds
          </Button>
        </Link>
      </div>
    );
  }

  const displayFunds = funds.slice(0, maxItems);

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-4">
          {displayFunds.map((fund) => (
            <Link
              key={fund.id}
              href={`/funds/${fund.slug}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm text-slate-900 truncate">
                  {fund.name}
                </div>
                <div className="text-xs text-slate-500">{fund.type}</div>
              </div>
              {fund.ytdReturn !== undefined && (
                <div className={cn(
                  "flex items-center gap-1 text-sm font-medium shrink-0",
                  fund.ytdReturn >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {fund.ytdReturn >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {fund.ytdReturn >= 0 ? "+" : ""}{(fund.ytdReturn * 100).toFixed(1)}%
                </div>
              )}
            </Link>
          ))}
        </div>
      </ScrollArea>
      
      {funds.length > maxItems && (
        <div className="pt-2 mt-2 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-blue-600"
            onClick={onViewAll}
            asChild
          >
            <Link href="/dashboard/watchlist">
              View all {funds.length} funds
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default WatchlistWidget;
