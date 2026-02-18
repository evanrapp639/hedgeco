"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NotificationList, Notification } from "@/components/notifications";
import { ArrowLeft, Settings } from "lucide-react";

// Mock notifications - replace with actual API data
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "FUND_UPDATE",
    title: "Alpha Global posted new returns",
    message: "January 2024 returns are now available: +2.3% MTD, bringing YTD performance to +4.7%",
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
    href: "/funds/alpha-global",
  },
  {
    id: "2",
    type: "MESSAGE",
    title: "New message from John Smith",
    message: "Thank you for your interest in our fund. I'd like to schedule a call to discuss further...",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
    href: "/messages",
  },
  {
    id: "3",
    type: "INQUIRY",
    title: "New investor inquiry received",
    message: "Sarah Johnson has requested information about Quantum Alpha Fund",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: false,
    href: "/dashboard/inquiries",
  },
  {
    id: "4",
    type: "WATCHLIST",
    title: "Watchlist alert",
    message: "Tech Growth Partners has updated their strategy description and team information",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
    href: "/dashboard/watchlist",
  },
  {
    id: "5",
    type: "CALENDAR",
    title: "Upcoming meeting reminder",
    message: "Call with Meridian Capital tomorrow at 2:00 PM EST",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    read: true,
    href: "/calendar",
  },
  {
    id: "6",
    type: "SUCCESS",
    title: "Document access granted",
    message: "You now have access to the Q4 2023 investor letter from Pinnacle Macro Fund",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    read: true,
    href: "/documents",
  },
  {
    id: "7",
    type: "FUND_UPDATE",
    title: "New fund added to platform",
    message: "Velocity Capital Partners has joined HedgeCo. Check out their profile.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    read: true,
    href: "/funds/velocity-capital-partners",
  },
  {
    id: "8",
    type: "ALERT",
    title: "Subscription renewal reminder",
    message: "Your Pro subscription will renew in 7 days. Update your payment method if needed.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    read: true,
    href: "/settings/billing",
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState(mockNotifications);
  const [isLoading, setIsLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  const handleLoadMore = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setPage((p) => p + 1);
    setIsLoading(false);
    // For demo, stop after page 2
    if (page >= 2) setHasMore(false);
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
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild className="-ml-2">
                <Link href="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <h1 className="text-lg font-semibold text-slate-900">
                Notifications
              </h1>
            </div>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/settings/notifications">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Notification List */}
      <div className="max-w-2xl mx-auto">
        <NotificationList
          notifications={notifications}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onMarkAllRead={handleMarkAllRead}
          onMarkRead={handleMarkRead}
          className="bg-white min-h-[calc(100vh-3.5rem)]"
        />
      </div>
    </div>
  );
}
