"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Users,
  TrendingUp,
  Building2,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  UserPlus,
  FileCheck,
  Eye,
} from "lucide-react";

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  href,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: { value: number; label: string };
  href?: string;
}) {
  const content = (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <Icon className="h-4 w-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <p className={`text-xs mt-1 ${trend.value >= 0 ? "text-green-600" : "text-red-600"}`}>
            {trend.value >= 0 ? "+" : ""}{trend.value} {trend.label}
          </p>
        )}
      </CardContent>
      {href && (
        <div className="absolute right-2 bottom-2">
          <ArrowRight className="h-4 w-4 text-slate-300" />
        </div>
      )}
    </Card>
  );

  if (href) {
    return <Link href={href} className="block hover:opacity-80 transition-opacity">{content}</Link>;
  }
  return content;
}

function formatTimeAgo(date: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery();
  const { data: recentActivity, isLoading: activityLoading } = trpc.admin.getRecentActivity.useQuery({ limit: 10 });
  const { data: pendingFunds } = trpc.admin.getFunds.useQuery({ status: "PENDING_REVIEW", limit: 5 });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600 mt-1">
          Platform overview and quick actions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.users.total ?? 0}
          description={`${stats?.users.pending ?? 0} pending verification`}
          icon={Users}
          trend={{ value: stats?.users.newThisWeek ?? 0, label: "this week" }}
          href="/admin/users"
        />
        <StatCard
          title="Total Funds"
          value={stats?.funds.total ?? 0}
          description={`${stats?.funds.pending ?? 0} pending review`}
          icon={TrendingUp}
          trend={{ value: stats?.funds.newThisWeek ?? 0, label: "this week" }}
          href="/admin/funds"
        />
        <StatCard
          title="Service Providers"
          value={stats?.providers.total ?? 0}
          icon={Building2}
          href="/admin/providers"
        />
        <StatCard
          title="24h Activity"
          value={stats?.activity.last24Hours ?? 0}
          description="User actions"
          icon={Activity}
          href="/admin/activity"
        />
      </div>

      {/* Quick Actions & Pending Items */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/admin/users?status=pending">
                <UserPlus className="mr-2 h-4 w-4" />
                Review Pending Users
                {stats?.users.pending ? (
                  <Badge variant="secondary" className="ml-auto">
                    {stats.users.pending}
                  </Badge>
                ) : null}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/admin/funds?status=PENDING_REVIEW">
                <FileCheck className="mr-2 h-4 w-4" />
                Review Pending Funds
                {stats?.funds.pending ? (
                  <Badge variant="secondary" className="ml-auto">
                    {stats.funds.pending}
                  </Badge>
                ) : null}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/admin/activity">
                <Eye className="mr-2 h-4 w-4" />
                View Activity Log
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Pending Funds */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Pending Fund Reviews
            </CardTitle>
            <CardDescription>Funds awaiting approval</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingFunds?.funds.length === 0 ? (
              <div className="text-center py-4 text-slate-500">
                No pending funds to review
              </div>
            ) : (
              <div className="space-y-3">
                {pendingFunds?.funds.map((fund) => (
                  <Link
                    key={fund.id}
                    href={`/admin/funds/${fund.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm">{fund.name}</div>
                      <div className="text-xs text-slate-500">
                        {fund.manager.profile?.firstName} {fund.manager.profile?.lastName} • {fund.type?.replace(/_/g, " ")}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      Pending
                    </Badge>
                  </Link>
                ))}
                {(pendingFunds?.pagination.total ?? 0) > 5 && (
                  <Button variant="ghost" className="w-full" asChild>
                    <Link href="/admin/funds?status=PENDING_REVIEW">
                      View all {pendingFunds?.pagination.total} pending funds
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Breakdown & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Users by Role */}
        <Card>
          <CardHeader>
            <CardTitle>Users by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.users.byRole && Object.entries(stats.users.byRole).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {role.toLowerCase().replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <span className="font-medium">{count as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="text-center py-4 text-slate-500">Loading...</div>
            ) : recentActivity?.length === 0 ? (
              <div className="text-center py-4 text-slate-500">No recent activity</div>
            ) : (
              <div className="space-y-3">
                {recentActivity?.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {activity.user?.profile?.firstName || activity.user?.email?.split("@")[0]}
                      </div>
                      <div className="text-xs text-slate-500">
                        {activity.action.toLowerCase()} {activity.entityType?.toLowerCase()}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 whitespace-nowrap">
                      {formatTimeAgo(activity.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
