"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
// Tabs imported for future use from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  TrendingUp,
  Building2,
  Users,
  FileText,
  MessageSquare,
  Settings,
  Plus,
  Eye,
  Star,
  Calendar,
  DollarSign,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  RefreshCw,
  Download,
  Menu,
  Scale,
  Bookmark,
  History,
} from "lucide-react";

// ==================== MANAGER DASHBOARD ====================

interface FundPerformanceCard {
  id: string;
  name: string;
  aum: number;
  ytdReturn: number;
  mtdReturn: number;
  investorCount: number;
  returnStatus: "current" | "pending" | "overdue";
  lastReturnDate: string;
}

const mockManagerFunds: FundPerformanceCard[] = [
  {
    id: "1",
    name: "Alpha Global Equity Fund",
    aum: 285000000,
    ytdReturn: 12.4,
    mtdReturn: 1.8,
    investorCount: 47,
    returnStatus: "current",
    lastReturnDate: "2026-01-31",
  },
  {
    id: "2",
    name: "Beta Multi-Strategy Fund",
    aum: 142000000,
    ytdReturn: 8.7,
    mtdReturn: -0.3,
    investorCount: 23,
    returnStatus: "pending",
    lastReturnDate: "2025-12-31",
  },
];

interface ActivityItem {
  id: string;
  type: "inquiry" | "view" | "download" | "message";
  title: string;
  subtitle: string;
  time: string;
  isNew?: boolean;
}

const mockActivity: ActivityItem[] = [
  { id: "1", type: "inquiry", title: "Johnson Family Office", subtitle: "Requested meeting for Alpha Fund", time: "2h ago", isNew: true },
  { id: "2", type: "download", title: "State Pension Fund", subtitle: "Downloaded DDQ for Beta Fund", time: "5h ago", isNew: true },
  { id: "3", type: "view", title: "BlackRock Alternatives", subtitle: "Viewed Alpha Fund profile", time: "1d ago" },
  { id: "4", type: "message", title: "Citadel Securities", subtitle: "Follow-up on capacity inquiry", time: "2d ago" },
];

