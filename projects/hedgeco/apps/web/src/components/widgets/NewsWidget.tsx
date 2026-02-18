"use client";

import * as React from "react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, Clock, ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  source?: string;
  publishedAt: string;
  category?: string;
  href?: string;
  isExternal?: boolean;
}

interface NewsWidgetProps {
  items: NewsItem[];
  loading?: boolean;
  maxItems?: number;
  showSummary?: boolean;
  onViewAll?: () => void;
  className?: string;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function NewsWidget({
  items,
  loading = false,
  maxItems = 5,
  showSummary = false,
  onViewAll,
  className,
}: NewsWidgetProps) {
  if (loading) {
    return (
      <div className={cn("h-full flex flex-col", className)}>
        <div className="space-y-4 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-1/2 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn("h-full flex flex-col items-center justify-center text-center", className)}>
        <Newspaper className="h-8 w-8 text-slate-300 mb-2" />
        <p className="text-sm text-slate-500">No recent news</p>
      </div>
    );
  }

  const displayItems = items.slice(0, maxItems);

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <ScrollArea className="flex-1">
        <div className="space-y-3 pr-4">
          {displayItems.map((item) => {
            const content = (
              <div className="group">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      "text-sm font-medium text-slate-900 line-clamp-2 mb-1",
                      item.href && "group-hover:text-blue-600"
                    )}>
                      {item.title}
                      {item.isExternal && (
                        <ExternalLink className="inline h-3 w-3 ml-1 text-slate-400" />
                      )}
                    </h4>
                    {showSummary && item.summary && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                        {item.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      {item.category && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          {item.category}
                        </Badge>
                      )}
                      {item.source && <span>{item.source}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(item.publishedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );

            if (item.href) {
              if (item.isExternal) {
                return (
                  <a 
                    key={item.id} 
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {content}
                  </a>
                );
              }
              return (
                <Link 
                  key={item.id} 
                  href={item.href}
                  className="block p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {content}
                </Link>
              );
            }

            return <div key={item.id} className="p-2 -mx-2">{content}</div>;
          })}
        </div>
      </ScrollArea>
      
      {items.length > maxItems && (
        <div className="pt-2 mt-2 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-blue-600"
            onClick={onViewAll}
            asChild
          >
            <Link href="/news">
              View all news
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default NewsWidget;
