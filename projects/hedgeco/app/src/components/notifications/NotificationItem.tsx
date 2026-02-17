"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  TrendingUp,
  MessageSquare,
  Star,
  Bell,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  Users,
  DollarSign,
} from "lucide-react";

export type NotificationType =
  | "FUND_UPDATE"
  | "MESSAGE"
  | "WATCHLIST"
  | "INQUIRY"
  | "CALENDAR"
  | "DOCUMENT"
  | "ALERT"
  | "SUCCESS"
  | "INVESTOR"
  | "RETURN";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  href?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: string) => void;
  compact?: boolean;
}

const typeIcons: Record<NotificationType, React.ReactNode> = {
  FUND_UPDATE: <TrendingUp className="h-4 w-4" />,
  MESSAGE: <MessageSquare className="h-4 w-4" />,
  WATCHLIST: <Star className="h-4 w-4" />,
  INQUIRY: <Users className="h-4 w-4" />,
  CALENDAR: <Calendar className="h-4 w-4" />,
  DOCUMENT: <FileText className="h-4 w-4" />,
  ALERT: <AlertCircle className="h-4 w-4" />,
  SUCCESS: <CheckCircle2 className="h-4 w-4" />,
  INVESTOR: <Users className="h-4 w-4" />,
  RETURN: <DollarSign className="h-4 w-4" />,
};

const typeColors: Record<NotificationType, string> = {
  FUND_UPDATE: "bg-blue-100 text-blue-600",
  MESSAGE: "bg-purple-100 text-purple-600",
  WATCHLIST: "bg-amber-100 text-amber-600",
  INQUIRY: "bg-green-100 text-green-600",
  CALENDAR: "bg-indigo-100 text-indigo-600",
  DOCUMENT: "bg-slate-100 text-slate-600",
  ALERT: "bg-red-100 text-red-600",
  SUCCESS: "bg-emerald-100 text-emerald-600",
  INVESTOR: "bg-teal-100 text-teal-600",
  RETURN: "bg-cyan-100 text-cyan-600",
};

export function NotificationItem({
  notification,
  onRead,
  compact = false,
}: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.read && onRead) {
      onRead(notification.id);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer",
        "hover:bg-slate-50 active:bg-slate-100",
        !notification.read && "bg-blue-50/50",
        compact && "p-2"
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
          typeColors[notification.type],
          compact && "w-7 h-7"
        )}
      >
        {typeIcons[notification.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-medium text-slate-900 line-clamp-1",
              compact && "text-xs"
            )}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
          )}
        </div>
        <p
          className={cn(
            "text-sm text-slate-500 line-clamp-2 mt-0.5",
            compact && "text-xs line-clamp-1"
          )}
        >
          {notification.message}
        </p>
        <p className={cn("text-xs text-slate-400 mt-1", compact && "mt-0.5")}>
          {timeAgo}
        </p>
      </div>
    </div>
  );

  if (notification.href) {
    return (
      <Link href={notification.href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
