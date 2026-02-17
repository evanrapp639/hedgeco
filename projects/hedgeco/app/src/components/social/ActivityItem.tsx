"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  FileText,
  Bell,
  Users,
  Building2,
  DollarSign,
  Calendar,
  Star,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export type ActivityType =
  | "fund_update"
  | "new_fund"
  | "document_added"
  | "performance_update"
  | "team_change"
  | "investment"
  | "event"
  | "announcement"
  | "comment";

interface ActivityItemProps {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  entityName: string;
  entityType: "fund" | "manager" | "provider";
  entityHref: string;
  entityImage?: string;
  timestamp: Date;
  metadata?: Record<string, string | number>;
  isNew?: boolean;
  className?: string;
}

const activityConfig: Record<ActivityType, { icon: typeof TrendingUp; color: string; bgColor: string }> = {
  fund_update: { icon: Bell, color: "text-blue-600", bgColor: "bg-blue-100" },
  new_fund: { icon: Star, color: "text-amber-600", bgColor: "bg-amber-100" },
  document_added: { icon: FileText, color: "text-slate-600", bgColor: "bg-slate-100" },
  performance_update: { icon: TrendingUp, color: "text-emerald-600", bgColor: "bg-emerald-100" },
  team_change: { icon: Users, color: "text-violet-600", bgColor: "bg-violet-100" },
  investment: { icon: DollarSign, color: "text-green-600", bgColor: "bg-green-100" },
  event: { icon: Calendar, color: "text-pink-600", bgColor: "bg-pink-100" },
  announcement: { icon: Building2, color: "text-indigo-600", bgColor: "bg-indigo-100" },
  comment: { icon: MessageSquare, color: "text-cyan-600", bgColor: "bg-cyan-100" },
};

export function ActivityItem({
  type,
  title,
  description,
  entityName,
  entityType,
  entityHref,
  entityImage,
  timestamp,
  metadata,
  isNew = false,
  className,
}: ActivityItemProps) {
  const config = activityConfig[type];
  const Icon = config.icon;
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });

  return (
    <div
      className={cn(
        "flex gap-4 p-4 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all",
        isNew && "bg-blue-50/50 border-blue-100",
        className
      )}
    >
      {/* Icon */}
      <div className={cn("flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center", config.bgColor)}>
        <Icon className={cn("h-5 w-5", config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900">
              {title}
            </p>
            {description && (
              <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          {isNew && (
            <Badge className="bg-blue-500 text-white text-xs">New</Badge>
          )}
        </div>

        {/* Entity Link */}
        <Link
          href={entityHref}
          className="inline-flex items-center gap-2 mt-2 group"
        >
          <Avatar className="h-5 w-5">
            {entityImage ? (
              <AvatarImage src={entityImage} alt={entityName} />
            ) : (
              <AvatarFallback className="text-[10px] bg-slate-200">
                {entityName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="text-sm text-slate-600 group-hover:text-blue-600 group-hover:underline">
            {entityName}
          </span>
          <Badge variant="outline" className="text-xs capitalize">
            {entityType}
          </Badge>
        </Link>

        {/* Metadata */}
        {metadata && Object.keys(metadata).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(metadata).map(([key, value]) => (
              <span
                key={key}
                className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded"
              >
                {key}: <span className="font-medium">{value}</span>
              </span>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-slate-400 mt-2">{timeAgo}</p>
      </div>
    </div>
  );
}

export default ActivityItem;
