"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface QuickLink {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  color?: string;
}

interface QuickLinksWidgetProps {
  links: QuickLink[];
  columns?: 2 | 3 | 4;
  loading?: boolean;
  className?: string;
}

export function QuickLinksWidget({
  links,
  columns = 2,
  loading = false,
  className,
}: QuickLinksWidgetProps) {
  if (loading) {
    return (
      <div className={cn(
        "h-full grid gap-2",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3",
        columns === 4 && "grid-cols-4",
        className
      )}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-slate-200 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(
      "h-full grid gap-2 content-start",
      columns === 2 && "grid-cols-2",
      columns === 3 && "grid-cols-3",
      columns === 4 && "grid-cols-4",
      className
    )}>
      {links.map((link) => (
        <Link
          key={link.id}
          href={link.href}
          className={cn(
            "flex flex-col items-center justify-center p-3 rounded-lg transition-all",
            "hover:shadow-md hover:scale-105 active:scale-95",
            "bg-slate-50 hover:bg-slate-100",
            link.color
          )}
        >
          <div className={cn(
            "p-2 rounded-lg mb-2",
            link.color || "bg-blue-100 text-blue-600"
          )}>
            {link.icon}
          </div>
          <span className="text-xs font-medium text-slate-700 text-center line-clamp-2">
            {link.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default QuickLinksWidget;
