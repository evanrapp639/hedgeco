"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/components/notifications";
import { useAuth } from "@/contexts/AuthContext";
import { TrendingUp, Menu, Search, X } from "lucide-react";

interface MobileHeaderProps {
  onMenuClick?: () => void;
  className?: string;
  showSearch?: boolean;
}

export function MobileHeader({
  onMenuClick,
  className,
  showSearch = true,
}: MobileHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/funds?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-white border-b border-slate-200 md:hidden",
        "safe-area-inset-top",
        className
      )}
    >
      {/* Search overlay */}
      {isSearchOpen && (
        <div className="absolute inset-0 bg-white z-50 flex items-center px-4 gap-2">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
            <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search funds, managers..."
              className="flex-1 h-14 bg-transparent text-base outline-none placeholder:text-slate-400"
            />
          </form>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery("");
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Normal header */}
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="-ml-2"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </Button>
          <Link href="/" className="flex items-center gap-1.5">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold text-slate-900">HedgeCo</span>
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {showSearch && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          )}
          {isAuthenticated && <NotificationDropdown />}
        </div>
      </div>
    </header>
  );
}
