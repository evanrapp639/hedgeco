"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  TrendingUp,
  Star,
  Scale,
  MessageSquare,
  Settings,
  Plus,
  FileText,
} from "lucide-react";

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

interface MobileNavProps {
  role?: "INVESTOR" | "MANAGER" | "SERVICE_PROVIDER" | "ADMIN";
}

export function MobileNav({ role = "INVESTOR" }: MobileNavProps) {
  const pathname = usePathname();

  const investorItems: NavItem[] = [
    { href: "/dashboard", icon: <Home className="h-5 w-5" />, label: "Home" },
    { href: "/funds", icon: <TrendingUp className="h-5 w-5" />, label: "Funds" },
    { href: "/dashboard/watchlist", icon: <Star className="h-5 w-5" />, label: "Watchlist" },
    { href: "/compare", icon: <Scale className="h-5 w-5" />, label: "Compare" },
    { href: "/messages", icon: <MessageSquare className="h-5 w-5" />, label: "Messages", badge: 3 },
  ];

  const managerItems: NavItem[] = [
    { href: "/dashboard", icon: <Home className="h-5 w-5" />, label: "Home" },
    { href: "/manager/funds", icon: <TrendingUp className="h-5 w-5" />, label: "Funds" },
    { href: "/dashboard/returns", icon: <FileText className="h-5 w-5" />, label: "Returns" },
    { href: "/messages", icon: <MessageSquare className="h-5 w-5" />, label: "Messages", badge: 7 },
    { href: "/settings", icon: <Settings className="h-5 w-5" />, label: "Settings" },
  ];

  const items = role === "MANAGER" ? managerItems : investorItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 md:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full relative touch-manipulation",
                "transition-colors duration-150",
                isActive ? "text-blue-600" : "text-slate-500"
              )}
            >
              <div className="relative">
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] mt-1 font-medium",
                isActive ? "text-blue-600" : "text-slate-500"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Floating action button for primary actions
interface MobileFABProps {
  onClick?: () => void;
  href?: string;
  icon?: React.ReactNode;
  label?: string;
  variant?: "primary" | "secondary";
}

export function MobileFAB({
  onClick,
  href,
  icon = <Plus className="h-6 w-6" />,
  label,
  variant = "primary",
}: MobileFABProps) {
  const content = (
    <div
      className={cn(
        "flex items-center justify-center gap-2 rounded-full shadow-lg",
        "min-h-[56px] min-w-[56px] touch-manipulation active:scale-95 transition-transform",
        variant === "primary" && "bg-blue-600 text-white hover:bg-blue-700",
        variant === "secondary" && "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50",
        label && "px-5"
      )}
      onClick={onClick}
    >
      {icon}
      {label && <span className="font-medium">{label}</span>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="fixed bottom-20 right-4 z-40 md:hidden">
        {content}
      </Link>
    );
  }

  return (
    <button className="fixed bottom-20 right-4 z-40 md:hidden">
      {content}
    </button>
  );
}

// Pull to refresh indicator
interface PullToRefreshProps {
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ isRefreshing, onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isPulling, setIsPulling] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const startY = React.useRef(0);

  const THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    const currentY = e.touches[0].clientY;
    const diff = Math.max(0, (currentY - startY.current) / 2);
    setPullDistance(Math.min(diff, THRESHOLD * 1.5));
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= THRESHOLD && !isRefreshing) {
      await onRefresh();
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-auto"
    >
      {/* Refresh indicator */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-opacity"
        style={{
          top: pullDistance - 40,
          opacity: pullDistance / THRESHOLD,
        }}
      >
        <div
          className={cn(
            "w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full",
            (isRefreshing || pullDistance >= THRESHOLD) && "animate-spin"
          )}
        />
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? "none" : "transform 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
