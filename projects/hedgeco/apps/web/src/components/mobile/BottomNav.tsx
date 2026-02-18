"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  TrendingUp,
  Star,
  MessageSquare,
  User,
  LayoutDashboard,
} from "lucide-react";

interface NavItem {
  href: string;
  icon: React.ReactNode;
  iconActive: React.ReactNode;
  label: string;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    href: "/",
    icon: <Home className="h-5 w-5" strokeWidth={1.5} />,
    iconActive: <Home className="h-5 w-5" strokeWidth={2} />,
    label: "Home",
  },
  {
    href: "/funds",
    icon: <TrendingUp className="h-5 w-5" strokeWidth={1.5} />,
    iconActive: <TrendingUp className="h-5 w-5" strokeWidth={2} />,
    label: "Funds",
  },
  {
    href: "/dashboard/watchlist",
    icon: <Star className="h-5 w-5" strokeWidth={1.5} />,
    iconActive: <Star className="h-5 w-5 fill-current" strokeWidth={2} />,
    label: "Watchlist",
  },
  {
    href: "/messages",
    icon: <MessageSquare className="h-5 w-5" strokeWidth={1.5} />,
    iconActive: <MessageSquare className="h-5 w-5" strokeWidth={2} />,
    label: "Messages",
    badge: 3,
  },
  {
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" strokeWidth={1.5} />,
    iconActive: <LayoutDashboard className="h-5 w-5" strokeWidth={2} />,
    label: "Profile",
  },
];

interface BottomNavProps {
  className?: string;
}

export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 md:hidden",
        "safe-area-inset-bottom",
        className
      )}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full relative",
                "touch-manipulation transition-colors duration-150",
                active ? "text-blue-600" : "text-slate-500 active:text-slate-700"
              )}
            >
              {/* Active indicator */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-blue-600 rounded-full" />
              )}

              {/* Icon with badge */}
              <div className="relative">
                {active ? item.iconActive : item.icon}
                {item.badge && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] mt-1",
                  active ? "font-semibold" : "font-medium"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Hook to check if bottom nav should add padding
export function useBottomNavPadding() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile ? "pb-20" : "";
}
