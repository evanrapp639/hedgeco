"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  onClick?: () => void;
  href?: string;
}

interface ListWidgetProps {
  items: ListItem[];
  emptyMessage?: string;
  showArrows?: boolean;
  loading?: boolean;
  maxItems?: number;
  className?: string;
}

export function ListWidget({
  items,
  emptyMessage = "No items",
  showArrows = true,
  loading = false,
  maxItems,
  className,
}: ListWidgetProps) {
  if (loading) {
    return (
      <div className={cn("h-full", className)}>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-200 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-24 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayItems = maxItems ? items.slice(0, maxItems) : items;

  if (items.length === 0) {
    return (
      <div className={cn("h-full flex items-center justify-center text-slate-400", className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="space-y-1 pr-4">
        {displayItems.map((item) => {
          const content = (
            <div 
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg transition-colors",
                (item.onClick || item.href) && "hover:bg-slate-50 cursor-pointer"
              )}
              onClick={item.onClick}
            >
              {item.icon && (
                <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                  {item.icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-slate-900 truncate">
                    {item.title}
                  </span>
                  {item.badge && (
                    <Badge variant={item.badgeVariant || "secondary"} className="text-xs shrink-0">
                      {item.badge}
                    </Badge>
                  )}
                </div>
                {item.subtitle && (
                  <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                )}
              </div>
              {showArrows && (item.onClick || item.href) && (
                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
              )}
            </div>
          );

          if (item.href) {
            return (
              <a key={item.id} href={item.href} className="block">
                {content}
              </a>
            );
          }

          return <div key={item.id}>{content}</div>;
        })}
      </div>
    </ScrollArea>
  );
}

export default ListWidget;
