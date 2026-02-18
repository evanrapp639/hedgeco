"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu, 
  Search, 
  User, 
  LogOut, 
  Settings, 
  LayoutDashboard,
  Bell,
  ChevronDown,
  Home,
  TrendingUp,
  Newspaper,
  Building2,
  Calendar,
  Info
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationDropdown } from "@/components/notifications";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileDrawer } from "@/components/mobile/MobileDrawer";
import { BottomNav } from "@/components/mobile/BottomNav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Exact navigation from staging.hedgeco.net
const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/funds", label: "Funds", icon: TrendingUp },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/providers", label: "Service Providers", icon: Building2 },
  { href: "/conferences", label: "Conferences", icon: Calendar },
  { href: "/about", label: "About", icon: Info },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  // Authenticated header
  if (isAuthenticated && user) {
    return (
      <>
        {/* Desktop Header - Authenticated */}
        <header className="sticky top-0 z-50 w-full border-b border-hedgeco-border bg-hedgeco-white shadow-sm">
          <div className="hedgeco-container">
            <div className="flex h-16 items-center justify-between">
              {/* Logo */}
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-hedgeco-blue to-hedgeco-cyan flex items-center justify-center">
                  <span className="text-white font-bold text-lg">H</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-hedgeco-text-dark">HedgeCo.Net</span>
                  <span className="text-xs text-hedgeco-text-light">Dashboard</span>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-8">
                <Link 
                  href="/dashboard" 
                  className="text-sm font-semibold text-hedgeco-text-dark hover:text-hedgeco-blue transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/funds" 
                  className="text-sm font-semibold text-hedgeco-text-dark hover:text-hedgeco-blue transition-colors"
                >
                  Funds
                </Link>
                <Link 
                  href="/news" 
                  className="text-sm font-semibold text-hedgeco-text-dark hover:text-hedgeco-blue transition-colors"
                >
                  News
                </Link>
                <Link 
                  href="/messages" 
                  className="text-sm font-semibold text-hedgeco-text-dark hover:text-hedgeco-blue transition-colors"
                >
                  Messages
                </Link>
                <Link 
                  href="/reports" 
                  className="text-sm font-semibold text-hedgeco-text-dark hover:text-hedgeco-blue transition-colors"
                >
                  Reports
                </Link>
              </nav>

              {/* Right Side Actions */}
              <div className="flex items-center space-x-4">
                {/* Search */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-hedgeco-text-light hover:text-hedgeco-blue"
                >
                  <Search className="h-5 w-5" />
                </Button>

                {/* Notifications */}
                <NotificationDropdown />

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 hover:bg-transparent">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-hedgeco-blue to-hedgeco-cyan flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {user?.profile?.firstName?.[0] || user?.email?.[0] || 'U'}
                        </span>
                      </div>
                      <div className="hidden md:block text-left">
                        <div className="text-sm font-semibold text-hedgeco-text-dark">
                          {user?.profile?.firstName || 'User'}
                        </div>
                        <div className="text-xs text-hedgeco-text-light">
                          {user?.role?.toLowerCase() || 'Member'}
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-hedgeco-text-light" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-semibold">{user.profile?.firstName} {user.profile?.lastName}</span>
                        <span className="text-xs text-hedgeco-text-light font-normal">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-hedgeco-red">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <MobileHeader onMenuClick={() => setIsDrawerOpen(true)} />

        {/* Mobile Drawer */}
        <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

        {/* Mobile Bottom Navigation */}
        {isAuthenticated && <BottomNav />}
      </>
    );
  }

  // Public header (not authenticated)
  return (
    <>
      {/* Desktop Header - Public */}
      <header className="sticky top-0 z-50 w-full border-b border-hedgeco-border bg-hedgeco-white shadow-sm">
        <div className="hedgeco-container">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-hedgeco-blue to-hedgeco-cyan flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-hedgeco-text-dark">HedgeCo.Net</span>
                <span className="text-xs text-hedgeco-text-light">Alternative Investment Network</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-semibold text-hedgeco-text-dark hover:text-hedgeco-blue transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Search Button */}
              <Button 
                variant="ghost" 
                size="icon"
                className="hidden md:flex text-hedgeco-text-light hover:text-hedgeco-blue"
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Auth Buttons */}
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  className="text-hedgeco-text hover:text-hedgeco-blue hidden md:inline-flex"
                  asChild
                >
                  <Link href="/login">Login</Link>
                </Button>
                <Button 
                  className="hedgeco-button-primary"
                  asChild
                >
                  <Link href="/register">Register Free</Link>
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="lg:hidden text-hedgeco-text-light hover:text-hedgeco-blue"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col space-y-6 mt-8">
                    {navLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="flex items-center space-x-3 text-hedgeco-text-dark hover:text-hedgeco-blue"
                          onClick={() => setIsOpen(false)}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{link.label}</span>
                        </Link>
                      );
                    })}
                    <div className="pt-6 border-t border-hedgeco-border">
                      <Button className="w-full hedgeco-button-primary mb-3" asChild>
                        <Link href="/register">Register Free</Link>
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/login">Login</Link>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden border-t border-hedgeco-border bg-hedgeco-white">
          <div className="hedgeco-container">
            <div className="flex items-center justify-between py-3">
              <div className="flex space-x-6 overflow-x-auto">
                <Link 
                  href="/funds" 
                  className="text-sm font-medium text-hedgeco-text hover:text-hedgeco-blue whitespace-nowrap"
                >
                  Funds
                </Link>
                <Link 
                  href="/news" 
                  className="text-sm font-medium text-hedgeco-text hover:text-hedgeco-blue whitespace-nowrap"
                >
                  News
                </Link>
                <Link 
                  href="/providers" 
                  className="text-sm font-medium text-hedgeco-text hover:text-hedgeco-blue whitespace-nowrap"
                >
                  Providers
                </Link>
                <Link 
                  href="/conferences" 
                  className="text-sm font-medium text-hedgeco-text hover:text-hedgeco-blue whitespace-nowrap"
                >
                  Conferences
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
