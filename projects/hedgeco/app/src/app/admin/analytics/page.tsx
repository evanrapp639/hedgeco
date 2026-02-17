"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { KpiCard } from "@/components/admin/KpiCard";
import { UserGrowthChart } from "@/components/admin/UserGrowthChart";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { EngagementChart } from "@/components/admin/EngagementChart";
import { TopFundsTable } from "@/components/admin/TopFundsTable";
import { GeographicChart } from "@/components/admin/GeographicChart";
import {
  Users,
  DollarSign,
  Activity,
  TrendingUp,
  Calendar,
  Download,
  RefreshCw,
} from "lucide-react";
import { format, subDays, startOfYear } from "date-fns";

type DateRange = "7d" | "30d" | "90d" | "ytd" | "custom";

// Mock data generators
function generateUserGrowthData(days: number) {
  const data = [];
  let cumulative = 1500;
  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const signups = Math.floor(Math.random() * 30) + 10;
    cumulative += signups;
    data.push({
      date: format(date, "MMM dd"),
      signups,
      cumulative,
    });
  }
  return data;
}

function generateRevenueData(days: number) {
  const data = [];
  let mrr = 45000;
  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    mrr += Math.floor(Math.random() * 2000) - 500;
    data.push({
      date: format(date, "MMM dd"),
      mrr: Math.max(mrr, 40000),
    });
  }
  return data;
}

const engagementData = [
  { action: "Fund Views", count: 12847, previousCount: 11234 },
  { action: "Document Downloads", count: 3421, previousCount: 2987 },
  { action: "Contact Requests", count: 892, previousCount: 756 },
  { action: "Searches", count: 8234, previousCount: 7123 },
  { action: "Watchlist Adds", count: 1567, previousCount: 1234 },
];

const topFundsData = [
  { id: "1", name: "Citadel Wellington", type: "Hedge Fund", views: 4521, viewsChange: 12.3, uniqueVisitors: 2341, avgTimeOnPage: "4:32" },
  { id: "2", name: "Bridgewater Associates", type: "Hedge Fund", views: 3892, viewsChange: 8.7, uniqueVisitors: 1987, avgTimeOnPage: "3:45" },
  { id: "3", name: "Renaissance Technologies", type: "Quant Fund", views: 3456, viewsChange: -2.1, uniqueVisitors: 1654, avgTimeOnPage: "5:12" },
  { id: "4", name: "Two Sigma Investments", type: "Quant Fund", views: 2987, viewsChange: 15.4, uniqueVisitors: 1432, avgTimeOnPage: "4:01" },
  { id: "5", name: "DE Shaw & Co", type: "Hedge Fund", views: 2654, viewsChange: 5.6, uniqueVisitors: 1234, avgTimeOnPage: "3:28" },
];

const geographicData = [
  { name: "North America", value: 4521 },
  { name: "Europe", value: 2341 },
  { name: "Asia Pacific", value: 1876 },
  { name: "Middle East", value: 543 },
  { name: "Latin America", value: 321 },
  { name: "Other", value: 198 },
];

const recentSignups = [
  { id: "1", name: "Michael Chen", email: "mchen@citadel.com", company: "Citadel", date: "2 hours ago" },
  { id: "2", name: "Sarah Johnson", email: "sjohnson@blackrock.com", company: "BlackRock", date: "4 hours ago" },
  { id: "3", name: "James Wilson", email: "jwilson@kkr.com", company: "KKR", date: "6 hours ago" },
  { id: "4", name: "Emily Davis", email: "edavis@apollo.com", company: "Apollo", date: "8 hours ago" },
  { id: "5", name: "David Brown", email: "dbrown@carlyle.com", company: "Carlyle", date: "12 hours ago" },
];

function getDaysFromRange(range: DateRange): number {
  switch (range) {
    case "7d": return 7;
    case "30d": return 30;
    case "90d": return 90;
    case "ytd": {
      const now = new Date();
      const start = startOfYear(now);
      return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
    default: return 30;
  }
}

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const days = getDaysFromRange(dateRange);
  const userGrowthData = generateUserGrowthData(Math.min(days, 60));
  const revenueData = generateRevenueData(Math.min(days, 60));

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="text-slate-600">Monitor platform performance and user engagement</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Users"
          value="2,847"
          change={12.5}
          changeLabel="vs last period"
          icon={<Users className="h-4 w-4" />}
        />
        <KpiCard
          title="MRR"
          value="$67,890"
          change={8.2}
          changeLabel="vs last month"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KpiCard
          title="Active Users"
          value="1,432"
          change={-3.1}
          changeLabel="vs last period"
          icon={<Activity className="h-4 w-4" />}
        />
        <KpiCard
          title="Conversion Rate"
          value="4.8%"
          change={0.6}
          changeLabel="vs last period"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserGrowthChart data={userGrowthData} showCumulative />
        <RevenueChart data={revenueData} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EngagementChart data={engagementData} showComparison />
        <GeographicChart data={geographicData} />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TopFundsTable data={topFundsData} />
        </div>
        
        {/* Recent Signups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-500" />
              Recent Signups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSignups.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-slate-100 text-slate-600 text-sm">
                      {user.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user.company}</p>
                  </div>
                  <Badge variant="outline" className="text-xs text-slate-400">
                    {user.date}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
