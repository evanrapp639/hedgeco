"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MetricCard, ViewsChart, TopFundsChart, TrafficPieChart } from "@/components/analytics";
import { 
  Eye, 
  Users, 
  MessageSquare, 
  Heart, 
  Calendar as CalendarIcon,
  Download,
  RefreshCw,
  ArrowUpRight,
  FileText,
  UserPlus,
  Star
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

// Mock data generation
function generateViewsData(days: number) {
  const data = [];
  const baseViews = 1200;
  const baseVisitors = 800;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const randomFactor = 0.7 + Math.random() * 0.6;
    const weekendFactor = date.getDay() === 0 || date.getDay() === 6 ? 0.6 : 1;
    
    data.push({
      date: format(date, "MMM d"),
      views: Math.round(baseViews * randomFactor * weekendFactor),
      uniqueVisitors: Math.round(baseVisitors * randomFactor * weekendFactor * 0.85),
    });
  }
  return data;
}

const topFundsData = [
  { name: "Quantum Alpha Fund", views: 4520, slug: "quantum-alpha" },
  { name: "Renaissance Growth Partners", views: 3890, slug: "renaissance-growth" },
  { name: "Bridgewater Global Macro", views: 3456, slug: "bridgewater-global" },
  { name: "Citadel Equities Fund", views: 2987, slug: "citadel-equities" },
  { name: "Two Sigma Ventures", views: 2654, slug: "two-sigma" },
  { name: "Point72 Asset Management", views: 2341, slug: "point72" },
  { name: "Millennium Partners", views: 2156, slug: "millennium" },
  { name: "DE Shaw Composite", views: 1987, slug: "de-shaw" },
];

const trafficSourcesData = [
  { name: "Direct", value: 4520 },
  { name: "Organic Search", value: 3890 },
  { name: "Referral", value: 2456 },
  { name: "Social Media", value: 1987 },
  { name: "Email", value: 1654 },
  { name: "Paid Ads", value: 890 },
];

const recentActivityData = [
  { 
    id: 1, 
    action: "Fund Viewed", 
    fund: "Quantum Alpha Fund", 
    user: "investor@example.com",
    time: "2 minutes ago",
    icon: Eye 
  },
  { 
    id: 2, 
    action: "Inquiry Submitted", 
    fund: "Renaissance Growth", 
    user: "john.smith@hedge.io",
    time: "15 minutes ago",
    icon: MessageSquare 
  },
  { 
    id: 3, 
    action: "Fund Saved", 
    fund: "Bridgewater Global", 
    user: "investor2@example.com",
    time: "32 minutes ago",
    icon: Heart 
  },
  { 
    id: 4, 
    action: "New Registration", 
    fund: "—", 
    user: "new.user@gmail.com",
    time: "1 hour ago",
    icon: UserPlus 
  },
  { 
    id: 5, 
    action: "Document Downloaded", 
    fund: "Citadel Equities", 
    user: "analyst@firm.com",
    time: "2 hours ago",
    icon: FileText 
  },
  { 
    id: 6, 
    action: "Review Submitted", 
    fund: "Two Sigma Ventures", 
    user: "reviewer@inst.com",
    time: "3 hours ago",
    icon: Star 
  },
];

type DateRangePreset = "7d" | "30d" | "90d" | "custom";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRangePreset>("30d");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getDays = () => {
    switch (dateRange) {
      case "7d": return 7;
      case "30d": return 30;
      case "90d": return 90;
      case "custom": 
        if (customDateRange?.from && customDateRange?.to) {
          const diffTime = Math.abs(customDateRange.to.getTime() - customDateRange.from.getTime());
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        return 30;
      default: return 30;
    }
  };

  const viewsData = generateViewsData(getDays());
  
  // Calculate totals from mock data
  const totalViews = viewsData.reduce((sum, d) => sum + d.views, 0);
  const totalUniqueVisitors = viewsData.reduce((sum, d) => sum + d.uniqueVisitors, 0);
  const totalInquiries = Math.round(totalViews * 0.023); // ~2.3% conversion
  const totalSaves = Math.round(totalViews * 0.056); // ~5.6% save rate

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExport = () => {
    // In production, this would trigger a CSV/PDF export
    alert("Export functionality would download analytics data as CSV/PDF");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
            <p className="text-slate-600 mt-1">
              Track your fund performance and visitor engagement
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex items-center gap-2 bg-white rounded-lg border p-1">
              {(["7d", "30d", "90d"] as const).map((range) => (
                <Button
                  key={range}
                  variant={dateRange === range ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDateRange(range)}
                  className="min-w-[50px]"
                >
                  {range === "7d" ? "7D" : range === "30d" ? "30D" : "90D"}
                </Button>
              ))}
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateRange === "custom" ? "default" : "ghost"}
                    size="sm"
                    className="gap-1"
                    onClick={() => setDateRange("custom")}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    Custom
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={customDateRange}
                    onSelect={(range) => {
                      setCustomDateRange(range);
                      if (range?.from && range?.to) {
                        setDateRange("custom");
                      }
                    }}
                    numberOfMonths={2}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Date range display */}
        {dateRange === "custom" && customDateRange?.from && customDateRange?.to && (
          <div className="mb-6 text-sm text-slate-600">
            Showing data from{" "}
            <span className="font-medium">{format(customDateRange.from, "MMM d, yyyy")}</span>
            {" "}to{" "}
            <span className="font-medium">{format(customDateRange.to, "MMM d, yyyy")}</span>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total Views"
            value={totalViews.toLocaleString()}
            change={12.5}
            icon={<Eye className="h-4 w-4" />}
          />
          <MetricCard
            title="Unique Visitors"
            value={totalUniqueVisitors.toLocaleString()}
            change={8.3}
            icon={<Users className="h-4 w-4" />}
          />
          <MetricCard
            title="Inquiries"
            value={totalInquiries.toLocaleString()}
            change={-2.1}
            icon={<MessageSquare className="h-4 w-4" />}
          />
          <MetricCard
            title="Saved Funds"
            value={totalSaves.toLocaleString()}
            change={15.7}
            icon={<Heart className="h-4 w-4" />}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ViewsChart data={viewsData} className="col-span-1 lg:col-span-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TopFundsChart data={topFundsData} />
          <TrafficPieChart data={trafficSourcesData} />
        </div>

        {/* Activity Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Fund</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivityData.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                          <activity.icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{activity.action}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{activity.fund}</TableCell>
                    <TableCell className="text-slate-600">{activity.user}</TableCell>
                    <TableCell className="text-right text-slate-500 text-sm">
                      {activity.time}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