function ManagerDashboard() {
  const totalAUM = mockManagerFunds.reduce((sum, f) => sum + f.aum, 0);
  const avgYTD = mockManagerFunds.reduce((sum, f) => sum + f.ytdReturn, 0) / mockManagerFunds.length;
  const totalInvestors = mockManagerFunds.reduce((sum, f) => sum + f.investorCount, 0);
  const pendingReturns = mockManagerFunds.filter(f => f.returnStatus !== "current").length;

  return (
    <div className="space-y-6">
      {/* Quick Stats Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total AUM</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">${(totalAUM / 1e6).toFixed(0)}M</div>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +2.3% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">YTD Return</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{avgYTD.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">Avg. across all funds</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Investors</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalInvestors}</div>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +5 new this month
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${pendingReturns > 0 ? 'from-amber-500/10' : 'from-green-500/10'} to-transparent rounded-bl-full`} />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Return Status</CardTitle>
            {pendingReturns > 0 ? (
              <AlertCircle className="h-4 w-4 text-amber-600" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${pendingReturns > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {pendingReturns > 0 ? `${pendingReturns} Pending` : 'Current'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {pendingReturns > 0 ? 'Submit by Feb 15' : 'All returns submitted'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Banner */}
      {pendingReturns > 0 && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900">Returns Due</p>
                <p className="text-sm text-amber-700">{pendingReturns} fund(s) need January 2026 returns</p>
              </div>
            </div>
            <Button asChild className="bg-amber-600 hover:bg-amber-700 min-h-[44px] min-w-[140px]">
              <Link href="/dashboard/returns">
                <Plus className="mr-2 h-4 w-4" />
                Submit Returns
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Fund Performance Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Your Funds</h2>
          <Button variant="ghost" size="sm" asChild className="min-h-[44px]">
            <Link href="/manager/funds">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {mockManagerFunds.map((fund) => (
            <Card key={fund.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{fund.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Users className="h-3 w-3" />
                      {fund.investorCount} investors
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={fund.returnStatus === 'current' ? 'default' : 'secondary'}
                    className={fund.returnStatus === 'current' 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : 'bg-amber-100 text-amber-700 border-amber-200'}
                  >
                    {fund.returnStatus === 'current' ? 'Current' : 'Pending'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">AUM</p>
                    <p className="text-lg font-semibold">${(fund.aum / 1e6).toFixed(0)}M</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">YTD</p>
                    <p className={`text-lg font-semibold ${fund.ytdReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fund.ytdReturn >= 0 ? '+' : ''}{fund.ytdReturn}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">MTD</p>
                    <p className={`text-lg font-semibold ${fund.mtdReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fund.mtdReturn >= 0 ? '+' : ''}{fund.mtdReturn}%
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1 min-h-[44px]" asChild>
                    <Link href={`/funds/${fund.id}`}>View Fund</Link>
                  </Button>
                  {fund.returnStatus !== 'current' && (
                    <Button size="sm" className="flex-1 min-h-[44px]" asChild>
                      <Link href="/dashboard/returns">Submit Return</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Activity Feed & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-slate-400" />
                Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm" className="min-h-[44px]">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockActivity.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className={`p-2 rounded-lg ${
                    item.type === 'inquiry' ? 'bg-blue-100' :
                    item.type === 'download' ? 'bg-green-100' :
                    item.type === 'view' ? 'bg-purple-100' : 'bg-slate-100'
                  }`}>
                    {item.type === 'inquiry' && <MessageSquare className="h-4 w-4 text-blue-600" />}
                    {item.type === 'download' && <Download className="h-4 w-4 text-green-600" />}
                    {item.type === 'view' && <Eye className="h-4 w-4 text-purple-600" />}
                    {item.type === 'message' && <MessageSquare className="h-4 w-4 text-slate-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 truncate">{item.title}</p>
                    <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.isNew && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                    <span className="text-xs text-slate-400 whitespace-nowrap">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start min-h-[48px]" asChild>
              <Link href="/manager/funds/new">
                <Plus className="mr-3 h-4 w-4" />
                Add New Fund
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start min-h-[48px]" asChild>
              <Link href="/dashboard/returns">
                <FileText className="mr-3 h-4 w-4" />
                Enter Returns
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start min-h-[48px]" asChild>
              <Link href="/manager/funds">
                <TrendingUp className="mr-3 h-4 w-4" />
                Manage Funds
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start min-h-[48px]" asChild>
              <Link href="/messages">
                <MessageSquare className="mr-3 h-4 w-4" />
                View Messages
                <Badge variant="secondary" className="ml-auto">7</Badge>
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start min-h-[48px]" asChild>
              <Link href="/settings">
                <Settings className="mr-3 h-4 w-4" />
                Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ==================== INVESTOR DASHBOARD ====================

interface WatchlistFund {
  id: string;
  name: string;
  strategy: string;
  ytdReturn: number;
  mtdReturn: number;
  aum: number;
}

const mockWatchlist: WatchlistFund[] = [
  { id: "1", name: "Alpha Global Equity Fund", strategy: "Long/Short Equity", ytdReturn: 12.4, mtdReturn: 1.8, aum: 285 },
  { id: "2", name: "Quantum Macro Fund", strategy: "Global Macro", ytdReturn: 18.2, mtdReturn: 2.1, aum: 520 },
  { id: "3", name: "Sigma Stat Arb Fund", strategy: "Statistical Arbitrage", ytdReturn: 9.8, mtdReturn: 0.9, aum: 180 },
];

interface SavedSearch {
  id: string;
  name: string;
  criteria: string;
  resultCount: number;
  lastRun: string;
}

const mockSavedSearches: SavedSearch[] = [
  { id: "1", name: "Large Cap L/S Equity", criteria: "AUM > $100M, Long/Short", resultCount: 47, lastRun: "2 days ago" },
  { id: "2", name: "Emerging Managers", criteria: "AUM < $50M, Track Record > 3Y", resultCount: 23, lastRun: "1 week ago" },
];

interface RecentView {
  id: string;
  name: string;
  viewedAt: string;
}

const mockRecentViews: RecentView[] = [
  { id: "1", name: "Renaissance Technologies", viewedAt: "3h ago" },
  { id: "2", name: "Citadel Global Equities", viewedAt: "1d ago" },
  { id: "3", name: "Two Sigma Compass", viewedAt: "2d ago" },
];

interface RecommendedFund {
  id: string;
  name: string;
  strategy: string;
  ytdReturn: number;
  reason: string;
}

const mockRecommendations: RecommendedFund[] = [
  { id: "1", name: "Phoenix Systematic Alpha", strategy: "Systematic", ytdReturn: 15.2, reason: "Similar to your watchlist" },
  { id: "2", name: "Horizon Event Driven", strategy: "Event Driven", ytdReturn: 11.8, reason: "Top performer this month" },
  { id: "3", name: "Meridian Multi-Strat", strategy: "Multi-Strategy", ytdReturn: 13.1, reason: "Trending in your sector" },
];

interface RSVPConference {
  id: string;
  name: string;
  date: string;
  location: string;
}

const mockConferences: RSVPConference[] = [
  { id: "1", name: "Crypto Institutional Forum", date: "Mar 20-21, 2026", location: "Miami, FL" },
  { id: "2", name: "Global Hedge Fund Summit", date: "May 15-17, 2026", location: "New York, NY" },
];

function InvestorDashboard() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Watchlist</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockWatchlist.length}</div>
            <p className="text-xs text-slate-500 mt-1">Funds tracked</p>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Saved Searches</CardTitle>
            <Bookmark className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSavedSearches.length}</div>
            <p className="text-xs text-slate-500 mt-1">Active searches</p>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-slate-500 mt-1">Unread</p>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Events</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockConferences.length}</div>
            <p className="text-xs text-slate-500 mt-1">RSVP&apos;d</p>
          </CardContent>
        </Card>
      </div>

      {/* Watchlist Preview with Quick Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Your Watchlist
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="min-h-[44px]" asChild>
                <Link href="/compare">
                  <Scale className="mr-2 h-4 w-4" />
                  Compare
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="min-h-[44px]" asChild>
                <Link href="/dashboard/watchlist">
                  View All <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <div className="grid gap-4 md:grid-cols-3 min-w-[600px]">
              {mockWatchlist.map((fund) => (
                <Card key={fund.id} className="hover:shadow-md transition-shadow border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-sm text-slate-900 line-clamp-1">{fund.name}</h4>
                        <p className="text-xs text-slate-500">{fund.strategy}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div>
                        <p className="text-xs text-slate-400">YTD</p>
                        <p className={`text-sm font-semibold ${fund.ytdReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fund.ytdReturn >= 0 ? '+' : ''}{fund.ytdReturn}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">MTD</p>
                        <p className={`text-sm font-semibold ${fund.mtdReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fund.mtdReturn >= 0 ? '+' : ''}{fund.mtdReturn}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">AUM</p>
                        <p className="text-sm font-semibold">${fund.aum}M</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3 min-h-[40px]" asChild>
                      <Link href={`/funds/${fund.id}`}>View Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saved Searches & Recent Views */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Saved Searches */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                Saved Searches
              </CardTitle>
              <Button variant="ghost" size="sm" className="min-h-[44px]" asChild>
                <Link href="/search">New Search</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockSavedSearches.map((search) => (
              <div 
                key={search.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-900">{search.name}</p>
                  <p className="text-xs text-slate-500 truncate">{search.criteria}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <Badge variant="secondary">{search.resultCount}</Badge>
                  <Button size="sm" className="min-h-[40px] min-w-[60px]" asChild>
                    <Link href={`/search?saved=${search.id}`}>Run</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Views */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-slate-400" />
              Recent Views
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockRecentViews.map((view) => (
              <Link 
                key={view.id}
                href={`/funds/${view.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                    <Building2 className="h-4 w-4 text-slate-600" />
                  </div>
                  <span className="font-medium text-sm text-slate-900">{view.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{view.viewedAt}</span>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recommended Funds Carousel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Recommended For You
            </CardTitle>
            <Button variant="ghost" size="sm" className="min-h-[44px]" asChild>
              <Link href="/funds">
                Browse All <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <CardDescription>Based on your watchlist and search history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 snap-x snap-mandatory">
            {mockRecommendations.map((fund) => (
              <Card 
                key={fund.id} 
                className="flex-shrink-0 w-[280px] snap-center hover:shadow-md transition-shadow border-purple-100"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                      {fund.reason}
                    </Badge>
                    <span className={`text-sm font-bold ${fund.ytdReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fund.ytdReturn >= 0 ? '+' : ''}{fund.ytdReturn}% YTD
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-1">{fund.name}</h4>
                  <p className="text-sm text-slate-500 mb-3">{fund.strategy}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 min-h-[40px]" asChild>
                      <Link href={`/funds/${fund.id}`}>View</Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="min-h-[40px] min-w-[40px] p-0">
                      <Star className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Conferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Upcoming Conferences
            </CardTitle>
            <Button variant="ghost" size="sm" className="min-h-[44px]" asChild>
              <Link href="/conferences">
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {mockConferences.map((conf) => (
              <div 
                key={conf.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100"
              >
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">{conf.name}</h4>
                  <p className="text-sm text-slate-600">{conf.date}</p>
                  <p className="text-sm text-slate-500">{conf.location}</p>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200">RSVP&apos;d</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== PROVIDER DASHBOARD ====================

function ProviderDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-slate-500 mt-1">This month</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Listing Tier</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Basic</div>
            <Button variant="link" className="p-0 h-auto text-xs text-blue-600">Upgrade for more visibility</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Your Listing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Button className="w-full justify-start min-h-[48px]" variant="outline" asChild>
            <Link href="/provider/profile">
              <Building2 className="mr-3 h-4 w-4" />
              Edit Profile
            </Link>
          </Button>
          <Button className="w-full justify-start min-h-[48px]" variant="outline" asChild>
            <Link href="/provider/leads">
              <Users className="mr-3 h-4 w-4" />
              View Leads
            </Link>
          </Button>
          <Button className="w-full justify-start min-h-[48px]" variant="outline" asChild>
            <Link href="/messages">
              <MessageSquare className="mr-3 h-4 w-4" />
              Messages
            </Link>
          </Button>
          <Button className="w-full justify-start min-h-[48px]" variant="outline" asChild>
            <Link href="/settings">
              <Settings className="mr-3 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== MAIN DASHBOARD PAGE ====================

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Welcome back, {user.profile?.firstName || "User"}!
              </h1>
              <p className="text-slate-600 mt-1 text-sm md:text-base">
                {user.role === "INVESTOR" && "Track your fund research and investments"}
                {user.role === "MANAGER" && "Manage your funds and investor relations"}
                {user.role === "SERVICE_PROVIDER" && "Manage your service provider listing"}
                {user.role === "NEWS_MEMBER" && "Access industry news and insights"}
                {user.role === "ADMIN" && "Manage the HedgeCo.Net platform"}
              </p>
              
              {user.role === "INVESTOR" && (
                <div className="mt-3">
                  {user.profile?.accredited ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      ✓ Accredited Investor
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      Accreditation Pending
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>Quick Navigation</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-2 gap-3 mt-6">
                  {user.role === "INVESTOR" && (
                    <>
                      <Button variant="outline" className="h-20 flex-col gap-2" asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/funds">
                          <TrendingUp className="h-5 w-5" />
                          <span>Browse Funds</span>
                        </Link>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col gap-2" asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/dashboard/watchlist">
                          <Star className="h-5 w-5" />
                          <span>Watchlist</span>
                        </Link>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col gap-2" asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/compare">
                          <Scale className="h-5 w-5" />
                          <span>Compare</span>
                        </Link>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col gap-2" asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/search">
                          <Search className="h-5 w-5" />
                          <span>Search</span>
                        </Link>
                      </Button>
                    </>
                  )}
                  {user.role === "MANAGER" && (
                    <>
                      <Button variant="outline" className="h-20 flex-col gap-2" asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/dashboard/returns">
                          <FileText className="h-5 w-5" />
                          <span>Enter Returns</span>
                        </Link>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col gap-2" asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/manager/funds">
                          <TrendingUp className="h-5 w-5" />
                          <span>My Funds</span>
                        </Link>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col gap-2" asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/manager/funds/new">
                          <Plus className="h-5 w-5" />
                          <span>New Fund</span>
                        </Link>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col gap-2" asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/messages">
                          <MessageSquare className="h-5 w-5" />
                          <span>Messages</span>
                        </Link>
                      </Button>
                    </>
                  )}
                  <Button variant="outline" className="h-20 flex-col gap-2" asChild onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/conferences">
                      <Calendar className="h-5 w-5" />
                      <span>Conferences</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" asChild onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/settings">
                      <Settings className="h-5 w-5" />
                      <span>Settings</span>
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Role-specific Dashboard */}
        {user.role === "INVESTOR" && <InvestorDashboard />}
        {user.role === "MANAGER" && <ManagerDashboard />}
        {user.role === "SERVICE_PROVIDER" && <ProviderDashboard />}
        {(user.role === "NEWS_MEMBER" || user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
          <InvestorDashboard />
        )}
      </div>
    </div>
  );
}
