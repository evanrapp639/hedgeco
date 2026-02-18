"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Calendar,
  Clock,
  Users,
  MoreVertical,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface ReportCardProps {
  report: Report;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  onRunNow?: (id: string) => void;
  className?: string;
}

const typeLabels = {
  performance: "Performance",
  allocation: "Allocation",
  risk: "Risk Analysis",
  compliance: "Compliance",
  custom: "Custom",
};

const typeColors = {
  performance: "bg-blue-100 text-blue-700",
  allocation: "bg-purple-100 text-purple-700",
  risk: "bg-amber-100 text-amber-700",
  compliance: "bg-emerald-100 text-emerald-700",
  custom: "bg-slate-100 text-slate-700",
};

const statusColors = {
  active: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  draft: "bg-slate-100 text-slate-600",
};

export function ReportCard({
  report,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleStatus,
  onRunNow,
  className,
}: ReportCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn(
              "p-2 rounded-lg shrink-0",
              typeColors[report.type]
            )}>
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-semibold text-slate-900 truncate">
                  {report.name}
                </h3>
                <Badge variant="outline" className={cn("text-xs", statusColors[report.status])}>
                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className={cn("text-xs font-medium", typeColors[report.type].replace("bg-", "").replace("100", "600"))}>
                  {typeLabels[report.type]}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {report.schedule}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {report.recipients} recipient{report.recipients !== 1 ? "s" : ""}
                </span>
              </div>
              {report.nextRun && report.status === "active" && (
                <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Next run: {report.nextRun}
                </div>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onRunNow && report.status !== "draft" && (
                <DropdownMenuItem onClick={() => onRunNow(report.id)}>
                  <Send className="h-4 w-4 mr-2" />
                  Run Now
                </DropdownMenuItem>
              )}
              {onToggleStatus && (
                <DropdownMenuItem onClick={() => onToggleStatus(report.id)}>
                  {report.status === "active" ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(report.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(report.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(report.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

export default ReportCard;
