"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportCard } from "@/components/reports/ReportCard";
import { EmptyState } from "@/components/ui/empty-state";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Play,
  Pause,
} from "lucide-react";

interface Report {
  id: string;
  name: string;
  type: "performance" | "allocation" | "risk" | "compliance" | "custom";
  schedule: string;
  nextRun?: string;
  lastRun?: string;
  recipients: number;
  status: "active" | "paused" | "draft";
}

// Sample data
const sampleReports: Report[] = [
  {
    id: "1",
    name: "Weekly Performance Summary",
    type: "performance" as const,
    schedule: "Weekly on Monday",
    nextRun: "Mon, Feb 24 at 9:00 AM ET",
    lastRun: "Feb 17, 2026",
    recipients: 12,
    status: "active" as const,
  },
  {
    id: "2",
    name: "Monthly Allocation Report",
    type: "allocation" as const,
    schedule: "Monthly on 1st",
    nextRun: "Mar 1 at 9:00 AM ET",
    lastRun: "Feb 1, 2026",
    recipients: 8,
    status: "active" as const,
  },
  {
    id: "3",
    name: "Quarterly Risk Analysis",
    type: "risk" as const,
    schedule: "Quarterly on 15th",
    nextRun: "Apr 15 at 9:00 AM ET",
    lastRun: "Jan 15, 2026",
    recipients: 5,
    status: "paused" as const,
  },
  {
    id: "4",
    name: "Compliance Dashboard",
    type: "compliance" as const,
    schedule: "Daily",
    recipients: 3,
    status: "draft" as const,
  },
];

export default function ReportsPage() {
  const [reports, setReports] = React.useState(sampleReports);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    const matchesType = typeFilter === "all" || report.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleToggleStatus = (id: string) => {
    setReports(reports.map((r) => {
      if (r.id === id) {
        return { ...r, status: r.status === "active" ? "paused" as const : "active" as const };
      }
      return r;
    }));
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this report?")) {
      setReports(reports.filter((r) => r.id !== id));
    }
  };

  const activeCount = reports.filter((r) => r.status === "active").length;
  const pausedCount = reports.filter((r) => r.status === "paused").length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
              <p className="text-slate-600 mt-1">
                Schedule and manage automated reports
              </p>
            </div>
            <Link href="/reports/builder">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Report
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600">{activeCount} active</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-slate-600">{pausedCount} paused</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="allocation">Allocation</SelectItem>
                <SelectItem value="risk">Risk Analysis</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="container mx-auto px-4 py-8">
        {filteredReports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={search || statusFilter !== "all" || typeFilter !== "all" 
              ? "No reports found" 
              : "No reports yet"}
            description={search || statusFilter !== "all" || typeFilter !== "all"
              ? "Try adjusting your filters"
              : "Create your first automated report to get started"}
            action={
              !search && statusFilter === "all" && typeFilter === "all" ? (
                <Link href="/reports/builder">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Report
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}>
                  Clear Filters
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-4">
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onEdit={(id) => window.location.href = `/reports/builder?id=${id}`}
                onDuplicate={(id) => {
                  const original = reports.find((r) => r.id === id);
                  if (original) {
                    setReports([
                      ...reports,
                      { ...original, id: Date.now().toString(), name: `${original.name} (Copy)`, status: "draft" },
                    ]);
                  }
                }}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onRunNow={(id) => alert(`Running report ${id}...`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
