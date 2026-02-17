"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ActivityFeed } from "@/components/social/ActivityFeed";
import { FollowingList } from "@/components/social/FollowingList";
import type { ActivityType } from "@/components/social/ActivityItem";
import {
  Bell,
  Filter,
  Settings,
  TrendingUp,
  FileText,
  Users,
  Calendar,
  Star,
} from "lucide-react";
import { subDays, subHours } from "date-fns";

// Mock data - use type assertion to handle optional metadata
type MockActivity = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  entityName: string;
  entityType: "fund" | "manager" | "provider";
  entityHref: string;
  timestamp: Date;
  metadata?: Record<string, string | number>;
  isNew?: boolean;
};

const mockActivities: MockActivity[] = [
  {
    id: "1",
    type: "performance_update" as ActivityType,
    title: "Q4 2025 Performance Update",
    description: "Citadel Wellington posted +3.2% returns for Q4 2025, outperforming the S&P 500 by 1.4%.",
    entityName: "Citadel Wellington",
    entityType: "fund" as const,
    entityHref: "/funds/citadel-wellington",
    timestamp: subHours(new Date(), 2),
    metadata: { "Q4 Return": "+3.2%", "YTD": "+18.7%" },
    isNew: true,
  },
  {
    id: "2",
    type: "document_added" as ActivityType,
    title: "New Due Diligence Questionnaire",
    description: "Updated DDQ available for download in the documents section.",
    entityName: "Bridgewater Associates",
    entityType: "fund" as const,
    entityHref: "/funds/bridgewater",
    timestamp: subHours(new Date(), 5),
  },
  {
    id: "3",
    type: "new_fund" as ActivityType,
    title: "New Fund Launch: Renaissance Quant Alpha",
    description: "Renaissance Technologies launched a new quantitative alpha fund targeting institutional investors.",
    entityName: "Renaissance Technologies",
    entityType: "manager" as const,
    entityHref: "/managers/renaissance",
    timestamp: subHours(new Date(), 8),
    isNew: true,
  },
  {
    id: "4",
    type: "team_change" as ActivityType,
    title: "New CIO Appointed",
    description: "Two Sigma announced the appointment of Jane Smith as Chief Investment Officer.",
    entityName: "Two Sigma",
    entityType: "manager" as const,
    entityHref: "/managers/two-sigma",
    timestamp: subDays(new Date(), 1),
  },
  {
    id: "5",
    type: "event" as ActivityType,
    title: "Investor Day 2026 Announced",
    description: "Save the date: Annual Investor Day scheduled for March 15, 2026 in New York.",
    entityName: "DE Shaw",
    entityType: "manager" as const,
    entityHref: "/managers/de-shaw",
    timestamp: subDays(new Date(), 1),
    metadata: { Date: "March 15, 2026", Location: "New York" },
  },
  {
    id: "6",
    type: "fund_update" as ActivityType,
    title: "Strategy Update: Increased Crypto Allocation",
    description: "Point72 announced a 5% allocation increase to cryptocurrency strategies.",
    entityName: "Point72",
    entityType: "fund" as const,
    entityHref: "/funds/point72",
    timestamp: subDays(new Date(), 2),
  },
  {
    id: "7",
    type: "announcement" as ActivityType,
    title: "Partnership with Prime Services Provider",
    description: "Millennium Management announced a new prime brokerage partnership with Goldman Sachs.",
    entityName: "Millennium Management",
    entityType: "manager" as const,
    entityHref: "/managers/millennium",
    timestamp: subDays(new Date(), 3),
  },
];

const mockFollowing = [
  { id: "1", type: "fund" as const, name: "Citadel Wellington", subtitle: "Multi-Strategy Hedge Fund", href: "/funds/citadel-wellington" },
  { id: "2", type: "fund" as const, name: "Bridgewater Associates", subtitle: "Global Macro", href: "/funds/bridgewater" },
  { id: "3", type: "manager" as const, name: "Renaissance Technologies", subtitle: "Quantitative Investment Manager", href: "/managers/renaissance" },
  { id: "4", type: "manager" as const, name: "Two Sigma", subtitle: "Data-Driven Investment Manager", href: "/managers/two-sigma" },
  { id: "5", type: "provider" as const, name: "Goldman Sachs Prime", subtitle: "Prime Brokerage Services", href: "/providers/gs-prime" },
];

const filterOptions = [
  { value: "all", label: "All Activity", icon: Bell },
  { value: "performance_update", label: "Performance", icon: TrendingUp },
  { value: "document_added", label: "Documents", icon: FileText },
  { value: "team_change", label: "Team Changes", icon: Users },
  { value: "event", label: "Events", icon: Calendar },
  { value: "new_fund", label: "New Funds", icon: Star },
];

export default function ActivityPage() {
  const [filter, setFilter] = useState("all");
  const [activities, setActivities] = useState(mockActivities);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const filteredActivities = filter === "all"
    ? activities
    : activities.filter((a) => a.type === filter);

  const handleLoadMore = useCallback(async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, fetch more from the API
    const newPage = page + 1;
    setPage(newPage);
    
    if (newPage >= 3) {
      setHasMore(false);
    }
    
    // Return some duplicate data for demo
    return mockActivities.slice(0, 3).map((a, i) => ({
      ...a,
      id: `${a.id}-page-${newPage}-${i}`,
      isNew: false,
      timestamp: subDays(new Date(), 3 + newPage),
    }));
  }, [page]);

  const newCount = activities.filter(a => a.isNew).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Activity Feed
              {newCount > 0 && (
                <Badge className="bg-blue-500 text-white">{newCount} new</Badge>
              )}
            </h1>
            <p className="text-slate-600 mt-1">
              Stay updated on your followed funds and managers
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <opt.icon className="h-4 w-4" />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ActivityFeed
                  initialActivities={filteredActivities}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Following List */}
            <FollowingList
              entities={mockFollowing}
              title="Following"
              showSearch={false}
            />

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Activity Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Following</span>
                    <span className="font-semibold">{mockFollowing.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Updates this week</span>
                    <span className="font-semibold">23</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Documents viewed</span>
                    <span className="font-semibold">12</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suggested */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Suggested to Follow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["Blackstone", "Apollo Global", "KKR & Co"].map((name) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">{name}</span>
                      <Button size="sm" variant="outline">Follow</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
