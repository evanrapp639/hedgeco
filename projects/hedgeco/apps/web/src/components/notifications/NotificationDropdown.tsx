"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationItem, Notification } from "./NotificationItem";
import { NotificationBadge } from "./NotificationBadge";
import { Bell, Settings, ChevronRight, Loader2 } from "lucide-react";

// Mock notifications - replace with actual API data
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "FUND_UPDATE",
    title: "Alpha Global posted new returns",
    message: "January 2024 returns are now available: +2.3% MTD",
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    read: false,
    href: "/funds/alpha-global",
  },
  {
    id: "2",
    type: "MESSAGE",
    title: "New message from John Smith",
    message: "Thank you for your interest in our fund. I'd like to schedule a call...",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
    href: "/messages",
  },
  {
    id: "3",
    type: "INQUIRY",
    title: "New investor inquiry",
    message: "Sarah Johnson has requested information about Quantum Alpha Fund",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    read: true,
    href: "/dashboard/inquiries",
  },
  {
    id: "4",
    type: "WATCHLIST",
    title: "Watchlist alert",
    message: "Tech Growth Partners has updated their strategy description",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
    href: "/dashboard/watchlist",
  },
  {
    id: "5",
    type: "CALENDAR",
    title: "Upcoming meeting reminder",
    message: "Call with Meridian Capital tomorrow at 2:00 PM EST",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    read: true,
    href: "/calendar",
  },
];

interface NotificationDropdownProps {
  className?: string;
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState(mockNotifications);
  const [isLoading, setIsLoading] = React.useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Show only recent notifications in dropdown
  const recentNotifications = notifications.slice(0, 5);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-5 w-5" />
          <NotificationBadge count={unreadCount} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[380px] p-0 shadow-xl"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Notifications</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-700 h-7 px-2"
              >
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              asChild
            >
              <Link href="/settings/notifications">
                <Settings className="h-4 w-4 text-slate-500" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Notification list */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Bell className="h-10 w-10 mb-3 text-slate-200" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={handleMarkRead}
                  compact
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-slate-100">
            <Link
              href="/notifications"
              className="flex items-center justify-center gap-1 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-slate-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
