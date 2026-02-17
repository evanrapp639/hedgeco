"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  TrendingUp,
  Building2,
  Calendar,
  Star,
  Scale,
  MessageSquare,
  Settings,
  User,
  LogOut,
  X,
  ChevronRight,
  LayoutDashboard,
  FileText,
  HelpCircle,
  Shield,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { href: "/", label: "Home", icon: <Home className="h-5 w-5" /> },
  { href: "/funds", label: "Browse Funds", icon: <TrendingUp className="h-5 w-5" /> },
  { href: "/service-providers", label: "Service Providers", icon: <Building2 className="h-5 w-5" /> },
  { href: "/conferences", label: "Conferences", icon: <Calendar className="h-5 w-5" /> },
];

const userNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: "/dashboard/watchlist", label: "Watchlist", icon: <Star className="h-5 w-5" /> },
  { href: "/compare", label: "Compare Funds", icon: <Scale className="h-5 w-5" /> },
  { href: "/messages", label: "Messages", icon: <MessageSquare className="h-5 w-5" />, badge: 3 },
];

const settingsItems: NavItem[] = [
  { href: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  { href: "/settings/notifications", label: "Notifications", icon: <MessageSquare className="h-5 w-5" /> },
  { href: "/help", label: "Help & Support", icon: <HelpCircle className="h-5 w-5" /> },
  { href: "/privacy", label: "Privacy Policy", icon: <Shield className="h-5 w-5" /> },
];

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href ||
      (item.href !== "/" && pathname.startsWith(item.href));

    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={cn(
          "flex items-center justify-between px-4 py-3 rounded-lg transition-colors",
          "active:bg-slate-100 touch-manipulation",
          isActive
            ? "bg-blue-50 text-blue-600"
            : "text-slate-700 hover:bg-slate-50"
        )}
      >
        <div className="flex items-center gap-3">
          {item.icon}
          <span className="font-medium">{item.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {item.badge && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
              {item.badge}
            </span>
          )}
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </div>
      </Link>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
        <SheetHeader className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold text-slate-900">
              Menu
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="-mr-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* User section */}
          {isAuthenticated && user && (
            <div className="px-4 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">
                    {user.profile?.firstName} {user.profile?.lastName}
                  </p>
                  <p className="text-sm text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Main navigation */}
          <div className="p-3">
            <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Browse
            </p>
            <nav className="space-y-1">
              {mainNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </nav>
          </div>

          {/* User navigation */}
          {isAuthenticated && (
            <div className="p-3 border-t border-slate-100">
              <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Your Account
              </p>
              <nav className="space-y-1">
                {userNavItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </nav>
            </div>
          )}

          {/* Settings */}
          <div className="p-3 border-t border-slate-100">
            <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Settings
            </p>
            <nav className="space-y-1">
              {settingsItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </nav>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          {isAuthenticated ? (
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          ) : (
            <div className="space-y-2">
              <Button className="w-full" asChild>
                <Link href="/login" onClick={onClose}>
                  Sign In
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/register" onClick={onClose}>
                  Create Account
                </Link>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
