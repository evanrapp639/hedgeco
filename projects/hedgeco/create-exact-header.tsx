import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  User, 
  LogOut, 
  Settings, 
  LayoutDashboard,
  Bell,
  ChevronDown,
  Menu
} from 'lucide-react';

// Exact HedgeCo.Net header based on staging.hedgeco.net
export function HedgeCoHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-hedgeco-border bg-hedgeco-white shadow-sm">
      <div className="hedgeco-container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              {/* Logo placeholder - replace with actual logo */}
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-hedgeco-blue to-hedgeco-cyan flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-hedgeco-text-dark">HedgeCo.Net</span>
                <span className="text-xs text-hedgeco-text-light">Alternative Investment Network</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Exact match to staging */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-sm font-semibold text-hedgeco-text-dark hover:text-hedgeco-blue transition-colors"
            >
              Home
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
              href="/providers" 
              className="text-sm font-semibold text-hedgeco-text-dark hover:text-hedgeco-blue transition-colors"
            >
              Service Providers
            </Link>
            <Link 
              href="/conferences" 
              className="text-sm font-semibold text-hedgeco-text-dark hover:text-hedgeco-blue transition-colors"
            >
              Conferences
            </Link>
            <Link 
              href="/about" 
              className="text-sm font-semibold text-hedgeco-text-dark hover:text-hedgeco-blue transition-colors"
            >
              About
            </Link>
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
            <Button 
              variant="ghost" 
              size="icon"
              className="lg:hidden text-hedgeco-text-light hover:text-hedgeco-blue"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
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
  );
}

// Authenticated version of header
export function HedgeCoHeaderAuthenticated({ user }: { user: any }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-hedgeco-border bg-hedgeco-white shadow-sm">
      <div className="hedgeco-container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-hedgeco-blue to-hedgeco-cyan flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-hedgeco-text-dark">HedgeCo.Net</span>
                <span className="text-xs text-hedgeco-text-light">Dashboard</span>
              </div>
            </Link>
          </div>

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
            <Button 
              variant="ghost" 
              size="icon"
              className="text-hedgeco-text-light hover:text-hedgeco-blue relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-hedgeco-red text-xs text-white flex items-center justify-center">
                3
              </span>
            </Button>

            {/* User Menu */}
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-hedgeco-blue to-hedgeco-cyan flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user?.profile?.firstName?.[0] || user?.email?.[0] || 'U'}
                </span>
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-semibold text-hedgeco-text-dark">
                  {user?.profile?.firstName || 'User'}
                </div>
                <div className="text-xs text-hedgeco-text-light">
                  {user?.role?.toLowerCase() || 'Member'}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-hedgeco-text-light" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}