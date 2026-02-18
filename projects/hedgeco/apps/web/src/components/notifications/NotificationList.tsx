"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationItem, Notification } from "./NotificationItem";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

interface NotificationListProps {
  notifications: Notification[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onMarkAllRead?: () => void;
  onMarkRead?: (id: string) => void;
  className?: string;
  emptyMessage?: string;
}

export function NotificationList({
  notifications,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onMarkAllRead,
  onMarkRead,
  className,
  emptyMessage = "You're all caught up! No new notifications.",
}: NotificationListProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-xs text-slate-500">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && onMarkAllRead && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllRead}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 -mr-2"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-3" />
            <p className="text-sm">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-sm text-center px-4">{emptyMessage}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={onMarkRead}
              />
            ))}
          </div>
        )}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="p-3 border-t border-slate-100">
          <Button
            variant="ghost"
            className="w-full"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// Page wrapper for full notification list page
interface NotificationPageProps {
  initialNotifications?: Notification[];
}

export function NotificationPage({
  initialNotifications = [],
}: NotificationPageProps) {
  const [notifications, setNotifications] = React.useState(initialNotifications);
  const [isLoading, setIsLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  // Mock load more - replace with actual API call
  const handleLoadMore = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setPage((p) => p + 1);
    setIsLoading(false);
    // Set hasMore based on API response
    if (page >= 3) setHasMore(false);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto">
        <NotificationList
          notifications={notifications}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onMarkAllRead={handleMarkAllRead}
          onMarkRead={handleMarkRead}
          className="bg-white min-h-screen"
        />
      </div>
    </div>
  );
}
